import { Injectable } from '@nestjs/common';

import { CloudinaryService } from 'src/common';
import { UpdateFileDto, UploadFileDto } from './dto';

@Injectable()
export class FilesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFileToCloudinary(
    file: Express.Multer.File,
    folderPath: string,
    uploadFileDto?: UploadFileDto,
  ) {
    const uploadResult = await this.cloudinaryService.uploadFromBuffer(
      file.buffer,
      {
        folder: `commerce${folderPath}`,
      },
    );

    const urls = this.cloudinaryService.getResponsiveUrls(
      uploadResult.publicId,
    );

    return {
      uploadFileDto,
      urls,
    };
  }

  uploadFiles(uploadFileDto: UploadFileDto) {
    return 'This action adds a new file';
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }
}
