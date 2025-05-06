
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

// Fetch stock predictions from the API
export const fetchStockPredictions = async (stockCode: string): Promise<StockPrediction | null> => {
  try {
    const response = await fetch(`https://govind2121.pythonanywhere.com/get_predictions?stock=${stockCode}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch predictions for ${stockCode}: ${response.status}`);
    }
    
    const data: StockPrediction = await response.json();
    console.log(`Predictions for ${stockCode}:`, data);
    return data;
  } catch (error) {
    console.error("Error fetching stock predictions:", error);
    return null;
  }
};

// Fetch market volatility data from the API
export const fetchMarketVolatility = async (): Promise<MarketVolatility | null> => {
  try {
    // Since the API endpoint is provided as "/market_volatility", we'll assume it's on the same server
    const response = await fetch('https://govind2121.pythonanywhere.com/market_volatility');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market volatility: ${response.status}`);
    }
    
    const data: MarketVolatility = await response.json();
    console.log("Market volatility data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching market volatility:", error);
    return null;
  }
};
