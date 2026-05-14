// Funções específicas da página cadastros.html

function inicializarCadastroTrajetos() {
  if (!document.getElementById("trajeto-fab")) return;
  preencherFabricantesTrajeto();
  atualizarModelosTrajeto();
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
  const clienteOrigem = valorCampo("trajeto-cliente-origem");
  const clienteDestino = valorCampo("trajeto-cliente-destino");
  const origem = valorCampo("trajeto-origem");
  const destino = valorCampo("trajeto-destino");
  if (!origem || !destino) {
    mostrarMensagem("Informe origem e destino do trajeto.", "Atenção");
    return;
  }
  const fab = valorCampo("trajeto-fab") || "vw";
  const nome = `${origem} - ${destino}`;
  const desempenho = valorCampo("trajeto-desempenho") || "Medio";
  const condicaoCarga = valorCampo("trajeto-carga") || "Carregado";
  const composicao = valorCampo("trajeto-composicao") || "Vanderleia";
  const registro = {
    id: `${normalizarChave(nome)}-${fab}-${normalizarChave(valorCampo("trajeto-modelo"))}-${normalizarChave(composicao)}`,
    nome,
    clienteOrigem,
    clienteDestino,
    origem,
    destino,
    desempenho,
    condicaoCarga,
    composicao,
    criticidade: desempenho,
    fab,
    fabricante: FABRICANTES[fab],
    modelo: valorCampo("trajeto-modelo"),
    mediaSimulada: numeroCampo("trajeto-media"),
    kmCarregadoPadrao: numeroCampo("trajeto-km-carregado"),
    pedalIdeal: numeroCampo("trajeto-pedal-ideal"),
    pedalMedio: numeroCampo("trajeto-pedal-medio"),
    pedalAgressivo: numeroCampo("trajeto-pedal-agressivo")
  };
  const lista = getListaStorage(TRAJETOS_KEY);
  const idx = lista.findIndex((t) => t.id === registro.id);
  if (idx >= 0) lista[idx] = registro;
  else lista.push(registro);
  setListaStorage(TRAJETOS_KEY, lista);
  renderizarTrajetos();
  preencherSelectTrajetos();
  limparCampos(["trajeto-origem", "trajeto-destino", "trajeto-cliente-origem", "trajeto-cliente-destino", "trajeto-media", "trajeto-km-carregado"]);
}

function renderizarTrajetos() {
  const container = document.getElementById("trajetos-lista");
  if (!container) return;
  const lista = getTrajetos();
  if (!lista.length) {
    container.innerHTML = '<div class="ops-empty">Nenhum trajeto cadastrado.</div>';
    return;
  }
  container.innerHTML = lista.map((t) => `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(labelTrajeto(t))}</span>
        <span class="status-pill">${escapeHtml(grauDesempenhoTrajeto(t))}</span>
      </div>
      <div class="ops-entry-meta">${escapeHtml(t.origem ? `Origem: ${t.origem} - Destino: ${t.destino} - ${condicaoCargaTrajeto(t)} - ${composicaoTrajeto(t)}` : "Origem/destino nao informados")}</div>
      <div class="ops-entry-meta">${escapeHtml(t.fabricante || FABRICANTES[t.fab] || "")} ${escapeHtml(t.modelo || "")} - media simulada ${Number(t.mediaSimulada || 0).toFixed(2)} km/L - pedal ${t.pedalIdeal || 0}/${t.pedalMedio || 0}/${t.pedalAgressivo || 0}%</div>
      <div class="ops-entry-actions"><button class="btn btn-sm btn-red" type="button" onclick="excluirTrajeto('${escapeAttr(t.id)}')">Excluir</button></div>
    </div>
  `).join("");
}

function labelTrajeto(t) {
  if (!t) return "";
  if (t.origem || t.destino) return `${t.origem || "Origem nao informada"} - ${t.destino || "Destino nao informado"}`;
  return t.nome || "";
}

function grauDesempenhoTrajeto(t) {
  return t?.desempenho || t?.criticidade || "Medio";
}

function condicaoCargaTrajeto(t) {
  return t?.condicaoCarga || "Carregado";
}

function composicaoTrajeto(t) {
  return t?.composicao || "Vanderleia";
}

async function excluirTrajeto(id) {
  if (!await confirmarAcao("Tem certeza que deseja excluir este trajeto?")) return;
  const lista = getTrajetos();
  const filtrada = lista.filter((t) => t.id !== id);
  setListaStorage(TRAJETOS_KEY, filtrada);
  renderizarTrajetos();
  preencherSelectTrajetos();
}

function inicializarPaginaCadastros() {
  preencherCadastrosCompartilhados();
  preencherFabricantesFrota();
  atualizarModelosFrota();
  limparFormularioFrota();
  renderizarCadastros();
}

function salvarMotoristaNome(nome) {
  const nomeLimpo = (nome || "").trim();
  if (!nomeLimpo) return false;

  const motoristas = getMotoristas();
  const jaExiste = motoristas.some((m) => (m.nome || "").toLowerCase() === nomeLimpo.toLowerCase());
  if (jaExiste) {
    mostrarMensagem("Este motorista ja esta cadastrado.", "Atenção");
    return false;
  }

  motoristas.push({
    id: `MOT-${Date.now()}`,
    nome: nomeLimpo,
    criadoEm: new Date().toISOString()
  });
  setListaStorage(MOTORISTAS_KEY, motoristas);
  atualizarInterfacesCompartilhadas();
  return true;
}

function salvarMotoristaCadastro() {
  const input = document.getElementById("cadastro-motorista-nome");
  const nome = input?.value.trim();
  if (!nome) {
    mostrarMensagem("Informe o nome do motorista.", "Atenção");
    return;
  }
  if (salvarMotoristaNome(nome)) {
    input.value = "";
    renderizarCadastros();
  }
}

async function excluirMotoristaSelecionado(selectId) {
  const select = document.getElementById(selectId);
  const nome = select?.value;
  if (!nome) {
    mostrarMensagem("Selecione um motorista para excluir.", "Atenção");
    return;
  }
  if (!await confirmarAcao(`Excluir o motorista ${nome}?`)) return;

  const motoristas = getMotoristas().filter((m) => m.nome !== nome);
  setListaStorage(MOTORISTAS_KEY, motoristas);
  preencherSelectMotoristas();
  renderizarCadastros();
}

function salvarParticipanteCadastro() {
  const nome = valorCampo("cadastro-participante-nome");
  const cargo = valorCampo("cadastro-participante-cargo");
  if (!nome) {
    mostrarMensagem("Informe o nome do participante.", "Atenção");
    return;
  }

  const participantes = getParticipantes();
  const jaExiste = participantes.some((p) => (p.nome || "").toLowerCase() === nome.toLowerCase());
  if (jaExiste) {
    mostrarMensagem("Este participante ja esta cadastrado.", "Atenção");
    return;
  }

  participantes.push({
    id: `PART-${Date.now()}`,
    nome,
    cargo,
    criadoEm: new Date().toISOString()
  });
  setListaStorage(PARTICIPANTES_KEY, participantes);
  setValorCampo("cadastro-participante-nome", "");
  setValorCampo("cadastro-participante-cargo", "");
  atualizarInterfacesCompartilhadas();
  renderizarCadastros();
  mostrarMensagem("Participante salvo com sucesso.", "Cadastro salvo");
}

async function removerParticipanteCadastro(id) {
  const participante = getParticipantes().find((p) => p.id === id || p.nome === id);
  if (!participante) return;
  if (!await confirmarAcao(`Excluir o participante ${participante.nome}?`)) return;

  const participantes = getParticipantes().filter((p) => p.id !== participante.id && p.nome !== participante.nome);
  setListaStorage(PARTICIPANTES_KEY, participantes);
  atualizarInterfacesCompartilhadas();
  renderizarCadastros();
}

function preencherFabricantesFrota() {
  const sel = document.getElementById("frota-fab");
  if (!sel) return;
  const atual = sel.value || "vw";
  sel.innerHTML = Object.entries(FABRICANTES)
    .map(([key, nome]) => `<option value="${escapeAttr(key)}">${escapeHtml(nome)}</option>`)
    .join("");
  sel.value = FABRICANTES[atual] ? atual : "vw";
}

function atualizarModelosFrota() {
  const fab = valorCampo("frota-fab") || "vw";
  const sel = document.getElementById("frota-modelo");
  if (!sel) return;
  const atual = sel.value;
  const modelos = Object.keys(MODELOS[fab] || {});
  sel.innerHTML = modelos.map((modelo) => `<option value="${escapeAttr(modelo)}">${escapeHtml(modelo)}</option>`).join("");
  if (atual && modelos.includes(atual)) sel.value = atual;
}

function limparFormularioFrota() {
  setValorCampo("cadastro-placa-select", "");
  setValorCampo("frota-placa", "");
  setValorCampo("frota-ano", "2022");
  setValorCampo("frota-tracao", "6x2");
  preencherFabricantesFrota();
  atualizarModelosFrota();
  preencherSelectVeiculosCadastro();
}

function salvarCadastroFrota() {
  const placa = valorCampo("frota-placa").toUpperCase();
  if (!placa) {
    mostrarMensagem("Informe a placa do veiculo.", "Atenção");
    return;
  }

  const registro = {
    id: placa,
    placa,
    fab: valorCampo("frota-fab") || "vw",
    fabricante: FABRICANTES[valorCampo("frota-fab")] || "",
    modelo: valorCampo("frota-modelo"),
    ano: valorCampo("frota-ano") || "2022",
    tracao: valorCampo("frota-tracao") || "6x2",
    atualizadoEm: new Date().toISOString()
  };

  const veiculos = getVeiculos();
  const idx = veiculos.findIndex((v) => (v.placa || "").toUpperCase() === placa);
  if (idx >= 0) veiculos[idx] = { ...veiculos[idx], ...registro };
  else veiculos.push(registro);

  setListaStorage(VEICULOS_KEY, veiculos);
  preencherSelectVeiculosCadastro();
  renderizarCadastros();
  mostrarMensagem("Veiculo salvo com sucesso.", "Cadastro salvo");
}

function preencherSelectVeiculosCadastro() {
  const veiculos = getVeiculos();
  document.querySelectorAll('select[id*="placa"], select[id*="veiculo"]').forEach((select) => {
    if (select.id.includes("modelo") || select.id.includes("fab") || select.id.includes("trajeto")) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione uma placa</option>';
    veiculos.forEach((veiculo) => {
      const option = document.createElement("option");
      option.value = veiculo.placa;
      option.textContent = veiculo.placa;
      select.appendChild(option);
    });
    if (valorAtual) select.value = valorAtual;
  });
}

function preencherCadastroFrota(placa) {
  const veiculo = getVeiculos().find((v) => (v.placa || "").toUpperCase() === (placa || "").toUpperCase());
  if (!veiculo) return;

  setValorCampo("frota-placa", veiculo.placa || "");
  setValorCampo("frota-fab", veiculo.fab || "vw");
  atualizarModelosFrota();
  setValorCampo("frota-modelo", veiculo.modelo || "");
  setValorCampo("frota-ano", veiculo.ano || "2022");
  setValorCampo("frota-tracao", veiculo.tracao || "6x2");
}

async function excluirVeiculoSelecionado(selectId) {
  const select = document.getElementById(selectId);
  const placa = select?.value;
  if (!placa) {
    mostrarMensagem("Selecione uma placa para excluir.", "Atenção");
    return;
  }
  if (!await confirmarAcao(`Excluir o veiculo ${placa}?`)) return;

  const veiculos = getVeiculos().filter((v) => (v.placa || "").toUpperCase() !== placa.toUpperCase());
  setListaStorage(VEICULOS_KEY, veiculos);
  limparFormularioFrota();
  preencherSelectVeiculosCadastro();
  renderizarCadastros();
}

function carregarVeiculoCadastro() {
  const placa = valorCampo("cadastro-placa-select");
  if (!placa) {
    limparFormularioFrota();
    return;
  }
  preencherCadastroFrota(placa);
}

function renderizarCadastros() {
  const container = document.getElementById("cadastros-lista");
  if (!container) return;
  const motoristas = getMotoristas();
  const veiculos = getVeiculos();
  const participantes = getParticipantes();
  const buscaMotorista = valorCampo("cad-busca-motorista");
  const buscaVeiculo = valorCampo("cad-busca-veiculo");
  const buscaParticipante = valorCampo("cad-busca-participante");
  const motoristasFiltrados = motoristas.filter((m) => !buscaMotorista || contemBusca(m.nome, buscaMotorista));
  const veiculosFiltrados = veiculos.filter((v) => {
    if (!buscaVeiculo) return true;
    return contemBusca(`${v.placa || ""} ${FABRICANTES[v.fab] || v.fabricante || ""} ${v.modelo || ""} ${v.ano || ""} ${v.tracao || ""}`, buscaVeiculo);
  });
  const participantesFiltrados = participantes.filter((p) => {
    if (!buscaParticipante) return true;
    return contemBusca(`${p.nome || ""} ${p.cargo || ""}`, buscaParticipante);
  });
  const motoristasVisiveis = motoristasFiltrados;
  const veiculosVisiveis = veiculosFiltrados;
  setTexto("cad-kpi-motoristas", motoristas.length);
  setTexto("cad-kpi-veiculos", veiculos.length);
  setTexto("cad-kpi-participantes", participantes.length);

  const listaMotoristas = document.getElementById("cad-lista-motoristas");
  if (listaMotoristas) {
    listaMotoristas.innerHTML = motoristasVisiveis.length ? motoristasVisiveis.map((m) => `
      <div class="ops-entry">
        <div class="ops-entry-head">
          <span class="ops-entry-title">${escapeHtml(m.nome)}</span>
          <button class="btn btn-sm btn-red" type="button" onclick="removerMotoristaCadastro('${escapeAttr(m.nome)}')">Excluir</button>
        </div>
      </div>
    `).join("") : '<div class="ops-empty">Nenhum motorista encontrado.</div>';
  }

  const listaVeiculos = document.getElementById("cad-lista-veiculos");
  if (listaVeiculos) {
    listaVeiculos.innerHTML = veiculosVisiveis.length ? veiculosVisiveis.map((v) => `
      <div class="ops-entry">
        <div class="ops-entry-head">
          <span class="ops-entry-title">${escapeHtml(v.placa)}</span>
          <div class="actions-row">
            <button class="btn btn-sm" type="button" onclick="editarVeiculoCadastro('${escapeAttr(v.placa)}')">Editar</button>
            <button class="btn btn-sm btn-red" type="button" onclick="removerVeiculoCadastro('${escapeAttr(v.placa)}')">Excluir</button>
          </div>
        </div>
        <div class="ops-entry-meta">${escapeHtml(FABRICANTES[v.fab] || v.fabricante || "Fabricante nao informado")} ${escapeHtml(v.modelo || "Modelo nao informado")} - ${escapeHtml(v.ano || "Ano nao informado")} - ${escapeHtml(v.tracao || "Tracao nao informada")}</div>
      </div>
    `).join("") : '<div class="ops-empty">Nenhum veículo encontrado.</div>';
  }

  const listaParticipantes = document.getElementById("cad-lista-participantes");
  if (listaParticipantes) {
    listaParticipantes.innerHTML = participantesFiltrados.length ? participantesFiltrados.map((p) => `
      <div class="ops-entry">
        <div class="ops-entry-head">
          <span class="ops-entry-title">${escapeHtml(p.nome)}</span>
          <button class="btn btn-sm btn-red" type="button" onclick="removerParticipanteCadastro('${escapeAttr(p.id || p.nome)}')">Excluir</button>
        </div>
        <div class="ops-entry-meta">${escapeHtml(p.cargo || "Cargo nao informado")}</div>
      </div>
    `).join("") : '<div class="ops-empty">Nenhum participante encontrado.</div>';
  }
}

function editarVeiculoCadastro(placa) {
  setValorCampo("cadastro-placa-select", placa);
  preencherCadastroFrota(placa);
  document.getElementById("frota-placa")?.focus();
}

function removerMotoristaCadastro(nome) {
  const select = document.getElementById("cadastro-motorista-select");
  if (select) select.value = nome;
  excluirMotoristaSelecionado("cadastro-motorista-select");
}

function removerVeiculoCadastro(placa) {
  const select = document.getElementById("cadastro-placa-select");
  if (select) select.value = placa;
  excluirVeiculoSelecionado("cadastro-placa-select");
}

// Funções auxiliares compartilhadas
function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;");
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function numeroCampo(id) {
  return numero(id);
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function limparCampos(ids) {
  ids.forEach(id => setValorCampo(id, ""));
}

function normalizarChave(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function contemBusca(texto, busca) {
  return (texto || "").toLowerCase().includes((busca || "").toLowerCase());
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarPaginaCadastros();
});
