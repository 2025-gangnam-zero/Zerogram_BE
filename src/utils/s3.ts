import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config";
import { S3_BUCKET_NAME } from "../constants";

/** ─────────────────────────────────────────────────────────
 * 공용: URL 또는 key를 받아 항상 key로 변환
 *  - 이미 key면 그대로 반환
 *  - https://.../.com/ 뒤를 자르는 현재 로직을 보완
 * ───────────────────────────────────────────────────────── */
const toKey = (input: string) => {
  try {
    // URL인 경우
    const url = new URL(input);
    // S3 path-style / virtual-hosted-style 모두 대응
    // ex) https://{bucket}.s3.amazonaws.com/prefix/a.png
    // ex) https://s3.ap-northeast-2.amazonaws.com/{bucket}/prefix/a.png
    const host = url.hostname;
    const pathname = url.pathname.replace(/^\/+/, ""); // 맨 앞 / 제거

    if (host.startsWith(`${S3_BUCKET_NAME}.`)) {
      // virtual-hosted-style
      return pathname;
    }
    // path-style
    const [bucketMaybe, ...rest] = pathname.split("/");
    if (bucketMaybe === S3_BUCKET_NAME && rest.length) {
      return rest.join("/");
    }
    // URL이지만 형식이 다르면 마지막 세그먼트만이라도
    return pathname;
  } catch {
    // URL이 아니면 이미 key라고 가정
    return input;
  }
};

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `profiles/${uniqueSuffix}${path.extname(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE, // multer-s3가 자동 추론
  }),
});

export const deleteImage = async (keyOrUrl: string) => {
  const Key = toKey(keyOrUrl);
  const data = await s3.send(
    new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key })
  );
  console.log("Success. Object deleted.", data);
};

export const deleteImages = async (inputs: string[]) => {
  await Promise.all(inputs.map((s) => deleteImage(s)));
};

type Args = {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
  prefix?: string; // 기본 폴더 (예: "chat"|"profiles" 등)
};

const safe = (s: string) => s.replace(/[^\w.\-]+/g, "_");

/** ─────────────────────────────────────────────────────────
 * MIME 타입 결정: 제공값 > file-type(from buffer) > 확장자 > octet
 * ───────────────────────────────────────────────────────── */
async function decideContentType(
  buffer: Buffer,
  fileName: string,
  hint?: string
): Promise<string> {
  if (hint) return hint;

  // 1) file-type을 ESM 동적 import로 안전 사용
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - TS가 ESM 동적 import를 추론 못할 수 있음
    const { fileTypeFromBuffer } = await import("file-type");
    const ft = await fileTypeFromBuffer(buffer);
    if (ft?.mime) return ft.mime;
  } catch {
    // file-type 미설치/미지원이어도 무시
  }

  // 2) 확장자로 추론(의존성 추가 없이 최소화)
  const ext = path.extname(fileName).toLowerCase();
  if (ext) {
    // 필요한 것만 간단 매핑(원하면 mime-types 패키지 사용)
    const simple: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".json": "application/json",
      ".zip": "application/zip",
    };
    if (simple[ext]) return simple[ext];
  }

  // 3) 마지막 기본값
  return "application/octet-stream";
}

export const uploadFromBuffer = async ({
  buffer,
  fileName,
  contentType,
  prefix = "chat",
}: Args): Promise<{ fileUrl: string; key: string }> => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const key = `${prefix}/${y}/${m}/${uniq}-${safe(fileName)}`;

  const resolvedContentType = await decideContentType(
    buffer,
    fileName,
    contentType
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: resolvedContentType,
      // ACL: "public-read", // 버킷 정책에 따라 필요 시 사용
    })
  );

  // CloudFront를 쓰면 CloudFront 도메인으로 치환 권장
  const fileUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  return { fileUrl, key };
};
