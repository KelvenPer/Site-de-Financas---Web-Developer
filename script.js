// Simulando dados iniciais
const lancamentos = [
  { tipo: "entrada", descricao: "Salário", valor: 3200 },
  { tipo: "saida", descricao: "Aluguel", valor: 1200 },
  { tipo: "saida", descricao: "Energia", valor: 230 },
  { tipo: "saida", descricao: "Mercado", valor: 250 },
  { tipo: "entrada", descricao: "Venda online", valor: 500 }
];

// Função para calcular entradas
function calcularEntradas(lancs) {
  return lancs
    .filter(l => l.tipo === "entrada")
    .reduce((total, l) => total + l.valor, 0);
}

// Função para calcular saídas
function calcularSaidas(lancs) {
  return lancs
    .filter(l => l.tipo === "saida")
    .reduce((total, l) => total + l.valor, 0);
}

// Função para exibir valores nos blocos
function atualizarValores() {
  const entradas = calcularEntradas(lancamentos);
  const saidas = calcularSaidas(lancamentos);
  const gastos = saidas;

  document.querySelector("#entradas p").textContent = `R$ ${entradas.toFixed(2)}`;
  document.querySelector("#saidas p").textContent = `R$ ${saidas.toFixed(2)}`;
  document.querySelector("#gastos-mes p").textContent = `R$ ${gastos.toFixed(2)}`;

  // Atualiza lista de lançamentos
  const lista = document.querySelector("#ultimos-lancamentos ul");
  lista.innerHTML = ""; // limpa
  lancamentos.slice(-5).reverse().forEach(l => {
    const li = document.createElement("li");
    li.textContent = `${l.descricao} - R$ ${l.valor.toFixed(2)}`;
    lista.appendChild(li);
  });
}

// Navegação entre seções
const menuLinks = document.querySelectorAll(".menu-lateral a");
menuLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    menuLinks.forEach(l => l.classList.remove("ativo"));
    link.classList.add("ativo");

    const pagina = link.textContent.trim().toLowerCase();
    alert(`Você clicou em ${pagina} (em breve será carregado dinamicamente)`);
    // Aqui futuramente vamos trocar os conteúdos dinamicamente
  });
});

// Inicializa valores ao carregar
atualizarValores();
