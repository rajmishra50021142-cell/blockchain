import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashDocument,
  verifyDocumentHash,
  generateDocumentKey,
  generateIV,
  exportKey,
  exportKeyHex,
  importKey,
  encryptDocument,
  decryptDocument,
  decryptAndVerify,
  serializeEncryptedPayload,
  deserializeEncryptedPayload,
  AuthenticationError,
  MalformedPayloadError,
  CryptographicError,
  PROTOCOL_VERSION,
  GCM_IV_BYTE_LENGTH,
  GCM_TAG_BYTE_LENGTH,
} from "../lib/crypto/document-crypto";

describe("Phase 8: Cryptography — SHA-256 & AES-256-GCM Test Suite", () => {
  // =========================================================================
  // 1. SHA-256 IMPLEMENTATION & TEST VECTORS
  // =========================================================================

  describe("SHA-256 Document Hashing", () => {
    it("should deterministically produce identical hashes for identical inputs", async () => {
      const data = new TextEncoder().encode("Authentic digital document bytes for sovereignty testing");
      const hash1 = await hashDocument(data);
      const hash2 = await hashDocument(data);

      assert.equal(hash1.hex, hash2.hex, "SHA-256 digests must be deterministic");
      assert.equal(hash1.bytes32, hash2.bytes32);
      assert.deepEqual(hash1.raw, hash2.raw);
    });

    it("should exhibit strict avalanche sensitivity on single-byte modification", async () => {
      const data1 = new TextEncoder().encode("The sovereign digital document version 1.0.0");
      const data2 = new TextEncoder().encode("The sovereign digital document version 1.0.1"); // 1 char difference

      const hash1 = await hashDocument(data1);
      const hash2 = await hashDocument(data2);

      assert.notEqual(hash1.hex, hash2.hex, "Hashes must diverge completely on a 1-byte alteration");

      // Verify avalanche effect: at least 20 hex characters differ
      let differingChars = 0;
      for (let i = 0; i < hash1.hex.length; i++) {
        if (hash1.hex[i] !== hash2.hex[i]) differingChars++;
      }
      assert.ok(differingChars >= 20, "Avalanche effect must alter majority of hash digest");
    });

    it("should match standard NIST test vectors", async () => {
      // Vector 1: Empty string
      const emptyHash = await hashDocument(new Uint8Array(0));
      assert.equal(
        emptyHash.hex,
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "NIST vector for empty string must match"
      );

      // Vector 2: "abc"
      const abcBytes = new TextEncoder().encode("abc");
      const abcHash = await hashDocument(abcBytes);
      assert.equal(
        abcHash.hex,
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        "NIST vector for 'abc' must match"
      );

      // Vector 3: "The quick brown fox jumps over the lazy dog"
      const foxBytes = new TextEncoder().encode("The quick brown fox jumps over the lazy dog");
      const foxHash = await hashDocument(foxBytes);
      assert.equal(
        foxHash.hex,
        "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
        "NIST vector for 'quick brown fox' must match"
      );
    });

    it("should preserve exact binary input including null bytes without alteration", async () => {
      const binaryPayload = new Uint8Array([0x00, 0x01, 0x00, 0xff, 0xfe, 0x00, 0x80, 0x7f, 0x00]);
      const result = await hashDocument(binaryPayload);

      assert.equal(result.raw.length, 32);
      assert.match(result.hex, /^[0-9a-f]{64}$/);
    });

    it("should produce a canonical bytes32 format compatible with DocumentRegistry.sol", async () => {
      const data = new TextEncoder().encode("Registry compatibility document");
      const result = await hashDocument(data);

      assert.ok(result.bytes32.startsWith("0x"), "Must begin with 0x prefix");
      assert.equal(result.bytes32.length, 66, "Must be exactly 66 characters (0x + 64 hex characters)");
      assert.match(result.bytes32, /^0x[0-9a-f]{64}$/, "Must contain only lowercase hex characters");
    });

    it("should verify correct and incorrect document hashes reliably", async () => {
      const data = new TextEncoder().encode("Verification target bytes");
      const hashResult = await hashDocument(data);

      assert.equal(await verifyDocumentHash(data, hashResult.hex), true);
      assert.equal(await verifyDocumentHash(data, hashResult.bytes32), true);
      assert.equal(await verifyDocumentHash(data, "0x" + "0".repeat(64)), false);
    });
  });

  // =========================================================================
  // 2. AES-256-GCM KEY & IV GENERATION
  // =========================================================================

  describe("AES-256-GCM Key & IV Lifecycle", () => {
    it("should generate a 256-bit (32-byte) AES-GCM key", async () => {
      const key = await generateDocumentKey();
      assert.equal(key.algorithm.name, "AES-GCM");
      // @ts-expect-error length is exposed on AesKeyGenParams
      assert.equal(key.algorithm.length, 256);

      const exported = await exportKey(key);
      assert.equal(exported.length, 32, "Exported raw key must be exactly 32 bytes (256 bits)");

      const hex = await exportKeyHex(key);
      assert.equal(hex.length, 64, "Exported hex key must be 64 characters");
      assert.match(hex, /^[0-9a-f]{64}$/);
    });

    it("should export and re-import keys without loss of cryptographic material", async () => {
      const originalKey = await generateDocumentKey();
      const exportedBytes = await exportKey(originalKey);
      const exportedHex = await exportKeyHex(originalKey);

      const importedFromBytes = await importKey(exportedBytes);
      const importedFromHex = await importKey(exportedHex);

      const reExported1 = await exportKey(importedFromBytes);
      const reExported2 = await exportKey(importedFromHex);

      assert.deepEqual(reExported1, exportedBytes);
      assert.deepEqual(reExported2, exportedBytes);
    });

    it("should reject invalid key lengths on import", async () => {
      const invalidShortKey = new Uint8Array(16); // 128-bit key (disallowed for 256-bit invariant)
      await assert.rejects(
        () => importKey(invalidShortKey),
        (err: Error) => {
          assert.ok(err instanceof CryptographicError);
          assert.ok(err.message.includes("256 bits"));
          return true;
        }
      );
    });

    it("should generate a 96-bit (12-byte) IV for GCM", () => {
      const iv1 = generateIV();
      const iv2 = generateIV();

      assert.equal(iv1.length, GCM_IV_BYTE_LENGTH, "IV must be exactly 12 bytes");
      assert.equal(iv2.length, GCM_IV_BYTE_LENGTH, "IV must be exactly 12 bytes");
      assert.notDeepEqual(iv1, iv2, "Successive random IVs must not be identical");
    });
  });

  // =========================================================================
  // 3. ENCRYPTION & DECRYPTION ROUND TRIP
  // =========================================================================

  describe("AES-256-GCM Encryption & Decryption", () => {
    it("should encrypt and decrypt plaintext restoring exact original bytes", async () => {
      const plaintext = new TextEncoder().encode("Confidential sovereign identity document content");
      const { payload, key } = await encryptDocument(plaintext);

      assert.equal(payload.version, PROTOCOL_VERSION);
      assert.equal(payload.iv.length, GCM_IV_BYTE_LENGTH);
      assert.ok(payload.ciphertext.length >= plaintext.length + GCM_TAG_BYTE_LENGTH);

      const decrypted = await decryptDocument(payload, key);
      assert.deepEqual(decrypted, plaintext, "Decrypted bytes must match original plaintext exactly");
    });

    it("should preserve arbitrary binary files (e.g. simulated PDF header and bytes)", async () => {
      // %PDF-1.4 with arbitrary binary tokens and nulls
      const pdfBytes = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3,
        0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0x00,
      ]);

      const { serialized, keyBytes } = await encryptDocument(pdfBytes);
      const decrypted = await decryptDocument(serialized, keyBytes);

      assert.deepEqual(decrypted, pdfBytes);
    });

    it("should accept pre-existing keys for encryption", async () => {
      const sharedKey = await generateDocumentKey();
      const plaintext = new TextEncoder().encode("Multi-document encrypted with same key instance");

      const enc1 = await encryptDocument(plaintext, sharedKey);
      const enc2 = await encryptDocument(plaintext, sharedKey);

      // IVs must be different even when key is the same!
      assert.notDeepEqual(enc1.payload.iv, enc2.payload.iv);
      // Ciphertexts must be different because IVs differ!
      assert.notDeepEqual(enc1.payload.ciphertext, enc2.payload.ciphertext);

      // Both must decrypt cleanly
      assert.deepEqual(await decryptDocument(enc1.payload, sharedKey), plaintext);
      assert.deepEqual(await decryptDocument(enc2.payload, sharedKey), plaintext);
    });
  });

  // =========================================================================
  // 4. PAYLOAD SERIALIZATION & PROTOCOL DESERIALIZATION
  // =========================================================================

  describe("Encrypted Payload Serialization Format", () => {
    it("should serialize to canonical binary format and deserialize without alteration", async () => {
      const plaintext = new TextEncoder().encode("Binary format specification test");
      const { payload, serialized, key } = await encryptDocument(plaintext);

      assert.equal(serialized[0], PROTOCOL_VERSION, "First byte must be protocol version 1");
      assert.equal(serialized[1], GCM_IV_BYTE_LENGTH, "Second byte must be IV length 12");
      assert.deepEqual(serialized.slice(2, 14), payload.iv, "Bytes 2..13 must be the IV");
      assert.deepEqual(serialized.slice(14), payload.ciphertext, "Bytes 14..N must be ciphertext + tag");

      const unpacked = deserializeEncryptedPayload(serialized);
      assert.equal(unpacked.version, PROTOCOL_VERSION);
      assert.deepEqual(unpacked.iv, payload.iv);
      assert.deepEqual(unpacked.ciphertext, payload.ciphertext);

      // Decrypt directly from serialized buffer
      const decrypted = await decryptDocument(serialized, key);
      assert.deepEqual(decrypted, plaintext);
    });

    it("should reject corrupted or truncated serialized payloads", () => {
      // Under minimum length
      const tooShort = new Uint8Array([0x01, 0x0c, 0x00]);
      assert.throws(
        () => deserializeEncryptedPayload(tooShort),
        (err: Error) => err instanceof MalformedPayloadError
      );

      // Unsupported version
      const wrongVersion = new Uint8Array(40);
      wrongVersion[0] = 0x99; // Version 99
      wrongVersion[1] = 0x0c;
      assert.throws(
        () => deserializeEncryptedPayload(wrongVersion),
        (err: Error) => {
          assert.ok(err instanceof MalformedPayloadError);
          assert.ok(err.message.includes("Unsupported"));
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 5. AUTHENTICATION & TAMPER DETECTION
  // =========================================================================

  describe("Authentication Failures & Tamper Detection", () => {
    it("should fail authentication when a single byte of ciphertext is modified", async () => {
      const plaintext = new TextEncoder().encode("Integrity protected message");
      const { payload, key } = await encryptDocument(plaintext);

      // Flip 1 byte in the ciphertext body
      const tamperedCiphertext = new Uint8Array(payload.ciphertext);
      tamperedCiphertext[0] ^= 0x01; // Invert least significant bit

      const tamperedPayload = {
        ...payload,
        ciphertext: tamperedCiphertext,
      };

      await assert.rejects(
        () => decryptDocument(tamperedPayload, key),
        (err: Error) => err instanceof AuthenticationError,
        "Decryption must throw AuthenticationError when ciphertext is modified"
      );
    });

    it("should fail authentication when a single byte of the GCM tag is modified", async () => {
      const plaintext = new TextEncoder().encode("Tag integrity test");
      const { payload, key } = await encryptDocument(plaintext);

      // Flip 1 byte in the appended 16-byte tag (last byte)
      const tamperedCiphertext = new Uint8Array(payload.ciphertext);
      tamperedCiphertext[tamperedCiphertext.length - 1] ^= 0xff;

      const tamperedPayload = {
        ...payload,
        ciphertext: tamperedCiphertext,
      };

      await assert.rejects(
        () => decryptDocument(tamperedPayload, key),
        (err: Error) => err instanceof AuthenticationError
      );
    });

    it("should fail authentication when IV is modified", async () => {
      const plaintext = new TextEncoder().encode("IV integrity test");
      const { payload, key } = await encryptDocument(plaintext);

      // Alter IV
      const tamperedIv = new Uint8Array(payload.iv);
      tamperedIv[0] ^= 0x55;

      const tamperedPayload = {
        ...payload,
        iv: tamperedIv,
      };

      await assert.rejects(
        () => decryptDocument(tamperedPayload, key),
        (err: Error) => err instanceof AuthenticationError
      );
    });

    it("should fail authentication when decrypted with the wrong key", async () => {
      const plaintext = new TextEncoder().encode("Confidential message for designated recipient only");
      const { payload } = await encryptDocument(plaintext);
      const wrongKey = await generateDocumentKey(); // Independent key

      await assert.rejects(
        () => decryptDocument(payload, wrongKey),
        (err: Error) => err instanceof AuthenticationError
      );
    });
  });

  // =========================================================================
  // 6. DECRYPT-THEN-HASH INTEGRATION PRIMITIVE
  // =========================================================================

  describe("Decrypt-then-Hash Verification Integration", () => {
    it("should verify that hash after decryption matches pre-encryption document hash exactly", async () => {
      const originalBytes = new TextEncoder().encode("Comprehensive end-to-end cryptographic pipeline payload");

      // 1. Hash document pre-encryption
      const preHash = await hashDocument(originalBytes);

      // 2. Encrypt document
      const { serialized, keyHex } = await encryptDocument(originalBytes);

      // 3. Decrypt and verify
      const result = await decryptAndVerify(serialized, keyHex, preHash.bytes32);

      assert.equal(result.verified, true);
      assert.equal(result.computedHash.hex, preHash.hex);
      assert.deepEqual(result.plaintext, originalBytes);
    });

    it("should fail closed and never report verified when ciphertext has been tampered with", async () => {
      const originalBytes = new TextEncoder().encode("Legitimate document");
      const preHash = await hashDocument(originalBytes);
      const { serialized, keyHex } = await encryptDocument(originalBytes);

      // Tamper with serialized byte inside ciphertext region
      const tampered = new Uint8Array(serialized);
      tampered[tampered.length - 5] ^= 0x42;

      await assert.rejects(
        () => decryptAndVerify(tampered, keyHex, preHash.bytes32),
        (err: Error) => err instanceof AuthenticationError
      );
    });

    it("should return verified: false if expected hash does not match decrypted document", async () => {
      const originalBytes = new TextEncoder().encode("Real document");
      const { serialized, keyHex } = await encryptDocument(originalBytes);

      // Provide completely different expected hash
      const fraudulentHash = "0x" + "f".repeat(64);
      const result = await decryptAndVerify(serialized, keyHex, fraudulentHash);

      assert.equal(result.verified, false);
      assert.notEqual(result.computedHash.bytes32, fraudulentHash);
    });
  });

  // =========================================================================
  // 7. KEY-SECURITY & LEAK PREVENTION AUDIT
  // =========================================================================

  describe("Key-Security & Sanitization Checks", () => {
    it("should not embed raw encryption key into the serialized payload", async () => {
      const data = new TextEncoder().encode("Checking payload serialization for key leaks");
      const { serialized, keyBytes } = await encryptDocument(data);

      // Search for key byte sequence in serialized payload
      let leaked = false;
      const keyLen = keyBytes.length;
      for (let i = 0; i <= serialized.length - keyLen; i++) {
        let match = true;
        for (let j = 0; j < keyLen; j++) {
          if (serialized[i + j] !== keyBytes[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          leaked = true;
          break;
        }
      }

      assert.equal(leaked, false, "Raw encryption key must NEVER be embedded in the serialized payload!");
    });

    it("should not leak key material in error messages", async () => {
      const shortKey = new Uint8Array([1, 2, 3]);
      try {
        await importKey(shortKey);
        assert.fail("Should have thrown");
      } catch (err: any) {
        assert.ok(!err.message.includes("010203"));
      }
    });
  });
});
