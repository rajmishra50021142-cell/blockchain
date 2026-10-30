# PHASE 10 — NODE.JS / EXPRESS BACKEND API LAYER

## Purpose

Implement the real backend/API layer for the Blockchain-Based Digital Document Locker.

This phase connects the already-built components:

```text
Phase 4 → MetaMask / wallet identity
Phase 5 → DocumentRegistry
Phase 6 → AccessControl
Phase 7 → smart-contract security/testing
Phase 8 → SHA-256 + AES-256-GCM
Phase 9 → real IPFS / Pinata
```

into a controlled server-side API layer using:

```text
Node.js
Express
TypeScript
ethers.js
JWT authentication
real IPFS service
real blockchain provider
```

The project must continue to follow:

> **REAL RUNTIME DATA ONLY — NO SYNTHETIC / MOCK / FAKE APPLICATION DATA**

No fake users, documents, CIDs, wallet addresses, blockchain transactions, audit events, verification results, or fallback API responses are allowed.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before changing anything, read all of the following completely:

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
12. `docs/requirements.md`
13. `docs/requirements-traceability.md`
14. `docs/architecture.md`
15. `docs/api.md`
16. `docs/security.md`
17. `docs/wallet-identity.md` if present
18. `docs/document-registry.md`
19. `docs/access-control.md`
20. `docs/cryptography.md`
21. `docs/ipfs.md`
22. All existing backend, frontend, blockchain, cryptography, IPFS, and deployment files
23. The supplied reference PPT and mandatory requirements image if available

Treat these materials as the current project source of truth.

Do not silently replace the architecture.

If a conflict exists between the documented architecture and implementation, identify it explicitly and resolve it deliberately.

---

# 2. PHASE BOUNDARY

This phase IS responsible for:

- Node.js/Express API foundation
- TypeScript backend structure
- request validation
- centralized error handling
- security middleware
- CORS policy
- rate limiting
- wallet-signature authentication
- challenge/nonce generation
- signature verification
- JWT issuance and validation
- authenticated request middleware
- read-only blockchain service
- DocumentRegistry integration
- AccessControl integration
- real IPFS service integration
- encrypted payload upload proxy
- CID retrieval proxy
- document metadata endpoints
- verification endpoint based on real document hash + on-chain state
- audit endpoint based on actual blockchain events
- API documentation
- integration tests
- real local service tests
- requirements traceability
- security documentation

This phase is NOT responsible for:

- building the complete frontend
- document dashboard UI
- full upload UI
- full sharing UI
- IdentityRegistry
- new smart contracts
- changing DocumentRegistry business logic
- changing AccessControl business logic
- public testnet deployment
- AI functionality
- ZK proofs
- cross-chain functionality
- mobile support

Do not pull those features into Phase 10.

---

# 3. CORE ARCHITECTURE

The intended architecture is:

```text
Next.js Frontend
        │
        │ HTTPS/HTTP API
        ▼
Node.js + Express API
        │
        ├──────────────→ Authentication Service
        │
        ├──────────────→ Blockchain Service
        │                       │
        │                       ▼
        │                Ethereum / Hardhat
        │
        ├──────────────→ IPFS Service
        │                       │
        │                       ▼
        │                    Real IPFS
        │
        ├──────────────→ Verification Service
        │                       │
        │                       ├── DocumentRegistry
        │                       └── AccessControl
        │
        └──────────────→ Audit Service
                                │
                                ▼
                         Real blockchain events
```

The browser must not receive server-only secrets.

---

# 4. REAL-DATA POLICY

All API responses must be derived from actual sources.

Examples:

```text
wallet address
→ verified wallet signature

authenticated identity
→ actual verified wallet

document metadata
→ actual blockchain state

owner
→ DocumentRegistry

permission
→ AccessControl

document hash
→ actual SHA-256 supplied by the authenticated client

CID
→ actual IPFS/Pinata result

encrypted payload
→ actual IPFS object

audit record
→ actual blockchain event

transaction hash
→ actual blockchain transaction/receipt
```

Never return:

```text
demo user
sample document
fake CID
sample transaction
fake owner
sample permission
fake verification status
fake audit event
```

---

# 5. ENVIRONMENT / SECRET POLICY

Phase 10 introduces one important server-side secret:

```text
JWT signing secret
```

This is NOT an external API key.

It must be generated locally using a cryptographically secure random source and placed only in the local `.env`.

Do NOT send the secret in chat.

Do NOT hard-code it.

Do NOT put it in `.env.example`.

Recommended configuration:

```env
RPC_URL=
CHAIN_ID=

IPFS_API_URL=https://uploads.pinata.cloud/v3/files
IPFS_API_KEY=
IPFS_API_SECRET=
IPFS_JWT=
IPFS_GATEWAY=

CONTRACT_DOCUMENT_REGISTRY=
CONTRACT_ACCESS_CONTROL=
CONTRACT_IDENTITY_REGISTRY=
CONTRACT_NETWORK=

AUTH_JWT_SECRET=
AUTH_JWT_EXPIRES_IN=15m
AUTH_CHALLENGE_TTL_SECONDS=300

CORS_ORIGIN=
```

Use only variables actually required by the implementation.

Do not invent values.

The real Pinata JWT must remain in `.env`.

The JWT signing secret must remain server-side.

---

# 6. SECRET EXPOSURE RULES

Never expose:

- `IPFS_JWT`
- `IPFS_API_KEY`
- `IPFS_API_SECRET`
- `AUTH_JWT_SECRET`
- private keys
- seed phrases
- AES document keys

Never prefix server secrets with:

```text
NEXT_PUBLIC_
```

Do not return environment variables through an API endpoint.

Do not log them.

Do not include them in stack traces.

Do not put them in error responses.

---

# 7. BACKEND STRUCTURE

Use a maintainable structure consistent with the existing repository.

A suitable structure is:

```text
backend/
  src/
    app.ts
    server.ts

    config/
      env.ts

    middleware/
      auth.ts
      error-handler.ts
      validation.ts
      security.ts
      rate-limit.ts

    routes/
      auth.routes.ts
      ipfs.routes.ts
      documents.routes.ts
      verify.routes.ts
      audit.routes.ts

    controllers/
      auth.controller.ts
      ipfs.controller.ts
      documents.controller.ts
      verify.controller.ts
      audit.controller.ts

    services/
      auth.service.ts
      blockchain.service.ts
      ipfs.service.ts
      verification.service.ts
      audit.service.ts

    schemas/
      auth.schemas.ts
      ipfs.schemas.ts
      document.schemas.ts
      verify.schemas.ts

    types/
      ...

  tests/
    ...
```

Use the actual repository structure if it already has an established convention.

Do not create redundant duplicate services.

---

# 8. EXPRESS APP FOUNDATION

Implement:

- Express initialization
- JSON parsing where appropriate
- security headers
- CORS
- rate limiting
- request ID/correlation ID if already supported
- centralized error handling
- route registration
- 404 handling
- safe error serialization
- health/readiness endpoint if useful and documented

Do not expose internal stack traces in production-style API responses.

---

# 9. CORS

Configure CORS using environment/configuration.

Do not use:

```text
Access-Control-Allow-Origin: *
```

when credentials/authenticated requests are being used.

Use an explicit allowed frontend origin.

Do not hard-code a production domain.

For local development, use the actual configured local frontend URL.

---

# 10. RATE LIMITING

Apply appropriate rate limiting at minimum to:

```text
authentication endpoints
IPFS upload endpoint
verification endpoint
```

Do not use unlimited anonymous authentication attempts.

The rate-limit strategy should be documented.

Do not claim DDoS protection merely because Express rate limiting exists.

---

# 11. AUTHENTICATION MODEL

Implement wallet-based challenge authentication:

```text
Frontend
   ↓
POST /api/auth/challenge
   ↓
Backend generates random nonce
   ↓
Frontend receives challenge
   ↓
MetaMask signs challenge
   ↓
POST /api/auth/verify
   ↓
Backend verifies signature
   ↓
Backend issues JWT
   ↓
Frontend uses JWT for authenticated APIs
```

The challenge must be unique and short-lived.

---

# 12. CHALLENGE GENERATION

Implement:

```text
POST /api/auth/challenge
```

The challenge must use a cryptographically secure random nonce.

Do not use:

```text
Math.random()
timestamp only
fixed string
"hello"
"login"
123456
```

as the challenge.

A challenge may be bound to:

```text
wallet address
chain ID
issued-at time
expiration
domain/application name
nonce
```

Use the exact message structure documented by the project.

---

# 13. CHALLENGE STORAGE

Store active challenges using a secure mechanism appropriate to the current development architecture.

For the initial local/single-instance implementation, an in-memory challenge store may be acceptable if:

- challenges have expiration
- challenges are single-use
- old challenges are removed
- no sensitive document data is stored
- the limitation is documented

Do not falsely describe an in-memory challenge store as horizontally scalable.

If the repository already has a persistent cache/database, use the established infrastructure instead.

---

# 14. SINGLE-USE CHALLENGES

A challenge must not be reusable.

After successful verification:

```text
nonce consumed
```

Attempting to reuse the same challenge must fail.

This prevents replay of the same signature.

Test challenge replay explicitly.

---

# 15. CHALLENGE EXPIRATION

Challenges must expire.

Use:

```env
AUTH_CHALLENGE_TTL_SECONDS=300
```

or another documented value.

The actual expiration should be enforced by backend logic.

Expired challenges must fail verification.

Do not silently accept stale challenges.

---

# 16. AUTHENTICATION MESSAGE

Define one canonical sign-in message format.

It should make clear:

```text
application/domain
wallet address
chain ID
nonce
issued time
expiration
purpose
```

The exact message format must be consistent between:

```text
challenge creation
MetaMask signing
backend verification
```

Do not parse arbitrary user-provided message text as authentication.

Do not accept a signature over a different message.

---

# 17. SIGNATURE VERIFICATION

Implement:

```text
POST /api/auth/verify
```

The backend must:

1. validate request structure
2. retrieve the actual stored challenge
3. check expiration
4. reconstruct or obtain the exact expected message
5. verify the signature cryptographically
6. recover the signing address
7. compare it with the challenged wallet address
8. consume the challenge
9. issue a JWT

Do not trust an address submitted alongside the signature without cryptographic verification.

The signature itself is the proof.

---

# 18. JWT CONTENT

JWT should contain only the minimum necessary identity/session claims.

Potential claims:

```text
sub → wallet address
chainId
iat
exp
jti
```

Do not put:

```text
document contents
AES key
IPFS API secret
private key
password
large document metadata
```

into JWT.

---

# 19. JWT SIGNING

Use a strong secret obtained from:

```text
AUTH_JWT_SECRET
```

The signing secret must be:

- generated securely
- stored server-side
- absent from Git
- absent from frontend
- absent from responses
- absent from logs

Do not hard-code:

```text
secret
password
jwt-secret
123456
```

Do not use a wallet private key as the JWT signing secret.

---

# 20. JWT VALIDATION MIDDLEWARE

Create authenticated middleware that:

1. reads `Authorization: Bearer <token>`
2. validates token signature
3. validates expiration
4. validates required claims
5. attaches verified wallet identity to request context
6. rejects invalid tokens
7. rejects expired tokens

Do not accept wallet identity supplied separately by the client when a verified JWT already exists.

The request identity should come from the verified token.

---

# 21. AUTHORIZATION VS AUTHENTICATION

Keep the distinction clear:

```text
Authentication:
Who controls this wallet?

Authorization:
Does this wallet own/access this document?
```

JWT proves the server accepted a wallet-signature authentication event.

Document ownership and document permissions must still come from:

```text
DocumentRegistry
AccessControl
```

Do not let JWT claims override blockchain state.

---

# 22. API ENDPOINTS

Implement the endpoints defined by the project architecture.

Required:

```text
POST /api/auth/challenge
POST /api/auth/verify

POST /api/ipfs/upload
GET  /api/ipfs/:cid

GET  /api/documents
GET  /api/documents/:id

POST /api/verify

GET  /api/audit/:documentId
```

Use the exact documented API contract after inspecting `docs/api.md`.

Do not add unrelated endpoints.

---

# 23. `POST /api/ipfs/upload`

Purpose:

> Upload an encrypted document payload to the real IPFS service.

Authentication:

```text
required
```

Input:

```text
encrypted payload
```

The endpoint must NOT accept arbitrary plaintext document uploads.

Validate:

- content type
- payload structure
- Phase 8 version
- IV
- ciphertext/tag
- size limits
- authentication

Then:

```text
backend
  ↓
IPFS service
  ↓
real Pinata
  ↓
real CID
```

Return only real provider-derived information.

Do not return fake CIDs.

---

# 24. IPFS UPLOAD FAILURE

If Pinata/IPFS fails:

```text
HTTP error
no CID
no fake fallback
```

Do not write anything to blockchain.

Do not return:

```json
{
  "success": true,
  "cid": "demo..."
}
```

The API must fail honestly.

---

# 25. `GET /api/ipfs/:cid`

Purpose:

> Retrieve the real encrypted payload associated with a CID.

Authentication:

```text
required
```

The backend must:

1. validate CID
2. retrieve actual bytes from the IPFS service
3. validate encrypted payload structure
4. return the encrypted payload

Do not decrypt it on the server merely to make the endpoint convenient unless explicitly required by the documented architecture.

Do not expose AES keys.

Do not return plaintext.

---

# 26. CID ACCESS CONTROL

Do not assume possession of a CID is sufficient authorization.

The route should require authenticated application identity.

Where document association is known, authorization should be based on:

```text
DocumentRegistry
+
AccessControl
```

not solely on:

```text
"the user knows the CID"
```

Document the exact Phase 10 authorization scope.

Do not invent a public-secret model.

---

# 27. `GET /api/documents`

Purpose:

> Return document records that the authenticated wallet is authorized to view.

At minimum, support the authenticated owner's documents using actual DocumentRegistry state.

If DocumentRegistry exposes:

```text
userDocuments
```

use the actual on-chain list.

Do not synthesize documents.

Do not return seeded/sample records.

Do not invent enumeration for permissions that the contracts do not actually expose.

If the contract cannot efficiently enumerate all accessible documents for a verifier, document that limitation rather than fabricating an off-chain list.

---

# 28. `GET /api/documents/:id`

Return the actual blockchain document metadata.

Potential response fields:

```text
documentId
owner
documentHash
ipfsCid
registeredAt
revoked
```

Values must come from actual DocumentRegistry state.

Do not add:

```text
fake filename
fake description
fake status
fake creation date
```

unless such metadata genuinely exists in the authoritative source.

---

# 29. DOCUMENT AUTHORIZATION

For a requested document:

1. authenticate wallet via JWT
2. read actual DocumentRegistry state
3. determine actual owner
4. determine actual document status
5. where appropriate, query AccessControl
6. allow/deny based on actual on-chain state

Do not trust a client-provided:

```text
owner
verifier
userId
role
permission
```

as authoritative.

---

# 30. `POST /api/verify`

Purpose:

> Compare a real SHA-256 digest produced from the user's actual document bytes against the authoritative on-chain document hash while respecting blockchain authorization/revocation state.

Important:

The endpoint must NOT require plaintext document upload if the frontend has already calculated the SHA-256 hash locally.

Preferred flow:

```text
Real user document
       ↓
Phase 8 client-side SHA-256
       ↓
computedHash
       ↓
POST /api/verify
       ↓
backend reads DocumentRegistry
       ↓
backend reads AccessControl / revocation
       ↓
compare actual hash
       ↓
real verification result
```

This preserves the client-side cryptographic boundary.

---

# 31. VERIFICATION INPUT

The API may accept:

```text
documentId
computedHash
```

plus authenticated identity.

Validate that:

```text
computedHash
```
is a real 32-byte SHA-256 representation in the project's canonical format.

Do not accept:

```text
arbitrary status
verified=true
revoked=false
```

as client-controlled truth.

---

# 32. VERIFICATION DECISION

A valid verification result must consider:

```text
document exists
AND
requesting wallet is authorized
AND
document is not revoked
AND
computed SHA-256 == on-chain documentHash
```

Return a deterministic status such as:

```text
VERIFIED
HASH_MISMATCH
REVOKED
UNAUTHORIZED
NOT_FOUND
```

The result must be based on actual runtime reads/computation.

Do not return `VERIFIED` merely because the endpoint was called successfully.

---

# 33. VERIFICATION BOUNDARY

Do not call Phase 10 the complete UI verification system.

This API is the backend verification service.

The later frontend verification experience may add:

```text
actual file selection
hashing
IPFS retrieval
decryption
visual status
audit display
```

Do not build those UI flows here.

---

# 34. `GET /api/audit/:documentId`

Purpose:

> Return the actual audit history derived from blockchain events.

The audit source must be:

```text
real blockchain logs/events
```

Never:

```text
button clicks
frontend state
localStorage
API request logs alone
fake timestamps
```

---

# 35. AUDIT EVENTS

Read actual events from:

### DocumentRegistry

```text
DocumentRegistered
DocumentRevoked
```

### AccessControl

```text
AccessGranted
AccessRevoked
```

Use actual transaction metadata where available:

```text
transaction hash
block number
block timestamp
event arguments
contract address
chain ID
```

Do not fabricate missing fields.

---

# 36. AUDIT ORDERING

Sort audit events deterministically using real blockchain ordering.

Prefer:

```text
block number
transaction index
log index
```

or the exact equivalent available from the provider.

Do not sort only by local API arrival time.

Do not use fabricated timestamps.

---

# 37. AUDIT RESPONSE

The API should return a normalized representation while preserving provenance.

A useful structure could include:

```text
type
documentId
actor
transactionHash
blockNumber
timestamp
contract
event
details
```

Only include fields that can be sourced from actual blockchain data.

If a provider cannot return a field:

```text
null/omitted
```

is preferable to fabrication.

---

# 38. BLOCKCHAIN SERVICE

Implement a dedicated read-only blockchain service.

It should:

- connect to the configured provider
- verify chain ID
- load actual contract addresses
- load generated ABIs
- instantiate DocumentRegistry
- instantiate AccessControl
- perform read-only calls
- query actual event logs
- return normalized real data

Do not expose a generic arbitrary contract-execution endpoint.

---

# 39. READ-ONLY SERVER BLOCKCHAIN ACCESS

Phase 10 backend blockchain operations should be read-only.

Do not store or use a blockchain private key for server-side document registration.

User-authorized blockchain writes continue to be performed with:

```text
MetaMask
ethers.js
user wallet
```

The backend must not impersonate the user.

This is important:

```text
Backend
→ reads blockchain

MetaMask
→ signs user-authorized blockchain writes
```

---

# 40. TRANSACTION SOURCE OF TRUTH

The backend must never fabricate:

```text
transaction hash
block number
gas used
receipt
contract address
timestamp
```

If a transaction was not actually executed:

```text
do not report it as executed
```

Phase 10 should primarily expose actual reads and API services.

Later frontend integration will handle real user-signed write transactions.

---

# 41. IPFS SERVICE INTEGRATION

Use the real Phase 9 IPFS service.

Do not duplicate Pinata API code inside every controller.

Preferred:

```text
Controller
   ↓
IPFS service
   ↓
Pinata
```

The JWT must remain server-side.

Do not expose:

```text
IPFS_JWT
```

in API responses.

---

# 42. CRYPTOGRAPHY BOUNDARY

Use Phase 8 services.

Do not rewrite AES-GCM or SHA-256 inside controllers.

Do not create duplicate cryptographic implementations.

The API layer should consume the established cryptographic primitives.

---

# 43. ERROR MODEL

Create a consistent API error format.

For example:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document was not found."
  }
}
```

Do not expose:

- stack traces
- private credentials
- raw provider secrets
- internal filesystem paths unnecessarily
- database credentials
- JWT secret

Error codes should correspond to real failure conditions.

---

# 44. HTTP STATUS CODES

Use semantically appropriate status codes.

For example:

```text
400 → malformed request
401 → missing/invalid authentication
403 → authenticated but not authorized
404 → resource not found
409 → conflict
422 → semantically invalid input
429 → rate limited
502/503 → dependency unavailable
500 → unexpected internal error
```

Do not return:

```text
200 OK
```

for failed blockchain/IPFS/verification operations merely to simplify frontend handling.

---

# 45. REQUEST VALIDATION

Validate all request bodies/params.

Validate:

```text
wallet address format
signature
challenge
document ID
CID
hash
JWT
```

Do not trust client JSON structure.

Use a schema-validation library if the repository already uses one or it is appropriate.

Do not create duplicate validation systems.

---

# 46. SECURITY HEADERS

Use an appropriate security middleware such as Helmet or the project's established equivalent.

Do not claim that headers alone make the API secure.

Document the applied protections.

---

# 47. LOGGING

Log operational metadata only.

Acceptable examples:

```text
request ID
route
status
duration
error code
chain ID
contract address
```

Do not log:

```text
JWT
JWT secret
Pinata JWT
Pinata API secret
AES key
private key
seed phrase
plaintext document
```

Use structured logging if already present.

---

# 48. REQUEST IDs

Where practical, assign a request/correlation ID.

Use it to correlate:

```text
API error
blockchain read
IPFS operation
```

Do not use request IDs as document IDs or wallet identities.

Do not present them as blockchain transaction IDs.

---

# 49. TIMEOUTS

Configure reasonable timeouts for:

```text
IPFS requests
blockchain RPC calls
authentication operations
verification
```

Do not let a dependency hang indefinitely.

If a dependency times out:

```text
return honest dependency-unavailable state
```

Do not fake success.

---

# 50. RETRY POLICY

Only retry operations where retrying is safe.

For example:

```text
read-only blockchain query
```

may be retried.

For uploads:

```text
retry only when provider semantics make the operation safe
```

Do not generate a fake CID after timeout.

Do not report ambiguous operations as successful.

---

# 51. HEALTH ENDPOINT

If implemented, keep health/readiness truthful.

For example:

```text
GET /health
```

may report the API process itself is running.

A deeper readiness endpoint can separately check:

```text
RPC connectivity
IPFS configuration
```

Do not claim:

```text
all dependencies healthy
```

when a critical dependency is actually unavailable.

---

# 52. NO SYNTHETIC API RESPONSES

Under no circumstance use:

```text
mock JSON
demo API result
fallback document
sample CID
fake audit event
fake blockchain result
```

The API must fail honestly when dependencies are unavailable.

---

# 53. TESTING — AUTHENTICATION

Create tests for:

### Challenge

- successful challenge
- nonce randomness/source
- expiration
- single-use behavior
- malformed wallet address
- rate limiting where applicable

### Signature

- valid signature succeeds
- wrong signature fails
- wrong wallet fails
- altered message fails
- expired challenge fails
- replayed challenge fails

### JWT

- valid JWT accepted
- modified JWT rejected
- expired JWT rejected
- missing JWT rejected
- malformed JWT rejected

Do not use a hard-coded production JWT secret in source code.

Test secrets must be isolated from production configuration.

---

# 54. TESTING — IPFS API

Test:

- authenticated upload
- malformed encrypted payload
- real provider failure
- real CID returned
- CID retrieval
- unknown CID
- provider timeout
- credential absence
- no credential leakage

Use the real Phase 9 service.

Where practical, run a real Pinata integration test in addition to mocked unit/error tests.

---

# 55. TESTING — DOCUMENT APIs

Test:

### `GET /api/documents`

- authenticated owner
- empty real state
- unauthorized user
- actual on-chain result

### `GET /api/documents/:id`

- existing document
- unknown document
- unauthorized wallet
- revoked document

Do not seed fake documents merely to make endpoint tests pass.

Use real local blockchain test fixtures in isolated tests.

---

# 56. TESTING — VERIFICATION

Test:

```text
correct real hash
→ VERIFIED
```

```text
different hash
→ HASH_MISMATCH
```

```text
revoked document
→ REVOKED
```

```text
unauthorized wallet
→ UNAUTHORIZED
```

```text
unknown document
→ NOT_FOUND
```

The result must come from actual contract state and actual hash comparison.

---

# 57. TESTING — AUDIT

Test:

```text
register
grant
revoke access
revoke document
```

Then query:

```text
GET /api/audit/:documentId
```

Verify the endpoint returns the actual emitted events with actual transaction/block information.

Do not generate audit entries manually.

---

# 58. INTEGRATION TEST

Perform at least one complete backend integration flow:

```text
real wallet challenge
      ↓
real MetaMask signature or controlled integration equivalent
      ↓
real JWT
      ↓
authenticated API request
      ↓
real local blockchain document state
      ↓
real AccessControl state
      ↓
real IPFS CID
      ↓
verification/audit response
```

For automated environments where MetaMask cannot be controlled, separate:

```text
authentication cryptographic tests
```

from:

```text
live local blockchain/IPFS integration tests
```

Do not fake MetaMask signatures in production code.

---

# 59. CREDENTIAL AUDIT

Inspect:

```text
source
frontend bundle
logs
responses
Git diff
.gitignore
.env.example
```

Confirm:

- `IPFS_JWT` is server-side only
- `AUTH_JWT_SECRET` is server-side only
- no private key exists
- no seed phrase exists
- no secrets appear in responses
- no secrets appear in frontend code

---

# 60. API DOCUMENTATION

Create/update:

```text
docs/api.md
docs/security.md
docs/requirements-traceability.md
```

`docs/api.md` must document:

1. Base API
2. Authentication flow
3. Challenge endpoint
4. Verify endpoint
5. JWT structure
6. Protected endpoints
7. IPFS upload
8. IPFS retrieval
9. Document list
10. Document detail
11. Verification
12. Audit
13. Request schemas
14. Response schemas
15. Error codes
16. Authentication requirements
17. Authorization rules
18. Rate limiting
19. Security headers
20. Dependency failure behavior

Only document endpoints that actually exist.

---

# 61. API CONTRACT STABILITY

Do not casually change endpoint names or response fields after implementing them.

Keep contracts consistent with:

```text
docs/api.md
frontend integration expectations
MASTER_PLAN.md
```

If a change is necessary:

1. update documentation
2. update tests
3. update traceability
4. report the change

---

# 62. PERFORMANCE

Measure actual backend latency for:

- blockchain reads
- IPFS upload
- IPFS retrieval
- verification
- audit query

Do not hard-code a guarantee like:

```text
verification always < 2 seconds
```

Instead report observed measurements.

If the architecture currently contains a `<2s` target, treat it as a measurable performance target rather than a correctness guarantee.

---

# 63. ENVIRONMENT CONFIGURATION

Validate environment variables at startup.

Fail clearly when required configuration is missing.

For example:

```text
IPFS_JWT missing
```

should produce a startup/configuration error for environments where Pinata integration is enabled.

Do not silently use:

```text
fake JWT
default secret
localhost fallback
sample contract address
```

---

# 64. CONTRACT ADDRESS SOURCE

Use the actual generated deployment artifacts or environment configuration.

Do not hard-code:

```text
DocumentRegistry address
AccessControl address
```

as fabricated constants.

Verify that the configured addresses belong to the expected network/chain.

---

# 65. CHAIN ID VALIDATION

The backend blockchain service must verify that the connected provider/network matches the expected configured chain.

Do not report:

```text
chain ID = expected
```

unless the provider confirms it.

Do not silently connect to another chain.

---

# 66. PRODUCTION BOUNDARIES

Phase 10 is a development/integration API layer.

Do not claim that it is production-hardened against:

- DDoS
- distributed replay at scale
- multi-region failures
- hardware compromise
- key rotation infrastructure
- enterprise secrets management

Document meaningful limitations honestly.

---

# 67. NO PUBLIC TESTNET REQUIREMENT

Phase 10 can continue using the local Hardhat environment for blockchain integration.

Do not require:

```text
Alchemy
Infura
QuickNode
```

for the local implementation.

A public RPC credential can be added later when the project intentionally moves to a public testnet.

---

# 68. ACCEPTANCE CRITERIA

Phase 10 is complete only when:

- [ ] Node.js/Express API server exists.
- [ ] TypeScript backend structure is clean.
- [ ] Environment configuration is validated.
- [ ] CORS is configured correctly.
- [ ] Security headers are applied.
- [ ] Rate limiting is applied to sensitive routes.
- [ ] Centralized error handling exists.
- [ ] Real wallet challenge generation exists.
- [ ] Challenges are cryptographically random.
- [ ] Challenges expire.
- [ ] Challenges are single-use.
- [ ] Real wallet signatures are verified cryptographically.
- [ ] JWT is issued only after successful signature verification.
- [ ] JWT validation middleware exists.
- [ ] JWT signing secret is server-side only.
- [ ] IPFS JWT remains server-side only.
- [ ] `/api/ipfs/upload` uses the real Phase 9 IPFS service.
- [ ] `/api/ipfs/:cid` retrieves real encrypted payloads.
- [ ] `/api/documents` reads real DocumentRegistry state.
- [ ] `/api/documents/:id` reads real blockchain state.
- [ ] `/api/verify` compares a real computed SHA-256 digest against actual on-chain state and authorization/revocation state.
- [ ] `/api/audit/:documentId` reads actual blockchain events.
- [ ] No audit events are fabricated from API actions.
- [ ] No fake CIDs exist in runtime code.
- [ ] No fake documents exist in runtime responses.
- [ ] No fake wallet identities exist.
- [ ] No blockchain private key is stored server-side.
- [ ] No IPFS secret is exposed client-side.
- [ ] Authentication replay tests pass.
- [ ] Authorization tests pass.
- [ ] IPFS integration tests pass.
- [ ] Blockchain integration tests pass.
- [ ] Verification tests pass.
- [ ] Audit tests pass.
- [ ] Full existing Phase 3–9 test suites remain passing.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.

---

# 69. SYNTHETIC DATA AUDIT

Before completion, search the repository for:

```text
fake
mock
demo
dummy
sample
seed
hardcoded wallet
hardcoded CID
hardcoded tx hash
fake audit
fake verification
fallback data
fallback API
```

For every match, classify it as:

```text
test fixture
documentation example
actual runtime value
```

Any synthetic runtime API data must be removed.

Do not remove legitimate isolated test fixtures.

---

# 70. SECRET / CREDENTIAL AUDIT

Search for:

```text
IPFS_JWT
IPFS_API_KEY
IPFS_API_SECRET
AUTH_JWT_SECRET
PRIVATE_KEY
SEED_PHRASE
NEXT_PUBLIC_
Authorization
Bearer
```

Verify:

- secrets are not committed
- `.env` is ignored
- `.env.example` contains placeholders only
- secrets are not returned by APIs
- secrets are not sent to the frontend
- secrets are not logged
- no private key exists in backend runtime configuration

Do not print secret values in the final report.

---

# 71. FINAL PHASE REPORT

At the end of Phase 10, provide exactly these sections:

## Phase 10 Status

One of:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Backend Architecture

Describe the actual backend structure implemented.

## Authentication

Describe:

```text
challenge
signature verification
JWT
expiration
replay protection
```

## API Endpoints

List actual implemented endpoints.

## Blockchain Integration

Report:

```text
chain
DocumentRegistry address
AccessControl address
read operations
event queries
```

Only report actual configured values.

## IPFS Integration

Describe how the Phase 9 service is consumed.

Do not print the JWT.

## Verification

Describe the real verification decision logic implemented.

## Audit

Describe how actual blockchain events are retrieved and normalized.

## Tests

List:

```text
backend tests
authentication tests
IPFS tests
blockchain tests
verification tests
audit tests
full regression result
```

## Security Audit

State the actual credential/secret exposure findings.

## Synthetic Data Audit

State whether fake/mock/demo runtime data was introduced.

## Files Created/Modified

List important files.

## Known Limitations

State genuine limitations.

## Deferred Work

Explicitly state what remains for later phases, including:

- frontend integration
- complete document-upload workflow
- complete sharing/revocation UX
- IdentityRegistry
- production/public network deployment
- full verification UI
- audit UI

---

# 72. STOP CONDITION

When Phase 10 is complete:

1. Run backend compilation/type checking.
2. Run backend unit tests.
3. Run authentication security tests.
4. Run real local blockchain integration.
5. Run real IPFS integration.
6. Run document API tests.
7. Run verification tests.
8. Run audit tests.
9. Run complete regression suite from Phases 3–9.
10. Audit synthetic runtime data.
11. Audit secrets/credentials.
12. Verify no server secret reaches the frontend.
13. Update `docs/api.md`.
14. Update `docs/security.md`.
15. Update `docs/requirements-traceability.md`.
16. Verify against `ai_rules.md`.
17. Verify against `MASTER_PLAN.md`.
18. Verify against Phase 1–9 artifacts.
19. Produce the final report.
20. STOP.

Do not automatically start Phase 11.

Do not build the complete frontend.

Do not implement IdentityRegistry.

Do not add public testnet credentials.

Do not add mock API responses.

---

# CORE PRINCIPLE

> **Phase 10 creates the real server-side API boundary between the frontend, blockchain, and IPFS. Authentication must come from real wallet signatures, authorization must come from real blockchain state, documents/CIDs/audit records must come from real services, and failures must remain honest. No private keys, API secrets, fake data, or simulated blockchain/IPFS responses may enter the backend.**
