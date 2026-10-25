# PHASE 11 — NEXT.JS FRONTEND FOUNDATION & REAL BACKEND/BLOCKCHAIN INTEGRATION

## Purpose

Build the real frontend application for the Blockchain-Based Digital Document Locker using the architecture and services completed through Phase 10.

This phase establishes the complete frontend foundation, navigation, authentication UX, wallet integration, API client, real runtime state handling, and integration-ready application screens.

The frontend must consume real backend/blockchain/IPFS data and must never use synthetic application data.

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before making any changes, read completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md` through `PHASE_10_PROMPT.md`
4. `docs/requirements.md`
5. `docs/requirements-traceability.md`
6. `docs/architecture.md`
7. `docs/api.md`
8. `docs/security.md`
9. `docs/wallet-identity.md` if present
10. `docs/document-registry.md`
11. `docs/access-control.md`
12. `docs/cryptography.md`
13. `docs/ipfs.md`
14. `docs/frontend.md` if already present
15. All current frontend, backend, blockchain, deployment, cryptography, and IPFS implementation files
16. The supplied reference PPT and mandatory requirements image if available

Treat these materials as the current project source of truth.

Do not silently redesign the architecture. If implementation and documentation conflict, identify the conflict before changing it.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- Next.js frontend structure
- desktop-first responsive UI
- global layout/navigation
- wallet connection UI
- wallet/account/network state
- wallet-signature authentication UX
- real backend API client
- authenticated session state
- dashboard shell
- real document list/detail views where backend support exists
- real permission/revocation status display
- reusable loading/error/empty/success states
- reusable transaction-status components
- verification-status presentation
- audit-status presentation
- accessibility basics
- frontend integration tests
- security-conscious frontend configuration
- documentation
- requirements traceability

This phase is NOT responsible for:

- replacing the backend
- implementing new smart contracts
- changing DocumentRegistry business logic
- changing AccessControl business logic
- implementing IdentityRegistry
- final end-to-end document registration workflow
- final document-sharing workflow
- final tamper/verification workflow
- final audit workflow
- public testnet deployment
- AI features
- ZK proofs
- cross-chain functionality
- native mobile application

Those belong to later phases.

Do not pull later business workflows into Phase 11 merely to populate the UI.

---

# 3. CORE FRONTEND ARCHITECTURE

Use the existing Next.js architecture.

Conceptually:

```text
Next.js
   │
   ├── UI components
   │
   ├── wallet/provider layer
   │       ↓
   │    MetaMask
   │
   ├── authentication layer
   │       ↓
   │    Phase 10 API
   │
   ├── API client
   │       ↓
   │    Node/Express backend
   │
   └── blockchain write layer
           ↓
        ethers.js
           ↓
        MetaMask
```

The frontend must not become the authoritative source of:

```text
owner
permission
revocation
document hash
CID
transaction status
audit history
```

Those must come from their actual authoritative sources.

---

# 4. UI/UX PRINCIPLES

Build a professional desktop-first application.

Prioritize:

- strong visual hierarchy
- clear spacing
- useful information architecture
- meaningful states
- restrained effects
- understandable terminology
- accessible controls
- obvious transaction/error visibility
- security-oriented trust cues

Avoid generic AI-dashboard styling, unnecessary gradients, excessive glassmorphism, or decorative complexity that does not improve usability.

---

# 5. NO SYNTHETIC UI DATA

Never populate runtime UI with:

```text
Demo User
Sample Document
Fake CID
Fake transaction
Fake blockchain block
Fake document hash
Fake permission
Fake audit event
Fake balance
Fake notification
Fake activity
Fake verification result
```

Correct empty states include:

```text
No documents found.
Connect your wallet.
No audit events found.
```

When a service is unavailable, show the real error.

Do not add fake content to make the interface appear populated.

---

# 6. REQUIRED APPLICATION STATES

Implement deterministic states for at least:

```text
initializing
wallet-unavailable
disconnected
connecting
connected
wrong-network
authenticating
authenticated
authentication-error
loading
empty
success
error
transaction-pending
transaction-confirmed
transaction-failed
unauthorized
not-found
dependency-unavailable
```

Reuse the state model established in `docs/architecture.md` where applicable.

---

# 7. FRONTEND ENVIRONMENT

Only expose intentionally public configuration to the browser.

Potential variables:

```env
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_CONTRACT_DOCUMENT_REGISTRY=
NEXT_PUBLIC_CONTRACT_ACCESS_CONTROL=
NEXT_PUBLIC_CONTRACT_NETWORK=
```

Use existing project naming if already established.

Never expose:

```text
IPFS_JWT
IPFS_API_KEY
IPFS_API_SECRET
AUTH_JWT_SECRET
private keys
seed phrases
AES keys
server credentials
```

Never put server secrets under `NEXT_PUBLIC_*`.

---

# 8. CONTRACT ADDRESS HANDLING

Use the actual Phase 5 and Phase 6 deployment results.

Contract addresses are public blockchain metadata, not secrets, but they must still come from actual deployment/configuration.

Do not invent or duplicate addresses across components.

Create one configuration source.

At minimum configure:

```text
DocumentRegistry address
AccessControl address
expected chain ID
```

If configuration is missing or inconsistent:

```text
show configuration error
```

Do not substitute sample addresses.

---

# 9. API CLIENT

Create a centralized frontend API client.

It should handle:

- base URL
- authentication/session header/cookie according to Phase 10
- JSON requests
- binary responses where required
- error normalization
- timeout/abort behavior
- 401
- 403
- 404
- 429
- dependency failures
- safe retries where appropriate

Do not scatter raw request logic across every component.

---

# 10. AUTHENTICATION SESSION

Keep these states separate:

```text
wallet connected
```

and

```text
backend authenticated
```

A connected wallet does not automatically mean the backend session is valid.

Implement explicit authentication state and cleanup.

Do not expose or persist server secrets.

Use the Phase 10 authentication mechanism exactly as implemented.

---

# 11. ACCOUNT CHANGE HANDLING

When the MetaMask account changes:

1. update wallet state
2. invalidate stale authenticated state belonging to the previous wallet
3. require authentication for the new wallet
4. refresh account-dependent API data
5. prevent previous-wallet document data from appearing under the new account

Never transfer identity/session state from one wallet to another without fresh authentication.

---

# 12. NETWORK CHANGE HANDLING

When the wallet changes network:

1. read the actual chain ID
2. compare against the configured expected chain
3. update UI
4. disable incompatible blockchain actions
5. avoid unintended-network transactions

Do not pretend the wallet is on the expected network.

---

# 13. AUTHENTICATION UI

Implement the real Phase 10 authentication flow:

```text
Connect Wallet
      ↓
request challenge
      ↓
display canonical signing message
      ↓
MetaMask signing
      ↓
backend verification
      ↓
authenticated session
```

Show truthful states such as:

```text
Waiting for wallet signature…
Authenticating…
Authentication failed.
```

Do not show authentication success until the backend actually accepts the signature.

---

# 14. GLOBAL NAVIGATION

Implement a clear application shell.

Reasonable areas include:

```text
Dashboard
Documents
Verify
Audit
Wallet / Identity
Settings / Configuration
```

Only make screens operational where the corresponding backend/features exist.

Do not make incomplete future features look fully functional.

---

# 15. DASHBOARD

Use only real available data.

Potential real values:

```text
owned document count
accessible document count
wallet address
network
authentication state
```

All values must come from:

```text
real API
real wallet
real blockchain
```

If data is unavailable:

```text
empty/loading/error state
```

Do not invent metrics.

---

# 16. DOCUMENT LIST

Where supported, consume:

```text
GET /api/documents
```

Show actual returned documents only.

Possible fields:

```text
document ID
owner
hash
CID
registration timestamp
revocation status
```

Do not invent filename, description, category, institution, or other metadata unless it actually exists.

---

# 17. DOCUMENT DETAIL

Consume:

```text
GET /api/documents/:id
```

Display provenance where useful:

```text
Owner → blockchain
Hash → DocumentRegistry
CID → DocumentRegistry/IPFS
Registration time → blockchain
Revocation → DocumentRegistry
Permission → AccessControl
```

Do not silently mix backend-derived values with authoritative blockchain values.

---

# 18. EMPTY STATES

Implement useful empty states such as:

```text
No documents are registered for this wallet yet.
No documents are currently accessible.
No audit events are available.
```

Do not insert sample records.

---

# 19. ERROR STATES

Create reusable error UI for:

- wallet unavailable
- wrong network
- authentication failure
- API unavailable
- blockchain unavailable
- IPFS unavailable
- document not found
- unauthorized
- verification failure
- transaction rejected
- transaction failed

Do not expose server stack traces, JWTs, API credentials, or secret configuration.

---

# 20. TRANSACTION STATUS

Create a reusable transaction-status component able to show real:

```text
waiting for wallet confirmation
submitted
transaction hash
pending
confirmed
failed
block/receipt where available
```

Rules:

- never fabricate a transaction hash
- only show a hash after the real provider returns it
- only show confirmed after a real receipt/confirmation
- distinguish user rejection from on-chain failure

---

# 21. BLOCKCHAIN WRITE BOUNDARY

For future user-authorized writes, use:

```text
ethers.js
+
MetaMask
```

The backend must not impersonate the user.

The frontend must never fabricate transactions.

Phase 11 should establish reusable transaction infrastructure, but the full document-registration/sharing/revocation workflows remain later phases.

---

# 22. CONTRACT READ BOUNDARY

Where the backend provides authoritative normalized data, use the backend for application reads.

Direct frontend contract reads are allowed only where the architecture requires them and no server secret is involved.

Do not create competing sources of truth.

When local UI state differs from authoritative API/chain state:

```text
authoritative state wins
```

and refresh/reconcile.

---

# 23. IPFS BOUNDARY

The browser must never call Pinata directly using server credentials.

Use:

```text
Frontend
   ↓
Phase 10 backend
   ↓
Phase 9 IPFS service
   ↓
Pinata
```

The Pinata JWT must remain server-side.

---

# 24. VERIFICATION UI FOUNDATION

Create the UI shell for:

```text
POST /api/verify
```

where supported.

Represent truthful states:

```text
preparing
hashing
checking authorization
checking revocation
comparing
verified
hash mismatch
revoked
unauthorized
not found
error
```

Do not fabricate verification outcomes.

The final end-to-end document retrieval/decryption/tamper workflow belongs to a later phase.

---

# 25. AUDIT UI FOUNDATION

Create the UI shell for:

```text
GET /api/audit/:documentId
```

where supported.

Display actual:

```text
event type
actor
transaction hash
block number
timestamp
contract
```

Do not create a client-side activity feed from button clicks.

---

# 26. WALLET / IDENTITY PAGE

Show actual:

```text
wallet address
chain ID/network
authentication state
signature/authentication state
```

Do not invent:

```text
username
avatar
DID
institution
role
identity score
```

Do not claim IdentityRegistry functionality exists.

---

# 27. LOADING UX

Use truthful loading indicators.

Examples:

```text
Connecting wallet…
Authenticating…
Loading documents…
Reading blockchain…
Fetching data…
Verifying…
```

Do not use fake progress percentages.

Use indeterminate loading where actual progress cannot be measured.

---

# 28. FORM VALIDATION

Validate inputs for UX, including:

```text
document ID
wallet address
CID
hash
```

But remember:

> frontend validation is not the security boundary.

Backend and blockchain validation remain authoritative.

---

# 29. ACCESSIBILITY

Implement:

- semantic elements
- keyboard navigation
- visible focus
- labels
- accessible error messages
- appropriate loading announcements where useful
- information not communicated by color alone

---

# 30. RESPONSIVE DESIGN

The application is desktop-first, but remain usable on narrower screens.

Support at least:

```text
desktop
laptop
tablet/narrow viewport
```

Do not implement a separate native mobile application.

---

# 31. SECURITY UI RULES

Never display:

```text
Pinata JWT
backend JWT secret
AES encryption key
private key
seed phrase
server credentials
```

Do not add secret-copy controls.

Do not ask users for private wallet keys.

---

# 32. API FAILURE / RETRY UX

For API failures:

- show the actual error
- allow retry where safe
- do not insert fallback data
- do not retry indefinitely

For ambiguous blockchain state, query authoritative state rather than guessing.

---

# 33. FRONTEND TESTING

Create tests for:

### Wallet
- provider unavailable
- connection success
- connection rejection
- account change
- network change

### Authentication
- challenge request
- signing pending
- successful authentication
- rejected signature
- expired session
- logout/reset

### API
- success
- 401
- 403
- 404
- 429
- dependency failure

### Documents
- real list
- empty list
- loading
- error
- unauthorized
- not found

### Verification
- verified
- hash mismatch
- revoked
- unauthorized
- not found
- dependency error

### Audit
- real event list
- empty list
- loading
- error

Test fixtures are permitted only inside test code.

---

# 34. REAL INTEGRATION TESTING

Where the environment supports it, test:

```text
Next.js
   ↓
Node/Express
   ↓
Hardhat
   ↓
DocumentRegistry
   ↓
AccessControl
   ↓
real IPFS service
```

The frontend must consume actual responses.

Do not satisfy real integration requirements with permanent mock JSON.

---

# 35. PERFORMANCE

Measure actual frontend/backend interactions where useful.

Do not hard-code guarantees such as:

```text
verification always <2 seconds
```

Existing `<2s` language should be treated as a measurable target, not a correctness guarantee.

---

# 36. DOCUMENTATION

Create/update:

```text
docs/frontend.md
docs/security.md
docs/requirements-traceability.md
```

`docs/frontend.md` must cover:

1. Next.js structure
2. page architecture
3. component architecture
4. wallet integration
5. authentication UX
6. API client
7. session handling
8. blockchain boundary
9. IPFS boundary
10. document views
11. verification state model
12. audit state model
13. loading/empty/error states
14. environment variables
15. security decisions
16. accessibility
17. responsive strategy
18. explicitly deferred functionality

Only document implemented functionality.

---

# 37. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark only requirements actually implemented in Phase 11.

Do not mark a later feature complete just because its UI shell exists.

In particular do not mark as complete:

- full document registration
- full sharing
- full revocation workflow
- full tamper detection
- complete verification
- complete audit workflow
- IdentityRegistry

unless the actual governing phase requirements explicitly say they are complete.

---

# 38. ACCEPTANCE CRITERIA

Phase 11 is complete only when:

- [ ] Next.js frontend is organized.
- [ ] Global shell/navigation exists.
- [ ] Real MetaMask integration works.
- [ ] Real wallet/account/network state is displayed.
- [ ] Account/network changes are handled.
- [ ] Real wallet authentication UX works with Phase 10.
- [ ] Session state is handled securely.
- [ ] API client is centralized.
- [ ] No server secrets are exposed to the browser.
- [ ] Actual contract addresses are used from configuration/deployment artifacts.
- [ ] Dashboard uses real data only.
- [ ] Document views use real backend/blockchain data where supported.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Transaction-status UI uses real transaction state.
- [ ] Verification UI foundation uses actual API responses.
- [ ] Audit UI foundation uses actual blockchain-derived data.
- [ ] IPFS credentials remain server-side.
- [ ] No fake runtime users/documents/CIDs/transactions exist.
- [ ] Frontend tests pass.
- [ ] Real integration tests pass where the environment supports them.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phases 3–10 remain functional.

---

# 39. SYNTHETIC DATA AUDIT

Search frontend and API-consumption code for:

```text
fake
mock
demo
dummy
sample
seed
placeholder user
placeholder document
fake CID
fake transaction
fake hash
fake audit
fake verification
```

Classify each result as:

```text
test fixture
documentation example
actual runtime value
```

Remove synthetic runtime application data.

Do not remove legitimate isolated test fixtures.

---

# 40. SECRET EXPOSURE AUDIT

Search browser-facing source for:

```text
IPFS_JWT
IPFS_API_KEY
IPFS_API_SECRET
AUTH_JWT_SECRET
PRIVATE_KEY
SEED_PHRASE
```

Confirm none are exposed to the client bundle.

Verify `NEXT_PUBLIC_*` contains only intentionally public configuration.

Never print actual secret values in the final report.

---

# 41. FINAL PHASE REPORT

At the end provide exactly:

## Phase 11 Status

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Frontend Architecture

Describe the actual Next.js structure.

## Authentication / Wallet UX

Describe:

```text
wallet connection
network handling
challenge
signature
session
account changes
```

## Pages / Screens

List actual screens implemented.

## API Integration

List actual backend endpoints consumed.

## Blockchain Integration

Describe actual frontend blockchain interaction and contract configuration source.

## IPFS Boundary

Confirm IPFS credentials remain server-side.

## UI State Model

List major loading/empty/error/success/transaction states.

## Tests

List:

```text
frontend tests
wallet tests
authentication tests
API integration tests
regression results
```

## Security Audit

State whether server secrets were exposed.

## Synthetic Data Audit

State whether fake/mock/demo runtime data was introduced.

## Files Created/Modified

List important files.

## Known Limitations

Describe actual limitations.

## Deferred Work

Explicitly identify functionality reserved for:

- Phase 12 — real end-to-end document registration
- Phase 13 — sharing/revocation workflow
- Phase 14 — verification/tamper detection
- Phase 15 — audit/end-to-end testing/documentation

---

# 42. STOP CONDITION

When Phase 11 is complete:

1. Run TypeScript/type checking.
2. Run lint/format checks if configured.
3. Run frontend tests.
4. Run wallet/authentication tests.
5. Run API integration tests.
6. Run real local integration tests where available.
7. Audit browser-facing source for secret exposure.
8. Audit runtime UI data for synthetic values.
9. Verify no later business workflow has been falsely marked complete.
10. Update documentation.
11. Update requirements traceability.
12. Verify against `ai_rules.md`.
13. Verify against `MASTER_PLAN.md`.
14. Verify against Phase 1–10 artifacts.
15. Produce the final Phase 11 report.
16. STOP.

Do not automatically start Phase 12.

---

# CORE PRINCIPLE

> **Phase 11 creates the real user-facing frontend around the already-built wallet, authentication, blockchain, cryptography, IPFS, and backend layers. Every visible identity, document, permission, CID, blockchain status, verification result, and audit record must originate from a real source. Empty and error states are valid; fabricated data is never a substitute.**
