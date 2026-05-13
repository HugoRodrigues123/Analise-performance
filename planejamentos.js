const PLAN_TITULOS = {
  mindmap: "Mapa mental",
  classe: "Diagrama de classe",
  atividade: "Diagrama de atividades",
  casoUso: "Diagrama de casos de uso"
};

const PLAN_TEMPLATES = {
  mindmap: "Ideia central",
  classe: "Classe\n- atributo\n+ metodo()",
  atividade: "Atividade",
  casoUso: "Caso de uso"
};

let planejamentoAtual = criarPlanejamentoVazio();
let nodeSelecionado = null;
let conexaoOrigem = null;
let dragState = null;

function inicializarPlanejamentos() {
  preencherListaPlanejamentos();
  renderizarPlanejamento();
}

function criarPlanejamentoVazio(tipo = "mindmap") {
  return {
    id: `plan_${Date.now()}`,
    nome: "Novo planejamento",
    tipo,
    atas: [],
    nodes: [
      { id: `node_${Date.now()}`, text: PLAN_TEMPLATES[tipo], x: 760, y: 470, color: "blue", shape: tipo }
    ],
    links: [],
    atualizadoEm: new Date().toISOString()
  };
}

function getPlanejamentos() {
  return getListaStorage(PLANEJAMENTOS_KEY);
}

function setPlanejamentos(lista) {
  setListaStorage(PLANEJAMENTOS_KEY, lista);
}

function preencherListaPlanejamentos() {
  const select = document.getElementById("plan-lista");
  if (!select) return;
  const lista = getPlanejamentos();
  select.innerHTML = '<option value="">Novo / não salvo</option>' + lista
    .map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.nome || "Sem nome")}</option>`)
    .join("");
  select.value = lista.some((item) => item.id === planejamentoAtual.id) ? planejamentoAtual.id : "";
}

function novoPlanejamento() {
  planejamentoAtual = criarPlanejamentoVazio(valorCampo("plan-tipo") || "mindmap");
  nodeSelecionado = planejamentoAtual.nodes[0]?.id || null;
  conexaoOrigem = null;
  preencherFormularioPlanejamento();
  preencherListaPlanejamentos();
  renderizarPlanejamento();
}

function carregarPlanejamentoSelecionado() {
  const id = valorCampo("plan-lista");
  if (!id) {
    novoPlanejamento();
    return;
  }
  const item = getPlanejamentos().find((plan) => plan.id === id);
  if (!item) return;
  planejamentoAtual = {
    ...criarPlanejamentoVazio(item.tipo || "mindmap"),
    ...item,
    nodes: Array.isArray(item.nodes) ? item.nodes : [],
    links: Array.isArray(item.links) ? item.links : [],
    atas: Array.isArray(item.atas) ? item.atas : []
  };
  nodeSelecionado = planejamentoAtual.nodes[0]?.id || null;
  conexaoOrigem = null;
  preencherFormularioPlanejamento();
  renderizarPlanejamento();
}

function salvarPlanejamento() {
  planejamentoAtual.nome = valorCampo("plan-nome") || "Planejamento sem nome";
  planejamentoAtual.tipo = valorCampo("plan-tipo") || planejamentoAtual.tipo || "mindmap";
  planejamentoAtual.atas = Array.isArray(planejamentoAtual.atas) ? planejamentoAtual.atas : [];
  planejamentoAtual.atualizadoEm = new Date().toISOString();

  const lista = getPlanejamentos();
  const idx = lista.findIndex((item) => item.id === planejamentoAtual.id);
  if (idx >= 0) lista[idx] = planejamentoAtual;
  else lista.unshift(planejamentoAtual);
  setPlanejamentos(lista);
  preencherListaPlanejamentos();
  setStatusPlanejamento("Planejamento salvo");
  mostrarMensagem("Planejamento salvo com sucesso.", "Planejamentos");
}

async function excluirPlanejamento() {
  const id = planejamentoAtual.id;
  const existe = getPlanejamentos().some((item) => item.id === id);
  if (!existe) {
    novoPlanejamento();
    return;
  }
  if (!await confirmarAcao("Excluir este planejamento?")) return;
  setPlanejamentos(getPlanejamentos().filter((item) => item.id !== id));
  novoPlanejamento();
}

function selecionarFerramenta(tipo) {
  document.getElementById("plan-tipo").value = tipo;
  trocarTipoPlanejamento();
}

function trocarTipoPlanejamento() {
  const tipo = valorCampo("plan-tipo") || "mindmap";
  planejamentoAtual.tipo = tipo;
  document.querySelectorAll(".plan-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === tipo);
  });
  setTexto("plan-tool-title", PLAN_TITULOS[tipo]);
  planejamentoAtual.nodes.forEach((node) => {
    node.shape = node.shape === "mindmap" || !node.shape ? tipo : node.shape;
  });
  if (!planejamentoAtual.nodes.length) adicionarNo();
  renderizarPlanejamento();
}

function preencherFormularioPlanejamento() {
  setValorCampo("plan-nome", planejamentoAtual.nome || "Novo planejamento");
  setValorCampo("plan-tipo", planejamentoAtual.tipo || "mindmap");
  preencherDataAta();
  renderizarAtasReuniao();
  trocarTipoPlanejamento();
}

function marcarPlanejamentoAlterado() {
  planejamentoAtual.nome = valorCampo("plan-nome") || "Planejamento sem nome";
}

function adicionarNo() {
  const tipo = valorCampo("plan-tipo") || "mindmap";
  const total = planejamentoAtual.nodes.length;
  const node = {
    id: `node_${Date.now()}_${Math.round(Math.random() * 9999)}`,
    text: PLAN_TEMPLATES[tipo],
    x: 640 + (total % 4) * 210,
    y: 360 + Math.floor(total / 4) * 140,
    color: ["blue", "green", "amber", "violet"][total % 4],
    shape: tipo
  };
  planejamentoAtual.nodes.push(node);
  nodeSelecionado = node.id;
  renderizarPlanejamento();
}

function adicionarFilho() {
  if (!nodeSelecionado) {
    adicionarNo();
    return;
  }
  const pai = getNode(nodeSelecionado);
  if (!pai) return;
  const tipo = valorCampo("plan-tipo") || "mindmap";
  const filhos = planejamentoAtual.links.filter((link) => link.from === pai.id).length;
  const node = {
    id: `node_${Date.now()}_${Math.round(Math.random() * 9999)}`,
    text: tipo === "mindmap" ? "Nova ideia" : PLAN_TEMPLATES[tipo],
    x: pai.x + 260,
    y: pai.y + (filhos - 1) * 92,
    color: filhos % 2 ? "green" : "blue",
    shape: tipo
  };
  planejamentoAtual.nodes.push(node);
  planejamentoAtual.links.push({ from: pai.id, to: node.id });
  nodeSelecionado = node.id;
  renderizarPlanejamento();
}

function iniciarConexao() {
  if (!nodeSelecionado) {
    setStatusPlanejamento("Selecione um nó para iniciar a conexão");
    return;
  }
  conexaoOrigem = nodeSelecionado;
  setStatusPlanejamento("Selecione outro nó para conectar");
  renderizarPlanejamento();
}

function removerSelecionado() {
  if (!nodeSelecionado) return;
  planejamentoAtual.nodes = planejamentoAtual.nodes.filter((node) => node.id !== nodeSelecionado);
  planejamentoAtual.links = planejamentoAtual.links.filter((link) => link.from !== nodeSelecionado && link.to !== nodeSelecionado);
  nodeSelecionado = planejamentoAtual.nodes[0]?.id || null;
  renderizarPlanejamento();
}

function atualizarTextoSelecionado() {
  const node = getNode(nodeSelecionado);
  if (!node) return;
  node.text = document.getElementById("plan-node-texto").value;
  renderizarPlanejamento(false);
}

function atualizarCorSelecionada() {
  const node = getNode(nodeSelecionado);
  if (!node) return;
  node.color = valorCampo("plan-node-cor") || "blue";
  renderizarPlanejamento();
}

function renderizarPlanejamento(atualizarEditor = true) {
  const nodesEl = document.getElementById("plan-nodes");
  const linksEl = document.getElementById("plan-links");
  if (!nodesEl || !linksEl) return;

  document.querySelectorAll(".plan-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === planejamentoAtual.tipo);
  });
  setTexto("plan-tool-title", PLAN_TITULOS[planejamentoAtual.tipo] || "Planejamento");

  linksEl.innerHTML = planejamentoAtual.links.map(renderLink).join("");
  nodesEl.innerHTML = planejamentoAtual.nodes.map(renderNode).join("");
  if (atualizarEditor) atualizarEditorSelecionado();
  setStatusPlanejamento(`${planejamentoAtual.nodes.length} nó(s) / ${planejamentoAtual.links.length} conexão(ões)`);
}

function renderNode(node) {
  const classeShape = `node-${node.shape || planejamentoAtual.tipo}`;
  const selected = node.id === nodeSelecionado ? "selected" : "";
  const connecting = node.id === conexaoOrigem ? "connecting" : "";
  const conteudo = node.shape === "classe"
    ? renderClasseNode(node.text)
    : `<span>${escapeHtml(node.text || "Sem texto")}</span>`;
  return `
    <button class="planner-node ${classeShape} node-${node.color || "blue"} ${selected} ${connecting}"
      type="button"
      style="left:${Number(node.x) || 0}px;top:${Number(node.y) || 0}px"
      onmousedown="iniciarArrasteNo(event,'${escapeAttr(node.id)}')"
      onclick="selecionarNo(event,'${escapeAttr(node.id)}')">${conteudo}</button>
  `;
}

function renderClasseNode(texto) {
  const partes = String(texto || "Classe").split(/\r?\n/);
  const titulo = partes.shift() || "Classe";
  return `<div class="node-title">${escapeHtml(titulo)}</div><div class="node-body">${escapeHtml(partes.join("\n"))}</div>`;
}

function renderLink(link) {
  const from = getNode(link.from);
  const to = getNode(link.to);
  if (!from || !to) return "";
  const x1 = (Number(from.x) || 0) + larguraNo(from) / 2;
  const y1 = (Number(from.y) || 0) + alturaNo(from) / 2;
  const x2 = (Number(to.x) || 0) + larguraNo(to) / 2;
  const y2 = (Number(to.y) || 0) + alturaNo(to) / 2;
  const curva = Math.max(80, Math.abs(x2 - x1) / 2);
  return `<path class="planning-link" d="M ${x1} ${y1} C ${x1 + curva} ${y1}, ${x2 - curva} ${y2}, ${x2} ${y2}"></path>`;
}

function selecionarNo(event, id) {
  event.stopPropagation();
  if (conexaoOrigem && conexaoOrigem !== id) {
    const existe = planejamentoAtual.links.some((link) => link.from === conexaoOrigem && link.to === id);
    if (!existe) planejamentoAtual.links.push({ from: conexaoOrigem, to: id });
    conexaoOrigem = null;
  }
  nodeSelecionado = id;
  renderizarPlanejamento();
}

function iniciarArrasteNo(event, id) {
  event.stopPropagation();
  nodeSelecionado = id;
  const node = getNode(id);
  if (!node) return;
  dragState = {
    id,
    startX: event.clientX,
    startY: event.clientY,
    nodeX: Number(node.x) || 0,
    nodeY: Number(node.y) || 0
  };
  document.addEventListener("mousemove", arrastarNo);
  document.addEventListener("mouseup", encerrarArrasteNo, { once: true });
}

function arrastarNo(event) {
  if (!dragState) return;
  const node = getNode(dragState.id);
  if (!node) return;
  node.x = Math.max(20, dragState.nodeX + event.clientX - dragState.startX);
  node.y = Math.max(20, dragState.nodeY + event.clientY - dragState.startY);
  renderizarPlanejamento(false);
}

function encerrarArrasteNo() {
  dragState = null;
  document.removeEventListener("mousemove", arrastarNo);
  renderizarPlanejamento();
}

function limparSelecaoCanvas(event) {
  if (event.target.id !== "plan-canvas") return;
  nodeSelecionado = null;
  conexaoOrigem = null;
  renderizarPlanejamento();
}

function organizarMapa() {
  if (!planejamentoAtual.nodes.length) return;
  const centro = planejamentoAtual.nodes[0];
  centro.x = 760;
  centro.y = 470;
  const filhos = planejamentoAtual.nodes.slice(1);
  const raioX = planejamentoAtual.tipo === "mindmap" ? 360 : 300;
  const raioY = planejamentoAtual.tipo === "mindmap" ? 240 : 210;
  filhos.forEach((node, index) => {
    const angulo = (Math.PI * 2 * index) / Math.max(1, filhos.length);
    node.x = centro.x + Math.cos(angulo) * raioX;
    node.y = centro.y + Math.sin(angulo) * raioY;
    if (!planejamentoAtual.links.some((link) => link.to === node.id || link.from === node.id)) {
      planejamentoAtual.links.push({ from: centro.id, to: node.id });
    }
  });
  renderizarPlanejamento();
}

function centralizarMapa() {
  const canvas = document.getElementById("plan-canvas");
  if (!canvas) return;
  canvas.scrollLeft = 520;
  canvas.scrollTop = 260;
}

function atualizarEditorSelecionado() {
  const node = getNode(nodeSelecionado);
  const texto = document.getElementById("plan-node-texto");
  const cor = document.getElementById("plan-node-cor");
  if (!texto || !cor) return;
  texto.value = node?.text || "";
  texto.disabled = !node;
  cor.value = node?.color || "blue";
  cor.disabled = !node;
}

function salvarAtaReuniao() {
  const data = valorCampo("ata-data");
  const titulo = valorCampo("ata-titulo");
  const conteudos = valorCampo("ata-conteudos");
  if (!data || !titulo || !conteudos) {
    mostrarMensagem("Informe a data, o título e os conteúdos abordados.", "Ata de Reunião");
    return;
  }

  planejamentoAtual.atas = Array.isArray(planejamentoAtual.atas) ? planejamentoAtual.atas : [];
  planejamentoAtual.atas.unshift({
    id: `ata_${Date.now()}`,
    data,
    titulo,
    participantes: valorCampo("ata-participantes"),
    conteudos,
    acoes: valorCampo("ata-acoes"),
    criadoEm: new Date().toISOString()
  });

  limparAtaReuniao(false);
  renderizarAtasReuniao();
  salvarPlanejamento();
}

function limparAtaReuniao(renderizar = true) {
  setValorCampo("ata-titulo", "");
  setValorCampo("ata-participantes", "");
  setValorCampo("ata-conteudos", "");
  setValorCampo("ata-acoes", "");
  preencherDataAta();
  if (renderizar) renderizarAtasReuniao();
}

async function excluirAtaReuniao(id) {
  if (!await confirmarAcao("Excluir esta ata de reunião?")) return;
  planejamentoAtual.atas = (planejamentoAtual.atas || []).filter((ata) => ata.id !== id);
  renderizarAtasReuniao();
  salvarPlanejamento();
}

function renderizarAtasReuniao() {
  const destino = document.getElementById("ata-lista");
  if (!destino) return;
  const atas = Array.isArray(planejamentoAtual.atas) ? planejamentoAtual.atas : [];
  if (!atas.length) {
    destino.innerHTML = '<div class="hist-empty">Nenhuma ata registrada neste planejamento.</div>';
    return;
  }

  destino.innerHTML = atas.map((ata) => `
    <div class="meeting-entry">
      <div class="meeting-entry-head">
        <div>
          <strong>${escapeHtml(ata.titulo)}</strong>
          <span>${formatarData(ata.data)}${ata.participantes ? ` - ${escapeHtml(ata.participantes)}` : ""}</span>
        </div>
        <button class="btn btn-sm btn-red" type="button" onclick="excluirAtaReuniao('${escapeAttr(ata.id)}')">Excluir</button>
      </div>
      <div class="meeting-entry-body">
        <div><b>Conteúdos:</b><br>${escapeHtml(ata.conteudos).replace(/\n/g, "<br>")}</div>
        ${ata.acoes ? `<div><b>Ações:</b><br>${escapeHtml(ata.acoes).replace(/\n/g, "<br>")}</div>` : ""}
      </div>
    </div>
  `).join("");
}

function preencherDataAta() {
  const data = document.getElementById("ata-data");
  if (data && !data.value) data.value = new Date().toISOString().slice(0, 10);
}

function getNode(id) {
  return planejamentoAtual.nodes.find((node) => node.id === id);
}

function larguraNo(node) {
  if (node.shape === "classe") return 220;
  if (node.shape === "casoUso") return 190;
  return 180;
}

function alturaNo(node) {
  if (node.shape === "classe") return 130;
  if (node.shape === "casoUso") return 82;
  return 58;
}

function setStatusPlanejamento(texto) {
  setTexto("plan-status", texto);
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
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
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializarPlanejamentos();
  document.addEventListener("keydown", atalhosPlanejamento);
  preencherDataAta();
  renderizarAtasReuniao();
  setTimeout(centralizarMapa, 50);
});

function atalhosPlanejamento(event) {
  if (event.key !== "Tab") return;
  if ((valorCampo("plan-tipo") || planejamentoAtual.tipo) !== "mindmap") return;
  const alvo = event.target;
  if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) return;

  event.preventDefault();
  if (nodeSelecionado) adicionarFilho();
  else adicionarNo();
}
