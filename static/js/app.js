// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
const SERVER_HOST = window.location.hostname || '192.168.1.25';

const DEFAULTS = {
  apiUrl:      '',
  apiKey:      'admin',
  apiInterval: 2,
  title:       'SkyBoard',
  theme:       'skynet',
  accent:      '#ff2200',
  accent2:     '#00ff41',
  accent3:     '#ffb300',
  accent4:     '#00aaff',
  bg:          '#050100',
  fontMain:    "'Share Tech Mono', monospace",
  fontTitle:   "'Orbitron', sans-serif",
  radius:      0,
  wallpaper:   '',
  fx: {noise:true, glitch:true, glass:true, scanlines:false, phosphor:false, rgb:false},
  groups: [
    {id:'g1',name:'Vídeo & Mídia',nameKey:'grp1',icon:'🎬',services:[
      {id:'s1',name:'Jellyfin',    desc:'Servidor de streaming', url:`http://${SERVER_HOST}:8096`,icon:'🎬',color:'#00b4ff'},
      {id:'s2',name:'Jellyseerr',  desc:'Gestão de mídia',      url:`http://${SERVER_HOST}:5055`,icon:'🦑',color:'#aa44ff'},
      {id:'s3',name:'Immich',      desc:'Fotos & Vídeos',       url:`http://${SERVER_HOST}:2283`,icon:'📸',color:'#ff6699'},
    ]},
    {id:'g2',name:'Automação & Redes',nameKey:'grp2',icon:'🏠',services:[
      {id:'s5',name:'AdGuard',     desc:'Bloqueio DNS',          url:`http://${SERVER_HOST}:80`,  icon:'🛡️',color:'#67b346'},
      {id:'s13',name:'Open WebUI', desc:'Interface IA local',    url:`http://${SERVER_HOST}:3000`,icon:'🤖',color:'#ffffff'},
      {id:'s14',name:'Frigate',    desc:'NVR câmeras',           url:`http://${SERVER_HOST}:5000`,icon:'📹',color:'#aaaaaa'},
    ]},
    {id:'g3',name:'Infraestrutura',nameKey:'grp3',icon:'🐳',services:[
      {id:'s6',name:'Portainer',   desc:'Gestão Docker',         url:`http://${SERVER_HOST}:9443`,icon:'🐳',color:'#13bef9'},
      {id:'s7',name:'qBittorrent', desc:'Download client',       url:`http://${SERVER_HOST}:8090`,icon:'⬇️',color:'#2dccff'},
      {id:'s8',name:'Nextcloud',   desc:'Arquivos na nuvem',     url:`http://${SERVER_HOST}:8080`,icon:'☁️',color:'#0082c9'},
    ]},
  ]
};

let CFG = JSON.parse(JSON.stringify(DEFAULTS));
let metricsTimer = null;
let editMode = false;
let dragSrc = null;
let currentLang = 'pt-BR';

// ═══════════════════════════════════════════════════════
//  I18N
// ═══════════════════════════════════════════════════════
const TRANSLATIONS = {
  'pt-BR': {
    discoveryTitle:   '🔍 Serviços Detectados',
    discoverySubtitle:'Containers Docker encontrados no host',
    discoveryHint:    'Clique em um serviço para adicioná-lo ao dashboard',
    themeTitle:       '🎨 Tema & Aparência',
    themePresets:     'Temas Prontos',
    themeCustom:      'Cores Personalizadas',
    labelAccent:      'Cor de Destaque (accent)',
    labelAccent2:     'Cor Verde / Online',
    labelAccent3:     'Cor Âmbar / Aviso',
    labelAccent4:     'Cor Azul / Rede',
    labelBg:          'Cor de Fundo',
    labelFont:        'Fonte Principal',
    labelFontTitle:   'Fonte do Título',
    labelRadius:      'Bordas Arredondadas',
    labelDashTitle:   'Título do Dashboard',
    btnSave:          '💾 Salvar',
    btnCancel:        'Cancelar',
    btnCreate:        '💾 Criar',
    btnApplyStyle:    'Aplicar Estilo',
    fxTitle:          '⚡ Efeitos Visuais',
    metricsTitle:     '📊 Widgets de Métricas',
    metricsSubtitle:  'Mostrar/ocultar widgets na barra de recursos',
    svcTitle:         '➕ Adicionar Serviço',
    labelName:        'Nome',
    labelDesc:        'Descrição',
    labelUrl:         'URL',
    labelIcon:        'Ícone (emoji)',
    labelColor:       'Cor do Ícone',
    groupTitle:       '📁 Novo Grupo',
    labelGroupName:   'Nome do Grupo',
    labelGroupIcon:   'Ícone',
    propsTitle:       '⚙ Estilo do Elemento',
    labelPropBg:      'Cor de Fundo (Hex/RGBA)',
    labelPropFg:      'Cor do Título/Destaque',
    labelPropFz:      'Tamanho da Fonte (%)',
    btnTheme:         '🎨 TEMA',
    btnWall:          '🖼 FUNDO',
    btnFx:            '⚡ EFEITOS',
    btnMetrics:       '📊 MÉTRICAS',
    searchPlaceholder:'🔍 Buscar serviço...',
    editDone:         '✅ CONCLUIR',
    editStart:        '✏ EDITAR',
    opacityLbl:       '💧 OPACIDADE',
    grp1:             'Vídeo & Mídia',
    grp2:             'Automação & Redes',
    grp3:             'Infraestrutura',
    addService:       '+ Adicionar Serviço',
  },
  'en-US': {
    discoveryTitle:   '🔍 Detected Services',
    discoverySubtitle:'Docker containers found on the host',
    discoveryHint:    'Click a service to add it to the dashboard',
    themeTitle:       '🎨 Theme & Appearance',
    themePresets:     'Preset Themes',
    themeCustom:      'Custom Colors',
    labelAccent:      'Accent Color',
    labelAccent2:     'Green / Online Color',
    labelAccent3:     'Amber / Warning Color',
    labelAccent4:     'Blue / Network Color',
    labelBg:          'Background Color',
    labelFont:        'Main Font',
    labelFontTitle:   'Title Font',
    labelRadius:      'Border Radius',
    labelDashTitle:   'Dashboard Title',
    btnSave:          '💾 Save',
    btnCancel:        'Cancel',
    btnCreate:        '💾 Create',
    btnApplyStyle:    'Apply Style',
    fxTitle:          '⚡ Visual Effects',
    metricsTitle:     '📊 Metrics Widgets',
    metricsSubtitle:  'Show/hide widgets in the resource bar',
    svcTitle:         '➕ Add Service',
    labelName:        'Name',
    labelDesc:        'Description',
    labelUrl:         'URL',
    labelIcon:        'Icon (emoji)',
    labelColor:       'Icon Color',
    groupTitle:       '📁 New Group',
    labelGroupName:   'Group Name',
    labelGroupIcon:   'Icon',
    propsTitle:       '⚙ Element Style',
    labelPropBg:      'Background Color (Hex/RGBA)',
    labelPropFg:      'Title/Accent Color',
    labelPropFz:      'Font Size (%)',
    btnTheme:         '🎨 THEME',
    btnWall:          '🖼 WALLPAPER',
    btnFx:            '⚡ EFFECTS',
    btnMetrics:       '📊 METRICS',
    searchPlaceholder:'🔍 Search service...',
    editDone:         '✅ DONE',
    editStart:        '✏ EDIT',
    opacityLbl:       '💧 OPACITY',
    grp1:             'Video & Media',
    grp2:             'Automation & Networks',
    grp3:             'Infrastructure',
    addService:       '+ Add Service',
  }
};

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS['pt-BR'])[key] || key;
}

function applyLang() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = t(key);
    if (val) el.placeholder = val;
  });
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = currentLang === 'pt-BR' ? '🇧🇷' : '🇺🇸';
  // Update edit button text if edit mode is active
  const editBtn = document.getElementById('btn-edit');
  if (editBtn) editBtn.textContent = editMode ? t('editDone') : t('editStart');
  applyRandomQuote();
  renderGroups();
}

function cycleLang() {
  currentLang = currentLang === 'pt-BR' ? 'en-US' : 'pt-BR';
  localStorage.setItem('skyboard_lang', currentLang);
  applyLang();
}


const THEMES = [
  {id:'skynet',   name:'SkyneT',    accent:'#ff2200',accent2:'#00ff41',accent3:'#ffb300',accent4:'#00aaff',bg:'#050100',border:'#2a0800',text:'#b8e8b8',textDim:'#3a6a3a'},
  {id:'matrix',   name:'Matrix',    accent:'#00ff41',accent2:'#00cc33',accent3:'#00ff41',accent4:'#00ff41',bg:'#000500',border:'#003310',text:'#00ff41',textDim:'#005520'},
  {id:'cyberpunk',name:'Cyberpunk', accent:'#ff00aa',accent2:'#00ffff',accent3:'#ffee00',accent4:'#aa00ff',bg:'#020010',border:'#1a0033',text:'#e0ccff',textDim:'#4a3a6a'},
  {id:'amber',    name:'Amber CRT', accent:'#ffb300',accent2:'#ff8800',accent3:'#ffee00',accent4:'#ffcc44',bg:'#050200',border:'#2a1500',text:'#ffe0a0',textDim:'#5a3a00'},
  {id:'ice',      name:'Ice Blue',  accent:'#00aaff',accent2:'#00eeff',accent3:'#aaddff',accent4:'#0066ff',bg:'#000510',border:'#001a2a',text:'#aaddff',textDim:'#1a4a6a'},
  {id:'ghost',    name:'Ghost',     accent:'#aaaaaa',accent2:'#cccccc',accent3:'#888888',accent4:'#dddddd',bg:'#050505',border:'#1a1a1a',text:'#cccccc',textDim:'#444444'},
  {id:'blood',    name:'Sangue',    accent:'#cc0000',accent2:'#ff4444',accent3:'#ff8800',accent4:'#cc0044',bg:'#050000',border:'#1a0000',text:'#ffaaaa',textDim:'#4a0000'},
  {id:'neon',     name:'Neon',      accent:'#ff00ff',accent2:'#00ffff',accent3:'#ffff00',accent4:'#ff8800',bg:'#000010',border:'#1a001a',text:'#ffccff',textDim:'#3a0044'},
];

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  // Load saved language
  const savedLang = localStorage.getItem('skyboard_lang');
  if (savedLang && TRANSLATIONS[savedLang]) currentLang = savedLang;

  // Load Config
  try {
    const r = await fetch(`${DEFAULTS.apiUrl}/api/config`);
    if (r.ok) {
      const remote = await r.json();
      if (remote && typeof remote === 'object' && Object.keys(remote).length > 0) {
        CFG = {...DEFAULTS, ...remote};
      } else {
        // Server returned empty config, try localStorage
        const localCfg = localStorage.getItem('skyboard_cfg');
        if (localCfg) {
          try { CFG = {...DEFAULTS, ...JSON.parse(localCfg)}; } catch(err) {}
        }
      }
    }
  } catch(e) {
    const localCfg = localStorage.getItem('skyboard_cfg');
    if (localCfg) {
      try { CFG = {...DEFAULTS, ...JSON.parse(localCfg)}; } catch(err) {}
    }
  }

  // Integrity Check
  if (!Array.isArray(CFG.groups)) CFG.groups = JSON.parse(JSON.stringify(DEFAULTS.groups));

  const steps = [
    { name: "Theme", fn: () => applyThemeById(CFG.theme || 'skynet', false) },
    { name: "Config", fn: () => applyAllCfg() },
    { name: "Reorder", fn: () => {
        if (CFG.resOrder && CFG.resOrder.length) {
          const bar = document.getElementById('res-bar');
          CFG.resOrder.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.parentElement === bar) bar.appendChild(el);
          });
        }
    }},
    { name: "ThemeGrid", fn: () => buildThemeGrid() },
    { name: "Groups", fn: () => renderGroups() },
    { name: "Lang", fn: () => applyLang() },
    { name: "Favicon", fn: () => updateThemedFavicon() },
    { name: "Clock", fn: () => startClock() },
    { name: "Metrics", fn: () => startMetrics() },
    { name: "Form", fn: () => populateFormValues() },
    { name: "HUD", fn: () => applyDimensionsAndStyles() }
  ];

  steps.forEach(s => {
    try { s.fn(); } catch(e) { console.error(`[SkyBoard] Step '${s.name}' failed:`, e); }
  });
});

// ═══════════════════════════════════════════════════════
//  CONFIG APPLY
// ═══════════════════════════════════════════════════════
function applyAllCfg() {
  const r = document.documentElement;
  r.style.setProperty('--accent',  CFG.accent);
  r.style.setProperty('--accent2', CFG.accent2);
  r.style.setProperty('--accent3', CFG.accent3);
  r.style.setProperty('--accent4', CFG.accent4);
  r.style.setProperty('--bg',      CFG.bg);
  r.style.setProperty('--font-main',  CFG.fontMain);
  r.style.setProperty('--font-title', CFG.fontTitle);
  r.style.setProperty('--radius', CFG.radius+'px');
  if (CFG.wallpaper) applyWpDirect(CFG.wallpaper);
  Object.entries(CFG.fx||{}).forEach(([k,v])=>toggleFx(k,v,true));
  document.getElementById('logo-text').textContent = CFG.title || 'SkyBoard';
  if (CFG.uiBrightness !== undefined) applyUiBrightness(CFG.uiBrightness);
  if (CFG.uiScale !== undefined) applyUiScale(CFG.uiScale, false);
  if (CFG.hudOpacity !== undefined) applyHudOpacity(Math.round(CFG.hudOpacity*100), false);
}

function populateFormValues() {
  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setV('pick-accent',  CFG.accent);
  setV('pick-accent2', CFG.accent2);
  setV('pick-accent3', CFG.accent3);
  setV('pick-accent4', CFG.accent4);
  setV('pick-bg',      CFG.bg);
  setV('pick-title',   CFG.title || 'SkyBoard');

  setV('pick-brightness', CFG.uiBrightness || 100);
  setT('brightness-val',  CFG.uiBrightness || 100);

  const opPct = Math.round((CFG.hudOpacity || 0.95) * 100);
  setV('ui-op-slider', opPct);
  setT('ui-op-lbl', `${t('opacityLbl')} (${opPct}%)`);
  // color pickers live
  ['accent','accent2','accent3','accent4'].forEach(k=>{
    const el = document.getElementById('pick-'+k);
    if (el) {
      el.addEventListener('input',e=>{
        CFG[k] = e.target.value;
        document.documentElement.style.setProperty('--'+k, e.target.value);
      });
    }
  });
  const bgEl = document.getElementById('pick-bg');
  if (bgEl) {
    bgEl.addEventListener('input',e=>{
      CFG.bg = e.target.value;
      document.documentElement.style.setProperty('--bg', e.target.value);
    });
  }
}

async function saveConfig() {
  try {
    const r = await fetch(`${CFG.apiUrl}/api/config`, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-API-Key': CFG.apiKey || 'admin'
      },
      body: JSON.stringify(CFG)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch(e) {
    // save to localStorage as fallback
    localStorage.setItem('skyboard_cfg', JSON.stringify(CFG));
  }
}

// ═══════════════════════════════════════════════════════
//  THEMES
// ═══════════════════════════════════════════════════════
function buildThemeGrid() {
  const g = document.getElementById('theme-grid');
  g.innerHTML = '';
  THEMES.forEach(t => {
    const d = document.createElement('div');
    d.className = 'theme-card' + (CFG.theme===t.id?' active':'');
    d.style.background = t.bg;
    d.style.borderColor = t.accent;
    d.style.color = t.accent;
    d.innerHTML = `<div class="theme-preview" style="background:linear-gradient(135deg,${t.accent}22,${t.bg})"></div>${t.name}`;
    d.onclick = () => { applyThemeById(t.id); document.querySelectorAll('.theme-card').forEach(c=>c.classList.remove('active')); d.classList.add('active'); };
    g.appendChild(d);
  });
}

function applyThemeById(id, save=true) {
  const t = THEMES.find(x=>x.id===id);
  if (!t) return;
  const r = document.documentElement;
  if (t.border) r.style.setProperty('--border', t.border);
  if (t.text)   r.style.setProperty('--text',   t.text);
  if (t.textDim)r.style.setProperty('--text-dim',t.textDim);
  if (save) saveConfig();
}

function applyFont(v){ CFG.fontMain=v; document.documentElement.style.setProperty('--font-main',v); }
function applyFontTitle(v){ CFG.fontTitle=v; document.documentElement.style.setProperty('--font-title',v); }
function applyUiBrightness(v) {
  CFG.uiBrightness = parseInt(v);
  document.getElementById('app').style.filter = `brightness(${v/100})`;
  const lbl = document.getElementById('brightness-val');
  if (lbl) lbl.textContent = v;
}

function applyUiScale(v, save=true) {
  const val = parseFloat(v);
  CFG.uiScale = val;
  document.documentElement.style.setProperty('--ui-scale', val);
  const slider = document.getElementById('ui-scale-slider');
  if (slider) slider.value = val;
  updateScaleHint(v);
  if (save) saveConfig();
}

function updateScaleHint(v) {
  const lbl = document.getElementById('ui-scale-lbl');
  if (lbl) lbl.textContent = `📏 ESCALA (${parseFloat(v).toFixed(2)}x)`;
}

function applyHudOpacity(v, save=true) {
  const val = parseInt(v)/100;
  CFG.hudOpacity = val;
  document.documentElement.style.setProperty('--hud-opacity', val);
  const lbl = document.getElementById('ui-op-lbl');
  if (lbl) lbl.textContent = `${t('opacityLbl')} (${v}%)`;
  if (save) saveConfig();
}

function applyRandomQuote() {
  const el = document.querySelector('#footer .ftxt');
  if (!el) return;
  const pool = (currentLang === 'en-US' && typeof SKYNET_QUOTES_EN !== 'undefined' && SKYNET_QUOTES_EN.length)
    ? SKYNET_QUOTES_EN
    : (typeof SKYNET_QUOTES !== 'undefined' ? SKYNET_QUOTES : []);
  if (pool.length) {
    const r = Math.floor(Math.random() * pool.length);
    el.textContent = `[ ${pool[r].toUpperCase()} ]`;
  }
}

// ═══════════════════════════════════════════════════════
//  DYNAMIC FAVICON (THEMED PET)
// ═══════════════════════════════════════════════════════
function updateThemedFavicon() {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff2200';
  
  ctx.clearRect(0,0,32,32);
  ctx.fillStyle = color;
  
  // Desenha o "Pet" (Caveira Pixelada 16x16 escalada para 32x32)
  const skull = [
    "  XXXXX  ",
    " XXXXXXX ",
    "XX O O XX",
    "XXXXXXXXX",
    " XXXXXXX ",
    "  X X X  "
  ];
  
  const cellSize = 3;
  const offsetX = 4;
  const offsetY = 6;
  
  skull.forEach((row, y) => {
    for(let x=0; x<row.length; x++) {
      if(row[x] === 'X') {
        ctx.fillRect(offsetX + x*cellSize, offsetY + y*cellSize, cellSize, cellSize);
      } else if(row[x] === 'O') {
        ctx.clearRect(offsetX + x*cellSize, offsetY + y*cellSize, cellSize, cellSize);
      }
    }
  });

  const link = document.getElementById('dynamic-favicon');
  if (link) link.href = canvas.toDataURL('image/png');
}

// ═══════════════════════════════════════════════════════
//  WALLPAPER
// ═══════════════════════════════════════════════════════
function applyWpDirect(src) {
  const el = document.getElementById('wallpaper');
  if (src.startsWith('__gradient:')) {
    el.style.background = src.replace('__gradient:','');
    el.classList.remove('has-image');
  } else {
    el.style.backgroundImage = `url('${src}')`;
    el.classList.add('has-image');
  }
}

function applyWallpaper() {
  const url = document.getElementById('wp-url').value.trim();
  const file = document.getElementById('wp-upload').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target.result;
      CFG.wallpaper = b64;
      applyWpDirect(b64);
      // try upload to server
      try {
        await fetch(`${CFG.apiUrl}/api/wallpaper`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,data:b64})});
      }catch(e){}
      saveConfig();
    };
    reader.readAsDataURL(file);
  } else if (url) {
    CFG.wallpaper = url;
    applyWpDirect(url);
    saveConfig();
  }
}
function clearWallpaper(){
  CFG.wallpaper='';
  const el=document.getElementById('wallpaper');
  el.style.backgroundImage='';el.style.background='';el.classList.remove('has-image');
  saveConfig();
}

// ═══════════════════════════════════════════════════════
//  FX TOGGLES
// ═══════════════════════════════════════════════════════
function toggleFx(name, on, silent) {
  const map = {
    scanlines: 'fx-scanlines',
    phosphor: 'fx-phosphor',
    noise: 'fx-noise',
    glitch: 'fx-glitch',
    glass: 'fx-glass',
    rgb: 'fx-rgb'
  };
  const el = document.getElementById(map[name]);
  if (el) el.style.display = on ? '' : 'none';
  if (!silent) { CFG.fx = CFG.fx||{}; CFG.fx[name]=on; saveConfig(); }
}
function toggleFxEl(id, on){ const el=document.getElementById(id); if(el)el.style.display=on?'':'none'; }
function toggleWidget(id, on){ const el=document.getElementById(id); if(el)el.style.display=on?'':'none'; }
function toggleWidgetGpu(on){
  CFG.widgets = CFG.widgets||{};
  CFG.widgets.gpu = on;
  const el = document.getElementById('rw-gpu');
  if(el) el.style.display = on ? '' : 'none';
}

// ═══════════════════════════════════════════════════════
//  RENDER GROUPS & SERVICES
// ═══════════════════════════════════════════════════════
function renderGroups() {
  const grid = document.getElementById('main-grid');
  grid.innerHTML = '';
  CFG.groups.forEach(g => {
    grid.appendChild(buildGroup(g));
  });
  
  applyDimensionsAndStyles();
}

function _groupLabel(g) {
  const key = g.nameKey || (DEFAULTS.groups.find(d => d.id === g.id) || {}).nameKey;
  return key ? t(key) : g.name;
}

function buildGroup(g) {
  const div = document.createElement('div');
  div.className = 'group';
  div.dataset.groupId = g.id;
  div.draggable = false;

  div.innerHTML = `
    <div class="group-header">
      <div class="group-title-text"><span class="blink">▶</span> ${g.icon||''} ${_groupLabel(g)}</div>
      <div class="group-actions">
        <button class="hud-btn" onclick="openPropsModal('${g.id}')" title="Cor/Fonte">⚙</button>
        <button class="ga-btn" onclick="editGroup('${g.id}')" title="Editar">✏</button>
        <button class="ga-btn" onclick="deleteGroup('${g.id}')" title="Deletar">🗑</button>
      </div>
    </div>
    <div class="svc-list" id="svclist-${g.id}"></div>
    <button class="add-svc-btn" onclick="openAddSvc('${g.id}')">${t('addService')}</button>
    <div class="rz-h rz-r"></div><div class="rz-h rz-b"></div><div class="rz-h rz-br"></div>
  `;

  const list = div.querySelector('.svc-list');
  (g.services||[]).forEach(s => {
    const svcEl = buildSvc(s, g.id);
    list.appendChild(svcEl);
  });

  // drop service into this group's svc-list
  const list2 = div.querySelector('.svc-list');
  list2.addEventListener('dragover', e => {
    if (dragSrc && dragSrc.classList.contains('svc')) {
      e.preventDefault();
      e.stopPropagation();
      list2.style.outline = '2px dashed var(--accent2)';
    }
  });
  list2.addEventListener('dragleave', e => { list2.style.outline = ''; });
  list2.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    list2.style.outline = '';
    if (!dragSrc || !dragSrc.classList.contains('svc')) return;
    const srcSvcId = dragSrc.dataset.svcId;
    const srcGroupEl = dragSrc.closest('.group');
    if (!srcGroupEl) return;
    const srcGroupId = srcGroupEl.dataset.groupId;
    if (srcGroupId === g.id) return; // same group
    const srcGroup = CFG.groups.find(x => x.id === srcGroupId);
    const svc = srcGroup && srcGroup.services.find(x => x.id === srcSvcId);
    if (!svc || !srcGroup) return;
    srcGroup.services = srcGroup.services.filter(x => x.id !== srcSvcId);
    const dstGroup = CFG.groups.find(x => x.id === g.id);
    if (dstGroup) dstGroup.services.push(svc);
    renderGroups();
    saveConfig();
    dragSrc = null;
  });

  return div;
}

function buildSvc(s, groupId) {
  const a = document.createElement('a');
  a.className = 'svc';
  a.href = s.url||'#';
  a.target = '_blank';
  a.rel = 'noopener';
  a.dataset.svcId = s.id;
  a.id = `svc-${s.id}`;
  a.dataset.name = (s.name||'').toLowerCase();
  a.innerHTML = `
    <span class="si" style="color:${s.color||'#fff'}">${s.icon||'🔗'}</span>
    <div class="svc-info">
      <div class="svc-name">${s.name}</div>
      <div class="svc-desc">${s.desc||''}</div>
    </div>
    <div class="svc-edit" style="z-index:15">
      <button class="se-btn" title="Editar" onclick="event.preventDefault();openEditSvc('${s.id}','${groupId}')">✏</button>
      <button class="se-btn" title="Cor/Fonte" onclick="event.preventDefault();openPropsModal('svc-${s.id}')">⚙</button>
      <button class="se-btn" title="Mover ↑" onclick="event.preventDefault();moveSvc('${s.id}','${groupId}',-1)">↑</button>
      <button class="se-btn" title="Mover ↓" onclick="event.preventDefault();moveSvc('${s.id}','${groupId}',1)">↓</button>
      <button class="se-btn" title="Deletar" onclick="event.preventDefault();deleteSvc('${s.id}','${groupId}')">🗑</button>
    </div>
    <div class="svc-dot" id="dot-${s.id}"></div>
    <div class="rz-h rz-r"></div><div class="rz-h rz-b"></div><div class="rz-h rz-br"></div>
  `;
  // Prevent link navigation in edit mode, but allow button clicks inside
  a.addEventListener('click', e => {
    if (editMode) {
      if (!e.target.closest('.se-btn')) e.preventDefault();
    }
  });
  // drag service to any group
  a.draggable = false;
  return a;
}

// ═══════════════════════════════════════════════════════
//  SERVICE CRUD
// ═══════════════════════════════════════════════════════
function openAddSvc(groupId) {
  document.getElementById('modal-svc-title').textContent = '➕ Adicionar Serviço';
  document.getElementById('edit-svc-id').value = '';
  document.getElementById('edit-group-id').value = groupId;
  ['svc-name','svc-desc','svc-url','svc-icon'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('svc-color').value = '#00b4ff';
  openModal('modal-add-svc');
}
function openEditSvc(svcId, groupId) {
  const g = CFG.groups.find(x=>x.id===groupId);
  const s = g&&g.services.find(x=>x.id===svcId);
  if (!s) return;
  document.getElementById('modal-svc-title').textContent = '✏ Editar Serviço';
  document.getElementById('edit-svc-id').value   = svcId;
  document.getElementById('edit-group-id').value = groupId;
  document.getElementById('svc-name').value  = s.name||'';
  document.getElementById('svc-desc').value  = s.desc||'';
  document.getElementById('svc-url').value   = s.url||'';
  document.getElementById('svc-icon').value  = s.icon||'';
  document.getElementById('svc-color').value = s.color||'#fff';
  openModal('modal-add-svc');
}
function saveSvc() {
  const svcId   = document.getElementById('edit-svc-id').value;
  const groupId = document.getElementById('edit-group-id').value;
  const g = CFG.groups.find(x=>x.id===groupId);
  if (!g) return;
  const data = {
    name:  document.getElementById('svc-name').value,
    desc:  document.getElementById('svc-desc').value,
    url:   document.getElementById('svc-url').value,
    icon:  document.getElementById('svc-icon').value||'🔗',
    color: document.getElementById('svc-color').value,
  };
  if (svcId) {
    const s = g.services.find(x=>x.id===svcId);
    if (s) Object.assign(s, data);
  } else {
    data.id = 's'+Date.now();
    g.services.push(data);
  }
  renderGroups(); saveConfig(); closeModal('modal-add-svc');
}
function deleteSvc(svcId, groupId) {
  const g = CFG.groups.find(x=>x.id===groupId);
  if (g) g.services = g.services.filter(x=>x.id!==svcId);
  renderGroups(); saveConfig();
}
function moveSvc(svcId, groupId, dir) {
  const g = CFG.groups.find(x=>x.id===groupId);
  if (!g) return;
  const i = g.services.findIndex(x=>x.id===svcId);
  const j = i+dir;
  if (j<0||j>=g.services.length) return;
  [g.services[i],g.services[j]]=[g.services[j],g.services[i]];
  renderGroups(); saveConfig();
}

// ═══════════════════════════════════════════════════════
//  GROUP CRUD
// ═══════════════════════════════════════════════════════
function saveGroup() {
  const name = document.getElementById('group-name').value;
  const icon = document.getElementById('group-icon').value||'📁';
  if (!name) return;
  CFG.groups.push({id:'g'+Date.now(),name,icon,services:[]});
  renderGroups(); saveConfig(); closeModal('modal-add-group');
}
function editGroup(id) {
  const g = CFG.groups.find(x=>x.id===id);
  if (!g) return;
  document.getElementById('group-name').value = g.name;
  document.getElementById('group-icon').value = g.icon||'';
  // re-use group modal in edit mode
  const btn = document.querySelector('#modal-add-group .modal-btn');
  btn.onclick = () => {
    g.name = document.getElementById('group-name').value || g.name;
    g.icon = document.getElementById('group-icon').value || g.icon;
    renderGroups(); saveConfig(); closeModal('modal-add-group');
    btn.onclick = saveGroup;
  };
  openModal('modal-add-group');
}
function deleteGroup(id) {
  if (!confirm('Deletar grupo?')) return;
  CFG.groups = CFG.groups.filter(x=>x.id!==id);
  renderGroups(); saveConfig();
}

// ═══════════════════════════════════════════════════════
//  EDIT MODE & HUD ENGINE (WoW-Style Layout)
// ═══════════════════════════════════════════════════════
const HUD = {
  el: null, action: null,
  startX: 0, startY: 0, startW: 0, startH: 0, offX: 0, offY: 0
};
const GRID_SIZE = 20;

function toggleEdit() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  const btn = document.getElementById('btn-edit');
  btn.classList.toggle('active', editMode);
  btn.textContent = editMode ? t('editDone') : t('editStart');
  
  document.querySelectorAll('.hud-btn-global').forEach(b => {
    if (editMode) {
      b.style.display = b.tagName === 'BUTTON' ? 'inline-block' : 'flex';
    } else {
      b.style.display = 'none';
    }
  });

  document.body.style.userSelect = editMode ? 'none' : '';
  // Prevent navigation on non-service links only; .svc handled by click handler in buildSvc
  document.querySelectorAll('a:not(.svc)').forEach(a => {
    a.style.pointerEvents = editMode ? 'none' : '';
  });
  // Ensure .svc pointer events are always active so internal buttons work
  document.querySelectorAll('a.svc').forEach(a => {
    a.style.pointerEvents = '';
  });

  if (!editMode) {
    saveConfig();
  }
}

// Global Mouse Hooks for Absolute HUD Drag
const HUD_DRAGGABLES = '.group, .res-widget, .svc, .logo, .hstats, #clk, .quote, .api-badge';

document.addEventListener('mousedown', e => {
  if (!editMode) return;
  const rz = e.target.closest('.rz-h');
  if (rz) {
    e.preventDefault();
    HUD.el = rz.closest('.group, .res-widget, .svc, .logo');
    if (!HUD.el) return;
    HUD.startW = HUD.el.offsetWidth;
    HUD.startH = HUD.el.offsetHeight;
    HUD.startX = e.clientX;
    HUD.startY = e.clientY;
    
    if (rz.classList.contains('rz-r')) HUD.action = 'resize-r';
    else if (rz.classList.contains('rz-b')) HUD.action = 'resize-b';
    else if (rz.classList.contains('rz-br')) HUD.action = 'resize-br';
    
    HUD.el.style.flex = '0 0 auto';
    return;
  }
  
  const targetEl = e.target.closest(HUD_DRAGGABLES);
  if (targetEl) {
    const btn = e.target.closest('button, .ga-btn, .hud-rt-btn, .hud-btn, .rz-h');
    if (btn) return;
    
    e.preventDefault();
    HUD.el = targetEl;
    HUD.action = 'drag';
    
    // Pick up info
    const rect = HUD.el.getBoundingClientRect();
    HUD.offX = e.clientX - rect.left;
    HUD.offY = e.clientY - rect.top;
    HUD.startW = rect.width;
    HUD.startH = rect.height;

    // Create placeholder to keep the layout
    HUD.placeholder = HUD.el.cloneNode(true);
    HUD.placeholder.classList.add('hud-placeholder');
    HUD.placeholder.id = ''; // remove duplicate ID
    HUD.placeholder.style.pointerEvents = 'none';
    
    // Set ghost style
    HUD.el.style.width = HUD.startW + 'px';
    HUD.el.style.height = HUD.startH + 'px';
    HUD.el.style.left = rect.left + 'px';
    HUD.el.style.top = rect.top + 'px';
    HUD.el.classList.add('hud-dragging');
    
    // Insert placeholder and start ghosting
    HUD.el.after(HUD.placeholder);
  }
});

document.addEventListener('mousemove', e => {
  if (!HUD.action || !HUD.el) return;
  e.preventDefault();
  
  if (HUD.action === 'drag') {
    // Follow mouse
    HUD.el.style.left = (e.clientX - HUD.offX) + 'px';
    HUD.el.style.top  = (e.clientY - HUD.offY) + 'px';

    // Reorder logic
    const parent = HUD.placeholder.parentElement;
    const items = [...parent.children].filter(c => c !== HUD.el && c !== HUD.placeholder);
    
    let over = null;
    items.forEach(item => {
      const r = item.getBoundingClientRect();
      const isOver = e.clientX > r.left && e.clientX < r.right && 
                     e.clientY > r.top  && e.clientY < r.bottom;
      if (isOver) over = item;
    });

    if (over) {
      const rect = over.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      
      if (e.clientX > midX || e.clientY > midY) {
        if (over.nextSibling !== HUD.placeholder) over.after(HUD.placeholder);
      } else {
        if (over.previousSibling !== HUD.placeholder) over.before(HUD.placeholder);
      }
    }
  } else if (HUD.action.startsWith('resize')) {
    let nW = HUD.startW;
    let nH = HUD.startH;
    if (HUD.action === 'resize-r' || HUD.action === 'resize-br') {
      nW = HUD.startW + (e.clientX - HUD.startX);
    }
    if (HUD.action === 'resize-b' || HUD.action === 'resize-br') {
      nH = HUD.startH + (e.clientY - HUD.startY);
    }
    
    if (!e.ctrlKey) {
      nW = Math.max(100, Math.round(nW / GRID_SIZE) * GRID_SIZE);
      nH = Math.max(50, Math.round(nH / GRID_SIZE) * GRID_SIZE);
    }
    HUD.el.style.width = nW + 'px';
    HUD.el.style.height = nH + 'px';
  }
});

function updateHudPos(e) {
  let nx = e.clientX - HUD.offX;
  let ny = e.clientY - HUD.offY;
  if (!e.ctrlKey) {
     nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
     ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
  }
  HUD.el.style.left = nx + 'px';
  HUD.el.style.top = ny + 'px';
}

document.addEventListener('mouseup', () => {
  if (!HUD.action || !HUD.el) return;
  
  if (HUD.action === 'drag') {
    // Return from ghost to layout
    if (HUD.placeholder && HUD.placeholder.parentElement) {
      HUD.placeholder.replaceWith(HUD.el);
    }
    
    // Clear styles
    HUD.el.classList.remove('hud-dragging');
    HUD.el.style.position = '';
    HUD.el.style.left = '';
    HUD.el.style.top = '';
    HUD.el.style.width = '';
    HUD.el.style.height = '';
    
    // SAVE NEW DOM ORDER TO CFG
    if (HUD.el.classList.contains('group')) {
      const parent = document.getElementById('main-grid');
      const newOrder = [...parent.children].filter(c=>c.classList.contains('group')).map(g => g.dataset.groupId);
      CFG.groups.sort((a,b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      saveConfig();
    } else if (HUD.el.closest('#res-bar')) {
       const bar = document.getElementById('res-bar');
       CFG.resOrder = [...bar.children].map(c => c.id);
       saveConfig();
    }
  } else if (HUD.action.startsWith('resize')) {
    saveHudState(HUD.el);
  }
  
  HUD.action = null;
  HUD.el = null;
  if (HUD.placeholder) {
    if (HUD.placeholder.parentElement) HUD.placeholder.remove();
    HUD.placeholder = null;
  }
  saveConfig();
});

function saveHudState(el) {
   const id = el.dataset.groupId || el.id;
   CFG.absoluteDimensions = CFG.absoluteDimensions || {};
   if (el.classList.contains('hud-float')) {
      CFG.absoluteDimensions[id] = {
         abs: true, left: el.style.left, top: el.style.top,
         w: el.style.width, h: el.style.height
      };
   } else {
      CFG.absoluteDimensions[id] = {
         abs: false, w: el.style.width, h: el.style.height
      };
   }
}

function resetAllHud() {
   // 1. Reset Dimensions and Floating
   CFG.absoluteDimensions = {};
   document.querySelectorAll('.hud-float').forEach(el => el.classList.remove('hud-float'));

   // 2. Reset Layout Order
   CFG.resOrder = ['rw-cpu', 'rw-ram', 'rw-temp', 'rw-swap'];
   
   // 3. Reset Global Visuals
   CFG.uiScale = 1.0;
   CFG.hudOpacity = 0.95;
   CFG.customStyles = {};
   CFG.wallpaper = '';
   CFG.uiBrightness = 100;

   // 4. Force default metric toggles
   CFG.widgets = {cpu:true, ram:true, gpu:true, temp:true, swap:true};

   // 5. Apply everything
   saveConfig();
   
   // Refresh UI
   applyAllCfg();
   clearWallpaper();
   renderGroups(); 
   
   // Refresh toolbar sliders display
   populateFormValues();
   applyRandomQuote();

   // Manually Sort Metrics Bar in DOM
   const bar = document.getElementById('res-bar');
   CFG.resOrder.forEach(id => {
      const el = document.getElementById(id);
      if (el) bar.appendChild(el);
   });
   
}

function openPropsModal(id) {
  const modal = document.getElementById('modal-props');
  if (!modal) return;
  document.getElementById('prop-id').value = id;
  const style = (CFG.customStyles && CFG.customStyles[id]) || {bg:'', fg:'', fz:'100'};
  document.getElementById('prop-bg').value = style.bg || '';
  document.getElementById('prop-fg').value = style.fg || '#ffffff';
  document.getElementById('prop-fz').value = style.fz || '100';
  openModal('modal-props-overlay');
}

function saveProps() {
  const id = document.getElementById('prop-id').value;
  CFG.customStyles = CFG.customStyles || {};
  CFG.customStyles[id] = {
    bg: document.getElementById('prop-bg').value,
    fg: document.getElementById('prop-fg').value,
    fz: document.getElementById('prop-fz').value,
  };
  closeModal('modal-props-overlay');
  applyDimensionsAndStyles();
  saveConfig();
}

function applyDimensionsAndStyles() {
  if (CFG.absoluteDimensions) {
    Object.entries(CFG.absoluteDimensions).forEach(([id, dim]) => {
      const el = document.getElementById(id) || document.querySelector(`[data-group-id="${id}"]`);
      if (!el) return;
      
      if (dim.w) { el.style.width = dim.w; el.style.maxWidth = 'none'; el.style.flex = '0 0 auto'; }
      if (dim.h) { el.style.height = dim.h; }
      
      if (dim.abs) {
        el.classList.add('hud-float');
        el.style.left = dim.left;
        el.style.top = dim.top;
      }
    });
  }
  if (CFG.customStyles) {
    Object.entries(CFG.customStyles).forEach(([id, st]) => {
      const el = document.getElementById(id) || document.querySelector(`[data-group-id="${id}"]`);
      if (!el) return;
      if (st.bg) { el.style.backgroundColor = st.bg; el.style.backgroundImage = 'none'; el.style.border = 'none'; }
      if (st.fg) {
        el.style.color = st.fg;
        el.style.textShadow = `0 0 10px ${st.fg}`;
        const title = el.querySelector('.group-title-text, .rw-name, .svc-name');
        if (title) { title.style.color = st.fg; title.style.textShadow = `0 0 10px ${st.fg}`; }
      }
      if (st.fz && st.fz !== '100') {
        el.style.fontSize = `${st.fz}%`;
        const title = el.querySelector('.group-title-text, .rw-name, .svc-name');
        if (title) title.style.fontSize = `${st.fz}%`;
      }
    });
  }
}

// ═══════════════════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════════════════
function filterServices(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('.svc').forEach(el => {
    const name = el.dataset.name||'';
    el.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}

// ═══════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id).classList.add('hidden'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.add('hidden');
});


// ═══════════════════════════════════════════════════════
//  CLOCK
// ═══════════════════════════════════════════════════════
function startClock() {
  function tick() {
    const n = new Date();
    document.getElementById('clk').textContent =
      [n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  }
  setInterval(tick,1000); tick();
}

// ═══════════════════════════════════════════════════════
//  METRICS
// ═══════════════════════════════════════════════════════
function startMetrics() {
  fetchMetrics();
  metricsTimer = setInterval(fetchMetrics, (CFG.apiInterval||2)*1000);
}

function fmtBps(b) {
  if (b>=1e9) return `${(b/1e9).toFixed(2)} GB/s`;
  if (b>=1e6) return `${(b/1e6).toFixed(2)} MB/s`;
  if (b>=1e3) return `${(b/1e3).toFixed(1)} KB/s`;
  return `${b} B/s`;
}

function setVal(id, text) { const e=document.getElementById(id); if(e) e.textContent=text; }

function getColorClass(pct) {
  if (pct < 20) return 'lvl1';
  if (pct < 40) return 'lvl2';
  if (pct < 60) return 'lvl3';
  if (pct < 80) return 'lvl4';
  return 'lvl5';
}

function setBar(fillId, valId, pct) {
  const f = document.getElementById(fillId), v = document.getElementById(valId);
  if (!f || !v) return;
  f.style.width = Math.min(pct, 100) + '%';
  const cls = getColorClass(pct);
  f.className = 'rw-fill ' + cls;
  v.className = 'rw-val ' + cls;
}

async function fetchMetrics() {
  try {
    const r = await fetch(`${CFG.apiUrl}/api/metrics`);
    if (!r.ok) throw new Error('bad response');
    const d = await r.json();

    // API online
    const dot = document.getElementById('api-dot');
    dot.classList.remove('off');
    setVal('api-status','ONLINE');

    // Uptime
    const us = d.uptime_s||0;
    const uh=String(Math.floor(us/3600)).padStart(2,'0');
    const um=String(Math.floor((us%3600)/60)).padStart(2,'0');
    const us2=String(us%60).padStart(2,'0');
    setVal('h-uptime',`${uh}:${um}:${us2}`);

    // CPU
    const cpu = d.cpu||{};
    setVal('rw-cpu-v', `${cpu.pct||0}%`);
    setVal('h-cpu',    `${cpu.pct||0}%`);
    setBar('rw-cpu-f','rw-cpu-v',cpu.pct||0);
    setVal('rw-cpu-sub', `${cpu.cores||'?'} cores @ ${cpu.freq_mhz||'?'} MHz${cpu.model?' — '+cpu.model.substring(0,22):''}` );

    // RAM
    const ram = d.ram||{};
    setVal('rw-ram-v', `${ram.pct||0}%`);
    setVal('h-ram',    `${ram.pct||0}%`);
    setBar('rw-ram-f','rw-ram-v',ram.pct||0);
    setVal('rw-ram-sub', `${ram.used_gb||0} / ${ram.total_gb||0} GB`);

    // SWAP
    const sw = d.swap||{};
    setVal('rw-swap-v', `${sw.pct||0}%`);
    setBar('rw-swap-f','rw-swap-v',sw.pct||0);
    setVal('rw-swap-sub',`${sw.used_gb||0} / ${sw.total_gb||0} GB`);

    // NET
    const net = d.network||{};
    const upS = fmtBps(net.up_bps||0), dnS = fmtBps(net.dn_bps||0);
    setVal('net-up-mini', upS); setVal('net-dn-mini', dnS);

    // TEMPS
    const temps = d.temperatures||{};
    const tempVals = Object.values(temps).filter(v=>v>0);
    const maxTemp = tempVals.length ? Math.max(...tempVals) : null;
    if (maxTemp!==null) {
      const tv = document.getElementById('rw-temp-v');
      if (tv) { tv.textContent=`${maxTemp}°C`; }
    }
    const tg = document.getElementById('temps-grid');
    if (tg) {
      tg.style.display = 'none';
    }
    setBar('rw-temp-f','rw-temp-v', maxTemp !== null ? Math.min(maxTemp, 100) : 0);
    setVal('rw-temp-sub', `Pico máx. de todos os ${Object.keys(temps).length} sensores (Geral)`);

    // GPU
    if (d.gpu&&d.gpu.length) {
      const g0 = d.gpu[0];
      const gpuWidgetOn = CFG.widgets?.gpu !== false;
      document.getElementById('rw-gpu').style.display = gpuWidgetOn ? '' : 'none';
      document.getElementById('h-gpu-wrap').style.display = '';
      setVal('rw-gpu-v', `${g0.gpu_pct||0}%`);
      setVal('h-gpu',    `${g0.gpu_pct||0}%`);
      setBar('rw-gpu-f','rw-gpu-v',g0.gpu_pct||0,70,90);
      setVal('rw-gpu-sub', `${g0.mem_used_mb||0}/${g0.mem_total_mb||0}MB VRAM | ${g0.temp_c||'?'}°C${g0.power_w?` | ${g0.power_w}W`:''}`);
    }

  } catch(e) {
    document.getElementById('api-dot').classList.add('off');
    setVal('api-status','OFFLINE');
  }
}

// ═══════════════════════════════════════════════════════
//  SERVICE DISCOVERY & AUTO-SUGGEST
// ═══════════════════════════════════════════════════════
async function discoverServices() {
  const list = document.getElementById('discovery-list');
  list.innerHTML = '<div style="color:var(--text-dim);padding:20px;text-align:center">Escaneando Docker Socket...</div>';
  openModal('modal-discovery');
  
  try {
    const r = await fetch(`${CFG.apiUrl}/api/discover`, {
      headers: { 'X-API-Key': CFG.apiKey || '' }
    });
    const d = await r.json();
    list.innerHTML = '';
    
    if (!d.services || !d.services.length) {
      list.innerHTML = '<div style="color:var(--text-dim);padding:20px;text-align:center">Nenhum serviço novo detectado.</div>';
      return;
    }
    
    d.services.forEach(s => {
      // Check if already exists
      const exists = CFG.groups.some(g => g.services.some(svc => svc.name === s.name || svc.url === s.url));
      
      const div = document.createElement('div');
      div.style.cssText = `background:rgba(255,255,255,0.05); border:1px solid var(--border); padding:8px 12px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:0.2s; opacity:${exists?0.5:1}`;
      if (exists) div.title = "Já adicionado";
      
      div.innerHTML = `
        <span style="font-size:1.2rem; color:${s.color}">${s.icon}</span>
        <div style="flex:1">
          <div style="font-size:0.75rem; color:var(--accent)">${s.name}</div>
          <div style="font-size:0.55rem; color:var(--text-dim)">${s.image}</div>
        </div>
        <button class="tb-btn" style="padding:2px 8px; font-size:0.55rem" ${exists?'disabled':''}>${exists?'OK':'ADD'}</button>
      `;
      
      if (!exists) {
        div.onclick = () => {
          addDiscoveredSvc(s);
          div.style.opacity = '0.5';
          div.querySelector('button').disabled = true;
          div.querySelector('button').textContent = 'OK';
          div.onclick = null;
        };
      }
      list.appendChild(div);
    });
  } catch(e) {
    list.innerHTML = '<div style="color:var(--accent);padding:20px;text-align:center">Erro ao conectar com Docker. Verifique se o socket está mapeado.</div>';
  }
}

function addDiscoveredSvc(s) {
  if (!CFG.groups || !CFG.groups.length) {
    CFG.groups = [{ id: 'g-auto', name: 'Auto-Detectados', icon: '🔍', services: [] }];
  }
  const targetGroup = CFG.groups[0];
  const newSvc = {
    id: 's' + Date.now(),
    name: s.name,
    desc: s.desc,
    url: s.url,
    icon: s.icon,
    color: s.color
  };
  targetGroup.services.push(newSvc);
  renderGroups();
  saveConfig();
}

// Icon Auto-suggest
document.getElementById('svc-name').oninput = function(e) {
  const val = e.target.value.toLowerCase().trim();
  const SUGGESTIONS = {
    "plex": {icon: "🎥", color: "#e5a00d"},
    "jellyfin": {icon: "🎬", color: "#00b4ff"},
    "emby": {icon: "🟢", color: "#52b54b"},
    "portainer": {icon: "🐳", color: "#13bef9"},
    "nextcloud": {icon: "☁️", color: "#0082c9"},
    "adguard": {icon: "🛡️", color: "#67b346"},
    "pihole": {icon: "🕳️", color: "#96060c"},
    "transmission": {icon: "🚲", color: "#da1b1b"},
    "qbittorrent": {icon: "⬇️", color: "#2dccff"},
    "deluge": {icon: "💧", color: "#49a3ff"},
    "radarr": {icon: "🎬", color: "#ffcc00"},
    "sonarr": {icon: "📺", color: "#35c5f4"},
    "prowlarr": {icon: "🕷️", color: "#ff6600"},
    "bazarr": {icon: "💬", color: "#20d9d2"},
    "lidarr": {icon: "🎵", color: "#40aba1"},
    "readarr": {icon: "📚", color: "#f1bb2d"},
    "tautulli": {icon: "📊", color: "#ef7e12"},
    "overseerr": {icon: "🦑", color: "#aa44ff"},
    "ombi": {icon: "💡", color: "#0091ea"},
    "jackett": {icon: "🧥", color: "#f21d33"},
    "home assistant": {icon: "🏠", color: "#03a9f4"},
    "ha": {icon: "🏠", color: "#03a9f4"},
    "uptime": {icon: "📈", color: "#6ad24c"},
    "kuma": {icon: "📈", color: "#6ad24c"},
    "proxmox": {icon: "🖥️", color: "#e57000"},
    "grafana": {icon: "📊", color: "#f3ad1c"},
    "prometheus": {icon: "🔥", color: "#e6522c"},
    "influx": {icon: "📈", color: "#22ad5c"},
    "netdata": {icon: "⚡", color: "#00ab44"},
    "glances": {icon: "👁️", color: "#00e570"},
    "dozzle": {icon: "📜", color: "#00e570"},
    "watchtower": {icon: "🗼", color: "#2dccff"},
    "nginx": {icon: "🌐", color: "#009639"},
    "traefik": {icon: "🐳", color: "#24a1c1"},
    "caddy": {icon: "🌀", color: "#005571"},
    "cloudflare": {icon: "☁️", color: "#f38020"},
    "wireguard": {icon: "🛡️", color: "#881717"},
    "tailscale": {icon: "🌐", color: "#3a62d7"},
    "immich": {icon: "📸", color: "#ff6699"},
    "photoprism": {icon: "🖼️", color: "#8b5cf6"},
    "bitwarden": {icon: "🛡️", color: "#175ddc"},
    "vaultwarden": {icon: "🛡️", color: "#175ddc"},
    "vscode": {icon: "💻", color: "#007acc"},
    "code": {icon: "💻", color: "#007acc"},
    "jupyter": {icon: "🪐", color: "#f37626"},
    "ghost": {icon: "👻", color: "#15171a"},
    "wordpress": {icon: "📝", color: "#21759b"}
  };
  
  for(let key in SUGGESTIONS) {
    if (val.includes(key)) {
      document.getElementById('svc-icon').value = SUGGESTIONS[key].icon;
      document.getElementById('svc-color').value = SUGGESTIONS[key].color;
      break;
    }
  }
};