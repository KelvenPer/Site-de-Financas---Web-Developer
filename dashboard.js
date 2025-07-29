// Dados simulados
const dadosFinanceiros = {
  lancamentos: [
    { tipo: "entrada", categoria: "Salário", valor: 3200, mes: "Julho" },
    { tipo: "entrada", categoria: "Freelancer", valor: 800, mes: "Julho" },
    { tipo: "saida", categoria: "Aluguel", valor: 1200, mes: "Julho" },
    { tipo: "saida", categoria: "Transporte", valor: 300, mes: "Julho" },
    { tipo: "saida", categoria: "Mercado", valor: 600, mes: "Julho" },
    { tipo: "saida", categoria: "Internet", valor: 150, mes: "Julho" }
  ],
  metaEconomia: 1000,
  progressoEconomia: 400
};

// Funções de cálculo
function calcularTotais(lancs) {
  const entradas = lancs.filter(l => l.tipo === "entrada").reduce((sum, l) => sum + l.valor, 0);
  const saidas = lancs.filter(l => l.tipo === "saida").reduce((sum, l) => sum + l.valor, 0);
  const saldo = entradas - saidas;
  const economia = (dadosFinanceiros.progressoEconomia / dadosFinanceiros.metaEconomia) * 100;

  // Atualiza DOM
  document.querySelector("#bloco-saldo p").textContent = `R$ ${saldo.toFixed(2)}`;
  document.querySelector(".entrada p").textContent = `R$ ${entradas.toFixed(2)}`;
  document.querySelector(".saida p").textContent = `R$ ${saidas.toFixed(2)}`;
  document.querySelector(".economia p").textContent = `${economia.toFixed(0)}%`;

  // Atualiza metas
  document.querySelector(".metas").innerHTML = `
    <h3>🎯 Meta de Economia</h3>
    <p>Objetivo: R$ ${dadosFinanceiros.metaEconomia.toFixed(2)}</p>
    <p>Progresso: R$ ${dadosFinanceiros.progressoEconomia.toFixed(2)} (${economia.toFixed(0)}%)</p>
  `;
}

// Gráfico de Gastos por Categoria
function graficoPizzaGastos() {
  const ctx = document.getElementById("graficoPizza").getContext("2d");

  const categorias = {};
  dadosFinanceiros.lancamentos.forEach(l => {
    if (l.tipo === "saida") {
      categorias[l.categoria] = (categorias[l.categoria] || 0) + l.valor;
    }
  });

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ["#f44336", "#2196f3", "#4caf50", "#ff9800", "#9c27b0"]
      }]
    },
    options: {
      responsive: true
    }
  });
}

// Gráfico de Evolução Mensal
function graficoEvolucaoMensal() {
  const ctx = document.getElementById("graficoLinha").getContext("2d");

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho"];
  const saldoPorMes = meses.map(mes => {
    const entradas = dadosFinanceiros.lancamentos
      .filter(l => l.tipo === "entrada" && l.mes === mes)
      .reduce((soma, l) => soma + l.valor, 0);

    const saidas = dadosFinanceiros.lancamentos
      .filter(l => l.tipo === "saida" && l.mes === mes)
      .reduce((soma, l) => soma + l.valor, 0);

    return entradas - saidas;
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        label: "Saldo mensal",
        data: saldoPorMes,
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true
    }
  });
}

// Inicializa o dashboard
function inicializarDashboard() {
  calcularTotais(dadosFinanceiros.lancamentos);
  graficoPizzaGastos();
  graficoEvolucaoMensal();
}

// Executar ao carregar (se a aba dashboard estiver visível)
if (document.querySelector("#dashboard")) {
  inicializarDashboard();
}
