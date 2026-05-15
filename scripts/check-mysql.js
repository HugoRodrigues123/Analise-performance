const fs = require("fs");
const path = require("path");

function carregarEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((linha) => {
      const limpa = linha.trim();
      if (!limpa || limpa.startsWith("#")) return;
      const idx = limpa.indexOf("=");
      if (idx < 0) return;
      const chave = limpa.slice(0, idx).trim();
      const valor = limpa.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (chave && process.env[chave] === undefined) process.env[chave] = valor;
    });
}

async function main() {
  carregarEnvLocal();
  const mysql = require("mysql2/promise");
  const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "analise_performance",
    charset: "utf8mb4"
  };

  if (String(process.env.DB_SSL || "false").toLowerCase() === "true") {
    config.ssl = { rejectUnauthorized: false };
  }

  const conexao = await mysql.createConnection(config);
  const [linhas] = await conexao.query("SELECT DATABASE() AS database_name, COUNT(*) AS total_storage FROM app_storage");
  await conexao.end();
  console.log("Conexão MySQL OK");
  console.log(JSON.stringify(linhas[0], null, 2));
}

main().catch((error) => {
  console.error("Falha ao conectar no MySQL:");
  console.error(error.message);
  process.exit(1);
});
