// Carregar dados do localStorage ou usar array vazio
function obterLancamentos() {
  const dadosSalvos = localStorage.getItem("lancamentos");
  return dadosSalvos ? JSON.parse(dadosSalvos) : [];
}

// Cálculo de entradas
function calcularEntradas(lancs) {
  return lancs
    .filter(l => l.tipo === "entrada")
    .reduce((total, l) => total + l.valor, 0);
}

// Cálculo de saídas
function calcularSaidas(lancs) {
  return lancs
    .filter(l => l.tipo === "saida" || l.tipo === "fixa" || l.tipo === "reserva" || l.tipo === "outros")
    .reduce((total, l) => total + l.valor, 0);
}

// Atualiza blocos de resumo na Home
function atualizarResumoFinanceiro() {
  const lancamentos = obterLancamentos();
  const entradas = calcularEntradas(lancamentos);
  const saidas = calcularSaidas(lancamentos);
  const gastos = saidas;

  // Atualiza os valores nos blocos
  document.querySelector("#entradas p").textContent = `R$ ${entradas.toFixed(2)}`;
  document.querySelector("#saidas p").textContent = `R$ ${saidas.toFixed(2)}`;
  document.querySelector("#gastos-mes p").textContent = `R$ ${gastos.toFixed(2)}`;

  // Últimos 5 lançamentos
  const lista = document.querySelector("#ultimos-lancamentos ul");
  lista.innerHTML = "";

  lancamentos.slice(-5).reverse().forEach(l => {
    const li = document.createElement("li");
    li.textContent = `${l.descricao} - R$ ${l.valor.toFixed(2)}`;
    lista.appendChild(li);
  });

  // Meta de economia
  const meta = 1000;
  const progresso = entradas - saidas;
  const percentual = Math.min((progresso / meta) * 100, 100);

  const metaBox = document.getElementById("meta-economia");
  if (metaBox) {
    metaBox.innerHTML = `
      <strong>🎯 Meta de Economia</strong><br>
      Objetivo: R$ ${meta.toFixed(2)}<br>
      Progresso: R$ ${progresso.toFixed(2)} (${percentual.toFixed(0)}%)
    `;
  }
}

// Menu lateral - destaque de aba
const menuLinks = document.querySelectorAll(".menu-lateral a");
menuLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    menuLinks.forEach(l => l.classList.remove("ativo"));
    link.classList.add("ativo");

    const pagina = link.textContent.trim().toLowerCase();
    console.log(`Navegando para: ${pagina}`);
    // Em breve: trocar conteúdo dinamicamente
  });
});

// Inicialização
atualizarResumoFinanceiro();
