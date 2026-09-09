export type MarketType = 'SH' | 'SZ' | 'BJ';

export interface Stock {
  symbol: string;         // e.g. "600519.SH"
  code: string;           // "600519"
  name: string;           // "贵州茅台"
  market: MarketType;
  group: string;          // "自选" | "白酒消费" | "科技芯片" | "新能源" | "金融地产"
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;         // 手
  amount: number;         // 亿元
  open: number;
  high: number;
  low: number;
  prevClose: number;
  pe: number;
  pb: number;
  marketCap: number;      // 亿元
  sparkline: number[];    // recent 10 prices for mini chart
}

export interface KLineBar {
  timestamp: number;
  date: string;           // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  // Moving Averages
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  // MACD
  dif?: number;
  dea?: number;
  macd?: number;
  // RSI
  rsi6?: number;
  rsi12?: number;
  rsi24?: number;
  // Bollinger Bands
  boll_mid?: number;
  boll_upper?: number;
  boll_lower?: number;
  // KDJ
  kdj_k?: number;
  kdj_d?: number;
  kdj_j?: number;
  // ATR
  atr?: number;
  // Overlay Signal on this Bar
  signal?: 'BUY' | 'SELL';
  signalReason?: string;
}

export type TimeFrame = '5m' | '15m' | '60m' | '1D' | '1W' | '1M';

export interface Strategy {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  version: string;
  stockSymbol: string;
  code: string;
  parameters: Record<string, number | string>;
}

export interface BacktestConfig {
  initialCapital: number;       // 默认 100,000 元
  startDate: string;            // "2024-01-01"
  endDate: string;              // "2026-03-01"
  benchmarkSymbol?: string;     // "000300.SH" (沪深300)
  matchPrice: 'next_open' | 'current_close'; // 撮合价格: 下一Bar开盘价 或 当前Bar收盘价
  stampTax: number;             // 双边或卖方印花税 (0.0005 = 0.05%)
  commission: number;           // 券商佣金 (0.00025 = 0.025%)
  slippage: number;             // 滑点 (0.0005 = 0.05%)
}

export interface StrategyAction {
  id: string;
  date: string;
  timestamp: number;
  symbol: string;
  stockName: string;
  actionType: 'BUY' | 'SELL' | 'STOP_LOSS' | 'TAKE_PROFIT';
  price: number;
  shares: number;
  amount: number;
  fees: number;
  reason: string;
  indicatorsSnapshot?: {
    ma5?: number;
    ma20?: number;
    rsi?: number;
    macd?: number;
    atr?: number;
    bollUpper?: number;
  };
  pnl?: number;
  pnlPercent?: number;
  holdingDays?: number;
}

export interface StrategyLogEntry {
  id: string;
  date: string;
  type: 'INFO' | 'SIGNAL' | 'ORDER' | 'RISK';
  message: string;
}

export interface SimulationState {
  isPlaying: boolean;
  currentBarIndex: number;
  totalBars: number;
  speed: number; // 1x, 2x, 5x, 10x
  mode: 'FULL' | 'REPLAY' | 'STEP';
}

export interface TradeRecord {
  id: string;
  tradeIndex: number;
  symbol: string;
  stockName: string;
  side: 'BUY' | 'SELL';
  buyDate: string;
  buyPrice: number;
  sellDate?: string;
  sellPrice?: number;
  shares: number;
  costValue: number;
  sellValue?: number;
  pnl?: number;
  pnlPercent?: number;
  holdDays?: number;
  reason: string;
  fees: number;
  status: 'OPEN' | 'CLOSED';
}

export interface EquityPoint {
  date: string;
  timestamp: number;
  strategyEquity: number;
  strategyReturn: number;      // %
  benchmarkEquity: number;
  benchmarkReturn: number;     // %
  excessReturn: number;        // %
  drawdown: number;            // %
  cash: number;
  holdingsValue: number;
  positionPercent: number;     // 0 - 100%
  signal?: 'BUY' | 'SELL';
}

export interface EvaluationMetrics {
  // 1. 收益指标
  cumulativeReturn: number;     // 累计收益率 (%)
  annualizedReturn: number;     // 年化收益率 (%)
  benchmarkReturn: number;      // 基准累计收益 (%)
  alpha: number;                // Alpha (α, %)
  beta: number;                 // Beta (β)
  
  // 2. 风险与稳定性
  maxDrawdown: number;          // 最大回撤 (%)
  maxDrawdownDays: number;      // 最长回撤修复天数
  sharpeRatio: number;          // 夏普比率
  sortinoRatio: number;         // 索提诺比率
  annualizedVolatility: number; // 年化波动率 (%)
  
  // 3. 交易特征
  winRate: number;              // 胜率 (%)
  profitLossRatio: number;      // 盈亏比
  totalTrades: number;          // 总交易次数
  winningTrades: number;        // 盈利交易数
  losingTrades: number;         // 亏损交易数
  avgHoldDays: number;          // 平均持仓天数
  monthlyTradeFrequency: number;// 月均交易次数
  totalCommission: number;      // 佣金总计 (元)
  totalStampTax: number;        // 印花税总计 (元)
}

export interface GridSearchDimension {
  name: string;
  label: string;
  values: number[];
}

export interface GridSearchCell {
  param1: number;
  param2: number;
  cumulativeReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitLossRatio?: number;
  totalTrades: number;
  totalActions?: number;
  buyActionCount?: number;
  sellActionCount?: number;
  stopLossActionCount?: number;
  avgHoldDays?: number;
  totalFrictionCost?: number;
  frictionRatio?: number;
  actionQualityScore?: number;
  isOverfittingPeak?: boolean;
  isRobustPlateau?: boolean;
  actionSample?: {
    actionType: 'BUY' | 'SELL' | 'STOP_LOSS' | 'TAKE_PROFIT';
    date: string;
    price: number;
    pnl?: number;
    reason: string;
  }[];
}

export interface GridSearchResult {
  param1Name: string;
  param1Label: string;
  param1Values: number[];
  param2Name: string;
  param2Label: string;
  param2Values: number[];
  matrix: GridSearchCell[][];
  bestCell: GridSearchCell;
  bestSharpeCell: GridSearchCell;
  bestActionQualityCell?: GridSearchCell;
  minFrictionCell?: GridSearchCell;
}

export interface AIDiagnosisResult {
  summary: string;
  score?: number;
  flaws?: {
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }[];
  vulnerabilities?: {
    issue: string;
    severity: 'high' | 'medium' | 'low';
    impact: string;
  }[];
  attribution: {
    trend?: number;
    alpha?: number;
    market?: number;
    trendContribution?: number;
    alphaContribution?: number;
    noiseLoss?: number;
    description?: string;
  };
  recommendations: string[];
  optimizedCode?: string;
  codeExplanation?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
