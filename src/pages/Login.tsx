
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUpIcon, LockIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

const Login = () => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = login(password);
    
    if (success) {
      toast.success("Login erfolgreich", {
        description: "Willkommen zurück bei ProfitPilot!"
      });
      navigate('/dashboard');
    } else {
      toast.error("Login fehlgeschlagen", {
        description: "Das eingegebene Passwort ist nicht korrekt."
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-trading-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-trading-border rounded-full flex items-center justify-center">
            <TrendingUpIcon className="h-12 w-12 text-success-DEFAULT" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2 text-center">ProfitPilot</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Passwortgeschütztes Dashboard
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="password"
              placeholder="Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Wird geprüft..." : "Dashboard öffnen"}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-8 text-center">
          Version 1.0.0 | Entwickelt mit ♥ für zuverlässiges Trading
        </p>
      </div>
    </div>
  );
};

export default Login;
