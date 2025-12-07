import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, FTSO_CONFIG, UI_CONFIG } from '../config';

// FTSO V2 ABI - only the function we need
const FTSO_ABI = [
  'function getFeedById(bytes21 feedId) external view returns (uint256 value, int8 decimals, uint64 timestamp)',
];

/**
 * FTSOPriceFeed Component
 * Displays the current FLR/USD price from Flare Time Series Oracle
 */
const FTSOPriceFeed = ({ provider }) => {
  const [price, setPrice] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Fetch price from FTSO
   */
  const fetchPrice = async () => {
    if (!provider) {
      setError('Provider not available');
      setIsLoading(false);
      return;
    }

    try {
      // Create FTSO contract instance
      const ftsoContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ftso,
        FTSO_ABI,
        provider
      );

      // Fetch price data
      const [value, decimals, ts] = await ftsoContract.getFeedById(
        FTSO_CONFIG.flrUsdFeedId
      );

      // Convert price based on decimals (expected to be 5)
      const priceValue = Number(value) / Math.pow(10, Number(decimals));

      setPrice(priceValue);
      setTimestamp(Number(ts));
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching FTSO price:', err);
      setError('Failed to fetch price data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set up auto-refresh
   */
  useEffect(() => {
    if (!provider) return;

    // Initial fetch
    fetchPrice();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchPrice, UI_CONFIG.priceRefreshInterval);

    return () => clearInterval(interval);
  }, [provider]);

  /**
   * Format timestamp
   */
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  /**
   * Format time ago
   */
  const getTimeAgo = (ts) => {
    if (!ts) return '';
    const now = Date.now();
    const diff = Math.floor((now - lastUpdate) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (!provider) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">FLR/USD Price Feed</h3>
            <p className="text-sm text-gray-500 mt-1">Powered by Flare Time Series Oracle</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">Connect wallet to view price feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">FLR/USD Price Feed</h3>
          <p className="text-sm text-gray-500 mt-1">Powered by Flare Time Series Oracle</p>
        </div>
        <button
          onClick={fetchPrice}
          disabled={isLoading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {isLoading ? '↻ Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isLoading && !price ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600 mt-2">Loading price data...</p>
        </div>
      ) : price ? (
        <>
          {/* Main Price Display */}
          <div className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium mb-1">Current Price</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary-900">
                    ${price.toFixed(UI_CONFIG.priceDecimals)}
                  </span>
                  <span className="text-lg text-primary-700 ml-2">USD</span>
                </div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-semibold">
                  LIVE
                </div>
              </div>
            </div>
          </div>

          {/* Price Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatTimestamp(timestamp)}
              </p>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-1">{getTimeAgo(timestamp)}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Data Source</p>
              <p className="text-sm font-semibold text-gray-900">FTSO v2</p>
              <p className="text-xs text-gray-500 mt-1">On-chain oracle</p>
            </div>
          </div>

          {/* Info Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-blue-700">
                  This price feed is provided by the Flare Time Series Oracle and is used for
                  collateral valuation. Price updates automatically every {UI_CONFIG.priceRefreshInterval / 1000} seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details (collapsible) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Technical Details
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">FTSO Contract:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {CONTRACT_ADDRESSES.ftso.substring(0, 10)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Feed ID:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {FTSO_CONFIG.flrUsdFeedId.substring(0, 10)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Decimals:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {FTSO_CONFIG.priceDecimals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unix Timestamp:</span>
                  <span className="font-mono text-xs text-gray-900">{timestamp}</span>
                </div>
              </div>
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
};

export default FTSOPriceFeed;
