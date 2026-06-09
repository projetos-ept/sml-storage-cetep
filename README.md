# SML Storage CETEP - Visualizador de Arquivos

Interface web para visualizar, filtrar e gerenciar arquivos armazenados na **SML Storage API**.

## 🚀 Funcionalidades

✅ **Listar arquivos** do bucket com filtros avançados
✅ **Filtrar por:**
  - Projeto (obrigatório)
  - Tag 1 - tipo de arquivo (ex: hemograma, urgente)
  - Tag 2 - categoria (ex: turma-a, 2026)
  - Mês (formato YYYY-MM)

✅ **Visualizar detalhes** de cada arquivo
✅ **Download direto** dos arquivos
✅ **Interface responsiva** e moderna
✅ **API Key armazenada localmente** no navegador

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
   - Tag 1: tipo/classificação do arquivo
   - Tag 2: categoria/turma
   - Mês: YYYY-MM (ex: 2026-06)
4. Clique em **🔎 Buscar**

### 4. Visualizar Resultados

- **Tabela de arquivos** com: nome, tamanho, tipo, data, tags e ações
- **Download**: Clique em "⬇️ Download" para baixar o arquivo
- **Detalhes**: Clique em "ℹ️ Detalhes" para ver informações completas

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
  "tag1": "hemograma",
  "tag2": "urgente",
  "mes": "2026-06"
}
```

### Response

```json
{
  "success": true,
  "count": 2,
  "uploads": [
    {
      "id": "aB3xK9mNpQrS7tUv",
      "filename": "laudo-hemograma.pdf",
      "path": "cetep/2026-06/1780857941461_laudo-hemograma.pdf",
      "url": "https://storage.googleapis.com/...",
      "size": 204800,
      "format": "pdf",
      "uploadedAt": "2026-06-07T15:47:00.000Z",
      "uploadedAtISO": "2026-06-07T15:47:00.000Z",
      "tags": {
        "tag1": "hemograma",
        "tag2": "urgente",
        "tag3": null
      }
    }
  ]
}
```

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
