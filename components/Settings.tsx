
import React from 'react';
import { AppSettings, ToolType } from '../types';
import { AI_MODELS, TOOLS } from '../constants';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { AlertCircle, CheckCircle2, Loader2, Save, Cpu, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState<AppSettings>(storageService.getSettings());
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'success' | 'error' | null>(null);
  const [expandedTool, setExpandedTool] = React.useState<ToolType | null>(null);

  const handleSave = () => {
    storageService.saveSettings({ ...settings, isConfigured: true });
    alert('CONFIGURATION SAVED');
  };

  const updateCustomInstruction = (tool: ToolType, value: string) => {
    const currentInstructions = settings.customInstructions || {} as Record<ToolType, string>;
    setSettings({ ...settings, customInstructions: { ...currentInstructions, [tool]: value } });
  };

  const testConnection = async () => {
    setIsTesting(true); setTestResult(null);
    try {
      const ok = await geminiService.testConnection(settings.model);
      setTestResult(ok ? 'success' : 'error');
    } catch { setTestResult('error'); }
    finally { setIsTesting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 uppercase tracking-tight">Configuration</h1>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">System Parameters</p>
      </div>

      <div className="space-y-6">
        {/* Engine Section */}
        <section className="bg-white border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
            <Cpu className="w-4 h-4 text-slate-600" />
            <h2 className="text-[10px] font-bold text-slate-950 uppercase tracking-widest">Model Architecture</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Inference Engine</label>
              <div className="flex flex-col sm:flex-row gap-px bg-slate-200 border border-slate-200">
                <select 
                  className="flex-1 px-4 py-2 bg-white rounded-none focus:outline-none focus:bg-slate-50 font-bold text-[11px] appearance-none"
                  value={settings.model}
                  onChange={(e) => setSettings({...settings, model: e.target.value})}
                >
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button 
                  onClick={testConnection}
                  disabled={isTesting}
                  className="px-6 py-2 bg-slate-950 text-white rounded-none font-bold uppercase tracking-widest text-[9px] active:scale-95 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'TEST LINK'}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 flex items-center gap-3 border ${testResult === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {testResult === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <p className="text-[10px] font-bold uppercase">
                  {testResult === 'success' ? 'Link synchronized' : 'Link failure'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Instruction Lab */}
        <section className="bg-white border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
            <FlaskConical className="w-4 h-4 text-slate-600" />
            <h2 className="text-[10px] font-bold text-slate-950 uppercase tracking-widest">Instruction Lab</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(Object.keys(TOOLS) as ToolType[]).map((type) => (
              <div key={type} className="bg-white">
                <button 
                  onClick={() => setExpandedTool(expandedTool === type ? null : type)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-slate-300 uppercase w-4">0{Object.keys(TOOLS).indexOf(type) + 1}</span>
                    <span className="font-bold text-slate-950 text-[10px] uppercase tracking-widest">{TOOLS[type].name} Logic</span>
                  </div>
                  {expandedTool === type ? <ChevronUp className="w-3 h-3 text-slate-950" /> : <ChevronDown className="w-3 h-3 text-slate-300" />}
                </button>
                {expandedTool === type && (
                  <div className="p-6 pt-0 space-y-4">
                    <textarea 
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-100 rounded-none p-4 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-slate-300 leading-relaxed shadow-inner"
                      value={settings.customInstructions?.[type] || TOOLS[type].systemPrompt}
                      onChange={(e) => updateCustomInstruction(type, e.target.value)}
                    />
                    <div className="flex justify-start">
                      <button onClick={() => updateCustomInstruction(type, TOOLS[type].systemPrompt)} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950">Reset Defaults</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Global Action */}
        <button 
          onClick={handleSave}
          className="w-full bg-slate-950 text-white px-8 py-4 rounded-none font-bold uppercase tracking-[0.3em] hover:bg-slate-800 transition-all text-[11px] active:scale-95 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Commit Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
