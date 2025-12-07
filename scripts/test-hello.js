
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=".repeat(60));
  console.log("Testing HelloWorld Contract on Flare Coston2");
  console.log("=".repeat(60));

  try {
    const helloWorldAddress = process.env.HELLO_WORLD_ADDRESS;

    if (!helloWorldAddress) {
      console.log("\n❌ ERROR: HELLO_WORLD_ADDRESS not found in .env file!");
      console.log("   Please deploy the contract first with:");
      console.log("   npx hardhat run scripts/deploy-hello.js --network coston2");
      return;
    }

    // Get the HelloWorld contract instance
    const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
    const helloWorld = HelloWorld.attach(helloWorldAddress);

    console.log("\n🔎 Contract Information:");
    console.log("   Contract address:", await helloWorld.getAddress());

    // Test the contract
    console.log("\n🧪 Testing contract functions...");
    const message = await helloWorld.getMessage();
    console.log("   Message:", message);

    const info = await helloWorld.getInfo();
    const owner = info[1];
    const deployer = (await hre.ethers.getSigners())[0].address;

    console.log("   Owner:", owner);
    console.log("   Deployer:", deployer);

    if (owner.toLowerCase() === deployer.toLowerCase()) {
      console.log("\n✅ Owner verification successful!");
    } else {
      console.log("\n❌ ERROR: Owner verification failed!");
      console.log("   Expected owner:", deployer);
      console.log("   Actual owner:  ", owner);
    }

    console.log("   Deployment timestamp:", new Date(Number(info[2]) * 1000).toLocaleString());

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Test Complete!");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Test failed:");
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
