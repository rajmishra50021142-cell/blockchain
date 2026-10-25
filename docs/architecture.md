# System Architecture & Data Flow
# Blockchain-Based Digital Document Locker

> **Document Status:** Frozen (Phase 2 Architecture Baseline)  
> **Document Version:** 1.0.0  
> **Phase Target:** Phase 2 of 16 (System Architecture & Data Flow)  
> **Governing Standards:** `ai_rules.md` (Non-Synthetic Data Policy), `MASTER_PLAN.md`, `PHASE_2_PROMPT.md`, `docs/requirements.md`

---

# 1. Architecture Overview

The **Blockchain-Based Digital Document Locker** is a decentralized, tamper-evident, sovereign digital document storage and verification system. Designed as an institutional-grade, zero-trust alternative to centralized repositories (such as the traditional DigiLocker), this platform integrates:
- **Decentralized Storage:** InterPlanetary File System (IPFS) for content-addressed distributed file persistence.
- **Client-Side Cryptography:** Deterministic SHA-256 hashing for file integrity and AES-256-GCM authenticated encryption for confidentiality.
- **Consensus-Driven State Machine:** Modular Ethereum smart contracts managing document registration, sovereign ownership, and granular access control.
- **Web3 Identity:** EIP-191 cryptographic signatures and Decentralized Identifier (`did:ethr`) identity bindings.
- **Immutable Auditability:** Native EVM event logs providing a transparent, append-only historical audit trail.

### High-Level System Architecture Diagram
```mermaid
graph TD
    User([Real User / Client]) -->|EIP-1193 / Web3| MM[MetaMask Browser Wallet]
    User -->|Direct Interaction| FE[Next.js + Tailwind CSS UI]
    FE <-->|ethers.js v6| MM
    
    subgraph Presentation_Layer [Presentation Layer]
        FE
        MM
    end
    
    subgraph Application_Layer [Application Layer - Node.js / Express]
        API[Custom REST API Gateway]
        AuthSvc[Auth Challenge Service]
        IPFSRelay[IPFS Relay & Pinning Service]
        VerifySvc[Verification Orchestrator]
    end
    
    subgraph Storage_Layer [Decentralized Storage Layer]
        IPFS[(IPFS Node / Cluster)]
    end
    
    subgraph Blockchain_Layer [Blockchain Layer - Ethereum / EVM]
        DocReg[DocumentRegistry.sol]
        AccessCtrl[AccessControl.sol]
        IdReg[IdentityRegistry.sol]
        EventLogs[(Immutable EVM Event Logs)]
    end
    
    FE -->|HTTP / JSON-RPC| API
    FE -->|User-Signed Tx Writes & Direct Reads| DocReg
    FE -->|User-Signed Tx Writes & Direct Reads| AccessCtrl
    FE -->|User-Signed Tx Writes & Direct Reads| IdReg
    
    API --> IPFSRelay
    IPFSRelay <-->|Encrypted Ciphertext| IPFS
    
    DocReg -.->|Emits Lifecycle Events| EventLogs
    AccessCtrl -.->|Emits Access Events| EventLogs
    IdReg -.->|Emits Identity Events| EventLogs
```

---

# 2. System Objectives

The architecture satisfies four primary system objectives:

1. **Absolute Data Integrity & Immediate Tamper Detection:**
   Every registered document is fingerprinted client-side with SHA-256 before encryption. The resulting digest is stored in Ethereum immutable storage. Any mutation of a single bit in a file changes its digest, triggering an immediate on-chain mismatch (`TAMPER DETECTED`).
2. **Strict Client-Side Confidentiality (Zero-Knowledge Storage):**
   Raw plaintext files never leave the client's browser unencrypted. Files are symmetrically encrypted using AES-256-GCM with a unique 256-bit key and 96-bit initialization vector (IV) per file. IPFS nodes and transport relays process only ciphertext.
3. **Sovereign Ownership & Decentralized Access Control:**
   Document owners possess exclusive authority to grant, query, or revoke access to their documents via smart contracts. Authorization decisions are enforced at EVM consensus, eliminating trusted administrative middlemen.
4. **Strict Real-Data Provenance & Zero Synthetic Fallbacks (`ai_rules.md`):**
   Every runtime value (addresses, hashes, CIDs, transaction receipts, block numbers, verification outcomes) is derived from authentic user actions, local Web Crypto computations, live IPFS node responses, or Ethereum provider calls. No mock, synthetic, or fallback data is permitted.

---

# 3. Layered Architecture

The system is decomposed into five distinct operational tiers:

```mermaid
graph TB
    subgraph Layer_1 [1. Presentation Layer]
        L1_UI[Next.js App Router / React Components]
        L1_CSS[Tailwind CSS Design Tokens]
        L1_ETH[ethers.js v6 Web3 Provider]
        L1_MM[MetaMask Wallet / Key Custody]
    end

    subgraph Layer_2 [2. Application Layer]
        L2_API[Express.js REST Gateway]
        L2_SEC[Security Middleware: CORS, Helmet, RateLimiter]
        L2_AUTH[Auth Challenge & Signature Validator]
        L2_IPFS[IPFS Proxy Service]
    end

    subgraph Layer_3 [3. Blockchain Layer]
        L3_EVM[Ethereum Network: Local Hardhat / Sepolia Testnet]
        L3_DOC[DocumentRegistry.sol]
        L3_ACC[AccessControl.sol]
        L3_ID[IdentityRegistry.sol]
    end

    subgraph Layer_4 [4. Decentralized Storage Layer]
        L4_NODE[IPFS Daemon / Pinning Gateway]
        L4_ENC[Content-Addressed Encrypted Blobs]
    end

    subgraph Layer_5 [5. Verification & Audit Layer]
        L5_HASH[Client-Side SHA-256 Hasher]
        L5_VER[Hash Equivalence Engine]
        L5_REV[Revocation Evaluator]
        L5_LOG[EVM Event Log Aggregator]
    end

    Layer_1 --> Layer_2
    Layer_1 --> Layer_3
    Layer_2 --> Layer_4
    Layer_3 --> Layer_5
    Layer_4 --> Layer_5
```

### Layer Responsibilities
- **1. Presentation Layer:** Renders the responsive UI, executes client-side cryptographic hashing and encryption (`window.crypto.subtle`), manages user wallet session state, requests MetaMask user signatures for state-changing transactions, and displays honest empty and error states.
- **2. Application Layer:** Provides auxiliary off-chain services: issues single-use cryptographic challenge nonces for session establishment, validates EIP-191 signatures, relays encrypted payloads to the IPFS daemon, and filters event logs for the audit UI.
- **3. Blockchain Layer:** The single source of truth for document ownership, immutable SHA-256 hashes, IPFS CIDs, access permissions, revocation flags, and chronological event logging.
- **4. Decentralized Storage Layer:** Highly available, peer-to-peer storage retaining encrypted document blobs pinned across network nodes.
- **5. Verification & Audit Layer:** Evaluates file validity in real time (< 2s) by comparing client-computed digests against on-chain records, checking revocation status, and reconstructing audit trails from on-chain event logs.

---

# 4. Component Architecture

The component architecture isolates domain responsibilities across frontend modules, backend micro-services, and smart contracts:

```mermaid
graph LR
    subgraph Client_Components [Frontend Components]
        WC[WalletConnect]
        UP[UploadDocument]
        DL[DocumentList]
        SH[ShareDocument]
        VF[VerifyDocument]
        AT[AuditTimeline]
    end

    subgraph Core_Services [Backend Core Services]
        AS[auth.service]
        IS[ipfs.service]
        VS[verification.service]
        BS[blockchain.service]
    end

    subgraph Smart_Contracts [Solidity Contracts]
        DR[DocumentRegistry]
        AC[AccessControl]
        IR[IdentityRegistry]
    end

    WC --> AS
    UP --> IS
    UP --> DR
    DL --> DR
    SH --> AC
    VF --> VS
    VS --> DR
    VS --> AC
    AT --> BS
    BS --> DR
    BS --> AC
```

---

# 5. Frontend Architecture

The frontend is constructed using Next.js, Tailwind CSS, and `ethers.js` v6. It interfaces directly with MetaMask via standard EIP-1193 provider injection (`window.ethereum`).

### Component Inventory & Architectural Boundaries
The architecture defines the following minimum set of frontend components:

1. **`WalletConnect`:** Detects MetaMask extension, prompts user account access (`eth_requestAccounts`), tracks active account changes, and validates network Chain ID.
2. **`Authentication/Signature UI`:** Triggers `POST /api/auth/challenge`, presents challenge to user, requests EIP-191 `personal_sign` in MetaMask, and submits signature to `/api/auth/verify`.
3. **`Dashboard`:** Main container orchestrating views based on connection state, document loading, and user interactions.
4. **`DocumentList`:** Queries `DocumentRegistry` for the connected address and renders registered document entries.
5. **`DocumentCard`:** Displays single document metadata: ID, owner, CID link, timestamp, and active status badges.
6. **`UploadDocument`:** Accepts genuine user files (drag-and-drop or file selector) and passes binary bytes to hashing and encryption modules.
7. **`EncryptionStatus`:** Visual indicator displaying real-time cryptographic execution: SHA-256 calculation and AES-256-GCM symmetric key/IV generation.
8. **`UploadStatus`:** Visual indicator monitoring the progress of ciphertext payload transmission to the IPFS relay.
9. **`TransactionStatus`:** Live transaction tracker displaying pending submission, MetaMask prompt, broadcast hash, and mined block confirmation.
10. **`DocumentDetails`:** Expanded view providing granular document inspection, on-chain properties, and action buttons.
11. **`ShareDocument`:** Modal dialog permitting the document owner to enter an external verifier address and submit `AccessControl.grantAccess`.
12. **`AccessManagement`:** Table of currently authorized verifier addresses with controls to invoke `AccessControl.revokeAccess`.
13. **`VerifyDocument`:** Interface allowing users or verifiers to select an uploaded document to verify its cryptographic integrity.
14. **`VerificationResult`:** Real-time outcome visualizer showing **VERIFIED** (< 2s latency), **TAMPER DETECTED**, or **REVOKED ON-CHAIN**.
15. **`AuditTimeline`:** Chronological visualizer presenting historical lifecycle events queried from Ethereum event logs.
16. **`IdentityView`:** Displays the connected wallet's Decentralized Identifier (`did:ethr:<address>`) and registration status from `IdentityRegistry.sol`.
17. **`ErrorState`:** Fail-closed alert banners presenting honest error messages without synthetic fallbacks.
18. **`EmptyState`:** Clean empty-state views displaying honest notices such as *"No documents registered yet"* or *"No blockchain activity found"*.

---

# 6. Backend Architecture

The backend is organized as a modular Node.js/Express service written in TypeScript:

```text
backend/
└── src/
    ├── routes/             # REST route declarations
    ├── controllers/        # Request parsing and service invocation
    ├── services/           # External service integration and domain logic
    ├── middleware/         # Validation, rate limiting, and security controls
    └── server.ts           # HTTP server bootstrapping
```

### Component Responsibilities
- **Routes:** Expose application endpoints (`/api/auth`, `/api/ipfs`, `/api/documents`, `/api/verify`, `/api/audit`).
- **Controllers:** Translate HTTP request bodies, query params, and headers into service calls and serialize standard JSON responses.
- **Services:**
  - `auth.service.ts`: Generates single-use cryptographic challenge nonces with 5-minute TTL; verifies ECDSA signatures via `ethers.verifyMessage`; issues JWT session tokens.
  - `blockchain.service.ts`: Read-only `ethers.JsonRpcProvider` connection for contract state queries (`getDocument`, `hasAccess`) and event filter queries (`queryFilter`).
  - `ipfs.service.ts`: Streams client-encrypted ciphertext blobs to the IPFS daemon (`/api/v0/add`) and fetches pinned blocks by CID (`/api/v0/cat`).
  - `verification.service.ts`: Performs server-side verification comparison against on-chain contract state and benchmarks verification latency.
- **Middleware:**
  - Request schema validation (Zod / Joi).
  - Error normalization ensuring fail-closed responses.
  - JWT token verification and address extraction.
  - Security controls: Helmet HTTP headers, CORS whitelisting, and Express rate limiting.

---

# 7. Blockchain Architecture

The blockchain layer comprises three decoupled Solidity smart contracts compiled with `^0.8.20` or higher:

```mermaid
classDiagram
    class DocumentRegistry {
        +mapping(bytes32 => Document) documents
        +mapping(address => bytes32[]) userDocuments
        +registerDocument(bytes32 docId, string cid, bytes32 fileHash)
        +getDocument(bytes32 docId) Document
        +getUserDocuments(address user) bytes32[]
        +revokeDocument(bytes32 docId)
        +isRevoked(bytes32 docId) bool
        +event DocumentRegistered(bytes32 docId, address owner, string cid, bytes32 fileHash, uint256 timestamp)
        +event DocumentRevoked(bytes32 docId, address owner, uint256 timestamp)
    }

    class AccessControl {
        +DocumentRegistry registry
        +mapping(bytes32 => mapping(address => bool)) documentAccess
        +grantAccess(bytes32 docId, address verifier)
        +revokeAccess(bytes32 docId, address verifier)
        +hasAccess(bytes32 docId, address verifier) bool
        +event AccessGranted(bytes32 docId, address owner, address verifier, uint256 timestamp)
        +event AccessRevoked(bytes32 docId, address owner, address verifier, uint256 timestamp)
    }

    class IdentityRegistry {
        +mapping(address => Identity) identities
        +registerIdentity(string didURI)
        +getIdentity(address user) Identity
        +deactivateIdentity()
        +event IdentityRegistered(address user, string didURI, uint256 timestamp)
        +event IdentityDeactivated(address user, uint256 timestamp)
    }

    AccessControl --> DocumentRegistry : Reads Owner & Revocation State
```

### Contract Responsibilities
- **`IdentityRegistry.sol`:**
  - Identity registration: Binds `msg.sender` to a W3C-compliant DID URI (`did:ethr:<address>`).
  - Identity retrieval: Returns DID metadata, registration timestamp, and active boolean.
  - Identity updates: Allows a user to update their associated DID URI.
  - Identity deactivation: Allows a user to deactivate their identity entry.
  - Wallet-to-identity association: Preserves 1-to-1 mapping between address and DID.
- **`DocumentRegistry.sol`:**
  - Document registration: Stores `id`, `owner` (`msg.sender`), `cid`, `fileHash`, and block `timestamp`.
  - Document retrieval: Returns document struct by `docId`.
  - Ownership: Enforces that registration records cannot be overwritten by other parties.
  - Document revocation: Restricts `revokeDocument` to `msg.sender == owner`, setting `revoked = true`.
- **`AccessControl.sol`:**
  - Document permissions: Maintains `documentAccess[docId][verifier]` mapping.
  - Grant access: Owner authorizes an external address (`grantAccess`).
  - Revoke access: Owner removes authorization (`revokeAccess`).
  - Access checks: `hasAccess` returns `true` if `verifier == owner` OR `documentAccess[docId][verifier] == true`, provided document is not revoked.
  - Owner authorization: Only the verified document owner can grant or revoke access.

---

# 8. IPFS Architecture

The InterPlanetary File System (IPFS) serves as the decentralized, content-addressed storage tier:

```mermaid
graph LR
    subgraph Client
        Raw[Plaintext Document] -->|AES-256-GCM| EncBlob[Encrypted Payload + IV + Tag]
    end
    
    subgraph Network_Relay
        EncBlob -->|POST /api/ipfs/upload| Relay[IPFS Service Proxy]
    end
    
    subgraph IPFS_Cluster
        Relay -->|UnixFS Chunking & Pinning| Node[IPFS Node Daemon]
        Node --> CID[Real Content Identifier: Qm... / bafy...]
    end
    
    CID -->|Return to Client| Client
    CID -->|Store on Blockchain| DocReg[DocumentRegistry.sol]
```

### Invariants & Ingestion Pipeline
- **Ciphertext Only:** Only AES-256-GCM encrypted payloads containing ciphertext, 12-byte IV, and 16-byte authentication tag are sent to IPFS.
- **Content Addressing:** Files are chunked according to UnixFS format, producing authentic Multihash Content Identifiers (CID v0 or v1).
- **Fail-Closed Upload:** If the IPFS daemon fails or is offline, upload terminates with an honest error. No CID is generated, and on-chain registration is halted.

---

# 9. Cryptography Architecture

The cryptographic subsystem enforces strict separation between data integrity and data confidentiality:

```mermaid
graph TD
    File[Plaintext Document File Bytes]
    
    subgraph Integrity_Engine [Integrity Fingerprint]
        File -->|NIST SHA-256| Hash[File Digest: 32 bytes]
        Hash -->|Immutable On-Chain Anchor| Eth[DocumentRegistry.sol]
    end
    
    subgraph Confidentiality_Engine [Confidentiality Vault]
        File -->|AES-256-GCM| Cipher[Encrypted Ciphertext Blob]
        KeyGen[Generate Unique 256-bit Key & 96-bit IV] --> Cipher
        Cipher -->|Public Content Addressing| IPFS_Store[IPFS Pinning]
    end
    
    subgraph Key_Management [Key Separation Model]
        KeyGen -.->|Transferred via secure key exchange| Grantee[Authorized Verifier]
        Eth -.->|Authorizes Verifier Address| Grantee
    end
```

### Operational Separation
- **SHA-256 Hashing:** Computed client-side on raw unencrypted file bytes. Generates a 256-bit deterministic fingerprint stored on-chain for tamper detection.
- **AES-256-GCM Encryption:** Executed client-side with a unique 256-bit symmetric key and 96-bit IV per file. Produces ciphertext and a 128-bit authentication tag.
- **Key Separation:** Blockchain handles *authorization* (`hasAccess`). Cryptographic keys handle *decryption*. The raw symmetric key is **never** stored on-chain or published unencrypted to IPFS.

---

# 10. Identity / Wallet Architecture

Identity verification follows the Web3 Decentralized Identifier model anchored to user-held Ethereum private keys:

```mermaid
sequenceDiagram
    autonumber
    actor User as Real User
    participant MM as MetaMask
    participant FE as Next.js Frontend
    participant API as Backend Auth API
    participant IR as IdentityRegistry.sol

    User->>FE: Click "Connect Wallet"
    FE->>MM: eth_requestAccounts
    MM-->>FE: Return active address (0xOwner...)
    FE->>API: POST /api/auth/challenge { address }
    API-->>FE: Return timestamped nonce challenge
    FE->>MM: personal_sign(nonce, address)
    MM-->>User: Prompt signature confirmation
    User->>MM: Approve signature
    MM-->>FE: Return ECDSA signature (0xSig...)
    FE->>API: POST /api/auth/verify { address, signature }
    API->>API: ethers.verifyMessage(nonce, signature)
    API-->>FE: Issue JWT session token
    FE->>IR: getIdentity(address)
    IR-->>FE: Return DID metadata (did:ethr:0xOwner...)
    FE-->>User: Render Authenticated UI with DID Badge
```

---

# 11. On-Chain vs Off-Chain Data

```mermaid
graph LR
    subgraph On_Chain [STORED ON-CHAIN: Ethereum EVM]
        D_ID[Document ID: bytes32]
        D_OWNER[Owner Address: address]
        D_HASH[SHA-256 File Hash: bytes32]
        D_CID[IPFS CID: string]
        D_TIME[Block Timestamp: uint256]
        D_REV[Revocation Flag: bool]
        D_ACC[Access Permissions: mapping]
        D_EVT[Immutable Event Logs]
    end

    subgraph Off_Chain_IPFS [STORED ON IPFS]
        F_ENC[AES-256-GCM Encrypted Document Payload]
        F_IV[Initialization Vector: 12 bytes]
        F_TAG[Authentication Tag: 16 bytes]
    end

    subgraph Strictly_Prohibited [NEVER STORED ON-CHAIN OR ON PUBLIC IPFS]
        P_RAW[Raw Unencrypted Document Files]
        P_KEY[Symmetric Encryption Keys / AES Keys]
        P_PRIV[User Private Keys & Seed Phrases]
        P_PASS[Passwords or Plaintext PII]
    end
```

### Data Placement Policy
- **On-Chain:** Minimal metadata required for consensus, verification, and audit (Document ID, Owner, CID, SHA-256 Hash, Timestamps, Revocation, Access State, Events).
- **On IPFS:** Encrypted document ciphertext, initialization vector, and authentication tag.
- **Strictly Prohibited:** Raw PDF/document bytes, plaintext sensitive data, user private keys, seed phrases, raw encryption keys, or passwords.

---

# 12. Source-of-Truth Model

Every runtime value is derived from a single authoritative source:

```text
Wallet address      → MetaMask
Wallet signature    → MetaMask
Document bytes      → User upload
File hash           → Actual SHA-256 computation
Encrypted document  → Actual AES-256-GCM operation
IPFS CID            → Real IPFS response
Document owner      → DocumentRegistry
Document hash       → DocumentRegistry
Access permission   → AccessControl
Revocation          → Smart contract
Transaction status  → Blockchain receipt
Block               → Blockchain
Audit events        → Blockchain event logs
Verification result → Current hash + on-chain record + required state checks
Contract address    → Deployment output
Chain ID            → Blockchain provider
```

The UI must **never** treat local React state as authoritative for ownership, permissions, or verification outcomes.

---

# 13. Trust Boundaries

```mermaid
graph TD
    subgraph TB_A [Boundary A: Browser to Wallet]
        Browser[Browser Client] <-->|EIP-1193 RPC| MetaMask[MetaMask Keyring]
    end

    subgraph TB_B [Boundary B: Browser to Backend]
        Browser <-->|HTTPS / REST| Express[Express Gateway]
    end

    subgraph TB_C [Boundary C: Backend to IPFS]
        Express <-->|Internal RPC / REST| IPFS_Daemon[IPFS Node]
    end

    subgraph TB_D [Boundary D: Browser to Blockchain]
        Browser <-->|JSON-RPC via MetaMask Provider| EVM[Ethereum Node]
    end

    subgraph TB_E [Boundary E: Blockchain to Application]
        EVM -->|Read Calls & Event Queries| Express
    end

    subgraph TB_F [Boundary F: IPFS to Verification]
        IPFS_Daemon -->|Fetch Encrypted Bytes| VerifyEngine[Verification Subsystem]
    end
```

### Trust Boundary Definitions
- **Boundary A (Browser to Wallet):** The browser has no access to private keys; transactions require user approval in MetaMask.
- **Boundary B (Browser to Backend):** Backend treats all client inputs as untrusted and requires schema and signature validation.
- **Boundary C (Backend to IPFS):** Only encrypted payloads are sent; plaintext files are rejected.
- **Boundary D (Browser to Blockchain):** User-authorized transactions are signed directly through MetaMask.
- **Boundary E (Blockchain to Application):** Application reads real state/events and never fabricates on-chain data.
- **Boundary F (IPFS to Verification):** Retrieved content must be validated, decrypted if authorized, and hashed before verification.

---

# 14. Security Boundaries

Sensitive data containment boundaries:
- **Browser:** May contain current document bytes during upload, ephemeral cryptographic state, and public wallet address. Must NOT contain backend private keys, RPC private secrets, IPFS server secrets, or wallet seed phrases.
- **Backend:** May contain server-side environment variables (`.env`), IPFS connection tokens, and RPC endpoint credentials. Must NOT expose server secrets to the browser, and must NOT hold user private keys.
- **Blockchain:** May contain public wallet addresses, document hashes, CIDs, access booleans, and event data. Must NOT contain plaintext private documents, private keys, or raw encryption keys.
- **IPFS:** May contain AES-256-GCM encrypted document blobs. Must NOT receive unencrypted plaintext sensitive documents.

---

# 15. Data Flow

```mermaid
flowchart TD
    Start([User Ingests Document]) --> Hash[Compute Client SHA-256]
    Hash --> Encrypt[Encrypt Client AES-256-GCM]
    Encrypt --> IPFS_Up[Upload Ciphertext to IPFS]
    IPFS_Up --> CID_Ret[Capture Real IPFS CID]
    CID_Ret --> Tx_Prep[Prepare registerDocument Tx]
    Tx_Prep --> MM_Sign[Prompt MetaMask Approval]
    MM_Sign --> Mine[Mine Transaction on Ethereum]
    Mine --> Event_Reg[Emit DocumentRegistered Event]
    Event_Reg --> Ready[Document Registered & Listed]

    Ready --> Share_Action{User Shares Document?}
    Share_Action -- Yes --> Grant_Tx[Call grantAccess verifier]
    Grant_Tx --> Mine_Grant[Mine Grant on Ethereum]
    Mine_Grant --> Event_Grant[Emit AccessGranted Event]
    Event_Grant --> Shared_State[Verifier Authorized]

    Ready --> Verify_Action{Verifier Inspects?}
    Shared_State --> Verify_Action
    Verify_Action -- Yes --> Fetch_IPFS[Fetch Ciphertext from IPFS]
    Fetch_IPFS --> Decrypt[Decrypt using Document Secret]
    Decrypt --> Recalc_Hash[Compute SHA-256 of Inspected File]
    Recalc_Hash --> Read_Chain[Query DocumentRegistry on-chain]
    Read_Chain --> Compare{Hashes Match & Not Revoked?}
    Compare -- Match & Active --> V_Pass[Status: VERIFIED < 2s]
    Compare -- Mismatch --> V_Tamper[Status: TAMPER DETECTED]
    Compare -- Revoked --> V_Rev[Status: REVOKED ON-CHAIN]
```

---

# 16. Upload/Registration Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Document Owner
    participant FE as Next.js Frontend
    participant WebCrypto as Web Crypto API
    participant API as Backend API
    participant IPFS as IPFS Node
    participant MM as MetaMask
    participant Contract as DocumentRegistry.sol

    Owner->>FE: Select real file
    FE->>WebCrypto: Compute SHA-256
    WebCrypto-->>FE: Return sha256Hash
    FE->>WebCrypto: Encrypt AES-256-GCM
    WebCrypto-->>FE: Return encrypted file blob
    FE->>API: Upload encrypted file
    API->>IPFS: Real IPFS API call
    IPFS-->>API: Real CID response
    API-->>FE: Return real CID
    FE->>MM: Request registerDocument(hash, cid, ...)
    MM-->>Owner: User confirms transaction
    Owner->>MM: Approve
    MM->>Contract: Submit signed transaction
    Contract-->>MM: Transaction receipt confirmed
    MM-->>FE: Return receipt
    FE->>Contract: Read actual on-chain record
    Contract-->>FE: Return document record
    FE-->>Owner: Render on Dashboard with Real Provenance
```

- **Fail-Closed Safeguards:**
  - If IPFS upload fails: No CID is generated, and on-chain registration must **not** proceed.
  - If the blockchain transaction fails or is rejected: The UI must **not** report registration success.
  - No CID or transaction hash may ever be fabricated.

---

# 17. Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Verifier as Authorized Verifier
    participant FE as Next.js Frontend
    participant IPFS as IPFS Node
    participant WebCrypto as Web Crypto API
    participant Contract as DocumentRegistry.sol
    participant Access as AccessControl.sol

    Verifier->>FE: Select / submit document
    FE->>IPFS: Retrieve encrypted file
    IPFS-->>FE: Encrypted bytes
    FE->>FE: Decrypt when authorized
    FE->>WebCrypto: Compute SHA-256 of actual document
    WebCrypto-->>FE: Current candidate hash
    FE->>Contract: Read registered record (hash + revocation)
    Contract-->>FE: Registered hash + revoked state
    FE->>Access: Check access authorization
    Access-->>FE: Access status (bool)
    FE->>FE: Compare candidate hash with registered hash
    alt Hash match + not revoked + access authorized
        FE-->>Verifier: Status: VERIFIED (< 2s)
    else Hash mismatch
        FE-->>Verifier: Status: TAMPER DETECTED
    else Document revoked
        FE-->>Verifier: Status: REVOKED ON-CHAIN
    else Unauthorized
        FE-->>Verifier: Status: ACCESS DENIED
    end
```

---

# 18. Sharing Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Document Owner
    participant FE as Next.js Frontend
    participant MM as MetaMask
    participant Access as AccessControl.sol

    Owner->>FE: Input recipient address
    FE->>MM: Request grantAccess(recipient)
    MM-->>Owner: Prompt signature & gas approval
    Owner->>MM: Confirm transaction
    MM->>Access: Submit grantAccess tx
    Access->>Access: Require msg.sender == owner
    Access->>Access: Set documentAccess[docId][recipient] = true
    Access-->>MM: Emit AccessGranted event
    MM-->>FE: Transaction receipt confirmed
    FE-->>Owner: Display "Access Granted to Recipient"
```

The architecture explicitly distinguishes **blockchain authorization** from **cryptographic decryption capability**. Smart contract permissions authorize access; symmetric keys provide decryption.

---

# 19. Revocation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Document Owner
    participant FE as Next.js Frontend
    participant MM as MetaMask
    participant Access as AccessControl.sol
    participant DocReg as DocumentRegistry.sol

    rect rgb(240, 248, 255)
        note right of Owner: Revoking Verifier Access
        Owner->>FE: Click "Revoke Access" for Recipient
        FE->>MM: Request revokeAccess(docId, recipient)
        MM->>Access: Submit revokeAccess tx
        Access->>Access: Set documentAccess[docId][recipient] = false
        Access-->>FE: Emit AccessRevoked event
        FE-->>Owner: Access Revoked for Recipient
    end

    rect rgb(255, 240, 245)
        note right of Owner: Revoking Entire Document Record
        Owner->>FE: Click "Revoke Document"
        FE->>MM: Request revokeDocument(docId)
        MM->>DocReg: Submit revokeDocument tx
        DocReg->>DocReg: Set documents[docId].revoked = true
        DocReg-->>FE: Emit DocumentRevoked event
        FE-->>Owner: Document Permanently Revoked
    end
```

---

# 20. Audit Flow

```mermaid
graph TD
    subgraph EVM_Events [Smart Contract Events]
        E1[DocumentRegistered]
        E2[AccessGranted]
        E3[AccessRevoked]
        E4[DocumentRevoked]
    end

    subgraph Mining [Ethereum Logs]
        E1 & E2 & E3 & E4 --> Log[(Mined Event Logs)]
    end

    subgraph App_Query [Blockchain Service]
        Log --> Svc[Application Retrieval: queryFilter]
    end

    subgraph Display [Audit UI]
        Svc --> UI[Chronological Audit Timeline]
    end
```

Audit records originate strictly from on-chain event logs. The system will **never** generate an audit record merely because a user clicked a button in the UI.

---

# 21. Error Flow

```mermaid
graph TD
    subgraph Error_Matrix [Fail-Closed Error Behaviors]
        W_Err[Wallet Failure] -->|No Account / Disconnected| W_Out["Clear UI Error: 'Wallet not connected'"]
        I_Err[IPFS Failure] -->|Node Offline / Timeout| I_Out["Clear Error: 'IPFS unavailable. Upload halted.'"]
        B_Err[Blockchain Failure] -->|RPC Offline / Gas Fail| B_Out["Clear Error: 'No confirmed transaction'"]
        R_Err[User Rejection] -->|MetaMask Cancelled| R_Out["Clear Error: 'Transaction rejected by user'"]
        T_Err[Hash Mismatch] -->|Single-Bit Modification| T_Out["Alert: 'TAMPER DETECTED'"]
        A_Err[Unauthorized Access] -->|hasAccess == false| A_Out["Alert: 'Access Denied'"]
    end
```

---

# 22. UI State Model

The frontend operates under 19 deterministic state categories:
1. `wallet disconnected`: Initial state before MetaMask injection or authorization.
2. `wallet connected`: Active account detected; ready for authentication challenge.
3. `authenticating`: Nonce challenge requested; awaiting MetaMask `personal_sign`.
4. `authenticated`: Valid signature verified; session established with DID badge.
5. `idle`: Main dashboard ready; awaiting user action.
6. `file selected`: User has selected a genuine document from local disk.
7. `hashing`: Computing client-side SHA-256 digest on raw file bytes.
8. `encrypting`: Generating 256-bit AES key/96-bit IV and producing ciphertext.
9. `IPFS upload pending`: Transmitting ciphertext payload to IPFS relay.
10. `IPFS uploaded`: Authentic CID received; preparing smart contract transaction.
11. `transaction pending`: MetaMask transaction submitted; awaiting block mining.
12. `transaction confirmed`: Transaction mined in block; receipt metadata parsed.
13. `verification pending`: Verifier file selected; querying on-chain record.
14. `verified`: Hash match confirmed, active, and access authorized (< 2s).
15. `tampered`: File hash mismatch detected; red warning rendered.
16. `revoked`: Document flagged as permanently revoked on-chain.
17. `unauthorized`: Wallet address lacks active smart-contract permission.
18. `service unavailable`: External RPC or IPFS service unreachable.
19. `empty state`: Clean zero-data notice (*"No documents registered yet"*).

---

# 23. Environment / Configuration Boundaries

```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=

CONTRACT_ADDRESS=
CONTRACT_NETWORK=
```

### Configuration Governance
- **Backend Variables:** `IPFS_API_KEY`, `IPFS_API_SECRET`, and internal `RPC_URL` remain strictly server-side.
- **Frontend Safe Variables:** Public `CHAIN_ID`, public RPC gateway URL, and deployed `CONTRACT_ADDRESS` are safe for browser exposure.
- **Git Protection:** `.env` is ignored by Git via `.gitignore`.
- **Template Policy:** `.env.example` contains variable names only, without hardcoded values, ports, or default credentials.

---

# 24. Observability / Provenance

The system ensures complete operational transparency by surfacing authentic runtime provenance for every displayed value:

```text
File            → User upload
SHA-256         → Actual file computation
CID             → IPFS upload response
Owner           → MetaMask + smart contract
Transaction     → Blockchain receipt
Block           → Blockchain mined header
Permission      → AccessControl contract
Verification    → Actual comparison / state evaluation
```

### Observable Demonstration Artifacts
During review and demonstration, the application surfaces:
- Connected Chain ID (dynamically retrieved from active provider, matching environment configuration).
- Connected wallet address and DID.
- Deployed contract addresses.
- Transaction submission hash and confirmation status.
- Block number after transaction confirmation.
- Authentic IPFS CID (verifiable via gateway).
- Document SHA-256 fingerprint.
- Active on-chain access permissions.
- Document revocation state.
- Chronological blockchain audit events.
- Real-time verification latency timer (< 2.0s).

---

# 25. Architecture Decisions

The following architectural decisions are permanently frozen:

1. **Decision 1:** Blockchain is authoritative for ownership and blockchain state.
2. **Decision 2:** IPFS stores encrypted document content.
3. **Decision 3:** SHA-256 provides document-integrity hashing.
4. **Decision 4:** AES-256-GCM provides document encryption.
5. **Decision 5:** MetaMask provides user wallet authorization.
6. **Decision 6:** ethers.js provides EVM interaction.
7. **Decision 7:** Node.js/Express provides the custom application API layer.
8. **Decision 8:** Next.js provides the frontend framework.
9. **Decision 9:** User-authorized blockchain writes are signed through MetaMask.
10. **Decision 10:** No synthetic runtime/application data is permitted (`ai_rules.md`).
11. **Decision 11:** Failures must be reported honestly without fallback success states.
12. **Decision 12:** UI state must not replace blockchain truth.

---

# 26. Future Scope Boundaries

The following items are formally classified as **Future Scope** and excluded from the core implementation:
- **Mobile Native Applications:** iOS/Android standalone apps (Core focuses on responsive desktop/tablet Web3 browser interface).
- **FIDO2 / WebAuthn Biometrics:** Direct hardware-key WebAuthn bindings.
- **ZK-SNARK Implementations:**
  > *Clarification:* Standard SHA-256 hash comparison against a blockchain hash verifies integrity but is mathematically **NOT** a zero-knowledge proof. True ZK-SNARK circuits are deferred to future milestones.
- **Institutional B2B API Ecosystem:** Enterprise API integrations and third-party SaaS billing.
- **Cross-Chain Bridges:** Layer-2 bridges to Polygon or Arbitrum.
- **AI-Powered Fraud Detection:** Pre-upload anomaly detection models.

---

# 27. Architecture Diagrams Summary

The architecture includes the following 13 diagrams:
1. High-level architecture (§1)
2. Layered architecture (§3)
3. Component architecture (§4)
4. Decentralized storage / IPFS architecture (§8)
5. Cryptography & key separation architecture (§9)
6. Decentralized Identity / wallet authentication sequence (§10)
7. On-chain vs off-chain data placement (§11)
8. Multi-level trust boundaries (§13)
9. End-to-end data flow (§15)
10. Upload/registration sequence (§16)
11. Verification sequence (§17)
12. Sharing sequence (§18)
13. API interactions diagram (below)

### API Interactions Diagram
```mermaid
sequenceDiagram
    autonumber
    participant FE as Next.js Frontend
    participant API as Express API Gateway
    participant IPFS as IPFS Daemon
    participant EVM as Ethereum RPC Node

    note over FE,API: Authentication
    FE->>API: POST /api/auth/challenge { address }
    API-->>FE: Return challenge nonce
    FE->>API: POST /api/auth/verify { address, signature }
    API-->>FE: Return JWT session token

    note over FE,IPFS: Decentralized Storage
    FE->>API: POST /api/ipfs/upload (encrypted blob)
    API->>IPFS: Pin ciphertext
    IPFS-->>API: Real CID
    API-->>FE: Return { cid }
    FE->>API: GET /api/ipfs/:cid
    API->>IPFS: Cat ciphertext
    IPFS-->>API: Stream encrypted bytes
    API-->>FE: Return encrypted stream

    note over FE,EVM: Query Services
    FE->>API: GET /api/documents
    API->>EVM: Query DocumentRegistry.getUserDocuments
    EVM-->>API: On-chain document IDs
    API-->>FE: Return document inventory
    FE->>API: POST /api/verify { docId, candidateHash }
    API->>EVM: Query DocumentRegistry.getDocument
    EVM-->>API: On-chain fileHash & revoked flag
    API-->>FE: Return verification result
    FE->>API: GET /api/audit/:docId
    API->>EVM: Query eth_getLogs (DocumentRegistry & AccessControl)
    EVM-->>API: Filtered log receipts
    API-->>FE: Return chronological event history
```

---

# 28. Phase 3 Blockchain Infrastructure Implementation

The Phase 3 milestone implements the underlying local blockchain infrastructure that supports all subsequent contract, authentication, and verification layers:

```mermaid
graph TD
    subgraph Client_Environment [Client & Application Environment]
        DevEnv[Developer CLI / Test Suite]
        HC[Health Check Script]
        TxTest[Transaction Test Script]
    end

    subgraph RPC_Boundary [RPC Boundary - HTTP/JSON-RPC]
        Provider[ethers.JsonRpcProvider / Hardhat Runtime Environment]
    end

    subgraph Blockchain_Node [Local Blockchain Node - Hardhat EVM]
        NodeEngine[Hardhat EVM Consensus & Mining Engine]
        StateDB[(Local State DB & Nonce Manager)]
        DevAccounts[(20 Auto-Generated Pre-Funded Accounts)]
        TxPool[Mempool / Block Production]
        BlockChain[(Blocks, Hashes & Receipts Store)]
    end

    DevEnv -->|ethers.js v6| Provider
    HC -->|Query Network & Block| Provider
    TxTest -->|Sign & Submit Native Tx| Provider

    Provider -->|eth_chainId / eth_blockNumber| NodeEngine
    Provider -->|eth_accounts / eth_getBalance| DevAccounts
    Provider -->|eth_sendTransaction| TxPool
    TxPool -->|Mine Block with Tx| NodeEngine
    NodeEngine -->|Update Balances & Nonces| StateDB
    NodeEngine -->|Store Block & Receipt| BlockChain
    BlockChain -->|Return Tx Receipt: eth_getTransactionReceipt| Provider
    Provider -->|Verified Receipt| TxTest
```

### Component Details

1. **Blockchain Node (`Hardhat EVM`):**
   - Implements local EVM state execution, block generation (instant automining), and state persistence during runtime.
   - Operates in standalone mode via `npx hardhat node` (listening on port `8545`) or in-process mode for automated test suites.
2. **RPC Boundary:**
   - Standard Ethereum JSON-RPC over HTTP (`http://127.0.0.1:8545`).
   - Abstracts network interaction so scripts and services communicate with the local node using the identical protocol later utilized for public testnets.
3. **Provider Layer:**
   - Implemented via `ethers.JsonRpcProvider` / Hardhat Runtime Environment (`hre.ethers.provider`).
   - Dynamically queries node state (`getNetwork`, `getBlockNumber`, `getBalance`) without cached or synthetic fallbacks.
4. **Development Accounts:**
   - Dynamic keypairs exposed by the local node (`await ethers.getSigners()`).
   - Zero hardcoding: Accounts and initial balances (10,000 ETH each) are retrieved dynamically at runtime.
5. **Transaction Path:**
   - Native account-to-account transfer (`sender.sendTransaction({ to, value })`).
   - Validates transaction submission, nonce incrementation, and transmission across the JSON-RPC boundary.
6. **Receipt Path:**
   - Explicit confirmation requirement via `await txResponse.wait(1)`.
   - Inspects real receipt metadata: `status` (1 = Success), `blockNumber`, `gasUsed`, `effectiveGasPrice`, and `hash`.
   - Validates mined block data (`getBlock(receipt.blockNumber)`) to confirm block hash, timestamp, and transaction inclusion.
7. **Network Health Path:**
   - Dedicated health-check script (`scripts/health-check.ts`) executing:
     - Connectivity check -> Chain ID validation -> Block height retrieval -> Account address retrieval -> Native balance check.
     - Fail-closed execution: Aborts with error if provider is unreachable or if `CHAIN_ID` mismatches configured environment.
8. **Public Testnet Boundary:**
   - Environment variables (`RPC_URL`, `CHAIN_ID`, `CONTRACT_NETWORK`) prepare the pipeline for future public testnets (e.g., Sepolia) without changing application call patterns.

