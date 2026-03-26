# PicClock

PicClock is a React web app that turns any PC, tablet, or phone into a digital photo frame with a clock overlay.

You can use the pre-built version immediately at:
https://tdpi95.github.io/picclock/

---

## Features

- Display photos from:
    - Bing Image of the Day
    - Picsum (random images)
    - Local files on your device
- Digital clock overlay
    - Static position
    - Moving around the screen (DVD-style)
- Fullscreen mode for dedicated displays

---

## Planned

- Weather display
- More customization (font, color, size...)
- More image sources:
    - Immich
    - Google Photos
    - Unsplash

---

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

---

## 🛠 Getting started

```bash
git clone https://github.com/tdpi95/picclock.git
cd picclock
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Debugging in VSCode

Create `launch.json` in `.vscode`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome against localhost",
            "url": "http://localhost:5173/picclock/",
            "webRoot": "${workspaceFolder}",
            "userDataDir": "${workspaceFolder}/.vscode/chrome-debug-profile"
        }
    ]
}
```

### Notes

- `userDataDir` keeps browser data (localStorage, IndexedDB, etc.) persistent between debug sessions
  → useful for saved settings and local photos
- If the port or path changes, update the url field
- Run `npm run dev -- --host` to expose in local network.

---

## Immich Support

To use Immich as a photo source, you need to allow PicClock to fetch images from your server (CORS). The specific configuration will vary depending on your reverse proxy.

Configuration example for nginx:

```nginx
if ($request_method ~* '(GET|POST)') {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'X-Api-Key, User-Agent, Content-Type' always;
    add_header 'Access-Control-Max-Age' 1728000;
}

if ($request_method = 'OPTIONS') {
  add_header 'Access-Control-Allow-Origin' '*' always;
  add_header 'Access-Control-Allow-Methods' 'GET, PUT, POST, DELETE, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'X-Api-Key, User-Agent, Content-Type' always;
  add_header 'Access-Control-Max-Age' 1728000;
  add_header 'Content-Type' 'text/plain charset=UTF-8';
  add_header 'Content-Length' 0;
  return 204;
}
```

> [!WARNING]
> For security reasons, it's best to specify a list of URLs in Access-Control-Allow-Origin rather than using `*`.

Configuration example for Caddy (tested on my server):

```caddy
:80, immich.mydomain.com {

    reverse_proxy 127.0.0.1:8088

    @allowedOrigin {
        header Origin http://localhost:5173
        header Origin https://tdpi95.github.io
    }

    header @allowedOrigin {
        Access-Control-Allow-Origin "{http.request.header.Origin}"
        Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type, Accept"
        Access-Control-Allow-Credentials true
    }

    @options method OPTIONS
    handle @options {
        header Access-Control-Allow-Origin "{header.Origin}"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Accept, Authorization, Content-Type, x-api-key"
        header Access-Control-Allow-Credentials "true"
        header Access-Control-Max-Age "3600"
        respond "" 204
    }
}
```
