// Seletores principais
const btnAdicionar = document.getElementById("btnAdicionar");
const modalTipo = document.getElementById("modalTipo");
const modalFormulario = document.getElementById("modalFormulario");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnFecharFormulario = document.getElementById("btnFecharFormulario");
const tipoInput = document.getElementById("tipo");
const form = document.getElementById("formLancamento");
const tituloFormulario = document.getElementById("tituloFormulario");

// Abrir modal de seleção de tipo
btnAdicionar.addEventListener("click", () => {
  modalTipo.style.display = "block";
});

// Fechar modal tipo
btnFecharModal.addEventListener("click", () => {
  modalTipo.style.display = "none";
});

// Fechar modal formulário
btnFecharFormulario.addEventListener("click", () => {
  modalFormulario.style.display = "none";
});

// Quando escolher o tipo de lançamento
document.querySelectorAll(".opcao-lancamento").forEach(botao => {
  botao.addEventListener("click", () => {
    const tipo = botao.dataset.tipo;
    tipoInput.value = tipo;
    tituloFormulario.textContent = `Adicionar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    modalTipo.style.display = "none";
    modalFormulario.style.display = "block";
  });
});

// Submeter o formulário
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value.trim());
  const tipo = tipoInput.value;

  if (!descricao || isNaN(valor) || valor <= 0 || !tipo) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  // Cria objeto do lançamento
  const novoLancamento = {
    descricao,
    valor,
    tipo,
    data: new Date().toISOString()
  };

  // Pega os lançamentos antigos do localStorage
  const lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

  // Adiciona novo lançamento
  lancamentos.push(novoLancamento);

  // Salva no localStorage
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

  // Redireciona para home para ver o resultado
  window.location.href = "home.html";
});
