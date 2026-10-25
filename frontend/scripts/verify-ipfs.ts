/**
 * Live IPFS Verification Script — Phase 9
 *
 * Demonstrates the full cryptographic and decentralized storage lifecycle:
 * 1. Takes real document bytes.
 * 2. Hashes original document with SHA-256 (Phase 8).
 * 3. Encrypts document with AES-256-GCM (Phase 8).
 * 4. Uploads real encrypted payload to live Pinata V3 API.
 * 5. Obtains authentic IPFS CID.
 * 6. Retrieves the exact payload from IPFS gateway via CID.
 * 7. Asserts byte-for-byte ciphertext integrity.
 * 8. Decrypts retrieved payload with original key.
 * 9. Asserts byte-for-byte plaintext recovery.
 * 10. Asserts recovered plaintext SHA-256 matches pre-encryption hash.
 *
 * NOTE: Never prints or exposes the IPFS_JWT secret or the raw encryption key.
 */

import * as fs from "fs";
import * as path from "path";
import {
  hashDocument,
  encryptDocument,
  decryptDocument,
  verifyDocumentHash,
} from "../lib/crypto";
import {
  uploadEncryptedPayload,
  downloadEncryptedPayload,
  isValidCid,
} from "../lib/ipfs";

// Load environment from .env without third-party dependencies
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../.env.example"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (val && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

async function main() {
  console.log("============================================================");
  console.log("PHASE 9: REAL IPFS INTEGRATION & CRYPTOGRAPHIC VERIFICATION");
  console.log("============================================================\n");

  loadEnv();

  const jwt = process.env.IPFS_JWT;
  if (!jwt) {
    console.error("[FAIL] IPFS_JWT is missing from environment. Aborting.");
    process.exit(1);
  }
  console.log("[PASS] IPFS_JWT detected in environment (credentials sanitized from output).");

  // Step 1: Real document bytes
  const documentPlaintext = new TextEncoder().encode(
    "%PDF-1.7\n" +
    "1 0 obj\n" +
    "<< /Type /Catalog /Pages 2 0 R >>\n" +
    "endobj\n" +
    "2 0 obj\n" +
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" +
    "endobj\n" +
    "3 0 obj\n" +
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n" +
    "endobj\n" +
    "xref\n" +
    "0 4\n" +
    "0000000000 65535 f \n" +
    "0000000009 00000 n \n" +
    "0000000058 00000 n \n" +
    "0000000115 00000 n \n" +
    "trailer\n" +
    "<< /Size 4 /Root 1 0 R >>\n" +
    "startxref\n" +
    "190\n" +
    "%%EOF"
  );

  console.log(`[STEP 1] Prepared real document content (${documentPlaintext.length} bytes).`);

  // Step 2: Compute SHA-256 hash (Phase 8)
  const originalHash = await hashDocument(documentPlaintext);
  console.log(`[STEP 2] Computed SHA-256 Hash: ${originalHash.hex}`);
  console.log(`         EVM bytes32 format:  ${originalHash.bytes32}`);

  // Step 3: Encrypt with AES-256-GCM (Phase 8)
  const encryptionResult = await encryptDocument(documentPlaintext);
  const uploadedBytes = encryptionResult.serialized;
  console.log(`[STEP 3] Client-side AES-256-GCM encryption complete.`);
  console.log(`         Serialized payload size: ${uploadedBytes.length} bytes (Version: ${uploadedBytes[0]}, IV len: ${uploadedBytes[1]} bytes).`);

  // Step 4: Upload to live Pinata V3 API
  console.log(`[STEP 4] Uploading encrypted payload to live Pinata V3 API...`);
  const filename = `document-locker-record-${Date.now()}.bin`;
  const uploadResult = await uploadEncryptedPayload(uploadedBytes, { name: filename });

  console.log(`[PASS] Upload confirmed by Pinata V3 API.`);
  console.log(`       Authentic IPFS CID: ${uploadResult.cid}`);
  console.log(`       Provider File ID:   ${uploadResult.id || "N/A"}`);
  console.log(`       Provider Pinned Sz: ${uploadResult.size} bytes`);

  // Step 5: CID format validation
  if (!isValidCid(uploadResult.cid)) {
    console.error(`[FAIL] Returned CID "${uploadResult.cid}" failed format validation.`);
    process.exit(1);
  }
  console.log(`[PASS] Verified authentic CID structure.`);

  // Step 6: Download from IPFS Gateway
  console.log(`\n[STEP 6] Downloading encrypted payload from IPFS gateway via CID...`);
  const downloadResult = await downloadEncryptedPayload(uploadResult.cid);
  const downloadedBytes = downloadResult.rawBytes;
  console.log(`[PASS] Downloaded ${downloadedBytes.length} bytes from IPFS gateway.`);

  // Step 7: Byte-for-byte ciphertext integrity check
  console.log(`[STEP 7] Verifying byte-for-byte ciphertext integrity...`);
  if (downloadedBytes.length !== uploadedBytes.length) {
    console.error(`[FAIL] Length mismatch: uploaded ${uploadedBytes.length} bytes, downloaded ${downloadedBytes.length} bytes.`);
    process.exit(1);
  }

  let byteMismatch = false;
  for (let i = 0; i < uploadedBytes.length; i++) {
    if (uploadedBytes[i] !== downloadedBytes[i]) {
      byteMismatch = true;
      break;
    }
  }

  if (byteMismatch) {
    console.error(`[FAIL] Byte-for-byte mismatch between uploaded and downloaded ciphertext!`);
    process.exit(1);
  }
  console.log(`[PASS] Ciphertext byte-for-byte integrity verified (100% exact match).`);

  // Step 8: Decrypt downloaded payload using original key (Phase 8)
  console.log(`[STEP 8] Decrypting downloaded payload with Phase 8 AES-256-GCM key...`);
  const decryptedPlaintext = await decryptDocument(downloadResult.payload, encryptionResult.key);
  console.log(`[PASS] Authenticated decryption succeeded (${decryptedPlaintext.length} bytes).`);

  // Step 9: Verify recovered plaintext matches original
  console.log(`[STEP 9] Verifying exact original document byte recovery...`);
  if (decryptedPlaintext.length !== documentPlaintext.length) {
    console.error(`[FAIL] Plaintext length mismatch: original ${documentPlaintext.length}, decrypted ${decryptedPlaintext.length}.`);
    process.exit(1);
  }

  let plaintextMismatch = false;
  for (let i = 0; i < documentPlaintext.length; i++) {
    if (documentPlaintext[i] !== decryptedPlaintext[i]) {
      plaintextMismatch = true;
      break;
    }
  }

  if (plaintextMismatch) {
    console.error(`[FAIL] Plaintext byte mismatch: Decrypted bytes do not match original!`);
    process.exit(1);
  }
  console.log(`[PASS] Exact original document bytes recovered successfully.`);

  // Step 10: Verify recovered plaintext hash matches original pre-encryption hash
  console.log(`[STEP 10] Verifying SHA-256 digest of recovered plaintext...`);
  const postHash = await hashDocument(decryptedPlaintext);
  const hashesMatch = await verifyDocumentHash(decryptedPlaintext, originalHash.hex);

  if (!hashesMatch || postHash.hex !== originalHash.hex) {
    console.error(`[FAIL] Hash mismatch: pre-encryption ${originalHash.hex}, post-decryption ${postHash.hex}.`);
    process.exit(1);
  }
  console.log(`[PASS] SHA-256 digest matches pre-encryption hash perfectly:`);
  console.log(`       Original Hash: ${originalHash.hex}`);
  console.log(`       Recovered Hash:${postHash.hex}`);

  console.log("\n============================================================");
  console.log("PHASE 9 VERIFICATION COMPLETE: ALL INTEGRITY CHECKS PASSED");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("\n[FATAL ERROR] Phase 9 execution encountered an unexpected error:", err);
  process.exit(1);
});
