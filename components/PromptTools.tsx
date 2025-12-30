
import React from 'react';
import { ToolType, Prompt } from '../types';
import { TOOLS } from '../constants';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { RefreshCcw, Zap, Type as ToneIcon, AlignLeft, Maximize2, Send, Loader2, Copy, Check, Save, ArrowRight, AlertCircle, Terminal, RotateCcw, FileText } from 'lucide-react';

const PromptTools: React.FC<{initialTool?: ToolType}> = ({ initialTool = 'rephrase' }) => {
  const [activeTool, setActiveTool] = React.useState<ToolType>(initialTool);
  const [input, setInput] = React.useState('');
  const [systemPrompt, setSystemPrompt] = React.useState('');
  const [outputs, setOutputs] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState('Professional');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [savedIndex, setSavedIndex] = React.useState<number | null>(null);

  const config = TOOLS[activeTool];

  // Initialize and sync system prompt when tool changes
  React.useEffect(() => {
    const settings = storageService.getSettings();
    const currentInstruction = settings.customInstructions?.[activeTool] || config.systemPrompt;
    setSystemPrompt(currentInstruction);
    setOutputs([]);
    setError(null);
  }, [activeTool, config.systemPrompt]);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsLoading(true); setError(null); setOutputs([]);
    try {
      const userPrompt = activeTool === 'tone' ? config.userPromptTemplate(input, tone) : config.userPromptTemplate(input);
      // Use the local systemPrompt state which might have been edited by the user
      const result = await aiService.generate(activeTool, systemPrompt, userPrompt);
      setOutputs(result);
    } catch (err: any) { 
      setError(err.message || 'Processing Error'); 
    }
    finally { setIsLoading(false); }
  };

  const handleResetSystemPrompt = () => {
    setSystemPrompt(config.systemPrompt);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text); setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveToVault = (text: string, index: number) => {
    const prompts = storageService.getPrompts();
    const isDuplicate = prompts.some(p => p.content.trim() === text.trim());
    if (isDuplicate) {
      alert('This variant is already saved in your vault.');
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString([], { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    });

    const newPrompt: Prompt = { 
      id: crypto.randomUUID(), 
      title: `${config.name.split(' ')[1]} Var ${index + 1} (${timestamp})`, 
      description: `Source: "${input.substring(0, 40).replace(/\n/g, ' ')}..."`, 
      category: 'General', 
      content: text, 
      createdAt: now.getTime() 
    };

    storageService.savePrompts([...prompts, newPrompt]);
    setSavedIndex(index); 
    setTimeout(() => setSavedIndex(null), 3000);
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
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight uppercase">AI Studio</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Transformation Environment</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {(Object.keys(TOOLS) as ToolType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTool(type)}
            className={`flex flex-col items-center justify-center p-4 transition-all bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 ${
              activeTool === type ? 'ring-2 ring-inset ring-slate-950 dark:ring-white z-10' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <div className={activeTool === type ? 'text-slate-950 dark:text-white' : ''}>
              {getIcon(type)}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${activeTool === type ? 'text-slate-950 dark:text-white' : ''}`}>
              {TOOLS[type].name.split(' ')[1] || TOOLS[type].name}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          {/* Tool Card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-950 dark:text-white uppercase tracking-widest text-[10px] flex items-center gap-2">
                {getIcon(activeTool)}
                {config.name}
              </h3>
              {activeTool === 'tone' && (
                <select className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white text-slate-950 dark:text-white" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {['Professional', 'Casual', 'Friendly', 'Creative', 'Direct'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              {/* System Prompt Input */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Terminal className="w-3 h-3" />
                    <label className="text-[8px] font-bold uppercase tracking-widest">Logic Core (System Instruction)</label>
                  </div>
                  <button 
                    onClick={handleResetSystemPrompt}
                    className="text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset Default
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="DEFINE NEURAL BEHAVIOR..."
                    rows={3}
                    className="w-full bg-slate-900 dark:bg-black border border-slate-800 dark:border-slate-900 rounded-none p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none font-mono text-[9px] text-slate-300 dark:text-slate-400 leading-relaxed transition-all shadow-inner"
                  />
                  <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
                    <Code className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* User Input Input */}
              <div className="space-y-2 group">
                <div className="flex items-center gap-2 text-slate-400 group-focus-within:text-slate-950 dark:group-focus-within:text-white transition-colors">
                  <FileText className="w-3 h-3" />
                  <label className="text-[8px] font-bold uppercase tracking-widest">Payload (Source Material)</label>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="INPUT TEXT TO TRANSFORM..."
                  rows={8}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none p-4 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950/5 dark:focus:ring-white/5 resize-none font-medium text-slate-950 dark:text-white text-xs placeholder:text-slate-200 dark:placeholder:text-slate-800 transition-all shadow-sm"
                />
              </div>

              <button
                onClick={handleProcess}
                disabled={isLoading || !input.trim()}
                className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-none font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all text-[11px] active:scale-95 shadow-lg group"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                <span>{isLoading ? 'Synthesizing' : 'Execute Transformation'}</span>
              </button>
              
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 flex items-center gap-3 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!isLoading && outputs.length === 0 && !error && (
            <div className="bg-white dark:bg-slate-950 border-2 border-dashed border-slate-100 dark:border-slate-900 p-24 text-center flex flex-col items-center justify-center">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4">
                <RefreshCcw className="w-8 h-8 text-slate-200 dark:text-slate-800" />
              </div>
              <p className="text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest text-[9px]">Neural Buffer Standby</p>
              <p className="text-slate-200 dark:text-slate-800 font-bold uppercase tracking-widest text-[7px] mt-1">Awaiting payload for transformation</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white dark:bg-slate-950 p-24 text-center flex flex-col items-center justify-center border border-slate-100 dark:border-slate-900 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Loader2 className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-spin" />
              <p className="text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest text-[8px] mt-4">Drafting variants via neural engine...</p>
            </div>
          )}

          {outputs.map((output, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-950 dark:hover:border-slate-400 transition-all animate-in slide-in-from-right-2 duration-300 shadow-sm"
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Variant 0{index + 1}</span>
                <div className="flex gap-4">
                  <button onClick={() => handleCopy(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1.5">
                    {copiedIndex === index ? <Check className="w-2.5 h-2.5" /> : null}
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => handleSaveToVault(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1.5">
                    {savedIndex === index ? <Save className="w-2.5 h-2.5" /> : null}
                    {savedIndex === index ? 'Saved' : 'Save to Vault'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-950 dark:text-white leading-relaxed font-medium text-xs whitespace-pre-wrap selection:bg-indigo-100 dark:selection:bg-indigo-900">{output}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple utility icon since we don't have all Lucide imports defined in snippet
const Code: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

export default PromptTools;
