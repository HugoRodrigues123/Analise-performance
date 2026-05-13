let anexosOcorrenciaAtual = [];

function inicializarOcorrencias() {
  preencherPlacasOcorrencia();
  prepararNovaOcorrencia();
  renderizarOcorrencias();
}

function prepararNovaOcorrencia() {
  setValorCampo("ocorrencia-id", gerarIdOcorrencia());
  setValorCampo("ocorrencia-data", isoHoje());
  setValorCampo("ocorrencia-hora", new Date().toTimeString().slice(0, 5));
  setValorCampo("ocorrencia-tipo", "Avaria");
}

function preencherPlacasOcorrencia() {
  const veiculos = getVeiculos();
  const select = document.getElementById("ocorrencia-placa-cavalo");
  if (!select) return;
  const atual = select.value;
  select.innerHTML = '<option value="">Selecione uma placa</option>' + veiculos
    .map((veiculo) => `<option value="${escapeAttr(veiculo.placa || "")}">${escapeHtml(veiculo.placa || "")}</option>`)
    .join("");
  if (atual) select.value = atual;
}

function gerarIdOcorrencia() {
  const lista = getOcorrencias();
  const maior = lista.reduce((acc, item) => {
    const match = String(item.id || "").match(/OCO-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `OCO-${String(maior + 1).padStart(5, "0")}`;
}

function getOcorrencias() {
  return getListaStorage(OCORRENCIAS_KEY);
}

function setOcorrencias(lista) {
  setListaStorage(OCORRENCIAS_KEY, lista);
}

function salvarOcorrencia() {
  const id = valorCampo("ocorrencia-id") || gerarIdOcorrencia();
  const tipo = valorCampo("ocorrencia-tipo") || "Avaria";
  const dataISO = valorCampo("ocorrencia-data") || isoHoje();
  const hora = valorCampo("ocorrencia-hora");
  const placaCavalo = valorCampo("ocorrencia-placa-cavalo");
  const placaCarreta = valorCampo("ocorrencia-placa-carreta");
  const local = valorCampo("ocorrencia-local");

  if (!tipo || !dataISO || !local) {
    mostrarMensagem("Informe tipo, data e local da ocorrência.", "Atenção");
    return;
  }

  const ocorrencia = {
    id,
    tipo,
    boletim: valorCampo("ocorrencia-boletim"),
    dataISO,
    hora,
    placaCavalo: placaCavalo || "Nao informada",
    placaCarreta: placaCarreta || "Nao informada",
    produto: valorCampo("ocorrencia-produto"),
    cliente: valorCampo("ocorrencia-cliente"),
    local,
    descricao: valorCampo("ocorrencia-descricao"),
    anexos: anexosOcorrenciaAtual,
    criadoEm: new Date().toISOString()
  };

  const lista = getOcorrencias();
  const idx = lista.findIndex((item) => item.id === id);
  if (idx >= 0) lista[idx] = ocorrencia;
  else lista.unshift(ocorrencia);
  setOcorrencias(lista);

  limparFormularioOcorrencia();
  renderizarOcorrencias();
  mostrarMensagem("Ocorrência salva com sucesso.", "Registro salvo");
}

function limparFormularioOcorrencia() {
  limparCampos([
    "ocorrencia-boletim",
    "ocorrencia-placa-cavalo",
    "ocorrencia-placa-carreta",
    "ocorrencia-produto",
    "ocorrencia-cliente",
    "ocorrencia-local",
    "ocorrencia-descricao"
  ]);
  anexosOcorrenciaAtual = [];
  const input = document.getElementById("ocorrencia-anexos");
  if (input) input.value = "";
  setTexto("ocorrencia-anexos-status", "Nenhum anexo selecionado.");
  prepararNovaOcorrencia();
}

function prepararAnexosOcorrencia(event) {
  const arquivos = Array.from(event.target.files || []);
  anexosOcorrenciaAtual = arquivos.map((arquivo) => ({
    nome: arquivo.name,
    tipo: arquivo.type,
    tamanho: arquivo.size
  }));
  setTexto(
    "ocorrencia-anexos-status",
    anexosOcorrenciaAtual.length
      ? `${anexosOcorrenciaAtual.length} anexo(s) selecionado(s): ${anexosOcorrenciaAtual.map((a) => a.nome).join(", ")}`
      : "Nenhum anexo selecionado."
  );
}

function renderizarOcorrencias() {
  const container = document.getElementById("ocorrencias-lista");
  if (!container) return;
  const lista = getOcorrencias();
  if (!lista.length) {
    container.innerHTML = '<div class="ops-empty">Nenhuma ocorrência registrada.</div>';
    return;
  }

  container.innerHTML = lista.map((item) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.id)} - ${escapeHtml(item.tipo)}</span>
        <span class="status-pill ${classeTipoOcorrencia(item.tipo)}">${escapeHtml(item.tipo)}</span>
      </div>
      <div class="ops-entry-meta">
        ${formatarDataISO(item.dataISO)} ${escapeHtml(item.hora || "")} - ${escapeHtml(item.local || "Local nao informado")}
      </div>
      <div class="ops-entry-meta">
        Cavalo: ${escapeHtml(item.placaCavalo || "Nao informada")} - Carreta: ${escapeHtml(item.placaCarreta || "Nao informada")} - BO: ${escapeHtml(item.boletim || "Nao informado")}
      </div>
      ${item.produto || item.cliente ? `<div class="ops-entry-meta">Produto: ${escapeHtml(item.produto || "-")} - Cliente: ${escapeHtml(item.cliente || "-")}</div>` : ""}
      ${item.descricao ? `<div class="ops-entry-body">${escapeHtml(item.descricao)}</div>` : ""}
      ${item.anexos?.length ? `<div class="ops-entry-meta">Anexos: ${item.anexos.map((anexo) => escapeHtml(anexo.nome)).join(", ")}</div>` : ""}
      <div class="ops-entry-actions">
        <button class="btn btn-sm" type="button" onclick="editarOcorrencia('${escapeAttr(item.id)}')">Editar</button>
        <button class="btn btn-sm btn-red" type="button" onclick="excluirOcorrencia('${escapeAttr(item.id)}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarOcorrencia(id) {
  const item = getOcorrencias().find((ocorrencia) => ocorrencia.id === id);
  if (!item) return;
  setValorCampo("ocorrencia-id", item.id);
  setValorCampo("ocorrencia-tipo", item.tipo || "Avaria");
  setValorCampo("ocorrencia-boletim", item.boletim || "");
  setValorCampo("ocorrencia-data", item.dataISO || isoHoje());
  setValorCampo("ocorrencia-hora", item.hora || "");
  setValorCampo("ocorrencia-placa-cavalo", item.placaCavalo === "Nao informada" ? "" : item.placaCavalo || "");
  setValorCampo("ocorrencia-placa-carreta", item.placaCarreta === "Nao informada" ? "" : item.placaCarreta || "");
  setValorCampo("ocorrencia-produto", item.produto || "");
  setValorCampo("ocorrencia-cliente", item.cliente || "");
  setValorCampo("ocorrencia-local", item.local || "");
  setValorCampo("ocorrencia-descricao", item.descricao || "");
  anexosOcorrenciaAtual = item.anexos || [];
  setTexto("ocorrencia-anexos-status", anexosOcorrenciaAtual.length ? `${anexosOcorrenciaAtual.length} anexo(s) registrado(s).` : "Nenhum anexo selecionado.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirOcorrencia(id) {
  if (!await confirmarAcao("Excluir esta ocorrência?")) return;
  setOcorrencias(getOcorrencias().filter((item) => item.id !== id));
  renderizarOcorrencias();
}

function classeTipoOcorrencia(tipo) {
  if (tipo === "Avaria") return "r-re";
  if (tipo === "Sinistro") return "r-cr";
  return "r-bo";
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function limparCampos(ids) {
  ids.forEach((id) => setValorCampo(id, ""));
}

function formatarDataISO(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = String(dataISO).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataISO;
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

document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarOcorrencias();
});
