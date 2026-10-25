/**
 * Phase 13: AccessControl Contract Interface & Helpers
 *
 * Provides typed contract helpers for interacting with the deployed AccessControl.sol contract.
 * All write transactions (grantAccess, revokeAccess) are signed directly by the user's Web3 wallet (MetaMask).
 * Reads (hasAccess, isDirectAccessGranted) are executed against the blockchain provider.
 *
 * CRITICAL RULE: Zero private keys, zero server-signed transactions.
 */

import { ethers } from "ethers";
import { config } from "../config/env";

export const ACCESS_CONTROL_ABI = [
  "function grantAccess(bytes32 documentId, address verifier) external",
  "function revokeAccess(bytes32 documentId, address verifier) external",
  "function hasAccess(bytes32 documentId, address verifier) external view returns (bool)",
  "function isDirectAccessGranted(bytes32 documentId, address verifier) external view returns (bool)",
  "function getDocumentRegistry() external view returns (address)",
  "event AccessGranted(bytes32 indexed documentId, address indexed owner, address indexed verifier, uint256 timestamp)",
  "event AccessRevoked(bytes32 indexed documentId, address indexed owner, address indexed verifier, uint256 timestamp)",
  "error InvalidRegistryAddress()",
  "error InvalidDocumentId()",
  "error InvalidVerifierAddress()",
  "error DocumentNotFound(bytes32 documentId)",
  "error NotDocumentOwner(bytes32 documentId, address caller)",
  "error DocumentIsRevoked(bytes32 documentId)",
  "error AccessAlreadyGranted(bytes32 documentId, address verifier)",
  "error AccessNotGranted(bytes32 documentId, address verifier)"
];

/**
 * Returns an ethers Contract instance connected to the given runner (Signer or Provider).
 */
export function getAccessControlContract(
  runner: ethers.ContractRunner,
  contractAddress: string = config.contractAccessControl
): ethers.Contract {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid AccessControl contract address: "${contractAddress}"`);
  }
  return new ethers.Contract(contractAddress, ACCESS_CONTROL_ABI, runner);
}

/**
 * Grants access to a verifier wallet through the owner's MetaMask signer.
 * Submits the transaction, awaits 1 on-chain confirmation, and returns the receipt.
 */
export async function grantAccessOnChain(
  signer: ethers.Signer,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<ethers.ContractTransactionReceipt> {
  const contract = getAccessControlContract(signer, contractAddress);
  const tx = await contract.grantAccess(documentId, verifier);
  const receipt = await tx.wait(1);
  if (!receipt) {
    throw new Error("Transaction was mined but no receipt was returned by provider.");
  }
  return receipt;
}

/**
 * Revokes access from a verifier wallet through the owner's MetaMask signer.
 * Submits the transaction, awaits 1 on-chain confirmation, and returns the receipt.
 */
export async function revokeAccessOnChain(
  signer: ethers.Signer,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<ethers.ContractTransactionReceipt> {
  const contract = getAccessControlContract(signer, contractAddress);
  const tx = await contract.revokeAccess(documentId, verifier);
  const receipt = await tx.wait(1);
  if (!receipt) {
    throw new Error("Transaction was mined but no receipt was returned by provider.");
  }
  return receipt;
}

/**
 * Queries whether a verifier currently has active, unrevoked access to a document.
 * Combines direct permission with DocumentRegistry existence and non-revocation state.
 */
export async function checkHasAccessOnChain(
  runner: ethers.ContractRunner,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<boolean> {
  const contract = getAccessControlContract(runner, contractAddress);
  const hasPermission = await contract.hasAccess(documentId, verifier);
  return Boolean(hasPermission);
}

/**
 * Queries the direct access mapping in AccessControl without factoring in document revocation.
 */
export async function checkDirectAccessGrantedOnChain(
  runner: ethers.ContractRunner,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<boolean> {
  const contract = getAccessControlContract(runner, contractAddress);
  const isGranted = await contract.isDirectAccessGranted(documentId, verifier);
  return Boolean(isGranted);
}
