import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  FastForward,
  Zap,
  Activity,
} from 'lucide-react';
import { SimulationState } from '../types';

export interface StrategyReplayBarProps {
  simulationState?: SimulationState;
  currentIndex?: number;
  totalBars: number;
  isPlaying?: boolean;
  speed?: number;
  onTogglePlay?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
  onSeek?: (barIndex: number) => void;
  onInstantRun?: () => void;
  currentBarDate?: string;
  currentDate?: string;
  currentPrice?: number;
}

export const StrategyReplayBar: React.FC<StrategyReplayBarProps> = ({
  simulationState,
  currentIndex,
  totalBars = 0,
  isPlaying: propIsPlaying,
  speed: propSpeed,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
  onSeek,
  onInstantRun,
  currentBarDate,
  currentDate,
  currentPrice,
}) => {
  // Gracefully fallback whether props are passed via simulationState object or individual props
  const isPlaying = propIsPlaying ?? simulationState?.isPlaying ?? false;
  const currentBarIndex = currentIndex ?? simulationState?.currentBarIndex ?? Math.max(0, totalBars - 1);
  const speed = propSpeed ?? simulationState?.speed ?? 1;

  const displayDate = currentBarDate || currentDate || '';

  return (
    <div
      id="strategy-replay-bar"
      className="h-10 px-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs select-none gap-2"
    >
      {/* Left: Replay Mode Controls */}
      <div className="flex items-center gap-1.5">
        {/* Play/Pause */}
        {onTogglePlay && (
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold text-xs transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
            title={isPlaying ? '暂停模拟回放' : '开始逐Bar动态行情回放与信号决策'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>暂停</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentBarIndex >= totalBars - 1 ? '重新回放' : '动态回放'}</span>
              </>
            )}
          </button>
        )}

        {/* Step Backward */}
        {onStepBackward && (
          <button
            onClick={onStepBackward}
            disabled={isPlaying || currentBarIndex <= 0}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 rounded border border-slate-700 transition-colors"
            title="单步后退 -1 Bar"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Step Forward */}
        {onStepForward && (
          <button
            onClick={onStepForward}
            disabled={isPlaying || currentBarIndex >= totalBars - 1}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 rounded border border-slate-700 transition-colors"
            title="单步推进 +1 Bar"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">步进</span>
          </button>
        )}

        {/* Reset */}
        {onReset && (
          <button
            onClick={onReset}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="复位至全量Bar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Speed Selector */}
        {onSpeedChange && (
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px] font-mono ml-1">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  speed === s
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Timeline Progress Scrubber */}
      <div className="flex-1 max-w-xl flex items-center gap-2 px-2">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalBars - 1)}
          value={currentBarIndex}
          onChange={(e) => onSeek && onSeek(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap flex items-center gap-1.5">
          <span className="text-cyan-400 font-medium">
            Bar {Math.min(currentBarIndex + 1, totalBars)}/{totalBars}
          </span>
          {displayDate && (
            <span className="text-slate-300 border-l border-slate-800 pl-1.5">{displayDate}</span>
          )}
          {currentPrice !== undefined && (
            <span className="text-slate-200 font-semibold">¥{currentPrice.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Right: Quick Full Run & Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          ></span>
          <span className="hidden md:inline font-mono">
            {isPlaying ? '动态回放中...' : '回测就绪'}
          </span>
        </div>

        {onInstantRun && (
          <button
            onClick={onInstantRun}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-colors shadow-sm shadow-cyan-600/20"
            title="跳过逐帧动画，以全速执行全量回测"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>秒级全量</span>
          </button>
        )}
      </div>
    </div>
  );
};
