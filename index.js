// Funções específicas da página index.html

function inicializar() {
  if (!document.getElementById("fab")) {
    preencherCadastrosCompartilhados();
    inicializarCadastroTrajetos();
    if (document.getElementById("diag-lista")) {
      preencherSelectDiagnosticosSalvos();
      atualizarDiagnosticoOfensores();
    }
    if (document.getElementById("multas-lista")) {
      preencherDatasOperacionais();
      preencherSelectInfracoesMulta();
      preencherDatalistsMultas();
      renderizarMultas();
    }
    if (document.getElementById("advertencias-lista")) {
      preencherDatasOperacionais();
      renderizarAdvertencias();
    }
    if (document.getElementById("avarias-lista")) {
      preencherDatasOperacionais();
      renderizarAvarias();
    }
    if (document.getElementById("situacao-lista")) {
      renderizarSituacaoVeiculos();
    }
    if (document.getElementById("cadastros-lista")) {
      inicializarPaginaCadastros();
    }
    if (document.getElementById("motoristas-controle-lista")) {
      inicializarControleMotoristas();
    }
    if (document.getElementById("controle-ficha-lista")) {
      inicializarControleFicha();
    }
    return;
  }

  preencherFabricantes();
  preencherCadastrosCompartilhados();
  preencherSelectTrajetos();
  criarProblemasMecanicos();
  document.getElementById("res-data").textContent = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  document.getElementById("obs-data").value = isoHoje();
  preencherDatasOperacionais();
  atualizarModelos();
  carregarHistorico();
  carregarControlesOperacionais();
  calcular();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  atualizarDiagnosticoOfensores();
}

function preencherFabricantes() {
  const fabSel = document.getElementById("fab");
  fabSel.innerHTML = "";
  Object.entries(FABRICANTES).forEach(([key, nome]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = nome;
    fabSel.appendChild(opt);
  });
}

function criarProblemasMecanicos() {
  const grid = document.getElementById("mech-grid");
  grid.innerHTML = "";
  PROBLEMAS.forEach((p) => {
    const lbl = document.createElement("label");
    lbl.className = "mech-item";
    lbl.innerHTML = `
      <input type="checkbox" id="m_${p.id}" onchange="toggleMech(this)">
      <div class="mech-text">
        <div class="mech-name">${p.name}</div>
        <div class="mech-desc">${p.desc}</div>
      </div>`;
    grid.appendChild(lbl);
  });
}

function toggleMech(cb) {
  calcular();
}

function atualizarModelos() {
  const fab = document.getElementById("fab").value;
  const modSel = document.getElementById("modelo");
  modSel.innerHTML = "";
  if (MODELOS[fab]) {
    Object.entries(MODELOS[fab]).forEach(([modelo, consumo]) => {
      const opt = document.createElement("option");
      opt.value = modelo;
      opt.textContent = `${modelo} (${consumo} km/L)`;
      modSel.appendChild(opt);
    });
  }
  calcular();
}

function numero(id) {
  const el = document.getElementById(id);
  return el ? Number.parseFloat(el.value) || 0 : 0;
}

function isoHoje() {
  return new Date().toISOString().split("T")[0];
}

function preencherDatasOperacionais() {
  const hoje = isoHoje();
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (!input.value) input.value = hoje;
  });
}

function carregarHistorico() {
  const hist = getHistorico();
  const tbody = document.getElementById("hist-tbody");
  tbody.innerHTML = "";
  hist.slice(-20).reverse().forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(r.data).toLocaleDateString("pt-BR")}</td>
      <td>${r.placa || "-"}</td>
      <td>${r.motorista || "-"}</td>
      <td>${r.mediaFinal?.toFixed(2) || "-"}</td>
      <td>${r.notaFinal || "-"}</td>
      <td>${r.rating || "-"}</td>
      <td><button onclick="editarRegistro(${hist.length - 1 - i})" class="btn-small">Editar</button></td>`;
    tbody.appendChild(tr);
  });
}

function carregarControlesOperacionais() {
  const hist = getHistorico();
  const hoje = isoHoje();
  const hojeRegistros = hist.filter(r => r.data.startsWith(hoje));
  document.getElementById("hoje-registros").textContent = hojeRegistros.length;
  document.getElementById("hoje-media").textContent = hojeRegistros.length ? (hojeRegistros.reduce((s, r) => s + (r.mediaFinal || 0), 0) / hojeRegistros.length).toFixed(2) : "-";
}

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

  const registro = {
    id: editId ? Number.parseInt(editId, 10) : Date.now(),
    data: dataISO,
    fab: r.fab,
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
    mediaFinal: r.mediaFinal,
    mediaEstimada: r.mediaEstimada,
    temMediaReal: r.temMediaReal,
    notaFinal: r.notaFinal,
    rating: r.rat,
    problemasAtivos: r.problemasAtivos,
    problemaIds: r.problemaIds,
    motorista,
    placa,
    obs
  };

  const hist = getHistorico();
  if (editId) {
    const idx = hist.findIndex(h => h.id === registro.id);
    if (idx >= 0) hist[idx] = registro;
  } else {
    hist.push(registro);
  }
  setHistorico(hist);

  limparFormulario();
  carregarHistorico();
  carregarControlesOperacionais();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  alert(editId ? "Registro atualizado!" : "Registro salvo!");
}

function editarRegistro(idx) {
  const hist = getHistorico();
  const r = hist[idx];
  if (!r) return;

  document.getElementById("fab").value = r.fab;
  atualizarModelos();
  document.getElementById("modelo").value = r.modelo;
  document.getElementById("ano").value = r.ano;
  document.getElementById("tracao").value = r.tracao;
  document.getElementById("ni-fg").value = r.fg;
  document.getElementById("ni-em").value = r.em;
  document.getElementById("ni-id").value = r.acId;
  document.getElementById("ni-md").value = r.acMd;
  document.getElementById("ni-cr").value = r.acCr;
  document.getElementById("desloc").value = r.desloc;
  document.getElementById("consumo").value = r.consumo;
  document.getElementById("km-carregado").value = r.kmCarregado;
  document.getElementById("trajeto-registro").value = r.trajetoId;
  document.getElementById("motorista-cadastro").value = r.motorista;
  document.getElementById("placa-cadastro").value = r.placa;
  document.getElementById("obs-data").value = r.data;
  document.getElementById("obs-texto").value = r.obs;
  document.getElementById("edit-id").value = r.id;

  PROBLEMAS.forEach(p => {
    const cb = document.getElementById("m_" + p.id);
    if (cb) cb.checked = r.problemaIds?.includes(p.id) || false;
  });

  calcular();
  document.getElementById("fab").scrollIntoView({ behavior: "smooth" });
}

function limparFormulario() {
  document.getElementById("desloc").value = "";
  document.getElementById("consumo").value = "";
  document.getElementById("km-carregado").value = "";
  document.getElementById("motorista-cadastro").value = "";
  document.getElementById("placa-cadastro").value = "";
  document.getElementById("obs-texto").value = "";
  document.getElementById("edit-id").value = "";
  PROBLEMAS.forEach(p => {
    const cb = document.getElementById("m_" + p.id);
    if (cb) cb.checked = false;
  });
  calcular();
}

function atualizarDashboards() {
  const hist = getHistorico();
  if (!hist.length) return;

  const hoje = isoHoje();
  const hojeRegistros = hist.filter(r => r.data.startsWith(hoje));
  const semanaRegistros = hist.filter(r => {
    const d = new Date(r.data);
    const hojeD = new Date(hoje);
    const diff = (hojeD - d) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  const mesRegistros = hist.filter(r => {
    const d = new Date(r.data);
    const hojeD = new Date(hoje);
    return d.getMonth() === hojeD.getMonth() && d.getFullYear() === hojeD.getFullYear();
  });

  function calcMedia(registros) {
    if (!registros.length) return 0;
    return registros.reduce((s, r) => s + (r.mediaFinal || 0), 0) / registros.length;
  }

  document.getElementById("dash-hoje").textContent = calcMedia(hojeRegistros).toFixed(2);
  document.getElementById("dash-semana").textContent = calcMedia(semanaRegistros).toFixed(2);
  document.getElementById("dash-mes").textContent = calcMedia(mesRegistros).toFixed(2);
  document.getElementById("dash-total").textContent = calcMedia(hist).toFixed(2);
}

function atualizarRankingMotoristas() {
  const hist = getHistorico();
  const ranking = agruparRankingMotoristas(hist, 0);
  const container = document.getElementById("ranking-lista");
  if (!container) return;

  container.innerHTML = "";
  ranking.slice(0, 10).forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "ranking-item";
    div.innerHTML = renderRankingMotorista(item, index);
    container.appendChild(div);
  });
}

function atualizarComparativo() {
  const hist = getHistorico();
  if (!hist.length) return;

  const ultimos30 = hist.slice(-30);
  const media30 = ultimos30.reduce((s, r) => s + (r.mediaFinal || 0), 0) / ultimos30.length;
  const ultimos7 = hist.slice(-7);
  const media7 = ultimos7.reduce((s, r) => s + (r.mediaFinal || 0), 0) / ultimos7.length;

  document.getElementById("comp-30").textContent = media30.toFixed(2);
  document.getElementById("comp-7").textContent = media7.toFixed(2);
  document.getElementById("comp-diff").textContent = (media7 - media30).toFixed(2);
  document.getElementById("comp-diff").className = media7 >= media30 ? "positivo" : "negativo";
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});