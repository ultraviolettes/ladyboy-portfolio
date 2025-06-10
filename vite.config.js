import {
    defineConfig
} from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from 'vite-imagetools';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/loader.css',
                'resources/js/loader.js',
                'resources/css/portfolio.css',
                'resources/js/column-scroll.js',
                'resources/css/filament/admin/theme.css'
            ],
            refresh: true,
        }),
        tailwindcss(),
        imagetools({
            defaultDirectives: new URLSearchParams({
                format: 'webp;jpg;png;avif',
                quality: '80',
                width: 'auto',
                height: 'auto',
            }),
        }),
    ],
    server: {
        cors: true,
    },
});
