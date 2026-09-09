import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart2,
  Calendar,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  Activity,
  Sliders,
  Database,
  Info,
} from 'lucide-react';
import { KLineBar, TimeFrame, TradeRecord } from '../types';

interface KLineChartProps {
  bars: KLineBar[];
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  changePercent: number;
  timeFrame: TimeFrame;
  onChangeTimeFrame: (tf: TimeFrame) => void;
  trades: TradeRecord[];
  onOpenDataModal?: () => void;
  highlightDate?: string;
}

export const KLineChart: React.FC<KLineChartProps> = ({
  bars,
  stockSymbol,
  stockName,
  currentPrice,
  changePercent,
  timeFrame,
  onChangeTimeFrame,
  trades,
  onOpenDataModal,
  highlightDate,
}) => {
  // Chart configurations
  const [mainOverlay, setMainOverlay] = useState<'MA' | 'BOLL' | 'NONE'>('MA');
  const [subIndicator, setSubIndicator] = useState<'VOL' | 'MACD' | 'RSI' | 'KDJ'>('MACD');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(90); // number of visible bars
  const [hoveredSignal, setHoveredSignal] = useState<{
    bar: KLineBar;
    buys: TradeRecord[];
    sells: TradeRecord[];
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sliced bars for display
  const displayBars = useMemo(() => {
    if (bars.length <= visibleCount) return bars;
    return bars.slice(bars.length - visibleCount);
  }, [bars, visibleCount]);

  // Current active bar for tooltip (hovered or last bar)
  const activeBar = useMemo(() => {
    if (hoverIndex !== null && displayBars[hoverIndex]) {
      return displayBars[hoverIndex];
    }
    return displayBars[displayBars.length - 1] || null;
  }, [hoverIndex, displayBars]);

  // Map trades to dates for signal markers overlay
  const tradeSignalsMap = useMemo(() => {
    const map: Record<string, { buys: TradeRecord[]; sells: TradeRecord[] }> = {};
    for (const trade of trades) {
      if (trade.buyDate) {
        if (!map[trade.buyDate]) map[trade.buyDate] = { buys: [], sells: [] };
        map[trade.buyDate].buys.push(trade);
      }
      if (trade.sellDate) {
        if (!map[trade.sellDate]) map[trade.sellDate] = { buys: [], sells: [] };
        map[trade.sellDate].sells.push(trade);
      }
    }
    return map;
  }, [trades]);

  // SVG dimensions
  const svgWidth = 800;
  const mainHeight = 220;
  const subHeight = 95;
  const totalHeight = mainHeight + subHeight + 30; // 345px total

  // Price range calculation for main chart
  const { minPrice, maxPrice } = useMemo(() => {
    if (displayBars.length === 0) return { minPrice: 0, maxPrice: 100 };
    let min = Infinity;
    let max = -Infinity;
    for (const b of displayBars) {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (mainOverlay === 'MA') {
        if (b.ma5 && b.ma5 < min) min = b.ma5;
        if (b.ma5 && b.ma5 > max) max = b.ma5;
        if (b.ma20 && b.ma20 < min) min = b.ma20;
        if (b.ma20 && b.ma20 > max) max = b.ma20;
      }
      if (mainOverlay === 'BOLL') {
        if (b.boll_lower && b.boll_lower < min) min = b.boll_lower;
        if (b.boll_upper && b.boll_upper > max) max = b.boll_upper;
      }
    }
    const padding = (max - min) * 0.05 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
    };
  }, [displayBars, mainOverlay]);

  // Max volume for volume subchart
  const maxVolume = useMemo(() => {
    return Math.max(...displayBars.map((b) => b.volume), 1);
  }, [displayBars]);

  // MACD range
  const { minMacd, maxMacd } = useMemo(() => {
    let min = -0.1;
    let max = 0.1;
    for (const b of displayBars) {
      if (b.dif !== undefined) {
        if (b.dif < min) min = b.dif;
        if (b.dif > max) max = b.dif;
      }
      if (b.dea !== undefined) {
        if (b.dea < min) min = b.dea;
        if (b.dea > max) max = b.dea;
      }
      if (b.macd !== undefined) {
        if (b.macd < min) min = b.macd;
        if (b.macd > max) max = b.macd;
      }
    }
    const pad = Math.max(Math.abs(min), Math.abs(max)) * 1.15 || 0.5;
    return { minMacd: -pad, maxMacd: pad };
  }, [displayBars]);

  // Coordinate conversion helpers
  const count = displayBars.length;
  const barSlotWidth = count > 0 ? svgWidth / count : 10;
  const candleBodyWidth = Math.max(2, Math.min(10, barSlotWidth * 0.65));

  const getY = (price: number) => {
    return mainHeight - ((price - minPrice) / (maxPrice - minPrice || 1)) * (mainHeight - 20) - 10;
  };

  const getSubY = (val: number, min: number, max: number) => {
    const top = mainHeight + 20;
    const h = subHeight - 15;
    return top + h - ((val - min) / (max - min || 1)) * h;
  };

  // Generate SVG Path for MA Lines
  const createPolylinePath = (accessor: (bar: KLineBar) => number | undefined) => {
    let path = '';
    displayBars.forEach((bar, i) => {
      const val = accessor(bar);
      if (val !== undefined && !isNaN(val)) {
        const x = i * barSlotWidth + barSlotWidth / 2;
        const y = getY(val);
        path += path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
    });
    return path;
  };

  const ma5Path = mainOverlay === 'MA' ? createPolylinePath((b) => b.ma5) : '';
  const ma10Path = mainOverlay === 'MA' ? createPolylinePath((b) => b.ma10) : '';
  const ma20Path = mainOverlay === 'MA' ? createPolylinePath((b) => b.ma20) : '';
  const ma60Path = mainOverlay === 'MA' ? createPolylinePath((b) => b.ma60) : '';

  // Bollinger Bands Paths
  const bollUpperPath = mainOverlay === 'BOLL' ? createPolylinePath((b) => b.boll_upper) : '';
  const bollMidPath = mainOverlay === 'BOLL' ? createPolylinePath((b) => b.boll_mid) : '';
  const bollLowerPath = mainOverlay === 'BOLL' ? createPolylinePath((b) => b.boll_lower) : '';

  // Sub-chart Paths
  const difPath =
    subIndicator === 'MACD'
      ? createPolylinePath((b) => (b.dif !== undefined ? getSubY(b.dif, minMacd, maxMacd) : undefined))
      : '';
  const deaPath =
    subIndicator === 'MACD'
      ? createPolylinePath((b) => (b.dea !== undefined ? getSubY(b.dea, minMacd, maxMacd) : undefined))
      : '';

  const rsi6Path =
    subIndicator === 'RSI'
      ? createPolylinePath((b) => (b.rsi6 !== undefined ? getSubY(b.rsi6, 0, 100) : undefined))
      : '';
  const rsi12Path =
    subIndicator === 'RSI'
      ? createPolylinePath((b) => (b.rsi12 !== undefined ? getSubY(b.rsi12, 0, 100) : undefined))
      : '';

  const kdjKPath =
    subIndicator === 'KDJ'
      ? createPolylinePath((b) => (b.kdj_k !== undefined ? getSubY(b.kdj_k, 0, 100) : undefined))
      : '';
  const kdjDPath =
    subIndicator === 'KDJ'
      ? createPolylinePath((b) => (b.kdj_d !== undefined ? getSubY(b.kdj_d, 0, 100) : undefined))
      : '';
  const kdjJPath =
    subIndicator === 'KDJ'
      ? createPolylinePath((b) => (b.kdj_j !== undefined ? getSubY(b.kdj_j, -20, 120) : undefined))
      : '';

  // Mouse Move on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || count === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const ratio = offsetX / rect.width;
    const index = Math.min(count - 1, Math.max(0, Math.floor(ratio * count)));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const isUp = changePercent >= 0;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 select-none relative">
      {/* Top Toolbar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        {/* Left: Stock info & Timeframe tabs */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-100">
            <span className="text-sm font-bold text-slate-100">{stockName}</span>
            <span className="text-[11px] font-mono text-slate-400">({stockSymbol})</span>
            <span
              className={`font-mono font-bold text-xs ${
                isUp ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ¥{currentPrice.toFixed(2)} ({isUp ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          {/* Timeframe Toggles (5m, 15m, 60m, 1D, 1W, 1M) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700 font-mono text-[11px]">
            {(['5m', '15m', '60m', '1D', '1W', '1M'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onChangeTimeFrame(tf)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  timeFrame === tf
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === '1D' ? '日K' : tf === '1W' ? '周K' : tf === '1M' ? '月K' : tf}
              </button>
            ))}
          </div>

          {/* Main Overlay toggles (MA / BOLL) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700 text-[11px]">
            <button
              onClick={() => setMainOverlay(mainOverlay === 'MA' ? 'NONE' : 'MA')}
              className={`px-2 py-0.5 rounded transition-colors ${
                mainOverlay === 'MA'
                  ? 'bg-slate-700 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MA 均线
            </button>
            <button
              onClick={() => setMainOverlay(mainOverlay === 'BOLL' ? 'NONE' : 'BOLL')}
              className={`px-2 py-0.5 rounded transition-colors ${
                mainOverlay === 'BOLL'
                  ? 'bg-slate-700 text-purple-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BOLL 布林带
            </button>
          </div>
        </div>

        {/* Right: Sub-chart switch, K-Line Data Modal & Zoom */}
        <div className="flex items-center gap-2">
          {/* Sub indicator tabs */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700 text-[11px]">
            {(['VOL', 'MACD', 'RSI', 'KDJ'] as const).map((ind) => (
              <button
                key={ind}
                onClick={() => setSubIndicator(ind)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  subIndicator === ind
                    ? 'bg-slate-700 text-slate-100 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ind === 'VOL' ? 'VOL (成交量)' : ind}
              </button>
            ))}
          </div>

          {/* Data Center / Import Modal */}
          {onOpenDataModal && (
            <button
              onClick={onOpenDataModal}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[11px] font-medium transition-colors"
              title="K线行情数据中心: 历史典型行情 / CSV导入 / 数据导出"
            >
              <Database className="w-3.5 h-3.5" />
              <span>数据中心</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setVisibleCount((c) => Math.max(30, c - 20))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="放大图表"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisibleCount((c) => Math.min(bars.length, c + 20))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="缩小图表"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bar Values Header / Tooltip Bar */}
      {activeBar && (
        <div className="px-3 py-1 bg-slate-950/60 border-b border-slate-800/40 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] font-mono text-slate-400">
          <span className="text-slate-300 font-semibold">{activeBar.date}</span>
          <span>
            开: <b className="text-slate-200">{activeBar.open.toFixed(2)}</b>
          </span>
          <span>
            高: <b className="text-rose-400">{activeBar.high.toFixed(2)}</b>
          </span>
          <span>
            低: <b className="text-emerald-400">{activeBar.low.toFixed(2)}</b>
          </span>
          <span>
            收: <b className="text-slate-100">{activeBar.close.toFixed(2)}</b>
          </span>
          <span>
            量: <b className="text-slate-200">{(activeBar.volume / 10000).toFixed(1)}万手</b>
          </span>

          {mainOverlay === 'MA' && (
            <>
              {activeBar.ma5 && <span className="text-amber-400">MA5: {activeBar.ma5}</span>}
              {activeBar.ma10 && <span className="text-cyan-400">MA10: {activeBar.ma10}</span>}
              {activeBar.ma20 && <span className="text-purple-400">MA20: {activeBar.ma20}</span>}
              {activeBar.ma60 && <span className="text-emerald-400">MA60: {activeBar.ma60}</span>}
            </>
          )}

          {mainOverlay === 'BOLL' && (
            <>
              <span className="text-purple-400">上轨: {activeBar.boll_upper ?? '--'}</span>
              <span className="text-cyan-400">中轨: {activeBar.boll_mid ?? '--'}</span>
              <span className="text-purple-400">下轨: {activeBar.boll_lower ?? '--'}</span>
            </>
          )}

          {subIndicator === 'MACD' && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">DIF: {activeBar.dif ?? 0}</span>
              <span className="text-amber-400">DEA: {activeBar.dea ?? 0}</span>
              <span className={activeBar.macd && activeBar.macd >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                MACD: {activeBar.macd ?? 0}
              </span>
            </>
          )}

          {subIndicator === 'RSI' && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">RSI(6): {activeBar.rsi6 ?? '--'}</span>
              <span className="text-cyan-400">RSI(12): {activeBar.rsi12 ?? '--'}</span>
              <span className="text-purple-400">RSI(24): {activeBar.rsi24 ?? '--'}</span>
            </>
          )}

          {subIndicator === 'KDJ' && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">K: {activeBar.kdj_k ?? '--'}</span>
              <span className="text-cyan-400">D: {activeBar.kdj_d ?? '--'}</span>
              <span className="text-purple-400">J: {activeBar.kdj_j ?? '--'}</span>
            </>
          )}

          {activeBar.signal && (
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                activeBar.signal === 'BUY'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {activeBar.signal === 'BUY' ? '🟢 策略买点' : '🔴 策略卖点'}: {activeBar.signalReason}
            </span>
          )}
        </div>
      )}

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full relative overflow-hidden bg-slate-900/90">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Grid Lines */}
          <g className="stroke-slate-800/60" strokeDasharray="3 3">
            <line x1="0" y1="30" x2={svgWidth} y2="30" />
            <line x1="0" y1={mainHeight / 2} x2={svgWidth} y2={mainHeight / 2} />
            <line x1="0" y1={mainHeight - 10} x2={svgWidth} y2={mainHeight - 10} />
            {/* Divider between Main and Sub chart */}
            <line x1="0" y1={mainHeight + 10} x2={svgWidth} y2={mainHeight + 10} strokeDasharray="none" className="stroke-slate-700" />
            {/* Sub chart grid lines */}
            <line x1="0" y1={mainHeight + 10 + subHeight / 2} x2={svgWidth} y2={mainHeight + 10 + subHeight / 2} />
          </g>

          {/* Candlesticks Rendering */}
          <g id="candlesticks">
            {displayBars.map((bar, i) => {
              const xCenter = i * barSlotWidth + barSlotWidth / 2;
              const isBarUp = bar.close >= bar.open;
              const candleColor = isBarUp ? '#f43f5e' : '#10b981'; // rose-500 : emerald-500

              const yHigh = getY(bar.high);
              const yLow = getY(bar.low);
              const yOpen = getY(bar.open);
              const yClose = getY(bar.close);

              const yTop = Math.min(yOpen, yClose);
              const yHeight = Math.max(2, Math.abs(yClose - yOpen));

              // Check for trade signal markers on this date
              const signals = tradeSignalsMap[bar.date];
              const isHighlighted = highlightDate && highlightDate === bar.date;

              return (
                <g key={bar.date}>
                  {/* Highlight bar column if clicked from dashboard */}
                  {isHighlighted && (
                    <rect
                      x={i * barSlotWidth}
                      y={0}
                      width={barSlotWidth}
                      height={totalHeight}
                      fill="#38bdf8"
                      fillOpacity="0.15"
                    />
                  )}

                  {/* Wick (High to Low) */}
                  <line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth={1.2}
                  />

                  {/* Body (Open to Close) */}
                  <rect
                    x={xCenter - candleBodyWidth / 2}
                    y={yTop}
                    width={candleBodyWidth}
                    height={yHeight}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth={0.5}
                    rx={0.5}
                  />

                  {/* Strategy BUY Signal Marker Overlay */}
                  {(signals?.buys?.length > 0 || bar.signal === 'BUY') && (
                    <g
                      transform={`translate(${xCenter}, ${yLow + 14})`}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredSignal({
                          bar,
                          buys: signals?.buys || [],
                          sells: [],
                          x: xCenter,
                          y: yLow + 14,
                        });
                      }}
                      onMouseLeave={() => setHoveredSignal(null)}
                    >
                      <circle r="7" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        买
                      </text>
                    </g>
                  )}

                  {/* Strategy SELL Signal Marker Overlay */}
                  {(signals?.sells?.length > 0 || bar.signal === 'SELL') && (
                    <g
                      transform={`translate(${xCenter}, ${yHigh - 14})`}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredSignal({
                          bar,
                          buys: [],
                          sells: signals?.sells || [],
                          x: xCenter,
                          y: yHigh - 14,
                        });
                      }}
                      onMouseLeave={() => setHoveredSignal(null)}
                    >
                      <circle r="7" fill="#f43f5e" stroke="#881337" strokeWidth="1.5" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        卖
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Moving Average Overlay Lines */}
          {mainOverlay === 'MA' && (
            <g id="ma-lines">
              {ma5Path && <path d={ma5Path} fill="none" stroke="#fbbf24" strokeWidth="1.5" />}
              {ma10Path && <path d={ma10Path} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
              {ma20Path && <path d={ma20Path} fill="none" stroke="#c084fc" strokeWidth="1.5" />}
              {ma60Path && <path d={ma60Path} fill="none" stroke="#34d399" strokeWidth="1.5" />}
            </g>
          )}

          {/* Bollinger Bands Overlay Lines */}
          {mainOverlay === 'BOLL' && (
            <g id="boll-lines">
              {bollUpperPath && <path d={bollUpperPath} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" />}
              {bollMidPath && <path d={bollMidPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
              {bollLowerPath && <path d={bollLowerPath} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" />}
            </g>
          )}

          {/* Subchart Rendering */}
          <g id="sub-chart">
            {/* 1. Volume Subchart */}
            {subIndicator === 'VOL' &&
              displayBars.map((bar, i) => {
                const xCenter = i * barSlotWidth + barSlotWidth / 2;
                const isBarUp = bar.close >= bar.open;
                const color = isBarUp ? '#f43f5e' : '#10b981';
                const h = (bar.volume / maxVolume) * (subHeight - 20);
                const y = mainHeight + 10 + subHeight - h;

                return (
                  <rect
                    key={`vol-${bar.date}`}
                    x={xCenter - candleBodyWidth / 2}
                    y={y}
                    width={candleBodyWidth}
                    height={Math.max(1, h)}
                    fill={color}
                    opacity="0.8"
                  />
                );
              })}

            {/* 2. MACD Subchart */}
            {subIndicator === 'MACD' && (
              <>
                {/* Zero line */}
                <line
                  x1="0"
                  y1={getSubY(0, minMacd, maxMacd)}
                  x2={svgWidth}
                  y2={getSubY(0, minMacd, maxMacd)}
                  stroke="#475569"
                  strokeWidth="1"
                />

                {/* MACD Histogram bars */}
                {displayBars.map((bar, i) => {
                  if (bar.macd === undefined) return null;
                  const xCenter = i * barSlotWidth + barSlotWidth / 2;
                  const yZero = getSubY(0, minMacd, maxMacd);
                  const yVal = getSubY(bar.macd, minMacd, maxMacd);
                  const isUpMacd = bar.macd >= 0;
                  const color = isUpMacd ? '#f43f5e' : '#10b981';
                  const top = Math.min(yZero, yVal);
                  const height = Math.max(1, Math.abs(yVal - yZero));

                  return (
                    <rect
                      key={`macd-bar-${bar.date}`}
                      x={xCenter - candleBodyWidth / 2}
                      y={top}
                      width={candleBodyWidth}
                      height={height}
                      fill={color}
                    />
                  );
                })}

                {/* DIF & DEA Lines */}
                {difPath && <path d={difPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
                {deaPath && <path d={deaPath} fill="none" stroke="#fbbf24" strokeWidth="1.5" />}
              </>
            )}

            {/* 3. RSI Subchart */}
            {subIndicator === 'RSI' && (
              <>
                <line x1="0" y1={getSubY(80, 0, 100)} x2={svgWidth} y2={getSubY(80, 0, 100)} stroke="#f43f5e" strokeDasharray="2 2" strokeWidth="1" />
                <line x1="0" y1={getSubY(50, 0, 100)} x2={svgWidth} y2={getSubY(50, 0, 100)} stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1={getSubY(20, 0, 100)} x2={svgWidth} y2={getSubY(20, 0, 100)} stroke="#10b981" strokeDasharray="2 2" strokeWidth="1" />

                {rsi6Path && <path d={rsi6Path} fill="none" stroke="#fbbf24" strokeWidth="1.5" />}
                {rsi12Path && <path d={rsi12Path} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
              </>
            )}

            {/* 4. KDJ Subchart */}
            {subIndicator === 'KDJ' && (
              <>
                <line x1="0" y1={getSubY(80, -20, 120)} x2={svgWidth} y2={getSubY(80, -20, 120)} stroke="#f43f5e" strokeDasharray="2 2" strokeWidth="1" />
                <line x1="0" y1={getSubY(50, -20, 120)} x2={svgWidth} y2={getSubY(50, -20, 120)} stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1={getSubY(20, -20, 120)} x2={svgWidth} y2={getSubY(20, -20, 120)} stroke="#10b981" strokeDasharray="2 2" strokeWidth="1" />

                {kdjKPath && <path d={kdjKPath} fill="none" stroke="#fbbf24" strokeWidth="1.5" />}
                {kdjDPath && <path d={kdjDPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
                {kdjJPath && <path d={kdjJPath} fill="none" stroke="#c084fc" strokeWidth="1.5" />}
              </>
            )}
          </g>

          {/* Crosshair Cursor Lines */}
          {hoverIndex !== null && hoverIndex < count && (
            <g id="crosshair">
              {/* Vertical line */}
              <line
                x1={hoverIndex * barSlotWidth + barSlotWidth / 2}
                y1={0}
                x2={hoverIndex * barSlotWidth + barSlotWidth / 2}
                y2={totalHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Horizontal line at hover bar close */}
              {displayBars[hoverIndex] && (
                <line
                  x1={0}
                  y1={getY(displayBars[hoverIndex].close)}
                  x2={svgWidth}
                  y2={getY(displayBars[hoverIndex].close)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Trade Signal Info Popover */}
        {hoveredSignal && (
          <div
            className="absolute z-30 p-2.5 bg-slate-950/95 border border-cyan-500/60 rounded-lg shadow-xl text-[11px] pointer-events-none font-mono text-slate-200 backdrop-blur-md"
            style={{
              left: `${Math.min(75, Math.max(5, (hoveredSignal.x / svgWidth) * 100))}%`,
              top: '20px',
            }}
          >
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
              <span>{hoveredSignal.bar.date} 策略执行动作</span>
            </div>
            {hoveredSignal.buys.map((b) => (
              <div key={b.id} className="text-emerald-400">
                🟢 买入: ¥{b.buyPrice} × {b.shares}股 | 原因: {b.reason}
              </div>
            ))}
            {hoveredSignal.sells.map((s) => (
              <div key={s.id} className="text-rose-400">
                🔴 卖出: ¥{s.sellPrice} | 盈亏: ¥{s.pnl ?? 0} ({s.pnlPercent ?? 0}%) | 原因: {s.reason}
              </div>
            ))}
            {!hoveredSignal.buys.length && !hoveredSignal.sells.length && hoveredSignal.bar.signal && (
              <div className="text-slate-300">
                信号: {hoveredSignal.bar.signal} | 原因: {hoveredSignal.bar.signalReason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Axis / Scale */}
      <div className="h-6 px-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>{displayBars[0]?.date || ''}</span>
        <span className="text-slate-400">
          价格区间: ¥{minPrice.toFixed(2)} - ¥{maxPrice.toFixed(2)} | 当前共 {bars.length} 根 Bar (显示后 {displayBars.length} 根)
        </span>
        <span>{displayBars[displayBars.length - 1]?.date || ''}</span>
      </div>
    </div>
  );
};
