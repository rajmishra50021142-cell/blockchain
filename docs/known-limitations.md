# Known Limitations & Technical Boundaries

This document records the architectural constraints, operational boundaries, and documented design trade-offs of the **Blockchain-Based Digital Document Locker** as verified in Phase 15.

---

## 1. Out-of-Band AES Key Distribution

### Context & Design Choice
Documents registered in the locker are encrypted client-side using **AES-256-GCM** with a cryptographically random 256-bit symmetric key. The encryption key is downloaded to the document owner's workstation as a `.key` file and is **never transmitted to the backend, never uploaded to IPFS, and never stored on the blockchain**.

### Limitation
The smart contract access control mechanism (`AccessControl.sol -> grantAccess()`) grants on-chain verification authorization to a designated Ethereum address, allowing that address to query metadata, retrieve the on-chain SHA-256 digest, and verify candidate documents via `POST /api/verify`.

However, the smart contract does **not** automatically distribute or escrow the symmetric AES decryption key. 
- An authorized verifier who possesses a copy of the candidate document can mathematically verify its authenticity against the blockchain without needing the AES key.
- If an authorized verifier wishes to download and decrypt the stored ciphertext from IPFS, they must obtain the 256-bit AES key from the document owner through an **out-of-band secure channel** (e.g., encrypted email, physical token, or secure messaging).

### Deferred Solution
Automated asymmetric key exchange (e.g., ECIES encryption of the AES key using the verifier's secp256k1 public key or Diffie-Hellman key agreement) was deliberately deferred to avoid ad-hoc or insecure browser cryptography and preserve strict project scope.

---

## 2. Local Hardhat Blockchain Deployment

### Context & Status
The smart contracts are compiled with Solidity `0.8.24` and deployed to a local Hardhat node (`http://127.0.0.1:8545`, Chain ID `31337`). 

### Limitation
The contracts have not been deployed to a public Ethereum testnet (e.g., Ethereum Sepolia, Base Sepolia, or Polygon Amoy) or mainnet. 
- Transactions mine with zero gas cost and near-instant latency in the local automining environment.
- Multi-node p2p propagation delays, gas price volatility (EIP-1559 base fees and priority tips), and transaction reorgs are not simulated in the local environment.

### Readiness for Public Deployment
The contracts, deployment scripts, and frontend configuration are fully parameterized via environment variables (`RPC_URL`, `CHAIN_ID`, contract addresses). Transitioning to a public testnet requires only updating RPC endpoints, chain ID, and funding a deployer wallet.

---

## 3. Browser Memory Constraints on Large Files

### Context & Implementation
File hashing and AES-256-GCM encryption are performed entirely within the client's browser using the W3C Web Crypto API (`crypto.subtle.digest` and `crypto.subtle.encrypt`).

### Limitation
Because the Web Crypto API processes data in contiguous `ArrayBuffer` allocations, encrypting large documents (e.g., high-resolution scans or media files exceeding 250 MB) can cause significant memory pressure or trigger browser tab crashes on memory-constrained devices. Streaming Web Crypto transforms or chunked hybrid encryption were deferred to maintain clean cryptographic boundary guarantees.

---

## 4. IPFS Gateway Persistence & Latency Dependency

### Context & Implementation
Encrypted payloads are relayed to the Pinata IPFS V3 API and pinned to decentralized storage nodes. Payload retrieval for stored-object auditing relies on public or dedicated IPFS gateways (`https://gateway.pinata.cloud/ipfs/`).

### Limitation
- IPFS retrieval performance is subject to external gateway latency, rate limits, and network connectivity.
- In network environments with restricted egress or sandbox firewalls where IPFS gateways are unreachable, stored-object audit requests will fail-closed and report `IPFS_UNAVAILABLE`. Candidate document verification remains unaffected because it verifies against the local Ethereum node.

---

## 5. Document Integrity vs. Issuer Legal Authenticity

### Context & Mathematical Guarantee
The locker provides mathematical proof of **data integrity** and **temporal precedence**:
1. It proves that a specific binary payload matched the exact SHA-256 hash registered at block number $N$.
2. It proves that the document was registered by the specific private key corresponding to the owner's Ethereum address.
3. It detects any 1-byte alteration via SHA-256 collision resistance.

### Limitation
The system does **not** provide a legal guarantee of issuer identity (e.g., whether the wallet address belongs to an accredited university or government authority) in the absence of a verified Decentralized Identifier (DID) registry, Verifiable Credentials (W3C VC), or an institutional PKI certification authority.

---

## 6. Smart Contract Formal Verification & Audit Status

### Context & Testing
The smart contracts have undergone extensive automated testing:
- 65 unit and integration tests passing in Hardhat.
- 7 core security invariant test suites verifying sovereign ownership binding, RBAC integrity, cross-tenant isolation, and stale-permission invalidation.
- Static analysis and zero-compiler-warning compilation under Solidity `0.8.24`.

### Limitation
The codebase has **not** undergone a formal external third-party security audit by a commercial blockchain audit firm (e.g., Trail of Bits, OpenZeppelin, Consensys Diligence). Production mainnet deployment should not occur without an external commercial security audit.

---

## 7. On-Chain Verifier Enumeration

### Context & Gas Optimization
In `AccessControl.sol`, verifier permissions are indexed via a nested mapping:
```solidity
mapping(bytes32 => mapping(address => bool)) private _accessPermissions;
```

### Limitation
Mappings in Solidity are non-enumerable for gas optimization. To prevent unbounded gas loops and denial-of-service vulnerabilities, the contract does not store a dynamic on-chain array of all active verifiers. Verifier lists in the UI are reconstructed from chronological `AccessGranted` and `AccessRevoked` event logs emitted by the contract.
