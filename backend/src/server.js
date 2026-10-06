import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config({ quiet: true });

const {
  PORT = "4000",
  JWT_SECRET,
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER,
  DB_PASSWORD,
  DB_NAME = "lumen",
  DB_SSL,
  S3_BUCKET,
  AWS_REGION = "ap-south-1",
  SIGNED_URL_TTL = "3600",
  CORS_ORIGIN,
} = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("JWT_SECRET is missing or too short (use 16+ characters).");
  process.exit(1);
}

const db = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
  ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

const s3 = S3_BUCKET ? new S3Client({ region: AWS_REGION }) : null;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

const requireAuth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new HttpError(401, "Please sign in again");
  }
  const [rows] = await db.query("SELECT id, email, full_name FROM users WHERE id = ?", [payload.sub]);
  if (rows.length === 0) throw new HttpError(401, "Please sign in again");
  req.user = { id: rows[0].id, email: rows[0].email, name: rows[0].full_name };
  next();
});

const CONTENT_TYPES = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

async function streamUrlFor(row) {
  if (row.s3_key && s3) {
    try {
      const ext = String(row.s3_key).split(".").pop().toLowerCase();
      return await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: row.s3_key,
          ResponseContentType: CONTENT_TYPES[ext],
        }),
        { expiresIn: Number(SIGNED_URL_TTL) || 3600 },
      );
    } catch (err) {
      console.error("S3 signing failed:", err.message);
    }
  }
  return row.fallback_url || null;
}

const app = express();
app.disable("x-powered-by");
if (CORS_ORIGIN) app.use(cors({ origin: CORS_ORIGIN.split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post(
  "/api/auth/signup",
  wrap(async (req, res) => {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const name = String(b.name || "").trim().slice(0, 80) || email.split("@")[0];
    if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, "Enter a valid email");
    if (password.length < 6 || password.length > 72)
      throw new HttpError(400, "Password must be 6 to 72 characters");
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    try {
      await db.query("INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)", [
        id,
        email,
        hash,
        name,
      ]);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "User already registered");
      throw err;
    }
    res.status(201).json({ token: signToken(id), user: { id, email, name } });
  }),
);

app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const [rows] = await db.query(
      "SELECT id, email, full_name, password_hash FROM users WHERE email = ?",
      [email],
    );
    const ok = rows.length > 0 && (await bcrypt.compare(password, rows[0].password_hash));
    if (!ok) throw new HttpError(401, "Invalid login credentials");
    const u = rows[0];
    res.json({ token: signToken(u.id), user: { id: u.id, email: u.email, name: u.full_name } });
  }),
);

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

app.get(
  "/api/dashboard",
  requireAuth,
  wrap(async (req, res) => {
    const [lectureRows] = await db.query(
      `SELECT l.id, l.title, l.kind, l.meta, l.thumbnail, l.duration_seconds,
              c.title AS course_title, c.instructor, c.category, c.color
         FROM lectures l JOIN courses c ON c.id = l.course_id
        ORDER BY l.position, l.title`,
    );
    const [progressRows] = await db.query(
      "SELECT lecture_id, percent, completed, updated_at FROM lecture_progress WHERE user_id = ?",
      [req.user.id],
    );
    const progress = progressRows.map((p) => ({
      lecture_id: p.lecture_id,
      percent: p.percent,
      completed: Boolean(p.completed),
      updated_at: new Date(p.updated_at).toISOString(),
    }));
    const pmap = new Map(progress.map((p) => [p.lecture_id, p]));
    const lectures = lectureRows.map((l) => ({
      id: l.id,
      title: l.title,
      kind: l.kind,
      meta: l.meta,
      thumbnail: l.thumbnail,
      duration_seconds: l.duration_seconds,
      course: { title: l.course_title, instructor: l.instructor, category: l.category, color: l.color },
      percent: pmap.get(l.id)?.percent ?? 0,
    }));
    const completed = progress.filter((p) => p.completed).length;
    const watchedSeconds = lectures.reduce((s, l) => s + (l.duration_seconds * l.percent) / 100, 0);
    const recent = [...progress]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 4)
      .map((p) => ({ ...p, title: lectures.find((l) => l.id === p.lecture_id)?.title ?? "" }));
    res.json({
      name: req.user.name || "Learner",
      lectures,
      stats: {
        inProgress: lectures.filter((l) => l.percent > 0 && l.percent < 100).length,
        completed,
        total: lectures.length,
        hours: watchedSeconds / 3600,
        xp: Math.round(watchedSeconds / 6) + completed * 100,
      },
      recent,
    });
  }),
);

app.get(
  "/api/lectures/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) throw new HttpError(404, "Lecture not found");
    const [rows] = await db.query(
      `SELECT l.id, l.title, l.kind, l.meta, l.thumbnail, l.duration_seconds, l.position,
              l.s3_key, l.fallback_url,
              c.title AS course_title, c.instructor, c.category, c.color
         FROM lectures l JOIN courses c ON c.id = l.course_id WHERE l.id = ?`,
      [id],
    );
    if (rows.length === 0) throw new HttpError(404, "Lecture not found");
    const l = rows[0];
    const [prog] = await db.query(
      "SELECT percent, position_seconds FROM lecture_progress WHERE user_id = ? AND lecture_id = ?",
      [req.user.id, id],
    );
    res.json({
      lecture: {
        id: l.id,
        title: l.title,
        kind: l.kind,
        meta: l.meta,
        thumbnail: l.thumbnail,
        duration_seconds: l.duration_seconds,
        position: l.position,
        course: { title: l.course_title, instructor: l.instructor, category: l.category, color: l.color },
      },
      streamUrl: await streamUrlFor(l),
      progress: prog[0]
        ? { percent: prog[0].percent, position_seconds: prog[0].position_seconds }
        : { percent: 0, position_seconds: 0 },
    });
  }),
);

app.post(
  "/api/progress",
  requireAuth,
  wrap(async (req, res) => {
    const b = req.body || {};
    const percent = Number(b.percent);
    const position = Number(b.position);
    if (
      typeof b.lectureId !== "string" ||
      !UUID_RE.test(b.lectureId) ||
      !Number.isFinite(percent) ||
      !Number.isFinite(position) ||
      percent < 0 ||
      percent > 100 ||
      position < 0
    ) {
      throw new HttpError(400, "Invalid progress data");
    }
    const pct = Math.round(percent);
    try {
      await db.query(
        `INSERT INTO lecture_progress (user_id, lecture_id, percent, position_seconds, completed, updated_at)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE percent = VALUES(percent), position_seconds = VALUES(position_seconds),
           completed = VALUES(completed), updated_at = UTC_TIMESTAMP()`,
        [req.user.id, b.lectureId, pct, Math.round(position), pct >= 95 ? 1 : 0],
      );
    } catch (err) {
      if (err.code === "ER_NO_REFERENCED_ROW_2") throw new HttpError(404, "Lecture not found");
      throw err;
    }
    res.json({ ok: true });
  }),
);

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found")));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Lumen API listening on ${PORT}${s3 ? ` (S3 bucket: ${S3_BUCKET})` : " (S3 off)"}`);
});
