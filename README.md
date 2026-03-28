# SkyBoard

Dashboard HUD de monitoramento para home servers.
Interface estilo terminal/CRT com métricas de sistema em tempo real e atalhos para serviços Docker.

---

## Acesso

| Via | URL |
|-----|-----|
| Rede local | http://`<IP_DO_SERVIDOR>`:8585 |
| Tailscale / VPN | http://`<IP_VPN>`:8585 |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.12 + FastAPI + Uvicorn |
| Frontend | HTML/CSS/JS puro (sem frameworks) |
| Container | Docker (build local) |
| Métricas | psutil + pynvml (GPU NVIDIA) |

---

## Estrutura

```
Skyboard/
├── server.py              # Backend FastAPI — API de métricas + serve estático
├── requirements.txt       # Dependências Python
├── Dockerfile             # Build da imagem
├── docker-compose.yml     # Configuração do container
└── static/
    ├── index.html         # SPA principal
    ├── manifest.json      # PWA manifest
    ├── sw.js              # Service Worker (cache offline)
    ├── css/
    │   └── style.css      # Todos os estilos (temas, CRT FX, HUD)
    ├── js/
    │   ├── app.js         # Lógica principal (métricas, grupos, edição, HUD)
    │   └── quotes.js      # Frases sarcásticas do Skynet (rodapé aleatório)
    └── icons/
        └── icon-512.png   # Ícone PWA
```

---

## API

Todos os endpoints são servidos pelo mesmo servidor na porta `8585`.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/metrics` | Métricas do sistema (CPU, RAM, GPU, temp, rede, disco) |
| `GET` | `/api/config` | Configuração salva do dashboard |
| `POST` | `/api/config` | Salva configuração (requer `X-API-Key` se `ADMIN_PASSWORD` definido) |
| `POST` | `/api/wallpaper` | Upload de wallpaper (base64) |
| `GET` | `/api/wallpapers` | Lista wallpapers salvos |
| `GET` | `/api/wallpaper/{nome}` | Serve arquivo de wallpaper |
| `GET` | `/api/discover` | Detecta containers Docker em execução |

### Resposta `/api/metrics`

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

## Funcionalidades

### Métricas em Tempo Real
- **CPU** — uso total, por núcleo, frequência, modelo
- **RAM** — uso percentual, GB usados/total
- **GPU** — uso, VRAM, temperatura, consumo (NVIDIA via pynvml)
- **Temperatura** — pico máximo entre todos os sensores hwmon/lm-sensors
- **SWAP** — uso percentual e GB
- **Rede** — velocidade upload/download em tempo real (atualiza a cada 1s no backend)
- **Uptime** — tempo de atividade do sistema

### Atalhos de Serviços
- Organizados em grupos (Vídeo & Mídia, Automação, Infraestrutura)
- URLs detectam automaticamente o IP/hostname de acesso (`window.location.hostname`)
- Modo edição: adicionar, editar, excluir, reordenar serviços e grupos
- Descoberta automática de containers Docker via socket

### Temas e Aparência
- 8 temas prontos: SkyneT, Matrix, Cyberpunk, Amber CRT, Ice Blue, Ghost, Sangue, Neon
- Cores personalizáveis (accent, fundo, verde, âmbar, azul)
- Fontes: Share Tech Mono, VT323, Rajdhani, Exo 2
- Efeitos CRT: scanlines, phosphor flicker, noise grain, glitch bar, vidro quebrado, RGB shift
- Wallpaper por upload ou URL

### PWA
- Instalável como app (manifest.json + service worker)
- Cache offline dos assets estáticos
- Requisições à API sempre passam pela rede (sem cache)

---

## Deploy

```bash
# Subir o container
cd /home/alan/docker/skyboard/Skyboard
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `ADMIN_PASSWORD` | `admin` | Senha para endpoints de escrita (header `X-API-Key`) |
| `HOST_PROC` | `/host/proc` | Path do /proc do host (montado via volume) |
| `HOST_SYS` | `/host/sys` | Path do /sys do host (montado via volume) |

### Volumes

| Volume | Path no container | Descrição |
|--------|------------------|-----------|
| `skyboard_data` | `/app/data` | Config do dashboard + wallpapers salvos |
| `/proc` (host) | `/host/proc` | Leitura de métricas do host |
| `/sys` (host) | `/host/sys` | Leitura de sensores de temperatura |
| `/var/run/docker.sock` | `/var/run/docker.sock` | Descoberta de containers |

---

## Exemplo de Serviços no Dashboard

Os atalhos abaixo são os padrões incluídos. Todos são editáveis via modo edição na interface.

| Serviço | Porta padrão | Descrição |
|---------|-------------|-----------|
| Jellyfin | 8096 | Servidor de streaming de mídia |
| Jellyseerr | 5055 | Gestão de pedidos de mídia |
| Immich | 2283 | Galeria de fotos e vídeos |
| AdGuard Home | 80 | Bloqueio de anúncios via DNS |
| Open WebUI | 3000 | Interface local para modelos de IA |
| Frigate | 5000 | NVR para câmeras de segurança |
| Portainer | 9443 | Gestão de containers Docker |
| qBittorrent | 8090 | Cliente de torrents |
| Nextcloud | 8080 | Armazenamento de arquivos |

> As URLs dos atalhos usam `window.location.hostname` automaticamente — não é necessário configurar o IP manualmente.
