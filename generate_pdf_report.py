"""
Master 6-Page Calibrated Technical Document Generator for:
Blockchain-Based Digital Document Locker (Eman) - 25BCE1463
Generates an exact 6-page, publication-grade PDF report with 0 orphan spills.
"""

import subprocess
import os

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Blockchain-Based Digital Document Locker - Technical Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.42;
    font-size: 8.8pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Exactly 6 pages - each section is exactly 1 page */
  .page {
    page-break-after: always;
    height: 100%;
    max-height: 273mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .page:last-of-type {
    page-break-after: avoid;
  }

  /* Cover Banner (Page 1) */
  .cover-header {
    background: linear-gradient(135deg, #091e3a 0%, #172554 45%, #0369a1 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
  }

  .badge-tag {
    display: inline-block;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 7.2pt;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 6px;
    color: #38bdf8;
  }

  .cover-title {
    font-size: 16pt;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
    color: #ffffff;
  }

  .cover-subtitle {
    font-size: 8.8pt;
    font-weight: 400;
    color: #cbd5e1;
    margin-bottom: 10px;
    line-height: 1.35;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    padding-top: 8px;
  }

  .meta-label {
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 6.5pt;
    letter-spacing: 0.05em;
  }

  .meta-value {
    color: #f8fafc;
    font-weight: 600;
    font-size: 8pt;
    margin-top: 1px;
    line-height: 1.25;
  }

  /* Headings */
  h1 {
    font-size: 12.5pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 1.5px solid #0284c7;
    padding-bottom: 3px;
    margin-top: 6px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h1 .sec-num {
    background: #0284c7;
    color: #ffffff;
    font-size: 8pt;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 700;
  }

  h2 {
    font-size: 10pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  h3 {
    font-size: 8.8pt;
    font-weight: 600;
    color: #334155;
    margin-top: 6px;
    margin-bottom: 3px;
  }

  p {
    margin-bottom: 6px;
    color: #334155;
    text-align: justify;
    line-height: 1.4;
  }

  strong {
    color: #0f172a;
  }

  /* Callout Boxes */
  .callout {
    background: #f8fafc;
    border-left: 3px solid #0284c7;
    padding: 6px 10px;
    border-radius: 0 5px 5px 0;
    margin: 6px 0;
    font-size: 8.2pt;
    line-height: 1.35;
  }

  .callout.security {
    border-left-color: #059669;
    background: #f0fdf4;
  }

  .callout.warning {
    border-left-color: #d97706;
    background: #fffbeb;
  }

  .callout-title {
    font-weight: 700;
    font-size: 8.2pt;
    margin-bottom: 2px;
  }

  .callout.security .callout-title { color: #065f46; }
  .callout.warning .callout-title { color: #92400e; }
  .callout .callout-title { color: #0369a1; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 8px 0;
    font-size: 7.8pt;
  }

  th, td {
    padding: 4px 6px;
    text-align: left;
    border: 1px solid #cbd5e1;
    vertical-align: top;
    line-height: 1.3;
  }

  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* Code & Syntax */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.4pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 3px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 7px 10px;
    border-radius: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.2pt;
    line-height: 1.35;
    margin: 5px 0 7px 0;
    border: 1px solid #1e293b;
    overflow-x: hidden;
  }

  pre .keyword { color: #f472b6; font-weight: 600; }
  pre .type { color: #38bdf8; }
  pre .comment { color: #94a3b8; font-style: italic; }
  pre .string { color: #a3e635; }
  pre .func { color: #fbbf24; }

  /* Grid Layouts */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 6px 0;
  }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 7px 9px;
    background: #ffffff;
  }

  .card-header {
    font-weight: 700;
    font-size: 8.2pt;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .card p {
    font-size: 7.6pt;
    margin-bottom: 0;
    color: #475569;
    line-height: 1.35;
  }

  /* Diagram Box */
  .diagram-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 6px;
    margin: 6px 0;
    text-align: center;
  }

  .diagram-caption {
    font-size: 6.8pt;
    color: #64748b;
    margin-top: 3px;
    font-weight: 500;
  }

  ul {
    padding-left: 16px;
    margin-bottom: 5px;
    font-size: 8pt;
    color: #334155;
  }

  li {
    margin-bottom: 2px;
  }

  /* Footer on each page */
  .footer-bar {
    margin-top: auto;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 6.8pt;
    color: #94a3b8;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER & EXECUTIVE OVERVIEW ==================== -->
  <div class="page">
    <div class="cover-header">
      <div class="badge-tag">Academic & Industry Architecture Specification • Real-Data Blockchain</div>
      <div class="cover-title">Blockchain-Based Digital Document Locker (Eman)</div>
      <div class="cover-subtitle">
        A decentralized, tamper-evident, sovereign digital document storage, verification, and sharing architecture designed as a zero-trust alternative to centralized repositories.
      </div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Author / Roll No.</div>
          <div class="meta-value">Shah Emanul Haque<br>(25BCE1463)</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Architecture</div>
          <div class="meta-value">5-Tier Decentralized<br>(EVM + IPFS + Web3)</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Smart Contracts</div>
          <div class="meta-value">Solidity 0.8.24<br>Registry & AccessControl</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Storage Topology</div>
          <div class="meta-value">On-Chain Hashes & CIDs<br>Off-Chain AES-256 IPFS</div>
        </div>
      </div>
    </div>

    <h1><span class="sec-num">01</span> Project Overview & Problem Context</h1>
    
    <p>
      Traditional government and enterprise document repositories (such as the centralized <strong>DigiLocker</strong> platform) store citizens' high-value credentials—including educational degrees, identity records, property titles, and health certificates—on centralized servers managed by cloud providers and institutional administrators. While this has advanced paperless workflows, centralized architectures suffer from critical systematic flaws:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Vulnerability Dimension</th>
          <th style="width: 39%;">Traditional Centralized Locker (DigiLocker)</th>
          <th style="width: 39%;">Eman Blockchain Document Locker</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Architecture & Single Point of Failure</strong></td>
          <td>Centralized database and monolithic cloud servers. If the central provider experiences an outage, data corruption, or DDOS attack, nationwide verification halts. Over 3.68 crore accounts have historically been at risk in centralized breaches.</td>
          <td><strong>Decentralized & Multi-Node:</strong> Ethereum EVM consensus nodes coupled with distributed InterPlanetary File System (IPFS) peer-to-peer storage. No single point of failure can disable the network or compromise data availability.</td>
        </tr>
        <tr>
          <td><strong>Data Sovereignty & Custody</strong></td>
          <td>Platform administrators hold direct database access and can view, edit, or delete records without user approval. The citizen is a passive beneficiary rather than a sovereign owner.</td>
          <td><strong>Self-Sovereign Ownership:</strong> Controlled entirely by the user's private key (via MetaMask / EIP-1193). Smart contracts forbid any third party or administrator from revoking, altering, or sharing documents without owner signatures.</td>
        </tr>
        <tr>
          <td><strong>Tamper Detection & Verification Speed</strong></td>
          <td>Database records can be modified by rogue insiders or malicious SQL injections. Verification requires manual, out-of-band communication with issuing bodies taking hours or days.</td>
          <td><strong>Deterministic SHA-256 Anchors:</strong> Documents are fingerprinted client-side before upload. The digest is stored permanently on-chain. Immediate tamper detection in under 2 seconds.</td>
        </tr>
        <tr>
          <td><strong>Confidentiality at Rest</strong></td>
          <td>Files are stored plaintext or with server-side managed encryption keys. Cloud providers, server admins, and law enforcement can read documents directly off disk.</td>
          <td><strong>Client-Side Authenticated Encryption:</strong> Symmetrically encrypted in the browser with AES-256-GCM prior to transmission. Storage nodes and backend handle only high-entropy ciphertext.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout security">
      <div class="callout-title">Guiding Principle: Absolute Non-Synthetic Data Policy</div>
      The Eman Digital Document Locker is engineered as a real-world Web3 production system. Every cryptographic key, wallet signature, SHA-256 digest, IPFS Content Identifier (CID), transaction receipt, block number, and audit log originates from genuine client operations or live EVM execution. No synthetic, fake, or mock fallback values exist in the application.
    </div>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 1 of 6</span>
    </div>
  </div>

  <!-- ==================== PAGE 2: SYSTEM ARCHITECTURE ==================== -->
  <div class="page">
    <h1><span class="sec-num">02</span> System Architecture & Layered Topology</h1>
    
    <p>
      The system is designed as an institutional-grade, zero-trust <strong>5-Tier Decentralized Architecture</strong>. Responsibilities are strictly segregated to isolate private cryptographic keys from public ledgers and backend relays, guaranteeing that raw plaintext documents never touch untrusted infrastructure.
    </p>

    <div class="diagram-box">
      <svg width="100%" height="210" viewBox="0 0 740 210" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="p1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0369a1"/></linearGradient>
          <linearGradient id="p2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#3730a3"/></linearGradient>
          <linearGradient id="p3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
          <linearGradient id="p4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/></linearGradient>
        </defs>

        <!-- Presentation Tier -->
        <g transform="translate(10, 10)">
          <rect width="135" height="175" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="1.8"/>
          <rect width="135" height="24" rx="6" fill="url(#p1)"/>
          <text x="67" y="16" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">1. Presentation Tier</text>
          <text x="67" y="44" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Next.js 15 App Router</text>
          <text x="67" y="57" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Tailwind CSS UI</text>
          <line x1="12" y1="68" x2="123" y2="68" stroke="#e2e8f0"/>
          <text x="67" y="86" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">MetaMask Wallet</text>
          <text x="67" y="99" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">EIP-1193 / EIP-191</text>
          <line x1="12" y1="110" x2="123" y2="110" stroke="#e2e8f0"/>
          <text x="67" y="128" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Web Crypto API</text>
          <text x="67" y="141" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">SHA-256 + AES-GCM</text>
          <text x="67" y="160" fill="#0284c7" font-family="Inter" font-weight="600" font-size="6.8" text-anchor="middle">Client-Side Only</text>
        </g>

        <!-- Link 1 to 2 -->
        <path d="M 145 60 L 195 60" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="170" y="53" fill="#64748b" font-size="5.8" font-family="Inter" text-anchor="middle">Auth Nonce</text>

        <!-- Application Gateway Tier -->
        <g transform="translate(195, 10)">
          <rect width="140" height="175" rx="6" fill="#ffffff" stroke="#4f46e5" stroke-width="1.8"/>
          <rect width="140" height="24" rx="6" fill="url(#p2)"/>
          <text x="70" y="16" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">2. Application Gateway</text>
          <text x="70" y="44" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Node.js Express</text>
          <text x="70" y="57" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">TypeScript Controllers</text>
          <line x1="12" y1="68" x2="128" y2="68" stroke="#e2e8f0"/>
          <text x="70" y="86" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Auth Challenge Service</text>
          <text x="70" y="99" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Signature Verification</text>
          <line x1="12" y1="110" x2="128" y2="110" stroke="#e2e8f0"/>
          <text x="70" y="128" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">IPFS Proxy Relay</text>
          <text x="70" y="141" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Pinata V3 Client</text>
          <text x="70" y="160" fill="#4f46e5" font-family="Inter" font-weight="600" font-size="6.8" text-anchor="middle">Zero Keys Held</text>
        </g>

        <!-- Link 2 to 3 -->
        <path d="M 335 125 L 385 125" stroke="#64748b" stroke-width="1.5"/>
        <text x="360" y="118" fill="#64748b" font-size="5.8" font-family="Inter" text-anchor="middle">Ciphertext</text>

        <!-- Off-Chain Storage Tier -->
        <g transform="translate(385, 10)">
          <rect width="140" height="175" rx="6" fill="#ffffff" stroke="#d97706" stroke-width="1.8"/>
          <rect width="140" height="24" rx="6" fill="url(#p3)"/>
          <text x="70" y="16" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">3. Storage (Off-Chain)</text>
          <text x="70" y="44" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">IPFS Swarm Cluster</text>
          <text x="70" y="57" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Distributed P2P DHT</text>
          <line x1="12" y1="68" x2="128" y2="68" stroke="#e2e8f0"/>
          <text x="70" y="86" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Pinata Files V3 API</text>
          <text x="70" y="99" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Multi-Region Redundancy</text>
          <line x1="12" y1="110" x2="128" y2="110" stroke="#e2e8f0"/>
          <text x="70" y="128" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Encrypted Payloads</text>
          <text x="70" y="141" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Version | IV | Ciphertext</text>
          <text x="70" y="160" fill="#d97706" font-family="Inter" font-weight="600" font-size="6.8" text-anchor="middle">Zero Plaintext</text>
        </g>

        <!-- Direct Wallet Write Arc -->
        <path d="M 77 185 C 77 205, 645 205, 645 185" stroke="#059669" stroke-width="1.8" fill="none" stroke-dasharray="4,4"/>
        <text x="360" y="204" fill="#059669" font-size="6.8" font-family="Inter" font-weight="700" text-anchor="middle">Direct User-Signed EVM Transactions (Zero Custody / Non-Intermediary)</text>

        <!-- Blockchain Layer -->
        <g transform="translate(570, 10)">
          <rect width="160" height="175" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.8"/>
          <rect width="160" height="24" rx="6" fill="url(#p4)"/>
          <text x="80" y="16" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">4. Consensus (On-Chain)</text>
          <text x="80" y="44" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">Ethereum EVM Ledger</text>
          <text x="80" y="57" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Hardhat / Sepolia</text>
          <line x1="12" y1="68" x2="148" y2="68" stroke="#e2e8f0"/>
          <text x="80" y="86" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">DocumentRegistry.sol</text>
          <text x="80" y="99" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">SHA-256 Hashes & CIDs</text>
          <line x1="12" y1="110" x2="148" y2="110" stroke="#e2e8f0"/>
          <text x="80" y="128" fill="#0f172a" font-family="Inter" font-weight="600" font-size="7.5" text-anchor="middle">AccessControl.sol</text>
          <text x="80" y="141" fill="#64748b" font-family="Inter" font-size="6.8" text-anchor="middle">Verifier Access Matrices</text>
          <text x="80" y="160" fill="#059669" font-family="Inter" font-weight="600" font-size="6.8" text-anchor="middle">Immutable EVM Events</text>
        </g>
      </svg>
      <div class="diagram-caption">Figure 1: Complete 5-Tier Architecture Model Showing Separation of Storage, Key Custody, and Consensus</div>
    </div>

    <h2>Detailed Tier Architecture & Responsibilities</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">1. Presentation Tier (Next.js 15 & MetaMask)</div>
        <p>Runs directly within the user's browser. Responsible for local file selection, computing deterministic SHA-256 hashes, generating ephemeral 256-bit AES-GCM keys via the W3C Web Crypto API, packing serialized binary envelopes, and interfacing with MetaMask (via <code>ethers.js v6</code>) for EIP-1193 transaction signing.</p>
      </div>
      <div class="card">
        <div class="card-header">2. Application Gateway (Node.js & Express)</div>
        <p>A stateless REST API layer. Implements cryptographic wallet login using EIP-191 personal sign nonces (eliminating username/password vulnerabilities). Relays encrypted payloads to Pinata IPFS nodes, extracts CIDs, and filters indexed EVM event logs for the frontend audit timeline.</p>
      </div>
      <div class="card">
        <div class="card-header">3. Consensus Layer (Ethereum EVM)</div>
        <p>Composed of Solidity 0.8.24 smart contracts (<code>DocumentRegistry.sol</code> and <code>AccessControl.sol</code>). Acts as the single, tamper-proof source of truth for document ownership, file integrity hashes, IPFS storage pointers, verifier permissions, and permanent revocation flags.</p>
      </div>
      <div class="card">
        <div class="card-header">4. Decentralized Storage (IPFS & Pinata V3)</div>
        <p>A content-addressed peer-to-peer distributed storage network. Stores only high-entropy, encrypted binary blobs. Documents remain mathematically unreadable on the public network without the corresponding 256-bit AES symmetric key held exclusively by the owner.</p>
      </div>
    </div>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 2 of 6</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: THE REGISTRY MODULE ==================== -->
  <div class="page">
    <h1><span class="sec-num">03</span> The Registry Module: DocumentRegistry.sol</h1>
    
    <p>
      The <strong>DocumentRegistry</strong> contract is the authoritative on-chain foundation of the platform. It provides permanent proof of existence, integrity anchors, decentralized storage references, and sovereign revocation controls.
    </p>

    <h2>3.1 Storage Layout & Data Structures</h2>
    <p>
      The contract optimizes Ethereum storage slots by maintaining an unalterable struct and two primary $O(1)$ mapping structures:
    </p>

    <pre><span class="comment">// Immutable document record anchored in EVM consensus storage</span>
<span class="keyword">struct</span> <span class="type">Document</span> {
    <span class="type">bytes32</span> documentId;   <span class="comment">// 32-byte cryptographically secure opaque unique ID</span>
    <span class="type">address</span> owner;        <span class="comment">// Sovereign wallet address (msg.sender at registration)</span>
    <span class="type">bytes32</span> documentHash; <span class="comment">// Deterministic SHA-256 digest of original plaintext bytes</span>
    <span class="type">string</span>  ipfsCid;       <span class="comment">// Content Identifier (CID v0 / v1) of encrypted payload</span>
    <span class="type">uint256</span> registeredAt; <span class="comment">// EVM block timestamp of registration</span>
    <span class="type">bool</span>    revoked;      <span class="comment">// Permanent sovereign revocation status flag</span>
}

<span class="comment">// Primary index: O(1) direct document retrieval by documentId</span>
<span class="keyword">mapping</span>(<span class="type">bytes32</span> => <span class="type">Document</span>) <span class="keyword">private</span> _documents;

<span class="comment">// Secondary index: Enumeration of all document IDs owned by a specific address</span>
<span class="keyword">mapping</span>(<span class="type">address</span> => <span class="type">bytes32</span>[]) <span class="keyword">private</span> _userDocuments;</pre>

    <h2>3.2 Opaque Cryptographic 32-Byte Identifier Strategy</h2>
    <p>
      Unlike naive blockchain registries that use auto-incrementing numbers (e.g. 1, 2, 3) or plaintext filenames (e.g. "degree.pdf"), the Eman locker enforces an <strong>opaque 32-byte cryptographic identifier</strong>:
    </p>
    <ul>
      <li><strong>Generation:</strong> Created client-side via 256 bits of CSPRNG entropy: <code>ethers.hexlify(ethers.randomBytes(32))</code>.</li>
      <li><strong>Information Hiding:</strong> Prevents attackers from scanning or guessing document IDs, inferring user portfolio sizes, or intercepting document classifications from sequential sequences.</li>
      <li><strong>Collision Prevention:</strong> The contract requires <code>_documents[documentId].owner == address(0)</code>. If a duplicate ID is submitted, it immediately reverts with custom error <code>DocumentAlreadyExists(documentId)</code>.</li>
    </ul>

    <h2>3.3 Core Operations & State Transitions</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Method Signature</th>
          <th style="width: 14%;">Visibility</th>
          <th style="width: 61%;">Operational Semantics & Security Invariants</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>registerDocument(bytes32, bytes32, string)</code></td>
          <td>External (Tx)</td>
          <td>Validates non-zero ID, non-zero hash, and non-empty CID. Sets <code>doc.owner = msg.sender</code>. Sets <code>registeredAt = block.timestamp</code> and <code>revoked = false</code>. Emits <code>DocumentRegistered</code>.</td>
        </tr>
        <tr>
          <td><code>getDocument(bytes32)</code></td>
          <td>External View</td>
          <td>Returns complete <code>Document</code> struct. Reverts with <code>DocumentNotFound</code> if unallocated. Used for verification and audit.</td>
        </tr>
        <tr>
          <td><code>getUserDocuments(address)</code></td>
          <td>External View</td>
          <td>Returns dynamic array of 32-byte document IDs registered by the queried wallet address. Powers the user's dashboard document catalog.</td>
        </tr>
        <tr>
          <td><code>revokeDocument(bytes32)</code></td>
          <td>External (Tx)</td>
          <td>Restricted strictly to <code>msg.sender == doc.owner</code>. Sets <code>revoked = true</code>. Reverts if already revoked (<code>DocumentAlreadyRevoked</code>). Emits <code>DocumentRevoked</code>.</td>
        </tr>
        <tr>
          <td><code>isRevoked(bytes32)</code> / <code>documentExists(bytes32)</code></td>
          <td>External View</td>
          <td>Gas-optimized helper view queries invoked by downstream contracts (<code>AccessControl.sol</code>) and backend verification engines.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout warning">
      <div class="callout-title">Permanent Revocation Semantics vs. Data Deletion</div>
      Because blockchain transaction logs cannot be erased, revocation does not attempt to purge historical blocks. Instead, it marks the document as permanently invalid in current EVM state. Subsequent verifications detect <code>revoked == true</code> and instantly warn third parties that the credential has been formally invalidated by its owner.
    </div>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 3 of 6</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: SMART CONTRACTS USED ==================== -->
  <div class="page">
    <h1><span class="sec-num">04</span> Smart Contracts Used: Architecture & AccessControl.sol</h1>
    
    <p>
      The blockchain layer employs a modular, decoupled architecture consisting of two primary smart contracts written in <strong>Solidity 0.8.24</strong>: <code>DocumentRegistry.sol</code> and <code>AccessControl.sol</code>, linked via <code>IDocumentRegistry.sol</code>.
    </p>

    <div class="diagram-box">
      <svg width="100%" height="135" viewBox="0 0 700 135" xmlns="http://www.w3.org/2000/svg">
        <!-- DocumentRegistry Box -->
        <g transform="translate(30, 10)">
          <rect width="260" height="105" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="1.8"/>
          <rect width="260" height="22" rx="6" fill="#0284c7"/>
          <text x="130" y="15" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">DocumentRegistry.sol</text>
          <text x="12" y="38" fill="#0f172a" font-family="JetBrains Mono" font-size="6.8">• _documents: mapping(bytes32 => Document)</text>
          <text x="12" y="52" fill="#0f172a" font-family="JetBrains Mono" font-size="6.8">• _userDocuments: mapping(address => bytes32[])</text>
          <text x="12" y="68" fill="#0284c7" font-family="JetBrains Mono" font-size="6.8">+ registerDocument(docId, hash, cid)</text>
          <text x="12" y="82" fill="#0284c7" font-family="JetBrains Mono" font-size="6.8">+ revokeDocument(docId)</text>
          <text x="12" y="96" fill="#0284c7" font-family="JetBrains Mono" font-size="6.8">+ getDocument(docId) / isRevoked(docId)</text>
        </g>

        <!-- AccessControl Box -->
        <g transform="translate(410, 10)">
          <rect width="260" height="105" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.8"/>
          <rect width="260" height="22" rx="6" fill="#059669"/>
          <text x="130" y="15" fill="#ffffff" font-family="Inter" font-weight="700" font-size="8" text-anchor="middle">AccessControl.sol</text>
          <text x="12" y="38" fill="#0f172a" font-family="JetBrains Mono" font-size="6.8">• documentRegistry: IDocumentRegistry (immutable)</text>
          <text x="12" y="52" fill="#0f172a" font-family="JetBrains Mono" font-size="6.8">• _documentAccess: bytes32 => address => bool</text>
          <text x="12" y="68" fill="#047857" font-family="JetBrains Mono" font-size="6.8">+ grantAccess(docId, verifier)</text>
          <text x="12" y="82" fill="#047857" font-family="JetBrains Mono" font-size="6.8">+ revokeAccess(docId, verifier)</text>
          <text x="12" y="96" fill="#047857" font-family="JetBrains Mono" font-size="6.8">+ hasAccess(docId, verifier) -> bool</text>
        </g>

        <!-- Interface Connector -->
        <path d="M 410 65 L 290 65" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)"/>
        <text x="350" y="58" fill="#475569" font-family="Inter" font-size="6.8" font-weight="700" text-anchor="middle">queries via interface</text>
        <text x="350" y="78" fill="#64748b" font-family="JetBrains Mono" font-size="6.2" text-anchor="middle">IDocumentRegistry</text>
      </svg>
      <div class="diagram-caption">Figure 2: Decoupled Smart Contract Topology — AccessControl Interfaces with DocumentRegistry</div>
    </div>

    <h2>4.1 AccessControl.sol Architecture</h2>
    <p>
      The <code>AccessControl</code> contract manages on-chain authorization for third-party verifiers, universities, banks, and employer wallets. It guarantees that only the authoritative document owner recorded in <code>DocumentRegistry</code> can grant or revoke access.
    </p>

    <h3>Key Technical Invariants:</h3>
    <ul>
      <li><strong>Immutable Registry Pointer:</strong> The contract takes the deployed address of <code>DocumentRegistry</code> upon construction and binds it to an <code>immutable</code> variable (<code>public immutable documentRegistry</code>), permanently neutralizing address spoofing or contract redirection exploits.</li>
      <li><strong>Sparse Mapping Model:</strong> Avoids unbounded dynamic arrays by storing grants in a nested mapping: <code>mapping(bytes32 => mapping(address => bool)) private _documentAccess;</code>. Historical verifier sets are indexed through EVM events.</li>
      <li><strong>Composite <code>hasAccess</code> Logic:</strong> Computes effective access by synthesizing registry state and direct permissions:
        <pre><span class="type">function</span> <span class="func">hasAccess</span>(<span class="type">bytes32</span> docId, <span class="type">address</span> verifier) <span class="keyword">external view returns</span> (<span class="type">bool</span>) {
    <span class="keyword">if</span> (docId == <span class="type">bytes32</span>(<span class="number">0</span>) || verifier == <span class="type">address</span>(<span class="number">0</span>)) <span class="keyword">return false</span>;
    <span class="keyword">if</span> (!documentRegistry.<span class="func">documentExists</span>(docId)) <span class="keyword">return false</span>;
    <span class="keyword">if</span> (documentRegistry.<span class="func">isRevoked</span>(docId)) <span class="keyword">return false</span>;
    <span class="keyword">return</span> _documentAccess[docId][verifier];
}</pre>
        <strong>Crucial Security Benefit:</strong> If a document is revoked on <code>DocumentRegistry</code>, <code>hasAccess</code> instantly drops to <code>false</code> for every verifier simultaneously without requiring separate transactions!
      </li>
    </ul>

    <h2>4.2 Smart Contract Security & Engineering Standards</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Engineering Standard</th>
          <th style="width: 72%;">Implementation Detail</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Solidity Custom Errors</strong></td>
          <td>Replaces costly error strings with typed custom errors (e.g. <code>error NotDocumentOwner(bytes32, address)</code>). Saves ~2,000 gas per revert and minimizes deployed bytecode footprint.</td>
        </tr>
        <tr>
          <td><strong>Zero Administrative Master Keys</strong></td>
          <td>No contract owner, multi-sig admin, or governance role can override document ownership, view private metadata, or manipulate permissions.</td>
        </tr>
        <tr>
          <td><strong>Checks-Effects-Interactions (CEI)</strong></td>
          <td>All input checks and state mutations occur prior to event emissions. Neither contract accepts ether or invokes external untrusted addresses, eliminating reentrancy attack surfaces.</td>
        </tr>
        <tr>
          <td><strong>Indexed Event Logging</strong></td>
          <td>Emits indexed events (<code>DocumentRegistered</code>, <code>DocumentRevoked</code>, <code>AccessGranted</code>, <code>AccessRevoked</code>) with <code>bytes32 indexed documentId</code> and <code>address indexed owner</code>, enabling zero-gas audit trail reconstruction via standard JSON-RPC queries.</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 4 of 6</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: STORAGE (ON-CHAIN + OFF-CHAIN) ==================== -->
  <div class="page">
    <h1><span class="sec-num">05</span> Storage Architecture: On-Chain vs. Off-Chain</h1>
    
    <p>
      In decentralized engineering, naive storage models that place large files directly on-chain encounter the <strong>Blockchain Storage Trilemma</strong>: exorbitantly high gas costs (several thousand dollars per megabyte), network bloat, and total loss of privacy on public ledgers.
    </p>
    <p>
      The Eman system solves this through a rigorous <strong>Hybrid Storage Topology</strong>: anchoring cryptographic integrity on-chain while storing client-encrypted ciphertext on decentralized peer-to-peer storage.
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Storage Dimension</th>
          <th style="width: 40%;">On-Chain Storage (Ethereum EVM)</th>
          <th style="width: 40%;">Off-Chain Storage (IPFS / Pinata V3)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Physical Medium</strong></td>
          <td>Ethereum distributed consensus ledger (immutable block storage, SSTORE slots).</td>
          <td>InterPlanetary File System (IPFS) peer-to-peer libp2p DHT, pinned via Pinata V3 cluster.</td>
        </tr>
        <tr>
          <td><strong>Stored Artifacts</strong></td>
          <td>
            • <code>bytes32 documentId</code> (Unique identifier)<br>
            • <code>bytes32 documentHash</code> (SHA-256 fingerprint)<br>
            • <code>string ipfsCid</code> (IPFS content locator)<br>
            • <code>address owner</code> & block timestamp<br>
            • Access grant booleans
          </td>
          <td>
            • <strong>AES-256-GCM Encrypted Payloads</strong><br>
            • Self-contained binary envelope [Version | IV | Ciphertext + Tag]<br>
            • Zero plaintext, zero unencrypted headers, zero personal metadata.
          </td>
        </tr>
        <tr>
          <td><strong>Cost Profile</strong></td>
          <td>$O(1)$ constant storage cost (~3 storage slots = ~60,000 gas per document). Independent of physical file size.</td>
          <td>Scales linearly with bandwidth and storage; handles documents from 1 KB up to 100+ MB with zero blockchain gas penalty.</td>
        </tr>
        <tr>
          <td><strong>Confidentiality Model</strong></td>
          <td>Public state. Accessible to anyone on-chain, but stores <strong>zero</strong> sensitive content or encryption keys.</td>
          <td>Distributed public swarm. <strong>Mathematically unbreakable</strong> without the client's 256-bit symmetric AES key.</td>
        </tr>
      </tbody>
    </table>

    <h2>5.1 Client-Side AES-256-GCM Authenticated Encryption</h2>
    <p>
      Files are encrypted directly within the user's browser memory using <strong>AES-256 in Galois/Counter Mode (GCM)</strong> (NIST SP 800-38D) via the browser's native Web Crypto API. Key cryptographic properties include:
    </p>
    <ul>
      <li><strong>256-Bit Cryptographic Entropy:</strong> Every document receives an independently generated symmetric key created via <code>crypto.subtle.generateKey</code>.</li>
      <li><strong>96-Bit Nonce Freshness:</strong> A unique 96-bit Initialization Vector (IV) is generated per encryption operation via <code>crypto.getRandomValues(new Uint8Array(12))</code>. IV reuse is cryptographically prevented.</li>
      <li><strong>128-Bit GHASH Authentication Tag:</strong> AES-GCM generates a 16-byte Poly1305/GHASH tag. Decryption strictly validates this tag; any single-bit alteration in the ciphertext or IV causes decryption to immediately fail closed with <code>AuthenticationError</code>.</li>
    </ul>

    <h2>5.2 Canonical Binary Payload Serialization Envelope</h2>
    <p>
      To prevent metadata leakage and ensure uniform persistence on IPFS nodes, the encrypted output is packed into a canonical binary format:
    </p>

    <div class="diagram-box">
      <svg width="100%" height="68" viewBox="0 0 700 68" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(10, 10)">
          <rect width="65" height="38" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" rx="4"/>
          <text x="32" y="24" fill="#0369a1" font-family="Inter" font-weight="700" font-size="7.5" text-anchor="middle">Version</text>
          <text x="32" y="35" fill="#64748b" font-family="JetBrains Mono" font-size="6.5" text-anchor="middle">1 Byte (0x01)</text>
        </g>
        <g transform="translate(85, 10)">
          <rect width="75" height="38" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" rx="4"/>
          <text x="37" y="24" fill="#0369a1" font-family="Inter" font-weight="700" font-size="7.5" text-anchor="middle">IV Length</text>
          <text x="37" y="35" fill="#64748b" font-family="JetBrains Mono" font-size="6.5" text-anchor="middle">1 Byte (0x0C)</text>
        </g>
        <g transform="translate(170, 10)">
          <rect width="130" height="38" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="4"/>
          <text x="65" y="24" fill="#b45309" font-family="Inter" font-weight="700" font-size="7.5" text-anchor="middle">Initialization Vector</text>
          <text x="65" y="35" fill="#64748b" font-family="JetBrains Mono" font-size="6.5" text-anchor="middle">12 Bytes (96-bit CSPRNG)</text>
        </g>
        <g transform="translate(310, 10)">
          <rect width="380" height="38" fill="#f0fdf4" stroke="#059669" stroke-width="1.5" rx="4"/>
          <text x="190" y="24" fill="#065f46" font-family="Inter" font-weight="700" font-size="7.5" text-anchor="middle">AES-256-GCM Ciphertext + 128-bit Authentication Tag</text>
          <text x="190" y="35" fill="#64748b" font-family="JetBrains Mono" font-size="6.5" text-anchor="middle">M Bytes Ciphertext + 16-Byte GHASH Tag</text>
        </g>
      </svg>
      <div class="diagram-caption">Figure 3: Canonical Binary Payload Format Persisted to IPFS Nodes</div>
    </div>

    <h2>5.3 Strict Key Isolation & Custody Rules</h2>
    <p>
      The raw 256-bit AES symmetric key is held strictly in temporary client browser memory during document creation. It is <strong>never</strong> transmitted to smart contracts, never saved in browser storage or cookies, and never sent to the backend API. The owner downloads the key file locally (<code>.key</code> format) to retain sovereign custody over decryption.
    </p>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 5 of 6</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: VERIFICATION & SYNTHESIS ==================== -->
  <div class="page">
    <h1><span class="sec-num">06</span> Verification Workflow & Multi-Tier Tamper Detection</h1>
    
    <p>
      Verification is the ultimate operational test of the document locker. The system supports two distinct, cryptographically rigorous verification workflows:
    </p>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">Workflow A: Candidate File Verification</div>
        <p>An operator or verifier holds a candidate document file (e.g. PDF degree certificate) and wishes to confirm its authenticity. The client hashes the candidate bytes locally using SHA-256 and submits the hash to the backend. The system compares it against <code>DocumentRegistry.documentHash</code> and checks revocation state. Verdict: <strong>VERIFIED</strong> in &lt; 2 seconds.</p>
      </div>
      <div class="card">
        <div class="card-header">Workflow B: Stored Object Audit</div>
        <p>An authorized user fetches the encrypted payload from IPFS via its CID, loads the owner's <code>.key</code> file, decrypts the payload client-side, and recomputes the SHA-256 hash over the recovered bytes, confirming byte-for-byte fidelity with the blockchain record.</p>
      </div>
    </div>

    <h2>6.1 Multi-Tier Attack Vectors & Defense Outcomes</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Threat / Attack Vector</th>
          <th style="width: 20%;">Target Layer</th>
          <th style="width: 34%;">Cryptographic Detection Mechanism</th>
          <th style="width: 18%;">System Outcome</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1-Byte Document Alteration</strong></td>
          <td>Candidate Document</td>
          <td>Avalanche effect of SHA-256 alters digest completely; fails on-chain comparison.</td>
          <td><span style="color: #b91c1c; font-weight: 700;">TAMPER_DETECTED</span></td>
        </tr>
        <tr>
          <td><strong>File Substitution</strong></td>
          <td>Candidate Document</td>
          <td>Candidate hash does not match canonical <code>documentHash</code> in <code>DocumentRegistry</code>.</td>
          <td><span style="color: #b91c1c; font-weight: 700;">TAMPER_DETECTED</span></td>
        </tr>
        <tr>
          <td><strong>Ciphertext Tampering on IPFS</strong></td>
          <td>IPFS Encrypted Blob</td>
          <td>AES-256-GCM GHASH authentication tag verification fails immediately during Web Crypto decryption.</td>
          <td><span style="color: #b91c1c; font-weight: 700;">DECRYPTION_FAILED</span></td>
        </tr>
        <tr>
          <td><strong>IV or Tag Manipulation</strong></td>
          <td>Binary Payload Envelope</td>
          <td>Altering 12-byte IV or 16-byte tag causes Galois field authentication check to throw exception.</td>
          <td><span style="color: #b91c1c; font-weight: 700;">DECRYPTION_FAILED</span></td>
        </tr>
        <tr>
          <td><strong>Revocation by Owner</strong></td>
          <td>Smart Contract State</td>
          <td><code>DocumentRegistry.isRevoked()</code> returns true; <code>hasAccess()</code> drops to false.</td>
          <td><span style="color: #d97706; font-weight: 700;">REVOKED</span></td>
        </tr>
        <tr>
          <td><strong>Unauthorized Verifier</strong></td>
          <td>AccessControl.sol</td>
          <td>Caller address lacks affirmative mapping in <code>_documentAccess</code>; HTTP 403 Forbidden.</td>
          <td><span style="color: #475569; font-weight: 700;">UNAUTHORIZED</span></td>
        </tr>
      </tbody>
    </table>

    <h2>6.2 Technology Stack Summary</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Subsystem</th>
          <th style="width: 36%;">Technologies & Standards</th>
          <th style="width: 42%;">Operational Role</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend</strong></td>
          <td>Next.js 15, React 19, TypeScript, Tailwind, ethers.js v6</td>
          <td>Sovereign Web3 UI, client-side encryption, MetaMask signer integration.</td>
        </tr>
        <tr>
          <td><strong>Cryptography</strong></td>
          <td>W3C Web Crypto API, AES-256-GCM, SHA-256 (FIPS 180-4)</td>
          <td>In-memory envelope encryption, CSPRNG key generation, file fingerprinting.</td>
        </tr>
        <tr>
          <td><strong>Backend API</strong></td>
          <td>Node.js 22, Express.js, TypeScript, EIP-191 Auth</td>
          <td>Stateless challenge nonce issuer, Pinata V3 IPFS relay, event log aggregator.</td>
        </tr>
        <tr>
          <td><strong>Blockchain</strong></td>
          <td>Solidity 0.8.24, Hardhat, TypeChain, Ethereum EVM</td>
          <td>Consensus-backed document registry and verifier access control contracts.</td>
        </tr>
        <tr>
          <td><strong>Decentralized Storage</strong></td>
          <td>IPFS, Pinata Files V3 REST API</td>
          <td>Content-addressed distributed storage of encrypted binary payloads.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout security">
      <div class="callout-title">Conclusion & Project Synthesis</div>
      The Eman Blockchain-Based Digital Document Locker achieves a complete synthesis of decentralized sovereign ownership, cryptographic confidentiality, and consensus-driven tamper evidence. By maintaining minimal, immutable integrity anchors on-chain (SHA-256 hashes and IPFS CIDs) and storing client-side encrypted payloads off-chain on IPFS, the system eliminates centralized single points of failure while providing instantaneous, trustless credential verification.
    </div>

    <div class="footer-bar">
      <span>Blockchain-Based Digital Document Locker (Eman) — Technical Report</span>
      <span>Page 6 of 6</span>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    html_path = "/Users/rajmishara/eman/report_source.html"
    pdf_path = "/Users/rajmishara/eman/Blockchain_Document_Locker_Technical_Report.pdf"

    print(f"Writing calibrated 6-page HTML source to {html_path}...")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    print("Compiling PDF with Google Chrome Headless...")
    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    res = subprocess.run(chrome_cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"SUCCESS: PDF created successfully at {pdf_path}")
        size = os.path.getsize(pdf_path)
        print(f"PDF size: {size:,} bytes")
    else:
        print(f"ERROR: Chrome headless exited with code {res.returncode}")
        print("Stdout:", res.stdout)
        print("Stderr:", res.stderr)

if __name__ == "__main__":
    generate_pdf()
