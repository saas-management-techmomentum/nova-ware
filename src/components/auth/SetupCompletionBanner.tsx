
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SetupCompletionBanner = () => {
  const { user, userRole, isUserAdmin, completeUserSetup } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  // Don't show banner if user has proper role assignment
  if (!user || userRole || isUserAdmin) {
    return null;
  }

  // Don't show if user doesn't have company name in metadata
  if (!user.user_metadata?.company_name) {
    return null;
  }

  const handleCompleteSetup = async () => {
    try {
      setIsCompleting(true);
      await completeUserSetup();
      
      toast({
        title: "Setup Complete!",
        description: "Your admin account has been set up successfully. You now have full access to all features.",
      });
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: "Setup Error",
        description: "There was a problem completing your setup. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="bg-amber-50 border-amber-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              Complete Your Account Setup
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Your account for <strong>{user.user_metadata.company_name}</strong> needs to be set up as an administrator. 
              Click below to complete your setup and gain full access to all features.
            </p>
            <Button
              onClick={handleCompleteSetup}
              disabled={isCompleting}
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {isCompleting ? 'Setting up...' : 'Complete Admin Setup'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupCompletionBanner;
