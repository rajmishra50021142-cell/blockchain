# PHASE 4 — WALLET & IDENTITY INTEGRATION

## Purpose

Implement the **real wallet and identity foundation** for the Blockchain-Based Digital Document Locker.

This phase is strictly limited to **real MetaMask wallet integration and wallet-based identity/proof-of-ownership primitives**.

Do not implement later-phase functionality such as smart contracts, IPFS, document encryption, document registration, production authentication APIs, sharing, revocation, document verification, or audit logging.

The application must continue to follow the project's governing **real-runtime-data / no-synthetic-data policy**.

---

# 1. GOVERNING DOCUMENTS — READ FIRST

Before changing anything, read all of the following completely:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `PHASE_3_PROMPT.md`
6. `docs/requirements.md`
7. `docs/requirements-traceability.md`
8. `docs/architecture.md`
9. `docs/api.md`
10. `docs/security.md`
11. All relevant Phase 3 blockchain/network implementation files
12. The supplied reference PPT and mandatory requirements image if they are available in the repository/context

Treat these documents as the project's source of truth.

Do not silently replace their architecture or requirements with a different design.

If there is a conflict, stop and report it instead of inventing a solution.

---

# 2. PHASE BOUNDARY

This phase is:

> **Wallet & Identity Foundation**

This phase IS responsible for:

- Real MetaMask detection
- Real wallet connection
- Real connected account/address retrieval
- Real chain/network detection
- Real chain-ID validation
- Real account-change handling
- Real network-change handling
- Real disconnect/reset handling
- Real wallet signature capability
- Real signature verification using the corresponding wallet address
- Clear identity state in the frontend
- Honest wallet/error/empty/loading states
- Documentation of the wallet and identity flow
- Preparation for later authentication and IdentityRegistry integration

This phase is NOT responsible for:

- Deploying or implementing IdentityRegistry
- Deploying or implementing DocumentRegistry
- Deploying or implementing AccessControl
- IPFS
- AES-256-GCM document encryption
- Document upload
- Document hashing for registration
- Document registration
- Sharing
- Revocation
- Verification workflow
- Audit trail
- Production JWT authentication
- Backend authentication APIs
- `/api/auth/challenge`
- `/api/auth/verify`
- Database-backed sessions
- Cloud/public RPC migration
- External API keys
- Testnet deployment
- Fake/demo users or wallets

Do not pull later phases into this phase.

---

# 3. NON-SYNTHETIC DATA RULE

The project must use real runtime values only.

Never create:

- fake wallet addresses
- fake account balances
- fake signatures
- fake transaction hashes
- fake chain IDs presented as runtime results
- fake wallet names
- fake users
- fake authentication success
- fake network state
- seeded/demo identity records
- hard-coded identity records
- fallback wallet data
- placeholder blockchain responses shown as real application state

The following values must come from real runtime sources:

| Data | Required Source |
|---|---|
| Wallet address | MetaMask / `window.ethereum` |
| Connected chain ID | MetaMask provider |
| Wallet connection status | MetaMask provider |
| Account changes | MetaMask provider events |
| Signature | Real user action through MetaMask |
| Signature verification | Real cryptographic verification |
| Balance | Real blockchain provider |
| Provider state | Actual wallet/provider |
| Errors | Actual runtime failure |

If MetaMask is unavailable, disconnected, locked, on the wrong network, or rejects a request:

> Show the real error/state.

Do not replace it with a success state.

---

# 4. USE THE REAL LOCAL BLOCKCHAIN FROM PHASE 3

Use the actual local blockchain environment established in Phase 3.

Expected development flow:

```text
Next.js frontend
        ↓
ethers.js / browser provider
        ↓
MetaMask
        ↓
Local Hardhat network
```

Do not introduce an external RPC provider in this phase.

Do not add Alchemy, Infura, QuickNode, or another hosted RPC provider.

Do not request or invent RPC credentials.

Public testnet RPC configuration belongs to a later phase.

---

# 5. METAMASK INTEGRATION

Implement real MetaMask connectivity using the project's established frontend technology and `ethers.js`.

The frontend must:

1. Detect whether an injected Ethereum wallet/provider is available.
2. Detect MetaMask when possible.
3. Allow the user to explicitly connect the wallet.
4. Request real accounts using the provider.
5. Retrieve the actual selected wallet address.
6. Retrieve the actual chain ID.
7. Compare the connected chain against the project's configured development chain.
8. Display the actual wallet connection state.
9. Respond to account changes.
10. Respond to chain/network changes.
11. Reset wallet-dependent UI state when the wallet disconnects or becomes unusable.
12. Never auto-create an application wallet.

Do not silently connect another wallet.

Do not use generated private keys in browser code.

Do not place private keys or seed phrases anywhere in the repository.

---

# 6. NETWORK VALIDATION

The wallet integration must use the actual chain information exposed by MetaMask.

The application should distinguish at minimum:

```text
Wallet unavailable
Wallet available but disconnected
Connected to expected development network
Connected to an unexpected network
Account changed
Network changed
Wallet request rejected
Provider error
```

Do not simply display:

```text
Connected to Hardhat
```

unless the actual provider reports the expected chain.

The configured expected chain should come from the project's configuration/environment strategy rather than embedding fake runtime state into components.

If a development chain identifier is required by the existing architecture, use the established configuration consistently.

Do not create a second competing configuration system.

---

# 7. WALLET STATE MODEL

Create a deterministic wallet state model.

At minimum, support states equivalent to:

```text
initializing
wallet-unavailable
disconnected
connecting
connected
wrong-network
account-changed
error
```

Use the project's existing UI state/error conventions where already defined.

The UI must clearly distinguish:

- no wallet installed
- wallet installed but not connected
- connection currently being requested
- connected wallet
- wrong network
- user rejected the request
- provider failure

Do not show a generic success state for all outcomes.

---

# 8. ACCOUNT CHANGE HANDLING

Listen for real provider events.

When MetaMask changes the selected account:

1. Read the new actual account.
2. Update frontend state.
3. Clear state associated with the previous wallet where appropriate.
4. Recompute wallet identity information.
5. Require a new user-authorized signature if proof of ownership is needed.
6. Never assume the new account is the previous user.

A changed account must never inherit authenticated/verified state belonging to another account.

Do not implement fake identity persistence.

---

# 9. NETWORK CHANGE HANDLING

Listen for real chain/network changes.

When the connected network changes:

1. Read the new actual chain ID.
2. Re-evaluate whether it matches the expected development network.
3. Update the UI.
4. Disable wallet-dependent operations if the network is unsupported.
5. Do not pretend transactions would be sent to the expected chain when MetaMask is actually connected elsewhere.

No fake network switching.

Do not silently override the user's wallet.

If network switching is implemented, it must use the real wallet provider request and handle rejection honestly.

---

# 10. REAL WALLET SIGNATURE FOUNDATION

Implement a real wallet-signature capability that can be used later by the authentication layer.

Important:

This phase must NOT pretend that a locally generated message is already production authentication.

A wallet signature is only proof that the connected wallet authorized a particular message.

For the Phase 4 foundation, implement a genuine user-initiated proof-of-ownership/signature flow using:

- the actual connected wallet address
- the actual connected chain ID
- an actual runtime-generated nonce/challenge value
- an explicit human-readable message
- the real MetaMask signing request
- real signature verification

The nonce must be generated at runtime using a cryptographically appropriate mechanism.

Do not hard-code a fixed challenge such as:

```text
123456
hello
test
abc
```

Do not hard-code a signature.

Do not store a private key to produce the signature.

Do not simulate signing in JavaScript.

---

# 11. IMPORTANT AUTHENTICATION LIMITATION

Production authentication belongs to a later phase.

Do NOT implement the final authentication API in Phase 4.

Do not create:

```text
POST /api/auth/challenge
POST /api/auth/verify
JWT session management
```

unless those endpoints are explicitly part of an already-existing Phase 4 implementation and are required by the frozen architecture.

For Phase 4, the objective is to establish the real wallet-signing primitive and its verification.

Later, Phase 10 will integrate the proper backend challenge/verification flow.

Document this separation clearly.

---

# 12. SIGNATURE VERIFICATION

After MetaMask produces a signature:

1. Keep the exact message that the user signed.
2. Keep the exact signature returned by the wallet.
3. Verify the signature cryptographically.
4. Recover/derive the signing address from the signature.
5. Compare it against the wallet address that initiated the signing action.
6. Mark proof-of-ownership as successful only when the real cryptographic verification succeeds.

The UI must not say "verified" merely because MetaMask returned without an exception.

A valid result requires actual verification.

If verification fails:

```text
proof-of-ownership = failed
```

and show the real failure.

Never fabricate a successful verification.

---

# 13. IDENTITY MODEL

For Phase 4, treat the wallet address as the current real identity anchor.

The identity model should be conceptually:

```text
MetaMask wallet
      ↓
Ethereum address
      ↓
real wallet signature
      ↓
cryptographic proof of wallet control
```

Do not claim that a full W3C DID implementation exists unless the project actually implements a DID method/specification.

Do not invent DID documents.

Do not invent identity registry records.

The later IdentityRegistry contract may associate an on-chain identity with a wallet address, but that belongs to the smart-contract phases.

---

# 14. BALANCE / CHAIN INFORMATION

Where useful for the Phase 4 wallet screen, retrieve real provider data such as:

- wallet address
- chain ID
- native-token balance

All such values must come from the real connected provider.

Format them for display only.

Do not hard-code a sample balance.

Do not create a fake block number.

Do not create a fake transaction history.

If the balance cannot be retrieved, show the actual error/unknown state.

---

# 15. FRONTEND REQUIREMENTS

Integrate wallet functionality into the existing Next.js frontend architecture without redesigning the entire application.

Follow the already-established architecture.

Possible separation:

```text
wallet/provider layer
        ↓
wallet state/context/hook
        ↓
wallet UI components
        ↓
pages/features
```

Use the existing project conventions rather than creating unnecessary duplicate abstractions.

The UI should make the following obvious:

- Connect Wallet
- Current wallet/address
- Network/chain status
- Wallet error state
- Sign/Prove Ownership action where applicable
- Signature verification result
- Disconnect/reset state

Do not create fake dashboards or fake document data to make the page look populated.

An empty application is valid.

---

# 16. SECURITY REQUIREMENTS

Review and enforce these constraints:

### Never store

- private keys
- seed phrases
- MetaMask passwords
- wallet secrets
- application encryption keys
- fabricated authentication tokens

### Never expose

- server secrets in browser bundles
- API secrets in frontend source
- private credentials in committed code
- real `.env` values in Git

### Never trust

- a frontend "verified" flag as proof by itself
- user-entered wallet addresses as authoritative identity
- URL parameters as wallet identity
- localStorage as the source of truth for wallet ownership

Use the wallet/provider and cryptographic verification as the source of truth for this phase.

---

# 17. SOURCE-OF-TRUTH RULES

Maintain the existing source-of-truth architecture.

For Phase 4:

| Information | Authoritative Source |
|---|---|
| Current wallet address | Connected MetaMask/provider |
| Current chain | Connected MetaMask/provider |
| Signature | MetaMask |
| Signature validity | Cryptographic verification |
| Wallet balance | Blockchain provider |
| Contract state | Not implemented yet / later phases |
| DID registry state | Not implemented yet / later phases |
| Documents | Not implemented yet / later phases |
| IPFS | Not implemented yet / later phases |
| Audit trail | Not implemented yet / later phases |

The frontend is a presentation layer and must not invent authoritative values.

---

# 18. ERROR HANDLING

Every wallet operation must have honest failure handling.

Handle at minimum:

- MetaMask not installed
- provider unavailable
- user rejects account connection
- user rejects signature
- wrong network
- account changed
- chain changed
- provider disconnected
- provider request fails
- signature verification fails
- balance retrieval fails

Examples of acceptable behavior:

```text
Wallet not detected.
Please install/connect a compatible wallet.
```

```text
Signature request was rejected.
No proof of wallet ownership was created.
```

```text
Unsupported network.
Connect MetaMask to the configured development network.
```

Do not show:

```text
Success
```

when the underlying operation failed.

---

# 19. NO SYNTHETIC DATA / NO DEMO FALLBACK

Do not populate any screen with:

```text
Demo User
Demo Wallet
0x123...
Sample Address
Sample Signature
Fake Balance
Mock Network
Sample DID
Example User
Demo Transaction
```

Do not add fake data just to make the UI visually complete.

Use proper empty states.

For example:

```text
No wallet connected.
```

is valid.

---

# 20. ENVIRONMENT / CREDENTIAL RULES

Do not ask the user for API credentials in this phase.

Do not add:

- Alchemy key
- Infura key
- QuickNode key
- IPFS API credentials
- private keys
- deployment credentials

Real public RPC credentials are not required for the local Hardhat development environment.

Preserve `.env.example` and existing environment conventions.

Do not hard-code environment-specific secrets into the source code.

Do not commit `.env`.

---

# 21. DOCUMENTATION TO CREATE OR UPDATE

After implementation, create/update:

```text
docs/wallet-identity.md
docs/security.md
docs/requirements-traceability.md
```

`docs/wallet-identity.md` must explain:

1. MetaMask detection
2. Wallet connection flow
3. Provider architecture
4. Chain validation
5. Account-change handling
6. Network-change handling
7. Signature flow
8. Signature verification
9. Identity model
10. Error states
11. Security decisions
12. What is intentionally deferred to later phases

Do not document features that were not actually implemented.

---

# 22. TESTING REQUIREMENTS

Test using real runtime behavior.

At minimum verify:

### Wallet detection
- MetaMask/provider present
- MetaMask/provider absent

### Connection
- successful real connection
- user rejection

### Network
- expected development network
- unexpected network

### Account changes
- change account in MetaMask
- frontend reflects the new real address

### Signing
- real user signature
- user rejects signature

### Verification
- correct signature verifies
- altered message fails verification
- signature from another account does not verify against the original account

### Provider errors
- provider unavailable/fails
- balance retrieval failure if reproducible

### Refresh/reconnect
- reload page
- ensure the UI reflects actual wallet/provider state
- do not fabricate a connected state

Do not use fake transaction data to satisfy tests.

Where automated tests require deterministic inputs, use cryptographic test vectors or test fixtures strictly inside test code, and never surface them as real production application state.

---

# 23. ACCEPTANCE CRITERIA

Phase 4 is complete only when all of the following are true:

- [ ] MetaMask/provider is detected from the real browser environment.
- [ ] User can explicitly connect a real wallet.
- [ ] Real wallet address is displayed.
- [ ] Real chain ID is read from the provider.
- [ ] Wrong-network state is detected.
- [ ] Account changes are handled.
- [ ] Network changes are handled.
- [ ] Disconnect/provider errors are handled honestly.
- [ ] A real MetaMask signature can be requested.
- [ ] Signature verification is performed cryptographically.
- [ ] Proof-of-ownership succeeds only when the recovered signing address matches the expected wallet.
- [ ] No private key or seed phrase is stored.
- [ ] No fake wallet/address/signature/balance/network is used.
- [ ] No external API credentials were added.
- [ ] No later-phase smart-contract/IPFS functionality was implemented.
- [ ] Documentation is updated.
- [ ] Requirements traceability is updated.
- [ ] The implementation remains consistent with the frozen architecture.
- [ ] The application still works with honest empty/error states.

---

# 24. REQUIREMENTS TRACEABILITY

Update `docs/requirements-traceability.md` with the real Phase 4 implementation status.

Use statuses such as:

```text
Implemented
Partially Implemented
Deferred
Not Applicable
```

Do not mark something as implemented unless it is actually working.

Do not mark future IdentityRegistry functionality as implemented merely because wallet connection exists.

---

# 25. FINAL PHASE REPORT

At the end of the phase, provide a report containing exactly these sections:

## Phase 4 Status

State whether Phase 4 is:

```text
COMPLETE
PARTIALLY COMPLETE
BLOCKED
```

## Implemented

List only features actually implemented.

## Files Created/Modified

List every relevant file changed.

## Real Runtime Sources

For each important runtime value, state its real source.

Example:

```text
Wallet address → MetaMask
Chain ID → MetaMask provider
Signature → MetaMask
Signature verification → ethers.js cryptographic verification
Balance → connected blockchain provider
```

## Testing Performed

List actual tests and their results.

## Errors / Limitations

List unresolved issues honestly.

## Deferred to Later Phases

Explicitly identify functionality that belongs to later phases.

## Synthetic Data Audit

State whether any fake/demo/mock/seeded runtime data was introduced.

The answer must be based on an actual repository inspection.

## Credential Audit

Confirm that no API keys, private keys, seed phrases, or other secrets were inserted into source code.

---

# 26. STOP CONDITION

When Phase 4 is complete:

1. Verify the implementation against this prompt.
2. Verify against `ai_rules.md`.
3. Verify against `MASTER_PLAN.md`.
4. Verify against the Phase 1–3 artifacts.
5. Verify no synthetic runtime data was introduced.
6. Verify no later-phase functionality leaked into this phase.
7. Update the required documentation.
8. Provide the final phase report.
9. STOP.

Do not automatically start Phase 5.

Do not deploy smart contracts.

Do not integrate IPFS.

Do not implement document encryption.

Do not implement production backend authentication.

Do not add external API credentials.

---

# CORE PRINCIPLE

> **Real wallet. Real provider. Real user action. Real signature. Real cryptographic verification. Real runtime state. No fake identity, no simulated wallet, no hard-coded blockchain results, and no fallback data.**
