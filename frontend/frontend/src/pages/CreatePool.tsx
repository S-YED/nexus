import { useWallet } from "@/hooks/useWallet";
import { usePools } from "@/hooks/usePools";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";

const CreatePool = () => {
  const { wallet } = useWallet();
  const { createPool } = usePools();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    poolName: '',
    contributionAmount: '',
    maxMembers: '6',
    collateralPercent: '10'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!wallet.isConnected) {
      navigate('/connect-wallet');
    }
  }, [wallet.isConnected, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsCreating(true);
      await createPool({
        name: formData.poolName,
        contributionAmount: parseFloat(formData.contributionAmount),
        creator: wallet.address || '0x0000000000000000000000000000000000000000'
      });

      navigate('/browse-pools');
    } catch (error) {
      console.error('Error creating pool:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const calculateCollateral = () => {
    const amount = parseFloat(formData.contributionAmount) || 0;
    const percent = parseFloat(formData.collateralPercent) || 0;
    return (amount * percent / 100).toFixed(2);
  };

  if (!wallet.isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate('/browse-pools')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pools
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create New Pool</h1>
            <p className="text-muted-foreground">Set up your community savings pool</p>
          </div>

          <Card className="bg-glass p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="poolName">Pool Name *</Label>
                <Input
                  id="poolName"
                  placeholder="e.g., Flare Builders Circle"
                  value={formData.poolName}
                  onChange={(e) => setFormData({...formData, poolName: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="contributionAmount">Monthly Contribution (FLR) *</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  placeholder="100"
                  min="1"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({...formData, contributionAmount: e.target.value})}
                  required
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount each member contributes monthly</p>
              </div>

              <div>
                <Label htmlFor="maxMembers">Maximum Members *</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={formData.maxMembers}
                  disabled
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">Fixed at 6 members for MVP</p>
              </div>

              <Card className="bg-secondary/50 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Pool Summary</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Contribution:</span>
                    <span className="font-semibold">{formData.contributionAmount || '0'} FLR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pool Size:</span>
                    <span className="font-semibold">{(parseFloat(formData.contributionAmount) || 0) * 6} FLR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-semibold">6 months</span>
                  </div>
                </div>
              </Card>

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isCreating}>
                {isCreating ? 'Creating Pool...' : 'Create Pool'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePool;
