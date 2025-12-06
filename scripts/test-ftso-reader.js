const hre = require("hardhat");

/**
 * Test script for FTSOPriceReader contract
 * Run after deployment to verify functionality
 * Usage: npx hardhat run scripts/test-ftso-reader.js --network coston2
 */

async function main() {
  console.log("=".repeat(70));
  console.log("Testing FTSOPriceReader Contract");
  console.log("=".repeat(70));

  // Contract address - UPDATE THIS after deployment
  const FTSO_READER_ADDRESS = process.env.FTSO_PRICE_READER_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  if (FTSO_READER_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.log("\n❌ ERROR: Please set FTSO_PRICE_READER_ADDRESS in .env file");
    console.log("   Add this line to your .env:");
    console.log("   FTSO_PRICE_READER_ADDRESS=<your_deployed_contract_address>");
    return;
  }

  try {
    const [tester] = await hre.ethers.getSigners();
    console.log("\n📝 Test Information:");
    console.log("   Tester address:", tester.address);
    console.log("   Contract address:", FTSO_READER_ADDRESS);

    // Get contract instance
    const FTSOPriceReader = await hre.ethers.getContractFactory("FTSOPriceReader");
    const ftsoReader = FTSOPriceReader.attach(FTSO_READER_ADDRESS);

    console.log("\n" + "=".repeat(70));
    console.log("TEST 1: Get Contract Information");
    console.log("=".repeat(70));

    const info = await ftsoReader.getContractInfo();
    console.log("✓ Owner:", info[0]);
    console.log("✓ FTSO v2 Address:", info[1]);
    console.log("✓ Deployment Time:", new Date(Number(info[2]) * 1000).toLocaleString());

    console.log("\n" + "=".repeat(70));
    console.log("TEST 2: Query FLR/USD Price");
    console.log("=".repeat(70));

    const priceTx = await ftsoReader.getFlrUsdPrice();
    const receipt = await priceTx.wait();

    console.log("✓ Transaction hash:", receipt.hash);
    console.log("✓ Gas used:", receipt.gasUsed.toString());

    // Find PriceQueried event
    const priceEvent = receipt.logs.find(log => {
      try {
        const parsed = ftsoReader.interface.parseLog(log);
        return parsed && parsed.name === 'PriceQueried';
      } catch {
        return false;
      }
    });

    if (priceEvent) {
      const parsed = ftsoReader.interface.parseLog(priceEvent);
      const value = parsed.args.value;
      const decimals = parsed.args.decimals;
      const timestamp = parsed.args.timestamp;

      const decimalPlaces = Number(decimals);
      let priceUsd;
      if (decimalPlaces >= 0) {
        priceUsd = Number(value) / Math.pow(10, decimalPlaces);
      } else {
        priceUsd = Number(value) * Math.pow(10, Math.abs(decimalPlaces));
      }

      console.log("✓ Raw Value:", value.toString());
      console.log("✓ Decimals:", decimals.toString());
      console.log("✓ FLR/USD Price: $" + priceUsd.toFixed(6));
      console.log("✓ Last Update:", new Date(Number(timestamp) * 1000).toLocaleString());
      console.log("✓ Age:", Math.floor((Date.now() / 1000 - Number(timestamp)) / 60), "minutes");
    }

    console.log("\n" + "=".repeat(70));
    console.log("TEST 3: Get Formatted USD Price");
    console.log("=".repeat(70));

    const formattedTx = await ftsoReader.getFlrUsdPriceFormatted();
    const formattedReceipt = await formattedTx.wait();

    console.log("✓ Transaction hash:", formattedReceipt.hash);
    console.log("✓ Formatted price query completed");

    console.log("\n" + "=".repeat(70));
    console.log("TEST 4: Convert 100 FLR to USD");
    console.log("=".repeat(70));

    const flrAmount = hre.ethers.parseEther("100");
    const convertTx = await ftsoReader.convertFlrToUsd(flrAmount);
    const convertReceipt = await convertTx.wait();

    console.log("✓ Transaction hash:", convertReceipt.hash);
    console.log("✓ Input: 100 FLR");
    console.log("✓ Conversion completed (check transaction for result)");

    console.log("\n" + "=".repeat(70));
    console.log("TEST 5: Query Multiple Feed IDs");
    console.log("=".repeat(70));

    const feedIds = [
      "0x01464c522f55534400000000000000000000000000", // FLR/USD
      "0x014254432f55534400000000000000000000000000", // BTC/USD
    ];

    console.log("✓ Querying 2 feeds: FLR/USD and BTC/USD");

    try {
      const multiTx = await ftsoReader.getPricesByFeedIds(feedIds);
      const multiReceipt = await multiTx.wait();

      console.log("✓ Transaction hash:", multiReceipt.hash);
      console.log("✓ Multi-feed query completed");
    } catch (error) {
      console.log("⚠️  Multi-feed query may not be available yet");
      console.log("   Error:", error.message.split('\n')[0]);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 All Tests Complete!");
    console.log("=".repeat(70));

    console.log("\n📋 Summary:");
    console.log("   ✓ Contract information retrieved");
    console.log("   ✓ FLR/USD price queried successfully");
    console.log("   ✓ Formatted price conversion tested");
    console.log("   ✓ FLR to USD conversion tested");
    console.log("   ✓ Multi-feed query attempted");

    console.log("\n💡 Next Steps:");
    console.log("   • View all transactions on Coston2 Explorer");
    console.log("   • Integrate FTSO into NexusCircle contract (Epic 3)");
    console.log("   • Use price feeds for collateral valuation");

  } catch (error) {
    console.error("\n❌ Test failed:");
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
