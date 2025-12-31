
import React from 'react';
import { ToolType, Prompt } from '../types';
import { TOOLS } from '../constants';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { 
  RefreshCcw, 
  Zap, 
  Type as ToneIcon, 
  AlignLeft, 
  Maximize2, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  Save, 
  AlertCircle, 
  Terminal, 
  RotateCcw, 
  FileText,
  Settings2,
  Edit2
} from 'lucide-react';

const PromptTools: React.FC<{initialTool?: ToolType}> = ({ initialTool = 'rephrase' }) => {
  const [activeTool, setActiveTool] = React.useState<ToolType>(initialTool);
  const [input, setInput] = React.useState('');
  const [systemPrompt, setSystemPrompt] = React.useState('');
  const [isEditingSystem, setIsEditingSystem] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
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
    setIsEditingSystem(false);
  }, [activeTool, config.systemPrompt]);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsLoading(true); setError(null); setOutputs([]);
    try {
      const userPrompt = activeTool === 'tone' ? config.userPromptTemplate(input, tone) : config.userPromptTemplate(input);
      const result = await aiService.generate(activeTool, systemPrompt, userPrompt);
      setOutputs(result);
    } catch (err: any) { 
      setError(err.message || 'Processing Error'); 
    }
    finally { setIsLoading(false); }
  };

  const handleResetSystemPrompt = () => {
    setSystemPrompt(config.systemPrompt);
    setIsEditingSystem(false);
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
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">High-Performance Inference</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {(Object.keys(TOOLS) as ToolType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTool(type)}
            className={`flex flex-col items-center justify-center p-4 transition-all bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 group ${
              activeTool === type ? 'ring-2 ring-inset ring-slate-950 dark:ring-white z-10' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <div className={`transition-transform duration-300 ${activeTool === type ? 'text-slate-950 dark:text-white scale-110' : 'group-hover:scale-110'}`}>
              {getIcon(type)}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${activeTool === type ? 'text-slate-950 dark:text-white' : ''}`}>
              {TOOLS[type].name.split(' ')[1] || TOOLS[type].name}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {/* Main Input Card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
              <h3 className="font-bold text-slate-950 dark:text-white uppercase tracking-widest text-[10px] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Input Protocol
              </h3>
              <div className="flex items-center gap-3">
                {activeTool === 'tone' && (
                  <select 
                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-950 dark:focus:ring-white text-slate-950 dark:text-white cursor-pointer" 
                    value={tone} 
                    onChange={(e) => setTone(e.target.value)}
                  >
                    {['Professional', 'Casual', 'Friendly', 'Creative', 'Direct'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`p-1 transition-colors ${showAdvanced ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-950 dark:hover:text-white'}`}
                  title="Logic Overrides"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Collapsible System Prompt */}
              {showAdvanced && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 pb-4 border-b border-slate-100 dark:border-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Terminal className="w-3 h-3" />
                      <label className="text-[8px] font-bold uppercase tracking-widest">Logic Core Override</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleResetSystemPrompt}
                        className="text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Reset
                      </button>
                      <button 
                        onClick={() => setIsEditingSystem(!isEditingSystem)}
                        className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${isEditingSystem ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-800'}`}
                      >
                        {isEditingSystem ? (
                          <><Check className="w-2.5 h-2.5" /> Save Changes</>
                        ) : (
                          <><Edit2 className="w-2.5 h-2.5" /> Edit Logic</>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isEditingSystem ? (
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="DEFINE NEURAL BEHAVIOR..."
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-none p-3 focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed transition-all animate-in fade-in duration-200"
                    />
                  ) : (
                    <div className="w-full bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50 p-3 font-mono text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed whitespace-pre-wrap min-h-[60px] cursor-default">
                      {systemPrompt || "No logic defined."}
                    </div>
                  )}
                </div>
              )}

              {/* Source Material Textarea - Pro Look */}
              <div className="space-y-3">
                <div className="relative group">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="TYPE OR PASTE SOURCE MATERIAL HERE..."
                    rows={12}
                    className="w-full bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-900 rounded-none p-5 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-0 resize-none font-medium text-slate-950 dark:text-white text-sm leading-relaxed placeholder:text-slate-200 dark:placeholder:text-slate-800 transition-all shadow-inner"
                  />
                  {/* Decorative corner accents for "Pro" feel */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 pointer-events-none transition-colors group-focus-within:border-slate-950 dark:group-focus-within:border-white" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 pointer-events-none transition-colors group-focus-within:border-slate-950 dark:group-focus-within:border-white" />
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                    Character Count: {input.length}
                  </span>
                  {input.trim() && (
                    <button 
                      onClick={() => setInput('')}
                      className="text-[8px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                    >
                      Clear Editor
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={isLoading || !input.trim()}
                className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-5 rounded-none font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-30 transition-all text-[11px] active:scale-[0.98] shadow-2xl group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
                <span>{isLoading ? 'Synthesizing...' : 'Run Transformation'}</span>
              </button>
              
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 flex items-start gap-3 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-tight">System Exception</p>
                    <p className="text-[9px] opacity-80 leading-relaxed uppercase">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-[9px] font-bold text-slate-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
               <Zap className="w-3 h-3 text-amber-500" />
               Generated Variants
             </h2>
          </div>

          {!isLoading && outputs.length === 0 && !error && (
            <div className="bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-100 dark:border-slate-800 p-24 text-center flex flex-col items-center justify-center group">
              <div className="bg-white dark:bg-slate-950 p-5 rounded-full mb-6 border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <RefreshCcw className="w-8 h-8 text-slate-200 dark:text-slate-800" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[9px]">Awaiting Instructions</p>
              <p className="text-slate-300 dark:text-slate-700 font-bold uppercase tracking-[0.2em] text-[7px] mt-2">Neural engine in standby mode</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white dark:bg-slate-950 p-24 text-center flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 animate-pulse relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Loader2 className="w-10 h-10 text-slate-200 dark:text-slate-800 animate-spin" />
              <p className="text-slate-300 dark:text-slate-700 font-bold uppercase tracking-[0.2em] text-[8px] mt-6">Processing Payload...</p>
            </div>
          )}

          {outputs.map((output, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-slate-950 dark:hover:border-slate-400 transition-all animate-in slide-in-from-right-2 duration-300 shadow-md"
            >
              <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[8px] font-black flex items-center justify-center">
                    0{index + 1}
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Neural Draft</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleCopy(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1.5">
                    {copiedIndex === index ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => handleSaveToVault(output, index)} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1.5">
                    {savedIndex === index ? <Check className="w-3 h-3 text-indigo-500" /> : <Save className="w-3 h-3" />}
                    {savedIndex === index ? 'Vaulted' : 'To Vault'}
                  </button>
                </div>
              </div>
              <div className="p-8">
                <p className="text-slate-950 dark:text-white leading-relaxed font-medium text-xs whitespace-pre-wrap selection:bg-indigo-100 dark:selection:bg-indigo-900/50">{output}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptTools;
