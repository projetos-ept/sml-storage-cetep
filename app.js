const API_BASE = 'https://us-east1-sml-storage.cloudfunctions.net';

// DOM Elements
const projetoSelect = document.getElementById('projeto');
const tag1Input = document.getElementById('tag1');
const tag2Input = document.getElementById('tag2');
const mesInput = document.getElementById('mes');
const apiKeyInput = document.getElementById('apiKey');
const btnSearch = document.getElementById('btnSearch');
const btnClear = document.getElementById('btnClear');

const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const noResultsDiv = document.getElementById('noResults');
const filesTable = document.getElementById('filesTable');
const filesList = document.getElementById('filesList');
const resultCount = document.getElementById('resultCount');

const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');
const modalBody = document.getElementById('modalBody');

let currentUploads = [];

// Event Listeners
btnSearch.addEventListener('click', search);
btnClear.addEventListener('click', clearFilters);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Load API key from localStorage on page load
window.addEventListener('load', () => {
  const savedApiKey = localStorage.getItem('sml_api_key');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }
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
      mes: mesInput.value || undefined,
    };

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
}

function createTableRow(upload) {
  const row = document.createElement('tr');

  const fileName = upload.filename || 'N/A';
  const fileSize = formatFileSize(upload.size || 0);
  const fileFormat = (upload.format || 'N/A').toUpperCase();
  const uploadDate = formatDate(upload.uploadedAtISO);

  const tags = upload.tags || {};
  let tagsHtml = '';
  if (tags.tag1) tagsHtml += `<span class="tag">${escapeHtml(tags.tag1)}</span>`;
  if (tags.tag2) tagsHtml += `<span class="tag">${escapeHtml(tags.tag2)}</span>`;
  if (tags.tag3) tagsHtml += `<span class="tag">${escapeHtml(tags.tag3)}</span>`;

  row.innerHTML = `
    <td><span class="file-name">${escapeHtml(fileName)}</span></td>
    <td><span class="file-size">${fileSize}</span></td>
    <td><span class="file-type">${fileFormat}</span></td>
    <td><span class="file-date">${uploadDate}</span></td>
    <td><div class="tags-cell">${tagsHtml || '<em style="color: #999;">Sem tags</em>'}</div></td>
    <td>
      <div class="actions-cell">
        <button class="btn btn-download btn-small" onclick="downloadFile('${escapeHtml(upload.url)}', '${escapeHtml(fileName)}')">⬇️ Download</button>
        <button class="btn btn-info btn-small" onclick="showDetails('${escapeHtml(JSON.stringify(upload).replace(/'/g, '&#39;'))}')">ℹ️ Detalhes</button>
      </div>
    </td>
  `;

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

function showDetails(uploadJson) {
  const upload = JSON.parse(uploadJson);

  const html = `
    <div class="modal-detail">
      <label>Arquivo</label>
      <p>${escapeHtml(upload.filename)}</p>
    </div>

    <div class="modal-detail">
      <label>Tamanho</label>
      <p>${formatFileSize(upload.size)}</p>
    </div>

    <div class="modal-detail">
      <label>Tipo</label>
      <p>${upload.format.toUpperCase()}</p>
    </div>

    <div class="modal-detail">
      <label>Data de Upload</label>
      <p>${formatDate(upload.uploadedAtISO)}</p>
    </div>

    <div class="modal-detail">
      <label>Caminho no Storage</label>
      <p><code style="background: #f0f0f0; padding: 5px; border-radius: 3px;">${escapeHtml(upload.path)}</code></p>
    </div>

    <div class="modal-detail">
      <label>URL Pública</label>
      <p><a href="${escapeHtml(upload.url)}" target="_blank">${escapeHtml(upload.url)}</a></p>
    </div>

    <div class="modal-detail">
      <label>Tags</label>
      <p>
        ${upload.tags.tag1 ? `<strong>Tag 1:</strong> ${escapeHtml(upload.tags.tag1)}<br>` : ''}
        ${upload.tags.tag2 ? `<strong>Tag 2:</strong> ${escapeHtml(upload.tags.tag2)}<br>` : ''}
        ${upload.tags.tag3 ? `<strong>Tag 3:</strong> ${escapeHtml(upload.tags.tag3)}<br>` : ''}
        ${!upload.tags.tag1 && !upload.tags.tag2 && !upload.tags.tag3 ? '<em style="color: #999;">Sem tags</em>' : ''}
      </p>
    </div>

    <div class="modal-detail">
      <label>ID do Documento</label>
      <p><code style="background: #f0f0f0; padding: 5px; border-radius: 3px;">${escapeHtml(upload.id)}</code></p>
    </div>
  `;

  modalBody.innerHTML = html;
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
}

function clearFilters() {
  projetoSelect.value = '';
  tag1Input.value = '';
  tag2Input.value = '';
  mesInput.value = '';

  filesList.innerHTML = '';
  filesTable.style.display = 'none';
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
