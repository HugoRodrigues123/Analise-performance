const path = require("path");
const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 8001);
const PUBLIC_DIR = __dirname;
const STORAGE_KEYS = new Set([
  "simHistorico",
  "simMultas",
  "simAdvertencias",
  "simAvarias",
  "simMotoristas",
  "simMotoristasStatus",
  "simVeiculos",
  "simTrajetos",
  "simDiagnosticosImportados",
  "simControleFichas"
]);

const DB_DIALECT = process.env.DB_DIALECT || (process.env.DB_HOST ? "mysql" : "sqlite");
const sequelizeOptions = {
  dialect: DB_DIALECT,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

if (DB_DIALECT === "sqlite") {
  sequelizeOptions.storage = path.join(__dirname, "analise_performance.db");
} else {
  sequelizeOptions.host = process.env.DB_HOST || "127.0.0.1";
  sequelizeOptions.port = Number(process.env.DB_PORT || 3306);
  sequelizeOptions.username = process.env.DB_USER || "root";
  sequelizeOptions.password = process.env.DB_PASSWORD || "";
  sequelizeOptions.database = process.env.DB_NAME || "analise_performance";
  if (process.env.DB_SSL && process.env.DB_SSL.toLowerCase() === "true") {
    sequelizeOptions.dialectOptions = {
      ssl: { rejectUnauthorized: false }
    };
  }
}

const sequelize = new Sequelize(sequelizeOptions);

// Definir modelo AppStorage
const AppStorage = sequelize.define("app_storage", {
  storage_key: {
    type: DataTypes.STRING(80),
    primaryKey: true,
    allowNull: false
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "[]"
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  timestamps: false,
  createdAt: false,
  updatedAt: "updated_at"
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`${DB_DIALECT.toUpperCase()} conectado e banco sincronizado.`);
  } catch (erro) {
    console.error(`Erro ao conectar ao ${DB_DIALECT.toUpperCase()}:`, erro);
    throw erro;
  }
}

function assertStorageKey(key) {
  if (!STORAGE_KEYS.has(key)) {
    const erro = new Error("Categoria de dados invalida.");
    erro.statusCode = 400;
    throw erro;
  }
}

function parsePayload(payload) {
  try {
    const data = JSON.parse(payload || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Health check
app.get("/api/health", async (_req, res, next) => {
  try {
    await sequelize.authenticate();
    const databaseInfo = DB_DIALECT === "sqlite" ? "SQLite - analise_performance.db" : `MySQL - ${sequelizeOptions.host}:${sequelizeOptions.port}/${sequelizeOptions.database}`;
    res.json({ ok: true, database: databaseInfo });
  } catch (erro) {
    next(erro);
  }
});

// Obter todos os dados
app.get("/api/storage", async (_req, res, next) => {
  try {
    const rows = await AppStorage.findAll({ raw: true });
    const dados = {};
    STORAGE_KEYS.forEach((key) => {
      dados[key] = [];
    });
    rows.forEach((row) => {
      dados[row.storage_key] = parsePayload(row.payload);
    });
    res.json(dados);
  } catch (erro) {
    next(erro);
  }
});

// Obter dados de uma chave específica
app.get("/api/storage/:key", async (req, res, next) => {
  try {
    const key = req.params.key;
    assertStorageKey(key);
    const row = await AppStorage.findByPk(key, { raw: true });
    res.json(row ? parsePayload(row.payload) : []);
  } catch (erro) {
    next(erro);
  }
});

// Atualizar dados de uma chave
app.put("/api/storage/:key", async (req, res, next) => {
  try {
    const key = req.params.key;
    assertStorageKey(key);
    const data = Array.isArray(req.body?.data) ? req.body.data : [];
    await AppStorage.upsert({
      storage_key: key,
      payload: JSON.stringify(data),
      updated_at: new Date()
    });
    res.json({ ok: true, key, total: data.length });
  } catch (erro) {
    next(erro);
  }
});

// Bulk update com transação
app.post("/api/storage/bulk", async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const dados = req.body?.data || {};
    for (const [key, lista] of Object.entries(dados)) {
      assertStorageKey(key);
      await AppStorage.upsert({
        storage_key: key,
        payload: JSON.stringify(Array.isArray(lista) ? lista : []),
        updated_at: new Date()
      }, { transaction });
    }
    await transaction.commit();
    res.json({ ok: true });
  } catch (erro) {
    await transaction.rollback();
    next(erro);
  }
});

const STORAGE_API_MAP = {
  [STORAGE_KEY]: "historico",
  [MULTAS_KEY]: "multas",
  [ADVERTENCIAS_KEY]: "advertencias",
  [AVARIAS_KEY]: "avarias",
  [MOTORISTAS_KEY]: "motoristas",
  [MOTORISTAS_STATUS_KEY]: "motoristasStatus",
  [VEICULOS_KEY]: "veiculos",
  [TRAJETOS_KEY]: "trajetos",
  [DIAGNOSTICOS_KEY]: "diagnosticos",
  [FICHAS_KEY]: "fichas"
};

// Obter dados consolidados para o frontend
app.get("/api/dados", async (_req, res, next) => {
  try {
    const rows = await AppStorage.findAll({ raw: true });
    const dados = {
      historico: [],
      multas: [],
      advertencias: [],
      avarias: [],
      motoristas: [],
      motoristasStatus: [],
      veiculos: [],
      trajetos: [],
      diagnosticos: [],
      fichas: []
    };
    rows.forEach((row) => {
      const nome = STORAGE_API_MAP[row.storage_key];
      if (nome) {
        try {
          dados[nome] = JSON.parse(row.payload || "[]");
        } catch {
          dados[nome] = [];
        }
      }
    });
    res.json(dados);
  } catch (erro) {
    next(erro);
  }
});

// Salvar dados do cliente no banco
app.post("/api/salvar", async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const dados = req.body || {};
    for (const [key, lista] of Object.entries(dados)) {
      assertStorageKey(key);
      await AppStorage.upsert({
        storage_key: key,
        payload: JSON.stringify(Array.isArray(lista) ? lista : []),
        updated_at: new Date()
      }, { transaction });
    }
    await transaction.commit();
    res.json({ ok: true });
  } catch (erro) {
    await transaction.rollback();
    next(erro);
  }
});

// Servir arquivos estáticos
app.use(express.static(PUBLIC_DIR));

// Tratamento de erros
app.use((erro, _req, res, _next) => {
  const status = erro.statusCode || 500;
  console.error(erro);
  res.status(status).json({ ok: false, error: erro.message || "Erro interno" });
});

// Iniciar servidor
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Analise de Performance rodando em http://127.0.0.1:${PORT}`);
      if (DB_DIALECT === "sqlite") {
        console.log(`✓ Banco de dados: SQLite (analise_performance.db)`);
      } else {
        console.log(`✓ Banco de dados: MySQL (${sequelizeOptions.host}:${sequelizeOptions.port}/${sequelizeOptions.database})`);
      }
    });
  })
  .catch((erro) => {
    console.error("✗ Nao foi possivel iniciar o servidor.");
    console.error(erro);
    process.exit(1);
  });
