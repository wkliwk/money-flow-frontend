import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Map VITE_* env vars to process.env.VITE_* for compatibility with Jest
  const processEnvDefines: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(mode),
  };
  for (const key of Object.keys(env)) {
    if (key.startsWith('VITE_')) {
      processEnvDefines[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  }

  return {
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'build',
      sourcemap: true,
    },
    define: processEnvDefines,
  };
});
