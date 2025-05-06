
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StockCard from "@/components/StockCard";
import MarketSentiment from "@/components/MarketSentiment";
import ChartCard from "@/components/ChartCard";
import { useStocks } from "@/providers/StockProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketVolatility, MarketVolatility } from "@/utils/apiService";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

// Mock chart data
const niftyData = [
  { name: "10 AM", value: 18500 },
  { name: "11 AM", value: 18520 },
  { name: "12 PM", value: 18580 },
  { name: "1 PM", value: 18530 },
  { name: "2 PM", value: 18550 },
  { name: "3 PM", value: 18600 },
];

const volatilityData = [
  { name: "Mon", value: 15 },
  { name: "Tue", value: 18 },
  { name: "Wed", value: 12 },
  { name: "Thu", value: 25 },
  { name: "Fri", value: 20 },
];

const marketOverviewData = [
  { name: "Week 1", value: 1000 },
  { name: "Week 2", value: 1100 },
  { name: "Week 3", value: 1050 },
  { name: "Week 4", value: 1150 },
];

export default function Dashboard() {
  const { stocks, loadingStocks } = useStocks();
  const [activeTab, setActiveTab] = useState("watchlist");
  const [marketVolatility, setMarketVolatility] = useState<MarketVolatility | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState<boolean>(true);
  
  useEffect(() => {
    const loadMarketData = async () => {
      setLoadingMarketData(true);
      try {
        const data = await fetchMarketVolatility();
        if (data) {
          setMarketVolatility(data);
        }
      } catch (error) {
        console.error("Error loading market volatility:", error);
      } finally {
        setLoadingMarketData(false);
      }
    };
    
    loadMarketData();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-10">
        {!loadingMarketData && marketVolatility && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 md:gap-8 justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Market Change</div>
                  <div className={`flex items-center ${marketVolatility.market_percent_change >= 0 ? "text-success" : "text-danger"} font-semibold`}>
                    {marketVolatility.market_percent_change >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
                    {Math.abs(marketVolatility.market_percent_change).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Market Sentiment</div>
                  <div className="font-semibold">{marketVolatility.market_sentiment}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Market Strength</div>
                  <div className="font-semibold">{marketVolatility.market_strength}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Most Bullish</div>
                  <div className="font-semibold text-success flex items-center">
                    {marketVolatility.most_bullish.stock} 
                    <span className="ml-1 text-xs">
                      +{marketVolatility.most_bullish.percent_change.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Most Bearish</div>
                  <div className="font-semibold text-danger flex items-center">
                    {marketVolatility.most_bearish.stock}
                    <span className="ml-1 text-xs">
                      {marketVolatility.most_bearish.percent_change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-1 md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Stock Watchlist</h1>
                <TabsList>
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  <TabsTrigger value="nifty">Nifty 50</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="watchlist" className="space-y-0">
                <div className="card-grid">
                  {loadingStocks ? (
                    // Loading skeletons
                    Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <Skeleton className="h-5 w-16 mb-2" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-6 w-12 rounded" />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <div>
                                <Skeleton className="h-3 w-12 mb-1" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                              <div>
                                <Skeleton className="h-3 w-12 mb-1" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                              <div className="col-span-2">
                                <Skeleton className="h-3 w-12 mb-1" />
                                <Skeleton className="h-5 w-10 rounded-full" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    stocks.map((stock) => (
                      <StockCard key={stock.id} stock={stock} />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="nifty">
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="h-[400px]">
                      <ResponsiveChartCard
                        title="Nifty 50 Day Graph"
                        data={niftyData}
                        color="hsl(var(--primary))"
                        subtitle="May 06, 2025"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <MarketSentiment />
            
            {marketVolatility && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Market Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Total Stocks: {marketVolatility.total_stocks_analyzed}</span>
                    <span className="text-xs text-muted-foreground">Sentiment Distribution</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full flex overflow-hidden">
                    <div 
                      className="bg-success h-full" 
                      style={{width: `${(marketVolatility.bullish_stocks / marketVolatility.total_stocks_analyzed) * 100}%`}}
                    ></div>
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{width: `${(marketVolatility.neutral_stocks / marketVolatility.total_stocks_analyzed) * 100}%`}}
                    ></div>
                    <div 
                      className="bg-danger h-full" 
                      style={{width: `${(marketVolatility.bearish_stocks / marketVolatility.total_stocks_analyzed) * 100}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-success">{marketVolatility.bullish_stocks} Bullish</span>
                    <span className="text-yellow-500">{marketVolatility.neutral_stocks} Neutral</span>
                    <span className="text-danger">{marketVolatility.bearish_stocks} Bearish</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <ChartCard
              title="Stock Volatility"
              data={volatilityData}
              color="hsl(var(--danger))"
              subtitle="Last 5 days"
            />
            
            <ChartCard
              title="Market Overview"
              data={marketOverviewData}
              color="hsl(var(--success))"
              subtitle="Past month"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Responsive chart with increased height for better visualization
function ResponsiveChartCard({
  title,
  data,
  color = "hsl(var(--primary))",
  subtitle,
}: {
  title: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
  subtitle?: string;
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>

      <div className="h-full w-full">
        <ChartCard title="" data={data} color={color} />
      </div>
    </>
  );
}
