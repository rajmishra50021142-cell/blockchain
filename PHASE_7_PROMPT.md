# PHASE 7 — SMART CONTRACT SECURITY, HARDENING & COMPREHENSIVE TESTING

## Purpose

Harden and comprehensively validate the smart-contract layer implemented in:

- Phase 5 — `DocumentRegistry`
- Phase 6 — `AccessControl`

This phase is about **security review, correctness, invariants, adversarial testing, regression testing, and deployment-readiness of the existing contracts**.

Do not expand the product scope.

The project continues to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No external API credentials are required for Phase 7.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before making any change, read completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `PHASE_3_PROMPT.md`
6. `PHASE_4_PROMPT.md`
7. `PHASE_5_PROMPT.md`
8. `PHASE_6_PROMPT.md`
9. `docs/requirements.md`
10. `docs/requirements-traceability.md`
11. `docs/architecture.md`
12. `docs/security.md`
13. `docs/document-registry.md`
14. `docs/access-control.md`
15. `docs/wallet-identity.md` if present
16. All Solidity contracts, tests, deployment scripts, ABIs, and configuration created so far
17. The supplied reference PPT and mandatory requirements image if available

Treat these as the source of truth.

Do not silently introduce a new architecture.

If the implementation conflicts with the documented architecture, report and resolve the conflict explicitly.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- Security review of `DocumentRegistry`
- Security review of `AccessControl`
- Authorization review
- State-invariant validation
- Adversarial test coverage
- Regression tests
- Edge-case testing
- Integration testing between the two contracts
- Static analysis where tooling exists/is appropriate
- Compiler/security warnings
- Gas sanity checks
- Event correctness
- Failure/revert correctness
- Deployment configuration checks
- Contract dependency validation
- Documentation of security assumptions and limitations
- Requirements traceability

This phase is NOT responsible for:

- IdentityRegistry
- IPFS
- AES-256-GCM
- SHA-256 application implementation
- document upload
- production backend authentication
- JWT
- frontend sharing UI
- full document verification workflow
- public testnet deployment
- API credentials
- AI fraud detection
- ZK proofs
- cross-chain functionality
- mobile functionality

Do not implement any of those features here.

---

# 3. CORE OBJECTIVE

The goal is to establish that:

```text
DocumentRegistry
        +
AccessControl
        ↓
behave correctly under valid AND invalid inputs
        ↓
enforce ownership and permission invariants
        ↓
do not expose unintended state transitions
        ↓
remain compatible with the project's frozen architecture
```

This phase should make the existing contracts safer and more trustworthy.

Do not add unnecessary functionality merely to make the phase appear larger.

---

# 4. NO NEW PRODUCT FEATURES

Before changing a contract, ask:

> Is this change required to make the existing implementation safer, more correct, or more testable?

If not, do not add it.

Do NOT add:

- admin roles
- upgradeability
- pausing
- emergency superuser access
- global permissions
- public access
- identity registry
- proxy contracts
- cross-chain features
- unrelated libraries

unless the governing project requirements explicitly require them.

---

# 5. REAL DATA POLICY

This phase must not introduce fake application runtime data.

Never seed:

```text
fake users
fake wallets
fake documents
fake permissions
fake CIDs
fake hashes
fake transactions
fake deployment addresses
```

Test-only fixtures are allowed inside test code.

A test fixture must never become:

- production state
- frontend runtime fallback
- deployment seed
- example data shown as real application state

The final audit must explicitly distinguish test fixtures from runtime data.

---

# 6. CONTRACTS UNDER REVIEW

Review:

```text
DocumentRegistry
AccessControl
```

The relationship is:

```text
DocumentRegistry
    ↓
authoritative document ownership + document lifecycle
    ↓
AccessControl
    ↓
document-specific authorization
```

Do not reverse this dependency.

Do not allow AccessControl to become an independent source of document ownership.

---

# 7. DOCUMENTREGISTRY SECURITY REVIEW

Review the complete `DocumentRegistry` implementation.

Check at minimum:

### Registration

- zero document ID cannot be registered
- zero document hash cannot be registered
- empty CID cannot be registered
- duplicate document ID cannot be registered
- owner is always `msg.sender`
- registration timestamp comes from blockchain execution context
- registration event reflects actual stored state

### Lookup

- existing document is returned correctly
- unknown document behavior is deterministic
- returned values match stored state

### Ownership

- only the actual stored owner can perform owner-only actions
- arbitrary user-supplied owner addresses are not trusted
- frontend state is not used for authorization

### Revocation

- only owner can revoke
- unknown document cannot be revoked
- revoked state is correctly recorded
- repeated revocation follows the documented invariant
- registration fields are not accidentally mutable through revocation

---

# 8. ACCESSCONTROL SECURITY REVIEW

Review:

### Grant

- only actual DocumentRegistry owner can grant
- unknown documents cannot receive access
- zero address cannot be granted access
- revoked documents cannot receive active access
- permission is scoped to the specific document
- event matches the real state change

### Revoke Access

- only actual DocumentRegistry owner can revoke
- unknown documents cannot be modified
- target address is validated
- permission becomes false
- event matches the state change

### hasAccess

Confirm:

```text
document exists
AND
document not revoked
AND
permission is true
```

is handled exactly as documented.

Do not allow stale AccessControl state to override DocumentRegistry revocation.

---

# 9. SECURITY INVARIANTS

Write tests for the following invariants.

## Invariant 1 — Ownership

For every registered document:

```text
DocumentRegistry.owner(documentId)
```

must equal the address that successfully registered it.

## Invariant 2 — Only Owner Controls Access

For every document:

```text
non-owner cannot grant access
non-owner cannot revoke access
```

## Invariant 3 — Document Isolation

Permission for:

```text
Document A
```

must never modify permission for:

```text
Document B
```

## Invariant 4 — Revoked Documents

If:

```text
DocumentRegistry.revoked(documentId) == true
```

then:

```text
hasAccess(documentId, address)
```

must not report active access.

## Invariant 5 — No Unknown Document Permission

An unknown document must not acquire a valid permission record through public contract methods.

## Invariant 6 — Registration Immutability

After registration, core historical fields must not be arbitrarily replaceable.

## Invariant 7 — Events Match State

When an event claims:

```text
access granted
```

the corresponding on-chain permission must actually be true after the successful transaction.

Likewise for revocation.

---

# 10. ADVERSARIAL TESTING

Add tests specifically designed to attack the authorization model.

Test attempts such as:

```text
non-owner grants access
non-owner revokes access
attacker uses another owner's document ID
attacker supplies a claimed owner address
attacker uses zero address as verifier
attacker grants access to a revoked document
attacker manipulates frontend/localStorage state
attacker repeats a state-changing operation
```

The contract must reject unauthorized actions according to the documented behavior.

Do not simulate security by simply setting variables in JavaScript.

The tests must execute actual contract calls.

---

# 11. CROSS-CONTRACT ATTACK SCENARIOS

Test interactions between `DocumentRegistry` and `AccessControl`.

At minimum:

### Scenario A

```text
Register Document A
Grant Bob
Check Bob → true
```

### Scenario B

```text
Register Document A
Grant Bob
Revoke Bob
Check Bob → false
```

### Scenario C

```text
Register Document A
Grant Bob
Revoke Document A
Check Bob → false
```

### Scenario D

```text
Register Document A
Register Document B
Grant Bob on A
Check Bob on B → false
```

### Scenario E

```text
Register Document A
Attempt grant from non-owner
→ revert
```

### Scenario F

```text
Revoke Document A
Attempt grant Bob
→ reject according to contract invariant
```

Use actual local blockchain execution.

---

# 12. STATE-TRANSITION TESTING

Test important state transitions explicitly.

For `DocumentRegistry`:

```text
UNREGISTERED
    ↓ register
REGISTERED / ACTIVE
    ↓ revoke
REGISTERED / REVOKED
```

For `AccessControl`:

```text
NO ACCESS
    ↓ grant
ACCESS
    ↓ revoke access
NO ACCESS
```

And across both contracts:

```text
ACCESS
    ↓ document revoked
NO ACTIVE ACCESS
```

Do not allow impossible transitions.

Document any intentionally unsupported transition.

---

# 13. REVERT TESTING

For every important authorization or validation rule, test:

```text
valid transaction → succeeds
invalid transaction → reverts
```

Confirm the revert reason/custom error where applicable.

Do not catch and suppress contract errors merely to make tests pass.

The test should prove that the contract rejects the invalid action.

---

# 14. EVENT TESTING

For each state-changing operation, verify:

1. transaction succeeds
2. expected event is emitted
3. event arguments are correct
4. resulting state is correct

Do not test only the event.

An event alone is not proof that storage state is correct.

Likewise, do not test only storage when the event is part of the documented audit architecture.

---

# 15. AUTHORIZATION TESTING WITH MULTIPLE SIGNERS

Use multiple real local Hardhat test accounts/signers.

At minimum conceptually:

```text
Owner
Verifier
Attacker
```

The roles are test-only.

Verify:

```text
Owner
    → register document

Owner
    → grant Verifier

Verifier
    → can be recognized as authorized

Verifier
    → cannot grant/revoke for owner

Attacker
    → cannot modify owner's permissions
```

Do not seed these identities into application runtime state.

---

# 16. REENTRANCY REVIEW

Review all external calls in both contracts.

Determine whether any state-changing function:

- calls another contract
- sends ETH
- transfers tokens
- performs arbitrary external interaction

If the contracts contain no dangerous external state-changing calls, document that the current implementation has no material reentrancy surface from its present behavior.

Do not add `ReentrancyGuard` merely for appearance.

If a genuine reentrancy surface exists, fix it and add a regression test.

---

# 17. CHECKS-EFFECTS-INTERACTIONS

Where external calls exist, verify the ordering:

```text
checks
↓
state effects
↓
external interactions
```

If the current contracts have no relevant external interactions, document that this rule is not materially exercised.

Do not introduce new external calls just to demonstrate the pattern.

---

# 18. ACCESS CONTROL REVIEW

Confirm that authorization does not depend on:

```text
frontend flags
localStorage
cookies
query parameters
request body owner field
user-entered owner address
JavaScript-only checks
```

Blockchain authorization must be enforced by Solidity.

Frontend/backend checks may improve UX later, but they must never replace the on-chain check.

---

# 19. INPUT VALIDATION REVIEW

Review every external/public function.

For each parameter, determine:

```text
Can zero value be valid?
Can empty value be valid?
Can duplicate state be valid?
Can the value reference an unknown document?
Can the value bypass authorization?
```

Do not add arbitrary restrictions.

Every validation rule must have a documented reason.

---

# 20. STORAGE REVIEW

Review storage for:

- unnecessary duplicated state
- fields that can be removed
- incorrect types
- mutable historical fields
- authorization state stored in the wrong contract
- unnecessary PII
- secrets
- encryption keys

The blockchain must not contain:

```text
plaintext documents
AES keys
private keys
passwords
wallet secrets
unnecessary sensitive PII
```

---

# 21. DEPENDENCY CONFIGURATION REVIEW

Verify AccessControl points to the actual deployed DocumentRegistry.

Test:

```text
AccessControl.documentRegistry()
```

or the project's actual equivalent.

Verify it equals the real Phase 5 deployment address.

Reject deployments configured with:

```text
zero address
fabricated address
wrong network address
stale address
```

Do not silently substitute another contract.

---

# 22. DEPLOYMENT SCRIPT REVIEW

Review deployment scripts for:

- deterministic deployment ordering
- correct contract constructor arguments
- correct network assumptions
- generated artifacts
- generated addresses
- accidental hard-coded deployment addresses
- accidental secret exposure
- stale artifacts
- wrong contract references

The scripts must obtain addresses from actual deployment results.

Do not manually insert fake addresses.

---

# 23. ARTIFACT / ABI REVIEW

Confirm that the ABIs used by later phases are generated from the actual current Solidity build.

Check that:

```text
ABI
contract bytecode
deployment address
network
chain ID
```

remain consistent.

Do not manually modify generated ABI files to hide compile/deployment problems.

---

# 24. COMPILER AND LINT REVIEW

Run the project's configured Solidity compiler and lint/format tools.

Inspect warnings.

Do not blindly ignore warnings.

For each material warning:

1. understand it
2. fix it if applicable
3. document it if it is intentionally unavoidable

The final report must mention material unresolved warnings.

---

# 25. STATIC ANALYSIS

If suitable security-analysis tooling is already available or can be added without unnecessarily changing the project toolchain, run it.

Possible tools include the tooling already selected by the repository.

Do not introduce a heavyweight toolchain solely for appearance.

If using a static analyzer:

- record findings
- classify severity
- fix applicable issues
- re-run after fixes

Do not claim a formal security audit has been performed.

A local static analysis run is not equivalent to an independent professional audit.

---

# 26. GAS / COST SANITY

Review gas usage for major state-changing operations:

```text
registerDocument
revokeDocument
grantAccess
revokeAccess
```

Look for obvious waste such as:

- redundant storage writes
- unnecessary loops
- duplicate state
- oversized structures

Do not optimize at the expense of correctness/readability.

Record measurements if the repository has an established gas-reporting setup.

Do not invent gas numbers.

---

# 27. FUZZ / PROPERTY TESTING

If the current project/toolchain supports it without unnecessary restructuring, add property-based or fuzz testing for suitable contract invariants.

Useful properties include:

```text
non-owner cannot gain owner authorization
permission is isolated by documentId
revoked documents do not have active access
unknown documents cannot become registered through AccessControl
```

Use test-only generated inputs.

Do not use generated test values as application runtime data.

If fuzzing is not practical with the current toolchain, document that honestly rather than adding an unrelated framework solely for compliance.

---

# 28. REGRESSION TESTING

After all security changes, run the entire existing test suite.

Confirm that Phase 5 behavior still works:

- DocumentRegistry compilation
- registration
- lookup
- ownership
- revocation
- events

Confirm that Phase 6 behavior still works:

- grant
- revoke access
- hasAccess
- revoked-document interaction
- events

Do not fix a security issue by silently breaking an earlier phase.

---

# 29. REAL LOCAL BLOCKCHAIN REGRESSION

After tests, perform a real local Hardhat deployment/integration run.

Use actual:

```text
local chain
deployment
contract addresses
transactions
receipts
blocks
events
state reads
```

At minimum execute:

```text
deploy DocumentRegistry
↓
register real local test transaction
↓
deploy/configure AccessControl
↓
grant access
↓
read access
↓
revoke access
↓
read access
↓
revoke document
↓
read access
```

Use real local transaction execution.

Do not manually manufacture output.

---

# 30. NO PUBLIC TESTNET YET

Do not move to:

```text
Sepolia
Mainnet
Polygon
Arbitrum
```

during Phase 7.

Public network deployment belongs later.

No external RPC API key is required.

The user will supply real external credentials only when the corresponding later phase needs them.

---

# 31. NO IPFS YET

Do not integrate IPFS.

Do not create:

```text
CIDs
uploads
pinning
download
IPFS API credentials
```

Only test contract fields that represent a future CID using test fixtures inside tests.

---

# 32. NO CRYPTOGRAPHY YET

Do not implement:

```text
AES-256-GCM
document key management
SHA-256 file hashing pipeline
key exchange
```

Contract testing may use a deterministic bytes32 test value representing a future hash.

That does not mean document cryptography is implemented.

---

# 33. NO IDENTITYREGISTRY YET

Do not implement IdentityRegistry.

Do not create DIDs.

Do not create fake identity records.

Wallet addresses in contract tests are simply Ethereum addresses/signers.

---

# 34. SECURITY DOCUMENTATION

Create/update:

```text
docs/security.md
docs/smart-contract-security.md
docs/requirements-traceability.md
```

`docs/smart-contract-security.md` must contain:

1. Contracts reviewed
2. Authorization model
3. Trust boundaries
4. Security invariants
5. Validation rules
6. Document lifecycle
7. Access lifecycle
8. Cross-contract dependency
9. Reentrancy assessment
10. Event integrity
11. Storage review
12. Deployment review
13. Static-analysis results if run
14. Test coverage/results
15. Known limitations
16. What is explicitly not covered by this phase
17. Statement that this is not an independent professional security audit

Do not claim "fully secure."

Use evidence-based language such as:

```text
tested
verified under listed cases
no issues observed in the performed checks
known limitation
not externally audited
```

---

# 35. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Only mark security/testing requirements according to actual implementation.

Do not claim:

```text
professional audit complete
formal verification complete
production security certification
```

unless such work was genuinely performed by an appropriate independent process.

---

# 36. ACCEPTANCE CRITERIA

Phase 7 is complete only when:

- [ ] DocumentRegistry has been security-reviewed.
- [ ] AccessControl has been security-reviewed.
- [ ] Owner authorization is tested adversarially.
- [ ] Non-owner attacks are rejected.
- [ ] Zero-address cases are tested.
- [ ] Unknown-document cases are tested.
- [ ] Duplicate operations are tested.
- [ ] Revoked-document behavior is tested.
- [ ] Cross-document isolation is tested.
- [ ] State-transition invariants are tested.
- [ ] Event/state consistency is tested.
- [ ] Cross-contract integration is tested.
- [ ] Deployment dependency is validated.
- [ ] Compiler warnings are reviewed.
- [ ] Static analysis is run if appropriate/available.
- [ ] Material findings are fixed or documented.
- [ ] Gas/storage sanity has been reviewed.
- [ ] Full regression suite passes.
- [ ] Real local Hardhat integration tests pass.
- [ ] No external API credentials were introduced.
- [ ] No fake runtime application data was introduced.
- [ ] No IPFS functionality was introduced.
- [ ] No IdentityRegistry functionality was introduced.
- [ ] No document-encryption functionality was introduced.
- [ ] Security documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phase 5 and Phase 6 functionality remains intact.

---

# 37. SYNTHETIC DATA AUDIT

Before finalizing, inspect the repository.

Search for suspicious runtime patterns:

```text
fake
mock
demo
dummy
sample
seed
hardcoded wallet
hardcoded transaction
hardcoded contract address
fake CID
fake hash
fake permission
```

For every match, classify it as:

```text
test fixture
documentation example
actual runtime data
```

Any synthetic runtime application data must be removed.

Do not remove legitimate test fixtures merely because they contain deterministic test addresses or hashes.

The important rule is:

> test-only values must never become application runtime truth.

---

# 38. SECRET / CREDENTIAL AUDIT

Confirm:

- no private keys committed
- no seed phrases committed
- no API keys committed
- no RPC secrets committed
- no IPFS secrets committed
- no JWT secrets committed
- no encryption keys committed
- `.env` remains ignored
- `.env.example` contains no real credentials

Report the result honestly.

---

# 39. FINAL PHASE REPORT

At the end, provide exactly these sections:

## Phase 7 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Security Review Summary

Summarize what was reviewed.

## Findings

List:

```text
Finding
Severity
Evidence
Resolution
```

If no material findings were observed, state that based on the performed checks.

Do not claim zero vulnerabilities universally.

## Invariants Tested

List actual invariants and results.

## Adversarial Tests

List actual unauthorized/invalid scenarios tested.

## Regression Tests

List existing Phase 5/6 tests and results.

## Static Analysis

State:

```text
Tool
Version if available
Command/check performed
Findings
Resolution
```

or state that it was not used and why.

## Local Blockchain Validation

Report actual observed:

```text
network
chain ID
contract addresses
transaction hashes
block numbers
events
```

Only report values from actual execution.

## Gas / Storage Review

Report measured values if actually measured.

Do not invent numbers.

## Synthetic Data Audit

State whether synthetic runtime data was introduced.

## Credential Audit

State whether credentials/secrets were introduced.

## Documentation

List updated security/traceability files.

## Known Limitations

Include limitations such as:

- local development network only
- no public testnet validation yet
- no independent professional audit
- no formal mathematical verification unless actually performed
- later cryptography/IPFS/backend/frontend layers not reviewed

## Deferred Work

State what remains for later phases.

---

# 40. STOP CONDITION

When Phase 7 is complete:

1. Run compilation.
2. Run all unit tests.
3. Run adversarial security tests.
4. Run cross-contract integration tests.
5. Run static analysis if appropriate.
6. Review warnings.
7. Run real local Hardhat deployment/integration.
8. Inspect real receipts/events/state.
9. Audit synthetic data.
10. Audit credentials/secrets.
11. Update documentation.
12. Update traceability.
13. Verify against `ai_rules.md`.
14. Verify against `MASTER_PLAN.md`.
15. Verify against Phase 1–6 artifacts.
16. Produce the final report.
17. STOP.

Do not automatically start Phase 8.

Do not add IPFS.

Do not add encryption.

Do not add IdentityRegistry.

Do not request an API key.

Do not deploy to a public testnet.

---

# CORE PRINCIPLE

> **Phase 7 proves the security and correctness of the existing smart-contract layer through real execution, adversarial testing, and explicit invariants. It must improve trust in DocumentRegistry and AccessControl without expanding scope, inventing runtime data, or requiring external API credentials.**
