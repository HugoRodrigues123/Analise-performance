// Funções específicas da página multas.html

function salvarMulta() {
  const multa = montarDadosMultaFormulario("multa", String(Date.now()));
  const lista = getListaStorage(MULTAS_KEY);
  lista.unshift(multa);
  setListaStorage(MULTAS_KEY, lista);
  limparFormularioMulta();
  preencherSelectInfracoesMulta();
  preencherDatalistsMultas();
  renderizarMultas();
  atualizarRankingMotoristas();
  atualizarDiagnosticoOfensores();
}

function editarMulta(id) {
  const item = getListaStorage(MULTAS_KEY).find((multa) => multa.id === id);
  if (!item) return;
  setValorCampo("busca-multa-edit-id", item.id);
  preencherFormularioMulta("busca-edit-multa", item);
  atualizarPainelMultaBusca(true);
  const painel = document.getElementById("busca-multa-edicao");
  if (painel) {
    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function novaMultaBusca() {
  limparEdicaoMultaBusca(false);
  setValorCampo("busca-edit-multa-data", isoHoje());
  setValorCampo("busca-edit-multa-status", "Pendente Identificacao");
  atualizarPainelMultaBusca(false);
  const painel = document.getElementById("busca-multa-edicao");
  if (painel) {
    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cancelarEdicaoMulta() {
  limparFormularioMulta();
  limparEdicaoMultaBusca();
}

function limparFormularioMulta() {
  limparCampos(["multa-edit-id", "multa-hora", "multa-ait", "multa-cidade", "multa-estado", "multa-valor", "multa-infracao", "multa-descricao"]);
  const data = document.getElementById("multa-data");
  if (data) data.value = isoHoje();
  setValorCampo("multa-motorista", "");
  setValorCampo("multa-placa", "");
  setValorCampo("multa-status", "Pendente Identificacao");
  atualizarBotoesEdicaoMulta(false);
}

function salvarEdicaoMultaBusca() {
  const editId = valorCampo("busca-multa-edit-id");
  const lista = getListaStorage(MULTAS_KEY);
  const id = editId || String(Date.now());
  const idx = lista.findIndex((item) => item.id === editId);
  if (editId && idx < 0) {
    mostrarMensagem("Registro de multa nao encontrado.", "Atenção");
    limparEdicaoMultaBusca();
    renderizarMultas();
    return;
  }
  const dados = montarDadosMultaFormulario("busca-edit-multa", id);
  if (editId) lista[idx] = { ...lista[idx], ...dados };
  else lista.unshift(dados);
  setListaStorage(MULTAS_KEY, lista);
  limparEdicaoMultaBusca();
  preencherSelectInfracoesMulta();
  preencherDatalistsMultas();
  renderizarMultas();
  atualizarRankingMotoristas();
  atualizarDiagnosticoOfensores();
}

function limparEdicaoMultaBusca(ocultar = true) {
  limparCampos([
    "busca-multa-edit-id",
    "busca-edit-multa-data",
    "busca-edit-multa-hora",
    "busca-edit-multa-ait",
    "busca-edit-multa-cidade",
    "busca-edit-multa-estado",
    "busca-edit-multa-valor",
    "busca-edit-multa-infracao",
    "busca-edit-multa-descricao"
  ]);
  setValorCampo("busca-edit-multa-motorista", "");
  setValorCampo("busca-edit-multa-placa", "");
  setValorCampo("busca-edit-multa-status", "Pendente Identificacao");
  const painel = document.getElementById("busca-multa-edicao");
  if (painel) painel.hidden = ocultar;
  atualizarPainelMultaBusca(false);
}

function atualizarPainelMultaBusca(editando) {
  const titulo = document.getElementById("busca-multa-edicao-titulo");
  const botao = document.getElementById("busca-multa-edicao-salvar");
  if (titulo) titulo.textContent = editando ? "Editar multa selecionada" : "Incluir multa";
  if (botao) botao.textContent = editando ? "Salvar Alteracoes" : "Salvar Multa";
}

function preencherFormularioMulta(prefixo, item) {
  const motorista = item.motorista === "Nao informado" ? "" : item.motorista;
  const placa = item.placa === "Nao informada" ? "" : item.placa;
  garantirOpcaoSelect(`${prefixo}-motorista`, motorista);
  garantirOpcaoSelect(`${prefixo}-placa`, placa);
  setValorCampo(`${prefixo}-data`, item.dataISO || "");
  setValorCampo(`${prefixo}-hora`, item.hora || "");
  setValorCampo(`${prefixo}-motorista`, motorista);
  setValorCampo(`${prefixo}-placa`, placa);
  setValorCampo(`${prefixo}-ait`, item.ait === "Nao informado" ? "" : item.ait);
  setValorCampo(`${prefixo}-cidade`, item.cidade === "Nao informada" ? "" : item.cidade);
  setValorCampo(`${prefixo}-estado`, item.estado === "NA" ? "" : item.estado);
  setValorCampo(`${prefixo}-valor`, item.valor || "");
  setValorCampo(`${prefixo}-status`, item.status || "Pendente Identificacao");
  setValorCampo(`${prefixo}-infracao`, item.infracao || "");
  setValorCampo(`${prefixo}-descricao`, item.descricao || item.obs || "");
}

function montarDadosMultaFormulario(prefixo, id) {
  return {
    id,
    dataISO: valorCampo(`${prefixo}-data`) || isoHoje(),
    hora: valorCampo(`${prefixo}-hora`),
    motorista: valorCampo(`${prefixo}-motorista`) || "Nao informado",
    placa: valorCampo(`${prefixo}-placa`).toUpperCase() || "Nao informada",
    ait: valorCampo(`${prefixo}-ait`).toUpperCase() || "Nao informado",
    cidade: valorCampo(`${prefixo}-cidade`) || "Nao informada",
    estado: valorCampo(`${prefixo}-estado`).toUpperCase() || "NA",
    valor: numeroCampo(`${prefixo}-valor`),
    status: valorCampo(`${prefixo}-status`),
    infracao: valorCampo(`${prefixo}-infracao`),
    descricao: valorCampo(`${prefixo}-descricao`),
    atualizadoEm: new Date().toLocaleString("pt-BR")
  };
}

function garantirOpcaoSelect(id, valor) {
  const select = document.getElementById(id);
  if (!select || !valor || Array.from(select.options).some((opcao) => opcao.value === valor)) return;
  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = valor;
  select.appendChild(opcao);
}

function atualizarBotoesEdicaoMulta(editando) {
  const topo = document.getElementById("multa-salvar-btn");
  const formulario = document.getElementById("multa-salvar-form-btn");
  if (topo) topo.textContent = editando ? "Salvar Alteracoes" : "Registrar Multa";
  if (formulario) formulario.textContent = editando ? "Salvar Alteracoes" : "Salvar Multa";
}

function preencherDatalistsMultas() {
  const multas = getListaStorage(MULTAS_KEY);
  preencherDatalistMulta(
    "multa-cidade-lista",
    multas.map((multa) => multa.cidade).filter((valor) => valor && valor !== "Nao informada")
  );
  preencherDatalistMulta(
    "multa-estado-lista",
    multas.map((multa) => multa.estado).filter((valor) => valor && valor !== "NA")
  );
  preencherDatalistMulta(
    "multa-valor-lista",
    multas
      .map((multa) => Number(multa.valor || 0))
      .filter((valor) => valor > 0)
      .sort((a, b) => a - b)
      .map((valor) => valor.toFixed(2))
  );
  preencherDatalistMulta(
    "multa-descricao-lista",
    multas.flatMap((multa) => [multa.infracao, multa.descricao, multa.obs]).filter(Boolean)
  );
}

function preencherDatalistMulta(id, valores) {
  const lista = document.getElementById(id);
  if (!lista) return;
  const unicos = Array.from(new Set(valores.map((valor) => String(valor).trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  lista.innerHTML = unicos.map((valor) => `<option value="${escapeAttr(valor)}"></option>`).join("");
}

function renderizarMultas() {
  const filtrosAtivos = filtrosMultasAtivos();
  const listaFiltrada = filtrarMultasBusca(getListaStorage(MULTAS_KEY));
  const lista = filtrosAtivos ? listaFiltrada : listaFiltrada.slice(0, 10);
  const container = document.getElementById("multas-lista");
  if (!container) return;
  if (!lista.length) {
    container.innerHTML = '<div class="ops-empty">Nenhuma multa encontrada.</div>';
    return;
  }
  const resumo = filtrosAtivos
    ? `<div class="ops-summary">Exibindo ${lista.length} multa(s) encontrada(s) pela busca.</div>`
    : `<div class="ops-summary">Exibindo as 10 ultimas multas registradas.</div>`;
  container.innerHTML = resumo + lista.map((item) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">AIT ${escapeHtml(item.ait || item.tipo || "Nao informado")}</span>
        <span class="status-pill ${classeStatusRegistro(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <div class="ops-entry-meta">${formatarDataISO(item.dataISO)}${item.hora ? " " + escapeHtml(item.hora) : ""} - ${escapeHtml(labelPessoaPlaca(item))} - ${escapeHtml(localMulta(item))} - ${formatarMoeda(item.valor)}</div>
      ${item.origemImportacao ? `<div class="ops-entry-meta">Importado de ${escapeHtml(item.origemImportacao)} em ${escapeHtml(item.importadoEm || "")}</div>` : ""}
      ${item.infracao ? `<div class="ops-entry-body"><strong>Infracao:</strong> ${escapeHtml(item.infracao)}</div>` : ""}
      ${item.descricao || item.obs ? `<div class="ops-entry-body"><strong>Observacoes:</strong> ${escapeHtml(item.descricao || item.obs)}</div>` : ""}
      <div class="ops-entry-actions">
        <button class="btn btn-sm" type="button" onclick="editarMulta('${escapeAttr(item.id)}')">Editar</button>
        <button class="btn btn-sm btn-red" type="button" onclick="excluirOperacional('${MULTAS_KEY}','${item.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function filtrosMultasAtivos() {
  return [
    "busca-multa-ait",
    "busca-multa-valor",
    "busca-multa-cidade",
    "busca-multa-motorista",
    "busca-multa-data",
    "busca-multa-estado",
    "busca-multa-placa",
    "busca-multa-hora",
    "busca-multa-descricao"
  ].some((id) => valorCampo(id));
}

function filtrarMultasBusca(lista) {
  const filtros = {
    ait: valorCampo("busca-multa-ait"),
    valor: valorCampo("busca-multa-valor"),
    cidade: valorCampo("busca-multa-cidade"),
    motorista: valorCampo("busca-multa-motorista"),
    data: valorCampo("busca-multa-data"),
    estado: valorCampo("busca-multa-estado"),
    placa: valorCampo("busca-multa-placa"),
    hora: valorCampo("busca-multa-hora"),
    descricao: valorCampo("busca-multa-descricao")
  };
  return lista.filter((item) => {
    if (filtros.ait && !contemBusca(item.ait, filtros.ait)) return false;
    if (filtros.valor && !contemBusca(item.valor, filtros.valor)) return false;
    if (filtros.cidade && !contemBusca(item.cidade, filtros.cidade)) return false;
    if (filtros.motorista && !contemBusca(item.motorista, filtros.motorista)) return false;
    if (filtros.data && !contemBusca(item.dataISO, filtros.data)) return false;
    if (filtros.estado && !contemBusca(item.estado, filtros.estado)) return false;
    if (filtros.placa && !contemBusca(item.placa, filtros.placa)) return false;
    if (filtros.hora && !contemBusca(item.hora, filtros.hora)) return false;
    if (filtros.descricao && !contemBusca(item.descricao, filtros.descricao) && !contemBusca(item.obs, filtros.descricao)) return false;
    return true;
  });
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});
