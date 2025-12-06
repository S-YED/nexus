// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFTSOv2
 * @notice Interface for Flare Time Series Oracle v2 (2025 Specification)
 * @dev Used to query real-time price feeds on Flare Network
 * @dev Updated to match latest FTSOv2 implementation as of January 2025
 * @dev Reference: https://dev.flare.network/ftso/getting-started/
 */
interface IFTSOv2 {
    /**
     * @notice Get price feed data by feed ID
     * @dev This function is payable in production (currently fee = 0)
     * @dev For testing, TestFtsoV2Interface can be used with view methods
     * @dev Feed IDs are 21 bytes encoding category + feed name
     * @param feedId The unique identifier for the price feed (e.g., FLR/USD: 0x01464c522f55534400000000000000000000000000)
     * @return value The feed value (e.g., 2500 for $0.02500 with 5 decimals)
     * @return decimals Number of decimal places (can be negative, typically 5 for FTSO)
     * @return timestamp Unix timestamp of the price update (uint64)
     */
    function getFeedById(bytes21 feedId) external payable returns (
        uint256 value,
        int8 decimals,
        uint64 timestamp
    );

    /**
     * @notice Get multiple price feeds by their IDs
     * @dev Batch version of getFeedById for gas efficiency
     * @param feedIds Array of feed identifiers
     * @return values Array of feed values
     * @return decimals Array of decimal places
     * @return timestamp Single timestamp for all feeds (same block)
     */
    function getFeedsById(bytes21[] calldata feedIds) external payable returns (
        uint256[] memory values,
        int8[] memory decimals,
        uint64 timestamp
    );
}
