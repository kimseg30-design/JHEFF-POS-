'use client';

import { useState, useEffect, useCallback } from 'react';
import { Branch } from '@/lib/db/idb';
import { branchService } from '@/lib/services/branch-service';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/lib/hooks/use-store';

const CURRENT_BRANCH_KEY = 'sarisari_current_branch_id';

export function useBranches() {
  const { user, isAdmin } = useAuth();
  const { 
    branches: allBranches, 
    currentBranchId, 
    currentBranch, 
    loading, 
    addBranch, 
    updateBranch,
    deleteBranch,
    switchBranch 
  } = useStore();

  const branches = user && !isAdmin 
    ? allBranches.filter(b => user.assignedBranchIds.includes(b.id))
    : allBranches;

  return {
    branches,
    currentBranchId,
    currentBranch,
    loading,
    addBranch,
    updateBranch,
    deleteBranch,
    selectBranch: switchBranch,
    refresh: () => {}, // Handled by StoreProvider
  };
}
