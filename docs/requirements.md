# Requirements Specification
# Blockchain-Based Digital Document Locker

> **Document Status:** Frozen (Phase 1 Baseline)  
> **Document Version:** 1.0.0  
> **Project Type:** Real-Data Decentralized Blockchain Application  
> **Contributor Reference:** Shah Emanul Haque (25BCE1463)  
> **Governing Standards:** `ai_rules.md` (Non-Synthetic Data Policy), `MASTER_PLAN.md`, Project Presentation (`.pptx`), and Course Rubric (`docs/mandatory-requirements.png`)

---

# 1. Project Overview

The **Blockchain-Based Digital Document Locker** is a decentralized, tamper-evident, privacy-preserving digital vault engineered to store, verify, share, and revoke access to electronic documents. Designed as a superior decentralized alternative to centralized digital document platforms (such as the traditional DigiLocker), this application leverages Ethereum smart contracts, distributed interplanetary file system (IPFS) storage, client-side cryptographic hashing (SHA-256), and authenticated symmetric encryption (AES-256-GCM).

Unlike centralized repositories that rely on centralized databases and trusted third parties, the Blockchain-Based Digital Document Locker guarantees:
- **Decentralized Architecture:** Elimination of single points of failure through peer-to-peer distributed storage and consensus-based state management.
- **Cryptographic Integrity:** Tamper-proof fingerprinting using SHA-256 hashes registered immutably on-chain.
- **Sovereign User Ownership:** Document management controlled exclusively by user-held Web3 cryptographic private keys / wallets.
- **Confidentiality by Design:** Client-side AES-256-GCM encryption before data leaves the user environment; raw documents are never stored plaintext on public IPFS or on-chain.
- **Instant Decentralized Verification:** Real-time hash comparison (< 2 seconds) against the immutable blockchain registry without intermediary dependencies.
- **Smart-Contract Access Governance:** Fine-grained, revocable access control executed by on-chain state transitions.
- **Tamper-Evident Auditability:** Transparent, append-only blockchain event emission providing full historical lineage of registrations, access grants, and revocations.

---

# 2. Problem Statement

Centralized document storage and verification platforms—exemplified by traditional systems like DigiLocker—suffer from systemic architectural vulnerabilities that compromise document integrity, availability, user sovereignty, and operational efficiency:

1. **Single Point of Failure (SPOF):** Centralized server and database topologies are vulnerable to localized hardware failures, distributed denial-of-service (DDoS) attacks, network outages, and maintenance downtime. A failure at the central host denies all citizens and institutions access to critical documents.
2. **Document Tampering & Forgery Risk:** Documents stored in traditional databases are mutable by privileged database administrators, compromised server processes, or unauthorized intruders possessing internal credentials. The absence of decentralized consensus leaves records vulnerable to retroactive modification and unauthorized issuance.
3. **Paternalistic / Government-Centralized Control:** Central authorities hold custody of access policies and identity mappings. Users lack true sovereign ownership and cannot independently verify whether their private credentials or records have been inspected or manipulated.
4. **Slow, Intermediary-Dependent Verification:** Verification workflows routinely require manual inspection, multi-day cross-institutional inquiries, or brittle integration with siloed government databases, resulting in substantial latency (hours to days).
5. **Vulnerability to Bulk Data Breaches:** Centralized databases act as high-value honeypots for malicious actors, creating severe systemic privacy and data leakage risks.
6. **Malleable Audit Logs:** Traditional application logging stored in mutable flat files or administrative databases can be altered, truncated, or erased to obscure illicit administrative modifications.

---

# 3. Project Objective

The primary objective is to engineer, deploy, and demonstrate a production-grade, real-data **Blockchain-Based Digital Document Locker** that resolves the vulnerabilities of centralized systems while satisfying all academic and technical requirements:

1. **Implement Mandatory Core Requirements:**
   - **Requirement 1 — Blockchain Network Setup:** Configure and run an Ethereum-compatible network (local Hardhat node and Sepolia testnet) with active RPC connectivity, funded accounts, and verified contract deployments.
   - **Requirement 2 — Smart Contract Implementation:** Author, test, and deploy modular Solidity contracts (`DocumentRegistry.sol`, `AccessControl.sol`, `IdentityRegistry.sol`) executing core business logic, permissions, and event logging.
   - **Requirement 3 — Frontend – Blockchain Integration:** Develop a responsive Next.js and Tailwind CSS frontend connected via `ethers.js` to MetaMask, allowing users to submit transactions and view real on-chain state.
   - **Requirement 4 — Functional Demonstration of Core Modules:** Demonstrate live, real-time transaction workflows covering document upload, hashing, encryption, IPFS storage, on-chain registration, access sharing, verification, tamper detection, and revocation.
   - **Requirement 5 — Code Quality, Documentation and Review Progress:** Deliver exhaustive technical specifications, test matrices, setup manuals, and progress tracking.
2. **Strict Adherence to Real-Data Principles (`ai_rules.md`):** Eliminate all synthetic, simulated, or mock data. Every address, hash, CID, transaction, and verification state must originate from authentic user input, live cryptographic computation, IPFS API responses, and blockchain state.
3. **Preserve Architectural Scope:** Align directly with the architectural model established in the project presentation (`.pptx`) and master plan (`MASTER_PLAN.md`).

---

# 4. Proposed Solution

The proposed solution implements a multi-tiered decentralized document management platform structured into five conceptual layers:

```text
                            USER / CLIENT
                                  |
                                  v
+-------------------------------------------------------------------+
|                     1. PRESENTATION LAYER                         |
|  - Next.js (React Web App Framework)                             |
|  - Tailwind CSS (Utility-First Responsive UI)                     |
|  - ethers.js v6 (Web3 Provider & Contract Interaction)             |
|  - MetaMask (Cryptographic Key Management & Transaction Signing)  |
+---------------------------------+---------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  2. APPLICATION LAYER |                   |  3. BLOCKCHAIN LAYER  |
|  - Node.js & Express  |                   |  - Ethereum Network   |
|  - REST API Gateway   |                   |  - Solidity Contracts |
|  - Auth Challenge Svc |                   |    * DocumentRegistry |
|  - IPFS Proxy / Relay |                   |    * AccessControl    |
|  - AES-256-GCM Crypto |                   |    * IdentityRegistry |
+-----------+-----------+                   |  - Immutable Event Log|
            |                               +-----------+-----------+
            v                                           |
+-----------------------+                               |
| 4. DECENTRALIZED      |                               |
|    STORAGE            |                               |
|  - IPFS Network       |                               |
|  - Content Addressing |                               |
|  - Encrypted Pinning  |                               |
+-----------------------+                               |
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                 5. VERIFICATION & AUDIT LAYER                     |
|  - Client-Side SHA-256 Document Fingerprinting                    |
|  - Real-Time Hash Equivalence Check (< 2 seconds)                 |
|  - On-Chain Revocation Status Verification                        |
|  - Immutable Transaction Receipts & Event Lineage                 |
+-------------------------------------------------------------------+
```

### Strategic Operational Advantages
- **Cryptographic Tamper-Proofing:** Any single-bit alteration in an uploaded file completely shifts its SHA-256 digest, triggering an immediate on-chain mismatch.
- **Client-Side Data Privacy:** Unencrypted plaintext files never touch the network or IPFS.
- **Zero-Trust Independent Verification:** Anyone with authorized access can verify a document's authenticity against Ethereum without contacting issuing authorities.
- **Guaranteed High Availability:** Distributed IPFS and Ethereum nodes prevent denial-of-service outages.

---

# 5. Project Actors

The system strictly distinguishes between three functional actors:

### 5.1 Document Owner
- **Definition:** The sovereign individual or issuing organization holding the private key for the Ethereum wallet associated with a document's initial on-chain registration.
- **Capabilities & Permissions:**
  - Connects Web3 wallet (MetaMask) and signs cryptographic authentication challenges.
  - Registers identity on the decentralized identity registry.
  - Uploads physical/digital files for local hashing and encryption.
  - Submits on-chain transactions to register documents (`registerDocument`).
  - Grants access permissions to specific verifier Ethereum addresses (`grantAccess`).
  - Revokes access permissions previously granted (`revokeAccess`).
  - Immutably revokes an entire document registration on-chain (`revokeDocument`).
  - Inspects full immutable audit logs for owned documents.

### 5.2 Authorized Verifier / Recipient
- **Definition:** An external party (e.g., employer, university, financial institution, government agency) whose Ethereum wallet address has been granted active access permission by the document owner.
- **Capabilities & Permissions:**
  - Connects Web3 wallet (MetaMask) and authenticates identity.
  - Inspects on-chain metadata for shared documents (`hasAccess` returns `true`).
  - Fetches encrypted ciphertext from IPFS using the registered CID.
  - Decrypts authorized content using the shared document secret.
  - Performs instant cryptographic verification comparing the computed SHA-256 digest against the on-chain hash.

### 5.3 Unauthorized User
- **Definition:** Any party whose Ethereum address is neither the document owner nor an active grantee on the document's access list.
- **System Behavior:**
  - Blockchain smart contracts strictly reject read requests for restricted document metadata or secret pointers (`hasAccess` returns `false`).
  - Application APIs deny decryption keys and file relay services.
  - Rejection is enforced at the consensus/contract layer, not merely by hiding UI buttons.

> **CRITICAL RULE:** No synthetic, mock, or fake users shall be seeded into the runtime application. Actors are recognized solely by their active, live Ethereum wallet connections.

---

# 6. Functional Requirements

### FR-01: Web3 Wallet Connection & Network Validation
- The system must interface directly with MetaMask via standard EIP-1193 browser injection (`window.ethereum`).
- The system must validate the active Chain ID against the configured `CHAIN_ID` environment variable.
- If the connected network does not match the configured blockchain network, the system must halt operations and guide the user to switch networks.

### FR-02: Cryptographic Identity & DID Authentication
- The system must authenticate users via cryptographic challenge-response using Ethereum's `personal_sign` standard (EIP-191).
- The backend API must generate a cryptographically random, timestamped, single-use nonce challenge.
- The user must sign the nonce with their private key in MetaMask; the backend must recover the public address (`ethers.verifyMessage`) and issue a session token.
- The user must be capable of binding their address to a Decentralized Identifier (`did:ethr:<address>`) on-chain.

### FR-03: Real Document Upload & Client-Side SHA-256 Hashing
- The frontend must accept genuine user file uploads (PDF, PNG, JPEG, TXT) via drag-and-drop or file selector.
- The client must read the actual raw binary bytes using `FileReader` or `crypto.subtle`.
- The system must compute a 256-bit SHA-256 cryptographic digest of the file bytes.
- The hash computation must execute on actual file bytes; under no circumstances may a hash be mocked.

### FR-04: Client-Side AES-256-GCM Encryption
- Before transmission to IPFS, the document payload must be encrypted using AES-256-GCM (Galois/Counter Mode).
- A unique 256-bit symmetric key and a cryptographically secure 96-bit Initialization Vector (IV) must be generated per document.
- The resulting ciphertext and authentication tag must be packaged for storage. Plaintext bytes must never be transmitted across the network or stored on IPFS.

### FR-05: Real IPFS Storage & CID Generation
- The encrypted payload must be uploaded to a live IPFS node or pinning service (e.g., Pinata API or local IPFS daemon).
- The system must capture the authentic Content Identifier (CID v0 or v1) returned by the IPFS gateway.
- If the IPFS upload fails, the operation must abort, no CID shall be produced, and no on-chain transaction shall be submitted.

### FR-06: Smart Contract Document Registration
- The document owner must initiate an on-chain registration transaction through MetaMask invoking `DocumentRegistry.registerDocument`.
- Parameters stored on-chain must include: `documentId` (bytes32/uint256), `owner` (address), `cid` (string), `fileHash` (bytes32 / string), and `timestamp` (block timestamp).
- The smart contract must emit a `DocumentRegistered` event containing document parameters.
- Re-registering an identical document ID or registering by an unauthorized party must revert on-chain.

### FR-07: Real Transaction Confirmation & Receipt Display
- The UI must await the actual Ethereum transaction receipt after user confirmation in MetaMask.
- The UI must display genuine transaction metadata from the receipt: Transaction Hash, Block Number, Gas Used, and Confirmation Status.
- If the user rejects the transaction in MetaMask, the UI must report: *"Transaction rejected by user."*

### FR-08: Document Inventory & Empty State Display
- The UI must query `DocumentRegistry` for documents owned by or shared with the active wallet.
- If no documents exist on-chain for the address, the UI must display the explicit empty state: *"No documents registered yet."*
- Fabricating sample or dummy documents to fill the UI is strictly forbidden.

### FR-09: Smart-Contract Access Control & Sharing
- The document owner must be able to authorize an external Ethereum address by calling `AccessControl.grantAccess(documentId, verifierAddress)`.
- The contract must enforce that `msg.sender == owner`, set the permission flag to `true`, and emit an `AccessGranted` event.
- Only upon successful blockchain confirmation shall the UI reflect the updated sharing status.

### FR-10: Access Revocation
- The document owner must be able to revoke access from a previously authorized verifier by calling `AccessControl.revokeAccess(documentId, verifierAddress)`.
- The contract must update the authorization state to `false` and emit an `AccessRevoked` event.
- Subsequent calls to `hasAccess` for that verifier address must return `false`.

### FR-11: Document Revocation
- The document owner must be able to permanently invalidate a document record by calling `DocumentRegistry.revokeDocument(documentId)`.
- The contract must verify ownership, set `revoked = true`, and emit a `DocumentRevoked` event.
- Verification workflows for a revoked document must explicitly flag the document as REVOKED on-chain.

### FR-12: Cryptographic Document Verification
- A verifier uploading or inspecting a document must be able to trigger instant verification:
  1. The system computes the SHA-256 hash of the presented file.
  2. The system retrieves the authentic registered hash from `DocumentRegistry`.
  3. The system checks whether the document is marked as revoked.
  4. If the computed hash matches the on-chain hash and `revoked == false`, the status is displayed as **VERIFIED**.

### FR-13: Tamper Detection & Fraud Prevention
- If an inspected file has been modified by even one byte, its computed SHA-256 hash will differ from the on-chain record.
- The system must immediately flag the mismatch, halting verification and displaying: **"Verification failed. The current document does not match the hash registered on-chain. (TAMPER DETECTED)"**.

### FR-14: Immutable Blockchain Audit Trail
- The system must query authentic blockchain event logs (`DocumentRegistered`, `AccessGranted`, `AccessRevoked`, `DocumentRevoked`) filtered by `documentId`.
- The UI must render the sequential audit trail showing: Event Name, Triggering Address, Block Number, Transaction Hash, and Timestamp.
- If no events exist, the UI must display: *"No blockchain activity found."*

---

# 7. Non-Functional Requirements

### NFR-01: Absolute Non-Synthetic Data Rule (`ai_rules.md`)
- The system must never fabricate, simulate, mock, or hard-code application runtime data.
- Prohibited values include fake addresses, mock hashes, synthetic CIDs, mock blocks, fake transaction hashes, and simulated verification states.
- Every state must originate from a verified external source (MetaMask, Ethereum node, IPFS API, or local crypto engine).

### NFR-02: Performance & Verification Latency
- Document integrity verification must complete within **2 seconds** under normal network conditions, matching the benchmark established in the project presentation.
- Client-side hashing and encryption operations for files under 25 MB must execute in under 1 second.

### NFR-03: Security & Cryptographic Robustness
- Encryption algorithms must conform to industry standards: AES-256-GCM with secure 96-bit IVs and 128-bit authentication tags.
- Integrity verification must use NIST-standard SHA-256.
- Private keys and mnemonic seed phrases must never be accessible to the application; signing occurs exclusively within the isolated sandbox of MetaMask.

### NFR-04: Decentralization & Availability
- Document availability must not rely on any single centralized database.
- Document content is pinned across IPFS; metadata and access rights are maintained across Ethereum nodes via consensus.

### NFR-05: Usability & User Feedback
- The UI must provide real-time status transitions: *Awaiting Wallet Signature*, *Transaction Pending on Blockchain*, *Confirmed in Block #X*, *IPFS Uploading*, etc.
- All technical identifiers (hashes, CIDs, addresses) must be clearly presented with copy-to-clipboard functionality and direct links to block explorers.

### NFR-06: Fail-Closed Fault Tolerance
- All modules must fail closed: if any cryptographic check, network request, or contract call fails, the transaction is rejected, access is denied, and verification fails.

---

# 8. External Service Requirements

The application integrates with three primary external services:

| Service Category | Development Environment | Public Demonstration Environment | Integration Method | Purpose |
|---|---|---|---|---|
| **Blockchain Network** | Local Ethereum Node (configured via `RPC_URL`, `CHAIN_ID`) | Ethereum Sepolia Testnet (configured via `RPC_URL`, `CHAIN_ID`) | JSON-RPC via `ethers.js` Provider | Smart contract execution, state storage, event logging |
| **Decentralized Storage** | Configured IPFS Node (via `IPFS_API_URL`) | Pinata IPFS Pinning Service (via `IPFS_API_URL`) | REST API / `ipfs-http-client` | Pinning and retrieval of AES-256-GCM encrypted document blobs |
| **Web3 Wallet** | MetaMask Browser Extension | MetaMask Browser Extension | Browser Extension Window Injection (`window.ethereum`) | User account custody, challenge signing, transaction approval |

### Environment Configuration Standards
All external endpoints and server credentials must be loaded via process environment variables (`.env`). Secrets must never be hard-coded into repository source files. A sanitized `.env.example` must define required configuration keys:
```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=

CONTRACT_ADDRESS=
CONTRACT_NETWORK=
```

---

# 9. API Requirements

The project implements a dedicated Node.js and Express REST API gateway to coordinate authentication, IPFS communication, and audit queries:

```text
/api
|
+-- /auth
|   +-- POST /challenge       (Generates a timestamped cryptographic challenge nonce)
|   +-- POST /verify          (Validates ECDSA signature and returns session token)
|
+-- /ipfs
|   +-- POST /upload          (Receives encrypted blob, pins to IPFS, returns authentic CID)
|   +-- GET  /:cid            (Streams encrypted blob from IPFS)
|
+-- /documents
|   +-- GET  /                (Lists documents associated with authenticated wallet)
|   +-- GET  /:id             (Fetches metadata and access authorization for a document)
|
+-- /verify
|   +-- POST /                (Accepts file hash and compares against on-chain contract state)
|
+-- /audit
    +-- GET  /:documentId     (Queries on-chain event logs for historical lifecycle events)
```

> **PHASE 1 SCOPE BOUNDARY:** The API architecture is strictly specified herein. No backend API code shall be implemented during Phase 1. No API keys or credentials shall be generated or requested in this phase.

---

# 10. Smart Contract Requirements

The smart contract layer is partitioned into three decoupled Solidity contracts:

### 10.1 `DocumentRegistry.sol`
- **Purpose:** Core catalog of registered documents, ownership mappings, and lifecycle status.
- **State Data:**
  - `mapping(bytes32 => Document) public documents;`
  - `mapping(address => bytes32[]) private userDocuments;`
- **Functions:**
  - `registerDocument(bytes32 docId, string calldata cid, bytes32 fileHash)`: Registers a new document. Reverts if `docId` already exists. Stores `msg.sender`, `block.timestamp`, and sets `revoked = false`.
  - `getDocument(bytes32 docId) external view returns (address owner, string memory cid, bytes32 fileHash, uint256 timestamp, bool revoked)`: Returns document metadata.
  - `revokeDocument(bytes32 docId) external`: Restricts caller to document owner. Sets `revoked = true`.
- **Events:**
  - `event DocumentRegistered(bytes32 indexed docId, address indexed owner, string cid, bytes32 fileHash, uint256 timestamp);`
  - `event DocumentRevoked(bytes32 indexed docId, address indexed owner, uint256 timestamp);`

### 10.2 `AccessControl.sol`
- **Purpose:** Granular, address-based permission management for shared documents.
- **State Data:**
  - `mapping(bytes32 => mapping(address => bool)) private documentAccess;`
- **Functions:**
  - `grantAccess(bytes32 docId, address verifier)`: Grants permission to `verifier`. Enforces that `msg.sender` is document owner (via `DocumentRegistry`).
  - `revokeAccess(bytes32 docId, address verifier)`: Revokes permission from `verifier`. Enforces caller is owner.
  - `hasAccess(bytes32 docId, address verifier) external view returns (bool)`: Returns `true` if `verifier == owner` OR `documentAccess[docId][verifier] == true`.
- **Events:**
  - `event AccessGranted(bytes32 indexed docId, address indexed owner, address indexed verifier, uint256 timestamp);`
  - `event AccessRevoked(bytes32 indexed docId, address indexed owner, address indexed verifier, uint256 timestamp);`

### 10.3 `IdentityRegistry.sol`
- **Purpose:** Associates Ethereum wallet addresses with Decentralized Identifiers (DIDs) and status flags.
- **State Data:**
  - `mapping(address => Identity) public identities;`
- **Functions:**
  - `registerIdentity(string calldata didURI)`: Binds `msg.sender` to a valid DID string (`did:ethr:...`).
  - `getIdentity(address user) external view returns (string memory didURI, bool active, uint256 registeredAt)`: Retrieves identity record.
  - `deactivateIdentity()`: Allows a user to deactivate their identity entry.
- **Events:**
  - `event IdentityRegistered(address indexed user, string didURI, uint256 timestamp);`
  - `event IdentityDeactivated(address indexed user, uint256 timestamp);`

> **PHASE 1 SCOPE BOUNDARY:** Smart contracts are specified here but will be implemented and tested in Phase 3.

---

# 11. Data Model Requirements

### 11.1 On-Chain Data Model (Solidity Storage)
```solidity
struct Document {
    bytes32 id;           // Unique document identifier (e.g., keccak256(owner, timestamp, salt))
    address owner;        // Ethereum wallet address of document owner
    string cid;           // IPFS Content Identifier of AES-256-GCM encrypted payload
    bytes32 fileHash;     // SHA-256 digest of original plaintext document
    uint256 createdAt;    // Block timestamp of registration
    bool revoked;         // Invalidation flag (true = revoked)
}

struct Identity {
    address walletAddress; // Associated Ethereum address
    string didURI;         // W3C-compliant DID string (did:ethr:<address>)
    bool active;           // Current validity status
    uint256 registeredAt;  // Registration block timestamp
}
```

### 11.2 Strictly Prohibited On-Chain Data
To prevent blockchain bloat, privacy leaks, and catastrophic security breaches, the following data must **NEVER** be stored on-chain:
- Raw document files (PDFs, images, office documents).
- Plaintext unencrypted document content.
- Symmetric document encryption keys (AES keys).
- User wallet private keys or mnemonic seed phrases.
- Passwords or sensitive personal identity numbers (SSN, Aadhaar, PAN).

---

# 12. Security Requirements

The application enforces a multi-layer defense-in-depth security model:

```text
+-----------------------+------------------------+------------------------------------------+
| Security Objective    | Technology Enforcing   | Functional Role                          |
+-----------------------+------------------------+------------------------------------------+
| Data at Rest          | AES-256-GCM            | High-grade client-side file encryption   |
| Data Integrity        | SHA-256 Hashing        | Cryptographic tamper & bit-flip detection|
| Access Governance     | Solidity Smart Contract| On-chain ownership & permission rules    |
| Immutable Audit Log   | Ethereum Event Logs    | Tamper-proof, append-only event trail    |
| Identity Verification | Web3 Wallet Signatures | ECDSA cryptographic challenge-response   |
| Fault-Tolerant Storage| IPFS Network           | Decentralized content-addressed storage  |
+-----------------------+------------------------+------------------------------------------+
```

### Key Management Boundary
- **Separation of Concerns:** Blockchain handles *authorization* (who has permission). Cryptographic algorithms handle *confidentiality* (who can decrypt).
- The raw symmetric key for a document must never be stored on-chain or published to public IPFS.
- Key sharing between owner and verifier must be handled out-of-band or via asymmetric public-key encryption (ECIES / RSA) directed to the verifier's public key.

---

# 13. Error Handling & Fail-Closed Requirements

The system mandates strict **fail-closed** behavior: any failure in an external dependency or validation check must abort the operation, present an honest error message, and produce zero fabricated data.

| Failure Condition | System Action | User-Facing Message |
|---|---|---|
| **Wallet Not Installed / Injected** | Disable Web3 actions; render connection banner | *"MetaMask is not installed. Please install MetaMask to interact with the blockchain."* |
| **Wallet Disconnected** | Block protected routes; show connect trigger | *"Wallet not connected."* |
| **Signature Challenge Rejected** | Abort authentication; clear pending session | *"Authentication signature was rejected. Access denied."* |
| **Unsupported Blockchain Network** | Prevent contract calls; display prompt | *"Unsupported network. Please switch MetaMask to the configured network (matching CHAIN_ID)."* |
| **Blockchain Node Unreachable** | Halt blockchain operations; log error | *"Blockchain RPC service unreachable. Please ensure your node is running."* |
| **User Rejects Transaction in Wallet**| Abort transaction flow; no state change | *"Transaction rejected by user."* |
| **Blockchain Transaction Reverts** | Parse EVM revert reason; display error | *"Transaction reverted by smart contract: [Reason]"* |
| **IPFS Gateway / Node Offline** | Abort upload; do not invoke smart contract | *"IPFS service unavailable. Document upload aborted."* |
| **IPFS Upload Error** | Abort registration workflow; do not invent CID | *"Document upload to IPFS failed. No CID was generated. The document was not registered on-chain."* |
| **Decryption Failure** | Abort verification; do not render plaintext | *"Unable to decrypt document. Authentication tag mismatch or invalid key."* |
| **SHA-256 Hash Mismatch** | Flag tamper attempt; mark verification failed | *"Verification failed. The current document does not match the hash registered on-chain."* |
| **Document Marked Revoked** | Flag revoked state; reject validity | *"Document has been permanently revoked by its owner on-chain."* |
| **Zero Documents in Wallet** | Render clean empty state; no dummy records | *"No documents registered yet."* |
| **Zero Audit Events for Document** | Render clean empty state; no dummy events | *"No blockchain activity found."* |

---

# 14. Real-Data & Provenance Requirements

Every runtime data point displayed in the frontend user interface must be traceable to an authentic system source:

| Runtime UI Field | Genuine Data Source | Validation / Provenance Mechanism |
|---|---|---|
| **Connected Wallet Address** | MetaMask (`eth_requestAccounts`) | EIP-1193 active address |
| **User Identity / DID** | `IdentityRegistry.sol` / Signature verification | ECDSA public key recovery |
| **Document Binary Bytes** | Actual user file uploaded in browser | Browser `File` API |
| **Document SHA-256 Digest** | Computed live from file bytes via Web Crypto API | Cryptographic hash calculation |
| **Encrypted File Payload** | Generated live via AES-256-GCM cipher | Cryptographic encryption output |
| **IPFS CID** | Live IPFS upload response header/body | IPFS node multihash generation |
| **Document Owner Address** | `DocumentRegistry.sol` contract state | EVM storage lookup |
| **Registered File Hash** | `DocumentRegistry.sol` contract state | EVM storage lookup |
| **Access Authorization State** | `AccessControl.sol` contract state | EVM storage lookup |
| **Revocation Flag** | `DocumentRegistry.sol` contract state | EVM storage lookup |
| **Transaction Hash** | Ethereum transaction submission receipt | Node transaction receipt |
| **Block Number & Timestamp** | Ethereum mined block header | Node block header |
| **Audit Log Entries** | Ethereum contract event logs (`eth_getLogs`) | Mined transaction event receipts |
| **Verification Outcome** | Programmatic comparison: computed hash == on-chain hash | Local equivalence calculation |

---

# 15. In-Scope Features (Core Implementation)

The core project scope encompasses the following 32 functional features:

1. Web3 wallet connection via MetaMask.
2. Cryptographic signature challenge-response authentication (`personal_sign`).
3. DID-oriented on-chain identity registry.
4. Genuine file upload module supporting common formats (PDF, PNG, JPEG, TXT).
5. Client-side SHA-256 cryptographic document hashing.
6. Client-side AES-256-GCM document encryption.
7. Encrypted document transmission and pinning to a live IPFS node.
8. Generation and capture of genuine IPFS CIDs.
9. Modular Solidity smart contracts deployed on Ethereum.
10. On-chain document registration.
11. On-chain document ownership assignment.
12. On-chain smart-contract access control.
13. Document sharing with specified Ethereum addresses.
14. Real-time access revocation by document owner.
15. Instant blockchain-based document verification.
16. Cryptographic hash comparison against on-chain records.
17. Real-time tamper detection for altered documents.
18. Permanent on-chain document revocation.
19. Append-only blockchain event emission for all lifecycle actions.
20. Dedicated Node.js & Express REST API gateway.
21. Modern, responsive Next.js frontend with Tailwind CSS.
22. Frontend-blockchain integration via `ethers.js` v6.
23. MetaMask user transaction approval flow.
24. Submission of real blockchain write transactions.
25. Capture and presentation of authentic mined transaction receipts.
26. Real-time retrieval of on-chain document and access states.
27. Comprehensive error handling with fail-closed safeguards.
28. Honest empty states for zero-data views.
29. UI data provenance indicators.
30. Complete end-to-end demonstrable verification workflow.
31. Automated test suites for smart contracts and cryptographic utilities.
32. Technical documentation and requirements traceability.

---

# 16. Future / Out-of-Scope Features

The following items, identified in the project presentation roadmap or secondary literature, are explicitly designated as **Future Scope** and are **NOT** part of the core implementation:

1. **Native Mobile Applications:** iOS/Android standalone apps (Core focuses on responsive desktop/tablet Web3 browser interface).
2. **FIDO2 / WebAuthn Biometric Authentication:** Hardware security keys/biometric WebAuthn (Core uses standard Web3 wallet signatures).
3. **ZK-SNARK / Zero-Knowledge Proof Implementations:**
   > *Clarification:* Standard SHA-256 hash comparison against a blockchain hash verifies integrity but is mathematically **NOT** a zero-knowledge proof. True ZK-SNARK circuits (e.g., Groth16, Circom) for selective credential attribute disclosure without revealing the document hash are deferred to future milestones.
4. **Institutional REST API Ecosystem:** Enterprise partner integration bridges and B2B SaaS billing.
5. **Cross-Chain Interoperability:** Bridges to secondary Layer-2 chains (Polygon, Arbitrum, Optimism).
6. **AI-Powered Fraud & Anomaly Detection:** Machine learning inference models for pre-registration document forgery analysis.

---

# 17. Final Demonstration Requirements

The final project review requires a live, synchronous demonstration of the end-to-end real-data workflow:

1. **Wallet Connection:** Connect MetaMask with an active local or testnet account.
2. **Identity Authentication:** Sign the challenge nonce to authenticate.
3. **Document Ingestion:** Select and upload a genuine sample document (e.g., `Degree_Certificate.pdf`).
4. **Hashing & Encryption:** The UI computes the SHA-256 digest and performs AES-256-GCM encryption in real time.
5. **IPFS Pinning:** The encrypted file is uploaded to IPFS; the live CID (e.g., `Qm...`) is received and rendered.
6. **On-Chain Registration:** MetaMask prompts for transaction signature to register the document on `DocumentRegistry.sol`.
7. **Transaction Confirmation:** The transaction is mined; the UI renders the real transaction hash and block number.
8. **Document Inventory:** The document appears in the user's dashboard with authentic on-chain metadata.
9. **Access Sharing:** The owner grants access to a second verifier Ethereum address via `AccessControl.grantAccess`.
10. **Verifier Inspection:** Switching to the verifier's wallet in MetaMask reflects authorized access in the UI.
11. **Successful Verification:** The verifier inspects the document; the system verifies hash equivalence and reports **VERIFIED (< 2s)**.
12. **Tamper Demonstration:** The presenter alters a single byte or character in the document and attempts verification.
13. **Tamper Detection:** The system flags the mismatch and outputs **"Verification failed: TAMPER DETECTED"**.
14. **Access Revocation:** The owner revokes the verifier's access via `AccessControl.revokeAccess`.
15. **Enforcement Check:** The verifier attempts to access the document; the contract denies access (`hasAccess == false`).
16. **Document Revocation:** The owner calls `revokeDocument`; the document is permanently marked revoked.
17. **Audit Trail Verification:** The UI displays the full, chronological list of emitted blockchain events confirming every step.

---

# 18. Acceptance Criteria

Phase 1 is complete only when the following criteria are verified:

- [x] `ai_rules.md` read and incorporated as a mandatory policy.
- [x] `MASTER_PLAN.md` thoroughly analyzed and integrated.
- [x] Mandatory requirements image inspected and preserved at `docs/mandatory-requirements.png`.
- [x] Project presentation (`.pptx`) thoroughly reviewed and aligned.
- [x] Project scope frozen with distinct core vs. future boundaries.
- [x] Functional actors and role permissions defined.
- [x] Complete functional requirements (FR-01 to FR-14) defined.
- [x] Non-functional requirements (NFR-01 to NFR-06) defined.
- [x] External service configurations and boundaries established.
- [x] Custom API structure documented.
- [x] Smart contract architectures and interface specifications defined.
- [x] Source-of-truth and data-provenance matrices established.
- [x] Fail-closed error handling and empty-state rules specified.
- [x] Multi-layer security model documented.
- [x] 21-step final demonstration script established.
- [x] Traceability matrix created in `docs/requirements-traceability.md`.
- [x] Zero application implementation code (Solidity, Next.js, Express) created in Phase 1.
- [x] Zero API keys or secrets committed or generated.
- [x] Zero synthetic, mock, or fake application data created.
