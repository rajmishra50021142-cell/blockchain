# PHASE 1 — REQUIREMENTS & SCOPE FREEZE
# Blockchain-Based Digital Document Locker

> **Phase:** 1 of the master implementation plan  
> **Phase objective:** Freeze the complete project requirements, scope, traceability, and implementation boundaries before actual development begins.

---

## 1. PHASE OBJECTIVE

You are implementing **PHASE 1** of the Blockchain-Based Digital Document Locker.

This phase is ONLY for:

- requirements analysis
- project scope definition
- requirement traceability
- architecture-level understanding
- API requirements definition
- smart-contract requirements definition
- security requirements definition
- error-handling requirements definition
- real-data/provenance requirements definition
- final demonstration requirements
- documentation planning

### DO NOT IMPLEMENT THE ACTUAL APPLICATION YET.

Do NOT build:

- frontend functionality
- backend functionality
- Solidity smart contracts
- IPFS integration
- blockchain integration
- wallet transactions
- authentication implementation
- cryptographic implementation
- database
- mock/demo data
- synthetic application records

The purpose of Phase 1 is to completely understand and freeze the project before implementation begins.

---

# 2. MANDATORY DOCUMENTS TO READ FIRST

Before doing anything, inspect the repository and read:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. The supplied mandatory-project-requirements image
4. The supplied Blockchain-Based Digital Document Locker PPT
5. Any existing `README.md`
6. Existing project files and folders

## IMPORTANT

`ai_rules.md` is a NON-NEGOTIABLE PROJECT RULE.

You MUST obey it throughout the entire project.

`MASTER_PLAN.md` is the master implementation plan.

The supplied requirements image and PPT are project reference materials and must not be silently replaced by assumptions.

Do not modify `ai_rules.md` unless explicitly instructed.

If a source is unavailable, report the blocker. Do not invent the missing content.

---

# 3. CORE PROJECT IDENTITY

## Project Title

**Blockchain-Based Digital Document Locker**

## Project Objective

Build a real, functional, blockchain-based digital document locker that provides:

- decentralized document storage
- cryptographic integrity verification
- user-controlled access
- secure document sharing
- access revocation
- blockchain-based verification
- immutable audit trail
- wallet-based identity
- DID-oriented authentication
- privacy through encrypted storage

The application must operate on REAL runtime data.

The application must NOT become a simulated blockchain dashboard.

The final system must use:

- real user-uploaded documents
- real cryptographic calculations
- real IPFS responses
- real wallet addresses
- real wallet signatures
- real smart contracts
- real blockchain transactions
- real blockchain reads/events
- real transaction confirmations
- real verification results

---

# 4. NON-SYNTHETIC DATA REQUIREMENT

The entire non-synthetic-data policy in `ai_rules.md` is mandatory.

The project must NEVER fabricate:

- wallet addresses
- user identities
- documents
- document records
- IPFS CIDs
- transaction hashes
- block numbers
- blockchain timestamps
- document hashes
- permissions
- audit events
- smart-contract results
- verification results
- fake transaction confirmations
- fake IPFS responses

The application must never use synthetic values to make the UI look functional.

If an external service fails:

- show a clear error
- stop the affected operation where appropriate
- do not invent replacement data
- do not show fake success
- do not create fallback records

The UI must show empty states where real data does not exist.

Example:

> No documents registered yet.

rather than creating a sample document.

---

# 5. MANDATORY PROJECT REQUIREMENTS

Analyze the supplied mandatory requirements image and convert every requirement into explicit implementation requirements.

The five major mandatory areas are:

## Requirement 1 — Blockchain Network Setup

Must cover:

- blockchain network configuration
- accounts
- identities
- network connectivity
- RPC connectivity
- deployment
- real transaction capability
- real transaction confirmation

## Requirement 2 — Smart Contract / Chaincode Implementation

Must cover:

- smart-contract development
- storage
- core business logic
- transaction handling
- access control
- authorization
- events
- testing
- deployment

## Requirement 3 — Frontend–Blockchain Integration

Must cover:

- wallet connection
- smart-contract interaction
- user-authorized transactions
- contract-function invocation
- blockchain-state retrieval
- transaction status
- confirmation state
- real blockchain data shown in the UI

## Requirement 4 — Functional Demonstration of Core Modules

Must cover:

- real document upload
- SHA-256 hashing
- encryption
- IPFS storage
- blockchain registration
- real transaction confirmation
- sharing
- access control
- verification
- tamper detection
- revocation
- audit trail
- end-to-end workflow

## Requirement 5 — Code Quality, Documentation and Review Progress

Must cover:

- architecture documentation
- setup documentation
- API documentation
- smart-contract documentation
- testing documentation
- deployment documentation
- security documentation
- requirement traceability
- progress evidence
- review readiness

Do not merely list these five headings. Break them into concrete requirements.

---

# 6. UNDERSTAND THE SUPPLIED PPT

Review the entire supplied Blockchain-Based Digital Document Locker PPT.

Preserve the supplied project terminology.

The PPT's architecture includes:

## Presentation Layer

- Next.js
- Tailwind
- ethers.js
- MetaMask / Web3 wallet access

## Application Layer

- Node.js API gateway
- AES-256-GCM encryption

## Blockchain Layer

- Ethereum smart contracts
- immutable audit log

## Decentralized Storage

- IPFS
- encrypted documents / replication

## Verification and Audit Layer

- hash checks
- revocation checks

The project scope includes:

- secure digital document storage using IPFS
- blockchain-based document verification
- smart-contract-enabled access control
- DID-based authentication
- tamper-proof audit trail
- secure sharing among users, institutions and organizations

The PPT security model includes:

- AES-256-GCM for data-at-rest protection
- SHA-256 for integrity/change detection
- smart contracts for access control
- Ethereum for immutable audit
- wallet signatures for identity verification
- IPFS for distributed storage

Do not silently expand these requirements into unrelated features.

---

# 7. CURRENT CORE SCOPE

## IN SCOPE

The core project must include:

1. Web3 wallet connection
2. Wallet-based authentication/signature
3. DID-oriented identity registry
4. Real document upload
5. SHA-256 document hashing
6. AES-256-GCM document encryption
7. Encrypted document storage using IPFS
8. Real IPFS CID generation
9. Ethereum smart contracts
10. Document registration
11. Document ownership
12. Smart-contract access control
13. Document sharing
14. Access revocation
15. Blockchain-based verification
16. Hash comparison
17. Tamper detection
18. Document revocation
19. Immutable blockchain audit events
20. Node.js / Express APIs
21. Next.js frontend
22. ethers.js integration
23. MetaMask integration
24. Real transaction submission
25. Real transaction confirmation
26. Real blockchain-state retrieval
27. Error handling
28. Fail-closed behavior
29. Empty states
30. End-to-end functional demonstration
31. Automated testing
32. Documentation

---

# 8. FUTURE / OUT-OF-SCOPE FOR CORE IMPLEMENTATION

The supplied PPT identifies the following as future scope unless explicitly added later:

- mobile application
- FIDO2 authentication
- ZK-SNARKs
- institutional API ecosystem
- cross-chain support
- Polygon
- Arbitrum
- AI fraud detection

Record these in the documentation as future scope.

Do not silently turn them into core requirements.

IMPORTANT:

A normal SHA-256 hash comparison is NOT itself a zero-knowledge proof.

Do not claim that the core hash-verification mechanism is a ZK proof unless an actual ZK system is later implemented.

---

# 9. PROJECT ACTORS

Define the actual application roles.

## Document Owner

Capabilities:

- connect wallet
- authenticate
- upload document
- register document
- view own documents
- grant access
- revoke access
- revoke document
- view audit information

## Authorized Verifier / Recipient

Capabilities:

- connect wallet
- authenticate
- view documents for which access is actually granted
- retrieve authorized encrypted documents
- verify authorized documents

## Unauthorized User

The system must:

- deny access
- rely on actual smart-contract state
- not use frontend-only permission flags

These are role definitions only.

Do NOT seed the application with fake users.

---

# 10. REAL DATA FLOW REQUIREMENT

Document the expected data flow.

## Registration flow

```text
REAL USER FILE
    |
    v
Read actual bytes
    |
    v
SHA-256
    |
    v
AES-256-GCM encryption
    |
    v
Encrypted document
    |
    v
REAL IPFS upload
    |
    v
REAL IPFS CID
    |
    v
Smart-contract registration
    |
    v
MetaMask
    |
    v
Real blockchain transaction
    |
    v
Real transaction receipt
    |
    v
Actual on-chain record
```

## Verification flow

```text
REAL DOCUMENT
    |
    v
Decrypt
    |
    v
SHA-256
    |
    v
Read registered hash from blockchain
    |
    v
Compare
    |
    +---- MATCH --------> VERIFIED
    |
    +---- MISMATCH -----> TAMPER DETECTED
```

## Sharing flow

```text
OWNER
    |
    v
grantAccess()
    |
    v
MetaMask
    |
    v
Ethereum
    |
    v
AccessGranted
```

## Revocation flow

```text
OWNER
    |
    v
revokeAccess()
    |
    v
Ethereum
    |
    v
AccessRevoked
    |
    v
Future access request
    |
    v
DENIED
```

This is a requirements definition only in Phase 1.

Do not implement the workflows yet.

---

# 11. SOURCE-OF-TRUTH REQUIREMENTS

Create a formal table with these mappings:

| Value | Source |
|---|---|
| Wallet address | MetaMask |
| Wallet signature | Actual wallet signature |
| Document bytes | User upload |
| SHA-256 | Actual uploaded file |
| AES ciphertext | Actual AES-256-GCM operation |
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

If the source is unavailable:

- return error or empty state
- never fabricate a replacement

---

# 12. ERROR-HANDLING REQUIREMENTS

Document explicit requirements for all major failures.

## Wallet unavailable

Show:

> Wallet not connected.

Do not create a fake identity.

## Signature rejected

Authentication fails.

Do not authenticate the user.

## Wrong network

Prevent unsupported blockchain operations and clearly tell the user what is required.

## Blockchain unavailable

Do not:

- invent transaction hash
- invent block
- invent confirmation
- report success

## Transaction rejected

Do not report successful registration/access/revocation.

## Transaction reverted

Display the real failure.

Do not report success.

## IPFS unavailable

Do not produce a CID.

## IPFS upload failed

Do not register the document on-chain.

## Decryption failed

Do not verify the document.

## Hash mismatch

Show verification failure/tamper detection.

## No documents

Show empty state.

## No audit events

Show empty state.

## Unauthorized access

Deny access based on actual authorization state.

---

# 13. API REQUIREMENTS

Do NOT implement these APIs in Phase 1.

Document the planned API structure:

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

These are CUSTOM Node.js/Express APIs created by the project.

The actual external-service integrations will be implemented later.

Do not request API keys in Phase 1.

Do not create API credentials.

Do not hard-code credentials.

---

# 14. SMART-CONTRACT REQUIREMENTS

Do NOT implement Solidity in Phase 1.

Document the required contract responsibilities.

## IdentityRegistry.sol

Requirements:

- register identity
- retrieve identity
- update identity
- deactivate identity

## DocumentRegistry.sol

Requirements:

- document registration
- owner
- IPFS CID
- document SHA-256 hash
- timestamp
- revocation state
- retrieval
- registration event
- revocation event

## AccessControl.sol

Requirements:

- grant access
- revoke access
- check access
- access events

Document ownership and authorization requirements.

---

# 15. ON-CHAIN DATA REQUIREMENTS

The blockchain should store appropriate metadata/proof.

Expected on-chain information:

- document ID
- owner address
- IPFS CID
- document hash
- registration timestamp
- revocation state
- access-control state
- event/audit information

The blockchain must NOT store:

- raw PDF
- large document contents
- plaintext sensitive content
- private encryption keys
- wallet private keys
- seed phrases
- passwords

---

# 16. CRYPTOGRAPHY REQUIREMENTS

## SHA-256

Purpose:

- document fingerprint
- integrity
- tamper detection
- comparison against on-chain record

Requirement:

The hash must always be computed from the actual uploaded file.

## AES-256-GCM

Purpose:

- confidentiality
- encrypted document storage

Requirement:

Only encrypted document content should be stored on public IPFS.

---

# 17. KEY-MANAGEMENT REQUIREMENTS

Do NOT store the raw document encryption key:

- on-chain
- in public IPFS
- in source code
- in frontend constants
- in public API responses

Separate:

```text
Blockchain authorization
=
Who is authorized?

Cryptographic key handling
=
Who can decrypt?
```

A real key-sharing mechanism must later be designed if multiple users need to decrypt shared documents.

---

# 18. SECURITY REQUIREMENTS

Document the security layers:

## Data Confidentiality

AES-256-GCM

## Data Integrity

SHA-256

## Access Control

Smart contracts

## Identity

Wallet signatures / DID-oriented identity

## Storage

Encrypted document on IPFS

## Audit

Blockchain events

## Secrets

Environment variables

## Failure Safety

Fail-closed / honest errors

---

# 19. REAL-DATA PROVENANCE REQUIREMENT

The final UI should be capable of explaining where important information originated.

Example:

```text
File:
Source = Actual user upload

SHA-256:
Source = Actual file computation

IPFS CID:
Source = Live IPFS response

Wallet:
Source = MetaMask

Transaction hash:
Source = Blockchain receipt

Block:
Source = Blockchain

Permission:
Source = Smart contract

Verification:
Source = Hash/state comparison
```

Treat provenance as a project requirement, not decorative text.

---

# 20. FINAL FUNCTIONAL DEMONSTRATION REQUIREMENTS

The final demonstration must later be capable of performing this complete real workflow:

1. Connect MetaMask
2. Authenticate with wallet signature
3. Upload a real permitted document
4. Compute SHA-256
5. Encrypt with AES-256-GCM
6. Upload encrypted document to real IPFS
7. Receive real CID
8. Register document on Ethereum
9. Approve transaction through MetaMask
10. Wait for real receipt
11. Display transaction hash
12. Display block number
13. Display actual on-chain document state
14. Grant access to another actual wallet
15. Verify the document
16. Modify the document
17. Detect hash mismatch
18. Revoke access
19. Attempt access after revocation
20. Show access denied
21. Display real blockchain audit events

This must be a later implementation/demo requirement.

Do not implement it during Phase 1.

---

# 21. REQUIRED DOCUMENTATION FILES FOR PHASE 1

Create or update ONLY the required planning documents.

## `docs/requirements.md`

Use this structure:

```text
# 1. Project Overview
# 2. Problem Statement
# 3. Project Objective
# 4. Proposed Solution
# 5. Project Actors
# 6. Functional Requirements
# 7. Non-Functional Requirements
# 8. External Service Requirements
# 9. API Requirements
# 10. Smart Contract Requirements
# 11. Data Model Requirements
# 12. Security Requirements
# 13. Error Handling Requirements
# 14. Real-Data / Provenance Requirements
# 15. In-Scope Features
# 16. Future / Out-of-Scope Features
# 17. Final Demonstration Requirements
# 18. Acceptance Criteria
```

## `docs/requirements-traceability.md`

Use a matrix with:

```text
Requirement ID
Requirement
Source
Implementation Phase
Expected Component
Expected Test
Expected Demonstration Evidence
Status
```

Map every mandatory requirement and the major functional requirements.

---

# 22. MANDATORY REQUIREMENTS IMAGE

Locate the supplied project-requirements image if it is accessible.

Preferred location:

```text
docs/mandatory-requirements.png
```

Preserve the original image.

Do not redraw it.

Do not reconstruct it from memory.

Do not replace it with a summary.

If it cannot be accessed, report the blocker.

Do not fabricate a replacement.

---

# 23. SCOPE CONTROL

Do NOT:

- install unnecessary technologies
- add MongoDB just because a backend exists
- add unnecessary APIs
- add paid LLMs
- add AI fraud detection to the core
- add cross-chain support
- add mobile support
- add FIDO2
- add ZK-SNARK implementation
- add Polygon
- add Arbitrum
- create mock records
- create demo users
- create fake transactions
- create fake CIDs

Preserve the supplied project scope.

---

# 24. DO NOT IMPLEMENT FUTURE PHASES

Phase 1 ends after requirements and traceability documentation are complete.

Do NOT implement:

- blockchain network
- Solidity contracts
- IPFS
- backend
- frontend
- wallet transaction flows
- cryptography
- API integrations
- smart-contract deployment
- database
- authentication code

You may describe these future phases in the documentation.

Do not implement them.

---

# 25. VALIDATION BEFORE PHASE COMPLETION

Before reporting Phase 1 complete:

1. Re-read `ai_rules.md`.
2. Re-read the relevant sections of `MASTER_PLAN.md`.
3. Verify all five mandatory project requirements are represented.
4. Verify all major PPT project-scope items are represented.
5. Verify future-scope items have not been silently added to core scope.
6. Verify the non-synthetic-data policy is documented.
7. Verify source-of-truth mappings are documented.
8. Verify error-handling requirements are documented.
9. Verify API requirements are documented but not implemented.
10. Verify smart-contract requirements are documented but not implemented.
11. Verify security requirements are documented.
12. Verify final demo requirements are documented.
13. Verify no API keys/secrets were created or requested.
14. Verify no fake data was generated.
15. Verify no mock/fallback runtime data was created.
16. Verify the requirements-traceability matrix is complete.
17. Verify the supplied requirements image is preserved if accessible.

---

# 26. PHASE 1 ACCEPTANCE CRITERIA

Phase 1 is COMPLETE only when all are true:

- [ ] `ai_rules.md` was read
- [ ] `MASTER_PLAN.md` was read
- [ ] supplied project requirements were reviewed
- [ ] supplied PPT was reviewed
- [ ] project scope is frozen
- [ ] actors are defined
- [ ] functional requirements are defined
- [ ] non-functional requirements are defined
- [ ] external service requirements are defined
- [ ] API structure is documented
- [ ] smart-contract requirements are documented
- [ ] source-of-truth table is documented
- [ ] error-handling requirements are documented
- [ ] security requirements are documented
- [ ] real-data provenance requirements are documented
- [ ] in-scope features are documented
- [ ] future-scope features are documented
- [ ] final functional demonstration is documented
- [ ] requirements traceability is complete
- [ ] mandatory requirements image is preserved if accessible
- [ ] later phases were not implemented
- [ ] no API keys were added
- [ ] no synthetic runtime data was created
- [ ] no fake blockchain/IPFS data was created

---

# 27. REQUIRED FINAL AGENT REPORT

After implementation, do NOT simply report "Phase 1 complete."

Return:

```text
PHASE:
Phase 1 — Requirements & Scope Freeze

PROJECT UNDERSTANDING:
Explain the complete project in your own words.

DOCUMENTS READ:
List the actual documents inspected.

FILES CREATED/UPDATED:
List exact files.

REQUIREMENTS COVERED:
Summarize all mandatory requirements covered.

SCOPE:
Summarize current core scope and future scope.

API PLAN:
Summarize the planned custom API structure.

SMART CONTRACT PLAN:
Summarize the contract responsibilities.

REAL-DATA POLICY:
Explain how synthetic data is prevented.

SOURCE OF TRUTH:
Explain where runtime values will originate.

ERROR HANDLING:
Explain how failures will be handled.

TRACEABILITY:
Explain how requirements map to later phases.

VALIDATION:
List validations performed.

BLOCKERS:
List actual unresolved blockers.

SYNTHETIC-DATA CHECK:
Explicitly confirm whether any synthetic runtime/application
data was created.

STATUS:
COMPLETE / INCOMPLETE
```

Do not report `COMPLETE` unless every acceptance criterion has actually passed.

---

# 28. PHASE BOUNDARY

At the end of Phase 1:

The repository should contain a **complete, frozen project specification**, not a partially implemented application.

The next phase will handle system architecture and design.

Do not begin Phase 2 automatically.

---

# END OF PHASE 1
