
import React from 'react';
import { Prompt } from '../types';
import { CATEGORIES } from '../constants';
import { storageService } from '../services/storageService';
import { Search, Plus, Trash2, Edit3, Copy, Check, X } from 'lucide-react';

const PromptVault: React.FC = () => {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
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

  const handleDelete = (id: string) => {
    if (confirm('Delete permanently?')) {
      storageService.savePrompts(prompts.filter(p => p.id !== id));
      loadPrompts();
    }
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
          <h1 className="text-2xl font-bold text-slate-950 uppercase tracking-tight">Vault</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Knowledge Base Index</p>
        </div>
        <button 
          onClick={() => { setEditingPrompt(null); setFormData({ title: '', description: '', category: 'General', content: '' }); setIsModalOpen(true); }}
          className="bg-slate-950 text-white px-4 py-2 rounded-none hover:bg-slate-800 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
        >
          <Plus className="w-3 h-3" /> Add Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="SEARCH DATABASE..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 font-bold text-[10px] placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-2 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white">
            <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Query returned 0 results</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className="group bg-white p-6 flex flex-col relative transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[8px] font-bold uppercase tracking-widest border border-slate-950 px-2 py-0.5">
                  {prompt.category}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(prompt)} className="text-slate-400 hover:text-slate-950">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(prompt.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 mb-1 uppercase tracking-tight">{prompt.title}</h3>
              <p className="text-slate-500 text-[10px] font-medium mb-4 uppercase leading-tight line-clamp-1">{prompt.description}</p>
              
              <div className="bg-slate-50 p-3 rounded-none border border-slate-100 flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-600 font-mono line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {prompt.content}
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[8px] text-slate-300 font-bold uppercase">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => copyToClipboard(prompt.content, prompt.id)}
                  className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${copiedId === prompt.id ? 'text-green-600' : 'text-slate-950 hover:underline'}`}
                >
                  {copiedId === prompt.id ? 'Copied' : 'Copy Content'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm">
          <div className="bg-white rounded-none w-full max-w-xl border border-slate-950 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-950 flex items-center justify-between bg-white">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-widest">{editingPrompt ? 'Update Record' : 'Create Record'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entry Title</label>
                  <input required type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 font-bold text-[11px]" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Categorization</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 font-bold text-[11px]" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <input required type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 font-medium text-[11px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logic Instructions</label>
                <textarea required rows={6} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-none focus:outline-none focus:border-slate-950 font-mono text-[11px] leading-relaxed" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-950">Abort</button>
                <button type="submit" className="px-6 py-2 bg-slate-950 text-white rounded-none font-bold uppercase tracking-widest text-[10px] active:scale-95">Commit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVault;
