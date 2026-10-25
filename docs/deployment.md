# Deployment Guide — Blockchain-Based Digital Document Locker

This document specifies the deployment infrastructure, environment configuration, startup procedures, network health verification, and operational runbooks for the Blockchain-Based Digital Document Locker system.

---

## 1. Scope & Progression

Deployment follows a phased, fail-closed architecture:
- **Phase 3 (Current)**: Local Ethereum/EVM Blockchain Network Infrastructure setup, RPC connectivity verification, dynamic account & balance checks, health-check runbooks, and real native transaction receipt verification.
- **Subsequent Phases**:
  - Phase 4: Identity & Wallet Integration (MetaMask, EIP-712 auth, DID mapping).
  - Phases 5–7: Smart Contract Deployments (`IdentityRegistry.sol`, `DocumentRegistry.sol`, `AccessControl.sol`).
  - Phase 8: Client-Side Cryptographic key management.
  - Phase 9: Distributed Storage (IPFS/Pinata) configuration.
  - Phase 10: Backend API Services deployment.
  - Phase 11: Frontend Next.js deployment.
  - Phase 13: Staging & Production testnet/mainnet deployment.

---

## 2. Environment Configuration

All configuration is managed strictly through environment variables loaded dynamically at runtime.

### 2.1 File Separation and Security Rules
- `.env.example`: Committed template displaying configuration keys with zero secrets or hardcoded endpoints.
- `.env`: Local runtime configuration file, strictly excluded from version control via [.gitignore](file:///Users/rajmishara/eman/.gitignore).
- **Rule**: No private keys, mnemonics, or RPC provider API keys are ever committed to source control.

### 2.2 Environment Variables Reference

| Variable | Description | Local Dev Value | Future Testnet Value |
| :--- | :--- | :--- | :--- |
| `RPC_URL` | Ethereum JSON-RPC endpoint URL | In-process or `http://127.0.0.1:8545` | Public testnet RPC URL (e.g. Infura/Alchemy) |
| `CHAIN_ID` | EVM Chain ID | `31337` | Target testnet ID (e.g. `11155111` for Sepolia) |
| `CONTRACT_NETWORK` | Network identifier string | `localhost` | `sepolia` |
| `IPFS_API_URL` | IPFS API endpoint (Phase 9) | *(Phase 9)* | *(Phase 9)* |
| `CONTRACT_ADDRESS` | Deployed Registry address (Phases 5–7) | *(Phases 5–7)* | *(Phases 5–7)* |

---

## 3. Local Blockchain Setup (Phase 3)

The local blockchain foundation is implemented with Hardhat in the `blockchain/` directory.

### 3.1 Prerequisites
- **Node.js**: v20+ (Verified on `v24.18.0`)
- **npm**: v10+ (Verified on `v11.16.0`)

### 3.2 Installation
From repository root:
```bash
cd blockchain
npm install
```

### 3.3 Network Startup
To start the persistent standalone local Ethereum node:
```bash
cd blockchain
npx hardhat node
# Or via npm script:
npm run node
```
The node will initialize an HTTP and WebSocket JSON-RPC server listening at:
```text
http://127.0.0.1:8545/
```
The local node automatically initializes 20 pre-funded test accounts with 10,000 native ETH each.

### 3.4 Stopping the Network
Press `Ctrl + C` in the terminal executing `npx hardhat node` to shut down the node.

---

## 4. Operational Runbooks & Validation

### 4.1 Automated Test Suite
To execute the comprehensive automated infrastructure test suite:
```bash
cd blockchain
npm test
```
This tests:
1. Provider connectivity and dynamic chain ID retrieval.
2. Development account and balance querying from the connected provider.
3. Native account-to-account transfer execution, block mining, and receipt verification.
4. Mined block inspection (hash, timestamp, transactions count).
5. Fail-closed failure handling for unreachable RPC endpoints and insufficient balances.

### 4.2 Blockchain Health Check
Run the real runtime health-check script:
```bash
# In-process Hardhat network:
cd blockchain
npm run health-check

# Standalone local node:
cd blockchain
npm run health-check:local
```
#### Output Schema:
```text
Blockchain Health Check

RPC: Connected
Chain ID: <actual runtime chain id>
Latest Block: <actual runtime block number>
Account: <actual runtime account address>
Balance: <actual runtime balance in ETH>

Status: HEALTHY
```

### 4.3 Real Transaction Verification
Execute a real account-to-account transaction on the blockchain:
```bash
# In-process Hardhat network:
cd blockchain
npm run test-tx

# Standalone local node:
cd blockchain
npm run test-tx:local
```
The script performs the following actions:
1. Retrieves two dynamic development signers (`Sender` and `Receiver`).
2. Submits a native transfer transaction of `0.05 ETH`.
3. Waits for block confirmation (`txResponse.wait(1)`).
4. Verifies `receipt.status === 1` (SUCCESS).
5. Inspects gas consumed (`gasUsed`) and effective gas price.
6. Retrieves and displays mined block headers (`number`, `hash`, `timestamp`, `transactions`).
7. Checks post-transaction sender and receiver balance updates.

---

## 5. Failure Handling & Honest Error Reporting

The blockchain integration enforces strict fail-closed operations without synthetic fallbacks:

| Failure Mode | Detection Mechanism | System Behavior |
| :--- | :--- | :--- |
| **RPC Unavailable** | Network request timeout / `ECONNREFUSED` | Halts execution; outputs `ERROR: Blockchain connection failed.` |
| **Network Mismatch** | `provider.getNetwork().chainId !== process.env.CHAIN_ID` | Halts execution; outputs `ERROR: Connected network does not match the expected network.` |
| **Transaction Failure** | Revert / EVM error on submission | Halts execution; outputs `ERROR: Real transaction test failed.` |
| **Receipt Unavailable** | Timeout waiting for mined receipt | Halts execution; outputs `ERROR: Transaction was submitted, but confirmation could not be obtained.` |

No mocked or synthetic success responses are permitted.

---

## 6. Public Testnet Preparation

When transitioning from local development to public testnets (e.g. Sepolia):
1. **Network Definition**: Define testnet block in `hardhat.config.ts` referencing `process.env.RPC_URL` and `process.env.CHAIN_ID`.
2. **Account Management**: Use hardware wallet or dedicated deployment key passed via secure environment variable (`DEPLOYER_PRIVATE_KEY`).
3. **Receipt Confirmations**: Increase receipt confirmation wait count to 2–5 blocks to ensure finality on public networks.
4. **Gas Strategies**: Enable EIP-1559 gas fee estimation (`maxFeePerGas`, `maxPriorityFeePerGas`).
