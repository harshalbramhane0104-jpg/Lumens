# Lumen — Video Lecture & Learning Platform

Separate frontend and backend:

```
Browser -> nginx -> frontend (React/TanStack Start, port 3000)
                 -> backend  (Express API, port 4000) -> MySQL (RDS) + S3
```

- `src/` — frontend. Calls the API at `/api`.
- `backend/` — Express API. Users, courses, lectures and progress live in MySQL (`backend/schema.sql`). Lecture videos live in S3; the API returns a short-lived signed link each time a lecture is opened.

## Backend setup
1. Create a MySQL database (RDS MySQL 8) and run `backend/schema.sql` on it.
2. `cp backend/.env.example backend/.env` and fill in `JWT_SECRET`, `DB_*`, `S3_BUCKET`, `AWS_REGION`.
3. `cd backend && npm install && npm start`

## Frontend setup
`npm install && npm run dev` (set `VITE_API_URL=http://localhost:4000/api` and `CORS_ORIGIN=http://localhost:8080` in the backend `.env` for local dev).

## Add a lecture stored in S3
Upload the file to `s3://<bucket>/lectures/<name>.mp4`, then:

```sql
INSERT INTO lectures (id, course_id, title, kind, meta, thumbnail, s3_key, duration_seconds, position)
SELECT UUID(), id, 'My lecture', 'video', '12:40', 'coding', 'lectures/<name>.mp4', 760, 10
FROM courses WHERE title = 'Full-Stack React & Node';
```
