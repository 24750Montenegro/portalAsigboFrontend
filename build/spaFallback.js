import fs from 'node:fs';
import path from 'node:path';

/**
 * Copia `index.html` como `404.html` al terminar el build.
 *
 * El frontend es una SPA con BrowserRouter: rutas como /panel o /actividad/importar-horas no
 * existen como archivos en dist/. Si el host estático no está configurado con fallback a
 * index.html, al recargar o abrir un enlace responde su propia página 404 y la app nunca carga.
 *
 * Muchos hosts estáticos (DigitalOcean App Platform, GitHub Pages, Netlify, Cloudflare Pages)
 * sirven `404.html` cuando no encuentran la ruta; si ese archivo es la propia SPA, el router de
 * React toma el control. Es una red de seguridad: la configuración correcta sigue siendo el
 * fallback del host (ver docs/despliegue.md), que además responde 200 en vez de 404.
 */
export default function spaFallback() {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    writeBundle({ dir }) {
      fs.copyFileSync(path.join(dir, 'index.html'), path.join(dir, '404.html'));
    },
  };
}
