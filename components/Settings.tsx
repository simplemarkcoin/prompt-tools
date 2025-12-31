
import React from 'react';
import { AppSettings, AIProvider } from '../types';
import { AI_MODELS } from '../constants';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { AlertCircle, CheckCircle2, Loader2, Save, Cpu, Key, ExternalLink, Globe, ShieldCheck, ShieldAlert, Server, Terminal, Code, Zap } from 'lucide-react';

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'missing';

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState<AppSettings>(storageService.getSettings());
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'success' | 'error' | null>(null);
  const [showCorsHelp, setShowCorsHelp] = React.useState(false);
  
  const [valStatuses, setValStatuses] = React.useState<Record<string, ValidationStatus>>({
    gemini: 'idle',
    openai: 'idle',
    groq: 'idle',
    openrouter: 'idle'
  });

  React.useEffect(() => {
    const providers = ['gemini', 'openai', 'groq', 'openrouter'] as const;
    const timers = providers.map(p => {
      const key = settings.apiKeys[p];
      // Special check for Gemini if using platform key
      if (p === 'gemini' && !key && process.env.API_KEY) {
        setValStatuses(prev => ({ ...prev, gemini: 'valid' }));
        return null;
      }
      
      if (!key || key.trim() === '') {
        setValStatuses(prev => ({ ...prev, [p]: 'missing' }));
        return null;
      }
      setValStatuses(prev => ({ ...prev, [p]: 'checking' }));
      return setTimeout(async () => {
        const isValid = await aiService.testConnection(p as AIProvider, settings.model, key);
        setValStatuses(prev => ({ ...prev, [p]: isValid ? 'valid' : 'invalid' }));
      }, 1000);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [settings.apiKeys, settings.model]);

  const updateKey = (provider: string, val: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: val }
    }));
  };

  const handleSave = () => {
    storageService.saveSettings({ ...settings, isConfigured: true });
    alert('CONFIGURATION COMMITTED');
  };

  const testConnection = async () => {
    setIsTesting(true); setTestResult(null);
    try {
      const ok = await aiService.testConnection(settings.provider, settings.model);
      setTestResult(ok ? 'success' : 'error');
      if (!ok && settings.provider === 'gemini' && settings.useProxy) setShowCorsHelp(true);
    } catch (err: any) { 
      setTestResult('error'); 
      setShowCorsHelp(true);
    }
    finally { setIsTesting(false); }
  };

  const handleModelChange = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (model) {
      setSettings(prev => ({ ...prev, model: modelId, provider: model.provider }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white uppercase tracking-tight">Configuration</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">System Protocols</p>
      </div>

      <div className="space-y-6">
        {/* Engine Selection */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Active Engine</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logic Provider & Model</label>
                <select 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-[11px] dark:text-white focus:outline-none"
                  value={settings.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                >
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={testConnection}
                  disabled={isTesting}
                  className="w-full py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold uppercase tracking-widest text-[9px] active:scale-95 disabled:opacity-50 transition-all h-[38px]"
                >
                  {isTesting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Ping Endpoint'}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 flex items-center gap-3 border animate-in slide-in-from-top-2 ${testResult === 'success' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'}`}>
                {testResult === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <p className="text-[9px] font-bold uppercase tracking-tight">
                  {testResult === 'success' ? 'Connection Link Verified' : 'Connection Link Refused'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Credentials */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Key className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Manual Credentials</h2>
          </div>
          <div className="p-6 space-y-6">
            {[
              { id: 'gemini', name: 'Gemini (Google)', icon: Globe, placeholder: 'AIzaSy...' },
              { id: 'openai', name: 'OpenAI', icon: Code, placeholder: 'sk-...' },
              { id: 'groq', name: 'Groq', icon: Zap, placeholder: 'gsk_...' },
              { id: 'openrouter', name: 'OpenRouter', icon: Terminal, placeholder: 'sk-or-v1-...' }
            ].map(provider => (
              <div key={provider.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <provider.icon className="w-3 h-3" />
                    {provider.name} API Key
                  </label>
                  <div className="flex items-center gap-2">
                    {valStatuses[provider.id] === 'valid' && <span className="text-[7px] font-bold text-green-600 uppercase">Ready</span>}
                    {valStatuses[provider.id] === 'invalid' && <span className="text-[7px] font-bold text-rose-500 uppercase">Invalid</span>}
                    {valStatuses[provider.id] === 'checking' && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />}
                  </div>
                </div>
                <input 
                  type="password"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  value={(settings.apiKeys as any)[provider.id] || ''}
                  onChange={(e) => updateKey(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Proxy Settings */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm opacity-80">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Inference Proxy</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">Proxy Routing</p>
                <p className={`text-[8px] uppercase tracking-tight font-bold ${settings.useProxy ? 'text-green-600' : 'text-slate-400'}`}>
                  {settings.useProxy ? 'Active' : 'Inactive'}
                </p>
              </div>
              <button 
                onClick={() => setSettings({...settings, useProxy: !settings.useProxy})}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.useProxy ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.useProxy ? 'right-1 bg-white' : 'left-1 bg-white dark:bg-slate-400'}`} />
              </button>
            </div>
            
            <input 
              type="text"
              placeholder="https://your-worker.workers.dev"
              className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] dark:text-white focus:outline-none"
              value={settings.proxyUrl || ''}
              onChange={(e) => setSettings({...settings, proxyUrl: e.target.value})}
            />
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-none font-bold uppercase tracking-[0.3em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-[11px] active:scale-95 shadow-lg flex items-center justify-center gap-2"
        >
          <Save className="w-3.5 h-3.5" /> Commit Configuration
        </button>
      </div>
    </div>
  );
};

export default Settings;
