const STATUS_MOTORISTAS = [
  { id: "Disponivel", label: "Disponível" },
  { id: "Folga", label: "Folga" },
  { id: "Ferias", label: "Férias" },
  { id: "Atestado", label: "Atestado" },
  { id: "Suspenso", label: "Suspenso" }
];

document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarControleMotoristas();
  window.addEventListener("load", renderizarControleMotoristas);
});

function inicializarControleMotoristas() {
  setValorCampo("motorista-status-data", dataHojeISO());
  preencherSelectsMotoristasControle();
  renderizarControleMotoristas();
  setTimeout(() => {
    preencherSelectsMotoristasControle();
    renderizarControleMotoristas();
  }, 350);
}

function preencherSelectsMotoristasControle() {
  const motoristas = getMotoristasOrdenados();
  preencherSelectMotorista("motorista-status-nome", motoristas, "Selecione um motorista");
  preencherSelectMotorista("motorista-busca-nome", motoristas, "Todos os motoristas");
}

function preencherSelectMotorista(id, motoristas, placeholder) {
  const select = document.getElementById(id);
  if (!select) return;
  const atual = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + motoristas
    .map((m) => `<option value="${escapeAttr(m.nome)}">${escapeHtml(m.nome)}</option>`)
    .join("");
  if (motoristas.some((m) => m.nome === atual)) select.value = atual;
}

function salvarStatusMotorista() {
  const motorista = valorCampo("motorista-status-nome");
  if (!motorista) {
    mostrarMensagem("Selecione um motorista cadastrado.", "Atenção");
    return;
  }

  const registro = {
    id: `MST-${Date.now()}`,
    motorista,
    status: normalizarStatusMotorista(valorCampo("motorista-status-situacao")),
    dataISO: valorCampo("motorista-status-data") || dataHojeISO(),
    retornoISO: valorCampo("motorista-status-retorno"),
    observacao: valorCampo("motorista-status-obs")
  };

  const lista = getStatusMotoristas();
  const idx = lista.findIndex((item) => normalizarTexto(item.motorista) === normalizarTexto(motorista));
  if (idx >= 0) lista[idx] = { ...lista[idx], ...registro, id: lista[idx].id || registro.id };
  else lista.push(registro);

  setListaStorage(MOTORISTAS_STATUS_KEY, lista);
  mostrarMensagem("Status do motorista salvo com sucesso.", "Controle de Motoristas");
  limparCampos(["motorista-status-retorno", "motorista-status-obs"]);
  setValorCampo("motorista-status-data", dataHojeISO());
  preencherSelectsMotoristasControle();
  renderizarControleMotoristas();
}

function renderizarControleMotoristas() {
  const todos = montarRegistrosMotoristas();
  const filtrados = filtrarRegistrosMotoristas(todos);
  atualizarDashboardMotoristas(todos);
  renderizarListaMotoristas(filtrados);
}

function montarRegistrosMotoristas() {
  const statusSalvos = getStatusMotoristas();
  return getMotoristasOrdenados().map((motorista) => {
    const salvo = statusSalvos.find((item) => normalizarTexto(item.motorista) === normalizarTexto(motorista.nome));
    return {
      motorista: motorista.nome,
      status: normalizarStatusMotorista(salvo?.status || "Disponivel"),
      dataISO: salvo?.dataISO || "",
      retornoISO: salvo?.retornoISO || "",
      observacao: salvo?.observacao || ""
    };
  });
}

function filtrarRegistrosMotoristas(registros) {
  const nome = valorCampo("motorista-busca-nome");
  const status = normalizarStatusMotorista(valorCampo("motorista-busca-status") || "");

  return registros.filter((item) => {
    if (nome && item.motorista !== nome) return false;
    if (status && item.status !== status) return false;
    return true;
  });
}

function atualizarDashboardMotoristas(registros) {
  const total = registros.length;
  const contagem = Object.fromEntries(STATUS_MOTORISTAS.map((status) => [status.id, 0]));
  registros.forEach((item) => {
    contagem[item.status] = (contagem[item.status] || 0) + 1;
  });

  setTexto("mot-kpi-disponivel", contagem.Disponivel || 0);
  setTexto("mot-kpi-folga", contagem.Folga || 0);
  setTexto("mot-kpi-ferias", contagem.Ferias || 0);
  setTexto("mot-kpi-atestado", contagem.Atestado || 0);
  setTexto("mot-kpi-suspenso", contagem.Suspenso || 0);
  setTexto("motoristas-total-badge", `${total} motorista${total === 1 ? "" : "s"}`);

  const pct = total ? Math.round(((contagem.Disponivel || 0) / total) * 100) : 0;
  const donut = document.getElementById("driver-donut");
  if (donut) donut.style.setProperty("--available", pct);
  setTexto("driver-donut-val", `${pct}%`);
}

function renderizarListaMotoristas(registros) {
  const container = document.getElementById("motoristas-controle-lista");
  setTexto("motoristas-lista-resumo", `${registros.length} exibido${registros.length === 1 ? "" : "s"}`);
  if (!container) return;

  if (!getMotoristasOrdenados().length) {
    container.innerHTML = '<div class="ops-empty">Nenhum motorista cadastrado. Cadastre motoristas na guia Cadastros.</div>';
    return;
  }

  container.innerHTML = registros.length ? registros.map((item) => `
    <div class="driver-row driver-row-${classeLinhaStatusMotorista(item.status)}">
      <div>
        <strong>${escapeHtml(item.motorista)}</strong>
        <span>${escapeHtml(detalheStatusMotorista(item))}</span>
      </div>
      <span class="status-pill ${classeStatusMotorista(item.status)}">${escapeHtml(labelStatusMotorista(item.status))}</span>
      <button class="btn btn-sm" type="button" onclick="carregarMotoristaParaEdicao('${escapeAttr(item.motorista)}')">Editar</button>
    </div>
  `).join("") : '<div class="ops-empty">Nenhum motorista encontrado para os filtros selecionados.</div>';
}

function carregarMotoristaParaEdicao(nome) {
  const item = montarRegistrosMotoristas().find((registro) => registro.motorista === nome);
  if (!item) return;
  setValorCampo("motorista-status-nome", item.motorista);
  setValorCampo("motorista-status-situacao", item.status);
  setValorCampo("motorista-status-data", item.dataISO || dataHojeISO());
  setValorCampo("motorista-status-retorno", item.retornoISO || "");
  setValorCampo("motorista-status-obs", item.observacao || "");
  document.getElementById("motorista-status-nome")?.focus();
}

function limparFiltrosMotoristas() {
  limparCampos(["motorista-busca-nome", "motorista-busca-status"]);
  renderizarControleMotoristas();
}

function limparSelecaoStatusMotorista() {
  limparCampos([
    "motorista-status-nome",
    "motorista-status-situacao",
    "motorista-status-retorno",
    "motorista-status-obs"
  ]);
  setValorCampo("motorista-status-data", dataHojeISO());
  renderizarControleMotoristas();
}

function getMotoristasOrdenados() {
  return getMotoristas()
    .map((motorista) => typeof motorista === "string" ? { nome: motorista } : motorista)
    .filter((motorista) => motorista && motorista.nome)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function detalheStatusMotorista(item) {
  const partes = [];
  if (item.dataISO) partes.push(`Atualizado em ${formatarDataControle(item.dataISO)}`);
  if (item.retornoISO) partes.push(`Retorno em ${formatarDataControle(item.retornoISO)}`);
  if (item.observacao) partes.push(item.observacao);
  return partes.length ? partes.join(" | ") : "Sem atualização registrada";
}

function normalizarStatusMotorista(status) {
  const chave = normalizarTexto(status);
  if (chave === "disponivel") return "Disponivel";
  if (chave === "folga") return "Folga";
  if (chave === "ferias") return "Ferias";
  if (chave === "atestado") return "Atestado";
  if (chave === "suspenso") return "Suspenso";
  return status ? status : "";
}

function labelStatusMotorista(status) {
  const normalizado = normalizarStatusMotorista(status);
  const item = STATUS_MOTORISTAS.find((cfg) => cfg.id === normalizado);
  return item ? item.label : normalizado;
}

function classeStatusMotorista(status) {
  const normalizado = normalizarStatusMotorista(status);
  if (normalizado === "Disponivel") return "r-ex";
  if (normalizado === "Folga") return "r-bo";
  if (normalizado === "Ferias") return "r-re";
  return "r-cr";
}

function classeLinhaStatusMotorista(status) {
  const normalizado = normalizarStatusMotorista(status);
  if (normalizado === "Ferias") return "ferias";
  if (normalizado === "Disponivel") return "disponivel";
  if (normalizado === "Folga") return "folga";
  if (normalizado === "Atestado") return "atestado";
  if (normalizado === "Suspenso") return "suspenso";
  return "padrao";
}

function dataHojeISO() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function formatarDataControle(dataISO) {
  if (!dataISO) return "";
  const partes = String(dataISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`;
  return dataISO;
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || "";
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function limparCampos(ids) {
  ids.forEach((id) => setValorCampo(id, ""));
}

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
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
