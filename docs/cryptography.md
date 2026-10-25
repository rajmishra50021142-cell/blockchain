# Phase 8: Cryptographic Architecture & Specification

## 1. Cryptographic Goals

The primary cryptographic goals of the Blockchain-Based Digital Document Locker are:
1. **Uncompromised Document Integrity**: Ensure that any alteration, bit rot, truncation, or malicious manipulation of a stored document is immediately detectable both off-chain and against the immutable blockchain registry.
2. **Confidentiality via Authenticated Encryption**: Ensure that document contents are encrypted client-side prior to storage or IPFS pinning, such that neither storage nodes, network intermediaries, nor unauthorized parties can read the document.
3. **Fail-Closed Authentication**: Ensure that encrypted payloads cannot be decrypted or presented as authentic if the ciphertext, initialization vector (IV), authentication tag, or key has been tampered with or corrupted.
4. **Deterministic Document Fingerprinting**: Provide a reproducible cryptographic digest derived strictly from original document bytes to bind document identity to smart contract state (`DocumentRegistry.sol`).
5. **Strict Key Isolation & Ephemeral Handling**: Keep raw cryptographic keys completely segregated from public ledgers, storage layers (IPFS), client storage (`localStorage`, `sessionStorage`), URLs, logs, and telemetry.

---

## 2. SHA-256 Use & Integrity Proof

- **Primitive**: NIST Secure Hash Algorithm 256-bit (`SHA-256`, FIPS 180-4).
- **Execution Environment**: Client-side Web Crypto API (`crypto.subtle.digest("SHA-256", rawBytes)`).
- **Integrity Proof**: The SHA-256 digest acts as the authoritative cryptographic anchor of the document. When registered on-chain via `DocumentRegistry.registerDocument(documentId, documentHash, ipfsCid)`, the `documentHash` serves as the tamper-evident benchmark against which decrypted documents are verified.
- **Strict Byte Sensitivity**: The digest exhibits full avalanche sensitivity: changing even a single byte in a multi-megabyte document alters approximately 50% of the bits in the resulting digest.
- **Independence & Reproducibility**: No salt, timestamp, or dynamic metadata is added to the document digest calculation, ensuring that any party with the exact plaintext file can independently reproduce the identical hash.

---

## 3. AES-256-GCM Authenticated Confidentiality

- **Primitive**: Advanced Encryption Standard in Galois/Counter Mode (`AES-256-GCM`, NIST SP 800-38D).
- **Key Length**: 256 bits (32 bytes).
- **Authentication Tag**: 128 bits (16 bytes), generated automatically by the GCM GHASH authenticator and verified during decryption.
- **Advantages over Unauthenticated Modes (CBC, ECB)**:
  - Confidentiality and integrity are combined in a single cryptographic operation.
  - Complete resistance against padding-oracle attacks, bit-flipping attacks, and chosen-ciphertext attacks (IND-CCA2 secure).
  - Built-in tamper detection: any single bit modified in ciphertext, IV, or key causes immediate failure without outputting partial plaintext.

---

## 4. Key Generation

- **Randomness Source**: Cryptographically Secure Pseudorandom Number Generator (CSPRNG) via the Web Crypto API:
  ```typescript
  await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable for envelope wrapping
    ["encrypt", "decrypt"]
  );
  ```
- **Guarantees**:
  - Generated keys are 256 bits of cryptographic entropy.
  - Keys are generated independently per document.
  - Keys are never derived from predictable application values (passwords, wallet addresses, document IDs, timestamps, or `Math.random()`).

---

## 5. IV / Nonce Generation

- **IV Length**: 96 bits (12 bytes), the NIST SP 800-38D recommended standard for AES-GCM to prevent GHASH polynomial degradation.
- **Generation Method**:
  ```typescript
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  ```
- **Freshness Invariant**: A unique, fresh 96-bit IV is generated for every single encryption operation. Reusing an IV with the same key is strictly prevented.

---

## 6. Canonical Binary Payload Serialization Format

To prepare encrypted documents for canonical IPFS persistence in Phase 9, a binary serialization layout is established:

```
+---------------+----------------+-------------------+------------------------------------+
| Version (1B)  | IV Length (1B) | IV Bytes (N bytes)| Ciphertext + Tag (16B) (M bytes)   |
+---------------+----------------+-------------------+------------------------------------+
| 0x01          | 0x0C (12)      | 12 bytes          | M bytes (payload + 16-byte tag)    |
+---------------+----------------+-------------------+------------------------------------+
```

### Layout Breakdown:
1. **Version** (`Uint8`, 1 byte): Format version indicator (`0x01`). Allows forward-compatible protocol migrations.
2. **IV Length** (`Uint8`, 1 byte): Number of bytes in the IV (`0x0C` = 12 bytes for 96-bit GCM).
3. **IV Bytes** (`Uint8Array`, 12 bytes): The cryptographic initialization vector.
4. **Ciphertext + Authentication Tag** (`Uint8Array`, remainder): AES-GCM ciphertext concatenated with the 16-byte authentication tag produced by the Web Crypto API.

Deserialization strictly verifies the version byte and ensures minimum payload length (`1 + 1 + 12 + 16 = 30 bytes`). Truncated or malformed payloads immediately throw an error.

---

## 7. Document Hash Representation & DocumentRegistry Compatibility

To bridge client-side TypeScript cryptography with EVM Solidity contracts (`DocumentRegistry.sol`):

1. **Raw Internal Digest**: 32 raw bytes (`Uint8Array(32)`).
2. **Human-Readable Hex**: 64 lowercase hexadecimal characters (e.g. `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
3. **Canonical EVM `bytes32`**: `0x`-prefixed 66-character lowercase hex string:
   ```typescript
   bytes32: `0x${hexString}`
   ```
This matches the exact parameter type expected by `IDocumentRegistry.sol`:
```solidity
function registerDocument(
    bytes32 documentId,
    bytes32 documentHash,
    string calldata ipfsCid
) external;
```

---

## 8. Encryption & Decryption Pipeline

### Encryption Flow:
1. User selects or inputs document raw bytes (`Uint8Array` or `ArrayBuffer`).
2. Compute document SHA-256 hash directly on plaintext bytes.
3. Generate fresh 256-bit AES-GCM key (or use provided key).
4. Generate fresh 96-bit CSPRNG IV.
5. Encrypt plaintext via `crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, data)`.
6. Pack into canonical binary payload (`version | ivLength | iv | ciphertext+tag`).
7. Return payload structure, serialized bytes, raw key, and key hex.

### Decryption Flow:
1. Input serialized binary payload (or `EncryptedPayload` object) and imported `CryptoKey` (or 32-byte key material).
2. Validate payload structure: check version (`0x01`), verify minimum length, extract IV and ciphertext+tag.
3. Execute `crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, ciphertextAndTag)`.
4. Return exact plaintext bytes (`Uint8Array`).

---

## 9. Tamper Detection & Authentication Tag Verification

AES-GCM authenticated encryption guarantees:
- **Ciphertext Tampering**: Modifying even 1 bit of ciphertext causes GHASH tag mismatch; decryption fails closed.
- **Tag Tampering**: Modifying the 16-byte authentication tag causes tag verification failure; decryption fails closed.
- **IV Tampering**: Altering the IV leads to invalid decryption stream and authentication tag mismatch.
- **Wrong Key**: Decrypting with any key other than the original 256-bit key fails closed.
- **Error Model**: Failed authentications throw an explicit `AuthenticationError("Decryption failed: authenticated payload has been tampered with, corrupted, or an incorrect key was provided.")`. No partial plaintext is ever returned.

---

## 10. Key Lifecycle

1. **Creation**: Key generated ephemerally in browser/client memory using CSPRNG.
2. **Usage**: Key encrypts the specific document once.
3. **Handoff**: Key is held in transient memory only for the duration of the upload/registration session.
4. **Disposal**: Key references are dereferenced for JavaScript garbage collection.
5. **Future Distribution Boundary**: In future phases (Phase 11/12), owner keys will be wrapped using asymmetric public key cryptography (e.g., ECIES or RSA-OAEP) for authorized recipients.

---

## 11. Key Storage Policy

The raw AES-256-GCM key material must **NEVER** be:
- Stored in browser `localStorage` or `sessionStorage`.
- Stored in IndexedDB unencrypted.
- Embedded in URLs, query strings, or hash fragments.
- Sent to smart contracts (`DocumentRegistry.sol` or `AccessControl.sol`).
- Embedded in serialized IPFS payload files.
- Logged to browser console or telemetry endpoints.
- Placed in `.env` files or hardcoded in source code.

---

## 12. Plaintext Handling & Memory Minimization

- Plaintext documents exist transiently in application memory only during the explicit hashing and encryption/decryption execution.
- Once encrypted, plaintext buffers are released for garbage collection.
- **Honest Limitation**: In JavaScript runtime environments, explicit memory wiping/zeroization of garbage-collected strings or TypedArrays cannot be mathematically guaranteed due to VM optimizations and garbage collector implementations. The system minimizes variable scope and eliminates persistent references.

---

## 13. Logging Policy

Zero cryptographic secret exposure:
- Prohibited: Logging raw keys, private keys, plaintext documents, or full payloads.
- Permitted: Logging non-sensitive operational events (e.g., `"Document hash computed: [bytes32]"`, `"AES-GCM encryption completed (payload size: N bytes)"`).

---

## 14. Browser & Platform Primitives

- The library uses standard, native **Web Crypto API** (`globalThis.crypto.subtle` and `globalThis.crypto.getRandomValues`).
- Natively available in modern browsers (Chrome, Firefox, Safari, Edge) and Node.js 18+ runtime environments.
- Zero external cryptographic npm dependencies (no custom, unvetted math or polyfills).

---

## 15. Binary Conversion Rules

- All hashing and encryption primitives strictly consume and produce binary byte buffers (`Uint8Array` and `ArrayBuffer`).
- Plaintext is never converted through arbitrary UTF-8, base64, or string encodings prior to hashing or encryption.
- Exact byte fidelity is preserved across all file types (e.g. PDF, PNG, DOCX, ZIP, binary blobs with null bytes `0x00`).

---

## 16. Large-File Considerations & Limitations

- The current Phase 8 implementation processes documents in memory as whole byte buffers (`ArrayBuffer`/`Uint8Array`).
- **Limitation**: Browser memory constraints typically limit in-memory processing to files under ~100MB-500MB depending on client device RAM.
- **Future Architecture**: Files exceeding these thresholds will require chunked/streaming authenticated encryption (e.g. streaming AEAD or chunked Merkle tree hashing) in future production releases.

---

## 17. Future Key-Distribution Boundary

- Phase 8 deliberately isolates symmetric encryption from multi-user key management.
- Granting access on the smart contract (`AccessControl.grantAccess(documentId, recipient)`) controls on-chain authorization, but does **not** distribute the symmetric decryption key.
- Key distribution requires envelope encryption: the owner encrypts the document key with the recipient's public key and shares the wrapped key off-chain or via a secure key-exchange protocol.

---

## 18. Explicitly Deferred Functionality

The following items are outside Phase 8 scope and deferred to subsequent phases:
- **Phase 9**: IPFS client, node connection, CID computation, pinning, and payload upload/download.
- **Phase 10**: Backend document verification REST APIs and metadata storage.
- **Phase 11**: Upload and verification user interfaces.
- **Phase 12**: Multi-user sharing UI and asymmetric envelope key distribution.
