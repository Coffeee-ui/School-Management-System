import { AuditRepository, AuditFilters, AuditStats } from '../repositories/auditRepository.js';
import { AuditLog } from '../models/types.js';

export class AuditService {
  private auditRepo: AuditRepository;

  constructor(auditRepo?: AuditRepository) {
    this.auditRepo = auditRepo || new AuditRepository();
  }

  public log(params: {
    userId?: number | null;
    username: string;
    role: string;
    action: string;
    resource: string;
    details?: string | null | Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
  }): AuditLog {
    const detailsStr =
      typeof params.details === 'object' && params.details !== null
        ? JSON.stringify(params.details)
        : params.details || null;

    return this.auditRepo.create({
      user_id: params.userId || null,
      username: params.username,
      role: params.role,
      action: params.action,
      resource: params.resource,
      details: detailsStr,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
  }

  public getLogs(filters: AuditFilters): { logs: AuditLog[]; total: number } {
    return this.auditRepo.findWithFilters(filters);
  }

  public getStats(): AuditStats {
    return this.auditRepo.getStats();
  }

  public exportCsv(filters: AuditFilters): string {
    const { logs } = this.auditRepo.findWithFilters({ ...filters, limit: 10000, offset: 0 });
    const headers = ['ID', 'Timestamp', 'User ID', 'Username', 'Role', 'Action', 'Resource', 'Details', 'IP Address', 'User Agent'];
    const rows = logs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      l.user_id ?? '',
      `"${l.username.replace(/"/g, '""')}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.resource}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ip_address}"`,
      `"${(l.user_agent || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
