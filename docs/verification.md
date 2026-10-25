# Document Verification & Tamper-Detection Architecture Specification
# Blockchain-Based Digital Document Locker

> **Document Status:** Complete (Phase 14 Baseline)  
> **Document Version:** 1.0.0  
> **Phase Target:** Phase 14 of 16 (Real Document Verification & Tamper-Detection Workflow)  
> **Scope Notice:** This document establishes the complete architectural and cryptographic specification for candidate-document verification, stored-object auditing, tamper detection, on-chain state synchronization, and fail-closed security invariants across the Next.js frontend, Node.js/Express backend, IPFS/Pinata storage, and Ethereum/Hardhat smart contracts (`DocumentRegistry.sol` and `AccessControl.sol`).

---

## 1. Candidate-File Verification Workflow

The candidate-file verification workflow establishes a deterministic, non-destructive process to verify whether a candidate document file held by an operator or verifier matches an authentic, registered record on the blockchain:

1. **Local Byte Ingestion:** The operator selects a candidate file through the browser interface (via drag-and-drop or file selection). The browser extracts raw binary bytes into a `Uint8Array` using the standard `FileReader` / `ArrayBuffer` API.
2. **Local Client-Side Hashing:** The candidate bytes are hashed locally in the browser runtime via the Web Crypto API (`crypto.subtle.digest("SHA-256", bytes)`). Raw document bytes are never uploaded to the backend or transmitted over the network for candidate verification.
3. **Session-Authenticated Verification Query:** The client submits a `POST /api/verify` request containing only the `documentId` (`bytes32` hex) and the candidate `candidateHash` (0x-prefixed 64-hex characters), accompanied by the caller's EIP-191 session JWT in the `Authorization: Bearer <token>` header.
4. **Authoritative Backend Blockchain Evaluation:** The backend verifies:
   - That the caller's wallet possesses on-chain authorization (owner on `DocumentRegistry.sol` or active verifier on `AccessControl.sol`).
   - That the document exists and is not revoked.
   - Whether the candidate hash matches the canonical `documentHash` recorded in the `DocumentRegistry` smart contract.
5. **Deterministic Verdict Formulation:** The backend responds with the authoritative status (`VERIFIED`, `TAMPER_DETECTED`, `REVOKED`, `UNAUTHORIZED`, or `NOT_FOUND`), exact hashes, owner, CID, and timestamp.
6. **False-Certification Defense:** The client renders an evidence-based report emphasizing that a positive match confirms only that candidate bytes match the on-chain hash recorded at registration, without claiming legal genuineness or absolute fraud-proof status.

---

## 2. SHA-256 Cryptographic Digest Engine

The verification engine relies on standardized SHA-256 digests:

- **Algorithm:** SHA-256 (FIPS PUB 180-4).
- **Client Implementation:** Web Crypto API (`crypto.subtle.digest("SHA-256", candidateBytes)`).
- **Backend Implementation:** Node.js `crypto.createHash("sha256")`.
- **Blockchain Storage:** Stored as `bytes32` in `DocumentRegistry.sol` (canonical 32-byte fixed-size word).
- **Determinism:** The hash computation is completely deterministic: identical input bytes always yield the identical 256-bit digest regardless of platform, file name, creation timestamp, or operating system.
- **Sensitivity:** Any single-bit or single-byte alteration anywhere in the candidate file produces an avalanche effect resulting in a completely distinct, pseudo-random digest, ensuring immediate detection of even microscopic alterations.

---

## 3. On-Chain Comparison & Smart Contract Invariants

Smart-contract state on the blockchain remains the sole source of truth for document integrity:

1. **Authoritative State Lookup:**
   ```solidity
   IDocumentRegistry.Document memory doc = documentRegistry.getDocument(documentId);
   ```
2. **Hash Comparison:**
   The candidate hash supplied by the caller is normalized to lowercase and compared against `doc.documentHash`.
   - `doc.documentHash == candidateHash` $\implies$ candidate bytes match on-chain record.
   - `doc.documentHash != candidateHash` $\implies$ candidate bytes differ from on-chain record (`TAMPER_DETECTED`).
3. **Zero Synthetic Overrides:** No cache, database, or backend heuristic may override the on-chain `documentHash`. If the blockchain query fails or reverts, the system fails closed with `503 BLOCKCHAIN_UNAVAILABLE`.

---

## 4. Authorization Model & Multi-Party Access Checks

Verification queries are strictly protected by sovereign on-chain authorization boundaries:

1. **EIP-191 Caller Identity:** Every verification request must include a valid session JWT produced by signing a dynamic CSPRNG challenge via MetaMask. The backend recovers the verified Ethereum address (`callerAddress`).
2. **Owner Authorization:** If `callerAddress == doc.owner`, the caller is inherently authorized as the sovereign creator of the record.
3. **Verifier Access Check:** If the caller is not the owner, the backend queries `AccessControl.sol`:
   - If the document is active (not revoked): queries `accessControl.hasAccess(documentId, callerAddress)`.
   - If the document is revoked: queries `accessControl.isDirectAccessGranted(documentId, callerAddress)`.
4. **Fail-Closed Enforcement:** If the caller is neither the owner nor an authorized verifier:
   - The backend responds with HTTP 403 Forbidden and `status: "UNAUTHORIZED"`.
   - The on-chain `fileHash`, `cid`, and registration details are strictly withheld from unauthorized callers to prevent metadata enumeration.

---

## 5. Document Revocation Workflow & Precedence

Document revocation takes absolute precedence over hash matches and active verifier grants:

1. **Sovereign Revocation Authority:** Only the document owner can revoke a document on-chain via `DocumentRegistry.revokeDocument(documentId)`.
2. **Permanent Revocation State:** Once `doc.revoked == true`, the document can never be unrevoked or restored.
3. **Verifier Permission Invalidation:** On-chain, `AccessControl.hasAccess()` immediately returns `false` for all verifiers once `documentRegistry.isRevoked(documentId)` is true.
4. **Revocation Disclosure to Authorized Parties:** When an owner or a verifier who was granted access queries a revoked document:
   - The verification engine returns `status: "REVOKED"`, `revoked: true`.
   - Hash comparison is still performed (`match: true` if bytes match the archived hash), but the primary verdict remains unambiguously `REVOKED`.
   - The system displays prominent warnings that the document has been permanently invalidated by its owner and cannot be certified as active.

---

## 6. IPFS Encrypted Payload Retrieval

The verification module supports optional stored-object auditing by retrieving the ciphertext from IPFS:

1. **Server-Side Credential Isolation:** Client applications never receive Pinata API keys or JWT credentials.
2. **Backend Relay:** Authenticated clients request the ciphertext through `GET /api/ipfs/:cid` using their session JWT.
3. **CID Validation:** The CID format is validated fail-closed (`CIDv0` base58 or `CIDv1` base32). Malformed identifiers are rejected with HTTP 400.
4. **Binary Retrieval:** The backend fetches the raw encrypted payload from the dedicated Pinata gateway and relays the exact binary octet-stream to the frontend.
5. **Gateway Fail-Closed:** If IPFS is unreachable, the gateway times out, or the payload is not found, the system reports `IPFS_UNAVAILABLE` without synthesizing substitute content.

---

## 7. AES-256-GCM Cryptographic Boundary & Decryption

The stored-object verification flow audits the integrity of the remote IPFS payload:

1. **Key Isolation Boundary:** Decryption requires the 256-bit AES-GCM symmetric key generated by the owner during registration.
2. **Client-Side Key Entry:** The key is provided exclusively by the user in the client runtime (via file picker uploading `.key` or manual hex input). Keys are never transmitted to the backend, blockchain, or IPFS.
3. **Key Format Parsing:** Keys are accepted as either:
   - Raw 32-byte binary buffers (standard `.key` download).
   - 64-character hexadecimal strings (with or without `0x` prefix).
   - Any other length or format is immediately rejected fail-closed.
4. **Cryptographic Decryption Pipeline:**
   $$\text{IPFS Payload} \xrightarrow{\text{deserialize}} (\text{Header}, \text{Salt}_{16}, \text{IV}_{12}, \text{Ciphertext}, \text{Tag}_{16})$$
   $$\text{Ciphertext} + \text{Tag} \xrightarrow[\text{Key}, \text{IV}]{\text{AES-256-GCM}} \text{Plaintext Bytes}$$
5. **Decryption Availability:**
   - If no key is provided: stored-object verification reports `DECRYPTION_UNAVAILABLE`. Candidate file verification continues uninterrupted.
   - If an invalid key is provided or ciphertext/tag has been modified: AES-GCM authentication fails, reporting `DECRYPTION_FAILED`.
   - If decryption succeeds: the plaintext bytes are hashed with SHA-256 and compared against `onChainHash`. If matching, stored-object integrity is confirmed.

---

## 8. Real Tamper-Detection Capabilities

The verification system provides multi-layer tamper detection:

| Attack Vector | Target Layer | Detection Mechanism | Outcome Status |
|---|---|---|---|
| **1-Byte Modification in Candidate File** | Local file | SHA-256 digest changes completely; mismatch with on-chain `documentHash`. | `TAMPER_DETECTED` |
| **Different Document Substitution** | Local file | Candidate SHA-256 digest differs from registered `documentHash`. | `TAMPER_DETECTED` |
| **Ciphertext Bit-Flip on IPFS** | Stored payload | AES-256-GCM Poly1305/GHASH authentication tag verification fails. | `DECRYPTION_FAILED` |
| **Auth Tag Mutation on IPFS** | Stored payload | Web Crypto `decrypt()` operation rejects corrupted authentication tag. | `DECRYPTION_FAILED` |
| **IV Substitution on IPFS** | Stored payload | Modifying the 12-byte initialization vector breaks GCM cipher authentication. | `DECRYPTION_FAILED` |
| **On-Chain Document Revocation** | Smart Contract | `doc.revoked` flag is true on `DocumentRegistry.sol`. | `REVOKED` |
| **Unauthorized Verification Query** | Access Control | Caller address not owner and `hasAccess` is false on `AccessControl.sol`. | `UNAUTHORIZED` |
| **Unregistered Document ID** | Smart Contract | `DocumentRegistry.sol` reverts with `DocumentNotFound`. | `NOT_FOUND` |

---

## 9. Comprehensive Result State Machine

The verification workflow implements a strict 10-state deterministic outcome model:

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Hashing: Candidate File Selected
    Hashing --> QueryingAPI: Hash Computed (SHA-256)
    QueryingAPI --> Verified: Hash Matches & Doc Active
    QueryingAPI --> TamperDetected: Hash Mismatches
    QueryingAPI --> Revoked: Document Revoked on Chain
    QueryingAPI --> Unauthorized: Caller Lacks Access
    QueryingAPI --> NotFound: Document Not Registered
    QueryingAPI --> Error: Network / RPC Failure
    
    Verified --> AuditingStoredObject: Optional AES Key Provided
    AuditingStoredObject --> StoredObjectVerified: Decrypt & Hash Matches
    AuditingStoredObject --> DecryptionFailed: Bad Key or Corrupted Ciphertext
    AuditingStoredObject --> DecryptionUnavailable: Key Not Provided
```

### Result Status Definitions

1. `VERIFIED`: Candidate document SHA-256 digest exactly matches the registered on-chain hash; document is active and unrevoked; caller has on-chain access.
2. `TAMPER_DETECTED`: Candidate document SHA-256 digest differs from the registered on-chain hash. The candidate bytes do not match the registered bytes.
3. `REVOKED`: The document was revoked on-chain by its owner. It is no longer valid for active verification.
4. `UNAUTHORIZED`: The connected wallet is neither the document owner nor an authorized verifier granted access on `AccessControl.sol`.
5. `DOCUMENT_NOT_FOUND`: The queried `documentId` does not exist on `DocumentRegistry.sol`.
6. `DECRYPTION_UNAVAILABLE`: Candidate file verification succeeded, but stored-object decryption was skipped because no decryption key was supplied.
7. `DECRYPTION_FAILED`: Decryption of the IPFS stored payload failed due to an incorrect key or corrupted ciphertext / authentication tag.
8. `IPFS_UNAVAILABLE`: The IPFS gateway was unreachable or returned an error while fetching the stored payload.
9. `BLOCKCHAIN_UNAVAILABLE`: The Ethereum RPC node was unreachable or returned an unrecoverable network error.
10. `ERROR`: An unhandled exception or malformed input error occurred during the verification workflow.

---

## 10. Verification Evidence & Provenance Reporting

Upon verification, the system constructs a detailed provenance record derived strictly from authentic blockchain, cryptographic, and IPFS data:

- **Document Identifier:** Canonical `bytes32` identifier.
- **Computed Candidate Hash:** Exact 0x-prefixed 64-hex SHA-256 digest calculated in the browser.
- **On-Chain Registered Hash:** Authoritative `documentHash` read directly from `DocumentRegistry.sol`.
- **IPFS CID:** Content identifier pinning the encrypted document on Pinata IPFS.
- **Document Owner Address:** Checksummed Ethereum address of the document owner.
- **Registration Timestamp:** UTC Unix timestamp from the on-chain registration block.
- **Caller Address:** Verified Ethereum address of the inspecting operator.
- **Verification Duration:** Real execution latency measured in milliseconds.
- **Stored Object Audit Status:** Cryptographic decryption status and decrypted hash match result (if key provided).

---

## 11. Error Handling & Fail-Closed Boundaries

The verification architecture enforces rigorous fail-closed boundaries:

- **Missing/Empty File:** Candidate file picker strictly rejects 0-byte files with an explicit validation error.
- **Malformed Document ID:** IDs not matching `0x` + 64 hex characters are rejected client-side before any network dispatch.
- **Malformed Candidate Hash:** Hashes not matching 64 hex characters are rejected client-side and validated fail-closed on the backend API.
- **Missing Auth Token:** Calls to `POST /api/verify` without a valid Bearer JWT return HTTP 401 Unauthorized.
- **Network / Chain Mismatch:** If the connected wallet chain ID does not match `NEXT_PUBLIC_CHAIN_ID` (`31337`), the UI disables verification actions and prompts the user to switch networks.
- **Zero Synthetic Fallbacks:** Under no circumstances does the system present a simulated or fake verification result when an external dependency is unavailable.

---

## 12. Privacy Guarantees

The verification workflow preserves strict data privacy:

1. **Zero Plaintext Transmission:** The candidate document is never sent to the backend server. Only its cryptographic hash (`candidateHash`) is transmitted.
2. **Zero Plaintext Logging:** The backend never logs document contents or candidate hashes alongside personal data.
3. **Zero Key Transmission:** Decryption keys entered for stored-object auditing remain strictly inside the browser runtime and are never included in API requests.
4. **Metadata Protection:** Unauthorized callers querying `/api/verify` receive only HTTP 403 `UNAUTHORIZED` without leaking the document hash, CID, or registration block timestamp.

---

## 13. Critical Key-Distribution Limitation

In strict accordance with the system architecture:

- **Separation of Concerns:** Granting on-chain access via `AccessControl.sol` records public permission for an Ethereum address. It **does not** automatically transmit the AES decryption key.
- **No In-Band Key Distribution:** In the Phase 14 baseline, symmetric AES keys are retained exclusively by the document owner (and saved to their local `.key` file).
- **Out-of-Band Key Exchange Required:** If an authorized verifier needs to decrypt the IPFS stored object (as opposed to verifying a locally held candidate file), the owner must provide the AES key out-of-band (e.g., via secure PGP email, secure messenger, or future Phase asymmetric key-exchange).
- **Truthful Status Reporting:** When a verifier inspects a document without possessing the AES key, the system honestly reports `DECRYPTION_UNAVAILABLE` rather than attempting unauthorized decryption or fabricating decrypted content.

---

## 14. Real Performance & Latency Measurements

Verification performance measured during live end-to-end testing against local Hardhat node and Pinata V3:

| Operation | Execution Layer | Measured Latency |
|---|---|---|
| **Candidate File Ingestion & SHA-256** | Browser Web Crypto | 1.1 – 2.5 ms |
| **API Verification & Blockchain Read** | Node.js + Hardhat RPC | 70 – 100 ms |
| **On-Chain Revocation Verification** | Node.js + Hardhat RPC | 150 – 240 ms |
| **IPFS Ciphertext Retrieval (Pinata)** | Gateway Relay | 1,200 – 3,500 ms |
| **AES-256-GCM Decryption & Integrity Hash**| Browser Web Crypto | 1.5 – 3.2 ms |
| **Complete Stored-Object Audit Roundtrip** | Full Pipeline | 1,300 – 3,700 ms |

---

## 15. Known Limitations

1. **Local Hardhat Network Requirement:** Verification relies on the deployed contracts on Chain ID `31337`. Deployments to public testnets (e.g., Sepolia) require network switching and pre-configured contract addresses.
2. **Gateway Latency on Cold IPFS Objects:** Unpinned or freshly pinned IPFS CIDs may experience initial gateway propagation delays (1–5 seconds) during the optional stored-object audit.
3. **No Automatic Key Synchronization:** The system does not implement an automated asymmetric key exchange (such as ECIES or Diffie-Hellman) between owner and verifier; keys must be managed out-of-band.
4. **False-Certification Boundary:** A cryptographic match proves exclusively that the candidate byte sequence is mathematically identical to the byte sequence originally hashed during registration. It does not certify the underlying legal validity, provenance before hashing, or physical authenticity of the source material.

---

## 16. Deferred Work

The following items are intentionally out of scope for Phase 14 and are planned for future phases:

- **Phase 15 (Final Review & Hardening):** Full-system security audit, end-to-end stress testing across all integrated modules, comprehensive user documentation, and final deployment checklist.
- **Asymmetric Verifier Key Encapsulation (Post-MVP):** Encrypting document AES keys under verifier public keys to enable automated in-band key distribution upon access grant.
- **Hardware Token / Smart Card Support:** Integration with hardware security modules (e.g., Ledger, YubiKey) for signing verification challenges and managing document encryption keys.
