import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config";
import { S3_BUCKET_NAME } from "../constants";

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

      cb(null, `profiles/${uniqueSuffix}${path.extname(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
});

export const deleteImage = async (key: string) => {
  const data = await s3.send(
    new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })
  );
  console.log("Success. Object deleted.", data);
};

export const deleteImages = async (keys: string[]) => {
  await Promise.all(
    keys.map((location) => deleteImage(location.split(".com/")[1]))
  );
};

type Args = {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
  prefix?: string; // 기본 폴더
};

const safe = (s: string) => s.replace(/[^\w.\-]+/g, "_");

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

  // 기존 프로필처럼 하위 폴더 고정이면 prefix만 바꾸세요.
  const key = `${prefix}/${y}/${m}/${uniq}-${safe(fileName)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // 퍼블릭 접근이 필요하면 아래 주석 해제 (버킷 정책에 따라 다름)
      // ACL: "public-read",
    })
  );

  // 버킷 공개 방식에 따라 URL 생성 로직 조정
  const fileUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  return { fileUrl, key };
};
