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
import { initSocket } from "./socket";

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || `.env.${env}`,
});

const app = express();

const server = http.createServer(app);

// swagger ui 연결
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const corsOrigins = Array.from(
  new Set(
    [
      CLIENT_URL, // .env에서 가져온 배포/프론트 도메인 (예: https://app.example.com)
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean)
  )
);

app.use(
  cors({
    origin: (origin, cb) => {
      // 모바일 앱 file:// 등 origin 없는 경우 허용
      if (!origin) return cb(null, true);
      // 정확히 일치만 허용(와일드카드 필요하면 정규식으로 확장)
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS_BLOCKED_ORIGIN:${origin}`), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(env === "local" || env === "dev" ? "/api/" : "/", routes());

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

mongoose.Promise = Promise;

const MONGODB_URL = process.env.MONGODB_URL || "";

// --- Socket.IO 붙이기 ---
initSocket(server, { path: "/ws", corsOrigins });

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("MongoDB에 성공적으로 연결되었습니다.");
    server.listen(PORT, () => {
      console.log(`서버가 ${PORT} 포트에 연결됨`);
      console.log(`스웨거가 ${PORT} 포트에 연결됨`);
      console.log(`Socket.IO '/chat' at '/ws' 준비 완료`);
    });
  })
  .catch((error) => {
    console.error("MongoDB 연결 중 오류 발생:", error);
  });

// MongoDB 연결 에러를 처리합니다.
mongoose.connection.on("error", (error: Error) => console.log(error));

app.use(errorHandler);
