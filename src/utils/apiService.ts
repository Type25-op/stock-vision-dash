
// API service for fetching stock predictions and market volatility data

export interface StockPrediction {
  date: string;
  model_version: string;
  percent_change: number;
  pred_1d: number;
  pred_2d: number;
  pred_3d: number;
  pred_4d: number;
  pred_5d: number;
  stock_name: string;
  volatility_score: number;
}

export interface MostActiveStock {
  percent_change: number;
  score: number;
  stock: string;
}

export interface MarketVolatility {
  bearish_stocks: number;
  bullish_stocks: number;
  market_percent_change: number;
  market_sentiment: string;
  market_strength: string;
  market_volatility_score: number;
  most_bearish: MostActiveStock;
  most_bullish: MostActiveStock;
  neutral_stocks: number;
  total_stocks_analyzed: number;
}

// Mock data for when API is unavailable
const getMockStockPrediction = (stockCode: string): StockPrediction => {
  const seedValue = stockCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isPositive = seedValue % 2 === 0;
  const percentChange = parseFloat((Math.random() * 5 * (isPositive ? 1 : -1)).toFixed(2));
  const basePrice = (seedValue % 200) + 100;
  
  return {
    date: new Date().toISOString().split('T')[0],
    model_version: "v1-fallback",
    percent_change: percentChange,
    pred_1d: basePrice * (1 + percentChange * 0.2 / 100),
    pred_2d: basePrice * (1 + percentChange * 0.4 / 100),
    pred_3d: basePrice * (1 + percentChange * 0.6 / 100),
    pred_4d: basePrice * (1 + percentChange * 0.8 / 100),
    pred_5d: basePrice * (1 + percentChange / 100),
    stock_name: stockCode,
    volatility_score: isPositive ? Math.floor(Math.random() * 3) : -Math.floor(Math.random() * 3) - 1
  };
};

const mockMarketVolatility: MarketVolatility = {
  bearish_stocks: 3,
  bullish_stocks: 2,
  market_percent_change: -2.84,
  market_sentiment: "Slightly Bearish",
  market_strength: "Moderate",
  market_volatility_score: -0.83,
  most_bearish: {
    percent_change: -8.45,
    score: -3,
    stock: "MSFT"
  },
  most_bullish: {
    percent_change: 3.27,
    score: 2,
    stock: "AAPL"
  },
  neutral_stocks: 1,
  total_stocks_analyzed: 6
};

// Fetch stock predictions from the API
export const fetchStockPredictions = async (stockCode: string): Promise<StockPrediction> => {
  try {
    const response = await fetch(`https://govind2121.pythonanywhere.com/get_predictions?stock=${stockCode}`, {
      // Add some query parameters to prevent caching
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`API response not OK for ${stockCode}: ${response.status}`);
      throw new Error(`Failed to fetch predictions for ${stockCode}: ${response.status}`);
    }
    
    const data: StockPrediction = await response.json();
    console.log(`Predictions for ${stockCode}:`, data);
    return data;
  } catch (error) {
    console.error("Error fetching stock predictions:", error);
    // Return mock data when API is unavailable
    console.log(`Using fallback data for ${stockCode}`);
    const mockData = getMockStockPrediction(stockCode);
    return mockData;
  }
};

// Fetch market volatility data from the API
export const fetchMarketVolatility = async (): Promise<MarketVolatility> => {
  try {
    // Since the API endpoint is provided as "/market_volatility", we'll assume it's on the same server
    const response = await fetch('https://govind2121.pythonanywhere.com/market_volatility', {
      // Add some query parameters to prevent caching
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`API response not OK for market volatility: ${response.status}`);
      throw new Error(`Failed to fetch market volatility: ${response.status}`);
    }
    
    const data: MarketVolatility = await response.json();
    console.log("Market volatility data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching market volatility:", error);
    // Return mock data when API is unavailable
    console.log("Using fallback market volatility data");
    return mockMarketVolatility;
  }
};

// Helper function to determine volatility level from score
export const getVolatilityLevel = (score: number): "Low" | "Medium" | "High" => {
  const absScore = Math.abs(score);
  if (absScore <= 1) return "Low";
  if (absScore <= 3) return "Medium";
  return "High";
};

