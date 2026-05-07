// Funções específicas da página registro-ocorrencia.html

function salvarRegistro() {
  calcular();
  if (!window._ultimoResultado) return;
  const r = window._ultimoResultado;
  if (!r.temMediaReal) {
    alert("Informe deslocamento real e consumo real para calcular e salvar a media.");
    return;
  }
  const dataISO = document.getElementById("obs-data").value || isoHoje();
  const motorista = document.getElementById("motorista-cadastro").value.trim();
  const placa = document.getElementById("placa-cadastro").value.trim().toUpperCase();
  const obs = document.getElementById("obs-texto").value.trim();
  const editId = document.getElementById("edit-id").value;
  const hist = getHistorico();
  if (placa) {
    salvarVeiculo({
      placa,
      fab: r.fab,
      fabricante: FABRICANTES[r.fab],
      modelo: r.modelo,
      ano: r.ano,
      tracao: r.tracao
    });
  }
  const base = {
    id: editId || String(Date.now()),
    data: formatarDataISO(dataISO),
    dataISO,
    atualizadoEm: new Date().toLocaleString("pt-BR"),
    motorista: motorista || "Nao informado",
    placa: placa || "Nao informada",
    fabKey: r.fab,
    fab: FABRICANTES[r.fab],
    modelo: r.modelo,
    ano: r.ano,
    tracao: r.tracao,
    fg: r.fg,
    em: r.em,
    acId: r.acId,
    acMd: r.acMd,
    acCr: r.acCr,
    desloc: r.desloc,
    consumo: r.consumo,
    kmCarregado: r.kmCarregado,
    trajetoId: r.trajetoId,
    origem: r.origem,
    destino: r.destino,
    trajetoNome: r.trajetoNome,
    desempenho: r.desempenho,
    condicaoCarga: r.condicaoCarga,
    criticidade: r.criticidade,
    mediaSimuladaTrajeto: r.mediaSimuladaTrajeto,
    media: r.mediaFinal.toFixed(2),
    nota: r.notaFinal,
    rating: r.rat,
    problemas: r.problemasAtivos,
    problemaIds: r.problemaIds,
    obs
  };

  if (editId) {
    const idx = hist.findIndex((item) => item.id === editId);
    if (idx >= 0) hist[idx] = base;
  } else {
    hist.unshift(base);
  }
  if (hist.length > 100) hist.length = 100;
  setHistorico(hist);
  document.getElementById("edit-id").value = "";
  carregarHistorico();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  atualizarDiagnosticoOfensores();
  alert(`Registro salvo!\nVeiculo: ${base.fab} ${base.modelo}\nPlaca: ${base.placa}\nMedia: ${base.media} km/L`);
}

function carregarHistorico() {
  const hist = getHistorico();
  const div = document.getElementById("hist-lista");
  if (!hist.length) {
    div.innerHTML = '<div class="hist-empty">Nenhum registro salvo ainda. Preencha os dados e clique em "Salvar Registro".</div>';
    return;
  }

  div.innerHTML = '<div class="hist-list">' + hist.map((r) => `
    <div class="hist-entry">
      <div class="hist-entry-header">
        <span style="font-weight:600;color:var(--text)">${escapeHtml(r.fab)} ${escapeHtml(r.modelo)} ${r.ano} (${escapeHtml(r.tracao)})</span>
        <span class="hist-entry-media">${r.media} km/L - Nota ${r.nota}</span>
      </div>
      <div class="hist-entry-header">
        <span class="hist-entry-date">${escapeHtml(r.data)} - ${escapeHtml(labelMotoristaPlaca(r))}</span>
        <span class="rating-pill ${classeRating(r.rating)}" style="font-size:11px;padding:2px 8px">${escapeHtml(r.rating)}</span>
      </div>
      ${r.problemas && r.problemas.length ? `<div class="hist-entry-mechs">Problemas: ${r.problemas.map(escapeHtml).join(" - ")}</div>` : ""}
      ${r.obs ? `<div class="hist-entry-obs">${escapeHtml(r.obs)}</div>` : ""}
      <div class="hist-actions">
        <button class="btn btn-sm" type="button" onclick="editarRegistro('${r.id}')">Editar</button>
        <button class="btn btn-sm btn-red" type="button" onclick="excluirRegistro('${r.id}')">Excluir</button>
      </div>
    </div>
  `).join("") + "</div>";
}

function classeRating(rating) {
  return rating === "Excelente" ? "r-ex" : rating === "Boa" ? "r-bo" : rating === "Regular" ? "r-re" : "r-cr";
}

function labelMotoristaPlaca(registro) {
  const motorista = registro.motorista || "Nao informado";
  const placa = registro.placa || "";
  if (!placa || placa === "Nao informada") return motorista;
  return `${motorista} - ${placa}`;
}

function editarRegistro(id) {
  const r = getHistorico().find((item) => item.id === id);
  if (!r) return;
  document.getElementById("edit-id").value = id;
  document.getElementById("fab").value = r.fabKey || Object.keys(FABRICANTES).find((key) => FABRICANTES[key] === r.fab) || "scania";
  atualizarModelos();
  document.getElementById("modelo").value = r.modelo;
  document.getElementById("ano").value = r.ano;
  document.getElementById("tracao").value = r.tracao;
  document.getElementById("obs-data").value = getRegistroDataISO(r) || isoHoje();
  setCampoDuplo("faixaVerde", "ni-fg", r.fg ?? 70);
  setCampoDuplo("embalo", "ni-em", r.em ?? 25);
  setCampoDuplo("acIdeal", "ni-id", r.acId ?? 60);
  setCampoDuplo("acMed", "ni-md", r.acMd ?? 30);
  setCampoDuplo("acCrit", "ni-cr", r.acCr ?? 10);
  document.getElementById("desloc").value = r.desloc || "";
  document.getElementById("consumo").value = r.consumo || "";
  document.getElementById("km-carregado").value = r.kmCarregado || "";
  document.getElementById("trajeto-registro").value = r.trajetoId || "";
  document.getElementById("motorista-cadastro").value = r.motorista === "Nao informado" ? "" : r.motorista;
  document.getElementById("placa-cadastro").value = r.placa && r.placa !== "Nao informada" ? r.placa : "";
  document.getElementById("obs-texto").value = r.obs || "";
  document.querySelectorAll(".mech-item").forEach((el) => {
    const cb = el.querySelector("input");
    cb.checked = (r.problemaIds || []).includes(cb.id.replace("m_", ""));
    el.classList.toggle("active", cb.checked);
  });
  calcular();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setCampoDuplo(sliderId, inputId, value) {
  document.getElementById(sliderId).value = value;
  document.getElementById(inputId).value = value;
}

function excluirRegistro(id) {
  if (!confirm("Excluir este registro do historico?")) return;
  const hist = getHistorico().filter((item) => item.id !== id);
  setHistorico(hist);
  carregarHistorico();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  atualizarDiagnosticoOfensores();
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});