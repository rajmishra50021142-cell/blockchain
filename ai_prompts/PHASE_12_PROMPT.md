# PHASE 12 — REAL END-TO-END DOCUMENT REGISTRATION WORKFLOW

## Purpose

Implement the complete real-world document-registration workflow that connects the systems built in Phases 4–11:

```text
MetaMask / Wallet
       ↓
Next.js Frontend
       ↓
Phase 10 Backend
       ↓
Phase 8 Cryptography
       ↓
Phase 9 IPFS
       ↓
DocumentRegistry
       ↓
Real blockchain transaction
```

The goal is to allow a real user to take an actual document, encrypt it, store the encrypted payload on real IPFS, and register the resulting document metadata on the real blockchain using a real wallet signature/transaction.

This phase is the first full registration workflow.

The project must continue to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No fake document, fake CID, fake hash, fake transaction, fake wallet, fake contract state, or fake success state is allowed.

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
14. `docs/requirements.md`
15. `docs/requirements-traceability.md`
16. `docs/architecture.md`
17. `docs/api.md`
18. `docs/security.md`
19. `docs/wallet-identity.md` if present
20. `docs/document-registry.md`
21. `docs/access-control.md`
22. `docs/cryptography.md`
23. `docs/ipfs.md`
24. `docs/frontend.md`
25. All current frontend, backend, blockchain, deployment, cryptography, and IPFS implementation files
26. The supplied reference PPT and mandatory requirements image if available

Treat these as the current source of truth.

Do not silently redesign the architecture.

If an earlier implementation already contains part of this workflow, reuse it and verify it rather than creating a duplicate flow.

---

# 2. IMPORTANT EXISTING-IMPLEMENTATION CHECK

Before implementing anything, inspect Phase 10's integration test and the actual source code.

Phase 10 may already contain a test-only end-to-end lifecycle involving:

```text
encryption
IPFS
registration
verification
access
audit
```

That does NOT automatically mean the real user-facing Phase 12 workflow is complete.

Determine exactly which parts are:

```text
test-only
backend-only
wallet-signed
frontend-driven
production application flow
```

Do not duplicate an existing implementation unnecessarily.

The final report must distinguish:

```text
previous test/integration capability
```

from:

```text
actual end-user document-registration workflow
```

---

# 3. PHASE BOUNDARY

This phase IS responsible for:

- real document selection/upload UI
- actual browser file bytes
- SHA-256 computation
- AES-256-GCM encryption
- real encryption-key generation
- real encrypted payload creation
- real IPFS upload through the established backend/IPFS service
- real CID retrieval
- real random document ID generation
- real MetaMask registration transaction
- passing actual document hash/CID/document ID to DocumentRegistry
- waiting for real transaction confirmation
- reading actual resulting blockchain state
- showing real transaction details
- document registration success state
- document registration failure handling
- cleanup/recovery handling
- refreshing real document state after registration
- end-to-end registration tests
- provenance display
- documentation
- requirements traceability

This phase is NOT responsible for:

- sharing with other users
- verifier permission workflow
- IdentityRegistry
- complete verification/tamper UI
- complete audit UI beyond displaying registration provenance if already supported
- public testnet deployment
- mobile application
- AI features
- ZK proofs
- cross-chain functionality

Those remain later phases.

---

# 4. CORE END-TO-END FLOW

The required production flow is:

```text
User
 ↓
Connect MetaMask
 ↓
Authenticate with backend
 ↓
Select real document
 ↓
Read actual file bytes
 ↓
Compute SHA-256
 ↓
Generate AES-256-GCM key
 ↓
Encrypt actual document bytes
 ↓
Upload encrypted payload to real IPFS
 ↓
Receive real CID
 ↓
Generate real secure bytes32 document ID
 ↓
Prompt MetaMask for DocumentRegistry.registerDocument(...)
 ↓
User approves/rejects
 ↓
Real blockchain transaction
 ↓
Wait for actual receipt
 ↓
Read DocumentRegistry state
 ↓
Confirm owner/hash/CID/revocation
 ↓
Show registered document
```

There must be no fake intermediate success.

---

# 5. SOURCE-OF-TRUTH MODEL

Maintain these boundaries:

| Value | Authoritative Source |
|---|---|
| Original document bytes | User-selected file |
| SHA-256 | Phase 8 cryptographic service |
| AES key | Phase 8 runtime key generation |
| Ciphertext | Phase 8 |
| CID | Actual IPFS provider response |
| Document ID | Secure runtime generation |
| Owner | DocumentRegistry / transaction `msg.sender` |
| Registration timestamp | Blockchain |
| Revocation | DocumentRegistry |
| Transaction hash | MetaMask/provider |
| Block number | Blockchain receipt |
| Contract address | Actual Phase 5 deployment |
| Network/chain ID | Actual wallet/provider |

The frontend may display these values but must not invent or override them.

---

# 6. REAL FILE INPUT

The registration workflow must accept a real browser `File`.

Use:

```text
File
→ ArrayBuffer / Uint8Array
```

Do not:

```text
create fake Blob
generate sample PDF
seed a demo document
use hard-coded bytes
```

A user must explicitly choose the document.

An empty file-selection state is valid.

---

# 7. OPTIONAL FILE SIZE VALIDATION

Use a documented maximum upload size if the project already has one.

If no project requirement exists, do not invent an arbitrarily restrictive limit simply for appearance.

If a provider/browser limitation applies, document it.

Reject files only for documented reasons.

---

# 8. PRE-UPLOAD HASH

Compute the document SHA-256 before encryption using the Phase 8 cryptography implementation.

Flow:

```text
actual File bytes
      ↓
SHA-256
      ↓
32-byte digest
```

The digest must be in the exact canonical representation required by DocumentRegistry.

Do not hash:

```text
filename
metadata
ciphertext
CID
JSON wrapper
```

for the primary document integrity hash.

---

# 9. ENCRYPTION

Encrypt the original document bytes using the Phase 8 implementation.

Requirements:

- AES-256-GCM
- cryptographically random 256-bit key
- cryptographically random 96-bit IV
- authenticated ciphertext
- canonical Phase 8 serialization

Do not implement encryption a second time inside the registration component.

Reuse the established cryptographic service.

---

# 10. KEY HANDLING

The AES key must remain controlled by the application.

The key must NOT:

```text
go to the blockchain
go to IPFS
go into the CID
go into DocumentRegistry
go into the transaction
go into the audit log
go into localStorage
go into sessionStorage
be printed in UI
be logged
be sent to arbitrary APIs
```

The registration transaction contains only:

```text
document ID
document hash
CID
```

as required by DocumentRegistry.

---

# 11. ENCRYPTED PAYLOAD UPLOAD

Send the Phase 8 encrypted payload to the existing Phase 10/Phase 9 IPFS path.

Do not call Pinata directly from the browser with the Pinata JWT.

The intended path remains:

```text
Frontend
    ↓
Phase 10 backend
    ↓
Phase 9 IPFS service
    ↓
Pinata
```

The frontend receives only the real upload result required for the workflow, especially the real CID.

---

# 12. IPFS SUCCESS CONDITION

Do not proceed to blockchain registration unless the IPFS upload has genuinely succeeded and a valid real CID was returned.

Required:

```text
real encrypted payload
+
real IPFS response
+
real CID
```

If upload fails:

```text
STOP
show error
NO blockchain transaction
```

Do not create a fallback CID.

---

# 13. RANDOM DOCUMENT ID

Generate the document ID using a cryptographically secure random source.

The result must be:

```text
bytes32
```

Use a secure runtime random generator.

Do NOT derive the document ID from:

```text
filename
timestamp
wallet address
CID
hash using an undocumented construction
incrementing counter
document1/document2
```

unless the exact architecture explicitly changes.

The selected document-ID generation rule must be documented.

---

# 14. DOCUMENT ID UNIQUENESS

The generated ID must be checked for collisions according to the chosen implementation.

Because a cryptographically random 256-bit ID has extremely low collision probability, do not add an unnecessary global database solely to track random IDs unless the architecture requires it.

The blockchain remains the final authority.

If registration reverts because the ID already exists:

```text
report the actual blockchain error
```

and do not silently replace the transaction result with success.

---

# 15. PRE-TRANSACTION PREVIEW

Before asking the user to sign the blockchain transaction, display a concise summary of the actual values being registered.

For example:

```text
Document ID
SHA-256
IPFS CID
Network
Contract
Connected wallet
```

Do not reveal:

```text
AES key
```

The displayed values must come from the real current operation.

Do not let the user edit the hash/CID after they have been computed.

If they select a different file:

```text
recompute the hash
re-encrypt
re-upload
generate/reconfirm a document ID
```

Do not reuse stale values silently.

---

# 16. DOCUMENTREGISTRY TRANSACTION

Use the actual Phase 5 contract ABI/address.

The registration call should conceptually be:

```text
registerDocument(
    documentId,
    documentHash,
    ipfsCid
)
```

The transaction must be sent through:

```text
ethers.js
+
MetaMask
+
user wallet
```

Do not use a backend private key.

Do not use a server signer.

Do not fabricate the result.

---

# 17. NETWORK VALIDATION

Before submitting the registration transaction:

1. read actual MetaMask chain ID
2. compare against expected chain ID
3. verify the DocumentRegistry address belongs to the expected network/configuration
4. ensure wallet is connected
5. ensure backend authentication corresponds to the same wallet where applicable

If the network is wrong:

```text
block transaction
show wrong-network state
```

Do not silently switch networks unless an explicit real wallet-provider flow is already implemented.

---

# 18. WALLET/SESSION CONSISTENCY

Confirm that:

```text
MetaMask connected account
```

matches:

```text
authenticated backend wallet identity
```

If they differ:

```text
invalidate the registration operation
require re-authentication
```

Do not allow:

```text
Wallet A connected
Backend authenticated as Wallet B
Registration submitted by Wallet A
```

without explicit re-authentication/reconciliation.

---

# 19. USER REJECTION

Handle MetaMask rejection distinctly.

If the user rejects:

```text
transaction not submitted/confirmed
```

Do not display:

```text
Document registered
```

Show a truthful state such as:

```text
Registration cancelled by user.
```

The IPFS CID may already exist because IPFS upload preceded blockchain registration.

Do not claim that it was removed unless an actual cleanup operation occurred.

---

# 20. BLOCKCHAIN FAILURE

Handle:

- transaction rejection
- insufficient funds
- wrong network
- contract revert
- duplicate document ID
- invalid input
- provider disconnected
- timeout
- transaction replacement
- uncertain transaction status

The UI must use actual provider/error information.

Never turn blockchain failure into a fake success.

---

# 21. IPFS-THEN-BLOCKCHAIN ORDER

The correct order is:

```text
encrypt
  ↓
IPFS
  ↓
CID
  ↓
blockchain registration
```

Do NOT register a document on-chain before the real CID exists.

This order ensures that the on-chain metadata references an actual storage object.

---

# 22. ORPHAN IPFS OBJECTS

Important:

If:

```text
IPFS upload succeeds
```

but:

```text
MetaMask transaction is rejected/fails
```

the encrypted payload may remain pinned.

Do not pretend it was deleted.

Implement one of the following only if supported by the selected IPFS service and architecture:

1. actual cleanup/unpin operation
2. clear "unregistered IPFS object" state
3. deferred/manual cleanup process

Do not invent cleanup success.

Document the actual behavior.

Because IPFS is content-addressed, cleanup may depend on provider capabilities.

---

# 23. TRANSACTION CONFIRMATION

After MetaMask returns a transaction response:

```text
submitted
```

is not the same as:

```text
confirmed
```

Wait for the actual receipt/confirmation.

Only after confirmation should the UI show:

```text
Registration confirmed
```

The transaction hash must come from the real provider.

---

# 24. RECEIPT DATA

After successful confirmation, capture actual:

```text
transaction hash
block number
contract address
gas used if available
status
```

Do not fabricate or approximate any value.

---

# 25. POST-TRANSACTION CHAIN READ

After confirmation, read the document back from DocumentRegistry.

Verify:

```text
document exists
owner == connected wallet
document hash == computed SHA-256
CID == uploaded real CID
revoked == false
```

This post-write read is important.

Do not treat the transaction receipt alone as proof that every intended field was stored correctly.

If state does not match:

```text
report a real consistency error
```

Do not tell the user registration succeeded as fully valid.

---

# 26. DOCUMENT LIST REFRESH

After confirmed registration:

1. query the real backend document API or authoritative chain state
2. refresh the document list
3. show the new document
4. use actual returned metadata

Do not manually append a fake object to local state as a substitute for reading the authoritative source.

Optimistic UI may be used only if it is reconciled with the actual confirmed state.

---

# 27. REGISTRATION SUCCESS UI

Show actual provenance:

```text
Registered
Owner
Document ID
SHA-256
IPFS CID
Transaction hash
Block number
Network
Registration timestamp
```

Values must be real.

The AES key must never be displayed.

---

# 28. ERROR STATE UX

Handle at minimum:

```text
no wallet
wrong network
not authenticated
no file selected
empty file if disallowed
hashing error
encryption error
IPFS upload error
invalid CID
wallet rejection
transaction revert
transaction timeout/uncertain state
post-registration mismatch
backend unavailable
```

Do not silently proceed past a failed stage.

---

# 29. REGISTRATION STATE MACHINE

Implement a clear state machine equivalent to:

```text
IDLE
  ↓
FILE_SELECTED
  ↓
HASHING
  ↓
ENCRYPTING
  ↓
UPLOADING
  ↓
CID_READY
  ↓
READY_TO_SIGN
  ↓
WALLET_CONFIRMING
  ↓
TRANSACTION_SUBMITTED
  ↓
CONFIRMING
  ↓
REGISTERED
```

Failure states can occur from any stage:

```text
ERROR
CANCELLED
```

Do not skip state transitions merely for UI simplicity.

---

# 30. NO FAKE PROGRESS

Do not show fabricated:

```text
25%
50%
75%
```

unless the underlying operation provides real measurable progress.

For hashing/encryption/IPFS/network steps where exact progress is unavailable, use:

```text
indeterminate progress
```

or truthful stage labels.

---

# 31. DOCUMENT SECURITY

The application must ensure that the original document:

- is encrypted before leaving the cryptographic boundary
- is never sent to Pinata plaintext
- is never sent to the blockchain
- is never logged
- is not stored in localStorage/sessionStorage

The plaintext may temporarily exist in browser memory as required for the operation.

Do not claim guaranteed memory erasure unless actually implemented.

---

# 32. BACKEND ROLE

The backend may provide:

```text
authentication
IPFS upload relay
IPFS retrieval
document metadata queries
verification
audit
```

The backend must NOT sign the DocumentRegistry registration transaction on behalf of the user.

State-changing registration remains:

```text
MetaMask → DocumentRegistry
```

---

# 33. BLOCKCHAIN WRITE AUTHORITY

The actual registration transaction signer must be:

```text
connected user's wallet
```

Therefore:

```text
msg.sender == user wallet
```

and DocumentRegistry's owner becomes that wallet.

Do not supply an arbitrary owner argument.

Do not attempt to bypass DocumentRegistry ownership.

---

# 34. IPFS / BLOCKCHAIN CONSISTENCY

The resulting record must satisfy:

```text
DocumentRegistry.ipfsCid == actual uploaded CID
DocumentRegistry.documentHash == SHA-256(original bytes)
DocumentRegistry.owner == transaction signer
```

These are core Phase 12 invariants.

Test them.

---

# 35. CRYPTOGRAPHIC CONSISTENCY

The workflow must establish:

```text
SHA-256(original file)
=
on-chain documentHash
```

and:

```text
AES decrypt(IPFS payload)
=
original file bytes
```

Test both relationships.

---

# 36. TESTING — UNIT

Test the registration orchestration/state machine:

- no file
- file selected
- hash failure
- encryption failure
- IPFS failure
- CID returned
- user rejection
- transaction revert
- transaction confirmation
- post-write chain mismatch
- successful registration

Use deterministic test fixtures only inside tests.

Do not turn test fixtures into runtime application data.

---

# 37. TESTING — REAL IPFS

Use the real Phase 9 IPFS path for at least one integration test.

Prove:

```text
real file
→ hash
→ encrypt
→ real Pinata upload
→ real CID
```

Do not mock this path for the only integration test.

---

# 38. TESTING — REAL BLOCKCHAIN

Use the real local Hardhat chain.

Prove:

```text
real signer
→ real registerDocument transaction
→ real receipt
→ real DocumentRegistry state
```

Verify:

```text
owner
hash
CID
revocation state
```

Use the actual deployed contract.

---

# 39. TESTING — FULL END-TO-END

Perform a complete real test:

```text
1. connect wallet
2. authenticate
3. select actual test file
4. compute SHA-256
5. encrypt AES-256-GCM
6. upload encrypted payload to real IPFS
7. receive real CID
8. generate document ID
9. submit MetaMask transaction
10. receive real transaction hash
11. wait for receipt
12. read document back from blockchain
13. verify owner/hash/CID
14. retrieve encrypted object
15. decrypt
16. verify original bytes
17. refresh document list
```

Every step must use actual runtime results.

---

# 40. TESTING — FAILURE PATHS

Explicitly test:

### IPFS failure before transaction

Expected:

```text
no blockchain registration
```

### User rejects blockchain transaction

Expected:

```text
no false registration state
```

### Blockchain revert

Expected:

```text
real error
```

### Wrong network

Expected:

```text
transaction blocked
```

### Account changes mid-flow

Expected:

```text
registration operation invalidated/restarted
```

### Post-write inconsistency

Expected:

```text
honest consistency error
```

---

# 41. DUPLICATE/REPLAY PROTECTION

If the same exact registration is attempted twice with the same document ID:

```text
DocumentRegistry must reject duplicate ID
```

The frontend must show the real contract error.

Do not silently generate fake "already registered" UI state without reading actual chain state.

---

# 42. DOCUMENT LIST / DETAIL INTEGRATION

After successful registration, the frontend should use the existing Phase 10 API to display the registered document.

Do not create a parallel local document database.

Authoritative data remains:

```text
DocumentRegistry
+
AccessControl
+
IPFS
```

as applicable.

---

# 43. TRANSACTION PROVENANCE

The registration result should retain enough information for later phases:

```text
document ID
transaction hash
block number
CID
document hash
owner
```

Do not store sensitive keys with this metadata.

---

# 44. FRONTEND/API BOUNDARY

Do not send:

```text
AES key
private key
seed phrase
Pinata JWT
JWT signing secret
```

through the frontend API.

The API receives only what it legitimately needs.

---

# 45. DOCUMENT METADATA LIMITATION

Phase 12 may only store the metadata supported by DocumentRegistry:

```text
document ID
owner
hash
CID
registration timestamp
revocation state
```

Do not fabricate rich metadata such as:

```text
document title
institution
category
description
filename
tags
```

unless a real data model for those fields has been intentionally implemented.

If filename is useful to the user, keep it locally/UI-only unless the architecture has a real persistence design for it.

---

# 46. AUDIT TRAIL

The registration flow should naturally produce a real:

```text
DocumentRegistered
```

event from DocumentRegistry.

Do not create a second manual audit record saying registration occurred.

Later audit APIs must derive the event from the blockchain.

---

# 47. SECURITY REVIEW

Review:

- plaintext handling
- AES key exposure
- Pinata credential exposure
- transaction parameter integrity
- wallet/account mismatch
- network mismatch
- contract address mismatch
- stale hash/CID state
- stale document ID
- transaction status handling
- post-write consistency
- retry behavior
- orphan IPFS object handling

Fix real issues before completion.

---

# 48. DOCUMENTATION

Create/update:

```text
docs/document-registration.md
docs/security.md
docs/requirements-traceability.md
docs/api.md
```

`docs/document-registration.md` must document:

1. End-to-end registration flow
2. File input
3. SHA-256
4. AES-256-GCM
5. Key handling
6. IPFS upload
7. CID
8. Document ID
9. MetaMask registration transaction
10. Transaction confirmation
11. Post-write state verification
12. Failure handling
13. Orphan IPFS behavior
14. Provenance
15. Security boundaries
16. What remains deferred

Only document actual behavior.

---

# 49. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark the complete registration workflow as implemented only after the actual user-facing end-to-end flow works.

Distinguish:

```text
test-only lifecycle
```

from:

```text
real user-facing registration
```

---

# 50. ACCEPTANCE CRITERIA

Phase 12 is complete only when:

- [ ] User can select a real document.
- [ ] Actual document bytes are processed.
- [ ] SHA-256 is computed from exact original bytes.
- [ ] AES-256-GCM encrypts the real document.
- [ ] Encryption key is never exposed publicly.
- [ ] Encrypted payload reaches real IPFS through the backend.
- [ ] Real CID is returned.
- [ ] No fake CID is used.
- [ ] A secure random document ID is generated.
- [ ] MetaMask uses the real connected wallet.
- [ ] Correct chain is validated before transaction.
- [ ] `registerDocument()` is called on the actual Phase 5 contract.
- [ ] User explicitly signs/approves the transaction.
- [ ] Real transaction hash is obtained.
- [ ] Real receipt/confirmation is obtained.
- [ ] Post-registration state is read back from the blockchain.
- [ ] On-chain owner matches transaction signer.
- [ ] On-chain document hash matches the actual SHA-256.
- [ ] On-chain CID matches the actual IPFS CID.
- [ ] Document appears through the real document API/list.
- [ ] Encrypted IPFS payload can be retrieved.
- [ ] Retrieved payload decrypts to the exact original bytes.
- [ ] Failure states are honest.
- [ ] No fake fallback exists.
- [ ] No server private key signs registration.
- [ ] No external API credential is exposed to the frontend.
- [ ] Real end-to-end test passes.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phases 3–11 remain functional.

---

# 51. SYNTHETIC DATA AUDIT

Before completion, inspect the entire registration workflow for:

```text
fake document
mock file
fake hash
fake CID
fake document ID
fake transaction hash
fake receipt
fake block
fake registration status
fake owner
fake document list
```

Classify matches as:

```text
test fixture
documentation example
actual runtime value
```

Remove synthetic runtime application data.

---

# 52. SECRET AUDIT

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

- no secret is logged
- no secret is sent to blockchain
- no secret is uploaded to IPFS
- no secret is returned in API response
- no secret appears in browser-visible source
- no private key is used for backend registration

Do not print secret values in the final report.

---

# 53. FINAL PHASE REPORT

At the end provide exactly:

## Phase 12 Status

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## End-to-End Registration Flow

Describe the actual implemented flow.

## Real Runtime Sources

Report:

```text
document bytes
SHA-256
AES encryption
CID
document ID
wallet
transaction
receipt
on-chain state
```

## Blockchain Registration

Report actual:

```text
network
chain ID
DocumentRegistry address
transaction hash
block number
document ID
```

Only report values obtained from actual execution.

## IPFS

Report:

```text
real CID
upload/retrieval result
encrypted-payload integrity
```

Do not expose credentials.

## Cryptographic Verification

Report:

```text
original hash
on-chain hash comparison
decrypt/recovered-byte comparison
```

## Failure Testing

List actual failure cases and outcomes.

## Synthetic Data Audit

State whether synthetic runtime data was introduced.

## Credential Audit

State whether any secret was exposed.

## Files Created/Modified

List important files.

## Known Limitations

Describe actual limitations, including orphan-IPFS behavior if applicable.

## Deferred Work

State what remains for:

- Phase 13 — sharing and revocation workflow
- Phase 14 — verification and tamper-detection workflow
- Phase 15 — audit/end-to-end testing/documentation

---

# 54. STOP CONDITION

When Phase 12 is complete:

1. Run frontend tests.
2. Run backend tests.
3. Run blockchain tests.
4. Run the real IPFS test.
5. Run the complete real registration workflow.
6. Verify actual transaction receipt.
7. Verify actual on-chain state.
8. Verify actual IPFS retrieval/decryption.
9. Verify document list refresh.
10. Test failure paths.
11. Audit synthetic runtime data.
12. Audit secrets.
13. Update documentation.
14. Update traceability.
15. Verify against `ai_rules.md`.
16. Verify against `MASTER_PLAN.md`.
17. Verify against Phase 1–11 artifacts.
18. Produce the final report.
19. STOP.

Do not automatically start Phase 13.

---

# CORE PRINCIPLE

> **Phase 12 must turn the previously separate components into a genuine user-facing document registration workflow: a real file is hashed and encrypted, the encrypted bytes are stored on real IPFS, the real CID and hash are registered through a real MetaMask-signed DocumentRegistry transaction, and the resulting blockchain/IPFS state is read back and verified. No fabricated intermediate or final state is acceptable.**
