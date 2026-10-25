# PHASE 6 — ACCESS CONTROL SMART CONTRACT

## Purpose

Implement the second business smart contract for the Blockchain-Based Digital Document Locker:

> **AccessControl**

This contract manages **on-chain authorization for document verifiers/authorized wallets**.

Phase 6 builds directly on the real `DocumentRegistry` implementation completed in Phase 5.

The project must continue to follow the strict:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

policy.

No external API credentials are required for this phase.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before making any changes, read all of the following completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `PHASE_3_PROMPT.md`
6. `PHASE_4_PROMPT.md`
7. `PHASE_5_PROMPT.md`
8. `docs/requirements.md`
9. `docs/requirements-traceability.md`
10. `docs/architecture.md`
11. `docs/api.md`
12. `docs/security.md`
13. `docs/wallet-identity.md` if present
14. `docs/document-registry.md`
15. All existing Phase 3–5 Solidity, Hardhat, deployment, and test files
16. The supplied reference PPT and mandatory requirements image if available

Treat these documents as the project's current source of truth.

Do not silently redesign the architecture.

If the existing implementation conflicts with the governing architecture, identify the conflict explicitly and resolve it deliberately.

---

# 2. PHASE BOUNDARY

This phase is:

> **AccessControl Smart Contract**

This phase IS responsible for:

- Solidity `AccessControl` contract
- Relationship between AccessControl and DocumentRegistry
- Granting document-specific access
- Revoking document-specific access
- Checking whether an address has access
- Owner authorization for access changes
- Document existence validation
- Revoked-document behavior
- Relevant blockchain events
- Contract unit tests
- Local deployment
- Real local transactions
- Real emitted events
- Real access-state reads
- ABI/deployment artifacts
- Security/documentation/traceability

This phase is NOT responsible for:

- IdentityRegistry
- IPFS
- AES-256-GCM
- document encryption/decryption
- document uploads
- production backend authentication
- JWT
- public testnet/RPC credentials
- frontend sharing UI
- full verification workflow
- audit dashboard
- institutional APIs
- AI
- Zero-Knowledge proofs
- cross-chain support

Do not pull later-phase features into Phase 6.

---

# 3. CORE ARCHITECTURAL PRINCIPLE

The project separates:

### Document ownership

Handled by:

```text
DocumentRegistry
```

### Permission to access/verify a document

Handled by:

```text
AccessControl
```

Therefore:

```text
DocumentRegistry
    ↓
authoritative owner / document registration / revocation
    ↓
AccessControl
    ↓
authorized verifier/participant addresses
```

AccessControl must NOT become a second source of truth for document ownership.

It should reference the actual DocumentRegistry state.

---

# 4. NON-SYNTHETIC DATA POLICY

Do not create or seed runtime permissions such as:

```text
Alice → Document A
Bob → Document B
Demo Verifier
0x123...
Sample User
Fake Permission
Fake Access Grant
```

No fake application users.

No fake wallet addresses presented as real users.

No fake document IDs in runtime state.

No fake permission records.

No mock blockchain results.

No hard-coded access entries in the deployed contract.

The initial runtime state must naturally be empty unless a real transaction creates an access relationship.

---

# 5. TEST FIXTURE EXCEPTION

Deterministic test fixtures are permitted strictly inside unit tests.

For example:

```text
test signer A
test signer B
test document ID
test CID
test document hash
```

These exist only to test contract logic.

They must never be:

- seeded into production deployment
- shown as application data
- used as fallback runtime data
- presented as real users/documents

The final report must distinguish test fixtures from runtime application data.

---

# 6. LOCAL BLOCKCHAIN ONLY

Use the actual local Hardhat network established in Phase 3.

Use the real DocumentRegistry deployment produced in Phase 5.

Do NOT introduce:

- Alchemy
- Infura
- QuickNode
- public RPC
- Sepolia
- IPFS API keys
- external blockchain credentials

No external API key is required.

All transactions in this phase can run against:

```text
local Hardhat
```

---

# 7. ACCESSCONTROL RESPONSIBILITY

Implement document-specific permissions.

Conceptually:

```text
document ID
    ↓
authorized address
    ↓
access granted / revoked
```

The contract must answer:

> "Does this address currently have access to this document?"

The answer must come from actual on-chain state.

---

# 8. DOCUMENTREGISTRY REFERENCE

AccessControl must reference the actual `DocumentRegistry` contract.

It must use the deployed contract interface to validate document ownership and document state.

Do not duplicate the entire DocumentRegistry storage model.

Do not independently store:

```text
owner
document hash
CID
registration timestamp
```

unless there is a clearly justified reason.

DocumentRegistry remains authoritative for those fields.

---

# 9. CONTRACT DEPENDENCY

Define a clear dependency such as:

```text
AccessControl
      ↓
IDocumentRegistry / DocumentRegistry interface
```

The exact implementation may use an interface rather than importing the full contract.

The dependency must make it possible to query:

```text
document exists
document owner
document revoked
```

Use the project's existing Solidity conventions.

Do not introduce unnecessary coupling.

---

# 10. ACCESS MODEL

Implement a document-specific mapping equivalent to:

```text
documentId → address → bool
```

or another clearly equivalent representation.

The state must distinguish:

```text
access granted
access not granted
```

Do not store fake identities.

Do not infer access from frontend state.

Do not infer access from localStorage.

Do not infer access from user-entered addresses.

The blockchain must be authoritative.

---

# 11. OWNER AUTHORIZATION

Only the actual document owner should be able to modify permissions.

The owner must come from:

```text
DocumentRegistry
```

not from a frontend argument.

Do not trust:

```text
claimedOwner
userAddress
requestBody.owner
URL owner
localStorage owner
```

The contract must enforce:

```text
msg.sender == actual DocumentRegistry owner
```

for permission-changing operations.

---

# 12. GRANT ACCESS

Implement a function equivalent to:

```text
grantAccess(documentId, verifier)
```

Expected behavior:

1. Confirm the document exists.
2. Confirm the caller is the actual DocumentRegistry owner.
3. Confirm the document is not revoked.
4. Validate the target address.
5. Set access to `true`.
6. Emit an actual blockchain event.

The actual function name/signature may follow the established codebase conventions.

Do not accept arbitrary owner addresses as authorization.

---

# 13. TARGET ADDRESS VALIDATION

The address receiving access must be a valid non-zero Ethereum address.

Reject:

```text
address(0)
```

Do not silently interpret zero address as "everyone".

Do not create wildcard access.

Do not create role names as substitutes for actual Ethereum accounts unless explicitly required by the architecture.

---

# 14. REVOKE ACCESS

Implement a function equivalent to:

```text
revokeAccess(documentId, verifier)
```

Expected behavior:

1. Confirm the document exists.
2. Confirm caller is the actual document owner.
3. Change permission to `false`.
4. Emit a real blockchain event.

This revokes permission for the target address.

It does NOT revoke the document itself.

Document the distinction clearly:

```text
DocumentRegistry.revokeDocument()
    ↓
document itself becomes revoked

AccessControl.revokeAccess()
    ↓
one address loses permission
```

---

# 15. HAS ACCESS

Implement a read function equivalent to:

```text
hasAccess(documentId, verifier)
```

The result must come from actual contract state.

At minimum, access should only be considered valid when:

```text
document exists
AND
document is not revoked
AND
verifier permission is true
```

Whether this combined logic is implemented directly in `hasAccess()` or through clearly separated checks must be documented.

Do not report access as valid for a revoked document.

---

# 16. REVOKED DOCUMENT BEHAVIOR

A document revoked in DocumentRegistry must not be treated as actively accessible simply because an old permission entry remains.

Example:

```text
DocumentRegistry:
    revoked = true

AccessControl:
    verifier = true
```

The final permission check must not return active access.

This prevents stale access state from overriding the authoritative document revocation state.

Document this invariant.

---

# 17. DOCUMENT EXISTENCE

AccessControl must not grant or revoke access for an unknown document.

Operations such as:

```text
grantAccess
revokeAccess
hasAccess
```

must handle unknown documents according to the documented contract behavior.

Do not create permission entries for documents that do not exist.

Do not invent a document record inside AccessControl.

---

# 18. REPEATED OPERATIONS

Define clear behavior for repeated operations.

Examples:

```text
grantAccess()
grantAccess() again

revokeAccess()
revokeAccess() again
```

Choose and document a deterministic behavior.

Acceptable designs may use:

- revert on redundant operation
- idempotent state update

The choice must be consistent and tested.

Do not silently produce ambiguous states.

---

# 19. EVENTS

Emit real blockchain events for access changes.

At minimum:

```text
AccessGranted
AccessRevoked
```

Events should contain enough information for later audit systems to reconstruct permission changes.

Recommended conceptual fields:

```text
documentId
owner
authorized address
```

Use actual on-chain values.

Do not emit fake event data from JavaScript.

Events must originate from actual Solidity execution.

Do not place secrets in events.

---

# 20. EVENT SEMANTICS

Events should represent actual state changes.

For example:

```text
grantAccess()
    ↓
successful transaction
    ↓
permission state becomes true
    ↓
AccessGranted event
```

and:

```text
revokeAccess()
    ↓
successful transaction
    ↓
permission state becomes false
    ↓
AccessRevoked event
```

Do not emit success-looking events when an operation fails.

---

# 21. SECURITY MODEL

The contract must enforce:

```text
Document owner
        ↓
authorized to modify access
```

Not:

```text
frontend says user is owner
```

Not:

```text
backend says user is owner
```

Not:

```text
user submits owner address
```

The contract itself is authoritative.

---

# 22. NO ADMIN BACKDOOR

Do not implement an unrestricted:

```text
adminGrantAccess()
superAdmin()
ownerOverride()
forceGrant()
```

unless the project's requirements explicitly require such a role.

The project architecture described so far uses document ownership rather than a global privileged administrator.

Do not introduce centralized authority merely for convenience.

---

# 23. NO GLOBAL ACCESS

Do not implement a default mode such as:

```text
all addresses can access
```

Do not use a wildcard address.

Do not create:

```text
publicAccess = true
```

unless it becomes an explicit future requirement and is separately designed.

Phase 6 is document-owner-controlled authorization.

---

# 24. CONTRACT STATE MINIMIZATION

Only store the state required for access control.

Do not duplicate:

```text
document hash
CID
timestamp
owner data
identity metadata
```

when DocumentRegistry already owns those facts.

Keep AccessControl focused.

---

# 25. SECURITY AGAINST STALE PERMISSIONS

Consider this sequence:

```text
1. Owner registers Document X
2. Owner grants Bob access
3. Bob has access
4. Owner revokes Document X
5. Bob must no longer have active document access
```

Test exactly this sequence.

The access model must not rely solely on deleting permission state.

Document-level revocation must take precedence.

---

# 26. SOLIDITY QUALITY

Follow the established Solidity conventions.

Use:

- Solidity 0.8+
- SPDX license identifier
- explicit compiler version
- clear naming
- NatSpec/comments for important public functions
- custom errors or clear revert messages
- focused functions
- minimal storage
- appropriate visibility
- appropriate event design

Do not introduce upgradeability without a requirement.

Do not add unnecessary dependencies.

Do not add libraries only for appearance.

---

# 27. EXTERNAL CALLS

AccessControl will query DocumentRegistry.

Make the dependency intentional and minimal.

Document:

- which external calls are made
- whether they are view-only
- why they are safe
- what happens if DocumentRegistry is unavailable or misconfigured

Do not add unnecessary external state-changing calls.

---

# 28. REENTRANCY

Because the access-control operations should primarily perform validation and state changes, confirm that the implementation does not introduce unnecessary reentrancy risks.

If there are no dangerous external state-changing calls, do not add a reentrancy guard just for appearance.

Document the reasoning.

---

# 29. CONTRACT ADDRESS CONFIGURATION

Use the REAL DocumentRegistry address generated by Phase 5 deployment.

Do not write a guessed address into source code.

Do not use:

```text
0x123...
0xABC...
```

Do not hard-code the contract address as a fabricated constant.

Use the existing deployment/configuration mechanism.

The eventual environment naming should remain clear, for example:

```env
CONTRACT_DOCUMENT_REGISTRY=
CONTRACT_ACCESS_CONTROL=
```

At the end of Phase 6:

```text
CONTRACT_DOCUMENT_REGISTRY
    → real Phase 5 deployment address

CONTRACT_ACCESS_CONTROL
    → real Phase 6 deployment address
```

Only populate these with values produced by real deployment.

Do not create placeholder contract addresses as runtime values.

---

# 30. DEPLOYMENT ORDER

The required deployment relationship is:

```text
1. DocumentRegistry deployed
2. AccessControl deployed with the real DocumentRegistry address
```

Do not deploy AccessControl using a fake or arbitrary registry address.

The deployment script must obtain the actual DocumentRegistry deployment result.

If the repository uses deployment artifacts, consume the actual artifact.

---

# 31. LOCAL DEPLOYMENT

Deploy AccessControl to the local Hardhat network.

Use:

```text
actual local network
actual signer
actual contract deployment transaction
actual receipt
actual deployed address
actual block
```

After deployment:

1. verify AccessControl points to the actual DocumentRegistry address
2. read the configured registry address back from the contract
3. compare it with the real Phase 5 deployment address

If it does not match:

> fail clearly.

Do not silently continue with an incorrect contract.

---

# 32. REAL LOCAL TRANSACTION TEST

Perform an actual local blockchain flow:

```text
Phase 5 DocumentRegistry
        ↓
real document registration
        ↓
real document ID on-chain
        ↓
Phase 6 AccessControl
        ↓
grantAccess(realDocumentId, realVerifier)
        ↓
real transaction receipt
        ↓
real AccessGranted event
        ↓
hasAccess(realDocumentId, realVerifier)
        ↓
true
        ↓
revokeAccess(realDocumentId, realVerifier)
        ↓
real transaction receipt
        ↓
real AccessRevoked event
        ↓
hasAccess(realDocumentId, realVerifier)
        ↓
false
```

Use real local blockchain execution.

Do not fake the results.

---

# 33. REVOKED DOCUMENT REAL FLOW

Also test:

```text
register document
↓
grant verifier access
↓
verify access = true
↓
revoke document through DocumentRegistry
↓
hasAccess = false
```

The last result must come from actual AccessControl + DocumentRegistry state.

Do not simply clear permission in JavaScript.

---

# 34. TEST SUITE

Create comprehensive contract tests.

At minimum test:

## Deployment

- AccessControl deploys
- DocumentRegistry address stored correctly
- registry reference is non-zero
- initial access state is empty

## Grant

- owner grants access successfully
- access becomes true
- AccessGranted event emitted

## Unauthorized Grant

- non-owner cannot grant access
- transaction reverts

## Revoke

- owner revokes access
- access becomes false
- AccessRevoked event emitted

## Unauthorized Revoke

- non-owner cannot revoke
- transaction reverts

## Target validation

- zero address cannot receive access

## Unknown document

- grant unknown document fails
- revoke unknown document fails
- access check behaves according to documented design

## Duplicate grant

- behavior matches the chosen invariant

## Duplicate revoke

- behavior matches the chosen invariant

## Document revocation interaction

- active permission exists
- DocumentRegistry document is revoked
- hasAccess no longer reports active permission

## Cross-document isolation

If:

```text
Document A → Bob
Document B → Charlie
```

then:

```text
Bob does not get Document B
Charlie does not get Document A
```

Use test fixtures only inside tests.

---

# 35. PROPERTY / INVARIANT TESTING

Where practical, test invariants such as:

```text
Only DocumentRegistry owner can modify access.
```

```text
Unknown documents cannot receive permissions.
```

```text
Revoked documents cannot have active access.
```

```text
Permission for Document A cannot affect Document B.
```

```text
Non-owner cannot grant or revoke.
```

These are more important than simply testing successful calls.

---

# 36. FRONTEND BOUNDARY

Do NOT implement the sharing UI in Phase 6.

Do NOT create:

```text
Share Document page
Verifier cards
Fake shared-user list
Fake permissions dashboard
```

The contract/API will be consumed later.

Only ensure that the actual ABI/deployment outputs are available for later frontend integration.

---

# 37. BACKEND BOUNDARY

Do not implement production sharing APIs in Phase 6.

Do not create:

```text
POST /api/documents/:id/share
POST /api/documents/:id/revoke-access
```

unless such endpoints already legitimately exist and are merely being updated to use the actual contract.

The Node/Express API implementation belongs later.

---

# 38. IPFS BOUNDARY

Do not integrate IPFS.

No:

```text
IPFS upload
CID generation
pinning
download
```

Phase 6 only manages authorization state on-chain.

---

# 39. CRYPTOGRAPHY BOUNDARY

Do not implement:

- AES-256-GCM
- SHA-256
- key exchange
- encrypted documents
- decryption

Those remain later-phase responsibilities.

---

# 40. IDENTITY BOUNDARY

Do not implement IdentityRegistry.

Use real Ethereum addresses only.

Do not create:

```text
DID documents
fake DIDs
identity metadata
identity claims
```

The later IdentityRegistry phase will define identity association.

---

# 41. API KEY / CREDENTIAL POLICY

No external credentials are required.

Do NOT request or add:

- Alchemy API key
- Infura API key
- QuickNode key
- IPFS credentials
- private keys
- seed phrases
- JWT secrets
- encryption keys

Use the real local Hardhat environment.

The user will provide real external credentials only in the phase where the project's infrastructure actually requires them.

---

# 42. ENVIRONMENT FILES

Preserve `.env.example`.

Do not add fake values.

The intended structure should remain conceptually:

```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=

CONTRACT_DOCUMENT_REGISTRY=
CONTRACT_ACCESS_CONTROL=
CONTRACT_IDENTITY_REGISTRY=
CONTRACT_NETWORK=
```

Do not populate:

```env
CONTRACT_IDENTITY_REGISTRY=0xFAKE...
```

IdentityRegistry does not exist yet.

After actual Phase 6 deployment:

```env
CONTRACT_DOCUMENT_REGISTRY=<real Phase 5 deployment>
CONTRACT_ACCESS_CONTROL=<real Phase 6 deployment>
```

Only real generated values may be used.

---

# 43. DOCUMENTATION

Create/update:

```text
docs/access-control.md
docs/security.md
docs/requirements-traceability.md
```

`docs/access-control.md` must explain:

1. Purpose of AccessControl
2. Relationship with DocumentRegistry
3. Storage model
4. Permission model
5. Owner authorization
6. Grant flow
7. Revoke flow
8. `hasAccess` semantics
9. Document revocation interaction
10. Events
11. Validation
12. Error behavior
13. Deployment order
14. Contract addresses
15. ABI/artifact generation
16. Security decisions
17. Deferred functionality

Only describe behavior that actually exists.

---

# 44. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Use honest statuses:

```text
Implemented
Partially Implemented
Deferred
Not Applicable
```

Phase 6 should not be marked as implementing:

- IdentityRegistry
- IPFS
- encryption
- document upload
- frontend sharing
- full verification
- production APIs
- audit UI

unless those features genuinely already existed and were not newly invented in this phase.

---

# 45. ACCEPTANCE CRITERIA

Phase 6 is complete only when all applicable criteria are true:

- [ ] AccessControl Solidity contract exists.
- [ ] AccessControl references the actual DocumentRegistry.
- [ ] Contract compiles successfully.
- [ ] Only the actual DocumentRegistry owner can modify permissions.
- [ ] Valid verifier addresses can receive document-specific access.
- [ ] Zero address is rejected.
- [ ] Unknown documents cannot receive permissions.
- [ ] Owner can grant access.
- [ ] Owner can revoke access.
- [ ] `hasAccess` reads real on-chain permission state.
- [ ] Revoked documents do not have active access.
- [ ] AccessGranted event exists and is emitted by real transactions.
- [ ] AccessRevoked event exists and is emitted by real transactions.
- [ ] Document-specific permission isolation works.
- [ ] Unit tests cover success and failure cases.
- [ ] AccessControl is deployed to the local Hardhat network.
- [ ] Deployment uses the real Phase 5 DocumentRegistry address.
- [ ] Real local access-grant transaction succeeds.
- [ ] Real event logs are observed.
- [ ] Real local access-revocation transaction succeeds.
- [ ] Real state can be read after each transaction.
- [ ] ABI/artifacts are generated from the actual contract build.
- [ ] No fake runtime permission records were introduced.
- [ ] No fake contract addresses were introduced.
- [ ] No API credentials were added.
- [ ] No IPFS integration was added.
- [ ] No IdentityRegistry was added.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phase 4 wallet functionality remains intact.
- [ ] Phase 5 DocumentRegistry remains functional.

---

# 46. REAL-DATA AUDIT

Before completion, inspect the repository for fabricated runtime access data.

Search for suspicious patterns such as:

```text
fake
mock
demo
sample
seed
0x123
0xABC
dummy
QmExample
permission = true
isAuthorized = true
```

A suspicious value is acceptable only if it is clearly confined to:

```text
unit test fixture
test helper
documentation example
```

It must not become production/runtime state.

The final report must explicitly distinguish test-only fixtures from application runtime data.

---

# 47. CREDENTIAL / SECRET AUDIT

Before completion, verify:

- no private keys in source
- no seed phrases
- no API keys
- no RPC secrets
- no IPFS secrets
- no JWT secrets
- no encryption keys
- `.env` remains ignored
- `.env.example` does not contain real credentials

Report the result.

---

# 48. FINAL PHASE REPORT

At the end of Phase 6, provide exactly these sections:

## Phase 6 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Contract Implemented

Describe the actual AccessControl functionality.

## Contract Interface

List actual public/external functions.

## Events

List actual events.

## Storage

List actual storage variables/structures.

## DocumentRegistry Dependency

Report the actual registry relationship.

## Tests

List tests run and their results.

## Local Deployment

Report actual values obtained from the blockchain:

```text
network
chain ID
DocumentRegistry address
AccessControl address
deployment transaction hash
deployment block
```

Do not invent any values.

## Real Access-Control Flow Tested

Describe the actual sequence:

```text
register
→ grant
→ hasAccess
→ revoke access
→ hasAccess
→ revoke document
→ hasAccess
```

Include only results actually observed.

## Synthetic Data Audit

State whether fake/mock/demo/seeded runtime application data was introduced.

## Credential Audit

State whether any credentials/secrets were added.

## Files Created/Modified

List relevant files.

## Deferred Work

Identify what remains for later phases, especially:

- IdentityRegistry
- cryptography
- IPFS
- backend APIs
- frontend sharing UI
- verification
- audit

---

# 49. STOP CONDITION

When Phase 6 is complete:

1. Compile the contract.
2. Run all tests.
3. Deploy using the actual local Hardhat network.
4. Confirm AccessControl points to the real DocumentRegistry address.
5. Execute real grant/revoke transactions.
6. Read real permission state.
7. Verify real event logs.
8. Test interaction with document revocation.
9. Audit for synthetic runtime data.
10. Audit for credentials/secrets.
11. Update documentation.
12. Update requirements traceability.
13. Verify against `ai_rules.md`.
14. Verify against `MASTER_PLAN.md`.
15. Verify against Phase 1–5 artifacts.
16. Produce the final report.
17. STOP.

Do not automatically start Phase 7.

Do not implement IdentityRegistry.

Do not implement IPFS.

Do not implement encryption.

Do not add public RPC credentials.

Do not add API keys.

---

# CORE PRINCIPLE

> **AccessControl must authorize real Ethereum addresses based on actual on-chain DocumentRegistry ownership and real blockchain state. No fake users, no fake permissions, no fabricated contract addresses, no synthetic transactions, and no external API credentials are required for Phase 6.**
