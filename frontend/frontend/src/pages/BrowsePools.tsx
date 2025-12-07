import { useWallet } from "@/hooks/useWallet";
import { usePools } from "@/hooks/usePools";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Plus } from "lucide-react";

const BrowsePools = () => {
  const { wallet } = useWallet();
  const { pools, loading, error, getActivePools, getPoolsSortedByDate } = usePools();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'all' | 'active' | 'newest'>('all');

  // Get sorted/filtered pools based on selection
  const displayPools = useMemo(() => {
    switch (sortBy) {
      case 'active':
        return getActivePools();
      case 'newest':
        return getPoolsSortedByDate();
      default:
        return pools;
    }
  }, [pools, sortBy, getActivePools, getPoolsSortedByDate]);

  useEffect(() => {
    if (!wallet.isConnected) {
      navigate('/connect-wallet');
    }
  }, [wallet.isConnected, navigate]);

  if (!wallet.isConnected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pools from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>;
      case 'full':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Full</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Browse Pools</h1>
          <p className="text-muted-foreground">Join or create community savings pools</p>
        </div>

        {/* Create Pool Card */}
        <Card className="bg-glass p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Create New Pool</h3>
                <p className="text-sm text-muted-foreground">Start a new savings pool with custom terms</p>
              </div>
            </div>
            <Button variant="accent" onClick={() => navigate('/create-pool')}>
              Create Pool
            </Button>
          </div>
        </Card>

        {/* Available Pools */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Available Pools ({displayPools.length})</h2>

          {/* Sort/Filter Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('all')}
            >
              All ({pools.length})
            </Button>
            <Button
              variant={sortBy === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('active')}
            >
              Active Only
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              Newest First
            </Button>
          </div>
        </div>

        {displayPools.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {pools.length === 0
              ? 'No pools available. Create the first one!'
              : 'No pools match the selected filter.'}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {displayPools.map((pool) => (
            <Card key={pool.id} className="bg-glass p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{pool.name}</h3>
                  <p className="text-sm text-muted-foreground">Pool #{pool.id}</p>
                </div>
                {getStatusBadge(pool.status)}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-semibold text-foreground">{pool.contributionAmount} FLR</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-semibold text-foreground">{pool.currentMembers}/{pool.maxMembers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Round</span>
                  <span className="font-semibold text-foreground">{pool.currentRound}/{pool.totalRounds}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collateral</span>
                  <span className="font-semibold text-primary">{pool.collateralPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Yield Rate</span>
                  <span className="font-semibold text-accent">{pool.yieldRate}% APY</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{Math.round((pool.currentMembers / pool.maxMembers) * 100)}%</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${(pool.currentMembers / pool.maxMembers) * 100}%` }}
                  />
                </div>
              </div>

              <Button 
                variant={pool.status === 'active' ? 'hero' : 'outline'} 
                className="w-full"
                disabled={pool.status !== 'active'}
                onClick={() => navigate(`/pool/${pool.id}`)}
              >
                {pool.status === 'active' ? 'Join Pool' : pool.status === 'full' ? 'Pool Full' : 'Completed'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowsePools;
