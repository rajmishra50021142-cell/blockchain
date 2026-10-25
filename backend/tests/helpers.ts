/**
 * Phase 10: Test Fixtures & Blockchain Helpers
 *
 * Provides real transaction helpers for isolated integration tests against
 * the running local Hardhat node.
 *
 * NOTE: Operates strictly with standard Hardhat development private keys (pre-funded).
 * Zero synthetic contract data: transactions are mined and state is real.
 */

import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { config } from "../src/config/env";
import * as fs from "fs";
import * as path from "path";

// Hardhat standard Account #0 & Account #1
export const HARDHAT_ACCOUNT_0_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const HARDHAT_ACCOUNT_1_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

export function getProvider() {
  return new ethers.JsonRpcProvider(config.rpcUrl, undefined, {
    staticNetwork: ethers.Network.from(config.chainId),
  });
}

export function getSigner(privateKey: string) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, undefined, {
    staticNetwork: ethers.Network.from(config.chainId),
  });
  return new ethers.Wallet(privateKey, provider);
}

export function generateJwt(address: string) {
  return jwt.sign(
    { sub: ethers.getAddress(address), chainId: config.chainId, jti: crypto.randomUUID() },
    config.authJwtSecret,
    { expiresIn: "15m" }
  );
}

function loadAbi(artifactPath: string) {
  const possiblePaths = [
    path.resolve(process.cwd(), "../blockchain/artifacts/contracts", artifactPath),
    path.resolve(process.cwd(), "artifacts/contracts", artifactPath),
    path.resolve(__dirname, "../../blockchain/artifacts/contracts", artifactPath),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8")).abi;
    }
  }
  throw new Error(`ABI artifact not found: ${artifactPath}`);
}

export function getDocumentRegistryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const abi = loadAbi("DocumentRegistry.sol/DocumentRegistry.json");
  return new ethers.Contract(config.contractDocumentRegistry, abi, signerOrProvider);
}

export function getAccessControlContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const abi = loadAbi("AccessControl.sol/AccessControl.json");
  return new ethers.Contract(config.contractAccessControl, abi, signerOrProvider);
}

export async function registerTestDocument(
  privateKeyOrSigner: string | ethers.Signer,
  docId: string,
  docHash: string,
  cid: string
) {
  const signer =
    typeof privateKeyOrSigner === "string"
      ? getSigner(privateKeyOrSigner)
      : getSigner((privateKeyOrSigner as any).privateKey || HARDHAT_ACCOUNT_0_KEY);
  const contract = getDocumentRegistryContract(signer);
  const tx = await contract.registerDocument(docId, docHash, cid);
  return await tx.wait(1);
}

export async function grantTestAccess(
  privateKeyOrSigner: string | ethers.Signer,
  docId: string,
  verifier: string
) {
  const signer =
    typeof privateKeyOrSigner === "string"
      ? getSigner(privateKeyOrSigner)
      : getSigner((privateKeyOrSigner as any).privateKey || HARDHAT_ACCOUNT_0_KEY);
  const contract = getAccessControlContract(signer);
  const tx = await contract.grantAccess(docId, verifier);
  return await tx.wait(1);
}

export async function revokeTestDocument(
  privateKeyOrSigner: string | ethers.Signer,
  docId: string
) {
  const signer =
    typeof privateKeyOrSigner === "string"
      ? getSigner(privateKeyOrSigner)
      : getSigner((privateKeyOrSigner as any).privateKey || HARDHAT_ACCOUNT_0_KEY);
  const contract = getDocumentRegistryContract(signer);
  const tx = await contract.revokeDocument(docId);
  return await tx.wait(1);
}

export async function revokeTestAccess(
  privateKeyOrSigner: string | ethers.Signer,
  docId: string,
  verifier: string
) {
  const signer =
    typeof privateKeyOrSigner === "string"
      ? getSigner(privateKeyOrSigner)
      : getSigner((privateKeyOrSigner as any).privateKey || HARDHAT_ACCOUNT_0_KEY);
  const contract = getAccessControlContract(signer);
  const tx = await contract.revokeAccess(docId, verifier);
  return await tx.wait(1);
}
