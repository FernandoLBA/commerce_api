import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { ValidationException } from '../exceptions/api.exception';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly folder = 'commerce-api';

  onModuleInit() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload an image from a buffer (file upload)
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options?: { folder?: string; publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder || `${this.folder}/products`,
          public_id: options?.publicId,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new ValidationException(
                `Failed to upload image: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            reject(
              new ValidationException('Upload failed: No result returned'),
            );
            return;
          }
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload an image from a URL
   */
  async uploadFromUrl(
    url: string,
    options?: { folder?: string; publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options?.folder || `${this.folder}/products`,
        public_id: options?.publicId,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error: any) {
      throw new ValidationException(
        `Failed to upload image from URL: ${error.message}`,
      );
    }
  }

  /**
   * Delete an image by public ID
   */
  async delete(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error: any) {
      throw new ValidationException(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMany(
    publicIds: string[],
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const publicId of publicIds) {
      try {
        const success = await this.delete(publicId);
        if (success) {
          deleted.push(publicId);
        } else {
          failed.push(publicId);
        }
      } catch {
        failed.push(publicId);
      }
    }

    return { deleted, failed };
  }

  /**
   * Generate a transformed URL for an image
   */
  getTransformedUrl(
    publicId: string,
    options: CloudinaryTransformOptions = {},
  ): string {
    const transformation: any = {};

    if (options.width) transformation.width = options.width;
    if (options.height) transformation.height = options.height;
    if (options.crop) transformation.crop = options.crop;
    if (options.quality) transformation.quality = options.quality;
    if (options.format) transformation.fetch_format = options.format;

    return cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    });
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(publicId: string, size = 150): string {
    return this.getTransformedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Generate optimized product image URL
   */
  getProductImageUrl(publicId: string, width = 800): string {
    return this.getTransformedUrl(publicId, {
      width,
      crop: 'limit',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Get multiple sizes for responsive images
   */
  getResponsiveUrls(publicId: string): Record<string, string> {
    return {
      thumbnail: this.getThumbnailUrl(publicId, 150),
      small: this.getProductImageUrl(publicId, 400),
      medium: this.getProductImageUrl(publicId, 800),
      large: this.getProductImageUrl(publicId, 1200),
      original: this.getTransformedUrl(publicId, {
        quality: 'auto',
        format: 'auto',
      }),
    };
  }
}
