import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Stock } from '../types';

interface WatchlistPanelProps {
  stocks: Stock[];
  selectedStock: Stock;
  onSelectStock: (stock: Stock) => void;
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
  onSetStrategyStock: (symbol: string) => void;
  strategyStockSymbol: string;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  watchlistSymbols,
  onToggleWatchlist,
  onSetStrategyStock,
  strategyStockSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('全部');

  const groups = ['全部', '自选', '白酒消费', '科技芯片', '新能源', '金融地产'];

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // Group filter
      if (selectedGroup === '自选') {
        if (!watchlistSymbols.includes(stock.symbol)) return false;
      } else if (selectedGroup !== '全部') {
        if (stock.group !== selectedGroup) return false;
      }

      // Search filter (code or name or symbol)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = stock.code.toLowerCase().includes(q);
        const matchName = stock.name.toLowerCase().includes(q);
        const matchSymbol = stock.symbol.toLowerCase().includes(q);
        return matchCode || matchName || matchSymbol;
      }

      return true;
    });
  }, [stocks, selectedGroup, searchQuery, watchlistSymbols]);

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none text-slate-200">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索股票代码 / 名称 (如 600519)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 focus:border-cyan-500 rounded text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200"
            >
              清空
            </button>
          )}
        </div>

        {/* Grouping Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {groups.map((group) => {
            const isSelected = selectedGroup === group;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-300 border border-transparent'
                }`}
              >
                {group === '自选' ? (
                  <span className="flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    自选 ({watchlistSymbols.length})
                  </span>
                ) : (
                  group
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stocks List Header */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>标的代码 / 名称</span>
        <div className="flex items-center gap-6">
          <span>最新价</span>
          <span className="w-12 text-right">涨跌幅</span>
        </div>
      </div>

      {/* Stock Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            无匹配股票，请尝试搜索其他代码或名称
          </div>
        ) : (
          filteredStocks.map((stock) => {
            const isSelected = selectedStock.symbol === stock.symbol;
            const isStrategyTarget = strategyStockSymbol === stock.symbol;
            const isStarred = watchlistSymbols.includes(stock.symbol);
            const isUp = stock.changePercent >= 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className={`px-3 py-2.5 hover:bg-slate-800/60 cursor-pointer transition-colors relative group ${
                  isSelected ? 'bg-slate-800/90' : ''
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r"></div>
                )}

                <div className="flex items-start justify-between">
                  {/* Left: Code, Name, Strategy Tag */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(stock.symbol);
                      }}
                      className="text-slate-500 hover:text-amber-400 transition-colors"
                      title={isStarred ? '从自选股移除' : '添加至自选股'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-100">
                          {stock.name}
                        </span>
                        {isStrategyTarget && (
                          <span className="px-1 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
                            策略标的
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <span>{stock.code}</span>
                        <span className="text-[10px] text-slate-500">· {stock.group}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price, Change%, Mini Sparkline */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          isUp ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        ¥{stock.currentPrice.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${
                          isUp ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Change Badge */}
                    <div
                      className={`w-14 py-1 text-center rounded text-[11px] font-mono font-semibold ${
                        isUp
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Sub details: Volume, Amount, PE */}
                <div className="mt-1.5 pt-1 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>量: {(stock.volume / 10000).toFixed(1)}万手</span>
                  <span>额: {stock.amount.toFixed(1)}亿</span>
                  <span>PE: {stock.pe}</span>

                  {/* Quick set as strategy stock button */}
                  {!isStrategyTarget && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetStrategyStock(stock.symbol);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-sans"
                    >
                      <span>设为策略</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>全市场标的监控: {stocks.length} 只</span>
        <span className="font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          行情撮合运行中
        </span>
      </div>
    </div>
  );
};
