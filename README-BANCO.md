# Banco de dados MySQL - Analise de Performance

O projeto usa um backend Node.js com MySQL para salvar as informações em uma base central.
O navegador continua usando `localStorage` como cache, mas ao abrir pelo servidor Node os dados são carregados de `/api/dados` e, ao salvar, são enviados para `/api/salvar`.

## 1. Instalar dependências

```powershell
cd C:\Users\hugo.rodrigues\Documents\Projetos\analise-performance
npm install
```

## 2. Criar o arquivo `.env`

Copie o exemplo:

```powershell
copy .env.example .env
```

Configure:

```env
PORT=8001
HOST=127.0.0.1
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=analise_performance
DB_SSL=false
```

Para acessar por outro computador da mesma rede, altere `HOST=0.0.0.0` e acesse pelo IP do computador servidor, por exemplo:

```text
http://192.168.0.50:8001/index.html
```

## 3. Criar banco/tabela

O servidor cria automaticamente o banco e a tabela se o usuário MySQL tiver permissão.
Se preferir criar manualmente, rode o arquivo:

```powershell
mysql -u root -p < database.sql
```

Se aparecer erro parecido com `auth_gssapi_client`, o usuário `root` está usando autenticação do Windows/MariaDB que o driver Node não consegue usar. Nesse caso, crie um usuário próprio com senha normal:

```sql
CREATE DATABASE IF NOT EXISTS analise_performance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'analise_app'@'%' IDENTIFIED BY 'troque_esta_senha';
GRANT ALL PRIVILEGES ON analise_performance.* TO 'analise_app'@'%';
FLUSH PRIVILEGES;
```

Depois atualize o `.env`:

```env
DB_USER=analise_app
DB_PASSWORD=troque_esta_senha
```

## 4. Iniciar

```powershell
npm start
```

Depois acesse:

```text
http://127.0.0.1:8001/index.html
```

## 5. Conferir conexão

Abra:

```text
http://127.0.0.1:8001/api/health
```

Se estiver tudo certo, o retorno indicará `database: "mysql"`.
Se o MySQL ou a dependência `mysql2` não estiver disponível, o servidor usa temporariamente o arquivo `analise_performance_store.json` como fallback para não impedir a abertura do sistema.

## Estrutura dos dados

As informações ficam na tabela `app_storage`, separadas por categoria em JSON:

- `simHistorico`
- `simMultas`
- `simAdvertencias`
- `simAvarias`
- `simOcorrencias`
- `simMotoristas`
- `simMotoristasStatus`
- `simVeiculos`
- `simTrajetos`
- `simDiagnosticosImportados`
- `simControleFichas`
- `simTelemetria`
