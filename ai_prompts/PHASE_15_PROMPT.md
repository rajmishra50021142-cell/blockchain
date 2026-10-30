# PHASE 15 — FINAL REVIEW, HARDENING & DEPLOYMENT PACKAGE

## Purpose

Phase 15 is the final project review and hardening phase.

The goal is to take the complete system built through Phases 1–14 and produce a coherent, demonstrable, documented, security-reviewed project ready for:

- final demonstration
- faculty/project review
- rubric evaluation
- reproducible local execution
- future public-testnet deployment

The current project already includes:

```text
Phase 3  → Blockchain infrastructure
Phase 4  → Wallet / identity
Phase 5  → DocumentRegistry
Phase 6  → AccessControl
Phase 7  → Smart-contract testing/security
Phase 8  → Cryptography
Phase 9  → Real IPFS
Phase 10 → Backend APIs
Phase 11 → Frontend integration
Phase 12 → Real document registration
Phase 13 → Sharing / access revocation
Phase 14 → Verification / tamper detection
```

Phase 15 must NOT introduce unrelated new product features.

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before making any changes, read:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md` through `PHASE_15_PROMPT.md` if already present
4. All current documentation under `docs/`
5. Current `frontend/`
6. Current `backend/`
7. Current `blockchain/`
8. Current deployment/configuration files
9. Supplied project requirements/reference PPT and mandatory requirements image if available

Important documentation includes:

```text
docs/requirements.md
docs/requirements-traceability.md
docs/architecture.md
docs/api.md
docs/security.md
docs/cryptography.md
docs/ipfs.md
docs/document-registration.md
docs/sharing.md
docs/verification.md
docs/frontend.md
```

Treat the current repository as the implementation source of truth.

Do not silently redesign previous phases.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- comprehensive final end-to-end testing
- multi-user integration testing
- cross-module regression testing
- security hardening
- configuration review
- secret/credential review
- dependency review
- deployment reproducibility
- local deployment/runbook
- optional public-testnet preparation artifacts
- final documentation packaging
- final traceability review
- code quality review
- demo/readiness checklist
- known-limitations register
- final security and provenance review

This phase is NOT responsible for:

- adding major new business features
- implementing asymmetric AES key exchange
- implementing IdentityRegistry
- implementing ZK proofs
- implementing AI fraud detection
- implementing cross-chain functionality
- building a mobile application
- moving to mainnet
- claiming a formal external security audit if none was performed

---

# 3. DO NOT START PUBLIC DEPLOYMENT AUTOMATICALLY

The current system is configured for:

```text
Hardhat Local
RPC: http://127.0.0.1:8545
Chain ID: 31337
```

Do NOT automatically deploy to Sepolia, Base Sepolia, Polygon, mainnet, or any other public network.

Do NOT request or invent public RPC/API credentials.

Prepare deployment documentation/configuration only where useful.

Any public-testnet deployment must remain an explicit separate user action.

---

# 4. CURRENT SYSTEM INTEGRITY

Before changing anything, establish a baseline.

Run and record:

```text
frontend tests
backend tests
blockchain tests
typechecks
lint/build checks
```

Confirm:

```text
Hardhat node available
Backend available
Frontend available
MetaMask integration available
IPFS available
```

Do not modify code until the baseline is captured.

---

# 5. FULL END-TO-END DEMONSTRATION

Execute a complete real lifecycle using real runtime data:

```text
1. Start Hardhat
2. Verify chain ID
3. Start backend
4. Start frontend
5. Connect MetaMask owner
6. Authenticate wallet
7. Register a real document
8. Compute real SHA-256
9. AES-256-GCM encrypt the document
10. Upload encrypted payload to real IPFS
11. Receive real CID
12. Register document on-chain
13. Verify on-chain owner/hash/CID
14. Grant Account 2 access
15. Verify hasAccess == true
16. Switch to Account 2
17. Authenticate Account 2
18. Verify authorized access behavior
19. Verify a real candidate document
20. Test a modified candidate and confirm tamper detection
21. Switch back to owner
22. Revoke Account 2 access
23. Verify hasAccess == false
24. Verify access denial
25. Inspect audit events
26. Verify final document/permission/revocation state
```

Every step must use actual application results.

No fabricated screenshots, transaction hashes, CIDs, balances, or statuses.

---

# 6. REAL DEMONSTRATION DATA

Use only:

- real user-selected test documents
- real MetaMask accounts
- real local Hardhat transactions
- real IPFS CIDs
- real contract state
- real event logs
- real verification results

Do not seed fake dashboard data to make demonstrations look populated.

---

# 7. MULTI-USER TEST MATRIX

Validate at least:

### Owner

```text
can register
can view own document
can grant access
can revoke access
can verify
can inspect audit
```

### Authorized verifier

```text
can access permitted metadata/verification behavior
can verify when authorized
cannot perform owner-only grant/revoke operations
```

### Unauthorized wallet

```text
cannot access protected document metadata
cannot verify protected document
cannot grant/revoke
```

### Revoked verifier

```text
access is denied after revoke
```

Use real wallet identities in local testing.

---

# 8. COMPLETE FAILURE-MODE TESTING

Test at least:

### Wallet

- MetaMask unavailable
- user rejects wallet connection
- account changes
- wrong account
- wrong network
- provider disconnect

### Authentication

- challenge failure
- signature rejection
- expired session
- account/session mismatch

### IPFS

- upload failure
- invalid CID
- retrieval timeout
- gateway failure

### Blockchain

- transaction rejected
- contract revert
- duplicate document
- unauthorized transaction
- revoked-document operation
- provider failure
- post-write state mismatch

### Verification

- exact match
- hash mismatch
- revoked document
- unauthorized caller
- missing document
- missing AES key
- incorrect AES key
- corrupted ciphertext

Every failure must remain truthful.

---

# 9. SECURITY HARDENING REVIEW

Perform a final code review for:

```text
authentication
authorization
wallet handling
transaction signing
contract addresses
network validation
CORS
request validation
rate limiting
security headers
JWT handling
IPFS credentials
AES key handling
plaintext handling
error messages
logging
browser storage
environment files
```

Verify:

- no private keys in source
- no seed phrases in source
- no Pinata JWT in frontend
- no backend JWT secret in frontend
- no AES keys in frontend bundles
- no plaintext documents logged
- no secret values included in errors
- no secrets committed to Git

---

# 10. ENVIRONMENT / CONFIGURATION REVIEW

Review:

```text
.env
.env.local
.env.example
backend/.env
backend/.env.example
```

Required principles:

- secrets only on the server
- public values only in `NEXT_PUBLIC_*`
- `.env` files ignored by Git
- `.env.example` contains variable names only
- no fake credential placeholders presented as real values
- no hard-coded contract addresses where environment/deployment configuration is intended

Confirm the final documented local configuration.

---

# 11. CONTRACT ADDRESS REVIEW

Verify the actual deployed addresses used by the application match the current local deployment.

At minimum confirm:

```text
DocumentRegistry
AccessControl
```

Do not silently replace existing deployed addresses.

If deployment artifacts changed, update the appropriate configuration and documentation.

---

# 12. BLOCKCHAIN NETWORK REVIEW

Confirm:

```text
chainId
RPC URL
contract addresses
wallet expected network
```

are consistent across:

```text
frontend
backend
blockchain tests
MetaMask
documentation
```

No component should silently query a different network.

---

# 13. IPFS REVIEW

Confirm:

```text
encrypted payload only
real CID
backend relay
Pinata credentials server-side
retrieval works
CID validation works
failure is fail-closed
```

Do not claim high availability or redundancy beyond what the actual deployment provides.

---

# 14. CRYPTOGRAPHY REVIEW

Confirm:

```text
SHA-256 over exact original bytes
AES-256-GCM
fresh runtime key
fresh IV
authenticated ciphertext
```

Confirm the AES key:

```text
is not on-chain
is not in IPFS
is not in logs
is not in URLs
is not stored in localStorage/sessionStorage
```

Maintain the current limitation:

> Blockchain access permission does not automatically deliver the AES decryption key.

Do not implement a rushed insecure key-sharing system during Phase 15.

---

# 15. AUTHENTICATION REVIEW

Verify the complete flow:

```text
challenge
→ wallet signature
→ signature verification
→ JWT issuance
→ authenticated API request
```

Verify:

- nonce is single-use
- expiry is enforced
- wallet/account matches session
- account changes invalidate stale state
- JWT is not displayed as visible UI content
- JWT secret remains server-side

---

# 16. IMPORTANT UI SECURITY CLEANUP

Review the UI for information that should not be displayed directly.

Particularly inspect:

```text
Wallet & Identity
```

Do NOT display a complete session bearer JWT in the visible UI.

Show:

```text
Authenticated
Session active
Authenticated address
Expiry/status metadata
```

instead of exposing the token itself.

Do not expose:

```text
JWT
AES key
Pinata JWT
backend secret
private key
seed phrase
```

---

# 17. ERROR / OBSERVABILITY REVIEW

Ensure production-facing errors are understandable without leaking secrets.

Good:

```text
IPFS upload failed.
Blockchain transaction rejected.
Unauthorized access.
Verification hash mismatch.
```

Bad:

```text
raw stack trace
JWT
private key
AES key
credentials
internal secret
```

Keep detailed diagnostics in controlled development logs only when safe.

---

# 18. FALSE-CERTIFICATION REVIEW

The application must use precise wording.

Allowed:

```text
Candidate file SHA-256 matches the registered on-chain hash.
```

Avoid unsupported claims such as:

```text
100% authentic
legally certified
fraud-proof
guaranteed genuine
```

Do not imply that matching a hash proves facts beyond what the cryptographic evidence establishes.

---

# 19. SYNTHETIC DATA AUDIT

Perform a repository-wide audit for:

```text
mock
fake
dummy
demo
seed
sample
fallback
hard-coded document
hard-coded CID
hard-coded tx hash
hard-coded permission
hard-coded balance
fake audit event
```

Classify each occurrence:

```text
test fixture
documentation example
actual runtime data
```

Remove synthetic runtime application data.

The final report must explicitly state the result.

---

# 20. DEPENDENCY REVIEW

Inspect:

```text
frontend/package.json
backend/package.json
blockchain/package.json
```

Run the configured audit/check commands where appropriate.

Do NOT run destructive commands such as:

```text
npm audit fix --force
```

automatically.

Do not perform dependency upgrades that change working major versions unless necessary and explicitly justified.

Record important unresolved dependency/security warnings as known limitations.

---

# 21. CODE QUALITY REVIEW

Review:

- TypeScript typing
- error handling
- duplicate logic
- dead code
- unused imports
- inconsistent naming
- insecure shortcuts
- hard-coded environment values
- duplicated API paths
- duplicated blockchain logic
- duplicated crypto logic
- undocumented architecture deviations

Prefer small targeted fixes.

Do not rewrite working modules merely for style.

---

# 22. BUILD / LINT / TYPECHECK

Run the project's actual configured checks.

At minimum:

```text
frontend typecheck
frontend lint
frontend build
backend typecheck
backend lint if configured
blockchain compile
blockchain tests
frontend tests
backend tests
```

All failures must be investigated.

Do not hide warnings/errors to make the report look clean.

---

# 23. REPRODUCIBLE LOCAL SETUP

Create/update a clear startup procedure.

The final documentation should tell a reviewer how to start:

```text
1. Hardhat
2. Backend
3. Frontend
4. MetaMask local network
5. wallet/account setup
6. test document
7. complete demo flow
```

Include expected URLs:

```text
Hardhat RPC
Backend API
Frontend
```

Do not include secrets.

---

# 24. OPERATIONAL RUNBOOK

Create:

```text
docs/runbook.md
```

Include:

1. prerequisites
2. installation
3. environment setup
4. Hardhat start
5. contract deployment if applicable
6. backend start
7. frontend start
8. MetaMask configuration
9. IPFS configuration
10. document registration
11. access sharing
12. verification
13. revocation
14. audit inspection
15. troubleshooting
16. clean restart/reset procedure
17. known limitations

---

# 25. DEMO RUNBOOK

Create:

```text
docs/demo-runbook.md
```

Provide a concise faculty-demo sequence:

```text
Connect Owner
→ Authenticate
→ Register Document
→ Show SHA-256
→ Show IPFS CID
→ Show blockchain transaction
→ Show owner
→ Grant Verifier
→ Show AccessGranted
→ Switch Verifier
→ Verify Document
→ Modify candidate
→ Show Tamper Detected
→ Switch Owner
→ Revoke Verifier
→ Show AccessRevoked
→ Show audit trail
```

Use actual UI labels and current application behavior.

---

# 26. REQUIREMENTS TRACEABILITY FINALIZATION

Review:

```text
docs/requirements-traceability.md
```

Every mandatory project requirement should be classified as:

```text
IMPLEMENTED
PARTIALLY IMPLEMENTED
DEFERRED
```

Do not mark something complete unless the actual implementation supports it.

Explicitly identify deferred areas such as:

```text
asymmetric key exchange
public testnet
DID
mobile
ZK
AI fraud detection
cross-chain
```

where applicable.

---

# 27. ARCHITECTURE DOCUMENT FINALIZATION

Review:

```text
docs/architecture.md
```

Make sure the architecture matches the actual implementation.

Do not leave outdated claims.

In particular verify:

- frontend/backend blockchain boundaries
- read/write paths
- IPFS path
- verification path
- access-control path
- authentication path
- key-distribution limitation
- current local network
- current contracts
- current source-of-truth model

---

# 28. API DOCUMENT FINALIZATION

Review:

```text
docs/api.md
```

Ensure the documented endpoints match actual backend behavior, including:

```text
POST /api/auth/challenge
POST /api/auth/verify
POST /api/ipfs/upload
GET /api/ipfs/:cid
GET /api/documents
GET /api/documents/:id
POST /api/verify
GET /api/audit/:documentId
```

Document actual request/response behavior only.

---

# 29. SECURITY DOCUMENT FINALIZATION

Review:

```text
docs/security.md
```

Include actual:

- threat boundaries
- credential handling
- wallet security
- IPFS confidentiality
- encryption
- authorization
- revocation
- audit
- verification
- account/network switching
- failure handling
- known limitations

Do not claim independent security certification.

---

# 30. FINAL TEST MATRIX

Create/update:

```text
docs/final-test-matrix.md
```

Include at least:

| Area | Test | Expected | Actual | Status |
|---|---|---|---|---|
| Wallet | Connect | Connected | actual | PASS/FAIL |
| Auth | Sign challenge | Authenticated | actual | PASS/FAIL |
| IPFS | Upload encrypted payload | Real CID | actual | PASS/FAIL |
| Registration | On-chain write | Confirmed | actual | PASS/FAIL |
| Sharing | Grant | `hasAccess=true` | actual | PASS/FAIL |
| Sharing | Revoke | `hasAccess=false` | actual | PASS/FAIL |
| Verification | Exact candidate | VERIFIED | actual | PASS/FAIL |
| Verification | Modified candidate | TAMPER_DETECTED | actual | PASS/FAIL |
| Revocation | Verify revoked | REVOKED | actual | PASS/FAIL |
| Unauthorized | Protected document | 403 | actual | PASS/FAIL |
| Audit | Events | chronological | actual | PASS/FAIL |

Use actual executed results.

Do not fabricate the `Actual` column.

---

# 31. FINAL DEMO EVIDENCE

Prepare a final evidence checklist for:

```text
wallet connection
authentication
document registration
IPFS CID
hash
transaction
block
grant
revoke
verification
tamper detection
audit
```

Use real runtime values.

Do not copy test-only placeholder values into the evidence package.

---

# 32. GIT / REPOSITORY REVIEW

Before completion:

- inspect `git status`
- inspect tracked files
- verify secrets are not staged
- verify `.env` is ignored
- verify `.env.example` contains no real secrets
- verify generated artifacts are intentional
- verify build/cache directories are not unnecessarily committed

Do not push commits automatically.

---

# 33. RESET / CLEAN-START PROCEDURE

Document how to safely reset the local demo environment.

Include:

```text
Hardhat state reset
contract redeployment
configuration update
fresh MetaMask development state
fresh document registration
IPFS cleanup if applicable
backend/frontend restart
```

Do not delete real external IPFS content unless an actual cleanup mechanism exists.

---

# 34. KNOWN LIMITATIONS REGISTER

Create/update:

```text
docs/known-limitations.md
```

Include actual limitations, such as:

- AES key distribution remains separate/out-of-band
- local Hardhat only, if public deployment remains deferred
- browser memory limits for very large files
- no legal authenticity guarantee
- no formal third-party security audit
- IPFS persistence/availability depends on actual pinning configuration
- any verifier enumeration constraints
- any other observed limitations

Do not hide limitations to improve presentation.

---

# 35. FINAL REQUIREMENTS AUDIT

Check the original mandatory project requirements.

Confirm evidence exists for:

```text
blockchain network setup
smart contract implementation/testing
frontend-blockchain integration
complete real-time workflow
code quality
documentation
review/progress
secure IPFS storage
document verification
access control
audit trail
sharing
tamper detection
```

Use the actual project rubric/reference materials.

Do not invent requirements not present in the provided project materials.

---

# 36. NO NEW FEATURE CREEP

Do not add during Phase 15:

```text
AI chatbot
AI fraud detector
mobile app
ZK proof
DID system
cross-chain system
public blockchain deployment
automated asymmetric key exchange
```

unless explicitly required by the supplied rubric and actually approved as a Phase 15 change.

The purpose is final hardening, not uncontrolled expansion.

---

# 37. FINAL ACCEPTANCE CRITERIA

Phase 15 is complete only when:

- [ ] Full Phases 3–14 regression passes.
- [ ] Real end-to-end lifecycle works.
- [ ] Owner flow works.
- [ ] Verifier flow works.
- [ ] Unauthorized flow fails closed.
- [ ] Registration works with real file/IPFS/blockchain data.
- [ ] Grant/revoke works on-chain.
- [ ] Verification works.
- [ ] Tamper detection works.
- [ ] Revocation works.
- [ ] Audit trail works.
- [ ] No synthetic runtime data exists.
- [ ] No server secrets are exposed client-side.
- [ ] No private key/seed phrase is used by application code.
- [ ] No plaintext sensitive document is uploaded to IPFS.
- [ ] No AES key is stored on-chain/IPFS.
- [ ] UI does not expose bearer JWTs.
- [ ] Architecture documentation matches implementation.
- [ ] API documentation matches implementation.
- [ ] Security documentation matches implementation.
- [ ] Requirements traceability is finalized.
- [ ] Runbook is complete.
- [ ] Demo runbook is complete.
- [ ] Final test matrix is complete.
- [ ] Known limitations are documented.
- [ ] Local reproduction procedure works.
- [ ] Public deployment remains clearly separated if not actually performed.
- [ ] No unrelated feature creep was introduced.

---

# 38. FINAL REPORT

At the end produce:

## Phase 15 Status

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Baseline

Report:

```text
frontend tests
backend tests
blockchain tests
typecheck
lint
build
```

before and after any final fixes.

## Final End-to-End Demonstration

Describe the real lifecycle that was executed.

Include only actual runtime evidence.

## Security Review

Summarize actual findings and fixes.

## Secret / Credential Audit

State whether any secret was exposed.

Do not print secrets.

## Synthetic Data Audit

State whether synthetic runtime data was found.

## Requirements Traceability

Summarize which major requirements are:

```text
IMPLEMENTED
PARTIALLY IMPLEMENTED
DEFERRED
```

## Deployment Readiness

Distinguish:

```text
local demonstration readiness
```

from:

```text
public testnet/mainnet deployment
```

Do not claim public deployment if it was not performed.

## Documentation Package

List:

```text
architecture
requirements
security
API
cryptography
IPFS
registration
sharing
verification
runbook
demo runbook
final test matrix
known limitations
```

## Known Limitations

List the real remaining limitations.

## Final Project State

Provide a concise system summary based only on actual implementation.

---

# 39. FINAL STOP CONDITION

When Phase 15 is complete:

1. Run the full test suite.
2. Run the complete real demonstration.
3. Verify all mandatory requirements.
4. Complete the security/secret audit.
5. Complete synthetic-data audit.
6. Complete code-quality review.
7. Finalize architecture/API/security documentation.
8. Finalize traceability.
9. Finalize runbook.
10. Finalize demo runbook.
11. Finalize test matrix.
12. Finalize known limitations.
13. Verify Git/repository cleanliness.
14. Verify no secrets are staged or committed.
15. Produce the final Phase 15 report.
16. STOP.

Do not automatically create Phase 16.

---

# CORE PRINCIPLE

> **Phase 15 must leave the project in a reproducible, truthful, review-ready state. The goal is not to make the system look complete; it is to verify that the implemented system actually works end-to-end, that its security and data boundaries remain intact, that the documentation matches reality, and that all remaining limitations are clearly disclosed.**
