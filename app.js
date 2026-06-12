const API_BASE = 'https://us-east1-sml-storage.cloudfunctions.net';

// DOM Elements
const projetoSelect = document.getElementById('projeto');
const tag1Input = document.getElementById('tag1');
const tag2Input = document.getElementById('tag2');
const tag3Input = document.getElementById('tag3');
const mesInput = document.getElementById('mes');
const limit10Checkbox = document.getElementById('limit10');
const apiKeyInput = document.getElementById('apiKey');
const btnSearch = document.getElementById('btnSearch');
const btnClear = document.getElementById('btnClear');

const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const noResultsDiv = document.getElementById('noResults');
const filesTable = document.getElementById('filesTable');
const filesList = document.getElementById('filesList');
const resultCount = document.getElementById('resultCount');

const downloadModal = document.getElementById('downloadModal');
const tableControls = document.getElementById('tableControls');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const btnSelectNone = document.getElementById('btnSelectNone');
const btnSelectAll = document.getElementById('btnSelectAll');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');

let currentUploads = [];
let currentSort = { field: null, direction: 'asc' };

// Event Listeners
btnSearch.addEventListener('click', search);
btnClear.addEventListener('click', clearFilters);
btnDownloadZip.addEventListener('click', openDownloadModal);
btnSelectNone.addEventListener('click', selectNoneFiles);
btnSelectAll.addEventListener('click', selectAllFiles);
selectAllCheckbox.addEventListener('change', toggleSelectAll);
downloadModal.addEventListener('click', (e) => {
  if (e.target === downloadModal) closeDownloadModal();
});

// Load API key from localStorage on page load
window.addEventListener('load', () => {
  const savedApiKey = localStorage.getItem('sml_api_key');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }

  // Set current month as default
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  mesInput.value = `${year}-${month}`;

  // Add sort event listeners
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.sort));
  });
});

// Save API key to localStorage when changed
apiKeyInput.addEventListener('change', () => {
  localStorage.setItem('sml_api_key', apiKeyInput.value);
});

async function search() {
  const apiKey = apiKeyInput.value.trim();
  const projeto = projetoSelect.value;

  if (!apiKey) {
    showError('⚠️ Por favor, informe sua API Key');
    return;
  }

  if (!projeto) {
    showError('⚠️ Por favor, selecione um projeto');
    return;
  }

  showLoading();
  hideError();

  try {
    const body = {
      projeto,
      tag1: tag1Input.value.trim() || undefined,
      tag2: tag2Input.value.trim() || undefined,
      tag3: tag3Input.value.trim() || undefined,
      mes: mesInput.value || undefined,
    };

    // Add limit if checkbox is checked
    if (limit10Checkbox.checked) {
      body.limit = 10;
    }

    // Remove undefined fields
    Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

    const response = await fetch(`${API_BASE}/listUploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    hideLoading();

    if (!response.ok) {
      throw new Error(data.error || `Erro: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.error);
    }

    currentUploads = data.uploads || [];
    displayResults();
  } catch (error) {
    hideLoading();
    showError(`❌ ${error.message}`);
    console.error('Erro:', error);
  }
}

function displayResults() {
  if (currentUploads.length === 0) {
    filesTable.style.display = 'none';
    tableControls.style.display = 'none';
    btnDownloadZip.style.display = 'none';
    noResultsDiv.style.display = 'block';
    resultCount.textContent = '0 arquivos encontrados';
    return;
  }

  resultCount.textContent = `${currentUploads.length} arquivo(s) encontrado(s)`;
  filesList.innerHTML = '';

  currentUploads.forEach((upload) => {
    const row = createTableRow(upload);
    filesList.appendChild(row);
  });

  noResultsDiv.style.display = 'none';
  filesTable.style.display = 'table';
  tableControls.style.display = 'flex';
  btnDownloadZip.style.display = 'inline-flex';
  selectAllCheckbox.checked = false;
}

function createTableRow(upload) {
  const row = document.createElement('tr');
  row.dataset.uploadId = upload.id;
  row.dataset.uploadUrl = upload.url;
  row.dataset.fileName = upload.filename;
  row.dataset.date = upload.uploadedAtISO;
  row.dataset.tag1 = (upload.tags?.tag1 || '').toLowerCase();
  row.dataset.tag2 = (upload.tags?.tag2 || '').toLowerCase();
  row.dataset.tag3 = (upload.tags?.tag3 || '').toLowerCase();

  const fileName = upload.filename || 'N/A';
  const fileSize = formatFileSize(upload.size || 0);
  const fileFormat = (upload.format || 'N/A').toUpperCase();
  const uploadDate = formatDate(upload.uploadedAtISO);

  const tags = upload.tags || {};
  const tag1 = tags.tag1 || '—';
  const tag2 = tags.tag2 || '—';
  const tag3 = tags.tag3 || '—';

  row.innerHTML = `
    <td><input type="checkbox" class="row-checkbox" data-file-id="${upload.id}"></td>
    <td><span class="file-name">${escapeHtml(fileName)}</span></td>
    <td><span class="file-size">${fileSize}</span></td>
    <td><span class="file-type">${fileFormat}</span></td>
    <td><span class="file-date">${uploadDate}</span></td>
    <td><span class="tag-cell">${escapeHtml(tag1)}</span></td>
    <td><span class="tag-cell">${escapeHtml(tag2)}</span></td>
    <td><span class="tag-cell">${escapeHtml(tag3)}</span></td>
    <td>
      <div class="actions-cell">
        <button class="btn btn-download btn-small" onclick="downloadFile('${escapeHtml(upload.url)}', '${escapeHtml(fileName)}')">⬇️ Download</button>
        <button class="btn btn-info btn-small" onclick="copyToClipboard('${escapeHtml(upload.url)}')">🔗 Copiar Link</button>
      </div>
    </td>
  `;

  // Add checkbox change listener
  const checkbox = row.querySelector('.row-checkbox');
  checkbox.addEventListener('change', updateSelectAllCheckbox);

  return row;
}

function downloadFile(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function copyToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    showError('✓ Link copiado para a área de transferência!');
    setTimeout(hideError, 2000);
  }).catch(err => {
    showError('❌ Erro ao copiar link');
    console.error('Erro:', err);
  });
}

function clearFilters() {
  projetoSelect.value = '';
  tag1Input.value = '';
  tag2Input.value = '';
  tag3Input.value = '';
  limit10Checkbox.checked = true;
  currentSort = { field: null, direction: 'asc' };

  // Reset to current month
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  mesInput.value = `${year}-${month}`;

  // Reset sort column styles
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  filesList.innerHTML = '';
  filesTable.style.display = 'none';
  tableControls.style.display = 'none';
  btnDownloadZip.style.display = 'none';
  noResultsDiv.style.display = 'none';
  errorDiv.style.display = 'none';
  resultCount.textContent = '0 arquivos encontrados';
  currentUploads = [];
}

function showLoading() {
  loadingDiv.style.display = 'flex';
  filesTable.style.display = 'none';
  noResultsDiv.style.display = 'none';
  errorDiv.style.display = 'none';
}

function hideLoading() {
  loadingDiv.style.display = 'none';
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideError() {
  errorDiv.style.display = 'none';
}

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getSelectedFiles() {
  const checkboxes = document.querySelectorAll('.row-checkbox:checked');
  const selected = [];
  checkboxes.forEach(checkbox => {
    const fileId = checkbox.dataset.fileId;
    const upload = currentUploads.find(u => u.id === fileId);
    if (upload) {
      selected.push(upload);
    }
  });
  return selected;
}

function selectAllFiles() {
  document.querySelectorAll('.row-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
  selectAllCheckbox.checked = true;
}

function selectNoneFiles() {
  document.querySelectorAll('.row-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  selectAllCheckbox.checked = false;
}

function toggleSelectAll() {
  const checked = selectAllCheckbox.checked;
  document.querySelectorAll('.row-checkbox').forEach(checkbox => {
    checkbox.checked = checked;
  });
}

function updateSelectAllCheckbox() {
  const total = document.querySelectorAll('.row-checkbox').length;
  const checked = document.querySelectorAll('.row-checkbox:checked').length;
  selectAllCheckbox.checked = total > 0 && total === checked;
}

function openDownloadModal() {
  const selected = getSelectedFiles();
  if (selected.length === 0) {
    showError('⚠️ Selecione pelo menos um arquivo para fazer download');
    return;
  }

  document.getElementById('downloadCount').textContent = selected.length;
  downloadModal.classList.add('show');
}

function closeDownloadModal() {
  downloadModal.classList.remove('show');
}

async function executeZipDownload() {
  const selected = getSelectedFiles();
  if (selected.length === 0) {
    showError('⚠️ Nenhum arquivo selecionado');
    return;
  }

  const zipFileName = document.getElementById('zipFileName').value.trim() || 'arquivos_selecionados';
  closeDownloadModal();
  showLoading();

  try {
    const zip = new JSZip();

    // Fetch all files
    for (let i = 0; i < selected.length; i++) {
      const upload = selected[i];
      showLoading();

      // Update loading message
      document.querySelector('.loading p').textContent = `Adicionando arquivo ${i + 1} de ${selected.length}...`;

      try {
        const response = await fetch(upload.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        zip.file(upload.filename, blob);
      } catch (error) {
        console.error(`Erro ao buscar ${upload.filename}:`, error);
        showError(`⚠️ Erro ao buscar ${upload.filename}. Continuando com os demais...`);
      }
    }

    // Generate ZIP
    document.querySelector('.loading p').textContent = 'Gerando arquivo ZIP...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${zipFileName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    hideLoading();
    showError(`✓ Download de ${zipFileName}.zip concluído com sucesso!`);
    setTimeout(hideError, 3000);
  } catch (error) {
    hideLoading();
    showError(`❌ Erro ao criar ZIP: ${error.message}`);
    console.error('Erro:', error);
  }
}

function handleSort(field) {
  const thElement = document.querySelector(`th[data-sort="${field}"]`);

  // Toggle sort direction
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'asc';
  }

  // Update visual indicators
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  thElement.classList.add(currentSort.direction);

  // Sort the data
  sortUploads();
  displayResults();
}

function sortUploads() {
  if (!currentSort.field) return;

  currentUploads.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.field) {
      case 'date':
        aVal = new Date(a.uploadedAtISO || 0).getTime();
        bVal = new Date(b.uploadedAtISO || 0).getTime();
        break;
      case 'tag1':
        aVal = (a.tags?.tag1 || '').toLowerCase();
        bVal = (b.tags?.tag1 || '').toLowerCase();
        break;
      case 'tag2':
        aVal = (a.tags?.tag2 || '').toLowerCase();
        bVal = (b.tags?.tag2 || '').toLowerCase();
        break;
      case 'tag3':
        aVal = (a.tags?.tag3 || '').toLowerCase();
        bVal = (b.tags?.tag3 || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}
