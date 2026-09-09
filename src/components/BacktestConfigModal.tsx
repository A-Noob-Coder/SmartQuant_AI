import React, { useState } from 'react';
import {
  Settings,
  X,
  Calendar,
  DollarSign,
  Percent,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { BacktestConfig } from '../types';

interface BacktestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BacktestConfig;
  onSaveConfig: (newConfig: BacktestConfig) => void;
}

export const BacktestConfigModal: React.FC<BacktestConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<BacktestConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none text-slate-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">
                回测环境与撮合规则配置
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                模拟盘撮合逻辑与 A 股规费标准
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Initial Capital */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium">初始本金 (元)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
              <input
                type="number"
                value={formData.initialCapital}
                onChange={(e) =>
                  setFormData({ ...formData, initialCapital: Number(e.target.value) })
                }
                step={10000}
                min={10000}
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Date Ranges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-medium">回测起始日期</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-medium">回测结束日期</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Match Price Scheme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium">撮合成交基准价</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, matchPrice: 'next_open' })}
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-colors ${
                  formData.matchPrice === 'next_open'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-semibold text-xs">下一 Bar 开盘价 (推荐)</span>
                <span className="text-[10px] text-slate-400">更贴近真实实盘，避免未来函数</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, matchPrice: 'current_close' })}
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-colors ${
                  formData.matchPrice === 'current_close'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-semibold text-xs">当前 Bar 收盘价</span>
                <span className="text-[10px] text-slate-400">信号产生当天收盘立即撮合成交</span>
              </button>
            </div>
          </div>

          {/* Fees & Slippage */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px]">印花税 (卖出)</label>
              <input
                type="number"
                step={0.0001}
                value={formData.stampTax}
                onChange={(e) => setFormData({ ...formData, stampTax: Number(e.target.value) })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500">A股标准 0.05%</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px]">佣金手续费 (双向)</label>
              <input
                type="number"
                step={0.0001}
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500">万2.5 (最低5元)</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px]">模拟滑点 (双向)</label>
              <input
                type="number"
                step={0.0001}
                value={formData.slippage}
                onChange={(e) => setFormData({ ...formData, slippage: Number(e.target.value) })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500">冲击成本 0.05%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存并应用</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
