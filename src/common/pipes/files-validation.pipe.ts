import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import {
  AllowedApplicationMimetypes,
  AllowedFileSizes,
  AllowedImagesMimetypes,
  AllowedMimeTypes,
} from 'src/common/enums';

@Injectable()
export class FilesValidationPipe implements PipeTransform {
  private readonly allowedImageExtensions = Object.values(
    AllowedImagesMimetypes,
  ).map((type) => type.split('/')[1].toUpperCase());
  private readonly allowedApplicationExtensions = Object.values(
    AllowedApplicationMimetypes,
  ).map((type) => type.split('/')[1].toUpperCase());

  private fileInfoParser(mimetype: AllowedMimeTypes, size?: number) {
    const [type, extension] = mimetype.split('/');
    const isImage = type === 'image';
    const isApplication = type === 'application';
    const fileSizeInMB = size ? (size / (1024 * 1024)).toFixed(2) : '0.00';

    return {
      type,
      extension: extension.toUpperCase(),
      fileType: isImage ? 'image' : isApplication ? 'application' : 'unknown',
      fileSizeInMB,
      isImage,
      isApplication,
    };
  }

  private isValidFile(mimetype: AllowedMimeTypes): {
    extension: string;
    allowed: boolean;
  } {
    const { extension, isImage, isApplication } = this.fileInfoParser(mimetype);
    const isImageValid =
      isImage && this.allowedImageExtensions.includes(extension);
    const isApplicationValid =
      isApplication && this.allowedApplicationExtensions.includes(extension);

    if (isImageValid) {
      return { extension, allowed: true };
    } else if (isApplicationValid) {
      return { extension, allowed: true };
    } else {
      throw new BadRequestException(
        `File type ${extension} is not allowed, allowed types are: ${isImageValid ? this.allowedImageExtensions.join(', ') : this.allowedApplicationExtensions.join(', ')}`,
      );
    }
  }

  private isValidSize(fileSize: number, mimetype: AllowedMimeTypes) {
    console.log('🚀 ~ FilesValidationPipe ~ isValidSize ~ fileSize::', {
      fileSize,
      mimetype,
    });
    const { fileSizeInMB, isImage, isApplication } = this.fileInfoParser(
      mimetype,
      fileSize,
    );
    const allowedSizeInMB = isImage
      ? (AllowedFileSizes.IMAGE / (1024 * 1024)).toFixed(2)
      : (AllowedFileSizes.APPLICATION / (1024 * 1024)).toFixed(2);

    if (isImage && fileSize > AllowedFileSizes.IMAGE) {
      throw new BadRequestException(
        `File size ${fileSizeInMB} MB exceeds the allowed limit of ${allowedSizeInMB} MB for images.`,
      );
    }

    if (isApplication && fileSize > AllowedFileSizes.APPLICATION) {
      throw new BadRequestException(
        `File size ${fileSizeInMB} MB exceeds the allowed limit of ${allowedSizeInMB} MB for applications.`,
      );
    }

    return true;
  }

  transform(value: Express.Multer.File[], _metadata: ArgumentMetadata) {
    if (value.length === 0) throw new Error('No files provided');

    let allowedFiles: Express.Multer.File[] = [];

    value.forEach((file) => {
      const { allowed } = this.isValidFile(file.mimetype as AllowedMimeTypes);

      const isSizeValid = this.isValidSize(
        file.size,
        file.mimetype as AllowedMimeTypes,
      );

      if (allowed && isSizeValid) {
        allowedFiles.push(file);
      }
    });

    return allowedFiles.length === 1 ? allowedFiles[0] : allowedFiles;
  }
}
