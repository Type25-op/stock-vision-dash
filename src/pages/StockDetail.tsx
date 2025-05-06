
import { useParams, Link } from "react-router-dom";
import { useStocks } from "@/providers/StockProvider";
import Header from "@/components/Header";
import ChartCard from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown, ArrowLeft, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchStockPredictions, StockPrediction } from "@/utils/apiService";

// Stock data interface
interface LiveStockData {
  price: number;
  volume: string;
  marketCap: string;
  change: number;
}

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const { getStockById, loadingStocks } = useStocks();
  const stock = id ? getStockById(id) : undefined;
  const [chartPeriod, setChartPeriod] = useState<string>("1d");
  const [liveStockData, setLiveStockData] = useState<LiveStockData | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);

  // Use stock data from API if available, otherwise fall back to mock data
  const stockData = liveStockData || (stock ? {
    price: stock.price,
    volume: stock.volume,
    marketCap: stock.marketCap,
    change: stock.change
  } : null);
  
  const isPositive = stockData ? stockData.change >= 0 : false;
  const isPredictionPositive = prediction ? prediction.percent_change >= 0 : false;

  useEffect(() => {
    if (stock) {
      const fetchPredictionData = async () => {
        setLoadingPrediction(true);
        try {
          const data = await fetchStockPredictions(stock.ticker);
          if (data) {
            setPrediction(data);
          }
        } catch (error) {
          console.error(`Failed to fetch predictions for ${stock.ticker}:`, error);
        } finally {
          setLoadingPrediction(false);
        }
      };
      
      fetchPredictionData();
    }
  }, [stock]);

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
  
  const handleStockDataLoaded = (data: LiveStockData | null) => {
    if (data) {
      setLiveStockData(data);
    }
  };

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
              <div className={isPositive ? "stock-change-positive" : "stock-change-negative"}>
                {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {stockData ? Math.abs(stockData.change).toFixed(2) : "0.00"}%
              </div>
            </div>
          </div>
          
          <div className="text-2xl font-bold font-mono">
            ${stockData ? stockData.price.toFixed(2) : "0.00"}
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
                  onDataLoaded={handleStockDataLoaded}
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
              value={`$${stockData ? stockData.price.toFixed(2) : "0.00"}`}
            />
            <StatsCard
              label="Volume"
              value={stockData ? stockData.volume : "N/A"}
            />
            <StatsCard
              label="Market Cap"
              value={stockData ? stockData.marketCap : "N/A"}
            />
            <StatsCard
              label="Volatility"
              value={stock.volatility}
              valueClassName={`volatility-${stock.volatility.toLowerCase()}`}
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
  valueClassName = "" 
}: { 
  label: string; 
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className={`text-lg font-semibold ${valueClassName}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
