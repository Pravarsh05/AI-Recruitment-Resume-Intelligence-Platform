import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Database, Plus, Search, Filter, Check } from 'lucide-react';

export const AdminSkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // New skill form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('tool');
  const [aliases, setAliases] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, [categoryFilter]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await apiClient.get(`/admin/skills/?${params.toString()}`);
      setSkills(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch taxonomy skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSkills();
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    const aliasList = aliases.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await apiClient.post('/admin/skills/', {
        name: name.trim(),
        category,
        aliases: aliasList,
        is_active: true
      });
      setName('');
      setAliases('');
      fetchSkills();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add skill.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Skill Taxonomy & Synonym Dictionary
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Curated ontology of programming languages, frameworks, tools, and semantic aliases.
        </p>
      </div>

      {/* Add New Skill Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          Add Canonical Skill to Taxonomy
        </h3>
        <form onSubmit={handleCreateSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Canonical Name (e.g. LangChain)"
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 capitalize"
          >
            <option value="language">Programming Language</option>
            <option value="framework">Framework / Library</option>
            <option value="database">Database</option>
            <option value="cloud">Cloud / DevOps</option>
            <option value="tool">Tool / Platform</option>
            <option value="domain">Domain / Methodology</option>
            <option value="soft">Soft Skill</option>
          </select>
          <input
            type="text"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="Aliases (comma-separated, e.g. lc, langgraph)"
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{creating ? 'Adding...' : 'Add to Taxonomy'}</span>
          </button>
        </form>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search taxonomy by canonical skill or alias..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 capitalize"
        >
          <option value="">All Categories</option>
          <option value="language">Language</option>
          <option value="framework">Framework</option>
          <option value="database">Database</option>
          <option value="cloud">Cloud / DevOps</option>
          <option value="tool">Tool</option>
          <option value="domain">Domain</option>
        </select>
      </div>

      {/* Skills Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          Loading taxonomy...
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Canonical Skill</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Aliases / Synonyms</th>
                  <th className="py-3 px-4">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {skills.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                    <td className="py-3 px-4 capitalize text-indigo-300">{s.category}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.aliases?.length > 0 ? s.aliases.join(', ') : <span className="opacity-50">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
