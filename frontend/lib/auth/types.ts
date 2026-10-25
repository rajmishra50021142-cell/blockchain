/**
 * Phase 11: Authentication Session Types
 *
 * Enforces strict separation between Web3 wallet connection and backend API session.
 */

export type AuthState =
  | "idle"
  | "requesting-challenge"
  | "waiting-signature"
  | "verifying"
  | "authenticated"
  | "error";

export interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  token: string | null;
  authAddress: string | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
