import { IDatabaseProvider, QueryResult } from '../db/databaseProvider.js';
import { SqliteProvider } from '../db/sqliteProvider.js';

export abstract class BaseRepository<T> {
  protected provider: IDatabaseProvider;
  protected tableName: string;

  constructor(tableName: string, provider?: IDatabaseProvider) {
    this.tableName = tableName;
    this.provider = provider || SqliteProvider.getInstance();
  }

  public findById(id: number | string): T | null {
    return this.provider.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
  }

  public findAll(orderBy: string = 'id ASC'): T[] {
    return this.provider.query<T>(
      `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`
    );
  }

  public delete(id: number | string): boolean {
    const result = this.provider.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  public count(): number {
    const row = this.provider.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return row ? row.count : 0;
  }
}
