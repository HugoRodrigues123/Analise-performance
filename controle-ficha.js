// Funções específicas da página controle-ficha.html

function inicializarControleFicha() {
  preencherFormularioEstoqueFicha();
  setValorCampo("ficha-data", isoHoje());
  setValorCampo("disco-data", isoHoje());
  setValorCampo("bobina-data", isoHoje());
  setValorCampo("baixa-ficha-data", isoHoje());
  setValorCampo("baixa-disco-data", isoHoje());
  setValorCampo("baixa-bobina-data", isoHoje());
  setValorCampo("ficha-unidade", valorCampo("ficha-unidade") || "Unidade");
  setValorCampo("disco-unidade", valorCampo("disco-unidade") || "Unidade");
  setValorCampo("bobina-unidade", valorCampo("bobina-unidade") || "Unidade");
  setValorCampo("baixa-ficha-unidade", valorCampo("baixa-ficha-unidade") || "Unidade");
  setValorCampo("baixa-disco-unidade", valorCampo("baixa-disco-unidade") || "Unidade");
  setValorCampo("baixa-bobina-unidade", valorCampo("baixa-bobina-unidade") || "Unidade");
  preencherIdentificadoresRequisicao();
  alternarMovimentacaoFicha("requisicao");
  renderizarControleFicha();
}

function alternarMovimentacaoFicha(modo) {
  const requisicaoAtiva = modo !== "baixa";
  document.getElementById("ficha-mov-requisicao")?.classList.toggle("hidden", !requisicaoAtiva);
  document.getElementById("ficha-mov-baixa")?.classList.toggle("hidden", requisicaoAtiva);
  document.getElementById("ficha-tab-requisicao")?.classList.toggle("active", requisicaoAtiva);
  document.getElementById("ficha-tab-baixa")?.classList.toggle("active", !requisicaoAtiva);
}

function preencherFormularioEstoqueFicha() {
  const dados = getControleFicha();
  setValorCampo("estoque-fichas", dados.estoque?.fichas || 0);
  setValorCampo("estoque-discos", dados.estoque?.discos || 0);
  setValorCampo("estoque-bobinas", dados.estoque?.bobinas || 0);
}

function salvarEstoqueFicha() {
  const dados = getControleFicha();
  dados.estoque = {
    fichas: numeroCampo("estoque-fichas"),
    discos: numeroCampo("estoque-discos"),
    bobinas: numeroCampo("estoque-bobinas")
  };
  setControleFicha(dados);
  renderizarControleFicha();
}

function salvarRequisicaoFicha(tipo) {
  const config = {
    ficha: { label: "Ficha", prefixo: "FIC", data: "ficha-data", quantidade: "ficha-quantidade", unidade: "ficha-unidade", identificador: "ficha-identificador" },
    disco: { label: "Disco de tacógrafo", prefixo: "DIS", data: "disco-data", quantidade: "disco-quantidade", unidade: "disco-unidade", identificador: "disco-identificador" },
    bobina: { label: "Bobina", prefixo: "BOB", data: "bobina-data", quantidade: "bobina-quantidade", unidade: "bobina-unidade", identificador: "bobina-identificador", tipoBobina: "bobina-tipo" }
  }[tipo];
  if (!config) return;
  const quantidade = numeroCampo(config.quantidade);
  const dataISO = valorCampo(config.data);
  const unidade = valorCampo(config.unidade) || "Unidade";
  const tipoBobina = config.tipoBobina ? valorCampo(config.tipoBobina) : "";
  if (!dataISO || quantidade <= 0) {
    mostrarMensagem("Informe a data e uma quantidade maior que zero.", "Atenção");
    return;
  }
  const dados = getControleFicha();
  const identificador = gerarIdentificadorRequisicao(dados, tipo, config.prefixo);
  const estoqueKey = { ficha: "fichas", disco: "discos", bobina: "bobinas" }[tipo];
  dados.estoque = dados.estoque || {};
  dados.estoque[estoqueKey] = Number(dados.estoque[estoqueKey] || 0) + quantidade;
  dados.requisicoes = dados.requisicoes || [];
  dados.requisicoes.unshift({
    id: String(Date.now()),
    tipo,
    label: config.label,
    identificador,
    dataISO,
    quantidade,
    unidade,
    tipoBobina
  });
  setControleFicha(dados);
  limparCampos([config.quantidade, config.identificador]);
  setValorCampo(config.data, isoHoje());
  setValorCampo(config.unidade, unidade);
  preencherFormularioEstoqueFicha();
  preencherIdentificadoresRequisicao();
  renderizarControleFicha();
}

async function salvarBaixaFicha(tipo) {
  const config = {
    ficha: { label: "Ficha", prefixo: "BX-FIC", data: "baixa-ficha-data", quantidade: "baixa-ficha-quantidade", unidade: "baixa-ficha-unidade", identificador: "baixa-ficha-identificador" },
    disco: { label: "Disco de tacógrafo", prefixo: "BX-DIS", data: "baixa-disco-data", quantidade: "baixa-disco-quantidade", unidade: "baixa-disco-unidade", identificador: "baixa-disco-identificador" },
    bobina: { label: "Bobina", prefixo: "BX-BOB", data: "baixa-bobina-data", quantidade: "baixa-bobina-quantidade", unidade: "baixa-bobina-unidade", identificador: "baixa-bobina-identificador", tipoBobina: "baixa-bobina-tipo" }
  }[tipo];
  if (!config) return;
  const quantidade = numeroCampo(config.quantidade);
  const dataISO = valorCampo(config.data);
  const unidade = valorCampo(config.unidade) || "Unidade";
  const tipoBobina = config.tipoBobina ? valorCampo(config.tipoBobina) : "";
  if (!dataISO || quantidade <= 0) {
    mostrarMensagem("Informe a data e uma quantidade maior que zero.", "Atenção");
    return;
  }
  const dados = getControleFicha();
  const estoqueKey = { ficha: "fichas", disco: "discos", bobina: "bobinas" }[tipo];
  const saldoAtual = Number(dados.estoque?.[estoqueKey] || 0);
  if (quantidade > saldoAtual && !await confirmarAcao("A quantidade da baixa é maior que o estoque atual. Deseja continuar e zerar o estoque?", "Confirmar baixa", "Continuar")) return;
  const identificador = gerarIdentificadorRequisicao(dados, tipo, config.prefixo);
  dados.estoque = dados.estoque || {};
  dados.estoque[estoqueKey] = Math.max(0, saldoAtual - quantidade);
  dados.requisicoes = dados.requisicoes || [];
  dados.requisicoes.unshift({
    id: String(Date.now()),
    tipo,
    label: config.label,
    operacao: "Baixa",
    identificador,
    dataISO,
    quantidade,
    unidade,
    tipoBobina
  });
  setControleFicha(dados);
  limparCampos([config.quantidade, config.identificador]);
  setValorCampo(config.data, isoHoje());
  setValorCampo(config.unidade, unidade);
  preencherFormularioEstoqueFicha();
  preencherIdentificadoresRequisicao();
  renderizarControleFicha();
}

function gerarIdentificadorRequisicao(dados, tipo, prefixo) {
  const requisicoes = dados.requisicoes || [];
  const maiorNumero = requisicoes.reduce((maior, item) => {
    if (item.tipo !== tipo || !item.identificador || !String(item.identificador).startsWith(`${prefixo}-`)) return maior;
    const match = String(item.identificador).match(/-(\d+)$/);
    const numero = match ? Number.parseInt(match[1], 10) : 0;
    return Number.isFinite(numero) ? Math.max(maior, numero) : maior;
  }, 0);
  return `${prefixo}-${String(maiorNumero + 1).padStart(4, "0")}`;
}

function preencherIdentificadoresRequisicao() {
  const dados = getControleFicha();
  const configs = [
    { tipo: "ficha", prefixo: "FIC", campo: "ficha-identificador" },
    { tipo: "bobina", prefixo: "BOB", campo: "bobina-identificador" },
    { tipo: "disco", prefixo: "DIS", campo: "disco-identificador" },
    { tipo: "ficha", prefixo: "BX-FIC", campo: "baixa-ficha-identificador" },
    { tipo: "bobina", prefixo: "BX-BOB", campo: "baixa-bobina-identificador" },
    { tipo: "disco", prefixo: "BX-DIS", campo: "baixa-disco-identificador" }
  ];
  configs.forEach((config) => {
    setValorCampo(config.campo, gerarIdentificadorRequisicao(dados, config.tipo, config.prefixo));
  });
}

async function excluirRequisicaoFicha(id) {
  if (!await confirmarAcao("Excluir esta requisição?")) return;
  const dados = getControleFicha();
  dados.requisicoes = (dados.requisicoes || []).filter((item) => item.id !== id);
  setControleFicha(dados);
  renderizarControleFicha();
}

function renderizarControleFicha() {
  const container = document.getElementById("controle-ficha-lista");
  if (!container) return;
  const dados = getControleFicha();
  const estoque = dados.estoque || {};
  setValorCampo("estoque-fichas", estoque.fichas || 0);
  setValorCampo("estoque-discos", estoque.discos || 0);
  setValorCampo("estoque-bobinas", estoque.bobinas || 0);

  const requisicoes = dados.requisicoes || [];
  const busca = valorCampo("ficha-busca-historico");
  const requisicoesFiltradas = requisicoes.filter((item) => {
    if (!busca) return true;
    const termos = [
      item.identificador,
      item.label,
      item.tipo,
      item.operacao,
      item.unidade,
      item.tipoBobina,
      item.quantidade,
      item.dataISO,
      formatarDataISO(item.dataISO)
    ].join(" ");
    return contemBusca(termos, busca);
  });

  container.innerHTML = requisicoesFiltradas.length ? requisicoesFiltradas.map((item) => {
    const unidade = item.unidade || "un.";
    const identificador = item.identificador || item.id || "Sem identificador";
    const operacao = item.operacao || "Requisição";
    const classeOperacao = operacao === "Baixa" ? "r-cr" : "r-bo";
    const detalheTipo = item.tipo === "bobina" && item.tipoBobina ? ` - Tipo ${escapeHtml(item.tipoBobina)}` : "";
    return `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.label || item.tipo)} - ${escapeHtml(operacao)}</span>
        <span class="status-pill ${classeOperacao} ficha-qty-pill">${Number(item.quantidade || 0).toLocaleString("pt-BR")} ${escapeHtml(unidade)}</span>
      </div>
      <div class="ops-entry-meta">ID ${escapeHtml(identificador)} - ${escapeHtml(operacao)} em ${formatarDataISO(item.dataISO)}${detalheTipo}</div>
      <div class="ops-entry-actions"><button class="btn btn-sm btn-red ficha-delete-btn" type="button" onclick="excluirRequisicaoFicha('${escapeAttr(item.id)}')">Excluir</button></div>
    </div>
  `;
  }).join("") : '<div class="ops-empty">Nenhuma requisição encontrada.</div>';
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarControleFicha();
});

function isoHoje() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor ?? "";
}

function numeroCampo(id) {
  const valor = Number.parseFloat(valorCampo(id).replace(",", "."));
  return Number.isFinite(valor) ? valor : 0;
}

function limparCampos(ids) {
  ids.forEach((id) => setValorCampo(id, ""));
}

function formatarDataISO(dataISO) {
  if (!dataISO) return "-";
  const partes = String(dataISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`;
  return dataISO;
}

function contemBusca(texto, busca) {
  return String(texto || "").toLowerCase().includes(String(busca || "").toLowerCase());
}

function escapeAttr(valor) {
  return String(valor || "").replace(/"/g, "&quot;");
}

function escapeHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
