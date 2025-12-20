
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
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight uppercase">Dashboard</h1>
        <p className="text-slate-500 text-sm">System performance and recent activity.</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200">
        {[
          { label: 'Vault Items', val: storageService.getPrompts().length, icon: Star },
          { label: 'Active Tools', val: '5', icon: Wand2 },
          { label: 'API Status', val: 'Online', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-4 flex items-center gap-4 ${i !== 2 ? 'sm:border-r border-b sm:border-b-0 border-slate-200' : ''}`}>
            <div className="bg-slate-100 p-2 rounded-none text-slate-600">
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900 leading-none">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-950 pb-2">
            <h2 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-2">
              Recent Activity
            </h2>
            <button onClick={() => onNavigate('vault')} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-950">
              View All
            </button>
          </div>
          
          <div className="space-y-1">
            {recentPrompts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-none p-8 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase">Empty Vault</p>
                <button onClick={() => onNavigate('vault')} className="mt-4 bg-slate-950 text-white px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">
                  Initialize Vault
                </button>
              </div>
            ) : (
              recentPrompts.map(prompt => (
                <div 
                  key={prompt.id} 
                  className="bg-white p-4 rounded-none border border-slate-200 hover:border-slate-950 transition-all cursor-pointer group flex justify-between items-center" 
                  onClick={() => onNavigate('vault')}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:underline truncate uppercase tracking-tight">{prompt.title}</h3>
                    <p className="text-slate-500 text-[10px] truncate uppercase font-medium">{prompt.description}</p>
                  </div>
                  <span className="text-[8px] px-2 py-1 bg-slate-100 text-slate-500 rounded-none uppercase font-bold ml-4 shrink-0">
                    {prompt.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Quick Tools Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-950 pb-2">Quick Launch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              onClick={() => onNavigate('tool-rephrase')}
              className="p-6 bg-slate-100 rounded-none text-slate-950 border border-slate-200 hover:border-slate-950 transition-all text-left relative overflow-hidden group active:scale-[0.98]"
            >
              <RefreshCcw className="w-12 h-12 absolute -bottom-2 -right-2 text-slate-200 opacity-50 group-hover:rotate-90 transition-transform duration-500" />
              <p className="font-bold text-sm uppercase tracking-widest leading-none relative z-10">Rephrase</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1 relative z-10">Smart Variant</p>
            </button>

            <button 
              onClick={() => onNavigate('tool-improve')}
              className="p-6 bg-slate-950 rounded-none text-white transition-all text-left relative overflow-hidden group active:scale-[0.98]"
            >
              <Zap className="w-12 h-12 absolute -bottom-2 -right-2 text-white/10 group-hover:scale-125 transition-transform duration-500" />
              <p className="font-bold text-sm uppercase tracking-widest leading-none relative z-10">Improve</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1 relative z-10">Vocab Logic</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
