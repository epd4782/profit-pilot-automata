
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusIcon, FileUpIcon, SaveIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { StrategySchema } from "@/models/trade";

export function StrategyManager() {
  const [activeTab, setActiveTab] = useState("templates");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Strategy templates
  const templates: StrategySchema[] = [
    {
      type: "RSI + EMA Cross",
      parameters: {
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        emaFast: 9,
        emaSlow: 21,
        timeframe: "1h",
        takeProfitPct: 2.5,
        stopLossPct: 1.5
      },
      conditions: [
        {
          type: "RSI",
          value: 30,
          lookback: 1,
          compareTo: "below"
        },
        {
          type: "EMA_CROSS",
          lookback: 3,
          timeframe: "1h"
        }
      ]
    },
    {
      type: "Bollinger Bands Breakout",
      parameters: {
        bollingerPeriod: 20,
        bollingerStdDev: 2,
        volumeThreshold: 1.5,
        timeframe: "4h",
        takeProfitPct: 3.0,
        stopLossPct: 2.0
      },
      conditions: [
        {
          type: "PRICE_BREAKOUT",
          value: 0,
          compareTo: "upper_band"
        },
        {
          type: "VOLUME_SPIKE",
          value: 1.5,
          lookback: 5
        }
      ]
    }
  ];

  const handleJsonImport = () => {
    try {
      if (!jsonInput.trim()) {
        setJsonError("JSON darf nicht leer sein.");
        return;
      }

      const parsed = JSON.parse(jsonInput);
      
      // Basic validation
      if (!parsed.type || !parsed.parameters) {
        setJsonError("Ungültiges Strategy-Schema: 'type' und 'parameters' sind erforderlich.");
        return;
      }

      setJsonError(null);
      toast.success("Strategie importiert", {
        description: `${parsed.type} wurde erfolgreich importiert.`
      });

      // Here you would save the strategy to your storage
      console.log("Imported strategy:", parsed);
      
      // Clear the input
      setJsonInput("");
    } catch (error) {
      setJsonError("Ungültiges JSON-Format. Bitte überprüfen Sie Ihre Eingabe.");
    }
  };

  const handleTemplateSelect = (template: StrategySchema) => {
    // Here you would save the selected template to your active strategies
    toast.success("Template aktiviert", {
      description: `Strategie "${template.type}" wurde zu Ihren aktiven Strategien hinzugefügt.`
    });
  };

  return (
    <Card className="bg-card border-trading-border">
      <CardHeader>
        <CardTitle>Strategie-Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="import">JSON-Import</TabsTrigger>
            <TabsTrigger value="active">Aktive Strategien</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, idx) => (
                <Card key={idx} className="bg-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2 text-sm">
                    <div className="space-y-1">
                      <div><strong>Timeframe:</strong> {template.parameters.timeframe}</div>
                      {template.type.includes("RSI") && (
                        <>
                          <div><strong>RSI Period:</strong> {template.parameters.rsiPeriod}</div>
                          <div><strong>RSI Levels:</strong> {template.parameters.rsiOversold}/{template.parameters.rsiOverbought}</div>
                        </>
                      )}
                      {template.type.includes("Bollinger") && (
                        <>
                          <div><strong>BB Period:</strong> {template.parameters.bollingerPeriod}</div>
                          <div><strong>BB StdDev:</strong> {template.parameters.bollingerStdDev}</div>
                        </>
                      )}
                      <div><strong>Take Profit:</strong> {template.parameters.takeProfitPct}%</div>
                      <div><strong>Stop Loss:</strong> {template.parameters.stopLossPct}%</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Strategie verwenden
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jsonInput">JSON-Strategie importieren</Label>
                <div className="relative">
                  <textarea
                    id="jsonInput"
                    className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder='{"type": "Custom Strategy", "parameters": {...}, "conditions": [...]}'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                </div>
                {jsonError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>{jsonError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <Button onClick={handleJsonImport}>
                <FileUpIcon className="h-4 w-4 mr-2" />
                JSON importieren
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Ihre aktiven Strategien werden hier angezeigt.
                <br />
                Fügen Sie neue Strategien über Templates oder JSON-Import hinzu.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
