// src/app.ts
require("reflect-metadata");
require("dotenv").config();

import express, { Request } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import versionRouter from "./api/versionRouter";

const app = express();

const cors = require('cors')

let corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "worker-src": ["'self'", "blob:"],
        // "script-src": ["'self'", "'unsafe-inline'", "blob:", "data:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "data:"],
        "img-src": ["'self'", "data:", "blob:"],
        // wss: explizit für den WebSocket (presence). Moderne Browser decken ihn über 'self' ab, ältere Safari-Versionen nicht.
        // blob: für die PDF-Vorschau: documentService.getDocumentFile liefert eine blob:-URL, die pdf.js per fetch lädt
        "connect-src": ["'self'", "https://empowhr.andreasivanov.de", "wss://empowhr.andreasivanov.de", "blob:"],
        "frame-src": ["'self'", "blob:"],
        "script-src-elem": ["'self'", "'unsafe-inline'", "blob:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

const loggingFormat = ":date[iso] - :method - :url - Status :status - :response-time ms - :total-time ms - :res[content-length]";
app.use(morgan(loggingFormat, {
  skip: (req: Request) => {
    return req.method === 'OPTIONS' || process.env.NODE_ENV === "test";
  }
}))

app.use(versionRouter)

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const PORT: string = process.env.PORT || "3000";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EmpowHR API",
      version: "1.0.0",
      description: "API Dokumentation für EmpowHR",
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: "Development Server",
      },
    ],
  },
  apis: [__dirname + "/api/v1/**/*.{js,ts}"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(path.join(__dirname, '../public')))
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

export default app;