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

// Alpha Vantage API types
export interface AlphaVantageQuote {
  symbol: string;
  open: string;
  high: string;
  low: string;
  price: string;
  volume: string;
  previousClose: string;
  change: string;
  changePercent: string;
  marketCap?: string;
}

// Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = 'AOLSJAPIQOALFSKT6QLOYGNLKL8468QA'; // This is a demo key with limited usage

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

// Fetch real-time stock data from Alpha Vantage API
export const fetchStockQuote = async (symbol: string): Promise<AlphaVantageQuote | null> => {
  try {
    // Construct Alpha Vantage API URL for global quote
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    console.log(`Fetching stock data for ${symbol} from Alpha Vantage...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we received the expected data structure
    if (!data || !data['Global Quote']) {
      console.warn(`Invalid data structure from Alpha Vantage for ${symbol}:`, data);
      throw new Error('Invalid data structure from Alpha Vantage');
    }
    
    const quote = data['Global Quote'];
    
    // Extract and format the data
    const formattedQuote: AlphaVantageQuote = {
      symbol: quote['01. symbol'] || symbol,
      open: quote['02. open'] || '0',
      high: quote['03. high'] || '0',
      low: quote['04. low'] || '0',
      price: quote['05. price'] || '0',
      volume: quote['06. volume'] || '0',
      previousClose: quote['08. previous close'] || '0',
      change: quote['09. change'] || '0',
      changePercent: quote['10. change percent'] || '0%',
    };
    
    // Get the market cap using a second API call
    try {
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const overviewResponse = await fetch(overviewUrl);
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        if (overviewData && overviewData.MarketCapitalization) {
          const marketCap = parseInt(overviewData.MarketCapitalization);
          formattedQuote.marketCap = formatMarketCap(marketCap);
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch market cap for ${symbol}:`, error);
    }
    
    console.log(`Alpha Vantage data for ${symbol}:`, formattedQuote);
    return formattedQuote;
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    return null;
  }
};

// Format large numbers into human-readable format (e.g., 1.2T, 456.7B, 789.1M)
export const formatMarketCap = (value: number): string => {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else {
    return value.toString();
  }
};

// Format volume to human-readable format
export const formatVolume = (volume: string | number): string => {
  const numVolume = typeof volume === 'string' ? parseInt(volume) : volume;
  
  if (numVolume >= 1e9) {
    return `${(numVolume / 1e9).toFixed(1)}B`;
  } else if (numVolume >= 1e6) {
    return `${(numVolume / 1e6).toFixed(1)}M`;
  } else if (numVolume >= 1e3) {
    return `${(numVolume / 1e3).toFixed(1)}K`;
  } else {
    return numVolume.toString();
  }
};

// Generate fallback data for when API is unavailable
export const getStockFallbackData = (stockCode: string): AlphaVantageQuote => {
  // For specific stocks, use more accurate estimates
  if (stockCode.toUpperCase() === 'META') {
    return {
      symbol: 'META',
      open: '595.25',
      high: '596.03',
      low: '586.58',
      price: '587.31',
      volume: '10600650',
      previousClose: '599.27',
      change: '-11.96',
      changePercent: '-1.99%',
      marketCap: '1.51T'
    };
  } else if (stockCode.toUpperCase() === 'AAPL') {
    return {
      symbol: 'AAPL',
      open: '195.89',
      high: '199.62',
      low: '195.76',
      price: '198.52',
      volume: '48257300',
      previousClose: '197.57',
      change: '0.95',
      changePercent: '0.48%',
      marketCap: '3.08T'
    };
  } else if (stockCode.toUpperCase() === 'MSFT') {
    return {
      symbol: 'MSFT',
      open: '415.25',
      high: '420.82',
      low: '413.85',
      price: '417.52',
      volume: '19879800',
      previousClose: '415.42',
      change: '2.10',
      changePercent: '0.51%',
      marketCap: '3.24T'
    };
  } else if (stockCode.toUpperCase() === 'GOOGL') {
    return {
      symbol: 'GOOGL',
      open: '162.21',
      high: '164.68',
      low: '161.95',
      price: '164.32',
      volume: '22702400',
      previousClose: '163.02',
      change: '1.30',
      changePercent: '0.80%',
      marketCap: '2.04T'
    };
  } else if (stockCode.toUpperCase() === 'AMZN') {
    return {
      symbol: 'AMZN',
      open: '178.35',
      high: '182.63',
      low: '177.86',
      price: '181.22',
      volume: '36421500',
      previousClose: '179.62',
      change: '1.60',
      changePercent: '0.89%',
      marketCap: '1.87T'
    };
  } else if (stockCode.toUpperCase() === 'TSLA') {
    return {
      symbol: 'TSLA',
      open: '273.10',
      high: '277.73',
      low: '271.35',
      price: '275.35',
      volume: '76715792',
      previousClose: '280.26',
      change: '-4.91',
      changePercent: '-1.75%',
      marketCap: '876.5B'
    };
  }

  const seedValue = stockCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isPositive = seedValue % 2 === 0;
  
  // Base price depends on the ticker (just for simulation)
  const basePrice = (seedValue % 500) + 50;
  
  // Add some randomness to the price
  const price = parseFloat((basePrice + (Math.sin(seedValue / 10) * 5)).toFixed(2));
  
  // Calculate previous close
  const prevClose = price - (isPositive ? -2 : 2) - (Math.random() * 5);
  
  // Calculate change
  const change = price - prevClose;
  const changePercent = ((change / prevClose) * 100).toFixed(2) + '%';
  
  // Generate volume
  const volumeBase = seedValue % 100;
  let volume: string;
  if (volumeBase < 30) {
    volume = `${(volumeBase + 5) * 100000}`;
  } else if (volumeBase < 70) {
    volume = `${(volumeBase + 10) * 1000000}`;
  } else {
    volume = `${(volumeBase / 10 + 5) * 10000000}`;
  }
  
  // Generate market cap
  const marketCap = price * parseInt(volume) * 10;
  
  return {
    symbol: stockCode,
    open: prevClose.toFixed(2),
    high: (price * 1.01).toFixed(2),
    low: (price * 0.98).toFixed(2),
    price: price.toString(),
    volume: volume,
    previousClose: prevClose.toFixed(2),
    change: change.toFixed(2),
    changePercent: changePercent,
    marketCap: formatMarketCap(marketCap)
  };
};
