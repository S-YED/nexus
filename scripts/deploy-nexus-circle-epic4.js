/**
 * Deploy NexusCircle Contract - Epic 4 Version
 * Includes: Pool creation, member management, contributions, and payouts
 */

const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function main() {
    console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║      NexusCircle Deployment - Epic 4 Version          ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║  Foundation + Core Logic (Contributions & Payouts)    ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    log(`📍 Network: ${hre.network.name}`, colors.yellow);
    log(`👤 Deployer: ${deployer.address}`, colors.cyan);
    log(`💰 Balance: ${hre.ethers.formatEther(balance)} C2FLR\n`, colors.cyan);

    // Check balance
    if (balance < hre.ethers.parseEther("1")) {
        log(`⚠️  WARNING: Low balance! You may need more C2FLR for deployment.`, colors.yellow);
        log(`   Get test tokens from: https://faucet.flare.network/coston2\n`, colors.yellow);
    }

    // Deploy contract
    log(`📦 Deploying NexusCircle contract...`, colors.yellow);

    const NexusCircle = await hre.ethers.getContractFactory("NexusCircle");
    const contract = await NexusCircle.deploy();

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    log(`\n✅ NexusCircle deployed successfully!`, colors.green);
    log(`📍 Contract Address: ${contractAddress}\n`, colors.cyan);

    // Verify deployment and get contract info
    log(`🔍 Verifying deployment...`, colors.yellow);

    const contractInfo = await contract.getContractInfo();
    const [owner, poolCount, deployedAt, maxMembers, collateralPercent] = contractInfo;

    log(`\n${colors.bold}${colors.cyan}Contract Information:${colors.reset}`);
    log(`   Owner: ${owner}`, colors.cyan);
    log(`   Pool Count: ${poolCount}`, colors.cyan);
    log(`   Deployed At: ${new Date(Number(deployedAt) * 1000).toLocaleString()}`, colors.cyan);
    log(`   Max Members Per Pool: ${maxMembers}`, colors.cyan);
    log(`   Collateral Percent: ${collateralPercent}%`, colors.cyan);

    // Update .env file
    log(`\n📝 Updating .env file...`, colors.yellow);

    try {
        const envPath = ".env";
        let envContent = fs.readFileSync(envPath, "utf8");

        // Update or add NEXUS_CIRCLE_ADDRESS
        if (envContent.includes("NEXUS_CIRCLE_ADDRESS=")) {
            envContent = envContent.replace(
                /NEXUS_CIRCLE_ADDRESS=.*/,
                `NEXUS_CIRCLE_ADDRESS=${contractAddress}`
            );
        } else {
            envContent += `\nNEXUS_CIRCLE_ADDRESS=${contractAddress}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        log(`✅ .env file updated with contract address`, colors.green);
    } catch (error) {
        log(`⚠️  Could not update .env file: ${error.message}`, colors.yellow);
        log(`   Please manually add: NEXUS_CIRCLE_ADDRESS=${contractAddress}`, colors.yellow);
    }

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        epic: "Epic 4 - Core Logic",
        features: [
            "Pool creation",
            "Member management (6-person pools)",
            "Monthly contributions",
            "Round-robin payout distribution",
            "Pool completion detection",
            "Member status tracking"
        ],
        constants: {
            maxMembers: Number(maxMembers),
            collateralPercent: Number(collateralPercent)
        }
    };

    const deploymentPath = `deployments/nexus-circle-epic4-${hre.network.name}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    log(`\n📄 Deployment info saved to: ${deploymentPath}`, colors.green);

    // Display next steps
    console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║                   NEXT STEPS                           ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

    log(`1️⃣  View on Coston2 Explorer:`, colors.yellow);
    log(`   https://coston2-explorer.flare.network/address/${contractAddress}\n`, colors.cyan);

    log(`2️⃣  Run comprehensive tests:`, colors.yellow);
    log(`   npx hardhat run scripts/test-nexus-circle-epic4.js --network coston2\n`, colors.cyan);

    log(`3️⃣  Epic 4 Features Ready:`, colors.yellow);
    log(`   ✅ contribute(poolId) - Members make monthly contributions`, colors.green);
    log(`   ✅ executePayout(poolId) - Execute round-robin payout`, colors.green);
    log(`   ✅ Pool completion - Automatic after 6 rounds`, colors.green);
    log(`   ✅ Status tracking - Query contribution and payout status`, colors.green);

    log(`\n4️⃣  Epic 5 Coming Next:`, colors.yellow);
    log(`   ⏭️  Collateral deposits (10% on join)`, colors.cyan);
    log(`   ⏭️  FTSO integration for collateral valuation`, colors.cyan);
    log(`   ⏭️  Default detection with deadlines`, colors.cyan);
    log(`   ⏭️  Collateral liquidation`, colors.cyan);

    log(`\n${colors.bold}${colors.green}🚀 Deployment complete! NexusCircle Epic 4 is ready for testing.${colors.reset}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
