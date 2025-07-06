// This declaration file is used to augment the Express namespace
// It ensures the Express.Multer.File type is available during build

import * as multer from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      // Re-export Multer's File type
      interface File extends multer.File {}
    }
  }
}
