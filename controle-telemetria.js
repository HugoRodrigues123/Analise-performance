function getTelemetria() {
  return JSON.parse(localStorage.getItem(TELEMETRIA_KEY) || "[]");
}

function setTelemetria(lista) {
  localStorage.setItem(TELEMETRIA_KEY, JSON.stringify(lista));
  if (typeof registrarTransicaoOperacao === "function") registrarTransicaoOperacao();
}

function popularSelectTelemetria() {
  const motoristaSel = document.getElementById("tel-motorista");
  const placaSel = document.getElementById("tel-placa");
  if (!motoristaSel || !placaSel) return;

  const motoristas = typeof getMotoristas === "function" ? getMotoristas() : [];
  const veiculos = typeof getVeiculos === "function" ? getVeiculos() : [];

  motoristaSel.innerHTML = '<option value="">Selecione</option>' + motoristas
    .map((m) => `<option value="${escapeHtml(m.nome || m)}">${escapeHtml(m.nome || m)}</option>`)
    .join("");

  placaSel.innerHTML = '<option value="">Selecione</option>' + veiculos
    .map((v) => `<option value="${escapeHtml(v.placa || "")}">${escapeHtml(v.placa || "")}</option>`)
    .join("");
}

function salvarTelemetria() {
  const deslocamento = numeroCampo("tel-deslocamento");
  const consumo = numeroCampo("tel-consumo");
  const media = deslocamento > 0 && consumo > 0 ? deslocamento / consumo : 0;

  const registro = {
    id: `TEL-${Date.now()}`,
    data: valorCampo("tel-data") || new Date().toISOString().slice(0, 10),
    motorista: valorCampo("tel-motorista") || "Nao informado",
    placa: valorCampo("tel-placa") || "Nao informada",
    trajeto: valorCampo("tel-trajeto"),
    deslocamento,
    consumo,
    media,
    gobrax: numeroCampo("tel-gobrax"),
    criticidade: valorCampo("tel-criticidade") || "Bom",
    pedalIdeal: numeroCampo("tel-pedal-ideal"),
    pedalMedio: numeroCampo("tel-pedal-medio"),
    pedalAgressivo: numeroCampo("tel-pedal-agressivo")
  };

  const lista = getTelemetria();
  lista.unshift(registro);
  setTelemetria(lista.slice(0, 200));
  limparTelemetria(false);
  renderizarTelemetria();
}

function limparTelemetria(renderizar = true) {
  [
    "tel-data",
    "tel-trajeto",
    "tel-deslocamento",
    "tel-consumo",
    "tel-gobrax",
    "tel-pedal-ideal",
    "tel-pedal-medio",
    "tel-pedal-agressivo"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const criticidade = document.getElementById("tel-criticidade");
  if (criticidade) criticidade.value = "Bom";
  if (renderizar) renderizarTelemetria();
}

function renderizarTelemetria() {
  const lista = getTelemetria();
  const busca = (valorCampo("tel-busca") || "").toLowerCase();
  const filtrada = lista.filter((r) => [
    r.data,
    r.motorista,
    r.placa,
    r.trajeto,
    r.criticidade
  ].join(" ").toLowerCase().includes(busca));

  atualizarKpisTelemetria(lista);

  const destino = document.getElementById("telemetria-lista");
  if (!destino) return;
  if (!filtrada.length) {
    destino.innerHTML = '<div class="hist-empty">Nenhum registro de telemetria encontrado.</div>';
    return;
  }

  destino.innerHTML = filtrada.map((r) => `
    <div class="hist-entry">
      <div class="hist-entry-header">
        <span style="font-weight:600;color:var(--text)">${escapeHtml(r.placa)} - ${escapeHtml(r.motorista)}</span>
        <span class="hist-entry-media">${formatarNumero(r.media, 2)} km/L</span>
      </div>
      <div class="hist-entry-header" style="margin-bottom:4px">
        <span class="hist-entry-date">${formatarData(r.data)} - ${escapeHtml(r.trajeto || "Trajeto nao informado")}</span>
        <span class="rating-pill ${classeCriticidade(r.criticidade)}" style="font-size:11px;padding:2px 8px">${escapeHtml(r.criticidade)}</span>
      </div>
      <div class="hist-entry-obs">
        Gobrax ${formatarNumero(r.gobrax, 0)} / Pedal ideal ${formatarNumero(r.pedalIdeal, 0)}% / medio ${formatarNumero(r.pedalMedio, 0)}% / agressivo ${formatarNumero(r.pedalAgressivo, 0)}%
      </div>
    </div>
  `).join("");
}

function atualizarKpisTelemetria(lista) {
  const total = lista.length;
  const medias = lista.map((r) => Number(r.media) || 0).filter((v) => v > 0);
  const agressivos = lista.map((r) => Number(r.pedalAgressivo) || 0);
  const mediaGeral = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
  const pedalAgressivo = agressivos.length ? agressivos.reduce((a, b) => a + b, 0) / agressivos.length : 0;

  setTexto("tel-kpi-total", total);
  setTexto("tel-kpi-media", medias.length ? mediaGeral.toFixed(2) : "—");
  setTexto("tel-kpi-agressivo", agressivos.length ? pedalAgressivo.toFixed(0) : "—");
}

function exportarExcel() {
  const lista = getTelemetria();
  if (!lista.length || typeof XLSX === "undefined") return;
  const ws = XLSX.utils.json_to_sheet(lista);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Telemetria");
  XLSX.writeFile(wb, "controle-telemetria.xlsx");
}

function exportarPDF() {
  window.print();
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function numeroCampo(id) {
  const valor = parseFloat(valorCampo(id).replace(",", "."));
  return Number.isFinite(valor) ? valor : 0;
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function formatarNumero(valor, casas) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function formatarData(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = String(data).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function classeCriticidade(valor) {
  if (valor === "Bom") return "r-ex";
  if (valor === "Médio") return "r-re";
  return "r-cr";
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
  popularSelectTelemetria();
  const data = document.getElementById("tel-data");
  if (data && !data.value) data.value = new Date().toISOString().slice(0, 10);
  renderizarTelemetria();
});
