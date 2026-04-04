export enum AllowedApplicationMimetypes {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export enum AllowedImagesMimetypes {
  JPG = 'image/jpg',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export type AllowedMimeTypes =
  | AllowedApplicationMimetypes
  | AllowedImagesMimetypes;
