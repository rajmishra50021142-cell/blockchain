# Operations Runbook & Local Environment Management

This document provides complete instructions for setting up, running, maintaining, and safely resetting the local development environment for the **Blockchain-Based Digital Document Locker**.

---

## 1. System Overview & Architecture

The application comprises three decoupled tiers:

1. **Smart Contracts (Blockchain Layer):**
   - Ethereum virtual machine contracts (`DocumentRegistry.sol`, `AccessControl.sol`) compiled with Solidity `0.8.24`.
   - Running locally on Hardhat node at `http://127.0.0.1:8545` (Chain ID `31337`).
2. **Backend API Gateway (`backend/`):**
   - Node.js / Express REST API running on port `3001`.
   - Enforces EIP-191 challenge-response wallet authentication, issues short-lived HMAC-SHA256 JWTs, proxies encrypted payloads to Pinata IPFS V3, and exposes read-only verification and audit reconstructors.
3. **Frontend Web Application (`frontend/`):**
   - Next.js 16 (React 19) web application running on port `3000`.
   - Performs client-side Web Crypto SHA-256 hashing and AES-256-GCM encryption before dispatching to the IPFS relay, manages MetaMask state, and invokes smart contract write methods directly via user signers.

---

## 2. Prerequisites & Tooling

Ensure the following tools are installed:
- **Node.js:** `v20.x` or higher (verified on Node `v24.18.0`).
- **npm:** `v10.x` or higher.
- **MetaMask Extension:** Installed on Chrome, Brave, or Edge.
- **Pinata IPFS Account:** API credentials (JWT) for decentralized storage pinning.

---

## 3. Environment Variables Configuration

### Root & Backend Environment (`.env` and `backend/.env`)

Create `backend/.env` based on `backend/.env.example`:

```bash
# Server Port & CORS
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Authentication Secret
AUTH_JWT_SECRET=YOUR_64_CHARACTER_RANDOM_HEX_SECRET
JWT_EXPIRES_IN=1h

# Blockchain RPC & Contracts
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CONTRACT_DOCUMENT_REGISTRY=0x5FbDB2315678afecb367f032d93F642f64180aa3
CONTRACT_ACCESS_CONTROL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Pinata IPFS V3 Relay
IPFS_API_URL=https://uploads.pinata.cloud/v3/files
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
IPFS_JWT=YOUR_PINATA_API_JWT_TOKEN
```

### Frontend Environment (`frontend/.env.local`)

Create `frontend/.env.local` based on `frontend/.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CONTRACT_DOCUMENT_REGISTRY=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CONTRACT_ACCESS_CONTROL=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_CONTRACT_NETWORK=localhost
```

> **Security Note:** Never add server secrets (`IPFS_JWT` or `AUTH_JWT_SECRET`) to `frontend/.env.local`. Only `NEXT_PUBLIC_*` configuration variables should be present.

---

## 4. Running the Development Stack

### Terminal 1: Hardhat Blockchain Node

```bash
cd blockchain
npx hardhat node
```
This starts the local Ethereum RPC node listening at `http://127.0.0.1:8545`.

### Terminal 2: Deploy Contracts (If Initializing)

```bash
cd blockchain
HARDHAT_TELEMETRY_DISABLED=1 npx hardhat run scripts/deploy-document-registry.ts --network localhost
HARDHAT_TELEMETRY_DISABLED=1 npx hardhat run scripts/deploy-access-control.ts --network localhost
```
Note the deployed contract addresses and verify they match `.env` and `frontend/.env.local`.

### Terminal 3: Backend API Server

```bash
cd backend
npm run dev
```
The server will start at `http://localhost:3001`. Verify readiness at `http://localhost:3001/ready`.

### Terminal 4: Frontend Application

```bash
cd frontend
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 5. Clean Environment Reset Procedure

When preparing for a fresh demonstration or resetting corrupted local state, follow this sequence:

### Step 1: Terminate Running Node Processes
Stop frontend, backend, and Hardhat node processes (`Ctrl+C`).

### Step 2: Restart Hardhat Node
```bash
cd blockchain
npx hardhat node
```
Restarting the node creates a clean in-memory blockchain state at Block 0 with fresh account balances (10,000 ETH each).

### Step 3: Redeploy Contracts
Deploy contracts to the fresh node in order:
```bash
cd blockchain
npx hardhat run scripts/deploy-document-registry.ts --network localhost
npx hardhat run scripts/deploy-access-control.ts --network localhost
```
*Note: Hardhat deterministic deployments always deploy to `0x5FbDB2315678afecb367f032d93F642f64180aa3` and `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` if deployed in the first two transactions from Account 0.*

### Step 4: Reset MetaMask Account Nonces
Because the blockchain was reset to block 0, MetaMask's internal transaction nonce cache will be ahead of the network, which causes transactions to fail with `Nonce too high` or `Nonce expired`.
1. In MetaMask, open **Settings** -> **Advanced**.
2. Click **Clear activity and nonce data** (or **Reset account**) for **Account 1** and **Account 2**.
3. Re-select the `Hardhat Local` network.

### Step 5: Restart Backend & Frontend
```bash
# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```

### Step 6: IPFS Retention Considerations
Pinata pins created during previous sessions remain pinned in Pinata Cloud. Because each new document uses a newly generated 256-bit AES key and fresh IV, previous CIDs do not collide. If you wish to unpin test files, use Pinata's web dashboard or API to remove unneeded CIDs.

---

## 6. Troubleshooting Common Issues

| Issue / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `Nonce too high` or `Nonce expired` in MetaMask | Blockchain was reset but MetaMask kept old nonce count | Go to MetaMask Settings -> Advanced -> Clear activity and nonce data. |
| `Failed to connect to API gateway` | Backend process not running or CORS blocked | Ensure backend is listening on port 3001 and CORS matches `http://localhost:3000`. |
| `Contract revert: DocumentAlreadyExists` | Re-registering the same document ID on the blockchain | Generate a fresh document ID or use the UI file uploader which generates a new ID. |
| `Wrong network (expected 31337)` | MetaMask is connected to Mainnet, Sepolia, etc. | Switch network in MetaMask to `Hardhat Local` (RPC `http://127.0.0.1:8545`, Chain ID `31337`). |
| `IPFS Upload 400 Bad Request` | Backend lacks valid `IPFS_JWT` credentials | Check that `IPFS_JWT` is set in `backend/.env` and possesses Pinata file pinning permissions. |
