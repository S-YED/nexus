import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  NEXUS_CIRCLE_ABI,
  CONNECTION_STATES,
} from '../config';

/**
 * Custom hook for NexusCircle contract interaction and MetaMask connection
 * Handles wallet connection, network switching, and contract interactions
 */
export const useNexusCircle = () => {
  // Connection state
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.NOT_CONNECTED);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check if MetaMask is installed
   */
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  /**
   * Check if connected to correct network
   */
  const checkNetwork = async () => {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId === NETWORK_CONFIG.chainId;
    } catch (err) {
      console.error('Error checking network:', err);
      return false;
    }
  };

  /**
   * Switch to Coston2 network
   */
  const switchToCoston2 = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      }
      console.error('Error switching network:', switchError);
      throw switchError;
    }
  };

  /**
   * Initialize provider, signer, and contract
   */
  const initializeContract = useCallback(async (userAddress) => {
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const nexusContract = new ethers.Contract(
        CONTRACT_ADDRESSES.nexusCircle,
        NEXUS_CIRCLE_ABI,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(nexusContract);
      setAccount(userAddress);
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setError(null);

      return { provider: web3Provider, signer: web3Signer, contract: nexusContract };
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setConnectionState(CONNECTION_STATES.NOT_INSTALLED);
      setError('MetaMask is not installed. Please install MetaMask to use this app.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check network first
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        setConnectionState(CONNECTION_STATES.WRONG_NETWORK);
        await switchToCoston2();
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const userAddress = accounts[0];
      await initializeContract(userAddress);

      console.log('Connected to MetaMask:', userAddress);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        setError('Connection request rejected. Please accept the connection request in MetaMask.');
      } else {
        setError(err.message);
      }
      setConnectionState(CONNECTION_STATES.NOT_CONNECTED);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setConnectionState(CONNECTION_STATES.NOT_CONNECTED);
    setError(null);
  };

  /**
   * Handle account changes
   */
  const handleAccountsChanged = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected all accounts
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // User switched accounts
      try {
        await initializeContract(accounts[0]);
      } catch (err) {
        console.error('Error handling account change:', err);
        setError(err.message);
      }
    }
  }, [account, initializeContract]);

  /**
   * Handle network changes
   */
  const handleChainChanged = useCallback(async (chainId) => {
    if (chainId !== NETWORK_CONFIG.chainId) {
      setConnectionState(CONNECTION_STATES.WRONG_NETWORK);
      setError('Please switch to Flare Coston2 network');
    } else {
      // Reconnect on correct network
      if (account) {
        try {
          await initializeContract(account);
        } catch (err) {
          console.error('Error handling chain change:', err);
          setError(err.message);
        }
      }
    }
  }, [account, initializeContract]);

  /**
   * Set up event listeners for MetaMask
   */
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  /**
   * Check if already connected on mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) {
        setConnectionState(CONNECTION_STATES.NOT_INSTALLED);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const isCorrectNetwork = await checkNetwork();
          if (isCorrectNetwork) {
            await initializeContract(accounts[0]);
          } else {
            setConnectionState(CONNECTION_STATES.WRONG_NETWORK);
          }
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, [initializeContract]);

  /**
   * Contract interaction methods
   */

  // Create a new pool
  const createPool = async (contributionAmount) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const collateralAmount = (contributionAmount * BigInt(10)) / BigInt(100); // 10% collateral
      const tx = await contract.createPool(contributionAmount, { value: collateralAmount });
      const receipt = await tx.wait();

      // Extract poolId from event
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log)?.name === 'PoolCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed.args.poolId;
      }

      return receipt;
    } catch (err) {
      console.error('Error creating pool:', err);
      throw err;
    }
  };

  // Join an existing pool
  const joinPool = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const poolInfo = await contract.getPool(poolId);
      const contributionAmount = poolInfo[2]; // contributionAmount is at index 2
      const collateralAmount = (contributionAmount * BigInt(10)) / BigInt(100);

      const tx = await contract.joinPool(poolId, { value: collateralAmount });
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error joining pool:', err);
      throw err;
    }
  };

  // Make a contribution
  const contribute = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const poolInfo = await contract.getPool(poolId);
      const contributionAmount = poolInfo[2];

      const tx = await contract.contribute(poolId, { value: contributionAmount });
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error contributing:', err);
      throw err;
    }
  };

  // Execute payout (anyone can call)
  const executePayout = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.executePayout(poolId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error executing payout:', err);
      throw err;
    }
  };

  // Check for defaults
  const checkForDefaults = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.checkForDefaults(poolId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error checking for defaults:', err);
      throw err;
    }
  };

  // Liquidate defaulted member
  const liquidateDefaultedMember = async (poolId, memberAddress) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.liquidateDefaultedMember(poolId, memberAddress);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error liquidating member:', err);
      throw err;
    }
  };

  // Return collateral (when pool completes)
  const returnCollateral = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.returnCollateral(poolId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error returning collateral:', err);
      throw err;
    }
  };

  // Get pool information
  const getPool = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const poolInfo = await contract.getPool(poolId);
      return {
        creator: poolInfo[0],
        members: poolInfo[1],
        contributionAmount: poolInfo[2],
        currentRound: poolInfo[3],
        totalRounds: poolInfo[4],
        poolBalance: poolInfo[5],
        isActive: poolInfo[6],
        roundStartTime: poolInfo[7],
      };
    } catch (err) {
      console.error('Error getting pool:', err);
      throw err;
    }
  };

  // Get member status
  const getMemberStatus = async (poolId, memberAddress) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const [isMember, hasDefaulted, collateralBalance] = await Promise.all([
        contract.isMember(poolId, memberAddress),
        contract.hasDefaulted(poolId, memberAddress),
        contract.collateralBalances(poolId, memberAddress),
      ]);

      return {
        isMember,
        hasDefaulted,
        collateralBalance,
      };
    } catch (err) {
      console.error('Error getting member status:', err);
      throw err;
    }
  };

  // Get pool count
  const getPoolCount = async () => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      return await contract.poolCount();
    } catch (err) {
      console.error('Error getting pool count:', err);
      throw err;
    }
  };

  return {
    // Connection state
    connectionState,
    account,
    provider,
    signer,
    contract,
    error,
    isLoading,

    // Connection methods
    connectWallet,
    disconnectWallet,
    switchToCoston2,
    isMetaMaskInstalled: isMetaMaskInstalled(),

    // Contract methods
    createPool,
    joinPool,
    contribute,
    executePayout,
    checkForDefaults,
    liquidateDefaultedMember,
    returnCollateral,
    getPool,
    getMemberStatus,
    getPoolCount,
  };
};

export default useNexusCircle;
