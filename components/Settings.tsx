
import React from 'react';
import { AppSettings, ToolType, AIProvider } from '../types';
import { AI_MODELS, TOOLS } from '../constants';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { AlertCircle, CheckCircle2, Loader2, Save, Cpu, FlaskConical, ChevronDown, ChevronUp, Key, ExternalLink, Globe, Zap, Eye, EyeOff, ShieldCheck, ShieldAlert, Server } from 'lucide-react';

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'missing';

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState<AppSettings>(storageService.getSettings());
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'success' | 'error' | null>(null);
  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  
  const [valStatuses, setValStatuses] = React.useState<Record<string, ValidationStatus>>({
    openai: 'idle',
    groq: 'idle',
    openrouter: 'idle'
  });

  const aistudio = (window as any).aistudio;

  React.useEffect(() => {
    const providers = ['openai', 'groq', 'openrouter'] as const;
    const timers = providers.map(p => {
      const key = settings.apiKeys[p];
      if (!key || key.trim() === '') {
        setValStatuses(prev => ({ ...prev, [p]: 'missing' }));
        return null;
      }
      setValStatuses(prev => ({ ...prev, [p]: 'checking' }));
      return setTimeout(async () => {
        const isValid = await aiService.testConnection(p as AIProvider, '', key);
        setValStatuses(prev => ({ ...prev, [p]: isValid ? 'valid' : 'invalid' }));
      }, 1000);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [settings.apiKeys]);

  const handleOpenGeminiKey = async () => {
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      setSettings(prev => ({ ...prev, hasKeySelected: true }));
    }
  };

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
    } catch { setTestResult('error'); }
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
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Validated Cross-Provider Logic</p>
      </div>

      <div className="space-y-6">
        {/* Security & Proxy Section */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Security & Proxy</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">Use Secure Worker Proxy</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-tight">Routes Gemini calls through your Cloudflare Worker</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, useProxy: !settings.useProxy})}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.useProxy ? 'bg-slate-950 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.useProxy ? 'right-1 bg-white dark:bg-slate-950' : 'left-1 bg-white dark:bg-slate-400'}`} />
              </button>
            </div>
            
            {settings.useProxy && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Worker Endpoint URL</label>
                <input 
                  type="text"
                  placeholder="https://your-worker.workers.dev"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] dark:text-white focus:outline-none"
                  value={settings.proxyUrl || ''}
                  onChange={(e) => setSettings({...settings, proxyUrl: e.target.value})}
                />
              </div>
            )}
          </div>
        </section>

        {/* Global Keychain */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Global Keychain</h2>
          </div>
          <div className="p-6 space-y-6">
            {!settings.useProxy && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-950 dark:text-white">Gemini (Native)</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${settings.hasKeySelected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <button onClick={handleOpenGeminiKey} className="w-full text-left px-4 py-2 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between">
                  <span>{settings.hasKeySelected ? 'Project Key Linked' : 'Connect GCP Project'}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </button>
              </div>
            )}

            {['openai', 'groq', 'openrouter'].map((provider) => (
              <div key={provider} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-950 dark:text-white">{provider}</span>
                  <div className="flex items-center gap-2">
                    {valStatuses[provider] === 'checking' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     valStatuses[provider] === 'valid' ? <ShieldCheck className="w-3 h-3 text-green-500" /> : 
                     valStatuses[provider] === 'invalid' ? <ShieldAlert className="w-3 h-3 text-rose-500" /> : null}
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type={showKeys[provider] ? "text" : "password"}
                    placeholder={`ENTER ${provider.toUpperCase()} API KEY`}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-mono text-[10px] dark:text-white focus:outline-none"
                    value={(settings.apiKeys as any)[provider] || ''}
                    onChange={(e) => updateKey(provider, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engine Selection */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">Active Inference Engine</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Model Architecture</label>
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
                  {isTesting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'TEST ENDPOINT'}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 flex items-center gap-3 border ${testResult === 'success' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'}`}>
                {testResult === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <p className="text-[10px] font-bold uppercase tracking-tight">
                  {testResult === 'success' ? `Global Handshake successful with ${settings.provider.toUpperCase()}` : 'Global Handshake failure'}
                </p>
              </div>
            )}
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-none font-bold uppercase tracking-[0.3em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-[11px] active:scale-95"
        >
          Commit All Keys & Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
