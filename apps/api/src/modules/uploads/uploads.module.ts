import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import * as fs from 'fs';
import { UploadsController } from './uploads.controller';

function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  let currentDir = __dirname;
  for (let i = 0; i < 5; i++) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === 'dzencode-inventory-monorepo') {
          const uploads = path.join(currentDir, 'uploads');
          if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
          return uploads;
        }
      } catch {}
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  const fallback = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const uploadsDir = getUploadsDir();
const customPrefix = process.env.BASE_PATH
  ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}/static`
  : null;

const staticConfigs = [
  {
    rootPath: uploadsDir,
    serveRoot: '/static',
  },
  {
    rootPath: uploadsDir,
    serveRoot: '/test/static',
  },
];

if (customPrefix && customPrefix !== '/static' && customPrefix !== '/test/static') {
  staticConfigs.push({
    rootPath: uploadsDir,
    serveRoot: customPrefix,
  });
}

@Module({
  imports: [
    ServeStaticModule.forRoot(...staticConfigs),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
