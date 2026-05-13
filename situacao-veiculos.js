const FROTA_CONTROLE_CAMPOS = [
  { id: "rastreador", label: "Rastreador" },
  { id: "cameras", label: "Câmeras" },
  { id: "telemetria", label: "Telemetria" }
];

const FROTA_DETALHES = {
  rastreador: [
    { id: "sinal", label: "Sinal" },
    { id: "tablet", label: "Tablet" }
  ],
  cameras: [
    { id: "interna", label: "Câmera Interna" },
    { id: "frontal", label: "Câmera Frontal" },
    { id: "fadiga", label: "Sensor de Fadiga" },
    { id: "externaDireita", label: "Câmera Externa Lado Direito" },
    { id: "externaEsquerda", label: "Câmera Externa Lado Esquerdo" }
  ],
  telemetria: [
    { id: "principal", label: "Telemetria" }
  ]
};

let edicaoFrotaAtual = null;

function inicializarControleFrota() {
  preencherFiltrosControleFrota();
  renderizarSituacaoVeiculos();
}

function renderizarSituacaoVeiculos() {
  const container = document.getElementById("situacao-lista");
  if (!container) return;

  const situacoes = getVeiculos().map(montarSituacaoVeiculo);
  const total = situacoes.length;
  const regulares = situacoes.filter((item) => item.status === "Regular").length;
  const irregulares = situacoes.filter((item) => item.status === "Irregular").length;

  setTexto("sit-kpi-total", total);
  setTexto("sit-kpi-regular", regulares);
  setTexto("sit-kpi-pendente", irregulares);

  const filtradas = situacoes.filter((item) => {
    if (valorCampo("sit-busca-placa") && item.placa !== valorCampo("sit-busca-placa")) return false;
    if (valorCampo("sit-busca-fabricante") && item.fabricante !== valorCampo("sit-busca-fabricante")) return false;
    if (valorCampo("sit-busca-modelo") && item.modelo !== valorCampo("sit-busca-modelo")) return false;
    if (valorCampo("sit-busca-tracao") && item.tracao !== valorCampo("sit-busca-tracao")) return false;
    if (valorCampo("sit-busca-status") && item.status !== valorCampo("sit-busca-status")) return false;
    return true;
  });

  if (!filtradas.length) {
    container.innerHTML = '<div class="ops-empty">Nenhum veículo cadastrado encontrado.</div>';
    return;
  }

  container.innerHTML = `
    ${dashboardControleFrota(filtradas)}
    <div class="fleet-table-wrap">
      <table class="fleet-table fleet-control-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Veículo</th>
            <th>Tração</th>
            <th>Status</th>
            ${FROTA_CONTROLE_CAMPOS.map((campo) => `<th>${escapeHtml(campo.label)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${filtradas.map((item) => `
            <tr>
              <td><strong>${escapeHtml(item.placa)}</strong></td>
              <td>${escapeHtml(item.fabricante)} ${escapeHtml(item.modelo)}<br><span>${escapeHtml(item.ano || "Ano nao informado")}</span></td>
              <td>${escapeHtml(item.tracao || "Tração nao informada")}</td>
              <td><span class="status-pill ${classeSituacaoVeiculo(item.status)}">${escapeHtml(item.status)}</span></td>
              ${FROTA_CONTROLE_CAMPOS.map((campo) => colunaControleFrota(item, campo)).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function dashboardControleFrota(situacoes) {
  const total = situacoes.length || 1;
  const regular = situacoes.filter((item) => item.status === "Regular").length;
  const irregular = situacoes.filter((item) => item.status === "Irregular").length;
  const campos = FROTA_CONTROLE_CAMPOS.map((campo) => {
    const irregulares = situacoes.filter((item) => item.statusCampos[campo.id] === "irregular").length;
    const semEquipamento = situacoes.filter((item) => item.statusCampos[campo.id] === "nao_tem").length;
    const ok = situacoes.filter((item) => item.statusCampos[campo.id] === "ok").length;
    return {
      ...campo,
      ok,
      irregulares,
      semEquipamento,
      pctIrregular: Math.round((irregulares / total) * 100)
    };
  });
  const placasIrregulares = situacoes.filter((item) => item.status === "Irregular");

  return `
    <div class="fleet-bi-dashboard">
      <div class="fleet-bi-header">
        <div>
          <div class="fleet-bi-title">Dashboard de Status da Frota</div>
          <div class="fleet-bi-subtitle">Visão consolidada dos módulos operacionais cadastrados</div>
        </div>
        <div class="fleet-bi-total">
          <span>${situacoes.length}</span>
          <small>veículos filtrados</small>
        </div>
      </div>

      <div class="fleet-bi-grid">
        <div class="fleet-bi-card">
          <div class="fleet-bi-label">Regularidade Geral</div>
          <div class="fleet-donut" style="--regular:${Math.round((regular / total) * 100)}; --irregular:${Math.round((irregular / total) * 100)}">
            <span>${Math.round((regular / total) * 100)}%</span>
          </div>
          <div class="fleet-bi-legend">
            <span><i class="ok"></i>${regular} Regular</span>
            <span><i class="bad"></i>${irregular} Irregular</span>
          </div>
        </div>

        <div class="fleet-bi-card fleet-bi-wide">
          <div class="fleet-bi-label">Irregularidade por Módulo</div>
          <div class="fleet-bars">
            ${campos.map((campo) => `
              <div class="fleet-bar-row">
                <div class="fleet-bar-top">
                  <span>${escapeHtml(campo.label)}</span>
                  <strong>${campo.irregulares} irregular</strong>
                </div>
                <div class="fleet-bar-track">
                  <div class="fleet-bar-fill ${campo.irregulares ? "bad" : "ok"}" style="width:${campo.pctIrregular}%"></div>
                </div>
                <div class="fleet-bar-meta">${campo.ok} OK / ${campo.irregulares} Irregular / ${campo.semEquipamento} Não tem</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="fleet-bi-card">
          <div class="fleet-bi-label">Veículos Irregulares</div>
          <div class="fleet-bi-list">
            ${placasIrregulares.length ? placasIrregulares.slice(0, 8).map((item) => {
              const itens = FROTA_CONTROLE_CAMPOS
                .filter((campo) => item.statusCampos[campo.id] === "irregular")
                .map((campo) => campo.label)
                .join(", ");
              return `<div class="fleet-bi-list-item"><strong>${escapeHtml(item.placa)}</strong><span>${escapeHtml(itens)}</span></div>`;
            }).join("") : '<div class="fleet-bi-empty">Nenhum veículo irregular no filtro atual.</div>'}
          </div>
        </div>
      </div>

      <div class="fleet-bi-kpis">
        ${campos.map((campo) => {
          const pctOk = Math.round((campo.ok / total) * 100);
          return `
            <div class="fleet-bi-kpi">
              <span>${escapeHtml(campo.label)}</span>
              <strong>${pctOk}% OK</strong>
              <small>${campo.ok} OK / ${campo.irregulares} irregular / ${campo.semEquipamento} sem equipamento</small>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function preencherFiltrosControleFrota() {
  const veiculos = getVeiculos();
  preencherSelectFiltro("sit-busca-placa", veiculos.map((veiculo) => veiculo.placa).filter(Boolean), "Todas");
  preencherSelectFiltro("sit-busca-fabricante", veiculos.map((veiculo) => FABRICANTES[veiculo.fab] || veiculo.fabricante).filter(Boolean), "Todos");
  preencherSelectFiltro("sit-busca-modelo", veiculos.map((veiculo) => veiculo.modelo).filter(Boolean), "Todos");
  preencherSelectFiltro("sit-busca-tracao", veiculos.map((veiculo) => veiculo.tracao).filter(Boolean), "Todas");
}

function preencherSelectFiltro(id, valores, labelTodos) {
  const select = document.getElementById(id);
  if (!select) return;
  const atual = select.value;
  const unicos = Array.from(new Set(valores)).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
  select.innerHTML = `<option value="">${labelTodos}</option>` + unicos
    .map((valor) => `<option value="${escapeAttr(valor)}">${escapeHtml(valor)}</option>`)
    .join("");
  if (atual && unicos.includes(atual)) select.value = atual;
}

function montarSituacaoVeiculo(veiculo) {
  const situacaoFrota = normalizarSituacaoFrota(veiculo.situacaoFrota || {});
  const statusCampos = FROTA_CONTROLE_CAMPOS.reduce((acc, campo) => {
    acc[campo.id] = getStatusCampoFrota(situacaoFrota, campo.id);
    return acc;
  }, {});
  const status = Object.values(statusCampos).some((statusCampo) => statusCampo === "irregular") ? "Irregular" : "Regular";

  return {
    placa: veiculo.placa || "",
    fabricante: FABRICANTES[veiculo.fab] || veiculo.fabricante || "Fabricante nao informado",
    modelo: veiculo.modelo || "Modelo nao informado",
    ano: veiculo.ano,
    tracao: veiculo.tracao,
    situacaoFrota,
    statusCampos,
    status
  };
}

function normalizarSituacaoFrota(situacaoFrota) {
  const normalizada = { ...situacaoFrota };
  const presencaAtual = normalizada.presenca || {};

  normalizada.presenca = FROTA_CONTROLE_CAMPOS.reduce((acc, campo) => {
    const chaveLegada = `${campo.id}Presente`;
    acc[campo.id] = presencaAtual[campo.id] === false || normalizada[chaveLegada] === false ? false : true;
    return acc;
  }, {});

  normalizada.rastreadorDetalhes = {
    sinal: getStatusFrotaValor(normalizada.rastreadorDetalhes?.sinal),
    tablet: getStatusFrotaValor(normalizada.rastreadorDetalhes?.tablet || normalizada.tablet)
  };
  normalizada.camerasDetalhes = {
    interna: getStatusFrotaValor(normalizada.camerasDetalhes?.interna),
    frontal: getStatusFrotaValor(normalizada.camerasDetalhes?.frontal),
    fadiga: getStatusFrotaValor(normalizada.camerasDetalhes?.fadiga),
    externaDireita: getStatusFrotaValor(normalizada.camerasDetalhes?.externaDireita),
    externaEsquerda: getStatusFrotaValor(normalizada.camerasDetalhes?.externaEsquerda)
  };
  normalizada.telemetriaDetalhes = {
    principal: getStatusFrotaValor(normalizada.telemetriaDetalhes?.principal || normalizada.telemetria)
  };

  normalizada.rastreador = calcularStatusGrupo(normalizada.rastreador, normalizada.rastreadorDetalhes);
  normalizada.cameras = calcularStatusGrupo(normalizada.cameras, normalizada.camerasDetalhes);
  normalizada.telemetria = getStatusFrotaValor(normalizada.telemetriaDetalhes.principal);

  return normalizada;
}

function calcularStatusGrupo(statusPrincipal, detalhes) {
  if (Object.values(detalhes || {}).some((status) => status === "irregular")) return "irregular";
  return getStatusFrotaValor(statusPrincipal);
}

function getStatusCampoFrota(situacaoFrota, campo) {
  if (situacaoFrota.presenca?.[campo] === false) return "nao_tem";
  if (campo === "rastreador") return situacaoFrota.rastreador;
  if (campo === "cameras") return situacaoFrota.cameras;
  if (campo === "telemetria") return situacaoFrota.telemetria;
  return "ok";
}

function getStatusFrotaValor(valor) {
  return valor === "irregular" ? "irregular" : "ok";
}

function colunaControleFrota(item, campo) {
  const status = item.statusCampos[campo.id];
  const temEquipamento = status !== "nao_tem";
  const ok = status !== "irregular";
  return `
    <td>
      <div class="fleet-cell-control">
        <div class="fleet-toggle-group" aria-label="Presença de ${escapeAttr(campo.label)} em ${escapeAttr(item.placa)}">
          <button class="fleet-toggle ok ${temEquipamento ? "active" : ""}" type="button"
            onclick="atualizarPresencaFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}',true)">Sim</button>
          <button class="fleet-toggle bad ${!temEquipamento ? "active" : ""}" type="button"
            onclick="atualizarPresencaFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}',false)">Não</button>
        </div>
        ${temEquipamento ? `
        <div class="fleet-toggle-group" aria-label="${escapeAttr(campo.label)} de ${escapeAttr(item.placa)}">
          <button class="fleet-toggle ok ${ok ? "active" : ""}" type="button"
            onclick="atualizarStatusFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}','ok')">OK</button>
          <button class="fleet-toggle bad ${!ok ? "active" : ""}" type="button"
            onclick="atualizarStatusFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}','irregular')">Irregular</button>
        </div>
        <button class="btn btn-sm" type="button" onclick="abrirEdicaoFrota('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}')">Editar</button>
        ` : '<span class="fleet-no-equipment">Sem equipamento</span>'}
      </div>
    </td>`;
}

function atualizarPresencaFrotaTabela(placa, campo, presente) {
  atualizarVeiculoFrota(placa, (veiculo) => {
    const situacaoFrota = normalizarSituacaoFrota(veiculo.situacaoFrota || {});
    situacaoFrota.presenca = { ...(situacaoFrota.presenca || {}), [campo]: !!presente };

    if (!presente) {
      aplicarStatusGrupoFrota(situacaoFrota, campo, "ok");
    }

    veiculo.situacaoFrota = normalizarSituacaoFrota(situacaoFrota);
    return veiculo;
  });
}

function atualizarStatusFrotaTabela(placa, campo, valor) {
  atualizarVeiculoFrota(placa, (veiculo) => {
    const situacaoFrota = normalizarSituacaoFrota(veiculo.situacaoFrota || {});
    const status = valor === "irregular" ? "irregular" : "ok";
    situacaoFrota.presenca = { ...(situacaoFrota.presenca || {}), [campo]: true };

    aplicarStatusGrupoFrota(situacaoFrota, campo, status);

    veiculo.situacaoFrota = normalizarSituacaoFrota(situacaoFrota);
    return veiculo;
  });
}

function aplicarStatusGrupoFrota(situacaoFrota, campo, status) {
  if (campo === "rastreador") {
    situacaoFrota.rastreador = status;
    if (status === "ok") situacaoFrota.rastreadorDetalhes = { sinal: "ok", tablet: "ok" };
  } else if (campo === "cameras") {
    situacaoFrota.cameras = status;
    if (status === "ok") {
      situacaoFrota.camerasDetalhes = {
        interna: "ok",
        frontal: "ok",
        fadiga: "ok",
        externaDireita: "ok",
        externaEsquerda: "ok"
      };
    }
  } else if (campo === "telemetria") {
    situacaoFrota.telemetria = status;
    situacaoFrota.telemetriaDetalhes = { principal: status };
  }
}

function abrirEdicaoFrota(placa, campo) {
  const veiculo = getVeiculos().find((item) => item.placa === placa);
  if (!veiculo) return;

  edicaoFrotaAtual = { placa, campo };
  const modal = document.getElementById("frota-edicao-modal");
  const titulo = document.getElementById("frota-edicao-titulo");
  const subtitulo = document.getElementById("frota-edicao-subtitulo");
  const corpo = document.getElementById("frota-edicao-corpo");
  if (!modal || !titulo || !subtitulo || !corpo) return;

  const situacaoFrota = normalizarSituacaoFrota(veiculo.situacaoFrota || {});
  if (situacaoFrota.presenca?.[campo] === false) {
    mostrarMensagem("Este veículo está marcado como sem este equipamento. Selecione 'Tem' antes de editar o status.", "Controle de Frota");
    return;
  }

  const campoInfo = FROTA_CONTROLE_CAMPOS.find((item) => item.id === campo);
  const detalhes = getDetalhesCampo(situacaoFrota, campo);

  titulo.textContent = `Editar ${campoInfo?.label || "Status"}`;
  subtitulo.textContent = `${placa} - ${FABRICANTES[veiculo.fab] || veiculo.fabricante || ""} ${veiculo.modelo || ""}`;
  corpo.innerHTML = `
    <div class="fleet-status-grid">
      ${FROTA_DETALHES[campo].map((detalhe) => `
        <div class="fleet-status-item">
          <span class="fleet-status-label">${escapeHtml(detalhe.label)}</span>
          <select class="fleet-status-select" id="frota-det-${escapeAttr(detalhe.id)}">
            <option value="ok" ${detalhes[detalhe.id] !== "irregular" ? "selected" : ""}>OK</option>
            <option value="irregular" ${detalhes[detalhe.id] === "irregular" ? "selected" : ""}>Irregular</option>
          </select>
        </div>
      `).join("")}
    </div>
  `;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function getDetalhesCampo(situacaoFrota, campo) {
  if (campo === "rastreador") return situacaoFrota.rastreadorDetalhes;
  if (campo === "cameras") return situacaoFrota.camerasDetalhes;
  if (campo === "telemetria") return situacaoFrota.telemetriaDetalhes;
  return {};
}

function salvarEdicaoFrota() {
  if (!edicaoFrotaAtual) return;
  const { placa, campo } = edicaoFrotaAtual;
  const detalhes = {};
  FROTA_DETALHES[campo].forEach((detalhe) => {
    detalhes[detalhe.id] = valorCampo(`frota-det-${detalhe.id}`) === "irregular" ? "irregular" : "ok";
  });

  atualizarVeiculoFrota(placa, (veiculo) => {
    const situacaoFrota = normalizarSituacaoFrota(veiculo.situacaoFrota || {});
    situacaoFrota.presenca = { ...(situacaoFrota.presenca || {}), [campo]: true };
    if (campo === "rastreador") {
      situacaoFrota.rastreadorDetalhes = detalhes;
      situacaoFrota.rastreador = calcularStatusGrupo("ok", detalhes);
      situacaoFrota.tablet = detalhes.tablet;
    } else if (campo === "cameras") {
      situacaoFrota.camerasDetalhes = detalhes;
      situacaoFrota.cameras = calcularStatusGrupo("ok", detalhes);
    } else if (campo === "telemetria") {
      situacaoFrota.telemetriaDetalhes = detalhes;
      situacaoFrota.telemetria = detalhes.principal;
    }
    veiculo.situacaoFrota = normalizarSituacaoFrota(situacaoFrota);
    return veiculo;
  });

  fecharEdicaoFrota();
}

function fecharEdicaoFrota() {
  const modal = document.getElementById("frota-edicao-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  edicaoFrotaAtual = null;
}

function atualizarVeiculoFrota(placa, updater) {
  const lista = getListaStorage(VEICULOS_KEY);
  const idx = lista.findIndex((veiculo) => veiculo.placa === placa);
  if (idx < 0) return;
  lista[idx] = updater({ ...lista[idx] });
  setListaStorage(VEICULOS_KEY, lista);
  renderizarSituacaoVeiculos();
}

function classeSituacaoVeiculo(status) {
  return status === "Regular" ? "r-ex" : "r-cr";
}

function limparBuscaSituacaoVeiculos() {
  limparCampos(["sit-busca-placa", "sit-busca-fabricante", "sit-busca-modelo", "sit-busca-status"]);
  limparCampos(["sit-busca-tracao"]);
  renderizarSituacaoVeiculos();
}

function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function limparCampos(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function contemBusca(texto, busca) {
  return String(texto || "").toLowerCase().includes(String(busca || "").toLowerCase());
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
  inicializarControleFrota();
});
