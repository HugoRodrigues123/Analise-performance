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
    alert("Informe origem e destino do trajeto.");
    return;
  }
  const fab = valorCampo("trajeto-fab") || "vw";
  const nome = `${origem} - ${destino}`;
  const desempenho = valorCampo("trajeto-desempenho") || "Medio";
  const condicaoCarga = valorCampo("trajeto-carga") || "Carregado";
  const registro = {
    id: `${normalizarChave(nome)}-${fab}-${normalizarChave(valorCampo("trajeto-modelo"))}`,
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
      <div class="ops-entry-meta">${escapeHtml(t.origem ? `Origem: ${t.origem} - Destino: ${t.destino} - ${condicaoCargaTrajeto(t)}` : "Origem/destino nao informados")}</div>
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

function excluirTrajeto(id) {
  if (!confirm("Tem certeza que deseja excluir este trajeto?")) return;
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

function salvarMotoristaCadastro() {
  const input = document.getElementById("cadastro-motorista-nome");
  const nome = input?.value.trim();
  if (!nome) {
    alert("Informe o nome do motorista.");
    return;
  }
  salvarMotoristaNome(nome);
  input.value = "";
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
  const buscaMotorista = valorCampo("cad-busca-motorista");
  const buscaVeiculo = valorCampo("cad-busca-veiculo");
  const motoristasFiltrados = motoristas.filter((m) => !buscaMotorista || contemBusca(m.nome, buscaMotorista));
  const veiculosFiltrados = veiculos.filter((v) => {
    if (!buscaVeiculo) return true;
    return contemBusca(`${v.placa || ""} ${FABRICANTES[v.fab] || v.fabricante || ""} ${v.modelo || ""} ${v.ano || ""} ${v.tracao || ""}`, buscaVeiculo);
  });
  const motoristasVisiveis = motoristasFiltrados;
  const veiculosVisiveis = veiculosFiltrados;
  setTexto("cad-kpi-motoristas", motoristas.length);
  setTexto("cad-kpi-veiculos", veiculos.length);

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
  inicializar();
});