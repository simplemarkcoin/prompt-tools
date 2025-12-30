
import React from 'react';
import { Prompt } from '../types';
import { storageService } from '../services/storageService';
import { Clock, Star, Plus, Wand2, ArrowRight, RefreshCcw, Zap } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [recentPrompts, setRecentPrompts] = React.useState<Prompt[]>([]);
  
  React.useEffect(() => {
    const all = storageService.getPrompts();
    setRecentPrompts(all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight uppercase">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">Neural Node Status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200 dark:border-slate-800">
        {[
          { label: 'Vault Items', val: storageService.getPrompts().length, icon: Star },
          { label: 'Active Tools', val: '5', icon: Wand2 },
          { label: 'API Status', val: 'Online', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-slate-950 p-4 flex items-center gap-4 ${i !== 2 ? 'sm:border-r border-b sm:border-b-0 border-slate-200 dark:border-slate-800' : ''}`}>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-none text-slate-600 dark:text-slate-400">
              <stat.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-950 dark:border-white pb-2">
            <h2 className="text-[9px] font-bold text-slate-950 dark:text-white uppercase tracking-[0.15em] flex items-center gap-2">
              Recent Activity
            </h2>
            <button onClick={() => onNavigate('vault')} className="text-slate-500 dark:text-slate-400 font-bold text-[8px] uppercase tracking-widest hover:text-slate-950 dark:hover:text-white">
              Expand View
            </button>
          </div>
          
          <div className="space-y-1">
            {recentPrompts.length === 0 ? (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none p-8 text-center">
                <p className="text-slate-400 dark:text-slate-600 text-[8px] font-bold uppercase">Registry Empty</p>
                <button onClick={() => onNavigate('vault')} className="mt-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-3 py-1.5 rounded-none text-[8px] font-bold uppercase tracking-widest active:scale-95 transition-all">
                  Initialize Vault
                </button>
              </div>
            ) : (
              recentPrompts.map(prompt => (
                <div 
                  key={prompt.id} 
                  className="bg-white dark:bg-slate-950 p-2.5 rounded-none border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer group flex justify-between items-center" 
                  onClick={() => onNavigate('vault')}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[10px] font-medium text-slate-800 dark:text-slate-200 group-hover:underline truncate uppercase tracking-wide">{prompt.title}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[8px] truncate uppercase font-normal tracking-tight">{prompt.description}</p>
                  </div>
                  <span className="text-[6px] px-1 py-0.5 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 rounded-none uppercase font-bold ml-4 shrink-0">
                    {prompt.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[9px] font-bold text-slate-950 dark:text-white uppercase tracking-[0.15em] border-b border-slate-950 dark:border-white pb-2">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              onClick={() => onNavigate('tool-rephrase')}
              className="p-4 bg-slate-100 dark:bg-slate-900 rounded-none text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-950 dark:hover:border-slate-400 transition-all text-left relative overflow-hidden group active:scale-[0.98]"
            >
              <RefreshCcw className="w-8 h-8 absolute -bottom-1 -right-1 text-slate-200 dark:text-slate-800 opacity-20 group-hover:rotate-90 transition-transform duration-500" />
              <p className="font-bold text-[10px] uppercase tracking-widest leading-none relative z-10">Rephrase</p>
              <p className="text-slate-400 dark:text-slate-600 text-[8px] font-bold uppercase tracking-widest mt-1 relative z-10">Neural Rewrite</p>
            </button>

            <button 
              onClick={() => onNavigate('tool-improve')}
              className="p-4 bg-slate-950 dark:bg-white rounded-none text-white dark:text-slate-950 transition-all text-left relative overflow-hidden group active:scale-[0.98]"
            >
              <Zap className="w-8 h-8 absolute -bottom-1 -right-1 text-white/10 dark:text-black/10 group-hover:scale-125 transition-transform duration-500" />
              <p className="font-bold text-[10px] uppercase tracking-widest leading-none relative z-10">Improve</p>
              <p className="text-slate-400 dark:text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1 relative z-10">Lexical Logic</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
