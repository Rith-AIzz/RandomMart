import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = process.cwd();
const cli = path.join(root, "node_modules", "vinext", "dist", "cli.js");
const child = spawn(process.execPath, [cli, "build"], {
  cwd: root,
  env: {
    ...process.env,
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: ".wrangler/logs",
    MINIFLARE_REGISTRY_PATH: ".wrangler/registry",
  },
  stdio: "inherit",
});
const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
if (exitCode !== 0) process.exit(exitCode);

const workerPath = path.join(root, "dist", "server", "index.js");
const hostingPath = path.join(root, "dist", ".openai", "hosting.json");
await Promise.all([access(workerPath), access(hostingPath)]);
JSON.parse(await readFile(hostingPath, "utf8"));
const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function")
  throw new Error("The production worker must export default.fetch.");
console.log("Validated production worker and hosting manifest.");
