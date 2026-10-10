import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// This custom plugin forces Vite to create the Netlify redirects file automatically
const netlifyRedirectsPlugin = () => ({
  name: 'netlify-redirects',
  closeBundle() {
    const distPath = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
    fs.writeFileSync(path.join(distPath, '_redirects'), '/*    /index.html   200');
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), netlifyRedirectsPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)
    }
  };
});
