import { DatabaseSync } from 'node:sqlite';
import { IDatabaseProvider, QueryResult } from './databaseProvider.js';
import { getDbConfig } from './config.js';

export class SqliteProvider implements IDatabaseProvider {
  private db: DatabaseSync;
  private static instance: SqliteProvider | null = null;

  constructor(dbPath?: string) {
    const config = getDbConfig();
    const targetPath = dbPath || config.dbPath;
    this.db = new DatabaseSync(targetPath);

    if (config.foreignKeys) {
      this.db.exec('PRAGMA foreign_keys = ON;');
    }
    if (config.walMode) {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.db.exec('PRAGMA synchronous = NORMAL;');
  }

  public static getInstance(dbPath?: string): SqliteProvider {
    if (!SqliteProvider.instance) {
      SqliteProvider.instance = new SqliteProvider(dbPath);
    }
    return SqliteProvider.instance;
  }

  public static resetInstance(): void {
    if (SqliteProvider.instance) {
      try {
        SqliteProvider.instance.close();
      } catch {
        // ignore close error
      }
      SqliteProvider.instance = null;
    }
  }

  public query<T = unknown>(sql: string, params: unknown[] = []): T[] {
    const cleanParams = params.map(p => (p === undefined ? null : p)) as any[];
    const stmt = this.db.prepare(sql);
    const results = stmt.all(...cleanParams);
    return results as unknown as T[];
  }

  public queryOne<T = unknown>(sql: string, params: unknown[] = []): T | null {
    const cleanParams = params.map(p => (p === undefined ? null : p)) as any[];
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...cleanParams);
    return (result ?? null) as unknown as (T | null);
  }

  public execute(sql: string, params: unknown[] = []): QueryResult {
    const cleanParams = params.map(p => (p === undefined ? null : p)) as any[];
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...cleanParams);
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  public close(): void {
    this.db.close();
  }
}
