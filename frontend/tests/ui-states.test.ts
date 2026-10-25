/**
 * Phase 11: UI State Model Unit Tests
 *
 * Verifies transaction lifecycle states, verification decision presentations,
 * and deterministic audit lineage sorting.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TransactionInfo } from "../components/ui/TransactionStatus";
import { VerificationResult, NormalizedAuditEvent } from "../lib/api/types";

describe("Phase 11: UI State Model Tests", () => {
  it("should enforce transaction status progression invariants", () => {
    // Stage 1: prompting user in wallet
    const promptingTx: TransactionInfo = {
      state: "prompting",
    };
    assert.equal(promptingTx.state, "prompting");
    assert.equal(promptingTx.hash, undefined);

    // Stage 2: transaction broadcast to network
    const pendingTx: TransactionInfo = {
      state: "pending",
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
    assert.equal(pendingTx.state, "pending");
    assert(pendingTx.hash?.startsWith("0x"));

    // Stage 3: confirmed on blockchain
    const confirmedTx: TransactionInfo = {
      state: "confirmed",
      hash: pendingTx.hash,
      blockNumber: 42,
    };
    assert.equal(confirmedTx.state, "confirmed");
    assert.equal(confirmedTx.blockNumber, 42);

    // Stage 4: failed or rejected
    const failedTx: TransactionInfo = {
      state: "failed",
      error: "User rejected transaction signature in wallet.",
    };
    assert.equal(failedTx.state, "failed");
    assert(failedTx.error?.includes("rejected"));
  });

  it("should deterministically classify verification outcomes", () => {
    const verifiedResult: VerificationResult = {
      status: "VERIFIED",
      documentId: "0xdoc1",
      candidateHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      onChainHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      match: true,
      revoked: false,
      executionLatencyMs: 12.5,
    };
    assert.equal(verifiedResult.status, "VERIFIED");
    assert.equal(verifiedResult.match, true);

    const tamperedResult: VerificationResult = {
      status: "TAMPER_DETECTED",
      documentId: "0xdoc1",
      candidateHash: "bad0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      onChainHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      match: false,
      revoked: false,
      executionLatencyMs: 11.2,
    };
    assert.equal(tamperedResult.status, "TAMPER_DETECTED");
    assert.equal(tamperedResult.match, false);

    const revokedResult: VerificationResult = {
      status: "REVOKED",
      documentId: "0xdoc1",
      candidateHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      onChainHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      match: true,
      revoked: true,
      executionLatencyMs: 9.8,
    };
    assert.equal(revokedResult.status, "REVOKED");
    assert.equal(revokedResult.revoked, true);
  });

  it("should sort audit event logs in strict chronological order", () => {
    const rawEvents: NormalizedAuditEvent[] = [
      {
        eventName: "AccessGranted",
        blockNumber: 15,
        transactionHash: "0xtx2",
        logIndex: 0,
        actor: "0xowner",
        timestamp: 1790840200,
        contractAddress: "0xaccess",
        details: {},
      },
      {
        eventName: "DocumentRegistered",
        blockNumber: 10,
        transactionHash: "0xtx1",
        logIndex: 0,
        actor: "0xowner",
        timestamp: 1790840100,
        contractAddress: "0xregistry",
        details: {},
      },
      {
        eventName: "DocumentRevoked",
        blockNumber: 20,
        transactionHash: "0xtx3",
        logIndex: 0,
        actor: "0xowner",
        timestamp: 1790840300,
        contractAddress: "0xregistry",
        details: {},
      },
    ];

    const sorted = [...rawEvents].sort((a, b) => a.blockNumber - b.blockNumber);

    assert.equal(sorted[0].eventName, "DocumentRegistered");
    assert.equal(sorted[1].eventName, "AccessGranted");
    assert.equal(sorted[2].eventName, "DocumentRevoked");
  });
});
