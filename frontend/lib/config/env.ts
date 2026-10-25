/**
 * Phase 11: Frontend Configuration
 *
 * Centralized configuration loader reading exclusively public environment variables.
 * Never loads, stores, or accesses server secrets, private keys, or API tokens.
 */

export interface FrontendConfig {
  apiBaseUrl: string;
  expectedChainId: number;
  contractDocumentRegistry: string;
  contractAccessControl: string;
  contractNetwork: string;
}

const isSepolia = Number(process.env.NEXT_PUBLIC_CHAIN_ID) === 11155111;

export const config: FrontendConfig = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  expectedChainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || "31337"),
  contractDocumentRegistry:
    process.env.NEXT_PUBLIC_CONTRACT_DOCUMENT_REGISTRY ||
    (isSepolia ? "" : "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
  contractAccessControl:
    process.env.NEXT_PUBLIC_CONTRACT_ACCESS_CONTROL ||
    (isSepolia ? "" : "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
  contractNetwork:
    process.env.NEXT_PUBLIC_CONTRACT_NETWORK || (isSepolia ? "sepolia" : "localhost"),
};

/**
 * Validates the presence of required frontend configuration values.
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!config.apiBaseUrl) missing.push("NEXT_PUBLIC_API_BASE_URL");
  if (!config.expectedChainId) missing.push("NEXT_PUBLIC_CHAIN_ID");
  if (!config.contractDocumentRegistry)
    missing.push("NEXT_PUBLIC_CONTRACT_DOCUMENT_REGISTRY");
  if (!config.contractAccessControl)
    missing.push("NEXT_PUBLIC_CONTRACT_ACCESS_CONTROL");

  return {
    valid: missing.length === 0,
    missing,
  };
}
