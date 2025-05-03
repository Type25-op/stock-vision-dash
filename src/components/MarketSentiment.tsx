
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

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
  
  const getSentimentText = (val: number) => {
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Market Sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <div className={`text-2xl font-bold ${getSentimentColor(value)}`}>{value}</div>
            <div className="text-sm text-muted-foreground">{getSentimentText(value)}</div>
          </div>
          <Progress value={value} className="h-2" />
          
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
