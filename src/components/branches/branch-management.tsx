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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[80vh]"
      >
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Manage Branches</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store Locations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-gray-900 tracking-tight">All Branches</h4>
            <button
              onClick={() => setEditingBranch('new')}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-orange-200 border-t-orange-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-500 font-medium">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No branches yet. Add your first location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {branches.map((branch, index) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:bg-orange-50 transition-colors">
                      <Home className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg tracking-tight leading-tight">{branch.name}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        {branch.address && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <MapPin className="w-3 h-3" />
                            {branch.address}
                          </div>
                        )}
                        {branch.contact && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Phone className="w-3 h-3" />
                            {branch.contact}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="p-3 bg-white text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${branch.name}?`)) {
                          deleteBranch(branch.id);
                        }
                      }}
                      className="p-3 bg-white text-red-600 rounded-2xl hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Total Branches: {branches.length}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
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
