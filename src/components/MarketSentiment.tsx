
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { fetchMarketVolatility, MarketVolatility } from "@/utils/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface MarketSentimentProps {
  initialValue?: number;
  isEditable?: boolean;
  onUpdate?: (value: number) => void;
}

export default function MarketSentiment({ 
  initialValue = 63, 
  isEditable = false,
  onUpdate
}: MarketSentimentProps) {
  const [value, setValue] = useState(initialValue);
  const [marketData, setMarketData] = useState<MarketVolatility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchMarketVolatility();
        setMarketData(data);
        
        // Convert market sentiment to a value between 0-100
        // Bearish: 0-30, Slightly Bearish: 30-45, Neutral: 45-55, Slightly Bullish: 55-70, Bullish: 70-100
        let sentimentValue: number;
        switch (data.market_sentiment) {
          case "Bearish":
            sentimentValue = 15 + (data.market_volatility_score * 3);
            break;
          case "Slightly Bearish":
            sentimentValue = 37.5 + (data.market_volatility_score * 2);
            break;
          case "Neutral":
            sentimentValue = 50 + (data.market_volatility_score * 1);
            break;
          case "Slightly Bullish":
            sentimentValue = 62.5 + (data.market_volatility_score * 2);
            break;
          case "Bullish":
            sentimentValue = 85 + (data.market_volatility_score * 3);
            break;
          default:
            sentimentValue = 50; // Default to neutral
        }
        
        // Ensure the value is within 0-100 range
        sentimentValue = Math.max(0, Math.min(100, sentimentValue));
        
        setValue(sentimentValue);
        if (onUpdate) {
          onUpdate(sentimentValue);
        }
      } catch (err) {
        console.error("Error loading market data:", err);
        setError("Failed to load market data");
        toast.error("Failed to load market data. Using simulated data.");
      } finally {
        setLoading(false);
      }
    };
    
    loadMarketData();
  }, [onUpdate]);
  
  const getSentimentText = (val: number) => {
    if (marketData) {
      return marketData.market_sentiment;
    }
    
    if (val < 30) return "Bearish";
    if (val < 45) return "Slightly Bearish";
    if (val < 55) return "Neutral";
    if (val < 70) return "Slightly Bullish";
    return "Bullish";
  };
  
  const getSentimentColor = (val: number) => {
    if (val < 30) return "text-danger";
    if (val < 45) return "text-orange-500";
    if (val < 55) return "text-yellow-500";
    if (val < 70) return "text-green-400";
    return "text-success";
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    if (onUpdate) {
      onUpdate(newValue);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Market Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Market Sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <div className={`text-2xl font-bold ${getSentimentColor(value)}`}>{Math.round(value)}</div>
            <div className="text-sm text-muted-foreground">{getSentimentText(value)}</div>
          </div>
          <Progress value={value} className="h-2" />
          
          {marketData && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Bullish</div>
                <div className="font-medium text-success">{marketData.bullish_stocks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Neutral</div>
                <div className="font-medium">{marketData.neutral_stocks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bearish</div>
                <div className="font-medium text-danger">{marketData.bearish_stocks}</div>
              </div>
            </div>
          )}
          
          {isEditable && (
            <div className="pt-4">
              <Label htmlFor="sentiment">Adjust Sentiment (0-100)</Label>
              <input 
                id="sentiment"
                type="range" 
                min="0" 
                max="100" 
                value={value} 
                onChange={handleChange}
                className="w-full mt-2" 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
