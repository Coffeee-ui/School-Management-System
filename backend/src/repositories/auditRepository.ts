import { BaseRepository } from './baseRepository.js';
import { AuditLog } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export interface AuditFilters {
  userId?: number;
  username?: string;
  role?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  actionCounts: { action: string; count: number }[];
  resourceCounts: { resource: string; count: number }[];
  recentActivityCount: number;
}

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor(provider?: IDatabaseProvider) {
    super('audit_logs', provider);
  }

  public create(data: {
    user_id?: number | null;
    username: string;
    role: string;
    action: string;
    resource: string;
    details?: string | null;
    ip_address: string;
    user_agent: string;
  }): AuditLog {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO audit_logs (
        user_id, username, role, action, resource,
        details, ip_address, user_agent, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id || null,
        data.username,
        data.role,
        data.action,
        data.resource,
        data.details || null,
        data.ip_address,
        data.user_agent,
        now,
      ]
    );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create audit log entry');
    }
    return created;
  }

  public findWithFilters(filters: AuditFilters): { logs: AuditLog[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.userId !== undefined) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }
    if (filters.username) {
      conditions.push('username LIKE ?');
      params.push(`%${filters.username.trim()}%`);
    }
    if (filters.role) {
      conditions.push('role = ?');
      params.push(filters.role);
    }
    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }
    if (filters.resource) {
      conditions.push('resource = ?');
      params.push(filters.resource);
    }
    if (filters.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      conditions.push('(action LIKE ? OR resource LIKE ? OR details LIKE ? OR username LIKE ?)');
      const s = `%${filters.search.trim()}%`;
      params.push(s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = this.provider.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    const limit = filters.limit !== undefined ? filters.limit : 50;
    const offset = filters.offset !== undefined ? filters.offset : 0;

    const logs = this.provider.query<AuditLog>(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { logs, total };
  }

  public getStats(): AuditStats {
    const totalLogs = this.count();

    const actionCounts = this.provider.query<{ action: string; count: number }>(
      `SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10`
    );

    const resourceCounts = this.provider.query<{ resource: string; count: number }>(
      `SELECT resource, COUNT(*) as count FROM audit_logs GROUP BY resource ORDER BY count DESC LIMIT 10`
    );

    // Activity in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = this.provider.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE timestamp >= ?`,
      [yesterday]
    );

    return {
      totalLogs,
      actionCounts,
      resourceCounts,
      recentActivityCount: recent ? recent.count : 0,
    };
  }
}
