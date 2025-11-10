
// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import connectDB from "./config/db.js";
// import supportRoutes from "./routes/support.js";
// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import uploadRoutes from "./routes/upload.js";
// import productRoutes from "./routes/products.js";
// import orderRoutes from "./routes/orders.js";
// import flaskProxyRoutes from "./routes/flaskProxyRoutes.js";

// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use("/api/support", supportRoutes);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve uploaded files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Mount APIs
// app.use("/api/auth", authRoutes);
// app.use("/api/upload", uploadRoutes);     
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/flask", flaskProxyRoutes);

// // Health check
// app.get("/", (_req, res) =>
//   res.send("✅ FarmCom backend running successfully!")
// );

// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () =>
//   console.log(`🚀 Server listening at http://localhost:${PORT}`)
// );
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import supportRoutes from "./routes/support.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/upload.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import flaskProxyRoutes from "./routes/flaskProxyRoutes.js";

dotenv.config();
connectDB();

const app = express();

// 🔹 Secure CORS setup for Launch + local dev
const launchRegex = /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.launch\.contentstack\.app$/i;
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow health checks etc.
    if (launchRegex.test(origin) || envOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cors(corsOptions));  // ✅ this alone is enough for Express 5

// JSON parsing
app.use(express.json());

// Routes
app.use("/api/support", supportRoutes);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/flask", flaskProxyRoutes);

// Health check
app.get("/", (_req, res) =>
  res.send("✅ FarmCom backend running successfully!")
);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening at http://localhost:${PORT}`)
);
