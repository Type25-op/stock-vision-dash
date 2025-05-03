
import { useState } from "react";
import Header from "@/components/Header";
import StockCard from "@/components/StockCard";
import MarketSentiment from "@/components/MarketSentiment";
import ChartCard from "@/components/ChartCard";
import { useStocks } from "@/providers/StockProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-10">
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
                        subtitle="May 03, 2025"
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
