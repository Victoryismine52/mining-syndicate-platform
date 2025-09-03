import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordGateProps {
  onPasswordCorrect: () => void;
}

export function PasswordGate({ onPasswordCorrect }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a brief loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === 'Conduit2025') {
      localStorage.setItem('mining-syndicate-authenticated', 'true');
      onPasswordCorrect();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      
      {/* Conduit Logo */}
      <div className="absolute top-6 left-6 z-10">
        <a href="https://cndt.io" target="_blank" rel="noopener noreferrer">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <img 
              src="https://cndt.io/nav2/logo-full.svg" 
              alt="Conduit Network Logo" 
              className="h-6 w-auto"
            />
          </div>
        </a>
      </div>

      <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-sm border-slate-600 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto flex items-center justify-center">
            <Lock className="text-blue-400 text-2xl" />
          </div>
          <CardTitle className="text-2xl text-white">Mining Syndicate</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the access password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pr-10"
                required
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm text-center" data-testid="text-error">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Verifying...' : 'Access Platform'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}