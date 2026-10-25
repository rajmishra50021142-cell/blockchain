# PHASE 13 — REAL DOCUMENT SHARING & ACCESS REVOCATION WORKFLOW

## Purpose

Implement the complete real-world document sharing and access-revocation workflow using the systems already built through Phase 12.

This phase connects:

```text
Document owner
      ↓
Next.js Frontend
      ↓
MetaMask
      ↓
AccessControl smart contract
      ↓
real verifier wallet
      ↓
real on-chain authorization
```

The purpose is to allow a real document owner to grant and revoke access for another real Ethereum wallet address.

The project must continue to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No fake users, wallets, document permissions, transaction hashes, audit events, or success states are allowed.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before changing anything, read completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `PHASE_3_PROMPT.md`
6. `PHASE_4_PROMPT.md`
7. `PHASE_5_PROMPT.md`
8. `PHASE_6_PROMPT.md`
9. `PHASE_7_PROMPT.md`
10. `PHASE_8_PROMPT.md`
11. `PHASE_9_PROMPT.md`
12. `PHASE_10_PROMPT.md`
13. `PHASE_11_PROMPT.md`
14. `PHASE_12_PROMPT.md`
15. `docs/requirements.md`
16. `docs/requirements-traceability.md`
17. `docs/architecture.md`
18. `docs/api.md`
19. `docs/security.md`
20. `docs/wallet-identity.md` if present
21. `docs/document-registry.md`
22. `docs/access-control.md`
23. `docs/cryptography.md`
24. `docs/ipfs.md`
25. `docs/frontend.md`
26. `docs/document-registration.md` if present
27. All current frontend, backend, blockchain, deployment, cryptography, and IPFS implementation files
28. The supplied reference PPT and mandatory requirements image if available

Treat these materials as the current project source of truth.

Do not silently redesign the architecture.

If an earlier implementation already contains part of sharing/revocation, inspect and reuse it rather than creating a duplicate workflow.

---

# 2. IMPORTANT EXISTING-IMPLEMENTATION CHECK

Before implementing anything, inspect:

- `AccessControl` contract
- Phase 10 backend authorization/document services
- Phase 11 frontend
- Phase 12 registration workflow
- existing audit/event code

Determine exactly what already exists for:

```text
grantAccess
revokeAccess
hasAccess
AccessGranted
AccessRevoked
```

If any code already implements part of the workflow, extend it rather than duplicating it.

Clearly distinguish:

```text
contract capability
backend read capability
test-only capability
real user-facing workflow
```

---

# 3. PHASE BOUNDARY

This phase IS responsible for:

- real document-sharing UI
- entering/validating a real verifier wallet address
- verifying the owner is the current wallet
- checking document existence
- checking document revocation state
- checking current access state
- owner-signed `grantAccess` transaction
- owner-signed `revokeAccess` transaction
- real transaction status handling
- real post-transaction state verification
- real verifier access-state display
- permission-specific document queries
- secure wallet/account/network consistency
- real audit-event creation through the smart contract
- frontend/backend integration for sharing state
- complete grant/revoke tests
- documentation and traceability

This phase is NOT responsible for:

- IdentityRegistry
- public testnet deployment
- encryption-key distribution to verifiers
- decrypting a shared document for a verifier
- complete verification/tamper workflow
- AI features
- ZK proofs
- cross-chain functionality
- mobile application

Important:

> **Blockchain permission is not the same thing as delivery of the AES document decryption key.**

The AccessControl transaction can establish authorization, but a separate secure key-distribution mechanism is required before another user can decrypt an encrypted document.

Do not invent an insecure key-sharing mechanism in this phase.

---

# 4. CORE SHARING FLOW

The primary owner flow is:

```text
Owner connects MetaMask
        ↓
Owner authenticates
        ↓
Owner selects registered document
        ↓
Read actual DocumentRegistry state
        ↓
Confirm owner == connected wallet
        ↓
Check document is not revoked
        ↓
Enter real verifier wallet address
        ↓
Validate address
        ↓
Check current access state
        ↓
Show actual sharing preview
        ↓
MetaMask grantAccess(documentId, verifier)
        ↓
Real transaction submitted
        ↓
Real receipt confirmed
        ↓
Read hasAccess(documentId, verifier)
        ↓
Display confirmed state
```

No fake success at any stage.

---

# 5. REVOCATION FLOW

The owner revocation flow is:

```text
Owner
   ↓
Select document
   ↓
Select currently authorized verifier
   ↓
Read actual current access state
   ↓
MetaMask revokeAccess(documentId, verifier)
   ↓
Real transaction
   ↓
Real receipt
   ↓
Read hasAccess(...)
   ↓
false
```

Document revocation remains a separate operation:

```text
DocumentRegistry.revokeDocument()
```

Do not confuse:

```text
revokeAccess()
```

with:

```text
revokeDocument()
```

---

# 6. AUTHORITY MODEL

Maintain these authoritative sources:

| Information | Authoritative Source |
|---|---|
| Current owner | DocumentRegistry |
| Document exists | DocumentRegistry |
| Document revoked | DocumentRegistry |
| Verifier permission | AccessControl |
| Grant transaction | MetaMask + blockchain |
| Revoke-access transaction | MetaMask + blockchain |
| Audit event | Blockchain event logs |
| Current wallet | MetaMask |
| Backend identity | Verified session |
| AES document key | Cryptographic/key-management layer, not blockchain |

The frontend must not become an independent permission database.

---

# 7. REAL WALLET ADDRESS INPUT

The share form must accept a real Ethereum address.

Validate:

```text
20-byte Ethereum address
```

Use established ethers.js address validation.

Reject:

```text
empty string
malformed string
wrong-length string
obviously invalid address
zero address
```

Do not normalize malformed user input into a fake address.

---

# 8. ZERO ADDRESS

Never allow:

```text
0x0000000000000000000000000000000000000000
```

as a verifier.

The smart contract must already reject this, but the UI should also validate it for UX.

Frontend validation is not the security boundary.

---

# 9. OWNER AUTHORIZATION

Before showing the grant/revoke operation:

1. read connected wallet
2. authenticate backend if required
3. read document from DocumentRegistry
4. compare actual document owner against connected wallet

Only the actual owner should be able to perform access-changing transactions.

Do not trust:

```text
client-provided owner
URL owner
localStorage owner
backend user-submitted owner
```

The smart contract remains authoritative.

---

# 10. ACCOUNT CONSISTENCY

Require:

```text
MetaMask connected account
==
authenticated backend wallet
==
DocumentRegistry owner
```

when the current operation requires document ownership.

If they differ:

```text
block the action
clear stale state
request re-authentication
```

Do not allow Wallet A's authenticated session to perform Wallet B's operation.

---

# 11. NETWORK VALIDATION

Before any grant/revoke transaction:

1. read actual MetaMask chain ID
2. compare with expected chain
3. verify configured AccessControl address
4. ensure wallet is connected
5. ensure backend session is compatible with current account

If wrong network:

```text
do not submit transaction
```

Show the actual network mismatch.

---

# 12. DOCUMENT VALIDATION

Before sharing/revoking access:

Confirm through actual blockchain state:

```text
document exists
document owner is current wallet
document is not unexpectedly revoked for grant operations
```

For access revocation:

```text
document exists
current wallet is owner
```

Do not create permission state for an unknown document.

---

# 13. GRANT ACCESS

Use the actual Phase 6 contract:

```text
AccessControl.grantAccess(documentId, verifier)
```

The transaction must be submitted through:

```text
ethers.js
+
MetaMask
```

The backend must not sign it.

Do not pass a fake owner parameter.

The contract itself determines owner authorization using on-chain state.

---

# 14. GRANT PREVIEW

Before signing, show actual values:

```text
Document ID
Owner
Verifier address
Network
AccessControl contract address
Current access state
```

Do not show:

```text
AES key
Pinata JWT
backend JWT secret
private key
seed phrase
```

The verifier address should be displayed in a readable truncated format but preserve the exact underlying address.

---

# 15. GRANT TRANSACTION STATUS

Implement truthful states:

```text
ready
wallet-confirming
submitted
pending
confirmed
failed
user-rejected
```

Only show `confirmed` after an actual receipt.

Only show a transaction hash after the provider returns the real hash.

Do not create fake hashes.

---

# 16. POST-GRANT VERIFICATION

After the transaction confirms:

1. read `hasAccess(documentId, verifier)` from AccessControl
2. verify it returns `true`
3. refresh the document permission UI
4. record/display the real transaction hash
5. make the permission available to later audit retrieval

If the chain state does not match expected state:

```text
show consistency error
```

Do not assume success merely from the receipt.

---

# 17. REVOKE ACCESS

Use:

```text
AccessControl.revokeAccess(documentId, verifier)
```

through MetaMask.

Before signing:

```text
read current permission
```

If permission is already false:

```text
show actual current state
```

Do not fabricate a successful revoke transaction that was never executed.

---

# 18. POST-REVOKE VERIFICATION

After confirmation:

1. read `hasAccess(documentId, verifier)`
2. require `false`
3. refresh permission state
4. display real transaction metadata

If it remains true:

```text
show consistency error
```

Do not show `Access revoked` as final success.

---

# 19. REVOKED DOCUMENT BEHAVIOR

If:

```text
DocumentRegistry.isRevoked(documentId) == true
```

then active document access must already be considered invalid by AccessControl.

The sharing UI should:

```text
disable new grants
```

for a revoked document.

It may still show historical permission events.

Do not delete the document or historical permission information.

---

# 20. EXISTING PERMISSION UI

Display current authorization state from actual AccessControl state.

For example:

```text
Verifier
Address
Access: Granted
```

or:

```text
Access: Revoked
```

Every state must come from the contract.

Do not maintain a fake frontend permissions array as the source of truth.

---

# 21. PERMISSION ENUMERATION

Do not invent a way to enumerate all verifiers if the AccessControl contract does not actually provide one.

If the existing contract lacks verifier enumeration:

- use known verifier addresses supplied by the actual user when appropriate
- use actual AccessGranted/AccessRevoked event logs to reconstruct history where supported
- document the limitation

Do not create fake verifier lists.

---

# 22. BACKEND AUTHORIZATION

Reuse Phase 10 authorization logic.

The backend may determine:

```text
caller is owner
OR
caller has on-chain access
```

for read endpoints.

But the backend must never override the smart contract's permission state.

---

# 23. SHARING API BOUNDARY

Do not add a backend endpoint that signs `grantAccess` or `revokeAccess` for the user.

The actual state change is:

```text
Frontend
   ↓
MetaMask
   ↓
AccessControl
```

Backend responsibilities remain:

```text
authentication
read-only authorization checks
document metadata
audit data
```

Do not create:

```text
POST /api/share
```

that secretly submits a server-signed blockchain transaction.

If a backend helper endpoint is useful for read-side checks, keep it read-only and document it.

---

# 24. SECURE KEY-DISTRIBUTION BOUNDARY

CRITICAL:

Granting on-chain access does NOT automatically transfer the AES decryption key.

Do NOT implement:

```text
POST key to verifier
store key in IPFS
store key on blockchain
put key in JWT
put key in localStorage
put key in URL
send key to arbitrary backend endpoint
```

Do not claim that a verifier can decrypt the document merely because `hasAccess(...) == true`.

The final multi-user cryptographic key-distribution mechanism remains deferred unless explicitly added by a later phase.

---

# 25. SHARING RESULT UI

After successful grant, the UI may show:

```text
Access granted on-chain
Verifier: 0x....
Transaction: 0x....
```

It should also clearly distinguish:

```text
Blockchain permission granted
```

from:

```text
Document decryption key delivered
```

The second state must NOT be shown as completed unless a real secure key-delivery system exists.

---

# 26. ACCESS REVOKE RESULT UI

After successful revoke:

```text
Access revoked on-chain
Verifier: 0x....
Transaction: 0x....
```

Again, use actual chain state.

---

# 27. AUDIT INTEGRATION

The following real blockchain events should naturally exist:

```text
AccessGranted
AccessRevoked
```

Do not create a second local audit entry.

The audit API from Phase 10 should be able to reconstruct these events.

After grant/revoke, verify that the audit endpoint eventually returns the actual event.

---

# 28. AUDIT EVENT CONSISTENCY

For every successful permission change:

```text
transaction confirmed
↓
state changed
↓
event emitted
↓
audit endpoint can observe event
```

Test this sequence.

Do not treat UI clicks as audit evidence.

---

# 29. MULTI-WALLET TESTING

Use at least:

```text
Owner
Verifier
Unauthorized wallet
```

These must be real local Hardhat/MetaMask test identities.

Tests must prove:

```text
Owner
→ can grant verifier

Verifier
→ cannot grant another verifier

Verifier
→ cannot revoke another user's permission

Unauthorized wallet
→ cannot modify owner permissions
```

Do not seed these identities into production runtime state.

---

# 30. ACCOUNT SWITCH TESTING

Test:

```text
Owner connected
↓
switch MetaMask account to Verifier
↓
UI updates
↓
owner-only controls disappear/disable
↓
backend authentication is reconciled
```

Then:

```text
switch back to Owner
↓
reauthenticate if required
↓
owner controls return
```

Do not leak previous-account permission state across account changes.

---

# 31. NETWORK SWITCH TESTING

Test:

```text
correct local network
↓
permission action available
```

then:

```text
wrong network
↓
permission action disabled
```

No transaction should be submitted to the wrong network.

---

# 32. FAILURE TESTING — GRANT

Test:

- malformed verifier address
- zero address
- unknown document
- non-owner caller
- revoked document
- user rejects transaction
- contract revert
- wrong network
- provider disconnected
- post-transaction state mismatch

All failures must be honest.

---

# 33. FAILURE TESTING — REVOKE

Test:

- malformed verifier address
- unknown document
- non-owner caller
- already-revoked permission
- user rejects transaction
- contract revert
- wrong network
- provider disconnected
- post-transaction state mismatch

Do not report successful revocation if no transaction occurred.

---

# 34. NO SYNTHETIC DATA

Never create:

```text
Demo verifier
Fake wallet
Sample permission
Mock access
Fake share transaction
Fake revoke transaction
Fake audit event
Fake access status
```

Test fixtures are allowed only in isolated test code.

Runtime application state must remain real.

---

# 35. SECURITY REVIEW

Review:

- wallet/account mismatch
- unauthorized grant
- unauthorized revoke
- wrong-network transactions
- stale permission UI
- document revocation interaction
- transaction status accuracy
- server-side secret exposure
- decryption-key exposure
- audit integrity
- event/state inconsistency

Do not claim a permission is revoked merely because the user clicked a button.

---

# 36. TRANSACTION PROVENANCE

For each successful state-changing operation, retain/display only actual metadata such as:

```text
transaction hash
block number
network
contract address
document ID
actor
verifier
```

Do not fabricate any of these.

---

# 37. TESTING — REAL BLOCKCHAIN

At least one real local integration test must execute:

```text
register real document
↓
owner grants verifier
↓
real receipt
↓
hasAccess == true
↓
owner revokes verifier
↓
real receipt
↓
hasAccess == false
```

Use the actual local Hardhat blockchain and deployed AccessControl contract.

Do not substitute a mock for the only end-to-end permission test.

---

# 38. TESTING — AUDIT

After real grant/revoke transactions:

```text
GET /api/audit/:documentId
```

must expose the actual:

```text
AccessGranted
AccessRevoked
```

events.

Confirm:

```text
transaction hash
block number
timestamp
actor
verifier
```

are derived from real blockchain logs.

---

# 39. FRONTEND TESTING

Test:

- share form validation
- empty verifier address
- malformed address
- zero address
- owner controls
- unauthorized controls
- transaction pending
- user rejection
- transaction confirmed
- post-grant refresh
- revoke flow
- post-revoke refresh
- revoked-document UI
- account switch
- network switch
- API dependency failure

---

# 40. DOCUMENTATION

Create/update:

```text
docs/sharing.md
docs/security.md
docs/api.md
docs/requirements-traceability.md
```

`docs/sharing.md` must document:

1. Owner authorization
2. Verifier address input
3. Grant flow
4. Revoke-access flow
5. Contract interaction
6. Transaction states
7. Post-transaction verification
8. Permission state model
9. Document revocation interaction
10. Audit events
11. Account/network handling
12. Security boundaries
13. Key-distribution limitation
14. Explicitly deferred functionality

Do not document decryption-key sharing as implemented.

---

# 41. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark sharing/access-control workflow requirements implemented only after real user-facing grant/revoke flows work.

Keep the distinction between:

```text
blockchain authorization
```

and:

```text
cryptographic key distribution
```

explicit.

---

# 42. ACCEPTANCE CRITERIA

Phase 13 is complete only when:

- [ ] Owner can select an actual registered document.
- [ ] Owner can enter a real verifier wallet address.
- [ ] Address validation works.
- [ ] Zero address is rejected.
- [ ] Document ownership is verified against actual DocumentRegistry state.
- [ ] Current permission state is read from AccessControl.
- [ ] Owner can initiate a real `grantAccess` transaction.
- [ ] MetaMask signs the real transaction.
- [ ] Real transaction hash is displayed after submission.
- [ ] Real receipt/confirmation is required for success.
- [ ] `hasAccess` is read after grant.
- [ ] Grant is confirmed by actual on-chain state.
- [ ] Owner can initiate a real `revokeAccess` transaction.
- [ ] Revocation is confirmed by actual on-chain state.
- [ ] Revoked documents cannot receive new active access.
- [ ] Unauthorized wallets cannot grant/revoke.
- [ ] Account changes are handled.
- [ ] Network changes are handled.
- [ ] Audit events come from real blockchain logs.
- [ ] No fake permissions exist at runtime.
- [ ] No fake users/wallets/CIDs/transactions exist.
- [ ] No decryption key is exposed or falsely reported as shared.
- [ ] Real local end-to-end grant/revoke test passes.
- [ ] Frontend tests pass.
- [ ] Backend/blockchain regression tests pass.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phases 3–12 remain functional.

---

# 43. SYNTHETIC DATA AUDIT

Search for:

```text
fake
mock
demo
dummy
sample
seed
fake verifier
fake wallet
fake access
fake transaction
fake permission
fake audit
```

Classify results as:

```text
test fixture
documentation example
actual runtime value
```

Remove synthetic runtime application data.

---

# 44. SECRET AUDIT

Search for:

```text
IPFS_JWT
AUTH_JWT_SECRET
AES_KEY
ENCRYPTION_KEY
PRIVATE_KEY
SEED_PHRASE
```

Confirm:

- no secret reaches the frontend
- no secret reaches blockchain
- no secret reaches IPFS
- no secret is logged
- no private key signs permission transactions
- no secret is returned by an API

Do not print secret values in the final report.

---

# 45. FINAL PHASE REPORT

At the end provide exactly:

## Phase 13 Status

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Sharing Workflow

Describe the real grant/revoke flow.

## Permission State

Describe how actual AccessControl state is read and verified.

## Blockchain Transactions

Report actual:

```text
network
chain ID
AccessControl address
grant transaction hash/block
revoke transaction hash/block
```

Only report values from real execution.

## Audit

Describe the actual `AccessGranted` and `AccessRevoked` event lineage.

## Key Distribution Boundary

Explicitly state that on-chain access permission does not imply AES-key delivery unless a real secure mechanism has been implemented.

## Tests

List:

```text
grant tests
revoke tests
authorization tests
account/network tests
audit tests
real blockchain integration
full regression
```

## Synthetic Data Audit

State whether fake/mock/demo runtime data was introduced.

## Credential/Security Audit

State whether secrets were exposed.

## Files Created/Modified

List important files.

## Known Limitations

Describe actual limitations, especially:

- no full multi-user cryptographic key-distribution mechanism unless explicitly implemented
- local network only if public deployment is still deferred
- enumeration limitations if applicable

## Deferred Work

State what remains for:

- Phase 14 — verification/tamper detection
- Phase 15 — audit/end-to-end testing/documentation

---

# 46. STOP CONDITION

When Phase 13 is complete:

1. Run frontend tests.
2. Run backend tests.
3. Run blockchain tests.
4. Execute real local grant/revoke transactions.
5. Verify real AccessControl state.
6. Verify real audit events.
7. Test owner/non-owner/account/network cases.
8. Audit synthetic runtime data.
9. Audit secrets.
10. Update documentation.
11. Update traceability.
12. Verify against `ai_rules.md`.
13. Verify against `MASTER_PLAN.md`.
14. Verify against Phase 1–12 artifacts.
15. Produce the final report.
16. STOP.

Do not automatically start Phase 14.

---

# CORE PRINCIPLE

> **Phase 13 must establish real on-chain sharing permissions controlled by the document owner: real verifier address, real MetaMask-signed grant/revoke transactions, real AccessControl state, and real blockchain audit events. Permission authorization must never be confused with cryptographic key delivery, and no fabricated sharing or transaction state is acceptable.**
