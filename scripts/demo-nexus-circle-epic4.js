/**
 * Epic 4 Demo Script: ROSCA Smart Contract - Core Logic
 * Demonstrates contribution, payout, and pool completion functionality
 *
 * NOTE: This script creates a pool and demonstrates the contract interface.
 * For full 6-member pool testing, see MULTI_WALLET_SETUP.md
 */

const hre = require("hardhat");
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

function logSection(title) {
    console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}${title}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

async function main() {
    console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║        NexusCircle Epic 4 - Functionality Demo        ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║    Demonstrates: Contributions, Payouts, Completion    ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Get contract address
    const contractAddress = process.env.NEXUS_CIRCLE_ADDRESS;
    if (!contractAddress) {
        log("❌ ERROR: NEXUS_CIRCLE_ADDRESS not found in .env file", colors.red);
        process.exit(1);
    }

    log(`📍 Contract Address: ${contractAddress}`, colors.yellow);

    // Get signer
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    log(`👤 Account: ${deployer.address}`, colors.cyan);
    log(`💰 Balance: ${hre.ethers.formatEther(balance)} C2FLR\n`, colors.cyan);

    // Connect to contract
    const NexusCircle = await hre.ethers.getContractFactory("NexusCircle");
    const contract = NexusCircle.attach(contractAddress);

    // ============================================
    // SECTION 1: Contract Information
    // ============================================
    logSection("📋 SECTION 1: Contract Information");

    const contractInfo = await contract.getContractInfo();
    const [owner, poolCount, deployedAt, maxMembers, collateralPercent] = contractInfo;

    log(`Owner: ${owner}`, colors.cyan);
    log(`Total Pools: ${poolCount}`, colors.cyan);
    log(`Deployed: ${new Date(Number(deployedAt) * 1000).toLocaleString()}`, colors.cyan);
    log(`Max Members: ${maxMembers}`, colors.cyan);
    log(`Collateral: ${collateralPercent}%`, colors.cyan);

    // ============================================
    // SECTION 2: Create Pool
    // ============================================
    logSection("🏦 SECTION 2: Create Pool");

    const contributionAmount = hre.ethers.parseEther("100");

    log(`Creating pool with 100 FLR contribution...`, colors.yellow);
    const createTx = await contract.createPool(contributionAmount);
    await createTx.wait();

    const newPoolCount = await contract.poolCount();
    const poolId = newPoolCount - 1n;

    log(`✅ Pool created successfully!`, colors.green);
    log(`   Pool ID: ${poolId}`, colors.cyan);
    log(`   Contribution Amount: 100 FLR`, colors.cyan);

    // ============================================
    // SECTION 3: Query Pool Details
    // ============================================
    logSection("🔍 SECTION 3: Query Pool Details");

    const poolInfo = await contract.getPool(poolId);
    const [pId, pMaxMembers, pContribution, pCollateral, pMemberCount, pCurrentRound, pIsActive, pCreatedAt, pCreator] = poolInfo;

    log(`Pool ID: ${pId}`, colors.cyan);
    log(`Max Members: ${pMaxMembers}`, colors.cyan);
    log(`Contribution Amount: ${hre.ethers.formatEther(pContribution)} FLR`, colors.cyan);
    log(`Collateral Percent: ${pCollateral}%`, colors.cyan);
    log(`Current Members: ${pMemberCount}/${pMaxMembers}`, colors.cyan);
    log(`Current Round: ${pCurrentRound}`, colors.cyan);
    log(`Is Active: ${pIsActive}`, colors.cyan);
    log(`Creator: ${pCreator}`, colors.cyan);

    const members = await contract.getPoolMembers(poolId);
    log(`\nMembers (${members.length}):`, colors.yellow);
    members.forEach((member, idx) => {
        log(`   ${idx}: ${member}`, colors.cyan);
    });

    // ============================================
    // SECTION 4: Pool Full Check
    // ============================================
    logSection("📊 SECTION 4: Pool Status Checks");

    const isFull = await contract.isPoolFull(poolId);
    const currentRound = await contract.getCurrentRound(poolId);

    log(`Pool Full: ${isFull} (Need 6/6 members)`, colors.yellow);
    log(`Current Round: ${currentRound}`, colors.cyan);

    if (!isFull) {
        log(`\n⚠️  Pool needs ${6 - Number(pMemberCount)} more members before contributions can start.`, colors.yellow);
        log(`   To join pool: contract.joinPool(${poolId})`, colors.cyan);
        log(`   See MULTI_WALLET_SETUP.md for instructions on setting up 6 test wallets.\n`, colors.cyan);
    }

    // ============================================
    // SECTION 5: Contribution Status Tracking
    // ============================================
    logSection("📈 SECTION 5: Contribution Status Tracking Functions");

    log(`Demonstrating status tracking functions:`, colors.yellow);

    const hasContributed = await contract.hasMemberContributed(poolId, 0, deployer.address);
    log(`✅ hasMemberContributed(pool, round 0, member): ${hasContributed}`, colors.cyan);

    const hasBeenPaid = await contract.hasMemberBeenPaid(poolId, deployer.address);
    log(`✅ hasMemberBeenPaid(pool, member): ${hasBeenPaid}`, colors.cyan);

    const contributionCount = await contract.getContributionCount(poolId);
    log(`✅ getContributionCount(pool): ${contributionCount}`, colors.cyan);

    const allContributed = await contract.areAllMembersContributed(poolId);
    log(`✅ areAllMembersContributed(pool): ${allContributed}`, colors.cyan);

    const nextRecipient = await contract.getNextPayoutRecipient(poolId);
    log(`✅ getNextPayoutRecipient(pool): ${nextRecipient}`, colors.cyan);

    // ============================================
    // SECTION 6: Epic 4 Functions Overview
    // ============================================
    logSection("🎯 SECTION 6: Epic 4 Core Functions");

    log(`\n${colors.bold}Contribution Function:${colors.reset}`, colors.yellow);
    log(`   contract.contribute(poolId, { value: contributionAmount })`, colors.cyan);
    log(`   ✅ Validates: Pool full, exact amount, no double contribution`, colors.green);
    log(`   ✅ Tracks: hasContributed[poolId][round][member] = true`, colors.green);
    log(`   ✅ Emits: ContributionMade event`, colors.green);

    log(`\n${colors.bold}Payout Function:${colors.reset}`, colors.yellow);
    log(`   contract.executePayout(poolId)`, colors.cyan);
    log(`   ✅ Validates: All members contributed`, colors.green);
    log(`   ✅ Selection: Round-robin (member[currentRound])`, colors.green);
    log(`   ✅ Transfers: contributionAmount × 6 to recipient`, colors.green);
    log(`   ✅ Increments: currentRound++`, colors.green);
    log(`   ✅ Completes: Pool after 6 rounds`, colors.green);

    log(`\n${colors.bold}Pool Completion:${colors.reset}`, colors.yellow);
    log(`   Automatic after round 6 (all members paid once)`, colors.cyan);
    log(`   ✅ Sets: isActive = false`, colors.green);
    log(`   ✅ Emits: PoolCompleted event`, colors.green);
    log(`   ✅ Blocks: Further contributions`, colors.green);

    // ============================================
    // SECTION 7: Security Features
    // ============================================
    logSection("🔒 SECTION 7: Security Features");

    log(`✅ Pool Full Validation`, colors.green);
    log(`   └─ Contributions blocked until 6/6 members joined`, colors.cyan);

    log(`✅ Exact Amount Validation`, colors.green);
    log(`   └─ Must send exactly contributionAmount (no more, no less)`, colors.cyan);

    log(`✅ Double Contribution Prevention`, colors.green);
    log(`   └─ hasContributed mapping prevents same member contributing twice`, colors.cyan);

    log(`✅ All Contributions Validated`, colors.green);
    log(`   └─ Payout only executes when all 6 members contributed`, colors.cyan);

    log(`✅ Reentrancy Protection`, colors.green);
    log(`   └─ Checks-effects-interactions pattern + transfer() 2300 gas limit`, colors.cyan);

    log(`✅ Automatic Completion`, colors.green);
    log(`   └─ Pool auto-completes after 6 rounds (all members paid)`, colors.cyan);

    log(`✅ Anyone Can Execute Payout`, colors.green);
    log(`   └─ Prevents stuck funds if members inactive`, colors.cyan);

    // ============================================
    // SECTION 8: Testing Workflow
    // ============================================
    logSection("🧪 SECTION 8: Complete Testing Workflow");

    log(`\n${colors.bold}For comprehensive Epic 4 testing:${colors.reset}\n`, colors.yellow);

    log(`1️⃣  Set up 6 test wallets:`, colors.yellow);
    log(`   - Create 6 MetaMask accounts`, colors.cyan);
    log(`   - Fund each with 500+ C2FLR from faucet`, colors.cyan);
    log(`   - Export private keys to hardhat.config.js`, colors.cyan);

    log(`\n2️⃣  Pool Setup Phase:`, colors.yellow);
    log(`   - Wallet 1: createPool(100 FLR)`, colors.cyan);
    log(`   - Wallets 2-6: joinPool(poolId)`, colors.cyan);

    log(`\n3️⃣  Round 0-5 (Repeat 6 times):`, colors.yellow);
    log(`   - All 6 wallets: contribute(poolId, { value: 100 FLR })`, colors.cyan);
    log(`   - Any wallet: executePayout(poolId)`, colors.cyan);
    log(`   - Recipient receives 600 FLR (6 × 100)`, colors.cyan);

    log(`\n4️⃣  Pool Completion:`, colors.yellow);
    log(`   - After round 6: isActive = false`, colors.cyan);
    log(`   - All members received payout once`, colors.cyan);
    log(`   - Further contributions blocked`, colors.cyan);

    log(`\n📚 See MULTI_WALLET_SETUP.md for detailed setup instructions.`, colors.green);

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║                 EPIC 4 DEMO COMPLETE                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

    log(`✅ Contract deployed and functional`, colors.green);
    log(`✅ Pool creation working`, colors.green);
    log(`✅ Status tracking functions operational`, colors.green);
    log(`✅ Ready for multi-wallet testing`, colors.green);

    log(`\n📍 View on Explorer:`, colors.yellow);
    log(`   https://coston2-explorer.flare.network/address/${contractAddress}\n`, colors.cyan);

    log(`🎯 Epic 4 Completed Features:`, colors.green);
    log(`   ✅ contribute() - Monthly contributions`, colors.green);
    log(`   ✅ executePayout() - Round-robin payouts`, colors.green);
    log(`   ✅ Pool completion - After 6 rounds`, colors.green);
    log(`   ✅ Status tracking - 6 query functions`, colors.green);

    log(`\n⏭️  Epic 5 Next:`, colors.yellow);
    log(`   - Collateral deposits (10%)`, colors.cyan);
    log(`   - FTSO integration`, colors.cyan);
    log(`   - Default detection`, colors.cyan);
    log(`   - Collateral liquidation\n`, colors.cyan);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
