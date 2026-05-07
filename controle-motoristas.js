// Funções específicas da página controle-motoristas.html

function inicializarControleMotoristas() {
  preencherSelectMotoristas();
  setValorCampo("motorista-status-data", isoHoje());
  renderizarControleMotoristas();
}

function salvarStatusMotorista() {
  const motorista = valorCampo("motorista-status-nome");
  if (!motorista) {
    alert("Selecione um motorista.");
    return;
  }
  const status = valorCampo("motorista-status-situacao") || "Disponivel";
  const registro = {
    motorista,
    status,
    dataISO: valorCampo("motorista-status-data") || isoHoje(),
    observacao: valorCampo("motorista-status-obs")
  };
  const lista = getStatusMotoristas();
  const idx = lista.findIndex((item) => normalizarTexto(item.motorista) === normalizarTexto(motorista));
  if (idx >= 0) lista[idx] = { ...lista[idx], ...registro };
  else lista.push({ id: String(Date.now()), ...registro });
  setListaStorage(MOTORISTAS_STATUS_KEY, lista);
  limparCampos(["motorista-status-obs"]);
  renderizarControleMotoristas();
}

function renderizarControleMotoristas() {
  const container = document.getElementById("motoristas-controle-lista");
  if (!container) return;
  const busca = valorCampo("motorista-status-busca");
  const statusFiltro = valorCampo("motorista-status-filtro");
  const statusSalvos = getStatusMotoristas();
  const registros = getMotoristas().map((m) => {
    const salvo = statusSalvos.find((item) => normalizarTexto(item.motorista) === normalizarTexto(m.nome));
    return {
      motorista: m.nome,
      status: salvo?.status || "Disponivel",
      dataISO: salvo?.dataISO || "",
      observacao: salvo?.observacao || ""
    };
  }).filter((item) => {
    if (busca && !contemBusca(`${item.motorista} ${item.status} ${item.observacao}`, busca)) return false;
    if (statusFiltro && item.status !== statusFiltro) return false;
    return true;
  });

  const todos = getMotoristas().map((m) => {
    const salvo = statusSalvos.find((item) => normalizarTexto(item.motorista) === normalizarTexto(m.nome));
    return salvo?.status || "Disponivel";
  });
  setTexto("mot-kpi-disponivel", todos.filter((s) => s === "Disponivel").length);
  setTexto("mot-kpi-folga", todos.filter((s) => s === "Folga").length);
  setTexto("mot-kpi-ferias", todos.filter((s) => s === "Ferias").length);
  setTexto("mot-kpi-atestado", todos.filter((s) => s === "Atestado").length);

  container.innerHTML = registros.length ? registros.map((item) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.motorista)}</span>
        <span class="status-pill ${classeStatusMotorista(item.status)}">${escapeHtml(labelStatusMotorista(item.status))}</span>
      </div>
      <div class="ops-entry-meta">${item.dataISO ? `Atualizado em ${formatarDataISO(item.dataISO)}` : "Sem data de atualização"}</div>
      ${item.observacao ? `<div class="ops-entry-body">${escapeHtml(item.observacao)}</div>` : ""}
      <div class="ops-entry-actions"><button class="btn btn-sm" type="button" onclick="editarStatusMotorista('${escapeAttr(item.motorista)}')">Editar</button></div>
    </div>
  `).join("") : '<div class="ops-empty">Nenhum motorista encontrado.</div>';
}

function editarStatusMotorista(nome) {
  const salvo = getStatusMotoristas().find((item) => normalizarTexto(item.motorista) === normalizarTexto(nome));
  setValorCampo("motorista-status-nome", nome);
  setValorCampo("motorista-status-situacao", salvo?.status || "Disponivel");
  setValorCampo("motorista-status-data", salvo?.dataISO || isoHoje());
  setValorCampo("motorista-status-obs", salvo?.observacao || "");
  document.getElementById("motorista-status-nome")?.focus();
}

function classeStatusMotorista(status) {
  if (status === "Disponivel") return "r-ex";
  if (status === "Folga") return "r-bo";
  if (status === "Ferias") return "r-re";
  return "r-cr";
}

function labelStatusMotorista(status) {
  return status === "Ferias" ? "Férias" : status === "Disponivel" ? "Disponível" : status;
}

// Funções auxiliares
function normalizarTexto(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function formatarDataISO(dataISO) {
  if (!dataISO) return "";
  try {
    return new Date(dataISO).toLocaleDateString("pt-BR");
  } catch {
    return dataISO;
  }
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});