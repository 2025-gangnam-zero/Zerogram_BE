import { Schema } from "mongoose";
import { AttachmentState } from "types";

export const AttachmentSchema = new Schema<AttachmentState>(
  {
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    contentType: { type: String },
    size: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);
