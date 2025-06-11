
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { tradeService } from "@/services/tradeService";
import { toast } from "sonner";

export const ClearDataButton = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      // Clear all trade data
      tradeService.clearAllData();
      toast.success("Alle Handelsdaten wurden gelöscht");
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Fehler beim Löschen der Daten");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Daten löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alle Daten löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion löscht alle Handelsdaten, Trades und Performance-Statistiken unwiderruflich.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearData} disabled={isClearing}>
            {isClearing ? "Lösche..." : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
