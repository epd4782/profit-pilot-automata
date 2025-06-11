
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { volatilityService, VolatilityRanking } from "@/services/volatilityService";
import { extremeStopService } from "@/services/extremeStopService";

export const VolatilityWidget = () => {
  const [volatilityRanking, setVolatilityRanking] = useState<VolatilityRanking[]>([]);
  const [extremeStopStatus, setExtremeStopStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const updateData = () => {
      const ranking = volatilityService.getVolatilityRanking().slice(0, 10);
      const stopStatus = extremeStopService.getStatus();
      
      setVolatilityRanking(ranking);
      setExtremeStopStatus(stopStatus);
      setIsLoading(false);
    };
    
    updateData();
    
    // Update every 30 seconds
    const interval = setInterval(updateData, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getVolatilityColor = (score: number) => {
    if (score >= 8) return "bg-red-500";
    if (score >= 5) return "bg-orange-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-gray-500";
  };
  
  const getVolatilityLabel = (score: number) => {
    if (score >= 8) return "Extrem";
    if (score >= 5) return "Hoch";
    if (score >= 3) return "Mittel";
    return "Niedrig";
  };
  
  return (
    <div className="space-y-4">
      {/* Extreme Stop Status */}
      <Card className="trading-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Extrem-Stopp Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {extremeStopStatus && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Stop-Loss Events (30min)</span>
                <Badge variant={extremeStopStatus.recentStopLosses >= extremeStopStatus.maxStopLosses ? "destructive" : "outline"}>
                  {extremeStopStatus.recentStopLosses}/{extremeStopStatus.maxStopLosses}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Portfolio-Verlust (4h)</span>
                  <Badge variant={parseFloat(extremeStopStatus.portfolioLoss4h) >= extremeStopStatus.maxPortfolioLoss ? "destructive" : "outline"}>
                    {extremeStopStatus.portfolioLoss4h}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.min(100, (parseFloat(extremeStopStatus.portfolioLoss4h) / extremeStopStatus.maxPortfolioLoss) * 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Monitoring: {extremeStopStatus.isMonitoring ? "Aktiv" : "Inaktiv"} • 
                Snapshots: {extremeStopStatus.portfolioSnapshots}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Volatility Heatmap */}
      <Card className="trading-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Volatilitäts-Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Lade Volatilitätsdaten...</div>
          ) : (
            <div className="space-y-2">
              {volatilityRanking.map((item, index) => (
                <div key={item.symbol} className="flex items-center justify-between p-2 rounded-md bg-trading-card-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono w-6">{item.rank}</span>
                    <span className="text-xs font-medium">{item.symbol.replace('USDT', '')}</span>
                    <Badge 
                      variant={item.isEligible ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {getVolatilityLabel(item.volatilityScore)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{item.volatilityScore.toFixed(1)}%</span>
                    <div className={`w-3 h-3 rounded-full ${getVolatilityColor(item.volatilityScore)}`} />
                  </div>
                </div>
              ))}
              
              {volatilityRanking.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Keine Volatilitätsdaten verfügbar
                </div>
              )}
              
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Mindest-Volatilität: {volatilityService.getMinVolatilityThreshold()}% • 
                  Eligible: {volatilityRanking.filter(v => v.isEligible).length}/{volatilityRanking.length}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
