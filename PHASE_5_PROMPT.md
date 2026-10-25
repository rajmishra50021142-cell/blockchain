# PHASE 5 — DOCUMENT REGISTRY SMART CONTRACT

## Purpose

Implement the first production-relevant blockchain business contract for the Blockchain-Based Digital Document Locker:

> **DocumentRegistry**

This contract is responsible for maintaining the authoritative on-chain record of a registered document.

Phase 5 must use the real local Hardhat blockchain environment established in Phase 3 and the real wallet/provider foundation established in Phase 4.

The project continues to follow the strict **real-runtime-data / no-synthetic-data** policy.

The external API credentials mentioned in the overall project plan are intentionally deferred.

> **No API key is required in Phase 5.**
>
> Use the local Hardhat blockchain and local development accounts/wallets.
>
> Real external RPC/IPFS credentials will be added only when the corresponding later phase actually requires them.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before making changes, read all of these completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `PHASE_3_PROMPT.md`
6. `PHASE_4_PROMPT.md`
7. `docs/requirements.md`
8. `docs/requirements-traceability.md`
9. `docs/architecture.md`
10. `docs/api.md`
11. `docs/security.md`
12. `docs/wallet-identity.md` if created in Phase 4
13. All existing Hardhat/network configuration and Phase 3 implementation
14. The supplied reference PPT and mandatory project-requirements image if available

Treat these as the project source of truth.

Do not silently redesign the architecture.

If there is a conflict between implementation and governing documentation, identify it and resolve it deliberately rather than inventing a new requirement.

---

# 2. PHASE BOUNDARY

This phase is:

> **DocumentRegistry Smart Contract**

This phase IS responsible for:

- Solidity contract design and implementation for document registration
- Document ownership on-chain
- Document metadata required by the frozen architecture
- Document registration
- Document lookup
- Owner-based authorization
- Document revocation state
- Relevant events
- Basic contract validation
- Unit tests
- Local Hardhat compilation
- Local deployment
- Real contract interaction against the local blockchain
- Deployment artifacts
- Contract ABI/address output required by later phases
- Documentation and traceability

This phase is NOT responsible for:

- AccessControl contract
- IdentityRegistry contract
- IPFS integration
- AES-256-GCM implementation
- Production document upload
- Frontend document registration UI
- Sharing implementation
- Delegated access permissions
- DID registry implementation
- Production backend authentication
- JWT implementation
- Public Ethereum testnet deployment
- Alchemy/Infura/QuickNode credentials
- IPFS API keys
- AI features
- Audit UI
- Full end-to-end document workflow

Do not pull these later-phase features into Phase 5.

---

# 3. NON-SYNTHETIC DATA POLICY

The smart contract must never be built around fake runtime application records.

Do NOT seed the application with fake documents such as:

```text
Student Certificate
Passport
Marksheet
Demo Document
Sample PDF
Example User
Demo CID
Demo Hash
Fake Owner
Fake Transaction
```

Do not create a fake document registry in JavaScript.

Do not make the frontend display fabricated contract records.

The contract may use deterministic test fixtures **inside unit tests** to test contract logic, but those test values must remain test fixtures and must never be presented as real application data.

Actual production/runtime document data must later originate from:

```text
real user file
    ↓
real SHA-256 hash
    ↓
real encrypted payload
    ↓
real IPFS CID
    ↓
real document registration transaction
    ↓
real blockchain state
```

Phase 5 only implements the blockchain part of that pipeline.

---

# 4. LOCAL BLOCKCHAIN ONLY

Use the real local Hardhat environment established in Phase 3.

Development architecture:

```text
Hardhat local blockchain
        ↓
DocumentRegistry Solidity contract
        ↓
ethers.js / Hardhat tooling
        ↓
real local wallet/account
```

Do NOT introduce:

- Alchemy
- Infura
- QuickNode
- public RPC credentials
- Sepolia credentials
- IPFS API credentials
- production private keys

No API key is necessary for this phase.

The contract must compile, deploy, and execute against the local Hardhat network.

---

# 5. CONTRACT RESPONSIBILITY

Implement:

```text
DocumentRegistry
```

Its job is to provide the authoritative blockchain record for a registered document.

The contract should support the architecture defined in `docs/architecture.md`.

The architecture requires the blockchain to be authoritative for core document registration state.

At minimum, the contract needs to preserve the following concepts:

```text
document ID
owner
document hash
IPFS CID
registration timestamp
revocation state
```

Use appropriate Solidity types.

Do not store the plaintext document on-chain.

Do not store encryption keys on-chain.

Do not store private information unnecessarily.

---

# 6. DOCUMENT ID

The architecture uses a `bytes32` document ID.

Define one deterministic and documented strategy for creating it.

The strategy must NOT depend on fabricated application data.

A suitable approach may be:

```text
cryptographically secure random 32-byte identifier
```

generated by the authorized application before registration.

The contract must treat the ID as an opaque identifier.

Do NOT silently derive the document ID from the filename.

Do NOT use:

```text
document1
document2
test123
user1-document1
```

Do not create predictable identifiers for runtime application use.

Document the selected strategy and keep it consistent across later phases.

---

# 7. DOCUMENT RECORD

Define a document record structure consistent with the frozen architecture.

At minimum, the record needs fields equivalent to:

```text
documentId
owner
documentHash
ipfsCid
registeredAt
revoked
```

Use Solidity types that are appropriate for Ethereum.

Examples of conceptual mappings:

```text
bytes32  → document ID
address  → owner
bytes32  → SHA-256 document hash
string   → IPFS CID
uint256  → timestamp
bool     → revoked
```

Do not add fields merely because they seem useful.

Every stored field must have a clear purpose.

Do not store:

- plaintext document content
- AES keys
- private keys
- passwords
- MetaMask secrets
- unnecessary PII

---

# 8. HASH REPRESENTATION

The document hash represents the SHA-256 digest of the actual document bytes.

Phase 5 does NOT calculate the document hash itself.

That responsibility belongs to the later cryptography/document workflow.

The contract should store the hash supplied by the caller.

It must NOT:

- accept a human-readable fake hash
- hard-code one hash
- generate synthetic hash values
- claim to have hashed a document internally unless an actual hash is provided

Document this boundary clearly:

```text
Actual file bytes
    ↓
SHA-256 in later application layer
    ↓
32-byte digest
    ↓
DocumentRegistry
```

---

# 9. IPFS CID REPRESENTATION

The contract stores the IPFS content identifier associated with the encrypted document.

Actual IPFS integration belongs to Phase 9.

Therefore:

- the contract may accept a CID string
- the contract must NOT upload anything to IPFS
- the contract must NOT fabricate a CID in application runtime
- the contract must NOT create a fake IPFS service
- Phase 5 must not claim that IPFS integration exists

For unit tests, deterministic test fixtures may be used strictly as test inputs.

---

# 10. OWNER MODEL

The transaction sender must become the document owner during registration.

The contract must NOT accept an arbitrary owner supplied by the caller and blindly trust it.

Prefer:

```solidity
owner = msg.sender;
```

for document registration.

This gives the blockchain an actual wallet-controlled ownership record.

The owner should be the address represented by the real transaction signer.

Do not implement a mechanism that lets a caller register a document as another address.

---

# 11. REGISTRATION FUNCTION

Implement a registration function with a clear interface.

Conceptually:

```text
registerDocument(
    documentId,
    documentHash,
    ipfsCid
)
```

The exact Solidity signature should be chosen based on the project implementation and ABI needs.

Expected behavior:

1. Validate the document ID.
2. Validate the document hash.
3. Validate required metadata.
4. Ensure the document ID is not already registered.
5. Set the owner to `msg.sender`.
6. Record the supplied hash.
7. Record the supplied CID.
8. Record the actual blockchain timestamp.
9. Set revocation state to `false`.
10. Emit the appropriate event.

The registration must succeed only through an actual blockchain transaction.

No fake registration result.

---

# 12. INPUT VALIDATION

Implement appropriate contract-level validation.

At minimum consider:

### Document ID

Reject:

```text
zero bytes32 ID
duplicate ID
```

### Document hash

Reject:

```text
zero bytes32 hash
```

### IPFS CID

Reject:

```text
empty CID
```

Do not impose arbitrary restrictions on valid CIDs unless required by the architecture.

Document validation decisions.

---

# 13. DUPLICATE DOCUMENTS

The contract must prevent accidental duplicate registration using the same document ID.

A second registration with an already-registered ID must revert.

Do not silently overwrite the previous document.

Do not create a second hidden record for the same ID.

Tests must confirm duplicate registration fails.

---

# 14. DOCUMENT LOOKUP

Implement a reliable way to retrieve a registered document.

The read operation must expose the actual stored blockchain state.

Possible interface:

```text
getDocument(documentId)
```

The exact interface may follow the project's Solidity style.

The read must return the stored:

```text
owner
hash
CID
timestamp
revocation state
```

Do not manufacture a "not found" record.

If a document does not exist, use an honest error/revert or clearly defined empty result.

Document the selected behavior.

---

# 15. OWNERSHIP CHECK

Implement a clear ownership check for owner-only actions.

At minimum:

```text
onlyOwner(documentId)
```

or an equivalent modifier/helper.

The caller must be the actual owner stored on-chain.

Do not trust:

```text
frontend user state
localStorage
URL user ID
user-entered address
```

The blockchain contract must enforce ownership.

---

# 16. REVOCATION

Phase 5 includes the **core document revocation state** required by the DocumentRegistry architecture.

Implement an owner-authorized function such as:

```text
revokeDocument(documentId)
```

Expected behavior:

1. Confirm the document exists.
2. Confirm the caller is the stored owner.
3. Confirm it is not already revoked if this is part of the chosen invariant.
4. Set `revoked = true`.
5. Emit a revocation event.

Do not silently change a document's revocation state from the frontend.

The state change must occur through a real blockchain transaction.

Do not implement access-sharing or verifier permissions here.

Those belong to AccessControl in Phase 6.

---

# 17. REVOCATION SEMANTICS

Once a document is revoked:

```text
revoked = true
```

The contract must expose this state reliably.

Do not delete the historical document record merely to hide it.

Revocation is a state change, not removal of the audit-relevant registration.

Later verification logic will use this state to determine whether a document is revoked.

Do not implement the complete verification workflow in Phase 5.

---

# 18. EVENTS

Emit blockchain events for important state changes.

At minimum, define events for:

```text
document registered
document revoked
```

Events must contain enough information for later audit/verification layers to discover the real blockchain actions.

Potential information includes:

```text
document ID
owner
hash
CID
timestamp/blockchain-derived context
```

Do not put secrets into events.

Do not emit fake events from JavaScript.

Events must be emitted by the actual contract transaction.

Later audit functionality will read actual event logs.

---

# 19. TIMESTAMPS

Use the blockchain transaction execution context for the registration timestamp.

Do not accept a user-supplied timestamp as authoritative.

Do not use:

```text
Date.now()
```

from the browser as the on-chain registration timestamp.

The contract must use actual blockchain execution context such as:

```solidity
block.timestamp
```

The final transaction receipt/block information will come from the blockchain provider.

---

# 20. IMMUTABILITY PRINCIPLE

After registration, the contract should not provide arbitrary mutation of core historical fields.

Do NOT implement a general:

```text
updateDocument()
```

that allows changing:

```text
owner
document hash
CID
registration time
```

unless the frozen requirements explicitly require it.

The registered record represents an immutable historical registration.

Revocation is an explicit state transition.

---

# 21. SECURITY DESIGN

Follow the project's security principles.

The contract must:

- use Solidity 0.8+ arithmetic safety
- validate inputs
- enforce owner authorization
- prevent duplicate registration
- avoid unnecessary external calls
- minimize stored data
- emit relevant events
- avoid storing secrets
- avoid unnecessary complexity

Do not introduce upgradeability unless explicitly required by the project.

Do not add an upgrade proxy "just in case."

Do not add OpenZeppelin modules unnecessarily if a simple secure implementation is sufficient.

If a library is used, document why.

---

# 22. REENTRANCY

The DocumentRegistry should not normally perform external calls.

Confirm that the implementation does not introduce an unnecessary reentrancy surface.

Do not add a reentrancy guard solely for appearance.

If no external call exists, document that reentrancy is not materially applicable to the contract's current execution path.

---

# 23. GAS / STORAGE CONSIDERATIONS

Keep the contract reasonably efficient without sacrificing clarity.

Consider:

- appropriate storage types
- mappings by `bytes32 documentId`
- avoiding redundant storage
- events for historical information rather than unnecessary duplicate state

Do not prematurely optimize into unreadable Solidity.

Document meaningful gas/storage choices.

---

# 24. CONTRACT TESTS

Write comprehensive Hardhat/Foundry tests using the project's existing framework.

At minimum test:

### Deployment

- contract deploys successfully
- expected initial state is empty

### Registration

- valid registration succeeds
- actual sender becomes owner
- hash is stored
- CID is stored
- timestamp is set
- revoked starts as false
- registration event is emitted

### Invalid registration

- zero document ID fails
- zero document hash fails
- empty CID fails
- duplicate document ID fails

### Ownership

- owner can perform owner-authorized actions
- non-owner cannot perform owner-authorized actions

### Revocation

- owner can revoke
- revoked becomes true
- revocation event is emitted
- unauthorized revocation fails
- repeated revocation follows the documented invariant

### Lookup

- registered document is retrievable
- unknown document behavior matches the documented design

Do not stop at compilation.

---

# 25. REAL LOCAL BLOCKCHAIN TESTING

After unit tests, perform at least one real local deployment against the Phase 3 Hardhat network.

Use:

```text
actual local blockchain
actual deployed contract
actual signer
actual transaction
actual receipt
actual contract address
actual block number
actual event log
actual state read
```

Verify the full chain:

```text
Signer
   ↓
registerDocument(...)
   ↓
transaction submitted
   ↓
transaction mined
   ↓
receipt returned
   ↓
DocumentRegistered event
   ↓
getDocument(...)
   ↓
actual stored state
```

Do not manually type the resulting contract address or transaction hash into the code.

Capture them from deployment/runtime output.

---

# 26. CONTRACT ADDRESS RULE

The deployed contract address must come from the actual deployment.

Do NOT hard-code a guessed address such as:

```text
0x123...
0xABC...
```

Do not make the frontend/backend assume an address that has not been deployed.

Use deployment artifacts/configuration generated by the actual deployment process.

If an environment variable is used, populate it from real deployment output during the development workflow.

The architecture currently has a generic `CONTRACT_ADDRESS` reference in places.

Because the project will eventually contain multiple contracts, document this Phase 5 address specifically as the:

```text
DocumentRegistry deployment address
```

and prepare the configuration strategy for the later separate contract addresses.

Do not create fake addresses for the contracts that do not yet exist.

---

# 27. ABI / ARTIFACT OUTPUT

Generate and preserve the real deployment artifacts required by later phases.

At minimum, later frontend/backend phases will need:

```text
DocumentRegistry ABI
DocumentRegistry deployed address
network/chain information
deployment metadata
```

Do not manually rewrite ABI JSON.

Do not simplify or fabricate the ABI.

Prefer generated artifacts from the actual Solidity compilation/deployment pipeline.

---

# 28. FRONTEND BOUNDARY

Do NOT build the full document dashboard or registration UI in this phase.

However, make sure the contract interface and deployment artifacts are usable by the future frontend.

Do not create a fake "document registered" screen.

Do not create seeded documents in the UI.

Do not add document cards containing invented blockchain records.

Phase 4 wallet functionality must continue to work.

---

# 29. BACKEND BOUNDARY

Do not implement the production Document API in this phase.

Do not create:

```text
POST /api/documents
GET /api/documents
GET /api/documents/:id
```

unless they already existed legitimately from an earlier phase and are merely being adapted to the real contract artifact.

The application API implementation belongs to Phase 10.

---

# 30. IPFS BOUNDARY

Do not connect to IPFS in Phase 5.

The contract only stores the CID value that a future caller will supply.

Do not:

- upload files
- download files
- pin files
- create fake CIDs
- use an IPFS API key
- create an IPFS fallback

IPFS integration belongs to Phase 9.

---

# 31. CRYPTOGRAPHY BOUNDARY

Do not implement document encryption in Phase 5.

Do not calculate SHA-256 in the contract.

Do not store AES keys on-chain.

The contract simply stores the digest supplied by the caller.

The actual cryptographic pipeline will be implemented in Phase 8.

---

# 32. IDENTITY BOUNDARY

Do not implement IdentityRegistry in this phase.

Wallet address ownership comes from the transaction signer:

```text
msg.sender
```

The later IdentityRegistry will establish additional identity associations.

Do not fabricate DIDs or identity records.

---

# 33. ACCESS CONTROL BOUNDARY

Do not implement the separate AccessControl contract here.

The only authorization required in Phase 5 is:

```text
document owner
```

for DocumentRegistry owner-authorized operations.

Sharing/verifier permissions belong to Phase 6.

---

# 34. API KEY / CREDENTIAL POLICY

The user intends to provide real API credentials only when they are actually required.

Respect that.

For Phase 5:

### Required credentials

```text
None
```

### Do NOT request

```text
Alchemy API key
Infura API key
QuickNode API key
IPFS API key
IPFS API secret
Private key
Seed phrase
JWT secret
Encryption key
```

Local Hardhat development is sufficient.

The only real signing identities required are the local development accounts/wallets already established by Phase 3/4.

Do not commit secrets.

Do not invent credentials.

---

# 35. ENVIRONMENT CONFIGURATION

Keep the existing `.env.example` clean.

Do not populate it with fake values.

Do not add a fake contract address.

After a real local deployment, use the project's established configuration approach to expose the real DocumentRegistry address to later phases.

Because the complete project will have multiple contracts, do not design the final configuration around a single ambiguous `CONTRACT_ADDRESS`.

Use a clear naming strategy for the DocumentRegistry deployment, consistent with the eventual architecture.

For example:

```env
CONTRACT_DOCUMENT_REGISTRY=
```

Only populate the real value after actual deployment.

Do not add:

```env
CONTRACT_ACCESS_CONTROL=0xFAKE...
CONTRACT_IDENTITY_REGISTRY=0xFAKE...
```

Those contracts do not exist yet.

---

# 36. CODE QUALITY

Follow good Solidity conventions:

- SPDX license identifier
- explicit compiler version range
- clear contract naming
- clear event naming
- NatSpec/comments for important public functions
- custom errors or clear revert messages
- small focused functions
- no dead code
- no unused imports
- no fabricated constants
- no unnecessary abstraction

Run formatting/linting if already configured by the repository.

Do not introduce a new toolchain unless necessary.

---

# 37. DOCUMENTATION

Create/update:

```text
docs/document-registry.md
docs/security.md
docs/requirements-traceability.md
```

`docs/document-registry.md` must cover:

1. Contract purpose
2. Storage model
3. Document ID strategy
4. Hash representation
5. CID representation
6. Ownership model
7. Registration flow
8. Lookup flow
9. Revocation flow
10. Events
11. Validation
12. Error/revert behavior
13. Deployment process
14. Local Hardhat network
15. ABI/artifact output
16. Security decisions
17. What is deferred to later phases

Only document functionality that actually exists.

---

# 38. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark only the requirements genuinely implemented in Phase 5.

Use statuses such as:

```text
Implemented
Partially Implemented
Deferred
Not Applicable
```

Do NOT mark:

- AccessControl
- IdentityRegistry
- IPFS
- encryption
- sharing
- frontend integration
- full verification
- audit system

as implemented merely because DocumentRegistry exists.

---

# 39. ACCEPTANCE CRITERIA

Phase 5 is complete only when all applicable criteria below are satisfied:

- [ ] DocumentRegistry Solidity contract exists.
- [ ] Contract compiles successfully.
- [ ] Contract follows the frozen architecture.
- [ ] Document ID strategy is explicitly defined.
- [ ] Document records contain the required on-chain fields.
- [ ] `msg.sender` becomes the document owner.
- [ ] Duplicate document IDs are rejected.
- [ ] Zero/invalid required inputs are rejected.
- [ ] Document lookup returns actual blockchain state.
- [ ] Owner authorization is enforced on owner-only functions.
- [ ] Revocation state is implemented.
- [ ] Registration event exists.
- [ ] Revocation event exists.
- [ ] Registration timestamp uses blockchain execution context.
- [ ] Core registration fields cannot be arbitrarily overwritten.
- [ ] Unit tests cover success and failure cases.
- [ ] Contract is deployed to the local Hardhat network.
- [ ] Real local transaction succeeds.
- [ ] Real transaction receipt is obtained.
- [ ] Real event log is observable.
- [ ] Real contract state can be read back.
- [ ] Deployment address comes from actual deployment.
- [ ] ABI/artifacts are generated from the actual contract build.
- [ ] No fake runtime documents were introduced.
- [ ] No fake addresses/transaction hashes/blocks/CIDs were introduced.
- [ ] No external API credentials were introduced.
- [ ] No IPFS integration was introduced.
- [ ] No AccessControl/IdentityRegistry implementation was introduced.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] The Phase 4 wallet foundation is not broken.

---

# 40. REAL-DATA AUDIT

Before declaring completion, inspect the repository for potential fabricated blockchain/application data.

Search for patterns resembling:

```text
0x123
0xABC
fake
mock
demo
sample
seed
fixture
QmExample
QmFake
txHash = "..."
blockNumber = ...
walletAddress = "..."
```

Important:

Test fixtures are acceptable inside tests when they are clearly test-only.

They are NOT acceptable as application runtime data.

The final audit must distinguish:

```text
test fixture
```

from:

```text
production/runtime source
```

and report the distinction.

---

# 41. CREDENTIAL AUDIT

Before declaring completion, verify:

- no private keys in source
- no seed phrases in source
- no API keys in source
- no RPC secrets in source
- no IPFS secrets in source
- no JWT secrets in source
- no encryption keys in source
- `.env` remains ignored
- `.env.example` contains variable names only where appropriate

State the result in the final report.

---

# 42. FINAL PHASE REPORT

At the end, produce exactly these sections:

## Phase 5 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Contract Implemented

State what DocumentRegistry actually implements.

## Contract Interface

List the real implemented public/external functions.

## Events

List the actual events.

## Storage

List the actual stored fields.

## Tests

List tests executed and results.

## Local Deployment

Report actual:

```text
network
chain ID
contract address
deployment transaction hash
deployment block
```

Only report values actually obtained from the local blockchain.

Do NOT manually invent or copy example values.

## Real Runtime Sources

Explain where each important value comes from.

Example:

```text
Document owner → msg.sender / actual signer
Document hash → actual caller-provided SHA-256 digest
IPFS CID → actual caller-provided CID (IPFS integration deferred)
Registration timestamp → block.timestamp
Contract address → actual deployment result
Transaction hash → actual blockchain transaction
Event logs → actual blockchain receipt/logs
```

## Synthetic Data Audit

State whether fake/demo/mock/seeded runtime application data was introduced.

## Credential Audit

State whether any secrets/API credentials were inserted.

## Files Created/Modified

List all important files.

## Deferred Work

Explicitly state what remains for:

- Phase 6
- Phase 7
- Phase 8
- Phase 9
- Phase 10+

Do not claim deferred functionality is already implemented.

---

# 43. STOP CONDITION

After completing the phase:

1. Run the tests.
2. Compile the contract.
3. Deploy locally.
4. Perform a real local registration transaction.
5. Read the resulting state back from the real contract.
6. Inspect emitted events.
7. Audit runtime data for synthetic values.
8. Audit credentials/secrets.
9. Update documentation.
10. Update traceability.
11. Verify consistency with `ai_rules.md`.
12. Verify consistency with `MASTER_PLAN.md`.
13. Verify consistency with Phase 1–4 artifacts.
14. Produce the final report.
15. STOP.

Do not start Phase 6 automatically.

Do not implement AccessControl.

Do not integrate IPFS.

Do not add external API credentials.

Do not deploy to a public testnet.

---

# CORE PRINCIPLE

> **The DocumentRegistry must contain only real blockchain state produced by actual contract execution. No fake documents, no fake owners, no fake CIDs, no fake hashes, no fake transaction results, no fabricated contract address, and no external API credentials are required for Phase 5.**
