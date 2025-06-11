
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertTriangleIcon,
  RefreshCwIcon,
  ActivityIcon
} from 'lucide-react';
import { systemHealthService, SystemHealthReport } from '@/services/systemHealthCheck';
import { toast } from 'sonner';

interface SystemHealthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemHealthDialog = ({ isOpen, onOpenChange }: SystemHealthDialogProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<SystemHealthReport | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const healthReport = await systemHealthService.performFullHealthCheck();
      setReport(healthReport);
      
      if (healthReport.overall === 'healthy') {
        toast.success('System-Check erfolgreich', {
          description: 'Alle Systeme sind einsatzbereit für Live-Trading'
        });
      } else if (healthReport.overall === 'warning') {
        toast.warning('System-Check mit Warnungen', {
          description: 'Einige Bereiche benötigen Aufmerksamkeit'
        });
      } else {
        toast.error('Kritische System-Probleme', {
          description: 'System nicht bereit für Live-Trading'
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('System-Check fehlgeschlagen');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-red-500" />
    );
  };

  const getOverallStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-500',
      warning: 'bg-yellow-500', 
      critical: 'bg-red-500'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-white`}>
        {status === 'healthy' ? 'Einsatzbereit' : 
         status === 'warning' ? 'Warnungen' : 'Kritisch'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            System-Gesundheitscheck
            {report && getOverallStatusBadge(report.overall)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!report && (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                Führe einen Gesundheitscheck durch, um die Einsatzbereitschaft für Live-Trading zu prüfen.
              </AlertDescription>
            </Alert>
          )}

          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System-Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API-Verbindung</span>
                    {getStatusIcon(report.checks.apiConnection)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API-Keys gültig</span>
                    {getStatusIcon(report.checks.apiKeysValid)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account-Zugriff</span>
                    {getStatusIcon(report.checks.accountAccess)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trading-Berechtigung</span>
                    {getStatusIcon(report.checks.tradingPermissions)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Strategien geladen</span>
                    {getStatusIcon(report.checks.strategiesLoaded)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Konfiguration gültig</span>
                    {getStatusIcon(report.checks.configValid)}
                  </div>
                </CardContent>
              </Card>

              {report.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600">Fehler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {report.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-600">Warnungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {report.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-600">Empfehlungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <Button 
            onClick={runHealthCheck} 
            disabled={isChecking}
            className="gap-2"
          >
            {isChecking && <RefreshCwIcon className="h-4 w-4 animate-spin" />}
            {isChecking ? 'Prüfe...' : 'System prüfen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
