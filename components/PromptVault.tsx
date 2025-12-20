
import React from 'react';
import { Prompt } from '../types';
import { CATEGORIES } from '../constants';
import { storageService } from '../services/storageService';
import { Search, Plus, Trash2, Edit3, Copy, Check, X, AlertTriangle } from 'lucide-react';

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
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Knowledge Base Index</p>
        </div>
        <div className="flex gap-2">
          {prompts.length > 0 && (
            <button 
              onClick={() => setDeleteModal({ isOpen: true, targetId: 'ALL' })}
              className="border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-none hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Clear Vault
            </button>
          )}
          <button 
            onClick={() => { setEditingPrompt(null); setFormData({ title: '', description: '', category: 'General', content: '' }); setIsModalOpen(true); }}
            className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2 rounded-none hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="SEARCH DATABASE..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[10px] placeholder:text-slate-300 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-2 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
            <p className="text-slate-300 dark:text-slate-600 font-bold text-[10px] uppercase tracking-widest">Query returned 0 results</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className="group bg-white dark:bg-slate-950 p-6 flex flex-col relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[8px] font-bold uppercase tracking-widest border border-slate-950 dark:border-white text-slate-950 dark:text-white px-2 py-0.5">
                  {prompt.category}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(prompt)} className="text-slate-400 dark:text-slate-600 hover:text-slate-950 dark:hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, targetId: prompt.id })} className="text-slate-400 dark:text-slate-600 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-1 uppercase tracking-tight">{prompt.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium mb-4 uppercase leading-tight line-clamp-1">{prompt.description}</p>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-none border border-slate-100 dark:border-slate-800 flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {prompt.content}
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold uppercase">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => copyToClipboard(prompt.content, prompt.id)}
                  className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${copiedId === prompt.id ? 'text-green-600' : 'text-slate-950 dark:text-white hover:underline'}`}
                >
                  {copiedId === prompt.id ? 'Copied' : 'Copy Content'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-none w-full max-w-sm border border-red-600 dark:border-red-900 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-red-50 dark:bg-red-950/30 p-3">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-widest">Confirm Deletion</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                  {deleteModal.targetId === 'ALL' 
                    ? 'Are you certain you want to purge your entire vault? This action is irreversible.' 
                    : 'This record will be permanently deleted from your local storage. Proceed?'}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-none font-bold uppercase tracking-widest text-[10px] active:scale-95 hover:bg-red-700 transition-colors"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, targetId: '' })}
                  className="w-full bg-transparent text-slate-400 dark:text-slate-500 px-4 py-2 rounded-none font-bold uppercase tracking-widest text-[10px] hover:text-slate-950 dark:hover:text-white transition-colors"
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
              <h2 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest">{editingPrompt ? 'Update Record' : 'Create Record'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-950 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entry Title</label>
                  <input required type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[11px] dark:text-white" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Categorization</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-bold text-[11px] dark:text-white" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <input required type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-medium text-[11px] dark:text-white" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logic Instructions</label>
                <textarea required rows={6} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:outline-none focus:border-slate-950 dark:focus:border-white font-mono text-[11px] leading-relaxed dark:text-white" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-950 dark:hover:text-white">Abort</button>
                <button type="submit" className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-none font-bold uppercase tracking-widest text-[10px] active:scale-95">Commit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVault;
