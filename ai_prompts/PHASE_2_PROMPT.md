# PHASE 2 — SYSTEM ARCHITECTURE & DATA FLOW
# Blockchain-Based Digital Document Locker

> **Phase:** 2 of the master implementation plan  
> **Phase objective:** Freeze the technical architecture, component boundaries, data flow, trust boundaries, API responsibilities, smart-contract responsibilities, storage model, security model, and end-to-end interaction design before implementation begins.

---

# 1. PHASE OBJECTIVE

You are implementing **PHASE 2** of the Blockchain-Based Digital Document Locker.

Phase 2 is the **architecture and system-design phase**.

The objective is to transform the frozen requirements from Phase 1 into a precise technical architecture that can be implemented in later phases without architectural ambiguity.

Phase 2 must define:

- system architecture
- component boundaries
- frontend architecture
- backend architecture
- blockchain architecture
- IPFS architecture
- cryptography flow
- wallet/authentication flow
- identity/DID flow
- document-registration flow
- document-verification flow
- document-sharing flow
- access-revocation flow
- audit flow
- API boundaries
- smart-contract boundaries
- data ownership
- data provenance
- trust boundaries
- security boundaries
- error boundaries
- source-of-truth responsibilities
- environment/configuration boundaries
- sequence diagrams
- data-flow diagrams
- architecture documentation

Phase 2 is NOT the implementation phase.

Do NOT implement:

- Solidity contracts
- Hardhat configuration
- contract deployment
- real RPC integration
- IPFS integration
- real wallet transaction flows
- encryption implementation
- backend API implementation
- frontend implementation
- database implementation
- synthetic/mock data

You are designing the system that later phases will implement.

---

# 2. GOVERNING DOCUMENTS

Before making any changes, read:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `docs/requirements.md`
5. `docs/requirements-traceability.md`
6. The supplied Blockchain-Based Digital Document Locker PPT
7. The supplied mandatory-requirements image
8. Existing repository documentation and code

The following authority order applies:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. Phase-specific prompt
4. Phase 1 requirements documents
5. Supplied PPT and mandatory requirements image
6. Existing project implementation

Do not silently override a higher-level requirement.

If an expected Phase 1 document is missing:

- inspect the repository to determine whether it exists elsewhere
- report the missing document
- do not fabricate its contents

---

# 3. REPOSITORY INSPECTION

Before designing the architecture:

1. Inspect the complete current repository structure.
2. Determine whether any implementation was already created during Phase 1.
3. Determine which folders/files already exist.
4. Preserve valid existing work.
5. Do not delete or overwrite existing valid architecture documentation blindly.
6. Identify inconsistencies between Phase 1 documentation and repository state.
7. Report inconsistencies rather than silently hiding them.

Phase 2 must adapt to the actual repository while preserving the approved project architecture.

---

# 4. NON-SYNTHETIC-DATA RULE

All rules in `ai_rules.md` remain mandatory.

No fake application data is allowed.

Phase 2 is primarily documentation/design, but you must still avoid creating:

- fake users
- fake documents
- fake IPFS CIDs
- fake wallet addresses
- fake blockchain transactions
- fake transaction hashes
- fake block numbers
- fake audit events
- fake verification results

If examples are required in architecture documentation, make them clearly **conceptual examples** and never represent them as actual runtime data.

Do not create runtime mock files.

Do not create seeded records.

---

# 5. ARCHITECTURE OBJECTIVE

The architecture must implement the following conceptual system:

```text
                            REAL USER
                                |
                                v
                        +----------------+
                        |    MetaMask    |
                        +-------+--------+
                                |
                                v
                        +---------------+
                        | Next.js UI    |
                        | Tailwind      |
                        | ethers.js     |
                        +-------+-------+
                                |
                 +--------------+--------------+
                 |                             |
                 v                             v
        +------------------+          +--------------------+
        | Node.js/Express  |          | Ethereum / EVM    |
        | API Layer        |          | Solidity Contracts|
        +--------+---------+          +---------+----------+
                 |                              |
                 v                              |
        +------------------+                    |
        | Real IPFS        |                    |
        | Encrypted Files  |                    |
        +------------------+                    |
                                                v
                                    +-----------------------+
                                    | Verification & Audit  |
                                    | Hash / State / Events |
                                    +-----------------------+
```

The final architecture must preserve the responsibilities already established in the requirements and supplied PPT.

---

# 6. ARCHITECTURE LAYERS

Define the system as these primary layers.

## 6.1 Presentation Layer

Responsibilities:

- user interface
- wallet connection
- document upload UI
- document dashboard
- verification UI
- sharing UI
- revocation UI
- audit UI
- transaction status
- error states
- empty states

Planned technologies:

- Next.js
- Tailwind CSS
- ethers.js
- MetaMask

The presentation layer must never become the source of truth for blockchain state.

---

## 6.2 Application Layer

Responsibilities:

- API gateway
- IPFS integration
- authentication/signature verification assistance
- server-side validation where required
- verification orchestration where appropriate
- audit aggregation where appropriate
- external-service error handling

Planned technologies:

- Node.js
- Express.js
- TypeScript

The application layer must not become an unauthorized replacement for blockchain state.

---

## 6.3 Blockchain Layer

Responsibilities:

- ownership
- document registration metadata
- document hash
- IPFS CID
- access control
- revocation state
- identity/DID association
- immutable events
- blockchain audit trail

Planned technologies:

- Ethereum-compatible network
- Solidity
- ethers.js

---

## 6.4 Decentralized Storage Layer

Responsibilities:

- encrypted document storage
- document retrieval using CID
- decentralized persistence

Planned technology:

- IPFS

Only encrypted document content should be published to public IPFS.

---

## 6.5 Cryptography Layer

Responsibilities:

- SHA-256 hashing
- AES-256-GCM encryption/decryption
- document integrity
- confidentiality

The architecture must clearly define where each operation is performed.

---

## 6.6 Verification and Audit Layer

Responsibilities:

- read blockchain record
- calculate current document hash
- compare hashes
- check revocation
- check authorization where required
- retrieve blockchain events
- present audit history

Verification must be computed from actual runtime information.

---

# 7. COMPONENT ARCHITECTURE

Create a component-level architecture specification.

## Frontend Components

Document at minimum:

- WalletConnect
- Authentication/Signature UI
- Dashboard
- DocumentList
- DocumentCard
- UploadDocument
- EncryptionStatus
- UploadStatus
- TransactionStatus
- DocumentDetails
- ShareDocument
- AccessManagement
- VerifyDocument
- VerificationResult
- AuditTimeline
- IdentityView
- ErrorState
- EmptyState

These are architectural components at this phase, not necessarily implemented components.

---

# 8. BACKEND COMPONENTS

Define the backend as:

```text
backend/
└── src/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middleware/
    └── server.ts
```

Responsibilities:

### Routes
Expose application endpoints.

### Controllers
Translate HTTP requests into service calls.

### Services
Contain integrations and application logic.

Planned services:

- auth.service
- blockchain.service
- ipfs.service
- verification.service

### Middleware

Responsible for:

- request validation
- error normalization
- authentication/signature-related validation where appropriate
- security controls

Do not implement them in Phase 2.

---

# 9. BLOCKCHAIN COMPONENT ARCHITECTURE

Define three logical contracts.

## IdentityRegistry.sol

Responsible for:

- identity registration
- identity retrieval
- identity updates
- identity deactivation
- wallet-to-identity association

## DocumentRegistry.sol

Responsible for:

- document registration
- document retrieval
- ownership
- CID
- SHA-256 hash
- timestamp
- document revocation

## AccessControl.sol

Responsible for:

- document permissions
- grant access
- revoke access
- access checks

Architecture must clearly identify which operations require owner authorization.

---

# 10. ON-CHAIN VS OFF-CHAIN DATA ARCHITECTURE

Create an explicit data-placement policy.

## Store on-chain

- document ID
- owner address
- CID
- document SHA-256 hash
- registration timestamp
- revocation state
- access-control state
- identity association information as required
- immutable events

## Store on IPFS

- encrypted document bytes

## Do NOT store on-chain

- raw PDF
- plaintext sensitive content
- private keys
- seed phrases
- raw encryption keys
- passwords
- large files

## Do NOT store on public IPFS

- plaintext sensitive documents

The architecture must make this separation explicit.

---

# 11. SOURCE-OF-TRUTH ARCHITECTURE

Define the source of truth for every important state:

```text
Wallet address
→ MetaMask

Wallet signature
→ MetaMask

Document bytes
→ User upload

File hash
→ Actual SHA-256 computation

Encrypted document
→ Actual AES-256-GCM operation

IPFS CID
→ Real IPFS response

Document owner
→ DocumentRegistry

Document hash
→ DocumentRegistry

Access permission
→ AccessControl

Revocation
→ Smart contract

Transaction status
→ Blockchain receipt

Block
→ Blockchain

Audit events
→ Blockchain event logs

Verification result
→ Current hash + on-chain record + required state checks

Contract address
→ Deployment output
```

The UI must never become the source of truth.

A local React/Next.js state variable must never be treated as the authoritative permission, ownership, or verification state.

---

# 12. TRUST BOUNDARY DESIGN

Document all trust boundaries.

At minimum:

## Boundary A — Browser to Wallet

The browser interacts with MetaMask.

The user controls transaction signing.

## Boundary B — Browser to Backend

User input crosses into the application API.

Backend validation is required.

## Boundary C — Backend to IPFS

The backend communicates with the real IPFS service.

The response must be validated.

## Boundary D — Browser to Blockchain

ethers.js/MetaMask communicates with the smart contract.

Transactions are user-authorized.

## Boundary E — Blockchain to Application

The application reads actual blockchain state/events.

The application must not invent blockchain state.

## Boundary F — IPFS to Verification

Retrieved encrypted content must be validated, decrypted where authorized, and hashed before verification.

---

# 13. SECURITY BOUNDARIES

Document where sensitive information is allowed.

## Browser

May contain:

- current document bytes during upload
- transient cryptographic state required for the user flow
- wallet connection information

Must NOT contain:

- backend private keys
- RPC private secrets
- IPFS server secrets
- wallet seed phrase

## Backend

May contain:

- server-side service credentials in environment variables
- IPFS credentials
- blockchain RPC credentials where required

Must NOT expose secrets to the browser.

## Blockchain

May contain:

- public wallet addresses
- document hashes
- CIDs
- access state
- event data

Must NOT contain:

- plaintext private documents
- private keys
- raw encryption keys

## IPFS

May contain:

- encrypted document content

Must not receive plaintext sensitive documents when public IPFS is used.

---

# 14. ENVIRONMENT/CONFIGURATION ARCHITECTURE

Define the planned environment variables but do not populate credentials.

Example:

```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=

CONTRACT_ADDRESS=
CONTRACT_NETWORK=
```

Document:

- which variables belong to backend
- which are safe for browser exposure
- which must remain server-side
- how `.env` is ignored by Git
- how `.env.example` is maintained

No real credentials should be added in Phase 2.

---

# 15. API ARCHITECTURE

Freeze the planned custom REST interface.

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

For each endpoint, document:

- purpose
- caller
- request data
- response data
- underlying service
- source of truth
- possible errors
- whether it performs a blockchain transaction
- whether it only reads state

IMPORTANT:

Do not implement the endpoints yet.

---

# 16. WEB3 TRANSACTION BOUNDARY

Explicitly document which operations should be direct wallet-authorized blockchain writes.

At minimum:

```text
registerDocument()
grantAccess()
revokeAccess()
revokeDocument()
```

Expected flow:

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
User approval
  |
  v
Ethereum
  |
  v
Transaction receipt
```

The backend must not secretly sign user transactions using a server-owned private key.

---

# 17. DOCUMENT REGISTRATION SEQUENCE

Create a sequence diagram representing:

```text
User
 |
 | select real file
 v
Frontend
 |
 | SHA-256
 v
Hash
 |
 | AES-256-GCM
 v
Encrypted file
 |
 | upload encrypted file
 v
Backend
 |
 | real IPFS API
 v
IPFS
 |
 | real CID
 v
Backend/Frontend
 |
 | registerDocument(hash, cid, ...)
 v
ethers.js
 |
 v
MetaMask
 |
 | user confirms
 v
Ethereum
 |
 | receipt
 v
Frontend
 |
 | read actual record
 v
Dashboard
```

The architecture must explicitly state:

- if IPFS fails, blockchain registration must not proceed
- if the transaction fails, the UI must not report registration success
- no CID may be fabricated

---

# 18. DOCUMENT VERIFICATION SEQUENCE

Create a sequence diagram:

```text
Verifier
 |
 | select/submit document
 v
Frontend
 |
 | retrieve encrypted file
 v
IPFS
 |
 | encrypted bytes
 v
Frontend/Application
 |
 | decrypt when authorized
 v
Actual document
 |
 | SHA-256
 v
Current hash
 |
 | read record
 v
Ethereum
 |
 | registered hash + revocation/access state
 v
Verification Service
 |
 | compare
 v
Verification Result
```

Decision logic:

```text
Hash match
+
document not revoked
+
required access authorized
=
Verified
```

Otherwise return the appropriate real failure state.

---

# 19. TAMPER-DETECTION ARCHITECTURE

Define the required architecture:

```text
Original registered document
          |
          v
On-chain hash = H1

Current file
          |
          v
SHA-256 = H2

H1 == H2
    |
    +--> valid integrity

H1 != H2
    |
    +--> tamper detected
```

No boolean such as `isVerified = true` may be used as a substitute for the comparison.

---

# 20. DOCUMENT SHARING ARCHITECTURE

Define the sharing model.

Owner:

```text
Owner wallet
    |
    v
grantAccess(recipient)
    |
    v
MetaMask
    |
    v
Ethereum
    |
    v
AccessGranted event
```

Recipient:

```text
Recipient wallet
    |
    v
hasAccess(document)
    |
    +---- false ----> Access Denied
    |
    +---- true -----> Proceed with authorized retrieval/decryption
```

Architecture must explicitly distinguish:

- blockchain authorization
- cryptographic decryption capability

The blockchain permission alone does not automatically expose a private encryption key.

---

# 21. REVOCATION ARCHITECTURE

Define:

```text
Owner
  |
  v
revokeAccess()
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

Future access:

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
Denied
```

The UI must read current contract state.

---

# 22. AUDIT ARCHITECTURE

Define the audit source:

```text
Solidity event
       |
       v
Ethereum log
       |
       v
Blockchain service
       |
       v
Audit API/UI
```

Potential events:

- DocumentRegistered
- AccessGranted
- AccessRevoked
- DocumentRevoked

If a verification operation is later designed as an on-chain event,
document it only if the final implementation actually emits such an event.

The architecture must not create an audit record merely because a button was clicked in the UI.

---

# 23. ERROR FLOW ARCHITECTURE

Create an error flow for each major dependency.

## Wallet failure

```text
Wallet unavailable
    |
    v
No authentication
    |
    v
Clear UI error
```

## IPFS failure

```text
IPFS failure
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

## Blockchain failure

```text
Blockchain failure
    |
    v
No confirmed transaction
    |
    v
No success state
```

## Verification failure

```text
Hash mismatch
    |
    v
Verification failure
    |
    v
Tamper detected
```

## Authorization failure

```text
hasAccess = false
    |
    v
Access denied
```

No fallback data is permitted.

---

# 24. UI STATE ARCHITECTURE

Define required UI state categories:

- disconnected
- connected
- authenticating
- authenticated
- idle
- selecting file
- hashing
- encrypting
- IPFS upload pending
- IPFS uploaded
- transaction pending
- transaction confirmed
- verification in progress
- verified
- tampered
- revoked
- unauthorized
- service unavailable
- empty data

These are state definitions only.

Do not implement them yet.

---

# 25. DATA-PROVENANCE / TRANSPARENCY ARCHITECTURE

Define how the final application can expose provenance.

Example:

```text
File
Source: user upload

Hash
Source: SHA-256 from file bytes

CID
Source: IPFS upload response

Owner
Source: MetaMask + smart contract

Transaction
Source: blockchain receipt

Block
Source: blockchain

Permission
Source: AccessControl contract

Verification
Source: computed comparison
```

This is a functional transparency requirement.

---

# 26. NO-SYNTHETIC-DATA ARCHITECTURAL RULES

The architecture must explicitly prohibit:

- fake transaction flows
- fake IPFS success
- fake CID generation
- fake blockchain state
- hard-coded document records
- hard-coded verification results
- mock user records
- fake audit logs
- frontend-only permissions

If a service fails, the architecture must stop the affected workflow or present an explicit failure state.

---

# 27. OBSERVABILITY REQUIREMENTS

Define what must be observable during the final demonstration.

The application should be able to display:

- connected chain ID
- connected wallet
- deployed contract address
- transaction hash
- transaction status
- block number after confirmation
- IPFS CID
- document SHA-256
- access state
- revocation state
- audit events
- verification result
- source/provenance where appropriate

These must be populated from real runtime sources later.

---

# 28. FINAL ARCHITECTURE DIAGRAMS TO CREATE

Create an architecture document containing at minimum:

1. High-level system architecture
2. Layered architecture
3. Component architecture
4. Data-flow diagram
5. Upload sequence diagram
6. Verification sequence diagram
7. Sharing sequence diagram
8. Revocation sequence diagram
9. Audit/event flow diagram
10. Trust-boundary diagram
11. Security architecture diagram
12. On-chain/off-chain data diagram
13. API/component interaction diagram

Use the actual project terminology.

Do not replace architecture documentation with generic boilerplate.

---

# 29. DOCUMENTATION FILES TO CREATE OR UPDATE

Create or update:

```text
docs/architecture.md
docs/api.md
docs/security.md
```

If these files already exist:

- inspect them first
- preserve valid information
- update carefully
- do not blindly overwrite

Also update:

```text
docs/requirements-traceability.md
```

only where Phase 2 adds architecture mappings.

---

# 30. docs/architecture.md REQUIRED STRUCTURE

Use:

```text
# 1. Architecture Overview
# 2. System Objectives
# 3. Layered Architecture
# 4. Component Architecture
# 5. Frontend Architecture
# 6. Backend Architecture
# 7. Blockchain Architecture
# 8. IPFS Architecture
# 9. Cryptography Architecture
# 10. Identity / Wallet Architecture
# 11. On-Chain vs Off-Chain Data
# 12. Source-of-Truth Model
# 13. Trust Boundaries
# 14. Security Boundaries
# 15. Data Flow
# 16. Upload Sequence
# 17. Verification Sequence
# 18. Sharing Sequence
# 19. Revocation Sequence
# 20. Audit Flow
# 21. Error Flow
# 22. UI State Model
# 23. Environment / Configuration Boundaries
# 24. Final End-to-End Architecture
# 25. Architecture Decisions
# 26. Future Scope Boundaries
```

---

# 31. docs/api.md REQUIRED STRUCTURE

Document planned APIs:

```text
# 1. API Architecture
# 2. API Design Principles
# 3. Authentication APIs
# 4. IPFS APIs
# 5. Document APIs
# 6. Verification API
# 7. Audit API
# 8. Source of Truth
# 9. Error Responses
# 10. Security Requirements
# 11. External Service Dependencies
```

For each endpoint document:

- method
- path
- purpose
- caller
- inputs
- outputs
- source of data
- possible errors
- whether it reads blockchain
- whether it writes to blockchain
- whether it interacts with IPFS

Do not implement the APIs in Phase 2.

---

# 32. docs/security.md REQUIRED STRUCTURE

Use:

```text
# 1. Security Objectives
# 2. Threat Boundaries
# 3. Data Confidentiality
# 4. Data Integrity
# 5. Identity
# 6. Access Control
# 7. Encryption
# 8. Blockchain Security
# 9. IPFS Privacy
# 10. Secret Management
# 11. Wallet Security
# 12. Error / Fail-Closed Behavior
# 13. Auditability
# 14. Security Limitations
```

Do not claim security properties that have not actually been implemented.

---

# 33. ARCHITECTURE DECISIONS TO FREEZE

At the end of Phase 2, freeze at minimum:

## Decision A

Blockchain is authoritative for:

- ownership
- document hash
- CID registration
- access permissions
- revocation state
- immutable events

## Decision B

IPFS stores encrypted document data.

## Decision C

AES-256-GCM is the data-encryption mechanism.

## Decision D

SHA-256 is the integrity/hash mechanism.

## Decision E

MetaMask is the user wallet/signing mechanism.

## Decision F

ethers.js is used for EVM interaction.

## Decision G

Node.js/Express is the custom application API layer.

## Decision H

Next.js is the frontend framework.

## Decision I

User-authorized blockchain writes should be signed through MetaMask.

## Decision J

No synthetic runtime data or fake success states are allowed.

If an architecture decision must change, document the change and reason before implementation.

---

# 34. API KEY / CREDENTIAL POLICY IN PHASE 2

Do not request or add real API credentials in Phase 2.

Do not create fake keys.

Do not create fake URLs.

Only document which environment variables will be required later.

Real credential setup belongs to the phase in which the corresponding external service is integrated.

---

# 35. PHASE 2 ACCEPTANCE CRITERIA

Phase 2 is COMPLETE only when:

[ ] ai_rules.md was read and obeyed
[ ] MASTER_PLAN.md was read
[ ] PHASE_1_PROMPT.md was read
[ ] Phase 1 requirements docs were read
[ ] repository was inspected
[ ] architecture is frozen
[ ] component boundaries are documented
[ ] frontend architecture is documented
[ ] backend architecture is documented
[ ] blockchain architecture is documented
[ ] IPFS architecture is documented
[ ] cryptography architecture is documented
[ ] identity architecture is documented
[ ] on-chain/off-chain storage is documented
[ ] source-of-truth model is documented
[ ] trust boundaries are documented
[ ] security boundaries are documented
[ ] API responsibilities are documented
[ ] smart-contract responsibilities are documented
[ ] upload flow is documented
[ ] verification flow is documented
[ ] sharing flow is documented
[ ] revocation flow is documented
[ ] audit flow is documented
[ ] error flow is documented
[ ] UI state model is documented
[ ] environment boundaries are documented
[ ] architecture diagrams are created
[ ] API documentation is created/updated
[ ] security documentation is created/updated
[ ] requirements traceability is updated
[ ] no API keys were added
[ ] no synthetic runtime data was created
[ ] no Phase 3+ implementation was started

---

# 36. IMPORTANT PHASE BOUNDARY

Phase 2 is an architecture/design phase.

The agent MUST NOT proceed automatically to Phase 3.

Do not:

- create Hardhat configuration
- create Solidity contracts
- deploy contracts
- configure real RPC
- connect to IPFS
- implement encryption
- implement backend endpoints
- implement frontend components
- add API keys
- implement blockchain transactions

Those belong to later phases.

The purpose of Phase 2 is to leave behind a complete technical blueprint that another engineer/AI agent can follow without guessing.

---

# 37. REQUIRED FINAL AGENT REPORT

After Phase 2, return:

```text
PHASE:
Phase 2 — System Architecture & Data Flow

PROJECT UNDERSTANDING:
Explain the architecture and complete data flow.

REPOSITORY INSPECTION:
Summarize the repository state before changes.

DOCUMENTS READ:
List every source actually inspected.

FILES CREATED:
List exact paths.

FILES MODIFIED:
List exact paths.

ARCHITECTURE:
Summarize the final architecture.

COMPONENTS:
Summarize component responsibilities.

SOURCE OF TRUTH:
Summarize authoritative data sources.

ON-CHAIN / OFF-CHAIN:
Summarize what is stored where.

API ARCHITECTURE:
Summarize planned endpoints and responsibilities.

SMART-CONTRACT ARCHITECTURE:
Summarize contract responsibilities.

SECURITY:
Summarize security boundaries.

ERROR HANDLING:
Summarize failure behavior.

DATA FLOW:
Summarize upload, verification, sharing, revocation, and audit flows.

ARCHITECTURE DECISIONS:
List decisions frozen in this phase.

DIAGRAMS:
List diagrams created.

VALIDATION:
List every validation performed.

SYNTHETIC-DATA CHECK:
Explicitly confirm whether any synthetic/mock runtime data was created.

LATER-PHASE CHECK:
Explicitly confirm whether any Phase 3+ implementation was started.

BLOCKERS:
List actual blockers.

STATUS:
COMPLETE / INCOMPLETE
```

Do not claim COMPLETE unless every acceptance criterion has actually passed.

---

# 38. FINAL INSTRUCTION

The purpose of Phase 2 is to remove architectural ambiguity.

Before implementation begins, a developer must be able to answer:

- What does each layer do?
- Where does each piece of data come from?
- What is authoritative?
- What goes on-chain?
- What goes to IPFS?
- Where is encryption performed?
- Where is SHA-256 calculated?
- Which operations require MetaMask?
- Which APIs belong to the application?
- Which operations are blockchain reads?
- Which operations are blockchain writes?
- What happens when IPFS fails?
- What happens when blockchain fails?
- How is tampering detected?
- How is sharing controlled?
- How is revocation enforced?
- How are audit records generated?
- Where are secrets stored?
- Which future features are excluded?

If the architecture cannot answer these clearly, Phase 2 is not complete.

Do not fill architectural gaps with assumptions or fabricated implementation details.

END OF PHASE 2
