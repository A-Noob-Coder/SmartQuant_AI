import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { WatchlistPanel } from './components/WatchlistPanel';
import { StrategyEditor } from './components/StrategyEditor';
import { KLineChart } from './components/KLineChart';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { AIDiagnosisPanel } from './components/AIDiagnosisPanel';
import { ParameterMiningModal } from './components/ParameterMiningModal';
import { BacktestConfigModal } from './components/BacktestConfigModal';
import { KLineDataModal } from './components/KLineDataModal';
import { StrategyReplayBar } from './components/StrategyReplayBar';
import { INITIAL_STOCKS, getHistoricalKLine } from './data/mockAStocks';
import { PRESET_STRATEGIES } from './data/presetStrategies';
import { QuantEngine, BacktestResult } from './services/quantEngine';
import {
  Stock,
  Strategy,
  BacktestConfig,
  TimeFrame,
  AIDiagnosisResult,
  KLineBar,
} from './types';

export default function App() {
  // 1. Stock Market Data State
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Stock>(INITIAL_STOCKS[0]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([
    '600519.SH',
    '300750.SZ',
    '002594.SZ',
    '688981.SH',
  ]);
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);

  // 2. Strategy & Code State
  const [strategies, setStrategies] = useState<Strategy[]>(PRESET_STRATEGIES);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy>(PRESET_STRATEGIES[0]);
  const [code, setCode] = useState<string>(PRESET_STRATEGIES[0].code);

  // 3. Backtest Configuration
  const [config, setConfig] = useState<BacktestConfig>({
    initialCapital: 100000,
    startDate: '2024-01-01',
    endDate: '2026-03-01',
    benchmarkSymbol: '000300.SH',
    matchPrice: 'next_open',
    stampTax: 0.0005,
    commission: 0.00025,
    slippage: 0.0005,
  });

  // 4. K-Line & Chart State
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');
  const [bars, setBars] = useState<KLineBar[]>(getHistoricalKLine(selectedStock.symbol, timeFrame));
  const [highlightActionDate, setHighlightActionDate] = useState<string | undefined>(undefined);

  // 5. Backtest Simulation Engine Output
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState<boolean>(false);

  // Dynamic Replay Step Index (for step-by-step playback)
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // Auto step replay when isReplaying is active
  useEffect(() => {
    if (!isReplaying) return;
    const intervalMs = Math.max(30, Math.floor(400 / replaySpeed));
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= bars.length - 1) {
          setIsReplaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isReplaying, replaySpeed, bars.length]);

  // 6. Modals State
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<AIDiagnosisResult | null>(null);
  const [isAIDiagnosing, setIsAIDiagnosing] = useState<boolean>(false);

  const [isParamMiningOpen, setIsParamMiningOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  // Synchronize K-line bars when stock or timeframe changes
  useEffect(() => {
    const historicalBars = getHistoricalKLine(selectedStock.symbol, timeFrame);
    setBars(historicalBars);
    setReplayIndex(historicalBars.length - 1);
  }, [selectedStock.symbol, timeFrame]);

  // Execute Backtest Simulation Engine
  const executeBacktest = useCallback(
    (customCode?: string, customStock?: string, customConfig?: BacktestConfig, customBars?: KLineBar[]) => {
      setIsRunningBacktest(true);
      const codeToRun = customCode ?? code;
      const targetStock = customStock ?? currentStrategy.stockSymbol;
      const configToRun = customConfig ?? config;
      // Only reuse the chart's bars when they belong to the target stock; otherwise let the
      // engine fetch the target stock's own history (avoids running a new symbol on stale bars).
      const barsToRun = customBars ?? (targetStock === selectedStock.symbol ? bars : undefined);

      setTimeout(() => {
        try {
          const result = QuantEngine.runBacktest(codeToRun, targetStock, configToRun, barsToRun);
          setBacktestResult(result);
          setReplayIndex(result.bars.length - 1);
        } catch (err: any) {
          console.error('Backtest error:', err);
        } finally {
          setIsRunningBacktest(false);
        }
      }, 150);
    },
    [code, currentStrategy.stockSymbol, config, bars, selectedStock.symbol]
  );

  // Auto-run initial backtest on load
  useEffect(() => {
    executeBacktest();
  }, []);

  // Real-time simulated market tick streamer (every 800ms)
  useEffect(() => {
    if (!isLiveFeedActive) return;

    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          // Micro-fluctuation (-0.3% to +0.3%)
          const pct = (Math.random() - 0.49) * 0.006;
          const newPrice = Number((stock.currentPrice * (1 + pct)).toFixed(2));
          const newChange = Number((newPrice - stock.prevClose).toFixed(2));
          const newChangePercent = Number(((newChange / stock.prevClose) * 100).toFixed(2));
          const newVol = stock.volume + Math.floor(Math.random() * 50);

          const updatedSparkline = [...stock.sparkline.slice(1), newPrice];

          return {
            ...stock,
            currentPrice: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            volume: newVol,
            sparkline: updatedSparkline,
          };
        })
      );
    }, 800);

    return () => clearInterval(interval);
  }, [isLiveFeedActive]);

  // Update selected stock price when stocks change
  useEffect(() => {
    const updated = stocks.find((s) => s.symbol === selectedStock.symbol);
    if (updated && updated.currentPrice !== selectedStock.currentPrice) {
      setSelectedStock(updated);
    }
  }, [stocks, selectedStock.symbol]);

  // Strategy selection handler
  const handleSelectStrategy = (strat: Strategy) => {
    setCurrentStrategy(strat);
    setCode(strat.code);

    // Also switch selected stock to strategy stock
    const targetStock = stocks.find((s) => s.symbol === strat.stockSymbol);
    if (targetStock) {
      setSelectedStock(targetStock);
    }
    executeBacktest(strat.code, strat.stockSymbol);
  };

  // Set stock as strategy target
  const handleSetStrategyStock = (symbol: string) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return;

    setSelectedStock(stock);
    setCurrentStrategy((prev) => ({
      ...prev,
      stockSymbol: symbol,
    }));

    // Replace stock symbol in code
    const updatedCode = code.replace(
      /context\.stock\s*=\s*["'][^"']+["']/,
      `context.stock = "${symbol}"`
    );
    setCode(updatedCode);
    executeBacktest(updatedCode, symbol);
  };

  // Watchlist toggle
  const handleToggleWatchlist = (symbol: string) => {
    setWatchlistSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Load custom or preset historical bars from KLineDataModal
  const handleLoadCustomKLine = (newBars: KLineBar[], label: string) => {
    setBars(newBars);
    setReplayIndex(newBars.length - 1);
    executeBacktest(undefined, undefined, undefined, newBars);
    setIsDataModalOpen(false);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Trigger AI Strategy Diagnosis
  const handleRunAIDiagnosis = async () => {
    setIsAIDrawerOpen(true);
    if (!backtestResult) return;

    setIsAIDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyName: currentStrategy.name,
          stockSymbol: currentStrategy.stockSymbol,
          strategyCode: code,
          metrics: backtestResult.metrics,
          recentTrades: backtestResult.trades.slice(0, 15),
        }),
      });

      if (!res.ok) {
        throw new Error('AI 诊断服务异常');
      }

      const data = await res.json();
      setAiDiagnosis(data.diagnosis || data);
    } catch (err: any) {
      console.error('AI diagnosis error:', err);
      // Fallback local diagnosis
      setAiDiagnosis({
        summary: `当前【${currentStrategy.name}】在${currentStrategy.stockSymbol}上取得了 ${backtestResult.metrics.cumulativeReturn}% 的累计收益率，夏普比率为 ${backtestResult.metrics.sharpeRatio}。但在震荡市行情中存在因均线频繁缠绕假突破导致的规费摩擦与回撤放大。`,
        score: backtestResult.metrics.sharpeRatio >= 1.2 ? 82 : 68,
        attribution: {
          trendContribution: 58,
          alphaContribution: 28,
          noiseLoss: 14,
        },
        vulnerabilities: [
          {
            issue: '震荡行情频繁假突破摩擦损耗',
            severity: 'high',
            impact: '均线在无序横盘期间频繁金叉买入死叉卖出，产生不必要的印花税与佣金扣除。',
          },
          {
            issue: '缺乏动态追踪止损 (Trailing Stop)',
            severity: 'medium',
            impact: '在单边上涨后大幅回撤时未能及时锁定利润，侵蚀了前期收益。',
          },
        ],
        recommendations: [
          '加入 0.8% 均线死区滤波 (Deadband Filter)，消除微小毛刺信号',
          '引入 2.0x ATR 真实波幅动态移动止损，保护已有盈利',
          '增加 20日成交量放量确认条件 (Volume Surge Confirmation)',
        ],
        optimizedCode: PRESET_STRATEGIES[3]?.code || code,
      });
    } finally {
      setIsAIDiagnosing(false);
    }
  };

  // 1-Click apply AI optimized code
  const handleApplyOptimizedCode = (newCode: string) => {
    setCode(newCode);
    executeBacktest(newCode);
    setIsAIDrawerOpen(false);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Apply best parameter from grid search
  const handleApplyBestParams = (p1: number, p2: number) => {
    const tunable = QuantEngine.getTunableParams(code);
    const re1 = new RegExp(`context\\.${tunable.param1Name}\\s*=\\s*\\d+(\\.\\d+)?`, 'g');
    const re2 = new RegExp(`context\\.${tunable.param2Name}\\s*=\\s*\\d+(\\.\\d+)?`, 'g');
    let modifiedCode = code;
    modifiedCode = modifiedCode.replace(re1, `context.${tunable.param1Name} = ${p1}`);
    modifiedCode = modifiedCode.replace(re2, `context.${tunable.param2Name} = ${p2}`);
    setCode(modifiedCode);
    executeBacktest(modifiedCode);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Computed displayed bars based on replay progress
  const displayedBars = bars.slice(0, Math.max(1, replayIndex + 1));
  const currentReplayBar = bars[replayIndex] || bars[bars.length - 1];

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <Header
        strategies={strategies}
        currentStrategy={currentStrategy}
        onSelectStrategy={handleSelectStrategy}
        onRunBacktest={() => executeBacktest()}
        isRunning={isRunningBacktest}
        onOpenAIDiagnosis={handleRunAIDiagnosis}
        onOpenParamMining={() => setIsParamMiningOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        isLiveFeedActive={isLiveFeedActive}
        onToggleLiveFeed={() => setIsLiveFeedActive(!isLiveFeedActive)}
        config={config}
      />

      {/* 2. Main Workbench (3-Column / Dock Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Watchlist & Market Monitor */}
        <WatchlistPanel
          stocks={stocks}
          selectedStock={selectedStock}
          onSelectStock={(s) => setSelectedStock(s)}
          watchlistSymbols={watchlistSymbols}
          onToggleWatchlist={handleToggleWatchlist}
          onSetStrategyStock={handleSetStrategyStock}
          strategyStockSymbol={currentStrategy.stockSymbol}
        />

        {/* Center & Right: Dual Upper (Editor + KLine) and Bottom Dock (Evaluation) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Upper Workspace: Left-half Monaco Editor + Right-half K-Line Chart */}
          <div className="h-[48%] flex border-b border-slate-800">
            {/* Left-half: Monaco Strategy Code Editor */}
            <div className="w-1/2 h-full">
              <StrategyEditor
                strategy={currentStrategy}
                code={code}
                onChangeCode={(c) => setCode(c)}
                onResetCode={() => setCode(currentStrategy.code)}
                onApplyPresetSnippet={(snip) => setCode(snip)}
                onOpenAIDiagnosis={handleRunAIDiagnosis}
                hasAIOptimization={!!aiDiagnosis?.optimizedCode}
              />
            </div>

            {/* Right-half: Interactive K-Line Chart with Overlay Signals & Indicators */}
            <div className="w-1/2 h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <KLineChart
                  bars={displayedBars}
                  stockSymbol={selectedStock.symbol}
                  stockName={selectedStock.name}
                  currentPrice={currentReplayBar ? currentReplayBar.close : selectedStock.currentPrice}
                  changePercent={
                    currentReplayBar
                      ? Number((((currentReplayBar.close - currentReplayBar.open) / currentReplayBar.open) * 100).toFixed(2))
                      : selectedStock.changePercent
                  }
                  timeFrame={timeFrame}
                  onChangeTimeFrame={(tf) => setTimeFrame(tf)}
                  trades={backtestResult?.trades || []}
                  onOpenDataModal={() => setIsDataModalOpen(true)}
                  highlightDate={highlightActionDate}
                />
              </div>

              {/* Dynamic Strategy Replay Controller Bar */}
              <StrategyReplayBar
                totalBars={bars.length}
                currentIndex={replayIndex}
                isPlaying={isReplaying}
                speed={replaySpeed}
                currentBarDate={currentReplayBar?.date || ''}
                currentPrice={currentReplayBar?.close}
                onTogglePlay={() => {
                  if (!isReplaying && replayIndex >= bars.length - 1) {
                    setReplayIndex(0);
                  }
                  setIsReplaying(!isReplaying);
                }}
                onSpeedChange={(s) => setReplaySpeed(s)}
                onSeek={(idx) => {
                  setIsReplaying(false);
                  setReplayIndex(idx);
                }}
                onStepForward={() => {
                  setIsReplaying(false);
                  setReplayIndex((i) => Math.min(bars.length - 1, i + 1));
                }}
                onStepBackward={() => {
                  setIsReplaying(false);
                  setReplayIndex((i) => Math.max(0, i - 1));
                }}
                onReset={() => {
                  setIsReplaying(false);
                  setReplayIndex(bars.length - 1);
                }}
                onInstantRun={() => {
                  setIsReplaying(false);
                  setReplayIndex(bars.length - 1);
                }}
              />
            </div>
          </div>

          {/* Bottom Dock: 3-Dimensional Evaluation & Strategy Action Dashboard */}
          <div className="h-[52%] flex-1 overflow-hidden">
            {backtestResult ? (
              <EvaluationDashboard
                equityCurve={backtestResult.equityCurve}
                metrics={backtestResult.metrics}
                trades={backtestResult.trades}
                strategyActions={backtestResult.strategyActions || []}
                strategyLogs={backtestResult.strategyLogs || []}
                activePosition={backtestResult.activePosition || null}
                initialCapital={config.initialCapital}
                aiDiagnosis={aiDiagnosis}
                isAIDiagnosing={isAIDiagnosing}
                onRunAIDiagnosis={handleRunAIDiagnosis}
                onApplyOptimizedCode={handleApplyOptimizedCode}
                onSelectActionDate={(date) => {
                  setHighlightActionDate(date);
                  // Find bar index to jump replay
                  const idx = bars.findIndex((b) => b.date === date);
                  if (idx >= 0) {
                    setReplayIndex(Math.max(idx, 10));
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                正在初始化模拟盘与回测引擎...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. AI Strategy Diagnosis Side Drawer */}
      <AIDiagnosisPanel
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        diagnosis={aiDiagnosis}
        isLoading={isAIDiagnosing}
        onApplyOptimizedCode={handleApplyOptimizedCode}
        onReDiagnose={handleRunAIDiagnosis}
        metrics={
          backtestResult?.metrics || {
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
          }
        }
      />

      {/* 4. Parameter Space Grid Search Modal */}
      <ParameterMiningModal
        isOpen={isParamMiningOpen}
        onClose={() => setIsParamMiningOpen(false)}
        code={code}
        stockSymbol={currentStrategy.stockSymbol}
        config={config}
        onApplyBestParams={handleApplyBestParams}
      />

      {/* 5. Backtest Configuration Modal */}
      <BacktestConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          executeBacktest(undefined, undefined, newConfig);
        }}
      />

      {/* 6. K-Line Data Management & CSV Modal */}
      <KLineDataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentStockSymbol={selectedStock.symbol}
        currentStockName={selectedStock.name}
        currentTimeFrame={timeFrame}
        onLoadPresetScenario={handleLoadCustomKLine}
        onImportCSV={handleLoadCustomKLine}
        currentBars={bars}
      />
    </div>
  );
}
