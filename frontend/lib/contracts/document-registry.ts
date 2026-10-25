/**
 * Phase 12: DocumentRegistry Contract Interface & Helpers
 *
 * Provides typed contract helpers for interacting with the deployed DocumentRegistry.sol contract.
 * All write transactions are initiated by the user's connected Web3 wallet (MetaMask).
 * Reads are executed against the blockchain provider.
 */

import { ethers } from "ethers";
import { config } from "../config/env";

export const DOCUMENT_REGISTRY_ABI = [
  "function registerDocument(bytes32 documentId, bytes32 documentHash, string calldata ipfsCid) external",
  "function getDocument(bytes32 documentId) external view returns (tuple(bytes32 documentId, address owner, bytes32 documentHash, string ipfsCid, uint256 registeredAt, bool revoked))",
  "function isRevoked(bytes32 documentId) external view returns (bool)",
  "function getUserDocuments(address user) external view returns (bytes32[])",
  "function revokeDocument(bytes32 documentId) external",
  "event DocumentRegistered(bytes32 indexed documentId, address indexed owner, bytes32 documentHash, string ipfsCid, uint256 timestamp)",
  "event DocumentRevoked(bytes32 indexed documentId, address indexed owner, uint256 timestamp)",
  "error InvalidDocumentId()",
  "error InvalidDocumentHash()",
  "error InvalidIpfsCid()",
  "error DocumentAlreadyExists(bytes32 documentId)",
  "error DocumentNotFound(bytes32 documentId)",
  "error NotDocumentOwner(bytes32 documentId, address caller)",
  "error DocumentAlreadyRevoked(bytes32 documentId)"
];

export interface OnChainDocumentRecord {
  documentId: string;
  owner: string;
  documentHash: string;
  ipfsCid: string;
  registeredAt: number;
  revoked: boolean;
}

/**
 * Returns an ethers Contract instance connected to the given runner (Signer or Provider).
 */
export function getDocumentRegistryContract(
  runner: ethers.ContractRunner,
  contractAddress: string = config.contractDocumentRegistry
): ethers.Contract {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid DocumentRegistry contract address: "${contractAddress}"`);
  }
  return new ethers.Contract(contractAddress, DOCUMENT_REGISTRY_ABI, runner);
}

/**
 * Registers a document on-chain through a user's wallet signer.
 * Submits the transaction, waits for 1 confirmation, and returns the transaction receipt.
 */
export async function registerDocumentOnChain(
  signer: ethers.Signer,
  documentId: string,
  documentHash: string,
  ipfsCid: string,
  contractAddress: string = config.contractDocumentRegistry
): Promise<ethers.ContractTransactionReceipt> {
  const contract = getDocumentRegistryContract(signer, contractAddress);
  
  // Submit transaction via user wallet
  const tx = await contract.registerDocument(documentId, documentHash, ipfsCid);
  
  // Await real confirmation
  const receipt = await tx.wait(1);
  if (!receipt) {
    throw new Error("Transaction was mined but no receipt was returned by provider.");
  }
  return receipt;
}

/**
 * Reads an authoritative document record directly from the DocumentRegistry smart contract.
 */
export async function readDocumentFromChain(
  runner: ethers.ContractRunner,
  documentId: string,
  contractAddress: string = config.contractDocumentRegistry
): Promise<OnChainDocumentRecord> {
  const contract = getDocumentRegistryContract(runner, contractAddress);
  const doc = await contract.getDocument(documentId);

  return {
    documentId: doc.documentId.toLowerCase(),
    owner: doc.owner.toLowerCase(),
    documentHash: doc.documentHash.toLowerCase(),
    ipfsCid: doc.ipfsCid,
    registeredAt: Number(doc.registeredAt),
    revoked: Boolean(doc.revoked),
  };
}

/**
 * Revokes a registered document on-chain through the owner's wallet signer.
 */
export async function revokeDocumentOnChain(
  signer: ethers.Signer,
  documentId: string,
  contractAddress: string = config.contractDocumentRegistry
): Promise<ethers.ContractTransactionReceipt> {
  const contract = getDocumentRegistryContract(signer, contractAddress);
  const tx = await contract.revokeDocument(documentId);
  const receipt = await tx.wait(1);
  if (!receipt) {
    throw new Error("Revocation transaction was mined but no receipt was returned.");
  }
  return receipt;
}
