# PHASE 14 — REAL DOCUMENT VERIFICATION & TAMPER-DETECTION WORKFLOW

## Purpose

Implement the complete real-world document verification and tamper-detection workflow using the systems built through Phases 8–13.

Core flow:

```text
Real Candidate Document
        ↓
SHA-256
        ↓
Actual on-chain documentHash
        ↓
Authorization check
        ↓
Revocation check
        ↓
Real verification result
```

Where legitimate decryption-key access exists:

```text
IPFS encrypted payload
        ↓
authorized retrieval
        ↓
AES-256-GCM decryption
        ↓
SHA-256
        ↓
on-chain documentHash
```

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No fake verification, hash, document state, permission, revocation state, or success state.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Read completely before changing anything:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md` through `PHASE_13_PROMPT.md`
4. All current documentation under `docs/`
5. Current `frontend/`, `backend/`, and `blockchain/` implementation
6. Supplied project requirements/reference materials if available

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
docs/frontend.md
```

Treat these as the source of truth.

Do not silently redesign the architecture.

---

# 2. EXISTING-IMPLEMENTATION REVIEW

Inspect the existing:

```text
POST /api/verify
verification.service.ts
DocumentRegistry integration
AccessControl integration
Phase 12 registration verification
Phase 13 sharing/revocation
frontend verification UI
IPFS retrieval
AES-GCM implementation
```

Reuse existing implementations instead of creating duplicate verification engines.

Clearly distinguish:

```text
candidate-file hash verification
stored-object cryptographic verification
authorization
revocation
tamper/mismatch detection
```

---

# 3. PHASE BOUNDARY

This phase IS responsible for:

- real candidate-document verification
- exact byte reading
- SHA-256 computation
- comparison with on-chain `documentHash`
- authorization checks
- revocation checks
- explicit verification result states
- tamper/mismatch workflow
- authorized IPFS retrieval where supported
- AES-256-GCM decryption where a legitimate key exists
- byte-for-byte verification where legitimate decryption is possible
- verification UI
- verification provenance
- failure/error handling
- account/network handling
- real verification/tamper tests
- documentation and traceability

This phase is NOT responsible for:

- inventing key-distribution
- storing AES keys on-chain
- storing AES keys in IPFS
- unauthorized decryption
- IdentityRegistry
- public testnet deployment
- AI fraud detection
- ZK proofs
- cross-chain functionality
- native mobile app

---

# 4. CRITICAL KEY-DISTRIBUTION BOUNDARY

Phase 13 intentionally separates:

```text
on-chain access permission
```

from:

```text
AES document-key delivery
```

Do not violate that boundary.

Never implement:

```text
key from blockchain
key from IPFS
key from JWT
key from URL
key from wallet address
key from wallet private key
```

If an authorized verifier does not have a legitimate AES key:

```text
DECRYPTION_UNAVAILABLE
```

Do not fake decryption or fabricate a key.

---

# 5. VERIFICATION STATES

Use deterministic states at minimum:

```text
VERIFIED
TAMPER_DETECTED
REVOKED
UNAUTHORIZED
DOCUMENT_NOT_FOUND
INVALID_INPUT
DECRYPTION_UNAVAILABLE
DECRYPTION_FAILED
IPFS_UNAVAILABLE
BLOCKCHAIN_UNAVAILABLE
ERROR
```

Reuse existing project terminology when already defined.

---

# 6. CANDIDATE DOCUMENT FLOW

Implement:

```text
Select real file
      ↓
Read exact bytes
      ↓
SHA-256
      ↓
Identify actual registered document
      ↓
Read DocumentRegistry
      ↓
Check authorization
      ↓
Check revocation
      ↓
Compare hashes
      ↓
Return actual result
```

Do not hash filename, metadata, CID, or ciphertext for the primary candidate hash.

---

# 7. SHA-256

Reuse Phase 8.

Requirements:

- actual candidate bytes
- trusted cryptographic primitive
- 32-byte digest
- canonical project representation
- compatibility with `bytes32`

Do not implement SHA-256 a second time.

---

# 8. DOCUMENT LOOKUP

Use actual `DocumentRegistry` state:

```text
documentExists(documentId)
getDocument(documentId)
isRevoked(documentId)
```

as supported by the deployed contract.

Do not trust frontend local state as authoritative.

---

# 9. AUTHORIZATION

Use actual:

```text
DocumentRegistry.owner
AccessControl.hasAccess(documentId, wallet)
```

where applicable.

A known document ID, CID, or hash does not by itself authorize verification.

---

# 10. REVOCATION

If the document is actually revoked:

```text
status = REVOKED
```

Do not report a currently valid `VERIFIED` result for a revoked document.

Historical evidence may still be displayed.

---

# 11. HASH MATCH

Return `VERIFIED` only when:

```text
document exists
AND
user authorized
AND
document not revoked
AND
candidateHash == onChainDocumentHash
```

All conditions must be satisfied.

---

# 12. HASH MISMATCH / TAMPER DETECTION

If:

```text
candidateHash != onChainDocumentHash
```

return:

```text
TAMPER_DETECTED
```

or the established equivalent.

Use precise language:

> The candidate document hash differs from the hash registered on-chain.

Do not speculate about who modified it, when it was modified, or why.

---

# 13. VERIFICATION PROVENANCE

Where available, show actual:

```text
Candidate hash → Web Crypto SHA-256
Registered hash → DocumentRegistry
Owner → DocumentRegistry
Permission → AccessControl
Revocation → DocumentRegistry
CID → DocumentRegistry/IPFS
Network → actual provider
```

Do not present frontend state as authoritative.

---

# 14. IPFS RETRIEVAL

Where legitimate key access exists:

```text
CID
 ↓
backend IPFS relay
 ↓
encrypted payload
 ↓
AES-256-GCM decrypt
 ↓
plaintext bytes
 ↓
SHA-256
 ↓
on-chain hash
```

Never expose `IPFS_JWT` to the browser.

Never call Pinata directly from the frontend with server credentials.

---

# 15. DECRYPTION RULES

If a legitimate AES key exists:

```text
decrypt
→ recover exact bytes
→ SHA-256
→ compare with on-chain hash
```

If no legitimate key exists:

```text
DECRYPTION_UNAVAILABLE
```

If authentication fails:

```text
DECRYPTION_FAILED
```

Do not return partial plaintext.

Keep cryptographic authentication failure distinct from candidate hash mismatch.

---

# 16. CANDIDATE VS STORED-OBJECT VERIFICATION

Support the distinction:

### Candidate verification

```text
candidate file
→ SHA-256
→ on-chain hash
```

### Stored-object verification

```text
IPFS ciphertext
→ decrypt
→ SHA-256
→ on-chain hash
```

Do not conflate these two flows.

---

# 17. VERIFICATION UI

Implement the complete user-facing verification experience using real data.

The UI should support:

```text
select registered document
select candidate file
compute hash
check authorization
check revocation
compare
display evidence
```

Show clear states:

```text
Verified
Tamper detected
Revoked
Unauthorized
Not found
Unavailable
```

No fake results.

---

# 18. RESULT EVIDENCE

For `VERIFIED`, show where appropriate:

```text
Candidate SHA-256
Registered SHA-256
Document ID
Owner
Network
Registration provenance
```

For `TAMPER_DETECTED`:

```text
Candidate SHA-256
Registered SHA-256
Mismatch
Document ID
```

For `REVOKED`:

```text
Document ID
Owner
Revocation state
```

Do not make legal authenticity/fraud-prevention claims.

---

# 19. ACCOUNT / NETWORK HANDLING

When MetaMask account changes:

```text
clear/reconcile stale authentication
refresh authorization
refresh verification state
```

When network changes:

```text
read actual chain ID
compare with expected network
block incompatible verification if necessary
```

Never silently query a different network.

---

# 20. API BOUNDARY

Reuse the existing:

```text
POST /api/verify
GET /api/ipfs/:cid
GET /api/documents/:id
```

where appropriate.

Do not create duplicate verification endpoints without a documented need.

If API changes are required, update:

```text
docs/api.md
tests
frontend client types
traceability
```

---

# 21. FALSE-CERTIFICATION RULE

Do not use unsupported language such as:

```text
100% authentic
guaranteed genuine
fraud-proof
legally certified
original for sure
```

Use evidence-based wording such as:

> Hash matches the document hash recorded on-chain.

---

# 22. PRIVACY

Candidate plaintext should remain in browser memory for hashing where possible.

Do not:

```text
upload candidate plaintext to IPFS
upload candidate plaintext to blockchain
log candidate plaintext
store candidate bytes in localStorage/sessionStorage
store AES keys in localStorage/sessionStorage
```

Do not claim guaranteed memory erasure unless implemented.

---

# 23. TAMPER TESTING

Perform real tests for:

```text
exact original bytes → VERIFIED
one-byte modification → TAMPER_DETECTED
different document → TAMPER_DETECTED
```

For encrypted payloads:

```text
modified ciphertext
→ AES-GCM authentication failure
→ DECRYPTION_FAILED
```

Use test fixtures only inside tests.

---

# 24. REVOCATION TEST

Use the real local blockchain:

```text
registered document
→ revokeDocument
→ verification attempt
→ REVOKED
```

Do not fake revocation state.

---

# 25. AUTHORIZATION TEST

Use real local wallets:

```text
Owner → allowed
Authorized verifier → allowed
Unauthorized wallet → rejected
```

Respect the AccessControl state produced by Phase 13.

Do not seed fake production identities.

---

# 26. REAL BLOCKCHAIN TESTING

At least one real local integration test must prove:

```text
registered document
→ actual on-chain hash
→ exact candidate
→ VERIFIED
```

and:

```text
modified candidate
→ TAMPER_DETECTED
```

and:

```text
revoked document
→ REVOKED
```

Use the real Hardhat network and deployed contracts.

---

# 27. REAL IPFS / CRYPTO TESTING

Where a legitimate key exists:

```text
real ciphertext
→ real IPFS retrieval
→ real AES-GCM decryption
→ exact original bytes
→ SHA-256
→ on-chain comparison
```

Also test modified ciphertext and verify authenticated decryption failure.

Do not replace the only real integration path with mocks.

---

# 28. ERROR HANDLING

Handle truthfully:

```text
wallet unavailable
authentication expired
wrong network
document not found
unauthorized
revoked
missing candidate file
invalid input
IPFS unavailable
decryption unavailable
decryption failed
blockchain unavailable
malformed API response
verification service unavailable
```

Never convert errors into `VERIFIED`.

---

# 29. SECURITY REVIEW

Review:

- exact-byte hashing
- canonical hash comparison
- authorization
- revocation
- AES-key exposure
- Pinata/IPFS credential exposure
- plaintext logging
- account switching
- network switching
- stale state
- false-success paths
- malformed input handling

Fix actual issues before completion.

---

# 30. DOCUMENTATION

Create/update:

```text
docs/verification.md
docs/security.md
docs/api.md
docs/requirements-traceability.md
```

`docs/verification.md` must cover:

1. Candidate-file verification
2. SHA-256
3. On-chain comparison
4. Authorization
5. Revocation
6. IPFS retrieval
7. AES-GCM boundary
8. Tamper detection
9. Result states
10. Evidence/provenance
11. Error handling
12. Privacy
13. Key-distribution limitation
14. Performance measurements
15. Known limitations
16. Deferred work

Only document implemented behavior.

---

# 31. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark verification/tamper requirements complete only after real candidate verification, authorization, revocation, mismatch detection, and tests work.

Do not claim legal authenticity or absolute fraud prevention.

---

# 32. ACCEPTANCE CRITERIA

Phase 14 is complete only when:

- [ ] Real candidate file can be selected.
- [ ] Exact candidate bytes are processed.
- [ ] SHA-256 is real and deterministic.
- [ ] DocumentRegistry state is authoritative.
- [ ] AccessControl state is authoritative.
- [ ] Revocation state is authoritative.
- [ ] Exact hash match can produce `VERIFIED`.
- [ ] Modified candidate produces `TAMPER_DETECTED`.
- [ ] Different candidate produces a real mismatch.
- [ ] Revoked document produces `REVOKED`.
- [ ] Unauthorized wallet is rejected.
- [ ] Wrong network is handled.
- [ ] Account changes are handled.
- [ ] IPFS retrieval uses the existing secure backend relay.
- [ ] AES decryption occurs only with a legitimate key.
- [ ] Decryption failures are honest.
- [ ] No fake verification/decryption state exists.
- [ ] Provenance is based on real sources.
- [ ] Frontend verification experience is implemented.
- [ ] Backend verification behavior is consistent with the UI.
- [ ] Real local blockchain tests pass.
- [ ] Real IPFS/cryptography verification passes where legitimate key access exists.
- [ ] Full regression from Phases 3–13 passes.
- [ ] Documentation and traceability are updated.

---

# 33. SYNTHETIC DATA AUDIT

Search all verification runtime paths for:

```text
fake
mock
demo
dummy
sample
fake hash
fake verification
fake CID
fake document
fake permission
fake revocation
```

Classify each as:

```text
test fixture
documentation example
actual runtime value
```

Remove synthetic runtime application data.

---

# 34. SECRET AUDIT

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

- no secret in API responses
- no secret in browser bundle
- no secret in logs
- no secret in localStorage/sessionStorage
- no secret on-chain
- no secret in IPFS

Do not print secret values in the final report.

---

# 35. FINAL PHASE REPORT

Provide exactly:

## Phase 14 Status

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Verification Flow

Describe actual candidate-document verification.

## Verification States

List actual supported states and conditions.

## Hash Verification

Report candidate-hash computation and comparison with the registered on-chain hash.

## Authorization / Revocation

Explain actual owner/verifier authorization and revocation checks.

## IPFS / Decryption

Explain what is and is not decryptable based on legitimate key availability.

## Tamper Detection

Report real mismatch/tamper tests.

## Tests

List:

```text
unit tests
authorization tests
revocation tests
hash mismatch tests
IPFS/crypto tests
real blockchain tests
full regression
```

## Security Audit

Report actual findings.

## Synthetic Data Audit

State whether fake/mock/demo runtime data was introduced.

## Files Created/Modified

List important files.

## Known Limitations

Include actual limitations such as:

- key-distribution limitations
- large-file limitations
- local-network limitations
- no legal-authenticity claim
- no independent security audit unless actually performed

## Deferred Work

State what remains for:

- Phase 15 — final audit, full integration/regression, documentation, and hardening

---

# 36. STOP CONDITION

When Phase 14 is complete:

1. Run frontend tests.
2. Run backend tests.
3. Run blockchain tests.
4. Run real verification tests.
5. Run hash-mismatch/tamper tests.
6. Run revocation verification tests.
7. Run authorized/unauthorized wallet tests.
8. Run real IPFS/crypto verification where legitimate keys exist.
9. Audit synthetic runtime data.
10. Audit secrets.
11. Update documentation.
12. Update traceability.
13. Verify against `ai_rules.md`.
14. Verify against `MASTER_PLAN.md`.
15. Verify against Phase 1–13 artifacts.
16. Produce the final report.
17. STOP.

Do not automatically start Phase 15.

---

# CORE PRINCIPLE

> **Phase 14 must establish truthful document verification based on real bytes, real SHA-256 computation, real on-chain state, real authorization/revocation state, and real cryptographic results. A matching hash means the candidate bytes match the registered on-chain hash; a mismatch means they do not. The system must never fabricate verification, decryption, authenticity, or tamper conclusions.**
