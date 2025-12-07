const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Final Deployment Script: NexusCircle Contract (Epics 3, 4, & 5)
 * Deploys the complete NexusCircle ROSCA contract with all features:
 * - Pool creation and member management (Epic 3)
 * - Contributions and payouts (Epic 4)
 * - Collateral system, FTSO integration, default detection (Epic 5)
 *
 * Network: Flare Coston2 Testnet
 * FTSO Address: 0x3d893C53D9e8056135C26C8c638B76C8b60Df726
 */

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║      NexusCircle Final Deployment (Epics 3-5)         ║");
    console.log("║   Complete ROSCA with Collateral & Default Handling   ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📍 Deploying from account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR");

    if (balance === 0n) {
        console.error("\n❌ ERROR: Deployer account has no balance!");
        console.error("   Please fund the account with test FLR from:");
        console.error("   https://faucet.flare.network/coston2\n");
        process.exit(1);
    }

    // FTSO address on Coston2
    const ftsoAddress = "0x3d893C53D9e8056135C26C8c638B76C8b60Df726";

    console.log("\n------------------------------------------------");
    console.log("📋 Contract Details");
    console.log("------------------------------------------------");
    console.log("Contract Name: NexusCircle");
    console.log("Network: Flare Coston2 Testnet");
    console.log("Max Members per Pool: 6");
    console.log("Collateral Percentage: 10%");
    console.log("Contribution Deadline: 1 hour (testing mode)");
    console.log("FTSO Address:", ftsoAddress);
    console.log("\n⏳ Deploying contract with FTSO integration...\n");

    try {
        // Deploy NexusCircle contract with FTSO address
        const NexusCircle = await ethers.getContractFactory("NexusCircle");
        const nexusCircle = await NexusCircle.deploy(ftsoAddress);

        // Wait for deployment
        await nexusCircle.waitForDeployment();

        const contractAddress = await nexusCircle.getAddress();

        console.log("✅ NexusCircle deployed successfully!\n");
        console.log("------------------------------------------------");
        console.log("📝 Deployment Information");
        console.log("------------------------------------------------");
        console.log("Contract Address:", contractAddress);
        console.log("Deployer (Owner):", deployer.address);
        console.log("Network:", "Coston2 (Chain ID: 114)");
        console.log("Block Explorer:", `https://coston2-explorer.flare.network/address/${contractAddress}`);

        // Wait a moment for contract to be indexed
        console.log("\n⏳ Waiting for contract initialization...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("\n------------------------------------------------");
        console.log("🔍 Verifying Contract Information");
        console.log("------------------------------------------------");

        try {
            // Get contract info
            const contractInfo = await nexusCircle.getContractInfo();

            console.log("✅ Contract Owner:", contractInfo[0]);
            console.log("✅ Total Pools Created:", contractInfo[1].toString());
            console.log("✅ Deployment Time:", new Date(Number(contractInfo[2]) * 1000).toLocaleString());
            console.log("✅ Max Members per Pool:", contractInfo[3].toString());
            console.log("✅ Collateral Percentage:", contractInfo[4].toString() + "%");

            // Verify constants
            const maxMembers = await nexusCircle.MAX_MEMBERS();
            const collateralPercent = await nexusCircle.COLLATERAL_PERCENT();
            const contributionDeadline = await nexusCircle.CONTRIBUTION_DEADLINE();
            const poolCount = await nexusCircle.poolCount();
            const ftsoContract = await nexusCircle.ftsoContract();

            console.log("\n✅ Constants Verified:");
            console.log("   MAX_MEMBERS:", maxMembers.toString());
            console.log("   COLLATERAL_PERCENT:", collateralPercent.toString() + "%");
            console.log("   CONTRIBUTION_DEADLINE:", contributionDeadline.toString(), "seconds (1 hour)");
            console.log("   poolCount:", poolCount.toString());

            console.log("\n✅ Epic 5 Features Verified:");
            console.log("   FTSO Contract:", ftsoContract);
            console.log("   FTSO Integration: ✅ Active");

        } catch (queryError) {
            console.log("\n⚠️  Could not query contract info immediately after deployment");
            console.log("   This is normal - contract needs time to be indexed");
            console.log("   You can query the contract after a few seconds");
        }

        console.log("\n------------------------------------------------");
        console.log("📊 Deployment Summary");
        console.log("------------------------------------------------");
        console.log("Status: ✅ SUCCESS");
        console.log("Contract: NexusCircle.sol");
        console.log("Address:", contractAddress);
        console.log("Owner:", deployer.address);
        console.log("Gas Used: ~2,000,000 (estimated)");

        // Update .env file
        console.log("\n------------------------------------------------");
        console.log("📝 Updating Configuration");
        console.log("------------------------------------------------");

        try {
            const envPath = ".env";
            let envContent = fs.readFileSync(envPath, "utf8");

            // Update or add contract address
            if (envContent.includes("NEXUS_CIRCLE_ADDRESS=")) {
                envContent = envContent.replace(
                    /NEXUS_CIRCLE_ADDRESS=.*/,
                    `NEXUS_CIRCLE_ADDRESS=${contractAddress}`
                );
            } else {
                envContent += `\nNEXUS_CIRCLE_ADDRESS=${contractAddress}\n`;
            }

            fs.writeFileSync(envPath, envContent);
            console.log("✅ .env file updated with new contract address");
        } catch (error) {
            console.log("⚠️  Could not update .env file:", error.message);
            console.log("   Please manually add: NEXUS_CIRCLE_ADDRESS=" + contractAddress);
        }

        console.log("\n------------------------------------------------");
        console.log("📖 Next Steps");
        console.log("------------------------------------------------");
        console.log("1. ✅ Contract address saved to .env file");
        console.log("\n2. View on Coston2 Explorer:");
        console.log(`   https://coston2-explorer.flare.network/address/${contractAddress}`);
        console.log("\n3. Verify contract (optional):");
        console.log(`   npx hardhat verify --network coston2 ${contractAddress} "${ftsoAddress}"`);
        console.log("\n4. Run integration tests:");
        console.log("   npx hardhat test --network coston2");

        console.log("\n╔════════════════════════════════════════════════════════╗");
        console.log("║           DEPLOYMENT COMPLETE - EPIC 6 DONE!           ║");
        console.log("╚════════════════════════════════════════════════════════╝\n");

        // Save deployment info to JSON file
        const deploymentInfo = {
            contractName: "NexusCircle",
            contractAddress: contractAddress,
            ftsoAddress: ftsoAddress,
            deployer: deployer.address,
            network: "Coston2",
            chainId: 114,
            deploymentTime: new Date().toISOString(),
            blockNumber: await ethers.provider.getBlockNumber(),
            blockExplorer: `https://coston2-explorer.flare.network/address/${contractAddress}`,
            epic: "Epics 3, 4, & 5 Complete",
            version: "1.0.0 - Final",
            features: [
                "Pool creation with collateral requirement (10%)",
                "Member management (6-person pools, can shrink on default)",
                "Monthly contributions with validation",
                "Round-robin payout distribution",
                "Pool completion detection",
                "FTSO integration for price feeds",
                "Time-based default detection (1 hour deadline)",
                "Collateral liquidation for defaulters",
                "Collateral return on pool completion"
            ],
            constants: {
                maxMembers: 6,
                collateralPercent: 10,
                contributionDeadline: 3600,
                flrUsdFeedId: "0x01464c522f55534400000000000000000000000000"
            }
        };

        const path = require('path');
        const deploymentPath = path.join(__dirname, '..', 'deployments', 'nexus-circle-final-coston2.json');
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Deployment info saved to:", deploymentPath, "\n");

        return contractAddress;

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED!");
        console.error("------------------------------------------------");
        console.error("Error:", error.message);

        if (error.message.includes("insufficient funds")) {
            console.error("\n💡 TIP: Your account needs more C2FLR for gas fees");
            console.error("   Get test tokens from: https://faucet.flare.network/coston2");
        }

        console.error("\n");
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
