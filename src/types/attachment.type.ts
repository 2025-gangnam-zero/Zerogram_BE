export type AttachmentState = {
  fileUrl: string; // CDN/S3 URL
  fileName?: string;
  contentType?: string;
  size?: number; // bytes
  width?: number; // 이미지/영상
  height?: number;
};

// ✅ 단일 이벤트용
export type IncomingAttachment = {
  fileName: string;
  contentType?: string;
  size?: number;
  width?: number; // 서버에서 메타를 추출하지 않으므로 입력값 그대로 저장(선택)
  height?: number; // "
  data: ArrayBuffer; // 클라 → 서버 바이너리
};
