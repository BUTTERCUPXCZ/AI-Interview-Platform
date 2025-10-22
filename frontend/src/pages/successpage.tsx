import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/api/api';
import { useToast } from '@/hooks/use-toast';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const sessionId = searchParams.get('session_id');
  const { toast } = useToast();

  useEffect(() => {
    // Sync subscription from Stripe
        const syncSubscription = async () => {
      try {
        console.log('🔄 Syncing subscription after successful payment...');
        const response = await api.post(
          `${import.meta.env.VITE_API_BASE_URL}/subscription/sync`,
          { sessionId },
          { withCredentials: true }
        );
        
        console.log('✅ Subscription synced:', response.data);
        
        toast({
          title: "Subscription Activated!",
          description: `Your ${response.data.currentPlan} plan is now active.`,
        });
        
        setSyncing(false);
      } catch (error) {
        console.error('❌ Failed to sync subscription:', error);
        setSyncError(true);
        setSyncing(false);
        
        toast({
          variant: "destructive",
          title: "Sync Warning",
          description: "Please refresh the page in a few moments if you don't see Pro features.",
        });
      }
    };

    // Wait 2 seconds before syncing (give webhook time to process)
    const syncTimer = setTimeout(() => {
      syncSubscription();
    }, 2000);

    return () => clearTimeout(syncTimer);
  }, [toast, sessionId]);

  useEffect(() => {
    // Only start countdown after sync is complete
    if (!syncing && !syncError) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, syncing, syncError]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {syncing ? (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {syncing ? 'Activating Your Subscription...' : 'Payment Successful!'}
          </CardTitle>
          <CardDescription>
            {syncing 
              ? 'Please wait while we activate your Pro features...'
              : 'Your subscription has been activated successfully.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!syncing && (
            <>
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  You now have access to all Pro features
                </p>
                <ul className="text-sm space-y-1">
                  <li>✓ Unlimited practice interviews</li>
                  <li>✓ Advanced AI feedback & analysis</li>
                  <li>✓ Access to all 5 role specializations</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              {sessionId && (
                <p className="text-xs text-muted-foreground text-center">
                  Session ID: {sessionId.slice(0, 20)}...
                </p>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Redirecting to dashboard in {countdown} seconds...
              </div>

              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          
          {syncing && (
            <div className="text-center text-sm text-muted-foreground">
              Syncing your subscription with Stripe...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;