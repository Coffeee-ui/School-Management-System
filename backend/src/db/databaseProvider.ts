export interface QueryResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface IDatabaseProvider {
  query<T = unknown>(sql: string, params?: unknown[]): T[];
  queryOne<T = unknown>(sql: string, params?: unknown[]): T | null;
  execute(sql: string, params?: unknown[]): QueryResult;
  exec(sql: string): void;
  transaction<T>(fn: () => T): T;
  close(): void;
}
