import React, { useState } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ArrowRight,
  Send,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { AIDiagnosisResult, EvaluationMetrics } from '../types';

interface AIDiagnosisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: AIDiagnosisResult | null;
  isLoading: boolean;
  onApplyOptimizedCode: (code: string) => void;
  onReDiagnose: () => void;
  metrics: EvaluationMetrics;
}

export const AIDiagnosisPanel: React.FC<AIDiagnosisPanelProps> = ({
  isOpen,
  onClose,
  diagnosis,
  isLoading,
  onApplyOptimizedCode,
  onReDiagnose,
  metrics,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: '你好！我是 SmartQuant AI 量化架构师。我对你当前的策略回测指标和交易行为进行了全景诊断。你可以随时就风控、因子优化或参数调优向我提问！',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (diagnosis?.optimizedCode) {
      navigator.clipboard.writeText(diagnosis.optimizedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isChatLoading) return;

    const userText = inputMsg.trim();
    setInputMsg('');
    const newMessages = [...chatMessages, { role: 'user' as const, text: userText }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            metrics,
            diagnosisSummary: diagnosis?.summary,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('AI 服务响应异常');
      }

      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `抱歉，请求出现问题：${err.message || '网络异常'}。在沙盒模式下，建议关注核心回测指标如最大回撤与盈亏比。`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[540px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col select-none text-slate-200 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100">
              <span>SmartQuant AI 策略深度诊断</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded">
                Gemini 2.5 Pro
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              多维归因 · 逻辑漏洞挖掘 · 代码重构
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onReDiagnose}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="重新诊断当前策略"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="font-medium text-slate-200 text-sm">
              AI 量化架构师正在进行全景诊断...
            </div>
            <div className="text-[11px] text-slate-500 text-center max-w-xs">
              正在分析策略收益率波动、最大回撤周期、假突破频率及胜率盈亏比结构
            </div>
          </div>
        ) : diagnosis ? (() => {
          const score = diagnosis.score ?? 78;
          const trendVal = diagnosis.attribution?.trendContribution ?? (diagnosis.attribution as any)?.trend ?? 55;
          const alphaVal = diagnosis.attribution?.alphaContribution ?? (diagnosis.attribution as any)?.alpha ?? 30;
          const noiseVal = diagnosis.attribution?.noiseLoss ?? (diagnosis.attribution as any)?.market ?? 15;
          const vulnList = diagnosis.vulnerabilities || (diagnosis.flaws?.map((f: any) => ({
            issue: f.title || f.issue,
            severity: f.severity || 'medium',
            impact: f.description || f.impact,
          })) || []);
          const recList = diagnosis.recommendations || [];

          return (
          <>
            {/* 1. Summary Diagnosis Card */}
            <div className="p-3.5 rounded-lg bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  策略全景诊断结论
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    score >= 80
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : score >= 65
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  综合健康度评分: {score} 分
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {diagnosis.summary}
              </p>
            </div>

            {/* 2. Performance Attribution (归因分析) */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                收益与风险归因 (Attribution Breakdown)
              </span>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">大盘趋势 Beta 贡献</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {trendVal}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${trendVal}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">选股/择时 Alpha 超额贡献</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {alphaVal}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${alphaVal}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">市场噪音与摩擦损耗</span>
                    <span className="font-mono font-semibold text-amber-400">
                      {noiseVal}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${noiseVal}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Vulnerabilities & Code Pitfalls */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                识别出的逻辑缺陷与风控盲区 ({vulnList.length})
              </span>

              <div className="space-y-2">
                {vulnList.map((v: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{v.issue}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          v.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : v.severity === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {v.severity} 风险
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{v.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Actionable Optimization Recommendations */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                AI 优化建议与改进方向
              </span>

              <ul className="space-y-1.5 list-disc pl-4 text-slate-300 text-xs">
                {recList.map((rec: string, i: number) => (
                  <li key={i} className="leading-relaxed">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. Refactored Python Code & 1-Click Apply */}
            {diagnosis.optimizedCode && (
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-emerald-500/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    AI 深度优化重构后的策略代码
                  </span>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制代码'}</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-300 leading-normal">
                  <pre>{diagnosis.optimizedCode}</pre>
                </div>

                {/* 1-Click Apply Button */}
                <button
                  onClick={() => onApplyOptimizedCode(diagnosis.optimizedCode!)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>一键应用优化代码并重新回测</span>
                </button>
              </div>
            )}

            {/* 6. Interactive AI Quant Chat */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
              <span className="font-semibold text-slate-200 text-xs">
                向 AI 量化架构师追问
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-900/80 rounded border border-slate-800/80">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-xs ${
                      msg.role === 'assistant'
                        ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                        : 'bg-indigo-950/50 text-indigo-200 border border-indigo-500/30 ml-4'
                    }`}
                  >
                    <div className="font-semibold text-[10px] text-slate-400 mb-0.5">
                      {msg.role === 'assistant' ? 'SmartQuant AI' : '我的提问'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="例如: 如何在开盘前加入集合竞价过滤?"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputMsg.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
          );
        })() : (
          <div className="py-20 text-center text-slate-500">
            暂无诊断结果，请点击顶部按钮运行 AI 策略诊断。
          </div>
        )}
      </div>
    </div>
  );
};
