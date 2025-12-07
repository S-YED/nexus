// Direct test of contract call
import { ethers } from 'ethers';
import { NEXUS_CIRCLE_ABI } from '../contracts/NexusCircleABI';

export async function testCreatePoolDirect() {
  if (!window.ethereum) {
    console.error('MetaMask not found');
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  console.log('Signer address:', address);

  const contractAddress = '0x3bE24594e9c7d3386AbFa26Ccc6E57e2A8EaAE4e';
  const contract = new ethers.Contract(contractAddress, NEXUS_CIRCLE_ABI, signer);

  // Test with 10 FLR contribution (requires 1 FLR collateral)
  const contributionAmount = ethers.parseEther('10'); // 10 FLR
  const collateralAmount = contributionAmount / 10n; // 1 FLR

  console.log('Attempting to create pool with:');
  console.log('- Contribution:', ethers.formatEther(contributionAmount), 'FLR');
  console.log('- Collateral:', ethers.formatEther(collateralAmount), 'FLR');

  try {
    // Method 1: Standard way
    console.log('\n=== Attempting Standard Method ===');
    const tx = await contract.createPool(contributionAmount, {
      value: collateralAmount
    });
    console.log('✅ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!', receipt);
  } catch (error: any) {
    console.error('❌ Standard method failed:', error.message);

    // Try alternate method - with explicit gas estimation
    try {
      console.log('\n=== Attempting with Manual Gas Estimation ===');
      const gasEstimate = await contract.createPool.estimateGas(contributionAmount, {
        value: collateralAmount
      });
      console.log('Gas estimate:', gasEstimate.toString());

      const tx2 = await contract.createPool(contributionAmount, {
        value: collateralAmount,
        gasLimit: gasEstimate * 120n / 100n // 20% buffer
      });
      console.log('✅ Transaction sent:', tx2.hash);
    } catch (error2: any) {
      console.error('❌ Manual gas method also failed:', error2.message);
      console.error('Full error:', error2);
    }
  }
}

// Add to window for easy testing
(window as any).testCreatePoolDirect = testCreatePoolDirect;
