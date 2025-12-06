const hre = require("hardhat");

async function main() {
  console.log("=".repeat(60));
  console.log("Deploying HelloWorld Contract to Flare Coston2");
  console.log("=".repeat(60));

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

    console.log("\n🚀 Deploying HelloWorld contract...");

    // Deploy the contract
    const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
    const helloWorld = await HelloWorld.deploy();

    await helloWorld.waitForDeployment();
    const address = await helloWorld.getAddress();

    console.log("\n✅ HelloWorld deployed successfully!");
    console.log("   Contract address:", address);
    console.log("   Transaction hash:", helloWorld.deploymentTransaction().hash);

    // Test the contract
    console.log("\n🧪 Testing contract...");
    const message = await helloWorld.getMessage();
    console.log("   Message:", message);

    const info = await helloWorld.getInfo();
    console.log("   Owner:", info[0]);
    console.log("   Deployment timestamp:", new Date(Number(info[2]) * 1000).toLocaleString());

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Deployment Complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Next Steps:");
    console.log("   1. View on Explorer:");
    console.log("      https://coston2-explorer.flare.network/address/" + address);
    console.log("\n   2. Update your .env file:");
    console.log("      HELLO_WORLD_ADDRESS=" + address);
    console.log("\n   3. Test reading the contract:");
    console.log("      npx hardhat run scripts/test-hello.js --network coston2");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
