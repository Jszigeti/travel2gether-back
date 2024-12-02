import { MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ParseFilePipe } from '@nestjs/common/pipes';

export const fileValidationPipe = new ParseFilePipe({
  fileIsRequired: false,
  validators: [
    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
    new FileTypeValidator({ fileType: /image\/(jpg|jpeg|png|gif)/ }),
  ],
});
