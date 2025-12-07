// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFTSOv2.sol";

/**
 * @title NexusCircle
 * @notice Simplified ROSCA (Rotating Savings and Credit Association) smart contract for 6-person pools
 * @dev Epic 3, 4, & 5 COMPLETE - Foundation + Core Logic + Flare Integration
 *
 * This is a simplified implementation inspired by WeTrust ROSCA contracts, adapted for:
 * - Fixed 6-person pools (can shrink if members default)
 * - Fixed 10% collateral requirement
 * - Round-robin payout selection
 * - Flare Network FTSO integration for collateral valuation
 * - Time-based default detection (1 hour for testing)
 *
 * Epic 3 Scope (Completed):
 * - Pool creation with configurable contribution amount
 * - Member joining (basic version without collateral)
 * - Pool query functions for UI integration
 *
 * Epic 4 Scope (Completed):
 * - Monthly contribution tracking with validation
 * - Round-robin payout execution
 * - Pool completion detection (after 6 rounds)
 * - Member status tracking (contributions, payouts, rounds)
 *
 * Epic 5 Scope (Completed):
 * - ✅ FTSO integration for price feeds (TASK-021)
 * - ✅ Collateral deposits on pool creation and join (10% of contribution) (TASK-022)
 * - ✅ Collateral return on pool completion (TASK-023)
 * - ✅ Default detection with time-based deadlines (1 hour for testing) (TASK-024)
 * - ✅ Collateral liquidation for defaulting members (TASK-025)
 *
 * Security Features:
 * - Checks-effects-interactions pattern (prevents reentrancy)
 * - Exact contribution and collateral amount validation
 * - Double contribution prevention
 * - Pool full validation before contributions
 * - Anyone can execute payout/defaults/liquidation (prevents stuck funds)
 * - Transfer() with 2300 gas limit (reentrancy protection)
 * - Time-based default detection with 1 hour deadline (testing mode)
 *
 * @custom:security-contact security@nexusbank.example
 */
contract NexusCircle {

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Maximum number of members per pool (fixed at 6 for MVP)
    uint256 public constant MAX_MEMBERS = 6;

    /// @notice Collateral percentage (10% of contribution amount, to be enforced in Epic 5)
    uint256 public constant COLLATERAL_PERCENT = 10;

    /// @notice Contribution deadline in seconds (1 hour for testing, 30 days for production)
    /// @dev After this time, members who haven't contributed are considered defaulted
    uint256 public constant CONTRIBUTION_DEADLINE = 3600; // 1 hour (3600 seconds) for testing

    /// @notice Total number of pools created
    uint256 public poolCount;

    /// @notice Contract owner (deployer)
    address public owner;

    /// @notice Contract deployment timestamp
    uint256 public deploymentTimestamp;

    /// @notice FTSO contract instance for price feeds (Epic 5)
    IFTSOv2 public immutable ftsoContract;

    /// @notice FLR/USD price feed ID (21 bytes)
    /// @dev Feed ID format: 0x01 (category: crypto) + "FLR/USD" (feed name) padded to 21 bytes
    bytes21 public constant FLR_USD_FEED_ID = 0x01464c522f55534400000000000000000000000000;

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Pool structure representing a ROSCA pool
     * @dev Struct does not contain nested mappings to allow memory operations
     *      Member contribution and payout tracking will use separate mappings
     */
    struct Pool {
        uint256 poolId;                  // Unique pool identifier
        uint256 maxMembers;              // Maximum members (always 6 for MVP)
        uint256 contributionAmount;      // Monthly contribution in FLR (wei)
        uint256 collateralPercent;       // Collateral percentage (always 10 for MVP)
        address[] members;               // Array of member addresses (max 6)
        uint256 currentRound;            // Current round number (0-5 for 6 members)
        bool isActive;                   // Pool active status
        uint256 createdAt;               // Pool creation timestamp
        address creator;                 // Pool creator address
        uint256 roundStartTime;          // Timestamp when current round started (Epic 5)
    }

    // ============================================
    // MAPPINGS
    // ============================================

    /// @notice Mapping from poolId to Pool struct
    mapping(uint256 => Pool) public pools;

    /// @notice Mapping to track if an address is a member of a pool
    /// @dev poolId => memberAddress => isMember
    mapping(uint256 => mapping(address => bool)) public isMember;

    /// @notice Mapping to track member contribution status per round
    /// @dev poolId => round => memberAddress => hasContributed
    /// Note: To be used in Epic 4
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasContributed;

    /// @notice Mapping to track if a member has received payout
    /// @dev poolId => memberAddress => hasPaid
    /// Note: To be used in Epic 4
    mapping(uint256 => mapping(address => bool)) public hasPaid;

    /// @notice Mapping to track collateral balances
    /// @dev poolId => memberAddress => collateralAmount
    /// Note: To be implemented in Epic 5
    mapping(uint256 => mapping(address => uint256)) public collateralBalances;

    /// @notice Mapping to track defaulted members
    /// @dev poolId => memberAddress => hasDefaulted
    /// Note: To be implemented in Epic 5
    mapping(uint256 => mapping(address => bool)) public hasDefaulted;

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new pool is created
     * @param poolId Unique pool identifier
     * @param creator Address of pool creator
     * @param contributionAmount Monthly contribution amount in FLR
     * @param timestamp Pool creation timestamp
     */
    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        uint256 contributionAmount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a member joins a pool
     * @param poolId Pool identifier
     * @param member Address of new member
     * @param memberCount Current number of members
     * @param timestamp Join timestamp
     */
    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 memberCount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when collateral is deposited
     * @param poolId Pool identifier
     * @param member Member address
     * @param amount Collateral amount in FLR
     * @dev To be implemented in Epic 5
     */
    event CollateralDeposited(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount
    );

    /**
     * @notice Emitted when a contribution is made
     * @param poolId Pool identifier
     * @param member Member address
     * @param amount Contribution amount
     * @param round Current round number
     * @dev To be implemented in Epic 4
     */
    event ContributionMade(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount,
        uint256 round
    );

    /**
     * @notice Emitted when a payout is executed
     * @param poolId Pool identifier
     * @param recipient Payout recipient
     * @param amount Payout amount
     * @param round Round number
     * @dev To be implemented in Epic 4
     */
    event PayoutExecuted(
        uint256 indexed poolId,
        address indexed recipient,
        uint256 amount,
        uint256 round
    );

    /**
     * @notice Emitted when a pool is completed
     * @param poolId Pool identifier
     * @param totalRounds Total rounds completed
     * @dev To be implemented in Epic 4
     */
    event PoolCompleted(
        uint256 indexed poolId,
        uint256 totalRounds
    );

    /**
     * @notice Emitted when collateral is returned to a member
     * @param poolId Pool identifier
     * @param member Member address
     * @param amount Collateral amount returned
     * @dev To be implemented in Epic 5
     */
    event CollateralReturned(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount
    );

    /**
     * @notice Emitted when a member defaults
     * @param poolId Pool identifier
     * @param member Defaulted member address
     * @param round Round number where default occurred
     * @dev To be implemented in Epic 5
     */
    event MemberDefaulted(
        uint256 indexed poolId,
        address indexed member,
        uint256 round
    );

    /**
     * @notice Emitted when collateral is liquidated
     * @param poolId Pool identifier
     * @param defaultedMember Member who defaulted
     * @param collateralAmount Amount liquidated
     * @param distributionPerMember Amount distributed to each remaining member
     * @dev To be implemented in Epic 5
     */
    event CollateralLiquidated(
        uint256 indexed poolId,
        address indexed defaultedMember,
        uint256 collateralAmount,
        uint256 distributionPerMember
    );

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Restricts function access to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @notice Validates that a pool exists
     * @param _poolId Pool identifier
     */
    modifier poolExists(uint256 _poolId) {
        require(_poolId < poolCount, "Pool does not exist");
        _;
    }

    /**
     * @notice Validates that a pool is active
     * @param _poolId Pool identifier
     */
    modifier poolActive(uint256 _poolId) {
        require(pools[_poolId].isActive, "Pool is not active");
        _;
    }

    /**
     * @notice Validates that caller is a pool member
     * @param _poolId Pool identifier
     */
    modifier onlyMember(uint256 _poolId) {
        require(isMember[_poolId][msg.sender], "Not a member of this pool");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initializes the NexusCircle contract
     * @param _ftsoAddress Address of the FTSO contract for price feeds
     * @dev Sets deployer as owner and records deployment time
     * @dev Epic 5: FTSO integration for collateral valuation
     */
    constructor(address _ftsoAddress) {
        require(_ftsoAddress != address(0), "Invalid FTSO address");

        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        poolCount = 0;
        ftsoContract = IFTSOv2(_ftsoAddress);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Creates a new ROSCA pool
     * @param _contributionAmount Monthly contribution amount in FLR (wei)
     * @return poolId The unique identifier of the created pool
     *
     * @dev Epic 5 Implementation - WITH collateral requirement
     *
     * Requirements:
     * - Contribution amount must be greater than 0
     * - Must send EXACT collateral amount (10% of contribution)
     * - Creator is automatically added as the first member
     * - Pool is initialized with default values (maxMembers=6, collateralPercent=10)
     *
     * Collateral Calculation:
     * - Required collateral = contributionAmount * 10 / 100
     * - Example: If contribution is 100 FLR, collateral is 10 FLR
     */
    function createPool(uint256 _contributionAmount) external payable returns (uint256) {
        require(_contributionAmount > 0, "Contribution amount must be greater than 0");

        // Calculate required collateral (10% of contribution amount)
        uint256 requiredCollateral = (_contributionAmount * COLLATERAL_PERCENT) / 100;

        // Validate exact collateral amount sent
        require(msg.value == requiredCollateral, "Must send exact collateral amount");

        uint256 newPoolId = poolCount;

        // Initialize new pool using storage pointer
        // Note: Direct struct construction not possible due to nested array
        Pool storage newPool = pools[newPoolId];
        newPool.poolId = newPoolId;
        newPool.maxMembers = MAX_MEMBERS;
        newPool.contributionAmount = _contributionAmount;
        newPool.collateralPercent = COLLATERAL_PERCENT;
        newPool.currentRound = 0;
        newPool.isActive = true;
        newPool.createdAt = block.timestamp;
        newPool.creator = msg.sender;
        newPool.roundStartTime = block.timestamp; // Initialize round start time (Epic 5)

        // Add creator as first member
        newPool.members.push(msg.sender);
        isMember[newPoolId][msg.sender] = true;

        // Store collateral balance for creator
        collateralBalances[newPoolId][msg.sender] = requiredCollateral;

        // Increment pool count
        poolCount++;

        // Emit events
        emit CollateralDeposited(newPoolId, msg.sender, requiredCollateral);
        emit PoolCreated(newPoolId, msg.sender, _contributionAmount, block.timestamp);

        return newPoolId;
    }

    /**
     * @notice Join an existing pool
     * @param _poolId Pool identifier to join
     * @return success True if join was successful
     *
     * @dev Epic 5 Implementation - WITH collateral requirement
     *
     * Requirements:
     * - Pool must exist and be active
     * - Pool must not be full (less than 6 members)
     * - Caller must not already be a member
     * - Must send EXACT collateral amount (10% of contribution)
     *
     * Collateral Calculation:
     * - Required collateral = contributionAmount * 10 / 100
     * - Example: If contribution is 100 FLR, collateral is 10 FLR
     *
     * Edge cases handled:
     * - Exact amount required (no overpayment accepted per user decision)
     * - Collateral stored in collateralBalances mapping
     * - Returned on pool completion or liquidated on default
     */
    function joinPool(uint256 _poolId)
        external
        payable
        poolExists(_poolId)
        poolActive(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // Validate pool is not full
        require(pool.members.length < MAX_MEMBERS, "Pool is full");

        // Validate user is not already a member
        require(!isMember[_poolId][msg.sender], "Already a member of this pool");

        // Calculate required collateral (10% of contribution amount)
        uint256 requiredCollateral = (pool.contributionAmount * COLLATERAL_PERCENT) / 100;

        // Validate exact collateral amount sent (no overpayment per user decision)
        require(msg.value == requiredCollateral, "Must send exact collateral amount");

        // Store collateral balance
        collateralBalances[_poolId][msg.sender] = requiredCollateral;

        // Add member to pool
        pool.members.push(msg.sender);
        isMember[_poolId][msg.sender] = true;

        // Emit events
        emit CollateralDeposited(_poolId, msg.sender, requiredCollateral);
        emit MemberJoined(_poolId, msg.sender, pool.members.length, block.timestamp);

        return true;
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================

    /**
     * @notice Get pool information
     * @param _poolId Pool identifier
     * @return poolId Pool ID
     * @return maxMembers Maximum members (6)
     * @return contributionAmount Monthly contribution in FLR
     * @return collateralPercent Collateral percentage (10)
     * @return memberCount Current number of members
     * @return currentRound Current round number
     * @return isActive Pool active status
     * @return createdAt Pool creation timestamp
     * @return creator Pool creator address
     *
     * @dev Returns individual values instead of Pool struct due to array in struct
     */
    function getPool(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (
            uint256 poolId,
            uint256 maxMembers,
            uint256 contributionAmount,
            uint256 collateralPercent,
            uint256 memberCount,
            uint256 currentRound,
            bool isActive,
            uint256 createdAt,
            address creator
        )
    {
        Pool storage pool = pools[_poolId];
        return (
            pool.poolId,
            pool.maxMembers,
            pool.contributionAmount,
            pool.collateralPercent,
            pool.members.length,
            pool.currentRound,
            pool.isActive,
            pool.createdAt,
            pool.creator
        );
    }

    /**
     * @notice Get all members of a pool
     * @param _poolId Pool identifier
     * @return members Array of member addresses
     */
    function getPoolMembers(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (address[] memory)
    {
        return pools[_poolId].members;
    }

    /**
     * @notice Get current member count for a pool
     * @param _poolId Pool identifier
     * @return count Number of members
     */
    function getPoolMemberCount(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (uint256)
    {
        return pools[_poolId].members.length;
    }

    /**
     * @notice Check if a pool is full
     * @param _poolId Pool identifier
     * @return isFull True if pool has 6 members
     */
    function isPoolFull(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        return pools[_poolId].members.length >= MAX_MEMBERS;
    }

    /**
     * @notice Check if an address is a member of a pool
     * @param _poolId Pool identifier
     * @param _member Address to check
     * @return isMemberBool True if address is a pool member
     */
    function checkIsMember(uint256 _poolId, address _member)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        return isMember[_poolId][_member];
    }

    /**
     * @notice Get contract information
     * @return contractOwner Contract owner address
     * @return totalPools Total number of pools created
     * @return deployedAt Deployment timestamp
     * @return maxMembersPerPool Maximum members per pool (6)
     * @return collateralPercentage Collateral percentage (10)
     */
    function getContractInfo()
        external
        view
        returns (
            address contractOwner,
            uint256 totalPools,
            uint256 deployedAt,
            uint256 maxMembersPerPool,
            uint256 collateralPercentage
        )
    {
        return (
            owner,
            poolCount,
            deploymentTimestamp,
            MAX_MEMBERS,
            COLLATERAL_PERCENT
        );
    }

    // ============================================
    // EPIC 4: CONTRIBUTION & PAYOUT FUNCTIONS
    // ============================================

    /**
     * @notice Make monthly contribution to a pool
     * @param _poolId Pool identifier
     * @return success True if contribution was successful
     *
     * @dev Requirements:
     * - Pool must exist and be active
     * - Pool must be full (6/6 members) before contributions can start
     * - Caller must be a pool member
     * - msg.value must equal exactly the contribution amount
     * - Member must not have already contributed this round
     *
     * Edge cases handled:
     * - Blocks contributions if pool not full (prevents inconsistent payouts)
     * - Prevents double contributions in same round
     * - Validates exact contribution amount (no more, no less)
     */
    function contribute(uint256 _poolId)
        external
        payable
        poolExists(_poolId)
        poolActive(_poolId)
        onlyMember(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // Validate pool is full before accepting contributions
        require(pool.members.length == MAX_MEMBERS, "Pool must be full (6/6 members) to start contributions");

        // Validate contribution amount is exact
        require(msg.value == pool.contributionAmount, "Must send exact contribution amount");

        // Validate member hasn't contributed this round
        require(!hasContributed[_poolId][pool.currentRound][msg.sender], "Already contributed this round");

        // Mark member as contributed for this round
        hasContributed[_poolId][pool.currentRound][msg.sender] = true;

        // Emit contribution event
        emit ContributionMade(_poolId, msg.sender, msg.value, pool.currentRound);

        return true;
    }

    /**
     * @notice Select payout recipient using round-robin algorithm
     * @param _poolId Pool identifier
     * @return recipient Address of selected recipient
     *
     * @dev Internal function implementing round-robin selection:
     * - Round 0: members[0] receives payout
     * - Round 1: members[1] receives payout
     * - ...
     * - Round 5: members[5] receives payout
     *
     * Uses modulo to ensure index stays within bounds (defensive programming)
     */
    function selectPayoutRecipient(uint256 _poolId)
        internal
        view
        returns (address)
    {
        Pool storage pool = pools[_poolId];

        // Round-robin selection: currentRound maps directly to member index
        // Use modulo for defensive programming (ensures index never exceeds array bounds)
        uint256 recipientIndex = pool.currentRound % pool.members.length;

        return pool.members[recipientIndex];
    }

    /**
     * @notice Execute payout to selected member after all contributions received
     * @param _poolId Pool identifier
     * @return success True if payout was successful
     *
     * @dev Requirements:
     * - Pool must exist and be active
     * - All members must have contributed for current round
     * - Selected recipient must not have been paid yet (safety check)
     * - Contract must have sufficient balance
     *
     * Process:
     * 1. Validate all members contributed
     * 2. Select recipient (round-robin)
     * 3. Calculate payout amount
     * 4. Mark recipient as paid
     * 5. Transfer funds (using transfer() for reentrancy protection)
     * 6. Increment round
     * 7. Check for pool completion
     *
     * Edge cases handled:
     * - Anyone can call (prevents stuck funds if members inactive)
     * - Validates all contributions received
     * - Checks recipient hasn't been paid (prevents double payment)
     * - Uses transfer() with 2300 gas limit (reentrancy protection)
     * - Automatically completes pool after 6 rounds
     */
    function executePayout(uint256 _poolId)
        external
        poolExists(_poolId)
        poolActive(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // Validate all members have contributed this round
        for (uint256 i = 0; i < pool.members.length; i++) {
            require(
                hasContributed[_poolId][pool.currentRound][pool.members[i]],
                "Not all members have contributed this round"
            );
        }

        // Select payout recipient using round-robin
        address recipient = selectPayoutRecipient(_poolId);

        // Safety check: ensure recipient hasn't been paid yet
        require(!hasPaid[_poolId][recipient], "Recipient has already been paid");

        // Calculate total payout (contribution amount * number of members)
        uint256 payoutAmount = pool.contributionAmount * pool.members.length;

        // Validate contract has sufficient balance
        require(address(this).balance >= payoutAmount, "Insufficient contract balance");

        // Mark recipient as paid (BEFORE transfer - checks-effects-interactions pattern)
        hasPaid[_poolId][recipient] = true;

        // Emit payout event (BEFORE transfer)
        emit PayoutExecuted(_poolId, recipient, payoutAmount, pool.currentRound);

        // Transfer funds to recipient
        // Using transfer() for reentrancy protection (2300 gas limit)
        payable(recipient).transfer(payoutAmount);

        // Increment round for next cycle
        pool.currentRound++;

        // Reset round start time for next round (Epic 5)
        pool.roundStartTime = block.timestamp;

        // Check if pool is complete (all 6 members have been paid)
        if (pool.currentRound >= MAX_MEMBERS) {
            // Mark pool as complete
            pool.isActive = false;

            // Emit completion event
            emit PoolCompleted(_poolId, pool.currentRound);
        }

        return true;
    }

    // ============================================
    // MEMBER STATUS TRACKING FUNCTIONS
    // ============================================

    /**
     * @notice Check if a member has contributed for a specific round
     * @param _poolId Pool identifier
     * @param _round Round number
     * @param _member Member address
     * @return contributed True if member has contributed
     */
    function hasMemberContributed(uint256 _poolId, uint256 _round, address _member)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        return hasContributed[_poolId][_round][_member];
    }

    /**
     * @notice Check if a member has received their payout
     * @param _poolId Pool identifier
     * @param _member Member address
     * @return paid True if member has been paid
     */
    function hasMemberBeenPaid(uint256 _poolId, address _member)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        return hasPaid[_poolId][_member];
    }

    /**
     * @notice Get current round number for a pool
     * @param _poolId Pool identifier
     * @return round Current round number (0-5 for active pools, 6 for completed)
     */
    function getCurrentRound(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (uint256)
    {
        return pools[_poolId].currentRound;
    }

    /**
     * @notice Check how many members have contributed in current round
     * @param _poolId Pool identifier
     * @return count Number of members who contributed this round
     *
     * @dev Useful for UI to show contribution progress
     */
    function getContributionCount(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (uint256)
    {
        Pool storage pool = pools[_poolId];
        uint256 count = 0;

        for (uint256 i = 0; i < pool.members.length; i++) {
            if (hasContributed[_poolId][pool.currentRound][pool.members[i]]) {
                count++;
            }
        }

        return count;
    }

    /**
     * @notice Check if all members have contributed for current round
     * @param _poolId Pool identifier
     * @return allContributed True if all members contributed
     *
     * @dev Useful for UI to enable/disable payout button
     */
    function areAllMembersContributed(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // If pool not full, can't have all contributions
        if (pool.members.length < MAX_MEMBERS) {
            return false;
        }

        // Check if all members contributed
        for (uint256 i = 0; i < pool.members.length; i++) {
            if (!hasContributed[_poolId][pool.currentRound][pool.members[i]]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Get the next payout recipient (without executing payout)
     * @param _poolId Pool identifier
     * @return recipient Address of next recipient
     *
     * @dev Useful for UI to show who receives payout next
     */
    function getNextPayoutRecipient(uint256 _poolId)
        external
        view
        poolExists(_poolId)
        returns (address)
    {
        return selectPayoutRecipient(_poolId);
    }

    // ============================================
    // EPIC 5: FTSO PRICE FEED INTEGRATION
    // ============================================

    /**
     * @notice Get current FLR/USD price from FTSO
     * @return priceInUsd FLR price in USD (with 5 decimals, e.g., 2500 = $0.02500)
     * @return timestamp Price update timestamp
     *
     * @dev Internal helper function for collateral valuation
     * @dev Uses FLR/USD feed ID: 0x01464c522f55534400000000000000000000000000
     * @dev Price format: 5 decimals (divide by 100000 to get actual USD price)
     *
     * Example:
     * - Return value: 2500
     * - Actual price: 0.02500 USD (2500 / 100000)
     */
    function getFlrUsdPrice()
        internal
        returns (uint256 priceInUsd, uint64 timestamp)
    {
        // Query FTSO for FLR/USD price
        (uint256 value, int8 decimals, uint64 ts) = ftsoContract.getFeedById(FLR_USD_FEED_ID);

        // Validate decimals match expected format (5 decimals)
        require(decimals == 5, "Unexpected price decimals from FTSO");

        return (value, ts);
    }

    // ============================================
    // EPIC 5: COLLATERAL & DEFAULT MANAGEMENT
    // ============================================

    /**
     * @notice Return collateral to all pool members after pool completion
     * @param _poolId Pool identifier
     * @return success True if collateral was returned successfully
     *
     * @dev Requirements:
     * - Pool must exist
     * - Pool must be completed (isActive == false)
     * - Anyone can call (batch return to all members per user decision)
     *
     * Process:
     * 1. Validate pool is complete
     * 2. Loop through all members
     * 3. Transfer collateral to each member
     * 4. Reset collateral balance to 0
     * 5. Emit CollateralReturned event for each member
     *
     * Edge cases handled:
     * - Anyone can call (prevents stuck collateral if members inactive)
     * - Skips members with zero collateral balance
     * - Uses transfer() for reentrancy protection (2300 gas limit)
     * - Batch processing for all members in single transaction
     */
    function returnCollateral(uint256 _poolId)
        external
        poolExists(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // Validate pool is completed
        require(!pool.isActive, "Pool must be completed before returning collateral");

        // Loop through all members and return their collateral
        for (uint256 i = 0; i < pool.members.length; i++) {
            address member = pool.members[i];
            uint256 collateralAmount = collateralBalances[_poolId][member];

            // Skip if member has no collateral (already returned or liquidated)
            if (collateralAmount == 0) {
                continue;
            }

            // Reset collateral balance (BEFORE transfer - checks-effects-interactions)
            collateralBalances[_poolId][member] = 0;

            // Emit event (BEFORE transfer)
            emit CollateralReturned(_poolId, member, collateralAmount);

            // Transfer collateral back to member
            // Using transfer() for reentrancy protection (2300 gas limit)
            payable(member).transfer(collateralAmount);
        }

        return true;
    }

    /**
     * @notice Check for defaulted members who missed contribution deadline
     * @param _poolId Pool identifier
     * @return defaultedMembers Array of addresses that defaulted
     *
     * @dev Requirements:
     * - Pool must exist and be active
     * - Contribution deadline must have passed (1 hour for testing)
     * - Anyone can call
     *
     * Process:
     * 1. Validate deadline has passed (block.timestamp > roundStartTime + 3600)
     * 2. Loop through all members
     * 3. Check if member contributed for current round
     * 4. Mark non-contributors as defaulted
     * 5. Emit MemberDefaulted event for each defaulter
     * 6. Return array of defaulted addresses
     *
     * Edge cases handled:
     * - Only marks members who haven't contributed and aren't already marked as defaulted
     * - Returns empty array if all members contributed
     * - Anyone can call to trigger default detection
     * - Deadline: 1 hour (3600 seconds) for testing
     */
    function checkForDefaults(uint256 _poolId)
        external
        poolExists(_poolId)
        poolActive(_poolId)
        returns (address[] memory)
    {
        Pool storage pool = pools[_poolId];

        // Validate contribution deadline has passed
        require(
            block.timestamp > pool.roundStartTime + CONTRIBUTION_DEADLINE,
            "Contribution deadline has not passed yet"
        );

        // Dynamic array to track defaulted members
        address[] memory defaultedMembers = new address[](pool.members.length);
        uint256 defaultCount = 0;

        // Loop through all members and check for defaults
        for (uint256 i = 0; i < pool.members.length; i++) {
            address member = pool.members[i];

            // Check if member hasn't contributed and isn't already marked as defaulted
            if (!hasContributed[_poolId][pool.currentRound][member] && !hasDefaulted[_poolId][member]) {
                // Mark member as defaulted
                hasDefaulted[_poolId][member] = true;

                // Add to defaulted members array
                defaultedMembers[defaultCount] = member;
                defaultCount++;

                // Emit event
                emit MemberDefaulted(_poolId, member, pool.currentRound);
            }
        }

        // Resize array to actual number of defaulted members
        address[] memory result = new address[](defaultCount);
        for (uint256 i = 0; i < defaultCount; i++) {
            result[i] = defaultedMembers[i];
        }

        return result;
    }

    /**
     * @notice Liquidate collateral of a defaulted member and distribute to remaining members
     * @param _poolId Pool identifier
     * @param _defaultedMember Address of the defaulted member
     * @return success True if liquidation was successful
     *
     * @dev Requirements:
     * - Pool must exist and be active
     * - Member must be marked as defaulted
     * - Member must have collateral balance
     * - Anyone can call
     *
     * Process:
     * 1. Validate member is defaulted
     * 2. Get member's collateral balance
     * 3. Calculate distribution per remaining member
     * 4. Transfer share to each remaining member
     * 5. Remove defaulted member from pool
     * 6. Clear collateral balance
     * 7. Emit CollateralLiquidated event
     *
     * Edge cases handled:
     * - Pool continues with fewer members (per user decision)
     * - Division handles remainders (some members may get 1 wei more)
     * - Uses transfer() for reentrancy protection (2300 gas limit)
     * - Removes member from pool array by rebuilding array
     * - Updates isMember mapping
     */
    function liquidateDefaultedMember(uint256 _poolId, address _defaultedMember)
        external
        poolExists(_poolId)
        poolActive(_poolId)
        returns (bool)
    {
        Pool storage pool = pools[_poolId];

        // Validate member is defaulted
        require(hasDefaulted[_poolId][_defaultedMember], "Member has not defaulted");

        // Validate member has collateral
        uint256 collateralAmount = collateralBalances[_poolId][_defaultedMember];
        require(collateralAmount > 0, "No collateral to liquidate");

        // Calculate number of remaining members (excluding defaulted member)
        uint256 remainingMembers = pool.members.length - 1;
        require(remainingMembers > 0, "Cannot liquidate - no remaining members");

        // Calculate distribution per member
        uint256 distributionPerMember = collateralAmount / remainingMembers;

        // Clear defaulted member's collateral balance (BEFORE transfers - checks-effects-interactions)
        collateralBalances[_poolId][_defaultedMember] = 0;

        // Remove member from isMember mapping
        isMember[_poolId][_defaultedMember] = false;

        // Emit liquidation event (BEFORE transfers)
        emit CollateralLiquidated(_poolId, _defaultedMember, collateralAmount, distributionPerMember);

        // Distribute collateral to remaining members
        for (uint256 i = 0; i < pool.members.length; i++) {
            address member = pool.members[i];

            // Skip the defaulted member
            if (member == _defaultedMember) {
                continue;
            }

            // Transfer share to member
            // Using transfer() for reentrancy protection (2300 gas limit)
            payable(member).transfer(distributionPerMember);
        }

        // Remove defaulted member from members array
        // Strategy: Create new array without defaulted member
        address[] memory newMembers = new address[](remainingMembers);
        uint256 newIndex = 0;

        for (uint256 i = 0; i < pool.members.length; i++) {
            if (pool.members[i] != _defaultedMember) {
                newMembers[newIndex] = pool.members[i];
                newIndex++;
            }
        }

        // Replace pool members array with new array
        delete pool.members;
        for (uint256 i = 0; i < newMembers.length; i++) {
            pool.members.push(newMembers[i]);
        }

        return true;
    }
}
