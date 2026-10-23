import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error — plain ESM module without type declarations
import { createApi } from "./server/api.mjs";

/** Serves the FitCheck API (/api/*) from the Vite dev & preview servers. */
function fitcheckApi(env: Record<string, string>): Plugin {
  let api: ReturnType<typeof createApi> | null = null;
  const mount = (server: { middlewares: { use: (fn: unknown) => void } }) => {
    api ??= createApi({
      dbPath: env.DB_PATH || "data/mehfil.db",
      ...(env.ADMIN_PASSCODE ? { adminPasscode: env.ADMIN_PASSCODE } : {}),
    });
    server.middlewares.use(api);
  };
  return { name: "fitcheck-api", configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  // Server-only settings (ADMIN_PASSCODE, DB_PATH) from .env / .env.local — never exposed to the browser
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") } as Record<string, string>;
  return {
    plugins: [react(), fitcheckApi(env)],
    server: { port: 5173, host: true },
  };
});
