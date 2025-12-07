import { useState, useEffect } from 'react';
import { useNexusCircle } from './hooks/useNexusCircle';
import WalletConnection from './components/WalletConnection';
import FTSOPriceFeed from './components/FTSOPriceFeed';
import PoolJoin from './components/PoolJoin';
import PoolDisplay from './components/PoolDisplay';
import { CONNECTION_STATES } from './config';

function App() {
  // Use the custom hook for all contract interactions
  const {
    connectionState,
    account,
    provider,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchToCoston2,
    isMetaMaskInstalled,
    createPool,
    joinPool,
    contribute,
    executePayout,
    checkForDefaults,
    returnCollateral,
    getPool,
    getMemberStatus,
    getPoolCount,
  } = useNexusCircle();

  // App state
  const [activeView, setActiveView] = useState('home');
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [poolData, setPoolData] = useState(null);
  const [memberStatus, setMemberStatus] = useState(null);
  const [totalPools, setTotalPools] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Fetch total pool count on connection
  useEffect(() => {
    if (connectionState === CONNECTION_STATES.CONNECTED) {
      loadPoolCount();
    }
  }, [connectionState]);

  // Load pool data when selected
  useEffect(() => {
    if (selectedPoolId !== null && account) {
      loadPoolData();
    }
  }, [selectedPoolId, account]);

  // Auto-refresh pool data periodically
  useEffect(() => {
    if (selectedPoolId !== null && account) {
      const interval = setInterval(loadPoolData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPoolId, account]);

  const loadPoolCount = async () => {
    try {
      const count = await getPoolCount();
      setTotalPools(Number(count));
    } catch (err) {
      console.error('Error loading pool count:', err);
    }
  };

  const loadPoolData = async () => {
    try {
      const [pool, status] = await Promise.all([
        getPool(selectedPoolId),
        getMemberStatus(selectedPoolId, account),
      ]);
      setPoolData(pool);
      setMemberStatus(status);
    } catch (err) {
      console.error('Error loading pool data:', err);
      setActionError('Failed to load pool data');
    }
  };

  // Handle create pool
  const handleCreatePool = async (amount) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const poolId = await createPool(amount);
      setActionSuccess(`Pool created successfully! Pool ID: ${poolId}`);
      await loadPoolCount();
      setSelectedPoolId(Number(poolId));
      setActiveView('pool');
    } catch (err) {
      console.error('Create pool error:', err);
      setActionError(err.message || 'Failed to create pool');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle join pool
  const handleJoinPool = async (poolId) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await joinPool(poolId);
      setActionSuccess(`Successfully joined pool #${poolId}`);
      setSelectedPoolId(Number(poolId));
      setActiveView('pool');
      await loadPoolData();
    } catch (err) {
      console.error('Join pool error:', err);
      setActionError(err.message || 'Failed to join pool');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle contribute
  const handleContribute = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await contribute(selectedPoolId);
      setActionSuccess('Contribution successful!');
      await loadPoolData();
    } catch (err) {
      console.error('Contribute error:', err);
      setActionError(err.message || 'Failed to contribute');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle execute payout
  const handleExecutePayout = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await executePayout(selectedPoolId);
      setActionSuccess('Payout executed successfully!');
      await loadPoolData();
    } catch (err) {
      console.error('Execute payout error:', err);
      setActionError(err.message || 'Failed to execute payout');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle check for defaults
  const handleCheckDefaults = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await checkForDefaults(selectedPoolId);
      setActionSuccess('Defaults checked successfully!');
      await loadPoolData();
    } catch (err) {
      console.error('Check defaults error:', err);
      setActionError(err.message || 'Failed to check for defaults');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle return collateral
  const handleReturnCollateral = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await returnCollateral(selectedPoolId);
      setActionSuccess('Collateral returned successfully!');
      await loadPoolData();
    } catch (err) {
      console.error('Return collateral error:', err);
      setActionError(err.message || 'Failed to return collateral');
    } finally {
      setActionLoading(false);
    }
  };

  // Render navigation
  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">NexusCircle</h1>
            <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded">
              MVP
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'home'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveView('join')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'join'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              disabled={connectionState !== CONNECTION_STATES.CONNECTED}
            >
              Create / Join Pool
            </button>
            {selectedPoolId !== null && (
              <button
                onClick={() => setActiveView('pool')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'pool'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Pool #{selectedPoolId}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Render success/error messages
  const renderMessages = () => (
    <>
      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-green-800">{actionSuccess}</p>
            <button
              onClick={() => setActionSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-800">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Render home view
  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to NexusCircle
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          A decentralized ROSCA (Rotating Savings and Credit Association) platform powered by Flare Network.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-white rounded-lg border border-primary-200">
            <div className="text-3xl mb-2">🏦</div>
            <h3 className="font-semibold text-gray-900 mb-1">Create Pools</h3>
            <p className="text-sm text-gray-600">Start a savings circle with friends</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-primary-200">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-gray-900 mb-1">Join Circles</h3>
            <p className="text-sm text-gray-600">Participate in existing pools</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-primary-200">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900 mb-1">Earn Payouts</h3>
            <p className="text-sm text-gray-600">Receive monthly distributions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletConnection
          connectionState={connectionState}
          account={account}
          error={error}
          isLoading={isLoading}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          switchToCoston2={switchToCoston2}
        />
        <FTSOPriceFeed provider={provider} />
      </div>

      {connectionState === CONNECTION_STATES.CONNECTED && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Total Pools</p>
              <p className="text-2xl font-bold text-blue-900">{totalPools}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Your Pool</p>
              <p className="text-2xl font-bold text-green-900">
                {selectedPoolId !== null ? `#${selectedPoolId}` : 'None'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render join view
  const renderJoinView = () => (
    <div>
      <PoolJoin
        account={account}
        onCreatePool={handleCreatePool}
        onJoinPool={handleJoinPool}
        getPool={getPool}
        isLoading={actionLoading}
      />
    </div>
  );

  // Render pool view
  const renderPoolView = () => (
    <div>
      {selectedPoolId !== null ? (
        <PoolDisplay
          poolId={selectedPoolId}
          poolData={poolData}
          account={account}
          memberStatus={memberStatus}
          onContribute={handleContribute}
          onExecutePayout={handleExecutePayout}
          onCheckDefaults={handleCheckDefaults}
          onReturnCollateral={handleReturnCollateral}
          isLoading={actionLoading}
        />
      ) : (
        <div className="card">
          <p className="text-gray-600">No pool selected. Create or join a pool to get started.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderMessages()}

        {activeView === 'home' && renderHomeView()}
        {activeView === 'join' && renderJoinView()}
        {activeView === 'pool' && renderPoolView()}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>NexusCircle MVP - Powered by Flare Network</p>
            <p className="mt-2">
              Built with React, ethers.js, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
