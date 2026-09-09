import { Stock, KLineBar, TimeFrame } from '../types';

export const INITIAL_STOCKS: Stock[] = [
  {
    symbol: '600519.SH',
    code: '600519',
    name: '贵州茅台',
    market: 'SH',
    group: '白酒消费',
    currentPrice: 1788.50,
    change: 22.30,
    changePercent: 1.26,
    volume: 38290,
    amount: 68.42,
    open: 1769.00,
    high: 1795.00,
    low: 1765.20,
    prevClose: 1766.20,
    pe: 28.5,
    pb: 9.8,
    marketCap: 22468,
    sparkline: [1750, 1755, 1762, 1758, 1770, 1765, 1778, 1782, 1775, 1788.5],
  },
  {
    symbol: '300750.SZ',
    code: '300750',
    name: '宁德时代',
    market: 'SZ',
    group: '新能源',
    currentPrice: 246.80,
    change: 5.60,
    changePercent: 2.32,
    volume: 148200,
    amount: 36.50,
    open: 241.50,
    high: 248.90,
    low: 240.20,
    prevClose: 241.20,
    pe: 22.4,
    pb: 4.6,
    marketCap: 10850,
    sparkline: [238, 240, 237, 242, 245, 241, 244, 243, 245, 246.8],
  },
  {
    symbol: '000001.SZ',
    code: '000001',
    name: '平安银行',
    market: 'SZ',
    group: '金融地产',
    currentPrice: 11.45,
    change: -0.08,
    changePercent: -0.69,
    volume: 682000,
    amount: 7.82,
    open: 11.55,
    high: 11.62,
    low: 11.40,
    prevClose: 11.53,
    pe: 5.2,
    pb: 0.55,
    marketCap: 2221,
    sparkline: [11.6, 11.58, 11.52, 11.55, 11.48, 11.50, 11.46, 11.49, 11.47, 11.45],
  },
  {
    symbol: '601318.SH',
    code: '601318',
    name: '中国平安',
    market: 'SH',
    group: '金融地产',
    currentPrice: 53.60,
    change: 0.45,
    changePercent: 0.85,
    volume: 325400,
    amount: 17.40,
    open: 53.20,
    high: 54.10,
    low: 53.05,
    prevClose: 53.15,
    pe: 8.9,
    pb: 0.98,
    marketCap: 9780,
    sparkline: [52.8, 53.0, 53.4, 52.9, 53.2, 53.5, 53.1, 53.3, 53.4, 53.6],
  },
  {
    symbol: '002594.SZ',
    code: '002594',
    name: '比亚迪',
    market: 'SZ',
    group: '新能源',
    currentPrice: 285.20,
    change: 6.80,
    changePercent: 2.44,
    volume: 89400,
    amount: 25.30,
    open: 279.00,
    high: 287.50,
    low: 278.20,
    prevClose: 278.40,
    pe: 24.1,
    pb: 4.8,
    marketCap: 8300,
    sparkline: [272, 275, 278, 274, 280, 279, 282, 284, 281, 285.2],
  },
  {
    symbol: '688981.SH',
    code: '688981',
    name: '中芯国际',
    market: 'SH',
    group: '科技芯片',
    currentPrice: 88.30,
    change: 3.10,
    changePercent: 3.64,
    volume: 245000,
    amount: 21.60,
    open: 85.50,
    high: 89.80,
    low: 85.10,
    prevClose: 85.20,
    pe: 65.2,
    pb: 3.8,
    marketCap: 7030,
    sparkline: [82, 84, 83, 85, 84.5, 86, 85.2, 87, 86.8, 88.3],
  },
  {
    symbol: '000858.SZ',
    code: '000858',
    name: '五粮液',
    market: 'SZ',
    group: '白酒消费',
    currentPrice: 148.60,
    change: 1.80,
    changePercent: 1.23,
    volume: 112000,
    amount: 16.60,
    open: 147.00,
    high: 149.50,
    low: 146.80,
    prevClose: 146.80,
    pe: 18.2,
    pb: 4.2,
    marketCap: 5768,
    sparkline: [144, 145, 147, 146, 148, 147.5, 146.9, 148.2, 147.8, 148.6],
  },
  {
    symbol: '300059.SZ',
    code: '300059',
    name: '东方财富',
    market: 'SZ',
    group: '金融地产',
    currentPrice: 22.85,
    change: 0.95,
    changePercent: 4.34,
    volume: 1820000,
    amount: 41.20,
    open: 21.90,
    high: 23.20,
    low: 21.80,
    prevClose: 21.90,
    pe: 38.5,
    pb: 4.9,
    marketCap: 3620,
    sparkline: [21.0, 21.4, 21.8, 21.5, 22.0, 21.7, 22.3, 22.1, 22.4, 22.85],
  },
  {
    symbol: '600036.SH',
    code: '600036',
    name: '招商银行',
    market: 'SH',
    group: '金融地产',
    currentPrice: 38.90,
    change: 0.35,
    changePercent: 0.91,
    volume: 284000,
    amount: 11.05,
    open: 38.60,
    high: 39.20,
    low: 38.50,
    prevClose: 38.55,
    pe: 6.8,
    pb: 0.92,
    marketCap: 9810,
    sparkline: [38.0, 38.2, 38.5, 38.3, 38.6, 38.8, 38.4, 38.7, 38.6, 38.9],
  },
  {
    symbol: '002475.SZ',
    code: '002475',
    name: '立讯精密',
    market: 'SZ',
    group: '科技芯片',
    currentPrice: 39.40,
    change: -0.30,
    changePercent: -0.76,
    volume: 165000,
    amount: 6.52,
    open: 39.70,
    high: 40.10,
    low: 39.20,
    prevClose: 39.70,
    pe: 25.4,
    pb: 4.1,
    marketCap: 2835,
    sparkline: [38.8, 39.1, 39.5, 39.8, 39.6, 40.0, 39.7, 39.9, 39.5, 39.4],
  },
];

// Technical indicators calculator (MA, MACD, RSI, BOLL, KDJ, ATR)
export function calculateIndicators(bars: KLineBar[]): KLineBar[] {
  const result = [...bars];
  const closes = result.map(b => b.close);
  const highs = result.map(b => b.high);
  const lows = result.map(b => b.low);

  // 1. Moving Averages (MA5, MA10, MA20, MA60)
  for (let i = 0; i < result.length; i++) {
    if (i >= 4) {
      const sum5 = closes.slice(i - 4, i + 1).reduce((a, b) => a + b, 0);
      result[i].ma5 = Number((sum5 / 5).toFixed(2));
    }
    if (i >= 9) {
      const sum10 = closes.slice(i - 9, i + 1).reduce((a, b) => a + b, 0);
      result[i].ma10 = Number((sum10 / 10).toFixed(2));
    }
    if (i >= 19) {
      const sum20 = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
      result[i].ma20 = Number((sum20 / 20).toFixed(2));
    }
    if (i >= 59) {
      const sum60 = closes.slice(i - 59, i + 1).reduce((a, b) => a + b, 0);
      result[i].ma60 = Number((sum60 / 60).toFixed(2));
    }
  }

  // 2. MACD (EMA12, EMA26, Signal 9)
  let ema12 = closes[0];
  let ema26 = closes[0];
  let dea = 0;

  for (let i = 0; i < result.length; i++) {
    const close = closes[i];
    if (i === 0) {
      ema12 = close;
      ema26 = close;
      dea = 0;
    } else {
      ema12 = (2 * close + 11 * ema12) / 13;
      ema26 = (2 * close + 25 * ema26) / 27;
      const dif = ema12 - ema26;
      dea = (2 * dif + 8 * dea) / 10;
      const macd = (dif - dea) * 2;
      result[i].dif = Number(dif.toFixed(3));
      result[i].dea = Number(dea.toFixed(3));
      result[i].macd = Number(macd.toFixed(3));
    }
  }

  // 3. RSI (6, 12, 24)
  function calcRSI(period: number, index: number): number | undefined {
    if (index < period) return undefined;
    let gains = 0;
    let losses = 0;
    for (let j = index - period + 1; j <= index; j++) {
      const change = closes[j] - closes[j - 1];
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }
    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return Number((100 - (100 / (1 + rs))).toFixed(2));
  }

  for (let i = 0; i < result.length; i++) {
    result[i].rsi6 = calcRSI(6, i);
    result[i].rsi12 = calcRSI(12, i);
    result[i].rsi24 = calcRSI(24, i);
  }

  // 4. Bollinger Bands (Window 20, StdDev 2.0)
  for (let i = 19; i < result.length; i++) {
    const slice = closes.slice(i - 19, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / 20;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
    const std = Math.sqrt(variance);
    result[i].boll_mid = Number(mean.toFixed(2));
    result[i].boll_upper = Number((mean + 2 * std).toFixed(2));
    result[i].boll_lower = Number((mean - 2 * std).toFixed(2));
  }

  // 5. KDJ (9, 3, 3)
  let prevK = 50;
  let prevD = 50;
  for (let i = 0; i < result.length; i++) {
    if (i < 8) {
      result[i].kdj_k = 50;
      result[i].kdj_d = 50;
      result[i].kdj_j = 50;
      continue;
    }
    const high9 = Math.max(...highs.slice(i - 8, i + 1));
    const low9 = Math.min(...lows.slice(i - 8, i + 1));
    const rsv = high9 === low9 ? 50 : ((closes[i] - low9) / (high9 - low9)) * 100;
    const k = (2 * prevK + rsv) / 3;
    const d = (2 * prevD + k) / 3;
    const j = 3 * k - 2 * d;
    prevK = k;
    prevD = d;
    result[i].kdj_k = Number(k.toFixed(1));
    result[i].kdj_d = Number(d.toFixed(1));
    result[i].kdj_j = Number(j.toFixed(1));
  }

  // 6. ATR (14)
  for (let i = 1; i < result.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    if (i >= 14) {
      let sumTR = 0;
      for (let j = i - 13; j <= i; j++) {
        sumTR += Math.max(
          highs[j] - lows[j],
          Math.abs(highs[j] - closes[j - 1]),
          Math.abs(lows[j] - closes[j - 1])
        );
      }
      result[i].atr = Number((sumTR / 14).toFixed(2));
    } else {
      result[i].atr = Number(tr.toFixed(2));
    }
  }

  return result;
}

// Global bars cache
const cacheBars: Record<string, KLineBar[]> = {};

export function getHistoricalKLine(symbol: string, timeFrame: TimeFrame = '1D'): KLineBar[] {
  const cacheKey = `${symbol}_${timeFrame}`;
  if (cacheBars[cacheKey]) {
    return cacheBars[cacheKey];
  }

  const stock = INITIAL_STOCKS.find(s => s.symbol === symbol) || INITIAL_STOCKS[0];
  const targetCurrentPrice = stock.currentPrice;

  let numBars = 360;
  let stepMs = 86400000;

  if (timeFrame === '5m') {
    numBars = 240; // 240 bars = ~5 trading days
    stepMs = 5 * 60 * 1000;
  } else if (timeFrame === '15m') {
    numBars = 200;
    stepMs = 15 * 60 * 1000;
  } else if (timeFrame === '60m') {
    numBars = 240; // ~60 trading days
    stepMs = 60 * 60 * 1000;
  } else if (timeFrame === '1D') {
    numBars = 420; // ~1.8 years
    stepMs = 86400000;
  } else if (timeFrame === '1W') {
    numBars = 150; // ~3 years
    stepMs = 86400000 * 7;
  } else if (timeFrame === '1M') {
    numBars = 60; // 5 years
    stepMs = 86400000 * 30;
  }

  // Seed-based random generation anchored to stock characteristics
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i) * (i + 1);
  }
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const bars: KLineBar[] = [];
  const now = new Date('2026-03-01T15:00:00Z');
  
  // Create price trajectory ending at targetCurrentPrice
  const volatility = symbol.includes('688') || symbol.includes('300')
    ? (timeFrame === '5m' ? 0.008 : 0.024)
    : (timeFrame === '5m' ? 0.005 : 0.016);
  const drift = 0.0002;

  // Backward simulation from current price
  let currentP = targetCurrentPrice;
  const rawCloses: number[] = [currentP];

  for (let i = 0; i < numBars; i++) {
    const shock = (pseudoRandom() - 0.49) * 2 * volatility;
    currentP = currentP / (1 + drift + shock);
    if (currentP < targetCurrentPrice * 0.35) currentP = targetCurrentPrice * 0.35;
    if (currentP > targetCurrentPrice * 2.8) currentP = targetCurrentPrice * 2.8;
    rawCloses.unshift(currentP);
  }

  let currentDate = new Date(now.getTime() - numBars * stepMs);

  for (let i = 0; i < rawCloses.length - 1; i++) {
    const close = rawCloses[i + 1];
    const prev = rawCloses[i];
    const dailyVol = (pseudoRandom() * 0.02 + 0.004) * close;
    
    const open = prev * (1 + (pseudoRandom() - 0.49) * 0.006);
    const high = Math.max(open, close) + pseudoRandom() * dailyVol;
    const low = Math.min(open, close) - pseudoRandom() * dailyVol;
    
    const baseVol = stock.volume * (0.6 + pseudoRandom() * 0.8) * (timeFrame === '5m' ? 0.05 : 1);
    const volume = Math.max(10, Math.round(baseVol));
    const amount = Number(((volume * close * 100) / 100000000).toFixed(2));

    if (timeFrame === '1D' || timeFrame === '1W' || timeFrame === '1M') {
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate = new Date(currentDate.getTime() + 86400000);
      }
    }

    let dateStr = currentDate.toISOString().split('T')[0];
    if (timeFrame === '5m' || timeFrame === '15m' || timeFrame === '60m') {
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const mins = String(currentDate.getMinutes()).padStart(2, '0');
      dateStr = `${dateStr} ${hours}:${mins}`;
    }

    bars.push({
      timestamp: currentDate.getTime(),
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      amount,
    });

    currentDate = new Date(currentDate.getTime() + stepMs);
  }

  const finalBars = calculateIndicators(bars);
  cacheBars[cacheKey] = finalBars;
  return finalBars;
}

// Parse user uploaded CSV data
export function parseCustomKLineCSV(csvText: string): KLineBar[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV 文件行数不足，请包含表头及至少1行K线数据');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/["']/g, ''));
  const dateIdx = header.findIndex(h => h.includes('date') || h.includes('time') || h.includes('日期') || h.includes('时间'));
  const openIdx = header.findIndex(h => h.includes('open') || h.includes('开盘'));
  const highIdx = header.findIndex(h => h.includes('high') || h.includes('最高'));
  const lowIdx = header.findIndex(h => h.includes('low') || h.includes('最低'));
  const closeIdx = header.findIndex(h => h.includes('close') || h.includes('收盘'));
  const volIdx = header.findIndex(h => h.includes('vol') || h.includes('量') || h.includes('amount'));

  if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
    throw new Error('CSV 缺少必要的 OHLC (开盘/最高/最低/收盘) 列');
  }

  const parsedBars: KLineBar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(item => item.trim().replace(/["']/g, ''));
    if (row.length < 4 || !row[openIdx]) continue;

    const dateStr = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : `Bar-${i}`;
    const open = parseFloat(row[openIdx]);
    const high = parseFloat(row[highIdx]);
    const low = parseFloat(row[lowIdx]);
    const close = parseFloat(row[closeIdx]);
    const volume = volIdx !== -1 && row[volIdx] ? parseFloat(row[volIdx]) : 10000;

    if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
      const ts = new Date(dateStr).getTime() || Date.now() - (lines.length - i) * 86400000;
      parsedBars.push({
        timestamp: ts,
        date: dateStr,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: isNaN(volume) ? 10000 : volume,
        amount: Number(((volume * close * 100) / 100000000).toFixed(2)),
      });
    }
  }

  if (parsedBars.length === 0) {
    throw new Error('未能从 CSV 文件中解析出有效的数值记录');
  }

  // Sort by date ascending
  parsedBars.sort((a, b) => a.timestamp - b.timestamp);
  return calculateIndicators(parsedBars);
}

// Preset market-scenario definitions shared by the data modal and the generator below.
export interface PresetScenario {
  id: string;
  title: string;
  barsCount: number;
  trend: 'UP' | 'CHOPPY' | 'VOLATILE' | 'DOWN';
  drift: number;        // daily log-drift bias
  volatility: number;   // daily volatility magnitude
  meanReversion: number; // pull toward the anchor level (0 = pure random walk)
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  { id: 'bull-2020',  title: 'A股典型结构性牛市 (2020-2021)', barsCount: 380, trend: 'UP',       drift: 0.0028, volatility: 0.014, meanReversion: 0.0 },
  { id: 'bear-2022',  title: '宽幅震荡与下行磨底 (2022-2023)', barsCount: 350, trend: 'DOWN',     drift: -0.0018, volatility: 0.020, meanReversion: 0.0 },
  { id: 'tech-2024',  title: '科技成长与芯片重估 (2024-2026)', barsCount: 420, trend: 'UP',       drift: 0.0035, volatility: 0.024, meanReversion: 0.0 },
  { id: 'hft-5m',     title: '5分钟高频日内微观行情 (高密度Bar)', barsCount: 240, trend: 'VOLATILE', drift: 0.0003, volatility: 0.008, meanReversion: 0.3 },
];

// Generate a deterministic synthetic K-line series for a given preset scenario, anchored to a
// stock's current price so the result is comparable with the strategy's normal trading range.
export function getPresetScenarioKLine(presetId: string, stockSymbol: string): KLineBar[] {
  const preset = PRESET_SCENARIOS.find((p) => p.id === presetId) || PRESET_SCENARIOS[0];
  const stock = INITIAL_STOCKS.find((s) => s.symbol === stockSymbol) || INITIAL_STOCKS[0];
  const anchor = stock.currentPrice;
  const isIntraday = preset.id === 'hft-5m';
  const stepMs = isIntraday ? 5 * 60 * 1000 : 86400000;

  const cacheKey = `__preset_${presetId}_${stockSymbol}`;
  if (cacheBars[cacheKey]) return cacheBars[cacheKey];

  // Seed anchored to preset + symbol for deterministic output.
  let seed = 0;
  const seedStr = `${presetId}_${stockSymbol}`;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i) * (i + 1);
  }
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const numBars = preset.barsCount;
  // Build closes forward so the series ends at the anchor price.
  const closes: number[] = [];
  let p = anchor * (1 - preset.drift * numBars); // start below/above so drift lands near anchor
  for (let i = 0; i < numBars; i++) {
    const shock = (pseudoRandom() - 0.49) * 2 * preset.volatility;
    const reversion = preset.meanReversion * (anchor - p) / anchor;
    p = p * (1 + preset.drift + shock) + anchor * reversion;
    if (p < anchor * 0.35) p = anchor * 0.35;
    if (p > anchor * 2.8) p = anchor * 2.8;
    closes.push(p);
  }
  // Rescale the whole series so the final close equals the anchor price.
  const scale = anchor / closes[closes.length - 1];
  for (let i = 0; i < closes.length; i++) closes[i] *= scale;

  let currentDate = new Date(Date.UTC(2024, 0, 1));
  const bars: KLineBar[] = [];
  let prevClose = closes[0];
  for (let i = 0; i < closes.length; i++) {
    const close = closes[i];
    while (!isIntraday && (currentDate.getUTCDay() === 0 || currentDate.getUTCDay() === 6)) {
      currentDate = new Date(currentDate.getTime() + 86400000);
    }
    const dailyVol = (pseudoRandom() * 0.02 + 0.004) * close;
    const open = prevClose * (1 + (pseudoRandom() - 0.49) * 0.006);
    const high = Math.max(open, close) + pseudoRandom() * dailyVol;
    const low = Math.min(open, close) - pseudoRandom() * dailyVol;
    const volume = Math.max(10, Math.round(stock.volume * (0.6 + pseudoRandom() * 0.8) * (isIntraday ? 0.05 : 1)));

    let dateStr = currentDate.toISOString().split('T')[0];
    if (isIntraday) {
      const hh = String(currentDate.getUTCHours()).padStart(2, '0');
      const mm = String(currentDate.getUTCMinutes()).padStart(2, '0');
      dateStr = `${dateStr} ${hh}:${mm}`;
    }

    bars.push({
      timestamp: currentDate.getTime(),
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      amount: Number(((volume * close * 100) / 100000000).toFixed(2)),
    });

    prevClose = close;
    currentDate = new Date(currentDate.getTime() + stepMs);
  }

  const finalBars = calculateIndicators(bars);
  cacheBars[cacheKey] = finalBars;
  return finalBars;
}

// Generate CSI 300 Benchmark K-Line (synthetic index series, independent of any single stock)
export function getBenchmarkKLine(): KLineBar[] {
  if (cacheBars['__benchmark_000300_1D']) {
    return cacheBars['__benchmark_000300_1D'];
  }

  const numBars = 420;
  const stepMs = 86400000;
  const startDate = new Date('2026-03-01T15:00:00Z').getTime() - numBars * stepMs;

  // Seed-based random generation anchored to the index name
  let seed = 0;
  for (let i = 0; i < '000300.SH'.length; i++) {
    seed += '000300.SH'.charCodeAt(i) * (i + 1);
  }
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const bars: KLineBar[] = [];
  let currentDate = new Date(startDate);
  // Backward-simulate closes then reverse, so the series ends near the current index level (~3900)
  const targetLevel = 3950;
  const rawCloses: number[] = [targetLevel];
  let p = targetLevel;
  for (let i = 0; i < numBars; i++) {
    const shock = (pseudoRandom() - 0.49) * 2 * 0.013;
    p = p / (1 + 0.00015 + shock);
    if (p < targetLevel * 0.55) p = targetLevel * 0.55;
    if (p > targetLevel * 1.6) p = targetLevel * 1.6;
    rawCloses.unshift(p);
  }

  for (let i = 0; i < rawCloses.length - 1; i++) {
    const close = rawCloses[i + 1];
    const prev = rawCloses[i];
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate = new Date(currentDate.getTime() + 86400000);
    }
    const dateStr = currentDate.toISOString().split('T')[0];
    const dailyVol = (pseudoRandom() * 0.015 + 0.003) * close;
    const open = prev * (1 + (pseudoRandom() - 0.49) * 0.004);
    const high = Math.max(open, close) + pseudoRandom() * dailyVol;
    const low = Math.min(open, close) - pseudoRandom() * dailyVol;
    const volume = Math.max(100000, Math.round(200000000 * (0.6 + pseudoRandom() * 0.8)));

    bars.push({
      timestamp: currentDate.getTime(),
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      amount: Number(((volume * close * 100) / 100000000).toFixed(2)),
    });

    currentDate = new Date(currentDate.getTime() + stepMs);
  }

  const finalBars = calculateIndicators(bars);
  cacheBars['__benchmark_000300_1D'] = finalBars;
  return finalBars;
}
