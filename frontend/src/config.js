/**
 * NexusBank Frontend Configuration
 * Contains contract addresses, network details, and constants
 */

// Import contract ABI
import NexusCircleABI from './NexusCircleABI.json';

// Flare Coston2 Testnet Configuration
export const NETWORK_CONFIG = {
  chainId: '0x72', // 114 in hex
  chainIdDecimal: 114,
  chainName: 'Flare Coston2 Testnet',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18,
  },
  rpcUrls: ['https://coston2-api.flare.network/ext/C/rpc'],
  blockExplorerUrls: ['https://coston2-explorer.flare.network'],
};

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  nexusCircle: '0x57af01c82C08dFcA050A8d7bc5477fc538aBD7D4',
  ftso: '0x3d893C53D9e8056135C26C8c638B76C8b60Df726',
};

// Contract ABI
export const NEXUS_CIRCLE_ABI = NexusCircleABI;

// FTSO Configuration
export const FTSO_CONFIG = {
  flrUsdFeedId: '0x01464c522f55534400000000000000000000000000',
  priceDecimals: 5, // FTSO returns prices with 5 decimals
};

// Pool Constants (from smart contract)
export const POOL_CONSTANTS = {
  maxMembers: 6,
  collateralPercent: 10,
  contributionDeadline: 3600, // 1 hour in seconds
};

// UI Constants
export const UI_CONFIG = {
  // Refresh intervals (in milliseconds)
  poolRefreshInterval: 10000, // 10 seconds
  priceRefreshInterval: 30000, // 30 seconds

  // Display formats
  priceDecimals: 5,
  tokenDecimals: 4,

  // Faucet URL
  faucetUrl: 'https://faucet.flare.network/coston2',

  // Block explorer
  explorerUrl: 'https://coston2-explorer.flare.network',
};

// Helper function to get explorer URL for address
export const getExplorerUrl = (address) => {
  return `${UI_CONFIG.explorerUrl}/address/${address}`;
};

// Helper function to get explorer URL for transaction
export const getTxExplorerUrl = (txHash) => {
  return `${UI_CONFIG.explorerUrl}/tx/${txHash}`;
};

// Connection states
export const CONNECTION_STATES = {
  NOT_INSTALLED: 'not_installed',
  NOT_CONNECTED: 'not_connected',
  WRONG_NETWORK: 'wrong_network',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
};

export default {
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  NEXUS_CIRCLE_ABI,
  FTSO_CONFIG,
  POOL_CONSTANTS,
  UI_CONFIG,
  CONNECTION_STATES,
  getExplorerUrl,
  getTxExplorerUrl,
};
