/**
 * Phase 10: Read-Only Blockchain Service
 *
 * Connects to configured Ethereum JSON-RPC provider (e.g. Hardhat node),
 * verifies chain ID, queries DocumentRegistry and AccessControl smart contracts,
 * and fetches immutable audit event logs via eth_getLogs.
 *
 * CRITICAL RULE: Zero private keys, zero server-signed transactions.
 * All state modifications remain client/wallet sovereign.
 */

import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";
import { config } from "../config/env";
import { DocumentRecord, NormalizedAuditEvent } from "../types";
import { AppError } from "../middleware/error-handler";

// Embedded ABI interfaces ensure standalone deployment readiness when build artifacts are not mounted
const FALLBACK_DOCUMENT_REGISTRY_ABI = [
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

const FALLBACK_ACCESS_CONTROL_ABI = [
  "function hasAccess(bytes32 documentId, address verifier) external view returns (bool)",
  "function isDirectAccessGranted(bytes32 documentId, address verifier) external view returns (bool)",
  "function documentRegistry() external view returns (address)",
  "function grantAccess(bytes32 documentId, address verifier) external",
  "function revokeAccess(bytes32 documentId, address verifier) external",
  "event AccessGranted(bytes32 indexed documentId, address indexed verifier, address indexed owner, uint256 timestamp)",
  "event AccessRevoked(bytes32 indexed documentId, address indexed verifier, address indexed owner, uint256 timestamp)",
  "error NotDocumentOwner(bytes32 documentId, address caller)",
  "error DocumentNotFound(bytes32 documentId)",
  "error DocumentIsRevoked(bytes32 documentId)",
  "error AccessAlreadyGranted(bytes32 documentId, address verifier)",
  "error AccessNotGranted(bytes32 documentId, address verifier)",
  "error InvalidDocumentId()",
  "error InvalidVerifierAddress()"
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private documentRegistryContract: ethers.Contract | null = null;
  private accessControlContract: ethers.Contract | null = null;
  private isInitialized = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, undefined, {
      staticNetwork: ethers.Network.from(config.chainId),
      cacheTimeout: -1,
    });
  }

  /**
   * Initializes contract instances using compiled Hardhat artifacts or fallback ABIs.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const docRegistryAbi = this.loadAbi(
        "DocumentRegistry.sol/DocumentRegistry.json"
      );
      const accessControlAbi = this.loadAbi(
        "AccessControl.sol/AccessControl.json"
      );

      if (config.contractDocumentRegistry && ethers.isAddress(config.contractDocumentRegistry)) {
        this.documentRegistryContract = new ethers.Contract(
          config.contractDocumentRegistry,
          docRegistryAbi,
          this.provider
        );
      }

      if (config.contractAccessControl && ethers.isAddress(config.contractAccessControl)) {
        this.accessControlContract = new ethers.Contract(
          config.contractAccessControl,
          accessControlAbi,
          this.provider
        );
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn("[WARN] Blockchain service contract initialization failed:", (err as Error).message);
    }
  }

  private loadAbi(contractArtifactSubpath: string): ethers.InterfaceAbi {
    const possibleRoots = [
      path.resolve(process.cwd(), "artifacts/contracts"),
      path.resolve(process.cwd(), "../blockchain/artifacts/contracts"),
      path.resolve(__dirname, "../../../blockchain/artifacts/contracts"),
      path.resolve(process.cwd(), "deployments/localhost"),
      path.resolve(process.cwd(), "deployments/sepolia"),
      path.resolve(process.cwd(), "../blockchain/deployments/localhost"),
      path.resolve(process.cwd(), "../blockchain/deployments/sepolia"),
      path.resolve(__dirname, "../../../blockchain/deployments/localhost"),
      path.resolve(__dirname, "../../../blockchain/deployments/sepolia"),
    ];

    for (const root of possibleRoots) {
      const fullPath = path.join(root, contractArtifactSubpath);
      if (fs.existsSync(fullPath)) {
        try {
          const json = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          if (json.abi) return json.abi;
        } catch {
          // Continue to next root if parse fails
        }
      }
    }

    // Standalone deployment fallback when filesystem artifacts are not present
    if (contractArtifactSubpath.includes("DocumentRegistry")) {
      return FALLBACK_DOCUMENT_REGISTRY_ABI;
    }
    if (contractArtifactSubpath.includes("AccessControl")) {
      return FALLBACK_ACCESS_CONTROL_ABI;
    }

    throw new Error(`Contract artifact not found: ${contractArtifactSubpath}`);
  }

  /**
   * Verifies connectivity to the blockchain provider and checks chain ID.
   */
  public async checkConnection(): Promise<{ connected: boolean; chainId: number; blockNumber: number }> {
    try {
      const network = await this.provider.getNetwork();
      const currentChainId = Number(network.chainId);
      const blockNumber = await this.provider.getBlockNumber();

      return {
        connected: currentChainId === config.chainId,
        chainId: currentChainId,
        blockNumber,
      };
    } catch {
      return {
        connected: false,
        chainId: 0,
        blockNumber: 0,
      };
    }
  }

  /**
   * Retrieves a document record by its bytes32 documentId from DocumentRegistry.sol
   */
  public async getDocument(documentId: string): Promise<DocumentRecord> {
    await this.init();
    if (!this.documentRegistryContract) {
      throw new AppError("DocumentRegistry contract is not configured.", 503, "CONTRACT_NOT_CONFIGURED", "BLOCKCHAIN");
    }

    try {
      // Call getDocument(documentId)
      const doc = await this.documentRegistryContract.getDocument(documentId);
      const owner = (doc.owner || doc[1] || "").toString();
      const rawHash = (doc.documentHash || doc.fileHash || doc[2] || "").toString();
      const ipfsCid = (doc.ipfsCid || doc[3] || "").toString();
      const registeredAt = doc.registeredAt !== undefined ? doc.registeredAt : doc[4];
      const revoked = doc.revoked !== undefined ? doc.revoked : doc[5];

      return {
        id: documentId.toLowerCase(),
        owner: owner.toLowerCase(),
        cid: ipfsCid,
        fileHash: rawHash.toLowerCase(),
        createdAt: Number(registeredAt),
        revoked: Boolean(revoked),
      };
    } catch (err: unknown) {
      const errMsg = (err as Error).message || "";
      if (errMsg.includes("DocumentNotFound") || errMsg.includes("reverted with custom error")) {
        throw new AppError(`Document not found for ID: "${documentId}".`, 404, "DOCUMENT_NOT_FOUND", "BLOCKCHAIN");
      }
      throw new AppError("Failed to query DocumentRegistry smart contract.", 503, "BLOCKCHAIN_QUERY_FAILED", "BLOCKCHAIN");
    }
  }

  /**
   * Queries userDocuments list from DocumentRegistry.sol for a specific owner.
   */
  public async getUserDocuments(ownerAddress: string): Promise<DocumentRecord[]> {
    await this.init();
    if (!this.documentRegistryContract) {
      throw new AppError("DocumentRegistry contract is not configured.", 503, "CONTRACT_NOT_CONFIGURED", "BLOCKCHAIN");
    }

    try {
      const docIds: string[] = await this.documentRegistryContract.getUserDocuments(ownerAddress);
      if (!docIds || docIds.length === 0) {
        return [];
      }

      const results: DocumentRecord[] = [];
      for (const id of docIds) {
        try {
          const doc = await this.getDocument(id);
          results.push({
            ...doc,
            isOwner: true,
          });
        } catch {
          // If individual lookup fails, omit rather than fabricate
        }
      }

      return results;
    } catch {
      throw new AppError("Failed to query user documents from DocumentRegistry.", 503, "BLOCKCHAIN_QUERY_FAILED", "BLOCKCHAIN");
    }
  }

  /**
   * Checks whether a verifier has active, unrevoked access to a document.
   */
  public async hasAccess(documentId: string, verifierAddress: string): Promise<boolean> {
    await this.init();
    if (!this.accessControlContract) {
      return false;
    }

    try {
      const hasPermission: boolean = await this.accessControlContract.hasAccess(documentId, verifierAddress);
      return Boolean(hasPermission);
    } catch {
      return false;
    }
  }

  /**
   * Checks whether a verifier was directly granted access to a document (preserved even if revoked).
   */
  public async isDirectAccessGranted(documentId: string, verifierAddress: string): Promise<boolean> {
    await this.init();
    if (!this.accessControlContract) {
      return false;
    }

    try {
      const granted: boolean = await this.accessControlContract.isDirectAccessGranted(documentId, verifierAddress);
      return Boolean(granted);
    } catch {
      return false;
    }
  }

  /**
   * Reconstructs tamper-evident audit history by querying emitted event logs from contracts.
   */
  public async getDocumentAuditEvents(documentId: string): Promise<NormalizedAuditEvent[]> {
    await this.init();
    if (!this.documentRegistryContract || !this.accessControlContract) {
      throw new AppError("Contracts not configured for audit query.", 503, "CONTRACT_NOT_CONFIGURED", "BLOCKCHAIN");
    }

    const events: NormalizedAuditEvent[] = [];
    const normalizedDocId = documentId.toLowerCase();

    try {
      // 1. Query DocumentRegistry: DocumentRegistered & DocumentRevoked
      const regFilter = this.documentRegistryContract.filters.DocumentRegistered(normalizedDocId);
      const revFilter = this.documentRegistryContract.filters.DocumentRevoked(normalizedDocId);

      const [regLogs, revLogs] = await Promise.all([
        this.documentRegistryContract.queryFilter(regFilter, 0, "latest"),
        this.documentRegistryContract.queryFilter(revFilter, 0, "latest"),
      ]);

      // Cache block timestamps
      const blockTimestamps: Map<number, number> = new Map();
      const getBlockTime = async (blockNum: number): Promise<number> => {
        if (blockTimestamps.has(blockNum)) {
          return blockTimestamps.get(blockNum)!;
        }
        const block = await this.provider.getBlock(blockNum);
        const timestamp = block ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
        blockTimestamps.set(blockNum, timestamp);
        return timestamp;
      };

      for (const log of regLogs) {
        const parsed = this.documentRegistryContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed) {
          const time = await getBlockTime(log.blockNumber);
          const rawDocHash = (parsed.args.documentHash || parsed.args.fileHash || "").toString();
          events.push({
            eventName: "DocumentRegistered",
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            actor: parsed.args.owner.toLowerCase(),
            timestamp: time,
            contractAddress: config.contractDocumentRegistry,
            details: {
              cid: parsed.args.ipfsCid,
              fileHash: rawDocHash.toLowerCase(),
            },
          });
        }
      }

      for (const log of revLogs) {
        const parsed = this.documentRegistryContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed) {
          const time = await getBlockTime(log.blockNumber);
          events.push({
            eventName: "DocumentRevoked",
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            actor: parsed.args.owner.toLowerCase(),
            timestamp: time,
            contractAddress: config.contractDocumentRegistry,
            details: {
              reason: "Document revoked by owner on-chain",
            },
          });
        }
      }

      // 2. Query AccessControl: AccessGranted & AccessRevoked
      const grantFilter = this.accessControlContract.filters.AccessGranted(normalizedDocId);
      const accessRevFilter = this.accessControlContract.filters.AccessRevoked(normalizedDocId);

      const [grantLogs, accessRevLogs] = await Promise.all([
        this.accessControlContract.queryFilter(grantFilter, 0, "latest"),
        this.accessControlContract.queryFilter(accessRevFilter, 0, "latest"),
      ]);

      for (const log of grantLogs) {
        const parsed = this.accessControlContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed) {
          const time = await getBlockTime(log.blockNumber);
          events.push({
            eventName: "AccessGranted",
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            actor: parsed.args.owner.toLowerCase(),
            timestamp: time,
            contractAddress: config.contractAccessControl,
            details: {
              verifier: parsed.args.verifier.toLowerCase(),
            },
          });
        }
      }

      for (const log of accessRevLogs) {
        const parsed = this.accessControlContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed) {
          const time = await getBlockTime(log.blockNumber);
          events.push({
            eventName: "AccessRevoked",
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            actor: parsed.args.owner.toLowerCase(),
            timestamp: time,
            contractAddress: config.contractAccessControl,
            details: {
              verifier: parsed.args.verifier.toLowerCase(),
            },
          });
        }
      }

      // 3. Sort deterministically by blockNumber asc, then logIndex asc
      events.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber - b.blockNumber;
        }
        return a.logIndex - b.logIndex;
      });

      return events;
    } catch {
      throw new AppError("Failed to query audit event logs from blockchain.", 503, "AUDIT_QUERY_FAILED", "BLOCKCHAIN");
    }
  }
}

export const blockchainService = new BlockchainService();
