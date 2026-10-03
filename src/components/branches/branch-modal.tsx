'use client';

import { useState } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { X, Save, MapPin, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface BranchModalProps {
  onClose: () => void;
}

export function BranchModal({ onClose }: BranchModalProps) {
  const { addBranch } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter the branch name.');
      return;
    }

    setIsSaving(true);
    try {
      await addBranch({
        name: formData.name.trim(),
        address: formData.address.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to add branch:', err);
      setError('Failed to add branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Add New Branch</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                <Home className="w-3 h-3" /> Branch Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Branch, Cubao Outlet"
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                <MapPin className="w-3 h-3" /> Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 123 Street, Quezon City"
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Branch
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
