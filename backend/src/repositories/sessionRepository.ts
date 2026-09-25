import { BaseRepository } from './baseRepository.js';
import { Session } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class SessionRepository extends BaseRepository<Session> {
  constructor(provider?: IDatabaseProvider) {
    super('sessions', provider);
  }

  public create(data: {
    id: string;
    user_id: number;
    token_hash: string;
    ip_address: string;
    user_agent: string;
  }): Session {
    const now = new Date().toISOString();
    this.provider.execute(
      `INSERT INTO sessions (
        id, user_id, token_hash, ip_address, user_agent,
        created_at, last_activity_at, ended_at, end_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [
        data.id,
        data.user_id,
        data.token_hash,
        data.ip_address,
        data.user_agent,
        now,
        now,
      ]
    );

    const created = this.findById(data.id);
    if (!created) {
      throw new Error('Failed to create session');
    }
    return created;
  }

  public updateActivity(id: string): void {
    this.provider.execute(
      `UPDATE sessions SET last_activity_at = ? WHERE id = ? AND ended_at IS NULL`,
      [new Date().toISOString(), id]
    );
  }

  public endSession(id: string, reason: string): void {
    this.provider.execute(
      `UPDATE sessions SET ended_at = ?, end_reason = ? WHERE id = ? AND ended_at IS NULL`,
      [new Date().toISOString(), reason, id]
    );
  }

  public endUserSessions(userId: number, reason: string): void {
    this.provider.execute(
      `UPDATE sessions SET ended_at = ?, end_reason = ? WHERE user_id = ? AND ended_at IS NULL`,
      [new Date().toISOString(), reason, userId]
    );
  }

  public findActiveSessions(): Session[] {
    return this.provider.query<Session>(
      `SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY last_activity_at DESC`
    );
  }

  public findByUserId(userId: number): Session[] {
    return this.provider.query<Session>(
      `SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  }
}
