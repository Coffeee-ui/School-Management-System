import path from 'path';
import fs from 'fs';
import { APP_CONFIG } from '../config/index.js';

export interface DbConfig {
  dbPath: string;
  walMode: boolean;
  foreignKeys: boolean;
}

export function getDbConfig(): DbConfig {
  const resolvedPath = path.isAbsolute(APP_CONFIG.SQLITE_DB_PATH)
    ? APP_CONFIG.SQLITE_DB_PATH
    : path.resolve(process.cwd(), APP_CONFIG.SQLITE_DB_PATH);

  // Ensure directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return {
    dbPath: resolvedPath,
    walMode: true,
    foreignKeys: true,
  };
}
