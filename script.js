// ========== AUTENTICAÇÃO ==========
let usuarioAtual = null;

function escaparHTML(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function alternarFormulario() {
    document.getElementById("formulario-login").classList.toggle("formulario-ativo");
    document.getElementById("formulario-login").classList.toggle("formulario-oculto");
    document.getElementById("formulario-cadastro").classList.toggle("formulario-ativo");
    document.getElementById("formulario-cadastro").classList.toggle("formulario-oculto");
    
    // Limpar campos
    document.getElementById("login-usuario").value = "";
    document.getElementById("login-senha").value = "";
    document.getElementById("cadastro-usuario").value = "";
    document.getElementById("cadastro-email").value = "";
    document.getElementById("cadastro-senha").value = "";
    document.getElementById("cadastro-confirmar").value = "";
}

function fazerCadastro() {
    let usuario = document.getElementById("cadastro-usuario").value.trim();
    let email = document.getElementById("cadastro-email").value.trim();
    let senha = document.getElementById("cadastro-senha").value;
    let confirmar = document.getElementById("cadastro-confirmar").value;
    let avatar = document.getElementById("cadastro-avatar").value;

    if (usuario === "" || email === "" || senha === "" || confirmar === "") {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== confirmar) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 4) {
        alert("A senha deve ter pelo menos 4 caracteres!");
        return;
    }

    // Verificar se usuário já existe
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    if (usuarios[usuario]) {
        alert("Este usuário já existe!");
        return;
    }

    // Salvar novo usuário
    usuarios[usuario] = {
        email: email,
        senha: senha,
        nivel: 1,
        pontos: 0,
        badges: [],
        tarefas: [],
        perguntaAtual: 0,
        materias: {},
        materiaSelecionada: null,
        avatar: avatar,
        quizDiario: null,
        respostasUsuarioGame: {},
        fasesConcluidas: {},
        diasEstudo: [],
        ultimaFaseGame: null,
        metaDiaria: 1,
        progressoMeta: { data: null, fases: 0 },
        agendaEventos: []
    };

    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert("Cadastro realizado com sucesso! Faça login para continuar.");
    alternarFormulario();
}

function fazerLogin() {
    let usuario = document.getElementById("login-usuario").value;
    let senha = document.getElementById("login-senha").value;

    if (usuario === "" || senha === "") {
        alert("Preencha usuário e senha!");
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};

    if (!usuarios[usuario]) {
        alert("Usuário não encontrado!");
        return;
    }

    if (usuarios[usuario].senha !== senha) {
        alert("Senha incorreta!");
        return;
    }

    // Login bem-sucedido
    usuarioAtual = usuario;
    localStorage.setItem("usuarioAtual", usuario);
    irParaApp();
}

function fazerLogout() {
    usuarioAtual = null;
    localStorage.removeItem("usuarioAtual");
    document.getElementById("tela-autenticacao").classList.remove("tela-oculta");
    document.getElementById("tela-autenticacao").classList.add("tela-ativa");
    document.getElementById("tela-app").classList.remove("tela-ativa");
    document.getElementById("tela-app").classList.add("tela-oculta");
    
    // Limpar campos
    document.getElementById("login-usuario").value = "";
    document.getElementById("login-senha").value = "";
}

function irParaApp() {
    // Ir direto para o app
    document.getElementById("tela-autenticacao").classList.remove("tela-ativa");
    document.getElementById("tela-autenticacao").classList.add("tela-oculta");
    document.getElementById("tela-app").classList.remove("tela-oculta");
    document.getElementById("tela-app").classList.add("tela-ativa");
    
    document.getElementById("usuario-nome").innerText = usuarioAtual;
    loadTheme();
    carregarDadosUsuario();
    abrirRanking(); // Garantir que o ranking seja mostrado
}

function carregarDadosUsuario() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let dados = usuarios[usuarioAtual];
    
    if (dados) {
        document.getElementById("usuario-nome").innerText = usuarioAtual;
        
        pontos = dados.pontos;
        nivel = dados.nivel;
        perguntaAtual = dados.perguntaAtual;
        badges = dados.badges;
        tarefas = dados.tarefas;
        materias = dados.materias || {};
        materiaSelecionada = dados.materiaSelecionada;
        respostasUsuarioGame = dados.respostasUsuarioGame && typeof dados.respostasUsuarioGame === "object"
            ? dados.respostasUsuarioGame
            : {};
        fasesConcluidas = dados.fasesConcluidas && typeof dados.fasesConcluidas === "object"
            ? dados.fasesConcluidas
            : {};
        diasEstudo = Array.isArray(dados.diasEstudo) ? dados.diasEstudo : [];
        ultimaFaseGame = dados.ultimaFaseGame || null;
        metaDiaria = Number(dados.metaDiaria) > 0 ? Number(dados.metaDiaria) : 1;
        progressoMeta = dados.progressoMeta && typeof dados.progressoMeta === "object"
            ? dados.progressoMeta
            : { data: null, fases: 0 };
        agendaEventos = Array.isArray(dados.agendaEventos) ? dados.agendaEventos : [];
        Object.keys(respostasUsuarioGame).forEach(chaveFase => {
            const respostas = respostasUsuarioGame[chaveFase];
            if (Array.isArray(respostas) && respostas.length > 0 && respostas.every(resposta => resposta >= 0)) {
                fasesConcluidas[chaveFase] = true;
            }
        });
        localStorage.setItem("usuarios", JSON.stringify({
            ...usuarios,
            [usuarioAtual]: {
                ...dados,
                respostasUsuarioGame,
                fasesConcluidas
            }
        }));
        quizDiario = dados.quizDiario || null;
        atualizarQuizDiarioParaUsuario();
        
        pontosProxNivel = nivel * 100;
        
        document.getElementById("pontos").innerText = pontos;
        document.getElementById("nivel").innerText = nivel;
        document.getElementById("proxNivel").innerText = pontosProxNivel;
        atualizarProgressoSidebar(dados.avatar || "🎓");
        
        atualizarBadges();
        atualizarBarraProgresso();
        mostrarPergunta();
        atualizarListaMaterias();
        atualizarAgenda();
        carregarRanking();
    }
}

function salvarDadosUsuario() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let dadosAtuais = usuarios[usuarioAtual];

    if (!dadosAtuais) {
        return;
    }

    usuarios[usuarioAtual] = {
        ...dadosAtuais,
        email: dadosAtuais.email,
        senha: dadosAtuais.senha,
        nivel: nivel,
        pontos: pontos,
        badges: badges,
        tarefas: tarefas,
        perguntaAtual: perguntaAtual,
        materias: materias,
        materiaSelecionada: materiaSelecionada,
        respostasUsuarioGame: respostasUsuarioGame,
        fasesConcluidas: fasesConcluidas,
        diasEstudo: diasEstudo,
        ultimaFaseGame: ultimaFaseGame,
        metaDiaria: metaDiaria,
        progressoMeta: progressoMeta,
        agendaEventos: agendaEventos,
        avatar: dadosAtuais.avatar,
        quizDiario: quizDiario || dadosAtuais.quizDiario || null
    };
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// ========== SISTEMA DE MATÉRIAS ==========
let materias = {};
let materiaSelecionada = null;

function adicionarMateria() {
    let nomeMateria = document.getElementById("nova-materia").value.trim();
    
    if (nomeMateria.trim() === "") {
        alert("Digite o nome de uma matéria!");
        return;
    }

    if (materias[nomeMateria]) {
        alert("Esta matéria já existe!");
        return;
    }

    materias[nomeMateria] = {
        tarefas: [],
        dataCriacao: new Date()
    };

    document.getElementById("nova-materia").value = "";
    atualizarListaMaterias();
    salvarDadosUsuario();
    mostrarEfeito("📚 " + nomeMateria + " adicionada!");
}

function atualizarListaMaterias() {
    let listaDiv = document.getElementById("lista-materias-custom");
    listaDiv.innerHTML = "";
    
    // Adicionar matérias
    Object.keys(materias).forEach(nomeMateria => {
        let li = document.createElement("li");
        li.className = "materia-item";
        const icone = document.createElement("span");
        icone.textContent = "📖";
        const nome = document.createElement("span");
        nome.className = "materia-nome";
        nome.textContent = nomeMateria;
        nome.addEventListener("click", () => abrirMateria(nomeMateria));
        const excluir = document.createElement("button");
        excluir.className = "btn-delete-materia";
        excluir.type = "button";
        excluir.textContent = "✕";
        excluir.addEventListener("click", () => deletarMateria(nomeMateria));
        li.append(icone, nome, excluir);
        listaDiv.appendChild(li);
    });
}

function abrirMateria(nomeMateria) {
    materiaSelecionada = nomeMateria;
    
    // Atualizar visual - encontrar e marcar como ativo
    let materiaItems = document.getElementById("lista-materias-custom").querySelectorAll(".materia-item");
    materiaItems.forEach(item => item.classList.remove("ativo"));
    
    // Encontrar o item correto
    materiaItems.forEach(item => {
        if (item.textContent.includes(nomeMateria)) {
            item.classList.add("ativo");
        }
    });
    
    // Mostrar conteúdo
    document.getElementById("conteudo-ranking").classList.remove("conteudo-ativo");
    document.getElementById("conteudo-ranking").classList.add("conteudo-oculto");
    document.getElementById("conteudo-quiz").classList.remove("conteudo-ativo");
    document.getElementById("conteudo-quiz").classList.add("conteudo-oculto");
    document.getElementById("conteudo-materias").classList.remove("conteudo-oculto");
    document.getElementById("conteudo-materias").classList.add("conteudo-ativo");
    
    // Atualizar título e tarefas
    document.getElementById("titulo-materia").innerText = nomeMateria;
    document.getElementById("tarefa-materia").value = "";
    carregarTarefasMateria(nomeMateria);
    
    salvarDadosUsuario();
}

function marcarNavAtivo(id) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("ativo");
    });
    const elemento = document.getElementById(id);
    if (elemento) elemento.classList.add("ativo");
}

function ocultarTodosConteudos() {
    ["conteudo-ranking", "conteudo-quiz", "conteudo-game", "conteudo-materias", "conteudo-personagem"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove("conteudo-ativo");
            el.classList.add("conteudo-oculto");
        }
    });
}

function abrirRanking() {
    materiaSelecionada = null;
    marcarNavAtivo("nav-ranking");
    ocultarTodosConteudos();
    document.getElementById("conteudo-ranking").classList.remove("conteudo-oculto");
    document.getElementById("conteudo-ranking").classList.add("conteudo-ativo");
    carregarRanking();
    atualizarPainelInicial();
    salvarDadosUsuario();
}

function registrarDiaEstudo() {
    const hoje = obterDataHoje();
    const dias = Array.isArray(diasEstudo) ? diasEstudo : [];
    if (!dias.includes(hoje)) {
        dias.push(hoje);
        diasEstudo = dias.slice(-60);
        salvarDadosUsuario();
    }
}

function calcularSequenciaEstudo() {
    const dias = new Set(diasEstudo || []);
    let sequencia = 0;
    const data = new Date();
    while (dias.has(formatarDataLocal(data))) {
        sequencia++;
        data.setDate(data.getDate() - 1);
    }
    return sequencia;
}

function atualizarPainelInicial() {
    const painel = document.getElementById("painel-progresso");
    const dica = document.getElementById("painel-dica");
    const estatisticas = document.getElementById("painel-estatisticas");
    const calendario = document.getElementById("painel-calendario");
    if (!painel || !dica || !estatisticas || !calendario) return;

    const totalFases = Object.values(materiasDo6Ano).reduce((total, materia) => total + materia.fases.length, 0);
    const fasesFeitas = Object.keys(fasesConcluidas || {}).filter(chave => fasesConcluidas[chave]).length;
    const ultimaConquista = (badges || []).map(id => conquistas.find(item => item.id === id)).filter(Boolean).pop();
    const materiasComProgresso = Object.keys(materiasDo6Ano).map(nome => ({
        nome,
        total: Object.keys(fasesConcluidas || {}).filter(chave => chave.indexOf(nome + "_") === 0 && fasesConcluidas[chave]).length
    })).sort((a, b) => b.total - a.total)[0];
    const progresso = totalFases ? Math.round((fasesFeitas / totalFases) * 100) : 0;
    const desempenho = calcularDesempenhoGame();
    const metaProgresso = progressoMeta.data === obterDataHoje()
        ? Math.min(100, Math.round((progressoMeta.fases / metaDiaria) * 100))
        : 0;

    painel.innerHTML = `
        <div class="painel-card"><strong>🔥 ${calcularSequenciaEstudo()}</strong><span>dias seguidos</span></div>
        <div class="painel-card"><strong>🎯 ${metaProgresso}%</strong><span>da meta de hoje (${metaDiaria} fase${metaDiaria === 1 ? "" : "s"})</span></div>
        <div class="painel-card"><strong>${progresso}%</strong><span>das fases concluídas</span></div>
        <div class="painel-card"><strong>${materiasComProgresso && materiasComProgresso.total ? materiasComProgresso.nome : "Ainda começando"}</strong><span>matéria em destaque</span></div>
        <div class="painel-card"><strong>${ultimaConquista ? ultimaConquista.emoji : "🏅"}</strong><span>${ultimaConquista ? ultimaConquista.nome : "Próxima conquista"}</span></div>
    `;
    estatisticas.innerHTML = `
        <h3>📈 Desempenho</h3>
        <div class="estatisticas-linha">
            <span>Questões respondidas: <strong>${desempenho.respondidas}</strong></span>
            <span>Acertos: <strong>${desempenho.acertos}</strong></span>
            <span>Aproveitamento: <strong>${desempenho.percentual}%</strong></span>
        </div>
        <div class="barra-meta"><span style="width:${metaProgresso}%"></span></div>
    `;
    calendario.innerHTML = criarCalendarioEstudos();
    dica.innerHTML = "<strong>💡 Dica de hoje:</strong> estudar um pouco todos os dias costuma funcionar melhor do que deixar tudo para a última hora.";
    atualizarProgressoSidebar();
}

function atualizarProgressoSidebar(avatar) {
    const usuario = document.getElementById("sidebar-usuario");
    const avatarElement = document.getElementById("sidebar-avatar");
    const nivelElement = document.getElementById("sidebar-nivel");
    const sequenciaElement = document.getElementById("sidebar-sequencia");
    const barra = document.getElementById("sidebar-barra-progresso");
    const pontosElement = document.getElementById("sidebar-pontos");
    if (!usuario || !avatarElement || !nivelElement || !sequenciaElement || !barra || !pontosElement) return;

    const pontosNoNivel = pontos % (nivel * 100);
    const progresso = Math.min(100, Math.round((pontosNoNivel / (nivel * 100)) * 100));
    usuario.textContent = usuarioAtual || "Estudante";
    avatarElement.textContent = avatar || "🎓";
    nivelElement.textContent = nivel;
    sequenciaElement.textContent = calcularSequenciaEstudo();
    barra.style.width = `${progresso}%`;
    pontosElement.textContent = `${pontosProxNivel - pontos} pontos para o próximo nível`;
}

function calcularDesempenhoGame() {
    let respondidas = 0;
    let acertos = 0;
    Object.keys(respostasUsuarioGame || {}).forEach(chave => {
        const separador = chave.lastIndexOf("_");
        const materia = chave.slice(0, separador);
        const faseIndex = Number(chave.slice(separador + 1));
        const fase = materiasDo6Ano[materia] && materiasDo6Ano[materia].fases[faseIndex];
        const respostas = respostasUsuarioGame[chave];
        if (!fase || !Array.isArray(respostas)) return;
        respostas.forEach((resposta, index) => {
            if (resposta >= 0 && fase.perguntas[index]) {
                respondidas++;
                if (resposta === fase.perguntas[index].resposta) acertos++;
            }
        });
    });
    return { respondidas, acertos, percentual: respondidas ? Math.round((acertos / respondidas) * 100) : 0 };
}

function criarCalendarioEstudos() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const nomeMes = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 0; i < primeiroDia; i++) dias.push("<span></span>");
    for (let dia = 1; dia <= totalDias; dia++) {
        const data = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const classes = [];
        if ((diasEstudo || []).includes(data)) classes.push("estudado");
        if ((agendaEventos || []).some(evento => evento.data === data)) classes.push("com-evento");
        dias.push(`<span class="${classes.join(" ")}" title="${classes.includes("com-evento") ? "Há compromisso nesta data" : ""}">${dia}</span>`);
    }
    return `<h3>🗓️ Calendário de estudos</h3><p>${nomeMes}</p><div class="calendario-cabecalho"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="calendario-grid">${dias.join("")}</div>`;
}

function formatarDataLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function registrarFaseConcluidaNaMeta() {
    const hoje = obterDataHoje();
    if (progressoMeta.data !== hoje) {
        progressoMeta = { data: hoje, fases: 0 };
    }
    progressoMeta.fases++;
    registrarDiaEstudo();
    salvarDadosUsuario();
}

function definirMetaEstudo() {
    const valor = prompt("Quantas fases você quer concluir por dia?", String(metaDiaria));
    if (valor === null) return;
    const novaMeta = Number.parseInt(valor, 10);
    if (!Number.isInteger(novaMeta) || novaMeta < 1 || novaMeta > 10) {
        alert("Escolha uma meta entre 1 e 10 fases.");
        return;
    }

    metaDiaria = novaMeta;
    salvarDadosUsuario();
    atualizarPainelInicial();
    mostrarEfeito("🎯 Meta atualizada!");
}

function continuarUltimaFase() {
    if (!ultimaFaseGame || !materiasDo6Ano[ultimaFaseGame.materia]) {
        abrirGame();
        mostrarEfeito("🎮 Escolha uma fase para começar!");
        return;
    }
    abrirGame();
    iniciarFaseGame(ultimaFaseGame.materia, ultimaFaseGame.fase);
}

function irParaAdicionarTarefa() {
    const primeiraMateria = Object.keys(materias)[0];
    if (primeiraMateria) {
        abrirMateria(primeiraMateria);
    } else {
        abrirRanking();
        mostrarEfeito("📚 Crie uma matéria para adicionar tarefas!");
    }
}

function abrirQuiz() {
    materiaSelecionada = null;
    marcarNavAtivo("nav-quiz");
    ocultarTodosConteudos();
    document.getElementById("conteudo-quiz").classList.remove("conteudo-oculto");
    document.getElementById("conteudo-quiz").classList.add("conteudo-ativo");
    mostrarPergunta();
    salvarDadosUsuario();
}

function abrirGame() {
    materiaSelecionada = null;
    marcarNavAtivo("nav-game");
    ocultarTodosConteudos();
    document.getElementById("conteudo-game").classList.remove("conteudo-oculto");
    document.getElementById("conteudo-game").classList.add("conteudo-ativo");
    carregarMateriasGame();
    salvarDadosUsuario();
}



function adicionarTarefaMateria() {
    if (!materiaSelecionada) return;
    
    let texto = document.getElementById("tarefa-materia").value;
    
    if (texto.trim() === "") {
        alert("Digite uma tarefa!");
        return;
    }

    let id = Date.now();
    materias[materiaSelecionada].tarefas.push({
        id: id,
        texto: texto,
        concluida: false
    });

    document.getElementById("tarefa-materia").value = "";
    carregarTarefasMateria(materiaSelecionada);
    salvarDadosUsuario();
    mostrarEfeito("✅ Tarefa adicionada!");
}

function carregarTarefasMateria(nomeMateria) {
    let lista = document.getElementById("lista-tarefas-materia");
    lista.innerHTML = "";
    
    if (!materias[nomeMateria]) return;
    
    materias[nomeMateria].tarefas.forEach(tarefa => {
        let item = document.createElement("li");
        item.className = "item-tarefa";
        if (tarefa.concluida) item.classList.add("concluida");
        item.id = "tarefa-mat-" + tarefa.id;
        item.innerHTML = `
            <span>${tarefa.texto}</span>
            <button onclick='concluirTarefaMateria(${tarefa.id})' class='btn-concluir'>✔</button>
        `;
        lista.appendChild(item);
    });
}

function concluirTarefaMateria(id) {
    if (!materiaSelecionada) return;
    
    materias[materiaSelecionada].tarefas = materias[materiaSelecionada].tarefas.filter(t => t.id !== id);
    
    carregarTarefasMateria(materiaSelecionada);
    salvarDadosUsuario();
    mostrarEfeito("🎉 Tarefa concluída!");
}

function deletarMateria(nomeMateria) {
    if (confirm("Tem certeza que deseja deletar '" + nomeMateria + "'?")) {
        delete materias[nomeMateria];
        if (materiaSelecionada === nomeMateria) {
            abrirRanking();
        }
        atualizarListaMaterias();
        salvarDadosUsuario();
        mostrarEfeito("🗑️ Matéria deletada!");
    }
}

function carregarRanking() {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let ranking = [];
    
    // Criar array com usuários e seus pontos
    Object.keys(usuarios).forEach(nomeUsuario => {
        ranking.push({
            nome: nomeUsuario,
            pontos: usuarios[nomeUsuario].pontos,
            nivel: usuarios[nomeUsuario].nivel,
            customizacao: usuarios[nomeUsuario].customizacao
        });
    });
    
    // Ordenar por pontos (decrescente)
    ranking.sort((a, b) => b.pontos - a.pontos);
    
    // Exibir ranking
    let container = document.getElementById("ranking-container");
    container.innerHTML = "";
    
    ranking.forEach((usuario, index) => {
        let posicao = index + 1;
        let item = document.createElement("div");
        item.className = "ranking-item";
        
        // Adicionar classe especial para top 3
        if (posicao === 1) item.classList.add("top1");
        else if (posicao === 2) item.classList.add("top2");
        else if (posicao === 3) item.classList.add("top3");
        
        let medalha = posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : posicao + "º";
        
        item.innerHTML = `
            <div class="ranking-posicao">${medalha}</div>
            <div class="ranking-usuario">
                <div class="ranking-avatar">📚</div>
                <div class="ranking-nome">${escaparHTML(usuario.nome)}</div>
                <div class="ranking-nivel">Nível ${usuario.nivel}</div>
            </div>
            <div class="ranking-pontos">${usuario.pontos} pts</div>
        `;
        
        container.appendChild(item);
    });
}

// ========== APP GAMIFICADO ==========
let pontos = 0;
let nivel = 1;
let pontosProxNivel = 100;
let badges = [];
let perguntaAtual = 0;
let tarefas = [];
let contadorTarefas = 0;
let diasEstudo = [];
let ultimaFaseGame = null;
let metaDiaria = 1;
let progressoMeta = { data: null, fases: 0 };
let agendaEventos = [];

function adicionarEventoAgenda() {
    const tituloInput = document.getElementById("agenda-titulo");
    const tipoInput = document.getElementById("agenda-tipo");
    const dataInput = document.getElementById("agenda-data");
    const titulo = tituloInput.value.trim();
    if (!titulo || !dataInput.value) {
        alert("Informe um título e uma data para o compromisso.");
        return;
    }

    agendaEventos.push({
        id: Date.now(),
        titulo,
        tipo: tipoInput.value,
        data: dataInput.value
    });
    agendaEventos.sort((a, b) => a.data.localeCompare(b.data));
    tituloInput.value = "";
    dataInput.value = "";
    atualizarAgenda();
    atualizarPainelInicial();
    salvarDadosUsuario();
    mostrarEfeito("🗓️ Compromisso adicionado à agenda!");
}

function atualizarAgenda() {
    const lista = document.getElementById("lista-agenda");
    if (!lista) return;
    const hoje = obterDataHoje();
    const proximos = agendaEventos.filter(evento => evento.data >= hoje).slice(0, 5);
    lista.innerHTML = "";
    if (!proximos.length) {
        lista.innerHTML = "<li class='agenda-vazia'>Nenhum compromisso próximo.</li>";
        return;
    }
    proximos.forEach(evento => {
        const item = document.createElement("li");
        item.className = "agenda-item";
        const data = new Date(`${evento.data}T12:00:00`).toLocaleDateString("pt-BR");
        item.innerHTML = `<div><strong>${evento.tipo} ${escaparHTML(evento.titulo)}</strong><small>${data}</small></div>`;
        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "agenda-remover";
        remover.textContent = "×";
        remover.title = "Remover compromisso";
        remover.onclick = () => removerEventoAgenda(evento.id);
        item.appendChild(remover);
        lista.appendChild(item);
    });
}

function removerEventoAgenda(id) {
    agendaEventos = agendaEventos.filter(evento => evento.id !== id);
    atualizarAgenda();
    salvarDadosUsuario();
}

let perguntas = [];
let quizDiario = null;

const perguntasBase = [
    {
        pergunta: "Capital do Brasil?",
        opcoes: ["Rio de Janeiro", "Brasília", "São Paulo", "Salvador"],
        resposta: 1
    },
    {
        pergunta: "Quanto é 2 + 2?",
        opcoes: ["3", "4", "5", "6"],
        resposta: 1
    },
    {
        pergunta: "Qual é o planeta mais próximo do Sol?",
        opcoes: ["Vênus", "Mercúrio", "Terra", "Marte"],
        resposta: 1
    },
    {
        pergunta: "Qual é a maior célula do corpo humano?",
        opcoes: ["Neurônio", "Hemácia", "Óvulo", "Espermatozoide"],
        resposta: 2
    },
    {
        pergunta: "Quem escreveu Dom Casmurro?",
        opcoes: ["Aluísio Azevedo", "Machado de Assis", "Cruz e Sousa", "Castro Alves"],
        resposta: 1
    }
];

const perguntasPorMateria = {
    "Matemática": [
        { pergunta: "Quanto é 24 + 18?", opcoes: ["32", "40", "42", "36"], resposta: 2 },
        { pergunta: "Qual é o resultado de 9 × 7?", opcoes: ["54", "56", "63", "72"], resposta: 1 },
        { pergunta: "Qual é o dobro de 15?", opcoes: ["20", "25", "30", "35"], resposta: 2 },
        { pergunta: "Quanto é 50 ÷ 5?", opcoes: ["5", "8", "10", "12"], resposta: 2 },
        { pergunta: "Qual número é ímpar?", opcoes: ["12", "18", "21", "24"], resposta: 2 }
    ],
    "Português": [
        { pergunta: "Qual palavra está escrita corretamente?", opcoes: ["Casa", "Caza", "Casaa", "Casá"], resposta: 0 },
        { pergunta: "Qual palavra é um sinônimo de feliz?", opcoes: ["Triste", "Contente", "Frio", "Rápido"], resposta: 1 },
        { pergunta: "Qual palavra está no plural?", opcoes: ["Livro", "Carros", "Mesa", "Água"], resposta: 1 },
        { pergunta: "Qual é a sílaba tônica de 'caminhão'?", opcoes: ["ca", "mi", "nhão", "ção"], resposta: 2 },
        { pergunta: "Qual frase está com pontuação correta?", opcoes: ["Você vai hoje?", "Você vai hoje.", "Você vai, hoje?", "Você vai hoje!"], resposta: 1 }
    ],
    "Inglês": [
        { pergunta: "How do you say 'casa' em inglês?", opcoes: ["House", "School", "Car", "Book"], resposta: 0 },
        { pergunta: "Qual é a tradução de 'water'?", opcoes: ["Fogo", "Água", "Terra", "Ar"], resposta: 1 },
        { pergunta: "Complete: I ___ a student.", opcoes: ["am", "is", "are", "be"], resposta: 0 },
        { pergunta: "Qual palavra significa 'livro' em inglês?", opcoes: ["Book", "Door", "Window", "Desk"], resposta: 0 },
        { pergunta: "How do you say 'obrigado' em inglês?", opcoes: ["Sorry", "Thank you", "Hello", "Goodbye"], resposta: 1 }
    ],
    "Geografia": [
        { pergunta: "Qual é a capital do Brasil?", opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], resposta: 2 },
        { pergunta: "Qual é o maior oceano do planeta?", opcoes: ["Atlântico", "Índico", "Pacífico", "Ártico"], resposta: 2 },
        { pergunta: "Qual biome é muito seco e quente?", opcoes: ["Floresta Amazônica", "Caatinga", "Pantanal", "Mata Atlântica"], resposta: 1 },
        { pergunta: "Qual país tem o maior número de florestas tropicais?", opcoes: ["Brasil", "Canadá", "Japão", "Austrália"], resposta: 0 },
        { pergunta: "Qual é o principal rio do Brasil?", opcoes: ["Rio São Francisco", "Rio Amazonas", "Rio Paraná", "Rio Tietê"], resposta: 1 }
    ],
    "História": [
        { pergunta: "Em que ano o Brasil foi descoberto por Portugal?", opcoes: ["1492", "1500", "1540", "1600"], resposta: 1 },
        { pergunta: "Quem foi o primeiro presidente do Brasil?", opcoes: ["Getúlio Vargas", "Deodoro da Fonseca", "Epitácio Pessoa", "Juscelino Kubitschek"], resposta: 1 },
        { pergunta: "Qual foi a data da independência do Brasil?", opcoes: ["7 de setembro de 1822", "15 de novembro de 1889", "12 de outubro de 1492", "25 de março de 1825"], resposta: 0 },
        { pergunta: "Qual movimento foi liderado por Tiradentes?", opcoes: ["Revolução Farroupilha", "Inconfidência Mineira", "Guerra do Paraguai", "Conjuração Baiana"], resposta: 1 },
        { pergunta: "Qual cidade foi a primeira capital do Brasil?", opcoes: ["Rio de Janeiro", "Salvador", "São Paulo", "Brasília"], resposta: 1 }
    ]
};

function obterDataHoje() {
    const hoje = new Date();
    return formatarDataLocal(hoje);
}

function gerarPerguntasDiarias() {
    const materias = Object.keys(perguntasPorMateria);
    const lista = [];

    materias.forEach(materia => {
        const banco = perguntasPorMateria[materia];
        const perguntaAleatoria = banco[Math.floor(Math.random() * banco.length)];
        lista.push({ ...perguntaAleatoria, materia });
    });

    return lista;
}

function atualizarQuizDiarioParaUsuario() {
    if (!usuarioAtual) {
        return null;
    }

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let dados = usuarios[usuarioAtual];
    if (!dados) {
        return null;
    }

    const hoje = obterDataHoje();
    if (!dados.quizDiario || dados.quizDiario.data !== hoje || !Array.isArray(dados.quizDiario.perguntas) || dados.quizDiario.perguntas.length === 0) {
        dados.quizDiario = {
            data: hoje,
            perguntas: gerarPerguntasDiarias(),
            concluido: false
        };

        usuarios[usuarioAtual] = { ...dados, quizDiario: dados.quizDiario };
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }

    quizDiario = dados.quizDiario;
    perguntas = quizDiario.perguntas || [];
    perguntaAtual = 0;
    return quizDiario;
}

function quizDiarioJaConcluidoHoje() {
    if (!usuarioAtual) {
        return false;
    }

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let dados = usuarios[usuarioAtual];
    if (!dados || !dados.quizDiario) {
        return false;
    }

    return dados.quizDiario.data === obterDataHoje() && dados.quizDiario.concluido;
}

const conquistas = [
    { id: "primeiro_quiz", nome: "Primeiro Quiz", emoji: "🎯", descricao: "Responder a um quiz" },
    { id: "cinco_pontos", nome: "Iniciante", emoji: "⭐", descricao: "Ganhar 50 pontos" },
    { id: "nivel_2", nome: "Aventureiro", emoji: "🚀", descricao: "Atingir Nível 2" },
    { id: "nivel_5", nome: "Sábio", emoji: "🧠", descricao: "Atingir Nível 5" },
    { id: "dez_tarefas", nome: "Produtivo", emoji: "💪", descricao: "Completar 10 tarefas" }
];

// ========== GAME MODE - MATÉRIAS 6º ANO ==========
let materiaGameSelecionada = null;
let faseAtualGame = 0;
let perguntaAtualGame = 0;
let pontosGameAtuais = 0;
let respostasUsuarioGame = {}; // Armazena {materia_fase: [respostas]}
let questoesErradasGame = []; // Rastreia questões erradas nesta tentativa
let fasesConcluidas = {}; // Rastreia quais fases foram completadas
let modoRevisao = false; // Se fase foi completada, entra em modo revisão
let emRevisaoPosTermino = false; // Se está em revisão após terminar a fase
let perguntaRevisaoAtual = 0; // Índice da pergunta atual na revisão

let serieGameSelecionada = null;

const materiasDo6Ano = {
    "Português": {
        emoji: "📖",
        cor: "#667eea",
        fases: [
            {
                numero: 1,
                nome: "Fase 1: Acentuação",
                perguntas: [
                    {
                        pergunta: "Qual palavra está acentuada corretamente?",
                        opcoes: ["Bólsa", "Palácio", "Médico", "Ônibus"],
                        resposta: 2
                    },
                    {
                        pergunta: "Complete: 'A ___ do Brasil é Brasília'",
                        opcoes: ["Capital", "Capitál", "Capitàl", "Capitâl"],
                        resposta: 0
                    },
                    {
                        pergunta: "Qual é um ditongo?",
                        opcoes: ["ao", "ção", "ssão", "ia"],
                        resposta: 0
                    },
                    {
                        pergunta: "Qual palavra é um hiato?",
                        opcoes: ["Maé", "Caos", "Coração", "Parede"],
                        resposta: 1
                    },
                    {
                        pergunta: "Identifique a sílaba tônica em 'Extraordinário'",
                        opcoes: ["Ex", "Or", "Di", "Ná"],
                        resposta: 3
                    }
                ]
            }
        ]
    },
    "Matemática": {
        emoji: "🔢",
        cor: "#764ba2",
        fases: [
            {
                numero: 1,
                nome: "Fase 1: Operações Básicas",
                perguntas: [
                    {
                        pergunta: "Quanto é 25 + 37?",
                        opcoes: ["52", "62", "72", "82"],
                        resposta: 1
                    },
                    {
                        pergunta: "Qual é o resultado de 15 × 4?",
                        opcoes: ["50", "55", "60", "65"],
                        resposta: 2
                    },
                    {
                        pergunta: "120 ÷ 6 = ?",
                        opcoes: ["15", "20", "25", "30"],
                        resposta: 1
                    },
                    {
                        pergunta: "Qual número é divisível por 3 e 5?",
                        opcoes: ["20", "25", "30", "35"],
                        resposta: 2
                    },
                    {
                        pergunta: "Se tenho 100 reais e gasto 35, quanto sobra?",
                        opcoes: ["55", "60", "65", "70"],
                        resposta: 2
                    }
                ]
            }
        ]
    },
    "Ciências": {
        emoji: "🔬",
        cor: "#4caf50",
        fases: [
            {
                numero: 1,
                nome: "Fase 1: Corpo Humano",
                perguntas: [
                    {
                        pergunta: "Qual é a maior célula do corpo humano?",
                        opcoes: ["Neurônio", "Hemácia", "Óvulo", "Espermatozoide"],
                        resposta: 2
                    },
                    {
                        pergunta: "Quantos ossos tem um adulto?",
                        opcoes: ["186", "206", "226", "246"],
                        resposta: 1
                    },
                    {
                        pergunta: "Qual órgão bombeia o sangue?",
                        opcoes: ["Pulmão", "Coração", "Fígado", "Cérebro"],
                        resposta: 1
                    },
                    {
                        pergunta: "Qual vitamina é produzida pela pele com luz solar?",
                        opcoes: ["Vitamina A", "Vitamina B", "Vitamina C", "Vitamina D"],
                        resposta: 3
                    },
                    {
                        pergunta: "Qual sistema controla os movimentos do corpo?",
                        opcoes: ["Digestivo", "Nervoso", "Circulatório", "Respiratório"],
                        resposta: 1
                    }
                ]
            }
        ]
    },
    "Geografia": {
        emoji: "🌍",
        cor: "#ff9800",
        fases: [
            {
                numero: 1,
                nome: "Fase 1: Geografia do Brasil",
                perguntas: [
                    {
                        pergunta: "Qual é a capital do Brasil?",
                        opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
                        resposta: 2
                    },
                    {
                        pergunta: "Qual é o maior estado do Brasil em área?",
                        opcoes: ["São Paulo", "Mato Grosso", "Amazonas", "Bahia"],
                        resposta: 2
                    },
                    {
                        pergunta: "Qual rio é o mais comprido do Brasil?",
                        opcoes: ["Rio São Francisco", "Rio Amazonas", "Rio Paraná", "Rio Tocantins"],
                        resposta: 1
                    },
                    {
                        pergunta: "Qual bioma cobre a maior parte da região Norte?",
                        opcoes: ["Cerrado", "Caatinga", "Pantanal", "Floresta Amazônica"],
                        resposta: 3
                    },
                    {
                        pergunta: "Quantos estados tem a região Nordeste?",
                        opcoes: ["8", "9", "10", "11"],
                        resposta: 1
                    }
                ]
            }
        ]
    },
    "História": {
        emoji: "📚",
        cor: "#f44336",
        fases: [
            {
                numero: 1,
                nome: "Fase 1: História do Brasil",
                perguntas: [
                    {
                        pergunta: "Em que ano o Brasil foi descoberto?",
                        opcoes: ["1492", "1500", "1530", "1550"],
                        resposta: 1
                    },
                    {
                        pergunta: "Quem foi o primeiro presidente da República?",
                        opcoes: ["Getúlio Vargas", "Tiradentes", "Manuel Deodoro da Fonseca", "Juscelino Kubitschek"],
                        resposta: 2
                    },
                    {
                        pergunta: "Em que século a escravidão foi abolida no Brasil?",
                        opcoes: ["Século XVI", "Século XVII", "Século XVIII", "Século XIX"],
                        resposta: 3
                    },
                    {
                        pergunta: "Qual foi a capital do Brasil antes de Brasília?",
                        opcoes: ["Salvador", "Rio de Janeiro", "São Paulo", "Recife"],
                        resposta: 1
                    },
                    {
                        pergunta: "Em que ano o Brasil proclamou a Independência?",
                        opcoes: ["1800", "1820", "1822", "1850"],
                        resposta: 2
                    }
                ]
            }
        ]
    }
};

function criarFaseExtra(numero, nome, perguntas) {
    return {
        numero,
        nome: `Fase ${numero}: ${nome}`,
        perguntas: perguntas.map(([pergunta, opcoes, resposta]) => ({
            pergunta,
            opcoes,
            resposta
        }))
    };
}

const fasesExtrasGame = {
    "Português": [
        criarFaseExtra(2, "Classes de palavras", [
            ["Em 'A menina correu', qual é o verbo?", ["A", "menina", "correu", "A menina"], 2],
            ["Qual palavra é um substantivo?", ["bonito", "correr", "amizade", "rapidamente"], 2],
            ["Na frase 'O livro azul', qual palavra é um adjetivo?", ["O", "livro", "azul", "livro azul"], 2]
        ]),
        criarFaseExtra(3, "Pontuação", [
            ["Qual sinal usamos no fim de uma pergunta?", [".", "!", "?", ","], 2],
            ["Qual frase está pontuada corretamente?", ["Vamos comer crianças.", "Vamos comer, crianças.", "Vamos comer crianças!", "Vamos, comer crianças."], 1],
            ["Qual sinal indica uma pausa curta?", ["Ponto final", "Vírgula", "Interrogação", "Dois-pontos"], 1]
        ]),
        criarFaseExtra(4, "Interpretação", [
            ["Se Ana levou guarda-chuva, provavelmente estava...", ["nevando", "chovendo", "muito calor", "à noite"], 1],
            ["O contrário de 'antigo' é...", ["velho", "novo", "grande", "lento"], 1],
            ["Uma notícia serve principalmente para...", ["informar", "vender", "dar ordens", "fazer contas"], 0]
        ]),
        criarFaseExtra(5, "Sinônimos e antônimos", [
            ["Sinônimo de 'rápido':", ["veloz", "pesado", "quieto", "distante"], 0],
            ["Antônimo de 'cheio':", ["completo", "vazio", "lotado", "grande"], 1],
            ["Sinônimo de 'iniciar':", ["terminar", "parar", "começar", "esquecer"], 2]
        ]),
        criarFaseExtra(6, "Desafio das palavras", [
            ["Qual palavra está no diminutivo?", ["casa", "casarão", "casinha", "casal"], 2],
            ["Qual é o plural de 'pão'?", ["pães", "pãos", "pãeses", "pãezes"], 0],
            ["Qual palavra tem 3 sílabas?", ["flor", "janela", "sol", "mar"], 1]
        ])
    ],
    "Matemática": [
        criarFaseExtra(2, "Frações na prática", [
            ["Qual fração representa metade?", ["1/3", "1/2", "2/3", "3/4"], 1],
            ["Quanto é 1/4 de 20?", ["4", "5", "6", "10"], 1],
            ["Qual fração é maior?", ["1/5", "1/2", "1/10", "1/8"], 1]
        ]),
        criarFaseExtra(3, "Múltiplos e divisores", [
            ["Qual é múltiplo de 4?", ["10", "12", "14", "18"], 1],
            ["Qual é divisor de 24?", ["5", "7", "8", "10"], 2],
            ["O menor número primo é...", ["0", "1", "2", "3"], 2]
        ]),
        criarFaseExtra(4, "Medidas e tempo", [
            ["Quantos minutos há em 2 horas?", ["60", "90", "120", "180"], 2],
            ["1 metro equivale a...", ["10 cm", "50 cm", "100 cm", "1.000 cm"], 2],
            ["Qual unidade usamos para medir o peso de uma mochila?", ["litro", "quilograma", "metro", "grau"], 1]
        ]),
        criarFaseExtra(5, "Geometria", [
            ["Quantos lados tem um hexágono?", ["4", "5", "6", "8"], 2],
            ["Qual figura tem todos os lados iguais?", ["triângulo escaleno", "quadrado", "retângulo", "trapézio"], 1],
            ["Como chamamos uma figura redonda?", ["círculo", "cubo", "losango", "triângulo"], 0]
        ]),
        criarFaseExtra(6, "Desafio relâmpago", [
            ["Se 3 cadernos custam 15 reais, cada um custa...", ["3 reais", "4 reais", "5 reais", "6 reais"], 2],
            ["Qual é o dobro de 48?", ["86", "96", "98", "108"], 1],
            ["Complete: 7 x __ = 35", ["4", "5", "6", "7"], 1]
        ])
    ],
    "Ciências": [
        criarFaseExtra(2, "Animais e ambientes", [
            ["Qual animal é um mamífero?", ["galinha", "sapo", "golfinho", "tartaruga"], 2],
            ["Onde vivem os peixes?", ["no ar", "na água", "na areia", "nas árvores"], 1],
            ["As abelhas ajudam principalmente na...", ["polinização", "fotografia", "natação", "escavação"], 0]
        ]),
        criarFaseExtra(3, "Plantas", [
            ["Qual parte da planta absorve água do solo?", ["flor", "folha", "raiz", "fruto"], 2],
            ["As plantas produzem alimento usando luz por meio da...", ["respiração", "fotossíntese", "digestão", "evaporação"], 1],
            ["Qual gás as plantas liberam na fotossíntese?", ["oxigênio", "fumaça", "hélio", "nitrogênio"], 0]
        ]),
        criarFaseExtra(4, "Matéria e energia", [
            ["A água congelada é encontrada no estado...", ["líquido", "sólido", "gasoso", "plasmático"], 1],
            ["Qual fonte é uma energia renovável?", ["carvão", "petróleo", "vento", "gasolina"], 2],
            ["Quando a água ferve, ela vira...", ["gelo", "vapor", "terra", "sal"], 1]
        ]),
        criarFaseExtra(5, "Meio ambiente", [
            ["Qual atitude ajuda a reduzir o lixo?", ["reciclar", "jogar no rio", "desperdiçar", "queimar tudo"], 0],
            ["As árvores ajudam a melhorar o ar porque absorvem...", ["oxigênio", "gás carbônico", "água salgada", "areia"], 1],
            ["Economizar água é importante porque ela é um recurso...", ["infinito", "desnecessário", "limitado", "artificial"], 2]
        ]),
        criarFaseExtra(6, "Missão cientista", [
            ["Qual instrumento mede a temperatura?", ["régua", "termômetro", "bússola", "balança"], 1],
            ["A Lua é um...", ["planeta", "satélite natural", "cometa", "país"], 1],
            ["Qual sentido usamos para perceber sons?", ["visão", "olfato", "audição", "tato"], 2]
        ])
    ],
    "Geografia": [
        criarFaseExtra(2, "Relevo brasileiro", [
            ["Uma área alta e relativamente plana é um...", ["planalto", "oceano", "vale", "delta"], 0],
            ["Uma área mais baixa entre montanhas é um...", ["vulcão", "vale", "planeta", "litoral"], 1],
            ["O ponto mais alto de uma montanha é o...", ["sopé", "cume", "rio", "campo"], 1]
        ]),
        criarFaseExtra(3, "Clima", [
            ["O clima com muita chuva e calor é o...", ["equatorial", "polar", "desértico", "frio de montanha"], 0],
            ["Qual aparelho mede a quantidade de chuva?", ["pluviômetro", "termômetro", "relógio", "telescópio"], 0],
            ["O clima do sertão nordestino costuma ser...", ["muito seco", "polar", "nevado", "úmido o ano todo"], 0]
        ]),
        criarFaseExtra(4, "Mapas e orientação", [
            ["Qual ponto cardeal indica onde o Sol nasce?", ["Norte", "Sul", "Leste", "Oeste"], 2],
            ["O instrumento usado para encontrar direções é a...", ["bússola", "ampulheta", "régua", "lanterna"], 0],
            ["A legenda de um mapa explica seus...", ["símbolos", "rios de verdade", "habitantes", "climas futuros"], 0]
        ]),
        criarFaseExtra(5, "Brasil em regiões", [
            ["Em qual região fica o estado do Amazonas?", ["Sul", "Norte", "Sudeste", "Centro-Oeste"], 1],
            ["Qual região é conhecida pelas praias e pelo sertão?", ["Nordeste", "Sul", "Norte", "Sudeste"], 0],
            ["Brasília fica em qual região?", ["Centro-Oeste", "Norte", "Sul", "Nordeste"], 0]
        ]),
        criarFaseExtra(6, "Expedição pelo planeta", [
            ["Qual é o maior continente?", ["Europa", "Ásia", "África", "Oceania"], 1],
            ["O conjunto de água salgada que cobre grande parte da Terra é o...", ["oceano", "rio", "lago", "açude"], 0],
            ["Qual linha imaginária divide a Terra em Norte e Sul?", ["Greenwich", "Equador", "Trópico de Câncer", "Meridiano 180"], 1]
        ])
    ],
    "História": [
        criarFaseExtra(2, "Povos originários", [
            ["Antes da chegada dos portugueses, o Brasil era habitado por...", ["povos indígenas", "somente europeus", "romanos", "egípcios"], 0],
            ["Muitos povos indígenas vivem tradicionalmente em...", ["aldeias", "castelos", "arranha-céus", "fábricas"], 0],
            ["A cultura de um povo inclui seus costumes e...", ["tradições", "semáforos", "satélites", "placas"], 0]
        ]),
        criarFaseExtra(3, "Brasil Colônia", [
            ["A primeira capital do Brasil foi...", ["Salvador", "Brasília", "São Paulo", "Recife"], 0],
            ["O principal produto do início da colonização foi o...", ["pau-brasil", "café", "ouro", "algodão"], 0],
            ["As capitanias hereditárias eram grandes porções de...", ["terra", "mar", "ouro", "tempo"], 0]
        ]),
        criarFaseExtra(4, "Independência", [
            ["Quem proclamou a Independência do Brasil?", ["Dom Pedro I", "Tiradentes", "Getúlio Vargas", "Duque de Caxias"], 0],
            ["A Independência do Brasil aconteceu em...", ["1500", "1822", "1889", "1964"], 1],
            ["A frase 'Independência ou Morte!' está ligada ao...", ["grito do Ipiranga", "Descobrimento", "Tratado de Tordesilhas", "Plano Real"], 0]
        ]),
        criarFaseExtra(5, "República", [
            ["A República foi proclamada no Brasil em...", ["1822", "1888", "1889", "1930"], 2],
            ["Quem liderou a Proclamação da República?", ["Marechal Deodoro", "Dom Pedro II", "Machado de Assis", "Santos Dumont"], 0],
            ["A capital atual do Brasil é...", ["Salvador", "Rio de Janeiro", "Brasília", "Ouro Preto"], 2]
        ]),
        criarFaseExtra(6, "Linha do tempo", [
            ["O que vem primeiro em uma linha do tempo?", ["o passado", "o futuro", "o presente", "o amanhã"], 0],
            ["Museus ajudam a preservar...", ["a memória", "a chuva", "o trânsito", "as nuvens"], 0],
            ["Uma fonte histórica pode ser um documento ou...", ["objeto", "planeta", "clima", "alimento"], 0]
        ])
    ]
};

Object.keys(fasesExtrasGame).forEach(nomeMateria => {
    materiasDo6Ano[nomeMateria].fases.push(...fasesExtrasGame[nomeMateria]);
});

const modulosSeries = {
    "6º ano": {
        emoji: "📘",
        cor: "#4f46e5",
        materias: {
            "Português": {
                emoji: "📖",
                cor: "#6366f1",
                lições: [
                    { nome: "Lição 1: Leitura", perguntas: [
                        { pergunta: "Qual é a ideia principal de um texto?", opcoes: ["O tema central", "O nome do autor", "A capa do livro", "A data de hoje"], resposta: 0 },
                        { pergunta: "Qual frase está com pontuação correta?", opcoes: ["Vamos estudar, hoje!", "Vamos estudar hoje.", "Vamos estudar hoje!", "Vamos estudar hoy!"], resposta: 2 }
                    ] },
                    { nome: "Lição 2: Produção de texto", perguntas: [
                        { pergunta: "Uma notícia costuma informar sobre:", opcoes: ["Fatos", "Música", "Desenho", "Brinquedo"], resposta: 0 },
                        { pergunta: "O texto narrativo conta:", opcoes: ["Uma tabela", "Uma receita", "Uma história", "Uma embalagem"], resposta: 2 }
                    ] }
                ]
            },
            "Matemática": {
                emoji: "🔢",
                cor: "#8b5cf6",
                lições: [
                    { nome: "Lição 1: Operações", perguntas: [
                        { pergunta: "Quanto é 25 + 37?", opcoes: ["52", "62", "72", "82"], resposta: 1 },
                        { pergunta: "Qual é o resultado de 15 × 4?", opcoes: ["50", "55", "60", "65"], resposta: 2 }
                    ] },
                    { nome: "Lição 2: Frações", perguntas: [
                        { pergunta: "Qual é 1/2 de 40?", opcoes: ["10", "20", "30", "40"], resposta: 1 },
                        { pergunta: "Qual fração representa 50%?", opcoes: ["1/3", "1/2", "1/4", "2/3"], resposta: 1 }
                    ] }
                ]
            },
            "Ciências": {
                emoji: "🔬",
                cor: "#10b981",
                lições: [
                    { nome: "Lição 1: Corpo humano", perguntas: [
                        { pergunta: "Qual órgão bombeia o sangue?", opcoes: ["Pulmão", "Coração", "Fígado", "Cérebro"], resposta: 1 },
                        { pergunta: "Qual parte da planta faz fotossíntese?", opcoes: ["Folha", "Raiz", "Flor", "Fruto"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Meio ambiente", perguntas: [
                        { pergunta: "O que os pulmões fazem?", opcoes: ["Misturam sangue", "Absorvem alimento", "Trocam gases", "Produzem ossos"], resposta: 2 },
                        { pergunta: "O que são decompositores?", opcoes: ["Seres que decompõem matéria orgânica", "Seres que vivem no céu", "Seres que só andam", "Seres do mar"], resposta: 0 }
                    ] }
                ]
            },
            "Geografia": {
                emoji: "🌍",
                cor: "#f59e0b",
                lições: [
                    { nome: "Lição 1: Localização", perguntas: [
                        { pergunta: "Qual é a capital do Brasil?", opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], resposta: 2 },
                        { pergunta: "Qual instrumento indica direção?", opcoes: ["Tesoura", "Bússola", "Fita", "Papel"], resposta: 1 }
                    ] },
                    { nome: "Lição 2: Relevo e clima", perguntas: [
                        { pergunta: "O que é relevo?", opcoes: ["A cor da paisagem", "A forma da superfície terrestre", "O nome do lugar", "A média de pessoas"], resposta: 1 },
                        { pergunta: "Qual fator influencia o clima?", opcoes: ["Latitude", "Gosto", "Volume do livro", "Número de portas"], resposta: 0 }
                    ] }
                ]
            },
            "História": {
                emoji: "🏛️",
                cor: "#ef4444",
                lições: [
                    { nome: "Lição 1: Povos indígenas", perguntas: [
                        { pergunta: "Quem eram os povos indígenas?", opcoes: ["Habitantes originais do território", "Exploradores europeus", "Reis do século XIX", "Visitantes do espaço"], resposta: 0 },
                        { pergunta: "As aldeias são:", opcoes: ["Comunidades de moradia indígena", "Locais de indústria", "Fábricas de roupas", "Estradas de ferro"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Brasil colonial", perguntas: [
                        { pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Portugal", "França", "Inglaterra", "Espanha"], resposta: 0 },
                        { pergunta: "A independência do Brasil aconteceu em:", opcoes: ["1500", "1822", "1889", "1964"], resposta: 1 }
                    ] }
                ]
            }
        }
    },
    "7º ano": {
        emoji: "📗",
        cor: "#0ea5e9",
        materias: {
            "Português": {
                emoji: "📖",
                cor: "#3b82f6",
                lições: [
                    { nome: "Lição 1: Leitura", perguntas: [
                        { pergunta: "Qual é a ideia principal de um texto?", opcoes: ["O tema central", "O nome do autor", "A capa do livro", "A data de hoje"], resposta: 0 },
                        { pergunta: "Qual palavra é sinônimo de 'rápido'?", opcoes: ["Lento", "Veloz", "Alegre", "Fraco"], resposta: 1 }
                    ] },
                    { nome: "Lição 2: Gramática", perguntas: [
                        { pergunta: "Qual palavra é um verbo?", opcoes: ["Casa", "Correr", "Bonito", "Rápido"], resposta: 1 },
                        { pergunta: "Qual frase está com pontuação correta?", opcoes: ["Vamos estudar hoje!", "Vamos estudar, hoje!", "Vamos estudar hoy!", "Vamos estudar hoje"], resposta: 0 }
                    ] }
                ]
            },
            "Matemática": {
                emoji: "🔢",
                cor: "#8b5cf6",
                lições: [
                    { nome: "Lição 1: Frações", perguntas: [
                        { pergunta: "Qual é 1/2 de 40?", opcoes: ["10", "20", "30", "40"], resposta: 1 },
                        { pergunta: "25% de 80 é:", opcoes: ["10", "20", "25", "30"], resposta: 1 }
                    ] },
                    { nome: "Lição 2: Equações", perguntas: [
                        { pergunta: "Se x + 8 = 15, qual é x?", opcoes: ["5", "6", "7", "8"], resposta: 2 },
                        { pergunta: "Qual figura tem 3 lados?", opcoes: ["Quadrado", "Retângulo", "Triângulo", "Círculo"], resposta: 2 }
                    ] }
                ]
            },
            "Ciências": {
                emoji: "🔬",
                cor: "#10b981",
                lições: [
                    { nome: "Lição 1: Matéria", perguntas: [
                        { pergunta: "O que é matéria?", opcoes: ["Tudo que ocupa espaço", "Só água", "Só pedras", "Só ar"], resposta: 0 },
                        { pergunta: "Qual parte da planta faz fotossíntese?", opcoes: ["Folha", "Raiz", "Flor", "Fruto"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Digestão", perguntas: [
                        { pergunta: "Qual órgão quebra os alimentos?", opcoes: ["Estômago", "Coração", "Rim", "Cérebro"], resposta: 0 },
                        { pergunta: "O que a digestão faz?", opcoes: ["Transforma alimentos em energia", "Bombeia sangue", "Controla visão", "Filtra ar"], resposta: 0 }
                    ] }
                ]
            },
            "Geografia": {
                emoji: "🌍",
                cor: "#f59e0b",
                lições: [
                    { nome: "Lição 1: Mapas", perguntas: [
                        { pergunta: "Para localizar um lugar usamos:", opcoes: ["Mapa", "Caneta", "Pincel", "Martelo"], resposta: 0 },
                        { pergunta: "Qual instrumento indica direção?", opcoes: ["Bússola", "Tesoura", "Fita", "Papel"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Clima", perguntas: [
                        { pergunta: "O que é relevo?", opcoes: ["A cor da paisagem", "A forma da superfície terrestre", "O nome do lugar", "A média de pessoas"], resposta: 1 },
                        { pergunta: "Qual fator influencia o clima?", opcoes: ["Latitude", "Gosto", "Volume do livro", "Número de portas"], resposta: 0 }
                    ] }
                ]
            },
            "História": {
                emoji: "🏛️",
                cor: "#ef4444",
                lições: [
                    { nome: "Lição 1: Povos indígenas", perguntas: [
                        { pergunta: "Quem eram os povos indígenas?", opcoes: ["Habitantes originais do território", "Exploradores europeus", "Reis do século XIX", "Visitantes do espaço"], resposta: 0 },
                        { pergunta: "A diversidade cultural é:", opcoes: ["A variedade de costumes e tradições", "Uma única língua", "Um tipo de roupa", "Uma cidade"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Colonialismo", perguntas: [
                        { pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Portugal", "França", "Inglaterra", "Espanha"], resposta: 0 },
                        { pergunta: "A independência do Brasil aconteceu em:", opcoes: ["1500", "1822", "1889", "1964"], resposta: 1 }
                    ] }
                ]
            }
        }
    },
    "8º ano": {
        emoji: "📘",
        cor: "#2563eb",
        materias: {
            "Português": {
                emoji: "📖",
                cor: "#3b82f6",
                lições: [
                    { nome: "Lição 1: Argumentação", perguntas: [
                        { pergunta: "O que é uma tese?", opcoes: ["Ideia defendida em um texto", "Título do capítulo", "Nome do autor", "Tipo de letra"], resposta: 0 },
                        { pergunta: "Qual conectivo indica contraste?", opcoes: ["Mas", "Logo", "Portanto", "Porque"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Concordância", perguntas: [
                        { pergunta: "Em 'As crianças correram', o sujeito é:", opcoes: ["As crianças", "Correram", "As", "Crianças correram"], resposta: 0 },
                        { pergunta: "Qual frase está correta?", opcoes: ["Nós estudamos bastante.", "Nós estudam bastante.", "Eu gostam de ler.", "Ela vamos ao parque."], resposta: 0 }
                    ] }
                ]
            },
            "Matemática": {
                emoji: "🔢",
                cor: "#8b5cf6",
                lições: [
                    { nome: "Lição 1: Potenciação", perguntas: [
                        { pergunta: "2³ vale:", opcoes: ["6", "8", "10", "12"], resposta: 1 },
                        { pergunta: "√81 = ?", opcoes: ["7", "8", "9", "10"], resposta: 2 }
                    ] },
                    { nome: "Lição 2: Álgebra", perguntas: [
                        { pergunta: "Se x + 5 = 12, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 },
                        { pergunta: "Se 2x = 18, x vale:", opcoes: ["7", "8", "9", "10"], resposta: 2 }
                    ] }
                ]
            },
            "Ciências": {
                emoji: "🔬",
                cor: "#10b981",
                lições: [
                    { nome: "Lição 1: Ecologia", perguntas: [
                        { pergunta: "O que é ecologia?", opcoes: ["Estudo das relações entre seres vivos e ambiente", "Estudo de mapas", "Estudo de carros", "Estudo de música"], resposta: 0 },
                        { pergunta: "Quem é produtor em um ecossistema?", opcoes: ["Planta", "Leão", "Homem", "Peixe"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Sistema nervoso", perguntas: [
                        { pergunta: "Qual sistema controla os movimentos do corpo?", opcoes: ["Nervoso", "Digestivo", "Respiratório", "Cardiovascular"], resposta: 0 },
                        { pergunta: "O coração faz parte do sistema:", opcoes: ["Cardiovascular", "Digestivo", "Respiratório", "Nervoso"], resposta: 0 }
                    ] }
                ]
            },
            "Geografia": {
                emoji: "🌍",
                cor: "#f59e0b",
                lições: [
                    { nome: "Lição 1: Regionalização", perguntas: [
                        { pergunta: "Quantas regiões o Brasil tem?", opcoes: ["5", "3", "7", "9"], resposta: 0 },
                        { pergunta: "A região Sudeste é conhecida por:", opcoes: ["Industrialização e cidades grandes", "Desertos", "Neve constante", "Ilhas"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Economia", perguntas: [
                        { pergunta: "A população é:", opcoes: ["Conjunto de pessoas de um lugar", "Tipo de relevo", "Um rio", "Uma montanha"], resposta: 0 },
                        { pergunta: "Urbanização significa:", opcoes: ["Crescimento das cidades", "Construção de rios", "Mudança de clima", "Produção de alimentos"], resposta: 0 }
                    ] }
                ]
            },
            "História": {
                emoji: "🏛️",
                cor: "#ef4444",
                lições: [
                    { nome: "Lição 1: Império", perguntas: [
                        { pergunta: "Qual foi a principal atividade econômica do Brasil no século XIX?", opcoes: ["Café", "Petróleo", "Silício", "Mineração de ouro"], resposta: 0 },
                        { pergunta: "Quem liderou a independência do Brasil?", opcoes: ["Dom Pedro I", "Tiradentes", "Getúlio Vargas", "Napoleão"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: República", perguntas: [
                        { pergunta: "A República foi proclamada em:", opcoes: ["1889", "1822", "1900", "1750"], resposta: 0 },
                        { pergunta: "O que é cidadania?", opcoes: ["Direitos e deveres de uma pessoa em sociedade", "Uma ferramenta de metal", "Um tipo de planta", "Uma música"], resposta: 0 }
                    ] }
                ]
            }
        }
    },
    "9º ano": {
        emoji: "📕",
        cor: "#f59e0b",
        materias: {
            "Português": {
                emoji: "📖",
                cor: "#f97316",
                lições: [
                    { nome: "Lição 1: Leitura crítica", perguntas: [
                        { pergunta: "O que é inferência?", opcoes: ["Conclusão a partir do texto", "Nome do autor", "Cor da capa", "Lista de exercícios"], resposta: 0 },
                        { pergunta: "Qual trecho expressa opinião?", opcoes: ["A aula foi excelente!", "O professor entrou.", "A sala tem 20 cadeiras.", "A escola abre às 7h."], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Linguagem", perguntas: [
                        { pergunta: "Qual palavra é um adjetivo?", opcoes: ["Lindo", "Correr", "Mesa", "Livro"], resposta: 0 },
                        { pergunta: "Qual frase está com pontuação correta?", opcoes: ["Vamos estudar hoje!", "Vamos estudar hoy!", "Vamos estudar, hoje!", "Vamosestudar hoje"], resposta: 2 }
                    ] }
                ]
            },
            "Matemática": {
                emoji: "🔢",
                cor: "#8b5cf6",
                lições: [
                    { nome: "Lição 1: Álgebra", perguntas: [
                        { pergunta: "Se x + 5 = 12, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 },
                        { pergunta: "Se 3x = 21, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 }
                    ] },
                    { nome: "Lição 2: Geometria", perguntas: [
                        { pergunta: "Quantos lados tem um hexágono?", opcoes: ["5", "6", "7", "8"], resposta: 1 },
                        { pergunta: "Qual é a área de um retângulo 5 × 4?", opcoes: ["9", "18", "20", "25"], resposta: 2 }
                    ] }
                ]
            },
            "Ciências": {
                emoji: "🔬",
                cor: "#10b981",
                lições: [
                    { nome: "Lição 1: Corpo humano", perguntas: [
                        { pergunta: "Qual sistema transporta sangue pelo corpo?", opcoes: ["Cardiovascular", "Digestivo", "Respiratório", "Nervoso"], resposta: 0 },
                        { pergunta: "A função dos pulmões é:", opcoes: ["Produzir energia", "Trocar gases com o ambiente", "Quebrar alimentos", "Controlar o corpo"], resposta: 1 }
                    ] },
                    { nome: "Lição 2: Ecossistemas", perguntas: [
                        { pergunta: "O que é ecossistema?", opcoes: ["Comunidade de seres vivos e ambiente", "Uma planta isolada", "Uma estrada", "Uma cidade"], resposta: 0 },
                        { pergunta: "Quem é produtor em um ecossistema?", opcoes: ["Planta", "Leão", "Humano", "Pato"], resposta: 0 }
                    ] }
                ]
            },
            "Geografia": {
                emoji: "🌍",
                cor: "#f59e0b",
                lições: [
                    { nome: "Lição 1: Globalização", perguntas: [
                        { pergunta: "O que é globalização?", opcoes: ["Integração econômica e cultural entre países", "Uma cidade pequena", "Um rio seco", "Um animal selvagem"], resposta: 0 },
                        { pergunta: "A tecnologia ajuda na:", opcoes: ["Conexão entre lugares e pessoas", "Produção de neve", "Construção de montanhas", "Remoção do ar"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Meio ambiente", perguntas: [
                        { pergunta: "O que é sustentabilidade?", opcoes: ["Uma cidade grande", "Uso responsável dos recursos naturais", "Uma roupa especial", "Um tipo de planeta"], resposta: 1 },
                        { pergunta: "Qual ação ajuda a preservar o ambiente?", opcoes: ["Reciclar", "Lançar lixo no rio", "Queimar florestas", "Descarregar óleo no chão"], resposta: 0 }
                    ] }
                ]
            },
            "História": {
                emoji: "🏛️",
                cor: "#ef4444",
                lições: [
                    { nome: "Lição 1: Século XX", perguntas: [
                        { pergunta: "A Proclamação da República ocorreu em:", opcoes: ["1889", "1822", "1906", "1945"], resposta: 0 },
                        { pergunta: "Quem comandou o Estado Novo?", opcoes: ["Getúlio Vargas", "Dom Pedro I", "Deodoro da Fonseca", "Juscelino Kubitschek"], resposta: 0 }
                    ] },
                    { nome: "Lição 2: Sociedade contemporânea", perguntas: [
                        { pergunta: "O que é democracia?", opcoes: ["Sistema em que o povo participa das decisões", "Uma cidade com muitos prédios", "Uma montanha alta", "Um conjunto de livros"], resposta: 0 },
                        { pergunta: "Uma sociedade mais justa exige:", opcoes: ["Respeito aos direitos e deveres de todos", "O silêncio completo", "O fim do estudo", "Só regras econômicas"], resposta: 0 }
                    ] }
                ]
            }
        }
    }
};

(function ajustarRespostasGame() {
    let contador = 0;
    const padraoIndices = [0, 1, 2, 3];

    Object.values(modulosSeries).forEach(serie => {
        Object.values(serie.materias || {}).forEach(materia => {
            (materia.lições || []).forEach(licao => {
                (licao.perguntas || []).forEach(pergunta => {
                    if (!Array.isArray(pergunta.opcoes) || pergunta.opcoes.length !== 4) {
                        return;
                    }

                    const indiceCorreto = Number.isInteger(pergunta.resposta) ? pergunta.resposta : 0;
                    const respostaCorreta = pergunta.opcoes[indiceCorreto];
                    const demais = pergunta.opcoes.filter((_, indice) => indice !== indiceCorreto);
                    const indiceAlvo = padraoIndices[contador % padraoIndices.length];
                    contador += 1;

                    const opcoesReorganizadas = Array(4).fill("");
                    opcoesReorganizadas[indiceAlvo] = respostaCorreta;

                    let indiceDemais = 0;
                    for (let i = 0; i < opcoesReorganizadas.length; i++) {
                        if (i === indiceAlvo) continue;
                        opcoesReorganizadas[i] = demais[indiceDemais];
                        indiceDemais += 1;
                    }

                    pergunta.opcoes = opcoesReorganizadas;
                    pergunta.resposta = indiceAlvo;
                });
            });
        });
    });
})();

(function removerPerguntasRepetidas() {
    const contagem = new Map();

    Object.entries(modulosSeries).forEach(([serie, serieData]) => {
        Object.entries(serieData.materias || {}).forEach(([materia, materiaData]) => {
            (materiaData.lições || []).forEach(licao => {
                (licao.perguntas || []).forEach(pergunta => {
                    const chave = pergunta.pergunta.trim();
                    const ocorrencias = contagem.get(chave) || 0;
                    contagem.set(chave, ocorrencias + 1);

                    if (ocorrencias > 0) {
                        pergunta.pergunta = `${pergunta.pergunta} (${serie} · ${materia})`;
                    }
                });
            });
        });
    });
})();

function embaralharOpcoesGame(pergunta, identificador) {
    const opcoes = pergunta.opcoes.map((texto, indice) => ({
        texto,
        indice
    }));
    let semente = 0;

    for (const caractere of identificador) {
        semente = (semente * 31 + caractere.charCodeAt(0)) >>> 0;
    }

    for (let indice = opcoes.length - 1; indice > 0; indice--) {
        semente = (semente * 1664525 + 1013904223) >>> 0;
        const indiceTroca = semente % (indice + 1);
        [opcoes[indice], opcoes[indiceTroca]] = [opcoes[indiceTroca], opcoes[indice]];
    }

    return opcoes;
}

function carregarMateriasGame() {
    const container = document.getElementById("selecao-materias");
    container.innerHTML = "";

    Object.entries(modulosSeries).forEach(([serie, serieData]) => {
        const div = document.createElement("div");
        div.className = "materia-game-card";
        div.style.borderTopColor = serieData.cor;
        div.innerHTML = `
            <div class="materia-game-header" style="background: linear-gradient(135deg, ${serieData.cor}, rgba(255,255,255,0.18)); display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center;">
                <span class="materia-game-emoji">${serieData.emoji}</span>
                <span style="font-weight: 800; color: white; font-size: 1.1rem;">${serie}</span>
            </div>
            <div class="materia-game-content">
                <h3>${serie}</h3>
                <p class="materia-game-subtitulo">${Object.keys(serieData.materias).length} matérias • 5 lições em cada</p>
                <button class="btn-primary" onclick="abrirSerieGame('${serie}')">Ver matérias</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirSerieGame(serie) {
    const serieData = modulosSeries[serie];
    if (!serieData) return;

    const container = document.getElementById("selecao-materias");
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 12px;">
            <button class="btn-voltar" onclick="carregarMateriasGame()">← Voltar para séries</button>
        </div>
        <div class="materia-game-card" style="grid-column: 1 / -1; border-top-color: ${serieData.cor};">
            <div class="materia-game-header" style="background: linear-gradient(135deg, ${serieData.cor}, rgba(255,255,255,0.18)); display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center;">
                <span class="materia-game-emoji">${serieData.emoji}</span>
                <span style="font-weight: 800; color: white; font-size: 1.1rem;">${serie}</span>
            </div>
            <div class="materia-game-content">
                <h3>Matérias de ${serie}</h3>
                <p class="materia-game-subtitulo">Escolha uma matéria para estudar</p>
            </div>
        </div>
        ${Object.entries(serieData.materias).map(([materia, materiaData]) => `
            <div class="materia-game-card" style="border-top-color: ${materiaData.cor};">
                <div class="materia-game-header" style="background: linear-gradient(135deg, ${materiaData.cor}, rgba(255,255,255,0.18));">
                    <span class="materia-game-emoji">${materiaData.emoji}</span>
                </div>
                <div class="materia-game-content">
                    <h3>${materia}</h3>
                    <p class="materia-game-subtitulo">${materiaData.lições.length} lições</p>
                    <button class="btn-primary" onclick="abrirMateriaSerieGame('${serie}', '${materia}')">Ver lições</button>
                </div>
            </div>
        `).join("")}
    `;
}

function abrirMateriaSerieGame(serie, materia) {
    const serieData = modulosSeries[serie];
    const materiaData = serieData && serieData.materias[materia];
    if (!materiaData) return;

    const container = document.getElementById("selecao-materias");
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 12px;">
            <button class="btn-voltar" onclick="abrirSerieGame('${serie}')">← Voltar para matérias</button>
        </div>
        <div class="materia-game-card" style="grid-column: 1 / -1; border-top-color: ${materiaData.cor};">
            <div class="materia-game-header" style="background: linear-gradient(135deg, ${materiaData.cor}, rgba(255,255,255,0.18)); display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center;">
                <span class="materia-game-emoji">${materiaData.emoji}</span>
                <span style="font-weight: 800; color: white; font-size: 1.1rem;">${materia}</span>
            </div>
            <div class="materia-game-content">
                <h3>${materia}</h3>
                <p class="materia-game-subtitulo">${serie} • 5 lições</p>
            </div>
        </div>
        ${materiaData.lições.map((licao, idx) => `
            <button class="btn-fase" onclick="iniciarFaseGame('${serie}', '${materia}', ${idx})">
                ${licao.nome}
            </button>
        `).join("")}
    `;
}

function getFaseKey(serie, materia, indexFase) {
    return `${serie}::${materia}_${indexFase}`;
}

function faseFoiConcluida(serie, materia, indexFase) {
    const chaveFase = getFaseKey(serie, materia, indexFase);
    const respostas = respostasUsuarioGame[chaveFase];
    const materiaData = modulosSeries[serie]?.materias[materia];
    return fasesConcluidas[chaveFase] === true ||
        (materiaData &&
            Array.isArray(respostas) &&
            respostas.length === materiaData.lições[indexFase].perguntas.length &&
            respostas.every(resposta => resposta >= 0));
}

function iniciarFaseGame(serie, materia, indexFase) {
    const materiaData = modulosSeries[serie]?.materias[materia];
    if (!materiaData || !materiaData.lições[indexFase]) {
        alert("Essa lição ainda não está disponível.");
        return;
    }

    materiaGameSelecionada = materia;
    serieGameSelecionada = serie;
    faseAtualGame = indexFase;
    perguntaAtualGame = 0;
    questoesErradasGame = [];
    pontosGameAtuais = 0;
    emRevisaoPosTermino = false;
    perguntaRevisaoAtual = 0;
    ultimaFaseGame = { materia, fase: indexFase, serie };
    registrarDiaEstudo();
    salvarDadosUsuario();

    const chaveFase = getFaseKey(serie, materia, indexFase);
    const faseJaConcluida = faseFoiConcluida(serie, materia, indexFase);
    modoRevisao = faseJaConcluida;
    if (faseJaConcluida) {
        fasesConcluidas[chaveFase] = true;
    }
    if (!faseJaConcluida) {
        respostasUsuarioGame[chaveFase] = new Array(materiaData.lições[indexFase].perguntas.length).fill(-1);
    }

    document.getElementById("selecao-materias").parentElement.style.display = "none";
    document.getElementById("game-quiz-container").classList.remove("oculto");

    if (modoRevisao) {
        mostrarGamePerguntaRevisao();
    } else {
        mostrarGamePergunta();
    }
}

function mostrarGamePergunta() {
    const materiaData = modulosSeries[serieGameSelecionada]?.materias[materiaGameSelecionada];
    const licao = materiaData.lições[faseAtualGame];
    const pergunta = licao.perguntas[perguntaAtualGame];
    const container = document.getElementById("game-pergunta-display");
    const opcoesDiv = document.getElementById("game-opcoes-container");

    container.innerHTML = `
        <div class="game-pergunta-header">
            <span>${materiaData.emoji} ${materiaGameSelecionada}</span>
            <span class="progresso-game">${perguntaAtualGame + 1} de ${licao.perguntas.length}</span>
        </div>
        <p style="margin-bottom: 8px; color: #4f46e5; font-weight: 700;">${licao.nome}</p>
        <p class="pergunta-texto">${pergunta.pergunta}</p>
    `;

    opcoesDiv.innerHTML = "";
    document.getElementById("proxima-game").style.display = "none";
    document.getElementById("game-resultado").classList.add("oculto");

    const opcoesEmbaralhadas = embaralharOpcoesGame(
        pergunta,
        `${serieGameSelecionada}|${materiaGameSelecionada}|${faseAtualGame}|${perguntaAtualGame}`
    );

    opcoesEmbaralhadas.forEach(({ texto, indice }) => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn-game";
        btn.innerHTML = texto;
        btn.onclick = () => verificarGameResposta(indice, btn);
        opcoesDiv.appendChild(btn);
    });
}

function verificarGameResposta(indexEscolhido, botao) {
    const materiaData = modulosSeries[serieGameSelecionada]?.materias[materiaGameSelecionada];
    const licao = materiaData.lições[faseAtualGame];
    const pergunta = licao.perguntas[perguntaAtualGame];
    const opcoes = document.querySelectorAll(".opcao-btn-game");
    const chaveFase = getFaseKey(serieGameSelecionada, materiaGameSelecionada, faseAtualGame);

    opcoes.forEach(btn => btn.disabled = true);

    const resultado = document.getElementById("game-resultado");
    const btnProxima = document.getElementById("proxima-game");

    respostasUsuarioGame[chaveFase][perguntaAtualGame] = indexEscolhido;

    const elogios = ["Boa!", "Mandou bem!", "Isso aí!", "Acertou em cheio!", "Muito bem!"];
    const incentivo = ["Quase! A resposta certa está destacada.", "Não foi dessa vez, mas faz parte do treino.", "Boa tentativa! Olhe a resposta certa e siga em frente."];

    if (indexEscolhido === pergunta.resposta) {
        botao.classList.add("correto");
        resultado.innerHTML = `<div class="resultado-correto">✅ ${elogios[perguntaAtualGame % elogios.length]}</div>`;
    } else {
        botao.classList.add("errado");
        opcoes[pergunta.resposta].classList.add("correto");
        questoesErradasGame.push(perguntaAtualGame);
        resultado.innerHTML = `<div class="resultado-errado">❌ ${incentivo[perguntaAtualGame % incentivo.length]}</div>`;
    }

    resultado.classList.remove("oculto");
    btnProxima.style.display = "block";
    btnProxima.innerHTML = "";

    const btnProx = document.createElement("button");
    btnProx.className = "btn-primary";
    btnProx.innerText = perguntaAtualGame === licao.perguntas.length - 1 ? "📊 Resultado" : "Próxima Pergunta";
    btnProx.onclick = () => proximaGamePergunta();
    btnProxima.appendChild(btnProx);
}

function proximaGamePergunta() {
    const materiaData = modulosSeries[serieGameSelecionada]?.materias[materiaGameSelecionada];
    const licao = materiaData.lições[faseAtualGame];
    perguntaAtualGame++;

    if (perguntaAtualGame >= licao.perguntas.length) {
        finalizarFaseGame();
    } else {
        mostrarGamePergunta();
    }
}

function finalizarFaseGame() {
    const materiaData = modulosSeries[serieGameSelecionada]?.materias[materiaGameSelecionada];
    const licao = materiaData.lições[faseAtualGame];
    const chaveFase = getFaseKey(serieGameSelecionada, materiaGameSelecionada, faseAtualGame);

    if (emRevisaoPosTermino) {
        return;
    }

    const acertos = licao.perguntas.length - questoesErradasGame.length;
    pontosGameAtuais = acertos * 50 - questoesErradasGame.length * 50;

    const mensagemFinal = questoesErradasGame.length === 0
        ? `<p style="color: #4caf50; margin-bottom: 10px;">✅ Perfeito! Você dominou a lição!</p>`
        : `<p style="color: #f44336; margin-bottom: 10px;">❌ Você errou ${questoesErradasGame.length} questão(ões). Continue treinando.</p>`;

    document.getElementById("game-pergunta-display").innerHTML = `
        <div class="resultado-finalizacao">
            <h3>🎉 Lição concluída!</h3>
            <p>Curso: ${serieGameSelecionada}</p>
            <p>Matéria: ${materiaGameSelecionada}</p>
            <p>${licao.nome}</p>
            ${mensagemFinal}
            <p>Acertos: ${acertos}</p>
            <p>Erros: ${questoesErradasGame.length}</p>
            <p>Pontos por acertos: +${acertos * 50}</p>
            <p>Pontos por erros: -${questoesErradasGame.length * 50}</p>
            <p class="pontos-finais">Pontos Totais: ${pontosGameAtuais >= 0 ? '+' : ''}${pontosGameAtuais}</p>
        </div>
    `;

    document.getElementById("game-opcoes-container").style.display = "none";
    document.getElementById("game-resultado").classList.add("oculto");
    emRevisaoPosTermino = true;

    adicionarPontos(pontosGameAtuais);
    fasesConcluidas[chaveFase] = true;
    registrarFaseConcluidaNaMeta();
    if (questoesErradasGame.length === 0) {
        desbloquearBadge("primeiro_quiz");
    }

    salvarDadosUsuario();

    const btnProxima = document.getElementById("proxima-game");
    btnProxima.style.display = "block";
    btnProxima.innerHTML = "";

    const btnRevisao = document.createElement("button");
    btnRevisao.className = "btn-primary";
    btnRevisao.style.marginRight = "10px";
    btnRevisao.innerText = "📋 Ver Revisão";
    btnRevisao.onclick = () => iniciarRevisaoFase();
    btnProxima.appendChild(btnRevisao);

    const btnVoltar = document.createElement("button");
    btnVoltar.className = "btn-primary";
    btnVoltar.innerText = "🏠 Voltar ao Menu";
    btnVoltar.onclick = () => voltarAoMenu();
    btnProxima.appendChild(btnVoltar);
}

function iniciarRevisaoFase() {
    modoRevisao = true;
    emRevisaoPosTermino = true;
    perguntaRevisaoAtual = 0;
    mostrarGamePerguntaRevisao();
}

function mostrarGamePerguntaRevisao() {
    const materiaData = modulosSeries[serieGameSelecionada]?.materias[materiaGameSelecionada];
    const licao = materiaData.lições[faseAtualGame];
    const pergunta = licao.perguntas[perguntaRevisaoAtual];
    const chaveFase = getFaseKey(serieGameSelecionada, materiaGameSelecionada, faseAtualGame);
    const respostaUsuario = respostasUsuarioGame[chaveFase][perguntaRevisaoAtual];
    const respostaCorreta = pergunta.resposta;
    const acertou = respostaUsuario === respostaCorreta;

    const container = document.getElementById("game-pergunta-display");
    const opcoesDiv = document.getElementById("game-opcoes-container");

    container.innerHTML = `
        <div class="game-pergunta-header">
            <span>📋 REVISÃO</span>
            <span class="progresso-game">${perguntaRevisaoAtual + 1} de ${licao.perguntas.length}</span>
        </div>
        <p class="pergunta-texto">${pergunta.pergunta}</p>
        <p style="margin: 10px 0; padding: 10px; background: ${acertou ? '#e8f5e9' : '#ffebee'}; border-left: 4px solid ${acertou ? '#4caf50' : '#f44336'}; border-radius: 4px;">
            <strong>${acertou ? '✅ ACERTOU' : '❌ ERROU'}</strong>
        </p>
    `;

    opcoesDiv.innerHTML = "";
    document.getElementById("proxima-game").style.display = "none";
    document.getElementById("game-opcoes-container").style.display = "block";

    pergunta.opcoes.forEach((opcao, index) => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn-game";
        btn.innerHTML = opcao;
        btn.disabled = true;

        if (index === respostaUsuario) {
            if (acertou) {
                btn.classList.add("correto");
                btn.innerHTML += " ✅ (Sua resposta)";
            } else {
                btn.classList.add("errado");
                btn.innerHTML += " ❌ (Sua resposta)";
            }
        }

        if (index === respostaCorreta && !acertou) {
            btn.classList.add("correto");
            btn.innerHTML += " ✅ (Correta)";
        }

        opcoesDiv.appendChild(btn);
    });

    const btnProxima = document.getElementById("proxima-game");
    btnProxima.style.display = "block";
    btnProxima.innerHTML = "";

    if (perguntaRevisaoAtual > 0) {
        const btnAnterior = document.createElement("button");
        btnAnterior.className = "btn-primary";
        btnAnterior.innerText = "⬅️ Anterior";
        btnAnterior.onclick = () => {
            perguntaRevisaoAtual--;
            mostrarGamePerguntaRevisao();
        };
        btnProxima.appendChild(btnAnterior);
    }

    if (perguntaRevisaoAtual < licao.perguntas.length - 1) {
        const btnProx = document.createElement("button");
        btnProx.className = "btn-primary";
        btnProx.innerText = "Próxima ➡️";
        btnProx.onclick = () => {
            perguntaRevisaoAtual++;
            mostrarGamePerguntaRevisao();
        };
        btnProxima.appendChild(btnProx);
    } else {
        const btnVoltar = document.createElement("button");
        btnVoltar.className = "btn-primary";
        btnVoltar.innerText = "🏠 Voltar ao Menu";
        btnVoltar.onclick = () => voltarAoMenu();
        btnProxima.appendChild(btnVoltar);
    }

    emRevisaoPosTermino = true;
}

function voltarAoMenu() {
    emRevisaoPosTermino = false;
    perguntaRevisaoAtual = 0;
    modoRevisao = false;
    perguntaAtualGame = 0;
    questoesErradasGame = [];
    pontosGameAtuais = 0;
    materiaGameSelecionada = null;
    faseAtualGame = 0;
    serieGameSelecionada = null;

    document.getElementById("game-opcoes-container").innerHTML = "";
    document.getElementById("game-opcoes-container").style.display = "block";
    document.getElementById("game-pergunta-display").innerHTML = "";
    document.getElementById("game-resultado").classList.add("oculto");
    document.getElementById("game-resultado").innerHTML = "";
    document.getElementById("proxima-game").style.display = "none";
    document.getElementById("proxima-game").innerHTML = "";

    document.getElementById("selecao-materias").parentElement.style.display = "block";
    document.getElementById("game-quiz-container").classList.add("oculto");
    carregarMateriasGame();
}

function inicializarQuiz() {
    mostrarPergunta();
}

function mostrarPergunta() {
    if (usuarioAtual && quizDiarioJaConcluidoHoje()) {
        let container = document.getElementById("pergunta-display");
        let opcoesDiv = document.getElementById("opcoes-container");
        let botaoProxima = document.querySelector("#conteudo-quiz .btn-primary");

        if (botaoProxima) {
            botaoProxima.style.display = "none";
        }

        container.innerHTML = "<p class='pergunta-texto'>✅ Quiz diário concluído! Volte amanhã para novas perguntas.</p>";
        opcoesDiv.innerHTML = "";
        return;
    }

    let listaPerguntas = usuarioAtual ? (quizDiario && quizDiario.perguntas ? quizDiario.perguntas : perguntas) : perguntasBase;
    let pergunta = listaPerguntas[perguntaAtual];
    let container = document.getElementById("pergunta-display");
    let opcoesDiv = document.getElementById("opcoes-container");

    if (!pergunta) {
        container.innerHTML = "<p class='pergunta-texto'>🧠 Quiz concluído. Volte amanhã para uma nova rodada.</p>";
        opcoesDiv.innerHTML = "";
        return;
    }

    const materiaLabel = pergunta.materia ? `<small style="display:block; margin-bottom:10px; color:#667eea; font-weight:bold;">Matéria: ${pergunta.materia}</small>` : "";
    container.innerHTML = `<p class="pergunta-texto">${materiaLabel}${pergunta.pergunta}</p>`;
    opcoesDiv.innerHTML = "";
    
    pergunta.opcoes.forEach((opcao, index) => {
        let btn = document.createElement("button");
        btn.className = "opcao-btn";
        btn.innerHTML = opcao;
        btn.onclick = () => verificarResposta(index, btn);
        opcoesDiv.appendChild(btn);
    });
}

function verificarResposta(indexEscolhido, botao) {
    let listaPerguntas = usuarioAtual ? (quizDiario && quizDiario.perguntas ? quizDiario.perguntas : perguntas) : perguntasBase;
    let pergunta = listaPerguntas[perguntaAtual];
    let opcoes = document.querySelectorAll(".opcao-btn");
    
    opcoes.forEach(btn => btn.disabled = true);
    
    if (indexEscolhido === pergunta.resposta) {
        botao.classList.add("correto");
        adicionarPontos(25);
        desbloquearBadge("primeiro_quiz");
        mostrarEfeito("✅ +25 Pontos!");
    } else {
        botao.classList.add("errado");
        opcoes[pergunta.resposta].classList.add("correto");
        mostrarEfeito("❌ Resposta incorreta");
    }
}

function finalizarQuizDiario() {
    registrarDiaEstudo();
    if (usuarioAtual) {
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
        let dados = usuarios[usuarioAtual];
        if (dados && dados.quizDiario && dados.quizDiario.data === obterDataHoje()) {
            dados.quizDiario = { ...dados.quizDiario, concluido: true };
            usuarios[usuarioAtual] = dados;
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            quizDiario = dados.quizDiario;
        }
    }

    let botaoProxima = document.querySelector("#conteudo-quiz .btn-primary");
    if (botaoProxima) {
        botaoProxima.style.display = "none";
    }

    document.getElementById("pergunta-display").innerHTML = "<p class='pergunta-texto'>✅ Quiz diário concluído! Volte amanhã para novas perguntas.</p>";
    document.getElementById("opcoes-container").innerHTML = "";
    mostrarEfeito("🎉 Quiz diário concluído!");
}

function proximaPergunta() {
    let listaPerguntas = usuarioAtual ? (quizDiario && quizDiario.perguntas ? quizDiario.perguntas : perguntas) : perguntasBase;

    if (usuarioAtual && quizDiario && quizDiario.data === obterDataHoje() && quizDiario.concluido) {
        mostrarPergunta();
        return;
    }

    if (perguntaAtual >= listaPerguntas.length - 1) {
        finalizarQuizDiario();
        return;
    }

    perguntaAtual = perguntaAtual + 1;
    mostrarPergunta();
    salvarDadosUsuario();
}

function adicionar() {
    let texto = document.getElementById("tarefa").value;
    
    if (texto.trim() === "") {
        alert("Digite uma tarefa!");
        return;
    }

    let lista = document.getElementById("lista");
    let item = document.createElement("li");
    item.className = "item-tarefa";
    let id = Date.now();
    item.id = "tarefa-" + id;
    item.innerHTML = escaparHTML(texto) + " <button onclick='concluir(" + id + ")' class='btn-concluir'>✔</button>";

    lista.appendChild(item);
    document.getElementById("tarefa").value = "";
    
    // Salvar tarefa
    tarefas.push({ id: id, texto: texto });
    salvarDadosUsuario();
}

function concluir(id) {
    let elemento = document.getElementById("tarefa-" + id);
    if (!elemento) {
        return;
    }

    elemento.remove();
    let tarefasCompletas = parseInt(localStorage.getItem("tarefas_completas_" + usuarioAtual) || "0", 10);
    localStorage.setItem("tarefas_completas_" + usuarioAtual, String(tarefasCompletas + 1));
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const chaveSemana = formatarDataLocal(inicioSemana);
    const registroSemana = JSON.parse(localStorage.getItem("tarefas_semana_" + usuarioAtual) || "{}");
    localStorage.setItem("tarefas_semana_" + usuarioAtual, JSON.stringify({
        inicio: chaveSemana,
        total: registroSemana.inicio === chaveSemana ? Number(registroSemana.total || 0) + 1 : 1
    }));
    registrarDiaEstudo();
    adicionarPontos(10);
    mostrarEfeito("🎉 Tarefa Concluída! +10 Pontos");
    desbloquearBadge("dez_tarefas");
    
    // Remover tarefa salva
    tarefas = tarefas.filter(t => t.id !== id);
    salvarDadosUsuario();
}

function carregarTarefas() {
    let lista = document.getElementById("lista");
    lista.innerHTML = "";
    
    tarefas.forEach(tarefa => {
        let item = document.createElement("li");
        item.className = "item-tarefa";
        item.id = "tarefa-" + tarefa.id;
        item.innerHTML = escaparHTML(tarefa.texto) + " <button onclick='concluir(" + tarefa.id + ")' class='btn-concluir'>✔</button>";
        lista.appendChild(item);
    });
}

function adicionarPontos(qtd) {
    pontos += qtd;
    
    // Garantir que pontos não fiquem negativos
    if (pontos < 0) {
        pontos = 0;
    }
    
    document.getElementById("pontos").innerText = pontos;
    
    // Verificar se subiu de nível
    while (pontos >= pontosProxNivel) {
        subirNivel();
    }
    
    atualizarBarraProgresso();
    verificarBadges();
    salvarDadosUsuario();
}

function subirNivel() {
    nivel++;
    pontosProxNivel = nivel * 100;
    document.getElementById("nivel").innerText = nivel;
    document.getElementById("proxNivel").innerText = pontosProxNivel;
    mostrarEfeito("🚀 SUBIU DE NÍVEL! Nível " + nivel, true);
    desbloquearBadge("nivel_" + nivel);
}

function atualizarBarraProgresso() {
    const barra = document.getElementById("progress-bar");
    if (!barra) {
        return;
    }
    let pontosNivel = pontos % (nivel * 100);
    let progresso = (pontosNivel / (nivel * 100)) * 100;
    barra.style.width = progresso + "%";
}

function desbloquearBadge(idBadge) {
    if (!badges.includes(idBadge)) {
        badges.push(idBadge);
        atualizarBadges();
    }
}

function verificarBadges() {
    // Verificar badge de 50 pontos
    if (pontos >= 50) desbloquearBadge("cinco_pontos");
    
    // Verificar badge de tarefas completas
    let tarefasCompletas = localStorage.getItem("tarefas_completas_" + usuarioAtual) || 0;
    if (parseInt(tarefasCompletas) >= 10) desbloquearBadge("dez_tarefas");
}

function atualizarBadges() {
    let badgesDiv = document.getElementById("badges");
    if (!badgesDiv) {
        return;
    }
    badgesDiv.innerHTML = "";
    
    conquistas.forEach(conquista => {
        if (badges.includes(conquista.id)) {
            let badge = document.createElement("div");
            badge.className = "badge desbloqueado";
            badge.innerHTML = `<span>${conquista.emoji}</span><p>${conquista.nome}</p>`;
            badge.title = conquista.descricao;
            badgesDiv.appendChild(badge);
        } else {
            let badge = document.createElement("div");
            badge.className = "badge bloqueado";
            badge.innerHTML = `<span>🔒</span><p>${conquista.nome}</p>`;
            badge.title = conquista.descricao;
            badgesDiv.appendChild(badge);
        }
    });
}

function mostrarEfeito(mensagem, grande = false) {
    let efeito = document.createElement("div");
    efeito.className = grande ? "efeito-grande" : "efeito";
    efeito.innerHTML = mensagem;
    document.body.appendChild(efeito);
    
    setTimeout(() => {
        efeito.remove();
    }, 2000);
}

function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById("theme-toggle");
    
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        themeBtn.innerHTML = "🌙 Dark";
        localStorage.setItem("theme", "light");
    } else {
        body.classList.add("dark-mode");
        themeBtn.innerHTML = "☀️ Light";
        localStorage.setItem("theme", "dark");
    }
}

function loadTheme() {
    const theme = localStorage.getItem("theme");
    const themeBtn = document.getElementById("theme-toggle");
    
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeBtn) themeBtn.innerHTML = "☀️ Light";
    } else {
        if (themeBtn) themeBtn.innerHTML = "🌙 Dark";
    }
}

// ========== CUSTOMIZAÇÃO DE PERSONAGEM ==========





















// ========== INICIALIZAÇÃO ==========
window.addEventListener("load", () => {
    loadTheme();
    // Verificar se usuário já está logado
    let usuarioLogado = localStorage.getItem("usuarioAtual");
    
    if (usuarioLogado) {
        usuarioAtual = usuarioLogado;
        irParaApp();
    } else {
        // Mostrar tela de autenticação
        document.getElementById("tela-autenticacao").classList.add("tela-ativa");
        document.getElementById("tela-app").classList.add("tela-oculta");
    }
    
    // Garantir que o ranking seja mostrado por padrão
    document.getElementById("conteudo-ranking").classList.add("conteudo-ativo");
    document.getElementById("conteudo-ranking").classList.remove("conteudo-oculto");
    document.getElementById("conteudo-quiz").classList.add("conteudo-oculto");
    document.getElementById("conteudo-quiz").classList.remove("conteudo-ativo");
    document.getElementById("conteudo-game").classList.add("conteudo-oculto");
    document.getElementById("conteudo-game").classList.remove("conteudo-ativo");
    document.getElementById("conteudo-materias").classList.add("conteudo-oculto");
    document.getElementById("conteudo-materias").classList.remove("conteudo-ativo");
});
