/**
 * Phase 11: Centralized Frontend API Client
 *
 * Provides typed, fail-closed methods to interact with the Phase 10 Express REST API.
 * Attaches JWT session token on protected endpoints and normalizes errors into ApiError.
 */

import { config } from "../config/env";
import {
  AuthChallengeResponse,
  AuthVerifyResponse,
  DocumentsListResponse,
  DocumentDetailResponse,
  VerificationResult,
  AuditResponse,
  IpfsUploadResponse,
  IpfsDownloadResponse,
  HealthResponse,
  ReadyResponse,
  ApiError,
  ApiErrorBody,
} from "./types";

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Set active JWT session token for authenticated requests.
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get currently configured auth token.
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Core request dispatcher handling headers, timeouts, and error normalization.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    overrideToken?: string | null
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const token = overrideToken !== undefined ? overrideToken : this.authToken;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (
      options.body &&
      !headers["Content-Type"] &&
      !(
        options.body instanceof Uint8Array ||
        ArrayBuffer.isView(options.body) ||
        options.body instanceof FormData ||
        (typeof Blob !== "undefined" && options.body instanceof Blob)
      )
    ) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorBody: ApiErrorBody | null = null;
        try {
          errorBody = (await response.json()) as ApiErrorBody;
        } catch {
          // Response body was not JSON
        }

        const code = errorBody?.error?.code || `HTTP_${response.status}`;
        const message =
          errorBody?.error?.message ||
          response.statusText ||
          `Request failed with status ${response.status}`;
        const service = errorBody?.error?.service;
        const requestId = errorBody?.error?.requestId || response.headers.get("x-request-id") || undefined;

        throw new ApiError(response.status, code, message, service, requestId);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : "Unknown network connection error";
      throw new ApiError(0, "NETWORK_ERROR", `Failed to connect to API gateway: ${message}`);
    }
  }

  /**
   * Request a cryptographically secure authentication challenge for a wallet address.
   */
  public async getChallenge(address: string): Promise<AuthChallengeResponse> {
    return this.request<AuthChallengeResponse>("/api/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  /**
   * Verify an EIP-191 wallet signature and obtain a session JWT.
   */
  public async verifySignature(
    address: string,
    signature: string
  ): Promise<AuthVerifyResponse> {
    const response = await this.request<AuthVerifyResponse>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature }),
    });

    if (response?.token) {
      this.setAuthToken(response.token);
    }

    return response;
  }

  /**
   * Query registered documents for the authenticated caller.
   */
  public async getDocuments(overrideToken?: string): Promise<DocumentsListResponse> {
    return this.request<DocumentsListResponse>("/api/documents", { method: "GET" }, overrideToken);
  }

  /**
   * Query single document metadata and permission status by ID.
   */
  public async getDocument(id: string, overrideToken?: string): Promise<DocumentDetailResponse> {
    return this.request<DocumentDetailResponse>(
      `/api/documents/${id}`,
      { method: "GET" },
      overrideToken
    );
  }

  /**
   * Cryptographically verify a candidate SHA-256 hash against on-chain record.
   */
  public async verifyDocument(
    documentId: string,
    candidateHash: string,
    overrideToken?: string
  ): Promise<VerificationResult> {
    return this.request<VerificationResult>(
      "/api/verify",
      {
        method: "POST",
        body: JSON.stringify({ documentId, candidateHash }),
      },
      overrideToken
    );
  }

  /**
   * Retrieve reconstructed on-chain audit event lineage for a document.
   */
  public async getAuditTrail(
    documentId: string,
    overrideToken?: string
  ): Promise<AuditResponse> {
    return this.request<AuditResponse>(
      `/api/audit/${documentId}`,
      { method: "GET" },
      overrideToken
    );
  }

  /**
   * Upload an encrypted binary payload to live Pinata IPFS via backend relay.
   * Requires authenticated JWT session.
   */
  public async uploadIpfsPayload(
    payload: Uint8Array,
    fileName?: string,
    overrideToken?: string
  ): Promise<IpfsUploadResponse> {
    const query = fileName ? `?filename=${encodeURIComponent(fileName)}` : "";
    return this.request<IpfsUploadResponse>(
      `/api/ipfs/upload${query}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          ...(fileName ? { "x-filename": fileName } : {}),
        },
        body: payload as unknown as BodyInit,
      },
      overrideToken
    );
  }

  /**
   * Retrieve encrypted payload bytes from IPFS via backend relay.
   * Requires authenticated JWT session.
   */
  public async downloadIpfsPayload(
    cid: string,
    overrideToken?: string
  ): Promise<Uint8Array> {
    const res = await this.request<IpfsDownloadResponse>(
      `/api/ipfs/${encodeURIComponent(cid)}?format=json`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
      overrideToken
    );

    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(res.payloadBase64, "base64"));
    }
    const binaryString = atob(res.payloadBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Check backend server liveness.
   */
  public async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health", { method: "GET" });
  }

  /**
   * Check deep backend readiness (blockchain RPC + Pinata IPFS).
   */
  public async getReady(): Promise<ReadyResponse> {
    return this.request<ReadyResponse>("/ready", { method: "GET" });
  }
}

// Default singleton client instance configured with public environment settings
export const apiClient = new ApiClient();
