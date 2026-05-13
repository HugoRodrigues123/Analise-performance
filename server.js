const fs = require("fs");
const http = require("http");
const path = require("path");

carregarEnvLocal();

let mysql = null;
try {
  mysql = require("mysql2/promise");
} catch {
  mysql = null;
}

const PORT = Number(process.env.PORT || 8001);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(__dirname, "analise_performance_store.json");
const DB_DIALECT = String(process.env.DB_DIALECT || "mysql").toLowerCase();
const DB_NAME = process.env.DB_NAME || "analise_performance";

const STORAGE_KEY = "simHistorico";
const MULTAS_KEY = "simMultas";
const ADVERTENCIAS_KEY = "simAdvertencias";
const AVARIAS_KEY = "simAvarias";
const OCORRENCIAS_KEY = "simOcorrencias";
const MOTORISTAS_KEY = "simMotoristas";
const MOTORISTAS_STATUS_KEY = "simMotoristasStatus";
const VEICULOS_KEY = "simVeiculos";
const TRAJETOS_KEY = "simTrajetos";
const DIAGNOSTICOS_KEY = "simDiagnosticosImportados";
const FICHAS_KEY = "simControleFichas";
const TELEMETRIA_KEY = "simTelemetria";

const STORAGE_KEYS = [
  STORAGE_KEY,
  MULTAS_KEY,
  ADVERTENCIAS_KEY,
  AVARIAS_KEY,
  OCORRENCIAS_KEY,
  MOTORISTAS_KEY,
  MOTORISTAS_STATUS_KEY,
  VEICULOS_KEY,
  TRAJETOS_KEY,
  DIAGNOSTICOS_KEY,
  FICHAS_KEY,
  TELEMETRIA_KEY
];

const STORAGE_API_MAP = {
  [STORAGE_KEY]: "historico",
  [MULTAS_KEY]: "multas",
  [ADVERTENCIAS_KEY]: "advertencias",
  [AVARIAS_KEY]: "avarias",
  [OCORRENCIAS_KEY]: "ocorrencias",
  [MOTORISTAS_KEY]: "motoristas",
  [MOTORISTAS_STATUS_KEY]: "motoristasStatus",
  [VEICULOS_KEY]: "veiculos",
  [TRAJETOS_KEY]: "trajetos",
  [DIAGNOSTICOS_KEY]: "diagnosticos",
  [FICHAS_KEY]: "fichas",
  [TELEMETRIA_KEY]: "telemetria"
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon"
};

let mysqlPool = null;
let mysqlStatus = {
  ok: false,
  message: DB_DIALECT === "json" ? "Modo JSON local habilitado." : "MySQL ainda não inicializado."
};

function carregarEnvLocal() {
  const envPath = path.join(__dirname, ".env");
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

function criarEstadoVazio() {
  return STORAGE_KEYS.reduce((acc, key) => {
    acc[key] = key === FICHAS_KEY ? { estoque: {}, requisicoes: [] } : [];
    return acc;
  }, {});
}

function lerBancoJson() {
  if (!fs.existsSync(DATA_FILE)) return criarEstadoVazio();
  try {
    return { ...criarEstadoVazio(), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch {
    return criarEstadoVazio();
  }
}

function salvarBancoJson(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf8");
}

function normalizarPayload(payload, key) {
  if (key === FICHAS_KEY) {
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : { estoque: {}, requisicoes: Array.isArray(payload) ? payload : [] };
  }
  return Array.isArray(payload) ? payload : [];
}

function criarConfigMysql(database = DB_NAME) {
  const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    charset: "utf8mb4"
  };

  if (database) config.database = database;
  if (String(process.env.DB_SSL || "false").toLowerCase() === "true") {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

async function inicializarMysql() {
  if (DB_DIALECT === "json") return null;
  if (!mysql) {
    mysqlStatus = { ok: false, message: "Dependência mysql2 não instalada. Execute npm install." };
    return null;
  }
  if (mysqlPool) return mysqlPool;

  try {
    const conexaoAdmin = await mysql.createConnection(criarConfigMysql(null));
    await conexaoAdmin.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conexaoAdmin.end();

    mysqlPool = mysql.createPool(criarConfigMysql(DB_NAME));
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS app_storage (
        storage_key VARCHAR(80) NOT NULL PRIMARY KEY,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHECK (JSON_VALID(payload))
      )
    `);

    mysqlStatus = { ok: true, message: `MySQL conectado em ${DB_NAME}.` };
    await migrarJsonParaMysqlSeNecessario();
    return mysqlPool;
  } catch (error) {
    mysqlPool = null;
    mysqlStatus = { ok: false, message: `MySQL indisponível: ${error.message}` };
    return null;
  }
}

async function lerBancoMysql() {
  const pool = await inicializarMysql();
  if (!pool) return null;

  const [linhas] = await pool.query("SELECT storage_key, payload FROM app_storage");
  const banco = criarEstadoVazio();
  linhas.forEach((linha) => {
    if (!STORAGE_KEYS.includes(linha.storage_key)) return;
    try {
      banco[linha.storage_key] = normalizarPayload(JSON.parse(linha.payload), linha.storage_key);
    } catch {
      banco[linha.storage_key] = criarEstadoVazio()[linha.storage_key];
    }
  });
  return banco;
}

async function salvarBancoMysqlParcial(payload) {
  const pool = await inicializarMysql();
  if (!pool) return false;

  const entradas = Object.entries(payload || {}).filter(([key]) => STORAGE_KEYS.includes(key));
  for (const [key, value] of entradas) {
    const normalizado = normalizarPayload(value, key);
    await pool.execute(
      `INSERT INTO app_storage (storage_key, payload)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
      [key, JSON.stringify(normalizado)]
    );
  }
  return true;
}

async function migrarJsonParaMysqlSeNecessario() {
  if (!mysqlPool || !fs.existsSync(DATA_FILE)) return;
  const bancoJson = lerBancoJson();
  if (!Object.values(bancoJson).some(dadoTemConteudo)) return;

  const [linhas] = await mysqlPool.query("SELECT COUNT(*) AS total FROM app_storage");
  if (Number(linhas[0]?.total || 0) > 0) return;

  await salvarBancoMysqlParcial(bancoJson);
  console.log("Dados do JSON local migrados para MySQL.");
}

async function lerBancoPersistente() {
  const bancoMysql = await lerBancoMysql();
  return bancoMysql || lerBancoJson();
}

async function salvarPayloadPersistente(payload) {
  const dadosNormalizados = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (STORAGE_KEYS.includes(key)) dadosNormalizados[key] = normalizarPayload(value, key);
  });

  const salvoMysql = await salvarBancoMysqlParcial(dadosNormalizados);
  if (salvoMysql) return { ok: true, database: "mysql" };

  const banco = lerBancoJson();
  Object.assign(banco, dadosNormalizados);
  salvarBancoJson(banco);
  return { ok: true, database: "json", warning: mysqlStatus.message };
}

function dadoTemConteudo(dado) {
  if (Array.isArray(dado)) return dado.length > 0;
  if (dado && typeof dado === "object") return Object.keys(dado).length > 0;
  return false;
}

function enviarJson(res, status, dados) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(dados));
}

function lerBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) reject(new Error("Payload muito grande."));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function dadosConsolidados(banco) {
  const dados = {
    historico: [],
    multas: [],
    advertencias: [],
    avarias: [],
    ocorrencias: [],
    motoristas: [],
    motoristasStatus: [],
    veiculos: [],
    trajetos: [],
    diagnosticos: [],
    fichas: { estoque: {}, requisicoes: [] },
    telemetria: []
  };

  Object.entries(STORAGE_API_MAP).forEach(([storageKey, apiKey]) => {
    dados[apiKey] = banco[storageKey] ?? dados[apiKey];
  });
  return dados;
}

async function tratarApi(req, res, pathname) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return true;
  }

  if (pathname === "/api/health" && req.method === "GET") {
    await inicializarMysql();
    enviarJson(res, 200, {
      ok: true,
      database: mysqlStatus.ok ? "mysql" : "json",
      mysql: mysqlStatus,
      jsonFallback: DATA_FILE
    });
    return true;
  }

  if (pathname === "/api/dados" && req.method === "GET") {
    enviarJson(res, 200, dadosConsolidados(await lerBancoPersistente()));
    return true;
  }

  if (pathname === "/api/storage" && req.method === "GET") {
    enviarJson(res, 200, await lerBancoPersistente());
    return true;
  }

  if (pathname === "/api/salvar" && req.method === "POST") {
    const payload = await lerBody(req);
    enviarJson(res, 200, await salvarPayloadPersistente(payload));
    return true;
  }

  return false;
}

function servirArquivo(res, pathname) {
  const relativo = pathname === "/" ? "index.html" : decodeURIComponent(pathname.replace(/^\/+/, ""));
  const arquivo = path.resolve(PUBLIC_DIR, relativo);
  if (!arquivo.startsWith(PUBLIC_DIR)) {
    enviarJson(res, 403, { ok: false, error: "Acesso negado." });
    return;
  }

  fs.readFile(arquivo, (error, conteudo) => {
    if (error) {
      enviarJson(res, 404, { ok: false, error: "Arquivo não encontrado." });
      return;
    }
    const ext = path.extname(arquivo).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(conteudo);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/") && await tratarApi(req, res, url.pathname)) return;
    servirArquivo(res, url.pathname);
  } catch (error) {
    enviarJson(res, 500, { ok: false, error: error.message || "Erro interno." });
  }
});

server.listen(PORT, HOST, async () => {
  await inicializarMysql();
  console.log(`Analise de Performance rodando em http://${HOST}:${PORT}`);
  console.log(mysqlStatus.ok ? mysqlStatus.message : `${mysqlStatus.message} Usando fallback JSON: ${DATA_FILE}`);
});
