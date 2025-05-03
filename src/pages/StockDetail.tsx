
import { useParams, Link } from "react-router-dom";
import { useStocks } from "@/providers/StockProvider";
import Header from "@/components/Header";
import ChartCard from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";

// Mock price history data
const generateMockPriceHistory = () => {
  const data = [];
  let price = 150 + Math.random() * 50;
  
  for (let i = 0; i < 20; i++) {
    // Generate random price fluctuations
    price = price + (Math.random() - 0.5) * 10;
    data.push({
      name: `${i + 1}h`,
      value: parseFloat(price.toFixed(2))
    });
  }
  
  return data;
};

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const { getStockById, loadingStocks } = useStocks();
  const stock = id ? getStockById(id) : undefined;
  const priceHistory = generateMockPriceHistory();

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
  
  const isPositive = stock.change >= 0;

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
                {Math.abs(stock.change).toFixed(2)}%
              </div>
            </div>
          </div>
          
          <div className="text-2xl font-bold font-mono">
            ${stock.price.toFixed(2)}
          </div>
        </div>
        
        <div className="mb-10">
          <Card>
            <CardContent className="p-1 md:p-4">
              <div className="h-[400px] w-full">
                <ChartCard
                  title=""
                  data={priceHistory}
                  color={isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <div className="stats-grid">
            <StatsCard
              label="Current Price"
              value={`$${stock.price.toFixed(2)}`}
            />
            <StatsCard
              label="Volume"
              value={stock.volume}
            />
            <StatsCard
              label="Market Cap"
              value={stock.marketCap}
            />
            <StatsCard
              label="Volatility"
              value={stock.volatility}
              valueClassName={`volatility-${stock.volatility.toLowerCase()}`}
            />
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
