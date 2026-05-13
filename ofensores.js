function inicializarDiagnostico() {
  preencherFiltrosDiagnostico();
  atualizarDiagnostico();
}

function preencherFiltrosDiagnostico() {
  const historico = getHistorico();
  preencherSelectDiagnostico("diag-motorista", historico.map((r) => r.motorista).filter(Boolean), "Todos");
  preencherSelectDiagnostico("diag-placa", historico.map((r) => r.placa).filter(Boolean), "Todas");
}

function preencherSelectDiagnostico(id, valores, labelTodos) {
  const select = document.getElementById(id);
  if (!select) return;
  const atual = select.value;
  const unicos = Array.from(new Set(valores)).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
  select.innerHTML = `<option value="">${labelTodos}</option>` + unicos
    .map((valor) => `<option value="${escapeAttr(valor)}">${escapeHtml(valor)}</option>`)
    .join("");
  if (atual && unicos.includes(atual)) select.value = atual;
}

function atualizarDiagnostico() {
  const registros = filtrarRegistrosDiagnostico(getHistorico());
  const kmTotal = registros.reduce((total, r) => total + numeroRegistro(r.desloc), 0);
  const consumoTotal = registros.reduce((total, r) => total + numeroRegistro(r.consumo), 0);
  const mediaGeral = kmTotal > 0 && consumoTotal > 0 ? kmTotal / consumoTotal : 0;

  setTexto("diag-media-geral", mediaGeral ? mediaGeral.toFixed(2) : "—");
  setTexto("diag-km-total", formatarNumero(kmTotal, 0));
  setTexto("diag-consumo-total", formatarNumero(consumoTotal, 0));
  setTexto("diag-total-registros", registros.length);
  renderizarRegistrosDiagnostico(registros);
}

function filtrarRegistrosDiagnostico(registros) {
  const inicio = valorCampo("diag-data-inicio");
  const fim = valorCampo("diag-data-fim");
  const motorista = valorCampo("diag-motorista");
  const placa = valorCampo("diag-placa");

  return registros.filter((r) => {
    const data = String(r.data || "").slice(0, 10);
    if (inicio && data < inicio) return false;
    if (fim && data > fim) return false;
    if (motorista && r.motorista !== motorista) return false;
    if (placa && r.placa !== placa) return false;
    return numeroRegistro(r.desloc) > 0 && numeroRegistro(r.consumo) > 0;
  });
}

function renderizarRegistrosDiagnostico(registros) {
  const destino = document.getElementById("diag-lista");
  if (!destino) return;
  if (!registros.length) {
    destino.innerHTML = '<div class="ops-empty">Nenhum registro de performance encontrado para os filtros selecionados.</div>';
    return;
  }

  destino.innerHTML = registros
    .slice()
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))
    .map((r) => {
      const km = numeroRegistro(r.desloc);
      const consumo = numeroRegistro(r.consumo);
      const media = km > 0 && consumo > 0 ? km / consumo : 0;
      return `
        <div class="ops-entry">
          <div class="ops-entry-head">
            <span class="ops-entry-title">${escapeHtml(r.placa || "Placa não informada")} - ${escapeHtml(r.motorista || "Motorista não informado")}</span>
            <span class="status-pill r-bo">${media.toFixed(2)} km/L</span>
          </div>
          <div class="ops-entry-meta">${formatarData(r.data)} - ${escapeHtml(r.modelo || "Modelo não informado")} - ${escapeHtml(r.condicaoCarga || "Sem condição")}</div>
          <div class="ops-entry-body">Km ${formatarNumero(km, 0)} / Consumo ${formatarNumero(consumo, 0)} L / Nota ${escapeHtml(r.notaFinal || "—")}</div>
        </div>
      `;
    }).join("");
}

function numeroRegistro(valor) {
  const numero = Number.parseFloat(String(valor || "0").replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function formatarNumero(valor, casas) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function formatarData(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
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
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarDiagnostico();
});
