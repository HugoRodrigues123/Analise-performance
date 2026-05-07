// Funções específicas da página advertencias.html

function salvarAdvertencia() {
  const advertencia = {
    id: String(Date.now()),
    dataISO: valorCampo("adv-data") || isoHoje(),
    motorista: valorCampo("adv-motorista") || "Nao informado",
    placa: valorCampo("adv-placa").toUpperCase() || "Nao informada",
    tipo: valorCampo("adv-tipo"),
    dias: numeroCampo("adv-dias"),
    status: valorCampo("adv-status"),
    motivo: valorCampo("adv-motivo")
  };
  const lista = getListaStorage(ADVERTENCIAS_KEY);
  lista.unshift(advertencia);
  setListaStorage(ADVERTENCIAS_KEY, lista);
  limparCampos(["adv-dias", "adv-motivo"]);
  renderizarAdvertencias();
  atualizarRankingMotoristas();
}

function renderizarAdvertencias() {
  const lista = getListaStorage(ADVERTENCIAS_KEY);
  const container = document.getElementById("advertencias-lista");
  if (!container) return;
  if (!lista.length) {
    container.innerHTML = '<div class="ops-empty">Nenhuma advertencia ou suspensao registrada.</div>';
    return;
  }
  container.innerHTML = lista.map((item) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.tipo)}</span>
        <span class="status-pill ${classeStatusRegistro(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <div class="ops-entry-meta">${formatarDataISO(item.dataISO)} - ${escapeHtml(labelPessoaPlaca(item))} - ${Number(item.dias || 0)} dia(s)</div>
      ${item.motivo ? `<div class="ops-entry-body">${escapeHtml(item.motivo)}</div>` : ""}
      <div class="ops-entry-actions"><button class="btn btn-sm btn-red" type="button" onclick="excluirOperacional('${ADVERTENCIAS_KEY}','${item.id}')">Excluir</button></div>
    </div>
  `).join("");
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});