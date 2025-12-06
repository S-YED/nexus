const hre = require("hardhat");

async function main() {
  console.log("=".repeat(70));
  console.log("Deploying FTSOPriceReader Contract to Flare Coston2");
  console.log("Epic 2: FTSO Price Feed Integration");
  console.log("=".repeat(70));

  try {
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("\n📝 Deployment Information:");
    console.log("   Deployer address:", deployer.address);

    // Get balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("   Account balance:", hre.ethers.formatEther(balance), "C2FLR");

    // Check if balance is sufficient
    if (balance === 0n) {
      console.log("\n❌ ERROR: Insufficient balance!");
      console.log("   Please get test tokens from: https://faucet.flare.network/coston2");
      console.log("   Your address:", deployer.address);
      return;
    }

    console.log("\n🔧 Contract Configuration:");
    console.log("   Flare Contract Registry: 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019");
    console.log("   FLR/USD Feed ID: 0x01464c522f55534400000000000000000000000000");

    console.log("\n🚀 Deploying FTSOPriceReader contract...");

    // Deploy the contract
    const FTSOPriceReader = await hre.ethers.getContractFactory("FTSOPriceReader");
    const ftsoReader = await FTSOPriceReader.deploy();

    await ftsoReader.waitForDeployment();
    const address = await ftsoReader.getAddress();

    console.log("\n✅ FTSOPriceReader deployed successfully!");
    console.log("   Contract address:", address);
    console.log("   Transaction hash:", ftsoReader.deploymentTransaction().hash);

    // Wait a moment for the transaction to be fully processed
    console.log("\n⏳ Waiting for contract initialization...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test the contract - Get contract info
    console.log("\n🧪 Testing contract functionality...");
    console.log("\n1️⃣ Getting contract information...");
    try {
      const info = await ftsoReader.getContractInfo();
      console.log("   ✓ Owner:", info[0]);
      console.log("   ✓ FTSO v2 Address:", info[1]);
      console.log("   ✓ Deployment Time:", new Date(Number(info[2]) * 1000).toLocaleString());
    } catch (error) {
      console.log("   ⚠️  Contract info query failed (contract may need time to initialize)");
      console.log("   Error:", error.message.split('\n')[0]);
    }

    // Try to query FLR/USD price
    console.log("\n2️⃣ Querying FLR/USD price from FTSO...");
    try {
      const tx = await ftsoReader.getFlrUsdPrice();
      const receipt = await tx.wait();

      // Parse the PriceQueried event
      const priceQueriedEvent = receipt.logs.find(log => {
        try {
          const parsed = ftsoReader.interface.parseLog(log);
          return parsed && parsed.name === 'PriceQueried';
        } catch {
          return false;
        }
      });

      if (priceQueriedEvent) {
        const parsed = ftsoReader.interface.parseLog(priceQueriedEvent);
        const value = parsed.args.value;
        const decimals = parsed.args.decimals;
        const timestamp = parsed.args.timestamp;

        // Calculate actual USD price
        const decimalPlaces = Number(decimals);
        let priceUsd;
        if (decimalPlaces >= 0) {
          priceUsd = Number(value) / Math.pow(10, decimalPlaces);
        } else {
          priceUsd = Number(value) * Math.pow(10, Math.abs(decimalPlaces));
        }

        console.log("   ✓ Raw Value:", value.toString());
        console.log("   ✓ Decimals:", decimals.toString());
        console.log("   ✓ Price:", `$${priceUsd.toFixed(6)} USD`);
        console.log("   ✓ Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());
        console.log("   ✓ Last Updated:", Math.floor((Date.now() / 1000 - Number(timestamp)) / 60), "minutes ago");
      } else {
        console.log("   ℹ️  Price query transaction sent but event not found in logs");
        console.log("   This is normal - you can verify on the block explorer");
      }
    } catch (error) {
      console.log("   ⚠️  Live price query encountered an issue:");
      console.log("   Error:", error.message.split('\n')[0]);
      console.log("   ℹ️  You can still query the price manually on the block explorer");
    }

    // Try formatted price query
    console.log("\n3️⃣ Testing formatted USD conversion...");
    try {
      const formattedResult = await ftsoReader.getFlrUsdPriceFormatted();
      const receipt = await formattedResult.wait();

      // Try to extract return values from transaction
      console.log("   ✓ Formatted price query transaction sent");
      console.log("   ✓ Transaction hash:", receipt.hash);
    } catch (error) {
      console.log("   ⚠️  Formatted price query pending");
      console.log("   You can test this function on the block explorer");
    }

    // Test FLR to USD conversion
    console.log("\n4️⃣ Testing FLR to USD conversion (100 FLR)...");
    try {
      const flrAmount = hre.ethers.parseEther("100"); // 100 FLR
      const conversionResult = await ftsoReader.convertFlrToUsd(flrAmount);
      const receipt = await conversionResult.wait();

      console.log("   ✓ Conversion transaction sent");
      console.log("   ✓ Transaction hash:", receipt.hash);
      console.log("   ℹ️  Check block explorer for conversion result");
    } catch (error) {
      console.log("   ⚠️  Conversion query pending");
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Epic 2 Deployment Complete!");
    console.log("=".repeat(70));

    console.log("\n📋 Next Steps:");
    console.log("\n   1. View contract on Explorer:");
    console.log("      https://coston2-explorer.flare.network/address/" + address);

    console.log("\n   2. Test on Block Explorer:");
    console.log("      a) Go to 'Contract' → 'Read Contract'");
    console.log("      b) Try 'getFlrUsdPrice()' to see current FLR/USD price");
    console.log("      c) Try 'convertFlrToUsd(100000000000000000000)' to convert 100 FLR");
    console.log("      d) Try 'getContractInfo()' to verify deployment");

    console.log("\n   3. Update your .env file:");
    console.log("      FTSO_PRICE_READER_ADDRESS=" + address);

    console.log("\n   4. Available Functions:");
    console.log("      • getFlrUsdPrice() - Get current FLR/USD price");
    console.log("      • getFlrUsdPriceFormatted() - Get price in 18-decimal format");
    console.log("      • convertFlrToUsd(flrAmount) - Convert FLR to USD");
    console.log("      • getPriceByFeedId(feedId) - Query any FTSO feed");
    console.log("      • getContractInfo() - Get contract details");

    console.log("\n   5. Feed IDs Available:");
    console.log("      • FLR/USD: 0x01464c522f55534400000000000000000000000000");
    console.log("      • BTC/USD: 0x014254432f55534400000000000000000000000000");
    console.log("      • ETH/USD: 0x014554482f55534400000000000000000000000000");
    console.log("      • XRP/USD: 0x015852502f55534400000000000000000000000000");

    console.log("\n   6. Ready for Epic 3:");
    console.log("      ROSCA Smart Contract - Foundation");

    console.log("\n" + "=".repeat(70));

    // Save deployment info
    const deploymentInfo = {
      network: "coston2",
      contractName: "FTSOPriceReader",
      address: address,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: ftsoReader.deploymentTransaction().hash,
      ftsoV2AddressSource: "FlareContractRegistry",
      flrUsdFeedId: "0x01464c522f55534400000000000000000000000000",
    };

    console.log("\n💾 Deployment Info (save this):");
    console.log(JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
