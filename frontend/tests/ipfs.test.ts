/**
 * Phase 9: Real IPFS Integration & Storage Tests
 *
 * Validates real communication with Pinata IPFS Files V3 API, authentic CID generation,
 * byte-for-byte integrity, and full cryptographic roundtrip with Phase 8 AES-256-GCM and SHA-256.
 *
 * CRITICAL RULE: Real runtime data only. Zero mock CIDs, zero synthetic fallbacks.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";

import {
  isValidCid,
  uploadEncryptedPayload,
  downloadEncryptedPayload,
  encryptAndUploadDocument,
  retrieveAndDecryptDocument,
  IpfsUploadError,
  InvalidCidError,
  IpfsDownloadError,
} from "../lib/ipfs";

import {
  hashDocument,
  encryptDocument,
  decryptDocument,
  generateDocumentKey,
  AuthenticationError,
} from "../lib/crypto";

// Helper to load environment from root .env without dotenv dependency
function loadEnvironment() {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../.env.example"),
  ];

  for (const envPath of possiblePaths) {
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

describe("Phase 9: Real IPFS Integration & Storage Tests", () => {
  before(() => {
    loadEnvironment();
  });

  describe("CID Format & Validation", () => {
    it("should accept valid CIDv0 strings", () => {
      assert.strictEqual(
        isValidCid("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
        true
      );
      assert.strictEqual(
        isValidCid("QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR"),
        true
      );
    });

    it("should accept valid CIDv1 strings in base32", () => {
      assert.strictEqual(
        isValidCid("bafkreigijdqqcp47asu5mp5ehtt72sxqguksy7dgtjfeas3hcb6o4xzojy"),
        true
      );
      assert.strictEqual(
        isValidCid("bafybeicg2abbgahdnugsuakeizyqdqlqspvygtgxov7cr2duejh2oc3eby"),
        true
      );
    });

    it("should reject invalid, empty, or malformed CID strings", () => {
      assert.strictEqual(isValidCid(""), false);
      assert.strictEqual(isValidCid("not-a-cid"), false);
      assert.strictEqual(isValidCid("QmShort"), false);
      assert.strictEqual(isValidCid("bafy-short"), false);
      assert.strictEqual(isValidCid("0x1234567890abcdef"), false);
    });
  });

  describe("Fail-Closed Error Handling & Boundary Defense", () => {
    it("should reject payloads smaller than the 30-byte minimum header size", async () => {
      const shortBytes = new Uint8Array([1, 2, 3]);
      await assert.rejects(
        async () => {
          await uploadEncryptedPayload(shortBytes);
        },
        (err: Error) => {
          assert.ok(err instanceof IpfsUploadError);
          assert.match(err.message, /shorter than minimum valid format length/);
          return true;
        }
      );
    });

    it("should fail-closed when IPFS_JWT credentials are missing", async () => {
      const samplePayload = new Uint8Array(40);
      samplePayload[0] = 0x01; // version
      samplePayload[1] = 0x0c; // ivLen

      await assert.rejects(
        async () => {
          await uploadEncryptedPayload(samplePayload, undefined, { jwt: "" });
        },
        (err: Error) => {
          assert.ok(err instanceof IpfsUploadError);
          assert.match(err.message, /Missing IPFS_JWT credentials/);
          return true;
        }
      );
    });

    it("should reject downloading an invalid CID format fail-closed", async () => {
      await assert.rejects(
        async () => {
          await downloadEncryptedPayload("invalid_cid_12345");
        },
        (err: Error) => {
          assert.ok(err instanceof InvalidCidError);
          assert.match(err.message, /Invalid IPFS CID format/);
          return true;
        }
      );
    });

    it("should fail-closed on non-existent CID from gateway without inventing data", async () => {
      // A well-formed CIDv1 that does not exist on IPFS
      const nonExistentCid = "bafybeihdwdcefgh4dqkjv67uaq3ae2u6eulp5gtgcw6q4522ndpq632222";
      await assert.rejects(
        async () => {
          await downloadEncryptedPayload(nonExistentCid, { timeoutMs: 3000 });
        },
        (err: Error) => {
          assert.ok(err instanceof IpfsDownloadError);
          return true;
        }
      );
    });
  });

  describe("Live Pinata V3 Upload, Download & Byte-for-Byte Integrity", () => {
    it("should upload Phase 8 encrypted payload to Pinata V3, retrieve via gateway, and assert byte-for-byte fidelity", async () => {
      const jwt = process.env.IPFS_JWT;
      assert.ok(jwt, "IPFS_JWT must be present in environment for live Pinata test.");

      // 1. Create realistic original document bytes (with null bytes and binary structure)
      const plaintext = new TextEncoder().encode(
        "%PDF-1.7\n1 0 obj\n<< /Title (Confidential Document Locker Record) /Date (2026-10-01) >>\nendobj\n"
      );
      const preHash = await hashDocument(plaintext);

      // 2. Encrypt document client-side with Phase 8 AES-256-GCM
      const encryptRes = await encryptDocument(plaintext);
      const uploadedCiphertextBytes = encryptRes.serialized;

      // 3. Upload serialized encrypted bytes to live Pinata V3 API
      const uploadRes = await uploadEncryptedPayload(uploadedCiphertextBytes, {
        name: `test-record-${Date.now()}.bin`,
      });

      assert.ok(uploadRes.cid, "Must receive a valid CID from Pinata V3");
      assert.ok(isValidCid(uploadRes.cid), `Returned CID "${uploadRes.cid}" must be valid IPFS CID`);

      // 4. Retrieve raw encrypted payload from IPFS via authentic CID
      const downloadRes = await downloadEncryptedPayload(uploadRes.cid);
      const downloadedCiphertextBytes = downloadRes.rawBytes;

      // 5. Byte-for-byte fidelity check
      assert.strictEqual(
        downloadedCiphertextBytes.length,
        uploadedCiphertextBytes.length,
        "Downloaded ciphertext length must match uploaded ciphertext length exactly"
      );

      let allBytesMatch = true;
      for (let i = 0; i < uploadedCiphertextBytes.length; i++) {
        if (uploadedCiphertextBytes[i] !== downloadedCiphertextBytes[i]) {
          allBytesMatch = false;
          break;
        }
      }
      assert.strictEqual(allBytesMatch, true, "Downloaded ciphertext must be identical byte-for-byte");

      // 6. Decrypt retrieved payload with original Phase 8 key
      const recoveredPlaintext = await decryptDocument(downloadRes.payload, encryptRes.key);

      // 7. Verify exact plaintext recovery
      assert.strictEqual(
        recoveredPlaintext.length,
        plaintext.length,
        "Recovered plaintext length must match original plaintext"
      );

      let plaintextMatch = true;
      for (let i = 0; i < plaintext.length; i++) {
        if (plaintext[i] !== recoveredPlaintext[i]) {
          plaintextMatch = false;
          break;
        }
      }
      assert.strictEqual(plaintextMatch, true, "Recovered plaintext must match original bytes exactly");

      // 8. Verify recovered plaintext SHA-256 matches pre-encryption hash
      const postHash = await hashDocument(recoveredPlaintext);
      assert.strictEqual(postHash.hex, preHash.hex, "SHA-256 digest of decrypted document must match original hash");
      assert.strictEqual(postHash.bytes32, preHash.bytes32, "bytes32 EVM representation must match original hash");
    });
  });

  describe("End-to-End Cryptography + IPFS Workflow Helpers", () => {
    it("should execute encryptAndUploadDocument and retrieveAndDecryptDocument successfully", async () => {
      const originalContent = new TextEncoder().encode(
        JSON.stringify({
          documentType: "MedicalReport",
          patientId: "P-98721",
          status: "AUTHENTIC",
          timestamp: 1790839345,
        })
      );

      // Upload and pin
      const pinResult = await encryptAndUploadDocument(originalContent, undefined, {
        name: `medical-record-${Date.now()}.bin`,
      });

      assert.ok(isValidCid(pinResult.cid), "Must produce a valid IPFS CID");
      assert.ok(pinResult.documentHash.length === 64, "Must produce a 64-char hex hash");
      assert.ok(pinResult.bytes32Hash.startsWith("0x"), "Must produce a 0x-prefixed bytes32 hash");

      // Retrieve and decrypt
      const retrieveResult = await retrieveAndDecryptDocument(
        pinResult.cid,
        pinResult.key,
        pinResult.documentHash
      );

      assert.strictEqual(retrieveResult.verified, true, "Verification must succeed");
      assert.strictEqual(
        new TextDecoder().decode(retrieveResult.plaintext),
        new TextDecoder().decode(originalContent),
        "Retrieved plaintext must match original content"
      );
    });
  });

  describe("Tamper & Adversarial Defense Over IPFS Data", () => {
    it("should fail authentication when IPFS-downloaded ciphertext has been tampered with", async () => {
      const plaintext = new TextEncoder().encode("Uncompromised sovereign document content.");
      const encryptRes = await encryptDocument(plaintext);

      // Upload genuine ciphertext
      const uploadRes = await uploadEncryptedPayload(encryptRes.serialized, {
        name: `tamper-test-${Date.now()}.bin`,
      });

      // Download genuine payload
      const downloadRes = await downloadEncryptedPayload(uploadRes.cid);

      // Mutate 1 byte of downloaded ciphertext
      const tamperedCiphertext = new Uint8Array(downloadRes.payload.ciphertext);
      tamperedCiphertext[10] ^= 0xff; // Flip bits

      const tamperedPayload = {
        ...downloadRes.payload,
        ciphertext: tamperedCiphertext,
      };

      // Decryption must fail closed
      await assert.rejects(
        async () => {
          await decryptDocument(tamperedPayload, encryptRes.key);
        },
        (err: Error) => {
          assert.ok(err instanceof AuthenticationError);
          return true;
        }
      );
    });

    it("should fail authentication when decrypted with an incorrect 256-bit key", async () => {
      const plaintext = new TextEncoder().encode("Target document for wrong key test.");
      const encryptRes = await encryptDocument(plaintext);
      const wrongKey = await generateDocumentKey();

      // Use serialized payload downloaded from IPFS
      const uploadRes = await uploadEncryptedPayload(encryptRes.serialized);
      const downloadRes = await downloadEncryptedPayload(uploadRes.cid);

      await assert.rejects(
        async () => {
          await decryptDocument(downloadRes.payload, wrongKey);
        },
        (err: Error) => {
          assert.ok(err instanceof AuthenticationError);
          return true;
        }
      );
    });
  });

  describe("Key & Credential Isolation Guarantees", () => {
    it("should ensure the symmetric key is NEVER embedded in the IPFS payload", async () => {
      const plaintext = new TextEncoder().encode("Testing secret separation.");
      const encryptRes = await encryptDocument(plaintext);

      // Get raw key bytes
      const rawKeyBuffer = await crypto.subtle.exportKey("raw", encryptRes.key);
      const rawKeyBytes = new Uint8Array(rawKeyBuffer);

      // Check whether 32 consecutive key bytes exist in serialized payload or downloaded payload
      const payloadBytes = encryptRes.serialized;
      let keyFound = false;
      for (let i = 0; i <= payloadBytes.length - 32; i++) {
        let match = true;
        for (let j = 0; j < 32; j++) {
          if (payloadBytes[i + j] !== rawKeyBytes[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          keyFound = true;
          break;
        }
      }

      assert.strictEqual(keyFound, false, "Raw encryption key bytes must NEVER be embedded in IPFS payload");
    });
  });
});
