const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Test Script for NexusCircle ROSCA Contract
 *
 * Epic 3: ROSCA Smart Contract - Foundation
 *
 * Tests:
 * 1. Contract information query
 * 2. Create a new pool
 * 3. Query pool details
 * 4. Join pool with second wallet
 * 5. Verify member count and pool status
 */

async function main() {
    console.log("\n================================================");
    console.log("🧪 TESTING NEXUS CIRCLE CONTRACT");
    console.log("================================================\n");

    const contractAddress = process.env.NEXUS_CIRCLE_ADDRESS;

    if (!contractAddress) {
        console.error("❌ ERROR: NEXUS_CIRCLE_ADDRESS not found in .env file");
        console.error("   Please deploy the contract first and add the address to .env\n");
        process.exit(1);
    }

    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network: Flare Coston2 Testnet");
    console.log("🔗 Explorer:", `https://coston2-explorer.flare.network/address/${contractAddress}\n`);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("👤 Test Account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "C2FLR\n");

    // Get contract instance
    const NexusCircle = await ethers.getContractFactory("NexusCircle");
    const nexusCircle = NexusCircle.attach(contractAddress);

    let testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // ============================================
    // TEST 1: Get Contract Information
    // ============================================
    console.log("================================================");
    console.log("TEST 1: Get Contract Information");
    console.log("================================================\n");

    try {
        const contractInfo = await nexusCircle.getContractInfo();

        console.log("✅ Contract Owner:", contractInfo[0]);
        console.log("✅ Total Pools:", contractInfo[1].toString());
        console.log("✅ Deployment Time:", new Date(Number(contractInfo[2]) * 1000).toLocaleString());
        console.log("✅ Max Members per Pool:", contractInfo[3].toString());
        console.log("✅ Collateral Percentage:", contractInfo[4].toString() + "%");

        testResults.passed++;
        testResults.tests.push({ name: "Get Contract Information", status: "✅ PASSED" });
        console.log("\n✅ TEST 1 PASSED\n");
    } catch (error) {
        console.error("❌ TEST 1 FAILED:", error.message, "\n");
        testResults.failed++;
        testResults.tests.push({ name: "Get Contract Information", status: "❌ FAILED" });
    }

    // ============================================
    // TEST 2: Create a New Pool
    // ============================================
    console.log("================================================");
    console.log("TEST 2: Create a New Pool");
    console.log("================================================\n");

    const contributionAmount = ethers.parseEther("100"); // 100 FLR per month
    console.log("📝 Creating pool with contribution amount:", ethers.formatEther(contributionAmount), "FLR");

    try {
        const tx = await nexusCircle.createPool(contributionAmount);
        console.log("⏳ Transaction hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("   Block Number:", receipt.blockNumber);
        console.log("   Gas Used:", receipt.gasUsed.toString());

        // Get pool ID from event
        const event = receipt.logs.find(log => {
            try {
                const parsedLog = nexusCircle.interface.parseLog(log);
                return parsedLog && parsedLog.name === 'PoolCreated';
            } catch {
                return false;
            }
        });

        let poolId = 0;
        if (event) {
            const parsedEvent = nexusCircle.interface.parseLog(event);
            poolId = parsedEvent.args[0];
            console.log("✅ Pool Created!");
            console.log("   Pool ID:", poolId.toString());
            console.log("   Creator:", parsedEvent.args[1]);
            console.log("   Contribution Amount:", ethers.formatEther(parsedEvent.args[2]), "FLR");
        }

        testResults.passed++;
        testResults.tests.push({ name: "Create Pool", status: "✅ PASSED", poolId: poolId.toString() });
        console.log("\n✅ TEST 2 PASSED\n");

        // Store poolId for subsequent tests
        global.testPoolId = poolId;

    } catch (error) {
        console.error("❌ TEST 2 FAILED:", error.message, "\n");
        testResults.failed++;
        testResults.tests.push({ name: "Create Pool", status: "❌ FAILED" });
        return; // Exit if pool creation fails
    }

    // ============================================
    // TEST 3: Query Pool Details
    // ============================================
    console.log("================================================");
    console.log("TEST 3: Query Pool Details");
    console.log("================================================\n");

    const poolId = global.testPoolId;
    console.log("📝 Querying pool ID:", poolId.toString());

    try {
        const poolInfo = await nexusCircle.getPool(poolId);

        console.log("✅ Pool Information:");
        console.log("   Pool ID:", poolInfo[0].toString());
        console.log("   Max Members:", poolInfo[1].toString());
        console.log("   Contribution Amount:", ethers.formatEther(poolInfo[2]), "FLR");
        console.log("   Collateral Percent:", poolInfo[3].toString() + "%");
        console.log("   Member Count:", poolInfo[4].toString());
        console.log("   Current Round:", poolInfo[5].toString());
        console.log("   Is Active:", poolInfo[6]);
        console.log("   Created At:", new Date(Number(poolInfo[7]) * 1000).toLocaleString());
        console.log("   Creator:", poolInfo[8]);

        // Get pool members
        const members = await nexusCircle.getPoolMembers(poolId);
        console.log("\n✅ Pool Members (" + members.length + "/6):");
        members.forEach((member, index) => {
            console.log(`   ${index + 1}. ${member}`);
        });

        // Check if pool is full
        const isFull = await nexusCircle.isPoolFull(poolId);
        console.log("\n✅ Pool Status:");
        console.log("   Is Full:", isFull);
        console.log("   Available Slots:", (6 - members.length));

        testResults.passed++;
        testResults.tests.push({ name: "Query Pool Details", status: "✅ PASSED" });
        console.log("\n✅ TEST 3 PASSED\n");

    } catch (error) {
        console.error("❌ TEST 3 FAILED:", error.message, "\n");
        testResults.failed++;
        testResults.tests.push({ name: "Query Pool Details", status: "❌ FAILED" });
    }

    // ============================================
    // TEST 4: Try to Join Pool (Should Fail - Already Member)
    // ============================================
    console.log("================================================");
    console.log("TEST 4: Try to Join Pool (Negative Test)");
    console.log("================================================\n");

    console.log("📝 Attempting to join pool as creator (should fail)...");

    try {
        const tx = await nexusCircle.joinPool(poolId);
        await tx.wait();

        // If we reach here, the test failed (it should have reverted)
        console.error("❌ TEST 4 FAILED: Transaction should have reverted but succeeded\n");
        testResults.failed++;
        testResults.tests.push({ name: "Join Pool (Negative Test)", status: "❌ FAILED" });

    } catch (error) {
        if (error.message.includes("Already a member")) {
            console.log("✅ Expected Error:", error.message.split('(')[0]);
            console.log("✅ Validation working correctly - cannot join pool twice");
            testResults.passed++;
            testResults.tests.push({ name: "Join Pool (Negative Test)", status: "✅ PASSED" });
            console.log("\n✅ TEST 4 PASSED\n");
        } else {
            console.error("❌ TEST 4 FAILED: Unexpected error:", error.message, "\n");
            testResults.failed++;
            testResults.tests.push({ name: "Join Pool (Negative Test)", status: "❌ FAILED" });
        }
    }

    // ============================================
    // TEST 5: Verify Pool Count
    // ============================================
    console.log("================================================");
    console.log("TEST 5: Verify Pool Count");
    console.log("================================================\n");

    try {
        const poolCount = await nexusCircle.poolCount();
        console.log("✅ Total Pools Created:", poolCount.toString());

        if (poolCount > 0n) {
            console.log("✅ Pool counter working correctly");
            testResults.passed++;
            testResults.tests.push({ name: "Verify Pool Count", status: "✅ PASSED" });
            console.log("\n✅ TEST 5 PASSED\n");
        } else {
            console.error("❌ Pool count is 0, expected > 0");
            testResults.failed++;
            testResults.tests.push({ name: "Verify Pool Count", status: "❌ FAILED" });
            console.log("\n❌ TEST 5 FAILED\n");
        }

    } catch (error) {
        console.error("❌ TEST 5 FAILED:", error.message, "\n");
        testResults.failed++;
        testResults.tests.push({ name: "Verify Pool Count", status: "❌ FAILED" });
    }

    // ============================================
    // TEST 6: Verify Member Status
    // ============================================
    console.log("================================================");
    console.log("TEST 6: Verify Member Status");
    console.log("================================================\n");

    try {
        const isMemberResult = await nexusCircle.checkIsMember(poolId, signer.address);
        console.log("✅ Creator is member:", isMemberResult);

        // Check a random address (should be false)
        const randomAddress = "0x0000000000000000000000000000000000000001";
        const isRandomMember = await nexusCircle.checkIsMember(poolId, randomAddress);
        console.log("✅ Random address is member:", isRandomMember);

        if (isMemberResult && !isRandomMember) {
            console.log("✅ Member checking working correctly");
            testResults.passed++;
            testResults.tests.push({ name: "Verify Member Status", status: "✅ PASSED" });
            console.log("\n✅ TEST 6 PASSED\n");
        } else {
            console.error("❌ Member status check failed");
            testResults.failed++;
            testResults.tests.push({ name: "Verify Member Status", status: "❌ FAILED" });
            console.log("\n❌ TEST 6 FAILED\n");
        }

    } catch (error) {
        console.error("❌ TEST 6 FAILED:", error.message, "\n");
        testResults.failed++;
        testResults.tests.push({ name: "Verify Member Status", status: "❌ FAILED" });
    }

    // ============================================
    // TEST SUMMARY
    // ============================================
    console.log("================================================");
    console.log("📊 TEST SUMMARY");
    console.log("================================================\n");

    console.log("Total Tests:", testResults.passed + testResults.failed);
    console.log("✅ Passed:", testResults.passed);
    console.log("❌ Failed:", testResults.failed);
    console.log("Success Rate:", Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100) + "%");

    console.log("\nDetailed Results:");
    testResults.tests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}: ${test.status}`);
    });

    console.log("\n================================================");

    if (testResults.failed === 0) {
        console.log("🎉 ALL TESTS PASSED! 🎉");
        console.log("================================================\n");
        console.log("✅ NexusCircle contract is working correctly!");
        console.log("✅ Pool creation successful");
        console.log("✅ Pool queries working");
        console.log("✅ Member validation working");
        console.log("\n📖 Next Steps:");
        console.log("1. Test joining pool with a different wallet");
        console.log("2. Continue to Epic 4: Implement contribute() and executePayout()");
        console.log("3. Epic 5: Add collateral deposits and FTSO integration\n");
    } else {
        console.log("⚠️  SOME TESTS FAILED");
        console.log("================================================\n");
        console.log("Please review the errors above and fix the issues.\n");
    }

    console.log("Contract Address:", contractAddress);
    console.log("Block Explorer:", `https://coston2-explorer.flare.network/address/${contractAddress}\n`);
}

// Execute tests
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
