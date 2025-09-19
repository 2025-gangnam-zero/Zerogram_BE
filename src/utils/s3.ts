import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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
