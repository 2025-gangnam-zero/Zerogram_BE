import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

const PORT = process.env.PORT || 4000;

const app = express();

app.use("/", routes());

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => console.log(`서버가 ${PORT} 포트에 연결됨`));
