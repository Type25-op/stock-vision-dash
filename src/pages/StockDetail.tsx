import { useParams, Link } from "react-router-dom";
import { useStocks } from "@/providers/StockProvider";
import Header from "@/components/Header";
import ChartCard from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown, ArrowLeft, TrendingUp, Database, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  fetchStockPredictions, 
  StockPrediction, 
  getVolatilityLevel,
  fetchStockQuote,
  AlphaVantageQuote,
  formatVolume,
  getStockFallbackData
} from "@/utils/apiService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { 
  getFromCache, 
  clearCache, 
  canRefresh, 
  markRefreshed, 
  getRemainingCooldown,
  formatCooldown 
} from "@/utils/cacheUtils";

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const { getStockById, loadingStocks } = useStocks();
  const stock = id ? getStockById(id) : undefined;
  const [chartPeriod, setChartPeriod] = useState<string>("1d");
  const [stockData, setStockData] = useState<AlphaVantageQuote | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [loadingStockData, setLoadingStockData] = useState<boolean>(false);
  const [volatilityLevel, setVolatilityLevel] = useState<"Low" | "Medium" | "High">(stock?.volatility as "Low" | "Medium" | "High" || "Medium");
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [canRefreshData, setCanRefreshData] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cooldownTime, setCooldownTime] = useState<string>("");
  
  // Define cache keys based on stock ticker
  const quoteKey = stock ? `quote_${stock.ticker.toUpperCase()}` : '';
  const predictionKey = stock ? `predictions_${stock.ticker.toUpperCase()}` : '';
  const chartKey = stock ? `chart_${stock.ticker.toUpperCase()}_${chartPeriod}` : '';
  
  // Calculate change percentage for display
  const changePercent = stockData ? 
    parseFloat(stockData.changePercent.replace('%', '')) : 
    (stock ? stock.change : 0);
  
  const isPositive = changePercent >= 0;
  const isPredictionPositive = prediction ? prediction.percent_change >= 0 : false;

  const handleRefresh = async () => {
    if (!stock) return;
    
    // Check if we can refresh
    if (!canRefresh(quoteKey) || !canRefresh(predictionKey)) {
      const quoteRemaining = getRemainingCooldown(quoteKey);
      const predictionRemaining = getRemainingCooldown(predictionKey);
      const remaining = Math.max(quoteRemaining, predictionRemaining);
      
      toast.error(`Please wait ${formatCooldown(remaining)} before refreshing again`);
      return;
    }
    
    setRefreshing(true);
    
    try {
      // Clear cache
      clearCache(quoteKey);
      clearCache(predictionKey);
      clearCache(chartKey);
      
      // Mark as refreshed
      markRefreshed(quoteKey);
      markRefreshed(predictionKey);
      markRefreshed(chartKey);
      
      // Set refresh cooldown
      setCanRefreshData(false);
      
      // Fetch fresh data
      await fetchStockData(true);
      await fetchPredictionData(true);
      
      toast.success(`${stock.ticker} data refreshed successfully`);
    } catch (error) {
      console.error(`Error refreshing ${stock.ticker} data:`, error);
      toast.error(`Failed to refresh ${stock.ticker} data`);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (stock) {
      // Fetch real-time stock data
      fetchStockData();
      fetchPredictionData();
      
      // Set up cooldown checks
      const checkCooldown = () => {
        const canRefreshQuote = canRefresh(quoteKey);
        const canRefreshPrediction = canRefresh(predictionKey);
        
        setCanRefreshData(canRefreshQuote && canRefreshPrediction);
        
        if (!canRefreshQuote || !canRefreshPrediction) {
          const quoteRemaining = getRemainingCooldown(quoteKey);
          const predictionRemaining = getRemainingCooldown(predictionKey);
          const remaining = Math.max(quoteRemaining, predictionRemaining);
          setCooldownTime(formatCooldown(remaining));
        } else {
          setCooldownTime("");
        }
      };
      
      checkCooldown();
      const interval = setInterval(checkCooldown, 1000);
      
      return () => clearInterval(interval);
    }
  }, [stock, quoteKey, predictionKey]);
  
  const fetchStockData = async (isRefresh = false) => {
    if (!stock) return;
    
    setLoadingStockData(true);
    try {
      // Check if data exists in cache
      if (!isRefresh) {
        const quoteInCache = !!getFromCache(quoteKey);
        setUsingCachedData(quoteInCache);
      }
      
      const data = await fetchStockQuote(stock.ticker);
      
      if (data) {
        setStockData(data);
      } else {
        // Use fallback data if API fails
        console.log(`Using fallback data for ${stock.ticker}`);
        setStockData(getStockFallbackData(stock.ticker));
      }
    } catch (error) {
      console.error(`Failed to fetch stock data for ${stock.ticker}:`, error);
      toast.error(`Failed to load current stock data for ${stock.ticker}`);
      // Use fallback data on error
      setStockData(getStockFallbackData(stock.ticker));
    } finally {
      setLoadingStockData(false);
    }
  };
  
  const fetchPredictionData = async (isRefresh = false) => {
    if (!stock) return;
    
    setLoadingPrediction(true);
    try {
      const data = await fetchStockPredictions(stock.ticker);
      setPrediction(data);
      
      // Set volatility level based on the volatility score
      setVolatilityLevel(getVolatilityLevel(data.volatility_score));
      
    } catch (error) {
      console.error(`Failed to fetch predictions for ${stock.ticker}:`, error);
      toast.error(`Failed to load predictions for ${stock.ticker}`);
    } finally {
      setLoadingPrediction(false);
    }
  };

  if (loadingStocks) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-6 md:px-6">
          <div className="animate-pulse space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[400px] w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!stock) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-6 md:px-6 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Stock Not Found</h1>
          <p className="text-muted-foreground mb-6">The stock you are looking for does not exist.</p>
          <Link to="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Format the current price for display
  const currentPrice = stockData ? 
    parseFloat(stockData.price).toFixed(2) : 
    stock.price.toFixed(2);
    
  // Format the volume for display
  const volume = stockData ? 
    formatVolume(stockData.volume) : 
    stock.volume;
    
  // Get market cap
  const marketCap = stockData?.marketCap || stock.marketCap;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{stock.name}</h1>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{stock.ticker}</span>
              {!loadingStockData && (
                <div className={isPositive ? "stock-change-positive" : "stock-change-negative"}>
                  {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {Math.abs(changePercent).toFixed(2)}%
                </div>
              )}
              {loadingStockData && <Skeleton className="h-6 w-16" />}
              
              {usingCachedData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 h-7 px-2"
                        onClick={handleRefresh}
                        disabled={!canRefreshData || refreshing}
                      >
                        <Database className="h-3 w-3" />
                        <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                        {cooldownTime && <span className="text-xs">{cooldownTime}</span>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {canRefreshData 
                        ? "Using cached data (click to refresh)" 
                        : `Wait ${cooldownTime} to refresh`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          <div className="text-2xl font-bold font-mono">
            {!loadingStockData ? (
              `$${currentPrice}`
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <Button 
              variant={chartPeriod === "1d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartPeriod("1d")}
            >
              1D
            </Button>
            <Button 
              variant={chartPeriod === "5d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartPeriod("5d")}
            >
              5D
            </Button>
            <Button 
              variant={chartPeriod === "1mo" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartPeriod("1mo")}
            >
              1M
            </Button>
            <Button 
              variant={chartPeriod === "6mo" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartPeriod("6mo")}
            >
              6M
            </Button>
            <Button 
              variant={chartPeriod === "1y" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartPeriod("1y")}
            >
              1Y
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-1 md:p-4">
              <div className="h-[400px] w-full">
                <ChartCard
                  title=""
                  ticker={stock.ticker}
                  color={isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
                  period={chartPeriod}
                  cacheKey={chartKey}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Predictions Section */}
        {prediction && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Predictions
              <span className="text-sm font-normal text-muted-foreground">
                (Model: {prediction.model_version})
              </span>
            </h2>
            
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">5-Day Prediction</div>
                    <div className={`text-lg font-bold ${isPredictionPositive ? "text-success" : "text-danger"}`}>
                      {isPredictionPositive ? "+" : ""}{prediction.percent_change.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Forecast as of {prediction.date}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">1 Day</div>
                    <div className="font-mono">${prediction.pred_1d.toFixed(2)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">2 Days</div>
                    <div className="font-mono">${prediction.pred_2d.toFixed(2)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">3 Days</div>
                    <div className="font-mono">${prediction.pred_3d.toFixed(2)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">5 Days</div>
                    <div className="font-mono">${prediction.pred_5d.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loadingPrediction && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">AI Predictions</h2>
            <Card>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <div className="stats-grid">
            <StatsCard
              label="Current Price"
              value={loadingStockData ? "Loading..." : `$${currentPrice}`}
              loading={loadingStockData}
            />
            <StatsCard
              label="Volume"
              value={loadingStockData ? "Loading..." : volume}
              loading={loadingStockData}
            />
            <StatsCard
              label="Market Cap"
              value={loadingStockData ? "Loading..." : marketCap}
              loading={loadingStockData}
            />
            <StatsCard
              label="Volatility"
              value={volatilityLevel}
              valueClassName={`volatility-${volatilityLevel.toLowerCase()}`}
              loading={loadingPrediction}
            />
            {prediction && (
              <StatsCard
                label="Volatility Score"
                value={prediction.volatility_score.toString()}
                valueClassName={prediction.volatility_score > 0 ? "text-success" : prediction.volatility_score < 0 ? "text-danger" : ""}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatsCard({ 
  label, 
  value,
  valueClassName = "",
  loading = false
}: { 
  label: string; 
  value: string;
  valueClassName?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className={`text-lg font-semibold ${valueClassName}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
