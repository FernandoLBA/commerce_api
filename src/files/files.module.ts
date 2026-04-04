import { Module } from '@nestjs/common';

import { CloudinaryService } from 'src/common';
import { FilesService } from './files.service';

@Module({
  providers: [FilesService, CloudinaryService],
  exports: [FilesService, CloudinaryService],
})
export class FilesModule {}
