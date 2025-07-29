// Dados simulados da aplicação
const dadosFinanceiros = {
  lancamentos: [
    { tipo: "entrada", descricao: "Salário", valor: 3200 },
    { tipo: "saida", descricao: "Aluguel", valor: 1200 },
    { tipo: "saida", descricao: "Energia", valor: 230 },
    { tipo: "saida", descricao: "Mercado", valor: 250 },
    { tipo: "entrada", descricao: "Venda online", valor: 500 }
  ],
  metaEconomia: 1000,
  progressoEconomia: 400
};

// Funções de cálculo
function calcularEntradas(lancs) {
  return lancs
    .filter(l => l.tipo === "entrada")
    .reduce((total, l) => total + l.valor, 0);
}

function calcularSaidas(lancs) {
  return lancs
    .filter(l => l.tipo === "saida")
    .reduce((total, l) => total + l.valor, 0);
}

// Atualiza blocos de resumo na Home
function atualizarResumoFinanceiro() {
  const entradas = calcularEntradas(dadosFinanceiros.lancamentos);
  const saidas = calcularSaidas(dadosFinanceiros.lancamentos);
  const gastos = saidas;

  document.querySelector("#entradas p").textContent = `R$ ${entradas.toFixed(2)}`;
  document.querySelector("#saidas p").textContent = `R$ ${saidas.toFixed(2)}`;
  document.querySelector("#gastos-mes p").textContent = `R$ ${gastos.toFixed(2)}`;

  // Lista de últimos lançamentos (máximo 5)
  const lista = document.querySelector("#ultimos-lancamentos ul");
  lista.innerHTML = "";
  dadosFinanceiros.lancamentos.slice(-5).reverse().forEach(l => {
    const li = document.createElement("li");
    li.textContent = `${l.descricao} - R$ ${l.valor.toFixed(2)}`;
    lista.appendChild(li);
  });
}

// Menu lateral - destaque de aba
const menuLinks = document.querySelectorAll(".menu-lateral a");
menuLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Troca classe ativa
    menuLinks.forEach(l => l.classList.remove("ativo"));
    link.classList.add("ativo");

    // Mostra mensagem ou futuro carregamento dinâmico
    const pagina = link.textContent.trim().toLowerCase();
    console.log(`Navegando para: ${pagina} (futuramente será dinâmico)`);
  });
});

// Inicialização da página
atualizarResumoFinanceiro();
