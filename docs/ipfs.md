# Phase 9: IPFS Decentralized Storage Architecture & Specification

## 1. Decentralized Storage Architecture & Pinata V3 API

The Blockchain-Based Digital Document Locker utilizes the **InterPlanetary File System (IPFS)** as its decentralized, content-addressed storage layer. Document persistence is managed via the **Pinata IPFS Files V3 API**, providing cryptographic immutability, high availability, and multi-region pinning.

### Key Architectural Invariant:
```text
Original Document Bytes
         │
         ├──→ SHA-256 Hasher ──────────────→ bytes32 Document Hash (On-Chain)
         │
         └──→ AES-256-GCM Encryptor
                   │
                   └──→ Canonical Binary Payload
                             │
                             └──→ Pinata V3 API ──→ Authentic IPFS CID (On-Chain)
```

The system strictly decouples the **immutable integrity anchor** (on-chain `documentHash`) from the **content retrieval locator** (`ipfsCid`).

---

## 2. Ciphertext-Only Persistence Guarantee

Under the core security architecture:
- **Zero Plaintext on IPFS**: Unencrypted plaintext documents are **NEVER** transmitted to IPFS gateways, pinning nodes, or API endpoints.
- **Client-Side Encryption Precedence**: Before any upload call is executed, raw document bytes are encrypted client-side using a fresh 256-bit AES-GCM key and a fresh 96-bit CSPRNG IV.
- **Payload Self-Containment**: The uploaded object is a canonical binary serialization containing `[Version | IV Length | IV | Ciphertext + 16-Byte Tag]`.
- **Public Swarm Security**: Even if an IPFS CID is discovered or crawled on the public network, unauthorized observers obtain only high-entropy AES-256-GCM ciphertext. Without the ephemeral 256-bit symmetric key, the document is mathematically unrecoverable.

---

## 3. Upload & Pinning Protocol

The upload protocol communicates directly with Pinata's Files V3 API:

1. **Endpoint**: `POST https://uploads.pinata.cloud/v3/files` (configured via `IPFS_API_URL`).
2. **Authentication**: `Authorization: Bearer <IPFS_JWT>`.
3. **Payload Structure**:
   - `file`: Binary Blob containing the Phase 8 canonical serialized payload (`application/octet-stream`).
   - `name`: Safe file identifier string (`test-record-<timestamp>.bin`).
   - `network`: `"public"`.
4. **Validation Prior to Transmission**:
   - Rejects payloads shorter than 30 bytes (the minimum size of version + IV + 16-byte tag).
   - Validates that `IPFS_JWT` is configured; fails closed immediately if credentials are missing.
5. **Response Extraction**:
   - Parses the JSON response body.
   - Extracts `data.cid`.
   - Validates CID format against standard IPFS CID patterns before returning.

---

## 4. Content Addressing & CID Structure

IPFS Content Identifiers (CIDs) are cryptographic hashes of the stored data:
- **CIDv0**: 46-character string starting with `Qm` encoded in base58btc (SHA-256 multihash).
- **CIDv1**: Modern base32 string starting with `bafy` or `bafk` (e.g. `bafkreigijdqqcp47asu5mp5ehtt72sxqguksy7dgtjfeas3hcb6o4xzojy`).
- **Validation**: Enforced via `isValidCid(cid)` regex verification.
- **Zero Mock CIDs**: The system never generates fake CIDs, demo CIDs, or placeholder strings. If Pinata returns an error, the upload fails closed and throws `IpfsUploadError`.

---

## 5. Retrieval & Gateway Protocol

Retrieval of encrypted documents is executed through IPFS gateways:

1. **Target URL**: `${gatewayUrl}/${cid}` (default: `https://gateway.pinata.cloud/ipfs/${cid}`).
2. **Request Headers**: `Accept: application/octet-stream, */*`.
3. **Timeout Guardrail**: Each gateway request utilizes an `AbortSignal.timeout(timeoutMs)` (default: 20s) to prevent hanging on unreachable or non-existent DHT nodes.
4. **Stream Processing**: The response body is streamed into an `ArrayBuffer` and converted to a `Uint8Array`.
5. **Payload Parsing**: The raw bytes are deserialized into an `EncryptedPayload` struct via Phase 8 `deserializeEncryptedPayload`.

---

## 6. Byte-for-Byte Integrity Verification

The system enforces strict byte fidelity between upload and download:
$$\text{Ciphertext}_{\text{uploaded}} \equiv \text{Ciphertext}_{\text{downloaded}}$$
- Verified through automated integration testing: every byte of the downloaded payload must match the uploaded serialized array.
- Ensures that network gateways, compression proxies, or intermediary servers do not truncate or alter the ciphertext or authentication tag.

---

## 7. Decrypt-After-Download Flow

The full download-and-verify workflow operates as follows:

```text
1. Fetch CID from IPFS Gateway
         ↓
2. Verify downloaded payload length >= 30 bytes
         ↓
3. Deserialize payload [version, iv, ciphertext+tag]
         ↓
4. AES-256-GCM Decrypt with document key
         ↓ (Fails closed with AuthenticationError if tampered)
5. Recover exact original document plaintext
         ↓
6. Compute SHA-256 hash on recovered plaintext
         ↓
7. Compare with expected on-chain documentHash (DocumentRegistry)
         ↓
8. Return { plaintext, verified: true }
```

---

## 8. Fail-Closed Error Model

The IPFS module implements strict fail-closed security error types:
- `IpfsError`: Base exception class.
- `IpfsUploadError`: Thrown on missing JWT credentials, invalid payload length, HTTP errors, or malformed provider responses.
- `IpfsDownloadError`: Thrown on network timeouts, HTTP 404/502 errors, or truncated gateway streams.
- `InvalidCidError`: Thrown when an invalid or malformed CID string is supplied.
- **Zero Fallback Storage**: The application will **NEVER** silently fall back to local disk, mock caches, or in-memory dummy objects when IPFS is unavailable.

---

## 9. Security & Trust Boundaries

1. **IPFS Network Untrusted**: All storage nodes in the IPFS network are considered untrusted. Confidentiality is enforced entirely by client-side AES-256-GCM encryption.
2. **Decoupled Key Management**: The symmetric encryption key is **NEVER** stored in IPFS or passed as metadata in Pinata upload requests.
3. **Tamper Rejection**: Any bit flipped in the downloaded ciphertext or tag causes Web Crypto's AES-GCM decryption to throw `AuthenticationError`, completely preventing corrupted payloads from being displayed or processed.

---

## 10. Credential Handling & Secret Isolation

- **Pinata JWT**: Stored strictly in `.env` (`IPFS_JWT`).
- **Zero Logging**: API keys, JWTs, and encryption keys are never logged in console outputs, error traces, or network headers visible to users.
- **Template Hygiene**: `.env.example` contains only variable keys without secrets.

---

## 11. Large File & Gateway Considerations

- **Gateway Propagation**: Newly pinned files may take 1–3 seconds to replicate across global IPFS gateway caches. The client incorporates reasonable timeouts.
- **In-Memory Limits**: Current in-memory binary payload processing supports documents up to ~100MB–500MB depending on client device memory. Future scaling will introduce chunked IPFS UnixFS streaming.

---

## 12. Explicitly Deferred Functionality

The following components are outside Phase 9 scope and deferred to subsequent phases:
- **Phase 10**: Custom Node.js / Express REST API endpoints (`POST /api/ipfs/upload`, `GET /api/ipfs/:cid`) wrapping this IPFS service.
- **Phase 11**: Frontend drag-and-drop document upload and CID display interfaces.
- **Phase 12**: Complete end-to-end integration combining Phase 8 crypto, Phase 9 IPFS, and Phase 5 `DocumentRegistry.sol` on-chain transactions.
