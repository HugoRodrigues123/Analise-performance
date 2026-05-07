// Funções específicas da página situacao-veiculos.html

function renderizarSituacaoVeiculos() {
  const container = document.getElementById("situacao-lista");
  if (!container) return;
  const veiculos = getVeiculos();
  const multas = getListaStorage(MULTAS_KEY);
  const avarias = getListaStorage(AVARIAS_KEY);
  const situacoes = veiculos.map((veiculo) => montarSituacaoVeiculo(veiculo, multas, avarias));
  const total = situacoes.length;
  const regulares = situacoes.filter((item) => item.status === "Regular").length;
  const pendentes = situacoes.filter((item) => item.status !== "Regular").length;
  setTexto("sit-kpi-total", total);
  setTexto("sit-kpi-regular", regulares);
  setTexto("sit-kpi-pendente", pendentes);

  const filtradas = situacoes.filter((item) => {
    if (valorCampo("sit-busca-placa") && !contemBusca(item.placa, valorCampo("sit-busca-placa"))) return false;
    if (valorCampo("sit-busca-fabricante") && !contemBusca(item.fabricante, valorCampo("sit-busca-fabricante"))) return false;
    if (valorCampo("sit-busca-modelo") && !contemBusca(item.modelo, valorCampo("sit-busca-modelo"))) return false;
    if (valorCampo("sit-busca-status") && item.status !== valorCampo("sit-busca-status")) return false;
    return true;
  });

  if (!filtradas.length) {
    container.innerHTML = '<div class="ops-empty">Nenhum veículo encontrado.</div>';
    return;
  }
  container.innerHTML = `
    <div class="fleet-table-wrap">
      <table class="fleet-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Veículo</th>
            <th>Status</th>
            ${FROTA_STATUS_CAMPOS.map((campo) => `<th>${escapeHtml(campo.label)}</th>`).join("")}
            <th>Ocorrências</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtradas.map((item) => `
            <tr>
              <td><strong>${escapeHtml(item.placa)}</strong></td>
              <td>${escapeHtml(item.fabricante)} ${escapeHtml(item.modelo)}<br><span>${escapeHtml(item.ano || "Ano nao informado")} - ${escapeHtml(item.tracao || "Tracao nao informada")}</span></td>
              <td><span class="status-pill ${classeSituacaoVeiculo(item.status)}">${escapeHtml(item.status)}</span></td>
              ${FROTA_STATUS_CAMPOS.map((campo) => colunaStatusFrota(item, campo)).join("")}
              <td>Multas ${item.totalMultas} (${item.multasPendentes})<br>Avarias ${item.totalAvarias} (${item.avariasAbertas})</td>
              <td><a class="btn btn-sm" href="cadastros.html">Editar</a></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function montarSituacaoVeiculo(veiculo, multas, avarias) {
  const placa = veiculo.placa || "";
  const multasVeiculo = multas.filter((item) => item.placa === placa);
  const avariasVeiculo = avarias.filter((item) => item.placa === placa);
  const multasPendentes = multasVeiculo.filter((item) => !["Assinado", "Empresa", "Recusado"].includes(item.status)).length;
  const avariasAbertas = avariasVeiculo.filter((item) => !["Concluida", "Cancelada"].includes(item.status)).length;
  const statusOperacional = montarStatusOperacionalFrota(veiculo);
  const operacionaisIrregulares = Object.values(statusOperacional).filter((status) => status === "irregular").length;
  const status = avariasAbertas > 0 || operacionaisIrregulares > 0 ? "Atenção" : "Regular";
  const ocorrencias = [...multasVeiculo, ...avariasVeiculo]
    .map((item) => ({ data: getRegistroDataISO(item), texto: `${formatarDataISO(getRegistroDataISO(item))} - ${item.status || item.ait || item.local || "Registro"}` }))
    .filter((item) => item.data)
    .sort((a, b) => b.data.localeCompare(a.data));
  return {
    placa,
    fabricante: FABRICANTES[veiculo.fab] || veiculo.fabricante || "Fabricante nao informado",
    modelo: veiculo.modelo || "Modelo nao informado",
    ano: veiculo.ano,
    tracao: veiculo.tracao,
    totalMultas: multasVeiculo.length,
    multasPendentes,
    totalAvarias: avariasVeiculo.length,
    avariasAbertas,
    statusOperacional,
    operacionaisIrregulares,
    status,
    ultimaOcorrencia: ocorrencias[0]?.texto || ""
  };
}

function montarStatusOperacionalFrota(veiculo) {
  return FROTA_STATUS_CAMPOS.reduce((acc, campo) => {
    acc[campo.id] = getStatusFrota(veiculo, campo.id);
    return acc;
  }, {});
}

function getStatusFrota(veiculo, campo) {
  return veiculo?.situacaoFrota?.[campo] === "irregular" ? "irregular" : "ok";
}

function colunaStatusFrota(item, campo) {
  const status = item.statusOperacional[campo.id];
  const ok = status !== "irregular";
  return `
    <td>
      <div class="fleet-toggle-group" aria-label="${escapeAttr(campo.label)} de ${escapeAttr(item.placa)}">
        <button class="fleet-toggle ok ${ok ? "active" : ""}" type="button"
          onclick="atualizarStatusFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}','ok')">OK</button>
        <button class="fleet-toggle bad ${!ok ? "active" : ""}" type="button"
          onclick="atualizarStatusFrotaTabela('${escapeAttr(item.placa)}','${escapeAttr(campo.id)}','irregular')">Irregular</button>
      </div>
    </td>`;
}

function atualizarStatusFrotaTabela(placa, campo, valor) {
  const lista = getListaStorage(VEICULOS_KEY);
  const idx = lista.findIndex((veiculo) => veiculo.placa === placa);
  if (idx < 0) return;
  lista[idx] = {
    ...lista[idx],
    situacaoFrota: {
      ...(lista[idx].situacaoFrota || {}),
      [campo]: valor === "irregular" ? "irregular" : "ok"
    }
  };
  setListaStorage(VEICULOS_KEY, lista);
  renderizarSituacaoVeiculos();
}

function classeSituacaoVeiculo(status) {
  if (status === "Regular") return "r-ex";
  return "r-cr";
}

function limparBuscaSituacaoVeiculos() {
  limparCampos(["sit-busca-placa", "sit-busca-fabricante", "sit-busca-modelo", "sit-busca-status"]);
  renderizarSituacaoVeiculos();
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});