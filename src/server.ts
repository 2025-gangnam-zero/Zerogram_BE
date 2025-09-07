import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json";
import { CLIENT_URL, PORT } from "./constants";
import http from "http";

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || `.env.${env}`,
});

const app = express();

const server = http.createServer();

// swagger ui 연결
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

console.log(CLIENT_URL);

app.use(
  cors({
    origin: [`${CLIENT_URL}`, `http://localhost:3000`, `http://localhost:3001`],
    // 허용할 HTTP 메소드 설정
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    // 자격 증명(credentials)을 포함한 요청 허용
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", routes());

mongoose.Promise = Promise;

const MONGODB_URL = process.env.MONGODB_URL || "";

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("MongoDB에 성공적으로 연결되었습니다.");
    server.listen(PORT, () => {
      console.log(`서버가 ${PORT} 포트에 연결됨`);
      console.log(`스웨거가 ${PORT} 포트에 연결됨`);
    });
  })
  .catch((error) => {
    console.error("MongoDB 연결 중 오류 발생:", error);
  });

// MongoDB 연결 에러를 처리합니다.
mongoose.connection.on("error", (error: Error) => console.log(error));

app.use(errorHandler);
