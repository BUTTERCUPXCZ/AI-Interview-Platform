import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your subscription payment was cancelled. No charges have been made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You can still enjoy our Free plan features:
            </p>
            <ul className="text-sm space-y-1">
              <li>✓ 2 practice interviews per week</li>
              <li>✓ Basic AI feedback</li>
              <li>✓ Access to 1 role specialization</li>
              <li>✓ Progress tracking</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelPage;