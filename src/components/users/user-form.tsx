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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {userData ? 'Edit User' : 'Add New User'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="juan@store.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                {userData ? 'New Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <input
                  type="password"
                  required={!userData}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'cashier' })}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                    formData.role === 'cashier'
                      ? 'bg-orange-50 border-orange-600 text-orange-600'
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  Cashier
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                    formData.role === 'admin'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Assigned Branches
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => toggleBranch(branch.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    formData.assignedBranchIds.includes(branch.id)
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span className="font-bold text-xs">{branch.name}</span>
                  {formData.assignedBranchIds.includes(branch.id) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
              {branches.length === 0 && (
                <p className="text-xs text-gray-400 italic col-span-2 text-center py-4">No branches found. Create a branch first.</p>
              )}
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
