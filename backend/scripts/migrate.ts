import { SqliteProvider } from '../src/db/sqliteProvider.js';
import { initializeDatabaseSchema } from '../src/db/schema.js';

export function runMigration(): void {
  console.log('Running database migration and integrity verification...');
  const provider = SqliteProvider.getInstance();

  initializeDatabaseSchema(provider);

  // Check integrity
  const integrity = provider.query<{ integrity_check: string }>('PRAGMA integrity_check;');
  console.log('Integrity check result:', integrity[0]?.integrity_check);

  // Check foreign keys
  const fkCheck = provider.query('PRAGMA foreign_key_check;');
  if (fkCheck.length === 0) {
    console.log('Foreign key check passed: 0 violations.');
  } else {
    console.warn('Foreign key violations detected:', fkCheck);
  }

  console.log('Migration and schema verification completed successfully.');
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  try {
    runMigration();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
