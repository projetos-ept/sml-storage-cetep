const API_BASE = 'https://us-east1-sml-storage.cloudfunctions.net';

// DOM
const projetoSelect     = document.getElementById('projeto');
const tag1Input         = document.getElementById('tag1');
const tag2Input         = document.getElementById('tag2');
const tag3Input         = document.getElementById('tag3');
const mesInput          = document.getElementById('mes');
const limit10Checkbox   = document.getElementById('limit10');
const apiKeyInput       = document.getElementById('apiKey');
const btnSearch         = document.getElementById('btnSearch');
const btnClear          = document.getElementById('btnClear');
const btnSaveApi        = document.getElementById('btnSaveApi');
const toggleApiEye      = document.getElementById('toggleApiEye');

const loadingDiv        = document.getElementById('loading');
const loadingText       = document.getElementById('loadingText');
const noResultsDiv      = document.getElementById('noResults');
const resultsArea       = document.getElementById('resultsArea');
const filesTable        = document.getElementById('filesTable');
const filesList         = document.getElementById('filesList');
const resultCount       = document.getElementById('resultCount');
const quickSearchBar    = document.getElementById('quickSearchBar');

const floatingBar       = document.getElementById('floatingBar');
const selectedCount     = document.getElementById('selectedCount');
const btnDownloadZip    = document.getElementById('btnDownloadZip');
const btnPrintSelected  = document.getElementById('btnPrintSelected');
const btnDeselectAll    = document.getElementById('btnDeselectAll');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');

const btnDarkMode       = document.getElementById('btnDarkMode');
const darkModeIcon      = document.getElementById('darkModeIcon');
const btnOpenSidebar    = document.getElementById('btnOpenSidebar');
const btnCloseSidebar   = document.getElementById('btnCloseSidebar');
const sidebar           = document.getElementById('sidebar');
const sidebarOverlay    = document.getElementById('sidebarOverlay');

let currentUploads = [];
let currentSort = { field: 'date', direction: 'desc' };

// =====================
// INIT
// =====================
window.addEventListener('load', () => {
  const savedKey = localStorage.getItem('sml_api_key');
  if (savedKey) apiKeyInput.value = savedKey;

  const now = new Date();
  mesInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const savedTheme = localStorage.getItem('sml_theme') || 'light';
  setTheme(savedTheme);

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => handleSort(btn.dataset.sort));
  });
});

// =====================
// EVENTS
// =====================
btnSearch.addEventListener('click', search);
btnClear.addEventListener('click', clearFilters);

btnSaveApi.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) localStorage.setItem('sml_api_key', key);
});

toggleApiEye.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  document.getElementById('eyeIcon').className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
});

btnDownloadZip.addEventListener('click', openDownloadModal);
btnPrintSelected.addEventListener('click', openPrintModal);
btnDeselectAll.addEventListener('click', selectNoneFiles);
selectAllCheckbox.addEventListener('change', toggleSelectAll);

// Real-time inline filter
quickSearchBar.addEventListener('input', renderFilteredRows);

// Dark mode
btnDarkMode.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('sml_theme', next);
});

// Sidebar mobile
btnOpenSidebar?.addEventListener('click', () => {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
});
btnCloseSidebar?.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

// =====================
// THEME
// =====================
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  darkModeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}

// =====================
// SEARCH
// =====================
async function search() {
  const apiKey = apiKeyInput.value.trim();
  const projeto = projetoSelect.value;

  if (!apiKey) { showToast('⚠️ Informe a API Key (clique em "API Key" na barra lateral)'); return; }
  if (!projeto) { showToast('⚠️ Selecione um projeto'); return; }

  showLoading('Buscando arquivos...');

  try {
    const body = {
      projeto,
      tag1: tag1Input.value.trim() || undefined,
      tag2: tag2Input.value.trim() || undefined,
      tag3: tag3Input.value.trim() || undefined,
      mes:  mesInput.value || undefined,
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

    const response = await fetch(`${API_BASE}/listUploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    hideLoading();

    if (!response.ok || !data.success) throw new Error(data.error || `Erro ${response.status}`);

    currentUploads = data.uploads || [];
    if (limit10Checkbox.checked) currentUploads = currentUploads.slice(0, 10);

    sortUploads();
    displayResults();
    closeSidebar();

  } catch (err) {
    hideLoading();
    showToast(`❌ ${err.message}`);
    console.error(err);
  }
}

// =====================
// DISPLAY
// =====================
function displayResults() {
  quickSearchBar.value = '';

  if (currentUploads.length === 0) {
    resultsArea.style.display = 'none';
    noResultsDiv.style.display = 'flex';
    return;
  }

  noResultsDiv.style.display = 'none';
  resultsArea.style.display = 'block';
  resultCount.textContent = `${currentUploads.length} arquivo(s)`;

  renderFilteredRows();
  selectAllCheckbox.checked = false;
  updateFloatingBar();
}

function renderFilteredRows() {
  const term = quickSearchBar.value.toLowerCase().trim();
  filesList.innerHTML = '';

  const filtered = term
    ? currentUploads.filter(u =>
        (u.filename || '').toLowerCase().includes(term) ||
        (u.tags?.tag1 || '').toLowerCase().includes(term) ||
        (u.tags?.tag2 || '').toLowerCase().includes(term) ||
        (u.tags?.tag3 || '').toLowerCase().includes(term)
      )
    : currentUploads;

  if (filtered.length === 0) {
    filesList.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-2)">Nenhum resultado para "${term}"</td></tr>`;
    return;
  }

  filtered.forEach(upload => filesList.appendChild(createTableRow(upload)));
  resultCount.textContent = term
    ? `${filtered.length} de ${currentUploads.length} arquivo(s)`
    : `${currentUploads.length} arquivo(s)`;
}

function createTableRow(upload) {
  const row = document.createElement('tr');

  const fileName   = upload.filename || 'N/A';
  const fileSize   = formatFileSize(upload.size || 0);
  const format     = (upload.format || '').toLowerCase();
  const uploadDate = formatDate(upload.uploadedAtISO);
  const tag1       = upload.tags?.tag1 || '—';
  const tag2       = upload.tags?.tag2 || '—';
  const tag3       = upload.tags?.tag3 || '—';

  const iconClass = format === 'pdf' ? 'pdf' : ['jpg','jpeg','png','gif','webp'].includes(format) ? 'img' : 'other';
  const iconName  = iconClass === 'pdf' ? 'bi-file-earmark-pdf-fill'
                  : iconClass === 'img' ? 'bi-file-earmark-image-fill'
                  : 'bi-file-earmark-fill';

  row.innerHTML = `
    <td><input type="checkbox" class="ck row-checkbox" data-file-id="${upload.id}"></td>
    <td>
      <div class="file-cell">
        <div class="file-icon ${iconClass}"><i class="bi ${iconName}"></i></div>
        <div>
          <div class="file-name-text">${escapeHtml(fileName)}</div>
          <div class="file-size-text">${fileSize}</div>
        </div>
      </div>
    </td>
    <td class="d-none d-lg-table-cell tag-cell">${fileSize}</td>
    <td class="tag-cell">${escapeHtml(tag1)}</td>
    <td class="d-none d-md-table-cell"><span class="turma-chip">${escapeHtml(tag2)}</span></td>
    <td class="d-none d-lg-table-cell tag-cell">${escapeHtml(tag3)}</td>
    <td class="d-none d-md-table-cell date-cell">${uploadDate}</td>
    <td>
      <div class="row-actions">
        <button class="row-btn" title="Download" onclick="downloadFile('${escapeHtml(upload.url)}','${escapeHtml(fileName)}')">
          <i class="bi bi-cloud-arrow-down"></i>
        </button>
        <button class="row-btn copy" title="Copiar Link" onclick="copyToClipboard('${escapeHtml(upload.url)}')">
          <i class="bi bi-link-45deg"></i>
        </button>
      </div>
    </td>
  `;

  row.querySelector('.row-checkbox').addEventListener('change', updateFloatingBar);
  return row;
}

// =====================
// SORT
// =====================
function handleSort(field) {
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active', 'asc', 'desc'));

  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'asc';
  }

  const btn = document.querySelector(`.sort-btn[data-sort="${field}"]`);
  if (btn) btn.classList.add('active', currentSort.direction);

  sortUploads();
  renderFilteredRows();
}

function sortUploads() {
  const { field, direction } = currentSort;
  if (!field) return;

  currentUploads.sort((a, b) => {
    let av, bv;
    if (field === 'date') {
      av = new Date(a.uploadedAtISO || 0).getTime();
      bv = new Date(b.uploadedAtISO || 0).getTime();
    } else {
      const map = { tag1: 'tag1', tag2: 'tag2', tag3: 'tag3' };
      av = (a.tags?.[map[field]] || '').toLowerCase();
      bv = (b.tags?.[map[field]] || '').toLowerCase();
    }
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// =====================
// SELECTION
// =====================
function toggleSelectAll() {
  const checked = selectAllCheckbox.checked;
  document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
  updateFloatingBar();
}

function selectAllFiles() {
  document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = true);
  selectAllCheckbox.checked = true;
  updateFloatingBar();
}

function selectNoneFiles() {
  document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
  selectAllCheckbox.checked = false;
  updateFloatingBar();
}

function updateFloatingBar() {
  const total   = document.querySelectorAll('.row-checkbox').length;
  const checked = document.querySelectorAll('.row-checkbox:checked').length;
  selectAllCheckbox.checked = total > 0 && total === checked;
  selectedCount.textContent = checked;

  if (checked > 0) {
    floatingBar.classList.add('show');
  } else {
    floatingBar.classList.remove('show');
  }
}

function getSelectedFiles() {
  const selected = [];
  document.querySelectorAll('.row-checkbox:checked').forEach(cb => {
    const upload = currentUploads.find(u => u.id === cb.dataset.fileId);
    if (upload) selected.push(upload);
  });
  return selected;
}

// =====================
// ACTIONS
// =====================
function downloadFile(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function copyToClipboard(url) {
  navigator.clipboard.writeText(url)
    .then(() => showToast('✓ Link copiado!'))
    .catch(() => showToast('❌ Erro ao copiar'));
}

// =====================
// ZIP DOWNLOAD
// =====================
function openDownloadModal() {
  const selected = getSelectedFiles();
  if (!selected.length) { showToast('⚠️ Selecione ao menos um arquivo'); return; }
  document.getElementById('downloadCount').textContent = selected.length;
  new bootstrap.Modal(document.getElementById('downloadModal')).show();
}

async function executeZipDownload() {
  const selected = getSelectedFiles();
  if (!selected.length) return;

  const zipFileName = document.getElementById('zipFileName').value.trim() || 'arquivos_selecionados';
  bootstrap.Modal.getInstance(document.getElementById('downloadModal'))?.hide();
  showLoading('Baixando arquivos...');

  try {
    const zip = new JSZip();
    let ok = 0, fail = 0;

    for (let i = 0; i < selected.length; i++) {
      const u = selected[i];
      loadingText.textContent = `Baixando ${i + 1} de ${selected.length}...`;
      try {
        const res = await fetch(u.url, { mode: 'cors' });
        if (!res.ok) throw new Error();
        zip.file(u.filename, await res.blob());
        ok++;
      } catch { fail++; }
    }

    if (!ok) { hideLoading(); showToast('❌ Nenhum arquivo baixado'); return; }

    loadingText.textContent = 'Gerando ZIP...';
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${zipFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    hideLoading();
    showToast(`✓ ${zipFileName}.zip baixado!${fail ? ` (${fail} falharam)` : ''}`);
  } catch (err) {
    hideLoading();
    showToast(`❌ Erro: ${err.message}`);
  }
}

// =====================
// PRINT
// =====================
function openPrintModal() {
  const selected = getSelectedFiles();
  if (!selected.length) { showToast('⚠️ Selecione ao menos um arquivo'); return; }
  document.getElementById('printCount').textContent = selected.length;
  new bootstrap.Modal(document.getElementById('printModal')).show();
}

async function executePrint() {
  const selected = getSelectedFiles();
  if (!selected.length) return;

  bootstrap.Modal.getInstance(document.getElementById('printModal'))?.hide();
  showLoading('Preparando impressão...');

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Impressão em Lote</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:white; }
        canvas { display:block; width:100%; height:auto; page-break-after:always; }
        canvas:last-child { page-break-after:avoid; }
      </style></head><body id="pb"></body></html>`);
    printWindow.document.close();

    const pb = printWindow.document.getElementById('pb');

    for (let i = 0; i < selected.length; i++) {
      const u = selected[i];
      loadingText.textContent = `Renderizando ${i + 1} de ${selected.length}...`;

      const res = await fetch(u.url);
      const pdf = await pdfjsLib.getDocument({ data: await res.arrayBuffer() }).promise;

      for (let p = 1; p <= pdf.numPages; p++) {
        const page     = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        const canvas   = printWindow.document.createElement('canvas');
        canvas.width   = viewport.width;
        canvas.height  = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        pb.appendChild(canvas);
      }
    }

    hideLoading();
    showToast(`✓ Abrindo ${selected.length} arquivo(s) para impressão...`);
    setTimeout(() => printWindow.print(), 500);

  } catch (err) {
    hideLoading();
    showToast(`❌ Erro na impressão: ${err.message}`);
    console.error(err);
  }
}

// =====================
// CLEAR
// =====================
function clearFilters() {
  projetoSelect.value = 'cetep';
  tag1Input.value = '';
  tag2Input.value = '';
  tag3Input.value = '';
  limit10Checkbox.checked = true;
  currentSort = { field: 'date', direction: 'desc' };
  quickSearchBar.value = '';

  const now = new Date();
  mesInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active', 'asc', 'desc'));
  document.querySelector('.sort-btn[data-sort="date"]')?.classList.add('active');

  currentUploads = [];
  filesList.innerHTML = '';
  resultsArea.style.display = 'none';
  noResultsDiv.style.display = 'none';
  floatingBar.classList.remove('show');
}

// =====================
// UI HELPERS
// =====================
function showLoading(msg = 'Carregando...') {
  loadingText.textContent = msg;
  loadingDiv.style.display  = 'flex';
  resultsArea.style.display = 'none';
  noResultsDiv.style.display = 'none';
}

function hideLoading() {
  loadingDiv.style.display = 'none';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// =====================
// UTILS
// =====================
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + s[i];
}

function formatDate(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('pt-BR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = String(text ?? '');
  return d.innerHTML;
}
