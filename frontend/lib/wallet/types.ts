export type WalletState =
  | "initializing"
  | "wallet-unavailable"
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong-network"
  | "account-changed"
  | "error";

export interface SignatureProof {
  message: string;
  signature: string;
  recoveredAddress: string;
  verified: boolean;
  timestamp: string;
  nonce: string;
}

export interface WalletContextType {
  state: WalletState;
  address: string | null;
  chainId: number | null;
  expectedChainId: number;
  balance: string | null;
  isMetaMask: boolean;
  error: string | null;
  signatureProof: SignatureProof | null;
  isSigning: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signOwnershipChallenge: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  clearError: () => void;
}
