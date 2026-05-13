const FABRICANTES = {
  scania: "SCANIA",
  volvo: "VOLVO",
  mercedes: "MERCEDES BENZ",
  vw: "VOLKSWAGEN",
  iveco: "IVECO",
  man: "MAN"
};

const MODELOS = {
  scania: { R450: 2.72, R540: 2.55, R500: 2.63, S450: 2.78, S500: 2.65, P360: 2.40, G410: 2.50, G450: 2.56 },
  volvo: { FH460: 2.74, FH540: 2.56, FH500: 2.68, FM370: 2.30, FM460: 2.55, FMX440: 2.35, FMX500: 2.28 },
  mercedes: { "NEW ACTROS 2546": 2.62, "NEW ACTROS 2648": 2.45, "ACTROS 2644": 2.40, "ACTROS 2651": 2.45, "AROCS 3348": 2.15, "AXOR 2544": 2.35 },
  vw: { "METEOR 28460": 2.12, "METEOR 33460": 2.05, "CONSTELLATION 24280": 2.20, "DELIVERY 11.180": 2.80, "EXPRESS DRC 4X2": 2.80, "WORKER 26290": 2.10 },
  iveco: { "S-WAY 540": 2.55, "STRALIS HI-WAY 570": 2.48, "TECTOR 240E28": 2.65, "EUROCARGO 170E28": 2.70 },
  man: { "TGX 28.480": 2.60, "TGS 26.440": 2.45, "TGM 15.250": 2.70, "TGX 33.540": 2.42 }
};

const FATOR_TRACAO = { "6x2": 1.00, "6x4": 0.93, "4x2": 1.08, "8x2": 0.97, "8x4": 0.88 };

const PROBLEMAS = [
  { id: "pneu", name: "Pneus desgastados ou calibracao errada", media: -4, nota: -5, desc: "-4% media - resistencia ao rolamento" },
  { id: "filtroAr", name: "Filtro de ar entupido / sujo", media: -8, nota: -8, desc: "-8% media - motor trabalha forcado" },
  { id: "injetor", name: "Injetor com problema ou desgastado", media: -15, nota: -12, desc: "-15% media - queima incompleta" },
  { id: "arrefec", name: "Sistema de arrefecimento com defeito", media: -4, nota: -3, desc: "-4% media - risco de superaquecimento" },
  { id: "alinha", name: "Desalinhamento / desbalanceamento de rodas", media: -5, nota: -6, desc: "-5% media - resistencia e desgaste" },
  { id: "freio", name: "Freios arrastando / regulagem incorreta", media: -12, nota: -10, desc: "-12% media - arrasto constante" },
  { id: "rolam", name: "Rolamentos danificados", media: -6, nota: -5, desc: "-6% media - aumenta atrito mecanico" },
  { id: "turbo", name: "Turbo com vazamento ou falha", media: -11, nota: -10, desc: "-11% media - perda de pressao de ar" },
  { id: "motor", name: "Motor com desgaste excessivo", media: -20, nota: -15, desc: "-20% media - perda de compressao" },
  { id: "egr", name: "EGR / DPF / SCR com falha ou entupimento", media: -7, nota: -8, desc: "-7% media - contrapressao" },
  { id: "caixa", name: "Problema na caixa de cambio", media: -9, nota: -8, desc: "-9% media - trocas inadequadas" },
  { id: "eletrica", name: "Problema eletrico ou de sensor", media: -3, nota: -5, desc: "-3% media - leituras imprecisas" }
];

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
const BACKUP_KEYS = [STORAGE_KEY, MULTAS_KEY, ADVERTENCIAS_KEY, AVARIAS_KEY, OCORRENCIAS_KEY, MOTORISTAS_KEY, MOTORISTAS_STATUS_KEY, VEICULOS_KEY, TRAJETOS_KEY, DIAGNOSTICOS_KEY, FICHAS_KEY, TELEMETRIA_KEY];
const PESOS_RANKING_MOTORISTA = {
  consumo: 35,
  gobrax: 35,
  multas: 10,
  advertencias: 10,
  avarias: 10
};
const FROTA_STATUS_CAMPOS = [
  { id: "rastreador", label: "Rastreador" },
  { id: "tablet", label: "Tablet" },
  { id: "cameras", label: "Câmeras" },
  { id: "telemetria", label: "Telemetria" },
  { id: "mecanico", label: "Mecânico" },
  { id: "borracharia", label: "Borracharia" },
  { id: "eletrico", label: "Elétrico" }
];
const INFRACOES_MULTA = Array.from(new Set([
  "Transitar em velocidade superior a maxima permitida em ate 20%",
  "Transitar em velocidade superior a maxima permitida em mais de 20% ate 50%",
  "Transitar em velocidade superior a maxima permitida em mais de 50%",
  "Avancar o sinal vermelho do semaforo",
  "Deixar de usar o cinto de seguranca",
  "Conduzir veiculo segurando ou manuseando telefone celular",
  "Estacionar em local/horario proibido",
  "Parar sobre faixa de pedestres na mudanca de sinal luminoso",
  "Transitar em local/horario nao permitido pela regulamentacao",
  "Transitar com o veiculo em faixa ou pista exclusiva",
  "Executar operacao de conversao em local proibido",
  "Ultrapassar pela contramao em local proibido",
  "Deixar de conservar o veiculo na faixa a ele destinada",
  "Conduzir veiculo com equipamento obrigatorio ineficiente ou inoperante",
  "Conduzir veiculo em mau estado de conservacao",
  "Conduzir veiculo com licenciamento vencido",
  "Conduzir veiculo com excesso de peso",
  "Evadir-se para nao efetuar o pagamento do pedagio",
  "Deixar de dar preferencia de passagem a pedestre",
  "Nao identificar o condutor infrator no prazo legal"
])).sort((a, b) => a.localeCompare(b, "pt-BR"));

let graficoMedia = null;
let graficoProblemas = null;
let dadosOfensoresImportados = null;
let workbookOfensoresImportado = null;
let nomeArquivoOfensoresImportado = "";
let diagnosticoOfensoresAtual = null;
let workbookMultasImportado = null;
let bancoDisponivel = false;
let sincronizacaoBancoAtiva = false;
let timerPersistenciaBanco = null;
const pendenciasBanco = new Map();
const TEMPO_TRANSICAO_GUIA_MS = 1000;
let timerTransicaoOperacao = null;
let suprimirTransicaoOperacao = false;

document.addEventListener("DOMContentLoaded", iniciarAplicacao);

async function iniciarAplicacao() {
  await carregarDadosBanco();
}

// Funções compartilhadas
function instalarTransicaoNavegacao() {
  if (!document.getElementById("page-transition")) {
    const overlay = document.createElement("div");
    overlay.id = "page-transition";
    overlay.className = "page-transition";
    overlay.innerHTML = `
      <div class="transition-panel">
        <div class="transition-icon-wrap">
          <div class="code-icon">&lt;/&gt;</div>
        </div>
        <div class="transition-truck-wrap" aria-hidden="true">
          <img class="transition-truck" src="assets/codigo-do-laptop.svg" alt="">
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  requestAnimationFrame(() => document.body.classList.add("page-ready"));
  instalarTransicaoAcoes();

  document.querySelectorAll('.topbar-actions a[href$=".html"], a.btn[href$=".html"]').forEach((link) => {
    if (link.dataset.transitionReady === "1") return;
    link.dataset.transitionReady = "1";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const overlay = document.getElementById("page-transition");
      if (overlay) {
        overlay.classList.add("active");
        setTimeout(() => {
          window.location.href = link.href;
        }, 600);
      } else {
        window.location.href = link.href;
      }
    });
  });
}

function mostrarTransicaoOperacao(duracao = TEMPO_TRANSICAO_GUIA_MS) {
  if (suprimirTransicaoOperacao) return;
  instalarTransicaoNavegacao();
  const overlay = document.getElementById("page-transition");
  if (!overlay) return;

  overlay.classList.remove("active");
  void overlay.offsetWidth;
  overlay.classList.add("active");

  if (timerTransicaoOperacao) clearTimeout(timerTransicaoOperacao);
  timerTransicaoOperacao = setTimeout(() => {
    overlay.classList.remove("active");
  }, duracao);
}

function registrarTransicaoOperacao() {
  if (suprimirTransicaoOperacao) return;
  setTimeout(() => mostrarTransicaoOperacao(), 0);
}

function instalarTransicaoAcoes() {
  if (document.body.dataset.operationTransitionReady === "1") return;
  document.body.dataset.operationTransitionReady = "1";
  document.addEventListener("click", (event) => {
    const alvo = event.target.closest("button, a.btn");
    if (!alvo || alvo.closest(".topbar-actions") || alvo.closest("#app-message-modal")) return;
    const texto = (alvo.textContent || "").trim().toLowerCase();
    if (texto.includes("limpar")) {
      setTimeout(() => registrarTransicaoOperacao(), 0);
    }
  });
}

async function carregarDadosBanco() {
  try {
    const response = await fetch('/api/dados', { cache: 'no-store' });
    if (!response.ok) throw new Error('Erro ao carregar dados do banco');

    const dados = await response.json();
    suprimirTransicaoOperacao = true;
    bancoDisponivel = true;
    sincronizacaoBancoAtiva = true;

    sincronizarDadoBanco(STORAGE_KEY, dados.historico, setHistorico);
    sincronizarDadoBanco(MULTAS_KEY, dados.multas);
    sincronizarDadoBanco(ADVERTENCIAS_KEY, dados.advertencias);
    sincronizarDadoBanco(AVARIAS_KEY, dados.avarias);
    sincronizarDadoBanco(OCORRENCIAS_KEY, dados.ocorrencias);
    sincronizarDadoBanco(MOTORISTAS_KEY, dados.motoristas);
    sincronizarDadoBanco(MOTORISTAS_STATUS_KEY, dados.motoristasStatus);
    sincronizarDadoBanco(VEICULOS_KEY, dados.veiculos);
    sincronizarDadoBanco(TRAJETOS_KEY, dados.trajetos);
    sincronizarDadoBanco(DIAGNOSTICOS_KEY, dados.diagnosticos);
    sincronizarDadoBanco(FICHAS_KEY, dados.fichas, setControleFicha);
    sincronizarDadoBanco(TELEMETRIA_KEY, dados.telemetria);

    suprimirTransicaoOperacao = false;
    atualizarInterfacesCompartilhadas();
    console.log('Dados carregados do banco com sucesso');
  } catch (error) {
    suprimirTransicaoOperacao = false;
    bancoDisponivel = false;
    sincronizacaoBancoAtiva = false;
    console.error('Erro ao carregar dados do banco:', error);
  }
}

function dadoTemConteudo(dado) {
  if (Array.isArray(dado)) return dado.length > 0;
  if (dado && typeof dado === "object") return Object.keys(dado).length > 0;
  return false;
}

function sincronizarDadoBanco(chave, remoto, setter = null) {
  if (remoto === undefined || remoto === null) return;
  const localRaw = localStorage.getItem(chave);
  const local = localRaw ? JSON.parse(localRaw) : (Array.isArray(remoto) ? [] : {});

  if (dadoTemConteudo(remoto) || !dadoTemConteudo(local)) {
    if (setter) setter(remoto);
    else setListaStorage(chave, Array.isArray(remoto) ? remoto : []);
    return;
  }

  persistirListaBanco(chave, local);
}

function getHistorico() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setHistorico(hist) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hist));
  persistirListaBanco(STORAGE_KEY, hist);
  registrarTransicaoOperacao();
}

function getListaStorage(chave) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === "object") return Object.values(valor);
    return [];
  } catch {
    return [];
  }
}

function setListaStorage(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
  persistirListaBanco(chave, lista);
  registrarTransicaoOperacao();
}

function getControleFicha() {
  const dados = JSON.parse(localStorage.getItem(FICHAS_KEY) || "{}");
  if (Array.isArray(dados)) return { estoque: {}, requisicoes: dados };
  return {
    estoque: dados.estoque || {},
    requisicoes: dados.requisicoes || []
  };
}

function setControleFicha(dados) {
  localStorage.setItem(FICHAS_KEY, JSON.stringify(dados));
  persistirListaBanco(FICHAS_KEY, dados);
  registrarTransicaoOperacao();
}

function persistirListaBanco(chave, lista) {
  if (!bancoDisponivel || !sincronizacaoBancoAtiva) return;

  const chavePendencia = `lista_${chave}`;
  pendenciasBanco.set(chavePendencia, { chave, lista, timestamp: Date.now() });

  if (timerPersistenciaBanco) clearTimeout(timerPersistenciaBanco);
  timerPersistenciaBanco = setTimeout(enviarPendenciasBanco, 2000);
}

async function enviarPendenciasBanco() {
  if (!bancoDisponivel || pendenciasBanco.size === 0) return;

  const dadosParaEnviar = {};
  for (const [chavePendencia, dados] of pendenciasBanco) {
    dadosParaEnviar[dados.chave] = dados.lista;
  }

  try {
    const response = await fetch('/api/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosParaEnviar)
    });

    if (response.ok) {
      pendenciasBanco.clear();
      console.log('Dados salvos no banco com sucesso');
    } else {
      console.error('Erro ao salvar dados no banco:', response.status);
    }
  } catch (error) {
    console.error('Erro na requisição para salvar dados:', error);
  }
}

function exportarBackup() {
  const backup = {};
  BACKUP_KEYS.forEach(chave => {
    backup[chave] = getListaStorage(chave);
  });
  backup.timestamp = new Date().toISOString();

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-analise-performance-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);

      BACKUP_KEYS.forEach(chave => {
        if (backup[chave]) {
          setListaStorage(chave, backup[chave]);
        }
      });

      recarregarInterfaceAposBackup();
      mostrarMensagem('Backup importado com sucesso!', 'Backup');
    } catch (error) {
      mostrarMensagem('Erro ao importar backup: arquivo inválido', 'Erro');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function recarregarInterfaceAposBackup() {
  // Função a ser implementada nas páginas específicas
  if (typeof window.recargaEspecificaBackup === 'function') {
    window.recargaEspecificaBackup();
  }
}

function garantirModalMensagem() {
  if (document.getElementById("app-message-modal")) return;
  const modal = document.createElement("div");
  modal.className = "modal-backdrop app-message-backdrop";
  modal.id = "app-message-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-panel app-message-panel" role="dialog" aria-modal="true" aria-labelledby="app-message-title">
      <div class="card-header">
        <span class="card-title" id="app-message-title">Mensagem</span>
        <button class="btn btn-sm app-message-close" type="button">Fechar</button>
      </div>
      <div class="app-message-body" id="app-message-body"></div>
      <div class="modal-actions" id="app-message-actions"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

function mostrarMensagem(mensagem, titulo = "Mensagem") {
  garantirModalMensagem();
  const modal = document.getElementById("app-message-modal");
  const title = document.getElementById("app-message-title");
  const body = document.getElementById("app-message-body");
  const actions = document.getElementById("app-message-actions");
  const close = modal.querySelector(".app-message-close");

  title.textContent = titulo;
  body.textContent = mensagem;
  actions.innerHTML = '<button class="btn btn-sm btn-green" type="button" data-app-message-ok>OK</button>';
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  const fechar = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  };
  close.onclick = fechar;
  actions.querySelector("[data-app-message-ok]").onclick = fechar;
}

function confirmarAcao(mensagem, titulo = "Confirmar ação", textoConfirmar = "Excluir") {
  garantirModalMensagem();
  const modal = document.getElementById("app-message-modal");
  const title = document.getElementById("app-message-title");
  const body = document.getElementById("app-message-body");
  const actions = document.getElementById("app-message-actions");
  const close = modal.querySelector(".app-message-close");

  title.textContent = titulo;
  body.textContent = mensagem;
  actions.innerHTML = `
    <button class="btn btn-sm" type="button" data-app-message-cancel>Cancelar</button>
    <button class="btn btn-sm btn-red" type="button" data-app-message-confirm>${textoConfirmar}</button>
  `;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    const fechar = (valor) => {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      resolve(valor);
    };
    close.onclick = () => fechar(false);
    actions.querySelector("[data-app-message-cancel]").onclick = () => fechar(false);
    actions.querySelector("[data-app-message-confirm]").onclick = () => fechar(true);
  });
}

function getMotoristas() {
  const motoristas = getListaStorage(MOTORISTAS_KEY)
    .map((motorista) => typeof motorista === "string" ? { nome: motorista } : motorista)
    .filter((motorista) => motorista && motorista.nome);
  if (motoristas.length) return motoristas;
  return recuperarMotoristasDeRegistros();
}

function recuperarMotoristasDeRegistros() {
  const nomes = new Set();
  const fontes = [
    getListaStorage(STORAGE_KEY),
    getListaStorage(MULTAS_KEY),
    getListaStorage(ADVERTENCIAS_KEY),
    getListaStorage(AVARIAS_KEY),
    getListaStorage(OCORRENCIAS_KEY),
    getListaStorage(MOTORISTAS_STATUS_KEY),
    getListaStorage(TELEMETRIA_KEY)
  ];

  fontes.flat().forEach((item) => {
    const nome = item?.motorista || item?.nomeMotorista || item?.condutor || item?.driver;
    if (nome && nome !== "Não informado" && nome !== "Nao informado") nomes.add(String(nome).trim());
  });

  const recuperados = Array.from(nomes)
    .filter(Boolean)
    .map((nome, index) => ({ id: `REC-${index + 1}`, nome, origem: "Registros existentes" }));

  if (recuperados.length) setListaStorage(MOTORISTAS_KEY, recuperados);
  return recuperados;
}

function getStatusMotoristas() {
  return getListaStorage(MOTORISTAS_STATUS_KEY);
}

function getVeiculos() {
  return getListaStorage(VEICULOS_KEY);
}

function getTrajetos() {
  return getListaStorage(TRAJETOS_KEY);
}

function preencherCadastrosCompartilhados() {
  preencherSelectMotoristas();
  preencherSelectVeiculos();
  preencherSelectTrajetos();
}

function preencherSelectTrajetos() {
  const trajetos = getTrajetos();
  document.querySelectorAll('select#trajeto-registro, select[data-trajetos="true"]').forEach(select => {
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione um trajeto</option>';
    trajetos.forEach(trajeto => {
      const option = document.createElement('option');
      option.value = trajeto.id;
      option.textContent = `${trajeto.origem} → ${trajeto.destino}`;
      select.appendChild(option);
    });
    if (valorAtual) select.value = valorAtual;
  });
}

function preencherSelectMotoristas() {
  const motoristas = getMotoristas();
  document.querySelectorAll('select[id*="motorista"]').forEach(select => {
    if (select.id.includes("situacao") || select.id.includes("filtro")) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione um motorista</option>';
    motoristas.forEach(motorista => {
      const option = document.createElement('option');
      option.value = motorista.nome;
      option.textContent = motorista.nome;
      select.appendChild(option);
    });
    if (valorAtual) select.value = valorAtual;
  });
}

function preencherSelectVeiculos() {
  const veiculos = getVeiculos();
  document.querySelectorAll('select[id*="placa"], select[id*="veiculo"]').forEach((select) => {
    if (select.id.includes("modelo") || select.id.includes("fab") || select.id.includes("trajeto") || select.id.includes("filtro")) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione uma placa</option>';
    veiculos.forEach((veiculo) => {
      if (!veiculo.placa) return;
      const option = document.createElement("option");
      option.value = veiculo.placa;
      option.textContent = veiculo.placa;
      select.appendChild(option);
    });
    if (valorAtual) select.value = valorAtual;
  });
}

function salvarMotoristaCompartilhado(nome) {
  const nomeLimpo = (nome || "").trim();
  if (!nomeLimpo) return false;

  const motoristas = getMotoristas();
  const jaExiste = motoristas.some((motorista) => motorista.nome.toLowerCase() === nomeLimpo.toLowerCase());
  if (jaExiste) {
    mostrarMensagem("Este motorista ja esta cadastrado.", "Atenção");
    return false;
  }

  motoristas.push({
    id: `MOT-${Date.now()}`,
    nome: nomeLimpo,
    criadoEm: new Date().toISOString()
  });
  setListaStorage(MOTORISTAS_KEY, motoristas);
  atualizarInterfacesCompartilhadas();
  return true;
}

function cadastrarMotorista() {
  const modal = document.getElementById("motorista-modal");
  const input = document.getElementById("motorista-novo-nome");
  if (!modal || !input) {
    const nome = prompt("Nome do motorista:");
    if (nome && salvarMotoristaCompartilhado(nome)) atualizarInterfacesCompartilhadas();
    return;
  }
  input.value = "";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => input.focus(), 50);
}

function fecharModalMotorista() {
  const modal = document.getElementById("motorista-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function salvarMotoristaModal() {
  const input = document.getElementById("motorista-novo-nome");
  const nome = input?.value.trim();
  if (!nome) {
    mostrarMensagem("Informe o nome do motorista.", "Atenção");
    return;
  }
  if (salvarMotoristaCompartilhado(nome)) {
    selecionarMotoristaNaTela(nome);
    fecharModalMotorista();
  }
}

async function excluirMotoristaSelecionado(selectId) {
  const select = document.getElementById(selectId);
  const nome = select?.value;
  if (!nome) {
    mostrarMensagem("Selecione um motorista para excluir.", "Atenção");
    return;
  }
  if (!await confirmarAcao(`Excluir o motorista ${nome}?`)) return;

  const motoristas = getMotoristas().filter((motorista) => motorista.nome !== nome);
  setListaStorage(MOTORISTAS_KEY, motoristas);
  atualizarInterfacesCompartilhadas();
}

async function excluirVeiculoSelecionado(selectId) {
  const select = document.getElementById(selectId);
  const placa = select?.value;
  if (!placa) {
    mostrarMensagem("Selecione uma placa para excluir.", "Atenção");
    return;
  }
  if (!await confirmarAcao(`Excluir o veiculo ${placa}?`)) return;

  const veiculos = getVeiculos().filter((veiculo) => (veiculo.placa || "").toUpperCase() !== placa.toUpperCase());
  setListaStorage(VEICULOS_KEY, veiculos);
  atualizarInterfacesCompartilhadas();
}

function atualizarInterfacesCompartilhadas() {
  preencherSelectMotoristas();
  preencherSelectVeiculos();
  preencherSelectTrajetos();
  if (typeof popularSelectTelemetria === "function") popularSelectTelemetria();
  if (typeof renderizarCadastros === "function") renderizarCadastros();
  if (typeof renderizarControleMotoristas === "function") renderizarControleMotoristas();
  if (typeof preencherFiltrosControleFrota === "function") preencherFiltrosControleFrota();
  if (typeof renderizarSituacaoVeiculos === "function") renderizarSituacaoVeiculos();
}

function selecionarMotoristaNaTela(nome) {
  const selects = Array.from(document.querySelectorAll('select[id*="motorista"]'))
    .filter((select) => !select.id.includes("situacao") && !select.id.includes("filtro"));
  const selectPrincipal = selects.find((select) => select.offsetParent !== null) || selects[0];
  if (selectPrincipal) selectPrincipal.value = nome;
}
