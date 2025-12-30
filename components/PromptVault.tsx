
import React from 'react';
import { Prompt } from '../types';
import { CATEGORIES } from '../constants';
import { storageService } from '../services/storageService';
import { Search, Plus, Trash2, Edit3, X } from 'lucide-react';

const PromptVault: React.FC = () => {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; targetId: string | 'ALL' }>({ isOpen: false, targetId: '' });
  const [editingPrompt, setEditingPrompt] = React.useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: 'General',
    content: ''
  });

  React.useEffect(() => { loadPrompts(); }, []);

  const loadPrompts = () => { setPrompts(storageService.getPrompts()); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const allPrompts = storageService.getPrompts();
    if (editingPrompt) {
      const updated = allPrompts.map(p => p.id === editingPrompt.id ? { ...p, ...formData } : p);
      storageService.savePrompts(updated);
    } else {
      const newPrompt: Prompt = { ...formData, id: crypto.randomUUID(), createdAt: Date.now() };
      storageService.savePrompts([...allPrompts, newPrompt]);
    }
    setIsModalOpen(false);
    setEditingPrompt(null);
    setFormData({ title: '', description: '', category: 'General', content: '' });
    loadPrompts();
  };

  const confirmDelete = () => {
    if (deleteModal.targetId === 'ALL') {
      storageService.savePrompts([]);
    } else {
      storageService.savePrompts(prompts.filter(p => p.id !== deleteModal.targetId));
    }
    setDeleteModal({ isOpen: false, targetId: '' });
    loadPrompts();
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const dayInMs = 24 * 60 * 60 * 1000;

    if (diff < dayInMs) {
      const seconds = Math.floor(diff / 1000);
      if (seconds < 60) return `${seconds || 1}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    }
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({ title: prompt.title, description: prompt.description, category: prompt.category, content: prompt.content });
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white uppercase tracking-tight">Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">Record Index</p>
        </div>
        <div className="flex gap-2">
          {prompts.length > 0 && (
            <button 
              onClick={() => setDeleteModal({ isOpen: true, targetId: 'ALL' })}
              className="border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-none hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all font-bold uppercase tracking-widest text-[9px] flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Purge
            </button>
          )}
          <button 
            onClick={() => { setEditingPrompt(null); setFormData({ title: '', description: '', category: 'General', content: '' }); setIsModalOpen(true); }}
            className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2 rounded-none hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-bold uppercase tracking-widest text-[9px] flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> New Item
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="FILTER ENTRIES..." 
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[9px] tracking-wider placeholder:text-slate-300 dark:text-white uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-none text-[8px] font-bold uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-none text-[8px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
            <p className="text-slate-300 dark:text-slate-600 font-bold text-[9px] uppercase tracking-widest">Archive Status: Empty</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className="group bg-white dark:bg-slate-950 p-3.5 flex flex-col relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {formatTimestamp(prompt.createdAt)}
                  </span>
                  <span className="text-[7px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 px-1.5 py-0.5">
                    {prompt.category}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(prompt)} className="text-slate-400 dark:text-slate-600 hover:text-slate-950 dark:hover:text-white">
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, targetId: prompt.id })} className="text-slate-400 dark:text-slate-600 hover:text-rose-600">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-[10px] font-medium text-slate-800 dark:text-slate-200 mb-0.5 uppercase tracking-wide leading-tight line-clamp-2">{prompt.title}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-[8px] font-normal mb-3 uppercase tracking-tight line-clamp-1">{prompt.description}</p>
              
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-none border border-slate-100/50 dark:border-slate-800/50 flex-1 overflow-hidden">
                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-mono line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {prompt.content}
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-100/50 dark:border-slate-800/50">
                <span className="text-[7px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-tighter">NODE: {prompt.id.slice(0, 8)}</span>
                <button 
                  onClick={() => copyToClipboard(prompt.content, prompt.id)}
                  className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider ${copiedId === prompt.id ? 'text-green-600' : 'text-slate-950 dark:text-white hover:opacity-70'}`}
                >
                  {copiedId === prompt.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-none w-full max-w-[260px] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center space-y-6">
              <p className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                {deleteModal.targetId === 'ALL' ? 'Purge database?' : 'Remove entry?'}
              </p>

              <div className="flex flex-col gap-1">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2.5 rounded-none font-bold uppercase tracking-widest text-[9px] active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, targetId: '' })}
                  className="w-full bg-transparent text-slate-400 dark:text-slate-600 px-4 py-2 rounded-none font-bold uppercase tracking-widest text-[8px] hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/20 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 rounded-none w-full max-w-xl border border-slate-950 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-950 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-950">
              <h2 className="text-[9px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">{editingPrompt ? 'Update Record' : 'New Entry'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-950 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Entry Title</label>
                  <input required type="text" className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[10px] dark:text-white uppercase tracking-tight" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[10px] dark:text-white uppercase" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Quick Desc</label>
                <input required type="text" className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-medium text-[10px] dark:text-white uppercase" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Instruction</label>
                <textarea required rows={6} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-mono text-[9px] leading-relaxed dark:text-white" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-950 dark:hover:text-white">Abort</button>
                <button type="submit" className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-none font-bold uppercase tracking-widest text-[9px] active:scale-95">Commit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVault;
