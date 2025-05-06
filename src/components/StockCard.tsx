
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Stock } from "@/providers/StockProvider";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchStockPredictions, StockPrediction, getVolatilityLevel } from "@/utils/apiService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";

interface StockCardProps {
  stock: Stock;
}

// Stock real-time data interface
interface LiveStockData {
  price: number;
  volume: string;
  change: number;
}

export default function StockCard({ stock }: StockCardProps) {
  const [liveData, setLiveData] = useState<LiveStockData | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [volatilityLevel, setVolatilityLevel] = useState<"Low" | "Medium" | "High">(stock.volatility as "Low" | "Medium" | "High");
  
  useEffect(() => {
    // Generate consistent live data for the stock
    const generateLiveData = () => {
      const seedValue = stock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Base price depends on the ticker (just for simulation)
      const basePrice = (seedValue % 500) + 50;
      
      // Add some randomness to the price
      const price = parseFloat((basePrice + (Math.sin(seedValue / 10) * 5)).toFixed(2));
      
      // Generate volume
      const volumeBase = seedValue % 100;
      let volume: string;
      if (volumeBase < 30) {
        volume = `${((volumeBase + 5) / 10).toFixed(1)}M`;
      } else if (volumeBase < 70) {
        volume = `${volumeBase + 10}M`;
      } else {
        volume = `${(volumeBase / 10 + 5).toFixed(1)}B`;
      }
      
      // Calculate change percentage
      const change = parseFloat((Math.sin(seedValue / 5) * 5).toFixed(2));
      
      setLiveData({ price, volume, change });
    };
    
    generateLiveData();
    
    // Fetch prediction data for this stock
    const fetchPredictionData = async () => {
      setLoading(true);
      try {
        const data = await fetchStockPredictions(stock.ticker);
        if (data) {
          setPrediction(data);
          // Calculate volatility level based on volatility score
          setVolatilityLevel(getVolatilityLevel(data.volatility_score));
        }
      } catch (error) {
        console.error(`Failed to fetch predictions for ${stock.ticker}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictionData();
  }, [stock.ticker]);
  
  const isPositive = liveData ? liveData.change >= 0 : stock.change >= 0;
  const isPredictionPositive = prediction ? prediction.percent_change >= 0 : false;
  
  return (
    <Link to={`/stocks/${stock.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono font-bold text-lg">{stock.ticker}</div>
              <div className="text-sm text-muted-foreground">{stock.name}</div>
            </div>
            <div className={isPositive ? "stock-change-positive" : "stock-change-negative"}>
              {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {Math.abs(liveData ? liveData.change : stock.change).toFixed(2)}%
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="font-mono">{liveData ? liveData.volume : stock.volume}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Buy Price</div>
              <div className="font-mono">${stock.buyPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Volatility</div>
              <div>
                <span className={`volatility-${volatilityLevel.toLowerCase()}`}>
                  {volatilityLevel}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <div className="text-xs text-muted-foreground">Prediction</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>5-Day AI Prediction</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {prediction ? (
                <div className={isPredictionPositive ? "text-success text-sm font-medium" : "text-danger text-sm font-medium"}>
                  {isPredictionPositive ? "+" : ""}{prediction.percent_change.toFixed(2)}%
                </div>
              ) : loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="text-sm text-muted-foreground">N/A</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
