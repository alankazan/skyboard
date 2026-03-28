# SkyBoard

A terminal/CRT-style monitoring HUD dashboard for home servers.
Displays real-time system metrics and quick-launch shortcuts for Docker services.

---

## Access

| Via | URL |
|-----|-----|
| Local network | http://`<SERVER_IP>`:8585 |
| Tailscale / VPN | http://`<VPN_IP>`:8585 |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI + Uvicorn |
| Frontend | Vanilla HTML/CSS/JS (no frameworks) |
| Container | Docker (local build) |
| Metrics | psutil + pynvml (NVIDIA GPU) |

---

## Project Structure

```
Skyboard/
├── server.py              # FastAPI backend — metrics API + static file serving
├── requirements.txt       # Python dependencies
├── Dockerfile             # Image build
├── docker-compose.yml     # Container configuration
└── static/
    ├── index.html         # Main SPA
    ├── manifest.json      # PWA manifest
    ├── sw.js              # Service Worker (offline cache)
    ├── css/
    │   └── style.css      # All styles (themes, CRT FX, HUD)
    ├── js/
    │   ├── app.js         # Core logic (metrics, groups, edit mode, HUD, i18n)
    │   └── quotes.js      # Skynet sarcastic quotes (PT-BR + EN-US)
    └── icons/
        └── icon-512.png   # PWA icon
```

---

## API

All endpoints are served by the same server on port `8585`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/metrics` | System metrics (CPU, RAM, GPU, temp, network, disk) |
| `GET` | `/api/config` | Saved dashboard configuration |
| `POST` | `/api/config` | Save configuration (requires `X-API-Key` if `ADMIN_PASSWORD` is set) |
| `POST` | `/api/wallpaper` | Upload wallpaper (base64) |
| `GET` | `/api/wallpapers` | List saved wallpapers |
| `GET` | `/api/wallpaper/{name}` | Serve a wallpaper file |
| `GET` | `/api/discover` | Auto-detect running Docker containers |

### `/api/metrics` Response

```json
{
  "timestamp": 1234567890,
  "uptime_s": 700000,
  "load": { "1m": 0.5, "5m": 0.4, "15m": 0.3 },
  "cpu": { "pct": 12.5, "per_core": [10, 15], "cores": 4, "freq_mhz": 2400, "model": "..." },
  "ram": { "pct": 67.0, "used_gb": 4.8, "free_gb": 2.3, "total_gb": 8.0 },
  "swap": { "pct": 0.0, "used_gb": 0.0, "total_gb": 1.0 },
  "disks": [{ "device": "/dev/sda", "mountpoint": "/", "total_gb": 228.0, "used_gb": 80.0, "pct": 35.0 }],
  "disk_io": { "read_bps": 0, "write_bps": 0, "read_mbps": 0.0, "write_mbps": 0.0 },
  "network": { "up_bps": 1024, "dn_bps": 2048, "up_mbps": 0.001, "dn_mbps": 0.002 },
  "temperatures": { "coretemp:Core 0": 45.0, "coretemp:Core 1": 47.0 },
  "gpu": [{ "name": "GeForce 940MX", "gpu_pct": 0, "mem_used_mb": 200, "mem_total_mb": 2048, "temp_c": 42, "power_w": 5.0 }]
}
```

---

## Features

### Real-Time Metrics
- **CPU** — overall usage, per-core, frequency, model name
- **RAM** — usage percentage, GB used/total
- **GPU** — utilization, VRAM, temperature, power draw (NVIDIA via pynvml)
- **Temperature** — peak value across all hwmon/lm-sensors sensors
- **SWAP** — usage percentage and GB
- **Network** — upload/download speed in real time (updated every 1s in backend)
- **Uptime** — system uptime

### Service Shortcuts
- Organized into groups (e.g. Video & Media, Automation, Infrastructure)
- URLs auto-detect the current access IP/hostname via `window.location.hostname`
- Edit mode: add, edit, delete, reorder services and groups
- Auto-discovery of running Docker containers via socket

### Themes & Appearance
- 8 built-in themes: SkyneT, Matrix, Cyberpunk, Amber CRT, Ice Blue, Ghost, Blood, Neon
- Customizable colors (accent, background, green, amber, blue)
- Fonts: Share Tech Mono, VT323, Rajdhani, Exo 2
- CRT effects: scanlines, phosphor flicker, noise grain, glitch bar, broken glass, RGB shift
- Wallpaper via upload or URL

### Language Toggle
- Switch between **PT-BR** and **EN-US** with the flag button in the footer
- Language preference is saved in localStorage

### PWA
- Installable as an app (manifest.json + service worker)
- Offline cache for static assets
- API requests always bypass the cache (network-first)

---

## Deploy

```bash
# Start the container
cd /path/to/skyboard
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | *(empty)* | Password for write endpoints (header `X-API-Key`) |
| `HOST_PROC` | `/host/proc` | Host `/proc` path (mounted via volume) |
| `HOST_SYS` | `/host/sys` | Host `/sys` path (mounted via volume) |

### Volumes

| Volume | Container path | Description |
|--------|---------------|-------------|
| `skyboard_data` | `/app/data` | Dashboard config + saved wallpapers |
| `/proc` (host) | `/host/proc` | Host metrics reading |
| `/sys` (host) | `/host/sys` | Temperature sensor reading |
| `/var/run/docker.sock` | `/var/run/docker.sock` | Docker container discovery |

---

## Default Service Shortcuts

The shortcuts below are included by default. All are editable via the edit mode in the UI.

| Service | Default Port | Description |
|---------|-------------|-------------|
| Jellyfin | 8096 | Media streaming server |
| Jellyseerr | 5055 | Media request management |
| Immich | 2283 | Photo and video gallery |
| AdGuard Home | 80 | DNS ad blocking |
| Open WebUI | 3000 | Local AI model interface |
| Frigate | 5000 | Security camera NVR |
| Portainer | 9443 | Docker container management |
| qBittorrent | 8090 | Torrent client |
| Nextcloud | 8080 | File storage |

> Service URLs use `window.location.hostname` automatically — no manual IP configuration needed.
