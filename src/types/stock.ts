export interface StockSummary {
  code: string;
  name: string;
  market: string;
  reutersCode: string;
  isForeign: boolean;
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
  // 종가/시가/고가/저가 뒤에 그대로 붙이는 통화 표기. 원화는 접두 공백 없이 '원', 외화는 ' USD'처럼 공백을 포함해서 저장한다.
  currencyUnit: string;
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
