
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadIcon, PlusIcon, CheckCircle2Icon, CircleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { strategyService, StrategySettings } from "@/services/strategyService";
import { StrategySchema, StrategyTemplate } from "@/models/trade";

const defaultTemplates: StrategyTemplate[] = [
  {
    id: "template_rsi_ema",
    name: "RSI + EMA Crossover",
    description: "Kombiniert RSI-Überkauf/Überverkauf mit EMA-Kreuzungen für Trendbestätigung.",
    schema: {
      name: "RSI + EMA Cross",
      description: "Kombiniert RSI-Überkauf/Überverkauf mit EMA-Kreuzungen für Trendbestätigung.",
      version: "1.0",
      symbols: ["BTCUSDT", "ETHUSDT"],
      timeframes: ["15m", "1h"],
      riskPerTrade: 1.0,
      maxDailyLoss: 5.0,
      maxTradesPerDay: 10,
      stopLoss: 2.0,
      takeProfit: 4.0,
      trailingStop: true,
      trailingStopDistance: 1.0,
      trailingTakeProfit: false,
      indicators: {
        type: "RSI_EMA",
        parameters: {
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          emaShortPeriod: 9,
          emaLongPeriod: 21,
          useVolume: true,
          volumeThreshold: 1.5
        }
      }
    }
  },
  {
    id: "template_bollinger_macd",
    name: "Bollinger + MACD",
    description: "Nutzt Bollinger Bands für Volatilität und MACD für Trendbestätigung.",
    schema: {
      name: "Bollinger + MACD",
      description: "Nutzt Bollinger Bands für Volatilität und MACD für Trendbestätigung.",
      version: "1.0",
      symbols: ["BTCUSDT", "BNBUSDT"],
      timeframes: ["5m", "15m"],
      riskPerTrade: 1.5,
      maxDailyLoss: 6.0,
      maxTradesPerDay: 15,
      stopLoss: 1.5,
      takeProfit: 3.0,
      trailingStop: true,
      trailingStopDistance: 0.8,
      trailingTakeProfit: true,
      trailingTakeProfitDistance: 0.5,
      indicators: {
        type: "BOLLINGER_MACD",
        parameters: {
          bollingerPeriod: 20,
          bollingerStdDev: 2,
          macdFastPeriod: 12,
          macdSlowPeriod: 26,
          macdSignalPeriod: 9,
          useVolume: true,
          volumeThreshold: 2.0
        }
      }
    }
  }
];

export const StrategyManager = () => {
  const [activeTab, setActiveTab] = useState("existing");
  const [strategies, setStrategies] = useState<StrategySettings[]>([]);
  const [jsonContent, setJsonContent] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  
  // Load existing strategies on component mount
  useEffect(() => {
    const loadedStrategies = strategyService.getAllStrategies();
    setStrategies(loadedStrategies);
  }, []);
  
  // Convert StrategySchema to StrategySettings
  const convertSchemaToSettings = (schema: StrategySchema): StrategySettings => {
    return {
      id: schema.id || `strategy_${Date.now()}`,
      name: schema.name,
      description: schema.description,
      isActive: schema.isActive !== undefined ? schema.isActive : false,
      symbols: schema.symbols,
      stopLoss: schema.stopLoss,
      takeProfit: schema.takeProfit,
      trailingStop: schema.trailingStop,
      trailingTakeProfit: schema.trailingTakeProfit || false,
      trailingStopDistance: schema.trailingStopDistance || 1.0, // Default value if not provided
      timeframes: schema.timeframes,
      riskPerTrade: schema.riskPerTrade,
      maxDailyLoss: schema.maxDailyLoss,
      maxTradesPerDay: schema.maxTradesPerDay,
      indicators: {
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        emaShortPeriod: 9,
        emaLongPeriod: 21,
        useVolume: true,
        volumeThreshold: 1.5
      }
    };
  };
  
  // Toggle strategy active status
  const handleToggleActive = (id: string) => {
    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
      const isActive = !strategy.isActive;
      strategyService.updateStrategy(id, { isActive });
      
      // Update UI state
      setStrategies(strategies.map(s => 
        s.id === id ? { ...s, isActive } : s
      ));
      
      toast.success(
        isActive ? "Strategie aktiviert" : "Strategie deaktiviert", 
        { description: `${strategy.name} wurde ${isActive ? "aktiviert" : "deaktiviert"}.` }
      );
    }
  };
  
  // Delete strategy
  const handleDelete = (id: string) => {
    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
      strategyService.deleteStrategy(id);
      
      // Update UI state
      setStrategies(strategies.filter(s => s.id !== id));
      
      toast.success("Strategie gelöscht", { 
        description: `${strategy.name} wurde erfolgreich gelöscht.` 
      });
    }
  };
  
  // Handle JSON import
  const handleImportJSON = () => {
    try {
      setJsonError("");
      if (!jsonContent.trim()) {
        setJsonError("JSON-Inhalt ist leer.");
        return;
      }
      
      const parsed = JSON.parse(jsonContent);
      
      // Basic validation
      if (!parsed.name || !parsed.symbols || !parsed.timeframes) {
        setJsonError("Ungültiges Strategy-Schema. Name, Symbole und Timeframes sind erforderlich.");
        return;
      }
      
      // Convert to StrategySettings
      const newStrategy = convertSchemaToSettings(parsed);
      
      // Add the strategy
      const success = strategyService.addStrategy(newStrategy);
      
      if (success) {
        // Update UI
        setStrategies([...strategies, newStrategy]);
        setJsonContent("");
        setActiveTab("existing");
        
        toast.success("Strategie importiert", {
          description: `${newStrategy.name} wurde erfolgreich hinzugefügt.`
        });
      } else {
        setJsonError("Eine Strategie mit dieser ID existiert bereits.");
      }
    } catch (error) {
      console.error("JSON import error:", error);
      setJsonError("Fehler beim Parsen des JSON. Bitte überprüfe das Format.");
    }
  };
  
  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = defaultTemplates.find(t => t.id === templateId);
    if (template) {
      setTemplateName(template.schema.name || "");
    }
  };
  
  // Create strategy from template
  const handleCreateFromTemplate = () => {
    const template = defaultTemplates.find(t => t.id === selectedTemplate);
    
    if (!template) {
      toast.error("Bitte wähle eine Template-Strategie aus.");
      return;
    }
    
    try {
      const schema = {
        ...template.schema,
        id: `strategy_${Date.now()}`, // Generate a unique ID
        name: templateName || template.schema.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: false
      };
      
      // Convert to StrategySettings
      const newStrategy = convertSchemaToSettings(schema as StrategySchema);
      
      // Add the strategy
      const success = strategyService.addStrategy(newStrategy);
      
      if (success) {
        // Update UI
        setStrategies([...strategies, newStrategy]);
        setSelectedTemplate("");
        setTemplateName("");
        setActiveTab("existing");
        
        toast.success("Strategie erstellt", {
          description: `${newStrategy.name} wurde erfolgreich erstellt.`
        });
      } else {
        toast.error("Fehler beim Erstellen der Strategie.");
      }
    } catch (error) {
      console.error("Template creation error:", error);
      toast.error("Fehler beim Erstellen der Strategie aus dem Template.");
    }
  };
  
  return (
    <Card className="trading-card border-trading-accent bg-trading-card-bg">
      <CardHeader>
        <CardTitle className="text-xl text-trading-text">Strategie-Manager</CardTitle>
        <CardDescription>
          Verwalte deine Trading-Strategien oder importiere neue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-trading-dark">
            <TabsTrigger value="existing" className="flex-1">
              Vorhandene Strategien
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              JSON Import
            </TabsTrigger>
            <TabsTrigger value="template" className="flex-1">
              Aus Template erstellen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4 pt-4">
            {strategies.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-muted-foreground">Keine Strategien gefunden.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Erstelle eine neue Strategie aus einem Template oder importiere eine.
                </p>
              </div>
            ) : (
              <>
                {strategies.map((strategy) => (
                  <Card key={strategy.id} className="bg-trading-card-alt">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-trading-text">
                              {strategy.name}
                            </h4>
                            <Badge
                              variant={strategy.isActive ? "default" : "outline"}
                              className={strategy.isActive ? "bg-green-600" : ""}
                            >
                              {strategy.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {strategy.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {strategy.symbols.map((symbol) => (
                              <Badge key={symbol} variant="secondary" className="text-xs">
                                {symbol}
                              </Badge>
                            ))}
                            {strategy.timeframes.map((timeframe) => (
                              <Badge key={timeframe} variant="outline" className="text-xs">
                                {timeframe}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={strategy.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleActive(strategy.id)}
                          >
                            {strategy.isActive ? "Deaktivieren" : "Aktivieren"}
                          </Button>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(strategy.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="json-input">JSON-Strategy-Schema</Label>
                <div className="mt-1">
                  <textarea
                    id="json-input"
                    className="w-full h-64 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder='{"name": "My Strategy", "symbols": ["BTCUSDT"], ...}'
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                  ></textarea>
                </div>
                {jsonError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <CircleAlertIcon className="h-4 w-4" /> {jsonError}
                  </p>
                )}
              </div>
              
              <Button
                className="w-full flex items-center gap-2"
                onClick={handleImportJSON}
              >
                <UploadIcon className="h-4 w-4" /> Strategie importieren
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="grid gap-4">
                {defaultTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircle2Icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTemplate && (
                <div className="space-y-4 pt-2">
                  <Separator />
                  <div>
                    <Label htmlFor="template-name">Name der neuen Strategie</Label>
                    <Input
                      id="template-name"
                      className="mt-1"
                      placeholder={defaultTemplates.find(t => t.id === selectedTemplate)?.schema.name}
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    className="w-full flex items-center gap-2"
                    onClick={handleCreateFromTemplate}
                  >
                    <PlusIcon className="h-4 w-4" /> Strategie erstellen
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
