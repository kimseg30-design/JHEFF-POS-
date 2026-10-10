'use client';

import { useState, useEffect } from 'react';
import { User, Branch } from '@/lib/db/idb';
import { X, Save, Mail, Lock, User as UserIcon, Shield, MapPin, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useBranches } from '@/lib/hooks/use-branches';

interface UserFormProps {
  userData?: Omit<User, 'passwordHash'> | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export function UserForm({ userData, onSave, onClose }: UserFormProps) {
  const { branches } = useBranches();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
    assignedBranchIds: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name,
        email: userData.email,
        password: '', // Don't show password hash
        role: userData.role,
        assignedBranchIds: userData.assignedBranchIds || [],
      });
    }
  }, [userData]);

  const toggleBranch = (branchId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedBranchIds: prev.assignedBranchIds.includes(branchId)
        ? prev.assignedBranchIds.filter(id => id !== branchId)
        : [...prev.assignedBranchIds, branchId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!userData && !formData.password) {
      setError('Password is required for new users.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Save failed:', error);
      setError(error.message || 'Failed to save user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] transition-colors"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">
              {userData ? 'Edit User' : 'Add New User'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-4">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all outline-none"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all outline-none"
                  placeholder="juan@store.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-4">
                {userData ? 'New Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="password"
                  required={!userData}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-4">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'cashier' })}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all cursor-pointer ${
                    formData.role === 'cashier'
                      ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-600 text-orange-600 dark:text-orange-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Cashier
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all cursor-pointer ${
                    formData.role === 'admin'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-4 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Assigned Branches
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => toggleBranch(branch.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    formData.assignedBranchIds.includes(branch.id)
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold text-xs">{branch.name}</span>
                  {formData.assignedBranchIds.includes(branch.id) && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
              {branches.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic col-span-2 text-center py-4">No branches found. Create a branch first.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
            >
              {isSaving ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {userData ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
