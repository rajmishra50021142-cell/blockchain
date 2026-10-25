# MASTER PLAN
# Blockchain-Based Digital Document Locker

> **Project status:** Master implementation specification  
> **Project type:** Real-data blockchain application  
> **Primary goal:** Build a working, demonstrable Blockchain-Based Digital Document Locker that strictly follows the supplied project requirements, the supplied project PPT, and the existing `ai_rules.md`.

---

# 1. MASTER PURPOSE

This project implements a **Blockchain-Based Digital Document Locker**: a decentralized, tamper-evident system for storing, verifying, sharing, and revoking access to digital documents.

The supplied project material describes the system as a decentralized, tamper-proof alternative to centralized document storage and identifies the following core capabilities:

- decentralized architecture
- distributed/decentralized document storage
- cryptographic verification
- SHA-256 hashing
- immutable records
- user ownership/private-key or wallet-based control
- instant verification
- client-side encryption
- Ethereum smart contracts
- IPFS
- Web3 wallet access
- smart-contract access control
- immutable audit records
- DID-based authentication
- secure document sharing
- verification and revocation checks

The supplied requirements image contains five mandatory implementation areas:

1. Blockchain Network Setup
2. Smart Contract / Chaincode Implementation
3. Frontend – Blockchain Integration
4. Functional Demonstration of Core Modules
5. Code Quality, Documentation and Review Progress

This master plan is designed so that **every mandatory requirement is implemented, tested, documented, and demonstrable**.

---

# 2. SOURCE-OF-TRUTH DOCUMENTS

The AI coding agent must treat the following as project source material:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. The supplied mandatory-requirements screenshot
4. The supplied Blockchain-Based Digital Document Locker PPT

The AI agent must read `ai_rules.md` before implementation.

The AI agent must not silently replace project requirements with a different architecture.

If a requirement is ambiguous, the agent must identify the ambiguity and preserve the supplied terminology unless the project owner explicitly changes it.

---

# 3. ABSOLUTE NON-SYNTHETIC-DATA POLICY

`ai_rules.md` is mandatory.

The application is a real blockchain application.

No synthetic application data is permitted.

The application must NEVER:

- generate fake wallet addresses
- generate fake users
- generate fake identities
- generate fake documents
- generate fake document records
- generate fake IPFS CIDs
- generate fake transaction hashes
- generate fake block numbers
- generate fake blockchain timestamps
- generate fake document hashes
- generate fake permissions
- generate fake audit events
- generate fake smart-contract results
- generate fake verification results
- fabricate blockchain confirmations
- fabricate IPFS responses
- use mock application data in production/demo runtime
- seed the real application with sample records
- hard-code successful transaction states
- hard-code verification states

Every runtime value must originate from a real source.

## 3.1 Runtime provenance rules

| Runtime value | Required source |
|---|---|
| Wallet address | Connected wallet / MetaMask |
| Wallet signature | Actual wallet signature |
| Document bytes | Actual user upload |
| SHA-256 | Actual uploaded document bytes |
| AES-256-GCM ciphertext | Actual encryption operation |
| IPFS CID | Actual IPFS upload response |
| Document owner | Smart contract |
| Document hash | Smart contract |
| Access permission | Smart contract |
| Revocation state | Smart contract |
| Transaction hash | Actual blockchain transaction/receipt |
| Block number | Blockchain |
| Blockchain timestamp | Blockchain |
| Audit events | Blockchain events |
| Verification result | Actual hash/state comparison |
| Contract address | Deployment output |
| Chain ID | Blockchain provider |
| Latest block | Blockchain provider |

If the real source is unavailable, return an error or an empty state.

Never manufacture a replacement value.

---

# 4. FAIL-CLOSED / HONEST-ERROR POLICY

The application must prefer an honest failure over fabricated success.

## 4.1 Blockchain unavailable

Show a clear error.

Do not generate:

- transaction hash
- block number
- confirmation
- success message

## 4.2 Transaction rejected by user

Show:

> Transaction rejected by user.

Do not report success.

## 4.3 Transaction reverted

Show the real failure.

Do not report the document as registered.

## 4.4 IPFS upload failure

Show:

> Document upload to IPFS failed. No CID was generated. The document was not registered on-chain.

Do not create a fake CID.

## 4.5 Wallet unavailable

Show:

> Wallet not connected.

Do not create a fake identity.

## 4.6 Decryption failure

Show:

> Unable to decrypt document. The document cannot be verified.

Do not mark the document as verified.

## 4.7 Hash mismatch

Show:

> Verification failed. The current document does not match the hash registered on-chain.

Never convert a mismatch into a successful verification result.

## 4.8 No documents

Show:

> No documents registered yet.

Do not create example records.

## 4.9 No audit records

Show:

> No blockchain activity found.

Do not create synthetic history.

---

# 5. MANDATORY PROJECT REQUIREMENT TRACEABILITY

Every implementation phase must map to the five mandatory requirements.

## Requirement 1 — Blockchain Network Setup

Must demonstrate:

- network configuration
- nodes/peers as applicable to the chosen Ethereum development environment
- accounts
- identities
- network connectivity
- RPC connectivity
- contract deployment
- actual transaction submission
- actual transaction confirmation

## Requirement 2 — Smart Contract / Chaincode Implementation

Must demonstrate:

- Solidity contract implementation
- contract deployment
- core business logic
- storage
- transaction handling
- access control
- contract-function testing
- event generation
- authorization enforcement
- correct and secure execution

## Requirement 3 — Frontend – Blockchain Integration

Must demonstrate:

- frontend wallet connection
- user-authorized transaction submission
- smart-contract function invocation
- blockchain state retrieval
- transaction status
- blockchain confirmation
- actual data displayed in the UI

## Requirement 4 — Functional Demonstration of Core Modules

Must demonstrate:

- real document upload
- encryption
- IPFS storage
- document registration
- transaction confirmation
- sharing
- access control
- revocation
- verification
- tamper detection
- audit trail
- complete end-to-end workflow

## Requirement 5 — Code Quality, Documentation and Review Progress

Must include:

- architecture documentation
- setup instructions
- API documentation
- smart-contract documentation
- testing documentation
- deployment documentation
- security documentation
- requirement traceability
- phase completion evidence
- progress reporting

---

# 6. PROJECT ARCHITECTURE

The architecture must follow the supplied PPT's conceptual layers.

```text
                           USER
                            |
                            v
                 +-----------------------+
                 |   PRESENTATION LAYER  |
                 |                       |
                 | Next.js               |
                 | Tailwind CSS          |
                 | ethers.js             |
                 | MetaMask              |
                 +-----------+-----------+
                             |
                  +----------+----------+
                  |                     |
                  v                     v
        +-------------------+   +-----------------------+
        | APPLICATION LAYER |   |   BLOCKCHAIN LAYER    |
        |                   |   |                       |
        | Node.js           |   | Ethereum              |
        | Express           |   | Solidity              |
        | REST APIs         |   | Document Registry     |
        | IPFS Integration  |   | Access Control        |
        +---------+---------+   | Identity Registry     |
                  |             +-----------+-----------+
                  v                         |
        +-------------------+               |
        | DECENTRALIZED     |               |
        | STORAGE           |               |
        |                   |               |
        | Encrypted files   |               |
        | IPFS              |               |
        +-------------------+               |
                                            v
                              +-----------------------------+
                              | VERIFICATION & AUDIT LAYER |
                              |                             |
                              | SHA-256                    |
                              | Hash comparison            |
                              | Revocation checks          |
                              | Blockchain events          |
                              +-----------------------------+
```

---

# 7. TECHNOLOGY STACK

## Frontend

- Next.js
- Tailwind CSS
- ethers.js
- MetaMask

## Backend

- Node.js
- Express.js
- TypeScript

## Blockchain

- Ethereum-compatible network
- Hardhat local blockchain for development
- Ethereum testnet for public demonstration
- Solidity
- ethers.js

## Storage

- IPFS
- real IPFS API/SDK

## Cryptography

- SHA-256
- AES-256-GCM

## Identity

- Web3 wallet
- DID-oriented identity registry

---

# 8. EXTERNAL SERVICE STRATEGY

External services must be integrated as real services.

Do not give API secrets to the AI agent in prompts or source files.

Use environment variables.

Required configuration categories:

```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=

CONTRACT_ADDRESS=
CONTRACT_NETWORK=
```

The actual `.env` file must never be committed.

`.env.example` may contain variable names only.

The frontend must never receive server-side secrets.

---

# 9. EXTERNAL SERVICES TO USE

## 9.1 Blockchain

Development:

- Hardhat local Ethereum network

Public demonstration:

- Ethereum testnet
- real RPC endpoint

Use one configured RPC provider for the required environment.

## 9.2 Wallet

- MetaMask

Used for:

- wallet address
- wallet connection
- signatures
- user authorization
- transaction approval

## 9.3 IPFS

Use a real IPFS node/service.

Only encrypted documents should be published to public IPFS.

## 9.4 Ethereum client

Use ethers.js for blockchain interaction.

---

# 10. CUSTOM APPLICATION API STRUCTURE

The project must create its own Node.js/Express REST API layer.

```text
/api
|
+-- /auth
|   +-- POST /challenge
|   +-- POST /verify
|
+-- /ipfs
|   +-- POST /upload
|   +-- GET /:cid
|
+-- /documents
|   +-- GET /
|   +-- GET /:id
|
+-- /verify
|   +-- POST /
|
+-- /audit
    +-- GET /:documentId
```

These APIs must use real configured services.

No mock responses.

No fake fallback responses.

---

# 11. WEB3 TRANSACTION ARCHITECTURE

User-authorized blockchain writes should normally follow:

```text
Next.js
   |
   v
ethers.js
   |
   v
MetaMask
   |
   v
Smart Contract
   |
   v
Ethereum
   |
   v
Transaction Receipt
```

Do not unnecessarily proxy user-authorized blockchain writes through a backend-owned private key.

Operations that normally require user authorization include:

- registerDocument()
- grantAccess()
- revokeAccess()
- revokeDocument()

The user must be able to see and authorize the transaction.

---

# 12. SMART-CONTRACT ARCHITECTURE

Use separate contracts by responsibility.

## 12.1 IdentityRegistry.sol

Purpose:

- identity/DID association
- identity activation/deactivation

Conceptual functions:

- registerIdentity()
- getIdentity()
- updateIdentity()
- deactivateIdentity()

## 12.2 DocumentRegistry.sol

Purpose:

- document registration
- ownership
- CID
- file hash
- timestamps
- revocation state

Conceptual structure:

```text
Document
|
+-- id
+-- owner
+-- cid
+-- fileHash
+-- createdAt
+-- revoked
```

Functions:

- registerDocument()
- getDocument()
- revokeDocument()

Events:

- DocumentRegistered
- DocumentRevoked

## 12.3 AccessControl.sol

Purpose:

- document sharing
- access permissions
- access revocation

Functions:

- grantAccess()
- revokeAccess()
- hasAccess()

Events:

- AccessGranted
- AccessRevoked

---

# 13. ON-CHAIN DATA MODEL

Store only metadata/proof required for the application.

Store:

- document ID
- owner wallet
- IPFS CID
- SHA-256 hash
- creation/registration timestamp
- revocation state
- access permissions
- event/audit information

Do not store:

- raw PDF
- plaintext sensitive document
- private encryption keys
- large files
- passwords

The blockchain is the integrity/ownership/control/audit layer.

IPFS is the encrypted document-storage layer.

---

# 14. IDENTITY / DID MODEL

The project scope includes DID-based authentication.

Implement the practical project version:

```text
MetaMask wallet
      |
      v
Authentication message
      |
      v
Wallet signature
      |
      v
Backend/frontend signature verification
      |
      v
Identity/DID registry association
```

The implementation must not claim standards-complete DID/Verifiable-Credential support unless it is actually implemented.

---

# 15. DOCUMENT SECURITY MODEL

The PPT defines a layered security model.

| Security concern | Technology |
|---|---|
| Data at rest | AES-256-GCM |
| Data integrity | SHA-256 |
| Access control | Smart contracts |
| Immutable audit | Ethereum blockchain |
| Identity verification | Web3 wallet signatures |
| Distributed storage | IPFS |

---

# 16. DOCUMENT UPLOAD PIPELINE

The actual upload flow must be:

```text
REAL USER FILE
      |
      v
Read actual bytes
      |
      +--------------------------+
      |                          |
      v                          v
   SHA-256                AES-256-GCM
      |                          |
      |                          v
      |                    Encrypted file
      |                          |
      |                          v
      |                         IPFS
      |                          |
      |                          v
      |                     REAL CID
      |                          |
      +------------+-------------+
                   |
                   v
          Smart Contract
                   |
                   v
              MetaMask
                   |
                   v
               Ethereum
                   |
                   v
          REAL TX RECEIPT
```

The hash must be computed from the actual document.

The CID must come from the real IPFS response.

The transaction must be real.

The blockchain record must contain the actual resulting values.

---

# 17. CRYPTOGRAPHY

## SHA-256

Used for:

- document fingerprint
- integrity verification
- tamper detection

It must always be calculated from actual file bytes.

## AES-256-GCM

Used for:

- document confidentiality
- encrypted storage

Only encrypted document content should be sent to public IPFS.

---

# 18. ENCRYPTION-KEY MANAGEMENT

Never store raw document encryption keys:

- on-chain
- in public IPFS
- in source code
- in frontend constants
- in public API responses

Authorization and decryption are separate concerns:

```text
Smart contract
    =
Who is authorized?

Cryptographic key handling
    =
Who can decrypt?
```

A real key-distribution approach must be implemented if multiple users need to decrypt shared documents.

---

# 19. IPFS WORKFLOW

```text
Actual document
      |
      v
AES-256-GCM
      |
      v
Encrypted document
      |
      v
REAL IPFS upload
      |
      v
REAL CID
      |
      v
Store CID in smart contract
```

Failure:

```text
IPFS unavailable
      |
      v
No CID
      |
      v
No blockchain registration
      |
      v
Clear error
```

---

# 20. BLOCKCHAIN REGISTRATION WORKFLOW

```text
Actual SHA-256
Actual IPFS CID
Actual owner wallet
       |
       v
registerDocument(...)
       |
       v
MetaMask
       |
       v
User confirms
       |
       v
Ethereum transaction
       |
       v
wait for receipt
       |
       v
read actual receipt
       |
       v
show:
- transaction hash
- block number
- status
- contract address
```

Do not show "confirmed" until actual confirmation is received.

---

# 21. VERIFICATION WORKFLOW

Verification must be computed, not stored as a hard-coded status.

```text
Actual document
      |
      v
Decrypt if necessary
      |
      v
SHA-256(current document)
      |
      v
Read document record from blockchain
      |
      v
Retrieve registered hash
      |
      v
Compare
      |
      +----------------------+
      |                      |
      v                      v
   MATCH                 MISMATCH
      |                      |
      v                      v
 VERIFIED              TAMPER DETECTED
```

Also check:

- document revocation state
- permission/access requirements
- required document existence

A normal hash comparison must not be described as a zero-knowledge proof. If true zero-knowledge functionality is required later, it must use an actual ZK implementation.

The PPT mentions "Zero-Knowledge Hash Verification" in the workflow and separately lists ZK-SNARKs under future scope. Preserve that terminology in documentation, but do not claim actual ZK proof generation unless such a system is implemented.

---

# 22. DOCUMENT SHARING WORKFLOW

Owner:

```text
Select document
     |
     v
Enter recipient wallet
     |
     v
grantAccess()
     |
     v
MetaMask
     |
     v
Blockchain
     |
     v
AccessGranted event
```

Recipient:

```text
Recipient wallet
      |
      v
hasAccess(documentId)
      |
      +-------- false --------> ACCESS DENIED
      |
      v
    true
      |
      v
Retrieve encrypted document
      |
      v
Decrypt using authorized key mechanism
      |
      v
Verify hash
```

---

# 23. REVOCATION WORKFLOW

Owner:

```text
revokeAccess(documentId, recipient)
      |
      v
MetaMask
      |
      v
Ethereum
      |
      v
AccessRevoked
```

Future request:

```text
Recipient
    |
    v
hasAccess()
    |
    v
false
    |
    v
ACCESS DENIED
```

The frontend must not maintain a fake permission state.

The blockchain must be the source of truth.

---

# 24. AUDIT TRAIL

Audit events must originate from blockchain events.

Events may include:

- DocumentRegistered
- AccessGranted
- AccessRevoked
- DocumentRevoked
- DocumentVerified (only if actually implemented as a transaction/event)

Each displayed record should derive from actual blockchain data.

Possible displayed fields:

- actor
- recipient
- action
- transaction hash
- block number
- timestamp
- document ID

No seeded audit timeline.

---

# 25. FRONTEND INFORMATION ARCHITECTURE

Suggested routes/pages:

```text
/
  Landing

/dashboard
  Documents
  Activity
  Wallet

/upload
  Upload workflow

/documents/:id
  Document details

/verify
  Verification workflow

/shared
  Shared documents

/audit
  Audit trail

/identity
  Wallet + identity
```

The UI must be desktop-first according to the stated project context.

---

# 26. REQUIRED UI STATES

The application must explicitly handle:

## Empty

```text
No documents registered yet.
```

## Wallet disconnected

```text
Connect MetaMask to continue.
```

## Loading

Loading indicators may be shown, but they must not imply completion.

## IPFS uploading

```text
Uploading encrypted document to IPFS...
```

## Transaction pending

```text
Waiting for blockchain confirmation...
```

## Transaction confirmed

Only after actual receipt:

```text
Transaction confirmed.
```

## Verification success

Only after real hash/state comparison:

```text
Document verified.
```

## Verification failure

```text
Hash mismatch / document revoked / unauthorized access.
```

---

# 27. DATA-PROVENANCE UI

For each registered document, show evidence of where the information originated.

Example:

```text
DOCUMENT PROVENANCE

File:
my_document.pdf
Source: Actual user upload

SHA-256:
<actual hash>
Source: Computed from actual file

IPFS CID:
<actual CID>
Source: Live IPFS response

Owner:
<actual wallet>
Source: Connected MetaMask wallet

Transaction Hash:
<actual tx>
Source: Blockchain receipt

Block:
<actual block>
Source: Blockchain

Status:
<computed status>
Source: Smart-contract state + verification logic
```

This allows the evaluator to distinguish real runtime information from presentation-only content.

---

# 28. NO SYNTHETIC TEST/DEMO DATA IN THE PRODUCTION APPLICATION

Do not create runtime files such as:

- mockData.ts
- fakeUsers.ts
- sampleDocuments.ts
- demoTransactions.ts
- fakeBlockchain.ts
- mockIpfs.ts
- fakeAuditLogs.ts
- sampleVerification.ts

If fixtures are required for automated unit tests, they must be isolated under test-only directories and must never be imported into the production/demo application.

The final demo must operate on actual runtime data.

---

# 29. PROJECT DIRECTORY STRUCTURE

Recommended structure:

```text
blockchain-document-locker/
|
+-- ai_rules.md
+-- MASTER_PLAN.md
+-- README.md
+-- .env.example
+-- .env
+-- .gitignore
|
+-- docs/
|   +-- architecture.md
|   +-- api.md
|   +-- requirements.md
|   +-- smart-contracts.md
|   +-- security.md
|   +-- testing.md
|   +-- deployment.md
|   +-- requirements-traceability.md
|   +-- mandatory-requirements.png
|
+-- blockchain/
|   +-- contracts/
|   |   +-- IdentityRegistry.sol
|   |   +-- DocumentRegistry.sol
|   |   +-- AccessControl.sol
|   |
|   +-- scripts/
|   |   +-- deploy.ts
|   |
|   +-- test/
|   |
|   +-- deployments/
|   |
|   +-- hardhat.config.ts
|
+-- backend/
|   +-- src/
|   |   +-- routes/
|   |   |   +-- auth.routes.ts
|   |   |   +-- ipfs.routes.ts
|   |   |   +-- documents.routes.ts
|   |   |   +-- verify.routes.ts
|   |   |   +-- audit.routes.ts
|   |   |
|   |   +-- controllers/
|   |   |
|   |   +-- services/
|   |   |   +-- ipfs.service.ts
|   |   |   +-- blockchain.service.ts
|   |   |   +-- verification.service.ts
|   |   |   +-- auth.service.ts
|   |   |
|   |   +-- middleware/
|   |   +-- server.ts
|   |
|   +-- tests/
|
+-- frontend/
|   +-- app/
|   |   +-- page.tsx
|   |   +-- dashboard/
|   |   +-- upload/
|   |   +-- verify/
|   |   +-- shared/
|   |   +-- audit/
|   |   +-- identity/
|   |
|   +-- components/
|   +-- lib/
|   |   +-- api.ts
|   |   +-- blockchain.ts
|   |   +-- ipfs.ts
|   |   +-- crypto.ts
|   |
|   +-- tests/
|
+-- tests/
    +-- e2e/
```

---

# 30. PHASE PLAN

The project is divided into 16 phases including Phase 0.

---

# PHASE 0 — AI AGENT GOVERNANCE & LIVE INFRASTRUCTURE POLICY

## Goal

Establish the rules and prevent the AI from creating a fake/simulated project.

## Tasks

1. Read `ai_rules.md`.
2. Read `MASTER_PLAN.md`.
3. Inspect repository.
4. Create `.env.example`.
5. Create `.gitignore`.
6. Establish service configuration.
7. Define source-of-truth rules.
8. Define fail-closed behavior.
9. Define no-mock policy.
10. Do not implement business UI yet.

## Completion criteria

- `ai_rules.md` present
- no secrets committed
- `.env.example` present
- architecture understood
- no synthetic runtime data
- agent protocol established

---

# PHASE 1 — REQUIREMENTS & SCOPE FREEZE

## Goal

Convert the supplied requirements into implementation checkpoints.

## Tasks

Create:

- `docs/requirements.md`
- `docs/requirements-traceability.md`

Preserve the original mandatory screenshot at:

```text
docs/mandatory-requirements.png
```

Map every requirement to:

- feature
- module
- smart contract
- API
- UI
- tests
- demo evidence

## Completion criteria

Every mandatory requirement has an implementation location and test/demo criterion.

---

# PHASE 2 — SYSTEM ARCHITECTURE & DATA FLOW

## Goal

Freeze architecture before extensive coding.

## Tasks

Document:

- component architecture
- frontend/backend interaction
- blockchain interaction
- IPFS interaction
- encryption flow
- verification flow
- sharing flow
- revocation flow
- audit flow
- identity flow
- trust boundaries
- error boundaries

Create architecture diagrams.

## Completion criteria

The architecture clearly shows:

```text
Frontend
Backend
Ethereum
IPFS
Cryptography
Wallet
Verification
Audit
Identity
```

---

# PHASE 3 — BLOCKCHAIN NETWORK SETUP

## Goal

Satisfy Requirement 1.

## Tasks

Set up:

- Hardhat
- local Ethereum network
- development accounts
- RPC connectivity
- chain ID
- deployment tooling

Verify:

- provider connection
- latest block
- account availability
- real test transaction
- actual transaction receipt

## Completion criteria

The system can connect to a live development blockchain and perform a real transaction.

No fake chain data.

---

# PHASE 4 — WALLET & IDENTITY

## Goal

Implement Web3 authentication and identity foundations.

## Tasks

Implement:

- MetaMask connection
- account detection
- network detection
- message challenge
- signature request
- signature verification
- identity registry
- DID association

## Tests

- connect wallet
- sign
- verify
- reject signature
- disconnect
- account switch
- wrong network

## Completion criteria

Identity is based on actual wallet state and signatures.

---

# PHASE 5 — DOCUMENT REGISTRY SMART CONTRACT

## Goal

Implement the core document registry.

## Tasks

Implement:

- document structure
- ownership
- CID
- hash
- timestamps
- revocation
- registration
- retrieval
- revocation
- events

## Tests

- valid registration
- owner assignment
- data retrieval
- unauthorized operation
- revoke
- events

## Completion criteria

Contract correctly stores and retrieves real document metadata.

---

# PHASE 6 — ACCESS CONTROL SMART CONTRACT

## Goal

Implement secure sharing and authorization.

## Tasks

Implement:

- grantAccess()
- revokeAccess()
- hasAccess()
- authorized user lookup
- AccessGranted event
- AccessRevoked event

## Tests

- owner grants access
- authorized user can access
- unauthorized user cannot access
- owner revokes access
- revoked user cannot access

## Completion criteria

Access state is controlled by the smart contract.

---

# PHASE 7 — SMART CONTRACT SECURITY & TESTING

## Goal

Satisfy the testing component of Requirement 2.

## Tasks

Test:

- ownership
- access control
- invalid IDs
- unauthorized calls
- revocation
- duplicate situations
- events
- state transitions
- contract failures
- transaction behavior

## Completion criteria

All critical contract tests pass.

No frontend work should compensate for failed contract behavior.

---

# PHASE 8 — CRYPTOGRAPHY

## Goal

Implement the real document integrity/confidentiality layer.

## Tasks

Implement:

- SHA-256
- AES-256-GCM
- encryption
- decryption
- nonce/IV handling
- secure key handling
- hash verification

Test:

- encrypt/decrypt round trip
- SHA-256 consistency
- modified-document hash difference
- encryption failure handling
- decryption failure handling

## Completion criteria

Real files can be encrypted/decrypted and hashed correctly.

---

# PHASE 9 — IPFS INTEGRATION

## Goal

Implement actual decentralized storage.

## Tasks

- configure real IPFS service/node
- upload encrypted document
- obtain CID
- retrieve document
- validate retrieval
- handle unavailable service
- handle invalid CID

## Completion criteria

A real encrypted file can be uploaded and retrieved using a real CID.

No mock CID is ever returned.

---

# PHASE 10 — NODE.JS / EXPRESS API LAYER

## Goal

Implement the custom API layer.

## APIs

```text
POST /api/auth/challenge
POST /api/auth/verify

POST /api/ipfs/upload
GET  /api/ipfs/:cid

GET  /api/documents
GET  /api/documents/:id

POST /api/verify

GET  /api/audit/:documentId
```

## Tasks

Implement:

- routes
- controllers
- services
- middleware
- validation
- error handling
- real service integrations

## Completion criteria

Every API endpoint communicates with real underlying services or real application state.

No mock response.

---

# PHASE 11 — FRONTEND

## Goal

Satisfy the frontend portion of Requirement 3.

## Tasks

Build:

- landing page
- wallet connection
- dashboard
- upload page
- document detail page
- verification page
- shared-documents page
- audit page
- identity page

Implement:

- ethers.js
- MetaMask
- API client
- blockchain state retrieval
- transaction state
- error state
- empty state

## Completion criteria

The frontend can communicate with the live backend/blockchain/IPFS stack.

---

# PHASE 12 — COMPLETE REAL DOCUMENT REGISTRATION

## Goal

Integrate all core layers.

## Workflow

```text
User
 ↓
Upload real document
 ↓
SHA-256
 ↓
AES-256-GCM
 ↓
IPFS
 ↓
CID
 ↓
Smart contract
 ↓
MetaMask
 ↓
Ethereum
 ↓
Receipt
 ↓
On-chain record
 ↓
Dashboard
```

## UI evidence

Show:

- original filename
- file size
- computed hash
- encryption status
- CID
- wallet
- contract
- transaction hash
- block number
- confirmation
- on-chain status

## Completion criteria

The full registration pipeline works using actual runtime data.

---

# PHASE 13 — SHARING & REVOCATION

## Goal

Implement secure document sharing.

## Workflow

```text
Owner
 ↓
Select document
 ↓
Enter real recipient wallet
 ↓
grantAccess()
 ↓
MetaMask
 ↓
Blockchain
 ↓
AccessGranted
```

Then:

```text
Recipient
 ↓
hasAccess()
 ↓
Retrieve
 ↓
Decrypt
 ↓
Verify
```

Then:

```text
Owner
 ↓
revokeAccess()
 ↓
Blockchain
 ↓
AccessRevoked
 ↓
Recipient
 ↓
Access denied
```

## Completion criteria

Actual wallet-based sharing and revocation work.

---

# PHASE 14 — VERIFICATION & TAMPER DETECTION

## Goal

Implement the project's core trust/verification demonstration.

## Valid file

```text
Current hash == blockchain hash
and required state checks pass
        ↓
VERIFIED
```

## Modified file

```text
Current hash != blockchain hash
        ↓
TAMPER DETECTED
```

## Revoked document

```text
revoked == true
        ↓
REVOKED / NOT VALID
```

## Unauthorized user

```text
hasAccess == false
        ↓
ACCESS DENIED
```

## Completion criteria

No verification state is hard-coded.

Every result is computed from real inputs and on-chain state.

---

# PHASE 15 — AUDIT TRAIL, END-TO-END TESTING & FINAL DOCUMENTATION

## Goal

Satisfy Requirements 4 and 5.

## Audit

Show actual:

- actor
- action
- recipient
- transaction hash
- block
- timestamp
- document ID

from real blockchain events.

## End-to-end testing

Perform:

```text
Connect wallet
    ↓
Authenticate
    ↓
Upload real permitted document
    ↓
Hash
    ↓
Encrypt
    ↓
IPFS
    ↓
Register
    ↓
Confirm
    ↓
Share
    ↓
Verify
    ↓
Tamper
    ↓
Detect tampering
    ↓
Revoke
    ↓
Deny access
    ↓
Audit
```

## Documentation

Complete:

- README
- architecture
- API
- smart contracts
- deployment
- security
- testing
- requirements traceability
- project setup
- demo instructions

## Completion criteria

The complete project is demonstrable from start to finish using real runtime data.

---

# 31. FINAL DEMONSTRATION SCRIPT

The final demonstration should use an actual document that the user is authorized to use.

## Step 1

Open application.

## Step 2

Connect MetaMask.

Show actual wallet address.

## Step 3

Authenticate through actual wallet signature.

## Step 4

Upload a real permitted document.

## Step 5

Show:

- filename
- size
- SHA-256

## Step 6

Encrypt the file.

## Step 7

Upload encrypted content to real IPFS.

Show actual CID.

## Step 8

Register document on blockchain.

MetaMask transaction appears.

## Step 9

Show:

- contract address
- transaction hash
- block
- confirmation

## Step 10

Show the on-chain record.

## Step 11

Grant another actual wallet access.

## Step 12

Switch to verifier wallet.

## Step 13

Verify actual document.

Show matching hashes.

## Step 14

Modify the document.

## Step 15

Verify modified version.

Show mismatch and tamper detection.

## Step 16

Revoke access.

## Step 17

Attempt access from revoked wallet.

Show access denied.

## Step 18

Show actual audit events.

This is the core final evidence for the project.

---

# 32. REAL VS NOT-REAL DEMONSTRATION

The application should make provenance obvious.

Example:

```text
File
Source: User upload

Hash
Source: Actual SHA-256 computation

CID
Source: Live IPFS response

Owner
Source: Connected wallet

Transaction
Source: Blockchain receipt

Block
Source: Blockchain

Permission
Source: Smart contract

Audit
Source: Blockchain event

Verification
Source: Hash/state comparison
```

The UI must not pretend that a generated display value is a real external result.

---

# 33. TESTING MATRIX

| Layer | Test | Expected behavior |
|---|---|---|
| Wallet | Connect | Actual account returned |
| Wallet | Reject signature | Authentication fails |
| Blockchain | Provider failure | Clear error |
| Contract | Register | Actual transaction |
| Contract | Unauthorized register/revoke | Rejected |
| Contract | Grant access | Actual event |
| Contract | Revoke access | Actual event |
| Crypto | Encrypt/decrypt | Original data recovered |
| Crypto | Modify file | Hash changes |
| IPFS | Upload | Real CID |
| IPFS | Retrieve | Actual encrypted file |
| IPFS | Failure | No CID, no registration |
| Backend | Invalid request | Validation error |
| Backend | Service failure | Real error |
| Verification | Matching hash | Verified |
| Verification | Different hash | Tamper detected |
| Access | Authorized | Allowed |
| Access | Revoked | Denied |
| Audit | Registration | Actual event visible |
| Audit | No events | Empty state |

---

# 34. SECURITY REQUIREMENTS

The system must enforce:

- no raw sensitive document on public IPFS
- encrypted document storage
- no secrets in frontend
- no private keys in source code
- no seed phrases in source code
- no fake wallet identity
- user-authorized transactions
- smart-contract authorization
- hash-based integrity checking
- revocation
- actual audit events
- error-safe behavior

---

# 35. AI AGENT DEVELOPMENT PROTOCOL

The coding agent must follow this procedure for every phase:

1. Read `ai_rules.md`.
2. Read the relevant part of `MASTER_PLAN.md`.
3. Inspect the existing repository.
4. Identify the current phase.
5. Do not prematurely implement later phases.
6. Preserve existing working functionality.
7. Implement the phase.
8. Run relevant tests.
9. Verify real-data provenance.
10. Search for hard-coded/mock/synthetic runtime data.
11. Verify error handling.
12. Update documentation.
13. Report exact changes.
14. Report tests.
15. Report unresolved blockers.
16. Do not claim completion without evidence.

---

# 36. AI AGENT RESPONSE FORMAT

After each phase, the AI agent must report:

```text
PHASE:
<phase number and name>

IMPLEMENTED:
<actual implementation>

FILES CHANGED:
<files>

REAL-DATA SOURCES VERIFIED:
<actual data sources>

TESTS RUN:
<tests>

ERROR HANDLING VERIFIED:
<failure cases>

NO-SYNTHETIC-DATA CHECK:
<result>

REQUIREMENT TRACEABILITY:
<mandatory requirement mapping>

BLOCKERS:
<remaining blockers>

STATUS:
COMPLETE / INCOMPLETE
```

---

# 37. DEFINITION OF DONE

The project is complete only when all of the following are true:

- [ ] Real Ethereum development/test network works
- [ ] Wallet integration works
- [ ] Identity/signature verification works
- [ ] DID-oriented identity registry exists
- [ ] DocumentRegistry works
- [ ] AccessControl works
- [ ] Smart-contract tests pass
- [ ] SHA-256 works on real files
- [ ] AES-256-GCM works on real files
- [ ] IPFS integration works
- [ ] Real CID is returned
- [ ] Node.js API works
- [ ] Next.js frontend works
- [ ] Real MetaMask transactions work
- [ ] Real transaction receipts are displayed
- [ ] Real on-chain document records are displayed
- [ ] Real access sharing works
- [ ] Real access revocation works
- [ ] Real verification works
- [ ] Real tamper detection works
- [ ] Real audit events are displayed
- [ ] Error handling works
- [ ] No synthetic application data exists
- [ ] No mock fallback exists
- [ ] No fake blockchain results exist
- [ ] No fake IPFS results exist
- [ ] Five mandatory project requirements are demonstrated
- [ ] Documentation is complete
- [ ] Final end-to-end demonstration works

---

# 38. FUTURE SCOPE

The supplied PPT includes future-scope items such as:

- mobile application
- FIDO2 authentication
- ZK-SNARKs
- institutional API
- cross-chain support
- Polygon
- Arbitrum
- AI fraud detection

These should remain outside the core implementation unless explicitly added later.

The core project must first be fully functional with real data.

---

# 39. CORE PROJECT PRINCIPLE

The entire project must follow this rule:

> **Never generate data to make the application look functional. Make the real system produce the data.**

Therefore:

```text
No blockchain
    -> No blockchain data

No IPFS upload
    -> No CID

No uploaded file
    -> No document hash

No encryption
    -> No encrypted document

No wallet
    -> No authenticated identity

No transaction
    -> No transaction hash

No receipt
    -> No confirmation

No permission
    -> No access

No matching hash
    -> No verification

No blockchain event
    -> No audit record
```

The system must always prefer an honest error or empty state over fabricated success.

---

# 40. FINAL END-TO-END ARCHITECTURE

```text
                         REAL USER
                             |
                             v
                     +---------------+
                     |    MetaMask   |
                     +-------+-------+
                             |
                             v
                      Next.js Frontend
                             |
             +---------------+---------------+
             |                               |
             v                               v
        Node.js API                    ethers.js
             |                               |
             |                               v
             |                           MetaMask
             |                               |
             v                               v
          Real IPFS                  Solidity Contracts
             |                               |
             v                               v
      Encrypted Document                Ethereum
                                             |
                                             v
                                    Transaction Receipt
                                             |
                                             v
                                   On-Chain Document State
                                             |
                         +-------------------+-------------------+
                         |                                       |
                         v                                       v
                    Access Control                         Verification
                         |                                       |
                         v                                       v
                     Share/Revoke                         SHA-256 Compare
                                                                 |
                                                     +-----------+-----------+
                                                     |                       |
                                                     v                       v
                                                   MATCH                 MISMATCH
                                                     |                       |
                                                     v                       v
                                                 VERIFIED              TAMPER DETECTED

                              Blockchain Events
                                      |
                                      v
                                Audit Trail
```

---

# 41. FINAL IMPLEMENTATION ORDER

The agent must follow this order:

```text
PHASE 0
AI governance + real-service policy

        ↓

PHASE 1
Requirements

        ↓

PHASE 2
Architecture

        ↓

PHASE 3
Blockchain network

        ↓

PHASE 4
Wallet + identity

        ↓

PHASE 5
Document contract

        ↓

PHASE 6
Access contract

        ↓

PHASE 7
Contract testing

        ↓

PHASE 8
Cryptography

        ↓

PHASE 9
IPFS

        ↓

PHASE 10
Backend APIs

        ↓

PHASE 11
Frontend

        ↓

PHASE 12
Real registration pipeline

        ↓

PHASE 13
Sharing + revocation

        ↓

PHASE 14
Verification + tamper detection

        ↓

PHASE 15
Audit + testing + documentation

        ↓

FINAL DEMONSTRATION
```

---

# 42. FINAL AGENT COMMANDMENT

Before implementing any feature, the AI agent must ask itself:

1. **What is the real source of this data?**
2. **Is that source actually connected?**
3. **Can the value be independently verified?**
4. **What happens if the source fails?**
5. **Am I accidentally hard-coding or simulating anything?**

If the answer cannot establish a real source, the agent must **stop and implement the required integration or report the blocker** rather than fabricate the missing data.

This master plan, together with the existing `ai_rules.md`, is the governing specification for the project.
