import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { POOL_CONSTANTS, getExplorerUrl } from '../config';

/**
 * PoolDisplay Component
 * Displays detailed information about a ROSCA pool
 */
const PoolDisplay = ({
  poolId,
  poolData,
  account,
  memberStatus,
  onContribute,
  onExecutePayout,
  onCheckDefaults,
  onReturnCollateral,
  isLoading,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format FLR amount
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return parseFloat(ethers.formatEther(amount)).toFixed(4);
  };

  // Calculate time remaining for contribution
  useEffect(() => {
    if (!poolData?.roundStartTime || !poolData?.isActive) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(poolData.roundStartTime) + POOL_CONSTANTS.contributionDeadline;
      const remaining = deadline - now;

      if (remaining > 0) {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining('Deadline passed');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [poolData?.roundStartTime, poolData?.isActive]);

  // Calculate progress percentage
  const progressPercentage = poolData
    ? (Number(poolData.currentRound) / Number(poolData.totalRounds)) * 100
    : 0;

  // Check if user can contribute
  const canContribute = () => {
    return (
      poolData?.isActive &&
      memberStatus?.isMember &&
      !memberStatus?.hasDefaulted &&
      account
    );
  };

  // Check if user can execute payout
  const canExecutePayout = () => {
    return poolData?.isActive && account;
  };

  if (!poolData) {
    return (
      <div className="card">
        <p className="text-gray-600">Loading pool information...</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Pool Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pool #{poolId?.toString()}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Created by {formatAddress(poolData.creator)}
          </p>
        </div>
        <div>
          {poolData.isActive ? (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 mr-2 rounded-full bg-green-600"></span>
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Pool Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Contribution</p>
          <p className="text-xl font-bold text-blue-900">
            {formatAmount(poolData.contributionAmount)} FLR
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 mb-1">Pool Balance</p>
          <p className="text-xl font-bold text-purple-900">
            {formatAmount(poolData.poolBalance)} FLR
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 mb-1">Members</p>
          <p className="text-xl font-bold text-green-900">
            {poolData.members.length} / {POOL_CONSTANTS.maxMembers}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-600 mb-1">Round</p>
          <p className="text-xl font-bold text-orange-900">
            {poolData.currentRound.toString()} / {poolData.totalRounds.toString()}
          </p>
        </div>
      </div>

      {/* Round Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Round Progress</h3>
          <span className="text-sm text-gray-600">{progressPercentage.toFixed(0)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Time Remaining (if active) */}
      {poolData.isActive && timeRemaining && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Contribution Deadline</p>
              <p className="text-xs text-yellow-700 mt-1">Time remaining for current round</p>
            </div>
            <p className="text-lg font-bold text-yellow-900">{timeRemaining}</p>
          </div>
        </div>
      )}

      {/* Member List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pool Members</h3>
        <div className="space-y-2">
          {poolData.members.map((member, index) => (
            <div
              key={member}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                member.toLowerCase() === account?.toLowerCase()
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-semibold text-gray-700 mr-3">
                  {index + 1}
                </span>
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {formatAddress(member)}
                    {member.toLowerCase() === account?.toLowerCase() && (
                      <span className="ml-2 text-xs text-primary-600 font-semibold">(You)</span>
                    )}
                    {member.toLowerCase() === poolData.creator.toLowerCase() && (
                      <span className="ml-2 text-xs text-gray-600 font-semibold">(Creator)</span>
                    )}
                  </p>
                  <a
                    href={getExplorerUrl(member)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    View on explorer
                  </a>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                  Member
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Status (if user is a member) */}
      {memberStatus?.isMember && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Your Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Membership</p>
              <p className="text-sm font-semibold text-green-600">Active Member</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Collateral Balance</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatAmount(memberStatus.collateralBalance)} FLR
              </p>
            </div>
          </div>
          {memberStatus.hasDefaulted && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs font-medium text-red-800">⚠️ Defaulted</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canContribute() && (
          <button
            onClick={onContribute}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Contributing...' : `Contribute ${formatAmount(poolData.contributionAmount)} FLR`}
          </button>
        )}

        {canExecutePayout() && (
          <button
            onClick={onExecutePayout}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? 'Processing...' : 'Execute Payout'}
          </button>
        )}

        {poolData.isActive && account && (
          <button
            onClick={onCheckDefaults}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? 'Checking...' : 'Check for Defaults'}
          </button>
        )}

        {!poolData.isActive && memberStatus?.isMember && (
          <button
            onClick={onReturnCollateral}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Processing...' : 'Return Collateral'}
          </button>
        )}
      </div>

      {/* Information Notice */}
      {!memberStatus?.isMember && poolData.isActive && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            You are not a member of this pool. To participate, you need to join the pool first.
          </p>
        </div>
      )}
    </div>
  );
};

export default PoolDisplay;
