import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules", "vite", "bin", "vite.js"),
    "--host",
    "127.0.0.1",
  ],
  {
    cwd: root,
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
    stdio: ["ignore", "ignore", "inherit"],
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null)
      throw new Error(
        `Development server exited with code ${server.exitCode}.`,
      );
    try {
      const response = await fetch("http://127.0.0.1:5173");
      if (response.ok) return;
    } catch {
      /* Starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the E2E development server.");
}

let exitCode = 1;
try {
  await waitForServer();
  const runner = spawn(
    process.execPath,
    [
      path.join(root, "node_modules", "@playwright", "test", "cli.js"),
      "test",
      ...process.argv.slice(2),
    ],
    {
      cwd: root,
      env: { ...process.env, E2E_EXTERNAL_SERVER: "1" },
      stdio: "inherit",
    },
  );
  exitCode = await new Promise((resolve, reject) => {
    runner.once("error", reject);
    runner.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  server.kill("SIGTERM");
}
process.exit(exitCode);
