import { CONNECTION_STATES, UI_CONFIG, getExplorerUrl } from '../config';

/**
 * WalletConnection Component
 * Displays wallet connection status and provides connect/disconnect functionality
 */
const WalletConnection = ({
  connectionState,
  account,
  error,
  isLoading,
  connectWallet,
  disconnectWallet,
  switchToCoston2,
}) => {
  // Format address for display (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Render connection status badge
  const renderStatusBadge = () => {
    const statusConfig = {
      [CONNECTION_STATES.NOT_INSTALLED]: {
        color: 'bg-red-100 text-red-800',
        text: 'MetaMask Not Installed',
      },
      [CONNECTION_STATES.NOT_CONNECTED]: {
        color: 'bg-gray-100 text-gray-800',
        text: 'Not Connected',
      },
      [CONNECTION_STATES.WRONG_NETWORK]: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Wrong Network',
      },
      [CONNECTION_STATES.CONNECTED]: {
        color: 'bg-green-100 text-green-800',
        text: 'Connected',
      },
      [CONNECTION_STATES.CONNECTING]: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Connecting...',
      },
    };

    const config = statusConfig[connectionState] || statusConfig[CONNECTION_STATES.NOT_CONNECTED];

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {config.text}
      </span>
    );
  };

  // Render main action button based on state
  const renderActionButton = () => {
    if (connectionState === CONNECTION_STATES.NOT_INSTALLED) {
      return (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Install MetaMask
        </a>
      );
    }

    if (connectionState === CONNECTION_STATES.WRONG_NETWORK) {
      return (
        <button
          onClick={switchToCoston2}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Switching Network...' : 'Switch to Coston2'}
        </button>
      );
    }

    if (connectionState === CONNECTION_STATES.CONNECTED) {
      return (
        <button
          onClick={disconnectWallet}
          className="btn-secondary"
        >
          Disconnect
        </button>
      );
    }

    return (
      <button
        onClick={connectWallet}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Wallet Connection</h2>
        {renderStatusBadge()}
      </div>

      {/* Connection Details */}
      {connectionState === CONNECTION_STATES.CONNECTED && account && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Connected Address</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {formatAddress(account)}
              </p>
            </div>
            <a
              href={getExplorerUrl(account)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View on Explorer →
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {connectionState === CONNECTION_STATES.NOT_CONNECTED && !error && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Getting Started</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Connect your MetaMask wallet</li>
            <li>Ensure you're on Flare Coston2 testnet</li>
            <li>Get test tokens from the <a href={UI_CONFIG.faucetUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">faucet</a></li>
          </ol>
        </div>
      )}

      {connectionState === CONNECTION_STATES.WRONG_NETWORK && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Wrong Network</h3>
          <p className="text-sm text-yellow-700">
            Please switch to Flare Coston2 testnet to use this application.
            Click the button below to switch automatically.
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        {renderActionButton()}
      </div>

      {/* Network Info */}
      {connectionState === CONNECTION_STATES.CONNECTED && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Network</p>
              <p className="font-medium text-gray-900">Coston2 Testnet</p>
            </div>
            <div>
              <p className="text-gray-600">Chain ID</p>
              <p className="font-medium text-gray-900">114</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
