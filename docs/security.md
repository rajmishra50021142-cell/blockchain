# Security Architecture Specification
# Blockchain-Based Digital Document Locker

> **Document Status:** Frozen (Phase 2 Security Baseline)  
> **Document Version:** 1.0.0  
> **Phase Target:** Phase 2 of 16 (System Architecture & Data Flow)  
> **Scope Notice:** This document establishes the multi-layer security architecture and trust boundary controls. All properties are specified as architectural requirements and invariants. Where implementation is scheduled for later phases, it is explicitly indicated.

---

# 1. Security Objectives

The security architecture of the Blockchain-Based Digital Document Locker is engineered to defend against data tampering, unauthorized disclosure, centralized administrative abuse, and data loss. The primary security objectives are:

1. **Confidentiality:** Ensure that only the document owner and explicitly authorized verifiers can decrypt and read document contents.
2. **Integrity:** Ensure that any modification, corruption, or truncation of an original document is deterministically detectable via cryptographic hashing.
3. **Availability & Fault Tolerance:** Prevent single points of failure by leveraging decentralized storage (IPFS) and consensus-driven state management (Ethereum).
4. **Sovereignty & Non-Repudiation:** Eliminate centralized custodianship; document actions must be authorized by the cryptographic signature of the document owner's Web3 wallet.
5. **Transparency & Auditability:** Guarantee that all lifecycle actions (registration, sharing, access, revocation) produce permanent, tamper-proof blockchain event records.

---

# 2. Trust Boundaries

The system enforces five strict trust boundaries between client, wallet, backend, IPFS, and Ethereum consensus:
- **Boundary A (Browser ↔ MetaMask):** Private keys remain in the wallet sandbox. The application has zero key access; all state modifications require explicit user signature.
- **Boundary B (Browser ↔ API Gateway):** Backend treats all client inputs as untrusted; enforces JSON schema validation, rate-limiting, and challenge signature checks.
- **Boundary C (Backend ↔ IPFS):** Only AES-256-GCM encrypted ciphertext payloads are relayed; unencrypted files are rejected.
- **Boundary D (Browser ↔ Blockchain):** Direct interaction via `ethers.js` ensures user-authorized writes cannot be altered by backend servers.
- **Boundary E (Blockchain ↔ Verification Engine):** Verification reads directly from Ethereum contract storage, ignoring client-submitted claim flags.

### Adversarial Threat Boundaries
The architecture accounts for four key adversarial threat categories:

```text
+------------------------+------------------------------------------+-------------------------------------------------+
| Threat Category        | Attack Vector                            | Architectural Defense                           |
+------------------------+------------------------------------------+-------------------------------------------------+
| Untrusted Network /    | Man-in-the-middle, packet sniffing,      | Client-side AES-256-GCM encryption before       |
| Public IPFS Nodes      | public IPFS content crawling             | transmission; only ciphertext enters transport. |
+------------------------+------------------------------------------+-------------------------------------------------+
| Malicious / Corrupted  | Silent bit-rot, intentional document     | Deterministic SHA-256 file digest checked       |
| Document Content       | forgery, credential substitution         | against immutable Ethereum contract record.     |
+------------------------+------------------------------------------+-------------------------------------------------+
| Compromised Application| Rogue administrator, compromised API     | User-authorized blockchain writes must be signed|
| Server                 | gateway injecting unauthorized access    | via MetaMask; backend cannot grant access.      |
+------------------------+------------------------------------------+-------------------------------------------------+
| Unauthorized Verifier  | Third party requesting access to private | On-chain authorization check in smart contract  |
| Access                 | document without owner approval          | (`hasAccess == false`); API denies decryption.  |
+------------------------+------------------------------------------+-------------------------------------------------+
```

---

# 3. Data Confidentiality

- **Zero-Knowledge Transport:** The architecture requires that unencrypted document bytes **never** cross the network boundary.
- **Client-Side Encryption:** Before transmission to the backend or IPFS, files must be encrypted directly inside the browser using the Web Crypto API (`crypto.subtle`).
- **Ciphertext Independence:** IPFS nodes store only encrypted blobs. In the event that a CID is publicly exposed, unauthorized third parties obtain only high-entropy AES-256-GCM ciphertext without the decryption key.

---

# 4. Data Integrity

- **SHA-256 Hashing:** The system computes a 256-bit SHA-256 hash of the authentic plaintext file prior to encryption.
- **Immutable State Anchoring:** The computed hash is permanently written to `DocumentRegistry.sol` during the registration transaction.
- **Tamper Detection Invariant:** Verification requires an exact equality check between the candidate document's computed hash ($H_{\text{candidate}}$) and the on-chain recorded hash ($H_{\text{chain}}$):
  $$\text{Valid} \iff H_{\text{candidate}} = H_{\text{chain}} \land \text{Revoked} = \text{false}$$
  If $H_{\text{candidate}} \neq H_{\text{chain}}$, the system terminates verification and flags **TAMPER DETECTED**.

---

# 5. Identity

- **Cryptographic Key Custody:** The user's Ethereum private key remains exclusively in the secure enclave of the MetaMask wallet extension. The application never requests, inspects, or stores private keys or seed phrases.
- **Challenge-Response Authentication:** Planned for Phase 5, session authentication uses Ethereum's EIP-191 standard (`personal_sign`). The backend generates a cryptographically random nonce; the user signs the nonce; the backend verifies the recovered public key before issuing a scoped session token.
- **Decentralized Identifiers (DIDs):** Wallets are bound on-chain to W3C-compliant DID strings (`did:ethr:<address>`) through `IdentityRegistry.sol`.

---

# 6. Access Control

- **On-Chain Governance:** Document access permissions are governed strictly by the `AccessControl.sol` smart contract deployed on the EVM.
- **Owner-Exclusive Authority:** Only the Ethereum address recorded as the document's `owner` in `DocumentRegistry.sol` has permission to invoke `grantAccess(docId, verifier)` and `revokeAccess(docId, verifier)`.
- **Immediate Revocation Effect:** When `revokeAccess` is confirmed on-chain, the permission flag for that verifier address is immediately set to `false`. Subsequent calls to `hasAccess` revert or return `false`, immediately terminating authorized access.

---

# 7. Encryption

The encryption mechanism adheres to the following cryptographic standards:
- **Algorithm:** AES-256-GCM (Galois/Counter Mode).
- **Key Generation:** A unique 256-bit symmetric key is generated per document using a cryptographically secure pseudo-random number generator (`window.crypto.getRandomValues`).
- **Initialization Vector (IV):** A unique 96-bit (12-byte) IV is generated per encryption operation. IV reuse is strictly prohibited.
- **Authentication Tag:** A 128-bit authentication tag is produced and verified on decryption to prevent chosen-ciphertext attacks or payload tampering.
- **Key Sharing Separation:** Smart-contract permissions govern *authorization* (who is permitted). Encryption keys govern *decryption* (who possesses the secret). The symmetric key must never be stored on-chain or published unencrypted to IPFS.

---

# 8. Blockchain Security

- **Smart Contract Security Best Practices:**
  - Contracts will be compiled with Solidity version `^0.8.20` or higher with native overflow/underflow protection.
  - State changes must follow the Checks-Effects-Interactions pattern.
  - Reentrancy guards will be applied to all state-modifying external calls where applicable.
- **Network Boundaries:**
  - Network target and validation parameters are loaded dynamically from environment variables (`RPC_URL` and `CHAIN_ID`).
  - Active Chain ID validation against the configured environment prevents transactions from executing on unintended networks.

---

# 9. IPFS Privacy

- **Public Network Assumption:** The architecture assumes that any node in the global IPFS swarm can replicate and inspect pinned blocks.
- **Protection Standard:** No sensitive document or metadata may be pinned to IPFS without prior client-side AES-256-GCM encryption.
- **Content-Addressing Security:** CIDs are derived cryptographically from ciphertext content (Multihash). The IPFS network has zero knowledge of the underlying plaintext document or file structure.

---

# 10. Secret Management

- **Zero Secrets in Git:** All external connection strings and API credentials are kept strictly out of version control.
- **Environment Isolation:**
  - `.env` is ignored by Git via `.gitignore`.
  - `.env.example` contains variable names only, without values, ports, or credentials.
- **Separation of Client vs Server Secrets:**
  - Server secrets (`IPFS_API_KEY`, `IPFS_API_SECRET`) are accessible exclusively to the Node.js backend.
  - The client Next.js frontend receives only public configuration: public RPC URLs, Chain IDs, and deployed contract addresses.

---

# 11. Wallet Security

- **User-Authorized Writes:** All state-modifying operations (`registerDocument`, `grantAccess`, `revokeAccess`, `revokeDocument`) must be submitted as transactions signed directly by the user in MetaMask.
- **No Backend Transaction Relaying:** The application backend does not hold a master private key and will never sign or broadcast transactions on behalf of users.
- **Phishing & Nonce Protection:** Challenge nonces are cryptographically random, timestamped, single-use, and expire after 300 seconds (5 minutes).

---

# 12. Error / Fail-Closed Behavior

The system mandates strict **fail-closed** operations:

```text
+--------------------------+------------------------------------------------------------------+
| Failure Event            | Fail-Closed Security Response                                    |
+--------------------------+------------------------------------------------------------------+
| IPFS Upload Fails        | Abort workflow. Do not generate a mock CID. Do not submit on-    |
|                          | chain registration transaction.                                  |
+--------------------------+------------------------------------------------------------------+
| MetaMask Rejection       | Abort transaction. Render "Transaction rejected by user". Do not |
|                          | report registration success.                                     |
+--------------------------+------------------------------------------------------------------+
| EVM Revert               | Parse revert reason. Render real on-chain failure. Do not create |
|                          | fake confirmed state.                                            |
+--------------------------+------------------------------------------------------------------+
| Hash Mismatch            | Verification fails immediately. Display red TAMPER DETECTED alert|
|                          | banner. Never coerce mismatch to verified.                       |
+--------------------------+------------------------------------------------------------------+
| Decryption Error         | Abort view. Authentication tag mismatch indicates corrupted or    |
|                          | unauthorized key. Never render partial plaintext.                |
+--------------------------+------------------------------------------------------------------+
```

---

# 13. Auditability

- **Native EVM Logs:** All contract state transitions emit typed events (`DocumentRegistered`, `AccessGranted`, `AccessRevoked`, `DocumentRevoked`).
- **Append-Only Immutability:** Event logs are stored within mined Ethereum block receipts protected by consensus. They cannot be retroactively modified, reordered, or deleted by any administrative party.
- **Query Verification:** The audit trail query (`GET /api/audit/:id`) performs live log filtering (`eth_getLogs`) directly against the blockchain provider.

---

# 14. Security Limitations

To maintain absolute transparency, the following current limitations and phased implementation boundaries are noted:

1. **Phase 2 Status:** All security features described herein are **architectural requirements**. No cryptographic, smart contract, or authentication code is implemented during Phase 2.
2. **Symmetric Key Sharing:** The core implementation focuses on owner-controlled storage and verification. Automated asymmetric key exchange (e.g., ECIES public-key encryption of document secrets for verifiers) is documented as an advanced enhancement.
3. **Zero-Knowledge Clarification:** Standard SHA-256 integrity verification is **not** a zero-knowledge proof. True ZK-SNARK circuits (e.g., selective attribute disclosure without revealing document hashes) are formally classified as Future Scope.
4. **Endpoint Security:** Backend rate limiting, CORS restrictions, and JWT signing will be implemented in Phase 5 and audited in Phase 13.

---

# 15. Phase 4 Wallet & Identity Security Controls

The Phase 4 milestone implements client-side wallet integration and proof-of-ownership primitives under the following security invariants:

1. **Client-Side Key Enclave Isolation:**
   - Private keys and mnemonic seed phrases remain exclusively in the MetaMask browser sandbox.
   - The application does not generate, handle, inspect, or persist private keys or wallet passwords.
2. **Deterministic Proof of Wallet Ownership:**
   - Proof of ownership requires an authentic EIP-191 personal signature (`personal_sign`) over a message containing a cryptographically random nonce (`crypto.randomUUID()`), chain ID, and timestamp.
   - Proof of ownership is affirmed ONLY after recovering the signer address via `ethers.verifyMessage` and confirming case-insensitive equality with the connected address.
   - User rejection of signing requests terminates in an honest failure; no mock verification state is ever generated.
3. **Strict Account State Isolation:**
   - When MetaMask emits `accountsChanged`, all existing authentication state, signature records, and verified proofs of ownership belonging to the previous account are instantly flushed.
   - Accounts never inherit authorization state from another wallet.
4. **Network Guardrails:**
   - The frontend continuously inspects `chainChanged` events.
   - Any departure from the configured target chain ID transitions the interface to `wrong-network` and halts wallet-dependent operations.
5. **No LocalStorage or URL Spoofing:**
   - The application treats `window.ethereum` and live cryptographic verification as the only sources of truth. Address claims stored in localStorage, session cookies, or URL search parameters are ignored.

---

# 16. Phase 5 DocumentRegistry Smart Contract Security Controls

The `DocumentRegistry.sol` smart contract implements the following security invariants:

1. **Sovereign Ownership Enforcement:**
   - Ownership is assigned exclusively to `msg.sender` during `registerDocument`. Callers cannot assign document ownership to an arbitrary address.
   - Functions modifying document lifecycle state (`revokeDocument`) enforce `msg.sender == doc.owner` via the `NotDocumentOwner` custom error.
2. **Immutability of Integrity Anchors:**
   - Once registered, `documentHash` (SHA-256 digest), `ipfsCid`, `owner`, and `registeredAt` cannot be modified or overwritten.
   - The contract provides zero general setter functions or administrative update backdoors.
3. **Collision & Duplicate Prevention:**
   - The contract verifies `_documents[documentId].owner == address(0)` before creating any record.
   - Duplicate registration attempts revert fail-closed with `DocumentAlreadyExists(documentId)`.
4. **Input Sanitization:**
   - Empty IDs (`bytes32(0)`), empty hashes (`bytes32(0)`), and empty CID strings are rejected at the contract boundary via custom errors (`InvalidDocumentId`, `InvalidDocumentHash`, `InvalidIpfsCid`).
5. **Reentrancy Immunity:**
   - The contract executes no external contract calls and handles no Ether transfers. Its execution path is statically immune to reentrancy vulnerabilities.
6. **Non-Destructive Revocation Semantics:**
   - Revocation sets `revoked = true` while preserving all historical registration, ownership, and hash data for permanent auditability.
   - Double-revocation is explicitly prohibited via `DocumentAlreadyRevoked(documentId)`.

---

# 17. Phase 6 AccessControl Smart Contract Security & Permission Invariants

The `AccessControl.sol` smart contract implements the following security controls:

1. **Authoritative Ownership Query:**
   - Permissions can only be granted or revoked by the actual owner recorded in `DocumentRegistry` (`msg.sender == doc.owner`).
   - Ownership is never accepted from client inputs, URL parameters, or localStorage.
2. **Document Revocation Precedence (Stale Permission Invalidation):**
   - If a document is revoked in `DocumentRegistry`, `hasAccess` immediately returns `false`, overriding any remaining direct permission grants.
   - Attempting to grant access to an already-revoked document reverts fail-closed with `DocumentIsRevoked(documentId)`.
3. **Non-Existent Document Rejection:**
   - Attempts to grant or revoke access for unknown document IDs revert with `DocumentNotFound(documentId)`.
   - `hasAccess` returns `false` safely for unknown document IDs without creating dummy storage entries.
4. **Zero Address Sanitization:**
   - Constructor validates `registryAddress != address(0)` (`InvalidRegistryAddress`).
   - Functions reject `verifier == address(0)` (`InvalidVerifierAddress`) to prevent accidental wildcard or burn-address permissions.
5. **Deterministic State Transitions:**
   - Duplicate grant attempts revert with `AccessAlreadyGranted(documentId, verifier)`.
   - Revoking ungranted or already-revoked permissions reverts with `AccessNotGranted(documentId, verifier)`.
6. **No Centralized Admin Backdoor:**
   - There are no superuser, administrative override, or multi-sig bypass functions. Access control is strictly sovereign and document-owner-controlled.
7. **Read-Only External Dependency & Reentrancy Safety:**
   - Cross-contract calls to `DocumentRegistry` are view-only (`documentExists`, `getDocument`, `isRevoked`).
   - The contract holds no funds, accepts no Ether, and performs zero state-modifying external calls, ensuring static reentrancy immunity.

---

# 18. Phase 7 Smart Contract Security Hardening & Invariant Verification

Phase 7 hardens and comprehensively validates the contract layer through automated adversarial testing:

1. **Formalized Invariant Testing:**
   - Proved 7 core security invariants across both contracts: Sovereign Ownership, Owner-Only Authorization, Multi-Tenant Isolation, Stale Permission Invalidation, Non-Existent Document Protection, Registration Immutability, and Event-State Coherence.
2. **Adversarial Attack Surface Verification:**
   - Evaluated Scenarios A through F on a live EVM node: attacker attempts to register under another address, grant access to another's document, revoke another's document, or grant access on a revoked document.
   - All adversarial transactions were rejected fail-closed with custom Solidity revert errors.
3. **Multi-Tenant State Isolation:**
   - Verified that permission granted for Document $A$ to Verifier $1$ provides zero visibility or authority over Document $B$ or Verifier $2$.
4. **Gas & Cost Bounds:**
   - Established predictable gas consumption profiles across core operations (`registerDocument` ~229k gas, `grantAccess` ~71k gas, `revokeAccess` ~49k gas, `revokeDocument` ~48k gas).
5. **Static Analysis & Tooling Assurance:**
   - Validated against Solc `0.8.24` AST verification with zero compiler warnings, zero variable shadowing, and complete visibility qualifiers.

---

# 19. Phase 8 Cryptographic Security, Key Handling & Invariants

Phase 8 implements the foundational cryptographic primitives for document integrity and confidentiality:

1. **Deterministic Document Fingerprinting (SHA-256):**
   - Implemented via NIST FIPS 180-4 standard Web Crypto API (`crypto.subtle.digest("SHA-256")`).
   - Strict byte sensitivity: Operates directly on unaltered document byte arrays (`Uint8Array`/`ArrayBuffer`).
   - Zero-salt invariant: Hashes are derived strictly from raw document content to preserve independent verification reproducibility.
   - Smart contract compatibility: Formatted canonically as 32-byte binary, 64-character lowercase hex, and `0x`-prefixed 66-character lowercase hex matching EVM `bytes32`.

2. **Authenticated Confidentiality (AES-256-GCM):**
   - Implemented via NIST SP 800-38D standard Web Crypto API.
   - 256-bit symmetric keys generated per document via CSPRNG (`crypto.subtle.generateKey`).
   - 96-bit (12-byte) initialization vectors (IVs) generated uniquely per operation via `crypto.getRandomValues`.
   - 128-bit authentication tag appended and verified on decryption.
   - Fail-closed tamper detection: Any modification to ciphertext, IV, authentication tag, or decryption key fails closed with `AuthenticationError` and yields zero plaintext.

3. **Canonical Payload Serialization:**
   - Standard binary layout: `[Version (1B) | IV Length (1B) | IV Bytes (12B) | Ciphertext + Tag (NB)]`.
   - Structural validation rejects malformed, truncated, or incompatible version payloads before decryption is attempted.

4. **Cryptographic Key Boundaries:**
   - Raw keys are strictly ephemeral and kept only in transient memory during client-side encryption/decryption.
   - Raw keys are never written to `localStorage`, `sessionStorage`, or IndexedDB.
   - Raw keys are never transmitted to smart contracts, blockchain nodes, or public IPFS blocks.
   - Raw keys are never logged in console outputs, error traces, URLs, or query parameters.

5. **Decrypt-Then-Hash Verification Foundation:**
   - Provides client-side primitive (`decryptAndVerify`) that decrypts authenticated ciphertext and recalculates SHA-256 digest of decrypted plaintext, ensuring complete round-trip integrity prior to on-chain state comparison.

---

# 20. Phase 9 IPFS Decentralized Storage Security & Data Privacy

Phase 9 establishes decentralized, content-addressed storage integration under strict security boundaries:

1. **Zero Plaintext on Decentralized Networks:**
   - IPFS nodes are inherently public and trustless. No unencrypted document bytes or sensitive plaintext metadata are ever uploaded to IPFS or Pinata.
   - All payloads uploaded are strictly AES-256-GCM ciphertext packaged in the canonical binary format.
2. **Decoupled Key Isolation:**
   - The symmetric decryption key is NEVER embedded in IPFS metadata, uploaded files, or file names.
   - Possession of an IPFS CID yields only high-entropy ciphertext; decryption is mathematically impossible without the separate off-chain symmetric key.
3. **Byte-for-Byte Transmission Fidelity:**
   - The system verifies that raw bytes retrieved from IPFS match the uploaded ciphertext exactly before executing authenticated decryption.
4. **Tamper Rejection via Authenticated Decryption:**
   - Any modification by malicious gateway nodes, network proxies, or bit-rot is immediately caught by AES-GCM GHASH tag verification, causing an `AuthenticationError` and returning zero plaintext.
5. **Fail-Closed IPFS Operational Policy:**
   - If the IPFS service is unreachable, credentials are invalid, or CID retrieval times out, the system fails closed. No mock CIDs, dummy hashes, or local fallback storage are ever generated.
6. **Credential Hygiene:**
   - Pinata JWT credentials remain isolated in `.env` and are never exposed to browser client logs, URLs, error messages, or Git version control.

---

# 21. Phase 10 Backend API Layer Security & Cryptographic Boundaries

Phase 10 establishes the secure Node.js/Express REST API gateway in `backend/` enforcing multi-layered security controls, non-custodial boundaries, and strict fail-closed policies:

### 21.1 Non-Custodial Architecture & Read-Only Blockchain Boundary
1. **Zero Private Keys:** The backend service holds zero Ethereum private keys, seed phrases, or signing accounts.
2. **Zero Server-Side Writes:** The API never creates, signs, or broadcasts state-changing transactions. All blockchain writes (`registerDocument`, `revokeDocument`, `grantAccess`, `revokeAccess`) remain strictly under user control via their Web3 wallet (e.g., MetaMask).
3. **Read-Only Invariant:** All blockchain interactions from the backend are strictly read-only RPC calls (`eth_call`, `eth_getLogs`) executed via `ethers.JsonRpcProvider`.

### 21.2 EIP-191 Challenge-Response Authentication
1. **Cryptographic Entropy:** Challenge nonces are generated using `crypto.randomBytes(32)` providing 256 bits of CSPRNG entropy.
2. **Single-Use Invariant:** Once verified, a challenge nonce is immediately purged from the challenge store, rendering replay attacks mathematically impossible.
3. **Strict Time-to-Live (TTL):** Challenges expire after 5 minutes (300 seconds). Any attempt to verify an expired challenge fails closed with `CHALLENGE_EXPIRED` (HTTP 401).
4. **Signature Verification:** Message signatures are validated using `ethers.verifyMessage` to recover the signer's Ethereum address under the EIP-191 personal sign standard. The recovered address is checked against the challenged address in normalized lowercase.
5. **Session JWT Issuance:** Upon successful verification, the API issues an HMAC-SHA256 JWT signed with `AUTH_JWT_SECRET`. The token encapsulates standard claims (`sub` set to the verified address, `iss: "document-locker-api"`, `aud: "document-locker-client"`, `iat`, `exp` set to 1 hour).
6. **Secret Isolation:** `AUTH_JWT_SECRET` is generated from a 256-bit cryptographically secure random value, stored exclusively in the backend environment, and never shared with the frontend or exposed in client bundles.

### 21.3 Real Pinata / IPFS Credential Isolation
1. **Server-Side Gateway Relay:** The Pinata JWT is isolated exclusively in the backend runtime environment. The client never receives or stores the Pinata credential.
2. **Payload Boundary Defense:** The `/api/ipfs/upload` endpoint performs deep structural inspection on incoming payloads:
   - Rejects unencrypted plaintext uploads fail-closed.
   - Enforces the Phase 8 canonical binary serialization format: minimum 30 bytes, Version 1 header (`0x01`), 12-byte IV length (`0x0c`), 16-byte GCM authentication tag.
   - Rejects malformed, truncated, or unauthenticated payloads with HTTP 400 before transmitting to Pinata.
3. **CID Format Sanitization:** The `/api/ipfs/:cid` endpoint validates CID strings against strict regular expressions for CIDv0 (Qm + base58, 46 characters) and CIDv1 (bafy... base32, 59 characters) before proxying to the gateway.

### 21.4 Authorization & Access Control Enforcement
1. **Smart Contract Ground Truth:** Document access authorization is verified directly against `DocumentRegistry.sol` and `AccessControl.sol`. The API rejects client-supplied permission claims.
2. **Fail-Closed Access Checks:** In `/api/documents/:id`, `/api/verify`, and `/api/audit/:documentId`, access is permitted if and only if the caller's verified wallet address is:
   - The registered document owner according to `DocumentRegistry.getDocument(id)`, OR
   - An authorized verifier holding active access according to `AccessControl.hasAccess(id, caller)`.
   If neither condition is met, the API immediately responds with `ACCESS_DENIED` (HTTP 403).
3. **Automatic Stale Access Revocation:** If a document is revoked in `DocumentRegistry`, `AccessControl.hasAccess` automatically returns false on-chain, and the API denies verifier access.

### 21.5 Network & Transport Security
1. **Helmet & Security Headers:** Enforces Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
2. **Granular Rate Limiting:**
   - Authentication challenge generation: 20 requests per 15 minutes per IP.
   - Authentication verification: 10 requests per 15 minutes per IP.
   - IPFS upload relay: 30 requests per 15 minutes per IP.
   - Standard data and verification queries: 60–100 requests per 15 minutes per IP.
3. **Correlation ID Tracking:** Assigns or propagates `X-Request-Id` UUIDv4 headers across all request lifecycles for auditability without logging sensitive payload content or cryptographic keys.
4. **Information Leakage Prevention:** Error responses strictly sanitize internal exceptions, returning structured JSON error bodies without stack traces or environment configurations.


---

# 22. Phase 11 Frontend Security Architecture & Session Isolation

Phase 11 establishes user-facing security controls across the Next.js frontend, maintaining clear boundaries between client-side wallet interactions, backend API authentication, cryptographic hashing, and decentralized storage.

### 22.1 Strict Separation of Wallet State and Backend Session
1. **Independent State Machines:** In the frontend architecture, wallet connection and backend authentication are treated as completely distinct lifecycle states. A user who connects their MetaMask wallet (sharing their public Ethereum address and active chain ID) is NOT automatically authenticated with the backend API.
2. **Explicit Cryptographic Consent:** Backend authentication requires an explicit user action to request an EIP-191 challenge and sign it using their private key via `personal_sign`.
3. **Session Invalidation on Account Mutation:** Any change to the active Ethereum account emitted by MetaMask via `accountsChanged` immediately invalidates the active backend session:
   - Clears the active JWT from memory and `sessionStorage`.
   - Flushes cached document records and permission states.
   - Prevents stale tokens associated with Account A from being used while Account B is active in MetaMask.
4. **Network Guardrails:** When MetaMask emits `chainChanged`, the frontend verifies that the chain ID matches `NEXT_PUBLIC_CHAIN_ID`. If mismatched, write actions and sensitive views are disabled, and a network warning banner is presented to the user.

### 22.2 Zero Frontend Server Secrets & Environment Variable Hygiene
1. **Strict Whitelist of Public Configuration:** Only public, non-sensitive configuration values are included in `frontend/.env.local` using the `NEXT_PUBLIC_` prefix:
   - `NEXT_PUBLIC_API_BASE_URL`: Express backend API endpoint.
   - `NEXT_PUBLIC_CHAIN_ID`: Target EVM chain ID (e.g., 31337 for local Hardhat).
   - `NEXT_PUBLIC_CONTRACT_DOCUMENT_REGISTRY`: Public contract address.
   - `NEXT_PUBLIC_CONTRACT_ACCESS_CONTROL`: Public contract address.
   - `NEXT_PUBLIC_CONTRACT_NETWORK`: Network name (e.g., "localhost").
2. **Zero Server Secrets in Client Bundles:**
   - `IPFS_JWT`, `IPFS_API_KEY`, and `IPFS_API_SECRET` are strictly excluded from the frontend. The frontend never communicates directly with Pinata and holds no IPFS credentials.
   - `AUTH_JWT_SECRET` is held exclusively in `backend/.env` for signing and verifying tokens; the frontend treats the JWT as an opaque bearer string.
   - Private keys and seed phrases are never stored, logged, or processed by frontend code; all signing is delegated to the user's external Web3 wallet provider (MetaMask).

### 22.3 Token Storage & Storage Isolation
1. **Scoped `sessionStorage`:** Authenticated JWTs are stored in browser `sessionStorage` rather than `localStorage`. `sessionStorage` is automatically wiped when the browser tab or window is closed, significantly reducing the window of opportunity for cross-tab token persistence.
2. **Address-Scoped Storage Keys:** The storage key is explicitly namespaced by normalized wallet address (`doc_locker_jwt_0x...`), preventing token collision or accidental cross-account leakage.
3. **Memory Cleansing:** `ApiClient.clearToken()` immediately wipes the in-memory token reference upon logout, account switch, or receipt of an HTTP 401 response.

### 22.4 Client-Side Cryptographic Boundary
1. **Client-Side SHA-256 Hashing:** Verification hashing is performed locally within the user's browser using the Web Crypto API (`crypto.subtle.digest("SHA-256")`). Document plaintext never leaves the browser during hash generation.
2. **Deterministic Comparison:** The candidate hash generated client-side is transmitted to the backend solely for comparison against the on-chain SHA-256 digest recorded in `DocumentRegistry`.
3. **Fail-Closed Verification States:** If verification cannot reach the backend, if the document ID is invalid, or if the contract call reverts, the verification UI renders an explicit `ERROR` or `NOT FOUND` state. It never defaults to `VERIFIED`.

### 22.5 Defense Against Synthetic or Fabricated Data
1. **Real Runtime Invariant:** The frontend code contains zero synthetic, mock, fake, demo, or fallback application objects.
2. **Deterministic Empty States:** When an authenticated account has registered zero documents, the UI renders an honest `EmptyState` component explaining that no records exist on-chain.
3. **Deterministic Error States:** When network or API errors occur, the UI displays an honest `ErrorState` component detailing the exact error message and providing a retry action, rather than substituting fabricated data to simulate a working environment.

---

## 23. Phase 12 Document Registration Security, Non-Custodial Boundaries & Invariants

### 23.1 Non-Custodial Blockchain Execution Invariant
1. **Zero Private Key Custody:** The backend server and frontend application hold zero private keys, mnemonic seed phrases, or custodial signing capability.
2. **MetaMask Sovereign Signatures:** The transaction invocation `DocumentRegistry.registerDocument(documentId, documentHash, ipfsCid)` is created client-side and dispatched directly to `window.ethereum` for user review and explicit private key signature within MetaMask.
3. **Transaction Immutability:** Once mined, document ownership is irrevocably bound to `msg.sender` on Ethereum. The backend cannot forge registrations, alter existing records, or impersonate users.

### 23.2 Client-Side Cryptographic Key Isolation & Encryption Invariants
1. **Browser-Only Key Generation:** AES-256 keys are generated client-side using `crypto.getRandomValues(new Uint8Array(32))` via Web Crypto API.
2. **Zero Key Transmission Invariant:** The raw 256-bit symmetric encryption key is NEVER transmitted across the network:
   - Never sent to the Express backend API.
   - Never sent to Pinata or embedded in IPFS payloads.
   - Never submitted in calldata or logged on Ethereum.
   - Never logged to console or persisted in unencrypted browser storage.
3. **Authenticated Encryption (AES-256-GCM):** Plaintext files are encrypted using AES-256-GCM with a fresh 96-bit CSPRNG IV per document and a 128-bit authentication tag, serialized according to the Phase 8 binary specification (`ENC\x01` magic header, 12-byte IV, 16-byte tag, followed by ciphertext).
4. **Local Key Backup (.key file):** The user is provided a secure, direct-download button to export their raw cryptographic key as a `<documentId>.key` binary file for local sovereign safekeeping.

### 23.3 Two-Stage Registration Architecture & Orphan Mitigation
1. **Decoupled IPFS Storage and Blockchain Registration:** The workflow operates in two distinct phases:
   - *Phase A:* Upload encrypted ciphertext payload to IPFS via backend relay, acquiring a verified CIDv0/v1 hash.
   - *Phase B:* Submit the on-chain registration transaction `registerDocument(documentId, documentHash, ipfsCid)` through MetaMask.
2. **Orphan IPFS Object Defense:** If a user cancels or rejects the MetaMask transaction, or if the blockchain transaction fails/reverts, the ciphertext payload remains pinned on IPFS without an associated on-chain registration record.
   - The UI immediately renders a distinct `ORPHAN_IPFS_WARNING` alert notifying the user of the exact orphan CID.
   - Because only AES-256-GCM ciphertext was uploaded, confidential plaintext is mathematically protected even in an orphaned IPFS state.

### 23.4 Automated Post-Registration Consistency Verification
1. **Automated Verification Roundtrip:** Immediately following transaction mining confirmation, the client initiates an automated consistency check:
   - *On-Chain Inspection:* Reads `DocumentRegistry.getDocument(documentId)` directly via read-only RPC provider.
   - *Owner Assertion:* Asserts `registeredOwner.toLowerCase() === connectedWallet.toLowerCase()`.
   - *Hash Assertion:* Asserts `storedDocumentHash === clientCalculatedHash`.
   - *CID Assertion:* Asserts `storedIpfsCid === uploadedIpfsCid`.
   - *Revocation Assertion:* Asserts `isRevoked === false`.
   - *Decryption Roundtrip Check:* Downloads the ciphertext payload from IPFS via backend relay, decrypts it using the local in-memory key, and asserts byte-for-byte identity against original file bytes.
2. **Fail-Closed on Consistency Mismatch:** If any assertion fails, the workflow immediately transitions to `CONSISTENCY_MISMATCH`, logs the detailed divergence, and blocks optimistic success display.

### 23.5 Session, Network & Wallet Alignment Guardrails
1. **Triple Alignment Check:** Registration requires that:
   - Wallet is connected (`window.ethereum`).
   - Active chain ID strictly matches `NEXT_PUBLIC_CHAIN_ID` (`31337`).
   - Connected wallet address exactly matches the subject of the active backend JWT session.
2. **Account Switch Invalidation:** If the user switches accounts in MetaMask during the registration workflow, all in-progress registration state and ephemeral key material are instantly purged.

---

## 24. Phase 13 Document Sharing & Access Revocation Security, Non-Custodial Boundaries & Invariants

### 24.1 Non-Custodial Access Management Boundary
1. **Zero Server Transaction Signing:** The backend Express server functions strictly as a read-only indexer and access gatekeeper. It holds zero Ethereum private keys and cannot sign `grantAccess` or `revokeAccess` transactions.
2. **MetaMask Sovereign Authorization:** All permission grants and revocations require explicit user signature through MetaMask, calling `AccessControl.sol` directly from the client.
3. **Owner-Exclusive Invariant:** Only the verified document owner recorded in `DocumentRegistry` can authorize or revoke verifier permissions. Any unauthorized attempt reverts on-chain with `NotDocumentOwner`.

### 24.2 On-Chain Permission vs. Cryptographic Decryption Key Separation
1. **Strict Decoupling:** On-chain access permission (`AccessControl.hasAccess == true`) authorizes a verifier to query the backend API for document metadata and ciphertext. It does NOT provide the cryptographic AES-256 decryption key.
2. **Zero Key Transmission Invariant:** The AES decryption key is NEVER transmitted during the sharing workflow:
   - Never sent to the backend API or logged in server telemetry.
   - Never published to IPFS or attached to CIDs.
   - Never written to Ethereum calldata or events.
   - Never serialized into JWTs, URL parameters, or browser web storage.
3. **Decryption Key Delivery Boundary:** Document decryption requires out-of-band key transmission or an end-to-end asymmetric key distribution protocol (deferred to future architectural phases).

### 24.3 Revocation Invariant & Invalidation Hierarchy
1. **Direct Verifier Revocation:** Calling `AccessControl.revokeAccess(docId, verifier)` immediately flips the verifier's permission to `false`. Subsequent calls to `hasAccess(docId, verifier)` evaluate to `false` in the same mined block.
2. **Document-Level Revocation Invalidation:** If a document is revoked on `DocumentRegistry` (`DocumentRegistry.revokeDocument(docId)`):
   - All verifier access is immediately overridden: `hasAccess` evaluates to `false` for all verifiers regardless of direct permission mapping.
   - New access grants are permanently forbidden: `AccessControl.grantAccess` reverts on-chain with `DocumentIsRevoked`.
3. **Automated Read-After-Write Verification:** The frontend executes an automated on-chain verification call (`checkHasAccessOnChain`) immediately following transaction confirmation to verify the exact new state before transitioning the UI.

### 24.4 Input Defense & Verifier Validation
1. **Fail-Closed Address Sanitization:** Verifier addresses must satisfy strict format criteria (20-byte hex, non-empty, valid checksum).
2. **Zero-Address Defense:** The null address (`0x00...00`) is rejected client-side and reverts on-chain with `InvalidVerifierAddress`.
3. **Self-Granting Defense:** Document owners are prevented from granting access to themselves (`cannot grant access to document owner`).
4. **Duplicate Grant & Non-Existent Revocation Reverts:** The smart contract prevents duplicate active grants (`AccessAlreadyGranted`) and revoking un-granted verifiers (`AccessNotGranted`).

---

## 25. Phase 14 Document Verification & Tamper-Detection Security, Cryptographic Boundaries & Invariants

### 25.1 Client-Side Hashing & Zero-Plaintext Transmission
1. **Local Hash Ingestion:** The browser runtime computes the candidate document SHA-256 digest locally via Web Crypto API (`crypto.subtle.digest("SHA-256", fileBytes)`).
2. **Zero Plaintext Transmission:** Raw candidate document bytes are NEVER uploaded to the backend server, IPFS, or blockchain during verification. Only the 32-byte hexadecimal candidate digest is transmitted.
3. **Zero Plaintext Logging:** The backend server and API logs never capture candidate file contents or associate candidate hashes with sensitive identifiable data.

### 25.2 Exact-Byte Canonical Verification & Avalanche Tamper Detection
1. **Exact Binary Processing:** Candidate documents are ingested as raw byte arrays (`Uint8Array`) without text encoding conversions, BOM stripping, or newline normalization.
2. **Avalanche Tamper Detection:** A single-bit alteration in candidate bytes produces a radically different SHA-256 digest, which fails comparison with `DocumentRegistry.documentHash` and immediately triggers `status: "TAMPER_DETECTED"`.
3. **No Synthetic Pass Paths:** Verification never guesses, approximates, or conditionally forgives hash differences. Either the hashes match canonically, or a tamper/mismatch verdict is returned.

### 25.3 Multi-Party Authorization Enforcement & Information Shielding
1. **EIP-191 Verified Caller Identity:** All verification queries (`POST /api/verify`) require a verified wallet session token.
2. **Sovereign Authorization Hierarchy:**
   - Document Owner: Inherent authorization.
   - Authorized Verifier: Must possess active `AccessControl.hasAccess(docId, caller) == true` (or `isDirectAccessGranted` for revoked documents).
   - Unauthorized Third Party: Rejected with HTTP 403 Forbidden and `status: "UNAUTHORIZED"`.
3. **Information Shielding on Rejection:** Unauthorized callers are strictly denied access to the on-chain `fileHash`, `cid`, and registration timestamps to prevent unauthorized metadata discovery.

### 25.4 Absolute Revocation Precedence
1. **On-Chain Revocation Authoritative:** If `doc.revoked == true` in `DocumentRegistry.sol`, the primary verification outcome is strictly `REVOKED`.
2. **No Overriding Revoked Status:** Even if a candidate file matches the historical registration hash, the system NEVER reports `VERIFIED` on a revoked document.
3. **Audit Visibility Preserved:** Authorized owners and granted verifiers are permitted to view the revoked status alongside the archived hash match status, ensuring full audit visibility while preventing fraudulent certification.

### 25.5 Stored-Object AES-256-GCM Auditing & Client Key Isolation
1. **Strict Key Isolation:** The symmetric AES key is never requested by the backend and never transmitted over the network.
2. **Client-Runtime Decryption:** Stored-object verification retrieves the ciphertext from IPFS via backend relay and decrypts in the browser using the user-provided key.
3. **Authentication Tag Verification:** Any modification to remote IPFS ciphertext or authentication tag causes AES-GCM decryption to fail closed with `DECRYPTION_FAILED`.
4. **Honest Key Absence Reporting:** If no decryption key is provided, the stored-object audit honestly reports `DECRYPTION_UNAVAILABLE` without impeding candidate-file hash verification.

### 25.6 False-Certification Rule Compliance (Section 21)
1. **Precise Cryptographic Claims Only:** The verification engine and UI describe outcomes solely in terms of mathematical byte matching: *"Candidate file SHA-256 digest matches the on-chain record registered on Ethereum."*
2. **Prohibited False-Certification Language:** The system is strictly forbidden from asserting:
   - "100% authentic", "Guaranteed genuine", "Legally verified"
   - "Fraud-proof", "Tamper-proof system", "Validates legal authenticity"
3. **Neutral Tamper Attribution:** When hashes mismatch, the system notes only that the candidate bytes differ from the registered record. It never speculates about malicious intent, author identity, or the nature of modification.

### 25.7 Account & Network Invalidation Guardrails
1. **Instant Session Invalidation:** Switching accounts or networks in MetaMask immediately flushes the active verification outcome, clear candidate file state, and purges any ephemeral in-memory AES keys.
2. **Fail-Closed on Wrong Chain:** Any query dispatched while on an unexpected chain ID is rejected fail-closed with `BLOCKCHAIN_UNAVAILABLE` or `Network mismatch`.


