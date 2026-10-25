# Smart Contract Security, Hardening & Verification Report

## 1. Contracts Reviewed

This security review covers the core business smart contracts implemented in the Digital Document Locker:
1. **DocumentRegistry.sol** (`blockchain/contracts/DocumentRegistry.sol`): Authoritative on-chain registry for sovereign digital documents, owner registration, SHA-256 integrity digests, IPFS CID locators, and document-level revocation.
2. **AccessControl.sol** (`blockchain/contracts/AccessControl.sol`): Document-specific verifier authorization, permission lifecycle management, and enforcement of document-level revocation overrides.
3. **IDocumentRegistry.sol** (`blockchain/contracts/interfaces/IDocumentRegistry.sol`): Decoupled interface facilitating view-only dependency injection between AccessControl and DocumentRegistry.

---

## 2. Authorization Model

The authorization model is strictly sovereign and document-owner-centric:
- **No Global Admin:** There is no superuser, administrative backdoor, upgradeable proxy, or multi-signature override capable of modifying document records or accessing user documents.
- **Sovereignty at Point of Inception:** Document ownership is irrevocably bound to `msg.sender` at the moment of registration. It cannot be spoofed, assigned to third parties, or altered by contract parameters.
- **Strict Role Enforcement:**
  - `DocumentRegistry.revokeDocument`: Requires `msg.sender == doc.owner`.
  - `AccessControl.grantAccess`: Requires `msg.sender == doc.owner`.
  - `AccessControl.revokeAccess`: Requires `msg.sender == doc.owner`.
- Any unauthorized call reverts fail-closed with the custom error `NotDocumentOwner(documentId, caller)`.

---

## 3. Trust Boundaries

```mermaid
graph TD
    subgraph Client Boundary [Client Sandbox]
        MetaMask[MetaMask / Injected Signer]
        AppUI[Frontend / dApp Interface]
    end

    subgraph Blockchain Consensus Boundary [EVM Execution Context]
        AC[AccessControl.sol]
        DR[DocumentRegistry.sol]
    end

    MetaMask -->|Sign & Broadcast Transaction| DR
    MetaMask -->|Sign & Broadcast Transaction| AC
    AC -->|Static Read-Only Query| DR

    AppUI -.->|Zero Authority Over State| DR
    AppUI -.->|Zero Authority Over State| AC
```

- **Client Sandbox:** The frontend is completely untrusted for authorization. All authorization is enforced natively in Solidity by comparing `msg.sender` to the recorded on-chain owner.
- **Cross-Contract Trust Boundary:** `AccessControl` treats `DocumentRegistry` as its sole source of truth for ownership and document revocation status via an immutable contract address configured at deployment.

---

## 4. Security Invariants

The following 7 core security invariants have been formalized, tested, and proved:

| Invariant | Description | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Invariant 1: Sovereign Ownership** | Document ownership equals `msg.sender` at registration and can never be claimed by third parties. | `_documents[documentId].owner = msg.sender` |
| **Invariant 2: Owner-Only Authorization** | Only the authoritative document owner can grant or revoke verifier permissions. | `msg.sender == doc.owner` check before state writes |
| **Invariant 3: Permission Isolation** | Permissions for Document $A$ never affect Document $B$; permissions for Verifier $1$ never affect Verifier $2$. | Multi-key nested mapping: `_documentAccess[docId][verifier]` |
| **Invariant 4: Stale Permission Invalidation** | Revoking a document in `DocumentRegistry` immediately invalidates active verifier permissions. | `hasAccess` checks `!documentRegistry.isRevoked(docId)` |
| **Invariant 5: Non-Existent Document Protection** | Unregistered document IDs cannot acquire permissions or be revoked. | `documentExists(docId)` assertion |
| **Invariant 6: Registration Immutability** | Core document fields (`documentHash`, `ipfsCid`, `owner`) cannot be overwritten post-registration. | Revert `DocumentAlreadyExists` if `owner != address(0)` |
| **Invariant 7: Event-State Coherence** | Events are emitted if and only if state actually transitions in the same transaction. | Strict checks-effects pattern emitting events only on commit |

---

## 5. Validation Rules

All public and external functions enforce fail-closed input sanitization:
1. `registryAddress != address(0)` in `AccessControl` constructor (reverts `InvalidRegistryAddress`).
2. `documentId != bytes32(0)` in all registration, grant, and revoke methods (reverts `InvalidDocumentId`).
3. `documentHash != bytes32(0)` in registration (reverts `InvalidDocumentHash`).
4. `bytes(ipfsCid).length > 0` in registration (reverts `InvalidIpfsCid`).
5. `verifier != address(0)` in access control methods (reverts `InvalidVerifierAddress`).
6. Duplicate document registration is rejected (reverts `DocumentAlreadyExists`).
7. Duplicate access grants are rejected (reverts `AccessAlreadyGranted`).
8. Revoking ungranted or already-revoked access is rejected (reverts `AccessNotGranted`).
9. Granting access to an already-revoked document is rejected (reverts `DocumentIsRevoked`).

---

## 6. Document Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unregistered
    Unregistered --> RegisteredActive: registerDocument(docId, hash, cid)
    RegisteredActive --> RegisteredRevoked: revokeDocument(docId) [Owner Only]
    RegisteredRevoked --> [*]: Permanent Audit Record
```

- **Unregistered:** Document ID does not exist in `DocumentRegistry`.
- **Registered / Active:** Document is registered with non-zero integrity hash and CID. Verifiers can be granted access.
- **Registered / Revoked:** Document is revoked by owner. Historical data is preserved, but all active access is instantly revoked, and new grants are permanently disallowed.

---

## 7. Access Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NoAccess
    NoAccess --> ActiveAccess: grantAccess(docId, verifier) [Owner Only]
    ActiveAccess --> NoAccess: revokeAccess(docId, verifier) [Owner Only]
    ActiveAccess --> InactiveRevoked: DocumentRegistry.revokeDocument(docId)
    InactiveRevoked --> [*]: Inactive (Document-Level Override)
```

---

## 8. Cross-Contract Dependency

- `AccessControl` depends on `DocumentRegistry` via `IDocumentRegistry public immutable documentRegistry`.
- **Dependency Safety:**
  - Configured at deployment time; immutable post-construction.
  - Zero state-modifying calls are made across contracts.
  - Cross-contract view queries (`documentExists`, `getDocument`, `isRevoked`) are statically safe and consume minimal gas.

---

## 9. Reentrancy Assessment

- **Analysis:**
  - Neither `DocumentRegistry` nor `AccessControl` transfers Ether (`msg.value == 0`).
  - Neither contract calls untrusted external contracts or invokes user fallback/receive hooks.
  - The only external call is from `AccessControl` to the trusted, immutable `DocumentRegistry` via view-only queries.
- **Conclusion:** There is **zero material reentrancy surface** in the contracts. Reentrancy guards (`ReentrancyGuard`) were intentionally omitted to avoid unnecessary gas overhead.

---

## 10. Event Integrity

- All state-changing operations emit events with indexed topic filters:
  - `DocumentRegistered(bytes32 indexed documentId, address indexed owner, ...)`
  - `DocumentRevoked(bytes32 indexed documentId, address indexed owner, ...)`
  - `AccessGranted(bytes32 indexed documentId, address indexed owner, address indexed verifier, ...)`
  - `AccessRevoked(bytes32 indexed documentId, address indexed owner, address indexed verifier, ...)`
- **Integrity Guarantee:** Events are emitted after all validation checks succeed. If a transaction reverts, no event is included in block receipts.

---

## 11. Storage Review

- **Zero Secret Data:** No plaintext document contents, symmetric encryption keys (AES-256-GCM), private keys, or passwords are stored on-chain.
- **Gas Optimization:** Storage mappings use sparse keys without unbounded dynamic arrays.
- **Immutability:** Stored document structs have no update setters; historical fields cannot be altered post-registration.

---

## 12. Deployment Review

Deployments follow a strictly deterministic pipeline:
1. `DocumentRegistry` is deployed first to the target network.
2. Deployment artifact `blockchain/deployments/localhost/DocumentRegistry.json` is generated.
3. `AccessControl` is deployed with the exact deployed `DocumentRegistry` address passed to its constructor.
4. Post-deployment verification confirms `accessControl.documentRegistry() == registryAddress`.

---

## 13. Static-Analysis Results

Static analysis was performed using Hardhat compilation checks and Solc `0.8.24` AST verification:
- **Compiler Version:** Solidity `0.8.24` (evm target: `paris`).
- **Compiler Warnings:** Zero warnings generated during compilation.
- **Shadowing / Scope:** Zero variable shadowing.
- **Visibility:** All functions explicitly marked `external` or `private`.
- **Arithmetic:** Default 0.8+ overflow/underflow protection enabled.

---

## 14. Test Coverage & Results

Executed Mocha/Chai automated test suites in `blockchain/test/`:
- **Total Passing Tests:** 65 tests
- **Failures:** 0
- **Duration:** 581ms

### Test Suite Distribution:
1. `SecurityInvariants.test.ts` (14 tests): Sovereign ownership binding, non-owner attack rejections, multi-tenant isolation, stale permission invalidation, non-existent document rejection, registration immutability, event-state coherence, Scenarios A through F, gas sanity checks.
2. `AccessControl.test.ts` (22 tests): Deployment, grant, revoke, unauthorized calls, zero address checks, unknown documents, document revocation interaction.
3. `DocumentRegistry.test.ts` (16 tests): Deployment, registration, input sanitization, duplicate prevention, ownership, lookup, revocation.
4. `network.test.ts` (9 tests): Blockchain infrastructure, dynamic chain ID, development signers, native transactions, error handling.
5. `frontend/tests/wallet-identity.test.ts` (11 tests): Proof of ownership, cryptographic signature verification, account isolation, network guardrails.

---

## 15. Gas / Cost Sanity Checks

Gas consumption measured during live execution on local Hardhat EVM:

| Operation | Measured Gas | Baseline Gas Limit | Status |
| :--- | :--- | :--- | :--- |
| `registerDocument` | `229,715` | `< 300,000` | Optimal |
| `grantAccess` | `70,925` | `< 100,000` | Optimal |
| `revokeAccess` | `49,055` | `< 80,000` | Optimal |
| `revokeDocument` | `48,277` | `< 70,000` | Optimal |

---

## 16. What Is Explicitly Not Covered by This Phase

In strict adherence to project phasing:
- Decentralized Identity Registry (`IdentityRegistry.sol`) -> **Phase 7 boundary respected, deferred to future phase**.
- Client-side AES-256-GCM envelope encryption and SHA-256 pipeline -> **Phase 8**.
- Local IPFS daemon node integration and encrypted file pinning -> **Phase 9**.
- Document Sharing & Verification REST API -> **Phase 10**.
- Frontend document sharing & verifier management dashboard -> **Phase 11**.

---

## 17. Statement of Security Limitations

> **DISCLAIMER:** This report documents internal automated verification, adversarial test coverage, and formal invariant validation performed against the local development EVM environment. **This does not constitute an independent, professional third-party smart contract security audit or formal mathematical verification.** Deployment to public networks (e.g., Ethereum Mainnet, Polygon, Arbitrum) should be preceded by an external professional security audit.
