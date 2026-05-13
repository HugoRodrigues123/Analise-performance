const EQUIP_TIPOS = [
  { id: "telemetria", label: "Telemetria" },
  { id: "camera", label: "Câmera" },
  { id: "rastreador", label: "Rastreador" }
];

const EQUIP_STATUS = {
  disponivel: "Disponível",
  instalado: "Instalado",
  retirado: "Retirado",
  manutencao: "Manutenção"
};

const MANUTENCAO_ITENS = {
  rastreador: [
    "Tablet",
    "Sensor de Porta do Motorista",
    "Sensor de Porta do Carona",
    "Desengate",
    "Violação Painel",
    "Rastreador"
  ],
  camera: [
    "Sensor de Fadiga",
    "Câmera Frontal",
    "Câmera Externa Lado Motorista",
    "Câmera Externa Lado Passageiro",
    "Câmera Interna"
  ],
  telemetria: ["Revisão", "Substituição"]
};

let equipamentoEditando = null;

function getBaseTelemetria() {
  return getListaStorage(TELEMETRIA_KEY);
}

function getEquipamentos() {
  return getBaseTelemetria().filter((item) => item.categoria === "equipamento");
}

function getManutencoesEquipamentos() {
  return getBaseTelemetria().filter((item) => item.categoria === "manutencaoEquipamento");
}

function getLegadoTelemetria() {
  return getBaseTelemetria().filter((item) => !["equipamento", "manutencaoEquipamento"].includes(item.categoria));
}

function setEquipamentos(lista) {
  setListaStorage(TELEMETRIA_KEY, [...getLegadoTelemetria(), ...getManutencoesEquipamentos(), ...lista]);
}

function setManutencoesEquipamentos(lista) {
  setListaStorage(TELEMETRIA_KEY, [...getLegadoTelemetria(), ...lista, ...getEquipamentos()]);
}

function inicializarEquipamentos() {
  popularSelectsEquipamentos();
  preencherDatasEquipamentos();
  atualizarItensManutencao();
  renderizarEquipamentos();
}

function popularSelectsEquipamentos() {
  const placas = (typeof getVeiculos === "function" ? getVeiculos() : [])
    .map((v) => v.placa)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));

  ["equip-placa", "mov-placa", "manut-placa"].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Sem vínculo</option>' + placas
      .map((placa) => `<option value="${escapeAttr(placa)}">${escapeHtml(placa)}</option>`)
      .join("");
  });

  atualizarSelectMovimentacao();
}

function atualizarSelectMovimentacao() {
  const select = document.getElementById("mov-equipamento");
  if (!select) return;
  const lista = getEquipamentos();
  select.innerHTML = '<option value="">Selecione</option>' + lista
    .map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(labelEquipamento(item))}</option>`)
    .join("");
}

function preencherDatasEquipamentos() {
  const hoje = new Date().toISOString().slice(0, 10);
  ["equip-data", "mov-data", "manut-data"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = hoje;
  });
}

function salvarEquipamento() {
  const tipo = valorCampo("equip-tipo");
  const codigo = valorCampo("equip-codigo").toUpperCase();
  if (!codigo) {
    mostrarMensagem("Informe o código ou serial do equipamento.", "Controle de Equipamentos");
    return;
  }

  const lista = getEquipamentos();
  const duplicado = lista.some((item) => item.codigo === codigo && item.id !== equipamentoEditando);
  if (duplicado) {
    mostrarMensagem("Este código já está cadastrado.", "Controle de Equipamentos");
    return;
  }

  const status = valorCampo("equip-status") || "disponivel";
  const registro = {
    id: equipamentoEditando || `EQP-${Date.now()}`,
    categoria: "equipamento",
    tipo,
    codigo,
    status,
    placa: status === "instalado" ? valorCampo("equip-placa") : "",
    data: valorCampo("equip-data") || new Date().toISOString().slice(0, 10),
    modelo: valorCampo("equip-modelo"),
    responsavel: valorCampo("equip-responsavel"),
    obs: valorCampo("equip-obs"),
    movimentacoes: []
  };

  const idx = lista.findIndex((item) => item.id === registro.id);
  if (idx >= 0) {
    registro.movimentacoes = Array.isArray(lista[idx].movimentacoes) ? lista[idx].movimentacoes : [];
    lista[idx] = { ...lista[idx], ...registro };
  } else {
    registro.movimentacoes.unshift(criarMovimentacao(status === "instalado" ? "instalacao" : status, registro));
    lista.unshift(registro);
  }

  setEquipamentos(lista);
  limparEquipamento(false);
  renderizarEquipamentos();
  mostrarMensagem("Equipamento salvo com sucesso.", "Controle de Equipamentos");
}

function salvarMovimentacaoEquipamento() {
  const id = valorCampo("mov-equipamento");
  if (!id) {
    mostrarMensagem("Selecione um equipamento para movimentar.", "Controle de Equipamentos");
    return;
  }

  const lista = getEquipamentos();
  const idx = lista.findIndex((item) => item.id === id);
  if (idx < 0) return;

  const tipoMov = valorCampo("mov-tipo");
  const equipamento = lista[idx];
  const status = statusPorMovimentacao(tipoMov);
  equipamento.status = status;
  equipamento.placa = status === "instalado" ? valorCampo("mov-placa") : "";
  equipamento.data = valorCampo("mov-data") || new Date().toISOString().slice(0, 10);
  equipamento.movimentacoes = Array.isArray(equipamento.movimentacoes) ? equipamento.movimentacoes : [];
  equipamento.movimentacoes.unshift(criarMovimentacao(tipoMov, equipamento, valorCampo("mov-obs")));

  lista[idx] = equipamento;
  setEquipamentos(lista);
  limparMovimentacao(false);
  renderizarEquipamentos();
  mostrarMensagem("Movimentação salva com sucesso.", "Controle de Equipamentos");
}

function criarMovimentacao(tipo, equipamento, obs = "") {
  return {
    id: `MOV-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    tipo,
    data: valorCampo("mov-data") || valorCampo("equip-data") || new Date().toISOString().slice(0, 10),
    placa: valorCampo("mov-placa") || valorCampo("equip-placa") || equipamento.placa || "",
    responsavel: valorCampo("equip-responsavel") || "",
    obs: obs || equipamento.obs || ""
  };
}

function statusPorMovimentacao(tipoMov) {
  if (tipoMov === "instalacao") return "instalado";
  if (tipoMov === "retirada") return "retirado";
  if (tipoMov === "manutencao") return "manutencao";
  return "disponivel";
}

function renderizarEquipamentos() {
  const lista = getEquipamentos();
  renderizarDashboardEquipamentos(lista);
  renderizarListaEquipamentos(lista);
  renderizarRetiradasEquipamentos(lista);
  renderizarManutencoesEquipamentos();
  atualizarSelectMovimentacao();
}

function renderizarDashboardEquipamentos(lista) {
  const destino = document.getElementById("equip-dashboard");
  if (!destino) return;
  const frota = resumoEquipamentosFrota();

  destino.innerHTML = EQUIP_TIPOS.map((tipo) => {
    const itens = lista.filter((item) => item.tipo === tipo.id);
    const frotaTipo = frota[tipo.id] || { total: 0, ok: 0, irregular: 0 };
    const disponiveis = itens.filter((item) => item.status === "disponivel").length;
    const instalados = itens.filter((item) => item.status === "instalado").length;
    const retirados = itens.filter((item) => item.status === "retirado").length;
    const manutencao = itens.filter((item) => item.status === "manutencao").length;
    const totalControlado = frotaTipo.total + disponiveis;
    return `
      <div class="equipment-card">
        <div class="equipment-card-head">
          <span>${escapeHtml(tipo.label)}</span>
          <strong>${totalControlado}</strong>
        </div>
        <div class="equipment-bars">
          <div><span>Total controlado</span><strong>${totalControlado}</strong></div>
          <div><span>Na frota</span><strong>${frotaTipo.total}</strong></div>
          <div><span>OK na frota</span><strong>${frotaTipo.ok}</strong></div>
          <div><span>Irregular na frota</span><strong>${frotaTipo.irregular}</strong></div>
          <div><span>Disponíveis para instalação</span><strong>${disponiveis}</strong></div>
          <div><span>Instalados</span><strong>${instalados}</strong></div>
          <div><span>Retirados</span><strong>${retirados}</strong></div>
          <div><span>Manutenção</span><strong>${manutencao}</strong></div>
        </div>
      </div>
    `;
  }).join("");
}

function resumoEquipamentosFrota() {
  const resumo = {
    telemetria: { total: 0, ok: 0, irregular: 0 },
    camera: { total: 0, ok: 0, irregular: 0 },
    rastreador: { total: 0, ok: 0, irregular: 0 }
  };

  (typeof getVeiculos === "function" ? getVeiculos() : []).forEach((veiculo) => {
    const frota = normalizarFrotaEquipamentos(veiculo.situacaoFrota || {});
    contarEquipamentoFrota(resumo.rastreador, frota, "rastreador");
    contarEquipamentoFrota(resumo.camera, frota, "cameras");
    contarEquipamentoFrota(resumo.telemetria, frota, "telemetria");
  });

  return resumo;
}

function contarEquipamentoFrota(destino, frota, campo) {
  if (frota.presenca?.[campo] === false) return;
  const status = getStatusFrotaEquipamento(frota, campo);
  destino.total += 1;
  if (status === "irregular") destino.irregular += 1;
  else destino.ok += 1;
}

function normalizarFrotaEquipamentos(situacaoFrota) {
  const normalizada = { ...situacaoFrota };
  const presencaAtual = normalizada.presenca || {};
  normalizada.presenca = {
    rastreador: presencaAtual.rastreador === false || normalizada.rastreadorPresente === false ? false : true,
    cameras: presencaAtual.cameras === false || normalizada.camerasPresente === false ? false : true,
    telemetria: presencaAtual.telemetria === false || normalizada.telemetriaPresente === false ? false : true
  };
  normalizada.rastreadorDetalhes = {
    sinal: statusFrotaValor(normalizada.rastreadorDetalhes?.sinal),
    tablet: statusFrotaValor(normalizada.rastreadorDetalhes?.tablet || normalizada.tablet)
  };
  normalizada.camerasDetalhes = {
    interna: statusFrotaValor(normalizada.camerasDetalhes?.interna),
    frontal: statusFrotaValor(normalizada.camerasDetalhes?.frontal),
    fadiga: statusFrotaValor(normalizada.camerasDetalhes?.fadiga),
    externaDireita: statusFrotaValor(normalizada.camerasDetalhes?.externaDireita),
    externaEsquerda: statusFrotaValor(normalizada.camerasDetalhes?.externaEsquerda)
  };
  normalizada.telemetriaDetalhes = {
    principal: statusFrotaValor(normalizada.telemetriaDetalhes?.principal || normalizada.telemetria)
  };
  normalizada.rastreador = Object.values(normalizada.rastreadorDetalhes).includes("irregular") ? "irregular" : statusFrotaValor(normalizada.rastreador);
  normalizada.cameras = Object.values(normalizada.camerasDetalhes).includes("irregular") ? "irregular" : statusFrotaValor(normalizada.cameras);
  normalizada.telemetria = statusFrotaValor(normalizada.telemetriaDetalhes.principal);
  return normalizada;
}

function getStatusFrotaEquipamento(frota, campo) {
  if (campo === "rastreador") return frota.rastreador;
  if (campo === "cameras") return frota.cameras;
  if (campo === "telemetria") return frota.telemetria;
  return "ok";
}

function statusFrotaValor(valor) {
  return valor === "irregular" ? "irregular" : "ok";
}

function renderizarListaEquipamentos(lista) {
  const destino = document.getElementById("equip-lista");
  if (!destino) return;
  const busca = valorCampo("equip-busca").toLowerCase();
  const filtrada = lista.filter((item) => [
    labelTipo(item.tipo),
    item.codigo,
    item.status,
    item.placa,
    item.modelo,
    item.responsavel,
    item.obs
  ].join(" ").toLowerCase().includes(busca));

  if (!filtrada.length) {
    destino.innerHTML = '<div class="hist-empty">Nenhum equipamento cadastrado.</div>';
    return;
  }

  destino.innerHTML = filtrada.map((item) => `
    <div class="ops-entry equipment-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(labelEquipamento(item))}</span>
        <span class="status-pill ${classeStatusEquipamento(item.status)}">${escapeHtml(EQUIP_STATUS[item.status] || item.status)}</span>
      </div>
      <div class="ops-entry-meta">
        ${escapeHtml(item.placa || "Sem placa vinculada")} - ${formatarData(item.data)} - ${escapeHtml(item.modelo || "Sem modelo informado")}
      </div>
      <div class="ops-entry-body">${escapeHtml(item.obs || "Sem observações")}</div>
      <div class="equipment-actions">
        <button class="btn btn-sm" type="button" onclick="editarEquipamento('${escapeAttr(item.id)}')">Editar</button>
        <button class="btn btn-sm btn-red" type="button" onclick="excluirEquipamento('${escapeAttr(item.id)}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function renderizarRetiradasEquipamentos(lista) {
  const destino = document.getElementById("equip-retiradas");
  if (!destino) return;
  const retiradas = lista.flatMap((item) => (item.movimentacoes || [])
    .filter((mov) => mov.tipo === "retirada")
    .map((mov) => ({ ...mov, equipamento: item })))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))
    .slice(0, 30);

  if (!retiradas.length) {
    destino.innerHTML = '<div class="hist-empty">Nenhuma retirada registrada.</div>';
    return;
  }

  destino.innerHTML = retiradas.map((mov) => `
    <div class="hist-entry">
      <div class="hist-entry-header">
        <span style="font-weight:700;color:var(--text)">${escapeHtml(labelEquipamento(mov.equipamento))}</span>
        <span class="hist-entry-media">${formatarData(mov.data)}</span>
      </div>
      <div class="hist-entry-obs">
        Placa: ${escapeHtml(mov.placa || "Sem placa")} - ${escapeHtml(mov.obs || "Sem motivo informado")}
      </div>
    </div>
  `).join("");
}

function salvarManutencaoEquipamento() {
  const tipo = valorCampo("manut-tipo");
  const item = valorCampo("manut-item");
  const placa = valorCampo("manut-placa");
  const data = valorCampo("manut-data") || new Date().toISOString().slice(0, 10);
  if (!tipo || !item || !data) {
    mostrarMensagem("Informe tipo, item e data da manutenção.", "Controle de Equipamentos");
    return;
  }

  const lista = getManutencoesEquipamentos();
  lista.unshift({
    id: `MAN-${Date.now()}`,
    categoria: "manutencaoEquipamento",
    tipo,
    item,
    placa,
    data,
    responsavel: valorCampo("manut-responsavel"),
    status: valorCampo("manut-status") || "realizada",
    equipamento: valorCampo("manut-equipamento"),
    obs: valorCampo("manut-obs")
  });
  setManutencoesEquipamentos(lista.slice(0, 300));
  limparManutencaoEquipamento(false);
  renderizarEquipamentos();
  mostrarMensagem("Manutenção registrada com sucesso.", "Controle de Equipamentos");
}

function renderizarManutencoesEquipamentos() {
  const destino = document.getElementById("equip-manutencoes");
  if (!destino) return;
  const lista = getManutencoesEquipamentos();
  if (!lista.length) {
    destino.innerHTML = '<div class="hist-empty">Nenhuma manutenção registrada.</div>';
    return;
  }

  destino.innerHTML = lista.slice(0, 40).map((item) => `
    <div class="hist-entry">
      <div class="hist-entry-header">
        <span style="font-weight:700;color:var(--text)">${escapeHtml(labelTipo(item.tipo))} - ${escapeHtml(item.item)}</span>
        <span class="hist-entry-media">${formatarData(item.data)}</span>
      </div>
      <div class="hist-entry-obs">
        ${escapeHtml(item.placa || "Sem placa")} - ${escapeHtml(item.status || "realizada")} - ${escapeHtml(item.responsavel || "Sem responsável")}
      </div>
      ${item.obs ? `<div class="hist-entry-obs">${escapeHtml(item.obs)}</div>` : ""}
    </div>
  `).join("");
}

function atualizarItensManutencao() {
  const tipo = valorCampo("manut-tipo") || "rastreador";
  const select = document.getElementById("manut-item");
  if (!select) return;
  select.innerHTML = (MANUTENCAO_ITENS[tipo] || [])
    .map((item) => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`)
    .join("");
}

function limparManutencaoEquipamento(renderizar = true) {
  setValorCampo("manut-tipo", "rastreador");
  atualizarItensManutencao();
  setValorCampo("manut-placa", "");
  setValorCampo("manut-data", new Date().toISOString().slice(0, 10));
  setValorCampo("manut-responsavel", "");
  setValorCampo("manut-status", "realizada");
  setValorCampo("manut-equipamento", "");
  setValorCampo("manut-obs", "");
  if (renderizar) renderizarEquipamentos();
}

function editarEquipamento(id) {
  const item = getEquipamentos().find((equip) => equip.id === id);
  if (!item) return;
  equipamentoEditando = id;
  setValorCampo("equip-tipo", item.tipo);
  setValorCampo("equip-codigo", item.codigo);
  setValorCampo("equip-status", item.status);
  setValorCampo("equip-placa", item.placa || "");
  setValorCampo("equip-data", item.data || new Date().toISOString().slice(0, 10));
  setValorCampo("equip-modelo", item.modelo || "");
  setValorCampo("equip-responsavel", item.responsavel || "");
  setValorCampo("equip-obs", item.obs || "");
  atualizarCamposStatusEquipamento();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirEquipamento(id) {
  if (!await confirmarAcao("Excluir este equipamento?")) return;
  setEquipamentos(getEquipamentos().filter((item) => item.id !== id));
  renderizarEquipamentos();
}

function limparEquipamento(renderizar = true) {
  equipamentoEditando = null;
  ["equip-codigo", "equip-modelo", "equip-responsavel", "equip-obs"].forEach((id) => setValorCampo(id, ""));
  setValorCampo("equip-tipo", "telemetria");
  setValorCampo("equip-status", "disponivel");
  setValorCampo("equip-placa", "");
  setValorCampo("equip-data", new Date().toISOString().slice(0, 10));
  atualizarCamposStatusEquipamento();
  if (renderizar) renderizarEquipamentos();
}

function limparMovimentacao(renderizar = true) {
  setValorCampo("mov-equipamento", "");
  setValorCampo("mov-tipo", "instalacao");
  setValorCampo("mov-placa", "");
  setValorCampo("mov-data", new Date().toISOString().slice(0, 10));
  setValorCampo("mov-obs", "");
  if (renderizar) renderizarEquipamentos();
}

function atualizarCamposStatusEquipamento() {
  const placa = document.getElementById("equip-placa");
  if (!placa) return;
  placa.disabled = valorCampo("equip-status") !== "instalado";
  if (placa.disabled) placa.value = "";
}

function labelEquipamento(item) {
  return `${labelTipo(item.tipo)} - ${item.codigo || "Sem código"}`;
}

function labelTipo(tipo) {
  return EQUIP_TIPOS.find((item) => item.id === tipo)?.label || tipo || "Equipamento";
}

function classeStatusEquipamento(status) {
  if (status === "disponivel") return "r-ex";
  if (status === "instalado") return "r-bo";
  if (status === "manutencao") return "r-re";
  return "r-cr";
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

function formatarData(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = String(data).split("-");
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
  inicializarEquipamentos();
});
