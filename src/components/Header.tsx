import React from 'react';
import {
  Play,
  Sparkles,
  Sliders,
  Radio,
  Settings,
  TrendingUp,
  Cpu,
  Layers,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { Strategy, BacktestConfig } from '../types';

interface HeaderProps {
  strategies: Strategy[];
  currentStrategy: Strategy;
  onSelectStrategy: (strat: Strategy) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
  onOpenAIDiagnosis: () => void;
  onOpenParamMining: () => void;
  onOpenConfigModal: () => void;
  isLiveFeedActive: boolean;
  onToggleLiveFeed: () => void;
  config: BacktestConfig;
}

export const Header: React.FC<HeaderProps> = ({
  strategies,
  currentStrategy,
  onSelectStrategy,
  onRunBacktest,
  isRunning,
  onOpenAIDiagnosis,
  onOpenParamMining,
  onOpenConfigModal,
  isLiveFeedActive,
  onToggleLiveFeed,
  config,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none text-slate-100 z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SmartQuant
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                AI MVP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>量化策略工作台</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-500"></span>
              <span>A股真实数据撮合</span>
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block"></div>

        {/* Strategy Selector Dropdown */}
        <div className="relative group hidden sm:block">
          <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-md px-3 py-1.5 text-xs transition-colors cursor-pointer">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">策略:</span>
            <span className="font-medium text-slate-200 max-w-[150px] truncate">
              {currentStrategy.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:rotate-180" />
          </div>

          <div className="absolute left-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl shadow-black/50 py-1.5 z-50 hidden group-hover:block transition-all animate-in fade-in slide-in-from-top-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              预置标准策略库
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {strategies.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => onSelectStrategy(strat)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800/90 transition-colors flex flex-col gap-0.5 ${
                    strat.id === currentStrategy.id ? 'bg-cyan-950/40 text-cyan-300' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{strat.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {strat.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">
                    {strat.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center status: Live Feed & Date Range */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        {/* Real-time simulated tick streamer */}
        <button
          onClick={onToggleLiveFeed}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
            isLiveFeedActive
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="点击开启/暂停实时模拟行情Tick波动推送"
        >
          <Radio className={`w-3 h-3 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : ''}`} />
          <span className="font-mono text-[11px]">
            {isLiveFeedActive ? '实时行情推送中 (0.8s)' : '行情推送已暂停'}
          </span>
        </button>

        {/* Date & Capital badge */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded text-[11px] text-slate-300 font-mono">
          <span>{config.startDate} ~ {config.endDate}</span>
          <span className="text-slate-500">|</span>
          <span>本金: ¥{(config.initialCapital / 10000).toFixed(0)}万</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">基准: 沪深300</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Config Modal Button */}
        <button
          onClick={onOpenConfigModal}
          className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="回测与撮合参数配置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Parameter Mining Button */}
        <button
          onClick={onOpenParamMining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/60 text-xs font-medium transition-all shadow-sm shadow-cyan-950/20"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>参数网格挖掘</span>
        </button>

        {/* AI Diagnosis Assistant Button */}
        <button
          onClick={onOpenAIDiagnosis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 animate-pulse hover:animate-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI 策略诊断</span>
        </button>

        {/* Run Backtest / Paper Trading Button */}
        <button
          onClick={onRunBacktest}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>正在撮合回测...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>运行模拟盘</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
