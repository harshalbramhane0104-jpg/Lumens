# Lumen — Video Lecture & Learning Platform

A full-stack online learning platform where users can stream video lectures, take quizzes, attend live sessions, and automatically save playback progress.

---

## ⚡ 1-Minute Quick Start (TL;DR)

Open your terminal in the project folder and run:

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file from the example
cp .env.example .env

# 3. Start the application
npm run dev
```

> **Windows PowerShell user?** Replace `cp .env.example .env` with `Copy-Item .env.example .env`.

Once running, open your browser at **[http://localhost:8080/](http://localhost:8080/)** (or `http://localhost:8081/` if port 8080 is already busy).

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed on your computer:

- **Node.js**: Version `20.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: Comes bundled with Node.js

To check if you have them installed, open your terminal and run:

```bash
node -v
npm -v
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Clone or Download the Repository

If you haven't cloned the project yet:

```bash
git clone <your-repository-url>
cd Lumens
```

### Step 2: Install Project Dependencies

Run the install command to download all required packages:

```bash
npm install
```

### Step 3: Set Up Environment Variables

The application needs configuration keys to communicate with the database and authentication services. A pre-configured template is already included in `.env.example`.

Create your `.env` file:

- **macOS / Linux / Git Bash:**
  ```bash
  cp .env.example .env
  ```
- **Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Windows Command Prompt (CMD):**
  ```cmd
  copy .env.example .env
  ```

> 💡 **Good to know**: The default `.env.example` already contains active, working demo Supabase connection keys, so you can test the application right away without manual database configuration!

### Step 4: Run the Development Server

Start the local server with:

```bash
npm run dev
```

You will see terminal output similar to this:

```text
  VITE v8.1.5  ready in 1200 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://...
```

### Step 5: Open in Your Browser

Click or navigate to:
👉 **`http://localhost:8080/`** (or the URL shown in your terminal).

---

## 🐳 Running with Docker & Docker Compose

If you prefer using Docker, you can run the full-stack application in a container without installing Node.js locally.

### Using Docker Compose (Recommended)

```bash
# 1. Ensure .env exists (or copy from example)
cp .env.example .env

# 2. Build and start the container in the background
docker compose up -d --build

# 3. View live logs
docker compose logs -f

# 4. Stop the container
docker compose down
```

The app will be available at: **[http://localhost:3000/](http://localhost:3000/)**.

### Using the Dockerfile directly

```bash
# Build the production image
docker build -t lumens-app .

# Run the container on port 3000
docker run -d -p 3000:3000 --name lumens-app --env-file .env lumens-app
```

---

## 🎯 How to Use the App

1. **Visit Home Page (`/`)**: Browse features and click **"Start learning"** or **"Sign in"**.
2. **Create an Account or Sign In (`/auth`)**:
   - Switch to **Sign up**, enter your name, email, and password (at least 6 characters).
   - Or click **Sign in** if you already have an account.
3. **Learner Dashboard (`/dashboard`)**:
   - View your overall progress circle, total watch hours, and XP earned.
   - See lectures in progress and continue where you left off.
4. **Watch a Lecture (`/lecture/:id`)**:
   - Stream video lectures with interactive video player controls.
   - Your watch position and progress percentage are saved automatically every 5 seconds and when the video ends.

---

## 🛠 Available Scripts

Run these commands from the project root:

| Command           | What it does                                                       |
| :---------------- | :----------------------------------------------------------------- |
| `npm run dev`     | Starts the app locally with hot reload at `http://localhost:8080/` |
| `npm run build`   | Builds the optimized production code for deployment                |
| `npm run preview` | Previews the production build locally on your machine              |
| `npm run lint`    | Checks the codebase for syntax or formatting errors                |
| `npm run format`  | Automatically formats all files using Prettier                     |

---

## 📁 Simple Project Map

Here is how the project files are organized:

```text
Lumens/
├── .env.example          # Template for environment settings
├── .env                  # Your local environment settings (do not commit)
├── package.json          # List of libraries and scripts
├── src/
│   ├── routes/           # Pages of the application
│   │   ├── index.tsx     # Landing page (/)
│   │   ├── auth.tsx      # Login and Registration page (/auth)
│   │   └── _authenticated/
│   │       ├── dashboard.tsx   # Student dashboard (/dashboard)
│   │       └── lecture.$id.tsx # Video player page (/lecture/:id)
│   ├── components/       # UI elements (buttons, navbar, lecture cards)
│   ├── lib/
│   │   └── lms.functions.ts # Backend server functions (saving progress, loading data)
│   └── integrations/
│       └── supabase/     # Database client and authentication setup
└── supabase/
    └── migrations/       # Database tables (courses, lectures, progress, profiles)
```

---

## ❓ Frequently Asked Questions & Troubleshooting

### 1. "Port 8080 is in use, trying another one..."

This is completely normal. If another program is using port `8080`, Vite will automatically pick the next available port (e.g. `http://localhost:8081/`). Just check the terminal output for the active URL.

### 2. "Missing Supabase environment variable(s)" error

This error means you haven't created your `.env` file yet.

- Run `cp .env.example .env` (or on Windows PowerShell: `Copy-Item .env.example .env`).
- Restart `npm run dev`.

### 3. How do I test the backend build?

To verify that both frontend and SSR backend build successfully:

```bash
npm run build
```

You should see `✓ built in ...` and `Generated public .output/public`.

### 4. How do I stop the development server?

In your terminal where the server is running, press `Ctrl + C` (or `Cmd + C` on Mac).
