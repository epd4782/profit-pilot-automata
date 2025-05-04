
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, FileIcon, UploadIcon, SaveIcon, Trash2Icon, FilePenIcon } from "lucide-react";
import { StrategySchema, StrategyTemplate } from "@/models/trade";
import { useTradingContext } from "@/contexts/TradingContext";
import { toast } from "sonner";

// Sample strategy templates
const strategyTemplates: StrategyTemplate[] = [
  {
    id: "rsi-ema-cross",
    name: "RSI + EMA Cross",
    description: "Kombiniert RSI-Überkauf/Überverkauf mit EMA-Kreuzungen für Trendbestätigung.",
    schema: {
      indicators: {
        rsi: {
          type: "RSI",
          parameters: {
            period: 14,
            overbought: 70,
            oversold: 30
          },
          conditions: [
            {
              type: "BELOW",
              value: 30
            }
          ]
        },
        emaShort: {
          type: "EMA",
          parameters: {
            period: 9
          },
          conditions: [
            {
              type: "CROSSOVER",
              compareTo: "emaLong"
            }
          ]
        },
        emaLong: {
          type: "EMA",
          parameters: {
            period: 21
          }
        }
      },
      entryRules: [
        "RSI unter 30 (überverkauft)",
        "Kurzer EMA kreuzt langen EMA von unten nach oben",
        "Preis ist über kurzem EMA"
      ],
      exitRules: [
        "Take Profit erreicht",
        "Stop Loss erreicht",
        "RSI über 70 (überkauft)",
        "Kurzer EMA kreuzt langen EMA von oben nach unten"
      ]
    }
  },
  {
    id: "macd-bb-volume",
    name: "MACD + Bollinger + Volumen",
    description: "MACD-Signale mit Bollinger Bands und Volumenbestätigung für starke Trendwenden.",
    schema: {
      indicators: {
        macd: {
          type: "MACD",
          parameters: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9
          },
          conditions: [
            {
              type: "CROSSOVER",
              compareTo: "signal"
            }
          ]
        },
        bb: {
          type: "BB",
          parameters: {
            period: 20,
            stdDev: 2
          },
          conditions: [
            {
              type: "BELOW",
              value: "lowerBand"
            }
          ]
        },
        volume: {
          type: "VOLUME",
          parameters: {
            lookback: 10
          },
          conditions: [
            {
              type: "ABOVE",
              value: 150, // 150% of average volume
              lookback: 10
            }
          ]
        }
      },
      entryRules: [
        "MACD-Linie kreuzt Signal-Linie von unten",
        "Preis nahe oder unter unterem Bollinger Band",
        "Volumen ist 50% über Durchschnitt"
      ]
    }
  }
];

export const StrategyManager = () => {
  const { strategies, addStrategy, updateStrategy } = useTradingContext();
  const [activeTab, setActiveTab] = useState("existing");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newStrategy, setNewStrategy] = useState<Partial<StrategySchema>>({
    name: "",
    description: "",
    symbols: ["BTCUSDT"],
    timeframes: ["15m"],
    riskPerTrade: 1,
    maxDailyLoss: 5,
    maxTradesPerDay: 10,
    stopLoss: 2,
    takeProfit: 4,
    trailingStop: false
  });

  const handleImportStrategy = () => {
    try {
      const strategy = JSON.parse(jsonInput) as StrategySchema;
      
      // Validate minimum required fields
      if (!strategy.id || !strategy.name) {
        throw new Error("Strategie-ID und Name sind erforderlich");
      }
      
      // Add timestamps if missing
      if (!strategy.createdAt) {
        strategy.createdAt = Date.now();
      }
      strategy.updatedAt = Date.now();
      
      const success = addStrategy(strategy);
      
      if (success) {
        toast.success("Strategie importiert", {
          description: `${strategy.name} wurde erfolgreich importiert.`
        });
        setJsonInput("");
        setIsImportDialogOpen(false);
      } else {
        toast.error("Import fehlgeschlagen", {
          description: "Eine Strategie mit dieser ID existiert bereits."
        });
      }
    } catch (error) {
      console.error("Error importing strategy:", error);
      toast.error("Ungültiges JSON-Format", {
        description: "Die Datei enthält keine gültige Strategie-Definition."
      });
    }
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) {
      toast.error("Bitte wähle eine Vorlage aus");
      return;
    }
    
    const template = strategyTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // Merge template with basic new strategy data
    const strategyData: StrategySchema = {
      ...template.schema,
      ...newStrategy,
      id: `${selectedTemplate}-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: "1.0.0",
      isActive: true,
      // Ensure these critical properties exist
      symbols: newStrategy.symbols || ["BTCUSDT"],
      timeframes: newStrategy.timeframes || ["15m"],
      riskPerTrade: newStrategy.riskPerTrade || 1,
      maxDailyLoss: newStrategy.maxDailyLoss || 5,
      maxTradesPerDay: newStrategy.maxTradesPerDay || 10,
      stopLoss: newStrategy.stopLoss || 2,
      takeProfit: newStrategy.takeProfit || 4,
      trailingStop: newStrategy.trailingStop || false,
      indicators: template.schema.indicators || {},
    } as StrategySchema;
    
    const success = addStrategy(strategyData);
    
    if (success) {
      toast.success("Strategie erstellt", {
        description: `${strategyData.name} wurde erfolgreich erstellt.`
      });
      setIsCreateDialogOpen(false);
      setNewStrategy({
        name: "",
        description: "",
        symbols: ["BTCUSDT"],
        timeframes: ["15m"],
        riskPerTrade: 1,
        maxDailyLoss: 5,
        maxTradesPerDay: 10,
        stopLoss: 2,
        takeProfit: 4,
        trailingStop: false
      });
      setSelectedTemplate(null);
    } else {
      toast.error("Erstellung fehlgeschlagen", {
        description: "Es ist ein Fehler aufgetreten."
      });
    }
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle>Strategie-Manager</CardTitle>
        <CardDescription>
          Verwalte deine Trading-Strategien und importiere neue Strategien
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-trading-dark">
            <TabsTrigger value="existing" className="flex-1">
              Vorhandene Strategien
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              Strategien importieren
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4 pt-4">
            {strategies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Keine Strategien vorhanden</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Strategie erstellen
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {strategies.map((strategy) => (
                    <Card key={strategy.id} className="bg-muted/50">
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{strategy.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {strategy.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                updateStrategy(strategy.id, { isActive: !strategy.isActive });
                                toast.success(
                                  strategy.isActive ? "Strategie deaktiviert" : "Strategie aktiviert",
                                  {
                                    description: `${strategy.name} wurde ${strategy.isActive ? "deaktiviert" : "aktiviert"}.`
                                  }
                                );
                              }}
                            >
                              <div className={`h-3 w-3 rounded-full ${strategy.isActive ? 'bg-success-DEFAULT' : 'bg-muted-foreground'}`} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                // Open edit dialog (to be implemented)
                                toast.info("Bearbeiten", { description: "Strategie-Editor wird bald verfügbar sein." });
                              }}
                            >
                              <FilePenIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Symbole:</span>{" "}
                            {strategy.symbols.join(', ')}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timeframes:</span>{" "}
                            {strategy.timeframes.join(', ')}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stop-Loss:</span>{" "}
                            {strategy.stopLoss}%
                          </div>
                          <div>
                            <span className="text-muted-foreground">Take-Profit:</span>{" "}
                            {strategy.takeProfit}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Neue Strategie erstellen
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <UploadIcon className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                <h3 className="text-sm font-medium mb-2">JSON-Strategie importieren</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Importiere eine bestehende Strategie im JSON-Format
                </p>
                <Button 
                  variant="secondary" 
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  JSON importieren
                </Button>
              </div>
              
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <FileIcon className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                <h3 className="text-sm font-medium mb-2">Strategie aus Vorlage erstellen</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Erstelle eine neue Strategie basierend auf einer Vorlage
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Vorlage verwenden
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Import JSON Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Strategie importieren</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="strategy-json">JSON-Daten</Label>
                <Textarea
                  id="strategy-json"
                  placeholder='{"id": "meine-strategie", "name": "Meine Strategie", ...}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="font-mono text-sm h-64"
                />
                <p className="text-xs text-muted-foreground">
                  Füge die JSON-Daten deiner Strategie ein.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleImportStrategy}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Importieren
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Create Strategy Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Strategie erstellen</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Strategie-Vorlage</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {strategyTemplates.map(template => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplate === template.id 
                            ? "border-2 border-primary" 
                            : "border border-muted hover:border-input"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="strategy-name">Name</Label>
                    <Input
                      id="strategy-name"
                      placeholder="Strategie-Name"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="strategy-description">Beschreibung</Label>
                    <Textarea
                      id="strategy-description"
                      placeholder="Beschreibung der Strategie"
                      value={newStrategy.description}
                      onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="strategy-symbols">Symbole (kommagetrennt)</Label>
                    <Input
                      id="strategy-symbols"
                      placeholder="BTCUSDT, ETHUSDT, ..."
                      value={newStrategy.symbols?.join(', ')}
                      onChange={(e) => setNewStrategy({
                        ...newStrategy, 
                        symbols: e.target.value.split(',').map(s => s.trim())
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="strategy-timeframes">Timeframes (kommagetrennt)</Label>
                    <Input
                      id="strategy-timeframes"
                      placeholder="15m, 1h, 4h, ..."
                      value={newStrategy.timeframes?.join(', ')}
                      onChange={(e) => setNewStrategy({
                        ...newStrategy, 
                        timeframes: e.target.value.split(',').map(s => s.trim())
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="strategy-sl">Stop-Loss (%)</Label>
                      <Input
                        id="strategy-sl"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newStrategy.stopLoss}
                        onChange={(e) => setNewStrategy({
                          ...newStrategy,
                          stopLoss: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy-tp">Take-Profit (%)</Label>
                      <Input
                        id="strategy-tp"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newStrategy.takeProfit}
                        onChange={(e) => setNewStrategy({
                          ...newStrategy,
                          takeProfit: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCreateFromTemplate}
                disabled={!selectedTemplate || !newStrategy.name}
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                Strategie erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
