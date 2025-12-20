
import React from 'react';
import { ToolType, Prompt } from '../types';
import { TOOLS } from '../constants';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { RefreshCcw, Zap, Type as ToneIcon, AlignLeft, Maximize2, Send, Loader2, Copy, Check, Save, ArrowRight, AlertCircle } from 'lucide-react';

const PromptTools: React.FC<{initialTool?: ToolType}> = ({ initialTool = 'rephrase' }) => {
  const [activeTool, setActiveTool] = React.useState<ToolType>(initialTool);
  const [input, setInput] = React.useState('');
  const [outputs, setOutputs] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState('Professional');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [savedIndex, setSavedIndex] = React.useState<number | null>(null);

  const config = TOOLS[activeTool];

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsLoading(true); setError(null); setOutputs([]);
    try {
      const userPrompt = activeTool === 'tone' ? config.userPromptTemplate(input, tone) : config.userPromptTemplate(input);
      const result = await geminiService.generate(activeTool, config.systemPrompt, userPrompt);
      setOutputs(result);
    } catch (err: any) { setError(err.message || 'Processing Error'); }
    finally { setIsLoading(false); }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text); setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveToVault = (text: string, index: number) => {
    const prompts = storageService.getPrompts();
    storageService.savePrompts([...prompts, { id: crypto.randomUUID(), title: `${config.name} Variant ${index + 1}`, description: `Generated via ${config.name}`, category: 'General', content: text, createdAt: Date.now() }]);
    setSavedIndex(index); setTimeout(() => setSavedIndex(null), 3000);
  };

  const getIcon = (type: ToolType) => {
    switch (type) {
      case 'rephrase': return <RefreshCcw className="w-4 h-4" />;
      case 'improve': return <Zap className="w-4 h-4" />;
      case 'tone': return <ToneIcon className="w-4 h-4" />;
      case 'summarize': return <AlignLeft className="w-4 h-4" />;
      case 'expand': return <Maximize2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight uppercase">AI Studio</h1>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Neural Text Processing</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 border border-slate-200 overflow-hidden">
        {(Object.keys(TOOLS) as ToolType[]).map((type) => (
          <button
            key={type}
            onClick={() => { setActiveTool(type); setOutputs([]); setError(null); }}
            className={`flex flex-col items-center justify-center p-4 transition-all bg-white hover:bg-slate-50 ${
              activeTool === type ? 'ring-2 ring-inset ring-slate-950 z-10' : 'text-slate-400'
            }`}
          >
            <div className={activeTool === type ? 'text-slate-950' : ''}>
              {getIcon(type)}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${activeTool === type ? 'text-slate-950' : ''}`}>
              {TOOLS[type].name.split(' ')[1] || TOOLS[type].name}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-950 uppercase tracking-widest text-[10px] flex items-center gap-2">
              {getIcon(activeTool)}
              {config.name}
            </h3>
            {activeTool === 'tone' && (
              <select className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 text-slate-950" value={tone} onChange={(e) => setTone(e.target.value)}>
                {['Professional', 'Casual', 'Friendly', 'Creative', 'Direct'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <div className="p-6 space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="INPUT SOURCE TEXT..."
              rows={8}
              className="w-full bg-white border border-slate-200 rounded-none p-4 focus:outline-none focus:border-slate-950 resize-none font-medium text-slate-950 text-xs placeholder:text-slate-200"
            />
            <button
              onClick={handleProcess}
              disabled={isLoading || !input.trim()}
              className="w-full bg-slate-950 text-white py-3 rounded-none font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all text-[11px] active:scale-95"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>{isLoading ? 'Processing' : 'Execute Transformation'}</span>
            </button>
            {error && (
              <div className="p-3 bg-red-50 flex items-center gap-2 text-red-700 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!isLoading && outputs.length === 0 && !error && (
            <div className="bg-white border-2 border-dashed border-slate-100 p-20 text-center flex flex-col items-center justify-center">
              <p className="text-slate-300 font-bold uppercase tracking-widest text-[9px]">Awaiting Instructions</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white p-20 text-center flex flex-col items-center justify-center border border-slate-100 animate-pulse">
              <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
              <p className="text-slate-300 font-bold uppercase tracking-widest text-[8px] mt-4">Drafting variants...</p>
            </div>
          )}

          {outputs.map((output, index) => (
            <div 
              key={index} 
              className="bg-white border border-slate-200 hover:border-slate-950 transition-all animate-in slide-in-from-right-2 duration-300"
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Variant 0{index + 1}</span>
                <div className="flex gap-4">
                  <button onClick={() => handleCopy(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-950">
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => handleSaveToVault(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-950">
                    {savedIndex === index ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-950 leading-relaxed font-medium text-xs whitespace-pre-wrap">{output}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptTools;
