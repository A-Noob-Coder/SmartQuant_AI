import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Code,
  Copy,
  RotateCcw,
  Sparkles,
  Check,
  FileCode,
  Info,
  BookOpen,
} from 'lucide-react';
import { Strategy } from '../types';

interface StrategyEditorProps {
  strategy: Strategy;
  code: string;
  onChangeCode: (newCode: string) => void;
  onResetCode: () => void;
  onApplyPresetSnippet: (snippetCode: string) => void;
  onOpenAIDiagnosis?: () => void;
  hasAIOptimization?: boolean;
}

export const StrategyEditor: React.FC<StrategyEditorProps> = ({
  strategy,
  code,
  onChangeCode,
  onResetCode,
  onApplyPresetSnippet,
  onOpenAIDiagnosis,
  hasAIOptimization,
}) => {
  const [copied, setCopied] = React.useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme for Monaco
    monaco.editor.defineTheme('quant-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#0f172a', // slate-900
        'editor.lineHighlightBackground': '#1e293b55',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editor.selectionBackground': '#0284c744',
      },
    });
    monaco.editor.setTheme('quant-dark');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Editor Header Bar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-100 font-mono">strategy.py</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Python 3.10 沙盒
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            标的: {strategy.stockSymbol}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* AI Diagnosis & Optimize trigger */}
          {onOpenAIDiagnosis && (
            <button
              onClick={onOpenAIDiagnosis}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded text-[11px] font-semibold transition-all shadow-sm shadow-purple-600/30 active:scale-95"
              title="使用 Gemini AI 深度诊断当前策略逻辑并生成优化代码"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>AI 诊断优化</span>
              {hasAIOptimization && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          )}

          {/* Format button */}
          <button
            onClick={handleFormat}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 transition-colors"
            title="格式化 Python 代码"
          >
            格式化
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 transition-colors"
            title="复制代码到剪贴板"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>复制</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetCode}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            title="恢复策略为初始代码"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full overflow-hidden bg-slate-900">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(val) => onChangeCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            folding: true,
            glyphMargin: false,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Python Quant API Cheatsheet / Status Footer */}
      <div className="h-7 px-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            API:
          </span>
          <span className="text-slate-300">initialize(context)</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">handle_data(context, data)</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">data.history()</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">order_target_percent()</span>
        </div>
        <div className="text-slate-500">
          按 Ctrl+S / 运行模拟盘即可实时撮合
        </div>
      </div>
    </div>
  );
};
