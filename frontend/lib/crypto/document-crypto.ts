/**
 * @file document-crypto.ts
 * @notice Real cryptographic foundation for the Blockchain-Based Digital Document Locker.
 * @dev Implements standard Web Crypto primitives:
 *      - SHA-256 for deterministic document integrity digests (compatible with DocumentRegistry bytes32)
 *      - AES-256-GCM for authenticated document encryption with fresh 256-bit keys and 96-bit random IVs
 *      - Binary serialization format for IPFS handoff (Phase 9)
 *      - Decrypt-then-hash verification pipeline
 *
 * ZERO SYNTHETIC / MOCK DATA: Operates strictly on real binary byte sequences.
 * ZERO HARDCODED SECRETS: Keys are generated at runtime and never persisted to localStorage or logged.
 */

export const PROTOCOL_VERSION = 1;
export const AES_KEY_BIT_LENGTH = 256;
export const GCM_IV_BYTE_LENGTH = 12; // 96 bits
export const GCM_TAG_BYTE_LENGTH = 16; // 128 bits
export const SHA256_BYTE_LENGTH = 32;

// --- Interfaces & Types ---

export interface HashResult {
  raw: Uint8Array;
  hex: string;
  bytes32: `0x${string}`;
}

export interface EncryptedPayload {
  version: number;
  iv: Uint8Array;
  ciphertext: Uint8Array; // Ciphertext + appended 16-byte authentication tag
}

export interface EncryptionResult {
  payload: EncryptedPayload;
  serialized: Uint8Array;
  key: CryptoKey;
  keyBytes: Uint8Array;
  keyHex: string;
}

export interface DecryptAndVerifyResult {
  plaintext: Uint8Array;
  computedHash: HashResult;
  verified: boolean;
}

// --- Custom Cryptographic Errors ---

export class CryptographicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptographicError";
  }
}

export class AuthenticationError extends CryptographicError {
  constructor(message: string = "Decryption authentication failed: ciphertext, IV, or key is invalid or tampered.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class MalformedPayloadError extends CryptographicError {
  constructor(message: string) {
    super(message);
    this.name = "MalformedPayloadError";
  }
}

// --- Web Crypto Environment Accessors ---

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "undefined") {
    return globalThis.crypto.subtle;
  }
  throw new CryptographicError("Web Crypto API (crypto.subtle) is not available in the current environment.");
}

function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  if (typeof globalThis.crypto?.getRandomValues !== "undefined") {
    return globalThis.crypto.getRandomValues(array as any) as T;
  }
  throw new CryptographicError("Secure random generator (crypto.getRandomValues) is not available.");
}

// --- Helper Functions for Exact Binary Encoding ---

export function uint8ArrayToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new CryptographicError("Invalid hex string: length must be even.");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new CryptographicError(`Invalid hex character at index ${i}.`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

function normalizeToUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  throw new CryptographicError("Unsupported input type: input must be a Uint8Array or ArrayBuffer.");
}

// --- SHA-256 Implementation ---

/**
 * Computes the deterministic SHA-256 cryptographic digest of exact document bytes.
 * @param input Raw document byte array or ArrayBuffer.
 * @returns HashResult containing raw 32 bytes, 64-char hex string, and 0x-prefixed bytes32 string.
 */
export async function hashDocument(input: Uint8Array | ArrayBuffer): Promise<HashResult> {
  const bytes = normalizeToUint8Array(input);
  const subtle = getSubtleCrypto();

  const digestBuffer = await subtle.digest("SHA-256", bytes as BufferSource);
  const raw = new Uint8Array(digestBuffer);
  const hex = uint8ArrayToHex(raw);
  const bytes32: `0x${string}` = `0x${hex}`;

  return { raw, hex, bytes32 };
}

/**
 * Verifies whether input bytes match an expected SHA-256 digest.
 * @param input Document bytes.
 * @param expectedHash 64-char hex or 0x-prefixed 66-char bytes32 string.
 * @returns Boolean true if hashes match exactly, false otherwise.
 */
export async function verifyDocumentHash(
  input: Uint8Array | ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  const result = await hashDocument(input);
  const cleanExpected = expectedHash.startsWith("0x")
    ? expectedHash.slice(2).toLowerCase()
    : expectedHash.toLowerCase();

  return result.hex === cleanExpected;
}

// --- Key Management ---

/**
 * Generates a fresh cryptographically secure 256-bit AES-GCM encryption key.
 * @returns CryptoKey extractable for client-side envelope wrapping.
 */
export async function generateDocumentKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  return subtle.generateKey(
    {
      name: "AES-GCM",
      length: AES_KEY_BIT_LENGTH,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to raw 32-byte Uint8Array.
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();
  const rawBuffer = await subtle.exportKey("raw", key);
  return new Uint8Array(rawBuffer);
}

/**
 * Exports a CryptoKey to a 64-character hexadecimal string.
 */
export async function exportKeyHex(key: CryptoKey): Promise<string> {
  const bytes = await exportKey(key);
  return uint8ArrayToHex(bytes);
}

/**
 * Imports a raw 32-byte or 64-char hex key as an AES-GCM CryptoKey.
 */
export async function importKey(rawKey: Uint8Array | string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const bytes = typeof rawKey === "string" ? hexToUint8Array(rawKey) : rawKey;

  if (bytes.length !== 32) {
    throw new CryptographicError(
      `Invalid AES key length: expected 32 bytes (256 bits), received ${bytes.length} bytes.`
    );
  }

  return subtle.importKey(
    "raw",
    bytes as BufferSource,
    {
      name: "AES-GCM",
      length: AES_KEY_BIT_LENGTH,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a fresh cryptographically random 96-bit (12-byte) initialization vector (IV).
 */
export function generateIV(): Uint8Array {
  return getRandomValues(new Uint8Array(GCM_IV_BYTE_LENGTH));
}

// --- Payload Serialization ---

/**
 * Serializes an EncryptedPayload into a canonical binary byte buffer for IPFS upload.
 * Binary format:
 * [0]: Version (1 byte)
 * [1]: IV length (1 byte, always 12)
 * [2..13]: IV (12 bytes)
 * [14..N]: Ciphertext + 16-byte GCM Tag
 */
export function serializeEncryptedPayload(payload: EncryptedPayload): Uint8Array {
  if (payload.iv.length !== GCM_IV_BYTE_LENGTH) {
    throw new MalformedPayloadError(
      `Invalid IV length: expected ${GCM_IV_BYTE_LENGTH}, received ${payload.iv.length}.`
    );
  }

  const totalLength = 2 + payload.iv.length + payload.ciphertext.length;
  const buffer = new Uint8Array(totalLength);

  buffer[0] = payload.version;
  buffer[1] = payload.iv.length;
  buffer.set(payload.iv, 2);
  buffer.set(payload.ciphertext, 2 + payload.iv.length);

  return buffer;
}

/**
 * Deserializes canonical binary bytes into an EncryptedPayload structure.
 */
export function deserializeEncryptedPayload(data: Uint8Array): EncryptedPayload {
  if (data.length < 2 + GCM_IV_BYTE_LENGTH + GCM_TAG_BYTE_LENGTH) {
    throw new MalformedPayloadError(
      `Payload buffer truncated: length is ${data.length} bytes, minimum required is ${
        2 + GCM_IV_BYTE_LENGTH + GCM_TAG_BYTE_LENGTH
      } bytes.`
    );
  }

  const version = data[0];
  if (version !== PROTOCOL_VERSION) {
    throw new MalformedPayloadError(
      `Unsupported encryption payload version: ${version} (expected ${PROTOCOL_VERSION}).`
    );
  }

  const ivLength = data[1];
  if (ivLength !== GCM_IV_BYTE_LENGTH) {
    throw new MalformedPayloadError(
      `Corrupted payload: unexpected IV length ${ivLength} (expected ${GCM_IV_BYTE_LENGTH}).`
    );
  }

  const iv = data.slice(2, 2 + ivLength);
  const ciphertext = data.slice(2 + ivLength);

  if (ciphertext.length < GCM_TAG_BYTE_LENGTH) {
    throw new MalformedPayloadError("Corrupted payload: ciphertext does not contain authentication tag.");
  }

  return { version, iv, ciphertext };
}

// --- AES-256-GCM Encryption & Decryption ---

/**
 * Encrypts arbitrary document bytes using AES-256-GCM.
 * @param data Raw document bytes or ArrayBuffer.
 * @param existingKey Optional pre-generated CryptoKey (fresh key generated if omitted).
 * @returns Complete EncryptionResult including payload, serialized bytes, and key representations.
 */
export async function encryptDocument(
  data: Uint8Array | ArrayBuffer,
  existingKey?: CryptoKey
): Promise<EncryptionResult> {
  const bytes = normalizeToUint8Array(data);
  const subtle = getSubtleCrypto();

  const key = existingKey || (await generateDocumentKey());
  const iv = generateIV();

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      tagLength: 128, // 16 bytes authentication tag
    },
    key,
    bytes as BufferSource
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);
  const payload: EncryptedPayload = {
    version: PROTOCOL_VERSION,
    iv,
    ciphertext,
  };

  const serialized = serializeEncryptedPayload(payload);
  const keyBytes = await exportKey(key);
  const keyHex = uint8ArrayToHex(keyBytes);

  return {
    payload,
    serialized,
    key,
    keyBytes,
    keyHex,
  };
}

/**
 * Decrypts an EncryptedPayload or serialized binary payload using the provided AES-256-GCM key.
 * @param payloadInput EncryptedPayload object or raw serialized Uint8Array.
 * @param keyInput CryptoKey, raw 32-byte Uint8Array, or 64-char hex string.
 * @returns Exact original plaintext bytes.
 * @throws AuthenticationError if ciphertext is modified, IV is altered, or key is wrong.
 * @throws MalformedPayloadError if payload serialization is corrupted.
 */
export async function decryptDocument(
  payloadInput: EncryptedPayload | Uint8Array,
  keyInput: CryptoKey | Uint8Array | string
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();

  // 1. Resolve payload
  let payload: EncryptedPayload;
  if (payloadInput instanceof Uint8Array) {
    payload = deserializeEncryptedPayload(payloadInput);
  } else if (
    typeof payloadInput === "object" &&
    payloadInput !== null &&
    payloadInput.iv instanceof Uint8Array &&
    payloadInput.ciphertext instanceof Uint8Array
  ) {
    payload = payloadInput;
  } else {
    throw new MalformedPayloadError("Invalid payload argument: must be EncryptedPayload or serialized Uint8Array.");
  }

  // 2. Resolve CryptoKey
  let key: CryptoKey;
  if (typeof keyInput === "object" && keyInput !== null && "algorithm" in keyInput) {
    key = keyInput as CryptoKey;
  } else if (keyInput instanceof Uint8Array || typeof keyInput === "string") {
    key = await importKey(keyInput);
  } else {
    throw new CryptographicError("Invalid key argument: must be CryptoKey, Uint8Array (32 bytes), or hex string.");
  }

  // 3. Authenticated Decryption
  try {
    const decryptedBuffer = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: payload.iv as BufferSource,
        tagLength: 128,
      },
      key,
      payload.ciphertext as BufferSource
    );

    return new Uint8Array(decryptedBuffer);
  } catch {
    // Web Crypto API rejects with OperationError on tag verification failure or wrong key
    throw new AuthenticationError();
  }
}

// --- Decrypt-then-Hash Verification Primitive ---

/**
 * Decrypts an encrypted document payload and verifies that its computed SHA-256 digest
 * matches the authoritative expected hash.
 * @param payloadInput EncryptedPayload or serialized bytes.
 * @param keyInput AES-256 key.
 * @param expectedHash Authoritative document hash (e.g. from DocumentRegistry).
 * @returns DecryptAndVerifyResult containing plaintext, computed hash, and verified boolean.
 * @throws AuthenticationError if ciphertext was modified or decryption fails.
 */
export async function decryptAndVerify(
  payloadInput: EncryptedPayload | Uint8Array,
  keyInput: CryptoKey | Uint8Array | string,
  expectedHash: string
): Promise<DecryptAndVerifyResult> {
  // 1. Authenticated Decryption: Fails closed on any tamper
  const plaintext = await decryptDocument(payloadInput, keyInput);

  // 2. Compute SHA-256 of restored original bytes
  const computedHash = await hashDocument(plaintext);

  // 3. Strict hash verification against expected value
  const cleanExpected = expectedHash.startsWith("0x")
    ? expectedHash.slice(2).toLowerCase()
    : expectedHash.toLowerCase();

  const verified = computedHash.hex === cleanExpected;

  return {
    plaintext,
    computedHash,
    verified,
  };
}
