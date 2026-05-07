// Funções específicas da página avarias.html

function salvarAvaria() {
  const avaria = {
    id: String(Date.now()),
    dataISO: valorCampo("avaria-data") || isoHoje(),
    motorista: valorCampo("avaria-motorista") || "Nao informado",
    placa: valorCampo("avaria-placa").toUpperCase() || "Nao informada",
    local: valorCampo("avaria-local") || "Nao informado",
    custo: numeroCampo("avaria-custo"),
    status: valorCampo("avaria-status"),
    desc: valorCampo("avaria-desc")
  };
  const lista = getListaStorage(AVARIAS_KEY);
  lista.unshift(avaria);
  setListaStorage(AVARIAS_KEY, lista);
  limparCampos(["avaria-local", "avaria-custo", "avaria-desc"]);
  renderizarAvarias();
  atualizarRankingMotoristas();
  atualizarDiagnosticoOfensores();
}

function renderizarAvarias() {
  const lista = getListaStorage(AVARIAS_KEY);
  const container = document.getElementById("avarias-lista");
  if (!container) return;
  if (!lista.length) {
    container.innerHTML = '<div class="ops-empty">Nenhuma avaria registrada.</div>';
    return;
  }
  container.innerHTML = lista.map((item) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.local)}</span>
        <span class="status-pill ${classeStatusRegistro(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <div class="ops-entry-meta">${formatarDataISO(item.dataISO)} - ${escapeHtml(labelPessoaPlaca(item))} - ${formatarMoeda(item.custo)}</div>
      ${item.desc ? `<div class="ops-entry-body">${escapeHtml(item.desc)}</div>` : ""}
      <div class="ops-entry-actions"><button class="btn btn-sm btn-red" type="button" onclick="excluirOperacional('${AVARIAS_KEY}','${item.id}')">Excluir</button></div>
    </div>
  `).join("");
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});