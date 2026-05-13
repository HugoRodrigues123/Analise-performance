const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 8001);
const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(__dirname, "analise_performance_store.json");

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

function criarEstadoVazio() {
  return STORAGE_KEYS.reduce((acc, key) => {
    acc[key] = key === FICHAS_KEY ? { estoque: {}, requisicoes: [] } : [];
    return acc;
  }, {});
}

function lerBanco() {
  if (!fs.existsSync(DATA_FILE)) return criarEstadoVazio();
  try {
    return { ...criarEstadoVazio(), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch {
    return criarEstadoVazio();
  }
}

function salvarBanco(dados) {
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
    enviarJson(res, 200, { ok: true, database: `Arquivo local - ${path.basename(DATA_FILE)}` });
    return true;
  }

  if (pathname === "/api/dados" && req.method === "GET") {
    enviarJson(res, 200, dadosConsolidados(lerBanco()));
    return true;
  }

  if (pathname === "/api/storage" && req.method === "GET") {
    enviarJson(res, 200, lerBanco());
    return true;
  }

  if (pathname === "/api/salvar" && req.method === "POST") {
    const payload = await lerBody(req);
    const banco = lerBanco();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (STORAGE_KEYS.includes(key)) banco[key] = normalizarPayload(value, key);
    });
    salvarBanco(banco);
    enviarJson(res, 200, { ok: true });
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Analise de Performance rodando em http://127.0.0.1:${PORT}`);
  console.log(`Banco local: ${DATA_FILE}`);
});
