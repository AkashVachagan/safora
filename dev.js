import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const backend = spawn(process.execPath, ["--watch", "server.js"], {
    cwd: path.join(root, "backend"),
    stdio: "inherit"
});
const vite = spawn(process.execPath, [path.join(root, "frontend", "node_modules", "vite", "bin", "vite.js")], {
    cwd: path.join(root, "frontend"),
    stdio: "inherit"
});

function stop() {
    backend.kill("SIGTERM");
    vite.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("exit", (code) => {
    if (code !== null && code !== 0) stop();
});
