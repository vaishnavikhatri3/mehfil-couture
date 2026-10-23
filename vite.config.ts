import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
/** Serves the FitCheck API (/api/*) from the Vite dev & preview servers. */
function fitcheckApi(env: Record<string, string>): Plugin {
  let api: unknown = null;
  const mount = async (server: { middlewares: { use: (fn: unknown) => void } }) => {
    try {
      // Dynamically imported so vite build succeeds in Node < 22 environments
      const apiFile = "./server/api.mjs";
      // @ts-expect-error — plain ESM module without type declarations
      const { createApi } = await import(/* @vite-ignore */ apiFile);
      api ??= createApi({
        dbPath: env.DB_PATH || "data/mehfil.db",
        ...(env.ADMIN_PASSCODE ? { adminPasscode: env.ADMIN_PASSCODE } : {}),
        ...(env.ML_SERVICE_URL ? { mlUrl: env.ML_SERVICE_URL } : {}),
      });
      server.middlewares.use(api);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[fitcheck-api] Middleware not active (requires Node >= 22.5 for node:sqlite):", msg);
    }
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
