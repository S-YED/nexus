import { ethers } from 'ethers';
import { NEXUS_CIRCLE_ABI } from '../contracts/NexusCircleABI';

// Contract address from deployment
export const NEXUS_CIRCLE_ADDRESS = '0x3bE24594e9c7d3386AbFa26Ccc6E57e2A8EaAE4e';

// Flare Coston2 testnet configuration
export const COSTON2_CONFIG = {
  chainId: 114,
  chainName: 'Flare Testnet Coston2',
  rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
  blockExplorer: 'https://coston2-explorer.flare.network',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18
  }
};

export interface PoolData {
  poolId: number;
  maxMembers: number;
  contributionAmount: bigint;
  collateralPercent: number;
  memberCount: number;
  currentRound: number;
  isActive: boolean;
  createdAt: number;
  creator: string;
  members?: string[];
}

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  async initialize() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);

    // Check if on correct network
    const network = await this.provider.getNetwork();
    console.log('Current network:', {
      chainId: Number(network.chainId),
      name: network.name
    });

    if (Number(network.chainId) !== COSTON2_CONFIG.chainId) {
      console.log('Wrong network detected, switching to Coston2...');
      await this.switchToCoston2();
      // Re-initialize provider after network switch
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    this.signer = await this.provider.getSigner();
    const signerAddress = await this.signer.getAddress();
    console.log('Connected wallet:', signerAddress);

    this.contract = new ethers.Contract(
      NEXUS_CIRCLE_ADDRESS,
      NEXUS_CIRCLE_ABI,
      this.signer
    );

    console.log('Blockchain service initialized successfully');
  }

  async switchToCoston2() {
    if (!window.ethereum) throw new Error('MetaMask not found');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${COSTON2_CONFIG.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${COSTON2_CONFIG.chainId.toString(16)}`,
            chainName: COSTON2_CONFIG.chainName,
            nativeCurrency: COSTON2_CONFIG.nativeCurrency,
            rpcUrls: [COSTON2_CONFIG.rpcUrl],
            blockExplorerUrls: [COSTON2_CONFIG.blockExplorer]
          }],
        });
      } else {
        throw error;
      }
    }
  }

  async getPoolCount(): Promise<number> {
    if (!this.contract) await this.initialize();
    const count = await this.contract!.poolCount();
    return Number(count);
  }

  async getPool(poolId: number): Promise<PoolData> {
    if (!this.contract) await this.initialize();

    const poolData = await this.contract!.getPool(poolId);
    const members = await this.contract!.getPoolMembers(poolId);

    return {
      poolId: Number(poolData[0]),
      maxMembers: Number(poolData[1]),
      contributionAmount: poolData[2],
      collateralPercent: Number(poolData[3]),
      memberCount: Number(poolData[4]),
      currentRound: Number(poolData[5]),
      isActive: poolData[6],
      createdAt: Number(poolData[7]),
      creator: poolData[8],
      members: members
    };
  }

  async getAllPools(): Promise<PoolData[]> {
    if (!this.contract) await this.initialize();

    const poolCount = await this.getPoolCount();
    const pools: PoolData[] = [];

    for (let i = 0; i < poolCount; i++) {
      try {
        const pool = await this.getPool(i);
        pools.push(pool);
      } catch (error) {
        console.error(`Error fetching pool ${i}:`, error);
      }
    }

    return pools;
  }

  async createPool(contributionAmount: string): Promise<{ poolId: number; txHash: string }> {
    if (!this.contract) await this.initialize();

    const contributionWei = ethers.parseEther(contributionAmount);

    console.log('Creating pool with:', {
      contributionAmount,
      contributionWei: contributionWei.toString(),
      note: 'Epic 3 contract - NO COLLATERAL required'
    });

    // Check user balance for gas only
    const balance = await this.provider!.getBalance(await this.signer!.getAddress());
    console.log('User balance:', ethers.formatEther(balance), 'C2FLR');

    try {
      // Epic 3 version - no collateral, no value needed
      console.log('Calling createPool (Epic 3 - no collateral)');

      const tx = await this.contract!.createPool(contributionWei);

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

    // Extract poolId from PoolCreated event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.contract!.interface.parseLog(log);
        return parsed?.name === 'PoolCreated';
      } catch {
        return false;
      }
    });

    let poolId = 0;
    if (event) {
      const parsed = this.contract!.interface.parseLog(event);
      poolId = Number(parsed?.args[0] || 0);
    }

      return {
        poolId,
        txHash: receipt.hash
      };
    } catch (error: any) {
      console.error('Error creating pool:', error);

      // Provide more helpful error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient C2FLR balance for gas + collateral');
      }
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error('Transaction would fail. Check if you have enough C2FLR for collateral (10% of contribution)');
      }
      if (error.message?.includes('user rejected')) {
        throw new Error('Transaction cancelled by user');
      }

      throw error;
    }
  }

  async joinPool(poolId: number, contributionAmount: bigint): Promise<string> {
    if (!this.contract) await this.initialize();

    console.log('Joining pool:', {
      poolId,
      contributionAmount: contributionAmount.toString(),
      note: 'Epic 3 contract - NO COLLATERAL required'
    });

    // Check user balance for gas only
    const balance = await this.provider!.getBalance(await this.signer!.getAddress());
    console.log('User balance:', ethers.formatEther(balance), 'C2FLR');

    try {
      // Epic 3 version - no collateral needed
      const tx = await this.contract!.joinPool(poolId);

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      return receipt.hash;
    } catch (error: any) {
      console.error('Error joining pool:', error);

      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient C2FLR balance for gas + collateral');
      }
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error('Transaction would fail. Check if pool is full or you are already a member');
      }
      if (error.message?.includes('user rejected')) {
        throw new Error('Transaction cancelled by user');
      }

      throw error;
    }
  }

  async contribute(poolId: number, contributionAmount: bigint): Promise<string> {
    if (!this.contract) await this.initialize();

    const tx = await this.contract!.contribute(poolId, {
      value: contributionAmount
    });

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async executePayout(poolId: number): Promise<string> {
    if (!this.contract) await this.initialize();

    const tx = await this.contract!.executePayout(poolId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async checkIsMember(poolId: number, address: string): Promise<boolean> {
    if (!this.contract) await this.initialize();
    return await this.contract!.checkIsMember(poolId, address);
  }

  async getCurrentAddress(): Promise<string> {
    if (!this.provider) await this.initialize();
    const signer = await this.provider!.getSigner();
    return await signer.getAddress();
  }

  async hasMemberContributed(poolId: number, round: number, member: string): Promise<boolean> {
    if (!this.contract) await this.initialize();
    return await this.contract!.hasMemberContributed(poolId, round, member);
  }

  async areAllMembersContributed(poolId: number): Promise<boolean> {
    if (!this.contract) await this.initialize();
    return await this.contract!.areAllMembersContributed(poolId);
  }

  async getContributionCount(poolId: number): Promise<number> {
    if (!this.contract) await this.initialize();
    const count = await this.contract!.getContributionCount(poolId);
    return Number(count);
  }

  async getNextPayoutRecipient(poolId: number): Promise<string> {
    if (!this.contract) await this.initialize();
    return await this.contract!.getNextPayoutRecipient(poolId);
  }
}

export const blockchainService = new BlockchainService();
