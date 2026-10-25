/**
 * Phase 12: useDocumentRegistration Hook
 *
 * Manages the complete production document-registration workflow:
 * File selection -> SHA-256 -> AES-256-GCM -> IPFS Upload -> MetaMask signing -> Confirmation -> Verification.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { useAuth } from "../auth/AuthContext";
import { apiClient } from "../api/client";
import { hashDocument, encryptDocument } from "../crypto/document-crypto";
import {
  RegistrationStage,
  RegistrationState,
  PostVerificationDetails,
} from "./types";
import {
  generateSecureDocumentId,
  extractFileBytes,
  validateNetwork,
  validateWalletSessionAlignment,
  verifyPostRegistrationState,
} from "./registration-service";
import { getInjectedMetaMaskProvider } from "../wallet/wallet-utils";
import { registerDocumentOnChain } from "../contracts/document-registry";

const INITIAL_STATE: RegistrationState = {
  stage: "IDLE",
  file: null,
  fileName: null,
  fileSizeBytes: null,
  documentHash: null,
  ipfsCid: null,
  documentId: null,
  txHash: null,
  blockNumber: null,
  gasUsed: null,
  registeredAt: null,
  owner: null,
  error: null,
  errorCode: null,
  postVerificationDetails: null,
  ephemeralKeyBytes: null,
};

export function useDocumentRegistration() {
  const { address, chainId } = useWallet();
  const { isAuthenticated, authAddress } = useAuth();

  const [state, setState] = useState<RegistrationState>(INITIAL_STATE);

  // Keep a reference to file bytes in memory across async steps
  const fileBytesRef = useRef<Uint8Array | null>(null);
  const activeAddressRef = useRef<string | null>(address);

  // Invalidate in-flight registration if account changes
  useEffect(() => {
    if (activeAddressRef.current && address && activeAddressRef.current.toLowerCase() !== address.toLowerCase()) {
      setState((prev) => {
        if (prev.stage !== "IDLE" && prev.stage !== "REGISTERED") {
          return {
            ...INITIAL_STATE,
            stage: "ERROR",
            error: "Wallet account changed mid-flow. Current registration operation was invalidated.",
            errorCode: "ACCOUNT_CHANGED",
          };
        }
        return prev;
      });
      fileBytesRef.current = null;
    }
    activeAddressRef.current = address;
  }, [address]);

  /**
   * User selects a real browser File.
   */
  const selectFile = useCallback((file: File) => {
    if (!file) return;

    fileBytesRef.current = null;
    setState({
      ...INITIAL_STATE,
      stage: "FILE_SELECTED",
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
    });
  }, []);

  /**
   * Execute preparation pipeline: Hashing -> Encrypting -> IPFS Upload -> CID -> Ready to Sign.
   */
  const prepareDocument = useCallback(async () => {
    if (!state.file) {
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: "No file selected. Please select a document first.",
        errorCode: "NO_FILE",
      }));
      return;
    }

    try {
      // 1. Stage: Extract bytes & Hashing
      setState((prev) => ({ ...prev, stage: "HASHING", error: null }));
      const bytes = await extractFileBytes(state.file);
      fileBytesRef.current = bytes;

      const hashRes = await hashDocument(bytes);
      const computedHash = hashRes.bytes32;

      // 2. Stage: Encrypting
      setState((prev) => ({
        ...prev,
        stage: "ENCRYPTING",
        documentHash: computedHash,
      }));

      const encryptionRes = await encryptDocument(bytes);
      const serializedPayload = encryptionRes.serialized;
      const keyBytes = encryptionRes.keyBytes;

      // 3. Stage: Uploading to IPFS via Backend
      setState((prev) => ({
        ...prev,
        stage: "UPLOADING",
        ephemeralKeyBytes: keyBytes,
      }));

      const uploadRes = await apiClient.uploadIpfsPayload(
        serializedPayload,
        state.fileName || undefined
      );

      if (!uploadRes.cid) {
        throw new Error("IPFS upload failed: No CID returned by backend IPFS relay.");
      }

      const authenticCid = uploadRes.cid;

      // 4. Stage: CID Ready -> Generate Document ID -> Ready to Sign
      const docId = generateSecureDocumentId();

      setState((prev) => ({
        ...prev,
        stage: "READY_TO_SIGN",
        ipfsCid: authenticCid,
        documentId: docId,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to prepare document.";
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: msg,
        errorCode: "PREPARATION_FAILED",
      }));
    }
  }, [state.file, state.fileName]);

  /**
   * Submit transaction to MetaMask, wait for receipt, and verify post-write consistency.
   */
  const submitRegistration = useCallback(async () => {
    if (!state.documentId || !state.documentHash || !state.ipfsCid) {
      setState((prev) => ({
        ...prev,
        stage: "ERROR",
        error: "Document preparation incomplete. Please prepare the document before submitting.",
        errorCode: "INCOMPLETE_PREPARATION",
      }));
      return;
    }

    try {
      // Pre-flight validations
      validateNetwork(chainId);
      validateWalletSessionAlignment(address, authAddress);

      const ethereum = getInjectedMetaMaskProvider();

      if (!ethereum) {
        throw new Error("No Ethereum provider detected. Please install or enable MetaMask.");
      }

      // Stage: Prompting MetaMask
      setState((prev) => ({ ...prev, stage: "WALLET_CONFIRMING", error: null }));

      const provider = new ethers.BrowserProvider(ethereum, "any");
      const signer = await provider.getSigner();

      // Submit transaction
      const contract = new ethers.Contract(
        (await import("../config/env")).config.contractDocumentRegistry,
        (await import("../contracts/document-registry")).DOCUMENT_REGISTRY_ABI,
        signer
      );

      const tx = await contract.registerDocument(
        state.documentId,
        state.documentHash,
        state.ipfsCid
      );

      // Stage: Transaction submitted
      setState((prev) => ({
        ...prev,
        stage: "TRANSACTION_SUBMITTED",
        txHash: tx.hash,
      }));

      // Stage: Awaiting blockchain confirmation
      setState((prev) => ({ ...prev, stage: "CONFIRMING" }));
      const receipt = await tx.wait(1);

      if (!receipt) {
        throw new Error("Transaction was mined but no receipt was returned.");
      }

      // Stage: Verifying post-registration consistency
      setState((prev) => ({
        ...prev,
        stage: "VERIFYING_CHAIN_STATE",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
      }));

      if (!fileBytesRef.current || !state.ephemeralKeyBytes) {
        throw new Error("Original document bytes or encryption key missing from memory.");
      }

      const postVerification = await verifyPostRegistrationState(
        provider,
        state.documentId,
        address!,
        state.documentHash,
        state.ipfsCid,
        fileBytesRef.current,
        state.ephemeralKeyBytes
      );

      // Final Stage: Registered
      setState((prev) => ({
        ...prev,
        stage: "REGISTERED",
        owner: address!.toLowerCase(),
        registeredAt: Math.floor(Date.now() / 1000),
        postVerificationDetails: postVerification,
      }));
    } catch (err: any) {
      // Check if user rejected transaction in MetaMask
      const isRejection =
        err?.code === "ACTION_REJECTED" ||
        err?.code === 4001 ||
        (err?.message && err.message.toLowerCase().includes("user rejected"));

      if (isRejection) {
        setState((prev) => ({
          ...prev,
          stage: "CANCELLED",
          error: `Registration was cancelled in your wallet. The encrypted payload (CID: ${prev.ipfsCid}) was uploaded to IPFS prior to the transaction attempt and remains in unreferenced storage.`,
          errorCode: "USER_REJECTED",
        }));
      } else {
        const message = err?.reason || err?.message || "Registration transaction failed.";
        setState((prev) => ({
          ...prev,
          stage: "ERROR",
          error: message,
          errorCode: "TRANSACTION_FAILED",
        }));
      }
    }
  }, [
    state.documentId,
    state.documentHash,
    state.ipfsCid,
    state.ephemeralKeyBytes,
    chainId,
    address,
    authAddress,
  ]);

  /**
   * Reset workflow back to initial state.
   */
  const reset = useCallback(() => {
    fileBytesRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  /**
   * Download encryption key as a secure local backup file (.key)
   * The raw bytes are downloaded directly without writing hex to the DOM.
   */
  const downloadKeyBackup = useCallback(() => {
    if (!state.ephemeralKeyBytes || !state.documentId) return;

    const blob = new Blob([state.ephemeralKeyBytes as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document_${state.documentId.slice(0, 10)}.key`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.ephemeralKeyBytes, state.documentId]);

  return {
    state,
    selectFile,
    prepareDocument,
    submitRegistration,
    reset,
    downloadKeyBackup,
    isAuthenticated,
  };
}
