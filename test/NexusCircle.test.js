/**
 * NexusCircle Smart Contract Test Suite
 * Epic 6: Comprehensive testing for pool creation, joining, contributions, payouts, and defaults
 *
 * Test Coverage:
 * - TASK-026: Pool Creation
 * - TASK-027: Joining Pool
 * - TASK-028: Contribution & Payout
 * - TASK-029: Default Scenarios
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexusCircle Contract", function () {
    // Test fixtures
    let nexusCircle;
    let ftsoAddress;
    let owner, member1, member2, member3, member4, member5, member6, nonMember;
    let signers;

    // Test constants
    const CONTRIBUTION_AMOUNT = ethers.parseEther("100"); // 100 FLR
    const COLLATERAL_PERCENT = 10n;
    const COLLATERAL_AMOUNT = CONTRIBUTION_AMOUNT * COLLATERAL_PERCENT / 100n; // 10 FLR
    const MAX_MEMBERS = 6n;
    const CONTRIBUTION_DEADLINE = 3600; // 1 hour in seconds

    /**
     * Before each test: Deploy fresh contract and set up test wallets
     */
    beforeEach(async function () {
        // Get test signers (Hardhat provides 20 default accounts)
        signers = await ethers.getSigners();
        [owner, member1, member2, member3, member4, member5, member6, nonMember] = signers;

        // FTSO contract address on Coston2 (from Epic 2)
        ftsoAddress = "0x3d893C53D9e8056135C26C8c638B76C8b60Df726";

        // Deploy NexusCircle contract
        const NexusCircle = await ethers.getContractFactory("NexusCircle");
        nexusCircle = await NexusCircle.deploy(ftsoAddress);
        await nexusCircle.waitForDeployment();

        console.log(`    ✅ Contract deployed to: ${await nexusCircle.getAddress()}`);
    });

    // ============================================
    // TASK-026: POOL CREATION TESTS
    // ============================================
    describe("TASK-026: Pool Creation", function () {
        it("Should successfully create a pool with correct collateral", async function () {
            const tx = await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );
            await tx.wait();

            // Verify pool was created
            const poolCount = await nexusCircle.poolCount();
            expect(poolCount).to.equal(1);

            // Verify pool details
            const poolInfo = await nexusCircle.getPool(0);
            expect(poolInfo[0]).to.equal(0); // poolId
            expect(poolInfo[1]).to.equal(MAX_MEMBERS); // maxMembers
            expect(poolInfo[2]).to.equal(CONTRIBUTION_AMOUNT); // contributionAmount
            expect(poolInfo[3]).to.equal(COLLATERAL_PERCENT); // collateralPercent
            expect(poolInfo[4]).to.equal(1); // memberCount
            expect(poolInfo[5]).to.equal(0); // currentRound
            expect(poolInfo[6]).to.equal(true); // isActive
            expect(poolInfo[8]).to.equal(owner.address); // creator
        });

        it("Should increment poolId correctly for multiple pools", async function () {
            // Create first pool
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );

            // Create second pool
            await nexusCircle.connect(member1).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );

            // Verify pool count
            const poolCount = await nexusCircle.poolCount();
            expect(poolCount).to.equal(2);

            // Verify poolIds
            const pool0 = await nexusCircle.getPool(0);
            const pool1 = await nexusCircle.getPool(1);
            expect(pool0[0]).to.equal(0); // First pool ID
            expect(pool1[0]).to.equal(1); // Second pool ID
        });

        it("Should emit PoolCreated and CollateralDeposited events", async function () {
            const tx = await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );

            // Check for CollateralDeposited event
            await expect(tx)
                .to.emit(nexusCircle, "CollateralDeposited")
                .withArgs(0, owner.address, COLLATERAL_AMOUNT);

            // Check for PoolCreated event
            await expect(tx)
                .to.emit(nexusCircle, "PoolCreated");
        });

        it("Should add creator as first member", async function () {
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );

            // Verify creator is a member
            const isMem = await nexusCircle.checkIsMember(0, owner.address);
            expect(isMem).to.equal(true);

            // Verify creator is in members array
            const members = await nexusCircle.getPoolMembers(0);
            expect(members.length).to.equal(1);
            expect(members[0]).to.equal(owner.address);

            // Verify member count
            const poolInfo = await nexusCircle.getPool(0);
            expect(poolInfo[4]).to.equal(1); // memberCount
        });

        it("Should fail if contribution amount is zero", async function () {
            await expect(
                nexusCircle.connect(owner).createPool(0, { value: 0 })
            ).to.be.revertedWith("Contribution amount must be greater than 0");
        });

        it("Should fail if collateral amount is incorrect", async function () {
            // Try with too little collateral
            await expect(
                nexusCircle.connect(owner).createPool(
                    CONTRIBUTION_AMOUNT,
                    { value: COLLATERAL_AMOUNT - 1n }
                )
            ).to.be.revertedWith("Must send exact collateral amount");

            // Try with too much collateral
            await expect(
                nexusCircle.connect(owner).createPool(
                    CONTRIBUTION_AMOUNT,
                    { value: COLLATERAL_AMOUNT + 1n }
                )
            ).to.be.revertedWith("Must send exact collateral amount");
        });

        it("Should store collateral balance for creator", async function () {
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );

            // Verify collateral balance
            const collateralBalance = await nexusCircle.collateralBalances(0, owner.address);
            expect(collateralBalance).to.equal(COLLATERAL_AMOUNT);
        });
    });

    // ============================================
    // TASK-027: JOINING POOL TESTS
    // ============================================
    describe("TASK-027: Joining Pool", function () {
        let poolId;

        beforeEach(async function () {
            // Create a pool before each test
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );
            poolId = 0;
        });

        it("Should successfully join pool with correct collateral", async function () {
            const tx = await nexusCircle.connect(member1).joinPool(
                poolId,
                { value: COLLATERAL_AMOUNT }
            );
            await tx.wait();

            // Verify member was added
            const isMem = await nexusCircle.checkIsMember(poolId, member1.address);
            expect(isMem).to.equal(true);

            // Verify member count increased
            const poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[4]).to.equal(2); // memberCount (owner + member1)

            // Verify collateral balance
            const collateralBalance = await nexusCircle.collateralBalances(poolId, member1.address);
            expect(collateralBalance).to.equal(COLLATERAL_AMOUNT);
        });

        it("Should fail to join pool without collateral", async function () {
            await expect(
                nexusCircle.connect(member1).joinPool(poolId, { value: 0 })
            ).to.be.revertedWith("Must send exact collateral amount");
        });

        it("Should fail to join pool with incorrect collateral amount", async function () {
            // Too little collateral
            await expect(
                nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT - 1n })
            ).to.be.revertedWith("Must send exact collateral amount");

            // Too much collateral
            await expect(
                nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT + 1n })
            ).to.be.revertedWith("Must send exact collateral amount");
        });

        it("Should allow 6th member to join but reject 7th member", async function () {
            // Add members 2-6 (member1 is 2nd, owner is 1st)
            await nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member2).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member3).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member4).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member5).joinPool(poolId, { value: COLLATERAL_AMOUNT });

            // Verify pool is full
            const isFull = await nexusCircle.isPoolFull(poolId);
            expect(isFull).to.equal(true);

            // Verify member count is 6
            const poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[4]).to.equal(MAX_MEMBERS);

            // Try to add 7th member (should fail)
            await expect(
                nexusCircle.connect(member6).joinPool(poolId, { value: COLLATERAL_AMOUNT })
            ).to.be.revertedWith("Pool is full");
        });

        it("Should fail on duplicate join attempt", async function () {
            // Member1 joins
            await nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT });

            // Member1 tries to join again (should fail)
            await expect(
                nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT })
            ).to.be.revertedWith("Already a member of this pool");
        });

        it("Should emit CollateralDeposited and MemberJoined events", async function () {
            const tx = await nexusCircle.connect(member1).joinPool(
                poolId,
                { value: COLLATERAL_AMOUNT }
            );

            // Check for CollateralDeposited event
            await expect(tx)
                .to.emit(nexusCircle, "CollateralDeposited")
                .withArgs(poolId, member1.address, COLLATERAL_AMOUNT);

            // Check for MemberJoined event
            await expect(tx)
                .to.emit(nexusCircle, "MemberJoined");
        });

        it("Should fail to join non-existent pool", async function () {
            await expect(
                nexusCircle.connect(member1).joinPool(999, { value: COLLATERAL_AMOUNT })
            ).to.be.revertedWith("Pool does not exist");
        });
    });

    // ============================================
    // TASK-028: CONTRIBUTION & PAYOUT TESTS
    // ============================================
    describe("TASK-028: Contribution & Payout", function () {
        let poolId;
        let allMembers;

        beforeEach(async function () {
            // Create pool with owner
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );
            poolId = 0;

            // Fill pool with 5 more members (6 total)
            await nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member2).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member3).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member4).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member5).joinPool(poolId, { value: COLLATERAL_AMOUNT });

            allMembers = [owner, member1, member2, member3, member4, member5];
        });

        it("Should allow all 6 members to contribute successfully", async function () {
            // All members contribute
            for (const member of allMembers) {
                await nexusCircle.connect(member).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Verify all members contributed
            const allContributed = await nexusCircle.areAllMembersContributed(poolId);
            expect(allContributed).to.equal(true);

            // Verify contribution count
            const contributionCount = await nexusCircle.getContributionCount(poolId);
            expect(contributionCount).to.equal(MAX_MEMBERS);
        });

        it("Should fail on duplicate contribution in same round", async function () {
            // Member1 contributes
            await nexusCircle.connect(member1).contribute(poolId, { value: CONTRIBUTION_AMOUNT });

            // Member1 tries to contribute again in same round (should fail)
            await expect(
                nexusCircle.connect(member1).contribute(poolId, { value: CONTRIBUTION_AMOUNT })
            ).to.be.revertedWith("Already contributed this round");
        });

        it("Should execute payout and transfer correct amount to recipient", async function () {
            // All members contribute
            for (const member of allMembers) {
                await nexusCircle.connect(member).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Get recipient for round 0 (should be owner - first member)
            const recipient = await nexusCircle.getNextPayoutRecipient(poolId);
            expect(recipient).to.equal(owner.address);

            // Get recipient's balance before payout
            const balanceBefore = await ethers.provider.getBalance(owner.address);

            // Execute payout
            await nexusCircle.connect(nonMember).executePayout(poolId);

            // Get recipient's balance after payout
            const balanceAfter = await ethers.provider.getBalance(owner.address);

            // Calculate expected payout (contribution * 6 members)
            const expectedPayout = CONTRIBUTION_AMOUNT * 6n;

            // Verify recipient received correct amount
            expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
        });

        it("Should increment round after payout", async function () {
            // All members contribute
            for (const member of allMembers) {
                await nexusCircle.connect(member).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Verify current round is 0
            let currentRound = await nexusCircle.getCurrentRound(poolId);
            expect(currentRound).to.equal(0);

            // Execute payout
            await nexusCircle.connect(nonMember).executePayout(poolId);

            // Verify round incremented to 1
            currentRound = await nexusCircle.getCurrentRound(poolId);
            expect(currentRound).to.equal(1);
        });

        it("Should complete pool after 6 rounds and return collateral", async function () {
            // Execute 6 complete rounds
            for (let round = 0; round < 6; round++) {
                // All members contribute
                for (const member of allMembers) {
                    await nexusCircle.connect(member).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
                }

                // Execute payout
                await nexusCircle.connect(nonMember).executePayout(poolId);
            }

            // Verify pool is complete
            const poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[6]).to.equal(false); // isActive should be false

            // Verify all members were paid
            for (const member of allMembers) {
                const wasPaid = await nexusCircle.hasMemberBeenPaid(poolId, member.address);
                expect(wasPaid).to.equal(true);
            }

            // Get collateral balances before return
            const collateralBefore = await nexusCircle.collateralBalances(poolId, owner.address);
            expect(collateralBefore).to.equal(COLLATERAL_AMOUNT);

            // Return collateral to all members
            await nexusCircle.connect(nonMember).returnCollateral(poolId);

            // Verify collateral balances are zero
            const collateralAfter = await nexusCircle.collateralBalances(poolId, owner.address);
            expect(collateralAfter).to.equal(0);
        });

        it("Should fail to contribute before pool is full", async function () {
            // Create new pool with only owner (not full)
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );
            const newPoolId = 1;

            // Try to contribute (should fail - pool not full)
            await expect(
                nexusCircle.connect(owner).contribute(newPoolId, { value: CONTRIBUTION_AMOUNT })
            ).to.be.revertedWith("Pool must be full (6/6 members) to start contributions");
        });

        it("Should fail to execute payout when not all members contributed", async function () {
            // Only owner contributes (not all members)
            await nexusCircle.connect(owner).contribute(poolId, { value: CONTRIBUTION_AMOUNT });

            // Try to execute payout (should fail)
            await expect(
                nexusCircle.connect(nonMember).executePayout(poolId)
            ).to.be.revertedWith("Not all members have contributed this round");
        });

        it("Should emit ContributionMade and PayoutExecuted events", async function () {
            // Test ContributionMade event
            const contributeTx = await nexusCircle.connect(owner).contribute(
                poolId,
                { value: CONTRIBUTION_AMOUNT }
            );
            await expect(contributeTx)
                .to.emit(nexusCircle, "ContributionMade")
                .withArgs(poolId, owner.address, CONTRIBUTION_AMOUNT, 0);

            // All other members contribute
            for (let i = 1; i < allMembers.length; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Test PayoutExecuted event
            const payoutTx = await nexusCircle.connect(nonMember).executePayout(poolId);
            await expect(payoutTx)
                .to.emit(nexusCircle, "PayoutExecuted");
        });
    });

    // ============================================
    // TASK-029: DEFAULT SCENARIOS TESTS
    // ============================================
    describe("TASK-029: Default Scenarios", function () {
        let poolId;
        let allMembers;

        beforeEach(async function () {
            // Create pool with owner
            await nexusCircle.connect(owner).createPool(
                CONTRIBUTION_AMOUNT,
                { value: COLLATERAL_AMOUNT }
            );
            poolId = 0;

            // Fill pool with 5 more members (6 total)
            await nexusCircle.connect(member1).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member2).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member3).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member4).joinPool(poolId, { value: COLLATERAL_AMOUNT });
            await nexusCircle.connect(member5).joinPool(poolId, { value: COLLATERAL_AMOUNT });

            allMembers = [owner, member1, member2, member3, member4, member5];
        });

        it("Should mark member as defaulted after deadline passes", async function () {
            // Only 5 members contribute (member5 doesn't contribute)
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time by 1 hour + 1 second
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");

            // Check for defaults (use staticCall to get return value)
            const defaultedMembers = await nexusCircle.connect(nonMember).checkForDefaults.staticCall(poolId);

            // Verify member5 is marked as defaulted
            expect(defaultedMembers.length).to.equal(1);
            expect(defaultedMembers[0]).to.equal(member5.address);

            // Actually execute the transaction to mark as defaulted
            await nexusCircle.connect(nonMember).checkForDefaults(poolId);

            // Verify hasDefaulted mapping
            const isDefaulted = await nexusCircle.hasDefaulted(poolId, member5.address);
            expect(isDefaulted).to.equal(true);
        });

        it("Should fail to check for defaults before deadline passes", async function () {
            // Only 5 members contribute
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Try to check for defaults immediately (should fail)
            await expect(
                nexusCircle.connect(nonMember).checkForDefaults(poolId)
            ).to.be.revertedWith("Contribution deadline has not passed yet");
        });

        it("Should liquidate collateral and distribute to remaining members", async function () {
            // Only 5 members contribute (member5 doesn't)
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time past deadline
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");

            // Mark member5 as defaulted
            await nexusCircle.connect(nonMember).checkForDefaults(poolId);

            // Get balances before liquidation
            const balanceBefore = await ethers.provider.getBalance(owner.address);

            // Liquidate member5's collateral
            await nexusCircle.connect(nonMember).liquidateDefaultedMember(poolId, member5.address);

            // Get balances after liquidation
            const balanceAfter = await ethers.provider.getBalance(owner.address);

            // Calculate expected distribution (10 FLR / 5 remaining members = 2 FLR each)
            const expectedDistribution = COLLATERAL_AMOUNT / 5n;

            // Verify owner received their share
            expect(balanceAfter - balanceBefore).to.equal(expectedDistribution);

            // Verify member5's collateral balance is zero
            const member5Collateral = await nexusCircle.collateralBalances(poolId, member5.address);
            expect(member5Collateral).to.equal(0);
        });

        it("Should remove defaulted member from pool", async function () {
            // Only 5 members contribute
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time and mark as defaulted
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");
            await nexusCircle.connect(nonMember).checkForDefaults(poolId);

            // Verify member5 is in pool before liquidation
            let isMember5 = await nexusCircle.checkIsMember(poolId, member5.address);
            expect(isMember5).to.equal(true);

            // Liquidate member5
            await nexusCircle.connect(nonMember).liquidateDefaultedMember(poolId, member5.address);

            // Verify member5 is no longer a member
            isMember5 = await nexusCircle.checkIsMember(poolId, member5.address);
            expect(isMember5).to.equal(false);

            // Verify pool member count decreased
            const poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[4]).to.equal(5); // memberCount reduced to 5
        });

        it("Should allow pool to continue with remaining members after default", async function () {
            // Only 5 members contribute (member5 defaults)
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time, mark as defaulted, and liquidate
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");
            await nexusCircle.connect(nonMember).checkForDefaults(poolId);
            await nexusCircle.connect(nonMember).liquidateDefaultedMember(poolId, member5.address);

            // Verify pool is still active
            let poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[6]).to.equal(true); // isActive

            // Execute payout with 5 members (should succeed)
            await nexusCircle.connect(nonMember).executePayout(poolId);

            // Verify round incremented
            const currentRound = await nexusCircle.getCurrentRound(poolId);
            expect(currentRound).to.equal(1);

            // Pool should continue with 5 members
            poolInfo = await nexusCircle.getPool(poolId);
            expect(poolInfo[4]).to.equal(5); // memberCount
        });

        it("Should emit MemberDefaulted and CollateralLiquidated events", async function () {
            // Only 5 members contribute
            for (let i = 0; i < 5; i++) {
                await nexusCircle.connect(allMembers[i]).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");

            // Test MemberDefaulted event
            const checkDefaultsTx = await nexusCircle.connect(nonMember).checkForDefaults(poolId);
            await expect(checkDefaultsTx)
                .to.emit(nexusCircle, "MemberDefaulted")
                .withArgs(poolId, member5.address, 0);

            // Test CollateralLiquidated event
            const liquidateTx = await nexusCircle.connect(nonMember).liquidateDefaultedMember(poolId, member5.address);
            await expect(liquidateTx)
                .to.emit(nexusCircle, "CollateralLiquidated");
        });

        it("Should return empty array if no members defaulted", async function () {
            // All 6 members contribute
            for (const member of allMembers) {
                await nexusCircle.connect(member).contribute(poolId, { value: CONTRIBUTION_AMOUNT });
            }

            // Fast-forward time
            await ethers.provider.send("evm_increaseTime", [CONTRIBUTION_DEADLINE + 1]);
            await ethers.provider.send("evm_mine");

            // Check for defaults (should return empty array)
            const defaultedMembers = await nexusCircle.connect(nonMember).checkForDefaults.staticCall(poolId);
            expect(defaultedMembers.length).to.equal(0);
        });
    });
});
