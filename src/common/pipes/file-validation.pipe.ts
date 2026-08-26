import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    console.log('🚀 ~ FileValidationPipe ~ transform ~ value:', value);
    const maxSize = 1 * 1024 * 1024; // 1MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!value) {
      throw new Error('No file uploaded');
    }

    if (value.size > maxSize) {
      throw new Error('File size exceeds the maximum limit of 1MB');
    }

    if (!allowedTypes.includes(value.mimetype)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, and WEBP are allowed',
      );
    }

    return value;
  }
}
