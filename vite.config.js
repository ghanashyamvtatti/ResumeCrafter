import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.GITHUB_ACTIONS ? '/ResumeCrafter/' : './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    server: {
        port: 5173,
    },
});
