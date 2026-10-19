import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

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

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, getUploadsDir());
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase() || '.png';
          // Strictly force UUID v4 naming
          const uuid = crypto.randomUUID();
          cb(null, `${uuid}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return {
      filename: file.filename,
      url: `/static/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
