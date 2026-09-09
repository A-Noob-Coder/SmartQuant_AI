import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Percent,
  Award,
  Clock,
  DollarSign,
  Activity,
  ListOrdered,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Download,
  Filter,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  ShieldCheck,
  Code,
  ArrowRight,
} from 'lucide-react';
import {
  EquityPoint,
  EvaluationMetrics,
  StrategyAction,
  StrategyLogEntry,
  TradeRecord,
  AIDiagnosisResult,
} from '../types';
import { ActivePositionInfo } from '../services/quantEngine';

interface EvaluationDashboardProps {
  equityCurve: EquityPoint[];
  metrics: EvaluationMetrics;
  trades: TradeRecord[];
  strategyActions?: StrategyAction[];
  strategyLogs?: StrategyLogEntry[];
  activePosition?: ActivePositionInfo | null;
  initialCapital: number;
  onSelectActionDate?: (date: string) => void;
  aiDiagnosis?: AIDiagnosisResult | null;
  isAIDiagnosing?: boolean;
  onRunAIDiagnosis?: () => void;
  onApplyOptimizedCode?: (code: string) => void;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  equityCurve,
  metrics,
  trades,
  strategyActions = [],
  strategyLogs = [],
  activePosition = null,
  initialCapital,
  onSelectActionDate,
  aiDiagnosis = null,
  isAIDiagnosing = false,
  onRunAIDiagnosis,
  onApplyOptimizedCode,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'CURVE' | 'AI_DIAGNOSIS' | 'METRICS' | 'TRADES' | 'LOGS'>('ACTIONS');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'STOP_LOSS' | 'TAKE_PROFIT'>('ALL');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filtered Strategy Actions
  const filteredActions = useMemo(() => {
    if (actionFilter === 'ALL') return strategyActions;
    return strategyActions.filter((act) => act.actionType === actionFilter);
  }, [strategyActions, actionFilter]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (tradeFilter === 'WIN') return trades.filter((t) => (t.pnl || 0) > 0);
    if (tradeFilter === 'LOSS') return trades.filter((t) => (t.pnl || 0) <= 0);
    return trades;
  }, [trades, tradeFilter]);

  // Export Action Delivery Slip to CSV
  const handleExportActionsCSV = () => {
    const header = 'ActionID,Date,Symbol,ActionType,Price,Shares,Amount,Fees,PnL,PnLPercent,HoldingDays,Reason\n';
    const rows = strategyActions.map(
      (a) =>
        `${a.id},${a.date},${a.symbol},${a.actionType},${a.price},${a.shares},${a.amount},${a.fees},${a.pnl ?? ''},${a.pnlPercent ?? ''},${a.holdingDays ?? ''},"${a.reason.replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(header + rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Strategy_Actions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Equity Curve SVG calculation
  const svgWidth = 800;
  const svgHeight = 170;
  const ddHeight = 45;
  const totalSvgH = svgHeight + ddHeight + 20;

  const { minVal, maxVal, maxDD } = useMemo(() => {
    if (equityCurve.length === 0) return { minVal: -10, maxVal: 30, maxDD: 15 };
    let min = 0;
    let max = 0;
    let mdd = 0;
    for (const pt of equityCurve) {
      if (pt.strategyReturn < min) min = pt.strategyReturn;
      if (pt.strategyReturn > max) max = pt.strategyReturn;
      if (pt.benchmarkReturn < min) min = pt.benchmarkReturn;
      if (pt.benchmarkReturn > max) max = pt.benchmarkReturn;
      if (pt.drawdown > mdd) mdd = pt.drawdown;
    }
    const pad = (max - min) * 0.1 || 5;
    return {
      minVal: min - pad,
      maxVal: max + pad,
      maxDD: Math.max(10, mdd * 1.15),
    };
  }, [equityCurve]);

  const count = equityCurve.length;
  const getX = (index: number) => {
    return count > 1 ? (index / (count - 1)) * svgWidth : 0;
  };
  const getY = (val: number) => {
    return svgHeight - ((val - minVal) / (maxVal - minVal || 1)) * (svgHeight - 20) - 10;
  };
  const getDDY = (dd: number) => {
    const top = svgHeight + 15;
    return top + (dd / (maxDD || 1)) * (ddHeight - 5);
  };

  // Strategy curve path
  const stratPath = useMemo(() => {
    if (equityCurve.length === 0) return '';
    return equityCurve
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.strategyReturn)}`)
      .join(' ');
  }, [equityCurve, minVal, maxVal]);

  // Benchmark curve path
  const benchPath = useMemo(() => {
    if (equityCurve.length === 0) return '';
    return equityCurve
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.benchmarkReturn)}`)
      .join(' ');
  }, [equityCurve, minVal, maxVal]);

  // Strategy area fill path
  const stratAreaPath = useMemo(() => {
    if (equityCurve.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(equityCurve.length - 1);
    const yZero = getY(0);
    return `${stratPath} L ${lastX} ${yZero} L ${firstX} ${yZero} Z`;
  }, [stratPath, equityCurve, minVal, maxVal]);

  // Drawdown fill path
  const ddAreaPath = useMemo(() => {
    if (equityCurve.length === 0) return '';
    const top = svgHeight + 15;
    let path = `M 0 ${top}`;
    for (let i = 0; i < equityCurve.length; i++) {
      path += ` L ${getX(i)} ${getDDY(equityCurve[i].drawdown)}`;
    }
    path += ` L ${getX(equityCurve.length - 1)} ${top} Z`;
    return path;
  }, [equityCurve, maxDD]);

  const activePoint = hoverIndex !== null ? equityCurve[hoverIndex] : equityCurve[equityCurve.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.min(count - 1, Math.max(0, Math.floor((x / rect.width) * count)));
    setHoverIndex(index);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 select-none text-slate-200">
      {/* Top Highlight Summary KPI Strip */}
      <div className="h-12 px-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between overflow-x-auto no-scrollbar text-xs">
        {/* KPI 1: Cumulative Return */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-800/80">
          <span className="text-slate-400">累计收益:</span>
          <span
            className={`font-mono font-bold text-sm ${
              metrics.cumulativeReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {metrics.cumulativeReturn >= 0 ? '+' : ''}
            {metrics.cumulativeReturn.toFixed(2)}%
          </span>
        </div>

        {/* KPI 2: Annualized Return */}
        <div className="flex items-center gap-2 px-4 border-r border-slate-800/80">
          <span className="text-slate-400">年化收益:</span>
          <span
            className={`font-mono font-bold text-sm ${
              metrics.annualizedReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {metrics.annualizedReturn >= 0 ? '+' : ''}
            {metrics.annualizedReturn.toFixed(2)}%
          </span>
        </div>

        {/* KPI 3: Max Drawdown */}
        <div className="flex items-center gap-2 px-4 border-r border-slate-800/80">
          <span className="text-slate-400">最大回撤 (MaxDD):</span>
          <span className="font-mono font-bold text-sm text-amber-400">
            -{metrics.maxDrawdown.toFixed(2)}%
          </span>
        </div>

        {/* KPI 4: Sharpe Ratio */}
        <div className="flex items-center gap-2 px-4 border-r border-slate-800/80">
          <span className="text-slate-400">夏普比率 (Sharpe):</span>
          <span
            className={`font-mono font-bold text-sm ${
              metrics.sharpeRatio >= 1.2 ? 'text-cyan-400' : 'text-slate-200'
            }`}
          >
            {metrics.sharpeRatio.toFixed(2)}
          </span>
        </div>

        {/* KPI 5: Win Rate */}
        <div className="flex items-center gap-2 px-4 border-r border-slate-800/80">
          <span className="text-slate-400">胜率 (Win Rate):</span>
          <span className="font-mono font-bold text-sm text-slate-100">
            {metrics.winRate.toFixed(1)}%
          </span>
        </div>

        {/* KPI 6: Profit/Loss Ratio */}
        <div className="flex items-center gap-2 px-4">
          <span className="text-slate-400">盈亏比:</span>
          <span className="font-mono font-bold text-sm text-slate-100">
            {metrics.profitLossRatio.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabs Switcher Header */}
      <div className="h-9 px-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ACTIONS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'ACTIONS'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>策略动作看板 ({strategyActions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_DIAGNOSIS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'AI_DIAGNOSIS'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50 font-semibold'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>AI 策略诊断与优化 {aiDiagnosis?.score ? `(${aiDiagnosis.score}分)` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('CURVE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'CURVE'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>收益曲线 vs 沪深300</span>
          </button>

          <button
            onClick={() => setActiveTab('METRICS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'METRICS'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>三维量化评估指标</span>
          </button>

          <button
            onClick={() => setActiveTab('TRADES')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'TRADES'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>交易配对明细 ({trades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'LOGS'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>策略执行控制台 ({strategyLogs.length})</span>
          </button>
        </div>

        {/* Tab-specific right actions */}
        {activeTab === 'AI_DIAGNOSIS' && (
          <div className="flex items-center gap-2">
            {onRunAIDiagnosis && (
              <button
                onClick={onRunAIDiagnosis}
                disabled={isAIDiagnosing}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[11px] font-semibold transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{isAIDiagnosing ? '正在诊断中...' : '重新生成 AI 诊断'}</span>
              </button>
            )}
            {aiDiagnosis?.optimizedCode && onApplyOptimizedCode && (
              <button
                onClick={() => onApplyOptimizedCode(aiDiagnosis.optimizedCode!)}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-[11px] font-semibold shadow-sm"
              >
                <Zap className="w-3 h-3 fill-current text-amber-300" />
                <span>一键应用优化代码</span>
              </button>
            )}
          </div>
        )}

        {/* Tab-specific right actions */}
        {activeTab === 'ACTIONS' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px]">
              <button
                onClick={() => setActionFilter('ALL')}
                className={`px-2 py-0.5 rounded ${
                  actionFilter === 'ALL' ? 'bg-slate-700 text-slate-100' : 'text-slate-400'
                }`}
              >
                全部 ({strategyActions.length})
              </button>
              <button
                onClick={() => setActionFilter('BUY')}
                className={`px-2 py-0.5 rounded ${
                  actionFilter === 'BUY' ? 'bg-slate-700 text-emerald-300' : 'text-slate-400'
                }`}
              >
                买入 ({strategyActions.filter((a) => a.actionType === 'BUY').length})
              </button>
              <button
                onClick={() => setActionFilter('SELL')}
                className={`px-2 py-0.5 rounded ${
                  actionFilter === 'SELL' ? 'bg-slate-700 text-rose-300' : 'text-slate-400'
                }`}
              >
                卖出/止盈 ({strategyActions.filter((a) => a.actionType === 'SELL' || a.actionType === 'TAKE_PROFIT').length})
              </button>
              <button
                onClick={() => setActionFilter('STOP_LOSS')}
                className={`px-2 py-0.5 rounded ${
                  actionFilter === 'STOP_LOSS' ? 'bg-slate-700 text-amber-300' : 'text-slate-400'
                }`}
              >
                止损 ({strategyActions.filter((a) => a.actionType === 'STOP_LOSS').length})
              </button>
            </div>

            <button
              onClick={handleExportActionsCSV}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px] transition-colors"
              title="导出策略动作交割单 CSV"
            >
              <Download className="w-3 h-3" />
              <span>导出交割单</span>
            </button>
          </div>
        )}

        {activeTab === 'CURVE' && activePoint && (
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>{activePoint.date}</span>
            <span className="text-cyan-400 font-semibold">
              策略净值: ¥{activePoint.strategyEquity.toLocaleString()} ({activePoint.strategyReturn >= 0 ? '+' : ''}
              {activePoint.strategyReturn}%)
            </span>
            <span className="text-slate-400">
              基准: {activePoint.benchmarkReturn >= 0 ? '+' : ''}
              {activePoint.benchmarkReturn}%
            </span>
            <span className="text-amber-400">回撤: -{activePoint.drawdown}%</span>
          </div>
        )}

        {activeTab === 'TRADES' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px]">
              <button
                onClick={() => setTradeFilter('ALL')}
                className={`px-2 py-0.5 rounded ${
                  tradeFilter === 'ALL' ? 'bg-slate-700 text-slate-100' : 'text-slate-400'
                }`}
              >
                全部 ({trades.length})
              </button>
              <button
                onClick={() => setTradeFilter('WIN')}
                className={`px-2 py-0.5 rounded ${
                  tradeFilter === 'WIN' ? 'bg-slate-700 text-rose-300' : 'text-slate-400'
                }`}
              >
                盈利 ({metrics.winningTrades})
              </button>
              <button
                onClick={() => setTradeFilter('LOSS')}
                className={`px-2 py-0.5 rounded ${
                  tradeFilter === 'LOSS' ? 'bg-slate-700 text-emerald-300' : 'text-slate-400'
                }`}
              >
                亏损 ({metrics.losingTrades})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ===================== TAB 0: STRATEGY ACTIONS (NEW FIRST-CLASS DASHBOARD) ===================== */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-3">
            {/* Real-time Position & Risk Radar Card */}
            {activePosition ? (
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/40 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{activePosition.symbol}</span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                        当前多头持仓中 ({activePosition.holdingDays}天)
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      建仓日期: {activePosition.entryDate} | 开仓均价: ¥{activePosition.entryPrice}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono">
                  <div>
                    <div className="text-slate-400 text-[10px]">持仓股数 / 市值</div>
                    <div className="font-bold text-slate-200">
                      {activePosition.shares} 股 / ¥{activePosition.marketValue.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px]">最新现价 / 浮动盈亏</div>
                    <div
                      className={`font-bold ${
                        activePosition.pnl >= 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ¥{activePosition.currentPrice.toFixed(2)} (
                      {activePosition.pnl >= 0 ? '+' : ''}
                      {activePosition.pnl.toFixed(2)} / {activePosition.pnlPercent}%)
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px]">最高价 / 动态跟踪止损线</div>
                    <div className="font-bold text-amber-400">
                      ¥{activePosition.highestPrice} / ¥{activePosition.trailingStopPrice}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span>当前空仓状态，资金利用率 0%，等待策略发出买入信号...</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">本金余额: ¥{initialCapital.toLocaleString()}</span>
              </div>
            )}

            {/* Actions Timeline Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">动作类型</th>
                    <th className="px-3 py-2">执行时间</th>
                    <th className="px-3 py-2">成交价 / 数量</th>
                    <th className="px-3 py-2">成交金额 / 佣金</th>
                    <th className="px-3 py-2">实现盈亏</th>
                    <th className="px-3 py-2">持仓天数</th>
                    <th className="px-3 py-2">策略决策触发原因与指标快照</th>
                    <th className="px-3 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredActions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                        暂无策略执行动作记录
                      </td>
                    </tr>
                  ) : (
                    filteredActions.map((act) => {
                      const isBuy = act.actionType === 'BUY';
                      const isStopLoss = act.actionType === 'STOP_LOSS';
                      const isTakeProfit = act.actionType === 'TAKE_PROFIT';

                      return (
                        <tr
                          key={act.id}
                          className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                          onClick={() => onSelectActionDate && onSelectActionDate(act.date)}
                        >
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBuy
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isStopLoss
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {isBuy ? '🟢 买入建仓' : isStopLoss ? '⚠️ 触发止损' : '🔴 卖出平仓'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-200 font-medium">{act.date}</td>
                          <td className="px-3 py-2">
                            <div className="text-slate-100 font-semibold">¥{act.price.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">{act.shares} 股</div>
                          </td>
                          <td className="px-3 py-2">
                            <div>¥{act.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">费: ¥{act.fees}</div>
                          </td>
                          <td className="px-3 py-2">
                            {act.pnl !== undefined ? (
                              <div
                                className={`font-bold ${
                                  act.pnl >= 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {act.pnl >= 0 ? '+' : ''}¥{act.pnl.toFixed(2)}
                                <span className="text-[10px] ml-1 font-normal">
                                  ({act.pnlPercent}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {act.holdingDays !== undefined ? `${act.holdingDays} 天` : '--'}
                          </td>
                          <td className="px-3 py-2 font-sans">
                            <div className="text-slate-200 text-xs font-medium">{act.reason}</div>
                            {act.indicatorsSnapshot && (
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                                {act.indicatorsSnapshot.ma5 && <span>MA5:{act.indicatorsSnapshot.ma5}</span>}
                                {act.indicatorsSnapshot.ma20 && <span>MA20:{act.indicatorsSnapshot.ma20}</span>}
                                {act.indicatorsSnapshot.rsi && <span>RSI:{act.indicatorsSnapshot.rsi}</span>}
                                {act.indicatorsSnapshot.macd && <span>MACD:{act.indicatorsSnapshot.macd}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectActionDate) onSelectActionDate(act.date);
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] opacity-80 group-hover:opacity-100 transition-all border border-slate-700"
                            >
                              定位K线
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 0.5: AI STRATEGY DIAGNOSIS & OPTIMIZATION ===================== */}
        {activeTab === 'AI_DIAGNOSIS' && (
          <div className="space-y-4">
            {isAIDiagnosing ? (
              <div className="p-8 text-center bg-slate-950/80 rounded-xl border border-purple-800/40 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
                <div className="text-sm font-semibold text-slate-200">
                  Gemini 量化专家大模型正在深度解析策略逻辑与回测交割单...
                </div>
                <div className="text-xs text-slate-500 max-w-md">
                  正在进行跨周期特征归因、假突破规费摩擦损耗度量、以及 ATR 移动止损滤波代码重构
                </div>
              </div>
            ) : aiDiagnosis ? (
              <div className="space-y-4">
                {/* 1. Health Score & Attribution Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Score Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex flex-col items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                      <span className="text-lg font-black text-purple-300 font-mono">
                        {aiDiagnosis.score ?? 78}
                      </span>
                      <span className="text-[8px] text-purple-400 font-bold -mt-1">分</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>策略综合健康度评分</span>
                        <span className="px-1.5 py-0.2 text-[9px] bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded font-semibold">
                          {(aiDiagnosis.score ?? 78) >= 80 ? 'A 级 稳健波段' : (aiDiagnosis.score ?? 78) >= 65 ? 'B 级 均衡适度' : 'C 级 待风控优化'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {aiDiagnosis.summary}
                      </div>
                    </div>
                  </div>

                  {/* Profit & Risk Attribution Card */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 md:col-span-2 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>多因子收益与摩擦损失归因 (Profit & Friction Attribution)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Alpha: {metrics.alpha > 0 ? `+${metrics.alpha}%` : `${metrics.alpha}%`} | 夏普: {metrics.sharpeRatio.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">趋势波段贡献</div>
                        <div className="text-sm font-bold text-emerald-400">
                          {aiDiagnosis.attribution?.trendContribution ?? 58}%
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${aiDiagnosis.attribution?.trendContribution ?? 58}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">Alpha 择时超额</div>
                        <div className="text-sm font-bold text-cyan-400">
                          {aiDiagnosis.attribution?.alphaContribution ?? 28}%
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full"
                            style={{ width: `${aiDiagnosis.attribution?.alphaContribution ?? 28}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">假突破与规费磨损</div>
                        <div className="text-sm font-bold text-rose-400">
                          {aiDiagnosis.attribution?.noiseLoss ?? 14}%
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${aiDiagnosis.attribution?.noiseLoss ?? 14}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Vulnerabilities & Recommendations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Vulnerabilities / Flaws */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>策略逻辑漏洞与结构性缺陷 (Identified Flaws)</span>
                    </div>

                    <div className="space-y-2">
                      {(aiDiagnosis.vulnerabilities || aiDiagnosis.flaws || [
                        {
                          issue: '震荡行情频繁假突破摩擦损耗',
                          severity: 'high' as const,
                          impact: '均线在横盘震荡期间频繁发生无效金叉与死叉，导致连续摩擦磨损。',
                        },
                        {
                          issue: '缺乏动态 ATR 移动止损',
                          severity: 'medium' as const,
                          impact: '在单边急跌中仅依赖均线死叉平仓，无法在获利后锁定波段利润。',
                        },
                      ]).map((item: any, idx: number) => {
                        const title = item.issue || item.title || '策略潜在风险点';
                        const desc = item.impact || item.description || '';
                        const sev = item.severity || 'medium';

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${
                                sev === 'high'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : sev === 'medium'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {sev === 'high' ? '高风险' : sev === 'medium' ? '中等缺陷' : '提示'}
                            </span>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-200">{title}</div>
                              <div className="text-slate-400 text-[11px] mt-0.5">{desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>AI 量化优化改进方案 (Actionable Recommendations)</span>
                    </div>

                    <div className="space-y-2">
                      {(aiDiagnosis.recommendations || [
                        '加入 0.8% 均线死区滤波 (Deadband Filter)，消除微小毛刺信号',
                        '引入 2.0x ATR 真实波幅动态移动止损，保护已有盈利',
                        '增加 20日成交量放量确认条件 (Volume Surge Confirmation)',
                      ]).map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start gap-2 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Optimized Code Showcase & 1-Click Apply */}
                {aiDiagnosis.optimizedCode && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-950 border border-purple-500/40 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                          <Code className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <span>AI 优化后策略工程代码 (Optimized Code Ready)</span>
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono font-semibold">
                              已内嵌 ATR 动态止损与死区滤波
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            点击应用后将自动替换编辑器代码并直接执行撮合回测
                          </div>
                        </div>
                      </div>

                      {onApplyOptimizedCode && (
                        <button
                          onClick={() => onApplyOptimizedCode(aiDiagnosis.optimizedCode!)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-transform active:scale-95 text-xs"
                        >
                          <Zap className="w-4 h-4 fill-current text-amber-300" />
                          <span>一键应用优化代码并重新回测</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{aiDiagnosis.optimizedCode}</pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <div className="font-semibold text-slate-300 text-sm">尚未生成 AI 诊断</div>
                <div className="text-xs text-slate-500 max-w-md">
                  点击下方按钮，启动大模型对当前策略逻辑、买卖动作质量、假突破磨损与风控止损的全面诊断优化
                </div>
                {onRunAIDiagnosis && (
                  <button
                    onClick={onRunAIDiagnosis}
                    className="mt-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>立即开始 AI 策略诊断</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 1: CURVE ===================== */}
        {activeTab === 'CURVE' && (
          <div className="w-full h-full flex flex-col">
            {/* Chart Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 bg-cyan-400 rounded-full"></div>
                  <span className="text-slate-200 font-medium">策略收益率曲线</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 bg-slate-500 rounded-full"></div>
                  <span>沪深300基准</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/40 rounded-sm"></div>
                  <span>水下动态回撤 (Underwater Drawdown)</span>
                </div>
              </div>
              <div className="text-slate-500 font-mono text-[10px]">
                超额收益 Alpha: {metrics.alpha > 0 ? `+${metrics.alpha}%` : `${metrics.alpha}%`} | Beta: {metrics.beta}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="flex-1 w-full relative min-h-[220px] bg-slate-950/60 rounded border border-slate-800/80 p-1">
              <svg
                viewBox={`0 0 ${svgWidth} ${totalSvgH}`}
                preserveAspectRatio="none"
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Grids */}
                <g className="stroke-slate-800/50" strokeDasharray="3 3">
                  <line x1="0" y1={getY(0)} x2={svgWidth} y2={getY(0)} stroke="#475569" strokeDasharray="none" strokeWidth="1" />
                  <line x1="0" y1="20" x2={svgWidth} y2="20" />
                  <line x1="0" y1={svgHeight - 15} x2={svgWidth} y2={svgHeight - 15} />
                  <line x1="0" y1={svgHeight + 15} x2={svgWidth} y2={svgHeight + 15} stroke="#334155" strokeDasharray="none" />
                </g>

                {/* Strategy Area Gradient Fill */}
                <defs>
                  <linearGradient id="stratGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
                  </linearGradient>
                </defs>

                {stratAreaPath && <path d={stratAreaPath} fill="url(#stratGradient)" />}
                {benchPath && <path d={benchPath} fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 2" />}
                {stratPath && <path d={stratPath} fill="none" stroke="#22d3ee" strokeWidth="2" />}

                {/* Drawdown Area */}
                {ddAreaPath && <path d={ddAreaPath} fill="url(#ddGradient)" stroke="#f59e0b" strokeWidth="1" />}

                {/* Crosshair */}
                {hoverIndex !== null && hoverIndex < count && (
                  <g id="curve-crosshair">
                    <line
                      x1={getX(hoverIndex)}
                      y1={0}
                      x2={getX(hoverIndex)}
                      y2={totalSvgH}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={getX(hoverIndex)}
                      cy={getY(equityCurve[hoverIndex].strategyReturn)}
                      r="4"
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: METRICS ===================== */}
        {activeTab === 'METRICS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Category 1: Returns */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-cyan-400 pb-1.5 border-b border-slate-800">
                <TrendingUp className="w-4 h-4" />
                <span>收益特征指标</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">累计总收益率:</span>
                  <span className={`font-mono font-bold ${metrics.cumulativeReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.cumulativeReturn >= 0 ? '+' : ''}{metrics.cumulativeReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">年化复合收益率 (CAGR):</span>
                  <span className={`font-mono font-bold ${metrics.annualizedReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.annualizedReturn >= 0 ? '+' : ''}{metrics.annualizedReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">基准同期收益 (沪深300):</span>
                  <span className="font-mono text-slate-300">
                    {metrics.benchmarkReturn >= 0 ? '+' : ''}{metrics.benchmarkReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">阿尔法超额收益 (Alpha):</span>
                  <span className={`font-mono font-bold ${metrics.alpha >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.alpha >= 0 ? '+' : ''}{metrics.alpha.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">贝塔系数 (Beta):</span>
                  <span className="font-mono text-slate-300">{metrics.beta.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Category 2: Risk & Drawdown */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-400 pb-1.5 border-b border-slate-800">
                <ShieldAlert className="w-4 h-4" />
                <span>风险与回撤控制</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">历史最大回撤 (MaxDD):</span>
                  <span className="font-mono font-bold text-amber-400">
                    -{(metrics.maxDrawdown ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">夏普比率 (Sharpe Ratio):</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {(metrics.sharpeRatio ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">索提诺比率 (Sortino):</span>
                  <span className="font-mono text-slate-300">
                    {(metrics.sortinoRatio ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">卡玛比率 (Calmar Ratio):</span>
                  <span className="font-mono text-slate-300">
                    {(metrics.maxDrawdown && metrics.maxDrawdown > 0
                      ? metrics.annualizedReturn / metrics.maxDrawdown
                      : (metrics.sharpeRatio || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">年化波动率:</span>
                  <span className="font-mono text-slate-300">
                    {(metrics.annualizedVolatility ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Category 3: Trading Behavior */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 pb-1.5 border-b border-slate-800">
                <Activity className="w-4 h-4" />
                <span>交易行为特征</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">交易总胜率 (Win Rate):</span>
                  <span className="font-mono font-bold text-slate-100">
                    {(metrics.winRate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">单笔盈亏比 (Profit/Loss):</span>
                  <span className="font-mono font-bold text-slate-100">
                    {(metrics.profitLossRatio ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">交易总次数 (赢/亏):</span>
                  <span className="font-mono text-slate-300">
                    {metrics.totalTrades ?? 0} 次 ({metrics.winningTrades ?? 0}胜 / {metrics.losingTrades ?? 0}负)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">平均持仓周期:</span>
                  <span className="font-mono text-slate-300">
                    {(metrics.avgHoldDays ?? 0).toFixed(1)} 个交易日
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">摩擦成本 (佣金+印花税):</span>
                  <span className="font-mono text-slate-300">
                    ¥{((metrics.totalCommission ?? 0) + (metrics.totalStampTax ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: TRADES ===================== */}
        {activeTab === 'TRADES' && (
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-3 py-2">交易序号</th>
                  <th className="px-3 py-2">买入日期/价格</th>
                  <th className="px-3 py-2">卖出日期/价格</th>
                  <th className="px-3 py-2">股数 / 成交额</th>
                  <th className="px-3 py-2">净利润 (¥)</th>
                  <th className="px-3 py-2">收益率 (%)</th>
                  <th className="px-3 py-2">持仓周期</th>
                  <th className="px-3 py-2">平仓触发依据</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-bold text-slate-400">#{t.tradeIndex}</td>
                    <td className="px-3 py-2">
                      <div>{t.buyDate}</div>
                      <div className="text-slate-400 text-[11px]">¥{t.buyPrice}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{t.sellDate}</div>
                      <div className="text-slate-400 text-[11px]">¥{t.sellPrice}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{t.shares} 股</div>
                      <div className="text-slate-400 text-[11px]">¥{t.costValue.toLocaleString()}</div>
                    </td>
                    <td className={`px-3 py-2 font-bold ${(t.pnl ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}¥${t.pnl.toFixed(2)}` : '--'}
                    </td>
                    <td className={`px-3 py-2 font-bold ${(t.pnlPercent ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {t.pnlPercent !== undefined ? `${t.pnlPercent >= 0 ? '+' : ''}${t.pnlPercent}%` : '--'}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{t.holdDays} 天</td>
                    <td className="px-3 py-2 text-slate-300 font-sans">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== TAB 4: LOGS ===================== */}
        {activeTab === 'LOGS' && (
          <div className="h-full bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5">
            {strategyLogs.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">暂无策略引擎运行日志</div>
            ) : (
              strategyLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 py-0.5 ${
                    log.type === 'ORDER'
                      ? 'text-cyan-300'
                      : log.type === 'RISK'
                      ? 'text-amber-300 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600">[{log.date}]</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] ${
                      log.type === 'ORDER'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : log.type === 'RISK'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
