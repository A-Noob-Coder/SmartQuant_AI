import {
  BacktestConfig,
  EvaluationMetrics,
  EquityPoint,
  GridSearchCell,
  GridSearchResult,
  KLineBar,
  StrategyAction,
  StrategyLogEntry,
  TradeRecord,
} from '../types';
import { getBenchmarkKLine, getHistoricalKLine } from '../data/mockAStocks';

export interface ActivePositionInfo {
  symbol: string;
  shares: number;
  entryPrice: number;
  entryDate: string;
  currentPrice: number;
  costValue: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
  highestPrice: number;
  trailingStopPrice?: number;
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: TradeRecord[];
  strategyActions: StrategyAction[];
  strategyLogs: StrategyLogEntry[];
  activePosition: ActivePositionInfo | null;
  metrics: EvaluationMetrics;
  bars: KLineBar[];
}

export class QuantEngine {
  /**
   * Run backtest given Python strategy code, stock symbol and configuration
   */
  static runBacktest(
    code: string,
    stockSymbol: string,
    config: BacktestConfig,
    overrideBars?: KLineBar[]
  ): BacktestResult {
    const rawBars = overrideBars && overrideBars.length > 0
      ? overrideBars
      : getHistoricalKLine(stockSymbol, '1D');
    const benchmarkBars = getBenchmarkKLine();

    // Filter bars according to dates
    const startTs = new Date(config.startDate).getTime();
    const endTs = new Date(config.endDate).getTime();
    const rawFiltered = rawBars.filter(b => b.timestamp >= startTs && b.timestamp <= endTs);
    const bars = rawFiltered.map(b => ({ ...b })); // clone
    const benchFiltered = benchmarkBars.filter(b => b.timestamp >= startTs && b.timestamp <= endTs);

    if (bars.length < 10) {
      throw new Error('回测区间内有效交易日不足，请调整日期范围或加载更多数据。');
    }

    // Extract strategy parameters and type from code
    const strategyType = this.detectStrategyType(code);
    const parsedParams = this.extractParameters(code);

    let cash = config.initialCapital;
    let shares = 0;
    let entryPrice = 0;
    let entryDate = '';
    let highestPriceInPosition = 0;
    let inPosition = false;

    const trades: TradeRecord[] = [];
    const strategyActions: StrategyAction[] = [];
    const strategyLogs: StrategyLogEntry[] = [];
    const equityCurve: EquityPoint[] = [];
    let tradeCounter = 1;
    let actionCounter = 1;

    let totalCommission = 0;
    let totalStampTax = 0;

    // Log initialization
    strategyLogs.push({
      id: `LOG-${Date.now()}-0`,
      date: bars[0].date,
      type: 'INFO',
      message: `初始化量化引擎: 标的=${stockSymbol}, 初始本金=¥${config.initialCapital.toLocaleString()}, 撮合模式=${config.matchPrice === 'next_open' ? '次日开盘价' : '当日收盘价'}`,
    });

    // Peak tracking for drawdown
    let peakEquity = config.initialCapital;
    const initialBenchmarkPrice = benchFiltered[0]?.close || bars[0]?.close || 1;

    // Precompute OHLCV series once; evaluateSignal only reads a bounded tail plus the
    // available-bar count, so passing full arrays with an endIndex avoids O(n^2) slicing.
    const closeArr = bars.map(b => b.close);
    const highArr = bars.map(b => b.high);
    const lowArr = bars.map(b => b.low);
    const volArr = bars.map(b => b.volume);

    // Daily loop
    for (let i = 0; i < bars.length; i++) {
      const currentBar = bars[i];
      const benchBar = benchFiltered[Math.min(i, benchFiltered.length - 1)] || currentBar;

      // Determine signal for current bar based on strategy logic
      const signal = this.evaluateSignal(
        strategyType,
        parsedParams,
        closeArr,
        highArr,
        lowArr,
        volArr,
        i + 1,
        inPosition,
        entryPrice,
        highestPriceInPosition,
        currentBar
      );

      // Update position peak price
      if (inPosition && currentBar.close > highestPriceInPosition) {
        highestPriceInPosition = currentBar.close;
      }

      const matchPrice = config.matchPrice === 'next_open' && i < bars.length - 1
        ? bars[i + 1].open
        : currentBar.close;

      let executedSignal: 'BUY' | 'SELL' | undefined = undefined;

      if (signal.action === 'BUY' && !inPosition && cash > 1000) {
        // Buy execution (A-share: lots of 100 shares)
        const effectiveBuyPrice = matchPrice * (1 + config.slippage);
        const maxShares = Math.floor(cash / (effectiveBuyPrice * 100)) * 100;

        if (maxShares >= 100) {
          const tradeCost = maxShares * effectiveBuyPrice;
          const comm = Math.max(5, tradeCost * config.commission);
          const totalCost = tradeCost + comm;

          if (cash >= totalCost) {
            cash -= totalCost;
            shares = maxShares;
            entryPrice = effectiveBuyPrice;
            entryDate = currentBar.date;
            highestPriceInPosition = effectiveBuyPrice;
            inPosition = true;
            totalCommission += comm;
            executedSignal = 'BUY';

            // Mark bar
            currentBar.signal = 'BUY';
            currentBar.signalReason = signal.reason || '策略买入信号';

            // Strategy Action
            strategyActions.push({
              id: `ACT-${actionCounter++}`,
              date: currentBar.date,
              timestamp: currentBar.timestamp,
              symbol: stockSymbol,
              stockName: stockSymbol.split('.')[0],
              actionType: 'BUY',
              price: Number(effectiveBuyPrice.toFixed(2)),
              shares: maxShares,
              amount: Number(tradeCost.toFixed(2)),
              fees: Number(comm.toFixed(2)),
              reason: signal.reason || '策略买入信号',
              indicatorsSnapshot: {
                ma5: currentBar.ma5,
                ma20: currentBar.ma20,
                rsi: currentBar.rsi6,
                macd: currentBar.macd,
                atr: currentBar.atr,
              },
            });

            // Log
            strategyLogs.push({
              id: `LOG-${Date.now()}-${i}`,
              date: currentBar.date,
              type: 'ORDER',
              message: `【买入开仓】${currentBar.date}: 价格 ¥${effectiveBuyPrice.toFixed(2)}, 数量 ${maxShares} 股, 成交额 ¥${tradeCost.toFixed(2)}, 佣金 ¥${comm.toFixed(2)} | 原因: ${signal.reason}`,
            });
          }
        }
      } else if (signal.action === 'SELL' && inPosition && shares > 0) {
        // Sell execution
        const effectiveSellPrice = matchPrice * (1 - config.slippage);
        const sellProceeds = shares * effectiveSellPrice;
        const comm = Math.max(5, sellProceeds * config.commission);
        const stamp = sellProceeds * config.stampTax;
        const netProceeds = sellProceeds - comm - stamp;

        cash += netProceeds;
        totalCommission += comm;
        totalStampTax += stamp;

        const costVal = shares * entryPrice;
        const pnl = netProceeds - costVal;
        const pnlPercent = Number(((pnl / costVal) * 100).toFixed(2));
        const holdDays = Math.max(1, i - bars.findIndex(b => b.date === entryDate));

        const actionType: 'SELL' | 'STOP_LOSS' | 'TAKE_PROFIT' = signal.reason?.includes('止损')
          ? 'STOP_LOSS'
          : signal.reason?.includes('止盈')
          ? 'TAKE_PROFIT'
          : 'SELL';

        currentBar.signal = 'SELL';
        currentBar.signalReason = signal.reason || '策略平仓卖出';

        trades.push({
          id: `TR-${tradeCounter++}`,
          tradeIndex: trades.length + 1,
          symbol: stockSymbol,
          stockName: stockSymbol.split('.')[0],
          side: 'SELL',
          buyDate: entryDate,
          buyPrice: Number(entryPrice.toFixed(2)),
          sellDate: currentBar.date,
          sellPrice: Number(effectiveSellPrice.toFixed(2)),
          shares,
          costValue: Number(costVal.toFixed(2)),
          sellValue: Number(netProceeds.toFixed(2)),
          pnl: Number(pnl.toFixed(2)),
          pnlPercent,
          holdDays,
          reason: signal.reason || '策略信号平仓',
          fees: Number((comm + stamp).toFixed(2)),
          status: 'CLOSED',
        });

        strategyActions.push({
          id: `ACT-${actionCounter++}`,
          date: currentBar.date,
          timestamp: currentBar.timestamp,
          symbol: stockSymbol,
          stockName: stockSymbol.split('.')[0],
          actionType,
          price: Number(effectiveSellPrice.toFixed(2)),
          shares,
          amount: Number(sellProceeds.toFixed(2)),
          fees: Number((comm + stamp).toFixed(2)),
          reason: signal.reason || '策略平仓卖出',
          indicatorsSnapshot: {
            ma5: currentBar.ma5,
            ma20: currentBar.ma20,
            rsi: currentBar.rsi6,
            macd: currentBar.macd,
            atr: currentBar.atr,
          },
          pnl: Number(pnl.toFixed(2)),
          pnlPercent,
          holdingDays: holdDays,
        });

        strategyLogs.push({
          id: `LOG-${Date.now()}-${i}`,
          date: currentBar.date,
          type: actionType === 'STOP_LOSS' ? 'RISK' : 'ORDER',
          message: `【${actionType === 'STOP_LOSS' ? '止损平仓' : '卖出平仓'}】${currentBar.date}: 价格 ¥${effectiveSellPrice.toFixed(2)}, 数量 ${shares} 股, 净盈亏 ¥${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} (${pnlPercent}%), 持仓 ${holdDays} 天 | 原因: ${signal.reason}`,
        });

        shares = 0;
        inPosition = false;
        entryPrice = 0;
        highestPriceInPosition = 0;
        executedSignal = 'SELL';
      }

      // Calculate current equity
      const holdingsValue = shares * currentBar.close;
      const currentEquity = cash + holdingsValue;
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
      const stratReturn = ((currentEquity - config.initialCapital) / config.initialCapital) * 100;
      const benchReturn = ((benchBar.close - initialBenchmarkPrice) / initialBenchmarkPrice) * 100;

      equityCurve.push({
        date: currentBar.date,
        timestamp: currentBar.timestamp,
        strategyEquity: Number(currentEquity.toFixed(2)),
        strategyReturn: Number(stratReturn.toFixed(2)),
        benchmarkEquity: Number((config.initialCapital * (1 + benchReturn / 100)).toFixed(2)),
        benchmarkReturn: Number(benchReturn.toFixed(2)),
        excessReturn: Number((stratReturn - benchReturn).toFixed(2)),
        drawdown: Number(drawdown.toFixed(2)),
        cash: Number(cash.toFixed(2)),
        holdingsValue: Number(holdingsValue.toFixed(2)),
        positionPercent: Number(((holdingsValue / currentEquity) * 100).toFixed(1)),
        signal: executedSignal,
      });
    }

    const lastBar = bars[bars.length - 1];
    let activePosition: ActivePositionInfo | null = null;
    if (inPosition && shares > 0) {
      const costValue = shares * entryPrice;
      const marketValue = shares * lastBar.close;
      const pnl = marketValue - costValue;
      const pnlPercent = Number(((pnl / costValue) * 100).toFixed(2));
      const holdDays = Math.max(1, bars.length - 1 - bars.findIndex(b => b.date === entryDate));
      const atrVal = lastBar.atr || (lastBar.high - lastBar.low);
      const atrMult = parsedParams.atr_multiplier || 2.0;

      activePosition = {
        symbol: stockSymbol,
        shares,
        entryPrice: Number(entryPrice.toFixed(2)),
        entryDate,
        currentPrice: lastBar.close,
        costValue: Number(costValue.toFixed(2)),
        marketValue: Number(marketValue.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        pnlPercent,
        holdingDays: holdDays,
        highestPrice: Number(highestPriceInPosition.toFixed(2)),
        trailingStopPrice: Number(Math.max(entryPrice * 0.95, highestPriceInPosition - atrMult * atrVal).toFixed(2)),
      };
    }

    const metrics = this.calculateMetrics(equityCurve, trades, config, totalCommission, totalStampTax);

    return {
      equityCurve,
      trades: trades.reverse(), // most recent first
      strategyActions: strategyActions.reverse(), // most recent first
      strategyLogs: strategyLogs.reverse(),
      activePosition,
      metrics,
      bars,
    };
  }

  /**
   * Calculate all 3 categories of Quant Evaluation Metrics
   */
  private static calculateMetrics(
    curve: EquityPoint[],
    trades: TradeRecord[],
    config: BacktestConfig,
    totalCommission: number,
    totalStampTax: number
  ): EvaluationMetrics {
    if (curve.length === 0) {
      return {
        cumulativeReturn: 0,
        annualizedReturn: 0,
        benchmarkReturn: 0,
        alpha: 0,
        beta: 1,
        maxDrawdown: 0,
        maxDrawdownDays: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        annualizedVolatility: 0,
        winRate: 0,
        profitLossRatio: 1,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgHoldDays: 0,
        monthlyTradeFrequency: 0,
        totalCommission: 0,
        totalStampTax: 0,
      };
    }

    const totalDays = curve.length;
    const finalEquity = curve[curve.length - 1].strategyEquity;
    const cumulativeReturn = ((finalEquity - config.initialCapital) / config.initialCapital) * 100;

    // Annualized return (compound)
    const annualizedReturn = totalDays > 0
      ? (Math.pow(1 + cumulativeReturn / 100, 252 / totalDays) - 1) * 100
      : 0;

    const benchmarkReturn = curve[curve.length - 1].benchmarkReturn;

    // Max Drawdown & Max Drawdown Duration
    let maxDrawdown = 0;
    let currentDdDays = 0;
    let maxDdDays = 0;
    for (const pt of curve) {
      if (pt.drawdown > maxDrawdown) {
        maxDrawdown = pt.drawdown;
      }
      if (pt.drawdown > 0.05) {
        currentDdDays++;
        if (currentDdDays > maxDdDays) maxDdDays = currentDdDays;
      } else {
        currentDdDays = 0;
      }
    }

    // Daily returns series
    const stratDailyReturns: number[] = [];
    const benchDailyReturns: number[] = [];
    for (let i = 1; i < curve.length; i++) {
      const sRet = (curve[i].strategyEquity - curve[i - 1].strategyEquity) / curve[i - 1].strategyEquity;
      const bRet = (curve[i].benchmarkEquity - curve[i - 1].benchmarkEquity) / curve[i - 1].benchmarkEquity;
      stratDailyReturns.push(sRet);
      benchDailyReturns.push(bRet);
    }

    // Volatility (Annualized)
    const meanStratRet = stratDailyReturns.reduce((a, b) => a + b, 0) / (stratDailyReturns.length || 1);
    const variance = stratDailyReturns.reduce((a, b) => a + Math.pow(b - meanStratRet, 2), 0) / (stratDailyReturns.length || 1);
    const dailyVol = Math.sqrt(variance);
    const annualizedVolatility = dailyVol * Math.sqrt(252) * 100;

    // Sharpe Ratio (Rf = 2.5% annualized)
    const rfDaily = 0.025 / 252;
    const excessDailyMean = meanStratRet - rfDaily;
    const sharpeRatio = dailyVol > 0 ? (excessDailyMean / dailyVol) * Math.sqrt(252) : 0;

    // Downside volatility for Sortino
    const downsideReturns = stratDailyReturns.filter(r => r < rfDaily).map(r => Math.pow(r - rfDaily, 2));
    const downsideVar = downsideReturns.length > 0
      ? downsideReturns.reduce((a, b) => a + b, 0) / stratDailyReturns.length
      : 0.00001;
    const downsideVol = Math.sqrt(downsideVar);
    const sortinoRatio = downsideVol > 0 ? (excessDailyMean / downsideVol) * Math.sqrt(252) : 0;

    // Beta (Covariance / Benchmark Variance)
    const meanBenchRet = benchDailyReturns.reduce((a, b) => a + b, 0) / (benchDailyReturns.length || 1);
    let cov = 0;
    let benchVar = 0;
    for (let i = 0; i < stratDailyReturns.length; i++) {
      cov += (stratDailyReturns[i] - meanStratRet) * (benchDailyReturns[i] - meanBenchRet);
      benchVar += Math.pow(benchDailyReturns[i] - meanBenchRet, 2);
    }
    const beta = benchVar > 0 ? cov / benchVar : 0.85;

    // Alpha = AnnualizedReturn - [Rf + Beta * (BenchmarkAnnualReturn - Rf)]
    const benchAnnualReturn = totalDays > 0
      ? (Math.pow(1 + benchmarkReturn / 100, 252 / totalDays) - 1) * 100
      : 0;
    const alpha = annualizedReturn - (2.5 + beta * (benchAnnualReturn - 2.5));

    // Trade statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.pnl || 0) <= 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalWinAmount = trades.filter(t => (t.pnl || 0) > 0).reduce((a, b) => a + (b.pnl || 0), 0);
    const totalLossAmount = Math.abs(trades.filter(t => (t.pnl || 0) <= 0).reduce((a, b) => a + (b.pnl || 0), 0));
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 1;
    const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : 2.0;

    const totalHoldDays = trades.reduce((a, b) => a + (b.holdDays || 0), 0);
    const avgHoldDays = totalTrades > 0 ? totalHoldDays / totalTrades : 0;
    const monthlyTradeFrequency = totalDays > 0 ? (totalTrades / totalDays) * 21 : 0;

    return {
      cumulativeReturn: Number(cumulativeReturn.toFixed(2)),
      annualizedReturn: Number(annualizedReturn.toFixed(2)),
      benchmarkReturn: Number(benchmarkReturn.toFixed(2)),
      alpha: Number(alpha.toFixed(2)),
      beta: Number(beta.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxDrawdownDays: maxDdDays,
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      sortinoRatio: Number(sortinoRatio.toFixed(2)),
      annualizedVolatility: Number(annualizedVolatility.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      profitLossRatio: Number(profitLossRatio.toFixed(2)),
      totalTrades,
      winningTrades,
      losingTrades,
      avgHoldDays: Number(avgHoldDays.toFixed(1)),
      monthlyTradeFrequency: Number(monthlyTradeFrequency.toFixed(1)),
      totalCommission: Number(totalCommission.toFixed(2)),
      totalStampTax: Number(totalStampTax.toFixed(2)),
    };
  }

  /**
   * Map a strategy's code to the two most relevant tunable parameter names,
   * plus sensible default grid values for each. Falls back to dual-MA when
   * the code doesn't match a known strategy.
   */
  static getTunableParams(code: string): {
    param1Name: string;
    param1Label: string;
    param1Values: number[];
    param2Name: string;
    param2Label: string;
    param2Values: number[];
  } {
    const type = this.detectStrategyType(code);
    switch (type) {
      case 'ATR_ENHANCED':
        return {
          param1Name: 'short_window',
          param1Label: '短期均线 (Short MA)',
          param1Values: [3, 5, 8, 10, 15],
          param2Name: 'atr_multiplier',
          param2Label: 'ATR 止损倍数',
          param2Values: [1.5, 2.0, 2.5, 3.0, 3.5],
        };
      case 'RSI':
        return {
          param1Name: 'rsi_period',
          param1Label: 'RSI 周期',
          param1Values: [6, 9, 12, 14, 21],
          param2Name: 'oversold',
          param2Label: '超卖阈值',
          param2Values: [20, 25, 28, 30, 35],
        };
      case 'BOLLINGER':
        return {
          param1Name: 'window',
          param1Label: '布林窗口',
          param1Values: [10, 15, 20, 25, 30],
          param2Name: 'num_std',
          param2Label: '标准差倍数',
          param2Values: [1.5, 2.0, 2.5, 3.0],
        };
      case 'MULTI_FACTOR':
        return {
          param1Name: 'mom_window',
          param1Label: '动量窗口',
          param1Values: [10, 15, 20, 30, 40],
          param2Name: 'vol_ratio',
          param2Label: '放量倍数',
          param2Values: [1.1, 1.2, 1.3, 1.5, 2.0],
        };
      case 'DUAL_MA':
      default:
        return {
          param1Name: 'short_window',
          param1Label: '短期均线 (Short MA)',
          param1Values: [3, 5, 8, 10, 15],
          param2Name: 'long_window',
          param2Label: '长期均线 (Long MA)',
          param2Values: [15, 20, 30, 40, 60],
        };
    }
  }

  /**
   * Run Grid Search Parameter Mining across 2 dimensions
   */
  static runGridSearch(
    code: string,
    stockSymbol: string,
    config: BacktestConfig,
    param1Name: string,
    param1Label: string,
    param1Values: number[],
    param2Name: string,
    param2Label: string,
    param2Values: number[]
  ): GridSearchResult {
    const matrix: GridSearchCell[][] = [];
    let bestCell: GridSearchCell | null = null;
    let bestSharpeCell: GridSearchCell | null = null;
    let bestActionQualityCell: GridSearchCell | null = null;
    let minFrictionCell: GridSearchCell | null = null;

    for (let i = 0; i < param1Values.length; i++) {
      const row: GridSearchCell[] = [];
      const p1 = param1Values[i];

      for (let j = 0; j < param2Values.length; j++) {
        const p2 = param2Values[j];

        // Replace parameters in code
        let modifiedCode = code;
        const re1 = new RegExp(`context\\.${param1Name}\\s*=\\s*\\d+(\\.\\d+)?`, 'g');
        const re2 = new RegExp(`context\\.${param2Name}\\s*=\\s*\\d+(\\.\\d+)?`, 'g');
        modifiedCode = modifiedCode.replace(re1, `context.${param1Name} = ${p1}`);
        modifiedCode = modifiedCode.replace(re2, `context.${param2Name} = ${p2}`);

        try {
          const res = this.runBacktest(modifiedCode, stockSymbol, config);
          
          // Action level deep extraction
          const actions = res.strategyActions || [];
          const buyActions = actions.filter((a) => a.actionType === 'BUY');
          const sellActions = actions.filter((a) => a.actionType === 'SELL' || a.actionType === 'TAKE_PROFIT');
          const stopLossActions = actions.filter((a) => a.actionType === 'STOP_LOSS');

          const totalFriction = (res.metrics.totalCommission || 0) + (res.metrics.totalStampTax || 0);
          const grossCap = Math.max(1000, Math.abs(((res.metrics.cumulativeReturn || 0) / 100) * config.initialCapital));
          const frictionRatio = Math.min(100, Math.round((totalFriction / grossCap) * 100 * 10) / 10);

          const tradeCount = res.metrics.totalTrades || 0;
          let freqScore = 20;
          if (tradeCount === 0) freqScore = 0;
          else if (tradeCount > 40) freqScore = 8;
          else if (tradeCount >= 5 && tradeCount <= 30) freqScore = 20;
          else freqScore = 14;

          const sharpeScore = Math.min(30, Math.max(0, (res.metrics.sharpeRatio || 0) * 16));
          const winScore = Math.min(25, Math.max(0, ((res.metrics.winRate || 0) - 30) * 0.7));
          const ddScore = Math.min(25, Math.max(0, 30 - (res.metrics.maxDrawdown || 0)));
          const actionQualityScore = Math.min(99, Math.max(20, Math.round(freqScore + sharpeScore + winScore + ddScore)));

          const actionSample = actions.slice(0, 6).map((a) => ({
            actionType: a.actionType,
            date: a.date,
            price: a.price,
            pnl: a.pnl,
            reason: a.reason,
          }));

          const cell: GridSearchCell = {
            param1: p1,
            param2: p2,
            cumulativeReturn: res.metrics.cumulativeReturn,
            annualizedReturn: res.metrics.annualizedReturn,
            sharpeRatio: res.metrics.sharpeRatio,
            maxDrawdown: res.metrics.maxDrawdown,
            winRate: res.metrics.winRate,
            profitLossRatio: res.metrics.profitLossRatio,
            totalTrades: res.metrics.totalTrades,
            totalActions: actions.length,
            buyActionCount: buyActions.length,
            sellActionCount: sellActions.length,
            stopLossActionCount: stopLossActions.length,
            avgHoldDays: res.metrics.avgHoldDays,
            totalFrictionCost: totalFriction,
            frictionRatio: frictionRatio,
            actionQualityScore: actionQualityScore,
            actionSample: actionSample,
          };

          row.push(cell);

          if (!bestCell || cell.cumulativeReturn > bestCell.cumulativeReturn) {
            bestCell = cell;
          }
          if (!bestSharpeCell || cell.sharpeRatio > bestSharpeCell.sharpeRatio) {
            bestSharpeCell = cell;
          }
          if (!bestActionQualityCell || (cell.actionQualityScore || 0) > (bestActionQualityCell.actionQualityScore || 0)) {
            bestActionQualityCell = cell;
          }
          if (cell.cumulativeReturn > 0 && (!minFrictionCell || (cell.frictionRatio || 100) < (minFrictionCell.frictionRatio || 100))) {
            minFrictionCell = cell;
          }
        } catch {
          row.push({
            param1: p1,
            param2: p2,
            cumulativeReturn: 0,
            annualizedReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0,
            totalTrades: 0,
            totalActions: 0,
            actionQualityScore: 0,
          });
        }
      }
      matrix.push(row);
    }

    // Second pass: identify robust plateau vs isolated overfitting peaks
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const cell = matrix[r][c];
        const neighbors: GridSearchCell[] = [];
        if (r > 0) neighbors.push(matrix[r - 1][c]);
        if (r < matrix.length - 1) neighbors.push(matrix[r + 1][c]);
        if (c > 0) neighbors.push(matrix[r][c - 1]);
        if (c < matrix[r].length - 1) neighbors.push(matrix[r][c + 1]);

        const positiveSharpeNeighbors = neighbors.filter((n) => n.sharpeRatio >= 0.8 && n.cumulativeReturn > 0);
        const badNeighbors = neighbors.filter((n) => n.cumulativeReturn <= 0 || n.sharpeRatio <= 0.3);

        if (cell.sharpeRatio >= 1.0 && positiveSharpeNeighbors.length >= 2) {
          cell.isRobustPlateau = true;
        } else if (cell.cumulativeReturn > 15 && badNeighbors.length >= 2) {
          cell.isOverfittingPeak = true;
        }
      }
    }

    return {
      param1Name,
      param1Label,
      param1Values,
      param2Name,
      param2Label,
      param2Values,
      matrix,
      bestCell: bestCell || matrix[0][0],
      bestSharpeCell: bestSharpeCell || matrix[0][0],
      bestActionQualityCell: bestActionQualityCell || bestSharpeCell || matrix[0][0],
      minFrictionCell: minFrictionCell || bestCell || matrix[0][0],
    };
  }

  // Strategy detection & parameter parsing helpers
  private static detectStrategyType(code: string): string {
    if (code.includes('atr_multiplier') || code.includes('ATR') || code.includes('buffer_ratio')) {
      return 'ATR_ENHANCED';
    }
    if (code.includes('rsi') || code.includes('oversold') || code.includes('RSI')) {
      return 'RSI';
    }
    if (code.includes('upper_band') || code.includes('num_std') || code.includes('bollinger')) {
      return 'BOLLINGER';
    }
    if (code.includes('mom_return') || code.includes('vol_surge') || code.includes('vol_ratio')) {
      return 'MULTI_FACTOR';
    }
    return 'DUAL_MA';
  }

  private static extractParameters(code: string): Record<string, number> {
    const params: Record<string, number> = {
      short_window: 5,
      long_window: 20,
      short_w: 5,
      long_w: 20,
      rsi_period: 14,
      oversold: 28,
      overbought: 72,
      window: 20,
      num_std: 2.0,
      atr_multiplier: 2.0,
      buffer_ratio: 1.006,
      mom_window: 20,
      vol_ratio: 1.3,
    };

    const matches = code.matchAll(/context\.([a-zA-Z0-9_]+)\s*=\s*([0-9.]+)/g);
    for (const match of matches) {
      const key = match[1];
      const val = parseFloat(match[2]);
      if (!isNaN(val)) {
        params[key] = val;
      }
    }
    return params;
  }

  private static evaluateSignal(
    type: string,
    params: Record<string, number>,
    closes: number[],
    highs: number[],
    lows: number[],
    volumes: number[],
    end: number,
    inPos: boolean,
    entryPrice: number,
    highestPrice: number,
    currentBar: KLineBar
  ): { action: 'BUY' | 'SELL' | 'HOLD'; reason?: string } {
    const currentPrice = closes[end - 1];

    if (type === 'ATR_ENHANCED') {
      const shortW = Math.round(params.short_window || params.short_w || 5);
      const longW = Math.round(params.long_window || params.long_w || 20);
      const atrMult = params.atr_multiplier || 2.0;
      const buffer = params.buffer_ratio || 1.006;

      if (end < longW + 1) return { action: 'HOLD' };

      const maShort = closes.slice(end - shortW, end).reduce((a, b) => a + b, 0) / shortW;
      const maLong = closes.slice(end - longW, end).reduce((a, b) => a + b, 0) / longW;

      // ATR
      const atr = currentBar.atr || (highs[end - 1] - lows[end - 1]);
      const vol20 = volumes.slice(end - 20, end).reduce((a, b) => a + b, 0) / Math.min(20, end);
      const volConfirmed = volumes[end - 1] > vol20 * 1.1;

      if (inPos) {
        // ATR stop loss
        const stopPrice = highestPrice - atrMult * atr;
        const hardStop = entryPrice * 0.95; // 5% hard stop
        if (currentPrice < stopPrice) {
          return { action: 'SELL', reason: `触发 ATR 动态止损 (${(atrMult).toFixed(1)}x ATR)` };
        }
        if (currentPrice < hardStop) {
          return { action: 'SELL', reason: '触发 5% 刚性硬止损' };
        }
        if (maShort < maLong) {
          return { action: 'SELL', reason: '均线死叉离场' };
        }
      } else {
        if (maShort > maLong * buffer && volConfirmed) {
          return { action: 'BUY', reason: '均线金叉 + 放量突破' };
        }
      }
      return { action: 'HOLD' };
    }

    if (type === 'RSI') {
      const period = Math.round(params.rsi_period || 14);
      const oversold = params.oversold || 28;
      const overbought = params.overbought || 72;
      const rsi = currentBar.rsi12 || currentBar.rsi6 || 50;

      if (inPos) {
        if (rsi > overbought) {
          return { action: 'SELL', reason: `RSI 超买超警戒线 (${rsi.toFixed(1)} > ${overbought})` };
        }
      } else {
        if (rsi < oversold) {
          return { action: 'BUY', reason: `RSI 极度超卖逢低建仓 (${rsi.toFixed(1)} < ${oversold})` };
        }
      }
      return { action: 'HOLD' };
    }

    if (type === 'BOLLINGER') {
      const win = Math.round(params.window || 20);
      const numStd = params.num_std || 2.0;
      if (end < win) return { action: 'HOLD' };

      const subCloses = closes.slice(end - win, end);
      const mean = subCloses.reduce((a, b) => a + b, 0) / win;
      const std = Math.sqrt(subCloses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / win);
      const upper = mean + numStd * std;

      if (inPos) {
        if (currentPrice < mean) {
          return { action: 'SELL', reason: '跌破布林中轨支撑' };
        }
      } else {
        if (currentPrice > upper) {
          return { action: 'BUY', reason: '强势突破布林带上轨' };
        }
      }
      return { action: 'HOLD' };
    }

    if (type === 'MULTI_FACTOR') {
      const momWin = Math.round(params.mom_window || 20);
      const volRatio = params.vol_ratio || 1.3;
      if (end < momWin) return { action: 'HOLD' };

      const momReturn = (currentPrice - closes[end - momWin]) / closes[end - momWin];
      const avgVol = volumes.slice(end - 20, end).reduce((a, b) => a + b, 0) / Math.min(20, end);
      const volSurge = volumes[end - 1] > avgVol * volRatio;

      if (inPos) {
        if (momReturn < -0.01) {
          return { action: 'SELL', reason: '动量转弱走低' };
        }
      } else {
        if (momReturn > 0.03 && volSurge) {
          return { action: 'BUY', reason: '正动量驱动 + 成交量爆发' };
        }
      }
      return { action: 'HOLD' };
    }

    // Default DUAL_MA
    const shortW = Math.round(params.short_window || params.short_w || 5);
    const longW = Math.round(params.long_window || params.long_w || 20);
    if (end < longW) return { action: 'HOLD' };

    const maShort = closes.slice(end - shortW, end).reduce((a, b) => a + b, 0) / shortW;
    const maLong = closes.slice(end - longW, end).reduce((a, b) => a + b, 0) / longW;

    if (inPos) {
      if (maShort < maLong) {
        return { action: 'SELL', reason: `均线死叉 (MA${shortW} < MA${longW})` };
      }
    } else {
      if (maShort > maLong) {
        return { action: 'BUY', reason: `均线金叉 (MA${shortW} > MA${longW})` };
      }
    }
    return { action: 'HOLD' };
  }
}
