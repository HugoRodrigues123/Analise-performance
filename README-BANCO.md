# MySQL compartilhado - Análise de Performance

Para todos os computadores enxergarem os mesmos cadastros, o projeto precisa rodar por um **servidor Node.js** conectado a um **MySQL único**. Abrir pelo GitHub, GitHub Pages ou arquivo local não compartilha os dados.

## Como vai funcionar

1. Um computador/servidor fica ligado com:
   - MySQL
   - Node.js rodando este projeto
2. Todos os usuários acessam o mesmo endereço:

```text
http://IP_DO_SERVIDOR:8001/index.html
```

Exemplo:

```text
http://192.168.0.50:8001/index.html
```

## 1. Instalar dependências

No computador/servidor:

```powershell
cd C:\Users\hugo.rodrigues\Documents\Projetos\analise-performance
npm install
```

## 2. Criar o banco e usuário MySQL

Entre no MySQL como administrador e execute:

```sql
CREATE DATABASE IF NOT EXISTS analise_performance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'analise_app'@'%' IDENTIFIED BY 'troque_esta_senha';
GRANT ALL PRIVILEGES ON analise_performance.* TO 'analise_app'@'%';
FLUSH PRIVILEGES;

USE analise_performance;

CREATE TABLE IF NOT EXISTS app_storage (
  storage_key VARCHAR(80) NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (JSON_VALID(payload))
);
```

Também pode executar o arquivo:

```powershell
mysql -u root -p < database.sql
```

Depois troque a senha `troque_esta_senha` por uma senha real no MySQL e no `.env`.

## 3. Criar o arquivo `.env`

Copie:

```powershell
copy .env.example .env
```

Configure o `.env` assim:

```env
PORT=8001
HOST=0.0.0.0

DB_DIALECT=mysql
DB_REQUIRE_MYSQL=true
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=analise_app
DB_PASSWORD=troque_esta_senha
DB_NAME=analise_performance
DB_SSL=false
```

Use `DB_HOST=127.0.0.1` se o MySQL estiver no mesmo computador que roda o Node.
Use `DB_HOST=IP_DO_SERVIDOR_MYSQL` se o MySQL estiver em outro servidor.

`DB_REQUIRE_MYSQL=true` impede o sistema de salvar em JSON local por engano. Se o MySQL falhar, a API vai mostrar erro em vez de criar dados isolados em outro computador.

## 4. Liberar acesso na rede

No computador que roda o sistema:

- O `HOST` precisa ser `0.0.0.0`.
- A porta `8001` precisa estar liberada no Firewall do Windows.
- O MySQL precisa aceitar conexão do servidor Node.
- Se o MySQL estiver em outro computador, a porta `3306` precisa estar liberada nele.

## 5. Iniciar o servidor

```powershell
npm start
```

No próprio servidor, acesse:

```text
http://127.0.0.1:8001/index.html
```

Nos outros computadores, acesse pelo IP do servidor:

```text
http://IP_DO_SERVIDOR:8001/index.html
```

## 6. Conferir se está usando MySQL

Pelo terminal, rode:

```powershell
npm run check:mysql
```

Se estiver correto, deve aparecer `Conexão MySQL OK`.

Abra:

```text
http://IP_DO_SERVIDOR:8001/api/health
```

O correto é aparecer:

```json
{
  "database": "mysql",
  "requireMysql": true
}
```

Se aparecer `database: "json"`, o sistema não está compartilhado.

## Migração dos dados já cadastrados

Quando o servidor MySQL estiver vazio, ao abrir o sistema no computador que já tem os cadastros no navegador, o projeto tenta enviar os dados locais para o banco.

Faça assim:

1. Configure e inicie o servidor com MySQL.
2. No computador onde os cadastros aparecem corretamente, abra o sistema pelo endereço do servidor:

```text
http://IP_DO_SERVIDOR:8001/index.html
```

3. Aguarde alguns segundos.
4. Abra `/api/health` e confirme `database: "mysql"`.
5. Abra em outro computador pelo mesmo endereço.

## Categorias salvas

As informações ficam na tabela `app_storage`, separadas por categoria em JSON:

- `simHistorico`
- `simMultas`
- `simAdvertencias`
- `simAvarias`
- `simOcorrencias`
- `simMotoristas`
- `simMotoristasStatus`
- `simParticipantes`
- `simVeiculos`
- `simTrajetos`
- `simDiagnosticosImportados`
- `simControleFichas`
- `simTelemetria`
- `simPlanejamentos`
