// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFTSOv2.sol";
import "./interfaces/IFlareContractRegistry.sol";

/**
 * @title FTSOPriceReader
 * @notice Contract to read and process price feeds from Flare Time Series Oracle v2
 * @dev Demonstrates FTSO v2 integration for NexusBank Nexus Circle MVP
 * @dev Uses FlareContractRegistry for dynamic FTSO address resolution
 * @author NexusBank Team
 */
contract FTSOPriceReader {
    // ============ Constants ============

    /// @notice Flare Contract Registry address (same on all networks)
    address public constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    /// @notice FLR/USD Feed ID (21 bytes)
    bytes21 public constant FLR_USD_FEED_ID = 0x01464c522f55534400000000000000000000000000;

    /// @notice BTC/USD Feed ID (21 bytes) - for future use
    bytes21 public constant BTC_USD_FEED_ID = 0x014254432f55534400000000000000000000000000;

    /// @notice XRP/USD Feed ID (21 bytes) - for future use
    bytes21 public constant XRP_USD_FEED_ID = 0x015852502f55534400000000000000000000000000;

    /// @notice ETH/USD Feed ID (21 bytes) - for future use
    bytes21 public constant ETH_USD_FEED_ID = 0x014554482f55534400000000000000000000000000;

    // ============ State Variables ============

    /// @notice Contract owner
    address public owner;

    /// @notice Deployment timestamp
    uint256 public deploymentTimestamp;

    /// @notice FTSO v2 contract address (dynamically retrieved)
    address public ftsoV2Address;

    // ============ Events ============

    event PriceQueried(
        bytes21 indexed feedId,
        uint256 value,
        int8 decimals,
        uint64 timestamp,
        address indexed queriedBy
    );

    event FtsoAddressUpdated(address indexed oldAddress, address indexed newAddress);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "FTSOPriceReader: caller is not the owner");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the contract and retrieve FTSO v2 address from registry
     */
    constructor() {
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;

        // Dynamically retrieve FTSO v2 address from registry
        _updateFtsoAddress();
    }

    // ============ External Functions ============

    /**
     * @notice Get current FLR/USD price from FTSO
     * @return priceValue The price value (with decimals factored in)
     * @return decimals Number of decimal places (typically 5)
     * @return timestamp When the price was last updated
     * @dev Example: value=2500, decimals=5 means price = 0.02500 USD
     */
    function getFlrUsdPrice() external returns (
        uint256 priceValue,
        int8 decimals,
        uint64 timestamp
    ) {
        require(ftsoV2Address != address(0), "FTSOPriceReader: FTSO address not set");

        IFTSOv2 ftso = IFTSOv2(ftsoV2Address);

        // Query the FTSO for FLR/USD price
        (priceValue, decimals, timestamp) = ftso.getFeedById(FLR_USD_FEED_ID);

        emit PriceQueried(FLR_USD_FEED_ID, priceValue, decimals, timestamp, msg.sender);

        return (priceValue, decimals, timestamp);
    }

    /**
     * @notice Get current FLR/USD price as a formatted USD value
     * @return usdPrice The price in USD with 18 decimal places for precision
     * @return timestamp When the price was last updated
     * @dev Converts FTSO price format to standard USD format
     * @dev Example: FTSO returns 2500 with decimals=5 → returns 25000000000000000 (0.025 USD in wei)
     */
    function getFlrUsdPriceFormatted() external returns (uint256 usdPrice, uint64 timestamp) {
        require(ftsoV2Address != address(0), "FTSOPriceReader: FTSO address not set");

        IFTSOv2 ftso = IFTSOv2(ftsoV2Address);
        (uint256 value, int8 decimals, uint64 ts) = ftso.getFeedById(FLR_USD_FEED_ID);

        // Convert to 18 decimal format (standard for Ethereum/Flare)
        // If decimals is 5, divide by 10^5 then multiply by 10^18
        if (decimals >= 0) {
            uint8 posDecimals = uint8(decimals);
            if (posDecimals < 18) {
                usdPrice = value * (10 ** (18 - posDecimals));
            } else {
                usdPrice = value / (10 ** (posDecimals - 18));
            }
        } else {
            // Handle negative decimals (multiply by 10^abs(decimals))
            uint8 absDecimals = uint8(-decimals);
            usdPrice = value * (10 ** (18 + absDecimals));
        }

        emit PriceQueried(FLR_USD_FEED_ID, value, decimals, ts, msg.sender);

        return (usdPrice, ts);
    }

    /**
     * @notice Convert FLR amount to USD value
     * @param flrAmount Amount of FLR tokens (in wei, 18 decimals)
     * @return usdValue Equivalent USD value (in wei, 18 decimals)
     * @dev Example: 100 FLR at $0.025 = $2.50 USD
     */
    function convertFlrToUsd(uint256 flrAmount) external returns (uint256 usdValue) {
        require(ftsoV2Address != address(0), "FTSOPriceReader: FTSO address not set");

        IFTSOv2 ftso = IFTSOv2(ftsoV2Address);
        (uint256 priceValue, int8 decimals, ) = ftso.getFeedById(FLR_USD_FEED_ID);

        // flrAmount is in wei (18 decimals)
        // priceValue is from FTSO (typically 5 decimals)
        // Result should be in wei (18 decimals)

        if (decimals >= 0) {
            uint8 posDecimals = uint8(decimals);
            usdValue = (flrAmount * priceValue) / (10 ** posDecimals);
        } else {
            uint8 absDecimals = uint8(-decimals);
            usdValue = (flrAmount * priceValue) * (10 ** absDecimals);
        }

        return usdValue;
    }

    /**
     * @notice Get price for any feed by ID
     * @param feedId The feed identifier (21 bytes)
     * @return value The price value
     * @return decimals Number of decimal places
     * @return timestamp When the price was last updated
     * @dev Generic function to query any FTSO feed
     */
    function getPriceByFeedId(bytes21 feedId) external returns (
        uint256 value,
        int8 decimals,
        uint64 timestamp
    ) {
        require(ftsoV2Address != address(0), "FTSOPriceReader: FTSO address not set");

        IFTSOv2 ftso = IFTSOv2(ftsoV2Address);
        (value, decimals, timestamp) = ftso.getFeedById(feedId);

        emit PriceQueried(feedId, value, decimals, timestamp, msg.sender);

        return (value, decimals, timestamp);
    }

    /**
     * @notice Get multiple prices in a single call (gas efficient)
     * @param feedIds Array of feed identifiers
     * @return values Array of price values
     * @return decimals Array of decimal places
     * @return timestamp Single timestamp for all feeds
     * @dev Batch query for multiple feeds
     */
    function getPricesByFeedIds(bytes21[] calldata feedIds) external returns (
        uint256[] memory values,
        int8[] memory decimals,
        uint64 timestamp
    ) {
        require(ftsoV2Address != address(0), "FTSOPriceReader: FTSO address not set");

        IFTSOv2 ftso = IFTSOv2(ftsoV2Address);
        (values, decimals, timestamp) = ftso.getFeedsById(feedIds);

        // Emit event for each feed
        for (uint i = 0; i < feedIds.length; i++) {
            emit PriceQueried(feedIds[i], values[i], decimals[i], timestamp, msg.sender);
        }

        return (values, decimals, timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update FTSO v2 address from registry
     * @dev Can be called by anyone to refresh the address
     */
    function updateFtsoAddress() external {
        _updateFtsoAddress();
    }

    /**
     * @notice Internal function to update FTSO address from registry
     */
    function _updateFtsoAddress() internal {
        IFlareContractRegistry registry = IFlareContractRegistry(FLARE_CONTRACT_REGISTRY);
        address newAddress = registry.getContractAddressByName("FtsoV2");

        require(newAddress != address(0), "FTSOPriceReader: FtsoV2 not found in registry");

        address oldAddress = ftsoV2Address;
        ftsoV2Address = newAddress;

        emit FtsoAddressUpdated(oldAddress, newAddress);
    }

    /**
     * @notice Get contract information
     * @return _owner Contract owner
     * @return _ftsoAddress Current FTSO v2 address
     * @return _deploymentTime When contract was deployed
     */
    function getContractInfo() external view returns (
        address _owner,
        address _ftsoAddress,
        uint256 _deploymentTime
    ) {
        return (owner, ftsoV2Address, deploymentTimestamp);
    }

    // ============ Receive Function ============

    /**
     * @notice Allow contract to receive FLR (for future fee payments)
     * @dev FTSO queries may require fees in the future
     */
    receive() external payable {}
}
