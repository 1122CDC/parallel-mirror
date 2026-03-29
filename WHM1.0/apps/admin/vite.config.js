"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_path_1 = require("node:path");
var plugin_vue_1 = require("@vitejs/plugin-vue");
var vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)(function (_a) {
    var command = _a.command;
    return ({
        base: command === 'build' ? '/admin/' : '/',
        plugins: [(0, plugin_vue_1.default)()],
        build: {
            outDir: (0, node_path_1.resolve)(process.cwd(), '..', '..', 'server', 'public', 'admin'),
            emptyOutDir: true,
        },
        server: {
            port: 4173,
            strictPort: true,
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                },
            },
        },
        resolve: {
            alias: {
                '@': (0, node_path_1.resolve)(process.cwd(), 'src'),
            },
        },
    });
});
