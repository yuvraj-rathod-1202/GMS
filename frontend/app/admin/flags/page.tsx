'use client';

import React, { useState, useEffect } from 'react';
import { FlagsApi } from '@/lib/api/flags';
import { 
  FiPlus, 
  FiSettings, 
  FiSearch,
  FiGlobe,
  FiBook
} from 'react-icons/fi';

interface FlagDefinition {
  id: number;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'user_based' | 'time_based';
  scope_level: 'global' | 'course';
  default_enabled: boolean;
  default_config: any;
  version: number;
}

export default function FeatureFlagsPage() {
  const [definitions, setDefinitions] = useState<FlagDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDef, setEditingDef] = useState<FlagDefinition | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'boolean',
    scope_level: 'global',
    default_enabled: false,
    default_config: {} as any
  });

  const fetchDefinitions = async () => {
    setIsLoading(true);
    try {
      const data = await FlagsApi.ListDefinitions();
      setDefinitions(data as FlagDefinition[]);
    } catch (err) {
      console.error('Failed to fetch definitions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDef) {
        // Update logic...
      } else {
        await FlagsApi.CreateDefinition(formData);
      }
      setShowFormModal(false);
      fetchDefinitions();
    } catch (err) {
      console.error(err);
      alert('Error saving definition');
    }
  };

  const filtered = definitions.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#050505] text-white">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">Global Definitions</h1>
          <p className="text-gray-500 font-medium tracking-tight">System-wide feature templates and default rollout strategies.</p>
        </div>
        <button 
          onClick={() => { setEditingDef(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-sm font-bold shadow-xl shadow-blue-500/20"
        >
          <FiPlus />
          New Definition
        </button>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-4">
          <div className="relative flex-1 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filter system definitions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] text-gray-500 text-[11px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Scope</th>
                <th className="px-8 py-5">Default</th>
                <th className="px-8 py-5">Identifier</th>
                <th className="px-8 py-5">Strategy</th>
                <th className="px-8 py-5 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-8 py-24 text-center text-gray-500">Syncing Registry...</td></tr>
              ) : filtered.map((def) => (
                <tr key={def.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {def.scope_level === 'global' ? <FiGlobe className="text-blue-500" /> : <FiBook className="text-purple-500" />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{def.scope_level}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`h-2 w-2 rounded-full ${def.default_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-white tracking-tight">{def.name}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">{def.description}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{def.type}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white">
                      <FiSettings size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simplified Modal for Definition Creation */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] w-full max-w-xl p-8">
            <h2 className="text-2xl font-black mb-8">Define System Feature</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                placeholder="Name (e.g., course.analytics)" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <textarea 
                placeholder="Description" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6"
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6"
                onChange={e => setFormData({...formData, scope_level: e.target.value as any})}
              >
                <option value="global">Global Scope</option>
                <option value="course">Course Scope (Templated)</option>
              </select>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-blue-600 rounded-xl font-bold">Create Definition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
