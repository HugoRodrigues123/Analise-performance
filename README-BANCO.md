# Banco de dados SQLite - Analise de Performance

Este projeto agora usa um backend Node.js com **SQLite** (via ORM Sequelize) para salvar as informações.

## ✓ Vantagens

- ✓ Sem instalação/configuração de servidor de banco de dados
- ✓ Arquivo de banco local (`analise_performance.db`)
- ✓ Funciona offline
- ✓ ORM (Sequelize) - seguro contra SQL injection
- ✓ Sincronização automática com localStorage
- ✓ Muito mais rápido em desenvolvimento

## 1. Instalar dependências

Com Node.js e npm instalados:

```powershell
cd C:\Users\hugo.rodrigues\Documents\Projetos\analise-performance
npm install
```

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env`:

```powershell
copy .env.example .env
```

O arquivo contém apenas:
```env
PORT=8001
```

(A porta padrão é 8001, mas você pode alterá-la se preferir)

## 3. Iniciar o sistema

```powershell
npm start
```

Depois acesse:

```text
http://127.0.0.1:8001/index.html
```

## Como funciona

- O navegador ainda usa `localStorage` como cache local.
- Ao abrir pelo servidor Node, o sistema tenta carregar os dados do MySQL.
- Ao salvar, editar, importar ou excluir dados, o sistema sincroniza com o MySQL.
- Se o MySQL estiver indisponivel, a tela continua funcionando localmente, mas sem sincronizar no banco.

## Dados salvos no MySQL

As informacoes ficam na tabela `app_storage`, separadas por categoria:

- `simHistorico`
- `simMultas`
- `simAdvertencias`
- `simAvarias`
- `simMotoristas`
- `simVeiculos`
- `simTrajetos`
- `simDiagnosticosImportados`
