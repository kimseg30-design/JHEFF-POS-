'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/layout/header';
import { User, Branch } from '@/lib/db/idb';
import { useUsers } from '@/lib/hooks/use-users';
import { branchService } from '@/lib/services/branch-service';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Plus, Shield, UserCircle, Mail, MapPin, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { UserForm } from '@/components/users/user-form';

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const { users, loading: usersLoading, createUser, updateUser, deleteUser } = useUsers();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<Omit<User, 'passwordHash'> | null | 'new'>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const allBranches = await branchService.getAll();
        setBranches(allBranches);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

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

  // Simple hash function for simulation (duplicated from auth-context for now)
  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const filteredUsers = (users || []).filter(u => 
    u?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loading = usersLoading || loadingBranches;

  // Prevent rendering before critical data is ready if needed, 
  // though AuthGuard handles initial auth loading.
  if (usersLoading && users.length === 0 && !searchQuery) {
    return (
      <AuthGuard allowedRoles={['admin']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
          <Header />
          <main className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading User Management...</p>
          </main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-950 dark:text-white tracking-tighter uppercase leading-none">User Management</h2>
              <p className="text-gray-600 dark:text-gray-300 font-bold mt-2 text-sm">Manage staff accounts and permissions</p>
            </div>
            
            <button
              type="button"
              onClick={() => setEditingUser('new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add New User
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 dark:bg-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">User</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Role</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Branches</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Joined</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest text-[10px]">Loading Users...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <UserCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest text-xs">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u?.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u?.role === 'admin' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'}`}>
                              <UserIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-gray-950 dark:text-white tracking-tight">{u?.name || 'Unknown User'}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {u?.email || 'No Email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            u?.role === 'admin' 
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                              : 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {u?.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-1">
                            {u?.role === 'admin' ? (
                              <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">All Branches</span>
                            ) : u?.assignedBranchIds && u.assignedBranchIds.length > 0 ? (
                              u.assignedBranchIds.map(bid => {
                                const branch = branches?.find(b => b?.id === bid);
                                return (
                                  <span key={bid} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-bold">
                                    {branch?.name || 'Unknown'}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">No Branches</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                            {u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                              title="Edit user"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => u?.id && handleDeleteUser(u.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-rose-900/40 text-red-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

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
    </AuthGuard>
  );
}
