# SML Storage CETEP - Visualizador de Arquivos

Interface web para visualizar, filtrar e gerenciar arquivos armazenados na **SML Storage API**.

## 🚀 Funcionalidades

✅ **Listar arquivos** com filtros avançados
✅ **Filtrar por:**
  - Projeto (obrigatório)
  - Tag 1 - Estudante (ex: Lucas Batista, João Silva)
  - Tag 2 - Turma (ex: 3TACM1)
  - Tag 3 - E-mail do responsável (ex: professor@escola.com)
  - Mês (formato YYYY-MM)
  - Últimos 10 arquivos (marcado por padrão)

✅ **Ordenar resultados** por:
  - Data de Upload (↑↓)
  - Estudante (↑↓)
  - Turma (↑↓)
  - E-mail (↑↓)

✅ **Seleção em lote:**
  - Checkboxes para cada arquivo
  - Botões "Selecionar Nenhum" e "Selecionar Todos"
  - Checkbox no cabeçalho para selecionar/desselecionar tudo

✅ **Download:**
  - Download individual de arquivos
  - Preparação para download em ZIP de múltiplos arquivos
  - Copiar link do arquivo para clipboard

✅ **Interface responsiva** e moderna
✅ **API Key armazenada localmente** no navegador (localStorage)

## 🌐 Deploy em GitHub Pages

Este repositório está configurado para ser deployado automaticamente em GitHub Pages.

**URL:** https://projetos-ept.github.io/sml-storage-cetep/

### Como Configurar

1. Vá em **Settings** → **Pages**
2. Em "Build and deployment", selecione:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `master`
   - **Folder:** `/ (root)`
3. Clique em "Save"

GitHub Pages construirá e publicará automaticamente.

## 📋 Como Usar

### 1. Obter API Key

Você precisa de uma API Key válida para usar a aplicação. Entre em contato com o administrador da SML Storage API.

### 2. Acessar a Interface

Abra https://projetos-ept.github.io/sml-storage-cetep/ no navegador.

### 3. Filtrar Arquivos

1. **Cole sua API Key** no campo "🔐 API Key"
2. **Selecione um Projeto** (obrigatório)
3. **(Opcional) Aplique filtros adicionais:**
   - Tag 1 (Estudante): nome do estudante
   - Tag 2 (Turma): turma (ex: 3TACM1)
   - Tag 3 (E-mail): e-mail do responsável
   - Mês: YYYY-MM (ex: 2026-06)
   - ☑ Últimos 10 arquivos: (marcado por padrão)
4. Clique em **🔎 Buscar**

### 4. Visualizar e Ordenar Resultados

- **Tabela de arquivos** com: nome, tamanho, tipo, data, estudante, turma, e-mail e ações
- **Ordenar**: Clique nas setas (⇅) no cabeçalho das colunas para ordenar
- **Download**: Clique em "⬇️ Download" para baixar o arquivo
- **Copiar Link**: Clique em "🔗 Copiar Link" para copiar a URL do arquivo

### 5. Seleção em Lote

1. **Selecionar arquivos** com os checkboxes individuais ou:
   - Clique em "☑ Todos" para selecionar todos os arquivos
   - Clique em "☐ Nenhum" para desselecionar todos
2. **Baixar Selecionados**: Clique em "📦 Baixar Selecionados (.zip)" para preparar o download em lote

## 🔐 Segurança

- ✅ API Key é **armazenada apenas localmente** no navegador (localStorage)
- ✅ Requisições são feitas **diretamente para a API** (sem proxy intermediário)
- ✅ **CORS configurado** para aceitar apenas domínios autorizados
- ⚠️ **Nunca compartilhe sua API Key** publicamente

## 🛠️ Estrutura de Arquivos

```
sml-storage-cetep/
├── index.html          ← Interface principal
├── style.css           ← Estilos
├── app.js              ← Lógica da aplicação
├── README.md           ← Este arquivo
└── .gitignore          ← Arquivos ignorados
```

## 📡 API Utilizada

Endpoint: `POST /listUploads`

**Base URL:** `https://us-east1-sml-storage.cloudfunctions.net`

### Request

```json
{
  "projeto": "cetep",
  "tag1": "Lucas Batista",
  "tag2": "3TACM1",
  "tag3": "professor@escola.com",
  "mes": "2026-06",
  "limit": 10
}
```

**Parâmetros:**
- `projeto` (obrigatório): nome do projeto
- `tag1` (opcional): nome do estudante
- `tag2` (opcional): turma
- `tag3` (opcional): e-mail do responsável
- `mes` (opcional): mês no formato YYYY-MM
- `limit` (opcional): limitar número de resultados (ex: 10)

### Response

```json
{
  "success": true,
  "count": 1,
  "uploads": [
    {
      "id": "aB3xK9mNpQrS7tUv",
      "filename": "09062026-3TACM1-Lucas-Batista.pdf",
      "path": "cetep/2026-06/1780857941461_09062026-3TACM1-Lucas-Batista.pdf",
      "url": "https://storage.googleapis.com/...",
      "size": 204800,
      "format": "pdf",
      "uploadedAt": "2026-06-07T15:47:00.000Z",
      "uploadedAtISO": "2026-06-07T15:47:00.000Z",
      "tags": {
        "tag1": "Lucas Batista",
        "tag2": "3TACM1",
        "tag3": "professor@escola.com"
      }
    }
  ]
}
```

**Estrutura do arquivo:**
- `filename`: formato `DDMMAAAA-TURMA-NOMES.pdf` (ex: 09062026-3TACM1-Lucas-Batista.pdf)
- `tags.tag1`: nome(s) do(s) estudante(s)
- `tags.tag2`: turma
- `tags.tag3`: e-mail do responsável

Para mais detalhes, veja a documentação da [SML Storage API](https://github.com/projetos-ept/sml-storage-api).

## 🐛 Troubleshooting

### "Chave de API inválida"
- Verifique se a API Key está correta
- Contate o administrador se a chave foi revogada

### "Nenhum arquivo encontrado"
- Verifique se há arquivos no projeto selecionado
- Tente alterar os filtros ou deixar vazios para buscar todos

### Erro de CORS
- Verifique se o domínio está autorizado no CORS da API
- A URL deve ser exatamente: `https://projetos-ept.github.io/sml-storage-cetep/`

## 📞 Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue em:
https://github.com/projetos-ept/sml-storage-api/issues

## 📄 Licença

Mesmo projeto que [SML Storage API](https://github.com/projetos-ept/sml-storage-api/blob/main/LICENSE)

---

**Desenvolvido para facilitar o compartilhamento de atividades acadêmicas.**
