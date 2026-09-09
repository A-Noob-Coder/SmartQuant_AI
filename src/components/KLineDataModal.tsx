import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { KLineBar } from '../types';
import { parseCustomKLineCSV, getPresetScenarioKLine } from '../data/mockAStocks';

interface KLineDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol: string;
  stockName: string;
  currentBars: KLineBar[];
  onApplyBars: (newBars: KLineBar[], datasetName: string) => void;
}

export const KLineDataModal: React.FC<KLineDataModalProps> = ({
  isOpen,
  onClose,
  stockSymbol,
  stockName,
  currentBars,
  onApplyBars,
}) => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'UPLOAD' | 'EXPORT'>('PRESETS');
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewBars, setPreviewBars] = useState<KLineBar[] | null>(null);
  const [loadedDatasetTitle, setLoadedDatasetTitle] = useState<string>('');

  if (!isOpen) return null;

  // Preset Datasets
  const PRESET_DATASETS = [
    {
      id: 'bull-2020',
      title: 'A股典型结构性牛市 (2020-2021)',
      barsCount: 380,
      description: '白酒、新能源与核心资产主升浪趋势行情，适合测试趋势跟踪与突破策略',
      trend: 'UP',
      return: '+86.4%',
    },
    {
      id: 'bear-2022',
      title: '宽幅震荡与下行磨底 (2022-2023)',
      barsCount: 350,
      description: '多空博弈、热点轮动快、均线反复纠缠，适合检验策略风控、ATR止损与网格反转',
      trend: 'CHOPPY',
      return: '-18.2%',
    },
    {
      id: 'tech-2024',
      title: '科技成长与芯片重估 (2024-2026)',
      barsCount: 420,
      description: '半导体自主可控、AI算力催化下的高贝塔波动行情，适合动量策略与布林突破',
      trend: 'UP',
      return: '+114.5%',
    },
    {
      id: 'hft-5m',
      title: '5分钟高频日内微观行情 (高密度Bar)',
      barsCount: 240,
      description: '日内日度波动与微观撮合，适合检验高频均线、短周期RSI均值回归策略',
      trend: 'VOLATILE',
      return: '+12.6%',
    },
  ];

  // Handle CSV Upload
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const bars = parseCustomKLineCSV(text);
        setPreviewBars(bars);
        setLoadedDatasetTitle(`自定义导入: ${file.name}`);
      } catch (err: any) {
        setUploadError(err.message || '文件解析失败，请检查CSV格式');
      }
    };
    reader.onerror = () => {
      setUploadError('读取文件出错');
    };
    reader.readAsText(file);
  };

  // Export current bars to CSV
  const handleExportCSV = () => {
    const header = 'Date,Open,High,Low,Close,Volume,Amount,MA5,MA20,MACD,RSI12\n';
    const rows = currentBars.map(
      (b) =>
        `${b.date},${b.open},${b.high},${b.low},${b.close},${b.volume},${b.amount},${b.ma5 ?? ''},${b.ma20 ?? ''},${b.macd ?? ''},${b.rsi12 ?? ''}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(header + rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${stockSymbol}_KLine_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none text-slate-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>K线行情数据中心</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono">
                  {stockName} ({stockSymbol})
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                支持历史典型行情注入、自定义 CSV 数据导入与全量导出
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

        {/* Tab Navigation */}
        <div className="h-10 px-5 bg-slate-900 border-b border-slate-800 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`h-full border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'PRESETS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>历史典型行情库 (4套)</span>
          </button>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`h-full border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'UPLOAD'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>自定义 CSV / 文本导入</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`h-full border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXPORT'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出当前 K 线数据</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <div className="text-slate-400 text-[11px]">
                选择经典市场行情切片，压力测试策略在不同牛熊周期的适应能力与最大回撤表现：
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_DATASETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 bg-slate-800/60 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg flex flex-col justify-between gap-3 group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-100 text-xs">{preset.title}</span>
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            preset.trend === 'UP'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : preset.trend === 'CHOPPY'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          区间 {preset.return}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px]">
                      <span className="text-slate-400 font-mono">共 {preset.barsCount} 根 K 线 Bar</span>
                      <button
                        onClick={() => {
                          const bars = getPresetScenarioKLine(preset.id, stockSymbol);
                          onApplyBars(bars, preset.title);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors shadow-sm shadow-cyan-600/20"
                      >
                        加载此行情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
                }`}
              >
                <UploadCloud className="w-10 h-10 mx-auto text-cyan-400 mb-2 opacity-80" />
                <div className="font-semibold text-slate-200 text-sm mb-1">
                  拖拽 CSV 文件至此处，或点击浏览本地文件
                </div>
                <div className="text-[11px] text-slate-400 mb-3">
                  支持包含 Date, Open, High, Low, Close, Volume 的标准金融数据表格
                </div>

                <label className="inline-block px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-md cursor-pointer font-medium transition-colors">
                  <span>选择 CSV 文件</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {previewBars && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>解析成功: {previewBars.length} 根有效 K 线 Bar ({previewBars[0].date} ~ {previewBars[previewBars.length - 1].date})</span>
                    </div>
                    <button
                      onClick={() => {
                        onApplyBars(previewBars, loadedDatasetTitle);
                        onClose();
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow-md shadow-emerald-600/30"
                    >
                      立即应用并运行策略
                    </button>
                  </div>

                  {/* Sample table preview */}
                  <div className="border border-slate-700 rounded overflow-hidden max-h-36 overflow-y-auto">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-slate-800 text-slate-400">
                        <tr>
                          <th className="px-2 py-1">日期</th>
                          <th className="px-2 py-1">开盘</th>
                          <th className="px-2 py-1">最高</th>
                          <th className="px-2 py-1">最低</th>
                          <th className="px-2 py-1">收盘</th>
                          <th className="px-2 py-1">成交量</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {previewBars.slice(0, 5).map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-2 py-1">{b.date}</td>
                            <td className="px-2 py-1">{b.open}</td>
                            <td className="px-2 py-1 text-rose-400">{b.high}</td>
                            <td className="px-2 py-1 text-emerald-400">{b.low}</td>
                            <td className="px-2 py-1">{b.close}</td>
                            <td className="px-2 py-1">{b.volume}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT */}
          {activeTab === 'EXPORT' && (
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-xs">
                    导出 {stockName} ({stockSymbol}) 历史 K 线数据集
                  </div>
                  <div className="text-[11px] text-slate-400">
                    包含 OHLCV 核心量价、MA5/MA20、MACD、RSI12 等全套清洗后技术指标
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-700 text-xs">
                <span className="text-slate-400 font-mono">共计 {currentBars.length} 行记录</span>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition-colors shadow-md shadow-cyan-600/30"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 CSV 数据文件</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            当前数据源: {stockSymbol} | 共 {currentBars.length} 根 Bar
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
