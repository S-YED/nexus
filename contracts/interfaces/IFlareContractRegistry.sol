// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlareContractRegistry
 * @notice Interface for Flare Contract Registry
 * @dev Used to dynamically retrieve contract addresses on Flare Network
 * @dev Registry Address: 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019 (same on all networks)
 * @dev Reference: https://dev.flare.network/ftso/getting-started/
 */
interface IFlareContractRegistry {
    /**
     * @notice Get contract address by name
     * @param _name The name of the contract (e.g., "FtsoV2")
     * @return The address of the requested contract
     */
    function getContractAddressByName(string calldata _name) external view returns (address);

    /**
     * @notice Get contract address by hash
     * @param _nameHash The keccak256 hash of the contract name
     * @return The address of the requested contract
     */
    function getContractAddressByHash(bytes32 _nameHash) external view returns (address);

    /**
     * @notice Get all registered contract names and addresses
     * @return names Array of contract names
     * @return addresses Array of contract addresses
     */
    function getAllContracts() external view returns (
        string[] memory names,
        address[] memory addresses
    );
}
