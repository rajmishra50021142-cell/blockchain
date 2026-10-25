/**
 * Phase 14: Verification Failure Paths & Boundary Invariants
 *
 * Validates fail-closed handling on:
 * - Network mismatch
 * - Unauthorized verifier access denial
 * - Non-existent document IDs
 * - Candidate hash discrepancies (tamper detection)
 * - Revoked document handling
 * - Ciphertext tampering (AES-GCM tag authentication failure)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { ApiClient } from "../lib/api/client";
import { ApiError } from "../lib/api/types";
import {
  validateNetwork,
  verifyStoredObjectCiphertext,
} from "../lib/verification/verification-service";
import {
  encryptDocument,
  hashDocument,
} from "../lib/crypto/document-crypto";

describe("Phase 14: Verification Failure Paths & Boundary Invariants", () => {
  it("should fail-closed when network chain ID does not match expected configuration", () => {
    assert.throws(() => validateNetwork(1), /Incorrect network: Connected to Chain ID 1/);
    assert.throws(() => validateNetwork(11155111), /Incorrect network: Connected to Chain ID 11155111/);
    assert.throws(() => validateNetwork(null), /Unable to detect blockchain network/);
  });

  it("should honestly report UNAUTHORIZED when caller has no permission on AccessControl", async () => {
    const client = new ApiClient("http://mock-api.local:3001");
    client.setAuthToken("unauthorized-jwt-token");

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied: you do not possess on-chain permission for this document.",
            service: "AccessControl",
          },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    };

    await assert.rejects(
      async () => {
        await client.verifyDocument(
          "0x1111111111111111111111111111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222222222222222222222222222"
        );
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "ACCESS_DENIED");
        return true;
      }
    );
  });

  it("should honestly report DOCUMENT_NOT_FOUND when document does not exist on-chain", async () => {
    const client = new ApiClient("http://mock-api.local:3001");
    client.setAuthToken("valid-jwt-token");

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: "Document not found on-chain.",
            service: "DocumentRegistry",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    };

    await assert.rejects(
      async () => {
        await client.verifyDocument(
          "0x3333333333333333333333333333333333333333333333333333333333333333",
          "0x4444444444444444444444444444444444444444444444444444444444444444"
        );
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "DOCUMENT_NOT_FOUND");
        return true;
      }
    );
  });

  it("should report TAMPER_DETECTED when candidate hash differs from on-chain digest", async () => {
    const client = new ApiClient("http://mock-api.local:3001");
    client.setAuthToken("valid-jwt-token");

    const onChainHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const mutatedCandidateHash = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "TAMPER_DETECTED",
          documentId: "0x5555555555555555555555555555555555555555555555555555555555555555",
          onChainHash,
          candidateHash: mutatedCandidateHash,
          match: false,
          revoked: false,
          owner: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
          verificationDurationMs: 4,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.verifyDocument(
      "0x5555555555555555555555555555555555555555555555555555555555555555",
      mutatedCandidateHash
    );

    assert.equal(res.status, "TAMPER_DETECTED");
    assert.equal(res.match, false);
    assert.notEqual(res.candidateHash, res.onChainHash);
  });

  it("should report REVOKED and never report VERIFIED when document is revoked on-chain", async () => {
    const client = new ApiClient("http://mock-api.local:3001");
    client.setAuthToken("valid-jwt-token");

    const matchingHash = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "REVOKED",
          documentId: "0x6666666666666666666666666666666666666666666666666666666666666666",
          onChainHash: matchingHash,
          candidateHash: matchingHash,
          match: true,
          revoked: true,
          owner: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
          verificationDurationMs: 5,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.verifyDocument(
      "0x6666666666666666666666666666666666666666666666666666666666666666",
      matchingHash
    );

    assert.equal(res.status, "REVOKED");
    assert.equal(res.revoked, true);
    assert.notEqual(res.status, "VERIFIED");
  });

  it("should fail-closed with DECRYPTION_FAILED when ciphertext authentication tag is mutated", async () => {
    const originalText = new TextEncoder().encode("Critical legal document");
    const encryption = await encryptDocument(originalText);
    const expectedHashRes = await hashDocument(originalText);

    // Corrupt ciphertext body
    const tampered = new Uint8Array(encryption.serialized);
    tampered[tampered.length - 1] ^= 0x01; // flip last tag bit

    const mockDownload = async () => tampered;

    const auditRes = await verifyStoredObjectCiphertext(
      "bafkreihfakecid",
      encryption.keyBytes,
      expectedHashRes.bytes32,
      mockDownload
    );

    assert.equal(auditRes.attempted, true);
    assert.equal(auditRes.status, "DECRYPTION_FAILED");
    assert.equal(auditRes.matchesOnChainHash, undefined);
  });
});
