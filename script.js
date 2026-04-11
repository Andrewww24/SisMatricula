// ─── Router ───────────────────────────────────────────────────
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

// ─── Nav dentro del shell ─────────────────────────────────────
const pageMap = {
  'dash-estudiante': 'page-dash-estudiante',
  'matricula':       'page-matricula',
  'horario':         'page-horario',
  'historial':       'page-pago',
  'pago':            'page-pago',
  'estado-cuenta':   'page-pago',
  'confirmacion':    'page-confirmacion',
  'gestion-academica':'page-gestion-academica',
  'reportes':        'page-reportes',
  'auditoria':       'page-auditoria',
  'notificaciones':  'page-notificaciones',
  'lista-espera':    'page-lista-espera',
};
const titleMap = {
  'dash-estudiante': 'Dashboard',
  'matricula':       'Realizar matrícula',
  'horario':         'Mi horario',
  'historial':       'Historial académico',
  'pago':            'Pagos y facturas',
  'estado-cuenta':   'Estado de cuenta',
  'confirmacion':    'Confirmación de matrícula',
  'gestion-academica':'Gestión académica',
  'reportes':        'Reportes',
  'auditoria':       'Bitácora de auditoría',
  'notificaciones':  'Notificaciones',
  'lista-espera':    'Lista de espera',
};

function navTo(page) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
  const target = pageMap[page];
  if (target) document.getElementById(target).style.display = 'block';
  // Update topbar
  const t = document.getElementById('topbar-title-est');
  if (t) t.textContent = titleMap[page] || page;
  // Update nav active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // Reset wizard if going to matrícula
  if (page === 'matricula') resetWizard();
  window.scrollTo(0, 0);
}

// ─── Role switcher ─────────────────────────────────────────────
function switchRole(role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (role === 'admin') {
    navTo('gestion-academica');
  } else if (role === 'tesoreria') {
    navTo('reportes');
  } else {
    navTo('dash-estudiante');
  }
}

// ─── Tabs ──────────────────────────────────────────────────────
function switchTab(btn, tabId) {
  const parent = btn.closest('.page-content') || btn.parentElement;
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

// ─── Modals ────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ─── Matrícula wizard ──────────────────────────────────────────
let carrito = [];
let currentStep = 1;

function resetWizard() {
  carrito = [];
  currentStep = 1;
  renderCarrito();
  showStep(1);
  updateWizardUI();
}

function addCurso(nombre, codigo, creditos, horario) {
  if (carrito.find(c => c.codigo === codigo)) return;
  const totalCred = carrito.reduce((s, c) => s + c.creditos, 0) + creditos;
  if (totalCred > 20) {
    const el = document.querySelector('.alert-info');
    el.classList.add('conflict-alert', 'alert-warning');
    el.classList.remove('alert-info');
    el.innerHTML = '⚠️ <strong>Límite de créditos:</strong> No podés superar 20 créditos por período.';
    setTimeout(() => {
      el.classList.remove('conflict-alert','alert-warning');
      el.classList.add('alert-info');
      el.innerHTML = 'ℹ️ <strong>Restricciones activas:</strong> máximo 20 créditos por período · sin deudas pendientes · prerrequisitos verificados automáticamente';
    }, 3000);
    return;
  }
  carrito.push({ nombre, codigo, creditos, horario });
  renderCarrito();
}

function removeCurso(codigo) {
  carrito = carrito.filter(c => c.codigo !== codigo);
  renderCarrito();
}

function renderCarrito() {
  const lista = document.getElementById('carrito-lista');
  const total = document.getElementById('carrito-total');
  const btn   = document.getElementById('btn-continuar');
  const cred  = document.getElementById('total-creditos');
  const bar   = document.getElementById('creditos-bar');
  const ind   = document.getElementById('creditos-indicator');

  if (!lista) return;

  if (carrito.length === 0) {
    lista.innerHTML = '<div class="text-sm text-muted" style="text-align:center;padding:20px 0">Ningún curso seleccionado aún</div>';
    total.style.display = 'none';
    btn.style.display = 'none';
    bar.style.width = '0%';
    ind.textContent = '0 / 20';
    return;
  }

  const totalCred = carrito.reduce((s, c) => s + c.creditos, 0);
  lista.innerHTML = carrito.map(c => `
    <div class="carrito-item">
      <div>
        <div class="carrito-name">${c.nombre}</div>
        <div class="carrito-meta">${c.codigo} · ${c.horario} · ${c.creditos} créditos</div>
      </div>
      <button class="remove-btn" onclick="removeCurso('${c.codigo}')">✕</button>
    </div>
  `).join('');

  total.style.display = 'flex';
  btn.style.display = 'block';
  cred.textContent = totalCred + ' cred.';
  const pct = Math.min(totalCred / 20 * 100, 100);
  bar.style.width = pct + '%';
  bar.className = 'prog-fill ' + (pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'blue');
  ind.textContent = totalCred + ' / 20';
}

function nextStep() {
  if (currentStep < 4) {
    currentStep++;
    showStep(currentStep);
    updateWizardUI();
  }
}
function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
    updateWizardUI();
  }
}

function showStep(n) {
  ['step-seleccion','step-validacion','step-pago'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (i + 1 === n) ? 'block' : 'none';
  });
  if (n === 3) renderResumenPago();
}

function renderResumenPago() {
  const el = document.getElementById('resumen-cursos-pago');
  const tot = document.getElementById('total-pagar');
  if (!el) return;
  const base = carrito.reduce((s, c) => s + c.creditos * 30000, 0);
  el.innerHTML = carrito.map(c => `
    <div class="resumen-item">
      <span class="resumen-item-label">${c.nombre} (${c.creditos} cr.)</span>
      <span class="resumen-item-val">₡${(c.creditos*30000).toLocaleString()}</span>
    </div>
  `).join('') + `
    <div class="resumen-item"><span class="resumen-item-label">Beca (15%)</span><span class="badge badge-green">- ₡${Math.round(base*.15).toLocaleString()}</span></div>
    <div class="resumen-item"><span class="resumen-item-label">Mat. temprana (5%)</span><span class="badge badge-teal">- ₡${Math.round(base*.05).toLocaleString()}</span></div>
  `;
  const neto = Math.round(base * 0.80);
  if (tot) tot.textContent = '₡' + neto.toLocaleString();

  // Confirm page
  const cc = document.getElementById('conf-cursos');
  const ccred = document.getElementById('conf-cred');
  const cmonto = document.getElementById('conf-monto');
  if (cc) cc.textContent = carrito.length + ' curso(s)';
  if (ccred) ccred.textContent = carrito.reduce((s,c)=>s+c.creditos,0) + ' créditos';
  if (cmonto) cmonto.textContent = '₡' + neto.toLocaleString();
}

function updateWizardUI() {
  const steps = [
    { circle: 'ws1', line: null },
    { circle: 'ws2', line: 'wl1' },
    { circle: 'ws3', line: 'wl2' },
    { circle: 'ws4', line: 'wl3' },
  ];
  steps.forEach((s, i) => {
    const c = document.getElementById(s.circle);
    const l = s.line ? document.getElementById(s.line) : null;
    if (!c) return;
    c.className = 'wstep-circle ' + (i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'active' : 'todo');
    if (i + 1 < currentStep) c.textContent = '✓';
    else c.textContent = i < 3 ? (i + 1) : '✓';
    if (l) l.className = 'wstep-line ' + (i + 1 < currentStep ? 'done' : '');
  });
}

// ─── Payment method selector ───────────────────────────────────
function selectPayMethod(el) {
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type=radio]').checked = true;
}

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navTo('dash-estudiante');
  // Make all pages hidden except first
  document.querySelectorAll('.page-content').forEach(p => {
    if (p.id !== 'page-dash-estudiante') p.style.display = 'none';
  });
  // Add admin/tesorería nav items
  const adminNavItems = `
    <div class="sidebar-section">Administración</div>
    <div class="nav-item" onclick="navTo('gestion-academica')"><span class="nav-icon">🏛️</span> Gestión académica</div>
    <div class="nav-item" onclick="navTo('lista-espera')"><span class="nav-icon">⏳</span> Lista de espera <span class="nav-badge">3</span></div>
    <div class="nav-item" onclick="navTo('reportes')"><span class="nav-icon">📊</span> Reportes</div>
    <div class="nav-item" onclick="navTo('auditoria')"><span class="nav-icon">🔍</span> Auditoría</div>
    <div class="nav-item" onclick="navTo('notificaciones')"><span class="nav-icon">📨</span> Notificaciones</div>
  `;
  const bottom = document.querySelector('.sidebar-bottom');
  if (bottom) bottom.insertAdjacentHTML('beforebegin', adminNavItems);
});