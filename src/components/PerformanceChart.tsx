
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps
} from 'recharts';
import { mockPerformanceData } from '@/lib/mock-data';

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-trading-card border border-trading-border rounded-md px-3 py-2 shadow-md">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">
          {payload[0].value.toFixed(2)} <span className="text-xs">€</span>
        </p>
      </div>
    );
  }
  return null;
};

export const PerformanceChart = () => {
  const [chartData, setChartData] = useState(mockPerformanceData.daily);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    switch (period) {
      case 'daily':
        setChartData(mockPerformanceData.daily);
        break;
      case 'weekly':
        setChartData(mockPerformanceData.weekly);
        break;
      case 'monthly':
        setChartData(mockPerformanceData.monthly);
        break;
      case 'yearly':
        setChartData(mockPerformanceData.yearly);
        break;
      default:
        setChartData(mockPerformanceData.daily);
    }
  };

  // Calculate min and max for chart domain
  const dataValues = chartData.map(item => item.value);
  const minValue = Math.min(...dataValues) * 0.9;
  const maxValue = Math.max(...dataValues) * 1.1;

  return (
    <Card className="trading-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Performance</CardTitle>
          <Tabs value={selectedPeriod} onValueChange={handlePeriodChange} className="h-8">
            <TabsList className="bg-trading-dark h-7">
              <TabsTrigger className="h-6 text-xs" value="daily">Tag</TabsTrigger>
              <TabsTrigger className="h-6 text-xs" value="weekly">Woche</TabsTrigger>
              <TabsTrigger className="h-6 text-xs" value="monthly">Monat</TabsTrigger>
              <TabsTrigger className="h-6 text-xs" value="yearly">Jahr</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b897" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b897" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e3a50" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis 
                domain={[minValue, maxValue]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(value) => `${value.toFixed(0)}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00b897" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: '#00b897', strokeWidth: 2, fill: '#222c3f' }}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
