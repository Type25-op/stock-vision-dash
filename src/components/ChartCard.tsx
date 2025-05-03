
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  ticker?: string;
  data?: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
  subtitle?: string;
  period?: string;
}

interface YahooFinanceData {
  timestamp: number[];
  close: number[];
}

export default function ChartCard({
  title,
  ticker,
  data: providedData,
  color = "hsl(var(--primary))",
  subtitle,
  period = "1d",
}: ChartCardProps) {
  const [chartData, setChartData] = useState<Array<{ name: string; value: number }> | null>(providedData || null);
  const [loading, setLoading] = useState(!providedData && !!ticker);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providedData) {
      setChartData(providedData);
      return;
    }
    
    if (!ticker) return;
    
    const fetchYahooFinanceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const interval = period === "1d" ? "5m" : 
                        period === "5d" ? "15m" : 
                        period === "1mo" ? "1d" :
                        period === "6mo" ? "1d" : "1wk";
                        
        const range = period;
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?region=US&lang=en-US&includePrePost=false&interval=${interval}&range=${range}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data from Yahoo Finance');
        }
        
        const result = await response.json();
        
        if (!result.chart?.result?.[0]?.timestamp || !result.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
          throw new Error('Invalid data structure from Yahoo Finance API');
        }
        
        const timestamps = result.chart.result[0].timestamp;
        const closePrices = result.chart.result[0].indicators.quote[0].close;
        
        // Format data for our chart
        const formattedData = timestamps.map((timestamp: number, index: number) => {
          // Convert timestamp to readable format based on period
          let dateFormat = '';
          const date = new Date(timestamp * 1000);
          
          if (period === "1d") {
            // For 1d, show hour:minute
            dateFormat = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
          } else if (period === "5d") {
            // For 5d, show day-hour
            dateFormat = `${date.getDate()}-${date.getHours()}h`;
          } else {
            // For longer periods, show month/day
            dateFormat = `${date.getMonth() + 1}/${date.getDate()}`;
          }
          
          return {
            name: dateFormat,
            value: closePrices[index] || null
          };
        }).filter(item => item.value !== null);
        
        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching Yahoo Finance data:', err);
        setError('Failed to load chart data');
        // Use dummy data as fallback
        setChartData(generateFallbackData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchYahooFinanceData();
  }, [ticker, period, providedData]);
  
  // Generate fallback data in case of API failure
  const generateFallbackData = () => {
    const data = [];
    let value = 150 + Math.random() * 50;
    
    for (let i = 0; i < 20; i++) {
      value = value + (Math.random() - 0.5) * 10;
      data.push({
        name: `${i + 1}h`,
        value: parseFloat(value.toFixed(2))
      });
    }
    
    return data;
  };

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-md">{title}</CardTitle>
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[180px] w-full flex items-center justify-center">
            <Skeleton className="h-[150px] w-[95%]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-md">{title}</CardTitle>
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[180px] w-full flex flex-col items-center justify-center">
            <p className="text-muted-foreground">Failed to load chart data</p>
            <p className="text-xs text-muted-foreground">Using sample data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-md">{title}</CardTitle>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px"
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
