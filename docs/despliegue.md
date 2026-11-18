# Despliegue del frontend (SPA)

El frontend es una SPA con `BrowserRouter`. Rutas como `/panel`, `/area/:id` o
`/actividad/importar-horas` **no existen como archivos** en `dist/`: las resuelve React en el
navegador. Por eso el host estático **debe** responder `index.html` para cualquier ruta que no
sea un archivo real. Si no lo hace, al recargar (F5) o abrir un enlace interno el host devuelve su
propia página 404 (en staging: «404 – The requested page was not found») y la app nunca carga.

## Red de seguridad incluida en el build

`npm run build` genera `dist/404.html` como copia exacta de `dist/index.html`
(plugin [`build/spaFallback.js`](../build/spaFallback.js)). Los hosts que sirven `404.html` ante
una ruta inexistente (DigitalOcean App Platform, GitHub Pages, Netlify, Cloudflare Pages) cargan
así la SPA aunque nadie haya configurado el fallback. Limitación: la respuesta llega con status
HTTP 404 (el navegador la muestra igual). **La configuración correcta es el fallback del host**,
que responde 200.

## Configuración del host (acción manual en infraestructura)

### DigitalOcean App Platform (static site)

En la app de staging (y luego en la de producción), componente *static site* del frontend:

- Panel: *Settings → (componente) → Custom Pages → Catchall document* = `index.html`.
- O en el app spec:

```yaml
static_sites:
  - name: frontend
    # ...
    catchall_document: index.html   # excluyente con error_document: no definir ambos
```

### nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Otros

- Netlify: archivo `public/_redirects` con `/*  /index.html  200`.
- Vercel: `vercel.json` con `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.

## Verificación tras desplegar

1. Abrir directamente `https://staging.asigbo.org/actividad/importar-horas` en una pestaña nueva:
   debe cargar la app (no el 404 del host).
2. Con sesión iniciada, recargar `/panel`: la sesión se mantiene.
3. Abrir `/ruta-que-no-existe`: se ve la página «Página no encontrada» de la app y la sesión sigue
   activa.

## Sesión entre orígenes

El frontend (`staging.asigbo.org`) y la API (`api.staging.asigbo.org`) son orígenes distintos. La
sesión depende de la cookie httpOnly `refreshToken`, así que **toda** petición a la API debe ir con
`credentials: 'include'` (`useApiFetch` ya lo hace; `SessionProvider` y `useRefreshAccessToken`
también). La API debe incluir el origen del frontend en `CORS_ORIGINS` y responder
`Access-Control-Allow-Credentials: true`.
