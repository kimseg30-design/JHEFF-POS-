'use client';

import { useState } from 'react';
import { useBranches } from '@/lib/hooks/use-branches';
import { Branch } from '@/lib/db/idb';
import { X, Plus, MapPin, Edit2, Trash2, Home, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BranchForm } from './branch-form';

interface BranchManagementProps {
  onClose: () => void;
}

export function BranchManagement({ onClose }: BranchManagementProps) {
  const { branches, addBranch, updateBranch, deleteBranch, loading } = useBranches();
  const [editingBranch, setEditingBranch] = useState<Branch | null | 'new'>(null);

  const handleSave = async (branchData: any) => {
    if (editingBranch === 'new') {
      await addBranch(branchData);
    } else if (editingBranch) {
      await updateBranch(branchData);
    }
    setEditingBranch(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[80vh] transition-colors"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-md shadow-orange-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Manage Branches</h3>
              <p className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Store Locations</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-gray-950 dark:text-white tracking-tight">All Branches</h4>
            <button
              type="button"
              onClick={() => setEditingBranch('new')}
              className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-orange-200 border-t-orange-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-bold">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-bold">No branches yet. Add your first location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {branches.map((branch, index) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xs group-hover:bg-orange-50 dark:group-hover:bg-orange-950/40 transition-colors">
                      <Home className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-black text-gray-950 dark:text-white text-lg tracking-tight leading-tight">{branch.name}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        {branch.address && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                            {branch.address}
                          </div>
                        )}
                        {branch.contact && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <Phone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                            {branch.contact}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBranch(branch)}
                      className="p-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors shadow-xs cursor-pointer"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${branch.name}?`)) {
                          deleteBranch(branch.id);
                        }
                      }}
                      className="p-3 bg-white dark:bg-gray-800 text-red-600 dark:text-rose-400 rounded-2xl hover:bg-red-50 dark:hover:bg-rose-900/40 transition-colors shadow-xs cursor-pointer"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
            Total Branches: {branches.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-orange-500/20"
          >
            Done
          </button>
        </div>

        <AnimatePresence>
          {editingBranch && (
            <BranchForm
              branch={editingBranch === 'new' ? null : editingBranch}
              onSave={handleSave}
              onClose={() => setEditingBranch(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
