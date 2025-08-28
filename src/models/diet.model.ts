import mongoose from "mongoose";
import { DietState } from "types/diet.type";

const DietSchema = new mongoose.Schema<DietState>(
  {},
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Diet = mongoose.model("Diet", DietSchema);
