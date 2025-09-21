export type AttachmentState = {
  fileUrl: string; // CDN/S3 URL
  fileName?: string;
  contentType?: string;
  size?: number; // bytes
  width?: number; // 이미지/영상
  height?: number;
};
