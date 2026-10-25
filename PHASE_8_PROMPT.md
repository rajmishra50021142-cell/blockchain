# PHASE 8 — CRYPTOGRAPHY: SHA-256 + AES-256-GCM

## Purpose

Implement the real cryptographic foundation for the Blockchain-Based Digital Document Locker.

This phase introduces the project's actual:

- SHA-256 document hashing
- AES-256-GCM document encryption
- secure random key generation
- secure random IV/nonce generation
- encryption/decryption
- integrity/authentication checks
- cryptographic error handling
- key-handling boundaries
- cryptographic test coverage
- integration with the existing wallet/blockchain architecture without exposing secrets

The project must continue to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No external API credentials are required for Phase 8.

Do not request or add API keys in this phase.

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
10. `docs/requirements.md`
11. `docs/requirements-traceability.md`
12. `docs/architecture.md`
13. `docs/api.md`
14. `docs/security.md`
15. `docs/smart-contract-security.md` if created
16. `docs/document-registry.md`
17. `docs/access-control.md`
18. `docs/wallet-identity.md` if present
19. All current frontend/backend/blockchain implementation files relevant to document handling
20. The supplied reference PPT and mandatory requirements image if available

Treat these sources as the current project source of truth.

Do not silently replace the architecture with a different cryptographic design.

If implementation and documentation conflict, identify the conflict and resolve it deliberately.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- SHA-256 hashing of actual document bytes
- AES-256-GCM encryption of actual document bytes
- AES-256-GCM decryption
- cryptographically secure random key generation
- cryptographically secure random 96-bit IV/nonce generation
- authenticated encryption/decryption
- exact binary handling
- deterministic hash output format
- encrypted payload serialization
- integrity/tamper detection through AES-GCM authentication
- cryptographic test vectors and tests
- key lifecycle boundaries
- secure memory/storage decisions
- documentation
- requirements traceability
- integration-ready outputs for later IPFS/document workflow

This phase is NOT responsible for:

- IPFS uploads
- IPFS downloads
- CID generation
- IPFS pinning
- document registration UI
- production document API
- full end-to-end document workflow
- sharing UI
- recipient key distribution
- production key escrow
- public testnet deployment
- IdentityRegistry
- AccessControl changes unless required for a security correction
- AI functionality
- zero-knowledge proofs
- cross-chain functionality
- mobile support

Do not pull later-phase features into Phase 8.

---

# 3. CRYPTOGRAPHIC ARCHITECTURE

The intended document pipeline is:

```text
REAL DOCUMENT BYTES
        │
        ├──────────────→ SHA-256
        │                    │
        │                    └──→ 32-byte document digest
        │
        └──────────────→ AES-256-GCM
                             │
                             ├──→ 256-bit random encryption key
                             ├──→ 96-bit random IV/nonce
                             └──→ authenticated ciphertext
```

Later:

```text
SHA-256 digest
      ↓
DocumentRegistry
      ↓
on-chain document hash
```

and:

```text
AES-256-GCM ciphertext
      ↓
IPFS
      ↓
real CID
```

Phase 8 implements the cryptographic layer only.

Do not integrate IPFS yet.

---

# 4. NON-SYNTHETIC DATA RULE

Cryptographic operations must operate on actual runtime bytes.

For application code:

```text
user-selected file
        ↓
actual bytes
        ↓
real SHA-256
        ↓
real AES-256-GCM
```

Do not generate:

```text
fake file contents
fake hash
fake ciphertext
fake encryption key
fake IV
fake authentication tag
```

Do not hard-code a production encryption key.

Do not hard-code a production IV/nonce.

Do not hard-code a production SHA-256 digest.

Test fixtures are allowed only inside clearly isolated tests.

---

# 5. CRYPTOGRAPHIC LIBRARY / PLATFORM

Prefer the secure cryptographic primitives already available in the project's platform.

For browser-side cryptography, prefer:

```text
Web Crypto API
```

using:

```text
crypto.subtle.digest
crypto.subtle.generateKey
crypto.subtle.encrypt
crypto.subtle.decrypt
crypto.getRandomValues
```

or an equivalently trustworthy, already-established cryptographic library if the repository architecture requires it.

Do not implement SHA-256 manually.

Do not implement AES manually.

Do not write custom cryptographic algorithms.

Do not substitute base64, hex encoding, hashing libraries, or obfuscation for encryption.

If a library other than Web Crypto is already used, document why it is necessary.

---

# 6. SHA-256 IMPLEMENTATION

Implement a function/service equivalent to:

```text
hashDocument(bytes) → SHA-256 digest
```

Input:

```text
ArrayBuffer / Uint8Array
```

Output should have one canonical representation for the application.

Prefer a canonical binary 32-byte digest internally.

Provide a consistent serialization for:

- UI display
- API transport later
- smart-contract registration later

Do not maintain multiple competing hash formats.

---

# 7. HASH SOURCE OF TRUTH

The hash must be calculated from the exact original file bytes.

Correct:

```text
selected File
   ↓
arrayBuffer()
   ↓
SHA-256(actual bytes)
```

Incorrect:

```text
filename
filename + timestamp
JSON(metadata)
text representation
base64 string created after arbitrary transformations
compressed bytes
encrypted bytes
```

Do not hash the ciphertext for the primary document integrity value unless the architecture explicitly requires an additional ciphertext hash.

The project’s document verification hash is the SHA-256 hash of the original document bytes.

---

# 8. HASH DETERMINISM

For identical byte sequences:

```text
SHA256(bytes) == SHA256(bytes)
```

always.

Test:

```text
same bytes → same digest
different bytes → different digest
one-byte modification → changed digest
```

Do not add random salts to the document SHA-256 value.

The document hash must remain independently reproducible from the original file.

---

# 9. SHA-256 REPRESENTATION

Choose one canonical serialization.

A recommended approach is:

```text
32 raw bytes internally
64 lowercase hexadecimal characters for human-readable transport/display
```

The application must consistently convert between the forms.

Do not silently mix:

```text
0x-prefixed hex
non-prefixed hex
uppercase hex
base64
UTF-8 text
```

for the same logical field without an explicit conversion rule.

Document the chosen representation.

The representation must be compatible with the `bytes32` field used by `DocumentRegistry`.

---

# 10. AES-256-GCM

Implement:

```text
AES-256-GCM
```

with:

```text
256-bit key
96-bit IV/nonce
authenticated encryption
```

Do not substitute:

```text
AES-128
AES-CBC
AES-ECB
DES
3DES
XOR
custom encryption
```

The encryption mode must be authenticated.

---

# 11. ENCRYPTION KEY GENERATION

Generate a fresh cryptographically secure key for each document encryption operation.

Use a real cryptographically secure random source.

For browser implementation, use the Web Crypto API.

Conceptually:

```text
generateKey(
    AES-GCM,
    256 bits
)
```

Do not:

```text
hash(password)
use wallet address
use document ID
use filename
use timestamp
use Math.random()
use hard-coded bytes
```

as the encryption key.

The key must be independent from predictable application values.

---

# 12. IV / NONCE GENERATION

Generate a fresh random 96-bit IV/nonce for every AES-GCM encryption.

Use:

```text
crypto.getRandomValues()
```

or the equivalent cryptographically secure primitive.

Do not:

- reuse a production IV with the same key
- derive the IV from filename
- derive IV from wallet address
- derive IV from document ID
- use a constant IV
- use `Math.random()`

The nonce uniqueness requirement is critical for AES-GCM security.

---

# 13. ENCRYPTION FORMAT

Define one canonical encrypted-payload format for the project.

A suitable conceptual structure is:

```text
version
IV
ciphertext + authentication tag
```

For example:

```text
EncryptedDocument {
    version,
    iv,
    ciphertext
}
```

where the Web Crypto AES-GCM output contains the authentication tag as defined by the platform/library.

Do not separately invent or fabricate a tag.

Document the exact byte/serialization format.

The format must be unambiguous so Phase 9 can later upload exactly the encrypted payload to IPFS.

---

# 14. VERSIONING

Include a small protocol/version identifier in the encrypted-payload format so future cryptographic migrations are possible.

For example:

```text
version = 1
```

The chosen representation must be part of the documented serialization protocol.

Do not use the version as a fake cryptographic value.

The version simply identifies the encryption format.

---

# 15. OPTIONAL ASSOCIATED AUTHENTICATED DATA

AES-GCM supports Additional Authenticated Data (AAD).

If AAD is used, define it explicitly.

Potential metadata could include:

```text
document ID
protocol version
content type
```

However:

> Do not include metadata in AAD unless there is a concrete project requirement and the same exact AAD can be reconstructed during decryption.

If no AAD is required at this stage:

```text
AAD = none
```

is preferable to inventing a fragile scheme.

Document the decision.

---

# 16. ENCRYPTION FUNCTION

Implement a reusable function/service equivalent to:

```text
encryptDocument(bytes, key?)
```

The function must:

1. validate byte input
2. obtain/generate a valid 256-bit AES-GCM key
3. generate a fresh 96-bit IV
4. encrypt the exact bytes
5. return the encrypted payload in the canonical format
6. never upload anything to IPFS
7. never place the raw key on-chain
8. never put the key into the encrypted payload itself unless a later wrapping mechanism explicitly requires it

Do not make encryption silently fall back to plaintext.

---

# 17. DECRYPTION FUNCTION

Implement a corresponding function:

```text
decryptDocument(encryptedPayload, key)
```

The function must:

1. validate the payload format
2. parse version
3. parse IV
4. obtain the correct AES key
5. perform AES-GCM authentication/decryption
6. return the original plaintext bytes only if authentication succeeds

If authentication fails:

```text
decryption must fail
```

Do not return partially decrypted or guessed content.

Do not attempt to "repair" corrupted ciphertext.

---

# 18. AUTHENTICATION FAILURE / TAMPER DETECTION

AES-GCM must detect ciphertext modification.

Test:

```text
original ciphertext → decrypts
modified ciphertext → fails authentication
modified IV → fails
wrong key → fails
truncated payload → fails
corrupted payload → fails
```

The application must treat such failures as:

```text
integrity/authentication failure
```

Do not label tampered ciphertext as verified.

---

# 19. PLAINTEXT HANDLING

The actual plaintext document may exist transiently in application memory because encryption/decryption requires it.

Minimize its lifetime.

Do NOT:

- log plaintext
- send plaintext to a server unnecessarily
- save plaintext in localStorage
- save plaintext in sessionStorage unless explicitly required
- place plaintext in URLs
- place plaintext into blockchain transactions
- place plaintext into IPFS

Later IPFS integration must receive encrypted ciphertext only.

---

# 20. KEY HANDLING — CRITICAL

The raw AES encryption key must NEVER be:

```text
stored on blockchain
stored in IPFS as public plaintext
logged to console
hard-coded in source
put in URL
put in query parameters
stored in localStorage
stored in sessionStorage
committed to Git
placed in `.env`
sent to the blockchain contract
shown in UI
```

The architecture requires:

```text
raw encryption key → private application-side secret
```

The key must remain separate from:

```text
document hash
IPFS CID
blockchain metadata
document contents
```

---

# 21. PHASE 8 KEY LIFECYCLE BOUNDARY

A full multi-user key-distribution system is NOT part of Phase 8.

For this phase:

```text
generate key
    ↓
encrypt/decrypt
    ↓
hold key only in controlled application memory
```

Document that persistent owner key storage and secure recipient key distribution are future responsibilities.

Do not invent an insecure key-sharing mechanism merely to make the later sharing feature appear complete.

Do not:

```text
put key in IPFS
put key in MongoDB
put key on-chain
derive key from wallet address
derive key from signature text
send key through URL
send raw key to arbitrary API endpoints
```

---

# 22. KEY EXPORTABILITY

Choose and document the appropriate Web Crypto key extractability model.

The decision must account for the project's future need to securely wrap/distribute document keys while avoiding public exposure.

Do not make keys permanently non-extractable if doing so makes the documented future key-management architecture impossible.

Do not make raw key material persist automatically simply for convenience.

The selected design must be explicit and reviewed.

---

# 23. NO PASSWORD-BASED KEY DERIVATION

Do not implement password-derived document encryption keys in this phase unless explicitly required by the project requirements.

Do not invent a user password system.

Do not use:

```text
SHA-256(password)
walletAddress
signature
documentId
```

as the AES key.

The project uses cryptographically random AES-256-GCM keys.

---

# 24. WALLET BOUNDARY

Do not derive encryption keys directly from:

```text
MetaMask address
private key
wallet signature
transaction hash
chain ID
```

Wallet signatures are for authentication/proof of wallet control, not an AES key-derivation mechanism.

Keep wallet identity and document encryption secrets cryptographically separate.

---

# 25. DOCUMENT HASH + ENCRYPTION ORDER

The primary pipeline must follow:

```text
Original document bytes
        │
        ├────────→ SHA-256
        │             ↓
        │        document hash
        │
        └────────→ AES-256-GCM
                      ↓
                 encrypted payload
```

Do not calculate the on-chain document hash from the encrypted bytes.

The original document hash must remain reproducible from the original file.

---

# 26. DECRYPT-THEN-HASH VERIFICATION FOUNDATION

Provide a cryptographic primitive that supports later verification:

```text
encrypted payload
      ↓
decrypt
      ↓
original document bytes
      ↓
SHA-256
      ↓
computed document hash
```

The Phase 8 layer should make it possible for a later phase to compare:

```text
computed SHA-256
        vs
on-chain DocumentRegistry hash
```

Do not implement the full verification UI or workflow here.

---

# 27. BINARY DATA INTEGRITY

The cryptographic implementation must operate on bytes, not on implicit text encodings.

Be careful with:

```text
UTF-8
Base64
Hex
ArrayBuffer
Uint8Array
Blob
File
```

Define explicit conversion rules.

Do not convert arbitrary binary files to text and back before hashing or encryption.

That could change the bytes and invalidate the cryptographic guarantees.

---

# 28. LARGE FILE HANDLING

Review the current implementation for memory behavior.

The first implementation may operate on complete file bytes if that is consistent with the project scope and expected document sizes.

Do NOT invent a streaming cryptographic implementation without evidence that the current application needs it.

However, document the limitation:

```text
large files may require a future streaming/chunked design
```

if the current implementation loads the complete document into memory.

Do not silently claim unlimited file-size support.

---

# 29. ERROR HANDLING

Define honest errors for:

- empty input
- invalid binary input
- invalid key
- invalid IV
- malformed encrypted payload
- unsupported payload version
- decryption authentication failure
- corrupted ciphertext
- wrong key
- unexpected crypto API failure

Never fall back to plaintext when encryption fails.

Never return "verified" after decryption/authentication failure.

Never generate a replacement key silently after a failed decryption.

---

# 30. NO SYNTHETIC FALLBACKS

If Web Crypto or the required cryptographic implementation is unavailable:

```text
show a clear error
```

Do NOT:

```text
use plaintext
use base64
use XOR
use a fake hash
use a fake encryption result
```

The secure operation either succeeds cryptographically or fails honestly.

---

# 31. TESTING — SHA-256

Create comprehensive SHA-256 tests.

At minimum:

### Determinism

```text
same bytes
→ same SHA-256
```

### Sensitivity

```text
one-byte change
→ different SHA-256
```

### Empty bytes

Use a standard known SHA-256 test vector.

### Known test vectors

Use authoritative, deterministic test vectors inside test code.

Document the source/expected values.

Do not put test vectors into production application state.

### Binary input

Test bytes containing:

- null bytes
- arbitrary binary values
- non-ASCII UTF-8 where relevant

Confirm the bytes are not modified.

---

# 32. TESTING — AES-256-GCM

Test at minimum:

### Round trip

```text
plaintext
→ encrypt
→ decrypt
→ exact original bytes
```

### Fresh key

Different encryption operations should use fresh cryptographic keys where that is the selected design.

### Fresh IV

Confirm every encryption receives a fresh IV.

Do not assert merely that random outputs are "never equal" as a mathematical guarantee.

Instead test that IVs are produced by the cryptographic random source and verify format/length.

### Tampering

Modify ciphertext and confirm decryption fails.

### IV modification

Modify IV and confirm decryption fails.

### Wrong key

Use a different test key and confirm decryption fails.

### Truncation

Remove bytes from the payload and confirm decryption fails.

### Empty document

Verify an empty byte sequence can be encrypted/decrypted if the project chooses to permit empty files.

If empty documents are disallowed by application requirements, document and test rejection.

---

# 33. KEY SIZE / IV SIZE TESTS

Explicitly verify:

```text
AES key = 256 bits
IV = 96 bits
```

Do not rely solely on comments.

Test actual generated object/material properties where the selected API exposes them.

---

# 34. PAYLOAD SERIALIZATION TESTS

Test:

```text
encrypt
→ serialize
→ parse
→ decrypt
```

and confirm:

```text
plaintext bytes before
==
plaintext bytes after
```

Test malformed versions and missing fields.

Do not allow malformed payloads to be treated as valid.

---

# 35. HASH + ENCRYPT INTEGRATION TEST

Create an integration-level cryptographic test:

```text
original file bytes
        ↓
SHA-256
        ↓
hash A

same original bytes
        ↓
AES-256-GCM
        ↓
ciphertext

ciphertext
        ↓
decrypt
        ↓
bytes B

SHA-256(bytes B)
        ↓
hash B
```

Verify:

```text
hash A == hash B
```

This demonstrates that the cryptographic round trip preserves the document exactly.

---

# 36. TAMPER DETECTION INTEGRATION TEST

Test:

```text
original bytes
↓
hash
↓
encrypt
↓
modify ciphertext
↓
decrypt
```

Expected:

```text
authenticated decryption fails
```

Do not continue to hashing after failed decryption.

---

# 37. DOCUMENT HASH COMPATIBILITY TEST

Confirm the produced SHA-256 representation can be converted into the `bytes32` representation expected by `DocumentRegistry`.

Test:

```text
SHA-256 32-byte digest
      ↓
canonical encoding
      ↓
bytes32
      ↓
DocumentRegistry-compatible input
```

Do not actually build the complete document registration workflow in Phase 8.

This is a compatibility test only.

---

# 38. SECURITY TESTING

Review for:

- hard-coded keys
- hard-coded IVs
- `Math.random()`
- plaintext logging
- raw-key logging
- URL key material
- localStorage key material
- sessionStorage key material
- key exposure through error messages
- accidental plaintext network requests
- insecure fallback crypto
- custom crypto implementations
- inconsistent binary conversions

Search the repository deliberately.

---

# 39. LOGGING POLICY

Ensure no cryptographic secret is logged.

Do NOT log:

```text
raw AES key
private key
plaintext document
full ciphertext unnecessarily
IV + raw key together
```

It is acceptable to log non-sensitive operational metadata when useful, such as:

```text
"Encryption completed"
"Hash computation completed"
```

but avoid revealing cryptographic material.

---

# 40. UI BOUNDARY

Do not build the final document-upload UI in this phase.

The cryptographic layer may expose functions/hooks/services that later UI code can call.

Do not create fake encrypted-document cards.

Do not show fake hashes.

Do not show sample CIDs.

Use empty states where no real document exists.

---

# 41. BACKEND BOUNDARY

Do not implement production document APIs in this phase.

Do not send plaintext documents to a backend merely to calculate the hash or encryption.

The architecture calls for client-side cryptographic processing unless a documented later requirement changes this.

Phase 10 API integration comes later.

---

# 42. IPFS BOUNDARY

Do not connect to IPFS.

Do not request IPFS credentials.

Do not upload the encrypted payload.

Do not create a CID.

Phase 9 will consume the real encrypted output created by Phase 8.

The handoff should be:

```text
EncryptedDocument
    ↓
serialized encrypted bytes
    ↓
ready for real IPFS upload in Phase 9
```

---

# 43. BLOCKCHAIN BOUNDARY

Do not submit registration transactions in Phase 8.

Do not update DocumentRegistry directly from the cryptography module.

The contract layer consumes the real document hash later.

Do not introduce a second blockchain interface here.

---

# 44. ACCESSCONTROL BOUNDARY

Do not modify AccessControl.

Encryption authorization and blockchain access authorization are separate concerns.

This phase must not assume:

```text
hasAccess() → automatically gives decryption key
```

Key distribution is a later security design.

Document this explicitly.

---

# 45. IDENTITY BOUNDARY

Do not introduce IdentityRegistry.

Do not bind encryption keys to:

```text
DID
wallet address
signature
```

unless the later key-management architecture explicitly specifies a secure cryptographic wrapping scheme.

---

# 46. API KEY / CREDENTIAL POLICY

No external credentials are required in Phase 8.

Do NOT request:

- Alchemy API key
- Infura key
- QuickNode key
- IPFS API key
- IPFS API secret
- private key
- seed phrase
- JWT secret
- encryption key supplied by the user

The AES document keys must be generated by the application using a cryptographically secure random source.

The user must not manually provide an encryption key for normal document encryption.

---

# 47. ENVIRONMENT / SECRETS

Do not put cryptographic keys into `.env`.

`.env` is for configuration/secrets that genuinely belong to external infrastructure.

A per-document AES key generated at runtime is NOT an environment variable.

Do not create:

```env
AES_KEY=...
DOCUMENT_ENCRYPTION_KEY=...
MASTER_DOCUMENT_KEY=...
```

as hard-coded application secrets.

Do not commit any real encryption material.

---

# 48. KEY RETENTION

Define how long a document key exists in application memory.

The initial Phase 8 implementation should minimize retention.

At minimum:

```text
generate
→ encrypt/decrypt
→ hand off to controlled next layer
→ release references when no longer required
```

JavaScript memory cannot be guaranteed to be perfectly zeroized, so do not falsely claim guaranteed memory erasure.

Document this limitation honestly.

Do not claim secure memory wiping unless the implementation actually provides it.

---

# 49. RANDOMNESS REVIEW

Use cryptographically secure randomness.

Approved:

```text
crypto.getRandomValues()
Web Crypto generateKey()
```

Not approved:

```text
Math.random()
Date.now()
incrementing counters
wallet address
document ID
hash-derived IV without a justified construction
```

Test that the chosen API is actually used.

---

# 50. CRYPTOGRAPHIC DOCUMENTATION

Create/update:

```text
docs/cryptography.md
docs/security.md
docs/requirements-traceability.md
```

`docs/cryptography.md` must document:

1. Cryptographic goals
2. SHA-256 use
3. AES-256-GCM use
4. Key generation
5. IV generation
6. Payload serialization
7. Hash representation
8. Encryption/decryption flow
9. Tamper detection
10. Key lifecycle
11. Key storage policy
12. Plaintext handling
13. Logging rules
14. Browser/platform primitives
15. Binary conversion rules
16. Large-file limitation
17. Future key-distribution boundary
18. What is explicitly deferred

Do not claim security properties beyond what the implementation actually provides.

---

# 51. TRACEABILITY

Update:

```text
docs/requirements-traceability.md
```

Mark cryptography requirements based on actual implementation.

Do not mark:

- IPFS
- document registration
- sharing
- recipient key distribution
- full verification
- production API

as complete merely because the encryption layer exists.

---

# 52. ACCEPTANCE CRITERIA

Phase 8 is complete only when:

- [ ] SHA-256 is implemented using a trusted cryptographic primitive.
- [ ] SHA-256 operates on exact original document bytes.
- [ ] SHA-256 has a single documented canonical representation.
- [ ] AES-256-GCM is implemented.
- [ ] AES key is 256 bits.
- [ ] AES-GCM IV is 96 bits.
- [ ] IV is generated from a cryptographically secure random source.
- [ ] Fresh key generation is implemented according to the selected design.
- [ ] No production key is hard-coded.
- [ ] No production IV is hard-coded.
- [ ] Encryption output has a documented serialization format.
- [ ] Decryption successfully restores exact original bytes.
- [ ] Wrong key causes authenticated decryption failure.
- [ ] Modified ciphertext causes authenticated decryption failure.
- [ ] Modified IV causes failure.
- [ ] Truncated/malformed ciphertext causes failure.
- [ ] Plaintext is not stored in localStorage/sessionStorage.
- [ ] Raw keys are not stored in localStorage/sessionStorage.
- [ ] Raw keys are not sent to blockchain/IPFS.
- [ ] Raw keys are not logged.
- [ ] No insecure crypto fallback exists.
- [ ] No custom SHA-256/AES implementation exists.
- [ ] SHA-256 + encrypt/decrypt integration test passes.
- [ ] Hash after decrypt matches original hash.
- [ ] Document hash is compatible with DocumentRegistry `bytes32`.
- [ ] Cryptographic errors are handled honestly.
- [ ] Large-file limitations are documented if relevant.
- [ ] Future key-distribution limitations are documented.
- [ ] No external API credentials were introduced.
- [ ] No IPFS integration was introduced.
- [ ] No production document API was introduced.
- [ ] No fake runtime cryptographic data was introduced.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] Phases 5–7 remain functional.

---

# 53. SYNTHETIC DATA AUDIT

Before completion, inspect the repository for:

```text
fake hash
mock hash
demo key
sample key
hardcoded AES key
hardcoded IV
fake ciphertext
fake encrypted document
hardcoded CID
seeded document
```

Classify each occurrence as:

```text
test fixture
documentation example
production/runtime value
```

Any synthetic production/runtime cryptographic value must be removed.

Test vectors and deterministic fixtures are acceptable only within isolated tests/documentation.

---

# 54. SECRET AUDIT

Search for:

```text
0x...
private key
seed phrase
API_KEY
API_SECRET
AES_KEY
ENCRYPTION_KEY
MASTER_KEY
```

Verify no real secret has been committed.

Do not mistake a test-only cryptographic vector for a production secret.

Report findings honestly.

---

# 55. FINAL PHASE REPORT

At the end of Phase 8, provide exactly these sections:

## Phase 8 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Cryptographic Components Implemented

Describe actual SHA-256 and AES-256-GCM functionality.

## Hash Specification

State:

```text
input
algorithm
output
canonical representation
DocumentRegistry compatibility
```

## Encryption Specification

State:

```text
algorithm
key size
IV size
payload format
AAD decision
key lifecycle
```

## Tests

List actual cryptographic tests and results.

## Tamper Tests

List actual tampering scenarios tested and outcomes.

## Key-Security Audit

State where keys are held and confirm they are not exposed through:

```text
logs
URLs
localStorage
sessionStorage
blockchain
IPFS
source code
```

## Synthetic Data Audit

State whether fake/mock/demo cryptographic runtime data was introduced.

## Credential Audit

State whether any external API credentials or secrets were introduced.

## Files Created/Modified

List relevant files.

## Known Limitations

Document actual limitations, especially:

- key persistence/distribution is not yet a complete multi-user system
- IPFS integration not yet implemented
- full document verification not yet implemented
- large-file/streaming considerations if applicable
- browser memory cannot be claimed to be securely zeroized unless actually implemented

## Deferred Work

Explicitly state what remains for:

- Phase 9 — IPFS
- Phase 10 — APIs
- later document registration/verification/sharing workflow

---

# 56. STOP CONDITION

When Phase 8 is complete:

1. Run all cryptographic tests.
2. Test real browser/runtime cryptographic APIs where applicable.
3. Verify exact byte preservation.
4. Verify hash determinism.
5. Verify AES-GCM authentication.
6. Verify tamper detection.
7. Audit key handling.
8. Audit logs and storage for secret exposure.
9. Audit synthetic runtime data.
10. Audit credentials/secrets.
11. Update documentation.
12. Update requirements traceability.
13. Verify against `ai_rules.md`.
14. Verify against `MASTER_PLAN.md`.
15. Verify against Phase 1–7 artifacts.
16. Produce the final report.
17. STOP.

Do not automatically start Phase 9.

Do not connect to IPFS.

Do not request an IPFS API key.

Do not upload any document.

Do not register a document on-chain.

Do not implement sharing.

Do not implement production APIs.

---

# CORE PRINCIPLE

> **Phase 8 must produce real cryptographic transformations of real document bytes: SHA-256 for reproducible document identity and AES-256-GCM for authenticated confidentiality. Cryptographic keys and nonces must be generated securely at runtime and never become public blockchain/IPFS/application data. No external API credentials are required for this phase.**
