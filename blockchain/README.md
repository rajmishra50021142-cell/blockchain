# Blockchain Development Environment

This module provides the local Ethereum/EVM-compatible blockchain development infrastructure for the Blockchain-Based Digital Document Locker. It establishes a local node, RPC provider connectivity, dynamic account and balance management, health-check validation, and automated transaction verification without synthetic fallbacks or hardcoded runtime secrets.

---

## Requirements

- **Node.js**: `v20+` (verified on `v24.18.0`)
- **npm**: `v10+` (verified on `v11.16.0`)
- **Hardhat**: `^2.22.0`
- **Ethers.js**: `^6.10.0`
- **TypeScript**: `^5.3.3`

---

## Installation

Navigate to the `blockchain/` directory and install project dependencies:

```bash
cd blockchain
npm install
```

All build artifacts (`artifacts/`, `cache/`, `typechain-types/`) and environment configuration files (`.env`) are excluded from version control via [.gitignore](file:///Users/rajmishara/eman/.gitignore).

---

## Local Network

The local blockchain runs an in-memory or standalone Ethereum node provided by Hardhat:
- **EVM Compatibility**: Ethereum Cancun / London compatible EVM.
- **Block Production**: Instant automining upon transaction submission (configurable for interval mining).
- **Default Port**: `8545` (standard local JSON-RPC).
- **Default Chain ID**: `31337` (Hardhat local network default, dynamically configurable via `CHAIN_ID` environment variable).

---

## Starting Hardhat

To start a standalone persistent local Ethereum node with pre-funded development accounts:

```bash
# From within the blockchain/ directory:
npx hardhat node
# Or via npm script:
npm run node
```

### Stopping the Local Node
To gracefully terminate the local node process:
- Press `Ctrl + C` in the terminal where the node process is running.

---

## RPC Configuration

The Hardhat runtime and scripts connect dynamically to the Ethereum JSON-RPC endpoint. Provider settings are defined in [hardhat.config.ts](file:///Users/rajmishara/eman/blockchain/hardhat.config.ts):

- **In-Memory Network**: `hardhat` (executed in-process for tests and one-off commands).
- **Localhost Standalone RPC**: `localhost` (`http://127.0.0.1:8545` by default, or loaded from `RPC_URL` in environment).
- **Chain ID**: Dynamically loaded from `process.env.CHAIN_ID` if specified; otherwise defaults to `31337`.

Environment variables are configured in the repository root [.env](file:///Users/rajmishara/eman/.env) (refer to [.env.example](file:///Users/rajmishara/eman/.env.example) for variable names).

```env
RPC_URL=
CHAIN_ID=
CONTRACT_NETWORK=
```

> [!NOTE]
> No external RPC API key is required for local blockchain development.

---

## Accounts

Development accounts are generated dynamically by the local Hardhat node at startup. 
- Accounts are pre-funded with 10,000 native test ETH.
- Accounts are retrieved in scripts and tests dynamically via `await ethers.getSigners()`.
- **Zero Hardcoding**: Never hardcode account addresses or private keys in source code. Private keys are managed strictly by the local node and never committed.

---

## Checking Chain ID

To query the connected network's actual Chain ID at runtime:

```typescript
const network = await ethers.provider.getNetwork();
console.log(`Connected Chain ID: ${network.chainId.toString()}`);
```

If the `CHAIN_ID` environment variable is defined, all validation scripts enforce strict equality between `process.env.CHAIN_ID` and `network.chainId`. If a mismatch is detected, execution aborts immediately:

```text
Expected network:
Chain ID: <configured expectation>

Actual network:
Chain ID: <provider result>

ERROR:
Connected network does not match the expected network.
```

---

## Checking Latest Block

To query the latest mined block number directly from the provider:

```typescript
const latestBlock = await ethers.provider.getBlockNumber();
console.log(`Latest Block: ${latestBlock}`);
```

Every query returns the current dynamic state of the blockchain.

---

## Blockchain Health Check

The health-check utility verifies end-to-end provider connectivity, chain ID verification, block retrieval, and account balance availability.

### Execution Command:
```bash
# In-process Hardhat network:
npx hardhat run scripts/health-check.ts

# Standalone local node (npx hardhat node must be running):
npx hardhat run scripts/health-check.ts --network localhost
```

### Health Check Output Format (Dynamic Runtime Values):
```text
Blockchain Health Check

RPC: Connected
Chain ID: <actual runtime value>
Latest Block: <actual runtime value>
Account: <actual runtime account>
Balance: <actual runtime balance>

Status: HEALTHY
```

---

## Real Transaction Test

A dedicated transaction test performs an authentic account-to-account native transfer on the local blockchain, waits for 1 block confirmation, and inspects the resulting transaction receipt and block metadata.

### Execution Command:
```bash
# In-process Hardhat network:
npx hardhat run scripts/send-test-tx.ts

# Standalone local node:
npx hardhat run scripts/send-test-tx.ts --network localhost
```

---

## Inspecting Transaction Receipt

The transaction receipt is obtained directly from the node via `await txResponse.wait(1)`:
- `receipt.hash`: 32-byte transaction hash.
- `receipt.status`: `1` indicates success; `0` indicates revert.
- `receipt.blockNumber`: Block in which the transaction was mined.
- `receipt.from`: Originating sender address.
- `receipt.to`: Recipient address.
- `receipt.gasUsed`: Exact computational gas consumed by the transfer.
- `receipt.gasPrice`: Effective gas price in Wei / Gwei.

If receipt generation fails or the transaction reverts, the script throws an explicit error and exits fail-closed.

---

## Inspecting Block Data

Once a transaction receipt is confirmed, the block is retrieved and inspected via `await ethers.provider.getBlock(receipt.blockNumber)`:
- `block.number`: Verified block height.
- `block.hash`: Cryptographic block hash (keccak256).
- `block.timestamp`: Unix timestamp of block creation.
- `block.transactions`: Array of transaction hashes included in the block.

---

## Failure Handling

The infrastructure implements strict fail-closed error handling without synthetic fallbacks:
1. **RPC Unavailable**: If the provider cannot connect, scripts report:
   ```text
   ERROR: Blockchain connection failed.
   ```
2. **Network Mismatch**: If `CHAIN_ID` in `.env` differs from the connected provider:
   ```text
   ERROR: Connected network does not match expected network.
   ```
3. **Transaction Failure**: If a transaction fails or reverts:
   ```text
   ERROR: Real transaction test failed.
   ```
4. **Receipt Unavailable**: If a submitted transaction fails to confirm within the timeout:
   ```text
   ERROR: Transaction was submitted, but confirmation receipt could not be obtained.
   ```

No synthetic status or dummy block numbers are ever returned.

---

## Public Testnet Preparation

The architecture is prepared for seamless transition to public Ethereum testnets (e.g., Sepolia):
- RPC endpoints and Chain IDs are abstracted through environment variables (`RPC_URL`, `CHAIN_ID`, `CONTRACT_NETWORK`).
- Network configurations can be added to `hardhat.config.ts` without modifying application logic.
- Production and public testnet credentials will be injected via secure `.env` files outside version control.

---

## Security Notes

1. **Zero Secret Leakage**: No private keys, mnemonic seed phrases, or external API secrets are hardcoded or tracked in Git.
2. **Local Accounts Only**: Development accounts exposed by `npx hardhat node` are publicly documented default test accounts and must NEVER be used on Ethereum Mainnet or funded with real assets.
3. **Frontend Boundary**: Private keys and RPC administrative credentials remain strictly in server/developer environments and are never exposed to browser applications.
