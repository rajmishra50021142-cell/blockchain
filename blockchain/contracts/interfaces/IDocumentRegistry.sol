// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IDocumentRegistry
 * @notice Interface exposing the DocumentRegistry contract surface required by AccessControl.
 * @dev Allows querying document existence, ownership, and revocation state without tight coupling.
 */
interface IDocumentRegistry {
    struct Document {
        bytes32 documentId;
        address owner;
        bytes32 documentHash;
        string ipfsCid;
        uint256 registeredAt;
        bool revoked;
    }

    function getDocument(bytes32 documentId) external view returns (Document memory);
    function getUserDocuments(address user) external view returns (bytes32[] memory);
    function isRevoked(bytes32 documentId) external view returns (bool);
    function documentExists(bytes32 documentId) external view returns (bool);
}
