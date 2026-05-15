function inicializarDiagnostico() {
  preencherFiltrosDiagnostico();
  atualizarDiagnostico();
}

function recarregarDiagnostico() {
  preencherFiltrosDiagnostico();
  atualizarDiagnostico();
}

function registrosPerformanceValidos() {
  return getHistorico()
    .map(normalizarRegistroDiagnostico)
    .filter((r) => r.desloc > 0 && r.consumo > 0);
}

function normalizarRegistroDiagnostico(registro) {
  const veiculo = getVeiculos().find((v) => normalizarTexto(v.placa) === normalizarTexto(registro.placa));
  const fabKey = registro.fab || veiculo?.fab || "";
  const fabricante = registro.fabricante || (fabKey ? FABRICANTES[fabKey] : "") || veiculo?.fabricante || "";
  return {
    ...registro,
    desloc: numeroRegistro(registro.desloc),
    consumo: numeroRegistro(registro.consumo),
    motorista: registro.motorista || "Motorista não informado",
    placa: registro.placa || "Placa não informada",
    fab: fabKey,
    fabricante: fabricante || "Fabricante não informado",
    modelo: registro.modelo || veiculo?.modelo || "Modelo não informado",
    tracao: registro.tracao || veiculo?.tracao || "Tração não informada",
    data: String(registro.data || "").slice(0, 10)
  };
}

function preencherFiltrosDiagnostico() {
  const historico = registrosPerformanceValidos();
  preencherSelectDiagnostico("diag-motorista", historico.map((r) => r.motorista), "Todos");
  preencherSelectDiagnostico("diag-placa", historico.map((r) => r.placa), "Todas");
  preencherSelectDiagnostico("diag-fabricante", historico.map((r) => r.fabricante), "Todos");
  preencherSelectDiagnostico("diag-modelo", historico.map((r) => r.modelo), "Todos");
  preencherSelectDiagnostico("diag-tracao", historico.map((r) => r.tracao), "Todas");
}

function preencherSelectDiagnostico(id, valores, labelTodos) {
  const select = document.getElementById(id);
  if (!select) return;
  const atual = select.value;
  const unicos = Array.from(new Set(valores.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
  select.innerHTML = `<option value="">${labelTodos}</option>` + unicos
    .map((valor) => `<option value="${escapeAttr(valor)}">${escapeHtml(valor)}</option>`)
    .join("");
  if (atual && unicos.includes(atual)) select.value = atual;
}

function atualizarDiagnostico() {
  const todosRegistros = registrosPerformanceValidos();
  const registros = filtrarRegistrosDiagnostico(todosRegistros);
  const geralEmpresa = calcularResumoDiagnostico(todosRegistros);
  const resumoFiltrado = calcularResumoDiagnostico(registros);

  setTexto("diag-media-empresa", geralEmpresa.media ? geralEmpresa.media.toFixed(2) : "—");
  setTexto("diag-media-geral", resumoFiltrado.media ? resumoFiltrado.media.toFixed(2) : "—");
  setTexto("diag-km-total", formatarNumero(resumoFiltrado.km, 0));
  setTexto("diag-consumo-total", formatarNumero(resumoFiltrado.consumo, 0));
  setTexto("diag-total-registros", registros.length);

  renderizarGrupoDiagnostico("diag-por-placa", agruparRegistros(registros, "placa"), "placa");
  renderizarGrupoDiagnostico("diag-por-motorista", agruparRegistros(registros, "motorista"), "motorista");
  renderizarGrupoDiagnostico("diag-por-fabricante", agruparRegistros(registros, "fabricante"), "fabricante");
  renderizarGrupoDiagnostico("diag-por-modelo", agruparRegistros(registros, "modelo"), "modelo");
  renderizarGrupoDiagnostico("diag-por-tracao", agruparRegistros(registros, "tracao"), "tracao");
  renderizarImpactoCritico(registros, resumoFiltrado);
  renderizarRegistrosDiagnostico(registros);
}

function calcularResumoDiagnostico(registros) {
  const km = registros.reduce((total, r) => total + r.desloc, 0);
  const consumo = registros.reduce((total, r) => total + r.consumo, 0);
  return {
    km,
    consumo,
    media: km > 0 && consumo > 0 ? km / consumo : 0
  };
}

function filtrarRegistrosDiagnostico(registros) {
  const inicio = valorCampo("diag-data-inicio");
  const fim = valorCampo("diag-data-fim");
  const motorista = valorCampo("diag-motorista");
  const placa = valorCampo("diag-placa");
  const fabricante = valorCampo("diag-fabricante");
  const modelo = valorCampo("diag-modelo");
  const tracao = valorCampo("diag-tracao");

  return registros.filter((r) => {
    if (inicio && r.data < inicio) return false;
    if (fim && r.data > fim) return false;
    if (motorista && r.motorista !== motorista) return false;
    if (placa && r.placa !== placa) return false;
    if (fabricante && r.fabricante !== fabricante) return false;
    if (modelo && r.modelo !== modelo) return false;
    if (tracao && r.tracao !== tracao) return false;
    return true;
  });
}

function agruparRegistros(registros, chave) {
  const grupos = new Map();
  registros.forEach((registro) => {
    const nome = registro[chave] || "Não informado";
    if (!grupos.has(nome)) grupos.set(nome, { nome, km: 0, consumo: 0, registros: 0 });
    const grupo = grupos.get(nome);
    grupo.km += registro.desloc;
    grupo.consumo += registro.consumo;
    grupo.registros += 1;
  });

  return Array.from(grupos.values())
    .map((grupo) => ({
      ...grupo,
      media: grupo.km > 0 && grupo.consumo > 0 ? grupo.km / grupo.consumo : 0
    }))
    .sort((a, b) => b.media - a.media);
}

function renderizarGrupoDiagnostico(id, grupos, filtro) {
  const destino = document.getElementById(id);
  if (!destino) return;
  if (!grupos.length) {
    destino.innerHTML = '<div class="ops-empty">Sem dados para este filtro.</div>';
    return;
  }

  destino.innerHTML = grupos.map((grupo) => `
    <button class="diagnostic-row" type="button" onclick="selecionarFiltroDiagnostico('${escapeAttr(filtro)}','${escapeAttr(grupo.nome)}')">
      <span>
        <strong>${escapeHtml(grupo.nome)}</strong>
        <small>${grupo.registros} registro(s) • ${formatarNumero(grupo.km, 0)} km • ${formatarNumero(grupo.consumo, 0)} L</small>
      </span>
      <b>${grupo.media.toFixed(2)} km/L</b>
    </button>
  `).join("");
}

function renderizarImpactoCritico(registros, resumoGeral) {
  const resumoEl = document.getElementById("diag-analise-critica");
  const motoristas = calcularImpactosDiagnostico(agruparRegistros(registros, "motorista"), resumoGeral);
  const veiculos = calcularImpactosDiagnostico(agruparRegistros(registros, "placa"), resumoGeral);
  const condutoresBaixo = motoristas.filter((item) => item.impactoOperacional < 0);
  const veiculosBaixo = veiculos.filter((item) => item.impactoOperacional < 0);
  const piorCondutor = condutoresBaixo[0];
  const piorVeiculo = veiculosBaixo[0];

  if (resumoEl) {
    if (!registros.length || !resumoGeral.media) {
      resumoEl.innerHTML = '<div class="ops-empty">Sem registros suficientes para gerar análise crítica.</div>';
    } else if (!piorCondutor && !piorVeiculo) {
      resumoEl.innerHTML = `
        <div class="critical-card positive">
          <strong>Média equilibrada no filtro atual</strong>
          <span>A média geral analisada está em ${resumoGeral.media.toFixed(2)} km/L e não há grupos abaixo da média neste recorte.</span>
        </div>
      `;
    } else {
      const partes = [];
      if (piorCondutor) {
        partes.push(`o condutor <b>${escapeHtml(piorCondutor.nome)}</b> tem impacto operacional de <b>${formatarImpacto(piorCondutor.impactoOperacional, 3)}</b>`);
      }
      if (piorVeiculo) {
        partes.push(`o veículo <b>${escapeHtml(piorVeiculo.nome)}</b> tem impacto operacional de <b>${formatarImpacto(piorVeiculo.impactoOperacional, 3)}</b>`);
      }
      resumoEl.innerHTML = `
        <div class="critical-card negative">
          <strong>A média geral está sendo pressionada para baixo</strong>
          <span>Dentro dos filtros atuais, ${partes.join(" e ")}. A média geral considerada é ${resumoGeral.media.toFixed(2)} km/L.</span>
        </div>
      `;
    }
  }

  renderizarListaImpacto("diag-impacto-motorista", condutoresBaixo.length ? condutoresBaixo : motoristas, "Nenhum condutor abaixo da média neste filtro.");
  renderizarListaImpacto("diag-impacto-veiculo", veiculosBaixo.length ? veiculosBaixo : veiculos, "Nenhum veículo abaixo da média neste filtro.");
}

function calcularImpactosDiagnostico(grupos, resumoGeral) {
  return grupos
    .map((grupo) => {
      const impactoDecimal = resumoGeral.consumo > 0 ? grupo.km / resumoGeral.consumo : 0;
      const contribuicaoPct = resumoGeral.media > 0 ? (impactoDecimal / resumoGeral.media) * 100 : 0;
      const impactoOperacional = resumoGeral.km > 0
        ? (grupo.media - resumoGeral.media) * (grupo.km / resumoGeral.km)
        : 0;
      return {
        ...grupo,
        impactoDecimal,
        contribuicaoPct,
        impactoOperacional
      };
    })
    .sort((a, b) => a.impactoOperacional - b.impactoOperacional);
}

function renderizarListaImpacto(id, itens, mensagemVazia) {
  const destino = document.getElementById(id);
  if (!destino) return;
  if (!itens.length) {
    destino.innerHTML = `<div class="ops-empty">${mensagemVazia}</div>`;
    return;
  }

  destino.innerHTML = itens.slice(0, 10).map((item) => {
    const negativo = item.impactoOperacional < 0;
    const status = negativo ? "Puxa a média para baixo" : "Acima da média";
    return `
      <div class="impact-row ${negativo ? "negative" : "positive"}">
        <div class="impact-head">
          <strong>${escapeHtml(item.nome)}</strong>
          <span>${status}</span>
        </div>
        <div class="impact-metrics">
          <span>Média <b>${item.media.toFixed(2)} km/L</b></span>
          <span>Impacto Decimal <b>${formatarNumero(item.impactoDecimal, 3)}</b></span>
          <span>Contribuição <b>${formatarNumero(item.contribuicaoPct, 1)}%</b></span>
          <span>Impacto Operacional <b>${formatarImpacto(item.impactoOperacional, 3)}</b></span>
        </div>
        <small>${item.registros} registro(s) - ${formatarNumero(item.km, 0)} km - ${formatarNumero(item.consumo, 0)} L</small>
      </div>
    `;
  }).join("");
}

function selecionarFiltroDiagnostico(filtro, valor) {
  const ids = {
    placa: "diag-placa",
    motorista: "diag-motorista",
    fabricante: "diag-fabricante",
    modelo: "diag-modelo",
    tracao: "diag-tracao"
  };
  const id = ids[filtro];
  if (!id) return;
  setValorCampo(id, valor);
  atualizarDiagnostico();
}

function limparFiltrosDiagnostico() {
  ["diag-data-inicio", "diag-data-fim", "diag-motorista", "diag-placa", "diag-fabricante", "diag-modelo", "diag-tracao"]
    .forEach((id) => setValorCampo(id, ""));
  atualizarDiagnostico();
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
      const media = r.desloc > 0 && r.consumo > 0 ? r.desloc / r.consumo : 0;
      return `
        <div class="ops-entry">
          <div class="ops-entry-head">
            <span class="ops-entry-title">${escapeHtml(r.placa)} - ${escapeHtml(r.motorista)}</span>
            <span class="status-pill r-bo">${media.toFixed(2)} km/L</span>
          </div>
          <div class="ops-entry-meta">${formatarData(r.data)} - ${escapeHtml(r.fabricante)} - ${escapeHtml(r.modelo)} - ${escapeHtml(r.tracao)}</div>
          <div class="ops-entry-body">Km ${formatarNumero(r.desloc, 0)} / Consumo ${formatarNumero(r.consumo, 0)} L / Nota ${escapeHtml(r.notaFinal || "—")}</div>
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

function setValorCampo(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || "";
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

function formatarImpacto(valor, casas) {
  const numero = Number(valor) || 0;
  const sinal = numero > 0 ? "+" : "";
  return sinal + formatarNumero(numero, casas);
}

function formatarData(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function normalizarTexto(valor) {
  return String(valor || "").trim().toUpperCase();
}

function escapeAttr(valor) {
  return String(valor || "").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
