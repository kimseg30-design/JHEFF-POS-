'use client';

import { BaseService } from './base-service';
import { User, STORES } from '@/lib/db/idb';

class UserService extends BaseService<User> {
  constructor() {
    super(STORES.USERS);
  }

  async getByBusiness(businessId: string): Promise<User[]> {
    return this.query(u => u.businessId === businessId);
  }
}

export const userService = new UserService();
