'use client';

import { BaseService } from './base-service';
import { AuditLog, STORES } from '@/lib/db/idb';

class AuditService extends BaseService<AuditLog> {
  constructor() {
    super(STORES.AUDIT_LOGS);
  }

  async log(action: string, details: string, user?: string) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const log: AuditLog = {
      id,
      action,
      details,
      user,
      timestamp: now,
      updatedAt: now,
      isDeleted: false,
    };
    
    try {
      await this.create(log);
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}

export const auditService = new AuditService();
