import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Users, Check, Clock, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface JoinCardProps {
  siteId: string;
  cardConfig?: {
    title?: string;
    subtitle?: string;
    description?: string;
    style?: any;
  };
  colorTheme?: {
    primary?: string;
    secondary?: string;
    gradient?: string;
  };
}

export function JoinCard({ siteId, cardConfig, colorTheme }: JoinCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isJoining, setIsJoining] = useState(false);

  // Check current membership status
  const { data: membershipStatus, isLoading: membershipLoading } = useQuery({
    queryKey: [`/api/sites/${siteId}/membership`],
    retry: false,
  });

  // Join collective mutation
  const joinCollectiveMutation = useMutation({
    mutationFn: async () => {
      setIsJoining(true);
      const response = await apiRequest('POST', `/api/sites/${siteId}/join`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setIsJoining(false);
      toast({
        title: "Welcome to the collective!",
        description: data.message || "You have successfully joined this collective.",
        variant: "default",
      });
      
      // Redirect to member home page after a brief delay
      setTimeout(() => {
        setLocation(`/site/${siteId}/home`);
      }, 1500);
    },
    onError: (error: Error) => {
      setIsJoining(false);
      toast({
        title: "Join failed",
        description: error.message || "Failed to join collective. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoinCollective = () => {
    joinCollectiveMutation.mutate();
  };

  if (membershipLoading) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="join-card-loading">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </CardContent>
      </Card>
    );
  }

  // Show different states based on membership status
  const isMember = (membershipStatus as any)?.isMember;
  const membershipRole = (membershipStatus as any)?.collectiveRole;

  if (isMember) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" data-testid="join-card-member">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-800 dark:text-green-200">You're a Member!</CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            You have access to this collective as a {membershipRole || 'member'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => setLocation(`/site/${siteId}/home`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-access-home"
          >
            <Users className="w-4 h-4 mr-2" />
            Access Member Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default join card for non-members
  const title = cardConfig?.title || "Join Our Collective";
  const subtitle = cardConfig?.subtitle || "Become a member of our community";
  const description = cardConfig?.description || "Join this collective to access member-only content, participate in discussions, and collaborate with other members.";

  const primaryColor = colorTheme?.primary || 'rgb(99, 102, 241)';
  const gradientStyle = colorTheme?.gradient ? { background: colorTheme.gradient } : { backgroundColor: primaryColor };

  return (
    <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg" data-testid="join-card">
      <CardHeader className="text-center">
        <div 
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white"
          style={gradientStyle}
        >
          <Users className="w-6 h-6" />
        </div>
        <Badge variant="secondary" className="mx-auto mb-2 text-xs font-medium" data-testid="badge-collective">
          Collective
        </Badge>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
        
        <Button 
          onClick={handleJoinCollective}
          disabled={isJoining}
          className="w-full text-white font-medium"
          style={gradientStyle}
          data-testid="button-join-collective"
        >
          {isJoining ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Join Collective
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By joining, you agree to be part of this collective community
        </p>
      </CardContent>
    </Card>
  );
}