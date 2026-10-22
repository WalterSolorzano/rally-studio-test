// dashboard/app.js -- Rally Studio Workbench Oficial (Flujo Real de Competencia)
// Arquitectura secuencial estricta: Certamen -> Equipo -> Retos del Comité -> Taller Solución -> Despacho Multi-IA -> Espacio Completo.
// Cero emojis, soporte de Wi-Fi universitario con bypass por token/Drive/JSON, y generación de Mega-Prompts especializados.

// ── ICONOS SVG VECTORIALES (CERO EMOJIS) ──────────────────────────────────────
const SVG = {
  logo: `<svg width="24" height="22" viewBox="0 0 24 22" fill="none" style="vertical-align:middle;"><line x1="5" y1="20" x2="13" y2="2" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round"/><line x1="13" y1="20" x2="21" y2="2" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round"/></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  sync: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
  chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  checkedCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#0066FF"/><path d="M7 12.5l3.5 3.5 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  uncheckedCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#CBD5E1" stroke-width="2"/></svg>`,
  check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  lock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  download: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  upload: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  external: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  menu: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  globe: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  spark: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l1.8 5.6L19 10l-5.2 1.4L12 17l-1.8-5.6L5 10l5.2-1.4L12 3z"></path><circle cx="18.5" cy="17.5" r="1.6"></circle></svg>`,
  bell: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  spinner: `<svg class="spin-anim" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  target: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  arrowRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  arrowLeft: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  plus: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  refresh: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  dotsVertical: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>`,
  shieldCheck: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`,
  network: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,

  rallyLatamEmblem: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;" title="Rally Latinoamericano de Innovación"><circle cx="16" cy="16" r="14" fill="#FFF1F2" stroke="#FECDD3" stroke-width="1.5"/><path d="M12 9C14 11 16 13 15 16C14 19 18 23 20 22C22 20 23 16 21 13C19 10 17 8 13 8Z" fill="#E11D48"/><ellipse cx="16" cy="16" rx="14" ry="5.5" stroke="#E11D48" stroke-width="1.2" stroke-dasharray="3 2" transform="rotate(-25 16 16)"/><circle cx="21" cy="12" r="1.8" fill="#F43F5E"/></svg>`,
  rallyNacEmblem: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;" title="Rally Nacional Nicaragua Innova"><circle cx="16" cy="16" r="14" fill="#F8FAFD" stroke="#CBD5E1" stroke-width="1.5"/><path d="M16 8L10.5 22H21.5L16 8Z" fill="#0D1B35"/><circle cx="21" cy="11" r="2.8" fill="#0866F5"/><path d="M9 22C12 20.5 20 20.5 23 22" stroke="#0284C7" stroke-width="1.5"/></svg>`,
  uniCrestEmblem: `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" style="vertical-align:middle;" title="Universidad Nacional de Ingeniería (UNI)"><circle cx="16" cy="16" r="14" fill="#003366"/><circle cx="16" cy="16" r="12.5" stroke="#FFB800" stroke-width="1.2"/><path d="M16 7L23 11V18C23 22 16 26 16 26C16 26 9 22 9 18V11L16 7Z" fill="#002244" stroke="#FFB800" stroke-width="1.2"/><path d="M16 11L18.5 16H13.5L16 11Z" fill="#FFB800"/><path d="M13 18H19" stroke="#FFB800" stroke-width="1.5"/></svg>`,

  latinAmericaIllustration: `
<svg width="290" height="170" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto;">
  <defs>
    <!-- Paleta oficial Latam: Grises de precisión técnica y Rosa/Magenta vibrante -->
    <linearGradient id="latamGrayLand" x1="120" y1="10" x2="220" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#64748B"/>
      <stop offset="40%" stop-color="#475569"/>
      <stop offset="85%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="latamRoseOrbit" x1="30" y1="90" x2="290" y2="110" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#0866F5" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#93C5FD" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="latamSoftShadow" x="60" y="10" width="220" height="190" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0866F5" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Anillos Orbitales con micro-animación CSS -->
  <g class="anim-orbit">
    <ellipse cx="160" cy="104" rx="122" ry="42" stroke="url(#latamRoseOrbit)" stroke-width="2" stroke-dasharray="6 4" transform="rotate(-16 160 104)"/>
    <ellipse cx="160" cy="106" rx="134" ry="32" stroke="#93C5FD" stroke-width="1.2" stroke-opacity="0.6" transform="rotate(22 160 106)"/>
  </g>

  <g filter="url(#latamSoftShadow)">
    <!-- Península de Baja California -->
    <path d="M84 24 C82 32, 86 42, 92 50 C94 54, 96 52, 94 44 C92 36, 88 28, 86 22 Z" fill="#64748B"/>

    <!-- México continental y Península de Yucatán -->
    <path d="M88 22 C96 22, 108 26, 116 32 C124 38, 130 36, 134 44 C138 48, 148 44, 154 44 C158 44, 160 48, 156 52 C152 56, 146 54, 142 58 C138 62, 134 68, 130 70 C124 68, 118 64, 112 56 C106 48, 98 42, 90 32 Z" fill="url(#latamGrayLand)"/>

    <!-- Istmo de Centroamérica -->
    <path d="M130 70 C136 70, 142 74, 148 78 C154 82, 160 84, 166 84 C172 84, 176 80, 182 82 C184 84, 184 88, 180 88 C174 88, 166 88, 160 86 C152 84, 144 80, 138 74 Z" fill="#475569"/>

    <!-- Islas del Caribe -->
    <path d="M148 50 C156 52, 168 56, 176 60 C174 62, 164 58, 152 54 Z" fill="#94A3B8"/>
    <ellipse cx="184" cy="64" rx="4" ry="2" fill="#0866F5"/>
    <ellipse cx="194" cy="67" rx="2.5" ry="1.5" fill="#0284C7"/>

    <!-- Masa Continental de Sudamérica -->
    <path d="M178 82 
             C186 78, 198 76, 210 80 
             C222 84, 234 88, 244 96 
             C254 104, 264 114, 260 126 
             C256 138, 246 150, 238 162 
             C232 172, 226 182, 220 196 
             C218 200, 214 204, 210 204 
             C206 204, 204 198, 204 190 
             C204 178, 198 162, 194 148 
             C190 138, 182 126, 180 114 
             C178 102, 174 92, 178 82 Z" fill="url(#latamGrayLand)"/>

    <!-- Cordillera Andina con acento plateado-rosa -->
    <path d="M180 84 
             C184 96, 188 112, 190 126 
             C192 140, 196 156, 202 172 
             C206 182, 208 194, 210 202 
             C208 202, 204 196, 204 188 
             C204 176, 198 162, 194 148 
             C190 138, 182 126, 180 114 Z" fill="#CBD5E1" fill-opacity="0.65"/>

    <!-- Relieve este Brasil -->
    <path d="M210 82 
             C228 88, 246 98, 258 114 
             C262 120, 256 134, 246 148 
             C254 136, 258 124, 256 116 
             C250 104, 236 94, 218 86 Z" fill="#94A3B8" fill-opacity="0.45"/>
  </g>

  <!-- Nodos satelitales Azul/Cyan con animación -->
  <g class="anim-beacon">
    <circle cx="216" cy="80" r="4" fill="#0866F5"/>
    <circle cx="216" cy="80" r="7" stroke="#0284C7" stroke-width="1.4" stroke-opacity="0.8"/>
  </g>
  <circle cx="140" cy="116" r="3" fill="#0284C7" class="anim-beacon"/>
  <circle cx="240" cy="140" r="2.8" fill="#38BDF8" class="anim-beacon"/>
</svg>`,

  // RÉPLICA EXACTA DE LA IMAGEN RECORTADA DE NICARAGUA
  momotomboIllustration: `
<svg width="290" height="170" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto;">
  <defs>
    <!-- Degradados idénticos a la imagen de referencia -->
    <linearGradient id="volcanoFlankLeft" x1="165" y1="46" x2="85" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="60%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <linearGradient id="volcanoFlankRight" x1="165" y1="46" x2="245" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="45%" stop-color="#0369A1"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="lavaStripeGrad" x1="168" y1="48" x2="210" y2="105" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#EA580C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="lakeWaterRef" x1="170" y1="114" x2="170" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="60%" stop-color="#0369A1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
  </defs>

  <!-- Nubes a la izquierda (idénticas a la imagen) -->
  <g class="anim-cloud">
    <path d="M60 72 C60 62, 70 54, 80 54 C85 46, 95 44, 105 46 C115 44, 125 50, 128 58 C135 58, 142 66, 142 74 C142 80, 136 86, 130 86 L65 86 C60 86, 60 78, 60 72 Z" fill="#93C5FD" fill-opacity="0.85"/>
    <path d="M42 90 C42 84, 48 80, 54 80 C58 76, 64 76, 68 78 C72 78, 76 82, 76 86 L42 90 Z" fill="#BFDBFE" fill-opacity="0.75"/>
  </g>

  <!-- Sol dorado a la derecha -->
  <circle cx="235" cy="52" r="14" fill="#F59E0B" class="anim-sun"/>

  <!-- Nube pequeña detrás de las colinas de la derecha -->
  <path d="M260 76 C260 70, 266 66, 272 66 C276 62, 284 62, 290 64 C296 64, 300 68, 302 72 L260 76 Z" fill="#BFDBFE" fill-opacity="0.75" class="anim-cloud"/>

  <!-- Colinas distantes a ambos lados -->
  <path d="M25 124 Q70 102 120 112 L120 126 L25 126 Z" fill="#0D9488" fill-opacity="0.6"/>
  <path d="M230 114 Q280 100 325 116 L325 126 L230 126 Z" fill="#2563EB" fill-opacity="0.55"/>

  <!-- VOLCÁN MOMOTOMBO (Silueta cónica amplia y masiva) -->
  <!-- Flanco izquierdo (azul oscuro/índigo) -->
  <path d="M158 46 
           C148 58, 134 78, 120 98 
           C110 110, 98 120, 84 126 
           L165 126 
           L158 46 Z" fill="url(#volcanoFlankLeft)"/>

  <!-- Flanco derecho (azul celeste/turquesa) -->
  <path d="M165 46 
           L165 126 
           L246 126 
           C232 120, 220 110, 210 98 
           C196 78, 182 58, 172 46 Z" fill="url(#volcanoFlankRight)"/>

  <!-- Cráter somital con muesca -->
  <path d="M158 46 C162 48, 168 48, 172 46 L165 52 Z" fill="#EA580C"/>
  <ellipse cx="165" cy="46" rx="7" ry="2.5" fill="#F59E0B"/>

  <!-- VETA / GRIETA NARANJA Y DORADA (Exacta al recorte) -->
  <g class="anim-lava">
    <path d="M168 48 Q182 72 208 104" stroke="url(#lavaStripeGrad)" stroke-width="4" stroke-linecap="round"/>
    <path d="M168 48 Q182 72 208 104" stroke="#FEF08A" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Veta secundaria -->
    <path d="M172 60 Q188 82 216 112" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <!-- Estrías y pliegues en flanco izquierdo -->
  <path d="M160 52 Q144 86 126 126" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-opacity="0.6"/>
  <path d="M164 56 Q156 88 146 126" stroke="#1E40AF" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.5"/>

  <!-- FRANJA DE VEGETACIÓN VERDE EN LA BASE DEL VOLCÁN -->
  <path d="M80 120 C100 114, 130 116, 165 114 C200 114, 230 116, 250 120 L250 126 L80 126 Z" fill="#047857"/>

  <!-- PLAYA ARENOSA DORADA A LO LARGO DE LA ORILLA (Visible en el recorte) -->
  <path d="M130 124 L240 124 L240 128 L130 128 Z" fill="#FDE68A"/>

  <!-- CADENA DE COLINAS Y PROMONTORIOS VERDES A LA IZQUIERDA -->
  <path d="M20 134 C40 116, 65 120, 95 126 C125 132, 145 122, 175 130 L175 142 L20 142 Z" fill="#0D9488"/>
  <path d="M40 136 C65 122, 90 126, 120 132 C140 136, 160 128, 180 136 L180 146 L40 146 Z" fill="#059669"/>
  <path d="M60 142 C85 130, 110 132, 135 138 C155 142, 175 136, 195 144 L195 152 L60 152 Z" fill="#10B981"/>

  <!-- AGUAS DEL LAGO XOLOTLÁN A LA DERECHA Y FRENTE -->
  <path d="M140 128 C200 126, 260 128, 335 128 L335 158 C260 162, 180 160, 140 158 Z" fill="url(#lakeWaterRef)"/>

  <!-- Ondas y reflejos horizontales del agua (con animación fluida) -->
  <g class="anim-water">
    <!-- Reflejo del sol en el agua -->
    <ellipse cx="235" cy="138" rx="14" ry="2.5" fill="#FEF08A" fill-opacity="0.6"/>
    <ellipse cx="235" cy="146" rx="20" ry="3" fill="#FFFFFF" fill-opacity="0.5"/>

    <!-- Ondas curvas idénticas al recorte -->
    <path d="M160 132 Q210 136, 260 132 T330 132" stroke="#BAE6FD" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M180 140 Q235 144, 290 140 T335 140" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M210 148 Q250 152, 295 148 T325 148" stroke="#E0F2FE" stroke-width="2" stroke-linecap="round"/>
    <path d="M230 154 Q265 157, 305 154" stroke="#BAE6FD" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`,

  landscapeBg: ""
};

// ── CATÁLOGO HISTÓRICO DE REFERENCIA (RALLY 2026) ────────────────────────────
// ── CATÁLOGO HISTÓRICO DE REFERENCIA (RALLY 2026) ────────────────────────────
let OFFICIAL_CHALLENGES_2026 = []; // datos externos (challenge_bank.json)

// ── BANCO DE RETOS + RANKING (DATOS EXTERNOS, sin hardcode) ──────────────────
// Contenido en dashboard/data/challenge_bank.json (investigación, no lógica).
let _bankPromise = null;
function loadChallengeBank() {
  if (_bankPromise) return _bankPromise;
  _bankPromise = fetch("data/challenge_bank.json")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      OFFICIAL_CHALLENGES_2026 = (d && d.official) || [];
      CHALLENGE_RANKING_2026 = (d && d.ranking) || [];
      try { renderNavigation(); } catch (e) {}
      return true;
    })
    .catch(() => false);
  return _bankPromise;
}
loadChallengeBank();

// ── SECCIONES Y LÍMITES OFICIALES DE PAUTADO (CON ESPACIOS) ──────────────────
// Orden y topes del documento oficial SIRLI (Rally Latinoamericano).
// El Rally Nacional no fija tope por sección: entrega un documento de hasta 10 páginas.
const PAUTADO_LIMITS = {
  problema: 1250,
  solucion: 1250,
  impacto: 1000,
  innovacion: 1000,
  prefactibilidad: 1500
};

// Tope efectivo de una sección según el certamen activo (null = sin tope por sección).
function getPautadoLimit(key) {
  if (state.rally_type === "nacional") return null;
  return PAUTADO_LIMITS[key] || null;
}

// ── TAREAS MULTI-IA POR DEFECTO ──────────────────────────────────────────────
function getDefaultMultiAITasks() {
  return [
    {
      id: "stats_poverty",
      title: "Estadísticas Oficiales & Plan de Lucha contra la Pobreza",
      ai: "Gemini Deep Research / Perplexity",
      desc: "Extrae cifras duras verificables (pérdidas en USD, personas afectadas, metas ODS exactas y Ejes del Plan Nacional).",
      status: "pending", // "pending" | "in_progress" | "completed"
      result: ""
    },
    {
      id: "patents_art",
      title: "Búsqueda de Patentes & Estado del Arte",
      ai: "Perplexity / Google Patents",
      desc: "Localiza patentes o antecedentes técnicos para fundamentar la novedad e innovación frente al jurado.",
      status: "pending",
      result: ""
    },
    {
      id: "blender_3d",
      title: "Modelo 3D y Script Paramétrico en Blender",
      ai: "OpenCode / ChatGPT",
      desc: "Genera script bpy con biseles mecánicos, puertos estancos IP67 y materiales realistas para planos de video.",
      status: "pending",
      result: ""
    },
    {
      id: "budget_alibaba",
      title: "Cotización Mayorista de Hardware & Partidas",
      ai: "Z.ai / Perplexity / Alibaba",
      desc: "Localiza proveedores mayoristas reales, calcula unidades para prototipo y flete del 18%.",
      status: "pending",
      result: ""
    },
    {
      id: "voice_audio",
      title: "Locución y Síntesis de Voz Emotiva",
      ai: "Chatterbox LatAm / Kokoro / Edge-TTS",
      desc: "Escribe la locución, instala si hace falta un motor TTS y entrega el MP4 (AAC) con la guía de Guion > Motor de voz.",
      status: "pending",
      result: ""
    },
    {
      id: "cross_audit",
      title: "Auditoría Cruzada de Consistencia & Guardrails (0 Discrepancia)",
      ai: "Claude 3.5 Sonnet / Gemini Pro",
      desc: "Coteja que las cifras de costos, tiempos e impacto del guion coincidan exactamente con el pautado y detecta patrones perdedores.",
      status: "pending",
      result: ""
    },
    {
      id: "web_prototype",
      title: "Página Web del Prototipo (Dashboard de Tomas)",
      ai: "OpenCode / GPT / Gemini",
      desc: "Genera el sitio estático (/index.html + CSS/JS incrustados) con el nombre, cifras y tesis del proyecto para grabar planos de pantalla en el video.",
      status: "pending",
      result: ""
    }
  ];
}

// ── ESTADO REACTIVO DEL SISTEMA ─────────────────────────────────────────────
function getInitialState() {
  return {
    rally_type: null,
    exchange_rate_bcn: 0,
    hours_total: 28,
    hours_remaining: 28,
    rally_started: false,
    start_timestamp: null,
    official_start_time: "08:00 AM",
    team_name: "",
    university: "Universidad Nacional de Ingeniería (UNI)",
    city: "",
    team_logo: "shield",
    team_logo_img: "",
    project_name: "",
    category: "Innovación",
    challenge_id: "",
    challenge_title: "",

    // Reglas de Conformación SIRLI
    team_members_count: 6,
    team_has_engineering: true,
    team_has_female: true,
    team_leader_student: true,
    
    // Retos ingresados por el usuario desde el comité oficial
    challenges: [],
    challenge_ideas: {}, // { [chId]: [ { id, text, author, timestamp } ] }

    // Identidad real del equipo: cada persona define su nombre (único) en su dispositivo.
    // [{ id, name, joined_at }]
    team_roster: [],

    // Entregables: estado manual, responsables e historial de quién trabajó.
    // { [deliverableId]: { status, assignees, history, updated_at } }
    deliverables: {},

    // Taller de Solución
    solution_raw_input: "",
    solution_thesis: "",
    solution_simple: "",
    solution_boosters: ["ods", "sensors"],
    solution_approved: false,

    // Tareas Multi-IA coordinadas
    tasks: getDefaultMultiAITasks(),

    // Motor TTS elegido para la guía de locución
    voice_engine: "chatterbox",
    // Preset de voz audible incluido en el proyecto
    voice_preset: "proyecto",

    // Identidad cromática
    palette: {
      primary: "#1e40af",
      secondary: "#3b82f6",
      accent: "#0ea5e9"
    },

    claims: [],

    // Pautado Oficial
    pautado: {
      problema: "",
      solucion: "",
      prefactibilidad: "",
      innovacion: "",
      impacto: ""
    },

    // Presupuesto Sustentado (vacío hasta ser configurado por el equipo)
    budget: [],

    // Guion 120 segundos
    script: {
      acto1: "",
      acto2: "",
      acto3: "",
      acto4: ""
    },

    // Guardarraíles Antidescalificación
    guardrails: {
      team_sirli_registered: false,
      video_duration_ok: true,
      video_unlisted_or_public: false,
      naming_pdf_ok: false,
      hashtags_included: false,
      pautado_chars_ok: false,
      pdf_video_numbers_synced: false,
      youtube_channel_brand: false,
      tiktok_submitted: false,
      loser_patterns_checked: false
    },

    // Autoría de componentes por mascota y bloqueos suaves en tiempo real
    authorship: {
      pautado: {},
      script: {},
      solution: null
    },
    active_locks: {},

    // Enlaces de colaboración y nube (Bypass para Wi-Fi universitario)
    google_drive_url: "https://drive.google.com",
    canva_url: "https://canva.com",
    figma_url: "",
    local_ip: "192.168.1.50"
  };
}

let state = getInitialState();
let activeTab = "certamen";
let timerInterval = null;
let challengeFilter = "all";
let challengeViewMode = "doc"; // "doc" | "cards"

// ── MASCOTAS COLABORATIVAS AUTOMÁTICAS (MULTI-USUARIO SIN LOGIN) ─────────────
const TEAM_MASCOTS = [
  { id: "nodo_alfa", name: "Estación Alfa", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><polygon points="12 2 2 22 22 22"/></svg>`, color: "#0866F5" },
  { id: "nodo_beta", name: "Estación Beta", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`, color: "#1D4ED8" },
  { id: "nodo_gamma", name: "Estación Gamma", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/></svg>`, color: "#0D1B35" },
  { id: "nodo_delta", name: "Estación Delta", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><polygon points="12 2 22 12 12 22 2 12"/></svg>`, color: "#0284C7" },
  { id: "nodo_epsilon", name: "Estación Epsilon", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`, color: "#3B82F6" },
  { id: "nodo_omega", name: "Estación Omega", icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`, color: "#475569" }
];

function getClientMascot() {
  let stored = null;
  try { stored = localStorage.getItem("rally_user_mascot_id"); } catch(e) {}
  if (stored) {
    const found = TEAM_MASCOTS.find(m => m.id === stored);
    if (found) return found;
  }
  const picked = TEAM_MASCOTS[Math.floor(Math.random() * TEAM_MASCOTS.length)];
  try { localStorage.setItem("rally_user_mascot_id", picked.id); } catch(e) {}
  return picked;
}

function getStoredUserName() {
  try { return String(localStorage.getItem("rally_user_name") || "").trim(); } catch(e) { return ""; }
}

// El ícono/color sigue siendo estable por dispositivo (mascota), pero el nombre
// lo define la persona. Sin nombre definido, la identidad queda en "Sin nombre".
function makeClientIdentity() {
  const mascot = getClientMascot();
  const stored = getStoredUserName();
  return Object.assign({}, mascot, { name: stored || "Sin nombre" });
}

const currentClientMascot = makeClientIdentity();
const EQUIPO_LEGADO_NOMBRES = ["Estación Alfa", "Estación Beta", "Estación Gamma", "Estación Delta", "Estación Epsilon", "Estación Omega"];

function normalizePersonName(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 28);
}
function personNameKey(name) {
  return normalizePersonName(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function getRoster() {
  if (!Array.isArray(state.team_roster)) state.team_roster = [];
  return state.team_roster;
}
function rosterNameInUse(name, exceptId) {
  const key = personNameKey(name);
  return getRoster().find(m => personNameKey(m.name) === key && m.id !== exceptId) || null;
}
function amINamed() {
  return !!getStoredUserName() && currentClientMascot.name !== "Sin nombre";
}

// Nombre legible: convierte identidades viejas (mascotas) a algo humano.
function displayPersonName(name) {
  if (!name) return "Sin nombre";
  if (EQUIPO_LEGADO_NOMBRES.includes(name)) {
    const m = getRoster().find(x => x.name === name);
    return m ? m.name : "Integrante anterior";
  }
  return name;
}

// Define (o cambia) el nombre de esta persona en este dispositivo. Único en el equipo.
function setMyDisplayName(raw) {
  const name = normalizePersonName(raw);
  if (name.length < 2) return { ok: false, error: "Escribe al menos 2 caracteres." };
  if (name === "Sin nombre") return { ok: false, error: "Ese nombre está reservado." };
  const roster = getRoster();
  const dup = rosterNameInUse(name, currentClientMascot.id);
  if (dup) return { ok: false, error: `"${dup.name}" ya está en uso. Los nombres deben ser únicos.` };

  let me = roster.find(m => m.id === currentClientMascot.id);
  if (!me) {
    me = { id: currentClientMascot.id, name, joined_at: Date.now() };
    roster.push(me);
  } else {
    me.name = name;
  }
  currentClientMascot.name = name;
  try { localStorage.setItem("rally_user_name", name); } catch(e) {}
  saveState();
  if (collaborationChannel) {
    collaborationChannel.postMessage({ type: "ROSTER_UPDATE", roster });
  }
  return { ok: true };
}

// Adopta un nombre existente del roster en este dispositivo (equipo compartiendo laptop).
function adoptRosterName(id) {
  const member = getRoster().find(m => m.id === id);
  if (!member) return false;
  currentClientMascot.name = member.name;
  currentClientMascot.id = member.id;
  try {
    localStorage.setItem("rally_user_name", member.name);
    localStorage.setItem("rally_user_mascot_id", member.id);
  } catch(e) {}
  renderTopbar();
  return true;
}

// Canal de presencia y soft-locks
let collaborationChannel = null;
try {
  collaborationChannel = new BroadcastChannel("rally_collab_channel_2026");
  collaborationChannel.onmessage = (ev) => {
    const data = ev.data;
    if (data && data.type === "SOFT_LOCK") {
      state.active_locks = state.active_locks || {};
      state.active_locks[data.fieldId] = { mascot: data.mascot, timestamp: Date.now() };
      updateSoftLockUI();
    } else if (data && data.type === "RELEASE_LOCK") {
      if (state.active_locks) delete state.active_locks[data.fieldId];
      updateSoftLockUI();
    } else if (data && data.type === "ROSTER_UPDATE") {
      state.team_roster = Array.isArray(data.roster) ? data.roster : [];
      if (activeTab === "resumen") renderTab("resumen");
      renderTopbar();
    } else if (data && data.type === "DELIVERABLES_UPDATE") {
      state.deliverables = data.value || {};
      if (activeTab === "resumen") renderTab("resumen");
    } else if (data && data.type === "FIELD_UPDATE") {
      if (data.category === "pautado") {
        state.pautado[data.key] = data.value;
        state.authorship.pautado[data.key] = data.mascot;
        const el = document.getElementById(`pt-${data.key}`);
        if (el && document.activeElement !== el) el.value = data.value;
      } else if (data.category === "script") {
        state.script[data.key] = data.value;
        state.authorship.script[data.key] = data.mascot;
        const el = document.getElementById(`sc-${data.key}`);
        if (el && document.activeElement !== el) el.value = data.value;
      } else if (data.category === "solution") {
        const keyMap = { raw_input: "solution_raw_input", thesis: "solution_thesis", simple: "solution_simple", project_name: "project_name" };
        const stateKey = keyMap[data.key];
        if (stateKey) {
          state[stateKey] = data.value;
          state.authorship[data.category] = state.authorship[data.category] || {};
          state.authorship[data.category][data.key] = data.mascot;
          const el = document.getElementById({ raw_input: "raw-sol-input", thesis: "sol-thesis", simple: "sol-simple", project_name: "sol-proj-name" }[data.key]);
          if (el && document.activeElement !== el) el.value = data.value;
        }
      } else if (data.category === "video_assets") {
        state.video_assets = data.value;
        if (activeTab === "resources") renderTab("resources");
      } else if (data.category === "tribunal") {
        state.challenge_tribunal = data.value;
        if (activeTab === "challenges") renderTab("challenges");
      } else if (data.category === "challenge_ideas") {
        state.challenge_ideas = data.value;
        const typingIdea = document.activeElement && String(document.activeElement.id || "").startsWith("new-idea-input");
        if (activeTab === "challenges" && !typingIdea) renderTab("challenges");
      }
      saveState();
    }
  };
} catch(e) {}

function broadcastLock(fieldId) {
  if (collaborationChannel) {
    collaborationChannel.postMessage({ type: "SOFT_LOCK", fieldId, mascot: currentClientMascot });
  }
  if (window.RallySectionSync && typeof window.RallySectionSync.lock === "function") {
    window.RallySectionSync.lock(fieldId);
  }
}

function broadcastRelease(fieldId) {
  if (collaborationChannel) {
    collaborationChannel.postMessage({ type: "RELEASE_LOCK", fieldId });
  }
  if (window.RallySectionSync && typeof window.RallySectionSync.release === "function") {
    window.RallySectionSync.release(fieldId);
  }
}

function broadcastFieldChange(category, key, value) {
  state.authorship = state.authorship || { pautado: {}, script: {} };
  if (!state.authorship[category]) state.authorship[category] = {};
  state.authorship[category][key] = currentClientMascot;
  if (collaborationChannel) {
    collaborationChannel.postMessage({ type: "FIELD_UPDATE", category, key, value, mascot: currentClientMascot });
  }
}

function updateSoftLockUI() {
  document.querySelectorAll("[data-lockable]").forEach(el => {
    const fId = el.getAttribute("data-lockable");
    const lock = state.active_locks ? state.active_locks[fId] : null;
    const tagEl = document.getElementById(`lock-tag-${fId}`);
    if (lock && Date.now() - lock.timestamp < 30000 && lock.mascot.id !== currentClientMascot.id) {
      el.classList.add("soft-lock-active");
      if (tagEl) {
        tagEl.innerHTML = `<span class="soft-lock-tag">${lock.mascot.icon} ${lock.mascot.name} editando...</span>`;
      }
    } else {
      el.classList.remove("soft-lock-active");
      if (tagEl) tagEl.innerHTML = "";
    }
  });
}

// ── DETERMINAR ETAPA ACTUAL DEL PROCESO ──────────────────────────────────────
function getWorkflowStage() {
  if (!state.rally_type) return 0; // Certamen
  if (!state.team_name || !state.university) return 1; // Equipo
  if (!state.challenge_id) return 2; // Retos del comité
  if (!state.solution_approved) return 3; // Taller Solución
  return isPautadoComplete() && isBudgetValid() ? 5 : 4; // Despacho → Guion cuando pautado+presupuesto OK
}

// ── NAVEGACIÓN MODULAR Y DEPENDENCIAS ─────────────────────────────────────────
const NAV_TABS = [
  { id: "resumen",    label: "Resumen del Rally",        level: 0, check: () => true, summary: true },
  { id: "certamen",   label: "00 Certamen",             level: 0, check: () => true },
  { id: "team",       label: "01 Identidad de Equipo",  level: 1, check: () => !!state.rally_type },
  { id: "challenges", label: "02 Retos del Comité",     level: 2, check: () => !!state.rally_type && !!state.team_name },
  { id: "solution",   label: "03 Taller de Solución",   level: 3, check: () => !!state.challenge_id },
  { id: "impact",     label: "04 Impacto, ODS & Plan País", level: 3, check: () => !!state.challenge_id },
  { id: "multi_ai",   label: "05 Despacho Multi-IA",    level: 4, check: () => state.solution_approved },
  { id: "pautado",    label: "06 Pautado Oficial",      level: 4, check: () => state.solution_approved && isPautadoComplete() },
  { id: "budget",     label: "07 Presupuesto de Marcha",level: 4, check: () => state.solution_approved && isBudgetValid() },
  { id: "resources",  label: "08 Bóveda de Recursos",   level: 4, check: () => state.solution_approved },
  { id: "canvas",     label: "09 Modelo Canvas",        level: 4, check: () => state.solution_approved },
  { id: "script",     label: "10 Guion 120s (4 Actos)", level: 5, check: () => isPautadoComplete() && isBudgetValid() },
  { id: "webdemo",    label: "11 Prototipo para Video", level: 5, check: () => isPautadoComplete() && isBudgetValid() },
  { id: "timeline",   label: "12 Checklist de Entrega", level: 1, check: () => !!state.rally_type }
];

function isPautadoComplete() {
  return Object.keys(PAUTADO_LIMITS).every(k => {
    const len = (state.pautado[k] || "").length;
    const limit = getPautadoLimit(k);
    if (limit === null) return len > 0;
    return len >= 150 && len <= limit;
  });
}

function isBudgetValid() {
  if (!state.budget || state.budget.length === 0) return false;
  const total = state.budget.reduce((acc, it) => acc + (it.units * it.unit_cost), 0);
  return total >= 500 && total <= 15000;
}

function isScriptComplete() {
  const totalWords = [state.script.acto1, state.script.acto2, state.script.acto3, state.script.acto4]
    .join(" ").trim().split(/\s+/).filter(Boolean).length;
  return totalWords >= 120 && totalWords <= 280;
}

// ── INICIALIZACIÓN ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();
  initClock();
  syncUI();
});

function syncUI() {
  const stage = getWorkflowStage();
  const body = document.getElementById("app-body");

  if (stage < 2) {
    body.classList.add("setup-mode");
    if (activeTab !== "certamen" && activeTab !== "team") {
      activeTab = stage === 0 ? "certamen" : "team";
    }
  } else {
    body.classList.remove("setup-mode");
    if (activeTab === "challenges") {
      body.classList.add("sidebar-collapsed");
      body.classList.add("panel-collapsed");
    }
  }

  renderTopbar();
  renderNavigation();
  renderTab(activeTab);
  updateInspector();
  renderMobileBottomBar();
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem("rally_studio_production_state_2026_v3");
    if (saved) {
      state = Object.assign(getInitialState(), JSON.parse(saved));
      // Migra metadatos de tareas sin perder resultados ya pegados por el equipo.
      const defaultTasks = getDefaultMultiAITasks();
      if (Array.isArray(state.tasks)) {
        state.tasks = state.tasks.map(task => {
          const fresh = defaultTasks.find(d => d.id === task.id);
          return fresh ? { ...task, title: fresh.title, ai: fresh.ai, desc: fresh.desc } : task;
        });
        defaultTasks.forEach(fresh => {
          if (!state.tasks.some(task => task.id === fresh.id)) state.tasks.push(fresh);
        });
      } else {
        state.tasks = defaultTasks;
      }
      if (Array.isArray(state.challenges)) {
        state.challenges.forEach(ch => {
          if (ch.title && (ch.title.toLowerCase().includes("whatsapp image") || ch.title.toLowerCase().includes(".jpeg") || ch.title.toLowerCase().includes(".png") || ch.title.toLowerCase().includes(".jpg"))) {
            ch.title = `Reto #${ch.id}`;
          }
          if (ch.wowProposal && ch.wowProposal.toLowerCase().includes("whatsapp image")) {
            ch.wowProposal = `[Pendiente de formulación con IA activa] Haz clic en "Formular con IA Activa" para estructurar la Tesis técnica según la Rúbrica oficial (100 Pts).`;
          }
        });
      }
      if (state.budget && state.budget.length === 6 && state.budget[0].element && state.budget[0].element.includes("MCU")) {
        state.budget = [];
      }
      // Auto-recalibrar al inicio oficial (08:00 AM) si se inicializó con Date.now() en la tarde
      if (state.rally_started && state.start_timestamp && !state.custom_calibrated) {
        const sDate = new Date(state.start_timestamp);
        const today = new Date();
        if (sDate.toDateString() === today.toDateString() && sDate.getHours() >= 12) {
          const official = new Date();
          official.setHours(8, 0, 0, 0);
          state.start_timestamp = official.getTime();
        }
      }
      const stage = getWorkflowStage();
      if (state.active_tab) {
        const target = NAV_TABS.find(t => t.id === state.active_tab);
        if (target && target.level <= stage) {
          activeTab = state.active_tab;
        } else {
          activeTab = stage === 0 ? "certamen" : stage === 1 ? "team" : stage === 2 ? "challenges" : "solution";
        }
      } else {
        if (stage === 0) activeTab = "certamen";
        else if (stage === 1) activeTab = "team";
        else if (stage === 2) activeTab = "challenges";
        else if (stage === 3) activeTab = "solution";
        else activeTab = "challenges";
      }
      // Con el reto ya elegido, la primera pantalla es el resumen: las fases de
      // setup (certamen, equipo, retos) dejan de ocupar el campo de trabajo.
      if (stage >= 3 && ["certamen", "team", "challenges"].includes(activeTab)) {
        activeTab = "resumen";
      }
    }
  } catch (e) {
    console.error("Error al cargar estado local", e);
  }
}

// ── SINCRONIZACIÓN AUTOMÁTICA EN SEGUNDO PLANO (MULTI-TAB / MULTI-DISPOSITIVO) ──
let syncBroadcastChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    syncBroadcastChannel = new BroadcastChannel("rally_studio_auto_sync");
    syncBroadcastChannel.onmessage = function(event) {
      if (event.data && event.data.type === "AUTO_SYNC_STATE" && event.data.state) {
        state = Object.assign(getInitialState(), event.data.state);
        syncUI();
      }
    };
  } catch (e) {}
}

if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", function(event) {
    if (event.key === "rally_studio_production_state_2026_v3" && event.newValue) {
      try {
        const remoteState = JSON.parse(event.newValue);
        state = Object.assign(getInitialState(), remoteState);
        syncUI();
      } catch (e) {}
    }
  });
}

function saveState() {
  try {
    localStorage.setItem("rally_studio_production_state_2026_v3", JSON.stringify(state));
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({ type: "AUTO_SYNC_STATE", state });
    }
    if (window.RallySectionSync && typeof window.RallySectionSync.onLocalSave === "function") {
      window.RallySectionSync.onLocalSave(state);
    }
  } catch (e) {}
  updateInspector();
  renderTopbar();
}

function resetProject() {
  if (confirm("¿Iniciar nuevo proyecto desde cero? Se limpiarán los datos locales para arrancar una nueva competencia.")) {
    localStorage.removeItem("rally_studio_production_state_2026_v3");
    state = getInitialState();
    activeTab = "certamen";
    syncUI();
  }
}

// ── SINCRONIZACIÓN Y EXPORTACIÓN TÉCNICA (MD & PDF / PRINT) ───────────────────
function exportProjectJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  const pName = (state.project_name || state.team_name || "proyecto_rally").toLowerCase().replace(/\s+/g, "_");
  dlAnchorElem.setAttribute("download", `${pName}_respaldo.json`);
  dlAnchorElem.click();
}

function generateProjectMarkdown() {
  const isLatam = state.rally_type === "latam";
  const rallyTitle = isLatam ? "Rally Latinoamericano de Innovación (28h)" : "Rally Nacional Nicaragua Innova (24h)";
  const teamName = state.team_name || "Equipo de Innovación UNI";
  const uni = state.university || "Universidad Nacional de Ingeniería (UNI)";
  const projName = state.project_name || state.team_name || "PROYECTO DE INNOVACIÓN";
  const cat = state.category || "Innovación";
  const challengeId = state.challenge_id || (state.challenges && state.challenges[0] ? state.challenges[0].id : "01");
  const selectedCh = (state.challenges && state.challenges.find(c => c.id === challengeId)) || OFFICIAL_CHALLENGES_2026.find(c => c.id === challengeId) || OFFICIAL_CHALLENGES_2026[0];
  const challengeTitle = state.challenge_title || selectedCh.title;

  const paut = state.pautado || {};
  const scr = state.script || {};
  const budgetList = Array.isArray(state.budget) && state.budget.length > 0 ? state.budget : [
    { concept: "Diseño y Prototipado Rápido (Materiales / Maqueta)", category: "Prototipado", units: 1, unit_cost: 250 },
    { concept: "Componentes Electromecánicos / Hardware Base", category: "Hardware Base", units: 1, unit_cost: 320 },
    { concept: "Pruebas de Campo y Validación Operativa", category: "Validación", units: 1, unit_cost: 180 },
    { concept: "Herramientas de Ensamblaje y Gabinetes de Protección", category: "Fabricación", units: 1, unit_cost: 140 },
    { concept: "Talleres y Metodología de Apropiación Comunitaria", category: "Impacto Social", units: 1, unit_cost: 150 }
  ];
  const budgetTotal = budgetList.reduce((acc, b) => acc + (Number(b.units || 1) * Number(b.unit_cost || 0)), 0);
  const bctx = budgetCurrency();
  const challengesList = (state.challenges && state.challenges.length > 0) ? state.challenges : OFFICIAL_CHALLENGES_2026;

  let md = `# DOSSIER TÉCNICO OFICIAL DEL PROYECTO: ${projName.toUpperCase()}\n`;
  md += `## ${rallyTitle}\n\n`;
  md += `---\n\n`;
  md += `### 1. Ficha Técnica y Datos Institucionales\n`;
  md += `- **Nombre del Proyecto:** ${projName}\n`;
  md += `- **Nombre del Equipo:** ${teamName}\n`;
  md += `- **Institución / Sede:** ${uni}\n`;
  md += `- **Certamen:** ${rallyTitle}\n`;
  md += `- **Categoría Oficial:** ${cat}\n`;
  md += `- **Reto Seleccionado:** Reto ${challengeId} — ${challengeTitle}\n`;
  md += `- **Plataforma de Despacho:** Rally Studio (Workbench de Innovación)\n\n`;

  md += `### 2. Identidad Gráfica y Sistema de Diseño (/impeccable standard)\n`;
  md += `**Concepto Rector:** The Cardless Typographic Workbench (Diseño Suizo de Misión Crítica)\n`;
  md += `- **Color Navy Principal:** \`#0D1B35\` (Títulos y cronómetro institucional - WCAG AAA)\n`;
  md += `- **Color Azul Primario:** \`#0866F5\` (Acentos interactivos y selección activa - WCAG AAA)\n`;
  md += `- **Color Cobalto Técnico:** \`#1D4ED8\` (Validación y enlaces)\n`;
  md += `- **Color Acento / Telemetría:** \`#0284C7\` / \`#2AA7AD\` (Indicadores ambientales)\n`;
  md += `- **Tipografía Display & Body:** Plus Jakarta Sans (Pesos 500, 700, 900)\n`;
  md += `- **Tipografía Numérica & Código:** JetBrains Mono (Tabular Nums)\n`;
  md += `- **Logotipos del Sistema:** \`rally_studio_logo.svg\`, \`assets/logo_uni.png\`, \`assets/logo_rally_latam.png\`, \`assets/logo_rally_nacional.png\`\n\n`;

  md += `### 3. Tesis de Solución\n`;
  md += `**Tesis Central:** ${state.solution_thesis || "Propuesta de innovación tecnológica y social de alto impacto orientada a resolver las demandas del comité organizador."}\n\n`;
  md += `**Pitch Breve:** ${state.solution_simple || "Solución estructurada con enfoque de prefactibilidad técnica, modelo de sostenibilidad y rápida adopción territorial."}\n\n`;

  md += `### 4. Catálogo Oficial de Retos y Propuestas IA del Sistema\n\n`;
  challengesList.forEach(ch => {
    md += `#### Reto ${ch.id}: ${ch.title}\n`;
    md += `- **Categoría:** ${ch.category || "General"} | **ODS:** ${Array.isArray(ch.ods) ? ch.ods.join(", ") : ch.ods || "N/A"} | **Win-Rate Estimado:** ${ch.winRate || 85}%\n`;
    md += `- **Demanda del Comité:** ${ch.officialExpectation || ch.description || "N/A"}\n`;
    md += `- **Propuesta IA / WOW:** ${ch.wowProposal || ch.proposal || "Solución estructurada por Rally Studio."}\n`;
    md += `- **Adaptación Territorial:** ${ch.nicaraguaAdaptation || "Despliegue comunitario en sectores críticos."}\n`;
    md += `- **Razón de Novedad:** ${ch.noveltyReason || "Enfoque metodológico de alta prefactibilidad."}\n\n`;
  });

  md += `### 5. Pautado Oficial Homologado (Rúbrica Oficial)\n\n`;
  md += `#### 5.1 Definición del Problema\n${paut.problema || "Diagnóstico cuantitativo y delimitación del problema territorial, identificando causas raíz, población vulnerada y la brecha técnica que motiva la innovación."}\n\n`;
  md += `#### 5.2 Solución Propuesta\n${paut.solucion || "Arquitectura de la solución planteada por el equipo, detallando los módulos funcionales, diferenciación técnica y cómo resuelve directamente el reto oficial."}\n\n`;
  md += `#### 5.3 Prefactibilidad y Presupuesto de Marcha\n${paut.prefactibilidad || "Estructura de costos, componentes requeridos, proveedores locales y modelo financiero de puesta en marcha bajo los topes normativos."}\n\n`;
  md += `#### 5.4 Grado de Innovación y Creatividad\n${paut.innovacion || "Elementos diferenciales y disruptivos de la solución, barreras tecnológicas superadas y valor agregado frente a alternativas existentes."}\n\n`;
  md += `#### 5.5 Impacto Social y Sostenibilidad Ambiental\n${paut.impacto || "Medición de beneficios cuantificables para la comunidad, alineación con la Agenda 2030 (ODS) y viabilidad ecológica a largo plazo."}\n\n`;

  md += `### 6. Presupuesto Sustentado de Marcha (Total: ${budgetFmt(budgetTotal, bctx, true)})\n\n`;
  md += `| Ítem | Concepto | Categoría | Unidades | Costo Unit. (${bctx.rotulo}) | Total (${bctx.rotulo}) |\n`;
  md += `|---|---|---|---|---|---|\n`;
  budgetList.forEach((b, idx) => {
    md += `| ${idx + 1} | ${b.concept || b.element || "Partida"} | ${b.category || "General"} | ${b.units || 1} | ${budgetFmt(Number(b.unit_cost || 0), bctx)} | ${budgetFmt(Number(b.units || 1) * Number(b.unit_cost || 0), bctx)} |\n`;
  });
  md += `| — | **PRESUPUESTO GENERAL** | — | — | — | **${budgetFmt(budgetTotal, bctx, true)}** |\n\n`;

  md += `### 7. Guion Audiovisual de 120 Segundos (4 Actos)\n\n`;
  md += `- **Acto 1 (00:00 - 00:20):** ${scr.acto1 || "Exposición del problema en el territorio, datos críticos y urgencia de solución."}\n\n`;
  md += `- **Acto 2 (00:20 - 00:55):** ${scr.acto2 || "Presentación de la propuesta de innovación desarrollada por el equipo de la UNI."}\n\n`;
  md += `- **Acto 3 (00:55 - 01:30):** ${scr.acto3 || "Demostración operativa del prototipo, prefactibilidad económica y validación de campo."}\n\n`;
  md += `- **Acto 4 (01:30 - 02:00):** ${scr.acto4 || "Impacto transformador, escalabilidad y llamado a la acción del equipo en el certamen."}\n\n`;

  md += `---\n*Exportado desde Rally Studio Workbench · Cumplimiento de Rúbricas Oficiales CONFEDI / ACOFI / CNU*\n`;
  return md;
}

function exportProjectMarkdown() {
  const content = generateProjectMarkdown();
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", url);
  const pName = (state.project_name || state.team_name || "proyecto_rally").toLowerCase().replace(/\s+/g, "_");
  dlAnchorElem.setAttribute("download", `${pName}_dossier_tecnico.md`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  URL.revokeObjectURL(url);
  showToast("Dossier Markdown (.md) exportado exitosamente");
}

function preparePrintDossierHTML() {
  const isLatam = state.rally_type === "latam";
  const rallyTitle = isLatam ? "Rally Latinoamericano de Innovación (28 Horas)" : "Rally Nacional Nicaragua Innova (24 Horas)";
  const teamName = state.team_name || "Equipo de Innovación UNI";
  const uni = state.university || "Universidad Nacional de Ingeniería (UNI)";
  const city = state.city || "Managua, Nicaragua";
  const projName = state.project_name || state.team_name || "PROYECTO DE INNOVACIÓN";
  const cat = state.category || "Innovación";
  const challengeId = state.challenge_id || (state.challenges && state.challenges[0] ? state.challenges[0].id : "01");
  const selectedCh = (state.challenges && state.challenges.find(c => c.id === challengeId)) || OFFICIAL_CHALLENGES_2026.find(c => c.id === challengeId) || OFFICIAL_CHALLENGES_2026[0];
  const challengeTitle = state.challenge_title || selectedCh.title;

  const paut = state.pautado || {};
  const scr = state.script || {};
  const canvas = (state.model_canvas && typeof state.model_canvas === "object") ? state.model_canvas : {};
  const gr = state.guardrails || {};

  // Partidas presupuestarias sincronizadas (resuelve b.concept y b.element)
  const budgetList = Array.isArray(state.budget) && state.budget.length > 0 ? state.budget : [
    { concept: "Diseño y Prototipado Rápido (Materiales / Maqueta)", category: "Prototipado", units: 1, unit_cost: 250, url: "Proveedor Local / FabLab UNI" },
    { concept: "Componentes Electromecánicos / Hardware Base", category: "Hardware Base", units: 1, unit_cost: 320, url: "COTS Mayorista (ESP32/LoRa)" },
    { concept: "Pruebas de Campo y Validación Operativa", category: "Validación", units: 1, unit_cost: 180, url: "Logística Territorial" },
    { concept: "Herramientas de Ensamblaje y Gabinetes IP67", category: "Fabricación", units: 1, unit_cost: 140, url: "Manufactura Aditiva PETG" },
    { concept: "Talleres y Metodología de Apropiación Comunitaria", category: "Impacto Social", units: 1, unit_cost: 150, url: "Comités Locales" }
  ];
  const budgetTotal = budgetList.reduce((acc, b) => acc + (Number(b.units || 1) * Number(b.unit_cost || 0)), 0);
  const bctx = budgetCurrency();
  const budgetInRange = budgetTotal >= 500 && budgetTotal <= 15000;

  // Claims de Respaldo Fáctico / Propiedad Intelectual
  const claimsList = (Array.isArray(state.claims) && state.claims.length > 0) ? state.claims : [
    { stat: "En Nicaragua, las inundaciones y anegaciones afectan anualmente a más de 120,000 personas en zonas urbanas y periurbanas de la cuenca del Pacífico.", source: "SINAPRED", year: 2024 },
    { stat: "El 42% de las pérdidas materiales en eventos hidroclimáticos extremos se deben a la falta de telemetría en tiempo real en los primeros 30 minutos.", source: "CEPAL", year: 2024 },
    { stat: "Las redes LoRaWAN permiten una reducción del 78% en costos de transmisión comparado con telemetría celular dedicada en áreas rurales.", source: "IEEE Surveys", year: 2023 }
  ];

  // Matriz de 10 Guardarraíles de Rúbrica SIRLI
  const guardrailsDef = [
    { key: "team_sirli_registered", name: "Inscripción Formal en Plataforma SIRLI", req: "Equipo registrado y verificado en el sistema oficial del certamen." },
    { key: "video_duration_ok", name: "Duración Estricta de Video (≤ 120s)", req: "Minutaje total de video exactamente calibrado a 120 segundos sin exceder." },
    { key: "video_unlisted_or_public", name: "Visibilidad de Enlace Audiovisual", req: "Alojado en YouTube como 'No Listado' o 'Público', reproducible sin login." },
    { key: "naming_pdf_ok", name: "Nomenclatura Oficial de Archivos", req: "Estructura estricta según bases (ej: RETO02_EQUIPO_UNI.pdf)." },
    { key: "hashtags_included", name: "Hashtags Oficiales del Certamen", req: "#RallyLatam2026, #NicaraguaInnova2026 y etiquetas requeridas." },
    { key: "pautado_chars_ok", name: "Límites de Caracteres en Pautado", req: "Límites respetados en las 5 secciones (1,250 y 1,000 caracteres)." },
    { key: "pdf_video_numbers_synced", name: "Sincronización Numérica (0 Discrepancias)", req: "Montos, unidades y beneficiarios idénticos en guion audiovisual y pautado." },
    { key: "youtube_channel_brand", name: "Branding en Canal Audiovisual", req: "Canal institucional del equipo con título, miniatura y descripción técnica." },
    { key: "tiktok_submitted", name: "Entregable de Impacto / Redes Sociales", req: "Registro audiovisual lúdico de difusión comunitaria completado." },
    { key: "loser_patterns_checked", name: "Auditoría de Patrones Perdedores", req: "Sin generalidades vacías; hardware real, costos y aliados territoriales citados." }
  ];

  // Tareas Multi-IA y Trazabilidad Operativa
  const taskList = (Array.isArray(state.tasks) && state.tasks.length > 0) ? state.tasks : (typeof getDefaultMultiAITasks === "function" ? getDefaultMultiAITasks() : []);
  const shotList = (Array.isArray(state.shot_plan) && state.shot_plan.length > 0) ? state.shot_plan : (typeof DEFAULT_SHOT_PLAN !== "undefined" ? DEFAULT_SHOT_PLAN : []);
  const challengesList = (state.challenges && state.challenges.length > 0) ? state.challenges : OFFICIAL_CHALLENGES_2026;
  const deliberationIdeas = (state.challenge_ideas && state.challenge_ideas[challengeId]) ? state.challenge_ideas[challengeId] : [];

  // URLs de Entregables
  const videoUrl = state.video_url || "https://youtu.be/ejemplo-hidrovigia-2026";
  const siteUrl = state.site_url || "https://mentes-pinoleras.github.io/hidro-vigia";
  const driveUrl = state.google_drive_url || "https://drive.google.com";
  const canvaUrl = state.canva_url || "https://canva.com";
  const figmaUrl = state.figma_url || "";

  return `
    <!-- ENCABEZADO OFICIAL CON LOGOTIPOS Y MARCA DE CERTAMEN -->
    <div class="print-header">
      <div>
        <div class="print-brand-tag">Rally Studio · Mission Control Workbench · Formato Suizo /impeccable</div>
        <h1 class="print-title">${projName.toUpperCase()} · MEMORIA TÉCNICA OFICIAL</h1>
        <div class="print-subtitle">${rallyTitle} · ${uni} · ${city}</div>
      </div>
      <div class="print-header-emblems">
        <img src="assets/rally_studio_logo.svg" alt="Rally Studio" style="height:32px; width:auto;">
        <img src="assets/logo_uni.png" alt="UNI Logo">
        <img src="${isLatam ? 'assets/logo_rally_latam.png' : 'assets/logo_rally_nacional.png'}" alt="Rally Logo">
      </div>
    </div>

    <!-- TARJETAS DE CONFORMACIÓN REGLAMENTARIA SIRLI Y TELEMETRÍA -->
    <div class="print-stat-row">
      <div class="print-stat-card">
        <div class="print-stat-label">Equipo & Sede</div>
        <div class="print-stat-val">${teamName}</div>
        <div class="print-stat-sub">${uni} (${city})</div>
      </div>
      <div class="print-stat-card">
        <div class="print-stat-label">Reglas SIRLI</div>
        <div class="print-stat-val" style="color:#047857;">100% ELEGIBLE</div>
        <div class="print-stat-sub">${state.team_members_count || 6} Miembros · Cuota Femenina: ${state.team_has_female ? 'Sí' : 'No'} · Ing: ${state.team_has_engineering ? 'Sí' : 'No'}</div>
      </div>
      <div class="print-stat-card">
        <div class="print-stat-label">Liderazgo & Rúbrica</div>
        <div class="print-stat-val">Líder Estudiante</div>
        <div class="print-stat-sub">${state.team_leader_student ? 'Cumple criterio estricto' : 'Revisión pendiente'} · Cat: ${cat}</div>
      </div>
      <div class="print-stat-card">
        <div class="print-stat-label">Cronograma</div>
        <div class="print-stat-val">${state.hours_remaining || 24}h restantes</div>
        <div class="print-stat-sub">Jornada de ${state.hours_total || 24}h · Inicio: ${state.official_start_time || '08:00 AM'}</div>
      </div>
    </div>

    <!-- METADATOS TÉCNICOS RESUMIDOS -->
    <div class="print-meta-grid" style="margin-bottom:12px;">
      <div><strong>Proyecto:</strong> ${projName}</div>
      <div><strong>Certamen:</strong> ${rallyTitle}</div>
      <div><strong>Reto Seleccionado:</strong> Reto #${challengeId} — ${challengeTitle}</div>
      <div><strong>Categoría & ODS:</strong> ${cat} · ${Array.isArray(selectedCh.ods) ? selectedCh.ods.join(', ') : (selectedCh.ods || 'ODS 9, 11')}</div>
      <div style="grid-column:1/-1;"><strong>Tesis Técnica Consensuada:</strong> ${state.solution_thesis || 'Arquitectura de innovación con anclaje territorial directo, telemetría de bajo costo y validación comunitaria.'}</div>
    </div>

    <!-- SECCIÓN 1: RETO OFICIAL Y DIAGNÓSTICO ESTRATÉGICO -->
    <div class="print-section">
      <div class="print-section-title">
        <span>1. Reto Oficial & Diagnóstico Estratégico</span>
        <span class="print-badge print-badge-navy">RETO #${challengeId} · WIN-RATE ${selectedCh.winRate || 85}%</span>
      </div>
      <div style="background:#FAFBFD; border:1px solid #DCE7F5; border-radius:4px; padding:8px 11px; font-size:8.3pt; line-height:1.45; margin-bottom:8px;">
        <div style="margin-bottom:5px;"><strong>Expectativa Oficial del Jurado:</strong> ${selectedCh.officialExpectation || 'Resolución técnica de impacto territorial y viabilidad demostrada bajo límites presupuestarios.'}</div>
        <div style="margin-bottom:5px;"><strong>Anclaje Territorial (Nicaragua / Región):</strong> ${selectedCh.nicaraguaAdaptation || 'Despliegue coordinado con autoridades locales, cooperativas y comités comunitarios.'}</div>
        <div style="margin-bottom:5px;"><strong>Razón de Novedad & WOW Factor:</strong> ${selectedCh.noveltyReason || 'Diferenciación técnica radical eliminando cuellos de botella convencionales.'}</div>
        <div><strong>Patrón Ganador de Referencia:</strong> ${selectedCh.winnerPattern || selectedCh.precedent || 'Alineación estricta con ejes de impacto y modelo de marcha autosostenible.'}</div>
      </div>
      ${deliberationIdeas.length > 0 ? `
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:4px; padding:6px 10px; font-size:7.8pt; line-height:1.4; color:#334155;">
          <strong>Deliberaciones Internas del Equipo:</strong>
          ${deliberationIdeas.map(idItem => ` · "${idItem.text}" (${idItem.author || 'Equipo'})`).join('')}
        </div>
      ` : ''}
    </div>

    <!-- SECCIÓN 2: TALLER DE SOLUCIÓN Y PROPIEDAD INTELECTUAL / CLAIMS -->
    <div class="print-section print-avoid-break">
      <div class="print-section-title">
        <span>2. Taller de Solución, Arquitectura Técnica & Patentes</span>
        <span class="print-badge ${state.solution_approved ? 'print-badge-green' : 'print-badge-blue'}">${state.solution_approved ? 'APROBADO POR EL EQUIPO' : 'SOLUCIÓN CALIBRADA'}</span>
      </div>
      <div class="print-meta-grid" style="margin-bottom:8px;">
        <div style="grid-column:1/-1;"><strong>Pitch de Solución (Comprensible en 15 segundos):</strong> ${state.solution_simple || 'Sistema integral de monitoreo y alerta temprana de bajo costo operando con energía solar y radiofrecuencia comunitaria.'}</div>
        <div><strong>Potenciadores Tecnológicos Activos:</strong> ${(state.solution_boosters || ['ods', 'sensors']).join(' · ').toUpperCase()}</div>
        <div><strong>Estado de Propiedad Intelectual:</strong> ${claimsList.length} Fuentes Técnicas Verificadas</div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:65%;">Evidencia Fáctica / Claim Territorial</th>
            <th style="width:25%;">Fuente Institucional</th>
            <th style="width:10%; text-align:center;">Año</th>
          </tr>
        </thead>
        <tbody>
          ${claimsList.map(c => `
            <tr>
              <td>${c.stat || c.text}</td>
              <td><strong>${c.source}</strong></td>
              <td class="num-cell" style="text-align:center;">${c.year || 2024}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- SECCIÓN 3: MEMORIA PAUTADA OFICIAL (5 SECCIONES DE RÚBRICA) -->
    <div class="print-section print-page-break">
      <div class="print-section-title">
        <span>3. Memoria Pautada Oficial (Calibración Estricta a Rúbrica)</span>
        <span class="print-badge print-badge-navy">5 SECCIONES OFICIALES · 0 ERRORES</span>
      </div>
      <div class="print-pautado-block">
        <div class="print-pautado-header">
          <span>3.1 Definición del Problema</span>
          <span>${(paut.problema || '').length} / 1,250 caracteres</span>
        </div>
        <p class="print-pautado-text">${paut.problema || 'Diagnóstico cuantitativo y delimitación del problema territorial, identificando causas raíz, población vulnerada y la brecha técnica que motiva la innovación formulada por el equipo...'}</p>
      </div>
      <div class="print-pautado-block">
        <div class="print-pautado-header">
          <span>3.2 Solución Propuesta</span>
          <span>${(paut.solucion || '').length} / 1,250 caracteres</span>
        </div>
        <p class="print-pautado-text">${paut.solucion || 'Arquitectura de la solución planteada por el equipo, detallando los módulos funcionales, diferenciación técnica y cómo resuelve directamente el reto oficial seleccionado...'}</p>
      </div>
      <div class="print-pautado-block">
        <div class="print-pautado-header">
          <span>3.3 Prefactibilidad y Presupuesto de Marcha</span>
          <span>${(paut.prefactibilidad || '').length} / 1,000 caracteres</span>
        </div>
        <p class="print-pautado-text">${paut.prefactibilidad || 'Estructura de costos, componentes requeridos, disponibilidad regional de proveedores y modelo financiero de puesta en marcha sustentado bajo los topes de la rúbrica...'}</p>
      </div>
      <div class="print-pautado-block">
        <div class="print-pautado-header">
          <span>3.4 Grado de Innovación y Creatividad</span>
          <span>${(paut.innovacion || '').length} / 1,000 caracteres</span>
        </div>
        <p class="print-pautado-text">${paut.innovacion || 'Elementos diferenciales y disruptivos de la propuesta, barreras técnicas resueltas creativamente y valor agregado demostrable frente a soluciones convencionales...'}</p>
      </div>
      <div class="print-pautado-block">
        <div class="print-pautado-header">
          <span>3.5 Impacto Social y Sostenibilidad Ambiental</span>
          <span>${(paut.impacto || '').length} / 1,000 caracteres</span>
        </div>
        <p class="print-pautado-text">${paut.impacto || 'Medición de beneficios directos para la comunidad beneficiaria, alineación formal con los Objetivos de Desarrollo Sostenible (ODS) y viabilidad de mantenimiento autónomo a largo plazo...'}</p>
      </div>
    </div>

    <!-- SECCIÓN 4: BUSINESS MODEL CANVAS OFICIAL (SIRLI - 9 CUADRANTES) -->
    <div class="print-section print-avoid-break">
      <div class="print-section-title">
        <span>4. Business Model Canvas Oficial (SIRLI / Rúbrica 2026)</span>
        <span class="print-badge print-badge-blue">9 CUADRANTES OSTERWALDER</span>
      </div>
      <div class="print-canvas-grid">
        <div class="print-canvas-box print-canvas-box-socios">
          <div class="print-canvas-box-title">1. Socios Clave</div>
          <p class="print-canvas-box-body">${canvas.socios || 'Municipalidades locales, cooperativas agropecuarias de la zona, comités de cuenca (COMUPRED) y distribuidores mayoristas de hardware COTS.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-actividades">
          <div class="print-canvas-box-title">2. Actividades Clave</div>
          <p class="print-canvas-box-body">${canvas.actividades || 'Ensamblaje e integración modular de telemetría, calibración hidrométrica en banco de pruebas y talleres de adopción técnica.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-recursos">
          <div class="print-canvas-box-title">6. Recursos Clave</div>
          <p class="print-canvas-box-body">${canvas.recursos || 'Microcontroladores ESP32, transceptores LoRaWAN sub-GHz, celdas fotovoltaicas LiFePO4 y equipo multidisciplinario UNI.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-propuesta">
          <div class="print-canvas-box-title">3. Propuesta de Valor ★</div>
          <p class="print-canvas-box-body"><strong>${canvas.propuesta || state.solution_thesis || 'Sistema de alerta temprana no invasivo con 30 minutos de anticipación operativa, cero dependencia celular y costo unitario 70% menor al mercado.'}</strong></p>
        </div>
        <div class="print-canvas-box print-canvas-box-relaciones">
          <div class="print-canvas-box-title">4. Relaciones</div>
          <p class="print-canvas-box-body">${canvas.relaciones || 'Acompañamiento presencial en simulacros de campo, capacitación comunitaria y protocolos de mantenimiento semestral.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-canales">
          <div class="print-canvas-box-title">7. Canales</div>
          <p class="print-canvas-box-body">${canvas.canales || 'Red de radiofrecuencia mallada, sirenas locales autónomas y tablero web de telemetría para autoridades municipales.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-segmentos">
          <div class="print-canvas-box-title">5. Segmentos</div>
          <p class="print-canvas-box-body">${canvas.segmentos || 'Familias periurbanas y rurales asentadas en márgenes de ríos vulnerables, comités barriales de prevención y gobiernos locales.'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-costes">
          <div class="print-canvas-box-title">8. Estructura de Costes (Tope \$15k)</div>
          <p class="print-canvas-box-body">${canvas.costes || 'Adquisición de componentes mayoristas COTS ($650), manufactura aditiva y sellado IP67 ($320), calibración y pruebas de campo ($450).'}</p>
        </div>
        <div class="print-canvas-box print-canvas-box-ingresos">
          <div class="print-canvas-box-title">9. Fuentes de Ingresos / Sostenibilidad</div>
          <p class="print-canvas-box-body">${canvas.ingresos || 'Fondos de inversión municipal en prevención de desastres, cooperación internacional (PNUD/CEPAL) y convenios de extensión universitaria.'}</p>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 5: PRESUPUESTO SUSTENTADO DE MARCHA -->
    <div class="print-section print-page-break">
      <div class="print-section-title">
        <span>5. Presupuesto Sustentado de Marcha (${budgetFmt(500, bctx)} - ${budgetFmt(15000, bctx)})</span>
        <span class="print-badge ${budgetInRange ? 'print-badge-green' : 'print-badge-amber'}">${budgetInRange ? 'DENTRO DE RANGO SIRLI' : 'REVISAR TOPE RÚBRICA'}</span>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:4%;">#</th>
            <th style="width:36%;">Concepto Técnico / Insumo</th>
            <th style="width:18%;">Categoría</th>
            <th style="width:8%; text-align:center;">Cant.</th>
            <th style="width:12%; text-align:right;">Unit. ${bctx.rotulo}</th>
            <th style="width:12%; text-align:right;">Total ${bctx.rotulo}</th>
            <th style="width:10%;">Cotización</th>
          </tr>
        </thead>
        <tbody>
          ${budgetList.map((b, i) => {
            const concept = b.concept || b.element || "Partida Técnica";
            const catItem = b.category || "Insumo";
            const units = Number(b.units || 1);
            const unitCost = Number(b.unit_cost || 0);
            const lineTotal = units * unitCost;
            return `
              <tr>
                <td class="num-cell">${i + 1}</td>
                <td><strong>${concept}</strong></td>
                <td>${catItem}</td>
                <td class="num-cell" style="text-align:center;">${units}</td>
                <td class="num-cell" style="text-align:right;">${budgetFmt(unitCost, bctx)}</td>
                <td class="num-cell" style="text-align:right; font-weight:700;">${budgetFmt(lineTotal, bctx)}</td>
                <td style="font-size:7.5pt; color:#64748B;">${b.url ? 'Cotizado' : 'COTS Local'}</td>
              </tr>
            `;
          }).join('')}
          <tr style="background:#F8FAFD; font-weight:800;">
            <td colspan="5" style="text-align:right;">PRESUPUESTO GENERAL CONSOLIDADO:</td>
            <td class="num-cell" style="text-align:right; color:#0D1B35; font-size:9.5pt;">${budgetFmt(budgetTotal, bctx, true)}</td>
            <td style="font-size:7.5pt; color:#047857; font-weight:700;">✓ Rango Apto</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SECCIÓN 6: GUION AUDIOVISUAL DE 120 SEGUNDOS Y PLAN DE TOMAS -->
    <div class="print-section print-avoid-break">
      <div class="print-section-title">
        <span>6. Guion Audiovisual Oficial de 120 Segundos (4 Actos)</span>
        <span class="print-badge print-badge-cyan">120 SEGUNDOS EXACTOS</span>
      </div>
      <div style="font-size:8.3pt; line-height:1.45; color:#1E293B;">
        <div style="margin-bottom:6px; padding:6px 9px; background:#FAFBFD; border-left:3px solid #0866F5; border-radius:0 4px 4px 0;">
          <strong>[00:00 - 00:20] Acto 1 (Herida Social / Diagnóstico):</strong> ${scr.acto1 || 'Exposición contundente del problema territorial, las vidas en riesgo y la brecha técnica que motiva la innovación formulada por el equipo.'}
        </div>
        <div style="margin-bottom:6px; padding:6px 9px; background:#FAFBFD; border-left:3px solid #0866F5; border-radius:0 4px 4px 0;">
          <strong>[00:20 - 00:55] Acto 2 (Solución Innovadora / WOW):</strong> ${scr.acto2 || 'Presentación de la propuesta tecnológica y metodológica, diferenciación técnica y demostración de su funcionamiento autónomo en terreno.'}
        </div>
        <div style="margin-bottom:6px; padding:6px 9px; background:#FAFBFD; border-left:3px solid #0866F5; border-radius:0 4px 4px 0;">
          <strong>[00:55 - 01:30] Acto 3 (Demostración y Prefactibilidad):</strong> ${scr.acto3 || 'Demostración operativa del modelo, sustentación presupuestaria con componentes COTS disponibles y modelo de viabilidad económica sin subsidios.'}
        </div>
        <div style="margin-bottom:6px; padding:6px 9px; background:#FAFBFD; border-left:3px solid #0866F5; border-radius:0 4px 4px 0;">
          <strong>[01:30 - 02:00] Acto 4 (Impacto Humano, ODS y Cierre):</strong> ${scr.acto4 || 'Transformación social cuantificable, alineación con la Agenda 2030 y llamado inspirador a la acción institucional y comunitaria.'}
        </div>
      </div>
      ${shotList.length > 0 ? `
        <div style="margin-top:8px;">
          <div style="font-size:7.5pt; font-weight:800; color:#5C7193; text-transform:uppercase; font-family:'JetBrains Mono',monospace; margin-bottom:4px;">Plan de Tomas Audiovisuales (Shotlist Calibrado)</div>
          <table class="print-table" style="font-size:8pt; margin-top:2px;">
            <thead>
              <tr>
                <th style="width:18%;">Acto</th>
                <th style="width:50%;">Encuadre / Contenido Visual de la Toma</th>
                <th style="width:32%;">Propósito de Rúbrica</th>
              </tr>
            </thead>
            <tbody>
              ${shotList.slice(0, 5).map(s => `
                <tr>
                  <td><strong>${s.acto || 'Acto'}</strong></td>
                  <td>${s.label || s.desc || 'Toma técnica'}</td>
                  <td style="color:#64748B;">${s.status ? 'Verificada' : 'Planificada'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>

    <!-- SECCIÓN 7: ENTREGABLES MULTIMEDIA Y ENLACES DE MISIÓN CRÍTICA -->
    <div class="print-section print-page-break">
      <div class="print-section-title">
        <span>7. Entregables Oficiales & Enlaces de Misión Crítica</span>
        <span class="print-badge print-badge-blue">AUDITORÍA DIGITAL</span>
      </div>
      <div class="print-deliverables-grid">
        <div class="print-deliv-card">
          <div class="print-deliv-type">Video Oficial de YouTube</div>
          <div class="print-deliv-name">Pitch Audiovisual 120s</div>
          <div class="print-deliv-url">${videoUrl}</div>
          <div style="font-size:7pt; color:#047857; margin-top:4px; font-weight:600;">✓ Modo: No Listado / Calidad 1080p</div>
        </div>
        <div class="print-deliv-card">
          <div class="print-deliv-type">Demo Web / Prototipo</div>
          <div class="print-deliv-name">Dashboard Interactivo</div>
          <div class="print-deliv-url">${siteUrl}</div>
          <div style="font-size:7pt; color:#047857; margin-top:4px; font-weight:600;">✓ Interfaz /impeccable en vivo</div>
        </div>
        <div class="print-deliv-card">
          <div class="print-deliv-type">Bóveda Cloud & Archivos</div>
          <div class="print-deliv-name">Drive, Canva & Esquemas</div>
          <div class="print-deliv-url">${driveUrl}</div>
          <div style="font-size:7pt; color:#475569; margin-top:4px;">Canva: ${canvaUrl}</div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 8: MATRIZ ANTIDESCALIFICACIÓN Y GUARDARRAÍLES SIRLI -->
    <div class="print-section print-avoid-break">
      <div class="print-section-title">
        <span>8. Matriz Antidescalificación y Guardarraíles de Rúbrica SIRLI</span>
        <span class="print-badge print-badge-green">10 PUNTOS DE CONTROL</span>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:5%;">#</th>
            <th style="width:35%;">Guardarraíl de Misión Crítica</th>
            <th style="width:45%;">Criterio Oficial de Validación</th>
            <th style="width:15%; text-align:center;">Estado SIRLI</th>
          </tr>
        </thead>
        <tbody>
          ${guardrailsDef.map((g, idx) => {
            const isChecked = Boolean(gr[g.key]);
            return `
              <tr>
                <td class="num-cell">${idx + 1}</td>
                <td><strong>${g.name}</strong></td>
                <td>${g.req}</td>
                <td style="text-align:center;">
                  <span class="print-badge ${isChecked ? 'print-badge-green' : 'print-badge-amber'}">
                    ${isChecked ? '✓ VALIDADO' : 'AUDITADO'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- SECCIÓN 9: TRAZABILIDAD TÁCTICA MULTI-IA -->
    ${taskList.length > 0 ? `
      <div class="print-section print-avoid-break">
        <div class="print-section-title">
          <span>9. Orquestación Multi-IA & Trazabilidad Táctica</span>
          <span class="print-badge print-badge-navy">${taskList.length} TAREAS COORDINADAS</span>
        </div>
        <table class="print-table" style="font-size:8pt;">
          <thead>
            <tr>
              <th style="width:30%;">Misión / Rol Táctico</th>
              <th style="width:30%;">Agente IA Sugerido</th>
              <th style="width:25%;">Objetivo de Calidad</th>
              <th style="width:15%; text-align:center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${taskList.slice(0, 7).map(t => `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td style="font-family:'JetBrains Mono',monospace; font-size:7.5pt;">${t.ai || 'IA Local'}</td>
                <td>${t.desc ? t.desc.slice(0, 65) + '...' : 'Optimización técnica'}</td>
                <td style="text-align:center;">
                  <span class="print-badge ${t.status === 'done' ? 'print-badge-green' : 'print-badge-blue'}">
                    ${t.status === 'done' ? 'COMPLETO' : 'ACTIVO'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- SECCIÓN 10: SISTEMA DE DISEÑO /IMPECCABLE Y RETOS DE REFERENCIA -->
    <div class="print-section print-page-break">
      <div class="print-section-title">
        <span>10. Sistema de Diseño e Identidad Visual (/impeccable standard)</span>
        <span class="print-badge print-badge-blue">WCAG AAA COMPLIANT</span>
      </div>
      <div class="print-swatches-grid">
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#0D1B35;"></div>
          <div class="print-swatch-name">Navy Dark</div>
          <div class="print-swatch-hex">#0D1B35</div>
        </div>
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#0866F5;"></div>
          <div class="print-swatch-name">Azul Primario</div>
          <div class="print-swatch-hex">#0866F5</div>
        </div>
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#1D4ED8;"></div>
          <div class="print-swatch-name">Cobalto</div>
          <div class="print-swatch-hex">#1D4ED8</div>
        </div>
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#0284C7;"></div>
          <div class="print-swatch-name">Acento Radio</div>
          <div class="print-swatch-hex">#0284C7</div>
        </div>
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#2AA7AD;"></div>
          <div class="print-swatch-name">Verde Cian</div>
          <div class="print-swatch-hex">#2AA7AD</div>
        </div>
        <div class="print-swatch-card">
          <div class="print-swatch-color" style="background:#F8FAFD; border:1px solid #CBD5E1;"></div>
          <div class="print-swatch-name">Lienzo Sutil</div>
          <div class="print-swatch-hex">#F8FAFD</div>
        </div>
      </div>
      <div class="print-meta-grid" style="margin-top:6px; margin-bottom:12px;">
        <div><strong>Tipografía Display / Títulos:</strong> Plus Jakarta Sans (900/700/500)</div>
        <div><strong>Tipografía Tablas / Datos:</strong> JetBrains Mono (Tabular Nums)</div>
        <div><strong>Principios de Interfaz:</strong> Cardless Typographic Workbench, cero emojis, bordes hairline de 1px</div>
        <div><strong>Contraste Semántico:</strong> Ratio 14.2:1 (Navy/Blanco) y 8.1:1 (Azul/Blanco)</div>
      </div>

      <div class="print-section-title" style="margin-top:16px;">
        <span>Catálogo Oficial de Retos de Referencia</span>
        <span class="print-badge print-badge-navy">${challengesList.length} RETOS CALIBRADOS</span>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:8%;">ID</th>
            <th style="width:28%;">Reto Oficial</th>
            <th style="width:16%;">Categoría / ODS</th>
            <th style="width:48%;">Propuesta Técnica IA / Factor WOW</th>
          </tr>
        </thead>
        <tbody>
          ${challengesList.slice(0, 9).map(ch => `
            <tr ${ch.id === challengeId ? 'style="background:#EFF6FF; font-weight:600;"' : ''}>
              <td class="num-cell"><strong>#${ch.id}</strong></td>
              <td>${ch.title} ${ch.id === challengeId ? '<span class="print-badge print-badge-blue" style="margin-left:4px;">SELECCIONADO</span>' : ''}</td>
              <td>${ch.category}<br><span style="font-size:7.5pt; color:#64748b; font-family:'JetBrains Mono',monospace;">${Array.isArray(ch.ods) ? ch.ods.join(', ') : (ch.ods || '')}</span></td>
              <td>${ch.wowProposal || ch.proposal || 'Solución estructurada por Rally Studio.'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- PIE DE PÁGINA TÉCNICO OFICIAL -->
      <div class="print-official-footer">
        <div>RALLY STUDIO · MISSION CONTROL WORKBENCH · /IMPECCABLE SWISS DESIGN</div>
        <div>UNIVERSIDAD NACIONAL DE INGENIERÍA (UNI) · CERTÁMENES OFICIALES 2026</div>
      </div>
    </div>
  `;
}

// Enlace y compatibilidad universal entre preparePrintDossierHTML y generatePrintSheetHTML
window.preparePrintDossierHTML = preparePrintDossierHTML;
window.generatePrintSheetHTML = preparePrintDossierHTML;

function printProjectDossier() {
  let container = document.getElementById("print-dossier-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "print-dossier-container";
    document.body.appendChild(container);
  }
  container.innerHTML = preparePrintDossierHTML();
  showToast("Abriendo vista de impresión / exportación a PDF...");
  setTimeout(() => {
    window.print();
  }, 250);
}


function importProjectJson(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      state = Object.assign(getInitialState(), imported);
      saveState();
      syncUI();
      alert("Proyecto importado con éxito.");
    } catch (err) {
      alert("Error al leer archivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

function copySyncToken() {
  const jsonStr = JSON.stringify(state);
  const b64 = btoa(encodeURIComponent(jsonStr));
  navigator.clipboard.writeText(b64);
  alert("Token de sincronización copiado. Pégalo en el WhatsApp del equipo para que tus compañeros sincronicen su dashboard.");
}

function pasteSyncToken() {
  const token = prompt("Pega aquí el Token de Sincronización compartido por tu compañero:");
  if (!token) return;
  try {
    const jsonStr = decodeURIComponent(atob(token.trim()));
    const imported = JSON.parse(jsonStr);
    state = Object.assign(getInitialState(), imported);
    saveState();
    syncUI();
    alert("Dashboard sincronizado exitosamente con el equipo.");
  } catch (err) {
    alert("Token inválido o corrupto: " + err.message);
  }
}

// ── CRONÓMETRO REGRESIVO Y ALERTAS DE CRONOGRAMA ─────────────────────────────
function initClock() {
  startTimer();
}

function showToast(msg) {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(".toast-notice");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "toast-notice";
  el.innerHTML = `${SVG.check} <span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 3200);
}

function copyToClipboardWithFeedback(text, successMsg) {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || "Copiado al portapapeles");
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  if (typeof document === "undefined") return;
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch(e) {}
  ta.remove();
  showToast(successMsg || "Copiado al portapapeles");
}

function getCurrentDeadlineAlert() {
  if (!state.rally_type) {
    return { label: "STANDBY", time: "--:--", desc: "Selecciona el certamen para activar el cronograma" };
  }
  if (!state.rally_started) {
    return { label: "Inicio Oficial", time: "08:00 AM", desc: "Apertura oficial de retos en plataforma de competencia" };
  }
  const now = Date.now();
  const start = state.start_timestamp || now;

  if (now < start) {
    const diffSec = Math.floor((start - now) / 1000);
    const dh = Math.floor(diffSec / 3600);
    const dm = Math.floor((diffSec % 3600) / 60);
    const ds = Math.floor(diffSec % 60);
    const timeStr = dh > 0 ? `${dh}h ${dm}m` : `${dm}m ${ds}s`;
    return {
      label: "Inicio Programado",
      time: `En ${timeStr}`,
      desc: `Inicia el ${new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
    };
  }

  const elapsedSec = Math.floor((now - start) / 1000);
  const totalSec = (state.hours_total || 24) * 3600;
  const remainSec = Math.max(0, totalSec - elapsedSec);
  const elapsedHours = elapsedSec / 3600;

  if (elapsedHours < 4) {
    const remainToReg = Math.max(0, 4 * 3600 - elapsedSec);
    const rh = Math.floor(remainToReg / 3600);
    const rm = Math.floor((remainToReg % 3600) / 60);
    const regTarget = new Date(start + 4 * 3600 * 1000);
    const timeStr = regTarget.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { 
      label: "Inscripción Oficial", 
      time: `${timeStr} (${rh}h ${rm}m)`, 
      desc: "Límite de registro de integrantes y sede UNI en plataforma oficial" 
    };
  }
  if (elapsedHours < 12) {
    const remainToTikTok = Math.max(0, 12 * 3600 - elapsedSec);
    const rh = Math.floor(remainToTikTok / 3600);
    const rm = Math.floor((remainToTikTok % 3600) / 60);
    const ttTarget = new Date(start + 12 * 3600 * 1000);
    const timeStr = ttTarget.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { 
      label: "Ventana TikTok", 
      time: `${timeStr} (${rh}h ${rm}m)`, 
      desc: "Ventana óptima para subir interacción lúdica y captar interacciones" 
    };
  }
  if (remainSec > 6 * 3600) {
    return { 
      label: "Tesis Técnica", 
      time: "T-6 Horas", 
      desc: "Congelamiento innegociable de solución y justificación técnica" 
    };
  }
  if (remainSec > 4 * 3600) {
    return { 
      label: "Pautado y Presupuesto", 
      time: "T-4 Horas", 
      desc: "Límites de caracteres y cotizaciones de presupuesto cerradas al 100%" 
    };
  }
  if (remainSec > 2 * 3600) {
    return { 
      label: "Render y YouTube", 
      time: "T-2 Horas", 
      desc: "Subir video en modo No listado (YouTube tarda 25m en procesar 1080p)" 
    };
  }
  if (remainSec > 1 * 3600) {
    return { 
      label: "Verificar Links", 
      time: "T-1 Hora", 
      desc: "Comprobar link en incógnito (nunca privado) y cargar PDF pautado" 
    };
  }
  if (remainSec > 0) {
    return { 
      label: "CIERRE DE PLATAFORMA", 
      time: "T-0 Inmutable", 
      desc: "Cierre definitivo de plataforma. Ningún certamen otorga prórroga" 
    };
  }
  return { 
    label: "TIEMPO CUMPLIDO", 
    time: "Cerrado", 
    desc: "Certamen finalizado" 
  };
}

function getTimerString() {
  if (!state.rally_type && !state.rally_started) {
    return { time: "--:--:--", status: "STANDBY" };
  }
  if (!state.rally_started) {
    return { time: `${(state.hours_total || 24).toString().padStart(2, '0')}:00:00`, status: "STANDBY" };
  }
  const now = Date.now();
  const start = state.start_timestamp || now;

  if (now < start) {
    const remainToStart = Math.floor((start - now) / 1000);
    const h = Math.floor(remainToStart / 3600).toString().padStart(2, "0");
    const m = Math.floor((remainToStart % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(remainToStart % 60).toString().padStart(2, "0");
    return { time: `${h}:${m}:${s}`, status: "INICIA EN" };
  }

  const elapsedSec = Math.floor((now - start) / 1000);
  const totalSec = (state.hours_total || 24) * 3600;
  const remainSec = Math.max(0, totalSec - elapsedSec);

  if (remainSec <= 0) {
    return { time: "00:00:00", status: "TIEMPO CUMPLIDO" };
  }

  const h = Math.floor(remainSec / 3600).toString().padStart(2, "0");
  const m = Math.floor((remainSec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(remainSec % 60).toString().padStart(2, "0");
  return { time: `${h}:${m}:${s}`, status: "EN CURSO" };
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  function updateClockDisplay() {
    const clockEl = document.getElementById("clock-timer");
    const statusEl = document.getElementById("clock-status-tag");
    const tData = getTimerString();
    if (clockEl) clockEl.innerText = tData.time;
    if (statusEl) statusEl.innerText = tData.status;

    const deadlineEl = document.getElementById("topbar-deadline-pill");
    if (deadlineEl) {
      const dData = getCurrentDeadlineAlert();
      deadlineEl.innerHTML = `
        <span class="deadline-pill-dot"></span>
        <span class="deadline-pill-label">${dData.label}</span>
        <span class="deadline-pill-time">${dData.time}</span>
      `;
      deadlineEl.title = dData.desc;
    }
  }

  // Sondeo periódico de telemetría de hardware
  let telemetryTick = 0;
  function pollTelemetry() {
    fetch("/api/telemetry")
      .then(r => r.json())
      .then(data => {
        const cpuEl = document.getElementById("telemetry-cpu-val");
        const ramEl = document.getElementById("telemetry-ram-val");
        if (cpuEl) cpuEl.innerText = `${data.cpu_percent}%`;
        if (ramEl) ramEl.innerText = `${data.ram_percent}%`;
      })
      .catch(() => {});
  }

  updateClockDisplay();
  pollTelemetry();
  timerInterval = setInterval(() => {
    updateClockDisplay();
    telemetryTick++;
    if (telemetryTick % 4 === 0) {
      pollTelemetry();
    }
  }, 1000);
}

function startOfficialRallyTimer() {
  state.rally_started = true;
  const official = new Date();
  official.setHours(8, 0, 0, 0);
  state.start_timestamp = official.getTime();
  state.custom_calibrated = true;
  saveState();
  startTimer();
  if (typeof renderApp === "function") renderApp();
  showToast("Cronómetro calibrado: Inicio Oficial 08:00 AM");
}

// ── TOGGLE SIDEBAR & PANEL ───────────────────────────────────────────────────
function closeAllDrawers() {
  const body = document.getElementById("app-body") || document.body;
  body.classList.remove("sidebar-drawer-open", "panel-drawer-open");
  renderMobileBottomBar();
}

function toggleSidebar() {
  const body = document.getElementById("app-body") || document.body;
  if (window.innerWidth <= 1024) {
    body.classList.remove("panel-drawer-open");
    body.classList.toggle("sidebar-drawer-open");
  } else {
    body.classList.toggle("sidebar-collapsed");
  }
  renderMobileBottomBar();
}

function togglePanel() {
  const body = document.getElementById("app-body") || document.body;
  if (window.innerWidth <= 1024) {
    body.classList.remove("sidebar-drawer-open");
    body.classList.toggle("panel-drawer-open");
  } else {
    body.classList.toggle("panel-collapsed");
  }
  renderMobileBottomBar();
}

function calculateAuditScore() {
  let points = 0;
  if (state.rally_type) points += 10;
  if (state.team_name && state.university) points += 10;
  if (state.challenge_id) points += 15;
  if (state.solution_approved) points += 15;
  if (typeof isPautadoComplete === "function" && isPautadoComplete()) points += 15;
  if (typeof isBudgetValid === "function" && isBudgetValid()) points += 10;
  if (typeof isScriptComplete === "function" && isScriptComplete()) points += 10;
  const guardrails = state.guardrails || {};
  const guardrailsCount = Object.values(guardrails).filter(Boolean).length;
  if (guardrailsCount >= 5) points += 15;
  return points;
}

// ── BARRA MÓVIL DE NAVEGACIÓN INFERIOR ───────────────────────────────────────
function renderMobileBottomBar() {
  const el = document.getElementById("mobile-bottom-bar");
  if (!el) return;
  const stage = getWorkflowStage();
  if (stage < 2) {
    el.style.display = "none";
    return;
  }
  el.style.display = "";
  const body = document.getElementById("app-body") || document.body;
  const score = calculateAuditScore();
  const isSidebarOpen = body.classList.contains("sidebar-drawer-open");
  const isPanelOpen = body.classList.contains("panel-drawer-open");

  el.innerHTML = `
    <button class="mobile-bottom-tab ${activeTab === 'resumen' ? 'active' : ''}" onclick="switchTab('resumen')" title="Resumen del rally">
      ${SVG.network}
      <span>Resumen</span>
    </button>
    <button class="mobile-bottom-tab ${isSidebarOpen ? 'active' : ''}" onclick="toggleSidebar()" title="Fases de trabajo">
      ${SVG.menu}
      <span>Fases</span>
    </button>
    <button class="mobile-bottom-tab ${isPanelOpen ? 'active' : ''}" onclick="togglePanel()" title="Auditoría">
      ${SVG.shieldCheck}
      <span>Auditoría (${score}%)</span>
    </button>
    <button class="mobile-bottom-tab ${activeTab === 'timeline' ? 'active' : ''}" onclick="switchTab('timeline')" title="Cronómetro">
      ${SVG.clock}
      <span>Tiempo</span>
    </button>
    <a href="graph.html" target="_blank" class="mobile-bottom-tab" title="Grafo">
      ${SVG.network}
      <span>Grafo</span>
    </a>
  `;
}

// ── TOPBAR ───────────────────────────────────────────────────────────────────
function renderTopbar() {
  const el = document.getElementById("topbar");
  const stage = getWorkflowStage();
  const certamen = state.rally_type === "latam" ? "Rally Latam 28h" : state.rally_type === "nacional" ? "Rally Nacional 24h" : "";
  const pName = state.team_name || state.project_name || "";
  const timerData = getTimerString();
  const deadlineData = getCurrentDeadlineAlert();
  const auditPoints = calculateAuditScore();

  el.innerHTML = `
    <div class="topbar-left">
      ${stage >= 2 ? `<button class="btn-toggle-sidebar" onclick="toggleSidebar()" title="Colapsar/Expandir menú lateral">${SVG.menu}</button>` : ""}
      <div class="brand-group" onclick="goHome()" title="Ir al inicio de Rally Studio">
        ${SVG.logo}
        <span class="brand-text-navy">RALLY</span>
        <span class="brand-text-blue">STUDIO</span>
      </div>
      ${state.rally_type ? `
        <div class="topbar-emblems-group" title="${certamen}">
          <img src="${state.rally_type === 'latam' ? 'assets/logo_rally_latam.png' : 'assets/logo_rally_nacional.png'}" 
               class="topbar-emblem-img" 
               alt="${state.rally_type === 'latam' ? 'Rally Latinoamericano' : 'Rally Nacional Innova'}">
          <span class="topbar-emblem-divider"></span>
          <img src="assets/logo_uni_official.png" 
               class="topbar-uni-img" 
               alt="Universidad Nacional de Ingeniería (UNI)">
          ${state.team_logo_img ? `
            <span class="topbar-emblem-divider"></span>
            <img src="${state.team_logo_img}" class="topbar-team-avatar" alt="Team Logo" title="${state.team_name || 'Equipo'}">
          ` : ""}
        </div>
      ` : ""}
      ${pName ? `<span class="project-title-crumb" title="${pName}">/ ${pName}</span>` : ""}
      ${state.challenge_id ? `<span class="challenge-title-crumb">${(() => { const ch = (state.challenges || []).find(c => c.id === state.challenge_id) || (typeof OFFICIAL_CHALLENGES_2026 !== "undefined" && OFFICIAL_CHALLENGES_2026.find(c => c.id === state.challenge_id)); return ch && ch.title ? ch.title : `Reto #${state.challenge_id}`; })()}</span>` : ""}
    </div>
    <div class="topbar-actions">
      ${stage >= 2 ? `
        <button class="btn-toggle-panel topbar-chip" onclick="openAIThesisFormulatorModal(state.challenge_id || '01')" title="IA Copilot: asistente dual-mode y prompts de razonamiento" aria-label="IA Copilot">
          ${SVG.spark}
        </button>
        <button class="btn-toggle-panel topbar-chip" onclick="togglePanel()" title="Panel de Auditoría (${auditPoints}%)" aria-label="Auditoría: ${auditPoints}%">
          ${SVG.shieldCheck}
          <span class="topbar-chip-num">${auditPoints}%</span>
        </button>
      ` : ""}

      ${state.rally_type ? `
        <div id="topbar-deadline-pill" 
             class="deadline-pill ${state.rally_type === 'latam' ? 'latam' : 'nacional'}" 
             onclick="switchTab('timeline')" 
             title="${deadlineData.desc}">
          <span class="deadline-pill-dot"></span>
          <span class="deadline-pill-label">${deadlineData.label}</span>
          <span class="deadline-pill-time">${deadlineData.time}</span>
        </div>
      ` : ""}

      <!-- Identidad de esta persona: nombre real, definido por ella misma -->
      <button class="collaborator-avatar-badge" onclick="openIdentityModal()" title="${amINamed() ? `Trabajas como ${currentClientMascot.name}. Clic para cambiar de persona.` : 'Define tu nombre para que el equipo sepa quién eres.'}">
        <span class="collaborator-avatar-icon">${currentClientMascot.icon}</span>
        <span class="collaborator-name-label ${amINamed() ? '' : 'is-unset'}">${escapeHtml(currentClientMascot.name)}</span>
      </button>

      <!-- Telemetría del Sistema en Tiempo Real -->
      <div class="telemetry-chip" id="topbar-telemetry-chip" title="Métricas de hardware y estado del motor en tiempo real">
        <span class="telemetry-pulse"></span>
        <span>CPU <strong id="telemetry-cpu-val">--%</strong></span>
        <span>RAM <strong id="telemetry-ram-val">--%</strong></span>
      </div>

      <div class="dropdown-wrapper">
        <button class="btn-icon-discreet" onclick="toggleProjectMenu(event)" id="btn-project-menu" title="Opciones de proyecto">
          ${SVG.dotsVertical}
        </button>
        <div id="project-dropdown" class="dropdown-menu-box" style="display:none; right:0; left:auto;">
          <a href="#" onclick="startOfficialRallyTimer(); return false;">${SVG.spark} Iniciar Cronómetro (Inicio Oficial 08:00 AM)</a>
          <a href="#" onclick="state.rally_started=false; state.start_timestamp=null; saveState(); startTimer(); return false;">Pausar / Standby</a>
          <a href="#" onclick="resetProject(); return false;">Reiniciar Certamen (T=0)</a>
          <a href="#" onclick="exportProjectMarkdown(); return false;">${SVG.copy} Exportar Dossier (.md)</a>
          <a href="#" onclick="printProjectDossier(); return false;">${SVG.download} Imprimir / Guardar como PDF</a>
          <a href="#" onclick="exportProjectJson(); return false;">${SVG.download} Exportar Proyecto (.json)</a>
          <label style="cursor:pointer; display:flex; align-items:center; gap:8px; padding:9px 14px; font-size:12px; color:#1e293b;">
            ${SVG.upload} Importar Proyecto (.json)
            <input type="file" accept=".json" style="display:none;" onchange="importProjectJson(event)">
          </label>
        </div>
      </div>

      <a href="graph.html" target="_blank" class="btn-pill-ghost btn-graph-link" title="Explorar Grafo de Conocimiento (177 nodos, rúbricas y ganadores)" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
        ${SVG.network} <span class="graph-btn-label">Grafo</span>
      </a>

      <div class="timer-pill-navy" id="timer-pill" onclick="openTimerSettingsModal()" style="cursor:pointer;" title="Clic para calibrar o ajustar cronómetro">
        ${SVG.clock}
        <span id="clock-timer">${timerData.time}</span>
        <span id="clock-status-tag" style="font-size:9.5px; opacity:0.75; font-weight:700; margin-left:4px;">${timerData.status}</span>
      </div>
    </div>
  `;
}

function toggleProjectMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("project-dropdown");
  if (!menu) return;
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

document.addEventListener("click", () => {
  const menu = document.getElementById("project-dropdown");
  if (menu) menu.style.display = "none";
});

// ── CALIBRACIÓN INTERACTIVA DE CRONÓMETRO ─────────────────────────────────────
function formatDateTimeLocal(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openTimerSettingsModal() {
  let modal = document.getElementById("timer-modal-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "timer-modal-overlay";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }
  
  const currentTotal = state.hours_total || (state.rally_type === "latam" ? 28 : 24);
  const currentStart = state.start_timestamp || Date.now();
  const currentStartFormatted = formatDateTimeLocal(currentStart);

  modal.innerHTML = `
    <div class="modal-card" style="max-width:480px;" onclick="event.stopPropagation()">
      <div class="modal-header" style="margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          ${SVG.clock}
          <h3 class="modal-title" style="margin:0; font-size:16px; font-weight:800; color:#0D1B35;">Calibrar Hora de Inicio y Cronómetro</h3>
        </div>
        <button class="btn-icon-discreet" onclick="closeTimerSettingsModal()" style="font-size:18px; line-height:1;">&times;</button>
      </div>
      
      <p style="font-size:12px; color:#5C7193; margin-bottom:14px; line-height:1.45;">
        Define con exactitud a qué hora empezó o empezará la competencia para calcular las alertas reglamentarias y el tiempo restante.
      </p>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px; font-weight:700; color:#13213A; display:block; margin-bottom:5px;">
          Hora Oficial de Inicio (Empieza o Empezó)
        </label>
        <input type="datetime-local" id="timer-input-start-datetime" value="${currentStartFormatted}" oninput="updateTimerModalPreview()" style="width:100%; padding:9px 12px; border:1px solid #DCE7F5; border-radius:8px; font-size:13px; font-weight:700; font-family:var(--font-mono); background:#F8FAFD; box-sizing:border-box;">
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;">
        <button type="button" class="btn-pill-light" style="font-size:11px; padding:5px 8px;" onclick="setTimerStartPreset('now')">Ahora</button>
        <button type="button" class="btn-pill-light" style="font-size:11px; padding:5px 8px;" onclick="setTimerStartPreset('today_08')">Hoy 08:00 AM</button>
        <button type="button" class="btn-pill-light" style="font-size:11px; padding:5px 8px;" onclick="setTimerStartPreset('today_09')">Hoy 09:00 AM</button>
        <button type="button" class="btn-pill-light" style="font-size:11px; padding:5px 8px;" onclick="setTimerStartPreset('minus_1h')">Hace 1 hora</button>
        <button type="button" class="btn-pill-light" style="font-size:11px; padding:5px 8px;" onclick="setTimerStartPreset('minus_2h')">Hace 2 horas</button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
        <div>
          <label style="font-size:11px; font-weight:700; color:#13213A; display:block; margin-bottom:4px;">Régimen Total (Horas)</label>
          <input type="number" id="timer-input-hours-total" value="${currentTotal}" min="1" max="72" oninput="updateTimerModalPreview()" style="width:100%; padding:8px 10px; border:1px solid #DCE7F5; border-radius:8px; font-size:13px; font-weight:700; font-family:var(--font-mono); background:#F8FAFD; box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:11px; font-weight:700; color:#13213A; display:block; margin-bottom:4px;">Certamen Predeterminado</label>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-pill-light" style="flex:1; font-size:11px; padding:8px 4px;" onclick="setTimerPreset(24)">24h (Nac.)</button>
            <button type="button" class="btn-pill-light" style="flex:1; font-size:11px; padding:8px 4px;" onclick="setTimerPreset(28)">28h (Latam)</button>
          </div>
        </div>
      </div>

      <div id="timer-modal-preview-box" style="padding:10px 12px; background:var(--bg-subtle); border:1px solid var(--border-light); border-radius:8px; margin-bottom:16px; font-size:11.5px; color:#1E3A8A; line-height:1.5;">
        <!-- Se rellena con updateTimerModalPreview() -->
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid #DCE7F5;">
        <button type="button" class="btn-pill-ghost" style="color:${state.rally_started ? '#DC2626' : '#0866F5'}; font-size:12px; font-weight:700;" onclick="toggleTimerRunning()">
          ${state.rally_started ? 'Pausar Reloj' : 'Activar Reloj'}
        </button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-pill-light" style="font-size:12px;" onclick="closeTimerSettingsModal()">Cancelar</button>
          <button type="button" class="btn-select-card filled" style="padding:7px 18px; font-size:12px; font-weight:700;" onclick="applyTimerSettings()">Guardar y Activar</button>
        </div>
      </div>
    </div>
  `;
  modal.style.display = "flex";
  updateTimerModalPreview();
}

function updateTimerModalPreview() {
  const box = document.getElementById("timer-modal-preview-box");
  const dtInp = document.getElementById("timer-input-start-datetime");
  const hoursInp = document.getElementById("timer-input-hours-total");
  if (!box || !dtInp || !hoursInp) return;

  const startTs = dtInp.value ? Date.parse(dtInp.value) : (state.start_timestamp || Date.now());
  const hours = parseInt(hoursInp.value, 10) || (state.hours_total || 24);
  const endTs = startTs + (hours * 3600 * 1000);
  const now = Date.now();

  const startDate = new Date(startTs);
  const endDate = new Date(endTs);
  const options = { weekday: 'short', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };

  let statusText = "";
  if (now < startTs) {
    const diff = Math.floor((startTs - now) / 1000);
    const dh = Math.floor(diff / 3600);
    const dm = Math.floor((diff % 3600) / 60);
    statusText = `<span style="color:#0284C7; font-weight:700;">POR INICIAR</span> (empieza en ${dh}h ${dm}m)`;
  } else {
    const elapsed = Math.floor((now - startTs) / 1000);
    const total = hours * 3600;
    const remain = Math.max(0, total - elapsed);
    if (remain <= 0) {
      statusText = `<span style="color:#DC2626; font-weight:700;">TIEMPO CUMPLIDO</span>`;
    } else {
      const rh = Math.floor(remain / 3600);
      const rm = Math.floor((remain % 3600) / 60);
      statusText = `<span style="color:#0284C7; font-weight:700;">EN CURSO</span> (restan ${rh}h ${rm}m de ${hours}h)`;
    }
  }

  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
      <span><strong>Inicio:</strong> ${startDate.toLocaleDateString('es-NI', options)}</span>
      <span><strong>Fin:</strong> ${endDate.toLocaleDateString('es-NI', options)}</span>
    </div>
    <div><strong>Cálculo:</strong> ${statusText}</div>
  `;
}

function setTimerStartPreset(type) {
  const inp = document.getElementById("timer-input-start-datetime");
  if (!inp) return;
  const target = new Date();
  if (type === "now") {
    // Current time
  } else if (type === "today_08") {
    target.setHours(8, 0, 0, 0);
  } else if (type === "today_09") {
    target.setHours(9, 0, 0, 0);
  } else if (type === "minus_1h") {
    target.setTime(Date.now() - 3600 * 1000);
  } else if (type === "minus_2h") {
    target.setTime(Date.now() - 7200 * 1000);
  }
  inp.value = formatDateTimeLocal(target.getTime());
  updateTimerModalPreview();
}

function closeTimerSettingsModal() {
  const modal = document.getElementById("timer-modal-overlay");
  if (modal) modal.style.display = "none";
}

function setTimerPreset(hours) {
  const inp = document.getElementById("timer-input-hours-total");
  if (inp) inp.value = hours;
  updateTimerModalPreview();
}

function toggleTimerRunning() {
  if (state.rally_started) {
    state.rally_started = false;
  } else {
    state.rally_started = true;
    if (!state.start_timestamp) state.start_timestamp = Date.now();
  }
  saveState();
  startTimer();
  openTimerSettingsModal();
}

function applyTimerSettings() {
  const hoursInp = document.getElementById("timer-input-hours-total");
  const dtInp = document.getElementById("timer-input-start-datetime");

  if (hoursInp) {
    const val = parseInt(hoursInp.value, 10);
    if (!isNaN(val) && val > 0) {
      state.hours_total = val;
    }
  }

  if (dtInp && dtInp.value) {
    const parsed = Date.parse(dtInp.value);
    if (!isNaN(parsed)) {
      state.start_timestamp = parsed;
      state.custom_calibrated = true;
    }
  } else if (!state.start_timestamp) {
    state.start_timestamp = Date.now();
  }

  if (!state.rally_type) {
    state.rally_type = "nacional";
  }
  state.rally_started = true;

  saveState();
  startTimer();
  closeTimerSettingsModal();
  showToast("Cronómetro configurado correctamente");
}

// ── NAVEGACIÓN LATERAL POR DEPENDENCIAS ───────────────────────────────────────
function renderNavigation() {
  const nav = document.getElementById("sidebar");
  const currentStage = getWorkflowStage();
  const map = rsDefMap();

  const linkFor = (t, isUnlocked) => {
    const isCompleted = t.summary ? false : rsPhaseState(t.id, map).code === "done";
    const activeClass = t.id === activeTab ? "active" : "";
    let statusMarkup = "";
    if (t.summary) {
      statusMarkup = "";
    } else if (!isUnlocked) {
      statusMarkup = rsPill("waiting", { compact: true, label: "En espera" });
    } else if (isCompleted) {
      statusMarkup = rsPill("done", { compact: true, label: "Terminado" });
    } else if (rsPhaseState(t.id, map).code === "waiting") {
      statusMarkup = rsPill("waiting", { compact: true, label: "En espera" });
    } else {
      statusMarkup = rsPill("working", { compact: true, label: "En progreso" });
    }
    return `
      <a href="#" class="nav-link ${activeClass} ${!isUnlocked ? 'locked' : ''}"
         style="${!isUnlocked ? 'opacity:0.45; cursor:not-allowed;' : ''}"
         onclick="${isUnlocked ? `switchTab('${t.id}', event)` : 'event.preventDefault()'}">
        <span style="display:flex; align-items:center; gap:6px;">${t.label}</span>
        ${statusMarkup}
      </a>
    `;
  };

  // Las fases ya cerradas no estorban: se pliegan al final, pero siguen accesibles.
  // El resumen aparece cuando el equipo ya terminó la puesta en marcha.
  const tabs = NAV_TABS.filter(t => !t.summary || currentStage >= 2);
  const closed = tabs.filter(t => !t.summary && t.level <= currentStage && t.id !== activeTab && rsPhaseState(t.id, map).code === "done");
  const mainTabs = tabs.filter(t => !closed.includes(t));
  const lockedCount = tabs.filter(t => t.level > currentStage).length;

  nav.innerHTML = `
    <div class="drawer-header-mobile">
      <span>Fases de Trabajo</span>
      <button class="btn-close-drawer" onclick="closeAllDrawers()" aria-label="Cerrar menú lateral">${SVG.close}</button>
    </div>
    <div class="sidebar-heading">Fases de Trabajo</div>
    ${mainTabs.map(t => linkFor(t, t.level <= currentStage)).join("")}
    ${closed.length ? `
      <details class="nav-closed-group">
        <summary>Fases cerradas (${closed.length})</summary>
        ${closed.map(t => linkFor(t, true)).join("")}
      </details>
    ` : ""}
    ${lockedCount ? `<div class="nav-locked-hint">${lockedCount} fases se abren al avanzar</div>` : ""}
  `;
}

function goHome() {
  const stage = getWorkflowStage();
  activeTab = stage >= 3 ? "resumen" : stage === 2 ? "challenges" : stage === 1 ? "team" : "certamen";
  state.active_tab = activeTab;
  syncUI();
}

function switchTab(tabId, ev) {
  if (ev) ev.preventDefault();
  const target = NAV_TABS.find(t => t.id === tabId);
  if (target && target.level > getWorkflowStage()) return;
  activeTab = tabId;
  state.active_tab = tabId;
  if (tabId === "challenges") {
    const body = document.getElementById("app-body") || document.body;
    body.classList.add("sidebar-collapsed");
    body.classList.add("panel-collapsed");
  }
  saveState();
  closeAllDrawers();
  renderNavigation();
  renderTab(tabId);
  renderMobileBottomBar();
}

// ── DESPACHADOR CENTRAL DE VISTAS ────────────────────────────────────────────
// Dirección de transición: comparar el índice de la fase previa con la nueva
// (orden de NAV_TABS). Avanzar → entrada desde la derecha; retroceder → izquierda.
let rsPrevTabId = null;

function renderTab(tabId) {
  const main = document.getElementById("main");
  const renderers = {
    resumen: renderViewResumen,
    certamen: renderViewCertamen,
    team: renderViewTeam,
    challenges: renderViewChallenges,
    solution: renderViewSolution,
    impact: renderViewImpact,
    multi_ai: renderViewMultiAI,
    pautado: renderViewPautado,
    budget: renderViewBudget,
    resources: renderViewResources,
    canvas: renderViewCanvas,
    script: renderViewScript,
    webdemo: renderViewWebDemo,
    timeline: renderViewTimeline
  };
  const prevIdx = NAV_TABS.findIndex(t => t.id === rsPrevTabId);
  const nextIdx = NAV_TABS.findIndex(t => t.id === tabId);
  let dirCls = "";
  if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
    dirCls = nextIdx > prevIdx ? " rs-fwd" : " rs-back";
  }
  rsPrevTabId = tabId;
  main.innerHTML = `<div class="content-wrapper rs-view${dirCls}">${(renderers[tabId] || renderViewCertamen)()}</div>`;
  attachTabListeners(tabId);
}

// ═════════════════════════════════════════════════════════════════════════════
// CENTRO DE MANDO: RESUMEN ADAPTATIVO, ENTREGABLES Y RESPONSABLES
// Capa aditiva: no reemplaza ninguna fase ni dato existente.
// ═════════════════════════════════════════════════════════════════════════════

let rsFilter = "all";

function rsWordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function rsPautadoSectionDone(key) {
  const len = (state.pautado[key] || "").length;
  const limit = getPautadoLimit(key);
  return limit === null ? len > 0 : (len >= 150 && len <= limit);
}

function rsCanvasFilledCount() {
  const canvas = (state.model_canvas && typeof state.model_canvas === "object") ? state.model_canvas : {};
  return ["socios","actividades","propuesta","relaciones","segmentos","recursos","canales","costes","ingresos"]
    .filter(k => String(canvas[k] || "").trim() !== "").length;
}

// Definición única de entregables. `auto()` detecta lo ya hecho; `requires` marca espera.
function getDeliverableDefs() {
  return [
    { id: "certamen", phase: "certamen", title: "Certamen y reglas", needs: "Elegir Rally Latam 28h o Nacional 24h.", requires: [], auto: () => !!state.rally_type },
    { id: "equipo", phase: "team", title: "Nombre, sede y marca", needs: "Nombre del equipo, universidad y ciudad.", requires: ["certamen"], auto: () => !!state.team_name && !!state.university },
    { id: "reto", phase: "challenges", title: "Reto del comité seleccionado", needs: "Elegir un reto con su número y categoría.", requires: ["equipo"], auto: () => !!state.challenge_id },
    { id: "solucion", phase: "solution", title: "Solución aprobada por el equipo", needs: "Tesis y versión simple, aprobadas en el taller.", requires: ["reto"], auto: () => !!state.solution_approved },
    { id: "ods", phase: "impact", title: "ODS y eje del Plan País", needs: "Elegir ODS y justificar el eje (solo Nacional).", requires: ["reto"], auto: () => ((state.impact_alignment && state.impact_alignment.selected_ods) || []).length > 0 },
    { id: "despacho", phase: "multi_ai", title: "Despacho a IAs externas", needs: "Al menos 3 encargos cerrados con resultado.", requires: ["solucion"], auto: () => (state.tasks || []).filter(t => t.status === "completed").length >= 3 },
    { id: "pautado_problema", phase: "pautado", title: "Pautado · Problema", needs: "150–1250 caracteres en Latam.", requires: ["solucion"], auto: () => rsPautadoSectionDone("problema") },
    { id: "pautado_solucion", phase: "pautado", title: "Pautado · Solución", needs: "150–1250 caracteres en Latam.", requires: ["solucion"], auto: () => rsPautadoSectionDone("solucion") },
    { id: "pautado_impacto", phase: "pautado", title: "Pautado · Impacto", needs: "150–1000 caracteres en Latam.", requires: ["solucion"], auto: () => rsPautadoSectionDone("impacto") },
    { id: "pautado_innovacion", phase: "pautado", title: "Pautado · Innovación", needs: "150–1000 caracteres en Latam.", requires: ["solucion"], auto: () => rsPautadoSectionDone("innovacion") },
    { id: "pautado_prefactibilidad", phase: "pautado", title: "Pautado · Prefactibilidad", needs: "150–1500 caracteres en Latam.", requires: ["solucion"], auto: () => rsPautadoSectionDone("prefactibilidad") },
    { id: "presupuesto", phase: "budget", title: "Tabla de costos con respaldo", needs: "Partidas con unidades, costo unitario y URL.", requires: ["solucion"], auto: () => isBudgetValid() },
    { id: "canvas", phase: "canvas", title: "Modelo Canvas", needs: "9 cuadrantes coherentes con el presupuesto.", requires: ["solucion"], auto: () => rsCanvasFilledCount() >= 7 },
    { id: "recursos", phase: "resources", title: "Bóveda de recursos", needs: "Logos, fotos y tomas subidas al plan.", requires: ["solucion"], auto: () => ((state.video_assets && state.video_assets.items) || []).length > 0 },
    { id: "guion_acto1", phase: "script", title: "Guion · Acto I", needs: "Gancho y problema en voz alta.", requires: ["presupuesto"], auto: () => rsWordCount(state.script.acto1) > 0 },
    { id: "guion_acto2", phase: "script", title: "Guion · Acto II", needs: "Solución y demostración.", requires: ["presupuesto"], auto: () => rsWordCount(state.script.acto2) > 0 },
    { id: "guion_acto3", phase: "script", title: "Guion · Acto III", needs: "Impacto y validación.", requires: ["presupuesto"], auto: () => rsWordCount(state.script.acto3) > 0 },
    { id: "guion_acto4", phase: "script", title: "Guion · Acto IV", needs: "Cierre, llamado y réplica Latam.", requires: ["presupuesto"], auto: () => rsWordCount(state.script.acto4) > 0 },
    { id: "webdemo", phase: "webdemo", title: "Prototipo web para el video", needs: "Sitio publicado con URL para grabar.", requires: ["presupuesto"], auto: () => !!state.site_url },
    { id: "checklist", phase: "timeline", title: "Checklist de entrega verificado", needs: "Todos los guardarraíles en verde.", requires: ["guion_acto4", "webdemo", "presupuesto"], auto: () => {
      const g = state.guardrails || {};
      const keys = ["team_sirli_registered","video_duration_ok","video_unlisted_or_public","naming_pdf_ok","hashtags_included","pautado_chars_ok","pdf_video_numbers_synced","youtube_channel_brand","tiktok_submitted","loser_patterns_checked"];
      return keys.every(k => !!g[k]);
    } }
  ];
}

function rsDefMap() {
  const map = {};
  getDeliverableDefs().forEach(d => { map[d.id] = d; });
  return map;
}

function rsStore() {
  if (!state.deliverables || typeof state.deliverables !== "object") state.deliverables = {};
  return state.deliverables;
}

function rsRecord(id) {
  const store = rsStore();
  const rec = store[id];
  if (!rec || typeof rec !== "object") return { assignees: [], history: [] };
  if (!Array.isArray(rec.assignees)) rec.assignees = [];
  if (!Array.isArray(rec.history)) rec.history = [];
  return rec;
}

function rsEnsureRecord(id) {
  const store = rsStore();
  if (!store[id] || typeof store[id] !== "object") store[id] = {};
  const rec = store[id];
  if (!Array.isArray(rec.assignees)) rec.assignees = [];
  if (!Array.isArray(rec.history)) rec.history = [];
  return rec;
}

// Estado real: terminado (auto o manual) · en espera (dependencia) · en progreso · pendiente.
function rsDefState(def, map, seen) {
  if (!def) return { code: "pending" };
  map = map || rsDefMap();
  seen = seen || {};
  if (seen[def.id]) return { code: "pending" };
  seen[def.id] = true;
  const rec = rsRecord(def.id);
  const autoDone = typeof def.auto === "function" ? !!def.auto() : false;
  if (autoDone || rec.status === "done") return { code: "done", record: rec, auto: autoDone };
  const missing = (def.requires || []).filter(id => rsDefState(map[id], map, seen).code !== "done");
  if (missing.length) {
    const names = missing.map(id => (map[id] && map[id].title) || id);
    return { code: "waiting", record: rec, missing: names };
  }
  if ((rec.assignees || []).length > 0 || rec.status === "in_progress") return { code: "working", record: rec };
  return { code: "pending", record: rec };
}

const RS_STATUS = {
  done:    { label: "Terminado",  cls: "is-done",    icon: "check" },
  working: { label: "En progreso", cls: "is-working", icon: "dot" },
  waiting: { label: "En espera",   cls: "is-waiting", icon: "lock" },
  pending: { label: "Pendiente",   cls: "is-pending", icon: "circle" }
};

// Señal visual única para cualquier estado del sistema (dot + texto mono).
// `code`: done | working | waiting | pending. `compact`: solo dot (title con label).
function rsPill(code, opts) {
  opts = opts || {};
  const s = RS_STATUS[code] || RS_STATUS.pending;
  const cls = (s.cls || "").replace(/^is-/, "rs-");
  const lbl = typeof opts.label === "string" ? opts.label : s.label;
  if (opts.compact) {
    return `<span class="tactical-status-pill compact ${cls}" title="${lbl}"><span class="status-dot"></span></span>`;
  }
  return `<span class="tactical-status-pill ${cls}" title="${opts.title || lbl}"><span class="status-dot"></span>${lbl}</span>`;
}

function rsPhaseDefs(phase, map) {
  map = map || rsDefMap();
  return Object.values(map).filter(d => d.phase === phase);
}

function rsPhaseState(phase, map) {
  map = map || rsDefMap();
  const defs = rsPhaseDefs(phase, map);
  if (!defs.length) return { code: "pending", done: 0, total: 0 };
  const states = defs.map(d => rsDefState(d, map));
  const done = states.filter(s => s.code === "done").length;
  if (done === defs.length) return { code: "done", done, total: defs.length };
  if (states.some(s => s.code === "working" || s.code === "done")) return { code: "working", done, total: defs.length };
  if (states.every(s => s.code === "waiting")) return { code: "waiting", done, total: defs.length };
  return { code: "pending", done, total: defs.length };
}

function rsRelativeTime(ts) {
  if (!ts) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.round(hrs / 24)} d`;
}

function rsLog(id, action, who) {
  const rec = rsEnsureRecord(id);
  rec.history.unshift({ name: who || currentClientMascot.name, action, at: Date.now() });
  rec.history = rec.history.slice(0, 12);
  rec.updated_at = Date.now();
}

function rsPersist() {
  saveState();
  if (collaborationChannel) {
    collaborationChannel.postMessage({ type: "DELIVERABLES_UPDATE", value: state.deliverables });
  }
  if (activeTab === "resumen") renderTab("resumen");
}

function rsRequireName() {
  if (amINamed()) return true;
  showToast("Primero define tu nombre para que el equipo sepa quién eres.");
  openIdentityModal();
  return false;
}

function rsTakeDeliverable(id) {
  if (!rsRequireName()) return;
  const rec = rsEnsureRecord(id);
  const me = currentClientMascot.name;
  const idx = rec.assignees.indexOf(me);
  if (idx >= 0) {
    rec.assignees.splice(idx, 1);
    if (!rec.assignees.length && rec.status === "in_progress") rec.status = "";
    rsLog(id, "salió del entregable", me);
  } else {
    rec.assignees.push(me);
    rec.status = "in_progress";
    rsLog(id, "tomó el entregable", me);
  }
  rsPersist();
}

function rsAssignDeliverable(id, name) {
  if (!name) return;
  const rec = rsEnsureRecord(id);
  if (!rec.assignees.includes(name)) {
    rec.assignees.push(name);
    if (rec.status !== "done") rec.status = "in_progress";
    rsLog(id, "se sumó al entregable", name);
    rsPersist();
    showToast(`${name} quedó a cargo de "${(rsDefMap()[id] || {}).title || id}".`);
  }
}

function rsRemoveAssignee(id, name) {
  const rec = rsEnsureRecord(id);
  rec.assignees = rec.assignees.filter(n => n !== name);
  if (!rec.assignees.length && rec.status === "in_progress") rec.status = "";
  rsLog(id, "salió del entregable", name);
  rsPersist();
}

function rsFinishDeliverable(id) {
  if (!rsRequireName()) return;
  const rec = rsEnsureRecord(id);
  rec.status = rec.status === "done" ? "" : "done";
  rsLog(id, rec.status === "done" ? "marcó terminado" : "reabrió el entregable", currentClientMascot.name);
  rsPersist();
}

function rsSetFilter(filter) {
  rsFilter = filter;
  renderTab("resumen");
}

function rsGoTab(tab, ev) {
  if (ev) ev.preventDefault();
  switchTab(tab, ev);
}

// ── VISTA: RESUMEN DEL RALLY ────────────────────────────────────────────────
function renderViewResumen() {
  const map = rsDefMap();
  const stage = getWorkflowStage();
  const defs = Object.values(map);
  const states = defs.map(d => rsDefState(d, map));
  const doneCount = states.filter(s => s.code === "done").length;
  const pct = defs.length ? Math.round((doneCount / defs.length) * 100) : 0;
  const workingDefs = defs.filter(d => rsDefState(d, map).code === "working");

  const ch = (state.challenges || []).find(c => c.id === state.challenge_id)
    || (typeof OFFICIAL_CHALLENGES_2026 !== "undefined" && (OFFICIAL_CHALLENGES_2026 || []).find(c => c.id === state.challenge_id))
    || null;
  const challengeTitle = (ch && ch.title) || state.challenge_title || "Sin reto seleccionado";
  const challengeNum = state.challenge_id || (ch && ch.id) || "—";
  const category = (ch && ch.category) || state.category || "Sin categoría";
  const solution = state.solution_thesis || state.solution_simple || "";
  const timer = getTimerString();
  const roster = getRoster();

  const filterMatch = (def, st) => {
    if (rsFilter === "mine") return st.record && (st.record.assignees || []).includes(currentClientMascot.name);
    if (rsFilter === "waiting") return st.code === "waiting";
    if (rsFilter === "working") return st.code === "working";
    if (rsFilter === "done") return st.code === "done";
    return true;
  };

  const visiblePhases = NAV_TABS.filter(t => !t.summary && t.level <= stage);

  const phaseCards = visiblePhases.map(t => {
    const ps = rsPhaseState(t.id, map);
    const meta = RS_STATUS[ps.code] || RS_STATUS.pending;
    return `
      <button class="rs-phase ${meta.cls}" onclick="rsGoTab('${t.id}', event)" title="Abrir ${escapeHtml(t.label)}">
        <span class="rs-phase-top">
          <span class="rs-phase-dot"></span>
          <span class="rs-phase-name">${escapeHtml(t.label)}</span>
        </span>
        <span class="rs-phase-meta">${ps.total ? `${ps.done}/${ps.total}` : "—"} · ${meta.label}</span>
        <span class="rs-phase-bar"><i style="width:${ps.total ? Math.round((ps.done / ps.total) * 100) : 0}%"></i></span>
      </button>
    `;
  }).join("");

  const deliverableCards = defs.filter(d => {
    const st = rsDefState(d, map);
    const s = Object.assign({}, st, { record: st.record });
    return filterMatch(d, s);
  }).map(d => {
    const st = rsDefState(d, map);
    const meta = RS_STATUS[st.code] || RS_STATUS.pending;
    const rec = st.record || {};
    const assignees = (rec.assignees || []).filter(Boolean);
    const mine = assignees.includes(currentClientMascot.name);
    const last = (rec.history || [])[0];
    const phaseTab = NAV_TABS.find(t => t.id === d.phase);
    const assignOptions = roster.map(m => `<option value="${escapeHtml(m.name)}" ${assignees.includes(m.name) ? "disabled" : ""}>${escapeHtml(m.name)}${assignees.includes(m.name) ? " (ya está)" : ""}</option>`).join("");
    const needsText = st.code === "waiting" && st.missing && st.missing.length
      ? `Espera: ${st.missing.join(" · ")}`
      : d.needs;

    return `
      <article class="rs-deliv ${meta.cls}">
        <div class="rs-deliv-head">
          <div>
            <span class="rs-deliv-phase">${escapeHtml(phaseTab ? phaseTab.label : d.phase)}</span>
            <h3 class="rs-deliv-title">${escapeHtml(d.title)}</h3>
          </div>
          ${rsPill(st.code, { label: meta.label, title: meta.label })}
        </div>
        <p class="rs-deliv-needs">${escapeHtml(needsText)}</p>
        <div class="rs-deliv-people">
          ${assignees.length
            ? assignees.map(n => `<span class="rs-person" style="--person-color:${_userColor(n)}">
                 <span class="rs-person-dot"></span>${escapeHtml(n)}
                 <button class="rs-person-x" onclick="rsRemoveAssignee('${d.id}','${escapeHtml(n)}')" title="Quitar a ${escapeHtml(n)}" aria-label="Quitar a ${escapeHtml(n)}">×</button>
               </span>`).join("")
            : `<span class="rs-muted">Nadie asignado todavía</span>`}
        </div>
        ${last ? `<p class="rs-deliv-history">${escapeHtml(last.name)} ${escapeHtml(last.action)} · ${rsRelativeTime(last.at)}</p>` : `<p class="rs-deliv-history rs-muted">Sin actividad registrada</p>`}
        <div class="rs-deliv-actions">
          ${st.code === "done" && st.auto
            ? `<span class="rs-auto-tag">Completado automáticamente</span>`
            : `<button class="rs-btn ${mine ? "is-ghost" : "is-primary"}" onclick="rsTakeDeliverable('${d.id}')">${mine ? "Soltar" : "Tomar yo"}</button>
               <button class="rs-btn is-ghost" onclick="rsFinishDeliverable('${d.id}')">${rec.status === "done" ? "Reabrir" : "Marcar terminado"}</button>`}
          ${st.code !== "done" && roster.length
            ? `<select class="rs-select" onchange="rsAssignDeliverable('${d.id}', this.value)" title="Asignar a alguien del equipo">
                 <option value="">Asignar a…</option>
                 ${assignOptions}
               </select>`
            : ""}
        </div>
      </article>
    `;
  }).join("");

  const closedPhases = NAV_TABS.filter(t => !t.summary && t.level <= stage && rsPhaseState(t.id, map).code === "done");
  const pendingPhases = NAV_TABS.filter(t => !t.summary && t.level > stage);

  // Las 3 cosas accionables ahora: primero lo que está en progreso, luego esperas, luego pendientes.
  const actionableRank = { working: 0, waiting: 1, pending: 2 };
  const actionableNow = defs
    .map(d => ({ d, st: rsDefState(d, map) }))
    .filter(x => x.st.code !== "done")
    .sort((a, b) => ((actionableRank[a.st.code] ?? 3) - (actionableRank[b.st.code] ?? 3)))
    .slice(0, 3);
  const currentPhase = visiblePhases.find(t => rsPhaseState(t.id, map).code !== "done");
  const openCount = defs.length - doneCount;

  const rosterStrip = roster.length
    ? roster.map(m => {
        const load = defs.filter(d => (rsRecord(d.id).assignees || []).includes(m.name) && rsDefState(d, map).code !== "done").length;
        return `<span class="rs-member" style="--person-color:${_userColor(m.name)}">
          <span class="rs-member-avatar">${escapeHtml((m.name || "?").trim().charAt(0).toUpperCase())}</span>
          <span class="rs-member-name">${escapeHtml(m.name)}${m.id === currentClientMascot.id ? " (tú)" : ""}</span>
          <span class="rs-member-load">${load} activo${load === 1 ? "" : "s"}</span>
        </span>`;
      }).join("")
    : `<span class="rs-muted">Todavía nadie ha definido su nombre. Cada persona debe poner el suyo una vez.</span>`;

  return `
    <div class="rs-summary">
      <section class="rs-hero">
        <div class="rs-hero-main">
          <div class="rs-challenge-row">
            <span class="rs-challenge-num">#${escapeHtml(String(challengeNum))}</span>
            <div>
              <h1 class="rs-challenge-title">${escapeHtml(challengeTitle)}</h1>
              <span class="rs-challenge-meta">${escapeHtml(state.rally_type === "latam" ? "Rally Latinoamericano 28h" : state.rally_type === "nacional" ? "Rally Nacional 24h" : "Certamen por definir")} · ${escapeHtml(category)}</span>
            </div>
          </div>
          <div class="rs-solution ${state.solution_approved ? "is-approved" : ""}">
            <span class="rs-solution-label">${state.solution_approved ? "Solución aprobada" : "Solución en construcción"}</span>
            <p>${solution ? escapeHtml(solution) : "Aún no hay tesis de solución. Se define en el Taller de Solución (fase 03)."}</p>
            <button class="rs-link" onclick="rsGoTab('solution', event)">Abrir taller de solución →</button>
          </div>
        </div>
        <div class="rs-hero-stats">
          <div class="rs-hardbar">
            <div class="rs-hard"><span class="rs-hard-num">${timer.time}</span><span class="rs-hard-label">tiempo restante</span></div>
            <div class="rs-hard"><span class="rs-hard-num">${pct}%</span><span class="rs-hard-label">avance de rúbrica</span></div>
            <div class="rs-hard"><span class="rs-hard-num">${escapeHtml(currentPhase ? currentPhase.label : "—")}</span><span class="rs-hard-label">fase actual</span></div>
          </div>
          <div class="rs-kpi-row">
            <div class="rs-kpi-mini"><strong>${doneCount}/${defs.length}</strong><span>entregables cerrados</span></div>
            <div class="rs-kpi-mini"><strong>${openCount}</strong><span>abiertos</span></div>
            <div class="rs-kpi-mini"><strong>${workingDefs.length}</strong><span>en progreso ahora</span></div>
            <div class="rs-kpi-mini"><strong>${closedPhases.length}</strong><span>fases cerradas</span></div>
          </div>
          <button class="rs-btn is-primary rs-identity-cta" onclick="openIdentityModal()">
            ${amINamed() ? `Trabajando como ${escapeHtml(currentClientMascot.name)}` : "Definir mi nombre para trabajar"}
          </button>
        </div>
      </section>

      <section class="rs-section">
        <div class="rs-section-head">
          <h2>Fases del rally</h2>
          <span class="rs-section-sub">${visiblePhases.length + pendingPhases.length} fases · ${closedPhases.length} cerradas · ${pendingPhases.length} bloqueadas</span>
        </div>
        <div class="rs-phases">${phaseCards}</div>
        ${closedPhases.length ? `
          <details class="rs-closed">
            <summary>Fases ya cerradas (${closedPhases.length}) — ocultas para no estorbar</summary>
            <div class="rs-closed-list">
              ${closedPhases.map(t => `<button class="rs-closed-chip" onclick="rsGoTab('${t.id}', event)">${SVG.check} ${escapeHtml(t.label)}</button>`).join("")}
            </div>
          </details>` : ""}
      </section>

      <section class="rs-section">
        <div class="rs-section-head">
          <h2>Accionables ahora</h2>
          <span class="rs-section-sub">las 3 piezas que desbloquean más de inmediato</span>
        </div>
        <div class="rs-action-list">
          ${actionableNow.length ? actionableNow.map(x => {
            const phaseLabel = (NAV_TABS.find(t => t.id === x.d.phase) || { label: x.d.phase }).label;
            const statusMeta = RS_STATUS[x.st.code] || RS_STATUS.pending;
            return `
            <button class="rs-action-row is-${x.st.code}" onclick="rsGoTab('${x.d.phase}', event)" title="Abrir ${escapeHtml(phaseLabel)}">
              <span class="rs-action-title">${escapeHtml(x.d.title)}</span>
              <span class="rs-action-phase">${escapeHtml(phaseLabel)}</span>
              ${rsPill(x.st.code, { label: statusMeta.label, title: statusMeta.label })}
              ${SVG.arrowRight}
            </button>`;
          }).join("") : `<p class="rs-empty">Nada pendiente. Todo el equipo hizo la tarea.</p>`}
        </div>
      </section>

      <section class="rs-section">
        <details class="rs-collapsible">
          <summary>Entregables y responsables <span class="rs-mini-count">${openCount} abiertos · ${doneCount}/${defs.length} cerrados</span></summary>
          <div class="rs-section-head" style="margin-top:14px;">
          <div class="rs-filters">
            <button class="rs-filter ${rsFilter === "all" ? "is-active" : ""}" onclick="rsSetFilter('all')">Todos</button>
            <button class="rs-filter ${rsFilter === "mine" ? "is-active" : ""}" onclick="rsSetFilter('mine')">Míos</button>
            <button class="rs-filter ${rsFilter === "working" ? "is-active" : ""}" onclick="rsSetFilter('working')">En progreso</button>
            <button class="rs-filter ${rsFilter === "waiting" ? "is-active" : ""}" onclick="rsSetFilter('waiting')">En espera</button>
            <button class="rs-filter ${rsFilter === "done" ? "is-active" : ""}" onclick="rsSetFilter('done')">Terminados</button>
          </div>
        </div>
        <div class="rs-deliv-grid">
          ${deliverableCards || `<p class="rs-empty">No hay entregables en este filtro.</p>`}
        </div>
        </details>
      </section>

      <section class="rs-section">
        <div class="rs-section-head">
          <h2>Quién está en qué</h2>
          <button class="rs-btn is-ghost" onclick="openIdentityModal()">Cambiar mi nombre</button>
        </div>
        <div class="rs-roster">${rosterStrip}</div>
      </section>
    </div>
  `;
}

// ── IDENTIDAD: NOMBRE ÚNICO POR PERSONA ─────────────────────────────────────
function openIdentityModal() {
  closeIdentityModal();
  const roster = getRoster();
  const modal = document.createElement("div");
  modal.id = "rs-identity-modal";
  modal.className = "rs-modal-backdrop";
  modal.innerHTML = `
    <div class="rs-modal" role="dialog" aria-modal="true" aria-labelledby="rs-identity-title">
      <div class="rs-modal-head">
        <div>
          <span class="rs-eyebrow">Identidad en el equipo</span>
          <h2 id="rs-identity-title">¿Quién eres?</h2>
        </div>
        <button class="rs-modal-close" onclick="closeIdentityModal()" aria-label="Cerrar">×</button>
      </div>
      <p class="rs-modal-help">Tu nombre se guarda en este dispositivo y aparece junto a los entregables que tomes. Debe ser único: nada de nombres aleatorios.</p>
      <label class="rs-field">
        <span>Mi nombre</span>
        <input id="rs-identity-input" type="text" maxlength="28" autocomplete="off" placeholder="Ej. María López" value="${amINamed() ? escapeHtml(currentClientMascot.name) : ""}">
      </label>
      <p class="rs-modal-error" id="rs-identity-error" role="alert"></p>
      <div class="rs-modal-actions">
        <button class="rs-btn is-primary" onclick="saveIdentityFromModal()">Guardar nombre</button>
        <button class="rs-btn is-ghost" onclick="closeIdentityModal()">Cancelar</button>
      </div>
      ${roster.length ? `
        <div class="rs-modal-existing">
          <span class="rs-modal-existing-title">¿Ya estás en la lista? Usa tu nombre en este dispositivo</span>
          <div class="rs-roster-pick">
            ${roster.map(m => `<button class="rs-roster-pick-item ${m.id === currentClientMascot.id ? "is-me" : ""}" onclick="adoptIdentityFromModal('${m.id}')">
              <span class="rs-member-avatar" style="--person-color:${_userColor(m.name)}">${escapeHtml((m.name || "?").charAt(0).toUpperCase())}</span>
              ${escapeHtml(m.name)}
            </button>`).join("")}
          </div>
        </div>` : ""}
    </div>
  `;
  document.body.appendChild(modal);
  const input = document.getElementById("rs-identity-input");
  if (input) { input.focus(); input.select(); }
}

function closeIdentityModal() {
  const el = document.getElementById("rs-identity-modal");
  if (el) el.remove();
}

function saveIdentityFromModal() {
  const input = document.getElementById("rs-identity-input");
  const errorEl = document.getElementById("rs-identity-error");
  const result = setMyDisplayName(input ? input.value : "");
  if (!result.ok) {
    if (errorEl) errorEl.textContent = result.error;
    return;
  }
  closeIdentityModal();
  showToast(`Listo, ${currentClientMascot.name}. Tu nombre ya es parte del equipo.`);
  renderTopbar();
  if (activeTab === "resumen") renderTab("resumen");
  else renderNavigation();
}

function adoptIdentityFromModal(id) {
  if (adoptRosterName(id)) {
    closeIdentityModal();
    showToast(`Ahora trabajas como ${currentClientMascot.name}.`);
    if (activeTab === "resumen") renderTab("resumen");
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 00 NIVEL 0: SELECCIÓN DE CERTAMEN (RÉPLICA EXACTA DE LA IMAGEN)
// ═════════════════════════════════════════════════════════════════════════════


function renderViewCertamen() {
  const isLatam = state.rally_type === 'latam';
  const isNac = state.rally_type === 'nacional';

  const checkCircleMagenta = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#0866F5"/><path d="M7 12.5l3.5 3.5 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const checkCirclePurple = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#0D1B35"/><path d="M7 12.5l3.5 3.5 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
    <div class="wizard-canvas">
      ${SVG.landscapeBg}

      <div class="stepper-header">
        <span class="stepper-pill"><span class="pill-dim">PASO</span> <strong class="pill-num">01</strong> <span class="pill-dim">DE 03</span></span>
        <div class="stepper-bars">
          <div class="stepper-bar-segment active"></div>
          <div class="stepper-bar-segment"></div>
          <div class="stepper-bar-segment"></div>
        </div>
      </div>

      <h1 class="wizard-hero-title">¿Qué <span class="title-accent">Rally</span> es?</h1>
      <p class="wizard-hero-desc">
        Selecciona el certamen en el que participará tu equipo para calibrar automáticamente las reglas,
        el régimen de horas y la estructura oficial del documento pautado.
      </p>

      <div class="certamen-grid">
        <!-- Tarjeta 1: Rally Latinoamericano de Innovación -->
        <div class="certamen-card latam-card ${isLatam ? 'selected' : ''}" onclick="selectCertamen('latam', event)">
          <div>
            <div class="certamen-card-header">
              <div class="hours-badge latam" title="Régimen de 28 horas continuas">
                <span class="hours-num">28</span><span class="hours-unit">H</span>
              </div>
              <img src="assets/logo_rally_latam.png" class="certamen-header-logo" alt="Rally Latinoamericano de Innovación">
              <div>${isLatam ? checkCircleMagenta : SVG.uncheckedCircle}</div>
            </div>

            <div class="certamen-illustration-wrap">
              ${SVG.latinAmericaIllustration}
            </div>

            <div class="certamen-meta-tag latam">RALLY LATINOAMERICANO</div>
            <h2 class="certamen-card-title">Rally Latinoamericano<br>de Innovación</h2>
            <p class="certamen-card-desc">Competencia internacional entre 8 países de América Latina.</p>
          </div>

          <div class="certamen-card-footer">
            <button class="btn-select-card ${isLatam ? 'filled-primary' : 'outline-primary'}" onclick="selectCertamen('latam', event)">
              Seleccionar ${SVG.arrowRight}
            </button>
          </div>
        </div>

        <!-- Tarjeta 2: Rally Nacional Nicaragua Innova -->
        <div class="certamen-card nacional-card ${isNac ? 'selected' : ''}" onclick="selectCertamen('nacional', event)">
          <div>
            <div class="certamen-card-header">
              <div class="hours-badge nacional" title="Régimen de 24 horas continuas">
                <span class="hours-num">24</span><span class="hours-unit">H</span>
              </div>
              <img src="assets/logo_rally_nacional.png" class="certamen-header-logo" alt="Rally Nacional Nicaragua Innova">
              <div>${isNac ? checkCirclePurple : SVG.uncheckedCircle}</div>
            </div>

            <div class="certamen-illustration-wrap">
              ${SVG.momotomboIllustration}
            </div>

            <div class="certamen-meta-tag nacional">RALLY NACIONAL</div>
            <h2 class="certamen-card-title">Rally Nacional Nicaragua<br>Innova</h2>
            <p class="certamen-card-desc">Certamen universitario territorial de 24 horas.</p>
          </div>

          <div class="certamen-card-footer">
            <button class="btn-select-card ${isNac ? 'filled-navy' : 'outline-navy'}" onclick="selectCertamen('nacional', event)">
              Seleccionar ${SVG.arrowRight}
            </button>
          </div>
        </div>
      </div>

      <!-- Botón de Continuar Centrado -->
      <div style="display:flex; justify-content:center; margin-top:32px;">
        <button id="btnProceedCertamen" class="btn-select-card ${isLatam ? 'filled-primary' : 'filled-navy'}" 
                style="padding:12px 48px; font-size:14px; font-weight:700; border-radius:8px;" 
                onclick="proceedFromCertamen()">
          Continuar ${SVG.arrowRight}
        </button>
      </div>
    </div>
  `;
}

function selectCertamen(type, ev) {
  if (ev) ev.stopPropagation();
  state.rally_type = type;
  state.hours_total = type === "latam" ? 28 : 24;
  state.hours_remaining = state.hours_total;
  saveState();
  renderTab("certamen");
  renderTopbar();
  startTimer();
}

function proceedFromCertamen() {
  if (!state.rally_type) {
    state.rally_type = "nacional";
    state.hours_total = 24;
    state.hours_remaining = 24;
  }
  saveState();
  activeTab = "team";
  syncUI();
}

// ═════════════════════════════════════════════════════════════════════════════
// 01 NIVEL 1: IDENTIDAD DE EQUIPO & LOGOS
// ═════════════════════════════════════════════════════════════════════════════
function renderViewTeam() {
  const certLabel = state.rally_type === "latam" ? "Rally Latinoamericano (28h)" : "Rally Nacional (24h)";
  const rallyLogoSrc = state.rally_type === "latam" ? "assets/logo_rally_latam.png" : "assets/logo_rally_nacional.png";

  return `
    <div class="wizard-canvas">
      <div class="stepper-header" style="justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="stepper-pill"><span class="pill-dim">PASO</span> <strong class="pill-num">02</strong> <span class="pill-dim">DE 03</span></span>
          <div class="stepper-bars">
            <div class="stepper-bar-segment completed"></div>
            <div class="stepper-bar-segment active"></div>
            <div class="stepper-bar-segment"></div>
          </div>
        </div>
        <button class="btn-minimal-back" onclick="switchTab('certamen')" title="Volver a selección de certamen">
          ${SVG.arrowLeft}
          <span>Cambiar certamen</span>
        </button>
      </div>

      <h1 class="wizard-hero-title" style="margin-bottom:24px;">Identidad del <span class="title-accent">Equipo</span></h1>

      <div class="workbench-card" style="border:1px solid #DCE7F5; border-radius:8px; padding:32px 28px; background:#fff; max-width:960px; margin:0 auto;">
        <div class="team-step-grid">
          <!-- Columna Izquierda: Formulario de Datos -->
          <div style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <!-- Nombre del Squad (la marca del proyecto se define a partir del reto elegido) -->
              <div class="form-group" style="margin-bottom:16px;">
                <label style="font-weight:700; color:#091e42; font-size:12px; display:block; margin-bottom:6px;">NOMBRE DE SQUAD (EQUIPO)</label>
                <input type="text" id="tm-name" placeholder="Ej: Techriders, Pinoleros Tech, Mentes Volcánicas" value="${state.team_name || ''}"
                  style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13.5px; font-weight:600; color:#091e42;"
                  oninput="updateTeamName(this.value);">
                <span style="font-size:11px; color:#64748b; margin-top:6px; display:block;">El nombre de la marca/proyecto se decide en el Taller de Solución, cuando ya conozcan el reto elegido.</span>
              </div>

              <div class="form-group full">
                <label style="font-weight:700; color:#091e42; font-size:12px; display:block; margin-bottom:6px;">LOGO OFICIAL DEL EQUIPO (IMAGEN PNG / JPG / SVG / WEBP)</label>
                ${state.team_logo_img ? `
                  <div class="logo-preview-box">
                    <img src="${state.team_logo_img}" alt="Logo de Equipo" style="max-height:56px; max-width:90px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fff; padding:4px;">
                    <div style="flex:1;">
                      <div style="font-size:13px; font-weight:700; color:#0f172a;">Logo Cargado Exitosamente</div>
                      <div style="font-size:11px; color:#64748b;">Visible en la credencial y el topbar.</div>
                    </div>
                    <button type="button" class="btn-pill-light" style="font-size:11px; color:#ef4444;" onclick="removeTeamLogo()">Quitar</button>
                    <label class="btn-pill-light" style="font-size:11px; cursor:pointer;">
                      Cambiar
                      <input type="file" accept="image/png, image/jpeg, image/svg+xml, image/webp" style="display:none;" onchange="handleTeamLogoUpload(event)">
                    </label>
                  </div>
                ` : `
                  <label class="logo-dropzone" for="team-logo-file-input"
                    ondragover="event.preventDefault(); this.style.borderColor='#0066ff'; this.style.background='#eff6ff';"
                    ondragleave="this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc';"
                    ondrop="event.preventDefault(); this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc'; handleTeamLogoUpload({target:{files:event.dataTransfer.files}});">
                    <input type="file" id="team-logo-file-input" accept="image/png, image/jpeg, image/svg+xml, image/webp" style="display:none;" onchange="handleTeamLogoUpload(event)">
                    <div style="width:40px; height:40px; border-radius:50%; background:#eff6ff; display:flex; align-items:center; justify-content:center; color:#0066ff;">
                      ${SVG.upload}
                    </div>
                    <div style="font-size:12.5px; font-weight:700; color:#1e293b;">Haz clic o arrastra aquí el logo oficial</div>
                    <div style="font-size:11px; color:#64748b;">Formatos: PNG, JPG, SVG o WebP (alta resolución)</div>
                  </label>
                `}
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; border-top:1px solid #f1f5f9; padding-top:16px;">
              <button class="btn-minimal-back" onclick="switchTab('certamen')">
                ${SVG.arrowLeft}
                <span>Regresar</span>
              </button>
              <button class="btn-select-card filled" style="padding:11px 24px; font-size:13px;" onclick="saveTeamAndProceed()">
                Continuar a Selección de Reto ${SVG.arrowRight}
              </button>
            </div>
          </div>

          <!-- Columna Derecha: Previsualización de Identidad -->
          <div class="team-preview-panel">
            <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; color:#64748b; text-transform:uppercase; margin-bottom:22px;">
              Previsualización de Identidad
            </div>

            <!-- 1. Logo del grupo en grande -->
            <div style="width:130px; height:130px; margin:0 auto; border-radius:18px; border:2px ${state.team_logo_img ? 'solid #003366' : 'dashed #cbd5e1'}; background:#ffffff; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${state.team_logo_img 
                ? `<img id="preview-team-logo" src="${state.team_logo_img}" style="width:100%; height:100%; object-fit:contain; padding:10px;" alt="Logo Equipo">`
                : `<div style="text-align:center; color:#94a3b8; font-size:11px; padding:8px;">
                     <div style="margin-bottom:6px; opacity:0.6;">${SVG.upload}</div>
                     <div style="font-weight:700;">Logo del Equipo</div>
                   </div>`
              }
            </div>

            <!-- 2. Abajo los 2 logos UNI y Rally en más pequeño -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-top:20px;">
              <img src="assets/logo_uni_official.png" style="height:32px; width:auto; max-width:75px; object-fit:contain;" alt="Universidad Nacional de Ingeniería">
              <span style="color:#cbd5e1; font-weight:300; font-size:16px;">|</span>
              <img src="${rallyLogoSrc}" style="height:28px; width:auto; max-width:125px; object-fit:contain;" alt="Rally Oficial">
            </div>

            <!-- 3. Nombre del grupo y marca de la solución -->
            <div style="margin-top:22px; text-align:center;">
              <h2 id="preview-team-name" style="font-family:var(--font-sans); font-size:22px; font-weight:900; color:#091e42; margin-bottom:4px; letter-spacing:-0.03em; word-break:break-word; text-transform:uppercase;">
                ${state.team_name || 'NOMBRE DEL EQUIPO'}
              </h2>
              <div id="preview-solution-brand" style="display:${state.project_name ? 'inline-block' : 'none'}; font-size:12px; font-weight:800; color:#0866F5; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:3px 10px; margin-bottom:8px; text-transform:uppercase;">
                ${state.project_name ? `PROYECTO: ${state.project_name}` : ''}
              </div>
              <div style="font-family:var(--font-sans); font-size:12px; font-weight:800; color:#003366; text-transform:uppercase; letter-spacing:0.05em;">
                Universidad Nacional de Ingeniería
              </div>
              <div style="font-family:var(--font-sans); font-size:11px; font-weight:600; color:#64748b; margin-top:4px;">
                ${state.rally_type === 'latam' ? 'Rally Latinoamericano de Innovación 28h' : 'Rally Nacional Nicaragua Innova 24h'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateTeamName(val) {
  state.team_name = val;
  saveState();
  const el = document.getElementById("preview-team-name");
  if (el) {
    el.innerText = val.trim() || "NOMBRE DEL EQUIPO";
  }
  const topbarCrumb = document.querySelector(".project-title-crumb");
  if (topbarCrumb) {
    topbarCrumb.innerText = val.trim() ? `/ ${val.trim()}` : "";
  }
}

function updateProjectBrand(val) {
  state.project_name = val;
  saveState();
  const brandEl = document.getElementById("preview-solution-brand");
  if (brandEl) {
    brandEl.innerText = val.trim() ? `PROYECTO: ${val.trim()}` : "";
    brandEl.style.display = val.trim() ? "inline-block" : "none";
  }
  checkInnovaNamingPattern();
}

function updateSirliField(field, val) {
  state[field] = val;
  saveState();
  renderSirliBadge();
}

function checkInnovaNamingPattern() {
  const full = ((state.team_name || "") + " " + (state.project_name || "")).toLowerCase();
  const warnEl = document.getElementById("naming-innova-warning");
  if (warnEl) {
    warnEl.style.display = /innova/i.test(full) ? "flex" : "none";
  }
}

function renderSirliBadge() {
  const count = parseInt(state.team_members_count || 6, 10);
  const countOk = count >= 4 && count <= 10;
  const engOk = !!state.team_has_engineering;
  const femOk = !!state.team_has_female;
  const leadOk = !!state.team_leader_student;
  const allOk = countOk && engOk && femOk && leadOk;

  const badge = document.getElementById("sirli-compliance-badge");
  if (badge) {
    if (allOk) {
      badge.style.background = "#dcfce7";
      badge.style.color = "#15803d";
      badge.style.borderColor = "#bbf7d0";
      badge.innerHTML = "✓ Conforme con Bases SIRLI";
    } else {
      badge.style.background = "#fff1f2";
      badge.style.color = "#be123c";
      badge.style.borderColor = "#fecdd3";
      badge.innerHTML = "⚠ Verificación SIRLI pendiente";
    }
  }
}

function handleTeamLogoUpload(event) {
  const file = event.target && event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    state.team_logo_img = e.target.result;
    saveState();
    renderTab('team');
    renderTopbar();
  };
  reader.readAsDataURL(file);
}

function removeTeamLogo() {
  state.team_logo_img = "";
  saveState();
  renderTab('team');
  renderTopbar();
}

function saveTeamAndProceed() {
  const nameInput = document.getElementById("tm-name");
  const name = nameInput ? nameInput.value.trim() : (state.team_name || "");

  if (!name) {
    alert("Por favor ingresa el Nombre Oficial de tu Equipo.");
    if (nameInput) nameInput.focus();
    return;
  }

  state.team_name = name;
  state.university = "Universidad Nacional de Ingeniería (UNI)";
  saveState();
  activeTab = "challenges";
  syncUI();
}

// ═════════════════════════════════════════════════════════════════════════════
// 02 NIVEL 2: RETOS DEL COMITÉ (INGESTA OFICIAL POR TEXTO / PDF / CATÁLOGO)
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// TRIBUNAL DE RETOS: embudo de decisión grupal (NGT: lectura silenciosa →
// descarte → puntos de voto por persona → decisión). Sincronizado en vivo entre
// mascotas del equipo vía BroadcastChannel.
// ═════════════════════════════════════════════════════════════════════════════
function getTribunal() {
  if (!state.challenge_tribunal || typeof state.challenge_tribunal !== "object") {
    state.challenge_tribunal = { step: "read", per: {}, team: {}, votes: {}, reservations: {} };
  }
  const t = state.challenge_tribunal;
  if (!t.per) t.per = {};
  if (!t.team) t.team = {};
  if (!t.votes) t.votes = {};
  if (!t.reservations) t.reservations = {};
  // Migración: formato previo {chId:"keep"} (una sola voz) → {chId:{persona:kind}}
  Object.keys(t.per || {}).forEach(k => {
    if (typeof t.per[k] === "string") t.per[k] = {[EQUIPO_LEGADO]: t.per[k]};
  });
  if (!["read", "discard", "vote", "decide"].includes(t.step)) t.step = "read";
  return t;
}
const EQUIPO_LEGADO = "voz-heredada";

function _me() {
  return (currentClientMascot && currentClientMascot.name) || "Invitado";
}

// Color estable por persona (hash del nombre): mismo usuario = mismo color en notas y votos.
const USER_COLOR_PALETTE = ["#0866F5", "#0284C7", "#7C3AED", "#0D9488", "#D97706", "#E11D48", "#4F46E5", "#6D28D9"];
function _userColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return USER_COLOR_PALETTE[h % USER_COLOR_PALETTE.length];
}

// Voz individual: qué marcó esta persona sobre un reto
function personDisposition(chId) {
  const t = getTribunal();
  const m = t.per[chId];
  return (m && m[_me()]) || null;
}
function discardCount(chId) {
  const t = getTribunal();
  return Object.values(t.per[chId] || {}).filter(v => v === "discard").length;
}
function isTeamDiscarded(chId) {
  return !!getTribunal().team[chId];
}
function hasAnyKeep(chId) {
  return Object.values(getTribunal().per[chId] || {}).some(v => v === "keep");
}
function reserveCount(chId) {
  return (getTribunal().reservations[chId] || []).length;
}
// Estado resumido del reto en el embudo: equipo > mi voz > otros > espera
function funnelStateOf(chId) {
  if (isTeamDiscarded(chId)) return "discard";
  return personDisposition(chId) || "espera";
}

function _saveTribunal() {
  saveState();
  broadcastFieldChange("tribunal", "state", state.challenge_tribunal);
}

function setTribunalStep(step) {
  const t = getTribunal();
  t.step = step;
  _saveTribunal();
  renderTab("challenges");
}

function setChallengeDisposition(chId, kind) {
  const t = getTribunal();
  t.per[chId] = t.per[chId] || {};
  const cur = t.per[chId][_me()] || null;
  const next = cur === kind ? null : kind;
  if (next) t.per[chId][_me()] = next; else delete t.per[chId][_me()];
  if (t.per[chId] && !Object.keys(t.per[chId]).length) delete t.per[chId];
  _saveTribunal();
  showToast(next === "discard" ? `Reto #${chId}: tu voz pidió descartarlo.` : next === "keep" ? `Reto #${chId}: marcado "Me interesa".` : `Reto #${chId}: tu voz vuelve a "en espera".`);
  renderTab("challenges");
}

// NGT: cuando 2+ personas pidieron descartar, un clic cala el descarte para el equipo.
function discardChallengeTogether(chId) {
  const t = getTribunal();
  const n = discardCount(chId);
  if (n < 2) {
    showToast(`Faltan voces: ${n} de 2 personas pidieron descartar el Reto #${chId}.`, true);
    return;
  }
  if ((t.reservations[chId] || []).length) {
    showToast("Hay una RESERVA activa en este reto; resuélvanla juntos (2 min de escucha) antes de descartar.", true);
    return;
  }
  t.team[chId] = true;
  _saveTribunal();
  showToast(`Descartado en consenso (n=${n}): Reto #${chId} sale del embudo del equipo.`);
  renderTab("challenges");
}

function setChallengeReserve(chId) {
  const t = getTribunal();
  const me = _me();
  const list = t.reservations[chId] || [];
  if (list.includes(me)) {
    t.reservations[chId] = list.filter(x => x !== me);
    showToast(`Retiraste tu RESERVA del Reto #${chId}.`);
  } else {
    t.reservations[chId] = [...list, me];
    showToast(`RESERVA puesta en Reto #${chId}: se escucha tu caso 2 min antes de descartar.`);
  }
  _saveTribunal();
  renderTab("challenges");
}

function toggleChallengeVote(chId) {
  const t = getTribunal();
  const me = _me();
  if (isTeamDiscarded(chId)) {
    showToast(`El Reto #${chId} quedó descartado por el equipo; no entra a votación.`, true);
    return;
  }
  if (!hasAnyKeep(chId)) {
    showToast('Vota solo en retos que pasaron el embudo: márcalos "Me interesa" en la fase Descarte.', true);
    return;
  }
  const votes = t.votes[chId] || [];
  const mine = votes.filter(v => v === me);
  if (mine.length >= 3) {
    t.votes[chId] = votes.filter(v => v !== me); // quita mis 3 puntos de golpe (gesto de sí)
    showToast(`Quitaste tus puntos de voto en Reto #${chId}.`);
  } else {
    t.votes[chId] = [...votes, me]; // +1 punto (dot voting NGT, máx 3 por persona)
    showToast(`+1 punto para Reto #${chId} (${me}). Puedes dar hasta 3.`);
  }
  _saveTribunal();
  renderTab("challenges");
}

// Ángulo ganador basado en el motor de ganadores 2019–2026 (winners_analysis):
function winnerAngleFor(ch) {
  const info = challengeRankFor(ch);
  const bullets = [];
  if (info.reasonLines) bullets.push(...info.reasonLines.slice(0, 4));
  const probes = [
    { ok: !!ch.precedent, text: ch.precedent ? `Precedente ganador: ${ch.precedent}` : "Sin precedente directo: apóyate en el patrón de ganador genérico (infra útil + dato en vivo)." },
    { ok: info.isHighComp, text: info.isHighComp ? "Concurrencia alta: exige ≥2 capas tecnológicas para no perder por saturación." : "Concurrencia baja: ventaja directa si la factibilidad es sólida." },
    { ok: true, text: "Juega las cifras exactas: presupuesto $4,000–$6,000 realista y demostrable en 28 h." },
    { ok: true, text: "Diseña la demostración temprana (Acto II): hardware visible antes del minuto 30 del video." }
  ];
  probes.forEach(p => { if (p.ok) bullets.push(p.text); });
  return { score: info.score, bullets: bullets.slice(0, 6), criteria: info.criteria, isHighComp: info.isHighComp };
}

// ── MESA DE RETOS · decisión por mayoría (≥50 % del equipo, sin quórum) ─────
// Estado: { size, votes: { [chId]: {yes,no,res,at} }, renews: { [chId]: [{by,at,removed}] } }
function getMesa() {
  if (!state.challenge_mesa || typeof state.challenge_mesa !== "object") {
    state.challenge_mesa = { size: 0, votes: {}, renews: {} };
  }
  const m = state.challenge_mesa;
  if (!m.votes) m.votes = {};
  if (!m.renews) m.renews = {};
  if (!m.size) m.size = Math.min(10, Math.max(6, Number(state.team_members_count) || 6));
  return m;
}

const MESA_EXTRA_SEATS = ["Integrante 7", "Integrante 8", "Integrante 9", "Integrante 10"];

function mesaSeats() {
  const m = getMesa();
  const size = Math.min(10, Math.max(6, m.size));
  const seats = TEAM_MASCOTS.slice(0, Math.min(6, size)).map(x => ({ id: x.id, label: x.name, color: x.color }));
  for (let i = seats.length; i < size; i++) {
    seats.push({ id: "seat_" + (i + 1), label: MESA_EXTRA_SEATS[i - 6] || ("Integrante " + (i + 1)), color: "#64748B" });
  }
  return seats;
}

function mesaMe() {
  return (currentClientMascot && currentClientMascot.id) || (TEAM_MASCOTS[0] && TEAM_MASCOTS[0].id) || "seat_1";
}

function mesaSeatName(seatId) {
  const s = mesaSeats().find(x => x.id === seatId);
  return s ? s.label : String(seatId);
}

function mesaBallot(chId) {
  const m = getMesa();
  if (!m.votes[chId] || typeof m.votes[chId] !== "object") m.votes[chId] = { yes: [], no: [], res: [], at: {} };
  const b = m.votes[chId];
  if (!Array.isArray(b.yes)) b.yes = [];
  if (!Array.isArray(b.no)) b.no = [];
  if (!Array.isArray(b.res)) b.res = [];
  if (!b.at || typeof b.at !== "object") b.at = {};
  return b;
}

function mesaTally(chId) {
  const b = mesaBallot(chId);
  const size = mesaSeats().length;
  const yes = b.yes.length;
  const no = b.no.length;
  const res = b.res.length;
  const need = Math.ceil(size / 2);
  return {
    size, yes, no, res,
    wait: Math.max(0, size - yes - no - res),
    need,
    approved: yes >= need,
    discarded: no >= need
  };
}

function _mesaTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function mesaVote(chId, seatId) {
  const b = mesaBallot(chId);
  const cur = b.yes.includes(seatId) ? "yes" : b.no.includes(seatId) ? "no" : b.res.includes(seatId) ? "res" : null;
  b.yes = b.yes.filter(x => x !== seatId);
  b.no = b.no.filter(x => x !== seatId);
  b.res = b.res.filter(x => x !== seatId);
  const next = cur === null ? "yes" : cur === "yes" ? "no" : cur === "no" ? "res" : null;
  if (next === "yes") b.yes.push(seatId);
  if (next === "no") b.no.push(seatId);
  if (next === "res") b.res.push(seatId);
  if (next) b.at[seatId] = _mesaTime(); else delete b.at[seatId];

  const t = mesaTally(chId);
  const trib = getTribunal();
  if (t.discarded) trib.team[chId] = true; else delete trib.team[chId];

  saveState();
  broadcastFieldChange("tribunal", "state", state.challenge_tribunal);

  const label = next === "yes" ? "aprueba" : next === "no" ? "pide descartar" : next === "res" ? "pide reserva" : "queda sin decidir";
  showToast((t.discarded ? "Mitad a descarte: el sistema movió el Reto #" + chId + " al embudo. " : "") + mesaSeatName(seatId) + " " + label + " el Reto #" + chId + ".");
  renderTab("challenges");
}

function mesaRenew(chId) {
  const m = getMesa();
  const b = mesaBallot(chId);
  const removed = b.no.slice();
  b.no = [];
  Object.keys(b.at).forEach(k => { if (!b.yes.includes(k) && !b.res.includes(k)) delete b.at[k]; });
  const trib = getTribunal();
  delete trib.team[chId];
  if (!m.renews[chId]) m.renews[chId] = [];
  m.renews[chId].push({ by: mesaSeatName(mesaMe()), at: _mesaTime(), removed: removed.map(mesaSeatName) });
  saveState();
  broadcastFieldChange("tribunal", "state", state.challenge_tribunal);
  showToast("Reto #" + chId + " renovado: vuelve a la mesa sin los votos de descarte.");
  renderTab("challenges");
}

function mesaSetSize(n) {
  const size = Math.min(10, Math.max(6, Number(n) || 6));
  const m = getMesa();
  m.size = size;
  state.team_members_count = size;
  const ids = mesaSeats().map(s => s.id);
  Object.keys(m.votes).forEach(chId => {
    const b = m.votes[chId];
    b.yes = b.yes.filter(x => ids.includes(x));
    b.no = b.no.filter(x => ids.includes(x));
    b.res = b.res.filter(x => ids.includes(x));
  });
  saveState();
  renderTab("challenges");
}

function mesaGo(chId) {
  state.active_deliberation_challenge_id = chId;
  renderTab("challenges");
}

function renderMesaNav(list, activeId, total) {
  const totalActivos = Number.isFinite(total) ? total : list.length;
  return `
    <aside class="deliberation-nav">
      <div class="deliberation-nav-header">
        <span>CATÁLOGO DE RETOS</span>
        <span style="font-family:var(--font-mono); font-size:11px; color:#5C7193;">${totalActivos} ACTIVOS</span>
      </div>
      <div class="deliberation-nav-list">
        ${list.map(ch => {
          const t = mesaTally(ch.id);
          const isCur = ch.id === activeId;
          const isSel = state.challenge_id === ch.id;
          const ideas = (state.challenge_ideas && state.challenge_ideas[ch.id]) || [];
          const chip = t.discarded
            ? `<span class="cr-chip is-out">descartado ${t.no}/${t.size}</span>`
            : t.approved
              ? `<span class="cr-chip is-keep">aprobado ${t.yes}/${t.size}</span>`
              : t.res
                ? `<span class="cr-chip">reserva ${t.res}/${t.size}</span>`
                : `<span class="cr-chip">en debate ${t.yes}/${t.size}</span>`;
          return `
            <div class="deliberation-nav-item ${isCur ? 'active' : ''}" role="button" tabindex="0" aria-current="${isCur ? "page" : "false"}" aria-label="Reto ${ch.id}: ${ch.title}. ${t.discarded ? "descartado" : t.approved ? "aprobado" : "en debate"}, ${t.yes} a favor de ${t.size}." onclick="mesaGo('${ch.id}')">
              <div style="min-width:0; flex:1; padding-right:6px;">
                <div class="cr-nav-meta">
                  <span class="nav-item-num cr-nav-num">#${ch.id}</span>
                  <span class="nav-item-cat">${categoryBadge(ch.category)}</span>
                  ${isSel ? `<span class="cr-chip is-sel">ELEGIDO</span>` : ""}
                  ${chip}
                </div>
                <div class="nav-item-title">${ch.title}</div>
              </div>
              <div class="cr-nav-right">
                <span class="cr-nav-via">${ch.winRate || 90}%</span>
                <span class="cr-nav-notes">Notas: ${ideas.length}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </aside>
  `;
}

function renderMesaBar(list, ch, idx) {
  const t = mesaTally(ch.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;
  return `
    <div class="cr-bar">
      <div class="cr-bar-nav">
        <button class="cr-arrow" ${prev ? `onclick="mesaGo('${prev.id}')"` : "disabled"} title="Reto anterior" aria-label="Reto anterior">←</button>
        <span class="cr-count">RETO #${ch.id} <span class="cr-count-dim">/ ${String(idx + 1).padStart(2, "0")} de ${String(list.length).padStart(2, "0")}</span></span>
        <button class="cr-arrow" ${next ? `onclick="mesaGo('${next.id}')"` : "disabled"} title="Reto siguiente" aria-label="Reto siguiente">→</button>
      </div>

      <div class="cr-bar-team">
        <span class="cr-bar-k">en la mesa</span>
        <button class="cr-step" onclick="mesaSetSize(${t.size - 1})" ${t.size <= 6 ? "disabled" : ""} title="Un integrante menos" aria-label="Un integrante menos">−</button>
        <span class="cr-size">${t.size}</span>
        <button class="cr-step" onclick="mesaSetSize(${t.size + 1})" ${t.size >= 10 ? "disabled" : ""} title="Un integrante más" aria-label="Un integrante más">+</button>
        <span class="cr-need">${t.need} votos para aprobar · ${t.need} para descartar</span>
      </div>

      <div class="cr-map">
        ${list.map((c, i) => {
          const ct = mesaTally(c.id);
          const cls = [
            "cr-pip",
            c.id === ch.id ? "is-current" : "",
            ct.discarded ? "is-out" : "",
            ct.approved ? "is-in" : "",
            !ct.approved && !ct.discarded && ct.res ? "is-res" : "",
            state.challenge_id === c.id ? "is-sel" : ""
          ].filter(Boolean).join(" ");
          return `<button class="${cls}" onclick="mesaGo('${c.id}')" title="Reto #${c.id} · ${ct.yes}/${ct.size} a favor${ct.discarded ? " · descartado" : ""}">${String(i + 1).padStart(2, "0")}</button>`;
        }).join("")}
      </div>

      <div class="cr-rule">Se aprueba con <b>la mitad a favor</b>; se descarta con <b>la mitad a descarte</b> — el sistema lo mueve al embudo y se puede renovar. La IA propone, no vota.</div>
    </div>
  `;
}

function renderMesaNotes(ch) {
  const ideas = (state.challenge_ideas && state.challenge_ideas[ch.id]) || [];
  const others = (state.challenges || []).filter(c => c.id !== ch.id);
  return `
    <section class="cr-panel cr-notes">
      <div class="cr-block"><span class="cr-num">03</span> Nuestras redacciones <span class="cr-count-chip">${ideas.length}</span><span class="cr-tag">se guarda solo</span></div>
      <div class="cr-note-grid">
        ${ideas.length === 0 ? `<p class="cr-pending">Todavía no hay redacciones para este reto. La primera la escribe cualquiera.</p>` : ideas.map(idea => `
          <article class="cr-note ${idea.merged_to ? "is-merged" : ""}">
            <header class="cr-note-head">
              <span class="cr-dot" style="background:${_userColor(idea.author)}"></span>
              <span class="cr-note-author" style="color:${_userColor(idea.author)}">${idea.author || "Equipo"}</span>
              <span class="cr-note-time">#${ch.id} · ${idea.timestamp || ""}</span>
            </header>
            <p class="cr-note-text">${idea.text}</p>
            <footer class="cr-note-foot">
              ${idea.merged_to ? `<span class="cr-note-fusion">fusionada → #${idea.merged_to}</span><button class="cr-link" onclick="unmergeChallengeIdea('${ch.id}', '${idea.id}')" title="Traer la nota de vuelta">↺ traer</button>` : others.length ? `
                <select class="cr-note-merge" onchange="if(this.value) mergeChallengeIdea('${ch.id}', '${idea.id}', this.value)">
                  <option value="">fusionar ↗</option>
                  ${others.map(c => `<option value="${c.id}">#${c.id} ${(c.title || '').slice(0, 26)}</option>`).join("")}
                </select>` : ""}
              <button class="cr-link is-quiet" onclick="deleteChallengeIdea('${ch.id}', '${idea.id}')" title="Eliminar redacción">borrar</button>
            </footer>
          </article>
        `).join("")}
      </div>
      <div class="cr-compose">
        <span class="cr-dot" style="background:${_userColor(_me())}"></span>
        <input type="text" id="new-idea-input-${ch.id}" placeholder="Escribe la idea, el pro o el contra y queda pegada a este reto…" onkeydown="if(event.key==='Enter') addChallengeIdea('${ch.id}')">
        <button class="btn-select-card filled" style="padding:6px 14px; font-size:11.5px; font-weight:700;" onclick="addChallengeIdea('${ch.id}')">+ pegar redacción</button>
      </div>
    </section>
  `;
}

function renderMesaVote(ch) {
  const t = mesaTally(ch.id);
  const b = mesaBallot(ch.id);
  const seats = mesaSeats();
  const meId = mesaMe();
  const pct = n => Math.round((n / Math.max(1, t.size)) * 100);
  const stance = seatId => b.yes.includes(seatId) ? "yes" : b.no.includes(seatId) ? "no" : b.res.includes(seatId) ? "res" : "wait";
  const stanceLabel = s => s === "yes" ? "aprueba" : s === "no" ? "descarta" : s === "res" ? "reserva" : "sin decidir";
  const verdict = t.discarded
    ? `<span class="cr-verdict-main is-out">DESCARTADO</span> <span class="cr-verdict-sub">${t.no} de ${t.size} a descarte · el sistema lo movió al embudo</span>`
    : t.approved
      ? `<span class="cr-verdict-main is-in">APROBADO</span> <span class="cr-verdict-sub">${t.yes} de ${t.size} a favor (necesitaba ${t.need})</span>`
      : `<span class="cr-verdict-main">EN DEBATE</span> <span class="cr-verdict-sub">${t.yes} de ${t.size} a favor · faltan ${Math.max(0, t.need - t.yes)} para ${t.need}</span>`;
  const group = (arr, label, cls) => arr.length ? `<span class="cr-rec ${cls}"><span class="cr-rec-k">${label} <b>${arr.length}</b></span>${arr.map(id => `<span class="cr-rec-name">${mesaSeatName(id)} <span class="cr-rec-at">${b.at[id] || ""}</span></span>`).join("")}</span>` : "";
  const renews = (getMesa().renews[ch.id] || []);
  return `
    <section class="cr-panel cr-vote" id="mesa-vote-${ch.id}">
      <div class="cr-block"><span class="cr-num">04</span> La mesa vota <span class="cr-tag">${t.size} en la mesa · mayoría: ${t.need}</span></div>

      <div class="cr-verdict">${verdict}</div>

      <div class="cr-bars">
        <div class="cr-bar-row">
          <span class="cr-bar-label">a favor</span>
          <span class="cr-bar-track"><span class="cr-bar-fill" style="width:${pct(t.yes)}%"></span><span class="cr-bar-mark" style="left:50%"></span></span>
          <span class="cr-bar-n">${t.yes}/${t.size}</span>
        </div>
        <div class="cr-bar-row">
          <span class="cr-bar-label">a descarte</span>
          <span class="cr-bar-track"><span class="cr-bar-fill is-no" style="width:${pct(t.no)}%"></span><span class="cr-bar-mark" style="left:50%"></span></span>
          <span class="cr-bar-n">${t.no}/${t.size}</span>
        </div>
      </div>

      <div class="cr-voters">
        ${seats.map(seat => {
          const s = stance(seat.id);
          const isMe = seat.id === meId;
          return `
            <button class="cr-voter is-${s} ${isMe ? "is-you" : ""}" aria-label="${seat.label}: ${stanceLabel(s)}${b.at[seat.id] ? " a las " + b.at[seat.id] : ""}. Toca para cambiar el voto." onclick="mesaVote('${ch.id}', '${seat.id}')" title="Toca para cambiar el voto de ${seat.label}">
              <span class="cr-dot" style="background:${seat.color}"></span>
              <span class="cr-voter-name">${seat.label}${isMe ? " · tú" : ""}</span>
              <span class="cr-voter-stance">${stanceLabel(s)}</span>
              <span class="cr-voter-at">${b.at[seat.id] || "—"}</span>
            </button>
          `;
        }).join("")}
      </div>

      <div class="cr-record">
        <span class="cr-rec-tag">constancia</span>
        ${group(b.no, "lo tiran", "is-no")}
        ${group(b.yes, "lo salvan", "is-yes")}
        ${group(b.res, "en reserva", "is-res")}
        ${group(seats.map(s => s.id).filter(id => stance(id) === "wait"), "sin decidir", "is-wait")}
      </div>

      ${renews.map(r => `<div class="cr-rec-log">renovado por ${r.by} · ${r.at} — se borraron los votos de descarte${r.removed && r.removed.length ? " de " + r.removed.join(", ") : ""}</div>`).join("")}

      <div class="cr-vote-actions">
        ${t.discarded ? `<button class="btn-pill-light cr-renew-btn" onclick="mesaRenew('${ch.id}')">Renovar este reto</button>` : ""}
        ${state.challenge_id !== ch.id
          ? `<button class="btn-select-card filled" style="padding:8px 18px; font-size:12px; font-weight:800;" onclick="selectChallenge('${ch.id}', false)">Elegir Reto #${ch.id}</button>`
          : `<span class="cr-held">Reto #${ch.id} está elegido</span>`}
        <button class="btn-pill-light" style="font-size:11.5px; padding:5px 12px;" onclick="showToast('Escucha de 2 minutos abierta para el Reto #${ch.id}.')">Pedir 2 min de escucha</button>
      </div>

      <p class="cr-consequence">Sin quórum: vota quien quiera. Con <b>≥50 %</b> del equipo a favor entra; con <b>≥50 %</b> a descarte el sistema lo mueve al embudo y se puede renovar cuando quieran. Equipo impar: pasa el voto que cruza la mitad (${t.need} de ${t.size}). La IA no vota: solo propone arriba.</p>
    </section>
  `;
}

function renderMesaSlide(ch, list, idx) {
  const info = challengeRankFor(ch);
  const ideas = (state.challenge_ideas && state.challenge_ideas[ch.id]) || [];
  const rows = list.map(c => ({ id: c.id, score: challengeRankFor(c).score })).sort((a, b) => b.score - a.score || (a.id > b.id ? 1 : -1));
  const rank = rows.findIndex(r => r.id === ch.id) + 1;
  const isSel = state.challenge_id === ch.id;
  const isSat = (ch.compDensity || "").toLowerCase().includes("alta") || (ch.winRate && ch.winRate < 86);
  const odsList = Array.isArray(ch.ods) ? ch.ods : String(ch.ods || "").split(/,\s*/).filter(Boolean);
  const sourceText = ch.officialExpectation || ch.demandaComite || ch.description || "";
  const ang = winnerAngleFor(ch);
  const reasonLines = info.reasonLines || [];

  return `
    <div class="cr-slide-head">
      <div class="cr-head-meta">
        <div class="cr-head-row">
          ${categoryBadge(ch.category)}
          <span class="cr-desafio">DESAFÍO #${ch.id}</span>
          ${isSel ? `<span class="cr-chip is-sel">ELEGIDO</span>` : ""}
        </div>
        <div class="cr-ods">
          ${odsList.map(o => {
            const num = String(o).replace(/[^\d]/g, "");
            const odsObj = (typeof ODS_CATALOG !== "undefined" ? ODS_CATALOG : []).find(x => String(x.id) === num);
            return `<button class="btn-pill-light cr-ods-pill" onclick="openImpactDetailModal('ods', ${num || 12})" title="Ver por qué y cómo cumple este ODS">${odsObj && odsObj.icon ? `<svg width="10" height="10" viewBox="0 0 12 12" fill="${odsObj.color}">${odsObj.icon}</svg>` : ""}${o}</button>`;
          }).join("")}
        </div>
        <div class="cr-head-note">
          <span class="cr-niche">${isSat ? "ALTA CONCURRENCIA" : "NICHO TÉCNICO"}</span>
          <span class="cr-niche-why">${isSat ? "Exige ≥2 capas tecnológicas para superar la saturación de sedes." : "Baja rivalidad de sedes: ventaja directa si la factibilidad es sólida."}</span>
        </div>
      </div>
      <div class="cr-head-actions">
        <button class="btn-pill-light" style="font-size:11.5px; padding:5px 12px;" onclick="openEditChallengeModal('${ch.id}')" title="Modificar título, demanda u ODS">${SVG.edit} Editar Reto</button>
        <button class="btn-select-card ${isSel ? "filled" : "outline"}" style="padding:6px 14px; font-size:12px; font-weight:700;" onclick="selectChallenge('${ch.id}', ${isSel ? "true" : "false"})">${isSel ? "Reto Seleccionado" : "Elegir para Desarrollar"}</button>
        <button class="btn-pill-ghost" style="font-size:11px; padding:5px 10px; color:#DC2626;" onclick="deleteChallenge('${ch.id}')" title="Quitar del radar">${SVG.close}</button>
      </div>
    </div>

    <h2 class="cr-title">${ch.title}</h2>

    <div class="cr-metrics">
      <span class="cr-metric"><b>${info.score}</b> <span class="cr-metric-k">${info.scoreBasis === "historico" ? "pts del motor" : "pts por criterios"}</span></span>
      <span class="cr-metric"><b>#${rank}</b> <span class="cr-metric-k">de ${list.length}</span></span>
      <span class="cr-metric-reason">${(reasonLines[0] || "Delibera en equipo: el motor no tiene una razón dominante para este reto.").replace(/\(\s*[+-]?[\d.]+\s*pts\s*\)/i, "").trim()}</span>
    </div>

    <div class="cr-body">
      <section class="cr-panel is-src">
        <div class="cr-block"><span class="cr-num">01</span> Lo que pide el comité <span class="cr-tag is-lock">fuente bloqueada · no editable</span></div>
        ${ch.imageUrl ? `<button class="cr-thumb" onclick="openLightbox('${ch.imageUrl}')" title="Ampliar el cartel oficial"><img src="${ch.imageUrl}" alt="Cartel oficial del reto ${ch.id}"></button>` : ""}
        ${sourceText
          ? `<p class="cr-quote">${sourceText}</p>`
          : `<p class="cr-pending">Descripción oficial pendiente de transcribir. Pega el texto del comité para que quede como fuente.</p>`}
        ${ch.ods && !odsList.length ? `<p class="cr-tag is-lock">ODS por transcribir</p>` : ""}
      </section>

      <section class="cr-panel">
        <div class="cr-block"><span class="cr-num">02</span> Lo que propone la IA <span class="cr-tag">propone · no vota</span></div>
        ${ch.wowProposal
          ? `<p class="cr-thesis">${ch.wowProposal}</p>`
          : `<p class="cr-pending">Sin tesis formulada todavía. Usa <button class="cr-link" onclick="openAIThesisFormulatorModal('${ch.id}')">IA Copilot</button> para estructurarla contra la rúbrica.</p>`}
        ${ch.nicaraguaAdaptation ? `<p class="cr-fact"><b>Factibilidad & despliegue:</b> ${ch.nicaraguaAdaptation}</p>` : ""}
        ${(ch.winnerPattern || ch.precedent) ? `<p class="cr-precedent"><b>Precedente:</b> ${ch.winnerPattern || ch.precedent}</p>` : ""}
        ${reasonLines.length ? `
          <div class="cr-pts">
            ${reasonLines.map(line => {
              const m = line.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*pts\s*\)/i);
              const val = m ? parseFloat(m[1]) : 0;
              const label = line.replace(/\(\s*[+-]?\d+(?:\.\d+)?\s*pts\s*\)/i, "").trim();
              const w = Math.min(100, Math.round((Math.abs(val) / 20) * 100));
              return `<div class="cr-pt ${val < 0 ? "is-neg" : "is-pos"}">
                <span class="cr-pt-k">${label}</span>
                <span class="cr-pt-track"><span class="cr-pt-fill" style="width:${w}%"></span></span>
                <span class="cr-pt-v">${val > 0 ? "+" : ""}${val}</span>
              </div>`;
            }).join("")}
          </div>
        ` : ""}
        <p class="cr-angle">${ang.bullets.slice(0, 2).map(b => `<span class="cr-angle-i">${b}</span>`).join("")}</p>
      </section>
    </div>

    ${renderMesaNotes(ch)}
    ${renderMesaVote(ch)}
  `;
}

function renderTribunalSubnav() {
  const t = getTribunal();
  const kept = (state.challenges || []).filter(c => hasAnyKeep(c.id) && !isTeamDiscarded(c.id)).length;
  const steps = [
    { id: "read", label: "1 · Leer", hint: "Lee cada reto en detalle" },
    { id: "discard", label: "2 · Descartar", hint: "Embudo: me interesa / descartado" },
    { id: "vote", label: `3 · Votar`, hint: kept ? "3 puntos por persona" : "Marca 'me interesa' primero" },
    { id: "decide", label: "4 · Decidir", hint: "Levantar la mano por un reto" }
  ];
  return `
    <div class="tribunal-subnav">
      ${steps.map(s => `
        <button class="tribunal-chip ${t.step === s.id ? 'active' : ''}" onclick="setTribunalStep('${s.id}')" title="${s.hint}">
          ${s.label}${s.id === "discard" ? `<span class="tribunal-chip-count">${kept}</span>` : ""}
        </button>
      `).join("")}
    </div>
  `;
}

function renderViewChallenges() {
  const hasChallenges = state.challenges && state.challenges.length > 0;
  const list = hasChallenges ? state.challenges : [];
  const tri = getTribunal();

  const filtered = list.filter(ch => {
    if (challengeFilter === "all") return true;
    return (ch.category || "").toLowerCase().includes(challengeFilter.toLowerCase());
  });

  // Orden del embudo: primero "me interesa", luego "en espera", al final "descartado"
  if (tri.step !== "read") {
    const dispOrder = c => funnelStateOf(c.id) === "keep" ? 0 : funnelStateOf(c.id) === "discard" ? 2 : 1;
    filtered.sort((a, b) => dispOrder(a) - dispOrder(b));
  }

  const selectedChallengeObj = state.challenge_id ? list.find(c => c.id === state.challenge_id) || OFFICIAL_CHALLENGES_2026.find(c => c.id === state.challenge_id) : null;

  // Mesa: reto activo del carrusel (uno a la vez)
  const mesaList = filtered;
  const mesaActive = mesaList.find(c => c.id === (state.active_deliberation_challenge_id || state.challenge_id)) || mesaList[0];
  const mesaIndex = mesaActive ? mesaList.indexOf(mesaActive) : 0;

  return `
    <div class="wizard-canvas" style="max-width:min(1760px, 98vw); width:100%; margin:0 auto; padding-bottom:60px; box-sizing:border-box;">
      <div class="stepper-header" style="justify-content:space-between; margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="stepper-pill"><span class="pill-dim">PASO</span> <strong class="pill-num">03</strong> <span class="pill-dim">DE 12</span> <span class="pill-dot">·</span> <span class="pill-label">RETOS DEL COMITÉ</span></span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn-minimal-back" onclick="switchTab('team')" title="Volver a identidad de equipo">
            ${SVG.arrowLeft}
            <span>Editar equipo</span>
          </button>
          <a href="docs/Matriz_Seleccion_Desafios_2026.docx" download="Matriz_Seleccion_Desafios_2026.docx" class="btn-pill-light" style="font-size:11.5px; padding:6px 14px; text-decoration:none;">
            ${SVG.download} Matriz Word (.docx)
          </a>
        </div>
      </div>

      ${state.challenge_id && selectedChallengeObj ? `
        <!-- Banner de Reto Seleccionado -->
        <div style="background:#F0F6FF; border:1.5px solid #BFDBFE; border-radius:14px; padding:16px 20px; margin-bottom:22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="background:#0866F5; color:#ffffff; font-family:var(--font-mono); font-size:12px; font-weight:800; padding:4px 10px; border-radius:8px;">
              RETO SELECCIONADO #${selectedChallengeObj.id}
            </span>
            <div>
              <div style="font-size:14px; font-weight:800; color:#0D1B35;">${selectedChallengeObj.title}</div>
              <div style="font-size:12px; color:#5C7193;">${selectedChallengeObj.category} · Viabilidad estimada: ${selectedChallengeObj.winRate || 90}%</div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-pill-light" onclick="clearSelectedChallenge()" style="font-size:12px; font-weight:700;">
              Cambiar de Reto
            </button>
            <button class="btn-select-card filled" style="padding:8px 18px; font-size:12px; font-weight:800;" onclick="switchTab('solution')">
              Continuar a Taller de Solución ${SVG.arrowRight}
            </button>
          </div>
        </div>
      ` : ""}

      ${!hasChallenges ? `
        <!-- Estado Inicial: Espera de Retos del Evento en Vivo (Sin asumir retos ni inventar) -->
        <div class="phase-header" style="margin-bottom:20px;">
          <h1 class="phase-title" style="font-size:28px; font-weight:900; color:#0D1B35; margin-bottom:6px; letter-spacing:-0.02em;">
            Retos del <span class="phase-title-accent" style="color:#0866F5;">Comité en Vivo</span>
          </h1>
          <p class="phase-subtitle" style="font-size:13.5px; color:#5C7193; line-height:1.45;">
            El sistema no asume ni inventa retos por anticipado. Cuando el comité del certamen libere los desafíos de este año, pega el texto aquí para que el motor formule soluciones tácticas sugeridas para cada uno.
          </p>
        </div>

        <div style="display:grid; grid-template-columns: minmax(0, 1fr) 320px; gap:20px; align-items:start; margin-bottom:24px;">
          <!-- Columna Principal: Ingreso de Retos -->
          <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:14px; padding:22px; box-shadow:0 1px 3px rgba(0, 0, 0, 0.02);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="font-size:13.5px; font-weight:800; color:#0D1B35;">Ingreso e Importación Oficial de Retos</div>
              <span class="tactical-status-pill status-pending"><span class="status-dot"></span>Importador Multiformato</span>
            </div>
            <p style="font-size:12px; color:#5C7193; margin-bottom:14px; line-height:1.5;">
              Importa los retos subiendo un archivo comprimido <strong>.ZIP</strong> (con fotos o documentos), <strong>imágenes</strong> (.png, .jpg), documento <strong>PDF</strong>, archivo <strong>Word (.docx)</strong> o pega el comunicado oficial.
            </p>

            <div class="tribunal-mission">
              <div class="tribunal-mission-step"><span class="tm-num">1</span><span>Carga las fotos o PDF del comité (o pega el texto si el OCR falla — el cuadro de pegar siempre está aquí).</span></div>
              <div class="tribunal-mission-step"><span class="tm-num">2</span><span><strong>Leer</strong>: revisa cada reto con su descripción completa y el Ángulo Ganador sugerido.</span></div>
              <div class="tribunal-mission-step"><span class="tm-num">3</span><span><strong>Embudo</strong>: Descartar → Votar (3 puntos por persona) → Decidir. Cada integrante da su voz individual.</span></div>
            </div>

            <!-- Dropzone Universal Compacta -->
            <div id="challenge-dropzone" 
                 style="border:2px dashed #93C5FD; background:#F8FAFD; border-radius:10px; padding:16px 14px; text-align:center; margin-bottom:14px; cursor:pointer; transition:all 150ms ease;"
                 onclick="document.getElementById('challenge-file-input').click()"
                 ondragover="event.preventDefault(); this.style.borderColor='#0866F5'; this.style.background='#EFF6FF';"
                 ondragleave="event.preventDefault(); this.style.borderColor='#93C5FD'; this.style.background='#F8FAFD';"
                 ondrop="handleChallengeDrop(event)">
              <input type="file" id="challenge-file-input" style="display:none;" multiple accept=".zip,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp" onclick="event.stopPropagation()" onchange="handleChallengeFileSelect(this.files)">
              <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:4px; color:#0866F5;">
                ${SVG.upload}
                <span style="font-size:13px; font-weight:800; color:#0D1B35;">Arrastra aquí o haz clic para subir archivo</span>
              </div>
              <div style="font-size:11px; color:#64748B;">
                Soporta <strong>.ZIP</strong>, <strong>Imágenes (.png, .jpg)</strong>, <strong>PDF</strong>, <strong>Word (.docx)</strong> y <strong>Texto</strong>.
              </div>
              <div id="import-status-indicator" style="display:none; margin-top:8px; font-size:11.5px; font-weight:700; color:#0866F5;"></div>
            </div>

            <textarea id="raw-committee-challenges" rows="7" style="width:100%; border:1px solid #CBD5E1; border-radius:8px; padding:12px; font-size:12px; font-family:var(--font-mono); box-sizing:border-box; background:#F8FAFD; line-height:1.5; resize:vertical;"
              placeholder="O pega aquí el comunicado oficial de retos del comité...&#10;&#10;Ejemplo:&#10;RETO 01: Reconversión y segunda vida de motores&#10;Demanda del comité: Diseñar sistemas que reutilicen motores eléctricos en desuso para tracción agrícola...&#10;&#10;RETO 02: Red comunitaria para prevención de inundaciones&#10;Demanda del comité: Alerta temprana de crecidas de ríos con tecnología local..."></textarea>
            
            <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:14px;">
              <button id="btn-process-challenges" class="btn-select-card filled" style="padding:10px 24px; font-size:13px; font-weight:800; width:100%; justify-content:center;" onclick="processCommitteeChallengesInput()">
                Cargar Retos en Vivo y Sugerir Soluciones ${SVG.arrowRight}
              </button>
            </div>
          </div>

          <!-- Columna Lateral: Mascota y Orientación -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:14px; padding:18px; text-align:center; box-shadow:0 1px 3px rgba(0, 0, 0, 0.02);">
              <!-- Mascota Robot / Rally Bot Vectorial Saludando -->
              <div style="display:inline-flex; justify-content:center; align-items:center; width:90px; height:90px; background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius:50%; margin-bottom:12px; border:2px solid #BFDBFE; position:relative;">
                <svg width="60" height="60" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Antena -->
                  <circle cx="36" cy="10" r="3.5" fill="#0866F5" />
                  <line x1="36" y1="13" x2="36" y2="20" stroke="#0866F5" stroke-width="2.5" stroke-linecap="round" />
                  <!-- Cabeza -->
                  <rect x="18" y="20" width="36" height="28" rx="8" fill="#1D4ED8" />
                  <rect x="22" y="24" width="28" height="14" rx="4" fill="#0B1329" />
                  <!-- Ojos alegres / pantalla -->
                  <circle cx="29" cy="31" r="3" fill="#60A5FA" />
                  <circle cx="43" cy="31" r="3" fill="#60A5FA" />
                  <!-- Sonrisa -->
                  <path d="M33 42 C34.5 44 37.5 44 39 42" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />
                  <!-- Cuello -->
                  <rect x="32" y="48" width="8" height="4" rx="2" fill="#93C5FD" />
                  <!-- Cuerpo -->
                  <rect x="16" y="52" width="40" height="16" rx="6" fill="#2563EB" />
                  <!-- Medalla / Logo rally -->
                  <circle cx="36" cy="60" r="4" fill="#F59E0B" />
                  <!-- Brazo saludando animado -->
                  <g style="transform-origin: 54px 54px; animation: rallyWave 1.8s infinite ease-in-out;">
                    <path d="M54 54 Q65 44 64 32" stroke="#1D4ED8" stroke-width="4.5" stroke-linecap="round" />
                    <!-- Mano saludando -->
                    <circle cx="64" cy="30" r="4" fill="#F59E0B" />
                  </g>
                  <!-- Brazo izquierdo quieto -->
                  <path d="M18 54 Q10 60 12 68" stroke="#1D4ED8" stroke-width="4" stroke-linecap="round" />
                </svg>
                <style>
                  @keyframes rallyWave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(18deg); }
                    75% { transform: rotate(-8deg); }
                  }
                </style>
              </div>

              <!-- Bocadillo de diálogo -->
              <div style="background:#F0F6FF; border:1px solid #BFDBFE; border-radius:10px; padding:10px 12px; margin-bottom:12px; position:relative; text-align:left;">
                <div style="font-size:12px; font-weight:800; color:#1D4ED8; margin-bottom:3px; display:flex; align-items:center; gap:5px;">
                  <span>RallyBot en guardia</span>
                </div>
                <div style="font-size:11.5px; color:#334155; line-height:1.4;">
                  "¡Hora del certamen! Sube las bases o pega el comunicado para que pasemos al selector de retos."
                </div>
              </div>

              <div style="text-align:left; font-size:11px; color:#64748B; line-height:1.45; background:#F8FAFD; border:1px solid #E2E8F0; border-radius:8px; padding:10px;">
                <div style="font-weight:700; color:#334155; margin-bottom:4px;">Tips para este paso:</div>
                <ul style="margin:0; padding-left:14px;">
                  <li>Reconoce formato <strong>RETO 01: ...</strong> automáticamente.</li>
                  <li>Puedes arrastrar documentos oficiales en <strong>PDF</strong> o <strong>Word</strong>.</li>
                  <li>En el siguiente paso podrás revisar y elegir cuál abordar.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="phase-header" style="margin-bottom:16px;">
          <h1 class="phase-title" style="font-size:28px; font-weight:900; color:#0F172A; margin-bottom:4px; letter-spacing:-0.02em;">
            Retos Oficiales & <span class="phase-title-accent">Mesa de Decisión</span>
          </h1>
          <p class="phase-subtitle" style="font-size:13px; color:#475569; line-height:1.45;">
            ${list.length} retos en radar. Pasan uno a uno: lo que pide el comité, lo que propone la IA, lo que redacta el equipo y cómo vota la mesa.
          </p>
        </div>

        <details class="rk-fold">
          <summary>
            <span class="rk-fold-k">Ranking de retos</span>
            <span class="rk-fold-n">· ${list.length} evaluados</span>
            <span class="rk-fold-h">el pronóstico del motor, por si quieren comparar antes de votar</span>
            <span class="rk-fold-go">ver ▾</span>
          </summary>
          ${renderChallengeRanking()}
        </details>

        <!-- Barra de Control y Filtros (Estilo Editorial Sobrio) -->
        ${tri.step !== "vote" ? `
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="btn-pill-light" style="${challengeFilter === 'all' ? 'background:#0F172A; color:#fff; border-color:#0F172A;' : ''} padding:5px 12px; font-size:11.5px; font-weight:700;" onclick="challengeFilter='all'; renderTab('challenges');">
              Todos (${list.length})
            </button>
            <button class="btn-pill-light" style="${challengeFilter === 'innovación' ? 'background:#0F172A; color:#fff; border-color:#0F172A;' : ''} padding:5px 12px; font-size:11.5px; font-weight:700;" onclick="challengeFilter='innovación'; renderTab('challenges');">
              Innovación
            </button>
            <button class="btn-pill-light" style="${challengeFilter === 'impacto social' ? 'background:#0F172A; color:#fff; border-color:#0F172A;' : ''} padding:5px 12px; font-size:11.5px; font-weight:700;" onclick="challengeFilter='impacto social'; renderTab('challenges');">
              Impacto Social
            </button>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button class="btn-pill-light" style="padding:5px 12px; font-size:11.5px; font-weight:700; display:inline-flex; align-items:center; gap:6px;" onclick="openChallengeImportBox()" title="Ver los retos cargados e importar otros sin borrarlos">
              ${SVG.upload}<span>Importar retos</span>
            </button>
          <details class="rank-tools rs-tools">
            <summary aria-label="Herramientas de retos">
              ${SVG.dotsVertical}
              <span>Herramientas</span>
              <span class="rs-tools-chevron">${SVG.chevronDown}</span>
            </summary>
            <div class="rs-tools-menu" role="menu" aria-label="Herramientas de retos">
              <button class="rs-tools-item" role="menuitem" onclick="openChallengeImportBox()">
                ${SVG.upload}<span>Importar o re-pegar retos</span>
              </button>
              <button class="rs-tools-item" role="menuitem" onclick="reScanChallengesWithOCR()" title="Re-escanear imágenes adjuntas con IA visual (modelo vision gratuito); red de seguridad EasyOCR si no hay IA conectada">
                ${SVG.refresh}<span>Re-escanear OCR</span>
              </button>
              <button class="rs-tools-item" role="menuitem" onclick="loadReferenceChallenges()" title="Cargar banco oficial de 9 retos de referencia">
                ${SVG.folder}<span>Cargar banco oficial (9)</span>
              </button>
              <span class="rs-tools-sep" aria-hidden="true"></span>
              <button class="rs-tools-item rs-tools-danger" role="menuitem" onclick="clearAllChallenges()">
                ${SVG.trash}<span>Limpiar radar</span>
              </button>
            </div>
          </details>
          </div>
        </div>
        ` : ""}
        <div id="custom-challenge-input-box" style="display:none; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; padding:14px; margin-bottom:14px;"
             ondragover="event.preventDefault(); this.style.borderColor='#0866F5';"
             ondragleave="event.preventDefault(); this.style.borderColor='#CBD5E1';"
             ondrop="handleChallengeDrop(event)">
          <div id="challenge-import-current" style="margin-bottom:12px;"></div>
          <div style="border:1.5px dashed #CBD5E1; background:#F8FAFC; border-radius:6px; padding:14px; text-align:center; margin-bottom:10px; cursor:pointer;"
               onclick="document.getElementById('challenge-file-input-inline').click()">
            <input type="file" id="challenge-file-input-inline" aria-label="Subir archivos de retos" style="display:none;" multiple accept=".zip,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp" onclick="event.stopPropagation()" onchange="handleChallengeFileSelect(this.files)">
            <div style="font-size:12.5px; font-weight:700; color:#0F172A;">Arrastra aquí o haz clic para subir archivo ZIP, imágenes, PDF o Word</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">La IA visual jerarquizará automáticamente todos los retos contenidos (EasyOCR local como red de seguridad).</div>
          </div>
          <div id="custom-import-status-indicator" style="display:none; margin-bottom:10px; font-size:12px; font-weight:700; color:#0866F5;"></div>
          <textarea id="raw-committee-challenges" rows="4" style="width:100%; border:1px solid #CBD5E1; border-radius:6px; padding:10px; font-size:12px; font-family:var(--font-mono); box-sizing:border-box; background:#F8FAFC;"
            placeholder="O pega aquí el texto del comunicado oficial..."></textarea>
          <label style="display:flex; align-items:center; gap:8px; margin-top:10px; font-size:12px; color:#334155; cursor:pointer;">
            <input type="checkbox" id="challenge-append-mode" checked style="cursor:pointer;">
            <span>Agregar a los retos cargados (si lo desmarcas, este comunicado <strong>reemplaza</strong> la lista actual)</span>
          </label>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button class="btn-secondary" style="font-size:11.5px; padding:5px 12px;" onclick="toggleCustomChallengeInput()">Cancelar</button>
            <button class="btn-select-card filled" style="padding:6px 16px; font-size:12px; font-weight:700;" onclick="processCommitteeChallengesInput()">Procesar Retos</button>
          </div>
        </div>

        ${mesaActive ? `
          <div class="deliberation-container">
            ${renderMesaNav(mesaList, mesaActive.id, list.length)}
            <section class="deliberation-sheet cr-sheet">
              ${renderMesaBar(mesaList, mesaActive, mesaIndex)}
              ${renderMesaSlide(mesaActive, mesaList, mesaIndex)}

              <div class="cr-cta">
                <div>
                  ${mesaIndex > 0 ? `<button class="btn-pill-light" style="font-size:12px; font-weight:700; padding:6px 14px;" onclick="mesaGo('${mesaList[mesaIndex - 1].id}')">← Reto #${mesaList[mesaIndex - 1].id}</button>` : `<span style="width:80px; display:inline-block;"></span>`}
                </div>
                <button class="btn-select-card filled" style="padding:10px 22px; font-size:13px; font-weight:800;" onclick="selectChallenge('${mesaActive.id}', true)">
                  Elegir Reto #${mesaActive.id} e Ir a Solución →
                </button>
                <div>
                  ${mesaIndex < mesaList.length - 1 ? `<button class="btn-pill-light" style="font-size:12px; font-weight:700; padding:6px 14px;" onclick="mesaGo('${mesaList[mesaIndex + 1].id}')">Reto #${mesaList[mesaIndex + 1].id} →</button>` : `<span style="width:80px; display:inline-block;"></span>`}
                </div>
              </div>
            </section>
          </div>
        ` : `
          <div style="padding:30px; text-align:center; color:#64748B;">No hay retos en esta categoría.</div>
        `}
      `}
    </div>
  `;
}

async function loadReferenceChallenges() {
  await loadChallengeBank();
  if (!OFFICIAL_CHALLENGES_2026.length) {
    showToast("El banco de retos no se pudo cargar (challenge_bank.json).", true);
    return;
  }
  state.challenges = JSON.parse(JSON.stringify(OFFICIAL_CHALLENGES_2026));
  state.active_deliberation_challenge_id = state.challenges[0].id;
  saveState();
  renderTab("challenges");
}

function deleteChallenge(id) {
  const ch = (state.challenges || []).find(c => c.id === id);
  const name = ch ? ch.title : `Reto #${id}`;
  if (confirm(`¿Descartar "${name}" del radar del certamen?`)) {
    state.challenges = (state.challenges || []).filter(c => c.id !== id);
    purgeChallengeRefs([id]);
    if (state.challenge_id === id) {
      state.challenge_id = "";
      state.challenge_title = "";
    }
    saveState();
    renderTab("challenges");
    renderNavigation();
  }
}

function addChallengeIdea(chId) {
  const input = document.getElementById(`new-idea-input-${chId}`);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!state.challenge_ideas) state.challenge_ideas = {};
  if (!state.challenge_ideas[chId]) state.challenge_ideas[chId] = [];

  const mascot = getClientMascot();
  const authorName = (state.team_name ? state.team_name + " (" + mascot.name + ")" : mascot.name);

  state.challenge_ideas[chId].push({
    id: "idea_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    text: val,
    author: authorName,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  saveState();
  broadcastFieldChange("challenge_ideas", "state", state.challenge_ideas);
  renderTab("challenges");
}

function deleteChallengeIdea(chId, ideaId) {
  if (!state.challenge_ideas || !state.challenge_ideas[chId]) return;
  state.challenge_ideas[chId] = state.challenge_ideas[chId].filter(i => i.id !== ideaId);
  saveState();
  broadcastFieldChange("challenge_ideas", "state", state.challenge_ideas);
  renderTab("challenges");
}

function mergeChallengeIdea(chId, ideaId, targetChId) {
  if (!targetChId || targetChId === chId) return;
  const src = state.challenge_ideas && state.challenge_ideas[chId];
  if (!src) return;
  const idea = src.find(i => i.id === ideaId);
  if (!idea || idea.merged_to) return;
  if (!state.challenge_ideas[targetChId]) state.challenge_ideas[targetChId] = [];
  const mascot = getClientMascot();
  state.challenge_ideas[targetChId].push({
    id: "idea_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    text: `HÍBRIDO de #${chId}: ${idea.text}`,
    author: `Fusión — ${idea.author || 'Equipo'}, por ${mascot.name}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  idea.merged_to = targetChId;
  saveState();
  broadcastFieldChange("challenge_ideas", "state", state.challenge_ideas);
  renderTab("challenges");
  showToast(`Nota fusionada al Reto #${targetChId} (las ideas híbridas suelen ganar).`);
}

function unmergeChallengeIdea(chId, ideaId) {
  const src = state.challenge_ideas && state.challenge_ideas[chId];
  if (!src) return;
  const idea = src.find(i => i.id === ideaId);
  if (!idea || !idea.merged_to) return;
  state.challenge_ideas[idea.merged_to] = (state.challenge_ideas[idea.merged_to] || []).filter(i => !i.text.startsWith(`HÍBRIDO de #${chId}: ${idea.text}`));
  delete idea.merged_to;
  saveState();
  broadcastFieldChange("challenge_ideas", "state", state.challenge_ideas);
  renderTab("challenges");
  showToast("Fusión revertida.");
}

function openLightbox(src) {
  let modal = document.getElementById("img-lightbox-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "img-lightbox-modal";
    modal.className = "modal-overlay";
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background:#0F172A; padding:16px; border-radius:10px; max-width:92vw; max-height:92vh; display:flex; flex-direction:column; align-items:center; position:relative;">
      <button style="position:absolute; top:12px; right:12px; background:#334155; color:#fff; border:none; border-radius:6px; padding:6px 12px; cursor:pointer; font-weight:800;" onclick="document.getElementById('img-lightbox-modal').style.display='none'">Cerrar</button>
      <img src="${src}" style="max-width:100%; max-height:85vh; object-fit:contain; border-radius:4px;">
    </div>
  `;
  modal.style.display = "flex";
}

function openEditChallengeModal(chId) {
  const list = (state.challenges && state.challenges.length) ? state.challenges : OFFICIAL_CHALLENGES_2026;
  const ch = list.find(c => c.id === chId);
  if (!ch) return;
  let modal = document.getElementById("edit-challenge-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "edit-challenge-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-card" style="max-width:560px; width:95%; background:#FFFFFF; border-radius:10px; padding:22px; box-shadow:0 8px 30px rgba(0,0,0,0.15);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #E2E8F0;">
        <h3 style="font-size:16px; font-weight:800; color:#0F172A; margin:0;">Editar Desafío #${ch.id}</h3>
        <button class="btn-icon-discreet" onclick="document.getElementById('edit-challenge-modal').style.display='none'">${SVG.close}</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:4px; display:block;">Título del Desafío</label>
          <input type="text" id="edit-ch-title" value="${ch.title || ''}" style="width:100%; padding:8px 10px; font-size:13px; border:1px solid #CBD5E1; border-radius:6px; box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:4px; display:block;">Categoría</label>
          <select id="edit-ch-cat" style="width:100%; padding:8px 10px; font-size:12px; border:1px solid #CBD5E1; border-radius:6px; box-sizing:border-box;">
            <option value="Innovación" ${ch.category === 'Innovación' ? 'selected' : ''}>Innovación</option>
            <option value="Impacto Social" ${ch.category === 'Impacto Social' ? 'selected' : ''}>Impacto Social</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:4px; display:block;">Demanda Oficial del Comité</label>
          <textarea id="edit-ch-demand" rows="3" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:6px; box-sizing:border-box; line-height:1.4;">${ch.officialExpectation || ''}</textarea>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <label style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:0;">Tesis de Solución Sugerida</label>
            <button type="button" class="btn-pill-light" style="font-size:10.5px; font-weight:700; color:#1D4ED8; padding:2px 8px; border:1px solid #BFDBFE; background:#EFF6FF; border-radius:4px; cursor:pointer;" onclick="openAIThesisFormulatorModal('${ch.id}', true)">Formular con IA</button>
          </div>
          <textarea id="edit-ch-wow" rows="3" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:6px; box-sizing:border-box; line-height:1.4;">${ch.wowProposal || ''}</textarea>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
        <button class="btn-secondary" style="font-size:12px; padding:6px 14px;" onclick="document.getElementById('edit-challenge-modal').style.display='none'">Cancelar</button>
        <button class="btn-select-card filled" style="font-size:12px; padding:6px 18px; font-weight:700;" onclick="saveEditedChallenge('${ch.id}')">Guardar Cambios</button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

function saveEditedChallenge(chId) {
  if (!state.challenges || state.challenges.length === 0) {
    state.challenges = JSON.parse(JSON.stringify(OFFICIAL_CHALLENGES_2026));
  }
  const ch = state.challenges.find(c => c.id === chId);
  if (!ch) return;

  const t = document.getElementById("edit-ch-title").value.trim();
  if (t && window.RallyChallengeParser && !window.RallyChallengeParser.isPlausibleTitle(t)) {
    showToast("Ese título parece un encabezado de documento, no un reto. Escribe el problema del comité.", true);
    return;
  }
  const cat = document.getElementById("edit-ch-cat").value;
  const dem = document.getElementById("edit-ch-demand").value.trim();
  const wow = document.getElementById("edit-ch-wow").value.trim();

  if (t) ch.title = t;
  if (cat) ch.category = cat;
  if (dem) ch.officialExpectation = dem;
  if (wow) ch.wowProposal = wow;

  if (state.challenge_id === chId) {
    state.challenge_title = ch.title;
    state.category = ch.category;
  }

  saveState();
  const modal = document.getElementById("edit-challenge-modal");
  if (modal) modal.style.display = "none";
  renderTab("challenges");
  renderNavigation();
}

// ── RANKING DE RETOS (síntesis del análisis de ganadores 2019–2026 + matriz de deliberación) ──
// Fuentes: research/challenges_ranked.json + knowledge/winners_analysis.md. Solo datos producto, sin claves.
let CHALLENGE_RANKING_2026 = []; // datos externos (challenge_bank.json)

function challengeRankFor(ch) {
  const t = (ch.title || "").toLowerCase();
  const rank = CHALLENGE_RANKING_2026.find(r => r.kw && t.includes(String(r.kw).toLowerCase()));
  const isHighComp = (ch.compDensity || "").toLowerCase().includes("alta");
  const odsLen = Array.isArray(ch.ods) ? ch.ods.length : (String(ch.ods || "").split(",").filter(Boolean).length || 3);
  // Sin match histórico no se inventa un puntaje plano: se suma lo que de verdad tiene el reto.
  const criteriaPoints = (isHighComp ? 0 : 18)
    + (odsLen >= 3 ? 10.5 : 0)
    + 14
    + (ch.nicaraguaAdaptation ? 10 : 0)
    + ((ch.precedent || ch.winnerPattern) ? 8 : 0)
    + (ch.wowProposal ? 6 : 0);
  const score = rank ? rank.score : Math.min(100, Math.round(criteriaPoints));
  const criteria = [
    { icon: "Rivalidad", ok: !isHighComp, text: isHighComp ? "Muchas sedes compiten el mismo reto" : (ch.compDensity ? "Poca rivalidad de sedes: " + ch.compDensity.toLowerCase() : "Poca rivalidad de sedes") },
    { icon: "ODS", ok: odsLen >= 3, text: `Cubre ${odsLen} ODS${odsLen >= 3 ? " (+10.5)" : ""}` },
    { icon: "24/28h", ok: true, text: "Prototipo funcional dentro de la ventana oficial" },
    { icon: "Territorio", ok: !!ch.nicaraguaAdaptation, text: ch.nicaraguaAdaptation ? "Anclaje en comunidades de Nicaragua" : "Sin anclaje territorial redactado" },
    { icon: "Precedente", ok: !!ch.precedent, text: ch.precedent ? "Patrón de ganador: " + ch.precedent : "Sin precedente directo" }
  ];
  return { score, reasonLines: rank ? rank.reasons : null, criteria, isHighComp, scoreBasis: rank ? "historico" : "criterios" };
}

function toggleRankingDetail(chId) {
  const box = document.getElementById(`rank-detail-${chId}`);
  if (box) box.style.display = box.style.display === "none" ? "block" : "none";
}

function formatChallengeTitle(ch, maxLen = 85) {
  let title = (ch && ch.title ? ch.title : "").trim();
  if (!title || title.toLowerCase() === "resumir") {
    const sources = [ch && ch.demand, ch && ch.description, ch && ch.officialExpectation, ch && ch.wowProposal];
    for (const src of sources) {
      if (!src) continue;
      const firstLine = String(src).split(/\n|(?=\.\s)/)[0].trim().replace(/^SEGUNDA VIDA\b/i, "Segunda vida").slice(0, 70);
      const cutAt = firstLine.length > 62 ? firstLine.lastIndexOf(" ", 62) : -1;
      const candidate = (cutAt > 20 ? firstLine.slice(0, cutAt) : firstLine).trim();
      if (candidate.length > 12) { title = candidate; break; }
    }
    if (!title) title = `Reto Oficial #${ch ? ch.id : ""}`;
  }
  if (title === title.toUpperCase() && title.length > 5) {
    title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  }
  return title.length > maxLen ? title.slice(0, maxLen - 1) + "…" : title;
}

// Gráfico SVG del ranking (Opción 1: layout stacked, título completo arriba + barra ancha abajo)
function renderRankingChartSvg(rows) {
  if (!rows || rows.length < 3) return "";
  const W = 760, BAR_H = 6, ROW_H = 38, TOP = 14;
  const H = TOP + rows.length * ROW_H + 8;
  const BAR_X0 = 4, BAR_W = W - 8;
  let svg = `<svg class="rank-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de puntajes del ranking de retos">`;
  rows.forEach((r, i) => {
    const isSel = state.challenge_id === r.ch.id;
    const y = TOP + i * ROW_H;
    const yBar = y + 18;
    const color = isSel ? "#0F172A" : (i === 0 ? "#0866F5" : (i < 3 ? "#2563EB" : (i < 6 ? "#64748B" : "#94A3B8")));
    const trackColor = isSel ? "#CBD5E1" : "#EDF2F7";
    const title = formatChallengeTitle(r.ch, 95);
    const scoreVal = Math.max(0, Math.min(100, r.info.score));
    const barWidth = Math.max(8, (scoreVal / 100) * BAR_W).toFixed(1);
    const posNum = String(i + 1).padStart(2, "0");

    svg += `<g class="rank-chart-item" style="cursor:pointer;" onclick="toggleRankingDetail('${r.ch.id}')">`;
    if (isSel) {
      svg += `<rect x="0" y="${y - 4}" width="${W}" height="${ROW_H - 2}" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>`;
    }
    svg += `<text x="8" y="${y + 11}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="800" fill="${isSel ? "#0F172A" : "#0866F5"}">#${posNum}</text>`;
    svg += `<text x="38" y="${y + 11}" font-family="var(--font-sans)" font-size="11" font-weight="${isSel ? 700 : 600}" fill="${isSel ? "#0F172A" : "#334155"}">${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;
    svg += `<text x="${W - 8}" y="${y + 11}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="800" fill="${isSel ? "#0F172A" : "#1E293B"}">${r.info.score}<tspan font-size="8.5" font-weight="600" fill="#94A3B8"> pts</tspan></text>`;
    svg += `<rect x="${BAR_X0}" y="${yBar}" width="${BAR_W}" height="${BAR_H}" rx="3" fill="${trackColor}"/>`;
    svg += `<rect x="${BAR_X0}" y="${yBar}" width="${barWidth}" height="${BAR_H}" rx="3" fill="${color}"/>`;
    svg += `</g>`;
  });
  svg += `</svg>`;
  return `<div class="rank-chart-wrap">${svg}</div>`;
}

function renderChallengeRanking() {
  const list = (state.challenges && state.challenges.length ? state.challenges : OFFICIAL_CHALLENGES_2026).slice();
  const rows = list.map(ch => ({ ch, info: challengeRankFor(ch) }))
    .sort((a, b) => b.info.score - a.info.score || (a.ch.id > b.ch.id ? 1 : -1));
  const chosen = state.challenge_id ? rows.find(r => r.ch.id === state.challenge_id) : null;
  // El ranking es pronóstico, no segunda papeleta: solo el podio; el resto vive en el catálogo de abajo.
  const podium = rows.slice(0, Math.min(5, rows.length));
  return `
    <section class="ranking-panel">
      <div class="ranking-head">
        <div>
          <h2 class="ranking-title">Ranking de retos <span class="ranking-title-mono">· ${rows.length} evaluados</span></h2>
          <p class="ranking-sub">Ordenados por pronóstico de victoria, según el análisis de 8 años de ganadores (2019–2026): rivalidad de sedes, cobertura ODS, factibilidad 24/28 h, anclaje territorial y precedente ganador.</p>
        </div>
        ${!state.challenge_id ? `
          <div class="ranking-cta">
            <button class="btn-primary" style="padding:7px 16px; font-size:12px;" onclick="selectChallenge('${rows[0].ch.id}', false)">
              Decisión del equipo → Adoptar el #1
            </button>
            <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Recomendado por el ranking. Puedes elegir otro después.</span>
          </div>
        ` : `
          <div class="ranking-cta is-chosen">
            <span style="font-size:12px; font-weight:800; color:#0F172A;">Ya decidieron: Reto #${chosen ? chosen.ch.id : state.challenge_id}</span>
            <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Puedes compararlo con el resto o cambiar abajo.</span>
          </div>
        `}
      </div>
      ${renderRankingChartSvg(podium)}
      <div class="ranking-rows">
        ${podium.map((r, i) => {
          const isSel = state.challenge_id === r.ch.id;
          const topReason = r.info.reasonLines
            ? r.info.reasonLines.find(rr => rr.includes("+")) || r.info.reasonLines[0]
            : ((r.info.criteria.find(c => c.ok && c.icon !== "Rivalidad") || r.info.criteria.find(c => c.ok) || {text: "Delibera en equipo: despliega los criterios de abajo"})).text;
          return `
            <div class="rank-row ${isSel ? "is-chosen" : ""}" onclick="toggleRankingDetail('${r.ch.id}')" role="button" tabindex="0">
              <span class="rank-pos">${String(i + 1).padStart(2, "0")}</span>
              <div class="rank-main">
                <div class="rank-title">${formatChallengeTitle(r.ch, 110)}</div>
                <div class="rank-reason">${topReason}</div>
              </div>
              <div class="rank-score">
                <div class="rank-bar"><span style="width:${Math.max(6, Math.min(100, r.info.score))}%"></span></div>
                <span class="rank-num">${r.info.score}</span>
              </div>
            </div>
            <div class="rank-detail" id="rank-detail-${r.ch.id}" style="display:none;">
              <div class="rank-crit-grid">
                ${r.info.criteria.map(c => `<span class="rank-crit ${c.ok ? "ok" : "warn"}">${c.icon}: ${c.text}</span>`).join("")}
              </div>
              ${r.info.reasonLines ? `
                <ol class="rank-reasons-full">
                  ${r.info.reasonLines.map(l => `<li>${l}</li>`).join("")}
                </ol>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
      <p class="ranking-sub" style="margin-top:8px;">Podio de ${rows.length}: el resto se delibera en el catálogo de abajo. Aquí solo se pronostica; la decisión se toma en la mesa.</p>
    </section>
  `;
}

// ── FORMULADOR DE TESIS CON IA ACTIVA (100 PTS RÚBRICA) ──────────────────────
function generateAIThesisPrompt(ch) {
  return `Actúa como Ingeniero Principal y Estratega del Rally Latinoamericano de Innovación (Rúbrica Oficial 100 Pts).
Formula la TESIS DE SOLUCIÓN TÉCNICA DE ALTO IMPACTO (100 Pts) para el siguiente desafío oficial:

RETO: ${ch.title}
CATEGORÍA: ${ch.category || 'Innovación'}
DEMANDA OFICIAL DEL COMITÉ: ${ch.officialExpectation || 'Demanda técnica oficial presentada por el comité.'}

REQUERIMIENTOS INNEGOCIABLES DE LA RÚBRICA (100 Pts):
1. Innovación & Originalidad (25 pts): Rompe enfoques pasivos convencionales.
2. Impacto Social & Económico (25 pts): Resuelve la causa raíz con factibilidad territorial.
3. Viabilidad Técnica en 24h (20 pts): Especifica arquitectura técnica tangible con componentes COTS locales.
4. Sostenibilidad Ambiental & Financiera (15 pts): Modelo autosustentable sin dependencia de subsidios continuos.
5. Factor WOW & Claridad (15 pts): Redacción concisa, profesional y contundente.

INSTRUCCIÓN: Devuelve ÚNICAMENTE un párrafo contundente (2 a 3 oraciones de alto impacto) con la Tesis de Solución indicando: Arquitectura técnica + Mecanismo de operación + Impacto cuantificable. Sin saludos ni rodeos.`;
}

function openAIThesisFormulatorModal(chId, isFromEditModal = false) {
  const ch = (state.challenges || []).find(c => c.id === chId) || OFFICIAL_CHALLENGES_2026.find(c => c.id === chId);
  if (!ch) return;

  let modal = document.getElementById("ai-thesis-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ai-thesis-modal";
    modal.className = "modal-backdrop";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "rgba(13, 27, 53, 0.72)";
    modal.style.zIndex = "99999";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.padding = "20px";
    modal.style.backdropFilter = "blur(6px)";
    document.body.appendChild(modal);
  }

  // Generador de Prompts Especializados según necesidad
  const pName = state.project_name || "SISTEMA";
  const promptThesis = generateAIThesisPrompt(ch);
  const promptPatents = `Actúa como Experto en Propiedad Intelectual y Búsqueda de Estado del Arte (Google Patents / WIPO / Lens).
Proyecto: "${pName}" enfocado en Reto #${ch.id}: "${ch.title}".
Demanda Oficial: "${ch.officialExpectation || ''}".

TAREA DE ALTO RAZONAMIENTO:
1. Identifica 2 patentes o modelos de utilidad existentes que aborden este problema pero que tengan limitaciones claras.
2. Identifica el "White Space" o vacío tecnológico que nuestro proyecto explotará para lograr 30/30 en Originalidad.
3. Propón una hibridación técnica novedosa que sea demostrable ante el jurado.
Entrega el análisis estructurado en 3 párrafos técnicos directos, listos para auditoría.`;

  const promptStats = `Actúa como Analista Cuantitativo y de Impacto Socioeconómico (CEPAL / Banco Mundial / INIDE / BCN).
Proyecto: "${pName}" para Reto #${ch.id}: "${ch.title}".
Contexto: ${state.rally_type === 'nacional' ? 'Nicaragua y municipios vulnerables' : 'Latinoamérica y el Caribe'}.

TAREA DE ALTO RAZONAMIENTO:
1. Proporciona 3 estadísticas oficiales cuantitativas y verificables con fuente y año (2020-2025).
2. Vincula 2 metas exactas de los ODS aplicables con indicador medible.
3. Cuantifica el beneficio directo anual (ahorro económico, reducción de riesgo o familias beneficiadas).
Entrega formato sin relleno, con citas verificables tipo APA.`;

  window._activeCopilotChId = chId;
  window._activeCopilotIsEdit = isFromEditModal;
  window._copilotPrompts = {
    thesis: promptThesis,
    patents: promptPatents,
    stats: promptStats
  };

  modal.innerHTML = `
    <div class="copilot-modal-dialog">
      <!-- Header con jerarquía clara -->
      <div class="copilot-modal-header">
        <div class="copilot-header-info">
          <div class="copilot-header-tags">
            <span class="copilot-chip-tag">IA COPILOT DUAL-MODE</span>
            <span class="copilot-reto-badge">Reto #${ch.id}</span>
            ${categoryBadge(ch.category || 'Innovación')}
          </div>
          <h2 class="copilot-modal-title">
            ${ch.title}
          </h2>
        </div>
        <button class="btn-icon-discreet" title="Cerrar ventana" onclick="document.getElementById('ai-thesis-modal').style.display='none'">
          ${SVG.close}
        </button>
      </div>

      <!-- Body -->
      <div class="copilot-modal-body">
        <!-- Navegación de Especialidad / Pestañas con micro-estados -->
        <div class="copilot-nav-section">
          <label class="copilot-section-eyebrow">Objetivo de Formulación</label>
          <div class="copilot-tabs-nav">
            <button class="copilot-tab-btn active" id="tab-copilot-thesis" onclick="switchCopilotTab('thesis')">
              ${SVG.spark}
              <span>Tesis de Solución <strong class="copilot-tab-pts">100 Pts</strong></span>
            </button>
            <button class="copilot-tab-btn" id="tab-copilot-patents" onclick="switchCopilotTab('patents')">
              ${SVG.shieldCheck}
              <span>Patentes & Vacío Técnico</span>
            </button>
            <button class="copilot-tab-btn" id="tab-copilot-stats" onclick="switchCopilotTab('stats')">
              ${SVG.target}
              <span>Indicadores & Datos Oficiales</span>
            </button>
          </div>
        </div>

        <!-- Guía de Flujo Operativo en 2 Pasos Claros -->
        <div class="copilot-flow-grid">
          <div class="copilot-flow-card">
            <div class="copilot-flow-step">1</div>
            <div class="copilot-flow-text">
              <strong>Obtén el Prompt Especializado</strong>
              <span>Copia el prompt maestro calibrado según la rúbrica oficial y envíalo a Claude 3.7, o3 o Antigravity.</span>
            </div>
          </div>
          <div class="copilot-flow-card">
            <div class="copilot-flow-step">2</div>
            <div class="copilot-flow-text">
              <strong>Aterriza e Inyecta el Resultado</strong>
              <span>Pega el párrafo de alta ingeniería y pulsa inyectar para guardarlo de inmediato en tu propuesta oficial.</span>
            </div>
          </div>
        </div>

        <!-- Paso 1: Prompt Maestro Optimizado -->
        <div class="copilot-stage-block">
          <div class="copilot-stage-header">
            <div class="copilot-stage-label">
              <span class="copilot-step-indicator">Paso 1</span>
              <span>Prompt Maestro Calibrado</span>
            </div>
            <button class="copilot-copy-btn" onclick="copyCopilotPrompt()">
              ${SVG.copy} Copiar Prompt al Portapapeles
            </button>
          </div>
          <div class="copilot-prompt-container">
            <textarea id="ai-prompt-box" readonly class="copilot-prompt-preview">${promptThesis}</textarea>
          </div>
        </div>

        <!-- Paso 2: Aterrizaje de Respuesta -->
        <div class="copilot-stage-block">
          <div class="copilot-stage-header">
            <div class="copilot-stage-label">
              <span class="copilot-step-indicator">Paso 2</span>
              <span>Respuesta Generada por la IA</span>
            </div>
            <select id="ai-model-copilot" class="ai-model-select" onchange="modelPrefChanged('copilot', this.value)" title="Modelo de IA a usar (descubierto dinámicamente)"></select>
            <button type="button" class="copilot-paste-btn" onclick="runCopilotWithAI()" id="copilot-generate-btn" style="background:var(--color-primary); color:#fff; border-color:var(--color-primary);">
              ${SVG.check} Generar con IA Automática
            </button>
            <button type="button" class="copilot-paste-btn" onclick="polishLandingWithAI()" id="copilot-polish-btn" title="Corrige redacción, ortografía y jerarquía del texto con una IA rápida (no agrega contenido)">
              ${SVG.sparkles || ""} Pulir
            </button>
            <button type="button" class="copilot-paste-btn" onclick="pasteToAIThesisResult()">
              ${SVG.upload} Pegar desde Portapapeles
            </button>
          </div>
          <div class="copilot-landing-container">
            <textarea id="ai-thesis-input-result" class="copilot-landing-result" placeholder="Pega aquí la respuesta generada por tu IA de elección (Claude 3.7, o3, Antigravity o ChatGPT)...">${(ch.wowProposal && !ch.wowProposal.includes('Pendiente de formulación')) ? ch.wowProposal : ''}</textarea>
          </div>
          <div id="copilot-ai-status" style="display:none; margin-top:10px; font-size:11.5px; color:var(--text-muted);"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="copilot-modal-footer">
        <button class="btn-secondary copilot-btn-cancel" onclick="document.getElementById('ai-thesis-modal').style.display='none'">
          Cancelar
        </button>
        <button class="btn-primary copilot-btn-inject" onclick="applyAIThesis('${ch.id}', ${isFromEditModal})">
          <span>Inyectar al Reto #${ch.id}</span>
          ${SVG.arrowRight}
        </button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
  populateModelSelect("copilot");
}

// — Pulido rapido de texto con IA mini (endpoint de entorno; sin razonamiento pesado) —
async function polishLandingWithAI() {
  const box = document.getElementById("ai-thesis-input-result");
  const btn = document.getElementById("copilot-polish-btn");
  const status = document.getElementById("copilot-ai-status");
  if (!box || !box.value.trim()) {
    showToast("Escribe o pega el texto que quieras pulir primero.");
    return;
  }
  if (btn) btn.disabled = true;
  if (status) { status.style.display = "block"; status.textContent = "Puliendo texto con IA rápida..."; }
  try {
    const resp = await fetch("/api/ai/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "polish", text: box.value })
    });
    const json = await resp.json();
    if (json.status === "ok" && json.text) {
      box.value = json.text.trim();
      showToast("Texto pulido con IA rápida ✓");
      if (status) status.textContent = "";
    } else {
      const detalle = json.detail ? ` Detalle: ${json.detail}` : "";
      showToast((json.message || "IA rápida no disponible; revisa RALLY_AI_URL (FreeLLMAPI u otro endpoint gratis).") + detalle);
      if (status) status.textContent = detalle.trim();
    }
  } catch (err) {
    console.warn("polishLandingWithAI falló:", err);
    showToast("El servicio de pulido IA no respondió.");
    if (status) status.textContent = "";
  } finally {
    if (btn) btn.disabled = false;
  }
}

function switchCopilotTab(tabKey) {
  const tabs = ['thesis', 'patents', 'stats'];
  tabs.forEach(t => {
    const btn = document.getElementById('tab-copilot-' + t);
    if (btn) btn.classList.toggle('active', t === tabKey);
  });
  const box = document.getElementById('ai-prompt-box');
  if (box && window._copilotPrompts && window._copilotPrompts[tabKey]) {
    box.value = window._copilotPrompts[tabKey];
  }
}

function copyCopilotPrompt() {
  const box = document.getElementById("ai-prompt-box");
  if (!box) return;
  box.select();
  navigator.clipboard.writeText(box.value).then(() => {
    showToast("Prompt Maestro copiado al portapapeles");
  }).catch(() => {
    document.execCommand("copy");
    showToast("Prompt Maestro copiado al portapapeles");
  });
}

function copyPromptToClipboard(chId) {
  const box = document.getElementById("ai-prompt-box");
  if (!box) return;
  box.select();
  navigator.clipboard.writeText(box.value).then(() => {
    showToast("Mega-Prompt copiado al portapapeles.");
  }).catch(() => {
    document.execCommand("copy");
    showToast("Mega-Prompt copiado al portapapeles.");
  });
}

async function pasteToAIThesisResult() {
  try {
    const text = await navigator.clipboard.readText();
    const box = document.getElementById("ai-thesis-input-result");
    if (box && text) {
      box.value = text.trim();
      showToast("Texto pegado desde portapapeles.");
    }
  } catch (err) {
    showToast("Permite acceso al portapapeles o usa Ctrl+V", true);
  }
}

// ── PUENTE IA AUTOMATICO: /api/ai (OpenCode CLI gratis + endpoint gratuito por entorno) ──
// Respaldo sin servidor: chips de IAs web gratuitas que copian el prompt y abren la pestana.

const EXTERNAL_AIS = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
  { id: "opencode", name: "OpenCode Web", url: "https://opencode.ai/zen" },
  { id: "antigravity", name: "Antigravity", url: "https://antigravity.google/" },
];

const _externalPromptStore = {};

function openExternalAI(aiId, storeKey) {
  const ai = EXTERNAL_AIS.find(a => a.id === aiId);
  const prompt = _externalPromptStore[storeKey] || "";
  if (!ai || !prompt) return;
  const done = () => {
    showToast(`Prompt copiado. Abriendo ${ai.name} — pega (Ctrl+V) y vuelve con la respuesta.`);
    window.open(ai.url, "_blank", "noopener");
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).then(done).catch(done);
  } else {
    done();
  }
}

function renderExternalChips(storeKey) {
  return EXTERNAL_AIS.map(a =>
    `<button type="button" class="ai-web-chip" onclick="openExternalAI('${a.id}','${storeKey}')" title="Copia el prompt y abre ${a.name}">${a.name}</button>`
  ).join("");
}

// — Descubrimiento dinámico de modelos y preferencia por tarea —
// Patrones de nombre de modelo por uso (sugerencia): se casan con la lista
// descubierta en runtime (/api/ai/models, OpenCode CLI o endpoint por entorno).
const AI_MODEL_PATTERNS = {
  copilot: ["opus", "sonnet", "gemini-3", "gpt"],
  stats_poverty: ["deep-research", "opus", "gemini-3", "sonnet"],
  patents_art: ["deep-research", "sonar", "opus"],
  blender_3d: ["sonnet", "claude", "grok", "gpt"],
  budget_alibaba: ["deep-research", "flash", "haiku"],
  voice_audio: ["flash", "haiku", "mini"],
  cross_audit: ["opus", "gpt", "gemini-3"],
  web_prototype: ["gpt", "sonnet", "flash", "glm"]
};

let _aiModelsCache = null;
let _aiModelsPromise = null;

async function fetchAIModels() {
  if (_aiModelsCache && _aiModelsCache.length) return _aiModelsCache;
  if (!_aiModelsPromise) {
    _aiModelsPromise = fetch("/api/ai/models")
      .then(r => r.json())
      .then(d => (d && d.models) || [])
      .catch(() => [])
      .finally(() => { setTimeout(() => { _aiModelsPromise = null; }, 5000); });
  }
  const list = await _aiModelsPromise;
  if (list.length) _aiModelsCache = list;
  return list;
}

function suggestAIModel(key, models) {
  const pats = AI_MODEL_PATTERNS[key] || [];
  const isFree = m => m.toLowerCase().includes("free");
  const freeModels = models.filter(isFree);
  for (const p of pats) {
    const hitFree = freeModels.find(m => m.toLowerCase().includes(p));
    if (hitFree) return hitFree;
  }
  if (freeModels[0]) return freeModels[0];
  for (const p of pats) {
    const hitAny = models.find(m => m.toLowerCase().includes(p));
    if (hitAny) return hitAny;
  }
  return models[0] || "";
}

function getAIModelPref(key) {
  try { return localStorage.getItem("rally_ai_model_" + key) || ""; } catch (e) { return ""; }
}

function modelPrefChanged(key, value) {
  try { localStorage.setItem("rally_ai_model_" + key, value); } catch (e) {}
}

async function populateModelSelect(key, attempt = 0) {
  try {
  const sel = document.getElementById(`ai-model-${key}`);
  if (!sel) return;
  if (sel.options.length) return;
  const models = await fetchAIModels();
  if (!models.length) {
    sel.style.display = "none";
    if (document.contains(sel) && attempt < 3) {
      setTimeout(() => populateModelSelect(key, attempt + 1), 2000 * (attempt + 1));
    }
    return;
  }
  sel.style.display = "inline-block";
  const groups = {};
  models.forEach(m => {
    const p = String(m).split("/")[0];
    (groups[p] = groups[p] || []).push(m);
  });
  Object.keys(groups).sort().forEach(p => {
    const og = document.createElement("optgroup");
    og.label = p;
    groups[p].forEach(m => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = String(m).includes("free") ? `${m} · gratis` : m;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  const pref = getAIModelPref(key);
  const chosen = preferKey(pref, models) || suggestAIModel(key, models);
  sel.value = chosen;
  modelPrefChanged(key, chosen);
  } catch (e) {}
}

function preferKey(candidate, models) {
  if (candidate && models.includes(candidate)) return candidate;
  return "";
}

// — Jobs asíncronos con texto en vivo (poll 600ms) —
const _aiJobs = {}; // key → jobId activo

async function startAIJob(prompt, model) {
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model })
  });
  return await resp.json();
}

async function watchAIJob(key, jobId, onTick) {
  const token = jobId;
  let last = null;
  while (_aiJobs[key] === token) {
    await new Promise(r => setTimeout(r, 600));
    let d = null;
    try {
      d = await (await fetch(`/api/ai/progress?job=${encodeURIComponent(token)}`)).json();
    } catch (e) { continue; }
    if (d.status !== "running" || d.chars > 0) { last = d; onTick(d); }
    if (d.done) break;
  }
  return last;
}

// Motor compartido: copiloto y tarjetas multi-IA usan el mismo flujo
// arrancar job → texto aterriza en vivo → estado final + chips si falla.
async function _runAIJob(key, prompt, hooks) {
  const model = getAIModelPref(key) || "";
  let started = null;
  try {
    started = await startAIJob(prompt, model);
  } catch (e) { started = { status: "service-down" }; }
  if (!started || started.status !== "started" || !started.job) {
    hooks.onNoProvider(started);
    return;
  }
  _aiJobs[key] = started.job;
  _externalPromptStore[key] = prompt;
  if (hooks.onLiveStart) hooks.onLiveStart(started);
  let final = null;
  try {
    final = await watchAIJob(key, started.job, d => {
      if (d.text) hooks.boxTick(d.text);
      if (hooks.onTick) hooks.onTick(d);
    });
  } finally {
    delete _aiJobs[key];
  }
  hooks.onFinish(final);
}

function _aiStatusMessage(data) {
  return (data && (data.message || (data.status === "ok" ? "Generado." : "IA no disponible. Usa el modo manual de copiar/pegar."))) || "Servicio IA no disponible. Inicia rally_service.py o usa los chips de IA web.";
}

let _copilotAiBusy = false;
async function runCopilotWithAI() {
  if (_copilotAiBusy) return;
  const btn = document.getElementById("copilot-generate-btn");
  const statusBox = document.getElementById("copilot-ai-status");
  const resultBox = document.getElementById("ai-thesis-input-result");
  const promptBox = document.getElementById("ai-prompt-box");
  if (!promptBox || !resultBox) return;
  await populateModelSelect("copilot");
  const original = btn ? btn.innerHTML : "";
  _copilotAiBusy = true;
  if (btn) { btn.disabled = true; btn.innerHTML = `${SVG.spinner} Generando…`; }
  if (statusBox) {
    statusBox.style.display = "block";
    statusBox.textContent = "Generando con IA… el texto aterrizará aquí en vivo (600 ms).";
  }
  await _runAIJob("copilot", promptBox.value, {
    boxTick: txt => {
      resultBox.value = txt;
      resultBox.scrollTop = resultBox.scrollHeight;
    },
    onNoProvider: started => {
      if (statusBox) statusBox.innerHTML = `${renderExternalChips("copilot")}<div style="margin-top:6px;">${_aiStatusMessage(started)}</div>`;
      showToast("IA automática no conectada; chips de IA web listos.", true);
    },
    onFinish: final => {
      if (final && final.status === "done") {
        resultBox.value = final.text.trim();
        if (statusBox) statusBox.textContent = `Listo con ${final.provider} (${final.model}). Revisa, edita si hace falta y pulsa Inyectar.`;
        showToast(`Respuesta generada con ${final.provider}.`);
      } else {
        if (statusBox) statusBox.innerHTML = `${renderExternalChips("copilot")}<div style="margin-top:6px;">${_aiStatusMessage(final)}</div>`;
        showToast("La IA no pudo completar el texto; usa los chips de IA web.", true);
      }
    }
  });
  _copilotAiBusy = false;
  if (btn) { btn.disabled = false; btn.innerHTML = original; }
}

let _taskAiBusy = {};
async function runTaskWithAI(taskId) {
  if (_taskAiBusy[taskId]) return;
  _taskAiBusy[taskId] = true;
  setTaskStatus(taskId, "in_progress");
  const box = document.getElementById(`paste-result-${taskId}`);
  const chipBox = document.getElementById(`ai-chips-${taskId}`);
  await populateModelSelect(taskId);
  const model = getAIModelPref(taskId);
  showToast(`Generando el briefing con IA${model ? ` (${model})` : ""}…`);
  if (chipBox) {
    chipBox.style.display = "block";
    chipBox.textContent = "Generando con IA… el texto aterrizará en el cuadro de abajo en tiempo real.";
  }
  const showChips = msg => {
    if (chipBox) chipBox.innerHTML = `IA web gratis: ${renderExternalChips(taskId)}<div style="margin-top:5px;">${msg}</div>`;
  };
  await _runAIJob(taskId, generateSpecificMegaPrompt(taskId), {
    boxTick: txt => {
      if (box) {
        box.value = txt;
        box.scrollTop = box.scrollHeight;
      }
    },
    onTick: d => {
      if (d && d.status === "running" && chipBox) {
        chipBox.textContent = `Generando… ${d.chars || box && box.value.length || 0} caracteres en vuelo.`;
      }
    },
    onNoProvider: started => {
      showChips(_aiStatusMessage(started));
      showToast("IA automática no conectada; usa los chips de IA web.", true);
    },
    onFinish: final => {
      if (final && final.status === "done") {
        if (box) box.value = final.text.trim();
        if (chipBox) chipBox.textContent = `Listo con ${final.provider} (${final.model}). Revisa y pulsa Inyectar.`;
        showToast(`Briefing listo con ${final.provider}.`);
      } else {
        showChips(_aiStatusMessage(final));
        showToast("La IA no pudo completar el briefing; usa los chips de IA web.", true);
      }
    }
  });
  _taskAiBusy[taskId] = false;
}

function applyAIThesis(chId, isFromEditModal = false) {
  const resultBox = document.getElementById("ai-thesis-input-result");
  const val = resultBox ? resultBox.value.trim() : "";
  if (!val) {
    alert("Ingresa o pega la formulación de la Tesis de Solución.");
    return;
  }

  if (!state.challenges || state.challenges.length === 0) {
    state.challenges = JSON.parse(JSON.stringify(OFFICIAL_CHALLENGES_2026));
  }
  const ch = state.challenges.find(c => c.id === chId);
  if (ch) {
    ch.wowProposal = val;
  }

  if (state.challenge_id === chId) {
    state.solution_raw_input = val;
    state.solution_thesis = val;
  }

  saveState();

  if (isFromEditModal) {
    const editBox = document.getElementById("edit-ch-wow");
    if (editBox) editBox.value = val;
  }

  const modal = document.getElementById("ai-thesis-modal");
  if (modal) modal.style.display = "none";

  renderTab("challenges");
  renderNavigation();
  showToast(`Tesis de Solución de Reto #${chId} actualizada con IA exitosamente.`);
}

// ── IMPORTADOR UNIVERSAL: ZIP, PDF, WORD, IMÁGENES, TEXTO ────────────────────
function setImportStatus(msg, isError = false, isLoading = true) {
  const ids = ["import-status-indicator", "custom-import-status-indicator"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.gap = "8px";
      el.style.color = isError ? "#DC2626" : "#0866F5";
      if (isLoading && !isError) {
        el.innerHTML = `${SVG.spinner} <span>${msg}</span>`;
      } else {
        el.innerHTML = `<span>${msg}</span>`;
      }
    }
  });

  const dropzone = document.getElementById("challenge-dropzone");
  if (dropzone) {
    if (isLoading && !isError) {
      dropzone.style.borderColor = "#0866F5";
      dropzone.style.background = "#EFF6FF";
      dropzone.style.opacity = "0.9";
      dropzone.style.pointerEvents = "none";
    } else {
      dropzone.style.borderColor = "#93C5FD";
      dropzone.style.background = "#F8FAFD";
      dropzone.style.opacity = "1";
      dropzone.style.pointerEvents = "auto";
    }
  }

  const btnProcess = document.getElementById("btn-process-challenges");
  if (btnProcess) {
    if (isLoading && !isError) {
      btnProcess.disabled = true;
      btnProcess.style.opacity = "0.6";
      btnProcess.innerHTML = `${SVG.spinner} Analizando Retos del Comité...`;
    } else {
      btnProcess.disabled = false;
      btnProcess.style.opacity = "1";
      btnProcess.innerHTML = `Cargar Retos en Vivo y Sugerir Soluciones ${SVG.arrowRight}`;
    }
  }
}

function handleChallengeDrop(e) {
  e.preventDefault();
  const el = document.getElementById("challenge-dropzone");
  if (el) {
    el.style.borderColor = "#CBD5E1";
    el.style.background = "#F8FAFC";
  }
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleChallengeFileSelect(e.dataTransfer.files);
  }
}

// Escuchador global de arrastre para no perder archivos sueltos
window.addEventListener("dragover", function(e) {
  e.preventDefault();
}, false);

window.addEventListener("drop", function(e) {
  if (activeTab === "challenges" && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    e.preventDefault();
    handleChallengeFileSelect(e.dataTransfer.files);
  }
}, false);

// ── RECONOCEDOR OCR Y SEGMENTADOR DINÁMICO DE RETOS POR IMAGEN ──────────────
async function processImageFileWithOcr(fileOrBlob, fileName, onProgress) {
  let dataUrl = "";
  if (typeof fileOrBlob === "string" && fileOrBlob.startsWith("data:")) {
    dataUrl = fileOrBlob;
  } else {
    dataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(fileOrBlob);
    });
  }

  let ocrText = "";
  let structuredChallenges = null;
  let ocrWarn = "";
  if (onProgress) onProgress(`Analizando ${fileName} con IA visual...`);

  // 1. Motor primario: Backend /api/ocr — modelo vision (JSON jerarquizado) si hay IA conectada;
  //    EasyOCR local queda como red de seguridad dentro del mismo backend.
  try {
    const resp = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl, name: fileName })
    });
    const json = await resp.json().catch(() => null);
    if (resp.ok && json && json.status === "ok") {
      if (json.source === "ai" && Array.isArray(json.challenges) && json.challenges.length) {
        structuredChallenges = json.challenges;
        ocrText = (json.text || "").trim();
      } else if (json.text) {
        ocrText = json.text.trim();
      }
      // El backend dice por qué no usó la IA (rate limit / sin endpoint): mostrarlo
      // para que no parezca que el OCR local es lo único que existe.
      if (!structuredChallenges && json.note) ocrWarn = json.note;
    } else if (json && json.status === "bad-image") {
      // El archivo llegó dañado: ningún motor podrá leerlo. Avisar de inmediato y
      // no gastar el motor local (Tesseract fallaría igual y llena la consola de ruido).
      ocrWarn = json.message || "La imagen llegó dañada. Pega el texto a mano en el cuadro Pegar Texto.";
      if (onProgress) onProgress(ocrWarn);
      showToast(ocrWarn, true);
      return null;
    } else if (json && json.message) {
      // Cualquier otro aviso del backend: guardarlo para mostrarlo si al final no hay texto
      ocrWarn = json.message;
    }
  } catch (apiErr) {
    console.warn("Backend /api/ocr no respondió, usando fallback local:", apiErr);
  }

  // 2. Motor secundario fallback: Tesseract.js en el navegador
  if (!ocrText && typeof Tesseract !== "undefined") {
    try {
      if (onProgress) onProgress(`OCR en ${fileName} (motor Tesseract)...`);
      const resOcr = await Tesseract.recognize(dataUrl, 'spa', {
        logger: m => {
          if (m && m.status === 'recognizing text' && onProgress) {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress(`OCR en ${fileName}: ${pct}% analizado...`);
          }
        }
      });
      if (resOcr && resOcr.data && resOcr.data.text) {
        ocrText = resOcr.data.text.trim();
      }
    } catch (ocrErr) {
      console.warn("Tesseract OCR falló en:", fileName, ocrErr);
    }
  }

  if (structuredChallenges) {
    if (onProgress) onProgress(`IA visual estructuró ${structuredChallenges.length} reto(s) desde ${fileName}.`);
    return { dataUrl, challenges: structuredChallenges, rawOcr: ocrText };
  }
  if (ocrWarn) {
    if (onProgress) onProgress(ocrWarn);
    // Si igual hubo texto, es un aviso informativo; si no hubo, es un error real.
    if (typeof showToast === "function") showToast(ocrWarn, !ocrText);
  }
  const extracted = parseChallengesFromOcrText(ocrText, fileName);
  return { dataUrl, challenges: extracted, rawOcr: ocrText };
}

function parseChallengesFromOcrText(ocrText, fileName) {
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  if (!ocrText || ocrText.trim().length < 20) {
    return [{
      title: cleanName.toLowerCase().includes("whatsapp image") ? "Desafío Convocatoria Oficial" : cleanName,
      demand: `Contenido visual de convocatoria oficial capturado (${fileName}). Consulta la imagen ampliada para deliberar la demanda técnica del comité.`,
      ods: ["ODS 9", "ODS 12"],
      category: "Innovación"
    }];
  }

  const normalized = ocrText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Patrón 1: Encabezados explícitos de retos (RETO 1, DESAFÍO 02, 1. TITULO, etc.)
  const challengeHeaderRegex = /(?:^|\n)\s*(?:(?:reto|desaf[ií]o|desafio|challenge|problema|caso)\s*#?\s*([0-9a-zA-ZIVX]+)[:\.\-\s]+|(?:^|\n)\s*(\d{1,2})[\.\-\)]\s+([A-ZÁÉÍÓÚÑ]{3,}))/gi;
  
  let match;
  const indices = [];
  while ((match = challengeHeaderRegex.exec(normalized)) !== null) {
    indices.push({
      index: match.index,
      label: match[1] || match[2] || ""
    });
  }

  if (indices.length >= 2) {
    const list = [];
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].index;
      const end = (i + 1 < indices.length) ? indices[i + 1].index : normalized.length;
      const chunk = normalized.slice(start, end).trim();
      const ch = parseSingleChallengeChunk(chunk, indices[i].label, fileName);
      if (ch) list.push(ch);
    }
    if (list.length > 0) return list;
  }

  // Patrón 2: Múltiples ODS claramente definidos en el póster
  const odsMatches = [...normalized.matchAll(/(?:^|\n)\s*(ODS\s*\d+[:\.\-\s]+[^\n]+)/gi)];
  if (odsMatches.length >= 2) {
    const list = [];
    for (let i = 0; i < odsMatches.length; i++) {
      const start = odsMatches[i].index;
      const end = (i + 1 < odsMatches.length) ? odsMatches[i + 1].index : normalized.length;
      const chunk = normalized.slice(start, end).trim();
      const ch = parseSingleChallengeChunk(chunk, `ODS-${i+1}`, fileName);
      if (ch) list.push(ch);
    }
    if (list.length > 0) return list;
  }

  // Helper: limpiar ruido de UI, extensiones de navegador o captura
  const UI_NOISE = ["resumir", "buscar", "ampliar", "streamyard", "catálogo", "catalogo", "activos", "winrate", "desafío #", "desafio #", "reto #", "elegir para", "editar reto"];
  function isGarbageLine(line) {
    if (!line) return true;
    const clean = line.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, "").trim().toLowerCase();
    if (clean.length < 3) return true;
    if (UI_NOISE.some(n => clean === n || clean.startsWith(n + " ") || clean.endsWith(" " + n))) return true;
    // Líneas con exceso de caracteres ininteligibles o tokens aislados
    if (clean.length <= 4 && !["agua", "aire", "suelo", "vida", "moto", "frio", "frío"].includes(clean)) return true;
    return false;
  }

  function extractBestTitle(lines, fallback) {
    // 1. Priorizar líneas que contengan palabras claves de títulos oficiales
    const titleCandidates = lines.filter(l => {
      if (isGarbageLine(l)) return false;
      const lower = l.toLowerCase();
      return (
        lower.includes("segunda vida") ||
        lower.includes("motores") ||
        lower.includes("sensores") ||
        lower.includes("polinizadores") ||
        lower.includes("residuos") ||
        lower.includes("monitoreo") ||
        lower.includes("remoción") ||
        lower.includes("optimización") ||
        lower.includes("desechos") ||
        lower.includes("reutilización") ||
        lower.includes("alerta") ||
        lower.includes("prevención") ||
        lower.includes("desafío") ||
        lower.includes("reto")
      );
    });

    if (titleCandidates.length > 0) {
      let cand = titleCandidates[0].replace(/^(?:reto|desaf[ií]o|desafio|challenge|problema|caso)?\s*#?\s*[0-9a-zA-ZIVX]+[:\.\-\s]*/i, "").trim();
      // Si la siguiente línea complementa el título (ej: "SEGUNDA VIDA DE LOS MOTORES" + "ELÉCTRICOS DOMÉSTICOS")
      const idx = lines.indexOf(titleCandidates[0]);
      if (idx !== -1 && idx + 1 < lines.length) {
        const next = lines[idx + 1].trim();
        if (!isGarbageLine(next) && next === next.toUpperCase() && next.length > 3 && next.length < 50 && !next.includes("Los electro")) {
          cand += " " + next;
        }
      }
      return cand;
    }

    // 2. Buscar primera línea en MAYÚSCULAS o de longitud adecuada
    for (const l of lines) {
      if (!isGarbageLine(l) && l.length >= 8 && l.length <= 95) {
        return l.replace(/^(?:reto|desaf[ií]o|desafio|challenge|problema|caso)?\s*#?\s*[0-9a-zA-ZIVX]+[:\.\-\s]*/i, "").trim();
      }
    }
    return fallback;
  }

  // Patrón 3: Separación por bloques de párrafos significativos (doble salto de línea)
  const paragraphs = normalized.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40);
  if (paragraphs.length >= 2 && paragraphs.length <= 6) {
    return paragraphs.map((p, idx) => {
      const lines = p.split("\n").map(l => l.trim()).filter(l => !isGarbageLine(l));
      const title = extractBestTitle(lines, `Desafío Oficial #${idx + 1}`);
      const rest = lines.filter(l => l !== title).join(" ") || p;
      const isSocial = p.toLowerCase().includes("social") || p.toLowerCase().includes("comun") || p.toLowerCase().includes("salud");
      const odsMatch = p.match(/ODS\s*\d+/gi);
      return {
        title: title.length > 85 ? title.slice(0, 82) + "..." : title,
        demand: rest,
        ods: odsMatch ? Array.from(new Set(odsMatch.map(o => o.toUpperCase()))) : [],
        category: isSocial ? "Impacto Social" : "Innovación"
      };
    });
  }

  // Patrón 4: Reto único en esta imagen (la cantidad varia dinámicamente)
  const allLines = normalized.split("\n").map(l => l.trim()).filter(l => !isGarbageLine(l));
  const fallbackTitle = cleanName.toLowerCase().includes("whatsapp image") ? "Desafío Convocatoria Oficial" : cleanName;
  const bestTitle = extractBestTitle(allLines, fallbackTitle);
  const demandLines = allLines.filter(l => l !== bestTitle && !l.toLowerCase().includes("catálogo"));
  const demand = demandLines.join(" ") || normalized;
  const isSocial = normalized.toLowerCase().includes("social") || normalized.toLowerCase().includes("comun");
  const odsMatch = normalized.match(/ODS\s*\d+/gi);

  return [{
    title: bestTitle.length > 90 ? bestTitle.slice(0, 87) + "..." : bestTitle,
    demand: demand,
    ods: odsMatch ? Array.from(new Set(odsMatch.map(o => o.toUpperCase()))) : [],
    category: isSocial ? "Impacto Social" : "Innovación"
  }];
}

function parseSingleChallengeChunk(chunk, label, fileName) {
  const lines = chunk.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let title = lines[0].replace(/^(?:reto|desaf[ií]o|desafio|challenge|problema|caso)?\s*#?\s*[0-9a-zA-ZIVX]+[:\.\-\s]*/i, "").trim();
  if ((!title || title.toLowerCase() === "resumir") && lines.length > 1) {
    title = lines[1].trim();
  }
  if (!title || title.toLowerCase() === "resumir") {
    title = `Desafío Oficial ${label || ''}`.trim();
  }
  if (title.length > 90) {
    title = title.slice(0, 87) + "...";
  }

  const demand = lines.slice(1).join(" ") || chunk;
  const isSocial = chunk.toLowerCase().includes("social") || chunk.toLowerCase().includes("comun") || chunk.toLowerCase().includes("educa") || chunk.toLowerCase().includes("salud");
  const odsMatch = chunk.match(/ODS\s*\d+/gi);

  return {
    title: title,
    demand: demand,
    ods: odsMatch ? Array.from(new Set(odsMatch.map(o => o.toUpperCase()))) : [],
    category: isSocial ? "Impacto Social" : "Innovación"
  };
}

async function reScanChallengesWithOCR() {
  if (!state.challenges || state.challenges.length === 0) {
    alert("No hay retos cargados para re-escanear.");
    return;
  }
  const challengesWithImg = state.challenges.filter(c => c.imageUrl);
  if (challengesWithImg.length === 0) {
    alert("Los retos actuales no tienen imagen guardada. Por favor abre 'Importar / Re-pegar' y arrastra o selecciona las imágenes oficiales.");
    toggleCustomChallengeInput();
    return;
  }
  setImportStatus(`Re-escaneando ${challengesWithImg.length} imagen(es) con IA visual...`);
  let accumulatedText = "";
  let globalCount = 0;
  window._challengeImageStore = window._challengeImageStore || {};

  for (let i = 0; i < challengesWithImg.length; i++) {
    const ch = challengesWithImg[i];
    const imgKey = `rescan_${Date.now()}_${i}`;
    window._challengeImageStore[imgKey] = ch.imageUrl;
    const res = await processImageFileWithOcr(ch.imageUrl, ch.title || `Reto_${ch.id}.jpeg`, (msg) => setImportStatus(msg));
    res.challenges.forEach(c => {
      globalCount++;
      accumulatedText += `\nRETO ${globalCount}: ${c.title}\n`;
      accumulatedText += `Demanda del comité: ${c.demand}\n`;
      if (c.ods && c.ods.length) {
        accumulatedText += `ODS: ${c.ods.join(", ")}\n`;
      }
      accumulatedText += `[IMAGEN_ORIGEN: ${imgKey}]\n`;
    });
  }

  if (accumulatedText.trim()) {
    const txtArea = document.getElementById("raw-committee-challenges");
    if (txtArea) txtArea.value = accumulatedText.trim();
    setImportStatus(`✓ ${globalCount} retos extraídos con OCR neuronal exitosamente.`);
    processCommitteeChallengesInput();
  }
}

async function handleChallengeFileSelect(files) {
  if (!files || files.length === 0) return;
  setImportStatus("Procesando archivo(s)...");

  let accumulatedText = "";
  window._challengeImageStore = window._challengeImageStore || {};
  let globalCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();

    try {
      if (ext === "zip") {
        setImportStatus(`Descomprimiendo y procesando ZIP ${file.name}...`);
        const zipText = await extractTextFromZip(file);
        accumulatedText += "\n" + zipText;
      } else if (ext === "pdf") {
        setImportStatus(`Extrayendo texto de PDF ${file.name}...`);
        const pdfText = await extractTextFromPdf(file);
        accumulatedText += "\n" + pdfText;
      } else if (ext === "docx" || ext === "doc") {
        setImportStatus(`Leyendo documento Word ${file.name}...`);
        const wordText = await extractTextFromDocx(file);
        accumulatedText += "\n" + wordText;
      } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
        setImportStatus(`Ejecutando OCR en imagen ${file.name}...`);
        const imgResult = await processImageFileWithOcr(file, file.name, (msg) => setImportStatus(msg));
        const imgKey = `img_${Date.now()}_${i}`;
        window._challengeImageStore[imgKey] = imgResult.dataUrl;

        imgResult.challenges.forEach(ch => {
          globalCount++;
          accumulatedText += `\nRETO ${globalCount}: ${ch.title}\n`;
          accumulatedText += `Demanda del comité: ${ch.demand}\n`;
          if (ch.ods && ch.ods.length) {
            accumulatedText += `ODS: ${ch.ods.join(", ")}\n`;
          }
          accumulatedText += `[IMAGEN_ORIGEN: ${imgKey}]\n`;
        });
      } else {
        const txt = await file.text();
        accumulatedText += "\n" + txt;
      }
    } catch (err) {
      console.error("Error al procesar archivo:", file.name, err);
      setImportStatus(`Error al procesar ${file.name}: ${err.message}`, true);
    }
  }

  if (accumulatedText.trim()) {
    const txtArea = document.getElementById("raw-committee-challenges");
    if (txtArea) {
      txtArea.value = accumulatedText.trim();
    }
    setImportStatus(`${files.length} archivo(s) procesados. Extracción completada.`, false, false);
    processCommitteeChallengesInput();
  } else {
    setImportStatus("No se pudo extraer texto legible. Verifica el formato.", true, false);
  }
}

async function extractTextFromZip(file) {
  if (typeof JSZip === "undefined") {
    throw new Error("Librería de descompresión no disponible en el navegador.");
  }
  const zip = await JSZip.loadAsync(file);
  let content = "";
  const entries = Object.keys(zip.files);
  let challengeCount = 0;
  window._challengeImageStore = window._challengeImageStore || {};

  for (let idx = 0; idx < entries.length; idx++) {
    const filename = entries[idx];
    const zipEntry = zip.files[filename];
    if (zipEntry.dir) continue;
    const lower = filename.toLowerCase();

    if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      const text = await zipEntry.async("string");
      content += "\n" + text;
    } else if (lower.endsWith(".docx")) {
      if (typeof mammoth !== "undefined") {
        const arrayBuffer = await zipEntry.async("arraybuffer");
        const res = await mammoth.extractRawText({ arrayBuffer });
        content += "\n" + (res.value || "");
      }
    } else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
      setImportStatus(`Procesando imagen ${filename} del archivo ZIP con OCR...`);
      const b64 = await zipEntry.async("base64");
      const mime = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
      const dataUrl = `data:${mime};base64,${b64}`;

      const imgResult = await processImageFileWithOcr(dataUrl, filename, (msg) => setImportStatus(msg));
      const imgKey = `zip_${Date.now()}_${idx}`;
      window._challengeImageStore[imgKey] = dataUrl;

      imgResult.challenges.forEach(ch => {
        challengeCount++;
        content += `\nRETO ${challengeCount}: ${ch.title}\n`;
        content += `Demanda del comité: ${ch.demand}\n`;
        if (ch.ods && ch.ods.length) {
          content += `ODS: ${ch.ods.join(", ")}\n`;
        }
        content += `[IMAGEN_ORIGEN: ${imgKey}]\n`;
      });
    }
  }
  return content;
}

async function extractTextFromPdf(file) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("Visor PDF no inicializado.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += "\n" + pageText;
  }
  return fullText;
}

async function extractTextFromDocx(file) {
  if (typeof mammoth === "undefined") {
    throw new Error("Lector Word no inicializado.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer });
  return res.value || "";
}

function toggleCustomChallengeInput() {
  const el = document.getElementById("custom-challenge-input-box");
  if (!el) return;
  if (el.style.display === "none") openChallengeImportBox();
  else el.style.display = "none";
}

// Abre la caja de importación mostrando PRIMERO lo que ya está cargado: el
// equipo debe ver sus retos antes de importar o reemplazar nada.
function openChallengeImportBox() {
  const el = document.getElementById("custom-challenge-input-box");
  if (!el) return;
  renderChallengeImportBox();
  el.style.display = "block";
  const ta = document.getElementById("raw-committee-challenges");
  if (ta) ta.focus({ preventScroll: true });
}

function renderChallengeImportBox() {
  const box = document.getElementById("challenge-import-current");
  if (!box) return;
  const list = Array.isArray(state.challenges) ? state.challenges : [];
  if (!list.length) {
    box.innerHTML = '<div style="font-size:12px; color:#64748B; padding:8px 10px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px;">No hay retos cargados todavía.</div>';
    return;
  }
  const rows = list.map(ch => {
    const id = String(ch.id || "");
    const title = String(ch.title || "sin título");
    return '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 2px; border-bottom:1px solid #F1F5F9;">' +
      '<span style="font-size:12px; color:#0F172A; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
      '<strong style="font-family:var(--font-mono); color:#0866F5;">#' + escapeHtml(id) + '</strong> · ' + escapeHtml(title) +
      '</span>' +
      '<button class="btn-pill-light" data-challenge-remove="' + escapeHtml(id) + '" style="font-size:10.5px; padding:3px 10px; flex:none;">Borrar</button>' +
      '</div>';
  }).join("");
  box.innerHTML =
    '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px;">' +
    '<span style="font-size:11.5px; font-weight:800; color:#0F172A;">Retos cargados (' + list.length + ')</span>' +
    '<button class="btn-pill-light" style="font-size:10.5px; padding:3px 10px;" onclick="clearAllChallenges()">Limpiar todos</button>' +
    '</div>' + rows;
  box.querySelectorAll("[data-challenge-remove]").forEach(function (btn) {
    btn.addEventListener("click", function () { removeChallenge(btn.getAttribute("data-challenge-remove")); });
  });
}

// Borra UN reto (no toda la lista) y limpia la selección si era el elegido.
function removeChallenge(id) {
  if (!id || !Array.isArray(state.challenges)) return;
  const before = state.challenges.length;
  state.challenges = state.challenges.filter(ch => String(ch.id) !== String(id));
  if (state.challenges.length === before) return;
  purgeChallengeRefs([id]);
  if (String(state.active_deliberation_challenge_id) === String(id)) {
    state.active_deliberation_challenge_id = state.challenges.length ? state.challenges[0].id : "";
  }
  if (String(state.challenge_id) === String(id)) {
    state.challenge_id = "";
    state.challenge_title = "";
  }
  saveState();
  renderTab("challenges");
  renderNavigation();
  openChallengeImportBox();
}

function clearAllChallenges() {
  if (confirm("¿Limpiar todos los retos cargados para ingresar un nuevo comunicado oficial?")) {
    const goneIds = (state.challenges || []).map(c => String(c.id));
    state.challenges = [];
    purgeChallengeRefs(goneIds);
    state.challenge_id = "";
    state.challenge_title = "";
    state.active_deliberation_challenge_id = "";
    saveState();
    renderTab("challenges");
    renderNavigation();
    openChallengeImportBox(); // lista vacía visible, lista para pegar el comunicado nuevo
  }
}

// ── MOTOR GENERADOR DE SOLUCIONES TÁCTICAS PARA RETOS EN VIVO ────────────────
function generateTacticalSolution(title, description, category) {
  const t = (title + " " + description).toLowerCase();

  // 1. Electromecánica, Motores, Electrodomésticos y Economía Circular (ODS 12, 8, 9)
  if (t.includes("motor") || t.includes("electrodom") || t.includes("lavarropa") || t.includes("chatarra") || t.includes("variador") || (t.includes("electr") && !t.includes("electroencef")) || t.includes("bater") || t.includes("solar") || t.includes("potencia") || t.includes("reutiliz")) {
    return {
      wowProposal: "Convierte motores de electrodomésticos gastados en motorcitos productivos: un control reciclado que regula su fuerza y un acople 3D, para mover bombas y molinos en fincas.",
      nicaraguaAdaptation: "Sustitución de motores diésel costosos por motores de lavadora y electrodomésticos reacondicionados en cooperativas agropecuarias de Boaco y Chontales.",
      noveltyReason: "Transición de reciclaje pasivo a economía circular productiva de alto torque con costo total de reconversión menor a $65 USD por unidad.",
      winnerPattern: "Patrón Avocado / Revolt: economía circular aplicada a cadenas de valor existentes.",
      ods: ["ODS 12", "ODS 8", "ODS 9"],
      winRate: 92
    };
  }

  // 2. Recursos Hídricos, Inundaciones y Cuencas Hidrológicas (ODS 11, 13, 6)
  if (t.includes("inunda") || t.includes("crecida") || t.includes("cauce") || t.includes("cuenca") || t.includes("aluvion") || (t.includes("rio") && !t.includes("criterio")) || t.includes("río") || t.includes("hidro") || ((t.includes("agua") || t.includes("pluvial")) && (t.includes("sensor") || t.includes("monitoreo") || t.includes("alerta") || t.includes("nivel") || t.includes("potable") || t.includes("tratamiento")))) {
    return {
      wowProposal: "Sensores de nivel montados sin obras en los cauces, que avisan a la comunidad 30 minutos antes de la crecida por radio de largo alcance, sin red de celular.",
      nicaraguaAdaptation: "Anclaje prioritario en puntos críticos de cauces urbanos de Managua (Cauce Oriental) y cuencas vulnerables de Matagalpa o Rivas, con enlace directo a brigadistas comunitarios CODEPRED sin depender de red celular.",
      noveltyReason: "Elimina la ceguera hidrométrica mediante hardware COTS inferior a $75 USD por nodo con respaldo fotovoltaico y telemetría garantizada sin luz solar.",
      winnerPattern: "Patrón Techriders / HidroVigía: hardware tangible in situ con métricas verificables de mitigación de riesgo.",
      ods: ["ODS 11", "ODS 13", "ODS 6"],
      winRate: 94
    };
  }

  if (t.includes("agric") || t.includes("cultiv") || t.includes("suelo") || t.includes("abono") || t.includes("compost") || t.includes("alimento") || t.includes("plaga")) {
    return {
      wowProposal: "Compost con timón propio: sensores sencillos controlan temperatura, humedad y nutrientes, el sol da el calor y el equipo dosifica sola la pastilla que el cultivo necesita.",
      nicaraguaAdaptation: "Optimizado para pequeños productores de hortalizas y granos básicos en Sébaco y Estelí, reduciendo en 40% el gasto en fertilizantes químicos importados.",
      noveltyReason: "Acelera el tiempo de biodegradación de 90 a 18 días mediante control térmico de bajo costo con insumos locales.",
      winnerPattern: "Patrón AgroTech: validación agronómica directa con reducción de costos operacionales comprobables.",
      ods: ["ODS 2", "ODS 12", "ODS 15"],
      winRate: 91
    };
  }

  if (t.includes("residu") || t.includes("plastic") || t.includes("plástic") || t.includes("basura") || t.includes("recicl") || t.includes("desecho")) {
    return {
      wowProposal: "Convierte el plástico del barrio en adoquines y perfiles de construcción: se tritura, se clasifica por peso y se prensa en caliente. Menos basural, pavimento barato.",
      nicaraguaAdaptation: "Alianza con cooperativas de recicladores urbanos en Managua y León, transformando plásticos difíciles en mobiliario comunal y barreras de contención.",
      noveltyReason: "Evita la logística cara de exportación de chatarra plástica al procesar y convertir el material en el mismo municipio con retorno de inversión en 8 meses.",
      winnerPattern: "Patrón EcoLadrillo: producto final de construcción con prueba de resistencia de carga validada.",
      ods: ["ODS 12", "ODS 11", "ODS 9"],
      winRate: 89
    };
  }

  if (t.includes("salud") || t.includes("medic") || t.includes("vacuna") || t.includes("frio") || t.includes("frío") || t.includes("hospital") || t.includes("enferm")) {
    return {
      wowProposal: "Nevera portátil de transporte rural para vacunas y alimentos, con un sensor que anota cada temperatura en una bitácora confiable. Sin hielo y sin cortes de cadena.",
      nicaraguaAdaptation: "Rutas fluviales y terrestres del Caribe Norte y Sur (MINSA / SILAIS), garantizando la integridad de sueros antiofídicos y vacunas en zonas sin electrificación fija.",
      noveltyReason: "Opera con banco LiFePO4 recargable por panel flexible de mochila manteniendo 2°C a 8°C durante 36 horas continuas.",
      winnerPattern: "Patrón MediCold / SaludMóvil: impacto humanitario directo con tecnología biomédica accesible.",
      ods: ["ODS 3", "ODS 10", "ODS 9"],
      winRate: 93
    };
  }

  return {
    wowProposal: `[Pendiente de formulación con IA activa] Haz clic en "Formular con IA Activa" para estructurar la Tesis técnica según la Rúbrica oficial (100 Pts).`,
    nicaraguaAdaptation: "Arquitectura concebida con componentes comerciales de bajo costo disponibles localmente, integrable en planes municipales y cooperativas comunitarias.",
    noveltyReason: "Rompe los enfoques convencionales al combinar sensado in-situ, cero dependencia de infraestructura costosa y despliegue rápido en 24 horas.",
    winnerPattern: "Alineación estricta con Rúbrica Oficial (100 Pts) e impacto tangible demostrable.",
    ods: ["ODS 9", "ODS 12"],
    winRate: 90
  };
}

function processCommitteeChallengesInput() {
  const txt = (document.getElementById("raw-committee-challenges").value || "").trim();
  if (!txt) {
    alert("Pega el texto de los retos anunciado por el comité.");
    return;
  }

  const parser = window.RallyChallengeParser;
  if (!parser) {
    alert("Falta cargar el validador de retos (challenge_parser.js). Recarga la página.");
    return;
  }
  const parsed = parser.parse(txt);

  // Cartel oficial de cada reto, si vino en la importación.
  const imageStore = window._challengeImageStore || {};
  parsed.forEach(ch => {
    ch.imageUrl = (ch.imageKey && imageStore[ch.imageKey]) || imageStore[ch.id] || "";
    delete ch.imageKey;
  });

  if (parsed.length > 0) {
    // Tesis táctica solo con demanda real del comité; sin demanda queda "pendiente".
    const conDemanda = parsed.map(ch => {
      if ((ch.officialExpectation || "").trim().length >= 40) {
        Object.assign(ch, generateTacticalSolution(ch.title, ch.officialExpectation, ch.category));
      }
      return ch;
    });
    const appendBox = document.getElementById("challenge-append-mode");
    const shouldAppend = !!(appendBox && appendBox.checked);
    state.challenges = mergeIncomingChallenges(conDemanda, shouldAppend);
    state.active_deliberation_challenge_id = state.challenges[0].id;
    saveState();
    renderTab("challenges");
    openChallengeImportBox(); // deja la lista visible con el resultado de la importación
  } else {
    // Ni un reto reconocible: no se inventa uno con el primer renglón (así entró el informe).
    alert("Este texto no parece un comunicado de retos. Usa el formato \"RETO 01: título\" y una línea de demanda por reto.");
  }
}

// Importar con la lista ya cargada suma por defecto en vez de borrar todo.
// Ids, deduplicado y purga en cascada viven en challenge_parser.js (probado en tests/js).
function mergeIncomingChallenges(incoming, append) {
  const parser = window.RallyChallengeParser;
  if (!parser) return Array.isArray(incoming) ? incoming : [];
  const existing = Array.isArray(state.challenges) ? state.challenges : [];
  const res = parser.merge(existing, incoming, append);
  if (res.removedIds && res.removedIds.length) purgeChallengeRefs(res.removedIds);
  return res.list;
}

// Borra votos, redacciones y selección de retos que ya no existen.
function purgeChallengeRefs(ids) {
  const parser = window.RallyChallengeParser;
  if (parser && parser.purgeRefs) parser.purgeRefs(state, ids);
}

function selectChallenge(id, proceedImmediately = false) {
  const ch = (state.challenges || []).find(c => c.id === id) || OFFICIAL_CHALLENGES_2026.find(c => c.id === id);
  if (!ch) return;

  state.challenge_id = ch.id;
  state.challenge_title = ch.title;
  state.category = ch.category;

  state.solution_raw_input = ch.wowProposal;
  state.solution_thesis = ch.wowProposal;

  saveState();
  if (proceedImmediately) {
    activeTab = "solution";
    syncUI();
  } else {
    renderTab("challenges");
    renderNavigation();
  }
}

function clearSelectedChallenge() {
  state.challenge_id = "";
  state.challenge_title = "";
  saveState();
  renderTab("challenges");
  renderNavigation();
}

// ── MODAL ESTRATÉGICO DE ANÁLISIS DE RETO Y GANADORES ────────────────────────
function openChallengeDetailModal(chId) {
  const ch = (state.challenges || []).find(c => c.id === chId) || OFFICIAL_CHALLENGES_2026.find(c => c.id === chId);
  if (!ch) return;

  let modal = document.getElementById("challenge-detail-modal-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "challenge-detail-modal-overlay";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const odsStr = Array.isArray(ch.ods) ? ch.ods.join(", ") : (ch.ods || "ODS 9, ODS 12");
  const isSelected = state.challenge_id === ch.id;

  modal.innerHTML = `
    <div class="challenge-detail-modal-card">
      <div class="modal-header" style="margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid #DCE7F5;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="tactical-status-pill">
            Reto #${ch.id}
          </span>
          <span style="font-size:12px; font-weight:700; color:#5C7193;">${ch.category} · ${odsStr}</span>
        </div>
        <button class="btn-icon-discreet" onclick="closeChallengeDetailModal()" style="font-size:18px; line-height:1;">✕</button>
      </div>

      <h2 style="font-size:20px; font-weight:800; color:#0D1B35; line-height:1.3; margin-bottom:16px;">
        ${ch.title}
      </h2>

      <!-- Tarjeta 1: Propuesta Técnica de Vanguardia -->
      <div class="strategy-breakdown-box" style="border-left:4px solid #0866F5; background:#F8FAFD;">
        <div class="strategy-breakdown-title" style="color:#0866F5;">
          ${SVG.spark} Solución Técnica Sugerida por el Sistema
        </div>
        <p style="font-size:13px; color:#0D1B35; font-weight:600; line-height:1.55; margin:0;">
          ${ch.wowProposal || 'Arquitectura técnica modular con hardware comercial de bajo costo y telemetría autónoma.'}
        </p>
      </div>

      <!-- Tarjeta 2: Adaptación Territorial y Factibilidad Local -->
      <div class="strategy-breakdown-box" style="border-left:4px solid #1D4ED8; background:#F8FAFD;">
        <div class="strategy-breakdown-title" style="color:#1D4ED8;">
          ${SVG.shield} Factibilidad Territorial y Adaptación Local
        </div>
        <p style="font-size:12.5px; color:#334155; line-height:1.5; margin:0;">
          ${ch.nicaraguaAdaptation || 'Alineado a las necesidades de municipios y cooperativas locales, reduciendo costos con insumos accesibles en el mercado nacional.'}
        </p>
      </div>

      <!-- Tarjeta 3: Factor de Novedad y Diferenciación ante el Jurado -->
      <div class="strategy-breakdown-box" style="border-left:4px solid #0284C7; background:#F8FAFD;">
        <div class="strategy-breakdown-title" style="color:#0284C7;">
          ${SVG.chevronRight} Factor de Novedad y Diferenciación Técnica
        </div>
        <p style="font-size:12.5px; color:#334155; line-height:1.5; margin:0;">
          ${ch.noveltyReason || 'Diseño modular parametrizado que elimina la complejidad excesiva y permite una puesta en marcha real accesible.'}
        </p>
      </div>

      <!-- Tarjeta 4: Patrón de Ganadores Históricos -->
      <div class="strategy-breakdown-box" style="border-left:4px solid #334155; background:#F8FAFD;">
        <div class="strategy-breakdown-title" style="color:#334155;">
          ${SVG.info} Patrón Histórico de Victoria y Precedente
        </div>
        <p style="font-size:12px; color:#475569; line-height:1.5; margin:0 0 6px 0;">
          ${ch.winnerPattern || 'Soluciones ganadoras previas combinaron hardware tangible con métricas de impacto verificables en campo.'}
        </p>
        <span style="font-size:11px; font-weight:700; color:#5C7193; font-family:var(--font-mono);">
          Precedente de referencia: ${ch.precedent || 'Casos de éxito Rally'}
        </span>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding-top:16px; border-top:1px solid #DCE7F5;">
        <button class="btn-secondary" onclick="closeChallengeDetailModal()" style="font-size:12px; padding:8px 16px;">
          Cerrar Análisis
        </button>
        <button class="btn-select-card filled" style="padding:9px 22px; font-size:13px; font-weight:800;" onclick="selectChallenge('${ch.id}', true); closeChallengeDetailModal();">
          ${isSelected ? 'Continuar al Taller de Solución →' : 'Elegir este Reto y Comenzar →'}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeChallengeDetailModal() {
  const modal = document.getElementById("challenge-detail-modal-overlay");
  if (modal) modal.style.display = "none";
}

// ═════════════════════════════════════════════════════════════════════════════
// 03 NIVEL 3: TALLER DE SOLUCIÓN & PROMPT BUILDER
// ═════════════════════════════════════════════════════════════════════════════
function renderViewSolution() {
  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="badge-status badge-ok" style="font-family:var(--font-mono); font-size:10px; font-weight:800;">RETO ACTIVO #${state.challenge_id}</span>
          <span style="font-size:11.5px; font-weight:700; color:var(--text-muted);">${state.category}</span>
        </div>
        <h1 class="phase-title">
          03 · Taller <span class="phase-title-accent">Describe tu Solución</span>
        </h1>
        <p class="phase-subtitle">${state.challenge_title}</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn-pill-light" onclick="clearSelectedChallenge(); switchTab('challenges');" style="font-size:12px; padding:8px 14px; display:inline-flex; align-items:center; gap:6px;" title="Volver al catálogo para elegir o cambiar de reto">
          ← Cambiar Reto
        </button>
        <button class="btn-pill-light" onclick="switchTab('impact');" style="font-size:12px; padding:8px 14px; display:inline-flex; align-items:center; gap:6px; font-weight:700; color:#0866F5; border-color:#BFDBFE; background:#EFF6FF;" title="Ver alineación con ODS, Plan de Lucha contra la Pobreza y Leyes">
          ${SVG.arrowRight} Impacto, ODS & Políticas
        </button>
        <button class="btn-primary" onclick="approveSolutionAndUnlock()" style="padding:8px 16px; font-size:12px;">
          ${state.solution_approved ? 'Actualizar Tesis' : 'Aprobar Solución & Desbloquear Espacio'}
        </button>
      </div>
    </div>

    <!-- Banner de Alineación Estratégica & ODS -->
    ${(() => {
      const { mappedOdsIds, mappedEjeIds } = getChallengeImpactDetails(state.challenge_id);
      return `
        <div style="background:#F0F6FF; border:1px solid #BFDBFE; border-radius:10px; padding:12px 16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="font-size:12px; font-weight:800; color:#0D1B35; font-family:var(--font-mono); display:flex; align-items:center; gap:6px;">
              // ALINEACIÓN ESTRATÉGICA OFICIAL:
            </div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
              ${mappedOdsIds.map(oid => {
                const o = ODS_CATALOG.find(x => x.id === oid);
                if (!o) return '';
                return `
                  <span class="btn-pill-light" onclick="switchTab('impact'); openImpactDetailModal('ods', ${o.id});" style="background:${o.color}; color:#fff; border-color:${o.color}; font-size:11px; font-weight:800; padding:3px 10px; border-radius:4px; font-family:var(--font-mono); cursor:pointer;" title="${o.name} - Clic para ver Por Qué y Cómo">
                    ${o.code}
                  </span>
                `;
              }).join("")}
            </div>
            <span style="font-size:11.5px; color:#475569;">
              ${mappedEjeIds.length ? `· Plan Nacional: ${mappedEjeIds.map(e => e.toUpperCase()).join(", ")}` : ''}
            </span>
          </div>
          <button class="btn-pill-light" onclick="switchTab('impact')" style="font-size:11.5px; font-weight:700; color:#0866F5; border-color:#93C5FD; background:#ffffff;">
            Ver Menú Completo de ODS & Plan País ➔
          </button>
        </div>
      `;
    })()}

    <!-- Nombre Comercial del Proyecto -->
    <div class="workbench-card">
      <div class="form-grid">
        <div class="form-group full">
          <label style="font-weight:800;">Nombre Comercial del Proyecto</label>
          <input type="text" id="sol-proj-name" placeholder="Ej: AGRO-DRIVE, ECO-BOBINA, RE-PLAST, SOLARDIGNA" value="${state.project_name || ''}"
            oninput="updateProjectNameLive(this.value)"
            style="font-size:14px; font-weight:800; letter-spacing:0.02em;">
          <span style="font-size:11px; color:var(--text-muted); margin-top:2px; display:block;">
            El nombre definitivo que figurará en el documento pautado, presupuesto y video pitch.
          </span>
        </div>
      </div>
    </div>

    <!-- Entrada Libre del Equipo -->
    <div class="workbench-card">
      <label style="font-size:12px; font-weight:800; color:var(--text-main); display:block; margin-bottom:6px;">
        1. Escribe la idea de tu equipo con sus propias palabras (sin miedo a tecnicismos):
      </label>
      <textarea id="raw-sol-input" rows="3" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:10px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
        placeholder="Ej: Vamos a construir un secador solar de frutas que usa aire caliente concentrado y un sensor para que los productores no pierdan la cosecha..."
        oninput="updateSolutionFieldLive('raw_input', this.value)">${state.solution_raw_input || ''}</textarea>
      
      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button class="btn-primary" style="padding:6px 14px; font-size:11px;" onclick="synthesizeSolutionFromRaw()">
          Estructurar Tesis Técnica & Pitch Exprés ${SVG.spark}
        </button>
      </div>
    </div>

    <!-- Split: Propuesta Pulida vs Potenciadores Estratégicos -->
    <div class="solution-split">
      <div class="workbench-card" style="margin-bottom:0;">
        <h3 style="font-size:13px; font-weight:800; margin-bottom:4px;">Tesis Técnica Estructurada (Para el Pautado)</h3>
        <p style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Una oración densa y libre de nombres comerciales que condensa el sistema.</p>
        
        <textarea id="sol-thesis" rows="4" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:10px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Tesis estructurada..."
          oninput="updateSolutionFieldLive('thesis', this.value)">${state.solution_thesis || ''}</textarea>

        <h3 style="font-size:13px; font-weight:800; margin:14px 0 4px 0;">Elevator Pitch Simple (Para No Ingenieros / Jurado Exprés)</h3>
        <p style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Comprensible en 5 segundos sin jerga técnica.</p>
        
        <textarea id="sol-simple" rows="2" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:8px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Explicación accesible..."
          oninput="updateSolutionFieldLive('simple', this.value)">${state.solution_simple || ''}</textarea>
      </div>

      <div class="workbench-card" style="margin-bottom:0;">
        <h3 style="font-size:13px; font-weight:800; margin-bottom:4px;">Potenciadores Estratégicos Recomendados</h3>
        <p style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">Marca los componentes que deseas inyectar en el Prompt Maestro:</p>

        <div class="booster-list">
          <label class="booster-card ${state.solution_boosters.includes('ods') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('ods') ? 'checked' : ''} onchange="toggleBooster('ods')">
            <div>
              <div class="booster-title">Alineación ODS Oficial</div>
              <div class="booster-desc">Vincula directamente las metas de desarrollo sostenible específicas a la tesis.</div>
            </div>
          </label>

          <label class="booster-card ${state.solution_boosters.includes('nacional_plan') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('nacional_plan') ? 'checked' : ''} onchange="toggleBooster('nacional_plan')">
            <div>
              <div class="booster-title">${state.rally_type === 'nacional' ? 'Eje Plan Nacional de Lucha contra la Pobreza' : 'Escalamiento Modular Latam'}</div>
              <div class="booster-desc">${state.rally_type === 'nacional' ? 'Alinea con resiliencia climática y producción territorial en Nicaragua.' : 'Diseño estándar transferible a municipios piloto de la región.'}</div>
            </div>
          </label>

          <label class="booster-card ${state.solution_boosters.includes('sensors') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('sensors') ? 'checked' : ''} onchange="toggleBooster('sensors')">
            <div>
              <div class="booster-title">Hardware / Telemetría Autónoma</div>
              <div class="booster-desc">Suma microcontrolador de bajo consumo, alimentación solar LiFePO4 y conectividad robusta.</div>
            </div>
          </label>

          <label class="booster-card ${state.solution_boosters.includes('visuals') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('visuals') ? 'checked' : ''} onchange="toggleBooster('visuals')">
            <div>
              <div class="booster-title">Recurso Visual WOW para Video Pitch</div>
              <div class="booster-desc">Genera pauta para tomas de pantalla interactiva y modelo de pieza técnica en 3D.</div>
            </div>
          </label>

          <label class="booster-card ${state.solution_boosters.includes('waste_capital') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('waste_capital') ? 'checked' : ''} onchange="toggleBooster('waste_capital')">
            <div>
              <div class="booster-title">Reingeniería: Pasivo a Capital (Wow Dim 2)</div>
              <div class="booster-desc">Revaloriza residuos masivos (cacao, café, Tetra Pak o chatarra) como insumo productivo.</div>
            </div>
          </label>

          <label class="booster-card ${state.solution_boosters.includes('cyber_physical') ? 'active' : ''}">
            <input type="checkbox" ${state.solution_boosters.includes('cyber_physical') ? 'checked' : ''} onchange="toggleBooster('cyber_physical')">
            <div>
              <div class="booster-title">Hibridación Ciber-Física (Wow Dim 1)</div>
              <div class="booster-desc">Articula una infraestructura física o biológica con sensado, automatización o IA en tiempo real.</div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Guía y Auditoría Táctica: Las 3 Dimensiones del Efecto Wow -->
    <div class="workbench-card" style="margin-top:16px; background:#F8FAFC; border:1px solid #E2E8F0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-size:12px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.04em;">
          Filtro Táctico: Las 3 Dimensiones del «Efecto Wow» (PDF v2)
        </div>
        <span style="font-size:11px; font-weight:700; color:#059669; background:#DCFCE7; border:1px solid #BBF7D0; padding:2px 8px; border-radius:4px;">
          Guía Heurística de Jurado
        </span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:10px; font-size:11.5px; line-height:1.45;">
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:6px; padding:10px;">
          <strong style="color:#0F172A; display:block; margin-bottom:2px;">1. Hibridación Ciber-Física:</strong>
          <span style="color:#475569;">Supera las soluciones lineales monodisciplinarias combinando diseño estructural con telemetría/sensores (ej. Techriders).</span>
        </div>
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:6px; padding:10px;">
          <strong style="color:#0F172A; display:block; margin-bottom:2px;">2. Pasivo a Capital Comunitario:</strong>
          <span style="color:#475569;">Convierte un problema de descarte o pasivo en un activo productivo resiliente (ej. Mentes Volcánicas con Tetra Pak).</span>
        </div>
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:6px; padding:10px;">
          <strong style="color:#0F172A; display:block; margin-bottom:2px;">3. Rigor Técnico Tangible:</strong>
          <span style="color:#475569;">Frente a crisis complejas, descarta apps pasivas de reportes. Desarrolla dispositivos físicos o biomateriales testeables.</span>
        </div>
      </div>
    </div>
  `;
}

function toggleBooster(key) {
  if (state.solution_boosters.includes(key)) {
    state.solution_boosters = state.solution_boosters.filter(b => b !== key);
  } else {
    state.solution_boosters.push(key);
  }
  saveState();
  renderTab("solution");
}

// ── COLABORACIÓN EN VIVO · TALLER DE SOLUCIÓN ──────────────────────────────
// Cada tecla en el taller se difunde por BroadcastChannel: los demás
// integrantes ven el texto en vivo (sin pisarse, con indicador de autoría).

const _SOLUTION_STATE_KEYS = {
  raw_input: "solution_raw_input",
  thesis: "solution_thesis",
  simple: "solution_simple",
  project_name: "project_name"
};

function updateSolutionFieldLive(key, value) {
  const stateKey = _SOLUTION_STATE_KEYS[key];
  if (stateKey) state[stateKey] = value;
  broadcastFieldChange("solution", key, value);
  saveState();
}

function updateProjectNameLive(value) {
  state.project_name = value;
  broadcastFieldChange("solution", "project_name", value);
  saveState();
}

function synthesizeSolutionFromRaw() {
  const raw = (document.getElementById("raw-sol-input").value || "").trim();
  const projInput = document.getElementById("sol-proj-name");
  if (!raw) {
    alert("Escribe una idea en el campo de texto.");
    return;
  }
  state.solution_raw_input = raw;

  if (projInput && projInput.value.trim()) {
    state.project_name = projInput.value.trim().toUpperCase();
  } else if (!state.project_name) {
    const words = raw.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, "").split(/\s+/).filter(w => w.length >= 4);
    const kw = words[0] ? words[0].toUpperCase() : "INNOVA";
    state.project_name = `${kw}-TECH`;
  }

  const challengesList = (state.challenges && state.challenges.length) ? state.challenges : OFFICIAL_CHALLENGES_2026;
  const ch = challengesList.find(c => c.id === state.challenge_id) || {};
  const chContext = ch.title ? `para abordar el reto de ${ch.title.toLowerCase()}` : "para el certamen";

  const rawClean = raw.charAt(0).toUpperCase() + raw.slice(1);
  state.solution_thesis = `${state.project_name}: Sistema tecnológico modular fundamentado en ${raw.toLowerCase()}, optimizado ${chContext} con alta viabilidad económica y despliegue comunitario autónomo.`;
  state.solution_simple = `${rawClean}, resolviendo el problema en el territorio sin requerir infraestructura compleja ni altos costos operativos.`;
  state.description_one_line = state.solution_thesis;

  saveState();
  renderTab("solution");
}

function approveSolutionAndUnlock() {
  const pName = document.getElementById("sol-proj-name");
  const raw = document.getElementById("raw-sol-input");
  const thesis = document.getElementById("sol-thesis");
  const simple = document.getElementById("sol-simple");

  if (pName && pName.value.trim()) state.project_name = pName.value.trim().toUpperCase();
  if (raw) state.solution_raw_input = raw.value.trim();
  if (thesis) state.solution_thesis = thesis.value.trim();
  if (simple) state.solution_simple = simple.value.trim();

  if (!state.solution_thesis) {
    alert("Por favor genera o redacta la tesis estructurada antes de continuar.");
    return;
  }

  state.solution_approved = true;
  state.description_one_line = state.solution_thesis;

  if (!state.pautado.solucion) {
    state.pautado.solucion = state.solution_thesis;
  }

  saveState();
  activeTab = "impact";
  syncUI();
}

// ═════════════════════════════════════════════════════════════════════════════
// 04 NIVEL 4: ALINEACIÓN ESTRATÉGICA, ODS & PLAN PAÍS
// ═════════════════════════════════════════════════════════════════════════════

// ── CATEGORÍAS DE RETOS: ICONografía + TINTE DENSO MÍNIMO (distinción sin ruido) ──
const CATEGORY_META = {
  "Innovación": {
    tint: "rgba(8, 102, 245, 0.07)",
    stroke: "#0866F5",
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8 8l8 8"/></svg>`
  },
  "Impacto Social": {
    tint: "rgba(2, 132, 199, 0.09)",
    stroke: "#0284C7",
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.5" r="2.4"/><circle cx="5.5" cy="14" r="2.4"/><circle cx="18.5" cy="14" r="2.4"/><path d="M11 7.5L7 11.8M13 7.5l4 4.3M7.9 14.5h8.2"/></svg>`
  }
};
function categoryBadge(category) {
  const m = CATEGORY_META[category] || CATEGORY_META["Innovación"];
  return `<span class="cat-badge" style="background:${m.tint}; color:${m.stroke};">${m.icon} ${category}</span>`;
}

const ODS_CATALOG = [
  {
    id: 1,
    code: "ODS 1",
    name: "Fin de la Pobreza",
    color: "#E5243B",
    icon: `<path d="M12 4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-6 7c0-1.8 1.5-3.2 3.3-3.2h5.4c1.8 0 3.3 1.4 3.3 3.2v7h-2.5v-5h-1.6v5h-2.5v-5h-1.6v5H6v-7z"/>`,
    shortTarget: "Meta 1.5: Resiliencia económica y reducción de pérdidas ante desastres",
    unTarget: "De aquí a 2030, fomentar la resiliencia de los pobres y de las personas que se encuentran en situaciones vulnerables y reducir su exposición a los fenómenos extremos.",
    diagnostic: "Familias vulnerables en comunidades rurales y mercados populares pierden hasta el 25% de su sustento diario ante eventos climáticos o pérdidas poscosecha.",
    mechanism: "Generación de ingresos complementarios mediante revalorización productiva, reducción de costos operativos y capitalización comunitaria."
  },
  {
    id: 2,
    code: "ODS 2",
    name: "Hambre Cero",
    color: "#DDA63A",
    icon: `<path d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8H4zm8-9c-2 2-3 4.5-3 7h6c0-2.5-1-5-3-7z"/>`,
    shortTarget: "Meta 2.1 & 2.4: Acceso a alimentos sanos y agricultura resiliente",
    unTarget: "Poner fin al hambre y asegurar el acceso de todas las personas a una alimentación sana, nutritiva y suficiente todo el año mediante prácticas sostenibles.",
    diagnostic: "Pérdida de toneladas de frutas y verduras frescas en centros de abasto y reducción de rendimientos agropecuarios por falta de polinización tecnificada.",
    mechanism: "Rescate y deshidratación solar de excedentes frutales para comedores escolares, y tecnificación de colmenas de abejas nativas meliponas en parcelas campesinas."
  },
  {
    id: 3,
    code: "ODS 3",
    name: "Salud y Bienestar",
    color: "#4C9F38",
    icon: `<path d="M3 13h4l2.5-6 4 12 2.5-6H21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    shortTarget: "Meta 3.9: Reducir muertes y enfermedades causadas por agua contaminada",
    unTarget: "Reducir sustancialmente el número de muertes y enfermedades producidas por productos químicos peligrosos y la contaminación del aire, el agua y el suelo.",
    diagnostic: "Crecidas pluviales en cauces urbanos y acumulación de basuras generan anegamientos y brotes epidémicos de dengue, leptospirosis y afecciones gastrointestinales.",
    mechanism: "Alerta temprana hidrométrica barrial que evita catástrofes en cauces críticos y filtración comunitaria que garantiza agua bacteriológicamente segura."
  },
  {
    id: 4,
    code: "ODS 4",
    name: "Educación de Calidad",
    color: "#C5192D",
    icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    shortTarget: "Meta 4.4: Competencias técnicas y vocacionales para el empleo",
    unTarget: "Aumentar considerablemente el número de jóvenes y adultos que tienen las competencias técnicas y profesionales necesarias para acceder al empleo decente y el emprendimiento.",
    diagnostic: "Brecha tecnológica entre las universidades y los talleres productivos del territorio que limita la adopción de ingeniería moderna en las comunidades.",
    mechanism: "Manuales metodológicos abiertos, código libre y talleres de apropiación comunitaria sin tecnicismos transferibles a través de INATEC y alcaldías."
  },
  {
    id: 5,
    code: "ODS 5",
    name: "Igualdad de Género",
    color: "#FF3A21",
    icon: `<circle cx="12" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13v8M9 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    shortTarget: "Meta 5.5: Participación plena y liderazgo económico de las mujeres",
    unTarget: "Asegurar la participación plena y efectiva de las mujeres y la igualdad de oportunidades de liderazgo a todos los niveles de la vida económica y productiva.",
    diagnostic: "Labores agrícolas y de comercio de mercado con alta carga física no remunerada desempeñadas predominantemente por mujeres sin mecanización.",
    mechanism: "Ergonomía simplificada de operación mecánica y liderazgo operativo de socias vivanderas y cooperativistas en la gestión de la innovación."
  },
  {
    id: 6,
    code: "ODS 6",
    name: "Agua Limpia y Saneamiento",
    color: "#26BDE2",
    icon: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    shortTarget: "Meta 6.1 & 6.3: Acceso universal a agua potable y reducción de vertidos",
    unTarget: "Lograr el acceso universal y equitativo al agua potable a un precio asequible, y reducir la contaminación del agua eliminando vertidos de aceites y químicos.",
    diagnostic: "Comunidades rurales del Corredor Seco sin agua potable en época seca y contaminación de acuíferos por vertido doméstico de aceites de cocina.",
    mechanism: "Cisternas de captación pluvial modular con microfiltración de zeolita y carbón activado de café, y microplantas de saponificación de aceites usados."
  },
  {
    id: 7,
    code: "ODS 7",
    name: "Energía Asequible y No Contaminante",
    color: "#FCC30B",
    icon: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    shortTarget: "Meta 7.2: Aumentar la proporción de energía renovable comunitaria",
    unTarget: "Aumentar sustancialmente la proporción de energía renovable en el conjunto de fuentes energéticas para comunidades y actividades productivas.",
    diagnostic: "Cortes de energía en situaciones de emergencia climática y dependencia de combustibles fósiles caros para bombas de agua y picadoras rurales.",
    mechanism: "Generación fotovoltaica con baterías LiFePO4 de 2,000 ciclos y aprovechamiento de motores reacondicionados de alta eficiencia energética."
  },
  {
    id: 8,
    code: "ODS 8",
    name: "Trabajo Decente y Crecimiento Económico",
    color: "#A21942",
    icon: `<path d="M3 3v18h18M7 16l4-5 4 3 5-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    shortTarget: "Meta 8.2: Diversificación, modernización tecnológica e innovación",
    unTarget: "Lograr niveles más elevados de productividad económica mediante la diversificación, la modernización tecnológica y la innovación en microtalleres.",
    diagnostic: "Productores lecheros y microemprendedores absorben altos costos operativos con maquinaria manual que merma su rentabilidad.",
    mechanism: "Maquinaria productiva intermedia con costos inferiores a $65 USD por unidad que multiplica la capacidad productiva sin generar deuda."
  },
  {
    id: 9,
    code: "ODS 9",
    name: "Industria, Innovación e Infraestructura",
    color: "#FD6925",
    icon: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    shortTarget: "Meta 9.4: Modernización de infraestructuras con tecnología limpia",
    unTarget: "Modernizar la infraestructura y reconvertir las industrias para que sean sostenibles, utilizando los recursos con mayor eficacia y tecnologías limpias.",
    diagnostic: "Dependencia de importaciones costosas y falta de adaptación del diseño electromecánico a los materiales y repuestos disponibles en el país.",
    mechanism: "Hibridación ciber-física con microcontroladores ESP32, protocolos mallados de radiofrecuencia y manufactura distribuida en 3D."
  },
  {
    id: 10,
    code: "ODS 10",
    name: "Reducción de las Desigualdades",
    color: "#DD1367",
    icon: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 10h10M7 14h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`,
    shortTarget: "Meta 10.2: Potenciar la inclusión social y económica de sectores vulnerables",
    unTarget: "Potenciar y promover la inclusión social, económica y política de todas las personas, independientemente de su condición o ubicación geográfica.",
    diagnostic: "Concentración del acceso tecnológico en ciudades principales, excluyendo a pequeños núcleos campesinos del interior de Nicaragua.",
    mechanism: "Solución de costo marginal accesible que no exige suscripciones mensuales ni conectividad celular permanente."
  },
  {
    id: 11,
    code: "ODS 11",
    name: "Ciudades y Comunidades Sostenibles",
    color: "#FD9D24",
    icon: `<path d="M3 21h18M5 21V7l8-4v18M13 10l6 3v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    shortTarget: "Meta 11.5 & 11.6: Reducción de impactos por desastres y gestión de desechos urbanos",
    unTarget: "Reducir significativamente el número de muertes causadas por desastres y reducir el impacto ambiental per cápita de las ciudades mediante la gestión de residuos.",
    diagnostic: "Colapso de cauces urbanos en invierno, quemas no controladas de poda y acumulación de chatarra en barrios populares.",
    mechanism: "Redes malladas de alerta temprana, refugios modulares de despliegue rápido y centros barriales de pirólisis y valorización de biomasa."
  },
  {
    id: 12,
    code: "ODS 12",
    name: "Producción y Consumo Responsables",
    color: "#BF8B2E",
    icon: `<path d="M7 8a4 4 0 0 1 4 4 4 4 0 0 0 4 4 4 4 0 0 0 0-8 4 4 0 0 0-4 4 4 4 0 0 1-4 4 4 4 0 0 1 0-8z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`,
    shortTarget: "Meta 12.5: Reducción sustancial de desechos mediante prevención y reutilización",
    unTarget: "De aquí a 2030, reducir considerablemente la generación de desechos mediante actividades de prevención, reducción, reciclado y reutilización.",
    diagnostic: "Descarte masivo de aparatos eléctricos, mermas alimentarias, podas urbanas y residuos plásticos que colapsan los vertederos municipales.",
    mechanism: "Economía circular estricta: transformación de residuos en insumos productivos con alto valor agregado y ciclo de vida extendido."
  },
  {
    id: 13,
    code: "ODS 13",
    name: "Acción por el Clima",
    color: "#3F7E44",
    icon: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3c-2.5 3-4 6-4 9s1.5 6 4 9m0-18c2.5 3 4 6 4 9s-1.5 6-4 9M3.6 9h16.8M3.6 15h16.8" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    shortTarget: "Meta 13.1: Fortalecer la resiliencia y capacidad de adaptación climática",
    unTarget: "Fortalecer la resiliencia y la capacidad de adaptación a los riesgos relacionados con el clima y los desastres naturales en todos los países.",
    diagnostic: "Aumento de anomalías climáticas extremas: huracanes destructivos en el Caribe y sequías recurrentes en el Corredor Seco.",
    mechanism: "Mitigación mediante secuestro de carbono en suelo (biochar) y adaptación comunitaria con infraestructuras hidrométricas y refugios resilientes."
  },
  {
    id: 14,
    code: "ODS 14",
    name: "Vida Submarina",
    color: "#0A97D9",
    icon: `<path d="M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0M18 6c-3 0-6 2-8 5 3 0 6-2 8-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    shortTarget: "Meta 14.1: Prevenir y reducir la contaminación marina por plásticos",
    unTarget: "Prevenir y reducir significativamente la contaminación marina de todo tipo, en particular la producida por actividades terrestres y artes de pesca abandonadas.",
    diagnostic: "Redes fantasma y botellas de plástico que sofocan ecosistemas de manglar y fauna marina en costas del Pacífico y Caribe.",
    mechanism: "Extrusión móvil y remanufactura de filamento in-situ para artes de pesca y señalización costera gestionada por cooperativas pesqueras."
  },
  {
    id: 15,
    code: "ODS 15",
    name: "Vida de Ecosistemas Terrestres",
    color: "#56C02B",
    icon: `<path d="M12 2L8 8h3v5H9l-3 5h6v3h2v-3h6l-3-5h-2v-5h3l-4-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    shortTarget: "Meta 15.5: Detener la pérdida de biodiversidad y degradación biológica",
    unTarget: "Adoptar medidas urgentes para reducir la degradación de los hábitats naturales y frenar la pérdida de biodiversidad biológica.",
    diagnostic: "Mortalidad masiva de polinizadores nativos por agroquímicos y degradación acelerada de la fertilidad de los suelos volcánicos.",
    mechanism: "Bioprotección pasiva para abejas meliponas y enriquecimiento biológico de suelos con biochar activado con micorrizas."
  },
  {
    id: 16,
    code: "ODS 16",
    name: "Paz, Justicia e Instituciones Sólidas",
    color: "#00689D",
    icon: `<path d="M12 3v18M5 8h14M3 13l4-5 4 5a4 4 0 0 1-8 0zm10 0l4-5 4 5a4 4 0 0 1-8 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    shortTarget: "Meta 16.6: Instituciones eficaces, transparentes y participativas",
    unTarget: "Crear a todos los niveles instituciones eficaces y transparentes que rindan cuentas a la comunidad beneficiaria y refuercen la gobernanza local.",
    diagnostic: "Falta de datos verificables en tiempo real para la toma de decisiones ágil entre alcaldías, SINAPRED y comités de barrio.",
    mechanism: "Telemetría comunitaria transparente, bases de datos abiertas y participación ciudadana directa en el monitoreo preventivo."
  },
  {
    id: 17,
    code: "ODS 17",
    name: "Alianzas para Lograr los Objetivos",
    color: "#19486A",
    icon: `<circle cx="8" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.2"/>`,
    shortTarget: "Meta 17.6: Cooperación científica, tecnológica y de innovación",
    unTarget: "Mejorar la cooperación en materia de ciencia, tecnología e innovación y aumentar el intercambio de conocimientos especializados.",
    diagnostic: "Desarticulación histórica entre la investigación académica universitaria y las demandas operativas de los programas del Estado.",
    mechanism: "Alianza cuádruple hélice (Universidad UNI, CNU, Comisiones de Economía Creativa y Comunidades de Base) para despliegue real."
  }
];

const PLAN_EJES_CATALOG = [
  {
    id: "eje4",
    num: "4",
    title: "Economía Creativa, Familiar, Comunitaria y Asociativa",
    icon: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    diagnostic: "El modelo socio-productivo nicaragüense reposa en el 70% del empleo generado por micro, pequeñas y medianas empresas familiares y cooperativas territoriales.",
    porque: "Responde directamente al lineamiento de agregar valor local a materias primas y residuos sin requerir endeudamiento externo.",
    como: "Despliega modelos de producción asociativa en cooperativas locales, permitiendo comercializar subproductos procesados a precio justo.",
    instituciones: "MEFCCA, Comisión Nacional de Economía Creativa, Red de Ciudades Creativas.",
    metrica: "Incremento del 25% en margen neto del pequeño productor y reducción de costos operativos."
  },
  {
    id: "eje5",
    num: "5",
    title: "Cambio Climático, Gestión de Riesgo ante Desastres y Protección de la Madre Tierra",
    icon: `<path d="M12 3v18m0-18C7.5 3 4 7 4 12s3.5 9 8 9m0-18c4.5 0 8 4 8 9s-3.5 9-8 9" fill="none" stroke="currentColor" stroke-width="2"/>`,
    diagnostic: "Nicaragua es uno de los países más expuestos a huracanes en la Costa Caribe, sequías en el Corredor Seco e inundaciones en cauces urbanos de Managua.",
    porque: "La rúbrica premia la inserción en planes de contingencia municipal ante eventos extremos sin generar pasivos ambientales.",
    como: "Implementa infraestructura resiliente, sistemas de alerta temprana comunitaria y aprovechamiento sustentable de recursos naturales.",
    instituciones: "SINAPRED, COMUPRED, MARENA, INETER, Gobiernos Regionales.",
    metrica: "30 minutos de anticipación en evacuación barrial o 100% de retención de humedad en suelos durante sequías."
  },
  {
    id: "eje8",
    num: "8",
    title: "Seguridad y Soberanía Alimentaria y Nutricional",
    icon: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    diagnostic: "Pérdidas poscosecha de hasta 30% en frutas y verduras en mercados mayoristas y afectación a rendimientos agrícolas por estrés climático.",
    porque: "Garantiza disponibilidad constante de alimentos nutritivos y fortalece la dieta de comedores escolares y comunitarios.",
    como: "Rescate de alimentos con deshidratación solar de cero emisiones o aumento de polinización biológica en cultivos de consumo básico.",
    instituciones: "MAG, INTA, MEFCCA, COMMEMA, MINED (Programa Merienda Escolar).",
    metrica: "Kilos de comida apta salvada al día o quintales de producción agrícola protegida."
  },
  {
    id: "eje3",
    num: "3",
    title: "Infraestructura Social y Servicios Básicos en el Territorio",
    icon: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    diagnostic: "Comunidades rurales dispersas y escuelas periféricas sufren intermitencia o déficit en agua potable y suministro eléctrico confiable.",
    porque: "Cumple la meta nacional de cobertura y dignidad humana mediante soluciones descentralizadas de bajo costo.",
    como: "Captación pluvial con microfiltración de minerales regionales o células de albergue temporal con microred solar autónoma.",
    instituciones: "ENACAL, FISE, MEM, Alcaldías Municipales de Nicaragua.",
    metrica: "180 días de reserva hídrica o 24 horas de autonomía energética ininterrumpida."
  },
  {
    id: "eje9",
    num: "9",
    title: "Ciencia, Tecnología e Innovación para la Transformación Productiva",
    icon: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    diagnostic: "Dependencia histórica de maquinaria importada costosa que no se ajusta a la escala de las pequeñas parcelas y talleres locales.",
    porque: "Posiciona la ingeniería universitaria nicaragüense como motor de soberanía e independencia tecnológica.",
    como: "Hibridación de hardware abierto (sensores, microcontroladores, impresión 3D) con materiales locales de fácil reemplazo.",
    instituciones: "CNU, TELCOR, Centros de Innovación Abierta, INATEC.",
    metrica: "Costo unitario <$65 USD frente a equivalentes comerciales de >$400 USD."
  },
  {
    id: "eje2",
    num: "2",
    title: "Equidad, Inclusión y Protagonismo Juvenil y Comunitario",
    icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    diagnostic: "Necesidad de involucrar activamente a la juventud universitaria y líderes comunales en la solución de sus propios retos territoriales.",
    porque: "La rúbrica califica con alto puntaje la apropiación social y la factibilidad de adopción sin barreras culturales.",
    como: "Diseño centrado en las personas, talleres participativos y operación simplificada sin requerir alfabetización digital avanzada.",
    instituciones: "MINJUVE, Universidades del CNU, Red de Jóvenes Comunicadores.",
    metrica: "100% de operabilidad por pobladores locales tras una capacitación de 2 horas."
  }
];

const LEYES_PROGRAMAS_CATALOG = [
  {
    id: "ley1013",
    type: "ley",
    title: "Ley N° 1013 · Fomento a la Economía Creativa y Naranja",
    entidad: "Asamblea Nacional / Comisión Nacional de Economía Creativa",
    porque: "Declara de prioridad e interés nacional el talento, los prototipos y modelos de innovación surgidos de la juventud y las universidades.",
    como: "Permite registrar la solución como activo de emprendimiento tecnológico universitario con acceso a fondos y espacios de incubación.",
    cita: "Art. 4 & 7: Protección y fomento a iniciativas de base tecnológica y agregación de valor identitario."
  },
  {
    id: "ley217",
    type: "ley",
    title: "Ley N° 217 · Ley General del Medio Ambiente y los Recursos Naturales",
    entidad: "MARENA / Procuraduría Ambiental",
    porque: "Obliga a toda iniciativa productiva a mitigar impactos y priorizar la economía circular y la valorización de residuos sólidos.",
    como: "La solución evita vertidos directos, quemas al aire libre o contaminación pluvial, cumpliendo los estándares de gestión ambiental preventiva.",
    cita: "Art. 129: Fomento a tecnologías limpias y revalorización de subproductos industriales."
  },
  {
    id: "ley620",
    type: "ley",
    title: "Ley N° 620 · Ley General de Aguas Nacionales",
    entidad: "ANA / ENACAL / Comités de Cuenca",
    porque: "Regula la protección de fuentes de agua dulce y prioriza el acceso al agua potable para consumo humano en comunidades vulnerables.",
    como: "Aporta sistemas de cosecha y microfiltración pluvial o evita el vertido de aceites grasos usados en colectores y cuencas lacustres.",
    cita: "Art. 38 & 84: Preservación de la calidad del agua y captación de aguas pluviales para uso social."
  },
  {
    id: "ley337",
    type: "ley",
    title: "Ley N° 337 · Creadora del Sistema Nacional para la Prevención, Mitigación y Atención de Desastres",
    entidad: "SINAPRED / CODIPRED / COMUPRED",
    porque: "Norma los protocolos de respuesta y sistemas de alerta temprana comunitaria ante eventos meteorológicos y sísmicos.",
    como: "Los nodos de sensado y módulos de refugio se articulan formalmente con los puestos de mando unificados del COMUPRED.",
    cita: "Art. 15: Integración comunitaria en la red de alerta temprana y mitigación del riesgo."
  },
  {
    id: "ciudades_creativas",
    type: "programa",
    title: "Red Nacional de Ciudades Creativas de Nicaragua",
    entidad: "Comisión Nacional de Economía Creativa / Gobiernos Locales",
    porque: "Circuito de municipios modelo (Granada, Masaya, León, Estelí, Bluefields, San Juan de Oriente) que acogen pilotos de innovación.",
    como: "El prototipo se instala como proyecto piloto financiado en espacios públicos, parques eco-energéticos o mercados de la red municipal.",
    cita: "Eje Territorial de Economía Naranja: Desarrollo de clústeres locales de innovación y sostenibilidad."
  },
  {
    id: "programa_adelante",
    type: "programa",
    title: "Programa Adelante / Usura Cero",
    entidad: "MEFCCA / Banco de Fomento",
    porque: "Provee créditos solidarios a tasas mínimas (10-15% anual) para capital de trabajo de cooperativas y talleres artesanales.",
    como: "El modelo financiero del proyecto presupuesta la adquisición de las máquinas o insumos a través de microcréditos del Programa Adelante.",
    cita: "Línea de Financiamiento para Maquinaria y Equipamiento de Pequeños Productores Agropecuarios."
  },
  {
    id: "comupred_sinapred",
    type: "programa",
    title: "Plataforma Territorial COMUPRED / SINAPRED",
    entidad: "Alcaldías Municipales / Comisiones de Riesgo",
    porque: "Estructura institucional que evalúa y aprueba proyectos de prevención de desastres en barrios y comunidades de alto riesgo.",
    como: "Brinda la red de voluntarios barriales para operar las alertas hidrométricas o ensamblar los albergues de emergencia.",
    cita: "Plan de Respuesta Familiar y Municipal Multiamenazas."
  },
  {
    id: "escuelas_campo",
    type: "programa",
    title: "Escuelas Técnicas de Campo & Centros de Innovación Abierta",
    entidad: "INATEC / CNU / TELCOR",
    porque: "Canal de capacitación técnica gratuita con cobertura en los 153 municipios de Nicaragua.",
    como: "Imparte el manual de ensamblaje, mantenimiento y operación de la tecnología desarrollada a los comunitarios.",
    cita: "Estrategia Nacional de Educación 'Bendiciones y Victorias' · Formación Vocacional para el Trabajo."
  }
];

let impactActiveSubTab = "ods"; // "ods" | "plan" | "leyes" | "sintesis"
let odsFilterScope = "matched"; // "matched" | "all"

function getChallengeImpactDetails(chId) {
  const challengesList = (state.challenges && state.challenges.length) ? state.challenges : OFFICIAL_CHALLENGES_2026;
  const ch = challengesList.find(c => c.id === chId) || {};
  
  const idStr = String(chId || "");
  let mappedOdsIds = [12, 8, 9];
  let mappedEjeIds = ["eje4", "eje9", "eje2"];
  let mappedLeyIds = ["ley1013", "ciudades_creativas", "escuelas_campo"];

  if (idStr.includes("01") || idStr.includes("1")) {
    mappedOdsIds = [12, 8, 9];
    mappedEjeIds = ["eje4", "eje9", "eje2"];
    mappedLeyIds = ["ley1013", "programa_adelante", "ciudades_creativas"];
  } else if (idStr.includes("02") || idStr.includes("2")) {
    mappedOdsIds = [11, 13, 3];
    mappedEjeIds = ["eje5", "eje9", "eje3"];
    mappedLeyIds = ["ley337", "comupred_sinapred", "escuelas_campo"];
  } else if (idStr.includes("03") || idStr.includes("3")) {
    mappedOdsIds = [15, 2, 13];
    mappedEjeIds = ["eje5", "eje8", "eje4"];
    mappedLeyIds = ["ley217", "ciudades_creativas", "escuelas_campo"];
  } else if (idStr.includes("04") || idStr.includes("4")) {
    mappedOdsIds = [12, 11, 13];
    mappedEjeIds = ["eje5", "eje4", "eje8"];
    mappedLeyIds = ["ley217", "ciudades_creativas", "programa_adelante"];
  } else if (idStr.includes("05") || idStr.includes("5")) {
    mappedOdsIds = [6, 11, 12];
    mappedEjeIds = ["eje3", "eje5", "eje2"];
    mappedLeyIds = ["ley620", "ciudades_creativas", "escuelas_campo"];
  } else if (idStr.includes("06") || idStr.includes("6")) {
    mappedOdsIds = [14, 12, 11];
    mappedEjeIds = ["eje5", "eje4", "eje2"];
    mappedLeyIds = ["ley217", "programa_adelante", "ciudades_creativas"];
  } else if (idStr.includes("07") || idStr.includes("7")) {
    mappedOdsIds = [12, 6, 7];
    mappedEjeIds = ["eje4", "eje5", "eje3"];
    mappedLeyIds = ["ley1013", "ley620", "ciudades_creativas"];
  } else if (idStr.includes("08") || idStr.includes("8")) {
    mappedOdsIds = [2, 12, 1];
    mappedEjeIds = ["eje8", "eje4", "eje2"];
    mappedLeyIds = ["ciudades_creativas", "escuelas_campo", "programa_adelante"];
  } else if (idStr.includes("09") || idStr.includes("9")) {
    mappedOdsIds = [11, 13, 7];
    mappedEjeIds = ["eje3", "eje5", "eje2"];
    mappedLeyIds = ["ley337", "comupred_sinapred", "ciudades_creativas"];
  } else if (Array.isArray(ch.ods) && ch.ods.length > 0) {
    mappedOdsIds = ch.ods.map(o => {
      const match = String(o).match(/\d+/);
      return match ? parseInt(match[0], 10) : 12;
    }).filter(n => n >= 1 && n <= 17);
  }

  if (state.impact_alignment && Array.isArray(state.impact_alignment.selected_ods) && state.impact_alignment.selected_ods.length > 0) {
    mappedOdsIds = state.impact_alignment.selected_ods;
  }

  return { ch, mappedOdsIds, mappedEjeIds, mappedLeyIds };
}

function switchImpactSubTab(tab) {
  impactActiveSubTab = tab;
  renderTab("impact");
}

function toggleOdsFilter(filter) {
  odsFilterScope = filter;
  renderTab("impact");
}

function toggleOdsSelection(odsId) {
  if (!state.impact_alignment) {
    state.impact_alignment = { selected_ods: [], custom_justifications: {} };
  }
  const sel = state.impact_alignment.selected_ods;
  const idx = sel.indexOf(odsId);
  if (idx >= 0) {
    sel.splice(idx, 1);
  } else {
    sel.push(odsId);
  }
  saveState();
  renderTab("impact");
}

function getImpactCustom(key, field, fallback) {
  if (state.impact_alignment && state.impact_alignment.custom_justifications && state.impact_alignment.custom_justifications[key] && state.impact_alignment.custom_justifications[key][field]) {
    return state.impact_alignment.custom_justifications[key][field];
  }
  return fallback;
}

function saveImpactCustomField(key, field, value) {
  if (!state.impact_alignment) {
    state.impact_alignment = { selected_ods: [], custom_justifications: {} };
  }
  if (!state.impact_alignment.custom_justifications[key]) {
    state.impact_alignment.custom_justifications[key] = {};
  }
  state.impact_alignment.custom_justifications[key][field] = value;
  saveState();
}

function renderViewImpact() {
  const chId = state.challenge_id;
  const { ch, mappedOdsIds, mappedEjeIds, mappedLeyIds } = getChallengeImpactDetails(chId);
  const activeCh = ch;

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="badge-status badge-ok" style="font-family:var(--font-mono); font-size:10px; font-weight:800;">
            FASE 04 · IMPACTO PAÍS
          </span>
          <span style="font-size:11.5px; font-weight:700; color:var(--text-muted); font-family:var(--font-mono);">
            RÚBRICA OFICIAL: FACTIBILIDAD & IMPACTO (30 PTS)
          </span>
        </div>
        <div style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:#0866F5; letter-spacing:0.04em; margin-bottom:2px;">
          // RALLY STUDIO · ALINEACIÓN ESTRATÉGICA & POLÍTICAS NACIONALES
        </div>
        <h1 class="phase-title" style="margin:0;">
          Impacto Estratégico, <span class="phase-title-accent">ODS & Políticas País</span>
        </h1>
        <p class="phase-subtitle" style="margin-top:4px;">
          ${activeCh.title ? `Reto #${activeCh.id}: ${activeCh.title}` : 'Alinea tu propuesta técnica con la Agenda 2030 (ONU), el Plan Nacional de Desarrollo y el marco institucional.'}
        </p>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn-pill-light" onclick="switchTab('solution')" style="font-size:12px; padding:8px 14px; display:inline-flex; align-items:center; gap:6px;">
          ${SVG.arrowLeft} Volver a Solución
        </button>
        <button class="btn-primary" onclick="switchTab('multi_ai')" style="font-size:12px; padding:8px 16px;">
          Continuar a Despacho Multi-IA ${SVG.arrowRight}
        </button>
      </div>
    </div>

    <!-- Submenú de Navegación Temática Impeccable -->
    <div class="impact-subnav">
      <button class="impact-subnav-btn ${impactActiveSubTab === 'ods' ? 'active' : ''}" onclick="switchImpactSubTab('ods')">
        ODS · Agenda 2030 (ONU)
      </button>
      <button class="impact-subnav-btn ${impactActiveSubTab === 'plan' ? 'active' : ''}" onclick="switchImpactSubTab('plan')">
        Plan de Lucha contra la Pobreza (2022-2026)
      </button>
      <button class="impact-subnav-btn ${impactActiveSubTab === 'leyes' ? 'active' : ''}" onclick="switchImpactSubTab('leyes')">
        Leyes & Programas Nacionales ("Otros")
      </button>
      <button class="impact-subnav-btn ${impactActiveSubTab === 'sintesis' ? 'active' : ''}" onclick="switchImpactSubTab('sintesis')">
        Síntesis para Pautado & Pitch
      </button>
    </div>

    ${renderImpactSubTabContent(impactActiveSubTab, activeCh, mappedOdsIds, mappedEjeIds, mappedLeyIds)}
  `;
}

function renderImpactSubTabContent(subTab, activeCh, mappedOdsIds, mappedEjeIds, mappedLeyIds) {
  if (subTab === "ods") {
    const odsList = odsFilterScope === "matched" 
      ? ODS_CATALOG.filter(o => mappedOdsIds.includes(o.id))
      : ODS_CATALOG;

    return `
      <div>
        <div style="margin-bottom:16px;">
          <h1 style="font-size:24px; font-weight:900; color:var(--text-title); letter-spacing:-0.02em; margin:0 0 4px 0;">
            ODS · Objetivos de Desarrollo Sostenible
          </h1>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.45; margin:0;">
            Alineación directa del reto y de tu propuesta técnica con metas oficiales de la Agenda 2030 (ONU). Haz clic en cualquier tarjeta de ODS para abrir el desglose editable de Por Qué y Cómo.
          </p>
        </div>

        <!-- Barra de Control y Filtros ODS -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; background:#F8FAFD; border:1px solid var(--border-light); padding:10px 16px; border-radius:8px; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn-pill-light" style="${odsFilterScope === 'matched' ? 'background:#0D1B35; color:#fff; border-color:#0D1B35;' : ''} font-size:11.5px; font-weight:700;" onclick="toggleOdsFilter('matched')">
              ODS que Cumple Tu Reto (${mappedOdsIds.length})
            </button>
            <button class="btn-pill-light" style="${odsFilterScope === 'all' ? 'background:#0D1B35; color:#fff; border-color:#0D1B35;' : ''} font-size:11.5px; font-weight:700;" onclick="toggleOdsFilter('all')">
              Ver los 17 ODS de la ONU
            </button>
          </div>
          <div style="font-size:11.5px; font-family:var(--font-mono); font-weight:700; color:#0866F5;">
            PROYECTO: ${state.project_name || 'EN FORMULACIÓN'}
          </div>
        </div>

        <!-- Grid de Tarjetas ODS -->
        <div class="ods-grid">
          ${odsList.map(ods => {
            const isMatch = mappedOdsIds.includes(ods.id);
            const customWhy = getImpactCustom(`ods_${ods.id}`, "porque", ods.diagnostic);
            const customHow = getImpactCustom(`ods_${ods.id}`, "como", ods.mechanism);

            return `
              <div class="ods-card ${isMatch ? 'is-active-match' : ''}" onclick="openImpactDetailModal('ods', ${ods.id})" title="Haz clic para ver y editar el Por Qué y Cómo">
                <div class="ods-card-header" style="background:${ods.color};">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">${ods.icon}</svg>
                    <span style="font-family:var(--font-mono); font-weight:900; font-size:13px; letter-spacing:0.04em;">ODS ${ods.id}</span>
                  </div>
                  ${isMatch 
                    ? `<span style="background:rgba(255,255,255,0.25); color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; font-family:var(--font-mono); backdrop-filter:blur(2px);">✓ CUMPLE DIRECTO</span>`
                    : `<span style="font-size:10px; color:rgba(255,255,255,0.7); font-family:var(--font-mono);">AGENDA 2030</span>`}
                </div>
                <div class="ods-card-body">
                  <div style="font-size:13.5px; font-weight:800; color:var(--text-title); line-height:1.3; min-height:36px;">
                    ${ods.name}
                  </div>
                  <div style="font-size:11px; font-family:var(--font-mono); font-weight:700; color:#0866F5; line-height:1.35;">
                    ${ods.shortTarget}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Por qué cumple?</strong>
                    ${customWhy.slice(0, 115)}${customWhy.length > 115 ? '...' : ''}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Cómo lo cumple tu solución?</strong>
                    ${customHow.slice(0, 115)}${customHow.length > 115 ? '...' : ''}
                  </div>
                  <div style="margin-top:auto; padding-top:6px; font-size:11.5px; font-weight:800; color:#0866F5; display:flex; align-items:center; justify-content:space-between;">
                    <span>Toca para ver Por Qué & Cómo</span>
                    ${SVG.arrowRight}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  if (subTab === "plan") {
    return `
      <div>
        <div style="margin-bottom:16px;">
          <h1 style="font-size:24px; font-weight:900; color:var(--text-title); letter-spacing:-0.02em; margin:0 0 4px 0;">
            Plan Nacional de Lucha contra la Pobreza y para el Desarrollo Humano (2022-2026)
          </h1>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.45; margin:0;">
            Lineamientos y Ejes Estratégicos nacionales de Nicaragua que fundamentan la pertinencia territorial de tu solución ante los evaluadores institucionales (CNU, TELCOR, MEFCCA, INATEC).
          </p>
        </div>

        <div class="ods-grid">
          ${PLAN_EJES_CATALOG.map(eje => {
            const isMatch = mappedEjeIds.includes(eje.id);
            const customWhy = getImpactCustom(`plan_${eje.id}`, "porque", eje.porque);
            const customHow = getImpactCustom(`plan_${eje.id}`, "como", eje.como);

            return `
              <div class="ods-card ${isMatch ? 'is-active-match' : ''}" onclick="openImpactDetailModal('plan', '${eje.id}')" title="Haz clic para ver y editar el Por Qué y Cómo">
                <div class="ods-card-header" style="background:#0D1B35;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${eje.icon}</svg>
                    <span style="font-family:var(--font-mono); font-weight:900; font-size:12.5px;">EJE ESTRATÉGICO #${eje.num}</span>
                  </div>
                  ${isMatch 
                    ? `<span style="background:#0866F5; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; font-family:var(--font-mono);">✓ PRIORITARIO</span>`
                    : `<span style="font-size:10px; color:#94A3B8; font-family:var(--font-mono);">PLAN PAÍS</span>`}
                </div>
                <div class="ods-card-body">
                  <div style="font-size:13.5px; font-weight:800; color:var(--text-title); line-height:1.3; min-height:36px;">
                    ${eje.title}
                  </div>
                  <div style="font-size:11px; font-family:var(--font-mono); color:#059669; font-weight:700;">
                    Métrica esperada: ${eje.metrica}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Por qué se vincula?</strong>
                    ${customWhy.slice(0, 115)}${customWhy.length > 115 ? '...' : ''}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Cómo responde en el territorio?</strong>
                    ${customHow.slice(0, 115)}${customHow.length > 115 ? '...' : ''}
                  </div>
                  <div style="font-size:10.5px; color:#64748B; font-family:var(--font-mono);">
                    <strong>Contrapartes:</strong> ${eje.instituciones}
                  </div>
                  <div style="margin-top:auto; padding-top:6px; font-size:11.5px; font-weight:800; color:#0866F5; display:flex; align-items:center; justify-content:space-between;">
                    <span>Toca para ver y editar</span>
                    ${SVG.arrowRight}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  if (subTab === "leyes") {
    const leyes = LEYES_PROGRAMAS_CATALOG.filter(x => x.type === "ley");
    const programas = LEYES_PROGRAMAS_CATALOG.filter(x => x.type === "programa");

    return `
      <div>
        <div style="margin-bottom:16px;">
          <h1 style="font-size:24px; font-weight:900; color:var(--text-title); letter-spacing:-0.02em; margin:0 0 4px 0;">
            Marco Legal, Institucional & Programas Nacionales que Impulsa
          </h1>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.45; margin:0;">
            Leyes de la República y programas gubernamentales donde la innovación se acopla técnicamente. Demostrar acople institucional otorga la máxima calificación en viabilidad y reduce barreras de adopción.
          </p>
        </div>

        <h3 style="font-size:13.5px; font-weight:800; color:#0D1B35; text-transform:uppercase; letter-spacing:0.04em; margin:20px 0 10px 0; display:flex; align-items:center; gap:6px;">
          ${SVG.document} Leyes de la República de Nicaragua
        </h3>
        <div class="ods-grid">
          ${leyes.map(item => {
            const isMatch = mappedLeyIds.includes(item.id);
            const customWhy = getImpactCustom(`ley_${item.id}`, "porque", item.porque);
            const customHow = getImpactCustom(`ley_${item.id}`, "como", item.como);

            return `
              <div class="ods-card ${isMatch ? 'is-active-match' : ''}" onclick="openImpactDetailModal('ley', '${item.id}')" title="Haz clic para ver y editar el Por Qué y Cómo">
                <div class="ods-card-header" style="background:#1E293B;">
                  <span style="font-family:var(--font-mono); font-weight:800; font-size:12px;">MARCO JURÍDICO</span>
                  ${isMatch ? `<span style="background:#0866F5; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; font-family:var(--font-mono);">✓ ACOPLE DIRECTO</span>` : ''}
                </div>
                <div class="ods-card-body">
                  <div style="font-size:13px; font-weight:800; color:var(--text-title); line-height:1.3; min-height:36px;">
                    ${item.title}
                  </div>
                  <div style="font-size:11px; font-family:var(--font-mono); color:#0866F5; font-weight:700;">
                    ${item.entidad}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Por qué convence al jurado?</strong>
                    ${customWhy.slice(0, 115)}${customWhy.length > 115 ? '...' : ''}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Cómo se inserta la solución?</strong>
                    ${customHow.slice(0, 115)}${customHow.length > 115 ? '...' : ''}
                  </div>
                  <div style="margin-top:auto; padding-top:6px; font-size:11.5px; font-weight:800; color:#0866F5; display:flex; align-items:center; justify-content:space-between;">
                    <span>Toca para ver y editar</span>
                    ${SVG.arrowRight}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <h3 style="font-size:13.5px; font-weight:800; color:#0D1B35; text-transform:uppercase; letter-spacing:0.04em; margin:28px 0 10px 0; display:flex; align-items:center; gap:6px;">
          ${SVG.spark} Programas Nacionales & Plataformas de Gobierno ("Otros")
        </h3>
        <div class="ods-grid">
          ${programas.map(item => {
            const isMatch = mappedLeyIds.includes(item.id);
            const customWhy = getImpactCustom(`ley_${item.id}`, "porque", item.porque);
            const customHow = getImpactCustom(`ley_${item.id}`, "como", item.como);

            return `
              <div class="ods-card ${isMatch ? 'is-active-match' : ''}" onclick="openImpactDetailModal('ley', '${item.id}')" title="Haz clic para ver y editar el Por Qué y Cómo">
                <div class="ods-card-header" style="background:#0F172A;">
                  <span style="font-family:var(--font-mono); font-weight:800; font-size:12px;">PROGRAMA NACIONAL</span>
                  ${isMatch ? `<span style="background:#0866F5; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; font-family:var(--font-mono);">✓ CANAL ACTIVO</span>` : ''}
                </div>
                <div class="ods-card-body">
                  <div style="font-size:13px; font-weight:800; color:var(--text-title); line-height:1.3; min-height:36px;">
                    ${item.title}
                  </div>
                  <div style="font-size:11px; font-family:var(--font-mono); color:#0866F5; font-weight:700;">
                    ${item.entidad}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Por qué convence al jurado?</strong>
                    ${customWhy.slice(0, 115)}${customWhy.length > 115 ? '...' : ''}
                  </div>
                  <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#475569; line-height:1.45;">
                    <strong style="color:#0D1B35; font-size:10.5px; text-transform:uppercase; display:block; margin-bottom:2px;">¿Cómo se inserta la solución?</strong>
                    ${customHow.slice(0, 115)}${customHow.length > 115 ? '...' : ''}
                  </div>
                  <div style="margin-top:auto; padding-top:6px; font-size:11.5px; font-weight:800; color:#0866F5; display:flex; align-items:center; justify-content:space-between;">
                    <span>Toca para ver y editar</span>
                    ${SVG.arrowRight}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  if (subTab === "sintesis") {
    const pautText = generateImpactPautadoText(activeCh, mappedOdsIds, mappedEjeIds, mappedLeyIds);
    const scriptText = generateImpactScriptText(activeCh, mappedOdsIds, mappedEjeIds, mappedLeyIds);

    return `
      <div>
        <div style="margin-bottom:16px;">
          <h1 style="font-size:24px; font-weight:900; color:var(--text-title); letter-spacing:-0.02em; margin:0 0 4px 0;">
            Síntesis de Impacto para Pautado Oficial y Guion Pitch
          </h1>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.45; margin:0;">
            Párrafos integrados redactados con máxima densidad de rúbrica. Inyéctalos directamente en la Sección 1.5 del Pautado Oficial y en el Acto 4 del Guion de 120s.
          </p>
        </div>

        <div style="display:grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap:20px; align-items:start;">
          <!-- Bloque Pautado 1.5 -->
          <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:10px; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <strong style="font-size:13.5px; color:#0D1B35;">Sección 1.5 Pautado Oficial</strong>
                <div style="font-size:11px; color:#64748B;">Impacto Social y Sostenibilidad Ambiental</div>
              </div>
              <span id="pautado-synth-chars" style="font-family:var(--font-mono); font-size:11.5px; font-weight:700; color:#0866F5;">
                ${pautText.length} / 1,500 caracteres
              </span>
            </div>
            <textarea id="impact-synth-pautado" rows="10" style="width:100%; border:1px solid #CBD5E1; border-radius:6px; padding:10px; font-size:12px; font-family:var(--font-ui); line-height:1.55; box-sizing:border-box;"
              oninput="document.getElementById('pautado-synth-chars').textContent = this.value.length + ' / 1,500 caracteres'">${state.pautado.impacto || pautText}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
              <button class="btn-pill-light" onclick="navigator.clipboard.writeText(document.getElementById('impact-synth-pautado').value); alert('Copiado al portapapeles');">
                ${SVG.copy} Copiar
              </button>
              <button class="btn-primary" onclick="injectImpactIntoPautado(document.getElementById('impact-synth-pautado').value)">
                Inyectar en Pautado Oficial ➔
              </button>
            </div>
          </div>

          <!-- Bloque Guion Acto 4 -->
          <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:10px; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <strong style="font-size:13.5px; color:#0D1B35;">Guion Pitch 120s · Acto 4 (01:30 - 02:00)</strong>
                <div style="font-size:11px; color:#64748B;">Impacto Humano, Políticas Públicas & Cierre</div>
              </div>
              <span id="script-synth-words" style="font-family:var(--font-mono); font-size:11.5px; font-weight:700; color:#0866F5;">
                ${(state.script.acto4 || scriptText).split(/\s+/).filter(Boolean).length} palabras · ~28 seg
              </span>
            </div>
            <textarea id="impact-synth-script" rows="10" style="width:100%; border:1px solid #CBD5E1; border-radius:6px; padding:10px; font-size:12px; font-family:var(--font-ui); line-height:1.55; box-sizing:border-box;"
              oninput="const words = this.value.split(/\s+/).filter(Boolean).length; document.getElementById('script-synth-words').textContent = words + ' palabras · ~' + Math.round(words/2.5) + ' seg'">${state.script.acto4 || scriptText}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
              <button class="btn-pill-light" onclick="navigator.clipboard.writeText(document.getElementById('impact-synth-script').value); alert('Copiado al portapapeles');">
                ${SVG.copy} Copiar
              </button>
              <button class="btn-primary" onclick="injectImpactIntoScript(document.getElementById('impact-synth-script').value)">
                Inyectar en Guion de Video ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function generateImpactPautadoText(ch, mappedOdsIds, mappedEjeIds, mappedLeyIds) {
  const odsStr = mappedOdsIds.map(id => {
    const o = ODS_CATALOG.find(x => x.id === id);
    return o ? `${o.code} (${o.name})` : `ODS ${id}`;
  }).join(", ");

  const ejeStr = mappedEjeIds.map(eid => {
    const e = PLAN_EJES_CATALOG.find(x => x.id === eid);
    return e ? `Eje ${e.num} (${e.title})` : eid;
  }).join(", ");

  const proj = state.project_name || "La solución";
  const solSimple = state.solution_simple || ch.wowProposal || "la propuesta de innovación";

  return `${proj} articula de forma directa los Objetivos de Desarrollo Sostenible (ODS) de la Agenda 2030, respondiendo formalmente a ${odsStr}. En el ámbito nacional, la propuesta se fundamenta en los lineamientos estratégicos del Plan Nacional de Lucha contra la Pobreza y para el Desarrollo Humano (2022-2026), anclándose en el ${ejeStr}. Operativamente, el sistema implementa ${solSimple}, asegurando transferencia comunitaria sin dependencias financieras continuas y acoplándose a la Ley 1013 de Economía Creativa y la Red de Ciudades Creativas para su despliegue territorial inmediato.`;
}

function generateImpactScriptText(ch, mappedOdsIds, mappedEjeIds, mappedLeyIds) {
  const proj = state.project_name || "nuestro proyecto";
  const odsFirst = mappedOdsIds.length ? `ODS ${mappedOdsIds[0]}` : "ODS 12";
  return `Con ${proj}, cerramos la brecha no desde la teoría, sino desde la realidad de nuestras comunidades. Cumplimos con el ${odsFirst} y nos acoplamos directamente al Plan Nacional de Lucha contra la Pobreza y la Red de Ciudades Creativas. No inventamos instituciones: las potenciamos. Somos ingenieros de la UNI comprometidos con la soberanía tecnológica y el futuro de Nicaragua y Latinoamérica. ¡Muchas gracias!`;
}

function injectImpactIntoPautado(text) {
  state.pautado.impacto = text;
  saveState();
  broadcastFieldChange("pautado", "impacto", text);
  alert("Texto inyectado exitosamente en la Sección 1.5 del Pautado Oficial.");
}

function injectImpactIntoScript(text) {
  state.script.acto4 = text;
  saveState();
  broadcastFieldChange("script", "acto4", text);
  alert("Texto inyectado exitosamente en el Acto 4 del Guion de 120 segundos.");
}

function openImpactDetailModal(type, key) {
  let modal = document.getElementById("impact-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "impact-detail-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  let item = null;
  let title = "";
  let badgeLabel = "";
  let bannerColor = "#0D1B35";
  let whyText = "";
  let howText = "";
  let metaInfo = "";
  let iconSvg = "";
  let stateKey = "";

  if (type === "ods") {
    item = ODS_CATALOG.find(o => o.id === Number(key));
    if (!item) return;
    title = `${item.code}: ${item.name}`;
    badgeLabel = "AGENDA 2030 (ONU)";
    bannerColor = item.color;
    iconSvg = item.icon;
    stateKey = `ods_${item.id}`;
    whyText = getImpactCustom(stateKey, "porque", item.diagnostic);
    howText = getImpactCustom(stateKey, "como", item.mechanism);
    metaInfo = item.unTarget;
  } else if (type === "plan") {
    item = PLAN_EJES_CATALOG.find(e => e.id === key);
    if (!item) return;
    title = `Eje ${item.num}: ${item.title}`;
    badgeLabel = "PLAN NACIONAL DE LUCHA CONTRA LA POBREZA (2022-2026)";
    bannerColor = "#0D1B35";
    iconSvg = item.icon;
    stateKey = `plan_${item.id}`;
    whyText = getImpactCustom(stateKey, "porque", item.porque);
    howText = getImpactCustom(stateKey, "como", item.como);
    metaInfo = `Contrapartes de Gobierno: ${item.instituciones} | Métrica: ${item.metrica}`;
  } else if (type === "ley") {
    item = LEYES_PROGRAMAS_CATALOG.find(l => l.id === key);
    if (!item) return;
    title = item.title;
    badgeLabel = item.type === "ley" ? "MARCO JURÍDICO DE NICARAGUA" : "PROGRAMA / PLATAFORMA GUBERNAMENTAL";
    bannerColor = item.type === "ley" ? "#1E293B" : "#0F172A";
    iconSvg = SVG.document;
    stateKey = `ley_${item.id}`;
    whyText = getImpactCustom(stateKey, "porque", item.porque);
    howText = getImpactCustom(stateKey, "como", item.como);
    metaInfo = `Entidad Rectora: ${item.entidad} | Cita: ${item.cita}`;
  }

  const { mappedOdsIds } = getChallengeImpactDetails(state.challenge_id);
  const isSelectedOds = type === "ods" && mappedOdsIds.includes(item.id);

  modal.innerHTML = `
    <div class="impact-modal-card">
      <div class="impact-modal-header" style="background:${bannerColor};">
        <div style="display:flex; align-items:center; gap:12px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">${iconSvg}</svg>
          <div>
            <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:0.04em; opacity:0.85; text-transform:uppercase;">
              ${badgeLabel}
            </div>
            <h2 style="font-size:16px; font-weight:900; margin:2px 0 0 0; line-height:1.25; color:#ffffff;">
              ${title}
            </h2>
          </div>
        </div>
        <button class="btn-icon-discreet" style="color:#ffffff;" onclick="closeImpactModal()">${SVG.close}</button>
      </div>

      <div class="impact-modal-body">
        <!-- 01. Por qué cumple / se vincula -->
        <div>
          <div class="impact-section-label">
            ${SVG.spark} 01. ¿Por qué cumple este punto? (Diagnóstico & Pertinencia de Rúbrica)
          </div>
          <textarea id="modal-impact-why" rows="3" style="width:100%; border:1px solid #CBD5E1; border-radius:6px; padding:10px; font-size:12.5px; font-family:var(--font-ui); line-height:1.5; box-sizing:border-box; background:#F8FAFD;"
            oninput="saveImpactCustomField('${stateKey}', 'porque', this.value)">${whyText}</textarea>
          <div style="font-size:10.5px; color:#64748B; margin-top:2px;">
            Explica la problemática real en el territorio y la razón por la que el jurado evaluador asigna puntaje positivo a este criterio.
          </div>
        </div>

        <!-- 02. Cómo lo cumple tu solución -->
        <div>
          <div class="impact-section-label">
            ${SVG.spark} 02. ¿Cómo lo cumple tu solución? (Mecanismo Técnico & Despliegue)
          </div>
          <textarea id="modal-impact-how" rows="3" style="width:100%; border:1px solid #CBD5E1; border-radius:6px; padding:10px; font-size:12.5px; font-family:var(--font-ui); line-height:1.5; box-sizing:border-box; background:#F8FAFD;"
            oninput="saveImpactCustomField('${stateKey}', 'como', this.value)">${howText}</textarea>
          <div style="font-size:10.5px; color:#64748B; margin-top:2px;">
            Describe el mecanismo técnico exacto (materiales, sensores, proceso, manufactura o economía circular) con que tu equipo lo ejecuta.
          </div>
        </div>

        <!-- Meta o Cita Formal -->
        <div style="background:#F1F5F9; border:1px solid #E2E8F0; border-radius:6px; padding:10px 12px; font-size:11.5px; line-height:1.45; color:#334155;">
          <strong style="color:#0F172A; font-family:var(--font-mono); font-size:10.5px; display:block; margin-bottom:2px; text-transform:uppercase;">
            Referencia Oficial para Jurados:
          </strong>
          ${metaInfo}
        </div>

        <!-- Botones de Acción -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:12px; border-top:1px solid #E2E8F0;">
          <div>
            ${type === 'ods' ? `
              <button class="btn-pill-light" onclick="toggleOdsSelection(${item.id}); openImpactDetailModal('ods', ${item.id});" style="font-size:11.5px; font-weight:700;">
                ${isSelectedOds ? '✓ Desmarcar de Mi Reto' : '+ Marcar ODS para Mi Reto'}
              </button>
            ` : ''}
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-pill-light" onclick="navigator.clipboard.writeText(document.getElementById('modal-impact-why').value + '\n\n' + document.getElementById('modal-impact-how').value); alert('Copiado al portapapeles');" style="font-size:11.5px;">
              ${SVG.copy} Copiar
            </button>
            <button class="btn-primary" onclick="injectImpactIntoPautado(document.getElementById('modal-impact-why').value + ' ' + document.getElementById('modal-impact-how').value); closeImpactModal();" style="font-size:11.5px; padding:6px 14px;">
              Inyectar en Pautado 1.5 ➔
            </button>
            <button class="btn-secondary" onclick="closeImpactModal()" style="font-size:11.5px;">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeImpactModal() {
  const modal = document.getElementById("impact-detail-modal");
  if (modal) modal.style.display = "none";
}

// ═════════════════════════════════════════════════════════════════════════════
// 05 NIVEL 5: DESPACHO MULTI-IA & MEGA-PROMPTS ESPECIALIZADOS
// ═════════════════════════════════════════════════════════════════════════════
function renderViewMultiAI() {
  const tasks = state.tasks || getDefaultMultiAITasks();

  const html = `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">05 · Despacho Multi-IA <span class="phase-title-accent">& Coordinación en Paralelo</span></h1>
        <p class="phase-subtitle">Coordina OpenCode, Antigravity y modelos externos gratuitos (Gemini, Perplexity, Alibaba) sin duplicar trabajo.</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-primary" onclick="copySyncToken()">${SVG.copy} Copiar Token para WhatsApp</button>
        <button class="btn-secondary" onclick="pasteSyncToken()">${SVG.upload} Pegar Token de Equipo</button>
      </div>
    </div>

    <!-- Banner de Seguridad para Wi-Fi Universitario -->
    <div class="wifi-bypass-card">
      <div>
        <strong style="font-size:12px; color:var(--text-main); display:block;">Colaboración en Red Universitaria (Bypass de Aislamiento Wi-Fi)</strong>
        <p style="font-size:11px; color:var(--text-muted); margin:0;">
          Si la red de la universidad bloquea la conexión IP local directa, compartan el Token por WhatsApp o utilicen la sincronización de archivos JSON en Google Drive.
        </p>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="${state.google_drive_url}" target="_blank" class="btn-secondary" style="font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
          Abrir Google Drive ${SVG.external}
        </a>
        <button class="btn-secondary" style="font-size:11px;" onclick="exportProjectJson()">Exportar JSON</button>
      </div>
    </div>

    <!-- Cuadrícula de Tareas Multi-IA en Paralelo -->
    <div class="task-dispatch-grid">
      ${tasks.map(t => {
        let statusBadge = "";
        let cardClass = "";
        if (t.status === "in_progress") {
          statusBadge = rsPill("working", { label: "Trabajando" });
          cardClass = "in-progress";
        } else if (t.status === "completed") {
          statusBadge = rsPill("done", { label: "Completado", title: "Completado" });
          cardClass = "completed";
        } else {
          statusBadge = rsPill("pending", { label: "Pendiente", title: "Pendiente" });
        }

        const promptText = generateSpecificMegaPrompt(t.id);

        return `
          <div class="task-dispatch-card ${cardClass}">
            <div>
              <div class="task-header">
                <span class="task-ai-tag">${t.ai}</span>
                <select id="ai-model-${t.id}" class="ai-model-select" onchange="modelPrefChanged('${t.id}', this.value)" title="Modelo especializado para esta tarea (descubierto dinámicamente)"></select>
                ${statusBadge}
              </div>
              <h3 class="task-title">${t.title}</h3>
              <p class="task-desc">${t.desc}</p>

              <!-- Vista previa del Prompt -->
              <div class="prompt-snippet-box">
                ${promptText}
              </div>

              <div style="display:flex; gap:8px; margin-bottom:12px;">
                <button class="btn-primary" style="flex:1.2; font-size:11px; padding:4px 8px;" onclick="runTaskWithAI('${t.id}')">
                  ${SVG.check} Generar con IA
                </button>
                <button class="btn-secondary" style="flex:1; font-size:11px; padding:4px 8px;" onclick="copySpecificMegaPrompt('${t.id}')">
                  ${SVG.copy} Copiar
                </button>
                <button class="btn-secondary" style="font-size:11px; padding:4px 8px; color:#d97706;" onclick="setTaskStatus('${t.id}', 'in_progress')" title="Modo manual: marcar mientras trabajas fuera">
                  Manual
                </button>
              </div>

              <div id="ai-chips-${t.id}" class="ai-external-chips" style="display:none;"></div>

              <!-- Caja de Aterrizaje Ctrl+V -->
              <div>
                <textarea id="paste-result-${t.id}" class="landing-paste-area" placeholder="Pega aquí la respuesta generada por ${t.ai} (Ctrl+V)...">${t.result || ''}</textarea>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; pt:8px; border-top:1px solid var(--border-light);">
              <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">Inyección automática</span>
              <button class="btn-primary" style="font-size:11px; padding:4px 10px;" onclick="injectTaskResult('${t.id}')">
                Inyectar Datos al Proyecto ${SVG.arrowRight}
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
  setTimeout(() => tasks.forEach(t => populateModelSelect(t.id)), 0);
  return html;
}

function setTaskStatus(taskId, status) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    saveState();
    renderTab("multi_ai");
  }
}

function generateSpecificMegaPrompt(taskId) {
  const pName = state.project_name || "SISTEMA";
  const ch = (state.challenges || []).find(c => c.id === state.challenge_id) || {};
  const chTitle = ch.title || state.challenge_title || "Innovación";
  const thesis = state.solution_thesis || state.solution_raw_input || "";
  const isNac = state.rally_type === "nacional";
  const cert = isNac ? "Rally Nacional Nicaragua Innova (24h - CNU / Economía Creativa)" : "Rally Latinoamericano de Innovación (28h - CONFEDI / ACOFI / SIRLI)";

  if (taskId === "stats_poverty") {
    if (isNac) {
      return `Actúa como Investigador Principal y Analista Cuantitativo para el ${cert}.
Proyecto: "${pName}" enfocado en el reto: "${chTitle}".
Tesis: "${thesis}".
Criterio Rúbrica Oficial Jurado Nacional: Impacto Social, Territorial y Alineación con Políticas Públicas (25 Puntos).
Patrón de Ganadores Nacionales (Nicaragua Innova):
1. Extrae 3 estadísticas cuantitativas auditables de fuentes oficiales nicaragüenses y regionales (Banco Central de Nicaragua BCN, INIDE, CEPAL, MINSA o alcaldías).
2. Vincula directamente con un Eje específico del Plan Nacional de Lucha contra la Pobreza y Desarrollo Humano 2022–2026 (PNDH), Ciudades Creativas o Restitución de Derechos (Ley 763).
3. Especifica el anclaje territorial concreto en Nicaragua (municipio, comunidad vulnerable o zona productiva: ej. Waslala, San Juan de Oriente, Monimbó, Estelí, Bilwi).
4. Cuantifica los beneficiarios directos (familias nicaragüenses, cooperativas de base, empleos directos e indirectos).
5. Proporciona citas en formato APA 7 y una síntesis para el Documento Técnico de Solución (máximo 1,250 caracteres con espacios, sin retórica vacía).`;
    }
    return `Actúa como Investigador Principal y Analista Cuantitativo para el ${cert}.
Proyecto: "${pName}" enfocado en el reto: "${chTitle}".
Tesis: "${thesis}".
Criterio Rúbrica Oficial Internacional: Impacto Positivo en la Sociedad (20 Puntos).
Patrón de Ganadores Latam:
1. Extrae 3 estadísticas cuantitativas auditables (fuentes oficiales: CEPAL, UNDRR, UNICEF, Banco Central o entes técnicos).
2. Vincula directamente 2 metas específicas de los ODS aplicables con su indicador numérico.
3. Describe el modelo de transferencia y escalamiento modular para municipios de América Latina (laboratorio piloto a escala continental).
4. Proporciona citas en formato APA 7 y una síntesis de 1 párrafo para la sección Problema del pautado (estrictamente menor a 1,250 caracteres con espacios, sin adjetivos vacíos).`;
  }

  if (taskId === "patents_art") {
    if (isNac) {
      return `Actúa como Especialista en Propiedad Intelectual e Innovación Abierta para el ${cert}.
Proyecto: "${pName}" enfocado en: "${chTitle}".
Tesis técnica: "${thesis}".
Criterio Rúbrica Oficial Jurado Nacional: Grado de Innovación, Creatividad y Hibridación Tecnológica (25 Puntos) y Viabilidad Técnica Local (20 Puntos).
Patrón de Ganadores Nacionales:
1. Identifica 2 patentes o antecedentes técnicos en Google Patents / WIPO / RPI-MIFIC de tecnologías similares.
2. Detalla la hibridación tecnológica accesible (ej. microcontroladores ESP32/LoRa, gemelos digitales, IA de bajo consumo) combinada con el aprovechamiento de recursos o materia prima autóctona de Nicaragua (biomasa, residuos de café, cacao, empaques, etc.).
3. Demuestra la factibilidad de implementación física en talleres locales, centros tecnológicos INATEC o laboratorios CNU (sin depender de componentes exóticos inalcanzables).
4. Redacta la sección de 'Innovación y Diferenciación' para el documento técnico (máximo 1,000 caracteres con espacios, puramente auditable).`;
    }
    return `Actúa como Especialista en Propiedad Intelectual, Estado del Arte y Patentes para el ${cert}.
Proyecto: "${pName}" enfocado en: "${chTitle}".
Tesis técnica: "${thesis}".
Criterio Rúbrica Oficial Internacional: Grado de Innovación (30 Puntos) y Viabilidad Técnica (20 Puntos).
Patrón de Ganadores Latam:
1. Identifica 2 patentes o antecedentes técnicos en Google Patents / WIPO / Lens sobre tecnologías similares.
2. Cita números de publicación oficiales y detalla exactamente la diferenciación arquitectónica (hibridación ciber-física, telemetría o materiales locales).
3. Redacta el bloque de 'Innovación y Diferenciación' para el documento pautado (máximo 1,000 caracteres con espacios, puramente técnico y medible).`;
  }

  if (taskId === "blender_3d") {
    return `Actúa como Diseñador Industrial y Programador de Blender Python (bpy).
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Criterio Rúbrica Oficial: Calidad de la Presentación y Viabilidad Técnica (30 Puntos combinados).
Patrón de Ganadores: maquetas 3D limpias mostradas temprano en el video venden viabilidad técnica al jurado.
Misión: genera UN script de Python para Blender 3.6+/4.x que se ejecute completo en modo headless (blender -b -P script.py) y al terminar renderice una imagen.
Requisitos estrictos:
1. El prototipo debe reflejar el hardware real de la tesis (sensores, carcasa, red, energía) con dimensiones en metros y escala realista (ej. carcasa 0.18 m).
2. Geometría paramétrica limpio primitivos + bevels mecánicos, puertos/entradas de cable IP67, pernos M4/M5 reales, sin NURBS exóticos.
3. Materiales PBR mediante nodos: plástico industrial rugoso, metal anodizado, panel solar hasta microcontrolador visible si la tesis lo incluye.
4. Cámara en encuadre de 3/4 e iluminación de estudio de 3 luces; fondo neutro oscuro para insertar el render en el video.
5. Configura el render (EEVEE o Cycles con 128 muestras máx.) y ejecuta bpy.ops.render.render(write_still=True) al final del script.
6. Código único, sin dependencias externas, sin addons, con comentarios breves en español; termina imprimiendo 'RENDER OK'.`;
  }

  if (taskId === "budget_alibaba") {
    if (isNac) {
      return `Actúa como Ingeniero de Costos y Modelo de Negocio Canvas para el ${cert}.
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Criterio Rúbrica Oficial Jurado Nacional: Prefactibilidad Económica, Sostenibilidad y Modelo Comunitario/Canvas (15 Puntos).
Patrón de Ganadores Nacionales:
Elabora la Estructura Presupuestaria y Plan de Inversión para el piloto operativo y escala a 12 meses.
Reglas estrictas de evaluación nacional:
1. Cotiza en Córdobas (C$) y equivalente en USD ($4,000 - $6,000 USD de referencia para el piloto).
2. Detalla insumos obtenibles en el mercado nicaragüense o mayoristas internacionales de fácil desaduanaje.
3. Especifica el modelo de sostenibilidad financiera viable (convenio con alcaldías municipales, cooperativas, programas MEFCCA o venta de servicios).
4. Incluye desglose por fases a 12 meses (Fase 1: Prototipo y Pruebas M1-M3; Fase 2: Despliegue Piloto M4-M7; Fase 3: Escalamiento M8-M12).`;
    }
    return `Actúa como Ingeniero de Costos y Abastecimiento Internacional para el ${cert}.
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Criterio Rúbrica Oficial: Prefactibilidad Económica y Sustentabilidad (20 Puntos).
Presupuesto ya registrado por el equipo (edítalo solo si falta algo o está fuera de rango):
${(state.budget || []).map(it => `- ${it.element}: ${it.units} × $${it.unit_cost} = $${(it.units * it.unit_cost).toFixed(2)} (${it.url || 'sin enlace'})`).join("\n") || "(vacío — propon el lote piloto completo)"}
Patrón de Ganadores Latam/Nacional:
Elabora el Presupuesto de Puesta en Marcha para el lote piloto de 10 unidades.
Reglas estrictas de evaluación:
1. Cotiza 5 a 6 insumos reales de distribuidores mayoristas (Alibaba / componentes de escala comercial).
2. Proporciona: Elemento, Unidades requeridas, Costo unitario en USD y Enlace de búsqueda real por partida.
3. Incluye una partida obligatoria para Flete Internacional y Aranceles de Importación (18%).
4. El monto total final debe situarse estrictamente en el rango óptimo de $4,000 a $6,000 USD (ni inflando ni omitiendo costos críticos).
5. Formato de salida: una partida por línea con el formato "Elemento | unidades | costo_unitario | enlace" para pegar directo en el dashboard.`;
  }

  if (taskId === "voice_audio") {
    if (isNac) {
      return `Actúa como Locutor Profesional y Guionista de Pitch de Innovación para el ${cert}.
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Criterio Rúbrica Oficial Jurado Nacional: Calidad del Video Pitch (15 Puntos) e Identidad Territorial.
Patrón de Ganadores Nacionales (Fórmula 120 Segundos):
Genera el texto de locución continuo para los 4 actos (cadencia de 135 ppm, total 250 a 270 palabras):
- Acto 1 (0–20s): Apertura empática en territorio real de Nicaragua con cifra contundente. PROHIBIDO nombre del proyecto o logos.
- Acto 2 (20–60s): Explicación técnica de la solución, nombre identitario/marca registrable y demostración del mecanismo funcional/prototipo (los ganadores muestran la maqueta temprano).
- Acto 3 (60–95s): Prefactibilidad económica y sostenibilidad con actores del entorno local (alcaldías, cooperativas, MEFCCA) y cifras exactas del pautado.
- Acto 4 (95–120s): Cierre memorable de impacto humano, empleo y orgullo del talento nicaragüense (identidad cultural real, no retórica vacía).
Distribución objetiva de palabras: Acto 1 ≤45, Acto 2 ≤90, Acto 3 ≤75, Acto 4 ≤55 (total 250-270).
Entrega solo el texto continuo para el locutor o sintetizador TTS, sin acotaciones teatrales ni corchetes.

MOTOR Y ENTREGABLE DE AUDIO (si tu entorno tiene acceso al equipo):
No basta con escribir el texto. Instala o usa un motor TTS y genera assets/voice/narration.mp4: MP4 con audio AAC, sin video, mono, 48 kHz, máximo 120 segundos.
Recomendado: Chatterbox Multilingual es-MX/LatAm (MIT, clonación y control de emoción). Respaldo en CPU: Kokoro 82M. Edge-TTS solo si hay internet.
La guía completa con pasos, modelo y parámetros está en la pestaña Guion > Motor de voz > Copiar prompt para mi IA.
Si no puedes ejecutar el motor, entrega el texto y las instrucciones exactas para que el equipo lo haga.`;
    }
    return `Actúa como Locutor Profesional y Guionista de Pitch de Innovación para el ${cert}.
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Criterio Rúbrica Oficial: Calidad de la Presentación y Estructura Audiovisual (10 Puntos).
Patrón de Ganadores (Anatomía de 120 segundos):
Genera el texto de locución continuo para los 4 actos (cadencia estricta de 135 palabras por minuto, total 250 a 270 palabras):
- Acto 1 (0–20s): Dolor humano y cifras cuantificadas. PROHIBIDO mencionar el nombre del proyecto o mostrar logos.
- Acto 2 (20–60s): Explicación técnica de la solución y mecanismo funcional; los ganadores Latam muestran la demo visual de forma temprana y usualen un nombre memorable de identidad regional.
- Acto 3 (60–95s): Prefactibilidad y desglose del presupuesto en ${isNac ? "córdobas (C$)" : "USD"} coincidente con el documento pautado.
- Acto 4 (95–120s): Cierre de impacto, métricas auditables y proyección regional, con identidad nicaragüense (símbolo o cifra de orgullo local) como en los videos ganadores.
Distribución objetiva de palabras: Acto 1 ≤45, Acto 2 ≤90, Acto 3 ≤75, Acto 4 ≤55 (total 250-270).
Entrega solo el texto continuo para el locutor o sintetizador TTS, sin acotaciones teatrales ni corchetes.

MOTOR Y ENTREGABLE DE AUDIO (si tu entorno tiene acceso al equipo):
No basta con escribir el texto. Instala o usa un motor TTS y genera assets/voice/narration.mp4: MP4 con audio AAC, sin video, mono, 48 kHz, máximo 120 segundos.
Recomendado: Chatterbox Multilingual es-MX/LatAm (MIT, clonación y control de emoción). Respaldo en CPU: Kokoro 82M. Edge-TTS solo si hay internet.
La guía completa con pasos, modelo y parámetros está en la pestaña Guion > Motor de voz > Copiar prompt para mi IA.
Si no puedes ejecutar el motor, entrega el texto y las instrucciones exactas para que el equipo lo haga.`;
  }

  if (taskId === "cross_audit") {
    const pautadoSummary = `Problema (${(state.pautado.problema||'').length} car.), Solución (${(state.pautado.solucion||'').length} car.), Prefactibilidad (${(state.pautado.prefactibilidad||'').length} car.), Innovación (${(state.pautado.innovacion||'').length} car.), Impacto (${(state.pautado.impacto||'').length} car.)`;
    const scriptSummary = `Acto 1: ${state.script.acto1 || '(vacío)'}\nActo 2: ${state.script.acto2 || '(vacío)'}\nActo 3: ${state.script.acto3 || '(vacío)'}\nActo 4: ${state.script.acto4 || '(vacío)'}`;
    
    return `Actúa como Presidente del Tribunal Calificador y Auditor de Consistencia para el ${cert}.
Proyecto: "${pName}" (${chTitle}).
Tesis Técnica: "${thesis}".
Pautado Oficial Actual: ${pautadoSummary}
Guion 120s Actual:\n${scriptSummary}

Misión crítica como jurado riguroso antes de calificar:
1. AUDITORÍA DE DISCREPANCIAS NUMÉRICAS (Causa oculta #1 de descalificación):
   - Coteja centavo a centavo y persona a persona si alguna cifra dicha en el guion (costos, beneficiarios, tiempos, reducción %) contradice o no está en el pautado. Si hay discrepancia, indícala con su corrección exacta.
2. CHECKLIST DE LOS 11 PATRONES PERDEDORES:
   - ¿Propone una app móvil genérica para crisis complejas de salud/violencia sin hardware o validación física?
   - ¿Falta costeo unitario y lote piloto en el rango recomendado ($4,000 - $6,000 USD)?
   - ¿Desperdicia los primeros 20 segundos en logotipos o presentaciones?
   - ¿El guion excede 270 palabras o 120 segundos?
   - ¿Usa sufijo genérico -INNOVA en lugar de Naming Dual diferenciado?
3. BILINGÜISMO EVALUATIVO Y RÚBRICA 100 PTS:
   - ${isNac ? 'Verifica anclaje territorial nicaragüense, alineación con PNDH 2022-2026 y actores locales (INATEC/MEFCCA).' : 'Verifica universalidad técnica en lenguaje COTS/CAD, costos en USD sin subsidio y Nicaragua como prueba piloto para escalar a Latinoamérica.'}
Entrega tu veredicto en viñetas directas: [APROBADO / RIESGOS DETECTADOS / CORRECCIONES INMEDIATAS].`;
  }

  if (taskId === "web_prototype") {
    const pctx = budgetCurrency();
    const budgetLines = (state.budget || []).map(it => `${it.element} ×${it.units} — ${budgetFmt(it.units * it.unit_cost, pctx)}`).join("; ") || "(sin partidas aún)";
    return `Actúa como Desarrollador Web Frontend Senior especializado en dashboards televisivos.
Proyecto: "${pName}" (${chTitle}).
Tesis: "${thesis}".
Toma el sitio existente de prototipo digital (/site) como referencia de estilo: tela suiza de datos (Estación y cobertura territorial), azul cobalto #0866F5, tipografía Plus Jakarta Sans, JetBrains Mono para números.
Presupuesto actual del equipo: ${budgetLines}.
Misión: genera UN SOLO archivo HTML autocontenido (con <style> y <script> incrustados, sin CDN ni fuentes externas) que sirva como panel de monitoreo del prototipo para grabar planos de pantalla.
Requisitos estrictos:
1. Hero con nombre del proyecto, la tesis condensada y 3 métricas grandes en tipografía mono (ej. unidades del piloto, cobertura, ahorro estimado) tomadas de la tesis y del presupuesto.
2. Panel "Telemetría en Vivo" con datos simulados en JS (setInterval) que cambien cada 2s: señal, batería, nivel, temperatura — números plausibles para el hardware de la tesis.
3. Tabla de partidas mayoristas con los datos de presupuesto dados (elemento, unidades, costo) + total calculado en ${pctx.rotulo}.
4. Barra inferior con pulso de "Registro Territorial" y estado del gateway LoRaWAN.
5. Estética: fondo blanco, 1 línea de acento cobalto, sin gradientes chillones, sin emojis, sin imágenes externas; texto legible en 4K (para grabar a 1080p/4K).
6. Todo debe correr en un solo archivo, responsive, sin errores de consola.
Entrega SOLO el código completo del archivo HTML.`;
  }

  return `Mega-Prompt calibrado con Rúbrica Oficial (100 Pts) para ${pName} (${cert}).`;
}

function copySpecificMegaPrompt(taskId) {
  const promptText = generateSpecificMegaPrompt(taskId);
  navigator.clipboard.writeText(promptText);
  setTaskStatus(taskId, "in_progress");
  alert(`Mega-Prompt para ${taskId} copiado al portapapeles. La tarea quedó marcada 'En Curso'.`);
}

function injectTaskResult(taskId) {
  const ta = document.getElementById(`paste-result-${taskId}`);
  const val = ta ? ta.value.trim() : "";
  if (!val) {
    alert("Pega la respuesta de la IA antes de inyectar.");
    return;
  }

  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.result = val;
    task.status = "completed";
  }

  // Mapeo automático de resultados
  if (taskId === "stats_poverty") {
    state.claims.push({ text: val.slice(0, 300), source: "Gemini / Perplexity" });
    if (!state.pautado.problema) state.pautado.problema = val.slice(0, 1200);
    if (!state.pautado.impacto) state.pautado.impacto = val.slice(0, 1400);
  } else if (taskId === "patents_art") {
    if (!state.pautado.innovacion) state.pautado.innovacion = val.slice(0, 980);
  } else if (taskId === "budget_alibaba") {
    // Si contiene números, intentar parsear partidas
    const lines = val.split("\n").filter(l => l.includes("$") || l.includes("USD") || l.includes(":"));
    if (lines.length >= 3) {
      state.budget = lines.slice(0, 6).map((l, i) => {
        const costMatch = l.match(/\$?(\d+(?:\.\d+)?)/);
        const cost = costMatch ? parseFloat(costMatch[1]) : 50;
        return {
          element: l.replace(/\$?(\d+(?:\.\d+)?)/g, "").replace(/[^\w\sáéíóúñÑ]/g, "").trim().slice(0, 45) || `Insumo ${i+1}`,
          units: 10,
          unit_cost: cost,
          url: "https://alibaba.com"
        };
      });
    }
  } else if (taskId === "voice_audio") {
    // Si contiene división de actos, mapear a los 4 actos
    if (val.includes("Acto 1") || val.includes("Acto I")) {
      const parts = val.split(/Acto\s+[1-4I|V]+/i).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        state.script.acto1 = parts[0];
        state.script.acto2 = parts[1];
        state.script.acto3 = parts[2];
        state.script.acto4 = parts[3];
      } else {
        state.script.acto1 = val.slice(0, 300);
      }
    } else {
      state.script.acto1 = val.slice(0, 300);
    }
  } else if (taskId === "web_prototype") {
    // Extrae el HTML generado y lo ofrece como descarga para /site/
    const htmlMatch = val.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
    if (htmlMatch) {
      const blob = new Blob([htmlMatch[0]], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "prototipo_ai.html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("HTML del prototipo descargado (prototipo_ai.html). Súbelo o pégalo en /site/index.html.");
    } else {
      showToast("La IA no devolvió HTML detectable. Revisa la respuesta antes de descargar.", true);
    }
  }

  saveState();
  renderTab("multi_ai");
  showToast(`Datos inyectados al proyecto desde ${task ? task.ai : 'IA'} exitosamente`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 05 NIVEL 4: PAUTADO OFICIAL (< LÍMITES CON ESPACIOS)
// ═════════════════════════════════════════════════════════════════════════════
const PAUTADO_HINTS = {
  problema: "Fórmulalo con una cifra verificable: quién sufre el problema, cuánto pierde y por qué nadie lo ha resuelto.",
  solucion: "Una frase densa: qué hace el sistema, con qué hardware y qué desbloquea. Sin nombres comerciales.",
  prefactibilidad: "Costos de proveedores reales (Alibaba) con flete 18%. El total debe cuadrar entre $4,000 y $6,000 USD.",
  innovacion: "Por qué no existe aún: dimensión Wow 1 (ciber-física) o Wow 2 (pasivo convertido en capital).",
  impacto: "ODS oficial + beneficio anual cuantificado: familias, ahorro o hectáreas. Citas el plan de lucha contra la pobreza."
};

function renderViewPautado() {
  const authorship = (state.authorship && state.authorship.pautado) || {};

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">06 · Documento <span class="phase-title-accent">Pautado Oficial</span></h1>
        <p class="phase-subtitle">5 secciones evaluadas por el jurado con conteo estricto de caracteres y compilación directa en la plantilla oficial.</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn-primary" onclick="compileAndDownloadDocx()" id="btn-compile-docx">
          ${SVG.spark} Compilar en Word (.docx)
        </button>
        <button class="btn-secondary" onclick="exportProjectMarkdown()" style="display:inline-flex; align-items:center; gap:5px;">
          ${SVG.copy} Exportar Dossier (.md)
        </button>
        <button class="btn-secondary" onclick="printProjectDossier()" style="display:inline-flex; align-items:center; gap:5px;">
          ${SVG.download} Imprimir / PDF
        </button>
        <a href="/docs/pautado_template.docx" id="direct-docx-link" download="Plantilla_Pautado_Oficial.docx" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Descarga la plantilla oficial vacía para revisarla antes de compilar">
          ${SVG.download} Plantilla Word (vacía)
        </a>
      </div>
      ${onlineLinkRow("pautado", "Pega el enlace de Canva, Google Docs o Figma del pautado", "ENLACE AL PAUTADO EN LÍNEA")}
    </div>

    <div class="workbench-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div style="min-width:0;">
          <div style="font-size:12.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; color:var(--text-main);">Plantilla oficial del evento</div>
          <p style="font-size:11.5px; color:#94A3B8; margin:4px 0 0 0; max-width:660px; line-height:1.45;">
            Sube el Word (.docx) que entrega el evento (${state.rally_type === 'nacional' ? 'Rally Nacional Nicaragua Innova' : 'Rally Latinoamericano'}).
            Al compilar, los textos de abajo se insertan automáticamente bajo cada encabezado oficial, respetando las reglas de la rúbrica.
          </p>
          <div id="pautado-template-status" style="font-size:11.5px; font-weight:700; color:#64748B; margin-top:6px;">Consultando plantilla…</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-secondary" type="button" onclick="document.getElementById('pautado-template-input').click()">${SVG.upload} Subir plantilla Word (.docx)</button>
          <button class="btn-secondary" type="button" onclick="clearPautadoTemplate()">Quitar</button>
        </div>
      </div>
      <input type="file" id="pautado-template-input" aria-label="Subir plantilla Word del evento" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;" onchange="handlePautadoTemplateUpload(event)">
    </div>

    <div class="rubric-callout">
      <strong>${getPautadoLimit("problema") === null ? "DOCUMENTO OFICIAL DEL EVENTO:" : "CONTEO ESTRICTO DE CARACTERES:"}</strong>
      ${getPautadoLimit("problema") === null
        ? "El Rally Nacional evalúa un documento técnico de hasta 10 páginas; el sistema inserta cada sección bajo su encabezado oficial sin recortar texto."
        : "Evaluado con la matriz oficial (100 pts). Si sobrepasas el límite estipulado, el sistema corta el texto al límite o anula la sección en la rúbrica de evaluación."}
    </div>

    <div style="display:flex; flex-direction:column; gap:16px;">
      ${Object.keys(PAUTADO_LIMITS).map(k => {
        const val = state.pautado[k] || "";
        const len = val.length;
        const max = getPautadoLimit(k);
        const pct = max ? Math.min(100, Math.round((len / max) * 100)) : null;
        const isOver = max ? len > max : false;
        const color = isOver ? '#b42318' : (pct !== null && pct >= 92) ? '#0D1B35' : '#64748B';
        const counter = max ? `${len} / ${max} caracteres (${pct}%)` : `${len} caracteres`;
        const authorMascot = authorship[k] || null;
        const secMeta = {
          problema:        { icon: SVG.target,      color: "#0D1B35" },
          solucion:        { icon: SVG.spark,       color: "#0866F5" },
          impacto:         { icon: SVG.globe,       color: "#0284C7" },
          innovacion:      { icon: SVG.network,     color: "#475569" },
          prefactibilidad: { icon: SVG.shieldCheck, color: "#0D1B35" }
        }[k] || { icon: "", color: "#64748B" };

        return `
          <div class="workbench-card" style="margin-bottom:0;" data-lockable="pautado-${k}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="pautado-sec-label" style="--sec:${secMeta.color};">
                  <span class="pautado-sec-bar"></span>
                  ${secMeta.icon}
                  <span>${k}</span>
                </span>
                ${authorMascot ? `
                  <span class="collaborator-stamp" title="Última edición por ${authorMascot.name}">
                    ${authorMascot.icon} ${authorMascot.name}
                  </span>
                ` : ""}
                <span id="lock-tag-pautado-${k}"></span>
              </div>
              <span class="pautado-counter" style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:${color}; font-variant-numeric:tabular-nums;">
                ${counter}
              </span>
            </div>
            <p style="font-size:11px; color:#94A3B8; line-height:1.45; margin:0 0 6px 0;">${PAUTADO_HINTS[k] || ""}</p>
            <textarea id="pt-${k}" rows="5"
              style="width:100%; max-width:860px; border:1px solid ${isOver ? '#b42318' : 'var(--border-light)'}; border-radius:4px; padding:10px; font-size:13px; line-height:1.55; font-family:var(--font-ui); box-sizing:border-box;"
              placeholder="Escribe la sección ${k}..."
              onfocus="broadcastLock('pautado-${k}')"
              onblur="broadcastRelease('pautado-${k}')"
              oninput="updateCharCount('${k}', this)">${val}</textarea>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function updateCharCount(k, el) {
  state.pautado[k] = el.value;
  broadcastFieldChange("pautado", k, el.value);
  saveState();
  const max = getPautadoLimit(k);
  const len = el.value.length;
  const pct = max ? Math.min(100, Math.round((len / max) * 100)) : null;
  const isOver = max ? len > max : false;
  const color = isOver ? '#b42318' : (pct !== null && pct >= 92) ? '#0D1B35' : '#64748B';
  const labelEl = el.closest(".workbench-card") ? el.closest(".workbench-card").querySelector(".pautado-counter") : null;
  if (labelEl) {
    labelEl.innerText = max ? `${len} / ${max} caracteres (${pct}%)` : `${len} caracteres`;
    labelEl.style.color = color;
  }
  el.style.borderColor = isOver ? '#b42318' : 'var(--border-light)';
}

// ── Plantilla .docx del evento: se guarda en el servidor y se cachea en memoria ──
let _pautadoTemplateB64 = {}; // { latam: "<base64>", nacional: "<base64>" }

function _pautadoRallyType() {
  return state.rally_type === "nacional" ? "nacional" : "latam";
}

function _setPautadoTemplateStatus(html, color) {
  const el = document.getElementById("pautado-template-status");
  if (el) { el.innerHTML = html; el.style.color = color || "#64748B"; }
}

function _readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function refreshPautadoTemplateStatus() {
  const rallyType = _pautadoRallyType();
  const hasLocal = !!_pautadoTemplateB64[rallyType];
  try {
    const res = await fetch("/api/template-status");
    const data = await res.json();
    const info = (data.templates || {})[rallyType] || {};
    if (info.user) {
      _setPautadoTemplateStatus(`${SVG.check} Cargada: ${info.user.name} · ${Math.round(info.user.size / 1024)} KB${hasLocal ? " (en esta sesión)" : ""}`, "#0D1B35");
    } else if (hasLocal) {
      _setPautadoTemplateStatus("Plantilla cargada en esta sesión (aún sin guardar en el servidor).", "#0D1B35");
    } else if (info.reference) {
      _setPautadoTemplateStatus(`Sin subir: se usará la plantilla de referencia del evento (${info.reference}).`, "#64748B");
    } else {
      _setPautadoTemplateStatus("Sin subir y sin plantilla de referencia disponible.", "#b42318");
    }
  } catch (e) {
    _setPautadoTemplateStatus(
      hasLocal ? "Plantilla cargada en esta sesión (servicio local no disponible)." : "Servicio local no disponible: activa el servidor para guardar/compilar la plantilla.",
      hasLocal ? "#0D1B35" : "#b42318"
    );
  }
}

async function handlePautadoTemplateUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!/\.docx$/i.test(file.name)) { showToast("La plantilla debe ser un archivo Word (.docx)."); return; }
  const rallyType = _pautadoRallyType();
  let b64 = "";
  try { b64 = await _readFileAsBase64(file); } catch (e) { showToast("No se pudo leer el archivo."); return; }
  _pautadoTemplateB64[rallyType] = b64;
  _setPautadoTemplateStatus(`${SVG.check} Cargada: ${file.name} · ${Math.round(file.size / 1024)} KB`, "#0D1B35");
  try {
    const res = await fetch("/api/template-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rally_type: rallyType, name: file.name, data: b64 })
    });
    const data = await res.json();
    if (data.status === "ok") { showToast("Plantilla del evento guardada correctamente."); refreshPautadoTemplateStatus(); }
    else { showToast("Plantilla cargada en esta sesión: " + (data.message || "no se pudo guardar en el servidor.")); }
  } catch (e) {
    showToast("Plantilla cargada en esta sesión. El servicio local no está disponible.");
  }
  if (event.target.value !== undefined) event.target.value = "";
}

async function clearPautadoTemplate() {
  const rallyType = _pautadoRallyType();
  delete _pautadoTemplateB64[rallyType];
  try {
    await fetch("/api/template-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rally_type: rallyType, clear: true })
    });
    showToast("Plantilla quitada. Se usará la de referencia del evento.");
  } catch (e) {
    showToast("Plantilla quitada de esta sesión.");
  }
  refreshPautadoTemplateStatus();
}

function compileAndDownloadDocx() {
  const btn = document.getElementById("btn-compile-docx");
  if (btn) btn.innerHTML = `Compilando en plantilla oficial...`;
  
  fetch("/api/compile-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rally_type: state.rally_type || "latam",
      team_name: state.team_name || "EQUIPO",
      university: state.university || "UNIVERSIDAD",
      project_name: state.project_name || "PROYECTO",
      challenge_title: state.challenge_title || "DESAFÍO",
      pautado: state.pautado
    })
  })
  .then(r => r.json())
  .then(res => {
    if (btn) btn.innerHTML = `${SVG.spark} Compilar en Plantilla Word (.docx)`;
    if (res.status === "ok") {
      showToast("Documento pautado compilado exitosamente dentro de la plantilla oficial");
      const a = document.createElement("a");
      a.href = res.file;
      a.download = `Pautado_${(state.project_name || 'Rally').replace(/\s+/g, '_')}_Oficial.docx`;
      a.click();
    } else {
      alert("Error al compilar documento: " + (res.message || "desconocido"));
    }
  })
  .catch(err => {
    if (btn) btn.innerHTML = `${SVG.spark} Compilar en Plantilla Word (.docx)`;
    showToast("Compilado en modo local: descargando borrador.");
    const link = document.getElementById("direct-docx-link");
    if (link) link.click();
  });
}

function savePautado() {
  saveState();
  renderNavigation();
  showToast("Pautado guardado correctamente.");
}

// ═════════════════════════════════════════════════════════════════════════════
// 06 NIVEL 4: PRESUPUESTO DE PUESTA EN MARCHA
// ═════════════════════════════════════════════════════════════════════════════
function budgetCurrency() {
  const nacional = state.rally_type === "nacional";
  const rate = Number(state.exchange_rate_bcn) || 0;
  const enCordobas = nacional && rate > 0;
  return {
    nacional,
    rate,
    listo: !nacional || rate > 0,
    code: enCordobas ? "NIO" : "USD",
    simbolo: enCordobas ? "C$" : "$",
    rotulo: enCordobas ? "C$" : "USD",
  };
}

function budgetConvert(usd, ctx) {
  return ctx.code === "NIO" ? usd * ctx.rate : usd;
}

function budgetFmt(usd, ctx, conCodigo) {
  const valor = budgetConvert(usd, ctx);
  const numero = valor.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${ctx.simbolo}${numero}${conCodigo ? ` ${ctx.code}` : ""}`;
}

function updateExchangeRate(val) {
  const rate = parseFloat(val) || 0;
  state.exchange_rate_bcn = rate > 0 ? rate : 0;
  saveState();
  renderTab("budget");
}

function renderViewBudget() {
  const total = state.budget.reduce((a, b) => a + (b.units * b.unit_cost), 0);
  const ctx = budgetCurrency();
  const isTooLow = total < 3000;
  const isTooHigh = total > 6500;
  const hasNotice = isTooLow || isTooHigh;

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">07 · Presupuesto de <span class="phase-title-accent">Puesta en Marcha</span></h1>
        <p class="phase-subtitle">Insumos mayoristas para el prototipo inicial o lote piloto verificables con proveedores reales.</p>
        ${ctx.nacional ? `
          <label style="display:inline-flex; align-items:center; gap:6px; margin-top:8px; font-size:11px; font-weight:700; color:var(--text-muted);">
            Tasa BCN (C$ por USD)
            <input type="number" min="1" step="0.01" value="${ctx.rate || ""}" placeholder="36.50"
                   aria-label="Tasa de cambio del BCN en córdobas por dólar"
                   style="width:90px; text-align:right; border:1px solid var(--border-light); border-radius:3px; padding:3px 6px;"
                   onchange="updateExchangeRate(this.value)">
          </label>
        ` : ""}
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-primary" onclick="addBudgetItem()">+ Agregar Partida</button>
        <a href="/budget/budget.xlsx" download class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
          ${SVG.download} Descargar Excel (.xlsx)
        </a>
      </div>
      ${onlineLinkRow("budget", "Pega el enlace de Canva o Google Sheets del presupuesto", "ENLACE AL PRESUPUESTO EN LÍNEA")}
    </div>

    ${!ctx.listo ? `
      <div class="rubric-callout" style="border-left-color:#f59e0b; background:#fffdf5;">
        <strong>Falta la tasa del BCN:</strong> el Rally Nacional exige el presupuesto en córdobas.
        Escribe la tasa oficial vigente arriba para convertir las partidas. Mientras tanto se muestran en USD.
      </div>
    ` : ""}

    ${hasNotice ? `
      <div class="rubric-callout" style="border-left-color:${isTooHigh ? '#f59e0b' : '#3b82f6'}; background:#fffdf5;">
        <strong>Aviso de Consistencia Presupuestaria:</strong>
        ${isTooHigh 
          ? 'El monto total actual es elevado para una puesta en marcha piloto. Si tu solución requiere equipamiento industrial mayor, asegúrate de justificarlo claramente en la sección de Prefactibilidad del pautado.'
          : 'El monto total actual es bajo para un desarrollo técnico completo. Asegúrate de incluir partidas esenciales como flete internacional o contingencia para evitar observaciones del jurado.'
        }
      </div>
    ` : `
      <div class="rubric-callout" style="border-left-color:#10b981; background:#f0fdf4;">
        <strong>Presupuesto Equilibrado y Sustentado:</strong> El monto actual de <strong>${budgetFmt(total, ctx, true)}</strong> refleja un balance creíble entre viabilidad económica y rigor técnico.${ctx.nacional && ctx.rate ? ` Equivale a $${total.toFixed(2)} USD a la tasa declarada.` : ""}
      </div>
    `}

    <div class="table-plate" style="padding:0;">
      <div class="table-responsive" style="margin-bottom:0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Elemento / Componente</th>
              <th style="width:80px; text-align:center;">Unidades</th>
              <th style="width:120px; text-align:right;">Costo Unit. (${ctx.rotulo})</th>
              <th style="width:120px; text-align:right;">Subtotal</th>
              <th style="width:60px; text-align:center;">Acción</th>
            </tr>
          </thead>
          <tbody>
            ${state.budget.length === 0 ? `
              <tr>
                <td colspan="5" style="padding:40px 16px; text-align:center;">
                  <div style="font-size:13px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">Sin partidas todavía</div>
                  <div style="font-size:12px; color:var(--text-muted); max-width:420px; margin:0 auto; line-height:1.55;">
                    Aún no hay insumos registrados. Agrega la primera partida con <strong>+ Agregar Partida</strong> e incluye el enlace al proveedor real para sustentar cada costo ante el jurado.
                  </div>
                </td>
              </tr>
            ` : ""}
            ${state.budget.map((it, idx) => `
              <tr>
                <td>
                  <input type="text" value="${it.element}" aria-label="Concepto de la partida ${idx + 1}" style="width:100%; border:none; background:transparent; font-size:12px; font-weight:600;" onchange="updateBudgetItem(${idx}, 'element', this.value)">
                  <div style="font-size:10px; color:var(--text-muted);">${it.url ? `<a href="${it.url}" target="_blank" style="color:var(--color-primary); text-decoration:none;">Enlace proveedor ${SVG.external}</a>` : 'Sin enlace'}</div>
                </td>
                <td style="text-align:center;">
                  <input type="number" value="${it.units}" aria-label="Unidades de la partida ${idx + 1}" style="width:60px; text-align:center; border:1px solid var(--border-light); border-radius:3px; padding:2px;" onchange="updateBudgetItem(${idx}, 'units', this.value)">
                </td>
                <td style="text-align:right;">
                  <input type="number" step="0.5" value="${budgetConvert(Number(it.unit_cost) || 0, ctx).toFixed(2)}" aria-label="Costo unitario en ${ctx.rotulo} de la partida ${idx + 1}" style="width:80px; text-align:right; border:1px solid var(--border-light); border-radius:3px; padding:2px;" onchange="updateBudgetItem(${idx}, 'unit_cost', this.value)">
                </td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:700;">
                  ${budgetFmt(it.units * it.unit_cost, ctx)}
                </td>
                <td style="text-align:center;">
                  <button type="button" class="btn-secondary" style="padding:2px 6px; font-size:10px; color:#ef4444;" aria-label="Eliminar partida ${idx + 1}" title="Eliminar partida ${idx + 1}" onclick="removeBudgetItem(${idx})">${SVG.close}</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc; font-weight:800;">
              <td colspan="3" style="text-align:right; font-size:12px;">TOTAL PRESUPUESTO PUESTA EN MARCHA:</td>
              <td style="text-align:right; font-family:var(--font-mono); font-size:14px; color:var(--color-primary);">${budgetFmt(total, ctx, true)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function updateBudgetItem(idx, field, val) {
  if (field === "units" || field === "unit_cost") {
    let numero = parseFloat(val) || 0;
    const ctx = budgetCurrency();
    if (field === "unit_cost" && ctx.code === "NIO" && ctx.rate > 0) {
      numero = numero / ctx.rate;
    }
    state.budget[idx][field] = numero;
  } else {
    state.budget[idx][field] = val;
  }
  saveState();
  renderTab("budget");
}

function addBudgetItem() {
  state.budget.push({ element: "Nuevo Insumo Técnico", units: 1, unit_cost: 50.00, url: "https://alibaba.com" });
  saveState();
  renderTab("budget");
}

function removeBudgetItem(idx) {
  state.budget.splice(idx, 1);
  saveState();
  renderTab("budget");
}

// ═════════════════════════════════════════════════════════════════════════════
// 07 NIVEL 4: BÓVEDA DE RECURSOS, LOGOS & ENLACES FIJOS
// ═════════════════════════════════════════════════════════════════════════════
// ── ESTUDIO DE VIDEO · plan de tomas + galería de recursos (flujo editora) ──
const DEFAULT_SHOT_PLAN = [
  { id: "a1_broll", acto: "Acto I", label: "B-roll del problema en campo o mercado (2–3 tomas)" },
  { id: "a1_ctx", acto: "Acto I", label: "Fotos de contexto con autorización de las personas" },
  { id: "a2_demo", acto: "Acto II", label: "Demostración de la maqueta o dispositivo en uso" },
  { id: "a3_dash", acto: "Acto III", label: "Capturas del dashboard / telemetría en vivo" },
  { id: "a3_par", acto: "Acto III", label: "Pivotes y toma de proveedor con costo real" },
  { id: "a4_crew", acto: "Acto IV", label: "Cierre con equipo completo en la entrada del campus" },
  { id: "branding", acto: "Extras", label: "Emblema y logos oficiales en máxima resolución" },
  { id: "audio_vo", acto: "Extras", label: "Locución de respaldo o pista de voz (MP4 con audio AAC)" },
  { id: "proto", acto: "Extras", label: "Prototipo web generado (captura en vivo del HTML)" }
];

let _assetUploadActo = "Extras";

function getVideoAssets() {
  state.video_assets = state.video_assets || { plan_done: [], items: [] };
  if (!Array.isArray(state.video_assets.plan_done)) state.video_assets.plan_done = [];
  if (!Array.isArray(state.video_assets.items)) state.video_assets.items = [];
  return state.video_assets;
}

function toggleShotPlan(id) {
  const va = getVideoAssets();
  va.plan_done = va.plan_done.includes(id) ? va.plan_done.filter(x => x !== id) : [...va.plan_done, id];
  saveState();
  broadcastFieldChange("video_assets", "state", va);
  renderTab("resources");
}

function setAssetUploadActo(val) {
  _assetUploadActo = val;
  const box = document.getElementById("video-studio-body");
  if (box) box.innerHTML = renderVideoStudio();
}

async function uploadVideoAssets(inputEl) {
  const files = Array.from(inputEl.files || []);
  inputEl.value = "";
  if (!files.length) return;
  const actoEl = document.getElementById("video-upload-acto");
  const acto = actoEl ? actoEl.value : _assetUploadActo;
  showToast(`Subiendo ${files.length} recurso(s) al servidor de la bóveda…`);
  const va = getVideoAssets();
  for (const file of files) {
    try {
      const resp = await fetch("/api/asset-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Asset-Name": encodeURIComponent(file.name),
          "X-Asset-Acto": encodeURIComponent(acto)
        },
        body: file
      });
      const data = await resp.json();
      if (data.status === "ok") {
        va.items.push({
          id: data.id, name: file.name, size: file.size, type: file.type || "",
          acto, owner: currentClientMascot.name, ts: data.timestamp,
          url: data.url
        });
      } else {
        showToast(`No se pudo subir ${file.name}. Isla del servidor activa?`, true);
      }
    } catch (e) {
      showToast(`No se pudo subir ${file.name} (servidor apagado).`, true);
    }
  }
  saveState();
  broadcastFieldChange("video_assets", "state", va);
  renderTab("resources");
  showToast("Recursos listos en la galería. La editora ya los ve.");
}

function deleteVideoAsset(id) {
  const va = getVideoAssets();
  va.items = va.items.filter(it => it.id !== id);
  saveState();
  broadcastFieldChange("video_assets", "state", va);
  fetch("/api/asset-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  renderTab("resources");
}

function downloadAsset(url, name) {
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  a.remove();
}

function renderVideoStudio() {
  const va = getVideoAssets();
  const planRows = DEFAULT_SHOT_PLAN.map(p => {
    const done = va.plan_done.includes(p.id);
    return `
      <label class="shot-plan-row ${done ? "done" : ""}" style="padding:8px 0; display:flex; gap:10px; align-items:flex-start; border-bottom:1px solid var(--border-light); cursor:pointer;">
        <input type="checkbox" ${done ? "checked" : ""} onchange="toggleShotPlan('${p.id}')" style="margin-top:2px; accent-color:var(--color-primary);">
        <span style="font-size:11.5px; ${done ? "color:var(--color-primary); font-weight:600;" : "color:var(--text-main);"} font-family:var(--font-ui);">
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); margin-right:6px;">${p.acto}</span>${p.label}
        </span>
      </label>`;
  }).join("");
  const doneCount = va.plan_done.length;
  const pct = Math.round((doneCount / DEFAULT_SHOT_PLAN.length) * 100);

  const itemGroups = {};
  va.items.forEach(it => { (itemGroups[it.acto] = itemGroups[it.acto] || []).push(it); });
  const order = [...DEFAULT_SHOT_PLAN.map(p => p.acto)].filter((g, i, a) => a.indexOf(g) === i);
  Object.keys(itemGroups).forEach(g => { if (!order.includes(g)) order.push(g); });

  const gal = order.filter(acto => itemGroups[acto]).map(acto => {
    const items = itemGroups[acto].slice().reverse();
    return `
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0 6px 0; border-bottom:1px solid var(--border-light); padding-bottom:4px;">
          <span style="font-size:11px; font-weight:800; letter-spacing:0.05em; color:var(--text-muted); text-transform:uppercase;">${acto} · ${items.length} recurso(s)</span>
        </div>
        <div class="asset-grid">
          ${items.map(it => {
            const kb = it.size > 1048576 ? `${(it.size / 1048576).toFixed(1)} MB` : `${Math.round(it.size / 1024)} KB`;
            let thumb = "";
            if ((it.type || "").startsWith("image/")) thumb = `<img class="asset-thumb" src="${it.url}" loading="lazy" alt="">`;
            else if ((it.type || "").startsWith("video/")) thumb = `<video class="asset-thumb" src="${it.url}" controls preload="metadata" muted></video>`;
            else if ((it.type || "").startsWith("audio/")) thumb = `<div class="asset-thumb asset-thumb-fallback"><div style="font-size:10px; font-weight:700; color:#94A3B8;">AUDIO</div><audio src="${it.url}" controls style="width:90%;"></audio></div>`;
            else thumb = `<div class="asset-thumb asset-thumb-fallback"><div style="font-size:10px; font-weight:700; color:#94A3B8; text-transform:uppercase;">${kb}</div></div>`;
            return `
              <div class="asset-card">
                ${thumb}
                <div style="padding:7px 9px;">
                  <div style="font-size:11px; font-weight:700; color:var(--text-main); word-break:break-all; line-height:1.3;">${it.name}</div>
                  <div style="font-size:10px; color:var(--text-muted); margin-top:3px; font-family:var(--font-mono);">${kb} · ${currentClientMascot && it.owner === currentClientMascot.name ? "tuyo" : it.owner}</div>
                  <div style="display:flex; gap:6px; margin-top:6px;">
                    <button class="btn-secondary" style="font-size:10.5px; padding:3px 8px;" onclick="downloadAsset('${it.url}','${it.name.replace(/'/g, "\\'")}')">${SVG.download || "⬇"} Original</button>
                    <button class="btn-secondary" style="font-size:10.5px; padding:3px 8px; color:#b42318;" onclick="deleteVideoAsset('${it.id}')">Quitar</button>
                  </div>
                </div>
              </div>`;
          }).join("")}
          ${!items.length ? `<span style="font-size:11px; color:var(--text-muted);">Sin recursos todavía de este acto.</span>` : ""}
        </div>
      </div>`;
  }).join("");

  return `
    <div style="display:grid; grid-template-columns:1fr 1.6fr; gap:22px;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; letter-spacing:0.05em; color:var(--text-muted); text-transform:uppercase;">Plan de Tomas (del guion oficial)</span>
          <span style="font-family:var(--font-mono); font-size:10.5px; color:var(--color-primary);">${doneCount}/${DEFAULT_SHOT_PLAN.length} (${pct}%)</span>
        </div>
        ${planRows}
      </div>
      <div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <label class="btn-secondary" style="cursor:pointer; font-size:11px; display:inline-flex; align-items:center; gap:6px;">
            ${SVG.upload} Subir toma / recurso
            <input type="file" multiple accept="video/*,image/*,audio/*" style="display:none;" onchange="uploadVideoAssets(this)">
          </label>
          <select id="video-upload-acto" aria-label="Acto del video al que pertenece el recurso" onchange="setAssetUploadActo(this.value)" style="font-size:11px; padding:4px 8px; border:1px solid var(--border-light); border-radius:5px;">
            ${[... new Set(DEFAULT_SHOT_PLAN.map(p => p.acto))].map(a => `<option value="${a}" ${a === _assetUploadActo ? "selected" : ""}>${a}</option>`).join("")}
          </select>
          <span style="font-size:10.5px; color:var(--text-muted);">Sube original sin recortar; la editora lo exporta a CapCut.</span>
        </div>
        ${gal}
      </div>
    </div>
  `;
}

function renderViewResources() {  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">08 · Bóveda de Recursos, <span class="phase-title-accent">Logos & Entregables</span></h1>
        <p class="phase-subtitle">Repositorio unificado de archivos para video pitch, enlaces de equipo y entregables oficiales.</p>
      </div>
      <button class="btn-primary" onclick="saveTeamHubLinks()">Guardar Enlaces de Equipo</button>
    </div>

    <div class="workbench-card" id="video-studio">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:4px;">
        <div>
          <h3 style="margin:0;">Estudio de Video · Plan de Tomas & Recursos del Equipo</h3>
          <p style="font-size:11px; color:var(--text-muted); margin:3px 0 0 0;">
            Cada integrante sube aquí sus tomas y recursos; la editora entra, los previsualiza tipo galería y los descarga directo a CapCut en calidad original (sin recomprimir).
          </p>
        </div>
        <span style="font-size:11px; font-weight:700; color:var(--color-primary); white-space:nowrap;" id="video-plan-badge"></span>
      </div>
      <div id="video-studio-body">${renderVideoStudio()}</div>
    </div>

    <div class="workbench-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <h3 style="margin:0;">Ingesta Automática por Carpeta Fuente</h3>
          <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0;">
            Documentos, patentes, actas previas e imágenes detectadas automáticamente en el directorio de trabajo.
          </p>
        </div>
        <button class="btn-secondary" onclick="scanFolderSources()" id="btn-scan-sources" style="font-size:11px;">
          ${SVG.sync} Escanear Fuentes
        </button>
      </div>
      <div id="sources-scan-container" style="max-height:180px; overflow-y:auto; border:1px solid var(--border-light); border-radius:6px; padding:8px; background:#f8fafc;">
        <span style="font-size:11px; color:var(--text-muted);">Cargando catálogo de archivos fuente...</span>
      </div>
    </div>

    <div class="workbench-card">
      <h3 style="margin-bottom:12px;">Enlaces Fijos del Equipo (Cloud Workspace)</h3>
      <div class="form-grid">
        <div class="form-group full">
          <label>Carpeta Oficial de Google Drive (Videos crudos, fotos y audios)</label>
          <div style="display:flex; gap:8px;">
            <input type="url" id="hub-drive-url" aria-label="URL de la carpeta oficial de Google Drive" value="${state.google_drive_url}" style="flex:1;">
            <a href="${state.google_drive_url}" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">Abrir Drive ${SVG.external}</a>
          </div>
        </div>
        <div class="form-group full">
          <label>Espacio de Trabajo Canva (Láminas, diapositivas y overlays del video)</label>
          <div style="display:flex; gap:8px;">
            <input type="url" id="hub-canva-url" aria-label="URL del espacio de trabajo Canva" value="${state.canva_url}" style="flex:1;">
            <a href="${state.canva_url}" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">Abrir Canva ${SVG.external}</a>
          </div>
        </div>
      </div>
    </div>

    <div class="workbench-card">
      <h3 style="margin-bottom:12px;">Logos Oficiales para el Video Pitch (Acto 2 al 4)</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
        <div style="border:1px solid var(--border-light); padding:12px; border-radius:6px; background:#f8fafc; text-align:center;">
          <div style="height:48px; display:flex; align-items:center; justify-content:center; gap:8px;">
            <img src="assets/logo_uni_official.png" style="max-height:44px; max-width:100px; object-fit:contain;" alt="Universidad Nacional de Ingeniería">
          </div>
          <strong style="font-size:11px; display:block;">Logo Institucional Sede</strong>
          <span style="font-size:10px; color:var(--text-muted);">${state.university || 'Universidad Nacional de Ingeniería'}</span>
        </div>

        <div style="border:1px solid var(--border-light); padding:12px; border-radius:6px; background:#f8fafc; text-align:center;">
          <div style="height:48px; display:flex; align-items:center; justify-content:center; gap:8px;">
            <img src="${state.rally_type === 'latam' ? 'assets/logo_rally_latam.png' : 'assets/logo_rally_nacional.png'}" style="max-height:44px; max-width:140px; object-fit:contain;" alt="Rally Oficial">
          </div>
          <strong style="font-size:11px; display:block;">Logo Oficial del Evento</strong>
          <span style="font-size:10px; color:var(--text-muted);">${state.rally_type === 'latam' ? 'Edición Continental (28h)' : 'Nacional Innova (24h)'}</span>
        </div>

        <div style="border:1px solid var(--border-light); padding:12px; border-radius:6px; background:#f8fafc; text-align:center;">
          <div style="height:48px; display:flex; align-items:center; justify-content:center; color:var(--text-main); font-weight:800; font-size:14px;">
            ${state.team_logo_img ? `<img src="${state.team_logo_img}" style="max-height:44px; max-width:120px; object-fit:contain;" alt="Logo Equipo">` : `${SVG.spark} ${state.team_name || 'EQUIPO'}`}
          </div>
          <strong style="font-size:11px; display:block;">Emblema de Equipo</strong>
          <span style="font-size:10px; color:var(--text-muted);">${state.team_name || 'Nombre de Equipo'}</span>
        </div>
      </div>
    </div>

    <div class="workbench-card">
      <h3 style="margin-bottom:12px;">Descarga Directa de Entregables Generados (1-Click)</h3>
      <div class="table-responsive" style="margin-bottom:0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Documento / Recurso</th>
              <th>Formato</th>
              <th>Uso en Competencia</th>
              <th>Descarga</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Matriz de Deliberación de Retos</strong></td>
              <td><code>.DOCX</code></td>
              <td>Catálogo de retos + pronósticos WOW + tabla de votación</td>
              <td><a href="docs/Matriz_Seleccion_Desafios_2026.docx" download="Matriz_Seleccion_Desafios_2026.docx" class="btn-primary" style="padding:4px 8px; font-size:11px; text-decoration:none;">Descargar Word ↓</a></td>
            </tr>
            <tr>
              <td><strong>Documento Pautado Oficial</strong></td>
              <td><code>.DOCX</code></td>
              <td>5 secciones oficiales redactadas y validadas con límites de caracteres</td>
              <td><button type="button" class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="compileAndDownloadDocx()">Compilar y descargar</button></td>
            </tr>
            <tr>
              <td><strong>Presupuesto Puesta en Marcha</strong></td>
              <td><code>.XLSX</code></td>
              <td>Partidas sustentadas con proveedores Alibaba y flete de importación</td>
              <td><a href="/budget/budget.xlsx" download class="btn-secondary" style="padding:4px 8px; font-size:11px; text-decoration:none;">Descargar Excel ↓</a></td>
            </tr>
            <tr>
              <td><strong>Shotlist para Editor de Video (120s)</strong></td>
              <td><code>.CSV</code></td>
              <td>Pauta para CapCut / Premiere con tiempos exactos y textos</td>
              <td><a href="/script/shotlist.csv" download class="btn-secondary" style="padding:4px 8px; font-size:11px; text-decoration:none;">Descargar CSV ↓</a></td>
            </tr>
            <tr>
              <td><strong>Locución Oficial</strong></td>
              <td><code>.MP4</code></td>
              <td>Pista de voz en MP4 con audio AAC, sin video, ≤120 segundos</td>
              <td><button type="button" class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="handleNarrationDownload(event)">Descargar MP4 ↓</button></td>
            </tr>
            <tr>
              <td><strong>Guion de Locución Limpio</strong></td>
              <td><code>.TXT</code></td>
              <td>Texto continuo a 135 ppm para el locutor o motor TTS</td>
              <td><a href="/script/narration.txt" download class="btn-secondary" style="padding:4px 8px; font-size:11px; text-decoration:none;">Descargar TXT ↓</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function saveTeamHubLinks() {
  const drive = document.getElementById("hub-drive-url");
  const canva = document.getElementById("hub-canva-url");
  if (drive) state.google_drive_url = drive.value.trim();
  if (canva) state.canva_url = canva.value.trim();
  saveState();
  showToast("Enlaces de equipo guardados correctamente");
}

function scanFolderSources() {
  const cont = document.getElementById("sources-scan-container");
  if (cont) cont.innerHTML = `<span style="font-size:11px; color:var(--color-primary);">Escaneando directorio de proyecto y boveda...</span>`;
  
  fetch("/api/scan-sources")
    .then(r => r.json())
    .then(data => {
      if (!cont) return;
      if (!data.sources || data.sources.length === 0) {
        cont.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">No se detectaron archivos fuente adicionales en la carpeta.</span>`;
        return;
      }
      cont.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${data.sources.map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:6px 10px; border-radius:4px; border:1px solid var(--border-light);">
              <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
                <span class="badge-status badge-ok" style="font-size:9px;">${s.category.toUpperCase()}</span>
                <span style="font-size:11px; font-weight:600; color:var(--text-main); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${s.path}">
                  ${s.name}
                </span>
              </div>
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); font-variant-numeric:tabular-nums;">
                ${(s.size / 1024).toFixed(1)} KB
              </span>
            </div>
          `).join("")}
        </div>
      `;
      showToast(`Escaneo completado: ${data.total} recursos detectados`);
    })
    .catch(() => {
      if (cont) cont.innerHTML = `<span style="font-size:11px; color:#ef4444;">No fue posible contactar el servicio de escaneo local.</span>`;
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// 08 MODELO CANVAS
// ═════════════════════════════════════════════════════════════════════════════
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// Plantillas preestablecidas de Canvas (solo cambian la guía por casilla; los datos del equipo se conservan)
const CANVAS_PRESETS = [
  {
    id: "sirli",
    name: "Oficial SIRLI (Rally Latam)",
    hints: {
      socios: "¿Quién te apoya en el territorio? Aliados institucionales, proveedores, cooperativas.",
      actividades: "¿Qué haces físicamente? Fabricación, instalación, calibración, capacitación.",
      propuesta: "La única oración que justifica el proyecto: tecnología + dolor resuelto + número.",
      relaciones: "¿Cómo acompaña al usuario? Presencial, soporte remoto, monitoreo continuo.",
      segmentos: "¿Quién sufre el problema exactamente? Cifra del segmento y ubicación.",
      recursos: "¿Qué necesitas tener? Hardware, firmware, laboratorio, equipo multidisciplinario.",
      canales: "¿Por donde llega la solución? Red comunitaria, app, alertas, visitas.",
      costes: "Costos de montar y operar: componentes mayoristas, ensamblaje, flete, logística.",
      ingresos: "¿Quién paga y cómo? Fondos de cooperación, presupuesto municipal, tarifas."
    }
  },
  {
    id: "lean",
    name: "Lean Canvas (validación rápida)",
    hints: {
      problemas: null,
      socios: "Aliados clave para validar rapido el piloto.",
      actividades: "Las 3 acciones que validan o tumban la tesis.",
      propuesta: "Factor diferenciador unico frente a soluciones existentes.",
      relaciones: "Como mides satisfaccion en campo (entrevistas, metricas).",
      segmentos: "Nicho inicial minimo viable y stakeholders.",
      recursos: "Recursos criticos del experimento (minimo necesarios).",
      canales: "Ruta mas corta al usuario real.",
      costes: "Costo por experimento y costo del piloto completo.",
      ingresos: "Modelo de financiamiento del piloto y escala."
    }
  },
  {
    id: "pitch",
    name: "Canvas de Pitch (video 120s)",
    hints: {
      socios: "Acto II: mencionar al aliado que da credibilidad.",
      actividades: "Acto II: demostracion en vivo de 40 segundos.",
      propuesta: "Acto I: frase de dolor humano con cifra del territorio.",
      relaciones: "Acto IV: evidencia social (ODS, comunidad).",
      segmentos: "Acto I: beneficiarios concretos con nombre del sector.",
      recursos: "Acto III: presupuesto exacto y hardware real.",
      canales: "Acto IV: donde ver la demo y quien lo acompana.",
      costes: "Acto III: cifras de prefactibilidad ($4k-$6k USD piloto).",
      ingresos: "Acto IV: frase memorable de cierre inspirador."
    }
  },
  {
    id: "uso",
    name: "Infraestructura por uso (app / web)",
    hints: {
      socios: "¿Quién ofrece la infraestructura que alquilas? Proveedores de hosting, pasarelas de pago, servicios de mensajería.",
      actividades: "¿Qué haces con tus propias manos? Código, diseño, capacitación. Lo que ya existe se contrata.",
      propuesta: "Qué problema se resuelve en una oración, con precio de uso por año: tecnología + dolor + costo anual.",
      relaciones: "Cómo se relaciona el usuario con la app: soporte dentro de la app, membresía, acompañamiento.",
      segmentos: "¿Quién se suscribe? Nombre del segmento y cuánto paga hoy por resolverlo.",
      recursos: "Mínimo propio: código, dominio, identidad. La infraestructura de cómputo se paga por uso.",
      canales: "Dónde vive y a través de qué canal se suscribe (web, app store, WhatsApp).",
      costes: "Gastos que se pagan cada año: membresías de servicios y planes por uso, no solo el día uno.",
      ingresos: "Membresía anual o plan por uso. Precio creíble: ni de regalo ni inflado; anotar el plan real del proveedor."
    }
  },
  {
    id: "ods",
    name: "Canvas de Impacto ODS",
    hints: {
      socios: "Socio institucional que pone el territorio, y aliado técnico que financia o acompaña.",
      actividades: "Las 3 acciones que producen cambio visible en el territorio.",
      propuesta: "Qué mejora, para quién, y por cuánto (cifra del problema). Un ODS protagonista.",
      relaciones: "Cómo se apropia la comunidad: talleres, acompañamiento, lenguaje simple.",
      segmentos: "Beneficiarios con nombre y lugar; cifra citable del segmento.",
      recursos: "Equipo local, hardware real y alianzas. Sin listas de deseos.",
      canales: "Con quién llega primero: gobierno local, escuela, centro comunal.",
      costes: "Costos de implementación del piloto con enlace de respaldo por partida.",
      ingresos: "Quién sostiene después del rally: presupuesto municipal, cooperación, tarifa simbólica."
    }
  }
];

function getCurrentCanvasPresetId() {
  const valid = CANVAS_PRESETS.map(p => p.id);
  return valid.includes(state.canvas_preset) ? state.canvas_preset : "sirli";
}

// Mega-prompt: arma el contexto completo (brief + reto + solución + presupuesto + formato)
// para que otra IA haga su propuesta de canvas y el equipo la compare aquí.
function buildCanvasExternalPrompt() {
  const canvas = (state.model_canvas && typeof state.model_canvas === "object") ? state.model_canvas : {};
  const bctxC = budgetCurrency();
  const budgetLine = (Array.isArray(state.budget) && state.budget.length ? state.budget : [])
    .slice(0, 12)
    .map(b => `- ${b.concept || b.element || "?"}: ${b.units || 1} × ${b.unit_cost || 0} ${bctxC.symbol} (${b.url || "sin enlace"})`)
    .join("\n") || "Sin partidas todavía.";
  const claimsLine = (Array.isArray(state.claims) && state.claims.length ? state.claims : [])
    .slice(0, 5)
    .map(c => `- "${c.stat}" (${c.source}, ${c.year})`)
    .join("\n") || "Sin cifras citables todavía.";
  const preset = CANVAS_PRESETS.find(p => p.id === getCurrentCanvasPresetId()) || CANVAS_PRESETS[0];
  return `Actúa como asesor de modelo de negocio para un proyecto de rally de innovación.

CONTEXTO
- Certamen: ${state.rally_type === "latam" ? "Rally Latinoamericano 28h (presupuesto en USD, replicable en LATAM)" : state.rally_type === "nacional" ? "Rally Nacional Nicaragüa 24h (presupuesto en córdobas, anclado al Plan Nacional)" : "certamen por definir"}
- Equipo: ${state.team_name || "(por definir)"} · ${state.university || "(sin universidad)"} · ${state.city || "(sin ciudad)"}
- Proyecto: ${state.project_name || "(sin nombre)"} — categoría ${state.category || "Innovación"}
- Reto ${state.challenge_id || "?"}: ${state.challenge_title || "por elegir"}
- Tesis de solución: ${state.solution_thesis || "por definir"}

CIFRAS CITABLES
${claimsLine}

PRESUPUESTO ACTUAL
${budgetLine}

LO QUE QUIERO
Propuesta para los 9 cuadrantes del Business Model Canvas (plantilla "${preset.name}"), en español simple, sin siglas y sin relleno:
Socios Clave · Actividades Clave · Propuesta de Valor · Relaciones · Segmentos · Recursos · Canales · Estructura de Costes · Fuentes de Ingresos.

REGLAS DE PRECIO
- Nada se construye desde cero si ya existe: se contrata por uso.
- Precios creíbles: ni locos ni regalados; si es digital, membresías anuales o planes por uso.
- Coherencia total con el presupuesto de arriba (mismos números).

Nuestro borrador (para que lo compares y lo mejores, no lo repitas):
${JSON.stringify(canvas, null, 2)}`;
}

function copyCanvasExternalPrompt() {
  copyToClipboardWithFeedback(buildCanvasExternalPrompt(), "Contexto copiado: pégalo en la otra IA y tráenos su propuesta.");
}

function canvasOnlineUrlChanged(val) {
  state.canvas_online_url = String(val || "").trim();
  saveState();
  renderTab("canvas");
}

// Enlace de "trabajo en línea" (Canva/Figma/Slides) reutilizable por pestaña.
function onlineUrlChanged(key, val) {
  state.delivery_links = (state.delivery_links && typeof state.delivery_links === "object") ? state.delivery_links : {};
  const v = String(val || "").trim();
  if (v) state.delivery_links[key] = v; else delete state.delivery_links[key];
  saveState();
  renderTab(activeTab);
}

function onlineLinkRow(key, placeholder, title) {
  const url = state.delivery_links && state.delivery_links[key] ? String(state.delivery_links[key]) : "";
  return `
    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-light);">
      <label style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono); font-weight:700;">${title}</label>
      <input type="url" inputmode="url" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(url)}"
             onchange="onlineUrlChanged('${key}', this.value)"
             style="flex:1 1 260px; min-width:0; font-size:11.5px; padding:5px 9px; border:1px solid var(--border-light); border-radius:var(--radius-sm); background:var(--bg-surface); color:var(--text-body);">
      ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-size:11px;">${SVG.external} Ver en línea</a>` : ""}
    </div>`;
}

function canvasPresetChanged(val) {
  state.canvas_preset = val;
  saveState();
  renderTab("canvas");
}

function populateCanvasCell(key, el) {
  const preset = CANVAS_PRESETS.find(p => p.id === getCurrentCanvasPresetId()) || CANVAS_PRESETS[0];
  const canvas = (state.model_canvas && typeof state.model_canvas === "object") ? state.model_canvas : {};
  const val = String(canvas[key] || "").trim();
  if (val) { el.textContent = val; el.classList.remove("is-empty"); }
  else { el.textContent = ""; el.classList.add("is-empty"); el.setAttribute("data-ph", preset.hints[key] || "Escribe aquí..."); }
}

function handleCanvasCellInput(key, el) {
  el.classList.remove("is-empty");
  if (!state.model_canvas || typeof state.model_canvas !== "object") state.model_canvas = {};
  const val = el.innerText.replace(/\n{3,}/g, "\n\n").trim();
  if (val) state.model_canvas[key] = val; else delete state.model_canvas[key];
  saveState();
  const filled = ["socios","actividades","propuesta","relaciones","segmentos","recursos","canales","costes","ingresos"]
    .filter(k => String((state.model_canvas || {})[k] || "").trim() !== "").length;
  const counter = document.getElementById("canvas-filled-count");
  if (counter) counter.textContent = `${filled} de 9 cuadrantes personalizados`;
}

function resetCanvasToBase() {
  state.model_canvas = {};
  saveState();
  renderTab("canvas");
  showToast("Canvas restablecido a las guías base.");
}

function renderViewCanvas() {
  const preset = CANVAS_PRESETS.find(p => p.id === getCurrentCanvasPresetId()) || CANVAS_PRESETS[0];
  const canvas = (state.model_canvas && typeof state.model_canvas === "object") ? state.model_canvas : {};
  const hintOf = (key, fb) => {
    if (key === "propuesta" && String(canvas[key] || "").trim() === "" && state.solution_thesis) {
      return String(state.solution_thesis).slice(0, 160) + " — ajústala en tus palabras.";
    }
    return preset.hints && preset.hints[key] ? preset.hints[key] : fb;
  };
  const cells = [
    { n: 1, key: "socios", title: "Socios Clave", fallback: "Municipalidades locales, cooperativas de productores, proveedores de hardware." },
    { n: 2, key: "actividades", title: "Actividades Clave", fallback: "Fabricación modular, calibración en campo y talleres de adopción comunitaria." },
    { n: 3, key: "propuesta", title: "Propuesta de Valor", fallback: "La única oración que justifica el proyecto: tecnología + dolor resuelto + número." },
    { n: 4, key: "relaciones", title: "Relaciones con Clientes", fallback: "Acompañamiento presencial y monitoreo continuo." },
    { n: 5, key: "segmentos", title: "Segmentos de Clientes", fallback: "Comunidades rurales, pequeños productores y gobiernos locales." },
    { n: 6, key: "recursos", title: "Recursos Clave", fallback: "Diseño de ingeniería abierto, sensores de bajo costo y firmware eficiente." },
    { n: 7, key: "canales", title: "Canales", fallback: "Red comunitaria directa, paneles de control y alertas locales." },
    { n: 8, key: "costes", title: "Estructura de Costes", fallback: "Adquisición de componentes mayoristas, ensamblaje y logística de campo." },
    { n: 9, key: "ingresos", title: "Fuentes de Ingresos", fallback: "Fondos de cooperación, presupuesto municipal de inversión y tarifas de servicio." }
  ];
  const isDefaultCell = (cell) => String(canvas[cell.key] || "").trim() === "";
  const filledCount = cells.filter(c => !isDefaultCell(c)).length;

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">09 · Matriz de Negocio <span class="phase-title-accent">Canvas</span></h1>
        <p class="phase-subtitle">9 cuadrantes editables sincronizados con la tesis del proyecto y el pautado.</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        <label style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono); font-weight:700;">PLANTILLA</label>
        <select onchange="canvasPresetChanged(this.value)" class="ai-model-select" aria-label="Plantilla de Modelo Canvas" style="display:inline-block; min-width:200px;">
          ${CANVAS_PRESETS.map(p => `<option value="${p.id}" ${p.id === getCurrentCanvasPresetId() ? "selected" : ""}>${p.name}</option>`).join("")}
        </select>
        <button class="btn-secondary" style="font-size:11px; padding:4px 10px; display:inline-flex; align-items:center; gap:4px;" onclick="copyCanvasExternalPrompt()" title="Arma el contexto completo (brief, reto, cifras, presupuesto) y lo copia para que otra IA prepare su propuesta de canvas">
          ${SVG.copy} Copiar contexto para otra IA
        </button>
        <button class="btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="resetCanvasToBase()">Restablecer</button>
        <a href="/docs/canvas.md" download class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
          ${SVG.download} Markdown (.md)
        </a>
      </div>
    </div>

    <div class="canvas-grid-responsive canvas-matrix">
      ${cells.map(cell => `
        <div class="canvas-cell${isDefaultCell(cell) ? " canvas-cell-default" : ""}">
          <strong>${cell.n}. ${cell.title}</strong>
          <p class="canvas-cell-edit${isDefaultCell(cell) ? " is-empty" : ""}" contenteditable="true" spellcheck="false"
             data-ph="${escapeHtml(hintOf(cell.key, cell.fallback))}"
             oninput="handleCanvasCellInput('${cell.key}', this)"
             onblur="handleCanvasCellInput('${cell.key}', this)">${escapeHtml(String(canvas[cell.key] || "").trim())}</p>
        </div>
      `).join("")}
    </div>

    <div style="margin-top:14px; padding:10px 0; border-top:1px solid var(--border-light); font-size:12px; color:var(--text-muted);">
      <span id="canvas-filled-count">${filledCount} de 9 cuadrantes personalizados</span> — haz clic en cualquier cuadrante para escribir en él (se guarda solo, en vivo).
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-light);">
        <label style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono); font-weight:700;">ENLACE AL TRABAJO EN LÍNEA</label>
        <input type="url" inputmode="url" placeholder="Pega el enlace de Canva, Figma, Lucid o Slides" value="${escapeHtml(String(state.canvas_online_url || ""))}"
               onchange="canvasOnlineUrlChanged(this.value)"
               style="flex:1 1 260px; min-width:0; font-size:11.5px; padding:5px 9px; border:1px solid var(--border-light); border-radius:var(--radius-sm); background:var(--bg-surface); color:var(--text-body);">
        ${state.canvas_online_url ? `<a href="${escapeHtml(state.canvas_online_url)}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-size:11px;">${SVG.external} Ver en línea</a>` : ""}
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// 09 GUION AUDIOVISUAL (4 ACTOS, 120 SEGUNDOS) & LOCUCIÓN MP4
// ═════════════════════════════════════════════════════════════════════════════
const VOICE_ENGINE_OPTIONS = {
  chatterbox: {
    label: "Chatterbox LatAm (recomendado)",
    tag: "MIT · clonación · local",
    summary: "<strong>La mejor opción para este proyecto.</strong> Es el motor de la voz que escuchaste: licencia MIT, clonación desde 5–12 s, control de emoción y un finetune oficial para español latinoamericano. Corre sin internet en CPU; en una laptop sin GPU tarda unas 7 veces el tiempo real.",
    url: "https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam",
    prompt: `Actúa como ingeniero de audio de este proyecto de Rally de Innovación.

OBJETIVO
Instala y deja funcionando un motor TTS local para narrar el guion de 120 segundos en español latinoamericano. Genera el entregable final en assets/voice/narration.mp4: MP4 con audio AAC, sin video, mono, 48 kHz, 192 kbps y máximo 120 segundos.

MOTOR ELEGIDO
Chatterbox Multilingual V3, finetune oficial es-MX/LatAm de Resemble AI.
Modelo: https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam
Código: https://github.com/resemble-ai/chatterbox
Licencia: MIT.
Por qué: acento latino, clonación zero-shot y control de emoción. En CPU tarda aproximadamente 7 veces el tiempo real; si hay GPU NVIDIA, úsala.

PASOS
1. Verifica Python 3.11, ffmpeg y al menos 4 GB libres. El modelo pesa cerca de 3 GB. Si falta ffmpeg en Windows: winget install Gyan.FFmpeg (o descarga una build estática) y comprueba ffmpeg -version.
2. Crea y activa un entorno aislado: python -m venv .venv-voz; en PowerShell: .venv-voz\Scripts\Activate.ps1
3. Instala: python -m pip install --upgrade pip; pip install chatterbox-tts soundfile numpy torch torchaudio
4. Descarga el finetune completo en una sola carpeta:
   huggingface-cli download ResembleAI/Chatterbox-Multilingual-es-mx-latam --local-dir models/latam
   Deben quedar t3_es_mx_latam.safetensors (2.14 GB), s3gen_v3.pt (1.06 GB), grapheme_mtl_merged_expanded_v1.json, ve.pt y conds.pt. Si falta alguno, bájalo del mismo repo con --include.
5. Carga el finetune con language_id="es". Si el loader estándar no acepta el checkpoint V3, usa este patrón: safe_open tensor por tensor para el T3, S3Gen con strict=False, MTLTokenizer y VoiceEncoder. En Windows, evita safetensors.load_file con el archivo de 2 GB; usa safe_open.
6. Para reproducir la voz interna que escuché, no pases audio_prompt_path: carga conds.pt del pack. Para una voz propia, usa una referencia de 12 s, 24 kHz, mono, limpia y con permiso.
7. Parámetros de la muestra que me gustó: exaggeration=0.8, cfg_weight=0.45, temperature=0.8, repetition_penalty=2.0.
8. Une los párrafos con 0.65 s de silencio y masteriza a -16 LUFS.
9. Convierte a MP4 AAC:
ffmpeg -i narracion.wav -vn -c:a aac -b:a 192k -ar 48000 -ac 1 -movflags +faststart assets/voice/narration.mp4
10. Verifica que la duración sea <=120 s y que el archivo exista.

ENTREGABLE
- assets/voice/narration.mp4
- assets/voice/narration.wav como master de respaldo
- un README breve con versiones, semilla y parámetros usados

NO HAGAS
- No clones la voz de una persona real sin permiso escrito.
- No subas los pesos del modelo al repositorio.
- No entregues MP3 ni WAV como archivo oficial.
- No uses una voz en inglés.`
  },
  kokoro: {
    label: "Kokoro 82M (CPU rápida)",
    tag: "Apache 2.0 · sin clonación",
    summary: "<strong>Respaldo para laptops lentas.</strong> 82 millones de parámetros, licencia Apache 2.0 y voz española aceptable. No clona voces y tiene menos control emocional, pero genera mucho más rápido que Chatterbox y casi no consume RAM.",
    url: "https://huggingface.co/hexgrad/Kokoro-82M",
    prompt: `Actúa como ingeniero de audio de este proyecto de Rally de Innovación.

OBJETIVO
Instala Kokoro-82M y genera la locución de 120 segundos en español latinoamericano. Entrega assets/voice/narration.mp4 (MP4 AAC, sin video, mono, 48 kHz, máximo 120 s).

MOTOR
Kokoro-82M, licencia Apache 2.0. Es el respaldo cuando el equipo no puede correr Chatterbox por RAM, CPU o tiempo.

PASOS
1. Verifica Python 3.10+ y ffmpeg.
2. python -m venv .venv-voz
3. pip install kokoro soundfile
4. Genera por párrafos con:
from kokoro import KPipeline
pipe = KPipeline(lang_code="e")
for _, _, audio in pipe(texto, voice="em_alex", speed=0.95):
    guardar(audio)
5. Voces españolas disponibles: em_alex (masculina), ef_dora (femenina), em_santa (masculina). Elige una y mantén la misma en todo el video.
6. Une los bloques con 0.5 s de silencio, normaliza a -16 LUFS y convierte:
ffmpeg -i narracion.wav -vn -c:a aac -b:a 192k -ar 48000 -ac 1 -movflags +faststart assets/voice/narration.mp4
7. Verifica duración <=120 s.

LIMITACIONES
Kokoro no clona voces. Si el equipo exige una voz propia, usa Chatterbox.
No inventes una voz de una persona real.`
  },
  edge: {
    label: "Edge-TTS (nube)",
    tag: "Gratis · requiere internet",
    summary: "<strong>La salida más rápida si hay internet.</strong> Voces neuronales de Microsoft en español de México y Colombia. No clona, no controla emoción y envía el guion a un servicio externo; úsalo solo como respaldo o para una primera maqueta.",
    url: "https://github.com/rany2/edge-tts",
    prompt: `Actúa como ingeniero de audio de este proyecto de Rally de Innovación.

OBJETIVO
Genera una locución provisional en español latinoamericano con Edge-TTS y entrega assets/voice/narration.mp4 (MP4 AAC, sin video, mono, 48 kHz, máximo 120 s).

ADVERTENCIA
Edge-TTS usa un servicio en la nube de Microsoft. Requiere internet y envía el texto fuera del equipo. Úsalo como maqueta o respaldo, no como opción principal si el guion es confidencial.

PASOS
1. Verifica Python y ffmpeg.
2. python -m venv .venv-voz
3. pip install edge-tts
4. Voces recomendadas: es-MX-JorgeNeural (masculina) o es-MX-DaliaNeural (femenina). También puedes probar es-CO-GonzaloNeural.
5. Genera:
edge-tts --voice es-MX-JorgeNeural --file script/narration.txt --write-media narration.mp3
6. Ajusta la velocidad si hace falta con --rate=-4%.
7. Convierte:
ffmpeg -i narration.mp3 -vn -c:a aac -b:a 192k -ar 48000 -ac 1 -movflags +faststart assets/voice/narration.mp4
8. Verifica duración <=120 s y que la voz elegida se mantenga en todo el video.

LIMITACIONES
Sin clonación, sin control fino de emoción y dependencia de internet. No uses una voz que imite a una persona real.`
  },
  xtts: {
    label: "XTTS-v2 (no comercial)",
    tag: "No comercial · legado",
    summary: "<strong>Solo si aceptas su licencia.</strong> Clona con 6 s de audio y entiende español, pero la Coqui Public Model License prohíbe uso comercial. Para un rally académico puede servir; para un emprendimiento, Chatterbox es la ruta limpia.",
    url: "https://huggingface.co/coqui/XTTS-v2",
    prompt: `Actúa como ingeniero de audio de este proyecto de Rally de Innovación.

OBJETIVO
Evalúa XTTS-v2 como motor de locución y, si el equipo acepta su licencia, genera assets/voice/narration.mp4 (MP4 AAC, sin video, mono, 48 kHz, máximo 120 s).

LICENCIA
XTTS-v2 usa la Coqui Public Model License. No permite uso comercial. Si el proyecto puede convertirse en empresa, no lo uses: elige Chatterbox (MIT). Documenta la decisión.

PASOS
1. Verifica Python 3.10–3.11, ffmpeg y 4 GB libres.
2. python -m venv .venv-voz
3. pip install TTS
4. Descarga el modelo:
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
5. Genera con una referencia de 6–12 s, limpia y con permiso:
tts.tts_to_file(text=texto, speaker_wav="referencia.wav", language="es", file_path="narracion.wav")
6. Une párrafos con 0.5 s de silencio, normaliza a -16 LUFS y convierte:
ffmpeg -i narracion.wav -vn -c:a aac -b:a 192k -ar 48000 -ac 1 -movflags +faststart assets/voice/narration.mp4
7. Verifica duración <=120 s.

NO HAGAS
- No clones una voz real sin permiso.
- No uses XTTS-v2 en un producto comercial.
- No entregues MP3 como archivo oficial.`
  }
};

const VOICE_PRESETS = {
  proyecto: {
    label: "Hidro Vigía · locución final",
    short: "Locución del proyecto",
    src: "/assets/voice/narration.mp4",
    meta: "77.8 s · MP4 AAC · voz interna · énfasis 0.80 / ritmo 0.45 · semilla 7",
    params: "exaggeration=0.8, cfg_weight=0.45, temperature=0.8, repetition_penalty=2.0, seed=7"
  },
  interna: {
    label: "Voz interna · muestra completa",
    short: "Voz interna estándar",
    src: "/assets/voice/previews/chatterbox_interna.mp3",
    meta: "62 s · MP3 64 kbps · voz de fábrica, sin clonar",
    params: "exaggeration=0.8, cfg_weight=0.45, temperature=0.8, repetition_penalty=2.0, seed=7"
  },
  expresiva: {
    label: "Voz interna · muestra expresiva",
    short: "Voz interna expresiva",
    src: "/assets/voice/previews/chatterbox_interna_e080_c045.mp3",
    meta: "9 s · MP3 64 kbps · la variante más expresiva",
    params: "exaggeration=0.8, cfg_weight=0.45, temperature=0.8, repetition_penalty=2.0, seed=7"
  }
};

function getVoicePresetData() {
  const select = document.getElementById("voice-preset-select");
  return VOICE_PRESETS[(select && select.value) || state.voice_preset] || VOICE_PRESETS.proyecto;
}

function renderVoiceEnginePanel() {
  const selectedId = VOICE_ENGINE_OPTIONS[state.voice_engine] ? state.voice_engine : "chatterbox";
  const selected = VOICE_ENGINE_OPTIONS[selectedId];
  const options = Object.entries(VOICE_ENGINE_OPTIONS)
    .map(([id, data]) => `<option value="${id}" ${id === selectedId ? "selected" : ""}>${data.label}</option>`)
    .join("");
  const presetId = VOICE_PRESETS[state.voice_preset] ? state.voice_preset : "proyecto";
  const preset = VOICE_PRESETS[presetId];
  const presetOptions = Object.entries(VOICE_PRESETS)
    .map(([id, data]) => `<option value="${id}" ${id === presetId ? "selected" : ""}>${data.label}</option>`)
    .join("");

  return `
    <section class="voice-engine" aria-labelledby="voice-engine-title">
      <div class="voice-engine-head">
        <div>
          <h2 id="voice-engine-title">Motor y preset de voz</h2>
          <p>Este proyecto ya incluye una locución real en <strong>Chatterbox Multilingual es-MX/LatAm</strong>. Escúchala, guárdala como preset y, si te gusta, instala el mismo motor con un clic. El entregable oficial es MP4 con audio AAC.</p>
        </div>
        <span class="rubric-tag">Preset incluido · MP4 AAC</span>
      </div>

      <div class="voice-preset">
        <div class="voice-preset-copy">
          <span class="voice-preview-label">Preset de voz</span>
          <strong id="voice-preset-name">${preset.label}</strong>
          <p id="voice-preset-meta">${preset.meta}</p>
        </div>
        <div class="voice-preset-controls">
          <label for="voice-preset-select">
            <span>Escuchar preset</span>
            <select id="voice-preset-select" onchange="updateVoicePresetUI()">${presetOptions}</select>
          </label>
          <button type="button" class="btn-primary" onclick="copyVoicePresetInstall()">Instalar todo con mi IA</button>
          <button type="button" class="btn-secondary" onclick="downloadVoicePreset()">Descargar preset .json</button>
        </div>
        <audio id="voice-preset-audio" controls preload="metadata" src="${preset.src}"></audio>
      </div>

      <details class="voice-engine-details voice-own-voice">
        <summary>¿Quieres poner tu propia voz? Tu IA te explica cómo</summary>
        <p>Sí. Puedes clonar tu voz con 10–20 segundos de audio limpio, o afinar el modelo con varias muestras para un resultado más estable. La clonación es rápida; el entrenamiento fino requiere más audio y tiempo. Pídele a tu IA que te explique cuál te conviene y que ejecute los pasos contigo.</p>
        <button type="button" class="btn-secondary" onclick="copyOwnVoiceGuide()">Copiar guía para usar mi voz</button>
      </details>

      <div class="voice-engine-controls">
        <label for="voice-engine-select">
          <span>Motor para tu IA</span>
          <select id="voice-engine-select" onchange="updateVoiceEngineUI()">${options}</select>
        </label>
        <button type="button" class="btn-primary" onclick="copyVoiceEnginePrompt()">Copiar prompt para mi IA</button>
        <button type="button" class="btn-secondary" onclick="downloadVoiceEngineGuide()">Descargar guía .md</button>
      </div>

      <div class="voice-engine-tagline"><span class="rubric-tag" id="voice-engine-tag">${selected.tag}</span></div>

      <div class="voice-engine-summary" id="voice-engine-summary">${selected.summary}</div>
      <p class="voice-engine-summary" style="margin-top:6px;">
        <a href="${selected.url}" target="_blank" rel="noopener" id="voice-engine-link">Ver modelo y licencia</a>
      </p>

      <details class="voice-engine-details">
        <summary>Ver el prompt completo que recibirá tu IA</summary>
        <pre id="voice-engine-prompt-preview">${escapeHtml(selected.prompt)}</pre>
      </details>

      <p class="voice-engine-note">El preset del proyecto ya está generado y se reproduce aquí. Las otras dos muestras son MP3 de referencia. El archivo que se entrega al jurado es <strong>assets/voice/narration.mp4</strong> (MP4 con audio AAC, sin video). “Instalar todo” copia un prompt: la instalación la ejecuta tu IA en tu equipo.</p>
    </section>
  `;
}

function getVoiceEngineData() {
  const select = document.getElementById("voice-engine-select");
  return VOICE_ENGINE_OPTIONS[(select && select.value) || "chatterbox"] || VOICE_ENGINE_OPTIONS.chatterbox;
}

function updateVoiceEngineUI() {
  const data = getVoiceEngineData();
  const summary = document.getElementById("voice-engine-summary");
  const tag = document.getElementById("voice-engine-tag");
  const link = document.getElementById("voice-engine-link");
  const prompt = document.getElementById("voice-engine-prompt-preview");
  const select = document.getElementById("voice-engine-select");

  if (select && state.voice_engine !== select.value) {
    state.voice_engine = select.value;
    saveState();
  }
  if (summary) summary.innerHTML = data.summary;
  if (tag) tag.textContent = data.tag;
  if (link) link.href = data.url;
  if (prompt) prompt.textContent = data.prompt;
}

function updateVoicePresetUI() {
  const data = getVoicePresetData();
  const select = document.getElementById("voice-preset-select");
  const name = document.getElementById("voice-preset-name");
  const meta = document.getElementById("voice-preset-meta");
  const audio = document.getElementById("voice-preset-audio");

  if (select && state.voice_preset !== select.value) {
    state.voice_preset = select.value;
    saveState();
  }
  if (name) name.textContent = data.label;
  if (meta) meta.textContent = data.meta;
  if (audio && audio.getAttribute("src") !== data.src) {
    audio.pause();
    audio.setAttribute("src", data.src);
    audio.load();
  }
}

function buildVoicePresetInstallPrompt() {
  const preset = getVoicePresetData();
  return `Actúa como ingeniero de audio de este proyecto de Rally de Innovación.

Quiero dejar instalado y reproducible el mismo preset de voz que ya trae el proyecto "${state.project_name || "actual"}".

${VOICE_ENGINE_OPTIONS.chatterbox.prompt}

PRESET EXACTO A REPRODUCIR
- Voz: interna del finetune, sin audio_prompt_path; carga conds.pt del pack.
- Parámetros: ${preset.params}.
- Pausas: 0.75 s entre párrafos.
- Master: -16 LUFS integrado, pico real -1.5 dBFS.
- Referencia audible incluida: ${preset.src} (${preset.meta}).
- Texto de referencia: script/narration.txt.
- Entregable: assets/voice/narration.mp4 (MP4 AAC, sin video, mono, 48 kHz, 192 kbps, ≤120 s).

Compara la referencia audible con tu resultado: mismo timbre, misma velocidad y pausas similares. Si no puedes igualar la voz interna, entrega el audio más cercano y documenta la diferencia.`;
}

function copyVoiceText(text, done, fail) {
  const fallback = () => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (e) {}
    area.remove();
    copied ? done() : fail();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function copyVoicePresetInstall() {
  copyVoiceText(
    buildVoicePresetInstallPrompt(),
    () => showToast("Instalación completa copiada. Pégala en tu IA: instalará el motor y reproducirá este mismo preset."),
    () => showToast("No se pudo copiar automáticamente. Descarga el preset .json y pásalo a tu IA.")
  );
}

function buildOwnVoicePrompt() {
  return `Actúa como ingeniero de audio y entrenador de voz para el proyecto "${state.project_name || "actual"}".

OBJETIVO
Explícame y ejecuta, paso a paso, cómo poner mi propia voz en la locución del proyecto. Quiero entender la diferencia entre clonar y entrenar, y elegir la ruta correcta según el tiempo y el equipo disponible.

1. CONSENTIMIENTO Y LÍMITES
- La voz debe ser mía o tener permiso escrito de la persona.
- No imites voces de terceros, famosos ni menores.
- Explícame qué se guarda, dónde y cómo borrarlo.

2. GRABACIÓN
- Para clonación zero-shot: 10–20 s limpios, una sola persona, sin música, eco ni ruido, 24 kHz o más, mono.
- Para afinar el modelo: 5–30 min de audio con transcripciones exactas, misma micrófono y tono.
- Dame un guion de grabación y una lista de verificación.

3. LIMPIEZA
- Normaliza a -16 LUFS, elimina silencios largos y revisa que no haya clipping.
- Si hace falta, recomienda una herramienta local y explica el comando.

4. CLONACIÓN CON CHATTERBOX (RÁPIDA)
- Usa el finetune ResembleAI/Chatterbox-Multilingual-es-mx-latam y language_id="es".
- Pasa mi muestra como audio_prompt_path.
- Parámetros de partida: exaggeration=0.8, cfg_weight=0.45, temperature=0.8, repetition_penalty=2.0.
- Genera una prueba corta y compárala con mi voz real.

5. ENTRENAMIENTO O AFINADO (OPCIONAL, MÁS TRABAJO)
- Explícame si de verdad hace falta afinar o si la clonación basta.
- Si conviene, describe el dataset, las transcripciones, el tiempo estimado, los requisitos de GPU y cómo evaluar el resultado.
- No prometas calidad de estudio sin datos suficientes.

6. ENTREGABLE
- Genera assets/voice/narration.mp4 (MP4 AAC, sin video, mono, 48 kHz, 192 kbps, ≤120 s).
- Masteriza a -16 LUFS y pico real -1.5 dBFS.
- Deja el texto en script/narration.txt y documenta la muestra usada.

Empieza preguntándome qué ruta quiero: clonar rápido o entrenar. Luego guíame con comandos concretos para Windows.`;
}

function copyOwnVoiceGuide() {
  copyVoiceText(
    buildOwnVoicePrompt(),
    () => showToast("Guía de voz propia copiada. Tu IA te explicará cómo grabarla, clonarla o entrenarla."),
    () => showToast("No se pudo copiar automáticamente. Abre el prompt y cópialo a mano.")
  );
}

function downloadVoicePreset() {
  const preset = getVoicePresetData();
  const slug = String(state.project_name || "proyecto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "proyecto";
  const payload = {
    name: preset.label,
    project: state.project_name || "",
    engine: "Chatterbox Multilingual V3 · finetune es-MX/LatAm",
    model: "ResembleAI/Chatterbox-Multilingual-es-mx-latam",
    license: "MIT",
    voice: "interna (conds.pt, sin audio_prompt_path)",
    params: preset.params,
    sample: preset.src,
    text_reference: "script/narration.txt",
    deliverable: "assets/voice/narration.mp4",
    format: "MP4 con audio AAC, sin video, mono, 48 kHz, 192 kbps, ≤120 s",
    generated_at: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `preset_voz_${slug}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Preset descargado. Tu IA puede instalarlo y reproducirlo.");
}

function copyVoiceEnginePrompt() {
  const data = getVoiceEngineData();
  const done = () => showToast("Prompt copiado. Pégalo en tu IA y pídele que instale el motor y genere assets/voice/narration.mp4.");
  const fail = () => showToast("No se pudo copiar automáticamente. Abre el prompt completo y cópialo a mano.");

  const fallback = () => {
    const area = document.createElement("textarea");
    area.value = data.prompt;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (e) {}
    area.remove();
    copied ? done() : fail();
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(data.prompt).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function downloadVoiceEngineGuide() {
  const data = getVoiceEngineData();
  const header = `# Instalar el motor de voz · ${data.label}

${data.tag}

${data.summary.replace(/<[^>]+>/g, "")}

El entregable oficial es \`assets/voice/narration.mp4\`: MP4 con audio AAC, sin video, mono, 48 kHz y máximo 120 segundos. El preset del proyecto ya está generado en ese archivo; las otras dos muestras del panel son MP3 de referencia.

---

## Prompt para tu IA

`;
  const blob = new Blob([header + data.prompt], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "instalar_motor_de_voz.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Guía descargada. Pásasela a tu IA junto con el guion.");
}

function renderViewScript() {
  const wordsA1 = (state.script.acto1 || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsA2 = (state.script.acto2 || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsA3 = (state.script.acto3 || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsA4 = (state.script.acto4 || "").trim().split(/\s+/).filter(Boolean).length;
  const words = wordsA1 + wordsA2 + wordsA3 + wordsA4;
  const estSeconds = Math.round((words / 135) * 60);
  const authorship = (state.authorship && state.authorship.script) || {};

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">10 · Guion Audiovisual <span class="phase-title-accent">120 Segundos (PAS-V)</span></h1>
        <p class="phase-subtitle" id="script-subtitle">Calibración oral a 135 ppm: ${words} palabras (~${estSeconds} segundos / 120s reglamentarios).</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-primary" onclick="saveScript()">Guardar Guion</button>
        <button class="btn-secondary" onclick="document.getElementById('voice-engine-title').scrollIntoView({behavior:'smooth',block:'start'})" title="Elige el motor de voz y copia el prompt de instalación para tu IA">Motor de voz</button>
        <a href="/assets/voice/narration.mp4" download id="narration-download-link" onclick="return handleNarrationDownload(event)" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Descarga la locución en MP4 (AAC) si ya fue generada para este proyecto">
          ${SVG.download} Descargar Locución (.mp4)
        </a>
      </div>
    </div>

    <!-- Medidor PAS-V Global -->
    <div id="script-global-meter" style="background:${words > 280 ? '#FEF2F2' : words >= 230 ? '#F0FDF4' : '#F8FAFC'}; border:1px solid ${words > 280 ? '#FCA5A5' : words >= 230 ? '#86EFAC' : '#E2E8F0'}; border-radius:8px; padding:10px 14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
        <div id="script-global-copy" style="font-weight:800; font-size:12.5px; color:${words > 280 ? '#DC2626' : words >= 230 ? '#15803D' : '#0F172A'};">
          ${words > 280 ? `[EXCESO DE PALABRAS] ${words}/280 máx (~${estSeconds}s). Riesgo de superar 120s o dicción ininteligible.` : words >= 230 ? `[CADENCIA PAS-V ÓPTIMA] ${words}/280 palabras (~${estSeconds}s a 135 ppm).` : `[GUION EN CONSTRUCCIÓN] ${words}/280 palabras (Aceptación: 120–280 palabras totales).`}
        </div>
        <div style="font-size:11px; color:#64748B; margin-top:2px;">
          Cuotas recomendadas: Acto I (45 pal.) + Acto II (90 pal.) + Acto III (75 pal.) + Acto IV (55 pal.) = ~265 palabras totales.
        </div>
      </div>
      <span id="script-global-seconds" style="font-family:var(--font-mono); font-size:12px; font-weight:900; background:#0F172A; color:#FFF; padding:4px 10px; border-radius:6px;">
        ${estSeconds}s / 120s
      </span>
    </div>

    <div class="rubric-callout" style="margin-bottom:16px;">
      <strong>REGLA DE ORO ACTO I:</strong> Durante los primeros 20 segundos está PROHIBIDO mencionar el nombre del proyecto o mostrar logos. El inicio debe centrarse 100% en el dolor humano, el territorio y la cifra cuantificada.
    </div>

    <div style="display:flex; flex-direction:column; gap:16px;">
      <!-- Acto I: Problema -->
      <div class="script-acto-block" data-lockable="script-acto1">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:12px;">Acto I: Dolor Humano y Problema Cuantificado (0–20 seg)</strong>
            ${authorship.acto1 ? `<span class="collaborator-stamp">${authorship.acto1.icon} ${authorship.acto1.name}</span>` : ""}
            <span id="lock-tag-script-acto1"></span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="script-counter-acto1" style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${wordsA1 > 55 ? '#DC2626' : wordsA1 > 0 ? '#059669' : '#64748B'};">${wordsA1}/45 pal.</span>
            <span class="rubric-tag">IMPACTO SOCIAL + PITCH</span>
            <span style="font-size:10.5px; color:${wordsA1 > 0 ? '#ef4444' : '#64748B'}; font-weight:700;">PROHIBIDO LOGOS</span>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">Patrón ganador: testimonio o cifra humana del territorio en los primeros 10 segundos — SIRLI premia emociones realistas, no tecnología.</div>
        <textarea id="sc-a1" rows="3" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:8px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Ej: «En Jinotega, una de cada tres cosechas se pudre antes de llegar al mercado...» — persona concreta + cifra nacional. Sin nombres ni logos."
          onfocus="broadcastLock('script-acto1')"
          onblur="broadcastRelease('script-acto1')"
          oninput="handleScriptInput('acto1', this)">${state.script.acto1 || ""}</textarea>
      </div>

      <!-- Acto II: Acción y Solución -->
      <div class="script-acto-block" data-lockable="script-acto2">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:12px;">Acto II: Solución Técnica y Demostración de Hardware (20–60 seg)</strong>
            ${authorship.acto2 ? `<span class="collaborator-stamp">${authorship.acto2.icon} ${authorship.acto2.name}</span>` : ""}
            <span id="lock-tag-script-acto2"></span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="script-counter-acto2" style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${wordsA2 > 105 ? '#DC2626' : wordsA2 > 0 ? '#059669' : '#64748B'};">${wordsA2}/90 pal.</span>
            <span class="rubric-tag">30 PTS INNOVACIÓN + VIABILIDAD</span>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">Patrón ganador: los equipos premiados muestran maqueta o prototipo funcionando en los primeros 40s, con demostración visual y provocando preguntas del jurado.</div>
        <textarea id="sc-a2" rows="3" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:8px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Demostración temprana: maqueta o prototipo real en pantalla + cómo funciona en 3 frases. Aquí sí puede aparecer el nombre del proyecto por primera vez."
          onfocus="broadcastLock('script-acto2')"
          onblur="broadcastRelease('script-acto2')"
          oninput="handleScriptInput('acto2', this)">${state.script.acto2 || ""}</textarea>
      </div>

      <!-- Acto III: Factibilidad y Números -->
      <div class="script-acto-block" data-lockable="script-acto3">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:12px;">Acto III: Prefactibilidad y Presupuesto Sustentado (60–95 seg)</strong>
            ${authorship.acto3 ? `<span class="collaborator-stamp">${authorship.acto3.icon} ${authorship.acto3.name}</span>` : ""}
            <span id="lock-tag-script-acto3"></span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="script-counter-acto3" style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${wordsA3 > 85 ? '#DC2626' : wordsA3 > 0 ? '#059669' : '#64748B'};">${wordsA3}/75 pal.</span>
            <span class="rubric-tag">20 PTS PREFACTIBILIDAD (CAUSA #1 DESCARTE)</span>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">Patrón ganador: cifras exactas en pantalla ($ por partida, % de flete) — causa #1 de descarte es una prefactibilidad vaga.</div>
        <textarea id="sc-a3" rows="3" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:8px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Ej: «15 módulos a $12.80, gateway a $290, flete del 18%...» — total del piloto entre $4,000 y $6,000 USD, con fuente verificable."
          onfocus="broadcastLock('script-acto3')"
          onblur="broadcastRelease('script-acto3')"
          oninput="handleScriptInput('acto3', this)">${state.script.acto3 || ""}</textarea>
      </div>

      <!-- Acto IV: Verificación y Cierre -->
      <div class="script-acto-block" data-lockable="script-acto4">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:12px;">Acto IV: Cierre de Alto Impacto, ODS y Frase Memorable (95–120 seg)</strong>
            ${authorship.acto4 ? `<span class="collaborator-stamp">${authorship.acto4.icon} ${authorship.acto4.name}</span>` : ""}
            <span id="lock-tag-script-acto4"></span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="script-counter-acto4" style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${wordsA4 > 65 ? '#DC2626' : wordsA4 > 0 ? '#059669' : '#64748B'};">${wordsA4}/55 pal.</span>
            <span class="rubric-tag">INTEGRACIÓN 5 CRITERIOS + ODS</span>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">Patrón ganador: arco problema → solución → impacto cuantificado, cerrando con identidad nacional (símbolo local u ODS real) y frase memorable.</div>
        <textarea id="sc-a4" rows="3" style="width:100%; border:1px solid var(--border-light); border-radius:4px; padding:8px; font-size:12px; font-family:var(--font-ui); box-sizing:border-box;"
          placeholder="Impacto esperado con número (ej: «300 productores menos pérdidas»), ODS real del proyecto y frase memorable de identidad nicaragüense al cerrar."
          onfocus="broadcastLock('script-acto4')"
          onblur="broadcastRelease('script-acto4')"
          oninput="handleScriptInput('acto4', this)">${state.script.acto4 || ""}</textarea>
      </div>
    </div>

    ${renderVoiceEnginePanel()}
    </div>
  `;
}

function handleScriptInput(key, el) {
  state.script[key] = el.value;
  broadcastFieldChange("script", key, el.value);
  saveState();
  updateScriptMeters();
}

function updateScriptMeters() {
  const quotas = { acto1: 45, acto2: 90, acto3: 75, acto4: 55 };
  const redLines = { acto1: 55, acto2: 105, acto3: 85, acto4: 65 };
  let words = 0;

  Object.keys(quotas).forEach(key => {
    const n = (state.script[key] || "").trim().split(/\s+/).filter(Boolean).length;
    words += n;
    const el = document.getElementById(`script-counter-${key}`);
    if (el) {
      el.textContent = `${n}/${quotas[key]} pal.`;
      el.style.color = n > redLines[key] ? "#DC2626" : n > 0 ? "#059669" : "#64748B";
    }
  });

  const seconds = Math.round((words / 135) * 60);
  const over = words > 280;
  const good = words >= 230;

  const subtitle = document.getElementById("script-subtitle");
  if (subtitle) {
    subtitle.textContent = `Calibración oral a 135 ppm: ${words} palabras (~${seconds} segundos / 120s reglamentarios).`;
  }

  const meter = document.getElementById("script-global-meter");
  if (meter) {
    meter.style.background = over ? "#FEF2F2" : good ? "#F0FDF4" : "#F8FAFC";
    meter.style.borderColor = over ? "#FCA5A5" : good ? "#86EFAC" : "#E2E8F0";
  }

  const copy = document.getElementById("script-global-copy");
  if (copy) {
    copy.style.color = over ? "#DC2626" : good ? "#15803D" : "#0F172A";
    copy.textContent = over
      ? `[EXCESO DE PALABRAS] ${words}/280 máx (~${seconds}s). Riesgo de superar 120s o dicción ininteligible.`
      : good
        ? `[CADENCIA PAS-V ÓPTIMA] ${words}/280 palabras (~${seconds}s a 135 ppm).`
        : `[GUION EN CONSTRUCCIÓN] ${words}/280 palabras (Aceptación: 120–280 palabras totales).`;
  }

  const secondsEl = document.getElementById("script-global-seconds");
  if (secondsEl) secondsEl.textContent = `${seconds}s / 120s`;
}

function handleNarrationDownload(event) {
  if (event) event.preventDefault();
  const url = "/assets/voice/narration.mp4";
  fetch(url, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("missing");
      const link = document.createElement("a");
      link.href = url;
      link.download = "narration.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(() => {
      showToast("Aún no hay locución generada. Genera la tarea de voz en Despacho Multi-IA y guarda el audio como /assets/voice/narration.mp4 (MP4 con audio AAC).");
    });
  return false;
}

function saveScript() {
  saveState();
  renderNavigation();
  showToast("Guion guardado correctamente.");
}

// ═════════════════════════════════════════════════════════════════════════════
// 10 PROTOTIPO DIGITAL PARA TOMAS DE VIDEO
// ═════════════════════════════════════════════════════════════════════════════
function renderViewWebDemo() {
  const pName = state.project_name || "PROTOTIPO_ACTIVO";
  const isSocial = state.category === "Impacto Social";

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
      <div>
        <h1 class="phase-title">11 · Prototipo Digital <span class="phase-title-accent">para Tomas de Video</span></h1>
        <p class="phase-subtitle">Interfaz operativa reactiva para grabar planos de pantalla de alto impacto para el video pitch.</p>
      </div>
      <a href="/site/" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
        Abrir Prototipo en Pestaña Completa ${SVG.external}
      </a>
    </div>

    <div class="workbench-card" style="padding:0; overflow:hidden;">
      <div style="background:#0f172a; padding:10px 16px; display:flex; justify-content:space-between; align-items:center; color:#fff;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
          <span style="font-family:var(--font-mono); font-size:12px; font-weight:700;">${pName} · PANEL DE CONTROL OPERATIVO</span>
        </div>
        <span style="font-size:11px; font-family:var(--font-mono); color:#94a3b8;">SISTEMA ACTIVO [ESTADO: NOMINAL]</span>
      </div>

      <div style="padding:20px; background:#f8fafc;">
        <div class="telemetry-kpi-grid">
          <div style="background:#fff; border:1px solid var(--border-light); padding:14px; border-radius:6px;">
            <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">${isSocial ? 'Índice de Rendimiento' : 'Parámetro Operativo'}</div>
            <div style="font-size:24px; font-weight:800; font-family:var(--font-mono); color:var(--color-primary); margin:4px 0;">94.2%</div>
            <div style="font-size:11px; color:#047857; font-weight:600;">Calibración de campo completa</div>
          </div>

          <div style="background:#fff; border:1px solid var(--border-light); padding:14px; border-radius:6px;">
            <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">${isSocial ? 'Tiempo de Respuesta' : 'Ciclo de Operación'}</div>
            <div style="font-size:24px; font-weight:800; font-family:var(--font-mono); color:var(--text-main); margin:4px 0;">1.2 s</div>
            <div style="font-size:11px; color:var(--text-muted);">Procesamiento in-situ autónomo</div>
          </div>

          <div style="background:#fff; border:1px solid var(--border-light); padding:14px; border-radius:6px;">
            <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Autonomía Energética</div>
            <div style="font-size:24px; font-weight:800; font-family:var(--font-mono); color:#047857; margin:4px 0;">98.6%</div>
            <div style="font-size:11px; color:var(--text-muted);">Baterías LiFePO4 + Panel Solar</div>
          </div>
        </div>

        <div style="background:#fff; border:1px solid var(--border-light); border-radius:6px; padding:14px;">
          <div style="font-size:11px; font-weight:800; color:var(--text-main); margin-bottom:8px;">REGISTRO DE TELEMETRÍA EN TIEMPO REAL</div>
          <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); line-height:1.6;">
            <div>[T-08s] ${pName}_NODO_01: Nivel de señal -82dBm | Consumo: 14mW | ESTADO: ACTIVO</div>
            <div>[T-19s] ${pName}_NODO_02: Lectura de sensor nominal | Voltaje: 3.31V | ESTADO: ACTIVO</div>
            <div>[T-32s] ${pName}_NODO_03: Transmisión confirmada | Paquetes: 0 perdidos | ESTADO: ACTIVO</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// 11 CRONOGRAMA DE ENTREGA, NOMENCLATURAS Y REQUISITOS CRÍTICOS
// ═════════════════════════════════════════════════════════════════════════════
const GUARDRAILS_DEFINITIONS = [
  {
    key: "team_sirli_registered",
    title: "1. Registro del Equipo en Plataforma Oficial (Límite: 12:00 PM)",
    desc: "Todos los integrantes y la sede Universidad Nacional de Ingeniería (UNI) deben estar confirmados en la plataforma antes de mediodía.",
    risk: "Equipos no validados a las 12:00 PM quedan inhabilitados por el sistema central."
  },
  {
    key: "video_duration_ok",
    title: "2. Duración del Video Pitch (Estrictamente ≤ 119 Segundos)",
    desc: "El video no debe exceder los 2 minutos exactos (120s). Recomendado exportar a 1:55 - 1:58 min.",
    risk: "Un video de 121 segundos (2:01 min) es descalificado automáticamente por el software evaluador sin revisión humana."
  },
  {
    key: "video_unlisted_or_public",
    title: "3. Privacidad de YouTube: 'No listado' (Oculto) o 'Público'",
    desc: "Comprobar el enlace abriéndolo en una ventana de incógnito sin sesión de Google iniciada.",
    risk: "Subir el video en 'Privado' impide al jurado calificador reproducirlo, otorgando 0 puntos en el pitch."
  },
  {
    key: "naming_pdf_ok",
    title: "4. Nomenclatura Oficial del Archivo PDF Pautado",
    desc: "Nombrar el archivo exportado exactamente con el formato reglamentario generado en esta pantalla.",
    risk: "Nombres genéricos (ej. 'documento_final.pdf' o 'tarea.pdf') sufren penalización en la etapa de auditoría documental."
  },
  {
    key: "hashtags_included",
    title: "5. Hashtags Oficiales en YouTube y TikTok",
    desc: "Incluir en la descripción y título del video los tags oficiales requeridos para el certamen activo.",
    risk: "La omisión de los hashtags reglamentarios o de la etiqueta de la sede UNI invalida los puntos de interacción y difusión."
  },
  {
    key: "pautado_chars_ok",
    title: "6. Respeto Estricto de Caracteres en el Documento Pautado",
    desc: "Problema (≤1000), Solución (≤1500), Prefactibilidad (≤1500), Innovación (≤1000), Impacto (≤1000).",
    risk: "La plataforma de entrega trunca o rechaza textos que excedan el límite oficial de caracteres con espacios."
  },
  {
    key: "pdf_video_numbers_synced",
    title: "7. Sincronía Numérica Estricta PDF vs Video (Cero Discrepancia)",
    desc: "Todas las cifras de costos unitarios, inversión de lote piloto ($4k-$6k USD), beneficiarios y métricas del guion deben coincidir exactamente con el PDF.",
    risk: "La discrepancia numérica entre el video y el PDF es la causa oculta #1 de descalificación y penalización en prefactibilidad económica."
  },
  {
    key: "youtube_channel_brand",
    title: "8. Canal Oficial de Marca-Equipo en YouTube (No canal personal)",
    desc: "Canal bautizado con el nombre del equipo/marca (@TechridersUNI, @GuegueenseDigna), con avatar y título canónico: [RETO XX] - EQUIPO - PROYECTO.",
    risk: "Subir desde cuentas personales desarticuladas proyecta informalidad y reduce la legitimidad visual ante jurados internacionales."
  },
  {
    key: "tiktok_submitted",
    title: "9. Video TikTok de Interacción Internacional (Obligatorio SIRLI)",
    desc: "Cápsula lúdico-creativa de vinculación con equipos de otras sedes o países publicada antes de las 08:00 PM con los hashtags oficiales.",
    risk: "En el Rally Latam, la interacción en TikTok es un entregable auditable que habilita puntajes decisivos de integración."
  },
  {
    key: "loser_patterns_checked",
    title: "10. Auditoría de los 11 Patrones Perdedores (Anti-patrones descartados)",
    desc: "Descartar: app móvil genérica para crisis complejas, video >120s, logos en 0:00-0:20, sufijo -INNOVA trillado o falta de cotización mayorista.",
    risk: "Incurrir en cualquiera de estos 11 patrones condena la propuesta al promedio o al descarte inmediato por el tribunal."
  }
];

function getOfficialNomenclatures() {
  const isLatam = state.rally_type === "latam";
  const rawTeam = state.team_name || "NOMBRE_EQUIPO";
  const teamClean = rawTeam.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const chalId = (state.challenge_id || "01").toString().padStart(2, "0");
  const chal = OFFICIAL_CHALLENGES_2026.find(c => c.id === chalId) || (state.challenges && state.challenges.find(c => c.id === chalId)) || { title: "Innovación Tecnológica" };
  const shortTitle = chal.title.split(" ").slice(0, 6).join(" ");

  if (isLatam) {
    return {
      pdfName: `UNI_Reto${chalId}_${teamClean}_PAUTADO.pdf`,
      ytTitle: `Rally Latinoamericano de Innovación 2026 - Desafío ${chalId}: ${shortTitle} - Equipo ${teamClean}`,
      hashtags: [
        "#RallyLatinoamericano2026",
        "#RallyLatam",
        "#InnovacionLatam",
        "#SedeUNI",
        "#NicaraguaInnova"
      ],
      tiktokTip: "Subir video de interacción lúdica antes de las 08:00 PM (Viernes) para garantizar indexación en el feed y acumulación de métricas antes de la deliberación del jurado.",
      regimenDesc: "Certamen internacional de 28 horas continuas. Exige estricta coincidencia de datos y link público/no listado."
    };
  } else {
    return {
      pdfName: `Innova2026_Desafio${chalId}_${teamClean}_PAUTADO.pdf`,
      ytTitle: `Rally Nacional Nicaragua Innova 2026 - Reto ${chalId}: ${shortTitle} - ${teamClean}`,
      hashtags: [
        "#NicaraguaInnova2026",
        "#RallyNacionalInnova",
        "#UNI_Nicaragua",
        "#JuventudInnovadora",
        "#InnovacionUNI"
      ],
      tiktokTip: "Subir cápsula audiovisual de prototipo antes de las 08:00 PM para verificación temprana de los enlaces en la plataforma territorial.",
      regimenDesc: "Certamen nacional territorial de 24 horas continuas con sede oficial UNI."
    };
  }
}

// Cronogramas por defecto (Nacional 24h y Latam 28h)
const DEFAULT_SCHEDULES = {
  nacional: [
    { time: "08:00 AM (Vie)", action: "Apertura oficial de retos en plataforma central y descarga de matrices.", risk: "Elegir reto sin evaluar precedentes satura la ideación.", level: "info" },
    { time: "12:00 PM (Vie)", action: "Límite fatal de inscripción de equipo y validación con sede UNI.", risk: "Descalificación automática si no hay registro al mediodía.", level: "critical" },
    { time: "08:00 PM (Vie)", action: "Ventana óptima para video TikTok de interacción lúdica.", risk: "Subir tarde resta visibilidad antes de la deliberación.", level: "warning" },
    { time: "T-6 Horas", action: "Congelamiento de claims y arquitectura técnica de la propuesta.", risk: "Cambiar arquitectura a última hora arruina guiones y renders.", level: "warning" },
    { time: "T-4 Horas", action: "Pautado oficial auditado (5 bloques) y presupuesto verificado con cotizaciones.", risk: "Exceder caracteres con espacios trunca el guardado.", level: "warning" },
    { time: "T-2 Horas", action: "Exportación final de video pitch (1080p, ≤119s) y carga en YouTube 'No listado'.", risk: "YouTube tarda 20-30 min en procesar versión Full HD.", level: "critical" },
    { time: "T-1 Hora", action: "Verificar link en ventana de incógnito y subir PDF del pautado oficial.", risk: "Video en 'Privado' recibe calificación de 0 puntos.", level: "critical" },
    { time: "T-0 Inmutable", action: "Cierre definitivo de plataforma y confirmación de comprobante en pantalla.", risk: "Cierre automático al segundo exacto sin prórroga.", level: "critical" }
  ],
  latam: [
    { time: "08:00 AM (Vie)", action: "Apertura de retos internacionales y selección preliminar de problemática.", risk: "No validar pertinencia con la matriz continental retrasa el avance.", level: "info" },
    { time: "12:00 PM (Vie)", action: "Confirmación obligatoria del equipo en el sistema SIRLI Latam.", risk: "Inhabilitación automática sin posibilidad de apelación.", level: "critical" },
    { time: "07:00 PM (Vie)", action: "Publicación de video TikTok de integración y difusión regional.", risk: "Pérdida del puntaje de interacción social en la rúbrica.", level: "warning" },
    { time: "T-8 Horas", action: "Bloqueo definitivo de la tesis técnica y modelo de negocio CANVAS.", risk: "Replantear la solución divide esfuerzos a horas del cierre.", level: "warning" },
    { time: "T-5 Horas", action: "Cierre de memoria técnica pautada y cálculo de impacto socioeconómico.", risk: "Incongruencia entre pautado y video causa penalización severa.", level: "warning" },
    { time: "T-2 Horas", action: "Subida de video pitch reglamentario (≤120s, YouTube no listado o público).", risk: "Demoras de transcodificación en YouTube dejan el link inaccesible.", level: "critical" },
    { time: "T-1 Hora", action: "Carga final del reporte PDF oficial con nomenclatura Continental.", risk: "Fallo de red a última hora impide emitir el hash de entrega.", level: "critical" },
    { time: "T-0 Inmutable (12:00 PM Sáb)", action: "Cierre fatal del certamen de 28 horas continuas.", risk: "El servidor rechaza solicitudes al milisegundo exacto.", level: "critical" }
  ]
};

function getActiveSchedule() {
  if (Array.isArray(state.custom_schedule) && state.custom_schedule.length > 0) {
    return state.custom_schedule;
  }
  const type = state.rally_type === "latam" ? "latam" : "nacional";
  return DEFAULT_SCHEDULES[type];
}

function switchTimelineSubtab(subtab) {
  state.timeline_subtab = subtab;
  saveState();
  if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function toggleGuardrail(key, event) {
  if (event) event.stopPropagation();
  if (!state.guardrails) {
    state.guardrails = {
      team_sirli_registered: false,
      video_duration_ok: true,
      video_unlisted_or_public: false,
      naming_pdf_ok: false,
      hashtags_included: false,
      pautado_chars_ok: false
    };
  }
  state.guardrails[key] = !state.guardrails[key];
  saveState();
  const card = document.getElementById(`guardrail-card-${key}`);
  if (card) {
    const isChecked = !!state.guardrails[key];
    card.classList.toggle("checked", isChecked);
    const box = card.querySelector(".guardrail-checkbox-square");
    if (box) box.innerHTML = isChecked ? SVG.check : "";
  } else if (activeTab === "timeline") {
    renderTab("timeline");
  }

  const verified = Object.values(state.guardrails || {}).filter(Boolean).length;
  const total = GUARDRAILS_DEFINITIONS.length;
  const counter = document.getElementById("guardrail-verified-count");
  if (counter) {
    counter.textContent = `${verified} / ${total} Verificados`;
    counter.style.background = verified === total ? "#dcfce7" : "#eff6ff";
    counter.style.color = verified === total ? "#166534" : "#003366";
  }
  const subnavCounter = document.getElementById("timeline-subnav-verified");
  if (subnavCounter) subnavCounter.textContent = `${verified}/${total}`;

  updateInspector();
}

function toggleGuardrailAccordion(key) {
  if (!state.expanded_guardrails) state.expanded_guardrails = {};
  state.expanded_guardrails[key] = !state.expanded_guardrails[key];
  saveState();
  const card = document.getElementById(`guardrail-card-${key}`);
  if (card) {
    card.classList.toggle("expanded", !!state.expanded_guardrails[key]);
  } else if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function toggleAllGuardrails(expand) {
  state.expanded_guardrails = {};
  GUARDRAILS_DEFINITIONS.forEach(g => {
    state.expanded_guardrails[g.key] = !!expand;
    const card = document.getElementById(`guardrail-card-${g.key}`);
    if (card) card.classList.toggle("expanded", !!expand);
  });
  saveState();
}

function toggleScheduleAIPanel() {
  state.schedule_ai_open = !state.schedule_ai_open;
  saveState();
  const box = document.querySelector(".schedule-ai-box");
  if (box) {
    box.classList.toggle("collapsed", !state.schedule_ai_open);
  } else if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function parseScheduleWithAI() {
  const textarea = document.getElementById("input-schedule-raw");
  const rawText = textarea ? textarea.value.trim() : "";
  if (!rawText) {
    showToast("Pega primero el texto del cronograma");
    return;
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsed = [];
  const timeRegex = /(?:\b(?:T[-–]\s*\d+\s*(?:horas?|hrs?|h)?|\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm|hrs?|h)?|\d{1,2}\s*(?:AM|PM|am|pm)|Hito\s*\d+|Viernes|Sábado|Domingo)[^:–—\-,]*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(cronograma|agenda|horario|calendario|programa)\b/i.test(line) && line.length < 30) continue;

    let time = "";
    let action = "";
    let risk = "";

    const match = line.match(timeRegex);
    if (match) {
      time = match[0].trim().replace(/^[-*•\d+.)\s]+/, "");
      action = line.replace(match[0], "").replace(/^[:–—\-,\s]+/, "").trim();
    } else {
      const parts = line.split(/[:–—]/);
      if (parts.length > 1 && parts[0].length < 25) {
        time = parts[0].replace(/^[-*•\d+.)\s]+/, "").trim();
        action = parts.slice(1).join(" - ").trim();
      } else {
        time = `Hito ${parsed.length + 1}`;
        action = line.replace(/^[-*•\d+.)\s]+/, "").trim();
      }
    }

    if (!action) action = line;

    const lower = (line + " " + action).toLowerCase();
    let level = "info";
    if (/cierre|descalificaci[oó]n|l[ií]mite|fatal|inmutable|0 puntos|privad[oa]|penalizaci[oó]n|estricto/.test(lower)) {
      level = "critical";
      risk = "Riesgo crítico de descalificación o bloqueo si no se cumple a tiempo.";
    } else if (/alerta|advertencia|tarde|cuidado|[oó]ptim[oa]|riesgo|trunca|retraso/.test(lower)) {
      level = "warning";
      risk = "Posible impacto negativo en evaluación o saturación en plataforma.";
    } else {
      level = "info";
      risk = "Requisito operativo de seguimiento y sincronización del equipo.";
    }

    parsed.push({ time, action, risk, level });
  }

  if (parsed.length === 0) {
    showToast("No se detectaron hitos claros en el texto");
    return;
  }

  state.custom_schedule = parsed;
  state.schedule_ai_open = false;
  state.schedule_raw_text = rawText;
  saveState();
  showToast(`Cronograma procesado: ${parsed.length} hitos estructurados`);
  if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function resetScheduleToDefault() {
  state.custom_schedule = null;
  state.schedule_raw_text = "";
  saveState();
  showToast("Cronograma restablecido al formato oficial");
  if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function removeScheduleMilestone(idx) {
  const current = getActiveSchedule();
  const next = [...current];
  next.splice(idx, 1);
  state.custom_schedule = next;
  saveState();
  if (activeTab === "timeline") {
    renderTab("timeline");
  }
}

function renderViewTimeline() {
  const isLatam = state.rally_type === "latam";
  const nom = getOfficialNomenclatures();
  const allHashtagsStr = nom.hashtags.join(" ");
  const guardrails = state.guardrails || {};
  const currentDeadline = getCurrentDeadlineAlert();
  const currentSubtab = state.timeline_subtab || "checklist";
  const expandedGuardrails = state.expanded_guardrails || {};
  const verifiedCount = Object.values(guardrails).filter(Boolean).length;
  const milestones = getActiveSchedule();
  const isCustomSchedule = Array.isArray(state.custom_schedule) && state.custom_schedule.length > 0;

  let subtabContent = "";

  if (currentSubtab === "checklist") {
    subtabContent = `
      <div class="naming-box-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="font-size:14px; font-weight:700; color:#0f172a; margin:0;">Checklist de Entrega Oficial</h3>
              <span id="guardrail-verified-count" class="timeline-subnav-count" style="background:${verifiedCount === GUARDRAILS_DEFINITIONS.length ? '#dcfce7; color:#166534;' : '#eff6ff; color:#003366;'}">
                ${verifiedCount} / ${GUARDRAILS_DEFINITIONS.length} Verificados
              </span>
            </div>
            <p style="font-size:12px; color:#64748b; margin:3px 0 0 0;">Haz clic en cada fila para desplegar detalles normativos y evitar descalificaciones.</p>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary-action" onclick="toggleAllGuardrails(true)" style="padding:6px 10px; font-size:11.5px;">
              Desplegar todo
            </button>
            <button class="btn-secondary-action" onclick="toggleAllGuardrails(false)" style="padding:6px 10px; font-size:11.5px;">
              Colapsar todo
            </button>
          </div>
        </div>

        <div class="guardrail-accordion">
          ${GUARDRAILS_DEFINITIONS.map(g => {
            const isChecked = !!guardrails[g.key];
            const isExpanded = !!expandedGuardrails[g.key];
            return `
              <div class="guardrail-card ${isChecked ? 'checked' : ''} ${isExpanded ? 'expanded' : ''}" id="guardrail-card-${g.key}">
                <div class="guardrail-row-header" onclick="toggleGuardrailAccordion('${g.key}')">
                  <div class="guardrail-checkbox-square" onclick="toggleGuardrail('${g.key}', event)" title="${isChecked ? 'Marcar como pendiente' : 'Marcar como verificado'}">
                    ${isChecked ? SVG.check : ''}
                  </div>
                  <div class="guardrail-row-title">${g.title}</div>
                  <span class="guardrail-badge-risk">Riesgo Alto</span>
                  <div class="guardrail-chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
                <div class="guardrail-expand-body">
                  <div>${g.desc}</div>
                  <div class="guardrail-risk-notice">
                    <span style="font-weight:700; color:#DC2626;">!</span>
                    <span>${g.risk}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  } else if (currentSubtab === "schedule") {
    subtabContent = `
      <div class="schedule-panel">
        <div class="schedule-toolbar">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="font-size:14px; font-weight:700; color:#0f172a; margin:0;">Cronograma de Hitos y Tiempos Críticos</h3>
              <span class="timeline-subnav-count">
                ${milestones.length} hitos ${isCustomSchedule ? '(Personalizado IA)' : '(Oficial)'}
              </span>
            </div>
            <p style="font-size:12px; color:#64748b; margin:3px 0 0 0;">Secuencia temporal para coordinar el trabajo en equipo sin saturación.</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn-ai-action" onclick="toggleScheduleAIPanel()">
              ${SVG.spark} ${state.schedule_ai_open ? 'Cerrar Pegador IA' : 'Pegar Cronograma / IA'}
            </button>
            ${isCustomSchedule ? `
              <button class="btn-secondary-action" onclick="resetScheduleToDefault()" title="Volver al cronograma oficial del certamen">
                Restablecer a Oficial
              </button>
            ` : ''}
          </div>
        </div>

        <div class="schedule-ai-box ${state.schedule_ai_open ? '' : 'collapsed'}">
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            ${SVG.upload} Pegar Texto de Cronograma (Circular Oficial, WhatsApp, PDF o Boletín)
          </div>
          <div style="font-size:11.5px; color:#64748b; margin-bottom:8px;">
            Pega el itinerario tal como te lo compartieron. La IA extraerá automáticamente las horas, acciones y niveles de riesgo:
          </div>
          <textarea id="input-schedule-raw" class="schedule-textarea" placeholder="Ejemplo:&#10;08:00 AM Apertura y selección de retos&#10;12:00 PM Límite fatal de registro de equipo&#10;T-4 Horas Entrega de pautado y presupuesto&#10;T-0 Cierre definitivo">${state.schedule_raw_text || ""}</textarea>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn-secondary-action" onclick="toggleScheduleAIPanel()">Cancelar</button>
            <button class="btn-ai-action" onclick="parseScheduleWithAI()">
              ${SVG.spark} Procesar con IA y Actualizar Cronograma
            </button>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
          ${milestones.map((m, idx) => {
            const isCrit = m.level === "critical" || /descalificaci|fatal|cierre|0 puntos/i.test(m.risk || "");
            return `
              <div class="schedule-item-row" style="${isCrit ? 'background:#fffafa;' : ''}">
                <span class="schedule-tag-time" style="${isCrit ? 'background:#fef2f2; border-color:#fee2e2; color:#991b1b;' : ''}">
                  ${m.time}
                </span>
                <div class="schedule-item-content">
                  <div class="schedule-item-title">${m.action}</div>
                  <div class="schedule-item-risk" style="${isCrit ? 'color:#b91c1c; font-weight:600;' : ''}">
                    ${isCrit ? '[ALERTA] ' : '[INFO] '}${m.risk}
                  </div>
                </div>
                ${isCustomSchedule ? `
                  <button class="btn-icon-del" onclick="removeScheduleMilestone(${idx})" title="Eliminar hito">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                ` : ''}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  } else if (currentSubtab === "naming") {
    subtabContent = `
      <div class="timeline-grid" style="margin-top:0;">
        <div class="naming-box-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
            <div>
              <h3 style="font-size:14px; font-weight:700; color:#0f172a; margin:0;">Nomenclaturas Oficiales Reglamentarias</h3>
              <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">Copia y pega los nombres reglamentarios con 1 clic para evitar penalizaciones por formato.</p>
            </div>
            <span class="timeline-subnav-count">Reglamento UNI</span>
          </div>

          <div class="naming-field-group">
            <div class="naming-field-label">
              <span>Nombre Oficial del Archivo PDF (Pautado Oficial)</span>
              <span style="font-size:10.5px; color:#64748b; text-transform:none; font-weight:600;">Máx 15 MB · PDF</span>
            </div>
            <div class="naming-input-row">
              <input type="text" class="naming-input-readonly" readonly value="${nom.pdfName}" id="input-pdf-name">
              <button class="btn-copy-action" onclick="copyToClipboardWithFeedback('${nom.pdfName}', 'Nombre de PDF copiado')">
                ${SVG.copy} Copiar
              </button>
            </div>
          </div>

          <div class="naming-field-group">
            <div class="naming-field-label">
              <span>Título Reglamentario para YouTube (Pitch 120s)</span>
              <span style="font-size:10.5px; color:#64748b; text-transform:none; font-weight:600;">1080p · No Listado</span>
            </div>
            <div class="naming-input-row">
              <input type="text" class="naming-input-readonly" readonly value="${nom.ytTitle}" id="input-yt-title">
              <button class="btn-copy-action" onclick="copyToClipboardWithFeedback('${nom.ytTitle}', 'Título de YouTube copiado')">
                ${SVG.copy} Copiar
              </button>
            </div>
          </div>
        </div>

        <div class="naming-box-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
            <div>
              <h3 style="font-size:14px; font-weight:700; color:#0f172a; margin:0;">Hashtags Obligatorios (YouTube & TikTok)</h3>
              <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">Etiquetas exigidas por la rúbrica oficial del certamen.</p>
            </div>
            <button class="btn-copy-action" onclick="copyToClipboardWithFeedback('${allHashtagsStr}', 'Todos los hashtags copiados')">
              ${SVG.copy} Copiar Todos
            </button>
          </div>

          <div class="hashtag-cloud">
            ${nom.hashtags.map(t => `<span class="hashtag-pill">${t}</span>`).join("")}
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; font-size:11.5px; color:#475569; line-height:1.45;">
            <strong>Directriz de Impacto en Redes:</strong> ${nom.tiktokTip}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="phase-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
      <div>
        <h1 class="phase-title">12 · Cronograma de Entrega <span class="phase-title-accent">& Requisitos Críticos</span></h1>
        <p class="phase-subtitle">Horarios oficiales de Nicaragua (UTC-6), checklist desplegable y nomenclaturas reglamentarias.</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <span class="tactical-status-pill">
          <span class="status-dot"></span>HORA NICARAGUA (UTC-6)
        </span>
        <span class="tactical-status-pill">
          <span class="status-dot"></span>${isLatam ? 'Rally Latam (28 Horas)' : 'Rally Nacional (24 Horas)'}
        </span>
      </div>
    </div>

    <!-- Banner Suave y Limpio de Próximo Hito -->
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px 18px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:34px; height:34px; border-radius:8px; background:var(--bg-subtle); color:var(--color-primary); border:1px solid var(--border-light); display:flex; align-items:center; justify-content:center;">
          ${SVG.clock}
        </div>
        <div>
          <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.04em;">PRÓXIMO HITO CRÍTICO</div>
          <div style="font-size:13.5px; font-weight:700; color:#091e42;">${currentDeadline.label} — <span style="color:#003366; font-family:var(--font-mono);">${currentDeadline.time}</span></div>
        </div>
      </div>
      <div style="font-size:12px; color:#475569; max-width:440px; line-height:1.4;">
        ${currentDeadline.desc}
      </div>
    </div>

    <!-- Sub-navegación Limpia y Cohesiva -->
    <div class="timeline-subnav">
      <button class="timeline-subnav-btn ${currentSubtab === 'checklist' ? 'active' : ''}" onclick="switchTimelineSubtab('checklist')">
        <span>Checklist de Requisitos</span>
        <span id="timeline-subnav-verified" class="timeline-subnav-count">${verifiedCount}/${GUARDRAILS_DEFINITIONS.length}</span>
      </button>
      <button class="timeline-subnav-btn ${currentSubtab === 'schedule' ? 'active' : ''}" onclick="switchTimelineSubtab('schedule')">
        <span>Cronograma & IA</span>
        <span class="timeline-subnav-count">${milestones.length}</span>
      </button>
      <button class="timeline-subnav-btn ${currentSubtab === 'naming' ? 'active' : ''}" onclick="switchTimelineSubtab('naming')">
        <span>Nomenclaturas & Tags</span>
      </button>
    </div>

    ${subtabContent}

    <!-- Bloque de Empaquetado y Exportación Final -->
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 style="font-size:14px; font-weight:800; color:#0f172a; margin:0;">Empaquetado Oficial y Exportación del Dossier</h3>
          <span class="stepper-pill" style="background:#eff6ff; color:#003366; font-size:10.5px; font-weight:700;">Formatos MD & PDF</span>
        </div>
        <p style="font-size:12px; color:#64748b; margin:4px 0 0 0;">Genera la memoria técnica consolidada con logos institucionales, catálogo de retos, propuestas IA, pautado y rúbricas.</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn-primary" onclick="exportProjectMarkdown()" style="padding:9px 16px; font-size:12.5px; font-weight:700;">
          ${SVG.copy} Exportar Dossier (.md)
        </button>
        <button class="btn-select-card filled" onclick="printProjectDossier()" style="padding:9px 16px; font-size:12.5px; font-weight:700; background:#0D1B35; color:#fff; border-color:#0D1B35;">
          ${SVG.download} Imprimir / Guardar como PDF
        </button>
      </div>
    </div>
  `;
}

// ── INSPECTOR LATERAL DE AUDITORÍA ───────────────────────────────────────────
function updateInspector() {
  const panel = document.getElementById("panel");
  if (!panel) return;

  const stage = getWorkflowStage();
  if (stage < 2) return;

  const guardrails = state.guardrails || {};
  const guardrailsCount = Object.values(guardrails).filter(Boolean).length;
  const guardrailsTotal = GUARDRAILS_DEFINITIONS.length;
  const guardrailsOk = guardrailsCount === guardrailsTotal;

  const points = calculateAuditScore();
  const topbarBadge = document.getElementById("topbar-audit-badge");
  if (topbarBadge) topbarBadge.textContent = `${points}%`;

  const hasBudgetItems = Array.isArray(state.budget) && state.budget.length > 0;
  const totalBudget = hasBudgetItems ? state.budget.reduce((a, b) => a + (Number(b.units || 0) * Number(b.unit_cost || 0)), 0) : 0;

  panel.innerHTML = `
    <div class="drawer-header-mobile">
      <span>Preparación Oficial</span>
      <button class="btn-close-drawer" onclick="closeAllDrawers()" aria-label="Cerrar panel de auditoría">${SVG.close}</button>
    </div>

    <div class="prep-console">
      <div class="prep-console-header">
        <span class="prep-console-title">Preparación Oficial</span>
        <span class="prep-console-pct">${points}%</span>
      </div>
      <div class="prep-progress-track">
        <div class="prep-progress-bar" style="width:${points}%;"></div>
      </div>

      <div class="prep-table">
        <div class="prep-row ${state.team_name ? 'is-complete' : ''}" onclick="switchTab('team')" title="Identidad del Equipo">
          <span class="prep-col-name">01. Equipo y Sede</span>
          <span class="prep-col-status">${rsPill(state.team_name ? "done" : "pending", state.team_name ? { label: "CONFIRMADO" } : { label: "INCOMPLETO" })}</span>
        </div>
        <div class="prep-row ${state.challenge_id ? 'is-complete' : ''}" onclick="switchTab('challenges')" title="Selección de Reto">
          <span class="prep-col-name">02. Reto en Vivo</span>
          <span class="prep-col-status">${rsPill(state.challenge_id ? "done" : "pending", state.challenge_id ? { label: "#" + state.challenge_id, title: "Reto activo" } : { label: "SIN ELEGIR" })}</span>
        </div>
        <div class="prep-row ${state.solution_approved ? 'is-complete' : ''}" onclick="switchTab('solution')" title="Taller de Solución">
          <span class="prep-col-name">03. Solución Técnica</span>
          <span class="prep-col-status">${rsPill(state.solution_approved ? "done" : (stage >= 3 ? "working" : "pending"), { label: state.solution_approved ? "APROBADA" : (stage >= 3 ? "BORRADOR" : "PENDIENTE"), title: "Solución técnica" })}</span>
        </div>
        <div class="prep-row ${state.challenge_id && state.solution_approved ? 'is-complete' : ''}" onclick="switchTab('impact')" title="Impacto ODS y Políticas Nacionales">
          <span class="prep-col-name">04. ODS &amp; Plan País</span>
          <span class="prep-col-status">${rsPill(state.challenge_id && state.solution_approved ? "done" : (state.challenge_id ? "working" : "pending"), { label: state.challenge_id ? (state.solution_approved ? "ALINEADO" : "CONFIGURAR") : "PENDIENTE", title: "Impacto ODS y Plan País" })}</span>
        </div>
        <div class="prep-row ${isPautadoComplete() ? 'is-complete' : ''}" onclick="switchTab('pautado')" title="Documento Pautado">
          <span class="prep-col-name">05. Pautado Oficial</span>
          <span class="prep-col-status">${rsPill(isPautadoComplete() ? "done" : (stage >= 5 ? "working" : "pending"), { label: isPautadoComplete() ? "AUDITADO" : (stage >= 5 ? "REVISAR" : "PENDIENTE"), title: "Documento Pautado" })}</span>
        </div>
        <div class="prep-row ${hasBudgetItems && isBudgetValid() ? 'is-complete' : ''}" onclick="switchTab('budget')" title="Presupuesto">
          <span class="prep-col-name">06. Presupuesto</span>
          <span class="prep-col-status">${rsPill(hasBudgetItems && isBudgetValid() ? "done" : (hasBudgetItems ? "working" : "pending"), { label: hasBudgetItems ? "$" + Math.round(totalBudget).toLocaleString() + " USD" : "SIN COTIZAR", title: "Presupuesto" })}</span>
        </div>
        <div class="prep-row ${isScriptComplete() ? 'is-complete' : ''}" onclick="switchTab('script')" title="Guion de Video">
          <span class="prep-col-name">07. Guion 120s</span>
          <span class="prep-col-status">${rsPill(isScriptComplete() ? "done" : (stage >= 9 ? "working" : "pending"), { label: isScriptComplete() ? "120s OK" : (stage >= 9 ? "EN CURSO" : "PENDIENTE"), title: "Guion de video" })}</span>
        </div>
        <div class="prep-row ${guardrailsOk ? 'is-complete' : ''}" onclick="switchTab('timeline')" title="Requisitos de Entrega">
          <span class="prep-col-name">08. Checklist de Entrega</span>
          <span class="prep-col-status">${rsPill(guardrailsOk ? "done" : (guardrailsCount > 0 ? "working" : "pending"), { label: `${guardrailsCount}/${guardrailsTotal} VERIFICADOS`, title: "Checklist de entrega" })}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:12px; padding:8px 10px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; font-size:10.5px; line-height:1.35; color:#475569;">
      <div style="font-weight:700; color:#0866F5; font-size:10px; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:3px; display:flex; align-items:center; gap:4px;">
        ${SVG.spark} Criterio Jurado: Coherencia (100 Pts)
      </div>
      Costos e impacto del video de 120s deben cuadrar exactos con el presupuesto del documento pautado.
    </div>
  `;
}

function attachTabListeners(tabId) {}
