CREATE DATABASE IF NOT EXISTS lumen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lumen;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  full_name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL DEFAULT 'brand'
);

CREATE TABLE IF NOT EXISTS lectures (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  meta VARCHAR(60) NOT NULL,
  thumbnail VARCHAR(30) NOT NULL,
  s3_key VARCHAR(500) NULL,
  fallback_url VARCHAR(1000) NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_lectures_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lecture_progress (
  user_id CHAR(36) NOT NULL,
  lecture_id CHAR(36) NOT NULL,
  percent INT NOT NULL DEFAULT 0,
  position_seconds INT NOT NULL DEFAULT 0,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, lecture_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

INSERT INTO courses (id, title, category, instructor, color)
SELECT UUID(), v.title, v.category, v.instructor, v.color FROM (
  SELECT 'Full-Stack React & Node' AS title, 'Web Development' AS category, 'Dr. Maya Chen' AS instructor, 'accent' AS color
  UNION ALL SELECT 'Database Design', 'Data', 'Leo Park', 'violet'
  UNION ALL SELECT 'TypeScript Mastery', 'Languages', 'Sana Idris', 'rose'
  UNION ALL SELECT 'Cloud & DevOps', 'Infrastructure', 'Omar Haddad', 'amber'
) v
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.title = v.title);

INSERT INTO lectures (id, course_id, title, kind, meta, thumbnail, s3_key, fallback_url, duration_seconds, position)
SELECT UUID(), c.id, l.title, l.kind, l.meta, l.thumbnail, NULL, l.url, l.dur, l.pos
FROM courses c JOIN (
  SELECT 'Full-Stack React & Node' AS course, 'Building REST APIs with Express' AS title, 'video' AS kind, '12:40' AS meta, 'coding' AS thumbnail, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' AS url, 760 AS dur, 1 AS pos
  UNION ALL SELECT 'Full-Stack React & Node', 'Auth with JWT & Refresh Tokens', 'video', '24:18', 'instructor', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1458, 2
  UNION ALL SELECT 'Full-Stack React & Node', 'System design office hours', 'live', 'Today 6pm', 'live', NULL, 3600, 3
  UNION ALL SELECT 'Database Design', 'Indexing Strategies for PostgreSQL', 'article', '8 min read', 'notebook', NULL, 480, 1
  UNION ALL SELECT 'Database Design', 'Query optimizer lab', 'lab', '45 min', 'terminal', NULL, 2700, 2
  UNION ALL SELECT 'TypeScript Mastery', 'Generics & Utility Types Check', 'quiz', '15 questions', 'quiz', NULL, 900, 1
  UNION ALL SELECT 'TypeScript Mastery', 'Advanced type inference', 'video', '18:32', 'keyboard', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 1112, 2
  UNION ALL SELECT 'Cloud & DevOps', 'Streaming media from S3', 'video', '21:05', 'cloud', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 1265, 1
  UNION ALL SELECT 'Cloud & DevOps', 'Deployment checklist', 'pdf', '32 pages', 'paper', NULL, 600, 2
) l ON l.course = c.title
WHERE NOT EXISTS (SELECT 1 FROM lectures x WHERE x.course_id = c.id AND x.title = l.title);
