💰 Projeto de Finanças Pessoais
Este é um aplicativo web para gerenciamento de finanças pessoais, construído com HTML, CSS (Tailwind CSS) e JavaScript, utilizando Firebase Firestore para persistência de dados em tempo real.

🌟 Funcionalidades
Visão Geral (Home):

Exibe um resumo dos gastos do mês, entradas, saídas e balanço atual.

Apresenta o total investido, com detalhes de entradas e retiradas de investimentos.

Lista os últimos lançamentos de forma clara e organizada.

Gráficos interativos (Pizza e Linha) para visualização de gastos por categoria e evolução mensal.

Seção de alertas e acompanhamento de metas de economia.

Lançamentos:

Permite adicionar novos lançamentos (entradas, saídas, reservas, investimentos, despesas fixas, outros).

Formulário intuitivo para descrição, valor e categoria.

Tabela com o histórico completo de todos os lançamentos.

Investimentos:

Funcionalidades para adicionar e retirar valores de diferentes ativos de investimento (CDB, SELIC, Renda Passiva, CRIPTO, Dólar).

Visualização clara do total investido em cada ativo.

Histórico detalhado de todas as transações (adições e retiradas) para cada ativo, incluindo o saldo atual do ativo.

Validação para evitar retiradas de valores maiores do que o saldo disponível no ativo.

Persistência de Dados:

Todos os dados (lançamentos e investimentos) são armazenados no Firebase Firestore, garantindo que as informações sejam salvas e acessíveis em tempo real.

Autenticação anônima para facilitar o uso inicial, com a possibilidade de expansão para autenticação de usuários.

Design Responsivo:

Interface adaptável a diferentes tamanhos de tela (desktop, tablet, mobile) utilizando Tailwind CSS.

🛠️ Tecnologias Utilizadas
HTML5: Estrutura da página.

CSS3 (Tailwind CSS): Estilização e design responsivo.

JavaScript (ES6+): Lógica de programação, manipulação do DOM e integração com o backend.

Firebase Firestore: Banco de dados NoSQL em tempo real para armazenamento de dados.

Firebase Authentication: Para autenticação de usuários (atualmente anônima).

Chart.js: Biblioteca para criação de gráficos interativos.

📂 Estrutura do Projeto
/seu-projeto-financas/
├── index.html          # O arquivo HTML principal (SPA)
├── styles.css          # Estilos CSS personalizados
├── script.js           # Toda a lógica JavaScript da aplicação
└── README.md           # Este arquivo de documentação

🚀 Como Executar o Projeto
Clone o Repositório (se aplicável):

git clone <URL_DO_SEU_REPOSITORIO>
cd seu-projeto-financas

Abra o index.html:
Simplesmente abra o arquivo index.html em seu navegador web. Não é necessário um servidor local para as funcionalidades básicas, pois o Firebase é acessado via CDN.

Nota: Para um ambiente de desenvolvimento mais robusto ou para usar funcionalidades avançadas do Firebase (como regras de segurança mais complexas), você pode configurar um servidor local simples (ex: python -m http.server ou Live Server no VS Code).

Configuração do Firebase (já configurado no ambiente Canvas):
Este projeto utiliza variáveis globais (__app_id, __firebase_config, __initial_auth_token) fornecidas pelo ambiente Canvas para a conexão com o Firebase. Você não precisa configurar manualmente as credenciais do Firebase no código.

💡 Próximos Passos e Melhorias Sugeridas
Autenticação de Usuários: Implementar login/registro com e-mail e senha (ou Google, etc.) para que cada usuário tenha seus dados financeiros privados.

Validação de Retirada de Investimento: Refinar a validação para garantir que o usuário não retire um valor maior do que o saldo atual do ativo. (Já implementado na última versão do JS!)

Gráficos de Investimento: Adicionar gráficos específicos para investimentos (ex: distribuição do portfólio, evolução de um ativo).

Cálculo de Rendimento: Integrar funcionalidades para calcular o rendimento dos investimentos.

Edição/Exclusão: Adicionar opções para editar e excluir lançamentos e transações de investimento.

Categorias Personalizadas: Permitir que os usuários criem e gerenciem suas próprias categorias de lançamentos.

Relatórios Detalhados: Desenvolver relatórios mais complexos com opções de filtragem e exportação.

Notificações: Implementar notificações para faturas a vencer, metas atingidas, etc.
