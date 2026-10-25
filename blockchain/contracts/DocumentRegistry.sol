// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title DocumentRegistry
 * @notice Authoritative on-chain registry for sovereign digital documents.
 * @dev Maintains immutable records of document ownership, SHA-256 integrity digests,
 *      and IPFS Content Identifiers (CIDs) with owner-controlled revocation semantics.
 */
contract DocumentRegistry {
    // --- Data Structures ---

    struct Document {
        bytes32 documentId;
        address owner;
        bytes32 documentHash; // SHA-256 digest of original document
        string ipfsCid;       // IPFS Content Identifier
        uint256 registeredAt; // Block timestamp of registration
        bool revoked;         // Revocation state flag
    }

    // --- Custom Errors ---

    error InvalidDocumentId();
    error InvalidDocumentHash();
    error InvalidIpfsCid();
    error DocumentAlreadyExists(bytes32 documentId);
    error DocumentNotFound(bytes32 documentId);
    error NotDocumentOwner(bytes32 documentId, address caller);
    error DocumentAlreadyRevoked(bytes32 documentId);

    // --- Events ---

    event DocumentRegistered(
        bytes32 indexed documentId,
        address indexed owner,
        bytes32 documentHash,
        string ipfsCid,
        uint256 timestamp
    );

    event DocumentRevoked(
        bytes32 indexed documentId,
        address indexed owner,
        uint256 timestamp
    );

    // --- Storage ---

    /// @dev Maps unique 32-byte document ID to Document struct
    mapping(bytes32 => Document) private _documents;

    /// @dev Maps user wallet address to array of registered document IDs
    mapping(address => bytes32[]) private _userDocuments;

    // --- External Functions ---

    /**
     * @notice Registers a new document on-chain with ownership assigned to msg.sender.
     * @param documentId Opaque 32-byte unique document identifier.
     * @param documentHash 32-byte SHA-256 cryptographic digest of the document.
     * @param ipfsCid Content Identifier string of the encrypted payload on IPFS.
     */
    function registerDocument(
        bytes32 documentId,
        bytes32 documentHash,
        string calldata ipfsCid
    ) external {
        if (documentId == bytes32(0)) revert InvalidDocumentId();
        if (documentHash == bytes32(0)) revert InvalidDocumentHash();
        if (bytes(ipfsCid).length == 0) revert InvalidIpfsCid();

        if (_documents[documentId].owner != address(0)) {
            revert DocumentAlreadyExists(documentId);
        }

        _documents[documentId] = Document({
            documentId: documentId,
            owner: msg.sender,
            documentHash: documentHash,
            ipfsCid: ipfsCid,
            registeredAt: block.timestamp,
            revoked: false
        });

        _userDocuments[msg.sender].push(documentId);

        emit DocumentRegistered(
            documentId,
            msg.sender,
            documentHash,
            ipfsCid,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves the authoritative on-chain record for a registered document.
     * @param documentId Unique 32-byte document identifier.
     * @return Document struct containing owner, hash, CID, timestamp, and revocation flag.
     */
    function getDocument(bytes32 documentId) external view returns (Document memory) {
        Document memory doc = _documents[documentId];
        if (doc.owner == address(0)) {
            revert DocumentNotFound(documentId);
        }
        return doc;
    }

    /**
     * @notice Retrieves all document IDs registered by a specific wallet address.
     * @param user The address to query.
     * @return Array of 32-byte document IDs.
     */
    function getUserDocuments(address user) external view returns (bytes32[] memory) {
        return _userDocuments[user];
    }

    /**
     * @notice Revokes a previously registered document. Restricted exclusively to document owner.
     * @dev Sets revoked = true without deleting historical registration data.
     * @param documentId Unique 32-byte document identifier.
     */
    function revokeDocument(bytes32 documentId) external {
        Document storage doc = _documents[documentId];
        if (doc.owner == address(0)) {
            revert DocumentNotFound(documentId);
        }
        if (msg.sender != doc.owner) {
            revert NotDocumentOwner(documentId, msg.sender);
        }
        if (doc.revoked) {
            revert DocumentAlreadyRevoked(documentId);
        }

        doc.revoked = true;

        emit DocumentRevoked(documentId, msg.sender, block.timestamp);
    }

    /**
     * @notice Checks whether a document has been revoked.
     * @param documentId Unique 32-byte document identifier.
     * @return Boolean true if revoked, false otherwise.
     */
    function isRevoked(bytes32 documentId) external view returns (bool) {
        Document memory doc = _documents[documentId];
        if (doc.owner == address(0)) {
            revert DocumentNotFound(documentId);
        }
        return doc.revoked;
    }

    /**
     * @notice Checks whether a document exists in the registry.
     * @param documentId Unique 32-byte document identifier.
     * @return Boolean true if document exists, false otherwise.
     */
    function documentExists(bytes32 documentId) external view returns (bool) {
        return _documents[documentId].owner != address(0);
    }
}
