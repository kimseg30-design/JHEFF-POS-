'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useUsers } from '@/lib/hooks/use-users';
import { User as UserIcon, Plus, Mail, Shield, Edit2, Trash2, Loader2, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserForm } from '@/components/users/user-form';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { users, loading, createUser, updateUser, deleteUser } = useUsers();
  const [editingUser, setEditingUser] = useState<any | null | 'new'>(null);

  const handleSaveUser = async (formData: any) => {
    try {
      if (editingUser === 'new') {
        const passwordHash = await hashPassword(formData.password);
        await createUser({
          name: formData.name,
          email: formData.email,
          passwordHash,
          role: formData.role,
          assignedBranchIds: formData.assignedBranchIds,
          businessId: currentUser?.businessId || 'main_config'
        });
      } else if (editingUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          assignedBranchIds: formData.assignedBranchIds,
        };

        if (formData.password) {
          updateData.passwordHash = await hashPassword(formData.password);
        }

        await updateUser(editingUser.id, updateData);
      }
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  // Simple hash function for simulation
  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Staff Members</h3>
        <button
          onClick={() => setEditingUser('new')}
          className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No users found</p>
          </div>
        ) : (
          users.map((u) => (
            <motion.div
              key={u.id}
              layout
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-gray-900 tracking-tight">{u.name}</h4>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {u.email}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  <Shield className="w-3 h-3" />
                  {u.role}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {editingUser && (
          <UserForm
            userData={editingUser === 'new' ? null : editingUser}
            onSave={handleSaveUser}
            onClose={() => setEditingUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
