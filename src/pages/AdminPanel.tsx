
import { useState } from "react";
import Header from "@/components/Header";
import MarketSentiment from "@/components/MarketSentiment";
import { useStocks, Stock } from "@/providers/StockProvider";
import { useMaintenance } from "@/providers/MaintenanceProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export default function AdminPanel() {
  const { maintenanceMode, toggleMaintenanceMode } = useMaintenance();
  const { stocks, fetchStocks } = useStocks();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stocksData, setStocksData] = useState<Stock[]>(stocks);

  const handleVolatilityChange = (stockId: string, volatility: "Low" | "Medium" | "High") => {
    setStocksData(prevStocks => 
      prevStocks.map(stock => 
        stock.id === stockId ? { ...stock, volatility } : stock
      )
    );
    toast({
      title: "Volatility Updated",
      description: `${stocks.find(s => s.id === stockId)?.name} volatility set to ${volatility}`,
    });
  };

  const handleMarketSentimentUpdate = (value: number) => {
    toast({
      title: "Market Sentiment Updated",
      description: `Market sentiment value set to ${value}`,
    });
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    // Simulating API call
    setTimeout(() => {
      fetchStocks();
      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Stock data has been refreshed successfully",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable to show a maintenance banner to all users</p>
                    </div>
                    <Switch 
                      id="maintenance-mode" 
                      checked={maintenanceMode} 
                      onCheckedChange={toggleMaintenanceMode} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-base mb-2 block">Data Management</Label>
                    <Button 
                      onClick={handleRefreshData} 
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? "Refreshing..." : "Refresh Stock Data"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Volatility Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Current Price</TableHead>
                        <TableHead>Volatility</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocksData.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-mono font-medium">{stock.ticker}</TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell>${stock.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={stock.volatility}
                              onValueChange={(value) => handleVolatilityChange(stock.id, value as "Low" | "Medium" | "High")}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Volatility" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment Control</CardTitle>
              </CardHeader>
              <CardContent>
                <MarketSentiment 
                  isEditable={true} 
                  onUpdate={handleMarketSentimentUpdate}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key" className="text-sm">API Key</Label>
                    <div className="flex mt-1.5">
                      <input 
                        id="api-key" 
                        type="password" 
                        value="••••••••••••••••" 
                        readOnly
                        className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Button 
                        variant="outline" 
                        className="rounded-l-none"
                        onClick={() => {
                          toast({
                            title: "API Key Copied",
                            description: "API key has been copied to clipboard",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endpoint" className="text-sm">Endpoint URL</Label>
                    <input 
                      id="endpoint" 
                      type="text" 
                      defaultValue="https://api.example.com/v1/stocks"
                      className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Settings Saved",
                        description: "API configuration has been updated",
                      });
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
