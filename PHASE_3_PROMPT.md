# PHASE 3 — BLOCKCHAIN NETWORK SETUP
# Blockchain-Based Digital Document Locker

> **Phase:** 3 of the master implementation plan  
> **Primary objective:** Establish and validate the real Ethereum-compatible blockchain execution environment required by the project, including the local development network, accounts, identities, RPC connectivity, chain configuration, transaction capability, and blockchain health checks.
>
> **Critical phase boundary:** Phase 3 establishes the blockchain infrastructure only. Do NOT implement the project's document-locker smart contracts, IPFS, encryption, frontend, or business workflows yet.

---

# 1. PHASE OBJECTIVE

You are implementing **PHASE 3 — BLOCKCHAIN NETWORK SETUP**.

This phase directly addresses the mandatory project requirement for blockchain network setup.

The outcome must be a **real, working blockchain development environment**, not a simulated blockchain.

By the end of this phase, the repository must be able to:

1. start a real local Ethereum-compatible blockchain
2. expose a working RPC endpoint
3. provide real development accounts
4. retrieve the actual chain ID
5. retrieve the latest real block
6. retrieve real account balances
7. submit a real blockchain transaction
8. wait for a real transaction receipt
9. read real transaction/block data
10. detect blockchain/network failures
11. support later transition to a public Ethereum testnet
12. provide documented commands for starting/checking/testing the blockchain

Do not implement the project smart contracts in this phase.

---

# 2. MANDATORY DOCUMENTS TO READ FIRST

Before modifying anything, inspect and read:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. `PHASE_1_PROMPT.md`
4. `PHASE_2_PROMPT.md`
5. `docs/requirements.md`
6. `docs/requirements-traceability.md`
7. `docs/architecture.md`
8. `docs/api.md`
9. `docs/security.md`
10. the supplied Blockchain-Based Digital Document Locker PPT
11. the supplied mandatory requirements image
12. the current repository structure and existing implementation

### Authority order

Use this order when resolving requirements:

1. `ai_rules.md`
2. `MASTER_PLAN.md`
3. Phase 3 prompt
4. Phase 1 and Phase 2 documentation
5. supplied PPT and mandatory requirements image
6. existing implementation

Do not silently override a higher-priority requirement.

If a required source is missing or inaccessible:

- report the blocker
- do not invent the missing contents
- do not continue as if it was read

---

# 3. NON-SYNTHETIC-DATA POLICY

All rules in `ai_rules.md` remain mandatory.

This phase must use real blockchain behavior.

Never fabricate:

- wallet addresses
- development account addresses
- private keys
- chain IDs
- block numbers
- transaction hashes
- transaction receipts
- timestamps
- gas values
- balances
- network status
- contract addresses
- blockchain state

Any value presented as a blockchain result must come from the actual blockchain provider/node.

Conceptual examples may appear in documentation only if clearly labeled as examples.

Do not create:

- fake blockchain services
- fake RPC adapters used by the application
- fake transaction receipts
- fake chain state
- fake account balances
- hard-coded runtime blockchain status

---

# 4. SECURITY RULE FOR DEVELOPMENT ACCOUNTS

Local Hardhat development accounts are acceptable for development.

Real personal/private wallet credentials are NOT acceptable.

Never:

- use a personal wallet seed phrase in source code
- use a personal wallet private key in source code
- commit any real private key
- expose a real seed phrase
- expose testnet private keys to frontend code
- place secrets in `ai_rules.md`
- place secrets in `MASTER_PLAN.md`
- place secrets in source code

If a public testnet deployment account is eventually required, secrets must be supplied via environment variables and never committed.

---

# 5. PHASE 3 SCOPE

## IN SCOPE

Implement/validate:

- Hardhat local blockchain
- Ethereum-compatible local network
- local RPC endpoint
- local development accounts
- chain ID configuration
- provider connection
- blockchain health check
- real account/balance retrieval
- real latest-block retrieval
- real test transaction
- real transaction receipt
- real block/transaction inspection
- basic network configuration
- environment-variable structure for future testnet use
- blockchain developer documentation
- blockchain setup validation
- deployment foundation for later Solidity phases

## OUT OF SCOPE

Do NOT implement:

- `IdentityRegistry.sol`
- `DocumentRegistry.sol`
- `AccessControl.sol`
- document registration
- document sharing
- access revocation
- document verification
- tamper detection
- IPFS
- AES-256-GCM
- SHA-256 application logic
- Next.js document UI
- Node.js document APIs
- DID application logic
- audit dashboard
- production deployment

Those are later phases.

---

# 6. TECHNOLOGY REQUIREMENTS

Use the approved project stack.

Primary blockchain development technologies:

- Hardhat
- Solidity tooling required by Hardhat
- ethers.js
- Node.js
- TypeScript where appropriate

The local network must be Ethereum/EVM compatible.

Do not replace Hardhat with an unrelated blockchain framework unless the project owner explicitly changes the architecture.

---

# 7. REPOSITORY INSPECTION FIRST

Before changing anything:

1. inspect the current repository
2. identify whether `blockchain/` already exists
3. inspect `package.json`
4. inspect package manager and lockfile
5. inspect existing Hardhat configuration
6. inspect existing scripts
7. inspect existing deployment folders
8. inspect existing environment files
9. inspect existing Solidity files
10. inspect existing blockchain tests
11. determine whether Phase 3 work already exists

Do not:

- create duplicate Hardhat projects
- overwrite working configuration blindly
- delete valid existing files without justification
- introduce unnecessary dependencies

Preserve compatible work.

---

# 8. TARGET BLOCKCHAIN DIRECTORY STRUCTURE

Use/adapt this structure:

```text
blockchain/
├── contracts/
├── scripts/
├── test/
├── deployments/
├── hardhat.config.ts
├── package.json
└── README.md
```

At this phase:

- `contracts/` should NOT contain the actual project business contracts yet
- do NOT implement `IdentityRegistry.sol`
- do NOT implement `DocumentRegistry.sol`
- do NOT implement `AccessControl.sol`

Do not add temporary contracts unless absolutely necessary to validate infrastructure.

Prefer native account-to-account transactions for validating the network.

If a temporary infrastructure contract is absolutely necessary:

- clearly mark it as infrastructure-only
- keep it isolated
- document its purpose
- do not allow it to become production application logic

---

# 9. LOCAL BLOCKCHAIN REQUIREMENT

Set up a real local Ethereum-compatible blockchain using Hardhat.

The local network must provide:

- RPC endpoint
- chain ID
- real development accounts
- balances
- block production
- transaction processing
- transaction receipts
- block data

The agent must actually run and validate the network.

Creating configuration files without validating the network is NOT sufficient.

---

# 10. BLOCKCHAIN STARTUP

Provide a verified developer command for starting the local blockchain.

The exact command must be determined from the actual installed Hardhat version/configuration.

Do not invent commands.

Document the verified command in:

```text
blockchain/README.md
docs/deployment.md
```

The documentation should include:

- how to start the network
- how to stop the network
- how to identify the RPC endpoint
- how to inspect accounts
- how to run the health check
- how to run the real transaction test

---

# 11. BLOCKCHAIN HEALTH CHECK

Create a real blockchain health-check script or command.

It must retrieve runtime information from the actual provider.

At minimum retrieve:

- provider connectivity
- chain ID
- network information where available
- latest block number
- at least one development account
- account balance

Conceptual output:

```text
Blockchain Health Check

RPC: Connected
Chain ID: <actual runtime value>
Latest Block: <actual runtime value>
Account: <actual runtime account>
Balance: <actual runtime balance>

Status: HEALTHY
```

Every displayed value must come from the actual provider.

Never hard-code runtime output.

---

# 12. REAL DEVELOPMENT ACCOUNTS

Use accounts generated/provided by the local development blockchain.

The agent must determine how the configured Hardhat environment exposes the accounts.

Document:

- how many development accounts are available
- how to retrieve addresses
- how balances are retrieved
- how the accounts are used for testing
- that these are local development accounts

Do not manually invent account addresses.

---

# 13. ACCOUNT BALANCE CHECK

Implement a real account-balance check.

The balance must come from the connected provider.

The application/script must not create values such as:

```text
Balance: 100 ETH
```

unless the provider actually returns that balance.

If balance retrieval fails, report the real error.

---

# 14. CHAIN ID REQUIREMENT

Retrieve the connected network's actual chain ID.

Do not use a hard-coded UI value as the runtime truth.

Configuration may contain an expected chain ID, but runtime code must be able to query the actual provider.

If expected and actual network configuration differ:

```text
Expected network:
<configured expectation>

Actual network:
<provider result>

ERROR:
Connected network does not match the expected network.
```

Do not silently continue when a network mismatch would be unsafe.

---

# 15. LATEST BLOCK REQUIREMENT

The health check must retrieve the latest block number from the real blockchain provider.

The result must be dynamic.

Do not create a fixed block number.

The test must show that the local blockchain is actually producing blocks/processing transactions.

---

# 16. REAL TRANSACTION TEST

This is mandatory.

Use two actual local development accounts.

Perform a real account-to-account blockchain transaction.

Example conceptual flow:

```text
Development Account A
        |
        | real transaction
        v
Hardhat Ethereum Network
        |
        v
Transaction mined
        |
        v
Transaction Receipt
```

The test must retrieve actual:

- transaction hash
- sender
- receiver
- transferred value
- block number
- transaction status
- gas used where available
- receipt information

Do not fabricate any transaction data.

---

# 17. TRANSACTION CONFIRMATION REQUIREMENT

A transaction is successful only after the actual transaction receipt is obtained and indicates successful execution.

Expected flow:

```text
send transaction
      |
      v
transaction response
      |
      v
wait for confirmation
      |
      v
real transaction receipt
      |
      v
read actual receipt fields
```

Do NOT display:

> Transaction confirmed

before confirmation.

If the transaction fails:

- return the real error
- do not report success
- do not create a fallback transaction hash

---

# 18. TRANSACTION DATA INSPECTION

After the real transaction, inspect the actual transaction and receipt.

Where available, retrieve:

- hash
- from
- to
- value
- nonce
- gas used
- effective gas price
- block number
- status

Only fields actually available from the provider should be displayed.

If a field cannot be obtained, report it as unavailable rather than inventing it.

---

# 19. BLOCK DATA INSPECTION

After a successful transaction, retrieve the real block associated with the receipt.

Where available, show:

- block number
- block hash
- timestamp
- transaction count or other relevant provider data

Again, all values must come from the blockchain.

---

# 20. RPC CONFIGURATION

Create a clean provider configuration.

For local development, use the Hardhat local RPC.

Do NOT require an external RPC API key for the local network.

Prepare the application for later public testnet use.

Potential environment variables:

```env
RPC_URL=
CHAIN_ID=
CONTRACT_NETWORK=
```

Do not fill them with fake values.

If local Hardhat configuration does not require them, use the local configuration directly and document the later public-testnet variables.

---

# 21. PUBLIC TESTNET PREPARATION

Phase 3 must prepare for a future public Ethereum testnet, but local blockchain development must be completed first.

Later public configuration may look conceptually like:

```env
RPC_URL=<real RPC endpoint>
CHAIN_ID=<real chain id>
CONTRACT_NETWORK=<real testnet>
```

Do not enter fake values.

Do not force the user to obtain public RPC credentials if they are not necessary for the current local Phase 3 implementation.

If public testnet configuration is implemented as an optional verified path, document it separately from the local environment.

---

# 22. ENVIRONMENT VARIABLE SECURITY

Create or update:

```text
.env
.env.example
.gitignore
```

If they already exist:

- inspect first
- preserve valid configuration
- update minimally

`.env.example` may contain names only.

Example:

```env
RPC_URL=
CHAIN_ID=
CONTRACT_NETWORK=
```

The actual `.env` may remain empty or contain only values genuinely required for the currently validated environment.

Do not put:

- real private keys
- real seed phrases
- personal wallet secrets
- public-testnet secrets

into committed files.

---

# 23. FRONTEND SECRETS BOUNDARY

Phase 3 does not implement the frontend, but the architecture rule must be preserved:

- browser code must not receive private RPC credentials
- browser code must not receive server-side IPFS secrets
- private keys must never be exposed to browser code

MetaMask later handles user wallet authorization in Phase 4.

---

# 24. PROVIDER VALIDATION

Implement actual provider validation.

At minimum:

```text
provider reachable?
chain ID available?
latest block available?
accounts/balance available?
```

If any mandatory health check fails:

```text
Blockchain health check failed.
No blockchain operation should be reported as successful.
```

Never return synthetic health status.

---

# 25. BLOCKCHAIN FAILURE HANDLING

Test or structurally support:

## RPC unavailable

Result:

```text
Blockchain connection failed.
```

## Wrong network

Result:

```text
Connected network does not match expected network.
```

## Transaction failure

Result:

```text
Transaction failed.
```

## Receipt unavailable

Result:

```text
Transaction was submitted, but confirmation could not be obtained.
```

Do not report final success without actual confirmation.

---

# 26. GAS / FEE DATA

If gas information is displayed, it must come from the actual provider/receipt.

Do not hard-code:

- gas used
- gas price
- gas limit
- fee

If the provider does not expose a specific value in the expected context, show it as unavailable rather than fabricating it.

---

# 27. NETWORK HEALTH DOCUMENTATION

Document:

- local network
- RPC
- chain ID
- account source
- transaction process
- receipt process
- failure behavior

Do not document invented values.

If dynamic values are shown in examples, label them as runtime output examples, not permanent project values.

---

# 28. BLOCKCHAIN TEST COMMANDS

Provide verified commands/scripts for:

```text
start local blockchain
run blockchain health check
run real transaction test
run relevant tests
```

The commands must actually work in the current repository.

Do not provide speculative commands.

---

# 29. AUTOMATED TESTING

Create/implement tests for:

## Provider Connectivity

- provider is reachable
- chain ID is retrievable
- latest block is retrievable

## Accounts

- development account is available
- balance is retrievable

## Transaction

- real transaction can be created
- transaction is mined
- receipt is returned
- status is successful
- block number is returned

## Network failure

Where practical, test that provider failure is handled correctly.

The integration tests must exercise real local blockchain behavior.

Do not replace the real blockchain integration test with mocks.

If unit tests require mocking an isolated library component, keep that mock isolated and ensure it never becomes runtime application behavior.

---

# 30. DOCUMENTATION FILES

Create or update:

```text
blockchain/README.md
docs/deployment.md
docs/architecture.md
docs/requirements-traceability.md
```

Do not unnecessarily modify unrelated documentation.

---

# 31. blockchain/README.md CONTENT

Document:

```text
# Blockchain Development Environment

## Requirements

## Installation

## Local Network

## Starting Hardhat

## RPC Configuration

## Accounts

## Checking Chain ID

## Checking Latest Block

## Blockchain Health Check

## Real Transaction Test

## Inspecting Transaction Receipt

## Inspecting Block Data

## Failure Handling

## Public Testnet Preparation

## Security Notes
```

All commands must be verified.

---

# 32. docs/deployment.md UPDATE

Add a Phase 3 section covering:

- local blockchain setup
- network startup
- account retrieval
- health check
- test transaction
- receipt verification
- configuration
- future testnet configuration

Do not document contract deployment yet because the actual project contracts belong to later phases.

---

# 33. docs/architecture.md UPDATE

Add the Phase 3 implementation details to the architecture document:

- blockchain node
- RPC boundary
- provider
- development accounts
- transaction path
- receipt path
- network-health path
- later public-testnet boundary

Do not change the broader architecture without documenting the reason.

---

# 34. docs/requirements-traceability.md UPDATE

Map the Phase 3 work to the mandatory requirements.

At minimum:

```text
REQ-BLOCKCHAIN-001
Blockchain network setup
Phase: 3

REQ-BLOCKCHAIN-002
Network connectivity
Phase: 3

REQ-BLOCKCHAIN-003
Accounts/identities foundation
Phase: 3/4

REQ-BLOCKCHAIN-004
Real transaction handling
Phase: 3

REQ-BLOCKCHAIN-005
Network health/failure handling
Phase: 3
```

Use the actual requirement IDs already established in Phase 1 if they exist.

Do not create duplicate IDs unnecessarily.

---

# 35. PHASE 3 DELIVERABLES

At the end of this phase, the repository should contain a working blockchain-development foundation, including:

```text
blockchain/
├── hardhat.config.ts
├── scripts/
├── test/
├── deployments/
├── README.md
└── package.json
```

And verified documentation:

```text
docs/deployment.md
docs/architecture.md
docs/requirements-traceability.md
```

The exact final tree may vary if the repository already has an approved structure.

---

# 36. DO NOT IMPLEMENT SMART CONTRACT BUSINESS LOGIC

This is a critical boundary.

Do NOT create:

```text
IdentityRegistry.sol
DocumentRegistry.sol
AccessControl.sol
```

during Phase 3.

Those belong to:

- Phase 5
- Phase 6
- Phase 7

Phase 3 only proves that the blockchain environment exists and works.

---

# 37. DO NOT IMPLEMENT IPFS

Do not:

- create an IPFS client
- upload documents
- create CIDs
- create IPFS APIs

IPFS belongs to Phase 9.

---

# 38. DO NOT IMPLEMENT CRYPTOGRAPHY

Do not implement:

- SHA-256 document pipeline
- AES-256-GCM
- key management
- document encryption

These belong to Phase 8.

---

# 39. DO NOT IMPLEMENT FRONTEND / METAMASK

Do not build wallet UI in Phase 3.

MetaMask/browser wallet integration belongs primarily to Phase 4 and later frontend phases.

Phase 3 may document that MetaMask will later connect to the configured network.

Do not claim MetaMask integration is complete.

---

# 40. DO NOT IMPLEMENT THE NODE.JS API LAYER

Do not implement:

```text
/api/auth
/api/ipfs
/api/documents
/api/verify
/api/audit
```

Those belong to Phase 10.

Phase 3 only establishes the blockchain infrastructure that those later layers will use.

---

# 41. NO SYNTHETIC FALLBACKS

If the local blockchain fails:

Do NOT return:

```text
{
  connected: true
}
```

Do NOT return:

```text
blockNumber: 12345
```

Do NOT return:

```text
txHash: "0xDemo..."
```

Do NOT display:

```text
Transaction confirmed
```

unless the actual provider/receipt says so.

---

# 42. VALIDATION CHECKLIST

Before declaring Phase 3 complete:

## Repository

[ ] Current repository inspected
[ ] Existing blockchain configuration inspected
[ ] Duplicate infrastructure avoided

## Local Blockchain

[ ] Hardhat is configured
[ ] Local blockchain starts
[ ] RPC is reachable
[ ] Chain ID is retrieved from provider
[ ] Latest block is retrieved from provider
[ ] Development accounts are retrieved from provider
[ ] Account balances are retrieved from provider

## Real Transaction

[ ] Two real local accounts are available
[ ] Real transaction is sent
[ ] Real transaction is mined
[ ] Real receipt is retrieved
[ ] Real transaction hash is displayed
[ ] Real block number is retrieved
[ ] Real transaction status is verified
[ ] Real block data can be retrieved

## Failure Handling

[ ] RPC failure is handled
[ ] Network mismatch is handled
[ ] Transaction failure is handled
[ ] Receipt failure is handled
[ ] No fake fallback values exist

## Security

[ ] No real private keys committed
[ ] No seed phrases committed
[ ] `.env` protected by `.gitignore`
[ ] `.env.example` contains variable names only
[ ] No secrets exposed to browser code

## Documentation

[ ] blockchain/README.md updated
[ ] docs/deployment.md updated
[ ] docs/architecture.md updated
[ ] docs/requirements-traceability.md updated
[ ] commands verified

## Scope

[ ] No smart-contract business logic implemented
[ ] No IPFS implemented
[ ] No cryptography implemented
[ ] No frontend implemented
[ ] No application APIs implemented
[ ] No synthetic runtime data created

---

# 43. PHASE 3 ACCEPTANCE CRITERIA

Phase 3 is COMPLETE only when:

1. a real local Ethereum-compatible blockchain starts successfully
2. the project can connect to its RPC
3. the actual chain ID can be retrieved
4. the actual latest block can be retrieved
5. actual development accounts can be retrieved
6. actual balances can be retrieved
7. a real transaction can be submitted
8. a real transaction receipt can be retrieved
9. actual transaction data can be inspected
10. actual block data can be inspected
11. failures are handled honestly
12. no synthetic blockchain data exists in runtime code
13. no fake transaction data exists
14. no real secret has been committed
15. documentation is complete
16. Phase 3 is traceable to the mandatory requirements
17. later project features have NOT been implemented prematurely

---

# 44. REQUIRED FINAL AGENT REPORT

After Phase 3, return exactly this structure:

```text
PHASE:
Phase 3 — Blockchain Network Setup

PROJECT UNDERSTANDING:
Explain what was built and how it fits the overall project.

REPOSITORY INSPECTION:
Summarize the repository state before changes.

DOCUMENTS READ:
List all governing documents actually inspected.

FILES CREATED:
List exact paths.

FILES MODIFIED:
List exact paths.

BLOCKCHAIN SETUP:
Explain the local blockchain configuration.

NETWORK:
Explain the local RPC/network configuration.

CHAIN ID:
Report the actual runtime chain ID detected during validation.

ACCOUNTS:
Report how development accounts are obtained.
Do not expose private keys.

HEALTH CHECK:
Report actual results:
- provider
- chain ID
- latest block
- account
- balance

REAL TRANSACTION TEST:
Report:
- sender
- receiver
- transaction hash
- block number
- status
- receipt
- other actual fields retrieved

FAILURE HANDLING:
Explain tested/implemented failure behavior.

SECURITY:
Confirm secret-management behavior.

PUBLIC TESTNET PREPARATION:
Explain what has been prepared and what remains for later.

DOCUMENTATION:
List documentation updated.

REQUIREMENT TRACEABILITY:
Explain how Phase 3 satisfies the blockchain-network requirement.

SYNTHETIC-DATA CHECK:
Explicitly state whether any fabricated/mock blockchain data was
created.

LATER-PHASE CHECK:
Explicitly state whether any Phase 4+ feature was implemented.

BLOCKERS:
List actual unresolved blockers.

STATUS:
COMPLETE / INCOMPLETE
```

Do not expose private keys, seed phrases, API secrets, or other sensitive credentials in the final report.

---

# 45. FINAL PHASE BOUNDARY

When Phase 3 is complete:

STOP.

Do not automatically continue to Phase 4.

The next phase will handle wallet/identity integration.

Phase 3 must leave behind a verified, real blockchain foundation that later phases can rely on.

---

# 46. FINAL PRINCIPLE

The objective of this phase is not to make the project look like it has a blockchain.

The objective is to prove that the project has a **real functioning blockchain foundation**.

Therefore:

```text
Real node
   |
   v
Real RPC
   |
   v
Real account
   |
   v
Real transaction
   |
   v
Real receipt
   |
   v
Real block
```

If the real blockchain is unavailable:

```text
Blockchain unavailable
   |
   v
Honest error
```

Never:

```text
Blockchain unavailable
   |
   v
Fake success
```

END OF PHASE 3
