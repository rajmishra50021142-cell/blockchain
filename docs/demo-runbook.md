# Faculty Demonstration Runbook — Digital Document Locker

This runbook provides a concise, step-by-step presentation script for demonstrating the **Blockchain-Based Digital Document Locker** to faculty and evaluators using the live application running on:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:3001`
- **Blockchain RPC:** `http://127.0.0.1:8545` (Chain ID: `31337`, Hardhat Local)

---

## Demonstration Setup & Prerequisites

1. **Browser:** Google Chrome or Brave with MetaMask extension installed.
2. **MetaMask Config:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. **Accounts Imported:**
   - **Account 1 (Owner):** Address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - **Account 2 (Verifier):** Address `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
4. **Sample Files Prepared:**
   - Create a sample document on your desktop: `sample_degree.pdf` or `official_transcript.txt`.

---

## Step-by-Step Presentation Script

### Part 1: Sovereign Wallet Connection & Authentication

1. **Navigate to the Application:**
   - Open `http://localhost:3000` in the browser.
   - Click **Connect Wallet** in the top navigation bar or go to `/wallet`.
2. **Connect Account 1 (Owner):**
   - In MetaMask, select **Account 1** (`0xf39F...2266`).
   - Click **Connect MetaMask**. The UI displays the connected wallet address, balance (`~9989 ETH`), and active network (`Hardhat Local - 31337`).
3. **Cryptographic EIP-191 Authentication:**
   - Note the **API Authentication** card. Explain: *"Connecting a wallet only gives read access; interacting with storage requires authenticating identity via an EIP-191 cryptographic signature."*
   - Click **Authenticate Session**.
   - Review and sign the challenge prompt in MetaMask.
   - The status updates to **API Authenticated** with a 15-minute active session. Show that the raw JWT token is shielded for security.

---

### Part 2: Client-Side Encryption & Document Registration

4. **Navigate to Document Registration:**
   - Click **Register Document** (`/register`).
5. **Select Candidate Document:**
   - Drag and drop or browse to select `official_transcript.txt`.
   - The UI immediately computes the **SHA-256 Digest** in the browser using the Web Crypto API (`crypto.subtle.digest`).
   - Point out: *"The plaintext never leaves the browser in unencrypted form."*
6. **Execute Client-Side Encryption:**
   - Click **Encrypt & Register Document**.
   - Explain what happens behind the scenes:
     1. Browser generates a random 256-bit AES-GCM key and 12-byte IV.
     2. Browser encrypts the binary payload and packages it with version headers.
     3. An automatic download of the `.key` file prompts the user to save their private decryption key.
7. **Decentralized Storage & On-Chain Mining:**
   - The encrypted ciphertext is relayed to Pinata IPFS; show the returned **Content Identifier (CID)** (e.g. `bafkreia...`).
   - MetaMask prompts to confirm the on-chain registration transaction on `DocumentRegistry.sol`. Click **Confirm**.
   - Show the mined transaction receipt:
     - **Transaction Hash:** `0x...`
     - **Block Number:** e.g. `356`
     - **Gas Used:** `~212,639`
8. **Inspect Document Details:**
   - Click **View Document in Locker** (`/documents/[id]`).
   - Point out the immutable on-chain record:
     - **Owner Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
     - **Document SHA-256 Hash:** Stored on Ethereum
     - **IPFS CID:** Stored on Ethereum
     - **Revocation Status:** Active (Not Revoked)

---

### Part 3: Granular On-Chain Access Control (Sharing)

9. **Grant Access to Account 2 (Verifier):**
   - On the document details page, scroll to the **Access Control & Sharing** section.
   - Enter Account 2's address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
   - Click **Grant Access**.
   - Confirm the transaction in MetaMask (`AccessControl.sol -> grantAccess`).
   - Once mined, observe the **Active Authorized Verifiers** table update in real time to show `0x7099...79C8` with **Active** status.

---

### Part 4: Multi-User Switching & Verification

10. **Switch MetaMask to Account 2 (Verifier):**
    - Open MetaMask and select **Account 2** (`0x7099...79C8`).
    - The UI immediately detects the account switch and prompts to re-authenticate as Account 2.
11. **Authenticate Account 2:**
    - Click **Authenticate Session** and sign the challenge with Account 2.
12. **Perform Authorized Document Verification:**
    - Navigate to **Verify Document** (`/verify`).
    - Enter the Document ID from the registration step.
    - Upload the exact original `official_transcript.txt`.
    - Click **Verify Candidate Document**.
    - Point out the real-time result:
      - **Verdict:** `VERIFIED`
      - **Cryptographic Match:** `true`
      - **On-Chain Owner:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
      - **On-Chain Hash:** `0xd53f064968acf686a96965ed8a7e827f16c3e19275dbe11fc3dc30d92707ef49`
      - **Candidate Hash:** `0xd53f064968acf686a96965ed8a7e827f16c3e19275dbe11fc3dc30d92707ef49`
      - **Duration:** `< 30 ms`

---

### Part 5: Tamper Detection Demonstration

13. **Simulate 1-Byte Unauthorized Modification:**
    - Open `official_transcript.txt` in a text editor (e.g. VS Code, TextEdit).
    - Change a single character (e.g., change grade `A` to `B`, or add a single space). Save the file.
14. **Verify Modified Candidate Document:**
    - In the verification portal (`/verify`), upload the modified file.
    - Click **Verify Candidate Document**.
    - Show the tamper detection verdict:
      - **Verdict:** `TAMPER_DETECTED` (Red alert badge)
      - **Status:** Candidate document hash does NOT match the immutable on-chain record.
      - **Candidate Hash:** Displays altered SHA-256 digest.
      - **On-Chain Hash:** Displays original authentic SHA-256 digest.
    - Explain: *"Even a single bit flip completely alters the SHA-256 digest due to the avalanche effect, proving mathematically that the document was altered after registration."*

---

### Part 6: Access Revocation & Audit Trail Lineage

15. **Switch MetaMask Back to Account 1 (Owner):**
    - Switch to **Account 1** in MetaMask and re-authenticate.
16. **Revoke Account 2 Access:**
    - Navigate to `/documents/[id]` for the registered document.
    - In the **Access Control** table, find `0x7099...79C8` and click **Revoke Access**.
    - Confirm the transaction in MetaMask (`AccessControl.sol -> revokeAccess`).
    - Once confirmed, Account 2 is marked as **Revoked / Inactive**.
17. **Demonstrate Immediate Access Denial:**
    - Switch MetaMask back to Account 2, authenticate, and try verifying the document again at `/verify`.
    - The request is immediately rejected with:
      `Access denied: you do not possess on-chain permission for this document (HTTP 403 / UNAUTHORIZED)`.
18. **Inspect Tamper-Evident Chronological Audit Trail:**
    - Navigate to **Audit Trail** (`/audit`) or view the audit section on `/documents/[id]`.
    - Show the reconstructed event history mined from the blockchain:
      1. `DocumentRegistered` (Block N, Owner `0xf39F...`)
      2. `AccessGranted` (Block N+1, Verifier `0x7099...`)
      3. `AccessRevoked` (Block N+2, Verifier `0x7099...`)
    - Highlight: *"Every action produces an immutable on-chain event log that cannot be altered or deleted by any administrator."*
