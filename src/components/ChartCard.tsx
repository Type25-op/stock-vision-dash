
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

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
  onDataLoaded?: (stockData: StockData | null) => void;
}

interface YahooFinanceData {
  timestamp: number[];
  close: number[];
}

// Stock data interface for additional metrics
interface StockData {
  price: number;
  volume: string;
  marketCap: string;
  change: number;
}

export default function ChartCard({
  title,
  ticker,
  data: providedData,
  color = "hsl(var(--primary))",
  subtitle,
  period = "1d",
  onDataLoaded,
}: ChartCardProps) {
  const [chartData, setChartData] = useState<Array<{ name: string; value: number }> | null>(providedData || null);
  const [loading, setLoading] = useState(!providedData && !!ticker);
  const [error, setError] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<StockData | null>(null);

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
        // Due to CORS issues with Yahoo Finance from the browser, 
        // we'll use our generated fallback data instead
        // In a production app, you would set up a proxy server or use a compatible API
        
        console.log(`Generating fallback data for ${ticker} with period ${period}`);
        const fallbackData = generateRealisticStockData(ticker, period);
        setChartData(fallbackData);
        
        // Generate additional stock data
        const additionalData = generateAdditionalStockData(ticker);
        setStockInfo(additionalData);
        
        // Notify parent components about the data
        if (onDataLoaded) {
          onDataLoaded(additionalData);
        }
      } catch (err) {
        console.error('Error generating stock data:', err);
        setError('Failed to load chart data');
        // Use simple fallback data
        setChartData(generateSimpleFallbackData());
        // Show toast to inform user
        toast.error("Unable to load live chart data. Using simulated data instead.");
        
        if (onDataLoaded) {
          onDataLoaded(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchYahooFinanceData();
  }, [ticker, period, providedData, onDataLoaded]);
  
  // Generate additional stock data (price, volume, marketCap)
  const generateAdditionalStockData = (ticker: string): StockData => {
    // Use ticker name to generate a seed for consistent but "random" data
    const seedValue = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Base price depends on the ticker (just for simulation)
    const basePrice = (seedValue % 500) + 50; // Between $50 and $550
    
    // Add some randomness to the price
    const price = parseFloat((basePrice + (Math.sin(seedValue / 10) * 5)).toFixed(2));
    
    // Generate volume (based on ticker)
    const volumeBase = seedValue % 100;
    let volume: string;
    if (volumeBase < 30) {
      volume = `${((volumeBase + 5) / 10).toFixed(1)}M`;
    } else if (volumeBase < 70) {
      volume = `${volumeBase + 10}M`;
    } else {
      volume = `${(volumeBase / 10 + 5).toFixed(1)}B`;
    }
    
    // Generate market cap (based on price and ticker)
    const marketCapBase = price * (seedValue / 10);
    let marketCap: string;
    if (marketCapBase < 1000) {
      marketCap = `${(marketCapBase / 10).toFixed(1)}B`;
    } else if (marketCapBase < 10000) {
      marketCap = `${(marketCapBase / 1000).toFixed(2)}T`;
    } else {
      marketCap = `${(marketCapBase / 1000).toFixed(1)}T`;
    }
    
    // Calculate change percentage (between -5% and +5%)
    const change = parseFloat((Math.sin(seedValue / 5) * 5).toFixed(2));
    
    return {
      price,
      volume,
      marketCap,
      change
    };
  };
  
  // Generate realistic-looking stock data based on ticker and period
  const generateRealisticStockData = (ticker: string, period: string) => {
    const data: Array<{ name: string; value: number }> = [];
    
    // Use ticker name to generate a seed for consistent but "random" data
    const seedValue = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = seedValue / 100;
    
    // Base price depends on the ticker (just for simulation)
    const basePrice = (seedValue % 500) + 50; // Between $50 and $550
    
    // Number of data points based on period
    const dataPoints = 
      period === "1d" ? 24 : // hourly
      period === "5d" ? 40 : // 5 days × 8 hours
      period === "1mo" ? 30 : // daily for a month
      period === "6mo" ? 26 : // weekly for 6 months
      52; // weekly for a year
    
    // Volatility based on period
    const volatility = 
      period === "1d" ? 0.005 : 
      period === "5d" ? 0.01 : 
      period === "1mo" ? 0.02 : 
      period === "6mo" ? 0.05 : 
      0.08; // 1y
      
    // Generate data points
    let price = basePrice;
    let trend = Math.sin(seed) * 0.7; // -0.7 to 0.7, determines general trend direction
    
    for (let i = 0; i < dataPoints; i++) {
      // Implement a slight trend with random noise
      const randomFactor = Math.sin(i * seed) * volatility;
      const trendFactor = trend * volatility * 0.5;
      
      price = price * (1 + randomFactor + trendFactor);
      
      // Format date based on period
      let dateFormat: string;
      const now = new Date();
      
      if (period === "1d") {
        const hour = (now.getHours() + i - dataPoints) % 24;
        dateFormat = `${hour}:00`;
      } else if (period === "5d") {
        const day = now.getDate() - Math.floor(dataPoints - i - 1) / 8;
        const hour = (now.getHours() + (i % 8) * 3) % 24;
        dateFormat = `${day}-${hour}h`;
      } else if (period === "1mo") {
        const date = new Date();
        date.setDate(date.getDate() - (dataPoints - i - 1));
        dateFormat = `${date.getMonth() + 1}/${date.getDate()}`;
      } else {
        const date = new Date();
        date.setDate(date.getDate() - (dataPoints - i - 1) * 7);
        dateFormat = `${date.getMonth() + 1}/${date.getDate()}`;
      }
      
      data.push({
        name: dateFormat,
        value: parseFloat(price.toFixed(2))
      });
    }
    
    return data;
  };
  
  // Simple fallback for worst-case scenarios
  const generateSimpleFallbackData = () => {
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
            <p className="text-muted-foreground">Using simulated market data</p>
            <p className="text-xs text-muted-foreground">(Real-time data unavailable)</p>
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
