
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Stock } from "@/providers/StockProvider";
import { ChevronUp, ChevronDown } from "lucide-react";

interface StockCardProps {
  stock: Stock;
}

export default function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;
  
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
              {Math.abs(stock.change).toFixed(2)}%
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="font-mono">{stock.volume}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Buy Price</div>
              <div className="font-mono">${stock.buyPrice.toFixed(2)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Volatility</div>
              <div>
                <span className={`volatility-${stock.volatility.toLowerCase()}`}>
                  {stock.volatility}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
