// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./interfaces/IDocumentRegistry.sol";

/**
 * @title AccessControl
 * @notice Smart contract managing on-chain document verification authorization.
 * @dev Coordinates with DocumentRegistry to enforce owner-controlled permissions
 *      and guarantee that revoked documents are never treated as accessible.
 */
contract AccessControl {
    // --- State Variables ---

    /// @notice Authoritative DocumentRegistry instance
    IDocumentRegistry public immutable documentRegistry;

    /// @dev Maps documentId => verifierAddress => accessGranted (bool)
    mapping(bytes32 => mapping(address => bool)) private _documentAccess;

    // --- Custom Errors ---

    error InvalidRegistryAddress();
    error InvalidDocumentId();
    error InvalidVerifierAddress();
    error DocumentNotFound(bytes32 documentId);
    error NotDocumentOwner(bytes32 documentId, address caller);
    error DocumentIsRevoked(bytes32 documentId);
    error AccessAlreadyGranted(bytes32 documentId, address verifier);
    error AccessNotGranted(bytes32 documentId, address verifier);

    // --- Events ---

    event AccessGranted(
        bytes32 indexed documentId,
        address indexed owner,
        address indexed verifier,
        uint256 timestamp
    );

    event AccessRevoked(
        bytes32 indexed documentId,
        address indexed owner,
        address indexed verifier,
        uint256 timestamp
    );

    // --- Constructor ---

    /**
     * @notice Initializes the AccessControl contract with the authoritative DocumentRegistry address.
     * @param registryAddress The address of the deployed DocumentRegistry contract.
     */
    constructor(address registryAddress) {
        if (registryAddress == address(0)) {
            revert InvalidRegistryAddress();
        }
        documentRegistry = IDocumentRegistry(registryAddress);
    }

    // --- External Functions ---

    /**
     * @notice Grants access to a specific verifier wallet for a document.
     * @dev Restricted to the authoritative owner registered in DocumentRegistry.
     *      Reverts if document does not exist, is revoked, or access was already granted.
     * @param documentId Unique 32-byte document identifier.
     * @param verifier The wallet address of the verifier to authorize.
     */
    function grantAccess(bytes32 documentId, address verifier) external {
        if (documentId == bytes32(0)) revert InvalidDocumentId();
        if (verifier == address(0)) revert InvalidVerifierAddress();

        if (!documentRegistry.documentExists(documentId)) {
            revert DocumentNotFound(documentId);
        }

        IDocumentRegistry.Document memory doc = documentRegistry.getDocument(documentId);

        if (msg.sender != doc.owner) {
            revert NotDocumentOwner(documentId, msg.sender);
        }
        if (doc.revoked) {
            revert DocumentIsRevoked(documentId);
        }
        if (_documentAccess[documentId][verifier]) {
            revert AccessAlreadyGranted(documentId, verifier);
        }

        _documentAccess[documentId][verifier] = true;

        emit AccessGranted(documentId, doc.owner, verifier, block.timestamp);
    }

    /**
     * @notice Revokes access from a specific verifier wallet for a document.
     * @dev Restricted to the authoritative owner registered in DocumentRegistry.
     *      Reverts if document does not exist, caller is not owner, or access was not granted.
     * @param documentId Unique 32-byte document identifier.
     * @param verifier The wallet address of the verifier to de-authorize.
     */
    function revokeAccess(bytes32 documentId, address verifier) external {
        if (documentId == bytes32(0)) revert InvalidDocumentId();
        if (verifier == address(0)) revert InvalidVerifierAddress();

        if (!documentRegistry.documentExists(documentId)) {
            revert DocumentNotFound(documentId);
        }

        IDocumentRegistry.Document memory doc = documentRegistry.getDocument(documentId);

        if (msg.sender != doc.owner) {
            revert NotDocumentOwner(documentId, msg.sender);
        }
        if (!_documentAccess[documentId][verifier]) {
            revert AccessNotGranted(documentId, verifier);
        }

        _documentAccess[documentId][verifier] = false;

        emit AccessRevoked(documentId, doc.owner, verifier, block.timestamp);
    }

    /**
     * @notice Determines whether a verifier currently has active, valid access to a document.
     * @dev Combines on-chain permission with DocumentRegistry existence and non-revocation state.
     *      Returns false if document does not exist, document is revoked, or verifier lacks permission.
     * @param documentId Unique 32-byte document identifier.
     * @param verifier The wallet address of the verifier.
     * @return Boolean true if access is actively valid, false otherwise.
     */
    function hasAccess(bytes32 documentId, address verifier) external view returns (bool) {
        if (documentId == bytes32(0) || verifier == address(0)) {
            return false;
        }

        if (!documentRegistry.documentExists(documentId)) {
            return false;
        }

        if (documentRegistry.isRevoked(documentId)) {
            return false;
        }

        return _documentAccess[documentId][verifier];
    }

    /**
     * @notice Checks the direct access mapping state without checking document revocation.
     * @dev For transparency and auditability: reveals whether permission entry was granted.
     * @param documentId Unique 32-byte document identifier.
     * @param verifier The wallet address of the verifier.
     * @return Boolean true if explicitly granted in storage, false otherwise.
     */
    function isDirectAccessGranted(bytes32 documentId, address verifier) external view returns (bool) {
        return _documentAccess[documentId][verifier];
    }

    /**
     * @notice Returns the address of the linked DocumentRegistry contract.
     * @return Address of the DocumentRegistry.
     */
    function getDocumentRegistry() external view returns (address) {
        return address(documentRegistry);
    }
}
