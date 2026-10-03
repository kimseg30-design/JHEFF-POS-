'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/db/idb';
import { useRouter, usePathname } from 'next/navigation';
import { userService } from '@/lib/services/user-service';
import { auditService } from '@/lib/services/audit-service';

export type UserRole = 'admin' | 'cashier';

interface AuthContextType {
  user: Omit<User, 'passwordHash'> | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isCashier: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple hash function for simulation
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'passwordHash'> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const savedUserId = localStorage.getItem('pos-user-id');
      if (savedUserId) {
        try {
          const userData = await userService.getById(savedUserId);
          if (userData) {
            const { passwordHash, ...userWithoutPassword } = userData;
            setUser(userWithoutPassword);
          } else {
            localStorage.removeItem('pos-user-id');
          }
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const users = await userService.getAll();
    const foundUser = users.find(u => u.email === email);
    
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const hashedPassword = await hashPassword(password);
    if (foundUser.passwordHash !== hashedPassword) {
      throw new Error('Invalid email or password');
    }

    const { passwordHash, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('pos-user-id', foundUser.id);
    await auditService.log('USER_LOGIN', `User ${email} logged in`, email);
    router.push('/');
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    const users = await userService.getAll();
    
    // Check if any user exists
    if (users.length > 0) {
      // If users exist, only an admin can create new users via management (not this signup page)
      // But for this local simulation, we'll allow it if the user is an admin
      if (user?.role !== 'admin') {
        throw new Error('Only administrators can create new accounts.');
      }
    } else {
      // First user MUST be an admin
      if (role !== 'admin') {
        throw new Error('The first user must be an administrator.');
      }
    }

    if (users.some(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const businessId = 'main_config'; // Default business ID for local simulation
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashedPassword,
      role,
      businessId,
      assignedBranchIds: [], // Admins have access to all, cashiers need assignment
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await userService.create(newUser);
    await auditService.log('USER_SIGNUP', `User ${email} signed up as ${role}`, email);
    
    // Auto login after signup if it's the first user
    if (users.length === 0) {
      const { passwordHash, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('pos-user-id', newUser.id);
      router.push('/');
    }
  };

  const logout = () => {
    if (user) {
      auditService.log('USER_LOGOUT', `User ${user.email} logged out`, user.email);
    }
    setUser(null);
    localStorage.removeItem('pos-user-id');
    router.push('/login');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAdmin: user?.role === 'admin',
    isCashier: user?.role === 'cashier',
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
