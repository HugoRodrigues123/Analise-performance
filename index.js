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
  inicializarCadastroTrajetosPerformance();
  criarProblemasMecanicos();
  document.getElementById("res-data").textContent = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  document.getElementById("obs-data").value = isoHoje();
  preencherDatasOperacionais();
  atualizarModelos();
  atualizarIndicadoresSliders();
  carregarHistorico();
  carregarControlesOperacionais();
  calcular();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  if (typeof atualizarDiagnosticoOfensores === "function") atualizarDiagnosticoOfensores();
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
    Object.keys(MODELOS[fab]).forEach((modelo) => {
      const opt = document.createElement("option");
      opt.value = modelo;
      opt.textContent = modelo;
      modSel.appendChild(opt);
    });
  }
  calcular();
}

function carregarVeiculoPorPlaca() {
  const placa = document.getElementById("placa-cadastro")?.value;
  if (!placa) return;

  const veiculo = getVeiculos().find((item) => (item.placa || "").toUpperCase() === placa.toUpperCase());
  if (!veiculo) return;

  document.getElementById("fab").value = veiculo.fab || "vw";
  atualizarModelos();
  document.getElementById("modelo").value = veiculo.modelo || "";
  document.getElementById("ano").value = veiculo.ano || "2022";
  document.getElementById("tracao").value = veiculo.tracao || "6x2";
  calcular();
}

function limparIdentificacaoVeiculo() {
  setValorCampo("motorista-cadastro", "");
  setValorCampo("placa-cadastro", "");
  setValorCampo("fab", "scania");
  atualizarModelos();
  setValorCampo("ano", "2022");
  setValorCampo("tracao", "6x2");
  calcular();
}

function numero(id) {
  const el = document.getElementById(id);
  return el ? Number.parseFloat(el.value) || 0 : 0;
}

function syncFromSlider(sliderId, inputId) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  if (!slider) return;
  const valor = limitarPercentual(slider.value);
  slider.value = valor;
  if (input) input.value = valor;
  atualizarIndicadorSlider(sliderId, valor);
}

function syncFromInput(inputId, sliderId) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(sliderId);
  if (!input) return;
  const valor = limitarPercentual(input.value);
  input.value = valor;
  if (slider) slider.value = valor;
  atualizarIndicadorSlider(sliderId, valor);
}

function limitarPercentual(valor) {
  const numero = Number.parseInt(valor, 10);
  if (Number.isNaN(numero)) return 0;
  return Math.max(0, Math.min(100, numero));
}

function atualizarIndicadorSlider(sliderId, valor) {
  const mapa = {
    acIdeal: "v-id",
    acMed: "v-md",
    acCrit: "v-cr"
  };
  const indicador = document.getElementById(mapa[sliderId]);
  if (indicador) indicador.textContent = `${limitarPercentual(valor)}%`;
}

function atualizarIndicadoresSliders() {
  [
    ["acIdeal", "ni-id"],
    ["acMed", "ni-md"],
    ["acCrit", "ni-cr"]
  ].forEach(([sliderId, inputId]) => {
    const origem = document.getElementById(inputId) || document.getElementById(sliderId);
    if (origem) atualizarIndicadorSlider(sliderId, origem.value);
  });
}

function calcular() {
  const fab = document.getElementById("fab")?.value || "vw";
  const modelo = document.getElementById("modelo")?.value || "";
  const ano = Number.parseInt(document.getElementById("ano")?.value, 10) || 2022;
  const tracao = document.getElementById("tracao")?.value || "6x2";
  const fg = limitarPercentual(document.getElementById("ni-fg")?.value || 70);
  const em = limitarPercentual(document.getElementById("ni-em")?.value || 25);
  const acId = limitarPercentual(document.getElementById("ni-id")?.value || 0);
  const acMd = limitarPercentual(document.getElementById("ni-md")?.value || 0);
  const acCr = limitarPercentual(document.getElementById("ni-cr")?.value || 0);
  const desloc = numero("desloc");
  const consumo = numero("consumo");
  const condicaoCarga = document.getElementById("condicao-carga")?.value || "Carregado";
  const somaAc = acId + acMd + acCr;

  setTextoLocal("soma-val", somaAc);
  const warn = document.getElementById("accel-warn");
  if (warn) warn.style.display = somaAc !== 100 ? "block" : "none";

  const totalAceleracao = somaAc || 100;
  [
    ["ideal", acId],
    ["med", acMd],
    ["crit", acCr]
  ].forEach(([id, valor]) => {
    const pct = totalAceleracao ? valor / totalAceleracao * 100 : 0;
    const barra = document.getElementById(`bar-${id}`);
    const texto = document.getElementById(`bar-${id}-txt`);
    if (barra) barra.style.width = `${pct}%`;
    if (texto) texto.textContent = pct > 12 ? `${Math.round(valor)}%` : "";
  });

  const mediaBase = MODELOS[fab]?.[modelo] || 2.5;
  const fatorTracao = FATOR_TRACAO[tracao] || 1;
  const fatorAno = 1 - Math.max(0, Math.min(0.20, (new Date().getFullYear() - ano) * 0.008));
  const notaBase = Math.min(100, Math.max(0,
    fg * 0.40 +
    em * 0.30 +
    (acId / Math.max(totalAceleracao, 1) * 100) * 0.30 -
    (acCr / Math.max(totalAceleracao, 1) * 100) * 0.15
  ));
  const fatorConducao = 0.65 + (notaBase / 100) * 0.70;

  let fatorMecanico = 1;
  let penalidadeNota = 0;
  const problemasAtivos = [];
  const problemaIds = [];
  PROBLEMAS.forEach((p) => {
    const cb = document.getElementById(`m_${p.id}`);
    if (cb?.checked) {
      fatorMecanico *= (1 + p.media / 100);
      penalidadeNota += p.nota;
      problemasAtivos.push(p.name);
      problemaIds.push(p.id);
    }
  });

  const mediaEstimada = Math.max(0.3, mediaBase * fatorTracao * fatorAno * fatorConducao * fatorMecanico);
  const temMediaReal = desloc > 0 && consumo > 0;
  const mediaFinal = temMediaReal ? desloc / consumo : mediaEstimada;
  const notaFinal = Math.max(0, Math.min(100, Math.round(notaBase + penalidadeNota)));
  const rat = mediaFinal >= 3 ? "Excelente" : mediaFinal >= 2.5 ? "Boa" : mediaFinal >= 2 ? "Regular" : "Crítica";

  atualizarResultadoPerformance({ mediaFinal, mediaEstimada, mediaBase, fatorTracao, fatorAno, notaFinal, rat, desloc, consumo, problemasAtivos, fatorMecanico });

  window._ultimoResultado = {
    fab,
    modelo,
    ano,
    tracao,
    fg,
    em,
    acId,
    acMd,
    acCr,
    desloc,
    consumo,
    kmCarregado: condicaoCarga === "Carregado" ? desloc : 0,
    condicaoCarga,
    mediaFinal,
    mediaEstimada,
    temMediaReal,
    notaFinal,
    rat,
    problemasAtivos,
    problemaIds
  };
}

function atualizarResultadoPerformance(dados) {
  setTextoLocal("res-media", dados.mediaFinal ? dados.mediaFinal.toFixed(2) : "-");
  setTextoLocal("res-nota", dados.notaFinal);
  setTextoLocal("res-base", dados.mediaEstimada ? dados.mediaEstimada.toFixed(2) : "-");
  setTextoLocal("res-desloc", dados.desloc > 0 ? dados.desloc.toLocaleString("pt-BR") : "-");
  setTextoLocal("res-consumo", dados.consumo > 0 ? dados.consumo.toLocaleString("pt-BR") : "-");
  setTextoLocal("gauge-num", dados.mediaFinal ? dados.mediaFinal.toFixed(2) : "-");
  setTextoLocal("nota-badge", `Nota Gobrax: ${dados.notaFinal}`);

  const ratingClass = dados.rat === "Excelente" ? "r-ex" : dados.rat === "Boa" ? "r-bo" : dados.rat === "Regular" ? "r-re" : "r-cr";
  const rating = document.getElementById("res-rating");
  if (rating) rating.innerHTML = `<span class="rating-pill ${ratingClass}">${dados.rat}</span>`;

  const pct = Math.min(1, (dados.mediaFinal || 0) / 5);
  document.getElementById("gauge-arc")?.setAttribute("stroke-dashoffset", (180 * (1 - pct)).toFixed(1));
  document.getElementById("gauge-needle")?.setAttribute("transform", `rotate(${(-90 + pct * 180).toFixed(1)},75,88)`);

  const mech = document.getElementById("res-mech");
  const total = document.getElementById("mech-total");
  if (!dados.problemasAtivos.length) {
    if (mech) mech.textContent = "Nenhum problema registrado";
    if (total) total.textContent = "";
  } else {
    const reducao = Math.round((1 - dados.fatorMecanico) * 100);
    if (mech) mech.textContent = `-${reducao}% média | ${dados.problemasAtivos.join(", ")}`;
    if (total) total.textContent = `${dados.problemasAtivos.length} problema(s) ativo(s)`;
  }
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

function inicializarCadastroTrajetosPerformance() {
  if (!document.getElementById("trajetos-lista")) return;
  renderizarTrajetos();
}

function preencherFabricantesTrajeto() {
  const sel = document.getElementById("trajeto-fab");
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = Object.entries(FABRICANTES).map(([key, nome]) => `<option value="${escapeAttr(key)}">${escapeHtml(nome)}</option>`).join("");
  if (atual) sel.value = atual;
}

function atualizarModelosTrajeto() {
  const fab = document.getElementById("trajeto-fab")?.value || "vw";
  const sel = document.getElementById("trajeto-modelo");
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = Object.keys(MODELOS[fab] || {}).map((m) => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join("");
  if (atual && Object.keys(MODELOS[fab] || {}).includes(atual)) sel.value = atual;
}

function salvarTrajeto() {
  const clienteOrigem = valorCampoLocal("trajeto-cliente-origem");
  const clienteDestino = valorCampoLocal("trajeto-cliente-destino");
  const origem = valorCampoLocal("trajeto-origem");
  const destino = valorCampoLocal("trajeto-destino");
  const motorista = document.getElementById("motorista-cadastro")?.value.trim();
  const placa = document.getElementById("placa-cadastro")?.value.trim().toUpperCase();
  const data = document.getElementById("obs-data")?.value || isoHoje();
  const desloc = numero("desloc");
  const consumo = numero("consumo");

  if (!motorista || !placa) {
    mostrarMensagem("Informe motorista e placa para salvar a performance do trajeto.", "Atenção");
    return;
  }
  if (!data) {
    mostrarMensagem("Informe a data da performance.", "Atenção");
    return;
  }
  if (desloc <= 0 || consumo <= 0) {
    mostrarMensagem("Informe deslocamento e consumo para calcular a média por deslocamento / consumo.", "Atenção");
    return;
  }
  if (!origem || !destino) {
    mostrarMensagem("Informe origem e destino do trajeto.", "Atenção");
    return;
  }

  const fab = document.getElementById("fab")?.value || "vw";
  const nome = `${origem} - ${destino}`;
  const desempenho = valorCampoLocal("trajeto-desempenho") || "Medio";
  const condicaoCarga = document.getElementById("condicao-carga")?.value || "Carregado";
  const modelo = document.getElementById("modelo")?.value || "";
  const registro = {
    id: normalizarChaveLocal(nome),
    nome,
    clienteOrigem,
    clienteDestino,
    origem,
    destino,
    desempenho,
    condicaoCarga,
    criticidade: desempenho,
    fab,
    fabricante: FABRICANTES[fab],
    modelo,
    mediaSimulada: 0,
    kmCarregadoPadrao: 0,
    pedalIdeal: 0,
    pedalMedio: 0,
    pedalAgressivo: 0
  };

  const lista = getListaStorage(TRAJETOS_KEY);
  const idx = lista.findIndex((t) => t.id === registro.id);
  if (idx >= 0) lista[idx] = registro;
  else lista.push(registro);
  setListaStorage(TRAJETOS_KEY, lista);
  renderizarTrajetos();
  preencherSelectTrajetos();
  calcular();
  const resultado = {
    ...window._ultimoResultado,
    trajetoId: registro.id,
    origem,
    destino,
    trajetoNome: registro.nome,
    desempenho,
    criticidade: desempenho,
    condicaoCarga
  };
  salvarRegistroPerformance(resultado, { motorista, placa, data, obs: valorCampoLocal("obs-texto") });
  limparCamposLocais(["trajeto-origem", "trajeto-destino", "trajeto-cliente-origem", "trajeto-cliente-destino"]);
  carregarHistorico();
  carregarControlesOperacionais();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  mostrarMensagem("Trajeto e performance salvos com sucesso.", "Análise de Performance");
}

function renderizarTrajetos() {
  const container = document.getElementById("trajetos-lista");
  if (!container) return;
  container.innerHTML = "";
}

async function excluirTrajeto(id) {
  if (!await confirmarAcao("Tem certeza que deseja excluir este trajeto?")) return;
  setListaStorage(TRAJETOS_KEY, getTrajetos().filter((t) => t.id !== id));
  renderizarTrajetos();
  preencherSelectTrajetos();
}

function labelTrajetoLocal(t) {
  if (!t) return "";
  if (t.origem || t.destino) return `${t.origem || "Origem nao informada"} - ${t.destino || "Destino nao informado"}`;
  return t.nome || "";
}

function valorCampoLocal(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function numeroCampoLocal(id) {
  const valor = Number.parseFloat(valorCampoLocal(id).replace(",", "."));
  return Number.isFinite(valor) ? valor : 0;
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

function setTextoLocal(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function limparCamposLocais(ids) {
  ids.forEach((id) => setValorCampo(id, ""));
}

function normalizarChaveLocal(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
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

function formatarDataLocal(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function formatarNumeroLocal(valor, casas) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function classeRatingLocal(rating) {
  if (rating === "Excelente") return "r-ex";
  if (rating === "Boa") return "r-bo";
  if (rating === "Regular") return "r-re";
  return "r-cr";
}

function carregarHistorico() {
  const hist = getHistorico();
  const container = document.getElementById("hist-lista");
  if (!container) return;
  if (!hist.length) {
    container.innerHTML = '<div class="hist-empty">Nenhum registro salvo ainda. Preencha os dados e clique em "Salvar Registro".</div>';
    return;
  }

  container.innerHTML = '<div class="hist-list">' + hist
    .map((r, index) => ({ r, index }))
    .reverse()
    .map(({ r, index }) => {
      const media = Number(r.mediaFinal || 0);
      const trajeto = r.trajetoNome || (r.origem || r.destino ? `${r.origem || "Origem não informada"} - ${r.destino || "Destino não informado"}` : "Trajeto não informado");
      return `
        <div class="hist-entry">
          <div class="hist-entry-header">
            <span style="font-weight:700;color:var(--text)">${escapeHtml(r.motorista || "Motorista não informado")} - ${escapeHtml(r.placa || "Placa não informada")}</span>
            <span class="hist-entry-media">${media ? media.toFixed(2) : "-"} km/L</span>
          </div>
          <div class="hist-entry-header" style="margin-bottom:4px">
            <span class="hist-entry-date">${formatarDataLocal(r.data)} - ${escapeHtml(trajeto)}</span>
            <span class="rating-pill ${classeRatingLocal(r.rating)}" style="font-size:11px;padding:2px 8px">${escapeHtml(r.rating || "-")}</span>
          </div>
          <div class="hist-entry-obs">
            Condição: ${escapeHtml(r.condicaoCarga || "-")} | Deslocamento: ${formatarNumeroLocal(r.desloc, 0)} km | Consumo: ${formatarNumeroLocal(r.consumo, 0)} L | Nota: ${escapeHtml(r.notaFinal || "-")}
          </div>
          ${r.obs ? `<div class="hist-entry-obs" style="margin-top:4px">${escapeHtml(r.obs)}</div>` : ""}
          <div class="hist-actions">
            <button onclick="editarRegistro(${index})" class="btn btn-sm">Editar</button>
          </div>
        </div>
      `;
    }).join("") + '</div>';
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
    mostrarMensagem("Informe deslocamento real e consumo real para calcular e salvar a media.", "Atenção");
    return;
  }
  const dataISO = document.getElementById("obs-data").value || isoHoje();
  const motorista = document.getElementById("motorista-cadastro").value.trim();
  const placa = document.getElementById("placa-cadastro").value.trim().toUpperCase();
  const obs = document.getElementById("obs-texto").value.trim();
  const editId = document.getElementById("edit-id").value;

  salvarRegistroPerformance(r, { motorista, placa, data: dataISO, obs, editId });
  limparFormulario();
  carregarHistorico();
  carregarControlesOperacionais();
  atualizarDashboards();
  atualizarRankingMotoristas();
  atualizarComparativo();
  mostrarMensagem(editId ? "Registro atualizado!" : "Registro salvo!", "Análise de Performance");
}

function salvarRegistroPerformance(r, contexto) {
  const editId = contexto.editId || "";
  const condicaoCarga = r.condicaoCarga || document.getElementById("condicao-carga")?.value || "Carregado";
  const registro = {
    id: editId ? Number.parseInt(editId, 10) : Date.now(),
    data: contexto.data || isoHoje(),
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
    kmCarregado: condicaoCarga === "Carregado" ? r.desloc : 0,
    trajetoId: r.trajetoId || "",
    origem: r.origem || "",
    destino: r.destino || "",
    trajetoNome: r.trajetoNome || "",
    desempenho: r.desempenho || "",
    condicaoCarga,
    criticidade: r.criticidade || "",
    mediaSimuladaTrajeto: r.mediaSimuladaTrajeto || 0,
    mediaFinal: r.desloc > 0 && r.consumo > 0 ? r.desloc / r.consumo : r.mediaFinal,
    mediaEstimada: r.mediaEstimada,
    temMediaReal: r.desloc > 0 && r.consumo > 0,
    notaFinal: r.notaFinal,
    rating: r.rat || r.rating,
    problemasAtivos: r.problemasAtivos,
    problemaIds: r.problemaIds,
    motorista: contexto.motorista,
    placa: contexto.placa,
    obs: contexto.obs || ""
  };

  const hist = getHistorico();
  if (editId) {
    const idx = hist.findIndex(h => h.id === registro.id);
    if (idx >= 0) hist[idx] = registro;
  } else {
    hist.push(registro);
  }
  setHistorico(hist);
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
  const faixaVerde = document.getElementById("ni-fg");
  const embalo = document.getElementById("ni-em");
  if (faixaVerde) faixaVerde.value = r.fg ?? 70;
  if (embalo) embalo.value = r.em ?? 25;
  document.getElementById("ni-id").value = r.acId;
  document.getElementById("ni-md").value = r.acMd;
  document.getElementById("ni-cr").value = r.acCr;
  document.getElementById("desloc").value = r.desloc;
  document.getElementById("consumo").value = r.consumo;
  const condicaoCarga = document.getElementById("condicao-carga");
  if (condicaoCarga) condicaoCarga.value = r.condicaoCarga || (Number(r.kmCarregado || 0) > 0 ? "Carregado" : "Vazio");
  document.getElementById("motorista-cadastro").value = r.motorista;
  document.getElementById("placa-cadastro").value = r.placa;
  document.getElementById("obs-data").value = r.data;
  document.getElementById("obs-texto").value = r.obs;
  document.getElementById("edit-id").value = r.id;

  PROBLEMAS.forEach(p => {
    const cb = document.getElementById("m_" + p.id);
    if (cb) cb.checked = r.problemaIds?.includes(p.id) || false;
  });

  atualizarIndicadoresSliders();
  calcular();
  document.getElementById("fab").scrollIntoView({ behavior: "smooth" });
}

function limparFormulario() {
  document.getElementById("desloc").value = "";
  document.getElementById("consumo").value = "";
  const condicaoCarga = document.getElementById("condicao-carga");
  if (condicaoCarga) condicaoCarga.value = "Carregado";
  document.getElementById("motorista-cadastro").value = "";
  document.getElementById("placa-cadastro").value = "";
  document.getElementById("obs-texto").value = "";
  document.getElementById("edit-id").value = "";
  PROBLEMAS.forEach(p => {
    const cb = document.getElementById("m_" + p.id);
    if (cb) cb.checked = false;
  });
  atualizarIndicadoresSliders();
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
