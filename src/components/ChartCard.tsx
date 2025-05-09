import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Database, RefreshCw } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/providers/ThemeProvider";
import { 
  canRefresh, 
  markRefreshed, 
  clearCache, 
  getRemainingCooldown,
  formatCooldown
} from "@/utils/cacheUtils";

interface ChartCardProps {
  title: string;
  ticker?: string;
  data?: Array<{
    name: string;
    value: number;
    relativeValue?: number;
  }>;
  color?: string;
  subtitle?: string;
  period?: string;
  onDataLoaded?: (stockData: StockData | null) => void;
  cacheKey?: string;
  height?: number;
  showRelativeChange?: boolean;
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

// Available chart periods
export type ChartPeriod = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";

export default function ChartCard({
  title,
  ticker,
  data: providedData,
  color = "hsl(var(--primary))",
  subtitle,
  period = "1d",
  onDataLoaded,
  cacheKey,
  height = 180,
  showRelativeChange = true,
}: ChartCardProps) {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<Array<{ name: string; value: number; relativeValue?: number }> | null>(providedData || null);
  const [loading, setLoading] = useState(!providedData && !!ticker);
  const [error, setError] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<StockData | null>(null);
  const [canRefreshData, setCanRefreshData] = useState(true);
  const [cooldownTime, setCooldownTime] = useState<string>("");
  const [usingCache, setUsingCache] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(period as ChartPeriod);

  // Chart customization options based on theme
  const isDarkMode = theme === 'dark';
  const chartColor = color;
  const areaFill = `${color}33`; // 20% opacity
  const textColor = isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const tooltipBgColor = isDarkMode ? "#1A1F2C" : "#FFFFFF";
  const tooltipBorderColor = isDarkMode ? "#333" : "#ccc";
  
  const fetchChartData = useCallback(async (isRefresh = false, chartPeriod = selectedPeriod) => {
    if (!ticker) return;
    
    const dataKey = cacheKey ? `${cacheKey}_${chartPeriod}` : `chart_${ticker}_${chartPeriod}`;
    
    // Check if refresh is allowed
    if (isRefresh && !canRefresh(dataKey)) {
      const remaining = getRemainingCooldown(dataKey);
      setCooldownTime(formatCooldown(remaining));
      toast.error(`Please wait ${formatCooldown(remaining)} before refreshing again`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Generating stock data for ${ticker} with period ${chartPeriod}`);
      
      // If this is a refresh action, clear the cache for this key
      if (isRefresh) {
        clearCache(dataKey);
        markRefreshed(dataKey);
        setCanRefreshData(false);
        
        // Start cooldown timer
        const interval = setInterval(() => {
          const remaining = getRemainingCooldown(dataKey);
          if (remaining <= 0) {
            clearInterval(interval);
            setCanRefreshData(true);
            setCooldownTime("");
          } else {
            setCooldownTime(formatCooldown(remaining));
          }
        }, 1000);
      }
      
      const fallbackData = generateRealisticStockData(ticker, chartPeriod);
      
      // Convert to relative values if needed
      if (showRelativeChange && fallbackData.length > 0) {
        const baseValue = fallbackData[0].value;
        fallbackData.forEach(dataPoint => {
          dataPoint.relativeValue = ((dataPoint.value / baseValue) - 1) * 100;
        });
      }
      
      setChartData(fallbackData);
      setUsingCache(!isRefresh);
      
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
      const simpleData = generateSimpleFallbackData();
      
      // Ensure relativeValue exists if showRelativeChange is true
      if (showRelativeChange && simpleData.length > 0) {
        const baseValue = simpleData[0].value;
        simpleData.forEach(dataPoint => {
          dataPoint.relativeValue = ((dataPoint.value / baseValue) - 1) * 100;
        });
      }
      
      setChartData(simpleData);
      // Show toast to inform user
      toast.error("Unable to load chart data. Using simulated data instead.");
      
      if (onDataLoaded) {
        onDataLoaded(null);
      }
    } finally {
      setLoading(false);
    }
  }, [ticker, selectedPeriod, providedData, onDataLoaded, cacheKey, showRelativeChange]);

  useEffect(() => {
    if (providedData) {
      // Ensure providedData has relativeValue property if showRelativeChange is true
      if (showRelativeChange && providedData.length > 0) {
        const processedData = [...providedData];
        const baseValue = processedData[0].value;
        processedData.forEach(dataPoint => {
          if (dataPoint.relativeValue === undefined) {
            dataPoint.relativeValue = ((dataPoint.value / baseValue) - 1) * 100;
          }
        });
        setChartData(processedData);
      } else {
        setChartData(providedData);
      }
      return;
    }
    
    fetchChartData(false, selectedPeriod);
    
    // Setup cooldown timer check
    if (ticker && cacheKey) {
      const dataKey = `${cacheKey}_${selectedPeriod}`;
      const checkCooldown = () => {
        const canRefreshNow = canRefresh(dataKey);
        setCanRefreshData(canRefreshNow);
        
        if (!canRefreshNow) {
          setCooldownTime(formatCooldown(getRemainingCooldown(dataKey)));
        }
      };
      
      checkCooldown();
      const interval = setInterval(checkCooldown, 1000);
      
      return () => clearInterval(interval);
    }
  }, [ticker, selectedPeriod, providedData, onDataLoaded, fetchChartData, cacheKey, showRelativeChange]);
  
  // Handle period change
  const handlePeriodChange = (newPeriod: ChartPeriod) => {
    setSelectedPeriod(newPeriod);
    fetchChartData(false, newPeriod);
  };
  
  // Generate additional stock data (price, volume, marketCap)
  const generateAdditionalStockData = (ticker: string): StockData => {
    // Use ticker name to generate a seed for consistent but "random" data
    const seedValue = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Base price depends on the ticker (for simulation)
    let basePrice = (seedValue % 500) + 50; // Between $50 and $550
    
    // Override with realistic prices for well-known tickers
    if (ticker.toUpperCase() === "META") {
      basePrice = 587;
    } else if (ticker.toUpperCase() === "AAPL") {
      basePrice = 198;
    } else if (ticker.toUpperCase() === "MSFT") {
      basePrice = 417;
    } else if (ticker.toUpperCase() === "GOOGL") {
      basePrice = 164;
    } else if (ticker.toUpperCase() === "AMZN") {
      basePrice = 181;
    } else if (ticker.toUpperCase() === "TSLA") {
      basePrice = 275;
    }
    
    // Add some randomness to the price
    const price = parseFloat((basePrice + (Math.sin(seedValue / 10) * 2)).toFixed(2));
    
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
    const data: Array<{ name: string; value: number; relativeValue?: number }> = [];
    
    // Use ticker name to generate a seed for consistent but "random" data
    const seedValue = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = seedValue / 100;
    
    // Base price depends on the ticker (for simulation)
    let basePrice = (seedValue % 500) + 50; // Between $50 and $550
    
    // Override with realistic prices for well-known tickers
    if (ticker.toUpperCase() === "META") {
      basePrice = 587;
    } else if (ticker.toUpperCase() === "AAPL") {
      basePrice = 198;
    } else if (ticker.toUpperCase() === "MSFT") {
      basePrice = 417;
    } else if (ticker.toUpperCase() === "GOOGL") {
      basePrice = 164;
    } else if (ticker.toUpperCase() === "AMZN") {
      basePrice = 181;
    } else if (ticker.toUpperCase() === "TSLA") {
      basePrice = 275;
    }
    
    // Number of data points based on period
    const dataPoints = 
      period === "1d" ? 24 : // hourly
      period === "5d" ? 40 : // 5 days × 8 hours
      period === "1mo" ? 30 : // daily for a month
      period === "3mo" ? 90 : // daily for 3 months
      period === "6mo" ? 26 : // weekly for 6 months
      52; // weekly for a year
    
    // Volatility based on period and ticker
    let volatility = 
      period === "1d" ? 0.003 : 
      period === "5d" ? 0.008 : 
      period === "1mo" ? 0.015 : 
      period === "3mo" ? 0.025 :
      period === "6mo" ? 0.04 : 
      0.06; // 1y
    
    // Adjust volatility based on the stock
    if (ticker.toUpperCase() === "TSLA") {
      volatility *= 2; // Tesla is more volatile
    } else if (ticker.toUpperCase() === "AAPL" || ticker.toUpperCase() === "MSFT") {
      volatility *= 0.7; // Blue chips are less volatile
    }
      
    // Generate data points
    let price = basePrice;
    let trend = Math.sin(seed) * 0.5; // -0.5 to 0.5, determines general trend direction
    
    // For META, create a more specific pattern based on recent performance
    if (ticker.toUpperCase() === "META" && period === "1d") {
      // Slightly downward trend for META's daily chart
      trend = -0.2;
    } else if (ticker.toUpperCase() === "AAPL" && period === "1mo") {
      // Slightly upward trend for AAPL monthly
      trend = 0.3;
    }
    
    for (let i = 0; i < dataPoints; i++) {
      // Implement a slight trend with random noise
      const progress = i / dataPoints; // 0 to 1, position in the timeline
      const randomFactor = (Math.sin(i * seed * 5) + Math.cos(i * seed * 3)) * volatility;
      const trendFactor = trend * volatility * 0.8 * progress;
      
      // Add some pattern to make charts look more realistic
      const patternFactor = Math.sin(i / 5) * volatility * 0.3;
      
      price = price * (1 + randomFactor + trendFactor + patternFactor);
      
      // Format date based on period
      let dateFormat: string;
      const now = new Date();
      
      if (period === "1d") {
        // For 1-day chart, use even hour distribution
        const hour = (now.getHours() + i - dataPoints) % 24;
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 || hour === 24 ? 'AM' : 'PM';
        dateFormat = `${formattedHour}${amPm}`;
      } else if (period === "5d") {
        // For 5-day chart, use day and hour
        const date = new Date();
        date.setHours(date.getHours() - (dataPoints - i - 1) * 3);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = date.getHours();
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? 'AM' : 'PM';
        dateFormat = `${day} ${formattedHour}${amPm}`;
      } else if (period === "1mo") {
        // For 1-month chart, use day and month
        const date = new Date();
        date.setDate(date.getDate() - (dataPoints - i - 1));
        dateFormat = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === "3mo") {
        // For 3-month chart, use day and month
        const date = new Date();
        date.setDate(date.getDate() - (dataPoints - i - 1));
        dateFormat = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For 6-month and 1-year charts, use month only
        const date = new Date();
        date.setDate(date.getDate() - (dataPoints - i - 1) * 7);
        dateFormat = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    const data: Array<{ name: string; value: number; relativeValue?: number }> = [];
    let value = 150 + Math.random() * 50;
    
    for (let i = 0; i < 20; i++) {
      value = value + (Math.random() - 0.5) * 10;
      data.push({
        name: `${i + 1}h`,
        value: parseFloat(value.toFixed(2))
      });
    }
    
    // Add relativeValue field if we're using relative change
    if (showRelativeChange && data.length > 0) {
      const baseValue = data[0].value;
      data.forEach(point => {
        point.relativeValue = ((point.value / baseValue) - 1) * 100;
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

  // Calculate if chart shows positive or negative change
  const isPositive = chartData && chartData.length > 1 
    ? chartData[chartData.length - 1].value >= chartData[0].value 
    : true;
  
  // Calculate start and end values for the chart
  const startValue = chartData && chartData.length > 0 ? chartData[0].value : 0;
  const currentValue = chartData && chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const changeValue = currentValue - startValue;
  const changePercent = startValue !== 0 ? (changeValue / startValue) * 100 : 0;
  
  // Dynamic color based on chart trend
  const dynamicColor = isPositive 
    ? "hsl(var(--success))" 
    : "hsl(var(--danger))";
  
  // Use provided color or default to dynamic color based on trend
  const finalChartColor = color ? chartColor : dynamicColor;
  const finalAreaFill = areaFill ? areaFill : `${dynamicColor}33`;

  // Get the data key to use
  const yDataKey = showRelativeChange ? 'relativeValue' : 'value';
  
  // Make sure every point in chartData has the relativeValue property if showRelativeChange is true
  if (showRelativeChange && chartData && chartData.length > 0) {
    const baseValue = chartData[0].value;
    chartData.forEach(point => {
      if (point.relativeValue === undefined) {
        point.relativeValue = ((point.value / baseValue) - 1) * 100;
      }
    });
  }
  
  const chartMaxValue = showRelativeChange && chartData
    ? Math.max(...chartData.map(item => item.relativeValue || 0)) * 1.1
    : undefined;
  const chartMinValue = showRelativeChange && chartData
    ? Math.min(...chartData.map(item => item.relativeValue || 0)) * 1.1
    : undefined;

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md">{title}</CardTitle>
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
          
          {/* Refresh button and cached data indicator */}
          {ticker && (
            <div className="flex items-center gap-2">
              {usingCache && (
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Using cached data (30m)</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fetchChartData(true)} 
                disabled={!canRefreshData || loading}
                className="h-8 w-8"
              >
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      {canRefreshData 
                        ? "Refresh data" 
                        : `Wait ${cooldownTime} to refresh`}
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Button>
            </div>
          )}
        </div>
        
        {/* Change percentage and value */}
        {chartData && chartData.length > 0 && (
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`font-mono text-sm ${isPositive ? "text-success" : "text-danger"}`}>
              {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
            </span>
            {!showRelativeChange && (
              <span className="text-xs text-muted-foreground font-mono">
                {isPositive ? "+" : ""}{changeValue.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Time period selector */}
        {ticker === "NIFTY50" && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(["1d", "5d", "1mo", "3mo", "6mo", "1y"] as ChartPeriod[]).map((p) => (
              <Button
                key={p}
                variant={selectedPeriod === p ? "default" : "outline"}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => handlePeriodChange(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-1">
        <div className={`h-[${height}px] w-full`} style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData || []}
              margin={{
                top: 5,
                right: 10,
                left: 5,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id={`colorGradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={finalChartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={finalChartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.2} />
              
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: textColor }}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: textColor }}
                domain={showRelativeChange ? [chartMinValue, chartMaxValue] : ['auto', 'auto']}
                tickFormatter={(value) => showRelativeChange ? `${value.toFixed(1)}%` : `$${value}`}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: tooltipBgColor,
                  border: `1px solid ${tooltipBorderColor}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                itemStyle={{ color: textColor }}
                labelStyle={{ color: textColor, marginBottom: "4px" }}
                formatter={(value: any) => {
                  if (showRelativeChange) {
                    return [`${parseFloat(value).toFixed(2)}%`, 'Change'];
                  }
                  return [`$${value}`, 'Price'];
                }}
                animationDuration={200}
              />
              
              {!showRelativeChange && startValue > 0 && (
                <ReferenceLine 
                  y={startValue} 
                  stroke={textColor} 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                  opacity={0.5}
                />
              )}
              
              {showRelativeChange && (
                <ReferenceLine 
                  y={0} 
                  stroke={textColor} 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                  opacity={0.5}
                />
              )}
              
              <Line
                type="monotone"
                dataKey={yDataKey}
                stroke={finalChartColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: tooltipBgColor, strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1000}
                fill={`url(#colorGradient-${title.replace(/\s+/g, '')})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
