
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyFormProps {
  onApiKeySaved: (apiKey: string, secretKey: string) => void;
  isConfigured: boolean;
}

export const ApiKeyForm = ({ onApiKeySaved, isConfigured }: ApiKeyFormProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey || !secretKey) {
      toast({
        title: "Fehler",
        description: "Bitte gib beide API-Schlüssel ein.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In einer realen Anwendung würde hier eine Verbindungsprüfung stattfinden
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ersetze durch sichere Speicherung in einer realen Anwendung
      localStorage.setItem("binance_api_key", apiKey);
      localStorage.setItem("binance_secret_key", secretKey);
      
      onApiKeySaved(apiKey, secretKey);
      
      toast({
        title: "API-Schlüssel gespeichert",
        description: "Deine Binance API-Schlüssel wurden erfolgreich gespeichert.",
      });
      
      setApiKey("");
      setSecretKey("");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Speichern deiner API-Schlüssel ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="trading-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Binance API-Konfiguration</CardTitle>
          <LockIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            <div className="bg-muted/20 p-3 rounded-md border border-muted">
              <div className="text-sm font-medium">API-Verbindung aktiv</div>
              <div className="text-xs text-muted-foreground mt-1">
                Deine Binance API-Schlüssel sind konfiguriert und aktiv.
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                localStorage.removeItem("binance_api_key");
                localStorage.removeItem("binance_secret_key");
                onApiKeySaved("", "");
                toast({
                  title: "API-Schlüssel zurückgesetzt",
                  description: "Deine Binance API-Schlüssel wurden zurückgesetzt.",
                });
              }}
            >
              API-Schlüssel zurücksetzen
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API-Schlüssel</Label>
              <Input 
                id="api-key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="Dein Binance API-Schlüssel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret-Schlüssel</Label>
              <Input 
                id="secret-key" 
                type="password" 
                value={secretKey} 
                onChange={(e) => setSecretKey(e.target.value)} 
                placeholder="Dein Binance Secret-Schlüssel"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : "API-Schlüssel speichern"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Hinweis: Erstelle API-Schlüssel in deinem Binance-Konto und aktiviere die Berechtigung zum Handeln.
              Deine API-Schlüssel werden lokal in deinem Browser gespeichert.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
