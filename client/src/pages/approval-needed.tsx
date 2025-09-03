import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail } from 'lucide-react';

export function ApprovalNeeded() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800 border-slate-600">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Approval Needed</CardTitle>
          <CardDescription className="text-slate-400">
            Your access request has been submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-slate-300 text-sm">
              We've submitted your access request to the administrator. 
              You'll receive an email notification once your access is approved.
            </p>
          </div>
          
          <div className="pt-4">
            <p className="text-xs text-slate-500 mb-4">
              If you believe this is an error, please contact the administrator directly.
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => window.location.href = '/logout'}
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}