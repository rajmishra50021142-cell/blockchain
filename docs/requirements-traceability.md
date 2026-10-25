# Requirements Traceability Matrix
# Blockchain-Based Digital Document Locker

> **Document Status:** Active & Implemented (Phases 1–10 Implementation Verified)  
> **Document Version:** 2.0.0  
> **Traceability Scope:** Maps all mandatory course rubric items, presentation requirements, functional features, and non-functional governance constraints across implementation phases, components, verification tests, and demonstration evidence.

---

## 1. Traceability Matrix Structure

Each requirement is tracked with the following schema:
- **Requirement ID:** Unique identifier for cross-referencing.
- **Requirement Description:** Concise specification of the requirement.
- **Source:** Originating authority (`Mandatory Rubric`, `Project PPT`, `MASTER_PLAN.md`, `ai_rules.md`).
- **Implementation Phase:** The project phase in which the requirement is developed and integrated.
- **Expected Component:** Specific subsystem, smart contract, API, or UI module responsible.
- **Expected Test:** Unit, integration, or contract test validating fulfillment.
- **Expected Demonstration Evidence:** Concrete runtime artifact, transaction, or UI state shown during project review.
- **Status:** Current readiness state (`Frozen in Phase 1 & 2`, `Pending Phase X`).

---

## 2. Mandatory Rubric Requirements Traceability

| Requirement ID | Requirement | Source | Implementation Phase | Expected Component | Expected Test | Expected Demonstration Evidence | Status |
|---|---|---|---|---|---|---|---|
| **REQ-M01** | **Blockchain Network Setup**<br>Configure and deploy the required blockchain network, including nodes/peers, accounts, identities, and network connectivity. | Rubric Item 1 (`docs/mandatory-requirements.png`) | Phase 3 (Network Setup) | Hardhat Local EVM Node (port 8545), dynamic RPC provider, pre-funded accounts | `npm test`, `npm run health-check`, `npm run test-tx` | Dynamic runtime receipt with status 1, block inspection, live health check | **COMPLETE (Phase 3 Validated)** |
| **REQ-M02** | **Smart Contract Implementation**<br>Develop and deploy smart contracts in Solidity to implement core business logic; test contract functions, transaction handling, access control, and data storage to ensure correct and secure execution. | Rubric Item 2 (`docs/mandatory-requirements.png`) | Phase 3 (Smart Contracts) & Phase 4 (Contract Testing) | `DocumentRegistry.sol`, `AccessControl.sol`, `IdentityRegistry.sol` | Hardhat Chai/Mocha contract test suite (100% core coverage) | Contract deployment transaction hash, terminal test pass report, verified contract address | Frozen in Phase 1 (Pending Phase 3/4) |
| **REQ-M03** | **Frontend – Blockchain Integration**<br>Develop the frontend interface and connect it with the blockchain through suitable APIs; enable users to submit transactions, invoke contract functions, and retrieve blockchain data through the UI. | Rubric Item 3 (`docs/mandatory-requirements.png`) | Phase 7 (Frontend Integration) | Next.js, Tailwind CSS, `ethers.js` v6, MetaMask Provider | E2E browser integration tests, wallet state transition tests | Live UI displaying connected wallet address, contract interaction modals, mined block notifications | Frozen in Phase 1 (Pending Phase 7) |
| **REQ-M04** | **Functional Demonstration of Core Modules**<br>Demonstrate the major functional modules through real-time transactions and show the complete workflow from user input to blockchain confirmation; verify all modules produce expected outputs. | Rubric Item 4 (`docs/mandatory-requirements.png`) | Phase 12 (Core Modules Demo) & Phase 14 (Final E2E Demo) | End-to-End System (Next.js, Express, Contracts, IPFS) | Automated E2E verification test suite (`test/e2e.test.ts`) | Synchronous 21-step live demonstration of upload, registration, sharing, verification, tamper detection, and revocation | Frozen in Phase 1 (Pending Phase 12/14) |
| **REQ-M05** | **Code Quality, Documentation and Review Progress**<br>Maintain technical documentation covering architecture, setup steps, APIs, contract functions, testing results, and project progress. | Rubric Item 5 (`docs/mandatory-requirements.png`) | Phase 1 (Requirements), Phase 2 (Architecture), Phase 15 (Final Review) | `docs/` repository specifications, `README.md`, setup guides | Markdown linting, requirement audit, documentation completeness review | Comprehensive `docs/` suite, automated test logs, review milestone evidence | Frozen in Phase 1 & 2 (Requirements & Architecture Complete) |

---

## 3. Project Presentation (`.pptx`) Scope Traceability

| Requirement ID | Requirement | Source | Implementation Phase | Expected Component | Expected Test | Expected Demonstration Evidence | Status |
|---|---|---|---|---|---|---|---|
| **REQ-PPT-01** | **Decentralized Storage Architecture**<br>Decentralized, fault-tolerant document storage replacing centralized DigiLocker server. | PPT Slide 7, 9, 10, 16 | Phase 5 (IPFS Storage) | IPFS Daemon / Pinata Pinning Gateway | IPFS connectivity test, pin verification test | Valid IPFS CID rendered in UI, verifiable on public gateway | Frozen in Phase 1 (Pending Phase 5) |
| **REQ-PPT-02** | **Cryptographic SHA-256 Verification**<br>Client-side fingerprint calculation for file change detection. | PPT Slide 7, 9, 11, 12 | Phase 6 (Crypto Module) | Web Crypto API / Node `crypto` engine | Hashing unit test comparing known NIST test vectors | Instant SHA-256 digest calculation displayed in UI upon file upload | Frozen in Phase 1 (Pending Phase 6) |
| **REQ-PPT-03** | **Immutable Blockchain Records**<br>Tamper-proof on-chain document proof and metadata. | PPT Slide 5, 7, 9, 12 | Phase 3 (Smart Contracts) | `DocumentRegistry.sol` | Re-registration rejection test, persistence test | Document ID lookup on blockchain returning owner and immutable timestamp | Frozen in Phase 1 (Pending Phase 3) |
| **REQ-PPT-04** | **Sovereign User Ownership**<br>Private-key/wallet-based control over document access and registration. | PPT Slide 7, 8, 13 | Phase 3 (Contracts) & Phase 7 (UI) | MetaMask / `AccessControl.sol` | Unauthorized access rejection test | MetaMask signature prompt for every state change; only owner can grant/revoke | Frozen in Phase 1 (Pending Phase 3/7) |
| **REQ-PPT-05** | **Instant Verification (< 2 Seconds)**<br>High-speed cryptographic verification without intermediary delays. | PPT Slide 8, 13 | Phase 8 (Verification Module) | Verification Service / UI | Latency benchmark test measuring verification duration | Real-time verification latency timer displayed in UI (< 2.0s) | Frozen in Phase 1 (Pending Phase 8) |
| **REQ-PPT-06** | **Client-Side AES-256-GCM Encryption**<br>Data at rest protected via authenticated encryption prior to IPFS upload. | PPT Slide 7, 9, 11, 12 | Phase 6 (Crypto Module) | Client-Side Crypto Engine (`crypto.subtle`) | Ciphertext decryption and authentication tag validation tests | Encrypted ciphertext blob inspected prior to IPFS upload; plaintext never sent | Frozen in Phase 1 (Pending Phase 6) |
| **REQ-PPT-07** | **Decentralized Identity (DID) Authentication**<br>W3C DID-oriented identity and Web3 challenge-response login. | PPT Slide 11, 12, 16 | Phase 3 (Contracts) & Phase 5 (Auth API) | `IdentityRegistry.sol` / `POST /api/auth/verify` | Signature recovery unit test, DID registration test | Wallet signs challenge nonce; UI reflects `did:ethr:<address>` | Frozen in Phase 1 (Pending Phase 3/5) |
| **REQ-PPT-08** | **Smart-Contract Access Governance**<br>On-chain document sharing and authorization management. | PPT Slide 9, 11, 12, 16 | Phase 3 (Contracts) & Phase 9 (Sharing) | `AccessControl.sol` | Grant access test, revoke access test, unauthorized check | On-chain authorization state toggle verified live between two distinct wallets | Frozen in Phase 1 (Pending Phase 3/9) |
| **REQ-PPT-09** | **Tamper Detection & Fraud Prevention**<br>Zero-trust verification instantly flagging altered documents. | PPT Slide 11, 13, 15 | Phase 8 (Verification Module) | Verification Engine (`POST /api/verify` / UI) | Tamper detection test with single-byte mutated file | Mutation of test document triggers explicit "TAMPER DETECTED" banner | Frozen in Phase 1 (Pending Phase 8) |
| **REQ-PPT-10** | **Immutable Audit Trail**<br>Permanent append-only historical log of all document lifecycle events. | PPT Slide 5, 8, 9, 12, 16 | Phase 10 (Audit Module) | Ethereum Event Logs / `GET /api/audit/:id` | Event querying test (`eth_getLogs`) | Chronological timeline of blockchain events rendered in UI | Frozen in Phase 1 (Pending Phase 10) |
| **REQ-PPT-11** | **Future Scope Management**<br>Strict boundary enforcement for mobile, ZK-SNARKs, AI, and cross-chain. | PPT Slide 14, 16 | Phase 1 (Requirements) & Phase 15 (Final Review) | Project Scope Boundary | Architectural scope review | Documented roadmap in `docs/requirements.md` without polluting core scope | Frozen in Phase 1 (Phase 1 Complete) |

---

## 4. Functional Requirements Traceability

| Requirement ID | Requirement Description | Source | Implementation Phase | Expected Component | Expected Test | Expected Demonstration Evidence | Status |
|---|---|---|---|---|---|---|---|
| **REQ-FR-01** | Web3 Wallet Connection & Network Validation | `MASTER_PLAN.md` §11 | Phase 7 (Frontend) | Next.js Wallet Provider (`ethers.js`) | Provider connection test, wrong chain prompt test | Connected wallet address and chain badge (Hardhat/Sepolia) displayed in UI | Frozen in Phase 1 (Pending Phase 7) |
| **REQ-FR-02** | Cryptographic Identity & DID Authentication | `MASTER_PLAN.md` §14 | Phase 5 (Auth API) | `IdentityRegistry.sol`, `POST /api/auth/*` | Nonce generation test, signature verification test | MetaMask `personal_sign` prompt, issued JWT/session token | Frozen in Phase 1 (Pending Phase 5) |
| **REQ-FR-03** | Real Document Upload & Client-Side SHA-256 Hashing | `MASTER_PLAN.md` §16, 17 | Phase 6 (Crypto Module) | Next.js File Input, Web Crypto Hashing | File byte reading test, SHA-256 hash match test | Authentic file upload; real SHA-256 digest rendered in UI | Frozen in Phase 1 (Pending Phase 6) |
| **REQ-FR-04** | Client-Side AES-256-GCM Encryption | `MASTER_PLAN.md` §17, 18 | Phase 6 (Crypto Module) | Web Crypto AES-GCM Subsystem | Symmetric encryption/decryption roundtrip test | 256-bit key and 96-bit IV generation; encrypted blob inspector | Frozen in Phase 1 (Pending Phase 6) |
| **REQ-FR-05** | Real IPFS Storage & CID Generation | `MASTER_PLAN.md` §19 | Phase 5 (IPFS Integration) | Node Express Gateway (`POST /api/ipfs/upload`) | Real IPFS upload and retrieval integration test | Authentic CID returned by IPFS daemon and displayed in UI | Frozen in Phase 1 (Pending Phase 5) |
| **REQ-FR-06** | Smart Contract Document Registration | `MASTER_PLAN.md` §20 | Phase 3 (Contracts) & Phase 7 (UI) | `DocumentRegistry.registerDocument` | Registration unit test, duplicate revert test | MetaMask transaction confirmation; emitted `DocumentRegistered` event | Frozen in Phase 1 (Pending Phase 3/7) |
| **REQ-FR-07** | Real Transaction Confirmation & Receipt Display | `MASTER_PLAN.md` §20 | Phase 7 (Frontend) | Transaction Receipt Handler | Receipt parsing test, gas calculation test | Real transaction hash, block number, gas used shown in UI | Frozen in Phase 1 (Pending Phase 7) |
| **REQ-FR-08** | Document Inventory & Empty State Display | `MASTER_PLAN.md` §25, 26 | Phase 7 (Frontend) | Next.js Document Grid Component | Empty state rendering test, document fetch test | "No documents registered yet" on clean state; real items upon registration | Frozen in Phase 1 (Pending Phase 7) |
| **REQ-FR-09** | Smart-Contract Access Control & Sharing | `MASTER_PLAN.md` §22 | Phase 3 (Contracts) & Phase 9 (Sharing) | `AccessControl.grantAccess` | Access grant test, non-owner revert test | Owner submits `grantAccess`; verifier wallet gains authorized state | Frozen in Phase 1 (Pending Phase 3/9) |
| **REQ-FR-10** | Access Revocation | `MASTER_PLAN.md` §23 | Phase 3 (Contracts) & Phase 9 (Sharing) | `AccessControl.revokeAccess` | Revocation unit test, access denial test | Owner calls `revokeAccess`; verifier immediately locked out in UI | Frozen in Phase 1 (Pending Phase 3/9) |
| **REQ-FR-11** | Document Revocation | `MASTER_PLAN.md` §23 | Phase 3 (Contracts) & Phase 9 (Sharing) | `DocumentRegistry.revokeDocument` | Document revocation test, verify revoked check | Document badge changes to "REVOKED"; verification rejects validity | Frozen in Phase 1 (Pending Phase 3/9) |
| **REQ-FR-12** | Cryptographic Document Verification | `MASTER_PLAN.md` §21 | Phase 8 (Verification) | Verification Engine (`POST /api/verify`) | Hash comparison test against contract state | Verified badge with green indicator and matching hash proof (< 2s) | Frozen in Phase 1 (Pending Phase 8) |
| **REQ-FR-13** | Tamper Detection & Fraud Prevention | `MASTER_PLAN.md` §21 | Phase 8 (Verification) | Verification Engine | Mutated file mismatch test | Mutated file uploaded; red "TAMPER DETECTED" alert displayed | Frozen in Phase 1 (Pending Phase 8) |
| **REQ-FR-14** | Immutable Blockchain Audit Trail | `MASTER_PLAN.md` §24 | Phase 10 (Audit Trail) | Event Indexer (`GET /api/audit/:id`) | Event filter query test | Chronological visual audit timeline showing all contract events | Frozen in Phase 1 (Pending Phase 10) |

---

## 5. Non-Functional & Governance Traceability

| Requirement ID | Requirement Description | Source | Implementation Phase | Expected Component | Expected Test | Expected Demonstration Evidence | Status |
|---|---|---|---|---|---|---|---|
| **REQ-NFR-01** | **Absolute Non-Synthetic Data Rule**<br>No fake, mock, simulated, or seeded application data in the production runtime. | `ai_rules.md` §1-64 | All Phases (Phase 1–15) | Entire Codebase & Architecture | Repository-wide mock-data audit script | 100% of runtime data verified from real user actions, IPFS, and blockchain | Frozen in Phase 1 (Active Rule) |
| **REQ-NFR-02** | **Fail-Closed Error Handling & Provenance UI**<br>Every error aborts safely without fallbacks; provenance badges display source of every value. | `MASTER_PLAN.md` §4, 27 | Phase 7 (UI) & Phase 11 (Fail-Closed) | Error Boundary Components, Provenance Tooltips | Negative test suite (network offline, user rejection, IPFS error) | Honest error messages shown for rejected transactions; provenance tags on UI cards | Frozen in Phase 1 (Pending Phase 7/11) |
| **REQ-NFR-03** | **Multi-Layer Security Architecture**<br>AES-256-GCM data at rest, SHA-256 integrity, smart contract access, wallet signatures. | `MASTER_PLAN.md` §15, 34 | Phase 6 (Crypto) & Phase 13 (Security Audit) | Cryptographic Subsystems, Solidity Contracts | Security scan, smart-contract reentrancy and access-check tests | Zero plaintext leaks in network traces; verified access boundaries | Frozen in Phase 1 (Pending Phase 6/13) |
| **REQ-NFR-04** | **External Service Configuration & Secrets Isolation**<br>Environment variable configuration; no secrets in code or git. | `MASTER_PLAN.md` §8 | Phase 0 (Governance) & Phase 1 (Planning) | `.env.example`, `.gitignore` | Git repository commit history leak scan (`trufflehog` / git grep) | Clean git history; sanitized `.env.example` defining configuration keys | Frozen in Phase 1 (Phase 1 Complete) |

---

## 6. Implementation Phase Mapping Summary

| Phase Index | Phase Title | Primary Mapped Requirements | Deliverables |
|---|---|---|---|
| **Phase 0** | AI Governance & Live Infrastructure Policy | REQ-NFR-01, REQ-NFR-04 | `ai_rules.md`, `.gitignore`, `.env.example` |
| **Phase 1** | Requirements & Scope Freeze | REQ-M05, REQ-PPT-11, All FRs/NFRs | `docs/requirements.md`, `docs/requirements-traceability.md`, `docs/mandatory-requirements.png` |
| **Phase 2** | System Architecture & Data Flow | REQ-M05, REQ-PPT-01–10 | `docs/architecture.md`, `docs/api.md`, `docs/security.md`, 13 Architecture Diagrams |
| **Phase 3** | Blockchain Network Setup & Smart Contracts | REQ-M01, REQ-M02, REQ-PPT-03, REQ-PPT-08 | Hardhat Config, `DocumentRegistry.sol`, `AccessControl.sol`, `IdentityRegistry.sol` |
| **Phase 4** | Smart Contract Testing & Security Audit | REQ-M02, REQ-NFR-03 | Mocha/Chai Test Suite (`test/contracts/*.test.ts`) |
| **Phase 5** | Node.js Backend & IPFS Integration | REQ-PPT-01, REQ-PPT-07, REQ-FR-02, REQ-FR-05 | Express Gateway, Auth Endpoints, IPFS Relay Service |
| **Phase 6** | Cryptography Engine (Client-Side) | REQ-PPT-02, REQ-PPT-06, REQ-FR-03, REQ-FR-04 | SHA-256 Hasher, AES-256-GCM Encryptor/Decryptor |
| **Phase 7** | Frontend – Blockchain Integration | REQ-M03, REQ-FR-01, REQ-FR-06–08, REQ-NFR-02 | Next.js Web App, Tailwind UI, `ethers.js` Provider, MetaMask Hooks |
| **Phase 8** | Verification & Tamper Detection Module | REQ-PPT-05, REQ-PPT-09, REQ-FR-12, REQ-FR-13 | Verification Screen, Tamper Alerting, Speed Benchmark (< 2s) |
| **Phase 9** | Access Control & Sharing Workflows | REQ-PPT-08, REQ-FR-09–11 | Sharing Modal, Revocation Controls, Access Status Verifier |
| **Phase 10** | Immutable Audit Trail Module | REQ-PPT-10, REQ-FR-14 | Event Listener, Audit Visualizer, Contract Event Log Indexer |
| **Phase 11** | Fail-Closed Error Boundaries & Provenance UI | REQ-NFR-01, REQ-NFR-02 | Error Toasts, Honest Empty States, Provenance Badges |
| **Phase 12** | Core Modules Functional Demonstration | REQ-M04, All FRs | Functional Demonstration Checkpoint & Automated E2E Test Suite |
| **Phase 13** | Security Hardening & Zero-Mock Audit | REQ-NFR-01, REQ-NFR-03 | Security Review Report, Zero-Mock Runtime Verification Script |
| **Phase 14** | Complete End-to-End Live Demonstration | REQ-M04, 21-Step Demo Script | Full Synchronous Demonstration Video/Logs, Milestone Checkpoint |
| **Phase 15** | Final Review, Code Quality & Documentation Package | REQ-M05, All Requirements | Final Review Package, Comprehensive Setup & Operation Manual |

---

## 7. Phase 3 Blockchain Network Foundation Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-BLOCKCHAIN-001** | **Blockchain Network Setup**<br>Establish a real local Ethereum/EVM-compatible node supporting standard JSON-RPC. | Phase 3 | `blockchain/hardhat.config.ts`, `npx hardhat node` | `npm run health-check:local` queries dynamic provider | **COMPLETE** |
| **REQ-BLOCKCHAIN-002** | **Network Connectivity & Dynamic Chain ID**<br>Dynamic detection of network connection and Chain ID matching without hardcoded values. | Phase 3 | `blockchain/scripts/health-check.ts`, `network.test.ts` | Provider queries `getNetwork()`; enforces `CHAIN_ID` consistency | **COMPLETE** |
| **REQ-BLOCKCHAIN-003** | **Accounts & Identities Foundation**<br>Dynamic discovery of pre-funded development accounts and non-synthetic balance retrieval. | Phase 3 | `blockchain/scripts/health-check.ts`, `hardhat` accounts | `ethers.getSigners()` queries live balances (`getBalance`) | **COMPLETE** |
| **REQ-BLOCKCHAIN-004** | **Real Native Transaction Handling**<br>Account-to-account native value transfer, block mining, and receipt verification with status 1. | Phase 3 | `blockchain/scripts/send-test-tx.ts`, `network.test.ts` | Transaction submission, mined block confirmation, receipt verification | **COMPLETE** |
| **REQ-BLOCKCHAIN-005** | **Network Health & Honest Failure Handling**<br>Fail-closed error reporting for network disconnects, invalid balances, and chain mismatches. | Phase 3 | `blockchain/scripts/health-check.ts`, `network.test.ts` | Negative test suite verifies explicit errors without synthetic fallbacks | **COMPLETE** |

---

## 8. Phase 4 Wallet & Identity Foundation Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-WALLET-001** | **Injected Provider Detection**<br>Detect `window.ethereum` and MetaMask availability with SSR-safe checks; fail-closed when absent. | Phase 4 | `frontend/lib/wallet/WalletContext.tsx` | Provider presence check, `wallet-unavailable` state rendering | **Implemented** |
| **REQ-WALLET-002** | **Explicit User Connection**<br>User-initiated `eth_requestAccounts` connection; retrieve real address and live native balance without hardcoding. | Phase 4 | `frontend/components/wallet/WalletConnect.tsx`, `WalletContext.tsx` | `connect()` action, live provider account & balance queries | **Implemented** |
| **REQ-WALLET-003** | **Dynamic Network Validation**<br>Retrieve live chain ID from provider; enforce match against `NEXT_PUBLIC_CHAIN_ID`; lock actions on mismatch. | Phase 4 | `frontend/lib/wallet/WalletContext.tsx`, `wallet-utils.ts` | Live `eth_chainId` comparison; `wrong-network` state enforcement | **Implemented** |
| **REQ-WALLET-004** | **Account & Chain Change Handlers**<br>Listen to `accountsChanged` and `chainChanged`; immediately flush previous identity state and cached proofs. | Phase 4 | `frontend/lib/wallet/WalletContext.tsx` | Provider event listeners; automatic state reset & isolation tests | **Implemented** |
| **REQ-WALLET-005** | **Cryptographic Proof of Ownership**<br>Generate runtime cryptographic nonce and human-readable challenge; request real EIP-191 `personal_sign`. | Phase 4 | `frontend/components/wallet/ProofOfOwnership.tsx`, `wallet-utils.ts` | User signs dynamic challenge; catches rejection honestly | **Implemented** |
| **REQ-WALLET-006** | **Cryptographic Signature Verification**<br>Recover signer address via `ethers.verifyMessage`; confirm equality with connected wallet; reject altered messages. | Phase 4 | `frontend/lib/wallet/wallet-utils.ts`, `frontend/tests/wallet.test.ts` | ECDSA signature recovery unit tests with matching & mutated payloads | **Implemented** |
| **REQ-WALLET-007** | **Honest Error & Empty States**<br>Zero fake/demo profiles; fail-closed alert cards for rejections, unsupported chains, and disconnected states. | Phase 4 | `frontend/components/ui/ErrorState.tsx`, `EmptyState.tsx` | Negative error rendering tests without synthetic fallbacks | **Implemented** |

---

## 9. Phase 5 DocumentRegistry Smart Contract Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-DOCREG-001** | **Authoritative On-Chain Document Record**<br>Store opaque `bytes32 documentId`, SHA-256 `documentHash`, `ipfsCid`, `registeredAt`, and `revoked` flag. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | Unit tests verify struct storage & retrieval | **Implemented** |
| **REQ-DOCREG-002** | **Sovereign Ownership Binding**<br>Bind `doc.owner = msg.sender` with zero caller spoofing. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | Unit test proves registration sets `msg.sender` as owner | **Implemented** |
| **REQ-DOCREG-003** | **Input Validation & Collision Prevention**<br>Reject zero ID, zero hash, empty CID, and duplicate registrations with custom errors. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | Negative unit tests verify custom revert errors | **Implemented** |
| **REQ-DOCREG-004** | **Owner-Restricted Document Revocation**<br>Allow only `doc.owner` to set `revoked = true`; prevent repeat revocations; preserve historical record. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | Unit tests verify owner authorization and unauthorized rejection | **Implemented** |
| **REQ-DOCREG-005** | **Audit Event Logging**<br>Emit `DocumentRegistered` and `DocumentRevoked` with indexed parameters for later audit queries. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | Event assertion tests in Mocha/Chai suite | **Implemented** |
| **REQ-DOCREG-006** | **Authoritative State Retrieval**<br>Expose `getDocument`, `getUserDocuments`, `isRevoked`, and `documentExists` for verified state queries. | Phase 5 | `blockchain/contracts/DocumentRegistry.sol` | State query tests and local deployment interaction script | **Implemented** |

---

## 10. Phase 6 AccessControl Smart Contract Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-ACC-001** | **DocumentRegistry Authorization Binding**<br>Verify caller ownership strictly against DocumentRegistry before granting or revoking permissions. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Unit tests verify non-owner revert `NotDocumentOwner` | **Implemented** |
| **REQ-ACC-002** | **Document-Specific Verifier Grants**<br>Owner grants access to valid non-zero verifier address; record on-chain and emit `AccessGranted`. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Unit tests & live script verify state & event arguments | **Implemented** |
| **REQ-ACC-003** | **Owner-Controlled Access Revocation**<br>Owner revokes previously granted verifier access; update state to false and emit `AccessRevoked`. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Unit tests & live script verify state & event arguments | **Implemented** |
| **REQ-ACC-004** | **Stale Permission Invalidation on Revocation**<br>Ensure document-level revocation in DocumentRegistry automatically invalidates active verifier access. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Unit tests & Flow 2 script verify `hasAccess` override | **Implemented** |
| **REQ-ACC-005** | **Input Sanitization & Redundancy Prevention**<br>Reject zero document ID, zero verifier, unregistered docs, duplicate grants, and duplicate revokes. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Negative unit tests verify custom revert errors | **Implemented** |
| **REQ-ACC-006** | **Cross-Document Permission Isolation**<br>Strict isolation between documents and verifiers without wildcard access or administrative backdoors. | Phase 6 | `blockchain/contracts/AccessControl.sol` | Cross-document isolation unit tests | **Implemented** |

---

## 11. Phase 7 Smart Contract Security & Hardening Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-SEC-001** | **Ownership & Authorization Adversarial Testing**<br>Verify fail-closed rejection of non-owner attempts to register, grant, or revoke across all contracts. | Phase 7 | `blockchain/test/SecurityInvariants.test.ts` | Negative adversarial test cases for Scenarios A through F | **Implemented** |
| **REQ-SEC-002** | **Stale Permission Invalidation Invariant**<br>Prove that document revocation in DocumentRegistry instantly invalidates active AccessControl permissions. | Phase 7 | `SecurityInvariants.test.ts`, `verify-security-hardening.ts` | Invariant 4 automated tests & live EVM script | **Implemented** |
| **REQ-SEC-003** | **Multi-Tenant State & Permission Isolation**<br>Prove that permissions for Document A do not bleed into Document B, and verifier permissions remain isolated. | Phase 7 | `SecurityInvariants.test.ts` | Cross-tenant assertion tests with multiple signers | **Implemented** |
| **REQ-SEC-004** | **Registration Immutability & Anti-Collision**<br>Prove that existing document records cannot be overwritten, modified, or collision-hijacked. | Phase 7 | `SecurityInvariants.test.ts` | Duplicate registration and payload mutation tests | **Implemented** |
| **REQ-SEC-005** | **Event-State Coherence Verification**<br>Prove that events are emitted if and only if state changes succeed; reverted calls emit zero events. | Phase 7 | `SecurityInvariants.test.ts` | Transaction receipt inspection & event assertion tests | **Implemented** |
| **REQ-SEC-006** | **Gas & Cost Sanity Profile**<br>Confirm operations execute within bounded gas budgets with zero unbounded storage loops. | Phase 7 | `SecurityInvariants.test.ts`, `verify-security-hardening.ts` | Gas consumption assertions (<300k reg, <100k grant) | **Implemented** |

---

## 12. Phase 8 Cryptography Requirements Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-CRYPTO-001** | **Deterministic SHA-256 Document Hashing**<br>Compute cryptographic document fingerprint directly from original plaintext bytes with strict avalanche sensitivity. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`hashDocument`) | NIST test vectors, avalanche sensitivity, and determinism tests in `cryptography.test.ts` | **Implemented** |
| **REQ-CRYPTO-002** | **DocumentRegistry EVM Compatibility**<br>Produce canonical `bytes32` hex format compatible with `DocumentRegistry.sol` on-chain storage. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`bytes32` property) | Format validation and prefix assertions in `cryptography.test.ts` | **Implemented** |
| **REQ-CRYPTO-003** | **AES-256-GCM Key & IV Lifecycle**<br>Generate 256-bit keys and 96-bit IVs using CSPRNG; enforce per-operation freshness and export/import fidelity. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`generateDocumentKey`, `generateIV`) | Key length, IV length, and roundtrip import/export tests in `cryptography.test.ts` | **Implemented** |
| **REQ-CRYPTO-004** | **Authenticated Encryption & Binary Serialization**<br>Encrypt arbitrary binary documents via AES-256-GCM with 128-bit tag and serialize into canonical IPFS-ready binary layout. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`encryptDocument`, `serializeEncryptedPayload`) | Exact binary preservation roundtrip tests (including simulated PDF headers) | **Implemented** |
| **REQ-CRYPTO-005** | **Tamper Detection & Fail-Closed Decryption**<br>Reject modified ciphertext, altered IVs, tampered authentication tags, or incorrect keys with `AuthenticationError`. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`decryptDocument`) | Negative tampering and wrong-key test suites in `cryptography.test.ts` | **Implemented** |
| **REQ-CRYPTO-006** | **Decrypt-Then-Hash Verification & Key Isolation**<br>Verify decrypted plaintext matches expected on-chain hash; enforce strict key isolation from logs, storage, and chain. | Phase 8 | `frontend/lib/crypto/document-crypto.ts` (`decryptAndVerify`) | Decrypt-then-hash roundtrip and key leak assertion tests in `cryptography.test.ts` | **Implemented** |

---

## 13. Phase 9 IPFS Decentralized Storage Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-IPFS-001** | **Pinata V3 Decentralized Storage Integration**<br>Integrate client/backend with Pinata Files V3 API for authenticated pinning of encrypted documents. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`uploadEncryptedPayload`) | Live Pinata V3 API integration tests in `ipfs.test.ts` | **Implemented** |
| **REQ-IPFS-002** | **Authentic CID Generation & Format Validation**<br>Acquire authentic IPFS CIDs from provider response; enforce strict CIDv0/v1 format validation. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`isValidCid`) | Valid & invalid CID format unit tests in `ipfs.test.ts` | **Implemented** |
| **REQ-IPFS-003** | **Ciphertext-Only Persistence Guarantee**<br>Ensure only Phase 8 AES-256-GCM encrypted payloads enter IPFS; never transmit plaintext or encryption keys. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`uploadEncryptedPayload`) | Key isolation and payload layout tests in `ipfs.test.ts` | **Implemented** |
| **REQ-IPFS-004** | **Byte-for-Byte Transmission & Retrieval Fidelity**<br>Stream raw bytes from IPFS gateway and verify exact byte-for-byte equality with uploaded ciphertext. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`downloadEncryptedPayload`) | Byte-by-byte comparison tests in `ipfs.test.ts` | **Implemented** |
| **REQ-IPFS-005** | **End-to-End Cryptography + IPFS Workflow**<br>Execute full pipeline: Hash $\to$ Encrypt $\to$ Pin $\to$ Retrieve $\to$ Decrypt $\to$ Verify original plaintext bytes. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`encryptAndUploadDocument`, `retrieveAndDecryptDocument`) | Complete roundtrip integration tests in `ipfs.test.ts` | **Implemented** |
| **REQ-IPFS-006** | **Fail-Closed Operational Error Handling**<br>Fail closed on invalid CIDs, network drops, or missing credentials; zero mock CIDs or fake fallback storage. | Phase 9 | `frontend/lib/ipfs/ipfs-service.ts` (`IpfsUploadError`, `IpfsDownloadError`) | Negative test cases with missing credentials and non-existent CIDs | **Implemented** |

---

## 14. Phase 10 Backend API Layer Requirements Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-API-001** | **Express TypeScript Application & Security Foundation**<br>Establish hardened Express application with Helmet headers, strict CORS, rate limiters, correlation IDs, and centralized error handling. | Phase 10 | `backend/src/app.ts`, `backend/src/middleware/*` | Security header tests, 404 handler, rate limiter and error boundary tests | **Implemented** |
| **REQ-API-002** | **EIP-191 Challenge-Response Authentication**<br>Issue CSPRNG 256-bit challenge nonces with 5m TTL; verify wallet signatures using `ethers.verifyMessage`; enforce single-use consumption. | Phase 10 | `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts` | Challenge generation, replay rejection, address mismatch, and expiration tests in `auth.test.ts` | **Implemented** |
| **REQ-API-003** | **JWT Session Token Authorization Middleware**<br>Sign and verify HMAC-SHA256 JWTs with standard claims (`sub`, `iss`, `aud`, `exp`); enforce `requireAuth` protection on restricted endpoints. | Phase 10 | `backend/src/middleware/auth.ts`, `backend/src/services/auth.service.ts` | Missing, malformed, tampered, and expired token test cases in `auth.test.ts` | **Implemented** |
| **REQ-API-004** | **IPFS Upload & Retrieval Relays**<br>Relay encrypted uploads to Pinata V3 API enforcing Phase 8 binary format; validate CIDv0/v1 strings and retrieve raw ciphertext from gateway. | Phase 10 | `backend/src/services/ipfs.service.ts`, `backend/src/controllers/ipfs.controller.ts` | Validation tests, payload format checks, and live Pinata V3 roundtrip in `ipfs.test.ts` | **Implemented** |
| **REQ-API-005** | **Read-Only Document Inventory & Metadata Endpoints**<br>Query `DocumentRegistered` logs for caller's wallet and fetch live on-chain status via `DocumentRegistry.sol` using read-only RPC. | Phase 10 | `backend/src/services/blockchain.service.ts`, `backend/src/controllers/documents.controller.ts` | Document listing, empty array, and single document metadata lookup tests in `documents.test.ts` | **Implemented** |
| **REQ-API-006** | **Smart Contract Access Control Enforcement**<br>Enforce 403 Forbidden for unauthorized callers; query `AccessControl.hasAccess` to allow granted verifiers and deny strangers. | Phase 10 | `backend/src/services/blockchain.service.ts` | Unauthorized access denial and authorized verifier access tests in `documents.test.ts` and `verify.test.ts` | **Implemented** |
| **REQ-API-007** | **Cryptographic Document Verification Endpoint**<br>Verify candidate SHA-256 hash against on-chain document hash, check authorization and revocation state, and measure latency. | Phase 10 | `backend/src/services/verification.service.ts`, `backend/src/controllers/verify.controller.ts` | Hash match (`match: true`), tamper detection (`match: false`), and revocation tests in `verify.test.ts` | **Implemented** |
| **REQ-API-008** | **On-Chain Audit Trail Reconstruction**<br>Reconstruct complete chronological lifecycle lineage from `DocumentRegistered`, `DocumentRevoked`, `AccessGranted`, and `AccessRevoked` event logs. | Phase 10 | `backend/src/services/audit.service.ts`, `backend/src/controllers/audit.controller.ts` | Chronological multi-event lineage reconstruction and 403 authorization check tests in `audit.test.ts` | **Implemented** |


---

## 15. Phase 11 Frontend Requirements Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-FE-001** | **Next.js Foundation & Responsive App Architecture**<br>Establish Next.js App Router application with desktop-first responsive layout, AppShell, navigation, header, and footer. | Phase 11 | `frontend/app/*`, `frontend/components/layout/*` | Production Next.js build compilation (`npm run build`) and layout component rendering | **Implemented** |
| **REQ-FE-002** | **Dual-State Wallet & EIP-191 Authentication UX**<br>Maintain separate wallet connection and API authentication states; support challenge request, personal_sign, and JWT session in `sessionStorage`. | Phase 11 | `frontend/lib/auth/AuthContext.tsx`, `frontend/components/wallet/WalletView.tsx` | Wallet connection and EIP-191 challenge-signature session tests in `auth-session.test.ts` and `integration.test.ts` | **Implemented** |
| **REQ-FE-003** | **Session Invalidation on Account & Network Mutation**<br>Immediately purge backend JWT, session state, and document cache upon `accountsChanged` or `chainChanged` events. | Phase 11 | `frontend/lib/auth/AuthContext.tsx` (`handleAccountChange`, `handleChainChange`) | Account change and storage purge assertions in `auth-session.test.ts` | **Implemented** |
| **REQ-FE-004** | **Centralized Typed ApiClient**<br>Provide typed singleton consuming Phase 10 endpoints (`health`, `ready`, `auth`, `documents`, `verify`, `audit`) with automatic Bearer token injection and normalized `ApiError`. | Phase 11 | `frontend/lib/api/client.ts`, `frontend/lib/api/types.ts` | Unit tests for all endpoints and error cases in `api-client.test.ts` | **Implemented** |
| **REQ-FE-005** | **Live Document Inventory & Detail Views**<br>Render real documents fetched via `GET /api/documents` and `GET /api/documents/:id` with honest loading, empty, and error states; zero synthetic records. | Phase 11 | `frontend/components/documents/*`, `frontend/components/dashboard/*` | UI state rendering tests in `ui-states.test.ts` and live backend query tests in `integration.test.ts` | **Implemented** |
| **REQ-FE-006** | **Client-Side Verification Engine**<br>Compute SHA-256 hashes locally in browser via Web Crypto / `document-crypto.ts`; verify candidate hash against contract via `POST /api/verify`; report latency and match status. | Phase 11 | `frontend/components/verify/VerifyView.tsx`, `frontend/lib/crypto/document-crypto.ts` | Hash computation unit tests and backend verification tests in `api-client.test.ts` and `integration.test.ts` | **Implemented** |
| **REQ-FE-007** | **Chronological Audit Lineage Visualizer**<br>Reconstruct and visually render contract event history (`DocumentRegistered`, `AccessGranted`, `AccessRevoked`, `DocumentRevoked`) from `GET /api/audit/:documentId`. | Phase 11 | `frontend/components/audit/AuditView.tsx` | Audit trail payload consumption and UI timeline rendering tests in `ui-states.test.ts` and `integration.test.ts` | **Implemented** |
| **REQ-FE-008** | **Zero Server Secret Exposure & Zero Synthetic Data**<br>Expose only public `NEXT_PUBLIC_*` configuration to client; zero backend secrets, private keys, or Pinata JWTs in browser; honest empty/error states without fake fallback data. | Phase 11 | `frontend/lib/config/env.ts`, `frontend/.env.local`, `frontend/components/ui/*` | Secret exposure grep audit across frontend source and synthetic data keyword audit | **Implemented** |

---

## 16. Phase 12 Document Registration Requirements Traceability

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-REG-001** | **Authentic File Ingestion & Deterministic Hashing**<br>Read real file bytes into `Uint8Array`, compute canonical 0x-prefixed bytes32 SHA-256 hash using Phase 8 crypto, verify exact byte length, and reject empty/missing files. | Phase 12 | `frontend/lib/registration/registration-service.ts` (`extractFileBytes`), `frontend/lib/crypto/document-crypto.ts` (`hashDocument`) | Cryptographic digest and file extraction unit tests in `registration-service.test.ts` | **Implemented** |
| **REQ-REG-002** | **Client-Side AES-256-GCM Encryption & Payload Serialization**<br>Generate fresh 256-bit CSPRNG key and 96-bit CSPRNG IV in browser; encrypt file bytes with 128-bit GCM tag; serialize to Phase 8 binary format; zero key transmission to chain, backend, or IPFS. | Phase 12 | `frontend/lib/crypto/document-crypto.ts` (`generateDocumentKey`, `encryptDocument`, `serializeEncryptedPayload`) | Key length, IV entropy, serialization format, and roundtrip decryption tests in `registration-service.test.ts` | **Implemented** |
| **REQ-REG-003** | **Authenticated IPFS Upload via Backend Relay**<br>Upload binary encrypted payload to `POST /api/ipfs/upload` using JWT session; pin to Pinata Files V3; enforce CIDv0/v1 format validation; fail-closed on network or IPFS failure. | Phase 12 | `frontend/lib/api/client.ts` (`uploadIpfsPayload`), `backend/src/services/ipfs.service.ts` | Live Pinata V3 pinning and CID validation assertions in `registration-e2e.test.ts` | **Implemented** |
| **REQ-REG-004** | **CSPRNG bytes32 Document ID Generation**<br>Generate unique 256-bit cryptographic nonces using `crypto.getRandomValues()`; format as canonical 0x-prefixed 64-hex strings; verify uniqueness across repeated invocations. | Phase 12 | `frontend/lib/registration/registration-service.ts` (`generateSecureDocumentId`) | 256-bit entropy and non-repeating nonce unit tests in `registration-service.test.ts` | **Implemented** |
| **REQ-REG-005** | **Non-Custodial MetaMask Transaction Signing**<br>Execute `DocumentRegistry.registerDocument(documentId, documentHash, ipfsCid)` directly via MetaMask signer; reject backend private key custody; fail-closed on user rejection or contract revert. | Phase 12 | `frontend/lib/contracts/document-registry.ts` (`registerDocumentOnChain`), `frontend/lib/registration/useDocumentRegistration.ts` | Contract interaction tests, duplicate ID revert test, and user rejection handling in `registration-failures.test.ts` | **Implemented** |
| **REQ-REG-006** | **Transaction Monitoring & Receipt Verification**<br>Track submitted transaction; wait for 1 on-chain block confirmation; extract real block number, block hash, gas used, and transaction hash; detect failed/reverted transaction receipts. | Phase 12 | `frontend/lib/contracts/document-registry.ts` (`registerDocumentOnChain`) | Mining confirmation, receipt extraction, and status assertions in `registration-e2e.test.ts` | **Implemented** |
| **REQ-REG-007** | **Automated Post-Registration Consistency Verification**<br>Read state directly from `DocumentRegistry.sol` via RPC; assert owner == wallet, documentHash == file hash, ipfsCid == uploaded CID, revoked == false; download ciphertext from IPFS, decrypt with local key, and assert byte-for-byte equality. | Phase 12 | `frontend/lib/registration/registration-service.ts` (`verifyPostRegistrationState`) | Full 17-step post-registration roundtrip in `registration-e2e.test.ts`; hash/owner mismatch tests in `registration-failures.test.ts` | **Implemented** |
| **REQ-REG-008** | **Comprehensive Failure Boundary Handling & Orphan Defense**<br>Fail closed on wrong network, unauthenticated session, wallet mismatch, user rejection, duplicate ID, and post-registration mismatch; warn user on orphan IPFS object if transaction rejected. | Phase 12 | `frontend/lib/registration/registration-service.ts`, `frontend/lib/registration/useDocumentRegistration.ts` | Complete failure suite across 5 boundary scenarios in `registration-failures.test.ts` | **Implemented** |
| **REQ-REG-009** | **Transparent UI State Progression & Key Backup UX**<br>Expose 14 discrete stages with honest labels; render pre-transaction preview card; display confirmed provenance card with post-registration verified checklist; offer optional `.key` file backup download. | Phase 12 | `frontend/components/registration/DocumentRegistrationView.tsx`, `frontend/app/register/page.tsx` | Next.js production build (`npm run build`), static page generation, and component integration | **Implemented** |

---

## 17. Phase 13 Document Sharing & Access Revocation Traceability Matrix

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-SHR-001** | **Owner-Exclusive Sovereign Authorization**<br>Verify caller is document owner on `DocumentRegistry.sol` before and during `grantAccess` and `revokeAccess`; revert non-owner calls with `NotDocumentOwner`. | Phase 13 | `frontend/lib/sharing/sharing-service.ts` (`validateOwnerAuthority`), `AccessControl.sol` (`onlyDocumentOwner`) | Non-owner grant and revoke rejection tests in `sharing-failures.test.ts` | **Implemented** |
| **REQ-SHR-002** | **Fail-Closed Verifier Address Validation**<br>Validate 20-byte hex format, reject empty/whitespace, strictly reject zero address (`0x00...00`), and prevent owner self-granting. | Phase 13 | `frontend/lib/sharing/sharing-service.ts` (`validateVerifierAddress`) | Unit tests across 8 address edge cases in `sharing-service.test.ts` | **Implemented** |
| **REQ-SHR-003** | **Non-Custodial MetaMask Transaction Execution**<br>Execute `AccessControl.grantAccess(docId, verifier)` and `revokeAccess(docId, verifier)` directly via MetaMask signer; zero server signing keys; fail-closed on user rejection or contract revert. | Phase 13 | `frontend/lib/contracts/access-control.ts` (`grantAccessOnChain`, `revokeAccessOnChain`), `frontend/lib/sharing/useDocumentSharing.ts` | Real transaction execution and receipt confirmation in `sharing-e2e.test.ts` | **Implemented** |
| **REQ-SHR-004** | **Automated Post-Transaction State Verification**<br>Verify on-chain permission state immediately following mining: assert `hasAccess == true` post-grant and `hasAccess == false` post-revoke via direct contract call. | Phase 13 | `frontend/lib/sharing/sharing-service.ts` (`verifyPostGrantState`, `verifyPostRevokeState`) | Post-grant and post-revoke state assertions in `sharing-e2e.test.ts` and mismatch detection in `sharing-failures.test.ts` | **Implemented** |
| **REQ-SHR-005** | **Document Revocation Invalidation Invariant**<br>Override verifier permissions immediately when a document is revoked on `DocumentRegistry`; revert new `grantAccess` attempts on revoked documents with `DocumentIsRevoked`. | Phase 13 | `frontend/lib/sharing/sharing-service.ts` (`validateDocumentActiveForGrant`), `AccessControl.sol` (`grantAccess`, `hasAccess`) | Revoked document grant revert test in `sharing-failures.test.ts` | **Implemented** |
| **REQ-SHR-006** | **Live On-Chain Verifier Registry Reconstruction**<br>Reconstruct document verifiers and active status from authentic on-chain audit logs (`AccessGranted` and `AccessRevoked`) via `/api/audit/:documentId`. | Phase 13 | `frontend/lib/sharing/sharing-service.ts` (`reconstructVerifiersWithLiveState`), `frontend/components/sharing/DocumentSharingView.tsx` | Chronological multi-event audit trail assertions in `sharing-e2e.test.ts` | **Implemented** |
| **REQ-SHR-007** | **Explicit Cryptographic Key Isolation Boundary**<br>Strictly separate blockchain permission (`hasAccess`) from AES decryption key delivery; zero key transmission through backend, IPFS, blockchain, or web storage. | Phase 13 | `frontend/components/sharing/DocumentSharingView.tsx`, `docs/sharing.md`, `docs/security.md` | Codebase credential audit, secret grep scan, and explicit limitation notice in UI | **Implemented** |
| **REQ-SHR-008** | **Transparent 11-Stage Workflow UX & State Management**<br>Implement desktop-first accessible sharing UI managing 11 discrete states, confirmation card, live verifier registry table, real provenance badges, and network/account switch protection. | Phase 13 | `frontend/components/sharing/DocumentSharingView.tsx`, `frontend/components/documents/DocumentDetailView.tsx` | Next.js production build (`npm run build`) and integration test suite | **Implemented** |

---

## 18. Phase 14 Document Verification & Tamper Detection Traceability Matrix

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-VER-001** | **Candidate Document Ingestion & Local SHA-256 Hashing**<br>Ingest candidate file bytes locally into `Uint8Array`, compute canonical 0x-prefixed bytes32 SHA-256 digest via Web Crypto API; zero raw bytes transmitted to backend. | Phase 14 | `frontend/lib/verification/verification-service.ts` (`extractFileBytes`, `computeCandidateHash`), `frontend/lib/crypto/document-crypto.ts` | Unit tests in `verification-service.test.ts` asserting exact digest calculation and byte sensitivity | **Implemented** |
| **REQ-VER-002** | **Authoritative On-Chain State Comparison**<br>Query `DocumentRegistry.sol` via `POST /api/verify`; compare lowercase candidate hash with stored `documentHash`; declare match strictly on bitwise identity. | Phase 14 | `backend/src/services/verification.service.ts`, `backend/src/controllers/verify.controller.ts` | Live on-chain comparison tests in `verification-e2e.test.ts` and `backend/tests/verify.test.ts` | **Implemented** |
| **REQ-VER-003** | **Multi-Party Sovereign Authorization Enforcement**<br>Enforce access check on `POST /api/verify`: allow document owner and verifiers possessing active `hasAccess == true` on `AccessControl.sol`; reject unauthorized callers with HTTP 403 `UNAUTHORIZED` and shield document metadata. | Phase 14 | `backend/src/services/verification.service.ts`, `backend/src/services/blockchain.service.ts` | Owner, verifier, and stranger access tests in `verification-e2e.test.ts` and `verification-failures.test.ts` | **Implemented** |
| **REQ-VER-004** | **Document Revocation Precedence**<br>Check `doc.revoked` on-chain; return primary status `REVOKED` for revoked documents even if candidate hash matches; strictly prevent returning `VERIFIED` on revoked documents. | Phase 14 | `backend/src/services/verification.service.ts`, `frontend/lib/verification/verification-service.ts` | On-chain revocation test in `verification-e2e.test.ts` and invariant assertion in `verification-failures.test.ts` | **Implemented** |
| **REQ-VER-005** | **Sensitive Byte Tamper & Mismatch Detection**<br>Detect 1-byte alteration, payload corruption, or completely distinct document; immediately report `TAMPER_DETECTED` (`match: false`) with side-by-side hash comparison. | Phase 14 | `backend/src/services/verification.service.ts`, `frontend/lib/verification/verification-service.ts` | 1-byte mutation and different file tests in `verification-e2e.test.ts` and `verification-failures.test.ts` | **Implemented** |
| **REQ-VER-006** | **Optional Stored-Object Auditing & Client AES Decryption**<br>Download ciphertext from IPFS via backend relay; validate client-supplied 256-bit AES key; decrypt locally with Web Crypto AES-256-GCM; compute decrypted SHA-256 and assert on-chain match; report `DECRYPTION_UNAVAILABLE` when key omitted. | Phase 14 | `frontend/lib/verification/verification-service.ts` (`verifyStoredObjectCiphertext`, `parseKeyBytes`), `frontend/lib/crypto/document-crypto.ts` | Stored-object audit tests with valid key and omitted key in `verification-e2e.test.ts` | **Implemented** |
| **REQ-VER-007** | **Fail-Closed Ciphertext & Auth Tag Tamper Detection**<br>Verify 128-bit authentication tag during stored-object AES-GCM decryption; fail closed with `DECRYPTION_FAILED` upon ciphertext bit mutation, bad tag, or wrong key. | Phase 14 | `frontend/lib/verification/verification-service.ts` (`verifyStoredObjectCiphertext`), `frontend/lib/crypto/document-crypto.ts` | Corrupted ciphertext and mutated tag tests in `verification-e2e.test.ts` and `verification-failures.test.ts` | **Implemented** |
| **REQ-VER-008** | **False-Certification Defense & Neutral Verdict Reporting**<br>Format verdicts strictly using neutral cryptographic language; zero claims of legal validity, 100% authenticity, or fraud-proof status; zero speculation on modifier identity. | Phase 14 | `frontend/lib/verification/verification-service.ts` (`formatVerificationVerdict`), `frontend/components/verify/VerifyView.tsx` | Unit tests in `verification-service.test.ts` verifying exclusion of prohibited false-certification phrases | **Implemented** |
| **REQ-VER-009** | **Transparent Verification UX & Account/Network Invalidation**<br>Render accessible desktop-first verification UI with candidate file drag-and-drop, real hash display, optional key input with key isolation notice, evidence cards, and automatic state reset on `accountsChanged` or `chainChanged`. | Phase 14 | `frontend/components/verify/VerifyView.tsx`, `frontend/lib/verification/useDocumentVerification.ts`, `frontend/app/verify/page.tsx` | Component rendering, state reset on account change, and production Next.js build compilation | **Implemented** |

---

## 19. Phase 15 Final Review, Hardening & Deployment Package Traceability Matrix

| Requirement ID | Requirement Description | Phase | Mapped Implementation | Verification Method | Status |
|---|---|---|---|---|---|
| **REQ-REV-001** | **Multi-Tier Baseline & Compilation Audit**<br>Verify and record clean baseline execution across Hardhat contracts, Node/Express backend, Next.js frontend, TypeScript typechecking, ESLint, and production Turbopack build. | Phase 15 | `blockchain/`, `backend/`, `frontend/` package configurations and build runners | 65 contract tests (PASS), 41 backend tests (PASS), 16 frontend suites (PASS), Next.js build (PASS) | **Implemented** |
| **REQ-REV-002** | **Full 26-Step End-to-End Real Demonstration**<br>Execute complete real lifecycle from wallet connection, EIP-191 auth, client AES encryption, Pinata V3 IPFS upload, on-chain mining, verifier grant, authentic verification, 1-byte tamper detection, revocation, and on-chain audit inspection. | Phase 15 | `frontend/scripts/run-phase15-demo.ts`, `frontend/lib/contracts/`, `backend/src/` | 26/26 steps executed live against Hardhat block 356–358 and Pinata CID `bafkreiae...` | **Implemented** |
| **REQ-REV-003** | **Multi-User Permission & Role Boundary Testing**<br>Verify distinct behaviors and fail-closed barriers across Owner, Authorized Verifier, Unauthorized Stranger, and Revoked Verifier. | Phase 15 | `frontend/scripts/run-phase15-multi-user-failure-tests.ts`, `AccessControl.sol`, `verification.service.ts` | 5/5 multi-user permission assertions validated live with real signers | **Implemented** |
| **REQ-REV-004** | **Failure Boundary & Negative Path Verification**<br>Assert fail-closed behavior across unissued challenges, address mismatches, contract duplicate reverts, unauthorized grant/revoke, corrupted ciphertext tags, and non-existent IDs. | Phase 15 | `frontend/scripts/run-phase15-multi-user-failure-tests.ts`, `backend/tests/auth.test.ts`, `frontend/tests/*-failures.test.ts` | 4/4 negative failure scenarios pass; truthful error reporting confirmed | **Implemented** |
| **REQ-REV-005** | **Repository Security Audit & UI Hardening**<br>Remove raw bearer JWT strings from user interface; enforce sessionStorage token isolation; verify zero leaked private keys, secrets, or AES keys in network traces or git. | Phase 15 | `frontend/components/wallet/WalletView.tsx`, `backend/src/middleware/auth.middleware.ts`, `frontend/lib/auth/session-service.ts` | UI inspection, token masking, and automated repo-wide secret scan | **Implemented** |
| **REQ-REV-006** | **Environment Configuration & Secrets Isolation**<br>Verify `.env` ignored in git; `.env.example` contains variable names only with zero real credentials; server secrets isolated from client bundles. | Phase 15 | `.gitignore`, `.env.example`, `backend/.env.example`, `frontend/.env.example`, `frontend/.env.local` | File review, Next.js build bundle inspection, zero secret leak in git | **Implemented** |
| **REQ-REV-007** | **Cryptographic Soundness & Decoupled Key Boundary**<br>Assert canonical SHA-256 over exact bytes; client-side AES-256-GCM with fresh 256-bit key and 96-bit IV; confirm keys never uploaded to blockchain or IPFS; document out-of-band key distribution accurately. | Phase 15 | `frontend/lib/crypto/document-crypto.ts`, `docs/known-limitations.md`, `docs/cryptography.md` | Unit tests in `cryptography.test.ts` and explicit documentation in `known-limitations.md` | **Implemented** |
| **REQ-REV-008** | **Authentic Pinata V3 IPFS Integration**<br>Verify only ciphertext payloads reach IPFS; obtain authentic CIDs; fail closed on missing credentials or unreachable gateways; zero synthetic CIDs. | Phase 15 | `backend/src/services/ipfs.service.ts`, `frontend/lib/ipfs/ipfs-service.ts` | Live upload/download roundtrip in `tests/ipfs.test.ts` and step 8-9 in live demo script | **Implemented** |
| **REQ-REV-009** | **Zero Synthetic Runtime Data Audit**<br>Inspect codebase to verify complete absence of mock, dummy, or synthetic runtime application data. | Phase 15 | Entire repository (`frontend/lib/`, `backend/src/`, `blockchain/contracts/`) | Automated repo-wide grep search; only legitimate unit test fixtures remain | **Implemented** |
| **REQ-REV-010** | **Operational Documentation & Demonstration Package**<br>Produce comprehensive operations manual, faculty demo runbook, executed test matrix, and register of known limitations. | Phase 15 | `docs/runbook.md`, `docs/demo-runbook.md`, `docs/final-test-matrix.md`, `docs/known-limitations.md` | Review against actual implementation and faculty review guidelines | **Implemented** |
| **REQ-REV-011** | **Deployment Readiness & Scope Preservation**<br>Maintain strict boundary between Local Demonstration Readiness and future Public Testnet Deployment; enforce zero unrequested feature additions. | Phase 15 | `docs/runbook.md`, `docs/known-limitations.md`, `MASTER_PLAN.md` | Verified local Hardhat operations; documented public deployment parameters | **Implemented** |

---

## 20. Deferred Project Scope Register

| Feature / Subsystem | Current Status | Rationale & Architectural Handling |
| :--- | :--- | :--- |
| **Asymmetric AES Key Exchange** | **DEFERRED** | Documented limitation; symmetric key remains with document owner and is distributed out-of-band to authorized verifiers who require stored-object decryption. On-chain candidate document verification works without the AES key. |
| **Public Testnet Deployment** | **DEFERRED** | System is fully verified for Local Demonstration on Hardhat Local (Chain 31337). Public testnet deployment (Sepolia/Base) is fully documented in `docs/runbook.md` as a future operational step. |
| **Full W3C DID Registry** | **PARTIALLY IMPLEMENTED** | Standard EIP-191 challenge-response wallet authentication implemented using Ethereum addresses (`did:ethr:<address>`); full on-chain decentralized document resolution registry deferred. |
| **Zero-Knowledge Proofs (ZK)** | **DEFERRED** | Cryptographic verification uses collision-resistant SHA-256 on-chain hashing; ZK-SNARK privacy circuits deferred to preserve project scope and avoid browser-side prover overhead. |
| **AI / ML Fraud Detection** | **DEFERRED** | Tamper detection is achieved mathematically via SHA-256 digest comparison; heuristic AI detection deferred. |
| **Mobile Native Application** | **DEFERRED** | Responsive web client developed with Next.js 16 and Tailwind CSS for desktop and mobile browsers. |
| **Cross-Chain Bridging** | **DEFERRED** | Single-chain EVM deployment on Hardhat Local; cross-chain state synchronization deferred. |



