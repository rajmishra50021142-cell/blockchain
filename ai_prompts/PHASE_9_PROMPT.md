# PHASE 9 — REAL IPFS INTEGRATION & ENCRYPTED DOCUMENT STORAGE

## Purpose

Implement the project's **real decentralized storage layer** using IPFS.

Phase 9 connects the cryptographic output from Phase 8 to a real IPFS service/node.

The core pipeline becomes:

```text
REAL USER DOCUMENT
        ↓
SHA-256
        ↓
AES-256-GCM
        ↓
REAL ENCRYPTED PAYLOAD
        ↓
REAL IPFS UPLOAD
        ↓
REAL CID
```

The project must continue to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

This phase is the first phase where a real external storage credential may be required.

The user may provide the real IPFS credentials when needed.

**Never invent, guess, fabricate, or hard-code IPFS credentials.**

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
8. `PHASE_6_PROMPT.md`
9. `PHASE_7_PROMPT.md`
10. `PHASE_8_PROMPT.md`
11. `docs/requirements.md`
12. `docs/requirements-traceability.md`
13. `docs/architecture.md`
14. `docs/api.md`
15. `docs/security.md`
16. `docs/cryptography.md`
17. `docs/document-registry.md`
18. `docs/access-control.md`
19. `docs/wallet-identity.md` if present
20. All current cryptography, frontend, backend, blockchain, and deployment files
21. The supplied reference PPT and mandatory requirements image if available

Treat these materials as the project's current source of truth.

Do not silently replace the existing architecture.

If implementation and documentation conflict, identify and resolve the conflict explicitly.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- real IPFS client/service integration
- real authenticated IPFS connection
- encrypted-payload upload
- real CID retrieval
- real content retrieval by CID
- CID validation
- encrypted payload validation after retrieval
- IPFS error handling
- upload/download integrity checks
- pinning strategy where supported by the selected IPFS provider
- IPFS credential configuration through environment variables
- secure credential handling
- IPFS service abstraction for later phases
- documentation
- requirements traceability
- real IPFS tests

This phase is NOT responsible for:

- production document API routes
- JWT authentication
- production user sessions
- frontend document-upload page
- complete document registration workflow
- writing the CID to DocumentRegistry
- sharing permissions
- key distribution
- full document verification UI
- IdentityRegistry
- public blockchain deployment
- AI features
- ZK proofs
- cross-chain support
- mobile support

The actual application API integration belongs to Phase 10.

The complete blockchain document-registration workflow belongs to later phases.

---

# 3. CORE STORAGE ARCHITECTURE

The required storage boundary is:

```text
USER FILE
   │
   ├── SHA-256 ─────────────→ document hash
   │
   └── AES-256-GCM ─────────→ encrypted payload
                                  │
                                  ↓
                             IPFS service
                                  │
                                  ↓
                              REAL CID
```

IPFS must store:

```text
ENCRYPTED DATA ONLY
```

IPFS must NOT receive:

```text
plaintext document
raw AES key
private key
wallet secret
password
authentication secret
unnecessary plaintext PII
```

---

# 4. REAL IPFS ONLY

Use an actual IPFS-compatible service or node.

Acceptable implementations include:

- a real local IPFS node/daemon
- a real authenticated IPFS pinning/storage provider
- a real IPFS-compatible API already selected by the project

Do not create a fake IPFS implementation.

Do not create:

```text
fake CID
mock upload
mock download
local JSON "CID"
hard-coded CID
base64-as-CID
fake gateway response
```

If IPFS is unavailable:

> show/return a real error.

Do not fabricate a successful upload.

---

# 5. CREDENTIAL POLICY

This is the first phase where real external storage credentials may be needed.

The user may provide the real IPFS credentials required by the selected provider.

Potential environment variables include:

```env
IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=
```

Use the exact environment-variable strategy already established by the repository.

## Critical rules

Never:

- put the API key in source code
- put the API secret in source code
- put credentials in frontend JavaScript
- put credentials in a client bundle
- put credentials in URLs where avoidable
- print credentials to logs
- commit `.env`
- fabricate values in `.env`

Use:

```text
.env
```

for real local credentials.

Keep:

```text
.env.example
```

free of real credentials.

If the provider only requires one credential, leave unused variables empty rather than inventing values.

---

# 6. DO NOT ASK FOR UNNECESSARY CREDENTIALS

Only request credentials that the selected real IPFS implementation actually needs.

For example:

```text
API URL
API key
API secret
```

Do not request:

```text
private key
seed phrase
MetaMask password
encryption key
JWT secret
```

Those are unrelated to IPFS authentication.

Do not give the AI the user's private wallet credentials.

---

# 7. PROVIDER ABSTRACTION

Implement a small IPFS service abstraction so the rest of the application does not depend directly on one provider-specific SDK.

Conceptually:

```text
Application
    ↓
IPFS service interface
    ↓
selected real IPFS implementation
    ↓
IPFS network/provider
```

Possible operations:

```text
uploadEncryptedPayload()
getByCid()
verifyCidRetrieval()
```

Use the project's existing architecture conventions.

Do not create a huge abstraction layer unnecessarily.

---

# 8. ENCRYPTED PAYLOAD HANDOFF

The output from Phase 8 must be the input to IPFS.

The handoff must be:

```text
Phase 8
EncryptedDocument
      ↓
canonical serialization
      ↓
byte payload
      ↓
Phase 9 IPFS upload
```

Do not re-encrypt the document in Phase 9.

Do not generate a second key.

Do not alter the ciphertext before upload unless the serialization format explicitly requires it.

The exact bytes uploaded to IPFS should be documented.

---

# 9. WHAT IPFS STORES

The IPFS object must contain the encrypted payload defined by Phase 8.

It may include:

```text
protocol version
IV
ciphertext + authentication tag
required non-secret metadata defined by Phase 8
```

It must NOT contain:

```text
AES key
private key
seed phrase
wallet secret
password
plaintext document
JWT
API credentials
```

Do not add sensitive metadata merely for convenience.

---

# 10. CONTENT TYPE / FILE FORMAT

Define how the encrypted payload is represented before upload.

For example:

```text
binary encrypted payload
```

or the exact serialized format established by Phase 8.

The format must be deterministic and documented.

Do not upload arbitrary JSON wrapping unless required by the actual cryptographic serialization.

Do not change the Phase 8 serialization contract without a deliberate compatibility update.

---

# 11. REAL UPLOAD FLOW

Implement the real upload flow:

```text
1. Receive encrypted payload
2. Validate payload format
3. Validate payload is non-empty where required
4. Send bytes to real IPFS service
5. Wait for actual provider response
6. Extract actual CID
7. Validate CID is present and structurally plausible
8. Return/store the real CID
9. Preserve enough metadata to retrieve the exact encrypted payload later
```

Important:

A CID does not become valid merely because a client returned a string.

The result must originate from the actual IPFS service response.

---

# 12. UPLOAD FAILURE

If IPFS upload fails:

```text
NO CID
NO SUCCESS STATE
NO ON-CHAIN REGISTRATION
```

The application must report the actual failure.

Do not:

```text
use previous CID
generate fallback CID
reuse a sample CID
return "QmExample..."
return "upload successful"
```

The architecture explicitly requires fail-closed behavior.

---

# 13. CID HANDLING

Treat the CID as a real runtime result from IPFS.

Do not hard-code it.

Do not generate a fake CID.

Do not alter it arbitrarily.

Store/display exactly the canonical CID returned by the selected IPFS provider.

Document whether the provider returns:

```text
CIDv0
CIDv1
```

or another supported representation.

Do not assume one representation if the selected implementation may return another.

---

# 14. CID VALIDATION

Implement a reasonable validation step for returned CIDs.

The goal is to reject clearly invalid provider/application responses without creating an unnecessarily restrictive validator.

Validation should distinguish:

```text
valid-looking CID returned by real provider
```

from:

```text
empty or malformed response
```

Do not write a validator that only accepts a single example CID prefix.

Do not hard-code a particular document CID.

---

# 15. REAL RETRIEVAL

Implement retrieval by actual CID.

Conceptually:

```text
CID
 ↓
real IPFS provider/network
 ↓
encrypted bytes
```

Do not retrieve from:

```text
localStorage
mock JSON
hard-coded response
frontend state
cached fake data
```

unless the cache contains the exact real object and is clearly treated only as an optimization.

For Phase 9, direct real retrieval should be demonstrable.

---

# 16. RETRIEVED-CONTENT VALIDATION

After retrieving a CID:

1. receive actual bytes
2. validate encrypted-payload format
3. confirm supported protocol version
4. confirm required fields exist
5. confirm binary payload is intact
6. hand off to Phase 8 decryption later

Do not decrypt in an IPFS transport function unless this is explicitly required by the existing architecture.

Keep:

```text
storage transport
```

separate from:

```text
cryptographic processing
```

---

# 17. CID → CONTENT CONSISTENCY

The real IPFS system must return the content associated with the requested CID.

Test:

```text
upload encrypted payload
      ↓
CID
      ↓
retrieve CID
      ↓
retrieved bytes
```

Then verify:

```text
uploaded bytes == retrieved bytes
```

Use a cryptographic digest of the encrypted bytes if appropriate.

Do not compare only:

```text
string length
HTTP 200
object exists
```

A successful HTTP response is not sufficient evidence that the exact content was recovered.

---

# 18. ENCRYPTED PAYLOAD INTEGRITY TEST

Integrate Phase 8 into the IPFS test.

Flow:

```text
real test document bytes
      ↓
SHA-256
      ↓
AES-256-GCM
      ↓
encrypted payload
      ↓
real IPFS upload
      ↓
real CID
      ↓
real IPFS retrieval
      ↓
encrypted payload
      ↓
Phase 8 decryption
      ↓
original bytes
```

Verify:

```text
original bytes == decrypted retrieved bytes
```

and:

```text
SHA-256(original bytes) == SHA-256(decrypted retrieved bytes)
```

This is the central Phase 9 integration test.

---

# 19. TAMPER / CORRUPTION TESTING

If the retrieved encrypted payload is modified before decryption:

```text
modified ciphertext
```

Phase 8 should reject it during AES-GCM authentication.

Test this without modifying the real immutable IPFS object.

For example:

```text
retrieve real bytes
      ↓
modify test copy in memory
      ↓
attempt decrypt
      ↓
authentication failure
```

Do not upload modified plaintext/ciphertext merely to demonstrate a tamper case unless the test requires it.

---

# 20. PLAINTEXT PROTECTION

Do not send plaintext to IPFS.

Do not use the IPFS layer to "temporarily" upload plaintext.

Before any upload:

```text
assert encrypted payload path
```

The IPFS service should accept the encrypted-payload type rather than an arbitrary plaintext `File` where practical.

This reduces the chance of accidentally bypassing encryption later.

---

# 21. KEY PROTECTION

The IPFS layer must never receive the raw AES key unless a later explicitly designed key-wrapping operation requires it.

The preferred interface is:

```text
encryptedPayload + non-secret metadata
```

not:

```text
document + key
```

The IPFS service should not need the decryption key.

---

# 22. API SECRET IS NOT ENCRYPTION KEY

Keep these concepts completely separate:

```text
IPFS API credential
```

and:

```text
AES document encryption key
```

The API credential authenticates the application to the storage provider.

The AES key protects the document.

Never use one as the other.

Do not derive document encryption keys from IPFS API credentials.

---

# 23. SERVER/CLIENT BOUNDARY

Follow the architecture established in Phase 2.

The eventual production path is:

```text
Browser
  ↓
application/API layer
  ↓
IPFS service
  ↓
IPFS network
```

The IPFS credential must remain server-side.

Do not expose provider credentials in:

```text
Next.js client bundle
browser localStorage
public environment variables
React components
frontend network requests
```

If Next.js environment variables are involved, ensure provider secrets are never exposed through `NEXT_PUBLIC_*`.

---

# 24. PHASE 9 API BOUNDARY

Do NOT build the full Express API layer in this phase.

Do not implement the final production endpoint:

```text
POST /api/ipfs/upload
GET /api/ipfs/:cid
```

unless the repository already requires a minimal transport adapter for testing and it is clearly separated from the Phase 10 API implementation.

Preferred Phase 9 output:

```text
reusable IPFS service
```

which Phase 10 can later expose through the project's custom REST API.

Do not duplicate the API architecture.

---

# 25. FRONTEND BOUNDARY

Do not build the complete document-upload experience in Phase 9.

Do not add:

```text
fake upload progress
fake CID
fake document list
fake storage dashboard
```

The frontend may consume the real IPFS service later through Phase 10.

For now, use real tests and service-level validation.

---

# 26. BLOCKCHAIN BOUNDARY

Do NOT write the CID to DocumentRegistry in Phase 9.

Do not implement:

```text
registerDocument()
```

from the IPFS service.

The correct future flow is:

```text
encrypt
 ↓
IPFS upload
 ↓
real CID
 ↓
document registration transaction
```

But blockchain registration belongs to the later end-to-end integration phase.

If IPFS upload fails:

```text
there must be no document registration transaction
```

This invariant should be documented and later enforced by the application workflow.

---

# 27. DOCUMENT LIFECYCLE

Phase 9 should establish this storage lifecycle:

```text
Original file
    ↓
SHA-256
    ↓
AES-256-GCM
    ↓
Encrypted payload
    ↓
IPFS upload
    ↓
CID
```

No document should reach IPFS before encryption succeeds.

No CID should be treated as valid before real IPFS upload succeeds.

---

# 28. PINNING / PERSISTENCE

Determine what the selected IPFS provider does with uploaded content.

Document whether the implementation provides:

```text
pinning
persistent storage
temporary storage
gateway retrieval
```

Do not claim permanent persistence unless the provider/implementation actually guarantees or contractually provides it.

If using a pinning service:

- perform the real pin/upload operation
- verify the provider response
- record only real resulting identifiers/statuses

If using a local IPFS node:

- document that persistence depends on local node pinning/storage
- do not call it production-grade highly available storage

---

# 29. GATEWAY USAGE

If retrieval uses an IPFS gateway:

```text
CID
 ↓
gateway
 ↓
encrypted bytes
```

Ensure the gateway is only used to retrieve encrypted content.

Do not expose plaintext through a publicly accessible gateway.

Do not put decryption keys into gateway URLs.

Do not append secrets to gateway query parameters.

---

# 30. GATEWAY FAILURE

Handle:

- timeout
- unavailable gateway
- not found
- provider authentication failure
- rate limiting
- malformed response
- corrupted response
- network failure

Do not convert failures into:

```text
CID valid
download successful
document available
```

The service must return an honest error.

---

# 31. NOT FOUND / UNKNOWN CID

If a CID cannot be retrieved:

```text
not found
```

must remain a real error/state.

Do not return:

```text
empty document
sample document
previous document
cached fake document
```

Do not silently substitute another CID.

---

# 32. IPFS CONTENT HASH UNDERSTANDING

Understand and document the distinction between:

```text
Document SHA-256
```

and:

```text
IPFS CID/content identifier
```

They are related to content addressing but are NOT interchangeable.

The project's document verification field remains the SHA-256 hash of the original document.

The CID identifies the encrypted payload stored in IPFS.

Do not place a CID into the `bytes32 documentHash` field.

Do not treat a CID as a document SHA-256 value.

---

# 33. CID / HASH RELATIONSHIP

Document the two independent values:

```text
Original Document
    ↓
SHA-256
    ↓
documentHash
```

and:

```text
Encrypted Document
    ↓
IPFS
    ↓
CID
```

Later:

```text
on-chain:
documentHash + CID

IPFS:
encrypted payload

verification:
decrypt IPFS payload
↓
SHA-256
↓
compare with on-chain documentHash
```

Do not merge these concepts.

---

# 34. FILE NAMING / METADATA

Avoid storing unnecessary plaintext filename metadata publicly.

If a filename is included in the encrypted payload, document why.

Prefer that sensitive metadata remain encrypted along with the document if it needs to be preserved.

Do not upload:

```text
passport.pdf
marksheet.pdf
medical-record.pdf
```

as publicly meaningful plaintext metadata merely for convenience.

---

# 35. CONTENT TYPE / MIME METADATA

If MIME type is needed for later reconstruction:

- keep the approach documented
- consider encrypting sensitive metadata
- do not expose unnecessary sensitive metadata through IPFS

Do not use MIME metadata as a security boundary.

A file's claimed MIME type is not proof of file contents.

---

# 36. SIZE LIMITS

Determine whether the selected IPFS provider imposes upload limits.

Document actual observed/configured limits if applicable.

Do not hard-code a fake maximum merely to display a UI.

If the provider rejects a large file:

```text
show actual provider/service error
```

Do not split files automatically unless a later explicit requirement exists.

---

# 37. TIMEOUTS AND RETRIES

Implement reasonable network timeout/error handling.

Retries must be safe.

Be careful with upload retries:

```text
same content
→ repeated upload
```

may produce the same CID if the resulting content bytes are identical, but provider pinning/API semantics should not be assumed.

Do not invent success after a timeout.

If an upload response is ambiguous:

```text
unknown state
```

rather than:

```text
success
```

unless the provider offers a reliable way to verify the CID afterward.

---

# 38. UPLOAD SUCCESS VERIFICATION

Where practical, after an upload returns a CID:

1. use the real CID
2. retrieve the content from the real IPFS service/gateway
3. verify retrieved encrypted bytes match the uploaded encrypted bytes

This provides evidence that:

```text
CID → actual expected content
```

Do not treat API response alone as sufficient if the provider supports retrieval verification.

---

# 39. SECURITY REVIEW

Review the implementation for:

- plaintext upload paths
- credential exposure
- raw-key exposure
- CID fabrication
- hard-coded CIDs
- fake provider responses
- insecure gateway URLs
- secret query parameters
- logging of document contents
- logging of API secrets
- client-side provider credentials
- unvalidated provider responses
- incorrect content serialization

Fix material issues before declaring the phase complete.

---

# 40. TESTING — REAL IPFS

Create/execute tests covering:

### Configuration

- missing credentials
- invalid configuration
- provider unavailable

### Upload

- real encrypted payload upload
- actual CID received
- empty/malformed payload rejected before upload

### Retrieval

- real CID retrieval
- actual encrypted bytes returned
- unknown CID error

### Round Trip

```text
encrypt
→ upload
→ CID
→ retrieve
→ decrypt
→ original
```

### Integrity

```text
uploaded encrypted bytes
==
retrieved encrypted bytes
```

### Tamper

```text
retrieved encrypted bytes modified in memory
→ AES-GCM failure
```

### Credential protection

Confirm credentials never appear in logs/errors/UI responses.

---

# 41. TEST DATA POLICY

For automated IPFS tests:

- use a synthetic test document only inside isolated test execution
- encrypt it with the real Phase 8 cryptography
- upload it to the real IPFS service when an integration test is explicitly intended to do so
- retrieve it
- decrypt it
- verify exact byte equality

Do not let these test documents become seeded production documents.

Do not display them in the application.

Clean up provider-side test content when the selected provider permits it and the test workflow requires cleanup.

If IPFS immutability/pinning prevents deletion, document the retention behavior instead of pretending deletion occurred.

---

# 42. REAL PROVIDER TESTING

At least one integration test must exercise the real IPFS provider.

A successful Phase 9 test should prove:

```text
real credentials
    ↓
real IPFS service
    ↓
real encrypted bytes
    ↓
real CID
    ↓
real retrieval
    ↓
real decrypted original bytes
```

Do not satisfy this acceptance criterion with a mock.

Unit tests may mock the provider adapter for isolated error-path tests, but the phase must also contain a real integration path.

---

# 43. CREDENTIAL EXPOSURE AUDIT

After configuring the real IPFS credentials, inspect:

```text
source files
logs
browser bundle
frontend environment
Git status
Git diff
documentation
error messages
```

Ensure credentials do not appear.

Do not paste the credential into the code or prompt.

Store it only in the real local `.env` mechanism.

---

# 44. ENVIRONMENT FILE

Ensure:

```text
.env
```

contains the real credentials locally, where required.

Ensure:

```text
.env.example
```

contains only variable names/placeholders such as:

```env
IPFS_API_URL=
IPFS_API_KEY=
IPFS_API_SECRET=
```

Never commit real credentials.

Verify `.gitignore` covers `.env`.

Do not place secrets under:

```text
NEXT_PUBLIC_*
```

---

# 45. NO FAKE FALLBACKS

Never do:

```text
try IPFS
catch
    return demo CID
```

or:

```text
if provider unavailable:
    use local JSON storage
```

or:

```text
if upload fails:
    pretend CID exists
```

The project explicitly requires honest failure.

Correct behavior:

```text
IPFS upload failed
→ no CID
→ clear error
→ no downstream registration
```

---

# 46. DOCUMENTATION

Create/update:

```text
docs/ipfs.md
docs/security.md
docs/requirements-traceability.md
```

`docs/ipfs.md` must explain:

1. IPFS architecture
2. Selected provider/node
3. Credential configuration
4. Provider/client abstraction
5. Upload flow
6. CID handling
7. Retrieval flow
8. Encrypted-payload-only rule
9. Pinning/persistence behavior
10. Gateway behavior
11. Error handling
12. Timeout/retry strategy
13. Content integrity verification
14. Relationship between CID and SHA-256
15. Secret-management model
16. What is deferred to Phase 10 and later

Only document behavior that actually exists.

---

# 47. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark only the IPFS requirements actually implemented.

Do not mark:

- end-to-end document registration
- production API
- document sharing
- full verification
- audit UI

as complete merely because IPFS works.

---

# 48. ACCEPTANCE CRITERIA

Phase 9 is complete only when:

- [ ] A real IPFS implementation/provider is selected.
- [ ] Real provider configuration works.
- [ ] Real credentials, where required, are supplied only through secure environment configuration.
- [ ] No IPFS credentials are hard-coded.
- [ ] No IPFS credentials are exposed to the browser.
- [ ] Phase 8 encrypted payload is accepted by the IPFS service.
- [ ] Plaintext documents are rejected/not routed to the IPFS upload path.
- [ ] Real encrypted bytes are uploaded.
- [ ] Real CID is returned by the provider.
- [ ] CID is not fabricated.
- [ ] Real CID retrieval works.
- [ ] Retrieved encrypted bytes equal the uploaded encrypted bytes.
- [ ] Retrieved encrypted bytes can be passed to Phase 8 decryption.
- [ ] Decrypted bytes equal original bytes.
- [ ] SHA-256 of decrypted bytes equals SHA-256 of original bytes.
- [ ] Tampering causes cryptographic failure.
- [ ] Unknown CID returns an honest error.
- [ ] Provider/network failure returns an honest error.
- [ ] Upload failure produces no CID.
- [ ] No on-chain document registration occurs in this phase.
- [ ] No fake IPFS response exists in runtime code.
- [ ] No fake CIDs exist in runtime code.
- [ ] Security/credential audit passes.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phases 5–8 remain functional.

---

# 49. SYNTHETIC DATA AUDIT

Before completion, search the repository for:

```text
fake CID
mock CID
demo CID
sample CID
QmExample
bafyExample
fake upload
mock upload
demo upload
sample document
seeded document
fallback storage
```

Classify each occurrence as:

```text
test fixture
documentation example
actual runtime value
```

Any fake runtime CID or storage result must be removed.

A test fixture may remain inside test code if it is clearly test-only.

---

# 50. CREDENTIAL / SECRET AUDIT

Search for:

```text
IPFS_API_KEY
IPFS_API_SECRET
API_KEY
API_SECRET
Bearer
Authorization
NEXT_PUBLIC_
private key
seed phrase
AES_KEY
ENCRYPTION_KEY
```

Confirm:

- real credentials exist only where needed
- `.env` is not committed
- no credential is bundled into the frontend
- no credential is logged
- no credential appears in documentation
- no encryption key is confused with an IPFS credential

Report the result honestly.

---

# 51. FINAL PHASE REPORT

At the end of Phase 9, provide exactly these sections:

## Phase 9 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## IPFS Provider

State the actual selected provider/node and integration method.

## Credential Configuration

State which environment variables are required.

Do NOT print actual credential values.

Example:

```text
IPFS_API_URL → configured
IPFS_API_KEY → configured
IPFS_API_SECRET → configured
```

Do not expose secrets.

## Upload Test

Report actual:

```text
encrypted payload size
CID
provider response/result
retrieval result
```

Only report values obtained from actual execution.

## Retrieval Test

Report actual verification that:

```text
uploaded encrypted bytes
==
retrieved encrypted bytes
```

## Cryptographic Round Trip

Report:

```text
original bytes
→ encrypt
→ IPFS
→ retrieve
→ decrypt
→ original bytes
```

and the observed result.

## Tamper Test

Report the actual tamper scenario and result.

## Synthetic Data Audit

State whether fake/mock/demo IPFS runtime data was introduced.

## Credential Audit

State whether secrets were exposed or committed.

## Files Created/Modified

List relevant files.

## Known Limitations

Include actual limitations such as:

- provider-specific persistence behavior
- gateway availability
- large-file constraints
- IPFS deletion/immutability behavior
- production API layer not yet implemented
- on-chain CID registration not yet implemented

## Deferred Work

Explicitly state what remains for:

- Phase 10 — Node/Express APIs
- later end-to-end document registration
- sharing/revocation workflow integration
- full verification/audit workflow

---

# 52. STOP CONDITION

When Phase 9 is complete:

1. Configure the real IPFS credentials locally if required.
2. Run the IPFS service tests.
3. Run at least one real provider integration test.
4. Upload actual encrypted bytes.
5. Capture the real CID.
6. Retrieve the real CID.
7. Compare uploaded and retrieved bytes.
8. Decrypt retrieved bytes with Phase 8.
9. Confirm exact original-byte recovery.
10. Run tamper tests.
11. Audit credential exposure.
12. Audit synthetic/fake runtime data.
13. Update documentation.
14. Update requirements traceability.
15. Verify against `ai_rules.md`.
16. Verify against `MASTER_PLAN.md`.
17. Verify against Phase 1–8 artifacts.
18. Produce the final report.
19. STOP.

Do not automatically start Phase 10.

Do not implement the production REST API.

Do not register the CID on-chain.

Do not build the full document upload UI.

Do not implement document sharing.

Do not expose IPFS credentials to the frontend.

---

# CORE PRINCIPLE

> **Phase 9 must connect the real AES-256-GCM output from Phase 8 to a real IPFS network/service, producing a real CID and allowing real retrieval of the exact encrypted bytes. IPFS must never receive plaintext documents or encryption keys, and failures must never be replaced by fake CIDs, mock storage, or fallback data.**
