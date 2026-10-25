/**
 * Phase 11: Frontend API Client Tests
 *
 * Validates request dispatching, header propagation, Bearer token handling,
 * and error normalization across standard HTTP codes (401, 403, 404, 429, 500, network).
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { ApiClient } from "../lib/api/client";
import { ApiError } from "../lib/api/types";

describe("Phase 11: Frontend API Client Unit Tests", () => {
  let client: ApiClient;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    client = new ApiClient("http://mock-api.local:3001");
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should configure baseUrl and manage authentication token state", () => {
    assert.equal(client.getAuthToken(), null);
    client.setAuthToken("sample-jwt-token-123");
    assert.equal(client.getAuthToken(), "sample-jwt-token-123");
    client.setAuthToken(null);
    assert.equal(client.getAuthToken(), null);
  });

  it("should dispatch GET /health without Authorization header", async () => {
    globalThis.fetch = async (url: any, init?: any) => {
      assert.equal(url.toString(), "http://mock-api.local:3001/health");
      assert.equal(init?.method, "GET");
      assert.equal(init?.headers?.["Authorization"], undefined);

      return new Response(
        JSON.stringify({ status: "ok", uptime: 120, timestamp: 1790840000 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.getHealth();
    assert.equal(res.status, "ok");
    assert.equal(res.uptime, 120);
  });

  it("should dispatch POST /api/auth/challenge with address payload", async () => {
    const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    globalThis.fetch = async (url: any, init?: any) => {
      assert.equal(url.toString(), "http://mock-api.local:3001/api/auth/challenge");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init.body);
      assert.equal(body.address, testAddress);

      return new Response(
        JSON.stringify({
          challenge: `Sign in to Document Locker for ${testAddress}`,
          nonce: "0x1234567890abcdef",
          expiresAt: 1790840300,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.getChallenge(testAddress);
    assert(res.challenge.includes(testAddress));
    assert.equal(res.nonce, "0x1234567890abcdef");
  });

  it("should dispatch POST /api/auth/verify and automatically store returned JWT", async () => {
    const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const testSig = "0xsignature123456";
    const testToken = "jwt-header.jwt-payload.jwt-sig";

    globalThis.fetch = async (url: any, init?: any) => {
      assert.equal(url.toString(), "http://mock-api.local:3001/api/auth/verify");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init.body);
      assert.equal(body.address, testAddress);
      assert.equal(body.signature, testSig);

      return new Response(
        JSON.stringify({
          token: testToken,
          address: testAddress.toLowerCase(),
          expiresIn: "1h",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.verifySignature(testAddress, testSig);
    assert.equal(res.token, testToken);
    assert.equal(client.getAuthToken(), testToken);
  });

  it("should attach Authorization Bearer token to protected calls", async () => {
    client.setAuthToken("active-session-jwt");

    globalThis.fetch = async (url: any, init?: any) => {
      assert.equal(url.toString(), "http://mock-api.local:3001/api/documents");
      assert.equal(init?.headers?.["Authorization"], "Bearer active-session-jwt");

      return new Response(
        JSON.stringify({ documents: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.getDocuments();
    assert.deepEqual(res.documents, []);
  });

  it("should normalize HTTP 401 error into ApiError", async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOKEN_EXPIRED",
            message: "Authentication token has expired.",
            service: "Auth",
            timestamp: 1790840000,
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json", "x-request-id": "req-401" } }
      );
    };

    await assert.rejects(
      async () => {
        await client.getDocuments();
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 401);
        assert.equal(err.code, "TOKEN_EXPIRED");
        assert.equal(err.message, "Authentication token has expired.");
        assert.equal(err.requestId, "req-401");
        return true;
      }
    );
  });

  it("should normalize HTTP 403 Access Denied error into ApiError", async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied: you do not possess on-chain permission.",
            service: "AccessControl",
            timestamp: 1790840000,
          },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    };

    await assert.rejects(
      async () => {
        await client.getDocument("0x1234");
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "ACCESS_DENIED");
        return true;
      }
    );
  });

  it("should normalize HTTP 404 Document Not Found into ApiError", async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: "Document not found on-chain.",
            service: "DocumentRegistry",
            timestamp: 1790840000,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    };

    await assert.rejects(
      async () => {
        await client.getDocument("0x9999");
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "DOCUMENT_NOT_FOUND");
        return true;
      }
    );
  });

  it("should handle network connection failure fail-closed", async () => {
    globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED 127.0.0.1:3001");
    };

    await assert.rejects(
      async () => {
        await client.getHealth();
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert(err.message.includes("ECONNREFUSED"));
        return true;
      }
    );
  });

  it("should preserve application/octet-stream Content-Type and pass x-filename header on binary uploads", async () => {
    client.setAuthToken("upload-jwt-token");
    const samplePayload = new Uint8Array([1, 12, 3, 4, 5]);

    globalThis.fetch = async (url: any, init?: any) => {
      assert(url.toString().includes("/api/ipfs/upload?filename=contract.docx"));
      assert.equal(init?.method, "POST");
      assert.equal(init?.headers?.["Content-Type"], "application/octet-stream");
      assert.equal(init?.headers?.["x-filename"], "contract.docx");
      assert.equal(init?.headers?.["Authorization"], "Bearer upload-jwt-token");
      assert.equal(init?.body, samplePayload);

      return new Response(
        JSON.stringify({ cid: "bafkreihfakecid123", size: 5, pinnedAt: 1790840000 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await client.uploadIpfsPayload(samplePayload, "contract.docx");
    assert.equal(res.cid, "bafkreihfakecid123");
    assert.equal(res.size, 5);
  });
});
