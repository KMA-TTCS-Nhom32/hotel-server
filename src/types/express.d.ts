import { Request } from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request extends Request {}
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}
