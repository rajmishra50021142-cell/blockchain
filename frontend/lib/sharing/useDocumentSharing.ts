/**
 * Phase 13: Document Sharing & Access Revocation React Hook
 *
 * Coordinates non-custodial MetaMask interactions, transaction states,
 * post-confirmation on-chain verification, and real-time state resets.
 */

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { useAuth } from "../auth/AuthContext";
import {
  SharingState,
  SharingAction,
  ShareProvenance,
  VerifierPermissionRecord,
} from "./types";
import {
  validateVerifierAddress,
  validateOwnerAuthority,
  validateDocumentActiveForGrant,
  validateNetwork,
  verifyPostGrantState,
  verifyPostRevokeState,
  reconstructVerifiersWithLiveState,
} from "./sharing-service";
import {
  grantAccessOnChain,
  revokeAccessOnChain,
  checkHasAccessOnChain,
  checkDirectAccessGrantedOnChain,
} from "../contracts/access-control";
import { config } from "../config/env";
import { apiClient } from "../api/client";
import { DocumentRecord } from "../api/types";
import { getInjectedMetaMaskProvider } from "../wallet/wallet-utils";

interface UseDocumentSharingProps {
  document: DocumentRecord | null;
  onPermissionChanged?: () => void;
}

export function useDocumentSharing({
  document,
  onPermissionChanged,
}: UseDocumentSharingProps) {
  const { address, chainId } = useWallet();
  const { isAuthenticated } = useAuth();

  const getProvider = useCallback(() => {
    const ethereum = getInjectedMetaMaskProvider();
    if (!ethereum) return null;
    return new ethers.BrowserProvider(ethereum, "any");
  }, []);

  const getSigner = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return null;
    return provider.getSigner();
  }, [getProvider]);

  const [state, setState] = useState<SharingState>({
    stage: "IDLE",
    action: null,
    verifierAddress: "",
    txHash: null,
    blockNumber: null,
    errorMessage: null,
    postVerifiedAccess: null,
  });

  const [lastProvenance, setLastProvenance] = useState<ShareProvenance | null>(null);
  const [verifiers, setVerifiers] = useState<VerifierPermissionRecord[]>([]);
  const [loadingVerifiers, setLoadingVerifiers] = useState<boolean>(false);
  const [activeVerifierCurrentAccess, setActiveVerifierCurrentAccess] = useState<boolean | null>(null);

  // Invalidate in-progress operations if account or network changes
  useEffect(() => {
    setState((prev) => {
      if (prev.stage !== "IDLE" && prev.stage !== "COMPLETED") {
        return {
          stage: "IDLE",
          action: null,
          verifierAddress: "",
          txHash: null,
          blockNumber: null,
          errorMessage: "Operation cancelled: Active wallet account or network changed.",
          postVerifiedAccess: null,
        };
      }
      return prev;
    });
  }, [address, chainId]);

  /**
   * Refreshes the known verifiers list by loading on-chain audit events
   * and asserting live smart-contract permission states.
   */
  const loadVerifiers = useCallback(async () => {
    if (!document || !isAuthenticated) {
      setVerifiers([]);
      return;
    }

    setLoadingVerifiers(true);
    try {
      const provider = getProvider();
      if (!provider) {
        setVerifiers([]);
        return;
      }

      // Query real on-chain audit history for this document
      const auditRes = await apiClient.getAuditTrail(document.id);
      const records = await reconstructVerifiersWithLiveState(
        provider,
        document.id,
        auditRes.events || []
      );
      setVerifiers(records);
    } catch (err) {
      console.warn("[WARN] Could not reconstruct verifiers from audit:", err);
      setVerifiers([]);
    } finally {
      setLoadingVerifiers(false);
    }
  }, [document, isAuthenticated, getProvider]);

  useEffect(() => {
    loadVerifiers();
  }, [loadVerifiers]);

  /**
   * Inspects current on-chain access state for a candidate verifier address.
   */
  const inspectVerifierAccess = useCallback(
    async (verifierInput: string): Promise<boolean | null> => {
      if (!document) return null;
      const validation = validateVerifierAddress(verifierInput, document.owner);
      if (!validation.valid || !validation.normalizedAddress) {
        setActiveVerifierCurrentAccess(null);
        return null;
      }

      try {
        const provider = getProvider();
        if (!provider) return null;

        const hasAccess = await checkHasAccessOnChain(
          provider,
          document.id,
          validation.normalizedAddress
        );
        setActiveVerifierCurrentAccess(hasAccess);
        return hasAccess;
      } catch {
        setActiveVerifierCurrentAccess(null);
        return null;
      }
    },
    [document, getProvider]
  );

  /**
   * Initiates a real grantAccess transaction through MetaMask.
   */
  const grantAccess = useCallback(
    async (verifierInput: string) => {
      if (!document) return;

      setState({
        stage: "VALIDATING_INPUT",
        action: "grant",
        verifierAddress: verifierInput,
        txHash: null,
        blockNumber: null,
        errorMessage: null,
        postVerifiedAccess: null,
      });

      try {
        // 1. Validate verifier address
        const validation = validateVerifierAddress(verifierInput, document.owner);
        if (!validation.valid || !validation.normalizedAddress) {
          throw new Error(validation.error || "Invalid verifier address.");
        }
        const normalizedVerifier = validation.normalizedAddress;

        // 2. Validate network
        validateNetwork(chainId);

        // 3. Validate owner authority
        validateOwnerAuthority(address, document.owner);

        // 4. Validate document is not revoked
        validateDocumentActiveForGrant(document.revoked);

        // 5. Check on-chain access state
        setState((s) => ({ ...s, stage: "CHECKING_ONCHAIN_STATE" }));
        const provider = getProvider();
        if (!provider) {
          throw new Error("Blockchain provider unavailable.");
        }

        const alreadyHasAccess = await checkHasAccessOnChain(
          provider,
          document.id,
          normalizedVerifier
        );
        if (alreadyHasAccess) {
          throw new Error(
            `Access is already actively granted to verifier: ${normalizedVerifier}`
          );
        }

        // Check direct access mapping to see if AccessAlreadyGranted error will trigger
        const isDirectGranted = await checkDirectAccessGrantedOnChain(
          provider,
          document.id,
          normalizedVerifier
        );
        if (isDirectGranted && !document.revoked) {
          throw new Error(
            `Access was already granted to verifier: ${normalizedVerifier}`
          );
        }

        // 6. Request MetaMask Signature
        setState((s) => ({ ...s, stage: "WALLET_CONFIRMING" }));
        const signer = await getSigner();
        if (!signer) {
          throw new Error("No signer available from MetaMask.");
        }

        const contract = new ethers.Contract(
          config.contractAccessControl,
          [
            "function grantAccess(bytes32 documentId, address verifier) external",
          ],
          signer
        );

        // Submit transaction
        const tx = await contract.grantAccess(document.id, normalizedVerifier);
        setState((s) => ({
          ...s,
          stage: "TRANSACTION_SUBMITTED",
          txHash: tx.hash,
        }));

        // 7. Await on-chain confirmation
        setState((s) => ({ ...s, stage: "CONFIRMING" }));
        const receipt = await tx.wait(1);
        if (!receipt) {
          throw new Error("Transaction was mined but no receipt was returned by provider.");
        }

        // 8. Post-grant state verification
        setState((s) => ({
          ...s,
          stage: "VERIFYING_POST_STATE",
          blockNumber: receipt.blockNumber,
        }));

        const verified = await verifyPostGrantState(
          provider,
          document.id,
          normalizedVerifier
        );

        // 9. Update state & provenance
        const provenance: ShareProvenance = {
          action: "grant",
          documentId: document.id,
          owner: document.owner,
          verifier: normalizedVerifier,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          hasAccess: verified,
          network: config.contractNetwork,
        };

        setLastProvenance(provenance);
        setState({
          stage: "COMPLETED",
          action: "grant",
          verifierAddress: normalizedVerifier,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          errorMessage: null,
          postVerifiedAccess: verified,
        });

        // Trigger updates
        await loadVerifiers();
        if (onPermissionChanged) {
          onPermissionChanged();
        }
      } catch (err: any) {
        console.error("Grant access failed:", err);
        const errMsg = err?.message || "Grant transaction failed.";

        // Handle user cancellation in MetaMask cleanly
        const isUserRejected =
          err?.code === "ACTION_REJECTED" ||
          err?.code === 4001 ||
          errMsg.includes("user rejected") ||
          errMsg.includes("User denied transaction signature");

        setState((s) => ({
          ...s,
          stage: isUserRejected ? "CANCELLED" : "ERROR",
          errorMessage: isUserRejected
            ? "Transaction cancelled by user in MetaMask."
            : errMsg,
        }));
      }
    },
    [
      document,
      chainId,
      address,
      getProvider,
      getSigner,
      loadVerifiers,
      onPermissionChanged,
    ]
  );

  /**
   * Initiates a real revokeAccess transaction through MetaMask.
   */
  const revokeAccess = useCallback(
    async (verifierInput: string) => {
      if (!document) return;

      setState({
        stage: "VALIDATING_INPUT",
        action: "revoke",
        verifierAddress: verifierInput,
        txHash: null,
        blockNumber: null,
        errorMessage: null,
        postVerifiedAccess: null,
      });

      try {
        // 1. Validate verifier address
        const validation = validateVerifierAddress(verifierInput);
        if (!validation.valid || !validation.normalizedAddress) {
          throw new Error(validation.error || "Invalid verifier address.");
        }
        const normalizedVerifier = validation.normalizedAddress;

        // 2. Validate network
        validateNetwork(chainId);

        // 3. Validate owner authority
        validateOwnerAuthority(address, document.owner);

        // 4. Check current on-chain state
        setState((s) => ({ ...s, stage: "CHECKING_ONCHAIN_STATE" }));
        const provider = getProvider();
        if (!provider) {
          throw new Error("Blockchain provider unavailable.");
        }

        const isDirectGranted = await checkDirectAccessGrantedOnChain(
          provider,
          document.id,
          normalizedVerifier
        );

        if (!isDirectGranted) {
          throw new Error(
            `Cannot revoke: Verifier ${normalizedVerifier} does not possess granted access in storage.`
          );
        }

        // 5. Request MetaMask Signature
        setState((s) => ({ ...s, stage: "WALLET_CONFIRMING" }));
        const signer = await getSigner();
        if (!signer) {
          throw new Error("No signer available from MetaMask.");
        }

        const contract = new ethers.Contract(
          config.contractAccessControl,
          [
            "function revokeAccess(bytes32 documentId, address verifier) external",
          ],
          signer
        );

        // Submit transaction
        const tx = await contract.revokeAccess(document.id, normalizedVerifier);
        setState((s) => ({
          ...s,
          stage: "TRANSACTION_SUBMITTED",
          txHash: tx.hash,
        }));

        // 6. Await on-chain confirmation
        setState((s) => ({ ...s, stage: "CONFIRMING" }));
        const receipt = await tx.wait(1);
        if (!receipt) {
          throw new Error("Transaction was mined but no receipt was returned by provider.");
        }

        // 7. Post-revoke state verification
        setState((s) => ({
          ...s,
          stage: "VERIFYING_POST_STATE",
          blockNumber: receipt.blockNumber,
        }));

        const verified = await verifyPostRevokeState(
          provider,
          document.id,
          normalizedVerifier
        );

        // 8. Update state & provenance
        const provenance: ShareProvenance = {
          action: "revoke",
          documentId: document.id,
          owner: document.owner,
          verifier: normalizedVerifier,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          hasAccess: verified,
          network: config.contractNetwork,
        };

        setLastProvenance(provenance);
        setState({
          stage: "COMPLETED",
          action: "revoke",
          verifierAddress: normalizedVerifier,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          errorMessage: null,
          postVerifiedAccess: verified,
        });

        // Trigger updates
        await loadVerifiers();
        if (onPermissionChanged) {
          onPermissionChanged();
        }
      } catch (err: any) {
        console.error("Revoke access failed:", err);
        const errMsg = err?.message || "Revoke transaction failed.";

        const isUserRejected =
          err?.code === "ACTION_REJECTED" ||
          err?.code === 4001 ||
          errMsg.includes("user rejected") ||
          errMsg.includes("User denied transaction signature");

        setState((s) => ({
          ...s,
          stage: isUserRejected ? "CANCELLED" : "ERROR",
          errorMessage: isUserRejected
            ? "Transaction cancelled by user in MetaMask."
            : errMsg,
        }));
      }
    },
    [
      document,
      chainId,
      address,
      getProvider,
      getSigner,
      loadVerifiers,
      onPermissionChanged,
    ]
  );

  const resetState = useCallback(() => {
    setState({
      stage: "IDLE",
      action: null,
      verifierAddress: "",
      txHash: null,
      blockNumber: null,
      errorMessage: null,
      postVerifiedAccess: null,
    });
  }, []);

  return {
    state,
    lastProvenance,
    verifiers,
    loadingVerifiers,
    activeVerifierCurrentAccess,
    inspectVerifierAccess,
    grantAccess,
    revokeAccess,
    resetState,
    loadVerifiers,
  };
}
