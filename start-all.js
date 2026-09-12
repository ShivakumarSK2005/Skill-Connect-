const { spawn } = require("child_process");
const path = require("path");

const rootDir = __dirname;
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "========================================");
console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Skill Connect (Backend + Frontend)...");
console.log("\x1b[36m%s\x1b[0m", "========================================\n");

// 1. Start Backend
const backend = spawn(npmCmd, ["start"], {
  cwd: path.join(rootDir, "skillconnect-backend"),
  stdio: "pipe",
  shell: true,
  env: { ...process.env, NODE_ENV: "development" }
});

backend.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((line) => {
    if (line.trim()) console.log("\x1b[33m[Backend]\x1b[0m", line);
  });
});

backend.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((line) => {
    if (line.trim()) console.error("\x1b[31m[Backend Error]\x1b[0m", line);
  });
});

// 2. Start Frontend
const frontend = spawn(npmCmd, ["start"], {
  cwd: path.join(rootDir, "skillconnect-frontend"),
  stdio: "pipe",
  shell: true,
  env: { ...process.env, NODE_ENV: "development", NODE_OPTIONS: "--no-deprecation" }
});

frontend.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((line) => {
    if (line.trim()) console.log("\x1b[32m[Frontend]\x1b[0m", line);
  });
});

frontend.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((line) => {
    if (line.trim()) console.error("\x1b[31m[Frontend Error]\x1b[0m", line);
  });
});

// Clean termination handling
const cleanup = () => {
  console.log("\n\x1b[36m%s\x1b[0m", "🛑 Shutting down backend and frontend...");
  try {
    if (isWindows) {
      if (backend.pid) spawn("taskkill", ["/pid", backend.pid, "/f", "/t"]);
      if (frontend.pid) spawn("taskkill", ["/pid", frontend.pid, "/f", "/t"]);
    } else {
      if (backend.pid) process.kill(-backend.pid);
      if (frontend.pid) process.kill(-frontend.pid);
    }
  } catch (e) {
    // ignore
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
