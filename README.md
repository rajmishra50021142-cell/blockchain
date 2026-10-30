# Blockchain-Based Digital Document Locker (Eman)

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum](https://img.shields.io/badge/Network-Ethereum%20EVM%20%7C%20Hardhat%20%7C%20Sepolia-3C3C3D?logo=ethereum)](https://ethereum.org/)
[![IPFS](https://img.shields.io/badge/Storage-IPFS%20%2F%20Pinata%20V3-65C2CB?logo=ipfs)](https://ipfs.tech/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%28React%2019%29-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2022%20%2F%20Express-339933?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Contributor:** Shah Emanul Haque (Reg. No: **25BCE1463**)  
> **Project Scope:** Decentralized, tamper-evident digital document locker providing self-sovereign document ownership, client-side AES-256-GCM encryption, on-chain cryptographic integrity anchors, granular multi-party access control, and instant tamper detection.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement & DigiLocker Comparison](#2-problem-statement--digilocker-comparison)
3. [System Architecture (5-Tier Topology)](#3-system-architecture-5-tier-topology)
4. [Registry Module (DocumentRegistry.sol)](#4-registry-module-documentregistrysol)
5. [Smart Contracts Architecture & Access Control](#5-smart-contracts-architecture--access-control)
6. [Storage Topology: On-Chain vs. Off-Chain](#6-storage-topology-on-chain-vs-off-chain)
7. [Verification & Multi-Tier Tamper Detection](#7-verification--multi-tier-tamper-detection)
8. [Technology Stack](#8-technology-stack)
9. [Project Directory Structure](#9-project-directory-structure)
10. [Getting Started & Local Setup](#10-getting-started--local-setup)
11. [License](#11-license)

---

## 1. Project Overview

The **Blockchain-Based Digital Document Locker** is an institutional-grade, zero-trust system for issuing, storing, verifying, and sharing high-value sovereign credentials (academic degrees, identity documents, legal contracts, and health records). 

Unlike centralized document repositories that depend on trusted third parties, this system implements:
* **Zero-Knowledge Confidentiality:** Plaintext documents never leave the client's browser unencrypted. Symmetrical key generation and authenticated AES-256-GCM encryption occur strictly client-side.
* **On-Chain Cryptographic Anchors:** File integrity is bound to an immutable SHA-256 fingerprint stored in Ethereum smart contracts.
* **Decentralized Persistence:** Encrypted payloads are pinned across the distributed InterPlanetary File System (IPFS) peer-to-peer network via the Pinata V3 API.
* **Self-Sovereign Access Governance:** Document owners retain sole authority to grant or revoke verifier access on-chain. There are zero administrative backdoors or master keys.
* **Non-Synthetic Data Policy:** Every wallet signature, transaction hash, block number, IPFS CID, and cryptographic hash originates from real client operations and live EVM consensus execution.

---

## 2. Problem Statement & DigiLocker Comparison

Centralized document lockers (such as the traditional government-run DigiLocker) have digitized records but suffer from critical systemic vulnerabilities:

| Vulnerability Dimension | Centralized Locker (DigiLocker) | Eman Blockchain Document Locker |
|---|---|---|
| **Architecture & Availability** | Centralized database & monolithic servers. Vulnerable to server downtime and single points of failure (over 3.68 crore accounts exposed in past incidents). | **Decentralized & Resilient:** Ethereum EVM consensus nodes coupled with distributed IPFS peer-to-peer storage. No single point of failure. |
| **Data Sovereignty & Custody** | Database administrators and hosting providers hold direct data access and can alter or inspect records without user consent. | **Self-Sovereign Ownership:** Protected by the user's private key (MetaMask / EIP-1193). Smart contracts forbid unauthorized alterations. |
| **Tamper Detection & Verification Speed** | Central database rows can be modified by rogue insiders. Verification requires manual, out-of-band communication taking days. | **Deterministic SHA-256 Anchors:** Files are cryptographically fingerprinted client-side. Tamper detection executes in under 2 seconds. |
| **Confidentiality at Rest** | Documents are stored plaintext or server-side encrypted where the service provider holds the decryption keys. | **Client-Side Authenticated Encryption:** Symmetrically encrypted in-browser with AES-256-GCM. Storage swarms handle only high-entropy ciphertext. |

---

## 3. System Architecture (5-Tier Topology)

The system is engineered as an institutional-grade **5-Tier Decentralized Layered Architecture**:

```text
+---------------------------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (Next.js 15 App Router + React 19 + Tailwind CSS + ethers.js v6)            |
|    - MetaMask Browser Wallet (EIP-1193 provider & EIP-191 personal signing)                      |
|    - W3C Web Crypto API: Local SHA-256 hashing & AES-256-GCM authenticated encryption             |
+------------------------------------+-------------------------------------+------------------------+
                                     | (EIP-191 Signed Nonce Challenge)    | (Direct EVM Writes)
                                     v                                     |
+------------------------------------+------------------------------+      |
| 2. APPLICATION GATEWAY (Node.js / Express / TypeScript REST API)   |      |
|    - Cryptographic Challenge Nonce Service (Passwordless Auth)    |      |
|    - IPFS Proxy Relay (Pinata V3 Client; handles ciphertext only) |      |
|    - ZERO private keys or credentials stored on backend           |      |
+------------------------------------+------------------------------+      |
                                     | (Relays Ciphertext)                 |
                                     v                                     |
+------------------------------------+------------------------------+      |
| 3. DECENTRALIZED STORAGE (IPFS Swarm Cluster / Pinata V3)         |      |
|    - Peer-to-Peer Content Addressing (CIDv0 & CIDv1)              |      |
|    - Stores Self-Contained Binary Envelopes [Ver | IV | Ciphertext] |     |
|    - ZERO Plaintext Stored (Mathematically unreadable on swarm)   |      |
+-------------------------------------------------------------------+      |
                                                                           v
+---------------------------------------------------------------------------------------------------+
| 4. BLOCKCHAIN CONSENSUS LAYER (Ethereum EVM / Hardhat Local / Sepolia Testnet)                     |
|    - DocumentRegistry.sol: Authoritative mapping of docId => (owner, SHA-256 hash, CID, status)  |
|    - AccessControl.sol: Granular verifier permission matrices & composite hasAccess validation    |
|    - Immutable EVM Event Logs: Append-only historical event records                               |
+---------------------------------------------------------------------------------------------------+
| 5. VERIFICATION & TAMPER-DETECTION LAYER (Real-Time Integrity Engine)                             |
|    - Candidate File Verification: Browser SHA-256 compared against on-chain hash (< 2s latency)   |
|    - Stored Object Audit: Decrypts IPFS payload and verifies cryptographic byte-level integrity  |
+---------------------------------------------------------------------------------------------------+
```

### Architectural Security Invariants
1. **Client-Side Cryptography Boundary:** Plaintext documents never leave the browser unencrypted. Key generation, symmetric encryption, and hashing occur inside `window.crypto.subtle`.
2. **Non-Custodial Design:** The backend API never holds private keys and cannot sign transactions. All state mutations require the user's explicit MetaMask signature.
3. **Stateless Gateway:** The Node.js application gateway acts solely as an authentication nonce generator and IPFS pinning relay.

---

## 4. Registry Module (DocumentRegistry.sol)

The `DocumentRegistry` contract serves as the authoritative, consensus-governed single source of truth for registered digital documents.

### 4.1 Storage Layout
To optimize EVM gas consumption and guarantee $O(1)$ constant-time lookups, the contract defines:

```solidity
struct Document {
    bytes32 documentId;   // Opaque 32-byte cryptographically secure identifier
    address owner;        // Sovereign wallet address (msg.sender at registration)
    bytes32 documentHash; // 32-byte SHA-256 digest of original plaintext bytes
    string  ipfsCid;       // Content Identifier string of the encrypted payload on IPFS
    uint256 registeredAt; // EVM block timestamp of registration
    bool    revoked;      // Permanent sovereign revocation status flag
}

mapping(bytes32 => Document) private _documents;
mapping(address => bytes32[]) private _userDocuments;
```

### 4.2 Opaque 32-Byte `documentId` Strategy
* Instead of predictable auto-incrementing integers (`1, 2, 3`) or plaintext filenames (`degree.pdf`), document IDs are generated client-side with 256 bits of CSPRNG entropy: `ethers.hexlify(ethers.randomBytes(32))`.
* **Security Benefits:** Neutralizes enumeration attacks, hides user portfolio volume, and prevents attackers from inferring document classifications.
* **Collision Defense:** `registerDocument` verifies that `_documents[documentId].owner == address(0)`; collisions revert with `DocumentAlreadyExists(documentId)`.

### 4.3 Core Lifecycle Operations
* `registerDocument(bytes32 documentId, bytes32 documentHash, string ipfsCid)`: Assigns ownership to `msg.sender`, stores the SHA-256 fingerprint and IPFS CID, records `registeredAt = block.timestamp`, sets `revoked = false`, and emits `DocumentRegistered`.
* `getDocument(bytes32 documentId)`: External view returning the complete struct. Reverts with `DocumentNotFound` if unallocated.
* `getUserDocuments(address user)`: Returns an array of all `bytes32` IDs registered by a specific wallet.
* `revokeDocument(bytes32 documentId)`: Restricts execution strictly to `msg.sender == doc.owner`. Sets `doc.revoked = true` and emits `DocumentRevoked`.
* **Revocation Semantics:** Revocation does not attempt to purge historical blocks (which is impossible on a blockchain). Instead, it mutates current state so that subsequent verification checks immediately fail with `REVOKED`.

---

## 5. Smart Contracts Architecture & Access Control

The blockchain layer is written in **Solidity 0.8.24** and is decoupled into two modular contracts linked via an interface:

```text
[ Next.js Client / MetaMask ]
              |
              v
     +-------------------+
     | AccessControl.sol | ----(queries IDocumentRegistry)----> [ DocumentRegistry.sol ]
     +-------------------+                                                 |
              |                                                            |
              +--- Emits AccessGranted / AccessRevoked ----> [ EVM Event Logs ]
```

### 5.1 Contract Decoupling
* **`DocumentRegistry.sol`**: Manages document lifecycle, ownership, integrity hashes, and document-level revocation.
* **`AccessControl.sol`**: Governs multi-party authorization, granting/revoking verifier permissions, and querying access rights.
* **`IDocumentRegistry.sol`**: Standardized interface defining `getDocument`, `documentExists`, and `isRevoked`, avoiding circular dependencies.

### 5.2 AccessControl Architecture
1. **Immutable Pointer:** The `documentRegistry` address is assigned in the constructor to an `immutable` variable (`public immutable documentRegistry`), permanently eliminating contract redirection attacks.
2. **Sparse Mapping:** Permissions are stored in `mapping(bytes32 => mapping(address => bool)) private _documentAccess;`, avoiding costly unbounded arrays.
3. **Composite `hasAccess` Verification:**
   $$\text{hasAccess} \iff (\text{exists} \land \neg\text{revoked} \land \text{isDirectlyGranted})$$
   ```solidity
   function hasAccess(bytes32 documentId, address verifier) external view returns (bool) {
       if (documentId == bytes32(0) || verifier == address(0)) return false;
       if (!documentRegistry.documentExists(documentId)) return false;
       if (documentRegistry.isRevoked(documentId)) return false;
       return _documentAccess[documentId][verifier];
   }
   ```
   **Security Consequence:** If an owner revokes a document in `DocumentRegistry`, access is automatically revoked for **all** authorized verifiers across the network in a single transaction.

### 5.3 Smart Contract Security Invariants
* **Solidity Custom Errors:** Bytecode uses typed errors (e.g. `error NotDocumentOwner(bytes32, address)`) instead of string reverts, saving ~2,000 gas per check.
* **Zero Admin Master Keys:** No contract owner or multi-sig admin can override document ownership, view private metadata, or manipulate permissions.
* **Reentrancy Immunity:** Implements the Checks-Effects-Interactions (CEI) pattern. Contracts never handle native Ether or call untrusted external contracts.

---

## 6. Storage Topology: On-Chain vs. Off-Chain

To solve the **Blockchain Storage Trilemma** (balancing on-chain gas costs, scalability, and data privacy), the project employs a hybrid storage model:

| Dimension | On-Chain Storage (Ethereum EVM) | Off-Chain Storage (IPFS / Pinata V3) |
|---|---|---|
| **Underlying Technology** | Ethereum consensus state trie (SSTORE storage slots) | InterPlanetary File System (IPFS) peer-to-peer libp2p DHT |
| **Persisted Data** | `bytes32 documentId`, `bytes32 documentHash`, `string ipfsCid`, `address owner`, timestamp, and revocation boolean | Canonical AES-256-GCM encrypted binary payloads (`application/octet-stream`) |
| **Cost Profile** | Fixed $O(1)$ gas cost (~60,000 gas per document) independent of file size | Bandwidth & cluster storage; accommodates files up to 100+ MB with zero gas overhead |
| **Confidentiality** | Public ledger data; contains **zero** plaintext bytes or cryptographic keys | Publicly accessible P2P swarm, but **100% mathematically unreadable** without the symmetric key |
| **Immutability Guarantee** | Proof-of-Stake consensus ledger immutability | Content-addressed cryptographic multihashes (CIDv0 / CIDv1) |

### 6.1 Client-Side Encryption Protocol (AES-256-GCM)
* **Key Generation:** Symmetrically generated per document using Web Crypto: `crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])`.
* **Initialization Vector (IV):** A fresh 96-bit CSPRNG IV is generated per document via `crypto.getRandomValues(new Uint8Array(12))` to prevent Galois/Counter Mode degradation.
* **Authentication Tag:** A 128-bit (16-byte) GHASH authentication tag is appended to the ciphertext. Any modification of ciphertext or IV causes decryption to fail closed with `AuthenticationError`.

### 6.2 Canonical Binary Payload Serialization Envelope
Encrypted payloads are structured into a standardized, self-contained binary envelope before pinning:

```text
+----------------+----------------+--------------------+-------------------------------------+
| Version (1B)   | IV Length (1B) | IV Bytes (12B)     | Ciphertext + 16-Byte Tag (M Bytes)  |
+----------------+----------------+--------------------+-------------------------------------+
| 0x01           | 0x0C           | 96-bit CSPRNG IV   | AES-256-GCM Ciphertext + GHASH Tag  |
+----------------+----------------+--------------------+-------------------------------------+
```

### 6.3 Key Isolation & Custody Rules
* Symmetrical keys are held **only in volatile browser RAM** during upload/download sessions.
* Keys are **never** stored in `localStorage`, cookies, or backend databases, and are **never** committed to Ethereum or IPFS.
* The owner downloads a local `.key` file (32 raw bytes or 64-char hex) to retain exclusive custody.

---

## 7. Verification & Multi-Tier Tamper Detection

The system supports two complementary verification workflows:

1. **Candidate File Verification (Zero-Knowledge):**
   * An operator selects a candidate document file (e.g., degree PDF).
   * Browser computes `SHA-256` locally and queries `POST /api/verify` with `documentId` and `candidateHash`.
   * Backend compares candidate hash against on-chain `documentHash` in `DocumentRegistry.sol` and checks permissions in `AccessControl.sol`.
   * Evaluates to `VERIFIED` in under 2 seconds without uploading plaintext.
2. **Stored Object Audit:**
   * Retrieves encrypted payload from IPFS via `GET /api/ipfs/:cid`.
   * Decrypts in-memory using the owner's `.key` file.
   * Hashes recovered plaintext and checks equality with `DocumentRegistry.documentHash`.

### Multi-Tier Threat Defense Matrix

| Attack Vector | Target Subsystem | Detection Mechanism | System Verdict |
|---|---|---|---|
| **1-Bit Alteration in Candidate File** | Local Document | Avalanche effect of SHA-256 produces a distinct digest; mismatches on-chain record | `TAMPER_DETECTED` |
| **Candidate File Substitution** | Local Document | Hash differs from registered `documentHash` in `DocumentRegistry.sol` | `TAMPER_DETECTED` |
| **Ciphertext Bit-Flip on IPFS** | IPFS Stored Blob | AES-256-GCM GHASH tag verification fails during Web Crypto decryption | `DECRYPTION_FAILED` |
| **IV or Tag Tampering on IPFS** | Binary Payload Envelope | Tampered 12-byte IV or 16-byte tag fails Galois field authentication check | `DECRYPTION_FAILED` |
| **Revocation by Document Owner** | Smart Contract State | `DocumentRegistry.isRevoked()` returns true; `hasAccess()` drops to false | `REVOKED` |
| **Unauthorized Verifier Query** | Access Control Mapping | Verifier address lacks affirmative entry in `_documentAccess`; HTTP 403 Forbidden | `UNAUTHORIZED` |

---

## 8. Technology Stack

| Layer | Technologies & Frameworks | Purpose in Project |
|---|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, ethers.js v6 | Responsive UI, client-side cryptographic hashing & encryption, MetaMask signing |
| **Backend API** | Node.js 22, Express.js, TypeScript, Helmet, CORS | Stateless EIP-191 challenge auth, Pinata V3 IPFS relay, event log filtering |
| **Smart Contracts** | Solidity 0.8.24, Hardhat, TypeChain, Ethereum EVM | Consensus-governed document registry and verifier access control |
| **Decentralized Storage** | IPFS, Pinata Files V3 REST API | Content-addressed distributed storage of encrypted binary payloads |
| **Cryptography** | W3C Web Crypto API, AES-256-GCM, SHA-256 (NIST FIPS 180-4) | Deterministic integrity fingerprinting and authenticated data-at-rest encryption |

---

## 9. Project Directory Structure

```text
eman/
├── ai_prompts/                      # Architectural requirements & implementation prompts
│   ├── MASTER_PLAN.md               # Master engineering plan & standards
│   ├── PHASE_1_PROMPT.md            # Blockchain network setup & environment
│   ├── ...                          # Phase prompts (2 through 15)
│   └── ai_rules.md                  # Non-synthetic data policy
├── backend/                         # Node.js Express REST API Gateway
│   ├── src/
│   │   ├── config/                  # Server & network configuration
│   │   ├── controllers/             # Auth, documents, IPFS, verification controllers
│   │   ├── middleware/              # EIP-191 auth, security headers, rate limiting
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # IPFS relay, blockchain event listeners
│   │   ├── app.ts                   # Express application setup
│   │   └── server.ts                # HTTP server entrypoint
│   └── tests/                       # API integration test suites
├── blockchain/                      # Ethereum Smart Contracts (Hardhat)
│   ├── contracts/
│   │   ├── DocumentRegistry.sol     # Sovereign document registry contract
│   │   ├── AccessControl.sol        # Verifier authorization management contract
│   │   └── interfaces/
│   │       └── IDocumentRegistry.sol# Cross-contract interface
│   ├── scripts/                     # Deployment and health check scripts
│   ├── test/                        # Smart contract invariant & security tests
│   └── hardhat.config.ts            # EVM network & compiler configuration
├── docs/                            # Architectural specifications & security documents
│   ├── architecture.md              # 5-Tier system architecture baseline
│   ├── cryptography.md              # SHA-256 & AES-256-GCM technical specification
│   ├── document-registry.md         # DocumentRegistry contract specification
│   ├── access-control.md            # AccessControl contract specification
│   ├── ipfs.md                      # IPFS & Pinata V3 decentralized storage spec
│   ├── verification.md              # Candidate verification & tamper detection spec
│   ├── security.md                  # Threat model & fail-closed security invariants
│   └── runbook.md                   # Operator deployment & operational runbook
├── frontend/                        # Next.js 15 Web3 Client Application
│   ├── app/                         # App Router pages (/documents, /register, /verify, /wallet)
│   ├── components/                  # React UI components (dashboard, registration, sharing, verify)
│   ├── lib/                         # Client-side crypto, API client, Web3 wallet providers
│   └── tests/                       # Frontend unit & integration tests
├── Blockchain_Document_Locker_Technical_Report.pdf # Publication-grade compiled technical report
├── generate_pdf_report.py           # Automated PDF generation pipeline
└── README.md                        # Project documentation (this file)
```

---

## 10. Getting Started & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **npm**: `v10.x` or higher
* **MetaMask**: Browser extension installed
* **Pinata Account**: Free or paid IPFS JWT token from [pinata.cloud](https://pinata.cloud)

### 1. Clone the Repository
```bash
git clone https://github.com/rajmishra50021142-cell/blockchain.git
cd blockchain
```

### 2. Configure Environment Variables
Copy `.env.example` across subdirectories:
```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Blockchain
cp blockchain/.env.example blockchain/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```
Update your `IPFS_JWT` in `backend/.env` and `blockchain/.env` with your Pinata credentials.

### 3. Deploy Smart Contracts (Hardhat)
```bash
cd blockchain
npm install
npx hardhat node
```
In a new terminal window:
```bash
cd blockchain
npx hardhat run scripts/deploy-document-registry.ts --network localhost
npx hardhat run scripts/deploy-access-control.ts --network localhost
```
Copy the deployed addresses into `backend/.env` and `frontend/.env.local`.

### 4. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
Backend will listen at `http://localhost:4000`.

### 5. Launch the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Connect MetaMask to Localhost (Chain ID: `31337`).

---

## 11. License

This project is licensed under the **MIT License**.
