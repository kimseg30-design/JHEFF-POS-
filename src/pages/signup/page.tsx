'use client';

import { useState } from 'react';
import { useAuth, UserRole } from '@/lib/contexts/auth-context';
import { motion } from 'motion/react';
import { Store, Mail, Lock, Loader2, ArrowRight, Shield, User } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin'); // Default to admin for first user
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup(name, email, password, role);
    } catch (err: any) {
      setError(err.message || 'Failed to signup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-[2rem] text-white shadow-2xl shadow-orange-200 mb-6">
            <Store className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Setup POS</h1>
          <p className="text-gray-500 font-medium mt-2">Create the administrator account</p>
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                  placeholder="name@store.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <input type="hidden" value={role} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-black text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-sm mt-8"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Setup Store <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-400 font-medium text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-600 font-black uppercase tracking-widest text-xs hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
