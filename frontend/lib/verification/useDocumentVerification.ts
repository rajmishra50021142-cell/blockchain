/**
 * Phase 14: useDocumentVerification Hook
 *
 * Manages stateful document verification and tamper detection:
 * - Candidate file selection & Web Crypto SHA-256 hashing
 * - Authoritative on-chain comparison via backend API gateway
 * - Account-change & network-switch state invalidation
 * - Optional stored-object AES-256-GCM verification with client-held keys
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useAuth } from "../auth/AuthContext";
import { apiClient } from "../api/client";
import { ApiError } from "../api/types";
import {
  VerificationWorkflowState,
  VerificationResult,
  StoredObjectVerificationResult,
} from "./types";
import {
  extractFileBytes,
  computeCandidateHash,
  parseKeyBytes,
  validateNetwork,
  verifyStoredObjectCiphertext,
} from "./verification-service";

const INITIAL_STATE: VerificationWorkflowState = {
  stage: "IDLE",
  documentId: "",
  candidateFile: null,
  candidateFileName: null,
  candidateFileSize: null,
  candidateHash: null,
  result: null,
  storedObjectResult: null,
  keyFileName: null,
  keyBytes: null,
  error: null,
  errorCode: null,
};

export function useDocumentVerification(initialDocumentId: string = "") {
  const { address, chainId } = useWallet();
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<VerificationWorkflowState>({
    ...INITIAL_STATE,
    documentId: initialDocumentId,
  });

  const activeAddressRef = useRef<string | null>(address);

  // Invalidate verification state when active wallet account changes (Section 19)
  useEffect(() => {
    if (
      activeAddressRef.current &&
      address &&
      activeAddressRef.current.toLowerCase() !== address.toLowerCase()
    ) {
      setState((prev) => ({
        ...INITIAL_STATE,
        documentId: prev.documentId,
      }));
    }
    activeAddressRef.current = address;
  }, [address]);

  // Synchronize initial document ID if passed via search params
  useEffect(() => {
    if (initialDocumentId && !state.documentId) {
      setState((prev) => ({ ...prev, documentId: initialDocumentId }));
    }
  }, [initialDocumentId, state.documentId]);

  /**
   * Set target Document ID to verify against.
   */
  const setDocumentId = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      documentId: id,
      result: null,
      storedObjectResult: null,
      error: null,
    }));
  }, []);

  /**
   * Select a candidate browser File and compute its real SHA-256 digest.
   */
  const selectCandidateFile = useCallback(async (file: File) => {
    if (!file) return;

    setState((prev) => ({
      ...prev,
      stage: "HASHING_CANDIDATE",
      candidateFile: file,
      candidateFileName: file.name,
      candidateFileSize: file.size,
      candidateHash: null,
      result: null,
      storedObjectResult: null,
      error: null,
    }));

    try {
      const bytes = await extractFileBytes(file);
      const hashResult = await computeCandidateHash(bytes);

      setState((prev) => ({
        ...prev,
        stage: "IDLE",
        candidateHash: hashResult.hex,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute candidate file hash.";
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: msg,
        errorCode: "HASH_COMPUTATION_FAILED",
      }));
    }
  }, []);

  /**
   * Manually specify candidate hash string.
   */
  const setCandidateHash = useCallback((hash: string) => {
    setState((prev) => ({
      ...prev,
      candidateHash: hash,
      result: null,
      storedObjectResult: null,
      error: null,
    }));
  }, []);

  /**
   * Supply document encryption key file (.key) for stored-object cryptographic verification.
   */
  const selectKeyFile = useCallback(async (file: File) => {
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const rawBytes = new Uint8Array(buffer);
      const keyBytes = parseKeyBytes(rawBytes);

      setState((prev) => ({
        ...prev,
        keyFileName: file.name,
        keyBytes,
        storedObjectResult: null,
        error: null,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse key file.";
      setState((prev) => ({
        ...prev,
        error: msg,
        errorCode: "INVALID_KEY_FILE",
      }));
    }
  }, []);

  /**
   * Supply document encryption key as a 64-character hex string.
   */
  const setKeyHex = useCallback((hex: string) => {
    try {
      const keyBytes = parseKeyBytes(hex);
      setState((prev) => ({
        ...prev,
        keyFileName: "manual-hex-key",
        keyBytes,
        storedObjectResult: null,
        error: null,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid key hex format.";
      setState((prev) => ({
        ...prev,
        error: msg,
        errorCode: "INVALID_KEY_HEX",
      }));
    }
  }, []);

  /**
   * Clear in-memory decryption key.
   */
  const clearKey = useCallback(() => {
    setState((prev) => ({
      ...prev,
      keyFileName: null,
      keyBytes: null,
      storedObjectResult: null,
    }));
  }, []);

  /**
   * Execute primary candidate verification against authoritative on-chain state.
   */
  const executeVerification = useCallback(async () => {
    const cleanDocId = state.documentId.trim();
    const cleanHash = state.candidateHash?.trim();

    if (!cleanDocId) {
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: "Document ID is required for verification.",
        errorCode: "MISSING_DOCUMENT_ID",
      }));
      return;
    }

    if (!cleanHash) {
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: "Candidate file or SHA-256 digest is required.",
        errorCode: "MISSING_CANDIDATE_HASH",
      }));
      return;
    }

    try {
      validateNetwork(chainId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network validation failed.";
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: msg,
        errorCode: "NETWORK_MISMATCH",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      stage: "VERIFYING_CANDIDATE",
      error: null,
      errorCode: null,
    }));

    try {
      // Dispatch verification request to backend REST API
      const res = await apiClient.verifyDocument(cleanDocId, cleanHash);

      // If an authentic AES key is available in memory and CID is present in on-chain record:
      // automatically execute stored-object verification
      let storedResult: StoredObjectVerificationResult | null = null;
      if (state.keyBytes && res.cid && res.onChainHash) {
        setState((prev) => ({ ...prev, stage: "DECRYPTING_STORED" }));
        storedResult = await verifyStoredObjectCiphertext(
          res.cid,
          state.keyBytes,
          res.onChainHash,
          (cid) => apiClient.downloadIpfsPayload(cid)
        );
      }

      setState((prev) => ({
        ...prev,
        stage: "COMPLETE",
        result: res,
        storedObjectResult: storedResult,
      }));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setState((prev) => ({
            ...prev,
            stage: "COMPLETE",
            result: {
              status: "UNAUTHORIZED",
              documentId: cleanDocId,
              candidateHash: cleanHash,
              match: false,
              verificationDurationMs: 0,
            },
          }));
          return;
        }

        if (err.status === 404) {
          setState((prev) => ({
            ...prev,
            stage: "COMPLETE",
            result: {
              status: "DOCUMENT_NOT_FOUND",
              documentId: cleanDocId,
              candidateHash: cleanHash,
              match: false,
              verificationDurationMs: 0,
            },
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          stage: "ERROR",
          error: err.message,
          errorCode: err.code,
        }));
        return;
      }

      const msg = err instanceof Error ? err.message : "Verification request failed.";
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: msg,
        errorCode: "VERIFICATION_FAILED",
      }));
    }
  }, [state.documentId, state.candidateHash, state.keyBytes, chainId]);

  /**
   * Explicitly audit stored IPFS ciphertext using provided key against already-verified on-chain record.
   */
  const executeStoredObjectAudit = useCallback(async () => {
    if (!state.keyBytes) {
      setState((prev) => ({
        ...prev,
        error: "Please provide an AES key file (.key) or 64-character hex key.",
        errorCode: "MISSING_KEY",
      }));
      return;
    }

    const cid = state.result?.cid;
    const expectedHash = state.result?.onChainHash;

    if (!cid || !expectedHash) {
      setState((prev) => ({
        ...prev,
        error: "On-chain record or IPFS CID unavailable. Run candidate verification first.",
        errorCode: "MISSING_ON_CHAIN_METADATA",
      }));
      return;
    }

    setState((prev) => ({ ...prev, stage: "DECRYPTING_STORED" }));

    try {
      const storedResult = await verifyStoredObjectCiphertext(
        cid,
        state.keyBytes,
        expectedHash,
        (c) => apiClient.downloadIpfsPayload(c)
      );

      setState((prev) => ({
        ...prev,
        stage: "COMPLETE",
        storedObjectResult: storedResult,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stored-object audit failed.";
      setState((prev) => ({
        ...prev,
        stage: "COMPLETE",
        storedObjectResult: {
          attempted: true,
          status: "DECRYPTION_FAILED",
          error: msg,
        },
      }));
    }
  }, [state.keyBytes, state.result?.cid, state.result?.onChainHash]);

  /**
   * Reset workflow back to initial state.
   */
  const reset = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      documentId: initialDocumentId,
    });
  }, [initialDocumentId]);

  return {
    state,
    setDocumentId,
    selectCandidateFile,
    setCandidateHash,
    selectKeyFile,
    setKeyHex,
    clearKey,
    executeVerification,
    executeStoredObjectAudit,
    reset,
  };
}
