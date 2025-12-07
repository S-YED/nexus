import { useState } from 'react';
import { ethers } from 'ethers';
import { POOL_CONSTANTS } from '../config';

/**
 * PoolJoin Component
 * Interface for creating new pools or joining existing ones
 */
const PoolJoin = ({
  account,
  onCreatePool,
  onJoinPool,
  getPool,
  isLoading,
}) => {
  // Create Pool state
  const [contributionAmount, setContributionAmount] = useState('');
  const [createError, setCreateError] = useState(null);

  // Join Pool state
  const [poolIdToJoin, setPoolIdToJoin] = useState('');
  const [previewPool, setPreviewPool] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Format FLR amount
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return parseFloat(ethers.formatEther(amount)).toFixed(4);
  };

  // Calculate collateral amount
  const calculateCollateral = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    return (parseFloat(amount) * POOL_CONSTANTS.collateralPercent / 100).toFixed(4);
  };

  // Handle create pool
  const handleCreatePool = async (e) => {
    e.preventDefault();
    setCreateError(null);

    try {
      // Validate input
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        setCreateError('Please enter a valid contribution amount');
        return;
      }

      if (amount < 0.01) {
        setCreateError('Minimum contribution is 0.01 FLR');
        return;
      }

      // Convert to Wei
      const amountInWei = ethers.parseEther(contributionAmount);

      // Call create pool
      await onCreatePool(amountInWei);

      // Reset form on success
      setContributionAmount('');
    } catch (err) {
      console.error('Error creating pool:', err);
      setCreateError(err.message || 'Failed to create pool');
    }
  };

  // Handle preview pool
  const handlePreviewPool = async () => {
    setJoinError(null);
    setPreviewPool(null);

    if (!poolIdToJoin || poolIdToJoin.trim() === '') {
      setJoinError('Please enter a pool ID');
      return;
    }

    setIsLoadingPreview(true);

    try {
      const poolData = await getPool(poolIdToJoin);

      // Validate pool
      if (!poolData.isActive) {
        setJoinError('This pool is not active and cannot accept new members');
        return;
      }

      if (poolData.members.length >= POOL_CONSTANTS.maxMembers) {
        setJoinError('This pool is full and cannot accept new members');
        return;
      }

      // Check if user is already a member
      if (poolData.members.some(m => m.toLowerCase() === account?.toLowerCase())) {
        setJoinError('You are already a member of this pool');
        return;
      }

      setPreviewPool(poolData);
    } catch (err) {
      console.error('Error loading pool:', err);
      setJoinError('Pool not found or error loading pool data');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle join pool
  const handleJoinPool = async () => {
    if (!previewPool) return;

    setJoinError(null);

    try {
      await onJoinPool(poolIdToJoin);

      // Reset form on success
      setPoolIdToJoin('');
      setPreviewPool(null);
    } catch (err) {
      console.error('Error joining pool:', err);
      setJoinError(err.message || 'Failed to join pool');
    }
  };

  if (!account) {
    return (
      <div className="card">
        <p className="text-gray-600">Please connect your wallet to create or join a pool.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Pool */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Pool</h2>

        <form onSubmit={handleCreatePool} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Contribution Amount (FLR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="input-field"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum: 0.01 FLR
            </p>
          </div>

          {contributionAmount && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Pool Details</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Monthly Contribution:</span>
                  <span className="font-semibold">{contributionAmount} FLR</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Collateral (10%):</span>
                  <span className="font-semibold">{calculateCollateral(contributionAmount)} FLR</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Members:</span>
                  <span className="font-semibold">{POOL_CONSTANTS.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rounds:</span>
                  <span className="font-semibold">{POOL_CONSTANTS.maxMembers}</span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total You'll Pay Now:</span>
                    <span>{calculateCollateral(contributionAmount)} FLR</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{createError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !contributionAmount}
            className="btn-primary w-full"
          >
            {isLoading ? 'Creating Pool...' : 'Create Pool'}
          </button>
        </form>
      </div>

      {/* Join Existing Pool */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Join Existing Pool</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pool ID
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={poolIdToJoin}
                onChange={(e) => {
                  setPoolIdToJoin(e.target.value);
                  setPreviewPool(null);
                  setJoinError(null);
                }}
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                onClick={handlePreviewPool}
                disabled={isLoading || isLoadingPreview || !poolIdToJoin}
                className="btn-secondary"
              >
                {isLoadingPreview ? 'Loading...' : 'Preview'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the pool ID you want to join
            </p>
          </div>

          {joinError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{joinError}</p>
            </div>
          )}

          {previewPool && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-3">Pool Preview</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Pool ID:</span>
                  <span className="font-semibold">{poolIdToJoin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Contribution:</span>
                  <span className="font-semibold">{formatAmount(previewPool.contributionAmount)} FLR</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Collateral (10%):</span>
                  <span className="font-semibold">
                    {(parseFloat(formatAmount(previewPool.contributionAmount)) * 0.1).toFixed(4)} FLR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Members:</span>
                  <span className="font-semibold">
                    {previewPool.members.length} / {POOL_CONSTANTS.maxMembers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Round:</span>
                  <span className="font-semibold">
                    {previewPool.currentRound.toString()} / {previewPool.totalRounds.toString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold">
                    {previewPool.isActive ? '✅ Active' : '❌ Completed'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleJoinPool}
                disabled={isLoading}
                className="btn-primary w-full mt-4"
              >
                {isLoading ? 'Joining Pool...' : `Join Pool (Pay ${(parseFloat(formatAmount(previewPool.contributionAmount)) * 0.1).toFixed(4)} FLR)`}
              </button>
            </div>
          )}

          {!previewPool && !joinError && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Enter a pool ID and click Preview to see pool details before joining.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolJoin;
