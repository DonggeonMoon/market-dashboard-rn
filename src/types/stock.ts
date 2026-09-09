export interface StockSummary {
  code: string;
  name: string;
  market: string;
}

export interface StockPrice {
  market: string;
  closePrice: string;
  changePrice: string;
  changeRatio: string;
  direction: 'RISING' | 'FALLING' | 'UNCHANGED';
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  tradeValue: string;
  marketCap: string;
  updatedAt: string;
}

export interface StockIndicator {
  per?: string;
  eps?: string;
  estimatedPer?: string;
  estimatedEps?: string;
  pbr?: string;
  bps?: string;
  dividendYield?: string;
  marketCap?: string;
  week52High?: string;
  week52Low?: string;
  foreignRatio?: string;
}

export interface FinancialRow {
  label: string;
  values: (string | undefined)[];
}

export interface ConsensusInfo {
  opinion?: string;
  targetPrice?: string;
  eps?: string;
  per?: string;
  analystCount?: string;
}

export interface StockDetailInfo {
  indicator: StockIndicator;
  overview: string[];
  financialYears: string[];
  financialRows: FinancialRow[];
  consensus: ConsensusInfo;
}
