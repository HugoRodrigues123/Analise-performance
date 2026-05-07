// Funções específicas da página ofensores.html

function atualizarDiagnosticoOfensores() {
  if (!document.getElementById("diag-lista")) return;
  const origem = dadosOfensoresImportados || getHistorico();
  const hist = filtrarPorPeriodo(origem, "diag-data-inicio", "diag-data-fim");
  const lista = document.getElementById("diag-lista");
  const mediaEl = document.getElementById("diag-media-geral");
  const totalEl = document.getElementById("diag-total-ofensores");
  const perdaEl = document.getElementById("diag-perda-media");

  if (!hist.length) {
    mediaEl.textContent = "-";
    totalEl.textContent = "0";
    perdaEl.textContent = "-";
    lista.innerHTML = dadosOfensoresImportados
      ? '<div class="ops-empty">O arquivo carregado nao possui registros validos para o filtro selecionado.</div>'
      : '<div class="ops-empty">Salve registros de consumo para diagnosticar ofensores.</div>';
    return;
  }

  const mediaGeral = mediaRegistros(hist);
  const limite = document.getElementById("diag-limite").value;
  const corte = limite === "abaixoMedia" ? mediaGeral : mediaGeral * (1 - Number(limite) / 100);
  const agrupamento = document.getElementById("diag-agrupar").value;
  const metodo = document.getElementById("diag-metodo")?.value || "completo";
  salvarMetodoDiagnosticoAtual(metodo);
  const grupos = agruparOfensores(hist, agrupamento);
  const ofensores = Object.values(grupos)
    .map((grupo) => finalizarGrupoOfensor(grupo, mediaGeral))
    .filter((grupo) => grupoPassaDiagnostico(grupo, corte, metodo))
    .sort((a, b) => b.indiceOfensivo - a.indiceOfensivo);

  mediaEl.textContent = mediaGeral.toFixed(2);
  totalEl.textContent = String(ofensores.length);
  perdaEl.textContent = ofensores.reduce((total, item) => total + item.perdaEstimada, 0).toFixed(2);

  if (!ofensores.length) {
    lista.innerHTML = '<div class="ops-empty">Nenhum ofensor encontrado para o periodo e criterio selecionados.</div>';
    return;
  }

  lista.innerHTML = ofensores.map(renderOfensor).join("");
}

function grupoPassaDiagnostico(grupo, corte, metodo) {
  if (metodo === "consumoGeral") return grupo.media < corte;
  if (metodo === "trajeto") return grupo.mediaSimulada ? grupo.deltaReferencia < -0.05 : grupo.media < corte;
  if (metodo === "pedal") return grupo.pedalAgressivoAlto || grupo.pedalIdealBaixo;
  return grupo.media < corte || grupo.deltaReferencia < -0.05 || grupo.pedalAgressivoAlto || grupo.pedalIdealBaixo;
}

function salvarMetodoDiagnosticoAtual(metodo) {
  if (!diagnosticoOfensoresAtual?.id) return;
  diagnosticoOfensoresAtual.metodo = metodo;
  const lista = getListaStorage(DIAGNOSTICOS_KEY);
  const idx = lista.findIndex((item) => item.id === diagnosticoOfensoresAtual.id);
  if (idx < 0 || lista[idx].metodo === metodo) return;
  lista[idx].metodo = metodo;
  setListaStorage(DIAGNOSTICOS_KEY, lista);
}

function agruparOfensores(hist, agrupamento) {
  return hist.reduce((acc, r) => {
    const chave = chaveOfensor(r, agrupamento);
    if (!acc[chave]) {
      acc[chave] = {
        nome: chave,
        registros: 0,
        mediaTotal: 0,
        notaTotal: 0,
        pior: Number.POSITIVE_INFINITY,
        problemas: {},
        multas: 0,
        avarias: 0,
        pedalIdealTotal: 0,
        pedalMedioTotal: 0,
        pedalAgressivoTotal: 0,
        pedalCount: 0,
        kmCarregadoTotal: 0,
        criticidades: {},
        mediaSimuladaTotal: 0,
        mediaSimuladaCount: 0,
        trajetos: {},
        cargas: {},
        meses: {}
      };
    }
    const grupo = acc[chave];
    const media = Number.parseFloat(r.media) || 0;
    grupo.registros += 1;
    grupo.mediaTotal += media;
    grupo.notaTotal += Number.parseFloat(r.nota) || 0;
    grupo.pior = Math.min(grupo.pior, media);
    const pedalIdeal = Number(r.acId || 0);
    const pedalMedio = Number(r.acMd || 0);
    const pedalAgressivo = Number(r.acCr || 0);
    if (pedalIdeal || pedalMedio || pedalAgressivo) {
      grupo.pedalIdealTotal += pedalIdeal;
      grupo.pedalMedioTotal += pedalMedio;
      grupo.pedalAgressivoTotal += pedalAgressivo;
      grupo.pedalCount += 1;
    }
    grupo.kmCarregadoTotal += Number(r.kmCarregado || 0);
    const criticidade = r.desempenho || r.criticidade || criticidadePorTrajeto(r.trajetoId, r.trajetoNome);
    if (criticidade) grupo.criticidades[criticidade] = (grupo.criticidades[criticidade] || 0) + 1;
    const trajetoNome = r.trajetoNome || labelTrajeto(encontrarTrajeto(r.trajetoId, "", r.modelo)) || "";
    if (trajetoNome) grupo.trajetos[trajetoNome] = (grupo.trajetos[trajetoNome] || 0) + 1;
    const condicaoCarga = r.condicaoCarga || condicaoCargaTrajeto(encontrarTrajeto(r.trajetoId, r.trajetoNome, r.modelo));
    if (condicaoCarga) grupo.cargas[condicaoCarga] = (grupo.cargas[condicaoCarga] || 0) + 1;
    const mediaSimulada = Number(r.mediaSimuladaTrajeto || mediaSimuladaPorTrajeto(r.trajetoId, r.trajetoNome, r.modelo) || 0);
    if (mediaSimulada > 0) {
      grupo.mediaSimuladaTotal += mediaSimulada;
      grupo.mediaSimuladaCount += 1;
    }
    const mes = mesRegistro(r);
    if (mes) {
      if (!grupo.meses[mes]) grupo.meses[mes] = { total: 0, count: 0 };
      grupo.meses[mes].total += media;
      grupo.meses[mes].count += 1;
    }
    (r.problemas || []).forEach((p) => {
      grupo.problemas[p] = (grupo.problemas[p] || 0) + 1;
    });
    grupo.multas += contarOcorrenciasRelacionadas(MULTAS_KEY, r);
    grupo.avarias += contarOcorrenciasRelacionadas(AVARIAS_KEY, r);
    return acc;
  }, {});
}

function chaveOfensor(registro, agrupamento) {
  if (agrupamento === "placa") return registro.placa || "Placa nao informada";
  if (agrupamento === "veiculo") return `${registro.fab} ${registro.modelo}`;
  if (agrupamento === "motoristaPlaca") return labelMotoristaPlaca(registro);
  return registro.motorista || "Motorista nao informado";
}

function finalizarGrupoOfensor(grupo, mediaGeral) {
  grupo.media = grupo.mediaTotal / grupo.registros;
  grupo.nota = grupo.notaTotal / grupo.registros;
  grupo.desvio = mediaGeral - grupo.media;
  grupo.mediaSimulada = grupo.mediaSimuladaCount ? grupo.mediaSimuladaTotal / grupo.mediaSimuladaCount : 0;
  grupo.deltaSimulada = grupo.mediaSimulada ? grupo.media - grupo.mediaSimulada : 0;
  grupo.referenciaMedia = grupo.mediaSimulada || mediaGeral;
  grupo.deltaReferencia = grupo.media - grupo.referenciaMedia;
  grupo.perdaReferencia = Math.max(0, -grupo.deltaReferencia);
  grupo.perdaEstimada = grupo.perdaReferencia * grupo.registros;
  grupo.temPedal = grupo.pedalCount > 0;
  grupo.pedalIdeal = grupo.temPedal ? grupo.pedalIdealTotal / grupo.pedalCount : 0;
  grupo.pedalMedio = grupo.temPedal ? grupo.pedalMedioTotal / grupo.pedalCount : 0;
  grupo.pedalAgressivo = grupo.temPedal ? grupo.pedalAgressivoTotal / grupo.pedalCount : 0;
  grupo.criticidadePrincipal = Object.entries(grupo.criticidades).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nao informado";
  grupo.trajetoPrincipal = Object.entries(grupo.trajetos).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nao informado";
  grupo.condicaoCargaPrincipal = Object.entries(grupo.cargas).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nao informada";
  grupo.comparativoMensal = compararMesesGrupo(grupo.meses);
  grupo.pedalAgressivoAlto = grupo.temPedal && grupo.pedalAgressivo > 20;
  grupo.pedalIdealBaixo = grupo.temPedal && grupo.pedalIdeal < 50;
  grupo.pressaoPedalScore = grupo.temPedal ? Math.max(0, grupo.pedalAgressivo - 20) + Math.max(0, 50 - grupo.pedalIdeal) * 0.5 : 0;
  grupo.indiceOfensivo = grupo.perdaEstimada + Math.max(0, -grupo.deltaReferencia) * grupo.registros + grupo.pressaoPedalScore / 10;
  grupo.principaisProblemas = Object.entries(grupo.problemas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome, qtd]) => `${nome} (${qtd})`);
  return grupo;
}

function renderOfensor(item) {
  const motivos = [];
  if (item.media < item.referenciaMedia) motivos.push(`Consumo ${item.media.toFixed(2)} km/L (${item.deltaReferencia.toFixed(2)} abaixo da referência)`);
  if (item.pedalAgressivoAlto) motivos.push(`Pedal agressivo alto (${item.pedalAgressivo.toFixed(1)}%)`);
  if (item.pedalIdealBaixo) motivos.push(`Pedal ideal baixo (${item.pedalIdeal.toFixed(1)}%)`);
  if (item.principaisProblemas.length) motivos.push(`Problemas: ${item.principaisProblemas.join(", ")}`);
  if (item.multas > 0) motivos.push(`${item.multas} multa(s)`);
  if (item.avarias > 0) motivos.push(`${item.avarias} avaria(s)`);

  return `
    <div class="ops-entry">
      <div class="ops-entry-head">
        <span class="ops-entry-title">${escapeHtml(item.nome)}</span>
        <span class="status-pill r-cr">${item.registros} registro(s)</span>
      </div>
      <div class="ops-entry-meta">Media ${item.media.toFixed(2)} km/L - Perda estimada ${item.perdaEstimada.toFixed(2)} km/L</div>
      <div class="ops-entry-body">${motivos.map((m) => `<div>• ${escapeHtml(m)}</div>`).join("")}</div>
    </div>
  `;
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  instalarTransicaoNavegacao();
  inicializar();
});