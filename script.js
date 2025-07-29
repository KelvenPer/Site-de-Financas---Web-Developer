// script.js

// Variáveis globais para Firebase e Firestore
let db;
let auth;
let userId;
let unsubscribeFromTransactions; // Para gerenciar a inscrição do onSnapshot para lançamentos
let unsubscribeFromInvestments; // Para gerenciar a inscrição do onSnapshot para investimentos

// Gráficos
let pieChart;
let lineChart;

// Variáveis para controle dos modais de investimento
let currentInvestmentOperation = ''; // 'entrada' ou 'retirada'
let currentSelectedAsset = ''; // Ativo selecionado (CDB, SELIC, etc.)

// Função para exibir mensagens personalizadas (substitui alert())
function showAlert(title, message, callback) {
    const alertBox = document.getElementById('custom-alert');
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    alertBox.classList.remove('hidden');
    // Adiciona a classe 'active' para a animação
    setTimeout(() => {
        alertBox.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
    }, 10);

    const okButton = document.getElementById('alert-ok-button');
    okButton.onclick = () => {
        alertBox.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            alertBox.classList.add('hidden');
            if (callback) callback();
        }, 300); // Espera a transição terminar
    };
}

// Função para formatar valores monetários
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para mostrar o indicador de carregamento
function showLoading() {
    document.getElementById('loading-indicator').classList.remove('hidden');
}

// Função para esconder o indicador de carregamento
function hideLoading() {
    document.getElementById('loading-indicator').classList.add('hidden');
}

// Função para inicializar o Firebase e autenticar o usuário
async function initializeFirebaseAndAuth() {
    try {
        // As instâncias de app, db e auth são exportadas do script type="module" no HTML
        db = window.db;
        auth = window.auth;
        const initialAuthToken = window.initialAuthToken;
        const signInAnonymously = window.signInAnonymously;
        const signInWithCustomToken = window.signInWithCustomToken;
        const onAuthStateChanged = window.onAuthStateChanged;

        showLoading(); // Mostra o indicador de carregamento

        // Tenta autenticar com o token personalizado se disponível
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // Caso contrário, autentica anonimamente
            await signInAnonymously(auth);
        }

        // Observa mudanças no estado de autenticação
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                document.getElementById('current-user-id').textContent = userId;
                console.log("Usuário autenticado:", userId);
                // Inicia a escuta de dados do Firestore após a autenticação
                listenForTransactions();
                listenForInvestments(); // Nova escuta para investimentos
            } else {
                console.log("Nenhum usuário autenticado.");
                // Se não houver usuário, tenta autenticar anonimamente novamente
                signInAnonymously(auth).catch(error => console.error("Erro ao tentar autenticar anonimamente:", error));
            }
            hideLoading(); // Esconde o indicador de carregamento após a autenticação
        });

    } catch (error) {
        console.error("Erro ao inicializar Firebase ou autenticar:", error);
        showAlert("Erro de Inicialização", "Não foi possível conectar ao serviço de dados. Tente novamente mais tarde.");
        hideLoading(); // Esconde o indicador de carregamento em caso de erro
    }
}

// --- Funções de Navegação ---
function showPage(pageId) {
    // Oculta todas as seções de página
    document.querySelectorAll('.pagina').forEach(page => {
        page.classList.add('hidden');
    });
    // Mostra a seção desejada
    document.getElementById(pageId).classList.remove('hidden');

    // Remove a classe 'active-nav' de todos os links de navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-nav');
    });
    // Adiciona a classe 'active-nav' ao link clicado
    document.getElementById(`nav-${pageId.replace('-section', '')}`).classList.add('active-nav');
}

// --- Funções do Dashboard (Home) ---

// Renderiza o gráfico de Pizza
function renderPieChart(data) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (pieChart) {
        pieChart.destroy(); // Destrói o gráfico anterior se existir
    }
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'
                ],
                hoverBackgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                    text: 'Gastos por Categoria'
                }
            }
        }
    });
}

// Renderiza o gráfico de Linha
function renderLineChart(data) {
    const ctx = document.getElementById('graficoLinha').getContext('2d');
    if (lineChart) {
        lineChart.destroy(); // Destrói o gráfico anterior se existir
    }
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Balanço Mensal',
                data: data.values,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                    text: 'Evolução Mensal'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Atualiza o dashboard com os dados mais recentes de lançamentos e investimentos
function updateDashboard(transactions, investments) {
    let totalGastosMes = 0;
    let totalEntradas = 0;
    let totalSaidas = 0;
    let balancoAtual = 0;

    // Totais de Investimentos
    let totalInvestido = 0;
    let totalEntradasInvestimento = 0;
    let totalSaidasInvestimento = 0;

    const ultimosLancamentosList = document.getElementById('ultimos-lancamentos-lista');
    ultimosLancamentosList.innerHTML = ''; // Limpa a lista

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Dados para o gráfico de pizza (gastos por categoria)
    const categoryExpenses = {};
    // Dados para o gráfico de linha (evolução mensal)
    const monthlyBalance = {}; // { 'YYYY-MM': balance }

    // Processa Lançamentos
    transactions.sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena pela data mais recente

    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.data);
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();

        if (transaction.tipo === 'entrada') {
            totalEntradas += transaction.valor;
            balancoAtual += transaction.valor;
        } else if (['saida', 'fixa', 'reserva', 'outros'].includes(transaction.tipo)) { // 'investimento' não é mais tratado aqui
            totalSaidas += transaction.valor;
            balancoAtual -= transaction.valor;
            if (transactionMonth === currentMonth && transactionYear === currentYear) {
                totalGastosMes += transaction.valor;
            }
            if (transaction.categoria) {
                categoryExpenses[transaction.categoria] = (categoryExpenses[transaction.categoria] || 0) + transaction.valor;
            }
        }

        const monthKey = `${transactionYear}-${String(transactionMonth + 1).padStart(2, '0')}`;
        monthlyBalance[monthKey] = (monthlyBalance[monthKey] || 0) + (transaction.tipo === 'entrada' ? transaction.valor : -transaction.valor);

        if (ultimosLancamentosList.children.length < 5) {
            const li = document.createElement('li');
            li.className = `p-2 rounded-lg flex justify-between items-center ${transaction.tipo === 'entrada' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`;
            li.innerHTML = `
                <span>${transaction.descricao} - ${formatCurrency(transaction.valor)}</span>
                <span class="text-xs text-gray-500">${new Date(transaction.data).toLocaleDateString('pt-BR')}</span>
            `;
            ultimosLancamentosList.appendChild(li);
        }
    });

    // Processa Investimentos
    const assetsInvested = {}; // Para calcular o total investido por ativo
    investments.forEach(investment => {
        if (investment.operacao === 'entrada') {
            totalInvestido += investment.valor;
            totalEntradasInvestimento += investment.valor;
            assetsInvested[investment.ativo] = (assetsInvested[investment.ativo] || 0) + investment.valor;
        } else if (investment.operacao === 'retirada') {
            totalInvestido -= investment.valor;
            totalSaidasInvestimento += investment.valor;
            assetsInvested[investment.ativo] = (assetsInvested[investment.ativo] || 0) - investment.valor;
        }
    });

    // Atualiza os valores nos blocos de resumo de Lançamentos
    document.getElementById('gastos-mes-valor').textContent = formatCurrency(totalGastosMes);
    document.getElementById('entradas-valor').textContent = formatCurrency(totalEntradas);
    document.getElementById('saidas-valor').textContent = formatCurrency(totalSaidas);
    document.getElementById('balanco-atual-valor').textContent = formatCurrency(balancoAtual);

    // Atualiza os valores no bloco de Investimentos
    document.getElementById('total-investido-valor').textContent = formatCurrency(totalInvestido);
    document.getElementById('investimento-entradas-valor').textContent = formatCurrency(totalEntradasInvestimento);
    document.getElementById('investimento-saidas-valor').textContent = formatCurrency(totalSaidasInvestimento);

    // Prepara dados para o gráfico de pizza
    const pieChartLabels = Object.keys(categoryExpenses);
    const pieChartValues = Object.values(categoryExpenses);
    renderPieChart({ labels: pieChartLabels, values: pieChartValues });

    // Prepara dados para o gráfico de linha (evolução mensal)
    const sortedMonths = Object.keys(monthlyBalance).sort();
    const lineChartLabels = sortedMonths.map(month => {
        const [year, mon] = month.split('-');
        return `${mon}/${year.slice(2)}`; // Ex: 07/25
    });
    let cumulativeBalance = 0;
    const lineChartValues = sortedMonths.map(month => {
        cumulativeBalance += monthlyBalance[month];
        return cumulativeBalance;
    });
    renderLineChart({ labels: lineChartLabels, values: lineChartValues });

    // Atualiza a meta de economia
    const metaObjetivo = 1000;
    const progressoMeta = balancoAtual;
    const percentualMeta = Math.min((progressoMeta / metaObjetivo) * 100, 100);

    const metaObjetivoElement = document.querySelector('.metas p:nth-child(2) .font-semibold');
    const metaProgressoElement = document.querySelector('.metas p:nth-child(3) .font-semibold');
    const metaProgressBar = document.querySelector('.metas .bg-green-600');

    if (metaObjetivoElement) metaObjetivoElement.textContent = formatCurrency(metaObjetivo);
    if (metaProgressoElement) metaProgressoElement.textContent = `${formatCurrency(progressoMeta)} (${percentualMeta.toFixed(0)}%)`;
    if (metaProgressBar) metaProgressBar.style.width = `${percentualMeta}%`;

    // Atualiza a tabela de lançamentos na seção de Lançamentos
    updateTransactionsTable(transactions);

    // Atualiza a lista de ativos investidos na seção de Investimentos
    updateInvestedAssetsList(assetsInvested);
}

// --- Funções de Lançamentos ---

// Função para adicionar um novo lançamento ao Firestore
async function addTransaction(transactionData) {
    try {
        showLoading();
        const transactionsCollection = window.collection(db, `artifacts/${window.appId}/users/${userId}/transactions`);
        await window.addDoc(transactionsCollection, transactionData);
        showAlert("Sucesso!", "Lançamento adicionado com sucesso!");
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        showAlert("Erro", "Não foi possível adicionar o lançamento. Tente novamente.");
    } finally {
        hideLoading();
    }
}

// Função para atualizar a tabela de lançamentos na seção de Lançamentos
function updateTransactionsTable(transactions) {
    const tableBody = document.getElementById('lista-lancamentos-tabela');
    tableBody.innerHTML = ''; // Limpa a tabela

    if (transactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Nenhum lançamento registrado.</td>`;
        tableBody.appendChild(row);
        return;
    }

    // Ordena as transações pela data mais recente primeiro
    transactions.sort((a, b) => new Date(b.data) - new Date(a.data));

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        const date = new Date(transaction.data).toLocaleDateString('pt-BR');
        const valueClass = (transaction.tipo === 'entrada') ? 'text-green-600' : 'text-red-600';
        const typeDisplay = {
            'entrada': 'Entrada',
            'saida': 'Saída',
            'reserva': 'Reserva',
            'investimento': 'Investimento',
            'fixa': 'Despesa Fixa',
            'outros': 'Outros'
        }[transaction.tipo] || transaction.tipo;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${date}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${transaction.descricao}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${typeDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${valueClass}">${formatCurrency(transaction.valor)}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Escuta por mudanças na coleção de transações em tempo real
function listenForTransactions() {
    if (unsubscribeFromTransactions) {
        unsubscribeFromTransactions(); // Desinscreve-se da escuta anterior se existir
    }

    const transactionsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/transactions`);
    const q = window.query(transactionsCollectionRef); // Pode adicionar orderBy, where etc. aqui

    unsubscribeFromTransactions = window.onSnapshot(q, (snapshot) => {
        const transactions = [];
        snapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        // Pega os investimentos também para atualizar o dashboard completo
        const investmentsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/investments`);
        window.getDocs(investmentsCollectionRef).then((investmentSnapshot) => {
            const investments = [];
            investmentSnapshot.forEach((doc) => {
                investments.push({ id: doc.id, ...doc.data() });
            });
            console.log("Transações e Investimentos atualizados:", transactions, investments);
            updateDashboard(transactions, investments);
        }).catch(error => {
            console.error("Erro ao carregar investimentos para dashboard:", error);
            showAlert("Erro de Sincronização", "Não foi possível carregar os dados de investimento.");
        });
    }, (error) => {
        console.error("Erro ao ouvir transações:", error);
        showAlert("Erro de Sincronização", "Não foi possível carregar os lançamentos em tempo real.");
    });
}

// --- Funções de Investimentos ---

// Função para adicionar uma nova transação de investimento ao Firestore
async function addInvestmentTransaction(investmentData) {
    try {
        showLoading();
        const investmentsCollection = window.collection(db, `artifacts/${window.appId}/users/${userId}/investments`);
        await window.addDoc(investmentsCollection, investmentData);
        showAlert("Sucesso!", "Transação de investimento adicionada com sucesso!");
    } catch (e) {
        console.error("Erro ao adicionar documento de investimento: ", e);
        showAlert("Erro", "Não foi possível adicionar a transação de investimento. Tente novamente.");
    } finally {
        hideLoading();
    }
}

// Escuta por mudanças na coleção de investimentos em tempo real
function listenForInvestments() {
    if (unsubscribeFromInvestments) {
        unsubscribeFromInvestments(); // Desinscreve-se da escuta anterior se existir
    }

    const investmentsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/investments`);
    const q = window.query(investmentsCollectionRef);

    unsubscribeFromInvestments = window.onSnapshot(q, (snapshot) => {
        const investments = [];
        snapshot.forEach((doc) => {
            investments.push({ id: doc.id, ...doc.data() });
        });
        // Pega os lançamentos também para atualizar o dashboard completo
        const transactionsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/transactions`);
        window.getDocs(transactionsCollectionRef).then((transactionSnapshot) => {
            const transactions = [];
            transactionSnapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            console.log("Investimentos e Transações atualizados:", investments, transactions);
            updateDashboard(transactions, investments);
        }).catch(error => {
            console.error("Erro ao carregar lançamentos para dashboard:", error);
            showAlert("Erro de Sincronização", "Não foi possível carregar os dados de lançamentos.");
        });
    }, (error) => {
        console.error("Erro ao ouvir investimentos:", error);
        showAlert("Erro de Sincronização", "Não foi possível carregar os investimentos em tempo real.");
    });
}

// Atualiza a lista de ativos investidos na seção de Investimentos
function updateInvestedAssetsList(assetsInvested) {
    const listaAtivosInvestidos = document.getElementById('lista-ativos-investidos');
    listaAtivosInvestidos.innerHTML = ''; // Limpa a lista

    const hasInvestments = Object.keys(assetsInvested).some(asset => assetsInvested[asset] !== 0);

    if (!hasInvestments) {
        listaAtivosInvestidos.innerHTML = '<li class="text-gray-500">Nenhum investimento registrado.</li>';
        return;
    }

    for (const asset in assetsInvested) {
        if (assetsInvested[asset] !== 0) { // Mostra apenas ativos com valor diferente de zero
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-3 bg-blue-50 rounded-xl shadow-sm hover:bg-blue-100 transition-colors duration-200 cursor-pointer';
            li.innerHTML = `
                <span class="font-semibold text-blue-800">${asset}</span>
                <span class="font-bold ${assetsInvested[asset] >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(assetsInvested[asset])}</span>
            `;
            li.dataset.ativo = asset; // Armazena o nome do ativo no dataset
            li.addEventListener('click', () => showInvestmentHistoryModal(asset));
            listaAtivosInvestidos.appendChild(li);
        }
    }
}

// Função para exibir o modal de histórico de ativo
async function showInvestmentHistoryModal(assetType) {
    const modalHistoricoAtivo = document.getElementById('modalHistoricoAtivo');
    const tituloHistoricoAtivo = document.getElementById('tituloHistoricoAtivo');
    const listaHistoricoAtivo = document.getElementById('lista-historico-ativo');
    const valorTotalAtivo = document.getElementById('valorTotalAtivo');

    tituloHistoricoAtivo.textContent = `Histórico de ${assetType}`;
    listaHistoricoAtivo.innerHTML = ''; // Limpa o histórico anterior

    showLoading();
    try {
        const investmentsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/investments`);
        const q = window.query(investmentsCollectionRef, window.where('ativo', '==', assetType));
        const querySnapshot = await window.getDocs(q);

        let totalForAsset = 0;
        const transactionsForAsset = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactionsForAsset.push(data);
            if (data.operacao === 'entrada') {
                totalForAsset += data.valor;
            } else if (data.operacao === 'retirada') {
                totalForAsset -= data.valor;
            }
        });

        valorTotalAtivo.textContent = formatCurrency(totalForAsset);
        valorTotalAtivo.className = `font-bold ${totalForAsset >= 0 ? 'text-green-600' : 'text-red-600'}`;


        if (transactionsForAsset.length === 0) {
            listaHistoricoAtivo.innerHTML = '<li class="text-gray-500 text-center">Nenhuma transação para este ativo.</li>';
        } else {
            // Ordena as transações do ativo pela data mais recente
            transactionsForAsset.sort((a, b) => new Date(b.data) - new Date(a.data));

            transactionsForAsset.forEach(transaction => {
                const li = document.createElement('li');
                const valueClass = (transaction.operacao === 'entrada') ? 'text-green-600' : 'text-red-600';
                const operationDisplay = (transaction.operacao === 'entrada') ? 'Adição' : 'Retirada';
                li.className = `p-2 rounded-lg flex justify-between items-center ${transaction.operacao === 'entrada' ? 'bg-green-50' : 'bg-red-50'}`;
                li.innerHTML = `
                    <span>${operationDisplay}: ${transaction.descricao} - <span class="${valueClass}">${formatCurrency(transaction.valor)}</span></span>
                    <span class="text-xs text-gray-500">${new Date(transaction.data).toLocaleDateString('pt-BR')}</span>
                `;
                listaHistoricoAtivo.appendChild(li);
            });
        }

        modalHistoricoAtivo.classList.add('active');
        modalHistoricoAtivo.classList.remove('hidden');
        setTimeout(() => {
            modalHistoricoAtivo.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
        }, 10);

    } catch (error) {
        console.error("Erro ao carregar histórico do ativo:", error);
        showAlert("Erro", "Não foi possível carregar o histórico deste ativo.");
    } finally {
        hideLoading();
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebaseAndAuth(); // Inicializa Firebase e autenticação

    // Eventos de clique para navegação
    document.getElementById('nav-home').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('home-section');
    });
    document.getElementById('nav-investimentos').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('investimentos-section');
    });
    document.getElementById('nav-lancamentos').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('lancamentos-section');
    });

    // --- Lógica das Modais de Lançamentos ---
    const btnAdicionar = document.getElementById('btnAdicionar');
    const modalTipo = document.getElementById('modalTipo');
    const btnFecharModalTipo = document.getElementById('btnFecharModalTipo');
    const modalFormulario = document.getElementById('modalFormulario');
    const btnFecharFormulario = document.getElementById('btnFecharFormulario');
    const formLancamento = document.getElementById('formLancamento');
    const inputTipo = document.getElementById('tipo');
    const tituloFormulario = document.getElementById('tituloFormulario');
    const opcaoLancamentoBtns = document.querySelectorAll('.opcao-lancamento');

    // Abre a modal de tipo de lançamento
    btnAdicionar.addEventListener('click', () => {
        modalTipo.classList.add('active');
        modalTipo.classList.remove('hidden');
        setTimeout(() => {
            modalTipo.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
        }, 10);
    });

    // Fecha a modal de tipo de lançamento
    btnFecharModalTipo.addEventListener('click', () => {
        modalTipo.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalTipo.classList.add('hidden');
            modalTipo.classList.remove('active');
        }, 300);
    });

    // Seleção do tipo de lançamento e abertura da modal de formulário
    opcaoLancamentoBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            const tipo = e.target.dataset.tipo;
            inputTipo.value = tipo;
            tituloFormulario.textContent = `Adicionar Lançamento de ${tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ')}`;

            modalTipo.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                modalTipo.classList.add('hidden');
                modalTipo.classList.remove('active');
                modalFormulario.classList.add('active');
                modalFormulario.classList.remove('hidden');
                setTimeout(() => {
                    modalFormulario.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
                }, 10);
            }, 300);
        });
    });

    // Fecha a modal de formulário
    btnFecharFormulario.addEventListener('click', () => {
        modalFormulario.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalFormulario.classList.add('hidden');
            modalFormulario.classList.remove('active');
            formLancamento.reset(); // Limpa o formulário
        }, 300);
    });

    // Envio do formulário de lançamento
    formLancamento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const tipo = document.getElementById('tipo').value;
        const categoria = document.getElementById('categoria').value;

        if (!descricao || isNaN(valor) || valor <= 0) {
            showAlert("Erro de Preenchimento", "Por favor, preencha a descrição e insira um valor numérico válido e positivo.");
            return;
        }
        if (!categoria) {
            showAlert("Erro de Categoria", "Por favor, selecione uma categoria para o lançamento.");
            return;
        }

        const newTransaction = {
            descricao: descricao,
            valor: valor,
            tipo: tipo,
            categoria: categoria,
            data: new Date().toISOString() // Salva a data atual no formato ISO
        };

        await addTransaction(newTransaction);
        btnFecharFormulario.click(); // Fecha a modal após salvar
    });

    // --- Lógica das Modais de Investimento ---
    const btnAdicionarInvestimento = document.getElementById('btnAdicionarInvestimento');
    const btnRetirarInvestimento = document.getElementById('btnRetirarInvestimento');
    const modalTipoInvestimento = document.getElementById('modalTipoInvestimento');
    const btnFecharModalTipoInvestimento = document.getElementById('btnFecharModalTipoInvestimento');
    const modalSelecaoAtivo = document.getElementById('modalSelecaoAtivo');
    const btnFecharModalSelecaoAtivo = document.getElementById('btnFecharModalSelecaoAtivo');
    const tituloSelecaoAtivo = document.getElementById('tituloSelecaoAtivo');
    const listaAtivos = document.getElementById('lista-ativos');
    const modalFormularioInvestimento = document.getElementById('modalFormularioInvestimento');
    const btnFecharFormularioInvestimento = document.getElementById('btnFecharFormularioInvestimento');
    const formInvestimento = document.getElementById('formInvestimento');
    const inputInvestimentoOperacao = document.getElementById('investimento-operacao');
    const inputInvestimentoAtivo = document.getElementById('investimento-ativo');
    const tituloFormularioInvestimento = document.getElementById('tituloFormularioInvestimento');

    // Abre modal de seleção de tipo de investimento (Adicionar/Retirar)
    btnAdicionarInvestimento.addEventListener('click', () => {
        currentInvestmentOperation = 'entrada';
        tituloSelecaoAtivo.textContent = 'Selecione o Ativo para Adicionar';
        modalTipoInvestimento.classList.add('active');
        modalTipoInvestimento.classList.remove('hidden');
        setTimeout(() => {
            modalTipoInvestimento.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
        }, 10);
    });

    btnRetirarInvestimento.addEventListener('click', () => {
        currentInvestmentOperation = 'retirada';
        tituloSelecaoAtivo.textContent = 'Selecione o Ativo para Retirar';
        modalTipoInvestimento.classList.add('active');
        modalTipoInvestimento.classList.remove('hidden');
        setTimeout(() => {
            modalTipoInvestimento.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
        }, 10);
    });

    // Fecha modal de seleção de tipo de investimento
    btnFecharModalTipoInvestimento.addEventListener('click', () => {
        modalTipoInvestimento.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalTipoInvestimento.classList.add('hidden');
            modalTipoInvestimento.classList.remove('active');
        }, 300);
    });

    // Seleção da operação de investimento (Adicionar/Retirar)
    document.querySelectorAll('.opcao-investimento').forEach(button => {
        button.addEventListener('click', (e) => {
            currentInvestmentOperation = e.target.dataset.operacao;
            // Fecha o modal de tipo e abre o de seleção de ativo
            modalTipoInvestimento.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                modalTipoInvestimento.classList.add('hidden');
                modalTipoInvestimento.classList.remove('active');

                modalSelecaoAtivo.classList.add('active');
                modalSelecaoAtivo.classList.remove('hidden');
                setTimeout(() => {
                    modalSelecaoAtivo.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
                }, 10);
            }, 300);
        });
    });

    // Fecha modal de seleção de ativo
    btnFecharModalSelecaoAtivo.addEventListener('click', () => {
        modalSelecaoAtivo.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalSelecaoAtivo.classList.add('hidden');
            modalSelecaoAtivo.classList.remove('active');
        }, 300);
    });

    // Seleção do ativo e abertura do formulário de investimento
    document.querySelectorAll('.opcao-ativo').forEach(button => {
        button.addEventListener('click', (e) => {
            currentSelectedAsset = e.target.dataset.ativo;
            inputInvestimentoAtivo.value = currentSelectedAsset;
            inputInvestimentoOperacao.value = currentInvestmentOperation;

            tituloFormularioInvestimento.textContent = `${currentInvestmentOperation === 'entrada' ? 'Adicionar' : 'Retirar'} ${currentSelectedAsset}`;

            // Fecha o modal de seleção de ativo e abre o formulário
            modalSelecaoAtivo.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                modalSelecaoAtivo.classList.add('hidden');
                modalSelecaoAtivo.classList.remove('active');

                modalFormularioInvestimento.classList.add('active');
                modalFormularioInvestimento.classList.remove('hidden');
                setTimeout(() => {
                    modalFormularioInvestimento.querySelector('.modal-conteudo').classList.add('scale-100', 'opacity-100');
                }, 10);
            }, 300);
        });
    });

    // Fecha modal de formulário de investimento
    btnFecharFormularioInvestimento.addEventListener('click', () => {
        modalFormularioInvestimento.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalFormularioInvestimento.classList.add('hidden');
            modalFormularioInvestimento.classList.remove('active');
            formInvestimento.reset(); // Limpa o formulário
        }, 300);
    });

    // Envio do formulário de investimento
    formInvestimento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const descricao = document.getElementById('investimento-descricao').value.trim();
        const valor = parseFloat(document.getElementById('investimento-valor').value);
        const operacao = document.getElementById('investimento-operacao').value;
        const ativo = document.getElementById('investimento-ativo').value;

        if (!descricao || isNaN(valor) || valor <= 0) {
            showAlert("Erro de Preenchimento", "Por favor, preencha a descrição e insira um valor numérico válido e positivo.");
            return;
        }

        // Validação adicional para retirada: verificar se há saldo suficiente no ativo
        if (operacao === 'retirada') {
            showLoading();
            try {
                const investmentsCollectionRef = window.collection(db, `artifacts/${window.appId}/users/${userId}/investments`);
                const q = window.query(investmentsCollectionRef, window.where('ativo', '==', ativo));
                const querySnapshot = await window.getDocs(q);

                let currentAssetBalance = 0;
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.operacao === 'entrada') {
                        currentAssetBalance += data.valor;
                    } else if (data.operacao === 'retirada') {
                        currentAssetBalance -= data.valor;
                    }
                });

                if (valor > currentAssetBalance) {
                    showAlert("Erro de Retirada", `Você não tem R$ ${valor.toFixed(2)} disponíveis em ${ativo}. Saldo atual: ${formatCurrency(currentAssetBalance)}.`);
                    hideLoading();
                    return;
                }
            } catch (error) {
                console.error("Erro ao verificar saldo do ativo:", error);
                showAlert("Erro", "Não foi possível verificar o saldo do ativo. Tente novamente.");
                hideLoading();
                return;
            }
        }


        const newInvestmentTransaction = {
            descricao: descricao,
            valor: valor,
            operacao: operacao, // 'entrada' ou 'retirada'
            ativo: ativo, // CDB, SELIC, etc.
            data: new Date().toISOString()
        };

        await addInvestmentTransaction(newInvestmentTransaction);
        btnFecharFormularioInvestimento.click(); // Fecha a modal após salvar
    });

    // Fecha modal de histórico de ativo
    document.getElementById('btnFecharModalHistoricoAtivo').addEventListener('click', () => {
        const modalHistoricoAtivo = document.getElementById('modalHistoricoAtivo');
        modalHistoricoAtivo.querySelector('.modal-conteudo').classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalHistoricoAtivo.classList.add('hidden');
            modalHistoricoAtivo.classList.remove('active');
        }, 300);
    });


    // Exibe a página inicial por padrão ao carregar
    showPage('home-section');
});
