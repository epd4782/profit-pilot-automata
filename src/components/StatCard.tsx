
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  changeTimeframe?: string;
}

export const StatCard = ({
  title,
  value,
  change,
  prefix = "",
  suffix = "",
  className,
  changeTimeframe = "24h",
}: StatCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const displayChange = change ? Math.abs(change) : undefined;

  return (
    <Card className={cn("trading-card", className)}>
      <CardContent className="p-4">
        <div className="stat-card">
          <div className="stat-title">{title}</div>
          <div className="stat-value">
            {prefix}
            {value}
            {suffix}
          </div>
          {displayChange && (
            <div
              className={cn(
                "stat-change",
                isPositive && "text-success-DEFAULT",
                isNegative && "text-danger-DEFAULT"
              )}
            >
              {isPositive ? (
                <TrendingUpIcon className="h-3.5 w-3.5" />
              ) : (
                <TrendingDownIcon className="h-3.5 w-3.5" />
              )}
              <span className="text-xs">{displayChange}% ({changeTimeframe})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
