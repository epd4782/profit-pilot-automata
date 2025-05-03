
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUpIcon } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEnterDashboard = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  useEffect(() => {
    // Prüfe, ob API-Schlüssel konfiguriert sind und leite direkt zum Dashboard weiter
    const hasApiKeys = localStorage.getItem("binance_api_key") && localStorage.getItem("binance_secret_key");
    
    if (hasApiKeys) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-trading-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 bg-trading-border rounded-full flex items-center justify-center">
            <TrendingUpIcon className="h-12 w-12 text-success-DEFAULT" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">ProfitPilot</h1>
        <p className="text-muted-foreground mb-8">
          Dein vollautomatisierter Krypto-Trading-Bot
        </p>
        
        <Button 
          size="lg" 
          className="w-full mb-4"
          onClick={handleEnterDashboard}
          disabled={loading}
        >
          {loading ? "Wird geladen..." : "Dashboard öffnen"}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Version 1.0.0 | Entwickelt mit ♥ für zuverlässiges Trading
        </p>
      </div>
    </div>
  );
};

export default Index;
