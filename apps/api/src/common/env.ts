import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Robust environment variable loader for monorepo setups.
 * Traverses upwards from both __dirname and process.cwd() to locate .env files.
 */
export function loadEnvironment(): void {
  // 1. Search up from current directory (__dirname)
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const envLocal = path.join(dir, '.env.local');
    if (fs.existsSync(envLocal)) {
      dotenv.config({ path: envLocal });
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 2. Search up from working directory (process.cwd())
  let cwd = process.cwd();
  for (let i = 0; i < 6; i++) {
    const envPath = path.join(cwd, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const envLocal = path.join(cwd, '.env.local');
    if (fs.existsSync(envLocal)) {
      dotenv.config({ path: envLocal });
    }
    const parent = path.dirname(cwd);
    if (parent === cwd) break;
    cwd = parent;
  }
}

// Auto-run when module is loaded
loadEnvironment();
