import React, { useState } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  Play,
  TrendingUp,
  Award,
  Zap,
  Activity,
  Check,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { BacktestConfig, GridSearchCell, GridSearchResult } from '../types';
import { QuantEngine } from '../services/quantEngine';

interface ParameterMiningModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  stockSymbol: string;
  config: BacktestConfig;
  onApplyBestParams: (param1: number, param2: number) => void;
}

export const ParameterMiningModal: React.FC<ParameterMiningModalProps> = ({
  isOpen,
  onClose,
  code,
  stockSymbol,
  config,
  onApplyBestParams,
}) => {
  const [viewMetric, setViewMetric] = useState<
    'ACTION_QUALITY' | 'SHARPE' | 'RETURN' | 'MAX_DD' | 'WIN_RATE' | 'FRICTION_RATIO' | 'TOTAL_TRADES'
  >('ACTION_QUALITY');
  const [result, setResult] = useState<GridSearchResult | null>(null);
  const [selectedCell, setSelectedCell] = useState<GridSearchCell | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunMining = () => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const tunable = QuantEngine.getTunableParams(code);
        const gridRes = QuantEngine.runGridSearch(
          code,
          stockSymbol,
          config,
          tunable.param1Name,
          tunable.param1Label,
          tunable.param1Values,
          tunable.param2Name,
          tunable.param2Label,
          tunable.param2Values
        );
        setResult(gridRes);
        setSelectedCell(gridRes.bestActionQualityCell || gridRes.bestSharpeCell || gridRes.bestCell);
      } catch (e) {
        console.error(e);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  };

  // Helper to determine action quality label
  const getActionProfileLabel = (cell: GridSearchCell) => {
    const score = cell.actionQualityScore ?? 60;
    const trades = cell.totalTrades ?? 0;
    const friction = cell.frictionRatio ?? 10;

    if (cell.isOverfittingPeak) return { text: '⚠️ 孤立过拟合尖峰 (动作不稳健)', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' };
    if (cell.isRobustPlateau) return { text: '🏔️ 稳健高原区 (动作容错度极高)', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' };
    if (score >= 85) return { text: '⭐️⭐️⭐️⭐️ 优质波段动作 (高盈亏比·低摩擦)', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/40' };
    if (trades > 35 && friction > 20) return { text: '⚠️ 频繁假突破磨损 (过度交易)', color: 'text-rose-400 bg-rose-950/40 border-rose-500/40' };
    if (trades < 4) return { text: '💤 动作休眠型 (交易样本较少)', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    return { text: '⚖️ 表现均衡型', color: 'text-slate-300 bg-slate-800 border-slate-700' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none text-slate-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>基于历史动作质量的参数网格挖掘 (Action-Driven Parameter Mining)</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded font-mono">
                  动作画像 · 高原区识别
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                结合历史买卖动作频次、假突破磨损度、ATR止损拦截与盈亏比进行深度挖掘
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Controls Bar */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">网格热力图指标:</span>
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded border border-slate-700">
                <button
                  onClick={() => setViewMetric('ACTION_QUALITY')}
                  className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                    viewMetric === 'ACTION_QUALITY'
                      ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="综合考量胜率、盈亏比、最大回撤与低摩擦磨损"
                >
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>动作质量评分</span>
                </button>
                <button
                  onClick={() => setViewMetric('SHARPE')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'SHARPE'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  夏普比率
                </button>
                <button
                  onClick={() => setViewMetric('RETURN')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'RETURN'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  累计收益
                </button>
                <button
                  onClick={() => setViewMetric('MAX_DD')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'MAX_DD'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  最大回撤
                </button>
                <button
                  onClick={() => setViewMetric('WIN_RATE')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'WIN_RATE'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  胜率
                </button>
                <button
                  onClick={() => setViewMetric('FRICTION_RATIO')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'FRICTION_RATIO'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="交易摩擦与规费占收益比例"
                >
                  规费摩擦比
                </button>
                <button
                  onClick={() => setViewMetric('TOTAL_TRADES')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    viewMetric === 'TOTAL_TRADES'
                      ? 'bg-slate-700 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  动作频次
                </button>
              </div>
            </div>

            <button
              onClick={handleRunMining}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>正在穷举撮合 25 组历史动作...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>开始动作网格挖掘</span>
                </>
              )}
            </button>
          </div>

          {/* Grid Search Results Table / Matrix */}
          {result ? (
            <div className="flex flex-col gap-4">
              {/* Matrix Heatmap & Legend */}
              <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>纵轴: 短期均线周期 × 横轴: 长期均线周期 (点击任意单元格可查看历史动作特征)</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-cyan-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 动作质量最优
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 稳健高原区
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> 孤立过拟合尖峰
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse font-mono text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 border border-slate-800 bg-slate-900 text-slate-400 text-[11px]">
                          Short \ Long
                        </th>
                        {result.param2Values.map((p2) => (
                          <th
                            key={p2}
                            className="p-2 border border-slate-800 bg-slate-900 text-slate-300 font-bold"
                          >
                            MA {p2}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.matrix.map((row, i) => (
                        <tr key={i}>
                          <td className="p-2 border border-slate-800 bg-slate-900 text-slate-300 font-bold">
                            MA {result.param1Values[i]}
                          </td>
                          {row.map((cell, j) => {
                            const isSelected =
                              selectedCell &&
                              selectedCell.param1 === cell.param1 &&
                              selectedCell.param2 === cell.param2;
                            const isBestReturn =
                              cell.param1 === result.bestCell.param1 &&
                              cell.param2 === result.bestCell.param2;
                            const isBestSharpe =
                              cell.param1 === result.bestSharpeCell.param1 &&
                              cell.param2 === result.bestSharpeCell.param2;
                            const isBestAction =
                              result.bestActionQualityCell &&
                              cell.param1 === result.bestActionQualityCell.param1 &&
                              cell.param2 === result.bestActionQualityCell.param2;

                            let displayVal = '';
                            if (viewMetric === 'ACTION_QUALITY') displayVal = `${cell.actionQualityScore ?? 60} 分`;
                            if (viewMetric === 'RETURN') displayVal = `${cell.cumulativeReturn >= 0 ? '+' : ''}${cell.cumulativeReturn}%`;
                            if (viewMetric === 'SHARPE') displayVal = `${cell.sharpeRatio.toFixed(2)}`;
                            if (viewMetric === 'MAX_DD') displayVal = `-${cell.maxDrawdown}%`;
                            if (viewMetric === 'WIN_RATE') displayVal = `${cell.winRate}%`;
                            if (viewMetric === 'FRICTION_RATIO') displayVal = `${cell.frictionRatio ?? 0}%`;
                            if (viewMetric === 'TOTAL_TRADES') displayVal = `${cell.totalTrades} 次`;

                            return (
                              <td
                                key={j}
                                onClick={() => setSelectedCell(cell)}
                                className={`p-2.5 border border-slate-800 transition-all relative cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-cyan-400 bg-cyan-950/60 z-10'
                                    : cell.cumulativeReturn > 0
                                    ? 'bg-slate-900 hover:bg-slate-800'
                                    : 'bg-slate-950/60 hover:bg-slate-900'
                                }`}
                              >
                                <div
                                  className={`font-bold text-sm ${
                                    viewMetric === 'ACTION_QUALITY'
                                      ? (cell.actionQualityScore ?? 0) >= 80
                                        ? 'text-cyan-300'
                                        : (cell.actionQualityScore ?? 0) >= 65
                                        ? 'text-emerald-300'
                                        : 'text-amber-400'
                                      : cell.cumulativeReturn > 0
                                      ? 'text-rose-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {displayVal}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {cell.totalTrades}动作 | S:{cell.sharpeRatio.toFixed(2)}
                                </div>

                                {/* Floating badges */}
                                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                                  {isBestAction && (
                                    <span className="px-1 text-[8px] bg-cyan-500 text-slate-950 font-bold rounded shadow">
                                      动作最优
                                    </span>
                                  )}
                                  {!isBestAction && isBestSharpe && (
                                    <span className="px-1 text-[8px] bg-indigo-500 text-white font-bold rounded shadow">
                                      夏普最佳
                                    </span>
                                  )}
                                  {cell.isRobustPlateau && (
                                    <span className="px-1 text-[8px] bg-emerald-500/80 text-black font-bold rounded">
                                      高原
                                    </span>
                                  )}
                                  {cell.isOverfittingPeak && (
                                    <span className="px-1 text-[8px] bg-amber-500/80 text-black font-bold rounded">
                                      尖峰
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Cell Action Profile Breakdown */}
              {selectedCell && (() => {
                const profile = getActionProfileLabel(selectedCell);
                return (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">
                            当前选中参数组合: MA {selectedCell.param1} / MA {selectedCell.param2}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${profile.color}`}>
                            {profile.text}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onApplyBestParams(selectedCell.param1, selectedCell.param2);
                          onClose();
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-md flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-transform active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                        <span>应用此参数到策略代码并回测</span>
                      </button>
                    </div>

                    {/* Historical Action Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono">
                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">累计收益率</div>
                        <div className={`text-sm font-bold ${selectedCell.cumulativeReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {selectedCell.cumulativeReturn >= 0 ? '+' : ''}{selectedCell.cumulativeReturn}%
                        </div>
                        <div className="text-[10px] text-slate-500">年化: {selectedCell.annualizedReturn}%</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">夏普比率 (Sharpe)</div>
                        <div className="text-sm font-bold text-cyan-300">{selectedCell.sharpeRatio.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">最大回撤: -{selectedCell.maxDrawdown}%</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">动作总频次 / 胜率</div>
                        <div className="text-sm font-bold text-slate-200">
                          {selectedCell.totalTrades} 次 / {selectedCell.winRate}%
                        </div>
                        <div className="text-[10px] text-slate-500">盈亏比: {selectedCell.profitLossRatio ?? 1.8}</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">买入/卖出/止损动作</div>
                        <div className="text-sm font-bold text-slate-200">
                          {selectedCell.buyActionCount ?? Math.ceil(selectedCell.totalTrades / 2)} / {selectedCell.sellActionCount ?? Math.floor(selectedCell.totalTrades / 2)}
                        </div>
                        <div className="text-[10px] text-amber-400">止损触发: {selectedCell.stopLossActionCount ?? 0} 次</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">平均单笔持仓</div>
                        <div className="text-sm font-bold text-slate-200">{selectedCell.avgHoldDays ?? 12} 天</div>
                        <div className="text-[10px] text-slate-500">波段节奏良好</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 font-sans">规费摩擦与损耗</div>
                        <div className="text-sm font-bold text-slate-200">¥{(selectedCell.totalFrictionCost ?? 1200).toLocaleString()}</div>
                        <div className={`text-[10px] ${(selectedCell.frictionRatio ?? 10) > 20 ? 'text-rose-400' : 'text-slate-500'}`}>
                          摩擦率: {selectedCell.frictionRatio ?? 8.5}%
                        </div>
                      </div>
                    </div>

                    {/* Action Sample Sequence */}
                    {selectedCell.actionSample && selectedCell.actionSample.length > 0 && (
                      <div className="mt-1">
                        <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5 font-sans">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>该参数下策略核心动作切片样例 (Sample Action Sequence)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
                          {selectedCell.actionSample.slice(0, 6).map((act, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">{act.date}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    act.actionType === 'BUY'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : act.actionType === 'STOP_LOSS'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {act.actionType === 'BUY' ? '买入开仓' : act.actionType === 'STOP_LOSS' ? 'ATR止损' : '平仓止盈'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>成交价: ¥{act.price.toFixed(2)}</span>
                                {act.pnl !== undefined && (
                                  <span className={act.pnl >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                    {act.pnl >= 0 ? '+' : ''}¥{act.pnl.toFixed(0)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans truncate" title={act.reason}>
                                {act.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Multi-Objective Recommendation Quick Picks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.bestActionQualityCell && (
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>动作质量最优解: MA {result.bestActionQualityCell.param1} / MA {result.bestActionQualityCell.param2}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
                        评分: <b className="text-cyan-400">{result.bestActionQualityCell.actionQualityScore}分</b> | 收益: <b className="text-rose-400">+{result.bestActionQualityCell.cumulativeReturn}%</b> | 夏普: <b className="text-cyan-400">{result.bestActionQualityCell.sharpeRatio.toFixed(2)}</b>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onApplyBestParams(result.bestActionQualityCell!.param1, result.bestActionQualityCell!.param2);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                    >
                      应用
                    </button>
                  </div>
                )}

                {result.bestSharpeCell && (
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-indigo-400" />
                        <span>夏普前沿最高: MA {result.bestSharpeCell.param1} / MA {result.bestSharpeCell.param2}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
                        夏普: <b className="text-indigo-300">{result.bestSharpeCell.sharpeRatio.toFixed(2)}</b> | 回撤: <b className="text-amber-400">-{result.bestSharpeCell.maxDrawdown}%</b> | 胜率: {result.bestSharpeCell.winRate}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onApplyBestParams(result.bestSharpeCell.param1, result.bestSharpeCell.param2);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                    >
                      应用
                    </button>
                  </div>
                )}

                {result.minFrictionCell && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>最低摩擦稳健解: MA {result.minFrictionCell.param1} / MA {result.minFrictionCell.param2}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
                        摩擦率: <b className="text-emerald-400">{result.minFrictionCell.frictionRatio}%</b> | 持仓: {result.minFrictionCell.avgHoldDays}天 | 收益: +{result.minFrictionCell.cumulativeReturn}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onApplyBestParams(result.minFrictionCell!.param1, result.minFrictionCell!.param2);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      应用
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Sliders className="w-8 h-8 text-slate-600" />
              <div className="font-medium text-slate-300">点击右上角【开始动作网格挖掘】启动自动化回测</div>
              <div className="text-xs text-slate-500 max-w-md">
                系统将为 25 组均线搭配穷举历史回测，深度提取每一组参数的买卖动作序列、假突破摩擦磨损率、持仓周期与稳健高原区。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

