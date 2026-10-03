'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuditLog } from '@/lib/db/idb';
import { auditService } from '@/lib/services/audit-service';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditService.getAll();
      setLogs(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    refresh: fetchLogs,
  };
}
