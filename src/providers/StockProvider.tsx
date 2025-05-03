
import React, { createContext, useContext, useState, useEffect } from "react";

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  previousPrice: number;
  change: number;
  volume: string;
  buyPrice: number;
  volatility: "Low" | "Medium" | "High";
  marketCap: string;
}

export interface StockContextType {
  stocks: Stock[];
  loadingStocks: boolean;
  getStockById: (id: string) => Stock | undefined;
  fetchStocks: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const mockStocks: Stock[] = [
  {
    id: "aapl",
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 182.52,
    previousPrice: 180.75,
    change: 0.98,
    volume: "58.9M",
    buyPrice: 180.75,
    volatility: "Low",
    marketCap: "2.86T"
  },
  {
    id: "msft",
    ticker: "MSFT",
    name: "Microsoft Corp.",
    price: 328.79,
    previousPrice: 332.42,
    change: -1.09,
    volume: "21.2M",
    buyPrice: 332.42,
    volatility: "Low",
    marketCap: "2.44T"
  },
  {
    id: "googl",
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    price: 132.73,
    previousPrice: 131.86,
    change: 0.66,
    volume: "23.1M",
    buyPrice: 131.86,
    volatility: "Medium",
    marketCap: "1.68T"
  },
  {
    id: "amzn",
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    price: 169.51,
    previousPrice: 167.08,
    change: 1.45,
    volume: "34.6M",
    buyPrice: 167.08,
    volatility: "Medium",
    marketCap: "1.75T"
  },
  {
    id: "meta",
    ticker: "META",
    name: "Meta Platforms Inc.",
    price: 347.56,
    previousPrice: 351.73,
    change: -1.19,
    volume: "15.3M",
    buyPrice: 351.73,
    volatility: "Medium",
    marketCap: "891.5B"
  },
  {
    id: "tsla",
    ticker: "TSLA",
    name: "Tesla Inc.",
    price: 248.98,
    previousPrice: 257.22,
    change: -3.20,
    volume: "51.7M",
    buyPrice: 257.22,
    volatility: "High",
    marketCap: "789.2B"
  }
];

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState<boolean>(true);

  const fetchStocks = async () => {
    setLoadingStocks(true);
    try {
      // In a real app, this would be an actual API call
      // For now, we'll use our mock data with a simulated delay
      setTimeout(() => {
        setStocks(mockStocks);
        setLoadingStocks(false);
      }, 800);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      setLoadingStocks(false);
    }
  };
  
  useEffect(() => {
    fetchStocks();
  }, []);
  
  const getStockById = (id: string) => {
    return stocks.find(stock => stock.id === id);
  };

  return (
    <StockContext.Provider value={{ stocks, loadingStocks, getStockById, fetchStocks }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStocks() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error("useStocks must be used within a StockProvider");
  }
  return context;
}
