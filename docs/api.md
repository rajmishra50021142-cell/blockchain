# API Architecture Specification
# Blockchain-Based Digital Document Locker

> **Document Status:** Active & Implemented (Phase 10 Node.js/Express REST API Implementation Verified)  
> **Document Version:** 2.0.0  
> **Phase Target:** Phase 10 of 16 (Node.js / Express Backend API Layer)  
> **Scope Notice:** This document defines the active REST API gateway running in `backend/`. All 8 core endpoints, health probes, authentication middlewares, rate limiters, error boundaries, and integration tests have been implemented and verified against the local blockchain network and live Pinata IPFS integration.

---

# 1. API Architecture

The custom application backend exposes a lightweight, stateless RESTful HTTP API layer that coordinates off-chain services, manages cryptographic challenge generation, acts as a secure relay to the IPFS daemon, and provides query filters over blockchain events.

```text
/api
├── /auth
│   ├── POST /challenge       # Cryptographic challenge nonce generation
│   └── POST /verify          # EIP-191 signature validation & session issuance
├── /ipfs
│   ├── POST /upload          # Ciphertext pinning to IPFS cluster
│   └── GET  /:cid            # Ciphertext retrieval from IPFS
├── /documents
│   ├── GET  /                # Document inventory query for authenticated address
│   └── GET  /:id             # Single document metadata & permission query
├── /verify
│   └── POST /                # Independent hash equivalence verification query
└── /audit
    └── GET  /:documentId     # Historical event lineage query for document
```

### Architectural Role
- **Auxiliary Relay:** The API acts as a secure orchestrator between the browser, IPFS, and the Ethereum node.
- **Non-Custodial:** The API holds **zero** private keys and **never** signs or broadcasts state-changing blockchain transactions.
- **Fail-Closed:** The API rejects any attempt to fabricate mock or fallback data when an external service is unavailable.

---

# 2. API Design Principles

1. **Strict Real Data & Non-Synthetic Rule (`ai_rules.md`):**
   The API will never return synthetic CIDs, mock document records, fake transaction hashes, or simulated blockchain confirmations. If a service is offline, the API returns an explicit HTTP 502/503 error.
2. **Stateless Authentication:**
   Authentication relies on EIP-191 cryptographic message signatures (`personal_sign`). Successful authentication yields an HMAC-SHA256 signed JSON Web Token (JWT) encapsulating the verified Ethereum address.
3. **Data Privacy (Zero-Knowledge Transport):**
   The API never accepts or processes raw, unencrypted document content. All payloads arriving at `/api/ipfs/upload` must already be encrypted client-side using AES-256-GCM.
4. **Authoritative Blockchain Truth:**
   The API never caches or fabricates ownership, permissions, or revocation states. All queries against `/api/documents` and `/api/verify` query the Ethereum smart contracts in real time.

---

# 3. Authentication APIs

### 3.1 `POST /api/auth/challenge`
- **Method:** `POST`
- **Path:** `/api/auth/challenge`
- **Purpose:** Generates a cryptographically random, timestamped, single-use challenge nonce for the specified Ethereum wallet address to initiate EIP-191 challenge-response authentication.
- **Caller:** Next.js Frontend (`WalletConnect` component).
- **Request Data:**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "address": "<wallet_address>"
  }
  ```
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "challenge": "<cryptographic_nonce_challenge_string>",
    "expiresAt": "<expiration_timestamp>"
  }
  ```
- **Source of Data:** Server-side cryptographically secure pseudo-random number generator (CSPRNG) stored in ephemeral cache with 5-minute TTL.
- **Possible Errors:**
  - `400 Bad Request`: Invalid or missing Ethereum address.
  - `429 Too Many Requests`: Rate limit exceeded for IP/address.
- **Blockchain Read:** No.
- **Blockchain Write:** No.
- **IPFS Interaction:** No.

---

### 3.2 `POST /api/auth/verify`
- **Method:** `POST`
- **Path:** `/api/auth/verify`
- **Purpose:** Validates the ECDSA signature over the issued challenge using `ethers.verifyMessage`. If valid, issues an authenticated session JWT.
- **Caller:** Next.js Frontend (`WalletConnect` component).
- **Request Data:**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "address": "<wallet_address>",
    "signature": "<ecdsa_signature_hex>"
  }
  ```
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "token": "<jwt_session_token>",
    "address": "<wallet_address>",
    "did": "<did_uri_string>"
  }
  ```
- **Source of Data:** Signature verification via `ethers.verifyMessage` matching the recovered address to the active challenge.
- **Possible Errors:**
  - `400 Bad Request`: Missing address or signature.
  - `401 Unauthorized`: Challenge expired, nonce not found, or signature invalid.
- **Blockchain Read:** Optional check against `IdentityRegistry.sol` for registered DID metadata.
- **Blockchain Write:** No.
- **IPFS Interaction:** No.

---

# 4. IPFS APIs

### 4.1 `POST /api/ipfs/upload`
- **Method:** `POST`
- **Path:** `/api/ipfs/upload`
- **Purpose:** Relays a client-encrypted document payload (AES-256-GCM ciphertext + IV + auth tag) to the configured IPFS daemon / pinning gateway and captures the genuine Content Identifier (CID).
- **Caller:** Next.js Frontend (`UploadDocument` component).
- **Headers:** `Authorization: Bearer <JWT>`, `Content-Type: multipart/form-data`.
- **Request Data:**
  - `file`: Binary ciphertext blob.
  - `fileName`: Original file name string.
  - `fileSize`: Original size in bytes.
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "cid": "<authentic_ipfs_cid>",
    "size": "<byte_size_integer>",
    "pinnedAt": "<timestamp_integer>"
  }
  ```
- **Source of Data:** Live IPFS daemon HTTP response (`/api/v0/add`).
- **Possible Errors:**
  - `401 Unauthorized`: Missing or invalid session JWT.
  - `400 Bad Request`: Payload missing or unencrypted.
  - `502 Bad Gateway`: IPFS daemon unreachable or upload rejected.
- **Blockchain Read:** No.
- **Blockchain Write:** No.
- **IPFS Interaction:** **Yes (Pinning upload)**.

---

### 4.2 `GET /api/ipfs/:cid`
- **Method:** `GET`
- **Path:** `/api/ipfs/:cid`
- **Purpose:** Streams the raw encrypted ciphertext payload associated with a specific IPFS CID.
- **Caller:** Next.js Frontend (`VerifyDocument` / Download components).
- **Headers:** `Authorization: Bearer <JWT>`.
- **Parameters:** `cid` (string): Valid IPFS Content Identifier.
- **Response Data (HTTP 200):** Binary stream of encrypted document payload.
- **Source of Data:** Live IPFS daemon response (`/api/v0/cat?arg=<cid>`).
- **Possible Errors:**
  - `401 Unauthorized`: Session not authenticated.
  - `404 Not Found`: CID not found on IPFS network.
  - `502 Bad Gateway`: IPFS gateway timeout or connection failure.
- **Blockchain Read:** No.
- **Blockchain Write:** No.
- **IPFS Interaction:** **Yes (Content retrieval)**.

---

# 5. Document APIs

### 5.1 `GET /api/documents`
- **Method:** `GET`
- **Path:** `/api/documents`
- **Purpose:** Queries the Ethereum blockchain for all document IDs owned by or shared with the authenticated wallet address, returning an aggregated inventory.
- **Caller:** Next.js Frontend (`Dashboard` component).
- **Headers:** `Authorization: Bearer <JWT>`.
- **Request Data:** None (Uses wallet address from authenticated JWT).
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "documents": [
      {
        "id": "<document_id_bytes32>",
        "owner": "<owner_wallet_address>",
        "cid": "<ipfs_cid>",
        "fileHash": "<file_sha256_hash>",
        "createdAt": "<block_timestamp>",
        "revoked": false,
        "isOwner": true
      }
    ]
  }
  ```
- **Empty State (HTTP 200):**
  ```json
  {
    "documents": []
  }
  ```
  *(Frontend renders: "No documents registered yet.")*
- **Source of Data:** On-chain calls to `DocumentRegistry.sol` (`getUserDocuments`, `getDocument`).
- **Possible Errors:**
  - `401 Unauthorized`: Invalid JWT.
  - `503 Service Unavailable`: Ethereum RPC provider unreachable.
- **Blockchain Read:** **Yes**.
- **Blockchain Write:** No.
- **IPFS Interaction:** No.

---

### 5.2 `GET /api/documents/:id`
- **Method:** `GET`
- **Path:** `/api/documents/:id`
- **Purpose:** Retrieves on-chain metadata, revocation status, and verifier access permissions for a specific document ID.
- **Caller:** Next.js Frontend (`DocumentDetails` component).
- **Headers:** `Authorization: Bearer <JWT>`.
- **Parameters:** `id` (bytes32 hex string): Document identifier.
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "id": "<document_id_bytes32>",
    "owner": "<owner_wallet_address>",
    "cid": "<ipfs_cid>",
    "fileHash": "<file_sha256_hash>",
    "createdAt": "<block_timestamp>",
    "revoked": false,
    "hasAccess": true
  }
  ```
- **Source of Data:** `DocumentRegistry.getDocument(id)` and `AccessControl.hasAccess(id, caller)`.
- **Possible Errors:**
  - `401 Unauthorized`: Invalid session.
  - `404 Not Found`: Document ID does not exist on-chain.
  - `503 Service Unavailable`: Blockchain RPC error.
- **Blockchain Read:** **Yes**.
- **Blockchain Write:** No.
- **IPFS Interaction:** No.

---

# 6. Verification API

### `POST /api/verify`
- **Method:** `POST`
- **Path:** `/api/verify`
- **Purpose:** Evaluates whether a candidate document hash matches the on-chain record and checks revocation and permission status.
- **Caller:** Next.js Frontend (`VerifyDocument` component).
- **Headers:** `Authorization: Bearer <JWT>`.
- **Request Data:**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "documentId": "<document_id_bytes32>",
    "candidateHash": "<computed_candidate_sha256_hash>"
  }
  ```
- **Response Data (HTTP 200 - Valid Match):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "status": "VERIFIED",
    "documentId": "<document_id_bytes32>",
    "onChainHash": "<onchain_sha256_hash>",
    "candidateHash": "<computed_candidate_sha256_hash>",
    "match": true,
    "revoked": false,
    "timestamp": "<block_timestamp_integer>",
    "owner": "<owner_wallet_address>",
    "cid": "<ipfs_cid_string>",
    "verificationDurationMs": "<latency_ms_integer>"
  }
  ```
- **Response Data (HTTP 200 - Tampered / Mismatched):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "status": "TAMPER_DETECTED",
    "documentId": "<document_id_bytes32>",
    "onChainHash": "<onchain_sha256_hash>",
    "candidateHash": "<mutated_candidate_sha256_hash>",
    "match": false,
    "revoked": false,
    "timestamp": "<block_timestamp_integer>",
    "owner": "<owner_wallet_address>",
    "cid": "<ipfs_cid_string>",
    "verificationDurationMs": "<latency_ms_integer>"
  }
  ```
- **Response Data (HTTP 200 - Revoked Document):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "status": "REVOKED",
    "documentId": "<document_id_bytes32>",
    "onChainHash": "<onchain_sha256_hash>",
    "candidateHash": "<candidate_sha256_hash>",
    "match": true,
    "revoked": true,
    "timestamp": "<block_timestamp_integer>",
    "owner": "<owner_wallet_address>",
    "cid": "<ipfs_cid_string>",
    "verificationDurationMs": "<latency_ms_integer>"
  }
  ```
- **Response Data (HTTP 403 - Unauthorized Stranger):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "status": "UNAUTHORIZED",
    "documentId": "<document_id_bytes32>",
    "candidateHash": "<candidate_sha256_hash>",
    "match": false,
    "owner": "<owner_wallet_address>",
    "verificationDurationMs": "<latency_ms_integer>",
    "error": {
      "code": "ACCESS_DENIED",
      "message": "Access denied: you do not possess on-chain permission for this document.",
      "layer": "VERIFY"
    }
  }
  ```
- **Response Data (HTTP 404 - Document Not Found):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "status": "NOT_FOUND",
    "documentId": "<document_id_bytes32>",
    "candidateHash": "<candidate_sha256_hash>",
    "match": false,
    "verificationDurationMs": "<latency_ms_integer>",
    "error": {
      "code": "DOCUMENT_NOT_FOUND",
      "message": "Document not found on-chain.",
      "layer": "VERIFY"
    }
  }
  ```
- **Source of Data:** Real-time on-chain lookup via `DocumentRegistry.sol` comparing `candidateHash` with `documents[id].fileHash`, and authorization verification via `AccessControl.sol`.
- **Possible Errors:**
  - `400 Bad Request`: Missing or malformed `documentId` (requires 0x-prefixed 64 hex chars) or `candidateHash` (requires 64 hex chars).
  - `401 Unauthorized`: Missing, expired, or invalid session JWT.
  - `403 Forbidden`: Caller address is neither owner nor granted verifier on `AccessControl.sol`.
  - `404 Not Found`: Document ID does not exist on `DocumentRegistry.sol`.
  - `503 Service Unavailable`: Ethereum RPC node unreachable.
- **Blockchain Read:** **Yes** (queries `DocumentRegistry.sol` and `AccessControl.sol`).
- **Blockchain Write:** No.
- **IPFS Interaction:** No (IPFS retrieval occurs via `GET /api/ipfs/:cid` for stored-object auditing).

---

# 7. Audit API

### `GET /api/audit/:documentId`
- **Method:** `GET`
- **Path:** `/api/audit/:documentId`
- **Purpose:** Queries on-chain event logs (`eth_getLogs`) across `DocumentRegistry.sol` and `AccessControl.sol` filtered by `documentId` to reconstruct a tamper-evident audit history.
- **Caller:** Next.js Frontend (`AuditTimeline` component).
- **Headers:** `Authorization: Bearer <JWT>`.
- **Parameters:** `documentId` (bytes32 hex string).
- **Response Data (HTTP 200):**
  > **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
  ```json
  {
    "documentId": "<document_id_bytes32>",
    "events": [
      {
        "eventName": "DocumentRegistered",
        "blockNumber": "<block_number_integer>",
        "transactionHash": "<transaction_hash>",
        "actor": "<owner_wallet_address>",
        "timestamp": "<block_timestamp>",
        "details": {
          "cid": "<ipfs_cid>",
          "fileHash": "<file_sha256_hash>"
        }
      },
      {
        "eventName": "AccessGranted",
        "blockNumber": "<block_number_integer>",
        "transactionHash": "<transaction_hash>",
        "actor": "<owner_wallet_address>",
        "timestamp": "<block_timestamp>",
        "details": {
          "verifier": "<verifier_wallet_address>"
        }
      }
    ]
  }
  ```
- **Empty State (HTTP 200):**
  ```json
  {
    "documentId": "<document_id_bytes32>",
    "events": []
  }
  ```
  *(Frontend renders: "No blockchain activity found.")*
- **Source of Data:** Ethereum JSON-RPC provider call executing `queryFilter` over contract events.
- **Possible Errors:**
  - `401 Unauthorized`: Missing or invalid session JWT.
  - `503 Service Unavailable`: Ethereum node event filter failure.
- **Blockchain Read:** **Yes (Event logs)**.
- **Blockchain Write:** No.
- **IPFS Interaction:** No.

---

# 8. Source of Truth

The API enforces unambiguous data provenance:

| Endpoint | Underlying Service | Source of Truth |
|---|---|---|
| `/api/auth/challenge` | Node CSPRNG | In-memory challenge cache |
| `/api/auth/verify` | `ethers.verifyMessage` | Cryptographic public key recovery |
| `/api/ipfs/upload` | IPFS Daemon / Pinata | IPFS Node Multihash response |
| `/api/ipfs/:cid` | IPFS Gateway Daemon | IPFS decentralized storage network |
| `/api/documents` | Ethereum RPC | `DocumentRegistry.sol` EVM storage |
| `/api/documents/:id` | Ethereum RPC | `DocumentRegistry.sol` & `AccessControl.sol` |
| `/api/verify` | Ethereum RPC | `DocumentRegistry.sol` fileHash state |
| `/api/audit/:id` | Ethereum RPC | Ethereum blockchain mined event logs |

---

# 9. Error Responses

All API endpoints return errors following a standard error response schema:

> **CONCEPTUAL EXAMPLE — NOT RUNTIME DATA**
```json
{
  "error": {
    "code": "<error_code_identifier>",
    "message": "<human_readable_description>",
    "service": "<service_origin_identifier>",
    "timestamp": "<timestamp_integer>"
  }
}
```

### Standard Error Codes
- `WALLET_NOT_CONNECTED`: HTTP 401 — Request lacks verified wallet token.
- `CHALLENGE_EXPIRED`: HTTP 401 — Authentication nonce exceeded TTL.
- `SIGNATURE_INVALID`: HTTP 401 — ECDSA signature recovery failed.
- `IPFS_UNAVAILABLE`: HTTP 502 — IPFS node connection failed.
- `BLOCKCHAIN_UNREACHABLE`: HTTP 503 — Ethereum JSON-RPC call failed.
- `ACCESS_DENIED`: HTTP 403 — Wallet address lacks active smart-contract permission.
- `DOCUMENT_NOT_FOUND`: HTTP 404 — Document ID does not exist on-chain.

---

# 10. Security Requirements

1. **CORS Hardening:** Configured exclusively to accept origin headers from the Next.js frontend host.
2. **Helmet Security Headers:** Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), and X-Frame-Options enabled.
3. **Rate Limiting:** Protects `/api/auth/*` and `/api/ipfs/upload` against brute-force and denial-of-service attempts.
4. **Payload Size Restrictions:** `/api/ipfs/upload` limits ciphertext blobs to a maximum of 50 MB per request.
5. **No Secret Leakage:** Stack traces and server-side environment secrets are strictly suppressed in error responses.

---

# 11. External Service Dependencies

The API coordinates communication with two external services, configured strictly via environment variables:

| Dependency | Connection Protocol | Configuration Source | Purpose |
|---|---|---|---|
| **Ethereum Node** | JSON-RPC (HTTP) via `ethers.JsonRpcProvider` | Loaded from `RPC_URL` environment variable | Querying contract state and event filters |
| **IPFS Gateway / Pinata V3** | HTTPS REST via Pinata V3 API & Gateway | Loaded from `IPFS_API_URL` and `IPFS_JWT` | Pinning and streaming AES-256-GCM encrypted ciphertext |

---

# 12. Implemented Phase 10 API Specification & Verification

The Phase 10 implementation establishes the complete, production-grade Node.js/Express TypeScript REST API gateway within `backend/`. The service enforces zero synthetic data, non-custodial read-only blockchain queries, cryptographic payload validation, and wallet signature authentication.

### 12.1 Endpoint Catalog

| Endpoint | Method | Auth Required | Rate Limited | Service Dependency | Description |
|---|---|---|---|---|---|
| `/health` | `GET` | No | No | None | Basic liveness probe returning uptime, timestamp, and status. |
| `/ready` | `GET` | No | No | RPC, Pinata | Deep readiness check evaluating blockchain node and Pinata gateway connectivity. |
| `/api/auth/challenge` | `POST` | No | Yes (20 req / 15m) | None | Issues a CSPRNG 32-byte hex challenge nonce with 5-minute TTL bound to an Ethereum address. |
| `/api/auth/verify` | `POST` | No | Yes (10 req / 15m) | None | Verifies EIP-191 signature (`personal_sign`), consumes nonce (single-use invariant), and issues HMAC-SHA256 JWT. |
| `/api/ipfs/upload` | `POST` | Yes (`Bearer <jwt>`) | Yes (30 req / 15m) | Pinata V3 API | Validates Phase 8 binary ciphertext structure (Version 1, 12-byte IV, 16-byte tag) and pins to IPFS via Pinata V3. |
| `/api/ipfs/:cid` | `GET` | Yes (`Bearer <jwt>`) | Yes (100 req / 15m) | Pinata Gateway | Validates CIDv0/CIDv1 format and retrieves raw ciphertext blob with `Content-Type: application/octet-stream`. |
| `/api/documents` | `GET` | Yes (`Bearer <jwt>`) | Yes (100 req / 15m) | DocumentRegistry | Queries `DocumentRegistered` event logs for caller's wallet address and fetches live on-chain status for each document. |
| `/api/documents/:id` | `GET` | Yes (`Bearer <jwt>`) | Yes (100 req / 15m) | DocumentRegistry, AccessControl | Reads on-chain metadata; enforces 403 Forbidden unless caller is owner or granted verifier in AccessControl. |
| `/api/verify` | `POST` | Yes (`Bearer <jwt>`) | Yes (60 req / 15m) | DocumentRegistry, AccessControl | Queries on-chain document hash, verifies caller authorization, checks revocation, compares against candidate hash, and reports verification latency. |
| `/api/audit/:documentId` | `GET` | Yes (`Bearer <jwt>`) | Yes (60 req / 15m) | DocumentRegistry, AccessControl | Reconstructs full chronological audit lineage from `DocumentRegistered`, `DocumentRevoked`, `AccessGranted`, and `AccessRevoked` event logs with block timestamps. |

### 12.2 Request & Response Headers

- **`Authorization: Bearer <jwt>`**: Standard Bearer token authentication required on all protected endpoints. Issued by `POST /api/auth/verify`.
- **`X-Request-Id`**: Automatically generated UUIDv4 assigned to incoming requests (or preserved from upstream client header) and returned on every response for end-to-end tracing.
- **`Content-Type: application/json`**: Standard JSON payload format.
- **`Content-Type: application/octet-stream`**: Supported on `POST /api/ipfs/upload` (raw binary upload) and returned by `GET /api/ipfs/:cid`.

### 12.3 Standardized Error Response Schema

All error responses strictly adhere to the following JSON schema with HTTP status codes matching the error category:

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Access denied: you do not possess on-chain permission for this document.",
    "service": "AccessControl",
    "timestamp": 1790846200,
    "requestId": "e7bd5100-4aea-479c-8d09-0d15f1d06a75"
  }
}
```

#### Implemented Error Codes
- `INVALID_ADDRESS` (HTTP 400): Address parameter missing or not a 20-byte hexadecimal Ethereum address.
- `INVALID_BYTES32` (HTTP 400): Parameter not a valid 0x-prefixed 64-character hex string.
- `INVALID_HASH` (HTTP 400): Candidate SHA-256 hash not a 64-character hex string.
- `INVALID_CID` (HTTP 400): CID string fails CIDv0 / CIDv1 regex format validation.
- `INVALID_PAYLOAD_FORMAT` / `UNSUPPORTED_VERSION` / `INVALID_IV_LENGTH` (HTTP 400): Uploaded payload fails Phase 8 canonical encryption header validation. Plaintext rejected fail-closed.
- `NO_AUTH_HEADER` / `MALFORMED_AUTH_HEADER` / `INVALID_TOKEN` / `TOKEN_EXPIRED` (HTTP 401): Missing or invalid JWT session token.
- `CHALLENGE_NOT_FOUND` / `CHALLENGE_EXPIRED` / `SIGNATURE_MISMATCH` (HTTP 401): Authentication challenge absent, expired (>5m), or signature verification failed.
- `ACCESS_DENIED` (HTTP 403): Caller is neither document owner nor an authorized verifier in `AccessControl`.
- `DOCUMENT_NOT_FOUND` (HTTP 404): Document ID does not exist on-chain in `DocumentRegistry`.
- `TOO_MANY_REQUESTS` (HTTP 429): Rate limiter threshold exceeded.
- `IPFS_UNAVAILABLE` (HTTP 502): Pinata V3 API or gateway connectivity failure.
- `RPC_UNAVAILABLE` (HTTP 503): Ethereum JSON-RPC provider failure.

### 12.4 Verification Status
- **Backend Test Suite:** 40/40 tests passing across 6 suites (`auth`, `ipfs`, `documents`, `verify`, `audit`, and `integration`).
- **Live Pinata V3 Storage Roundtrip:** Real AES-256-GCM encrypted payloads uploaded to Pinata V3 API, retrieved via IPFS gateway, and validated for exact byte-for-byte fidelity and decryption integrity.
- **On-Chain Event Auditing:** Real Hardhat mined transactions queried via filter logs with block timestamp resolution and deterministic sorting.

