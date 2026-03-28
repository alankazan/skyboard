#!/usr/bin/env python3
"""
SkyBoard — Unified Server with FastAPI
  :8585  → Dashboard HTML & Static (/)
         → Metrics JSON API (/api/metrics)
"""

import json, time, os, glob, base64, re, asyncio
import psutil
from fastapi import FastAPI, Request, HTTPException, Depends, APIRouter
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    import docker
    DOCKER_CLIENT = docker.from_env()
except:
    DOCKER_CLIENT = None

HOST_PROC = os.environ.get("HOST_PROC", "/proc")
HOST_SYS = os.environ.get("HOST_SYS", "/sys")
DATA_DIR = "/app/data"
# If running locally without docker in tests, fallback to local dir
if not os.path.exists("/app/data"):
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    
WP_DIR = os.path.join(DATA_DIR, "wallpapers")
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
os.makedirs(WP_DIR, exist_ok=True)

try:
    import pynvml
    pynvml.nvmlInit()
    _GPU_H = [pynvml.nvmlDeviceGetHandleByIndex(i) for i in range(pynvml.nvmlDeviceGetCount())]
    GPU_MODE = "pynvml"
except Exception:
    _GPU_H = []
    GPU_MODE = "none"

# Cache
_net_prev = psutil.net_io_counters()
_net_time = time.time()
_net_cache = {"up": 0, "dn": 0}

_disk_io_prev = getattr(psutil, "disk_io_counters")()
_disk_io_time = time.time()
_disk_io_cache = {"read": 0, "write": 0}

async def _bg_poller():
    global _net_prev, _net_time, _disk_io_prev, _disk_io_time
    while True:
        await asyncio.sleep(1)
        cur = psutil.net_io_counters()
        now = time.time()
        dt = max(now - _net_time, 0.001)
        
        up_bps = int((cur.bytes_sent - _net_prev.bytes_sent) / dt)
        dn_bps = int((cur.bytes_recv - _net_prev.bytes_recv) / dt)
        
        _net_cache["up"] = max(0, up_bps)
        _net_cache["dn"] = max(0, dn_bps)
        _net_prev = cur
        _net_time = now
        
        dio = psutil.disk_io_counters()
        dt2 = max(now - _disk_io_time, 0.001)
        
        r_bps = int((dio.read_bytes - _disk_io_prev.read_bytes) / dt2)
        w_bps = int((dio.write_bytes - _disk_io_prev.write_bytes) / dt2)
        
        _disk_io_cache["read"] = max(0, r_bps)
        _disk_io_cache["write"] = max(0, w_bps)
        _disk_io_prev = dio
        _disk_io_time = now

def _read_temps_sys():
    temps = {}
    pattern = os.path.join(HOST_SYS, "class/hwmon/hwmon*/temp*_input")
    for path in glob.glob(pattern):
        try:
            with open(path) as f:
                val = int(f.read().strip()) / 1000.0
            label_path = path.replace("_input", "_label")
            name_path = os.path.join(os.path.dirname(path), "name")
            
            label = os.path.basename(path)
            if os.path.exists(label_path):
                with open(label_path) as lf:
                    label = lf.read().strip()
                    
            hwmon = "unknown"
            if os.path.exists(name_path):
                with open(name_path) as nf:
                    hwmon = nf.read().strip()
                    
            key = f"{hwmon}:{label}"
            temps[key] = round(val, 1)
        except Exception:
            pass
            
    if not temps:
        try:
            for chip, entries in psutil.sensors_temperatures().items():
                for e in entries:
                    temps[f"{chip}:{e.label or 'temp'}"] = round(e.current, 1)
        except: pass
    return temps

def _get_gpus():
    if GPU_MODE != "pynvml": return []
    import pynvml
    out = []
    for h in _GPU_H:
        try:
            name = pynvml.nvmlDeviceGetName(h)
            if isinstance(name, bytes): name = name.decode()
            util = pynvml.nvmlDeviceGetUtilizationRates(h)
            mem = pynvml.nvmlDeviceGetMemoryInfo(h)
            temp = pynvml.nvmlDeviceGetTemperature(h, pynvml.NVML_TEMPERATURE_GPU)
            g = {
                "name": name,
                "gpu_pct": util.gpu,
                "mem_pct": round(mem.used / max(1, mem.total) * 100, 1),
                "mem_used_mb": round(mem.used / 1e6, 1),
                "mem_free_mb": round(mem.free / 1e6, 1),
                "mem_total_mb": round(mem.total / 1e6, 1),
                "temp_c": temp,
                "power_w": None,
            }
            try: g["power_w"] = round(pynvml.nvmlDeviceGetPowerUsage(h)/1000, 1)
            except: pass
            
            out.append(g)
        except: pass
    return out

def get_metrics():
    cpu_pct = psutil.cpu_percent(interval=None)
    cpu_percore = psutil.cpu_percent(interval=None, percpu=True)
    cpu_freq = psutil.cpu_freq()
    
    cpu_info = {}
    try:
        cpuinfo_path = os.path.join(HOST_PROC, "cpuinfo")
        if os.path.exists(cpuinfo_path):
            with open(cpuinfo_path) as f:
                for line in f:
                    if "model name" in line:
                        cpu_info["model"] = line.split(":")[1].strip()
                        break
    except: pass

    ram = psutil.virtual_memory()
    swap = psutil.swap_memory()

    disks = []
    for p in psutil.disk_partitions(all=False):
        try:
            u = psutil.disk_usage(p.mountpoint)
            disks.append({
                "device": p.device,
                "mountpoint": p.mountpoint,
                "fstype": p.fstype,
                "total_gb": round(u.total/1e9, 1),
                "used_gb": round(u.used/1e9, 1),
                "free_gb": round(u.free/1e9, 1),
                "pct": u.percent,
            })
        except: pass

    try:
        load1, load5, load15 = os.getloadavg()
    except AttributeError:
        load1 = load5 = load15 = 0

    uptime_s = int(time.time() - psutil.boot_time())

    return {
        "timestamp": int(time.time()),
        "uptime_s": uptime_s,
        "load": {"1m": round(load1,2), "5m": round(load5,2), "15m": round(load15,2)},
        "cpu": {
            **cpu_info,
            "pct": round(cpu_pct, 1),
            "per_core": [round(c, 1) for c in cpu_percore],
            "cores": len(cpu_percore),
            "freq_mhz": round(cpu_freq.current, 0) if cpu_freq else None,
        },
        "ram": {
            "pct": round(ram.percent, 1),
            "used_gb": round(ram.used/1e9, 2),
            "free_gb": round(ram.available/1e9, 2),
            "total_gb": round(ram.total/1e9, 2),
        },
        "swap": {
            "pct": round(swap.percent, 1),
            "used_gb": round(swap.used/1e9, 2),
            "total_gb": round(swap.total/1e9, 2),
        },
        "disks": disks,
        "disk_io": {
            "read_bps": _disk_io_cache["read"],
            "write_bps": _disk_io_cache["write"],
            "read_mbps": round(_disk_io_cache["read"]/1e6, 2),
            "write_mbps": round(_disk_io_cache["write"]/1e6, 2),
        },
        "network": {
            "up_bps": _net_cache["up"],
            "dn_bps": _net_cache["dn"],
            "up_mbps": round(_net_cache["up"]/1e6, 2),
            "dn_mbps": round(_net_cache["dn"]/1e6, 2),
        },
        "temperatures": _read_temps_sys(),
        "gpu": _get_gpus(),
    }

# FastAPI App Setup
app = FastAPI(title="SkyBoard Metrics")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_auth(request: Request):
    if ADMIN_PASSWORD:
        if request.headers.get("X-API-Key") != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Unauthorized - Missing or invalid X-API-Key")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_bg_poller())
    psutil.cpu_percent(interval=0.5)

api_router = APIRouter(prefix="/api")

@api_router.get("/metrics")
async def api_metrics():
    return get_metrics()

@api_router.get("/config")
async def get_config():
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

@api_router.post("/config", dependencies=[Depends(verify_auth)])
async def save_config(request: Request):
    try:
        cfg = await request.json()
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class WallpaperReq(BaseModel):
    name: str
    data: str

@api_router.post("/wallpaper", dependencies=[Depends(verify_auth)])
async def upload_wallpaper(req: WallpaperReq):
    try:
        fname = re.sub(r"[^a-zA-Z0-9._-]", "_", req.name)
        img = base64.b64decode(req.data.split(",")[-1])
        fpath = os.path.join(WP_DIR, fname)
        if not fname:
            raise ValueError("Invalid filename")
        with open(fpath, "wb") as f:
            f.write(img)
        return {"ok": True, "url": f"/api/wallpaper/{fname}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/wallpapers")
async def list_wallpapers():
    files = []
    for f in glob.glob(os.path.join(WP_DIR, "*")):
        fname = os.path.basename(f)
        files.append({"name": fname, "url": f"/api/wallpaper/{fname}"})
    return {"wallpapers": files}

@api_router.get("/wallpaper/{fname}")
async def serve_wallpaper(fname: str):
    fpath = os.path.join(WP_DIR, fname)
    if os.path.exists(fpath):
        return FileResponse(fpath)
    raise HTTPException(status_code=404, detail="Not found")

@api_router.get("/discover", dependencies=[Depends(verify_auth)])
async def discover_services():
    if not DOCKER_CLIENT:
        return {"services": []}
    
    found = []
    # Mapa de imagens conhecidas para ícones/cores
    MAPPING = {
        "jellyfin": {"icon": "🎬", "color": "#00b4ff", "desc": "Servidor de mídia"},
        "portainer": {"icon": "🐳", "color": "#13bef9", "desc": "Gestão de containers"},
        "adguard": {"icon": "🛡️", "color": "#67b346", "desc": "Bloqueio anúncios"},
        "plex": {"icon": "🎥", "color": "#e5a00d", "desc": "Plex Media Server"},
        "transmission": {"icon": "🚲", "color": "#da1b1b", "desc": "Torrent"},
        "qbittorrent": {"icon": "⬇️", "color": "#2dccff", "desc": "Torrent"},
        "radarr": {"icon": "🎬", "color": "#ffcc00", "desc": "Filmes"},
        "sonarr": {"icon": "📺", "color": "#35c5f4", "desc": "Séries"},
        "homeassistant": {"icon": "🏠", "color": "#03a9f4", "desc": "Domótica"},
        "pihole": {"icon": "🕳️", "color": "#96060c", "desc": "Bloqueio DNS"},
        "nextcloud": {"icon": "☁️", "color": "#0082c9", "desc": "Arquivos"},
        "uptime-kuma": {"icon": "📈", "color": "#6ad24c", "desc": "Monitoramento"},
        "openwebui": {"icon": "🤖", "color": "#ffffff", "desc": "Interface IA"},
    }

    try:
        containers = DOCKER_CLIENT.containers.list()
        for c in containers:
            name = c.name
            img = c.image.tags[0] if c.image.tags else ""
            ports = c.attrs.get('NetworkSettings', {}).get('Ports', {})
            
            # Tentar achar a porta pública
            port_val = ""
            if ports:
                for p_key, p_val in ports.items():
                    if p_val:
                        port_val = p_val[0].get('HostPort', '')
                        break
            
            # Se não achou porta no config, tentamos portas padrão ou expose
            if not port_val and c.attrs.get('Config', {}).get('ExposedPorts'):
                port_val = list(c.attrs['Config']['ExposedPorts'].keys())[0].split('/')[0]

            # Match por imagem ou nome
            match_key = None
            for k in MAPPING:
                if k in name.lower() or k in img.lower():
                    match_key = k
                    break
            
            m = MAPPING.get(match_key, {"icon": "📦", "color": "#fff", "desc": "Container Docker"})
            
            found.append({
                "id": f"disc-{name}",
                "name": name.replace('_', ' ').capitalize(),
                "desc": m["desc"],
                "url": f"http://localhost:{port_val}" if port_val else "#",
                "icon": m["icon"],
                "color": m["color"],
                "image": img
            })
    except:
        pass
    
    return {"services": found}

app.include_router(api_router)

# Serve the static files from /static dynamically
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8585, reload=True)
