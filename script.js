// ========== AUTENTICAÇÃO ==========
let usuarioAtual = null;
let tokenSessao = null;

function salvarUsuarioLocal(usuarios) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    sincronizarProgresso(usuarios[usuarioAtual]);
}

function sincronizarProgresso(dadosUsuario) {
    if (!usuarioAtual || !tokenSessao || !dadosUsuario) {
        return;
    }
    fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario: usuarioAtual,
            token: tokenSessao,
            progresso: dadosUsuario,
        }),
    }).catch(() => {
        // Falha de rede: os dados continuam salvos localmente e serão
        // reenviados na próxima chamada a salvarDadosUsuario().
    });
}

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

async function fazerCadastro() {
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

    try {
        const resposta = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, email, senha, avatar }),
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Não foi possível concluir o cadastro.");
            return;
        }

        alert("Cadastro realizado com sucesso! Faça login para continuar.");
        alternarFormulario();
    } catch (erro) {
        alert("Não foi possível conectar ao servidor. Tente novamente.");
    }
}

async function fazerLogin() {
    let usuario = document.getElementById("login-usuario").value;
    let senha = document.getElementById("login-senha").value;

    if (usuario === "" || senha === "") {
        alert("Preencha usuário e senha!");
        return;
    }

    try {
        const resposta = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha }),
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Não foi possível fazer login.");
            return;
        }

        // Login bem-sucedido: hidrata o cache local com os dados vindos do banco
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
        usuarios[dados.usuario] = {
            email: dados.email,
            avatar: dados.avatar,
            ...dados.progresso,
        };
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        usuarioAtual = dados.usuario;
        tokenSessao = dados.token;
        localStorage.setItem("usuarioAtual", dados.usuario);
        localStorage.setItem("tokenSessao", dados.token);
        irParaApp();
    } catch (erro) {
        alert("Não foi possível conectar ao servidor. Tente novamente.");
    }
}

function fazerLogout() {
    if (usuarioAtual && tokenSessao) {
        fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: usuarioAtual, token: tokenSessao }),
        }).catch(() => {});
    }
    usuarioAtual = null;
    tokenSessao = null;
    localStorage.removeItem("usuarioAtual");
    localStorage.removeItem("tokenSessao");
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
        tarefasCompletas = Number(dados.tarefasCompletas) > 0 ? Number(dados.tarefasCompletas) : 0;
        tarefasSemana = dados.tarefasSemana && typeof dados.tarefasSemana === "object"
            ? dados.tarefasSemana
            : { inicio: null, total: 0 };
        Object.keys(respostasUsuarioGame).forEach(chaveFase => {
            const respostas = respostasUsuarioGame[chaveFase];
            if (Array.isArray(respostas) && respostas.length > 0 && respostas.every(resposta => resposta >= 0)) {
                fasesConcluidas[chaveFase] = true;
            }
        });
        usuarios[usuarioAtual] = {
            ...dados,
            respostasUsuarioGame,
            fasesConcluidas
        };
        salvarUsuarioLocal(usuarios);
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
        tarefasCompletas: tarefasCompletas,
        tarefasSemana: tarefasSemana,
        avatar: dadosAtuais.avatar,
        quizDiario: quizDiario || dadosAtuais.quizDiario || null
    };
    salvarUsuarioLocal(usuarios);
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
let tarefasCompletas = 0;
let tarefasSemana = { inicio: null, total: 0 };

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
        salvarUsuarioLocal(usuarios);
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
                    { nome: "Lição 1: Leitura e interpretação", perguntas: [{ pergunta: "O que é a ideia principal de um texto?", opcoes: ["O tema central", "O título do livro", "A última frase", "O autor"], resposta: 0 }, { pergunta: "Qual palavra é sinônimo de 'rápido'?", opcoes: ["Lento", "Veloz", "Triste", "Grande"], resposta: 1 }, { pergunta: "Qual frase está com pontuação correta?", opcoes: ["Vamos estudar hoje!", "Vamos estudar, hoje!", "Vamos estudar hoje.", "Vamos estudar hoy!"], resposta: 2 }, { pergunta: "A expressão 'deu bobeira' significa:", opcoes: ["Cometeu um erro", "Elogiou alguém", "Foi ao mercado", "Dormiu cedo"], resposta: 0 }, { pergunta: "Em um texto narrativo, o que normalmente aparece?", opcoes: ["Uma receita", "Uma história com personagens", "Uma tabela", "Uma lista de compras"], resposta: 1 }] },
                    { nome: "Lição 2: Acentuação e sons", perguntas: [{ pergunta: "Qual palavra está corretamente acentuada?", opcoes: ["Bolsã", "Palácio", "Medicó", "Cafe"], resposta: 1 }, { pergunta: "Qual palavra tem hiato?", opcoes: ["Caos", "Pau", "Coração", "Açougue"], resposta: 0 }, { pergunta: "Em 'saúde', a sílaba tônica é:", opcoes: ["sa", "ú", "de", "sau"], resposta: 1 }, { pergunta: "Qual palavra contém ditongo?", opcoes: ["Mau", "Mãe", "Atum", "Foco"], resposta: 0 }, { pergunta: "Qual conjunto representa a sílaba tônica de 'caminhão'?", opcoes: ["ca", "mi", "nhão", "ção"], resposta: 2 }] },
                    { nome: "Lição 3: Pontuação e frases", perguntas: [{ pergunta: "Qual sinal termina uma pergunta?", opcoes: [".", "!", "?", ","], resposta: 2 }, { pergunta: "Qual frase está correta?", opcoes: ["Vamos comer crianças.", "Vamos comer, crianças.", "Vamos comer crianças!", "Vamos, comer crianças."], resposta: 1 }, { pergunta: "Qual sinal marca uma pausa breve?", opcoes: ["Ponto final", "Vírgula", "Interrogação", "Dois pontos"], resposta: 1 }, { pergunta: "Na frase 'Estudei muito, mas ainda fiquei com dúvida', a vírgula indica:", opcoes: ["Uma pausa", "Uma pergunta", "Uma exclamação", "Uma divisão"], resposta: 0 }, { pergunta: "Qual é o objetivo da pontuação?", opcoes: ["Deixar o texto sem sentido", "Organizar a leitura", "Trocar as palavras", "Aumentar o número de letras"], resposta: 1 }] },
                    { nome: "Lição 4: Sinônimos e antônimos", perguntas: [{ pergunta: "Sinônimo de 'rápido' é:", opcoes: ["Veloz", "Lento", "Triste", "Curto"], resposta: 0 }, { pergunta: "Antônimo de 'cheio' é:", opcoes: ["Grande", "Vazio", "Sujo", "Forte"], resposta: 1 }, { pergunta: "Qual palavra tem significado oposto a 'alto'?", opcoes: ["Baixo", "Rápido", "Largo", "Grosso"], resposta: 0 }, { pergunta: "Qual é o sinônimo de 'bonito'?", opcoes: ["Feio", "Lindo", "Velho", "Escuro"], resposta: 1 }, { pergunta: "Antônimo de 'começar' é:", opcoes: ["Iniciar", "Parar", "Correr", "Falar"], resposta: 1 }] },
                    { nome: "Lição 5: Gêneros e textos", perguntas: [{ pergunta: "Qual tipo de texto conta uma história?", opcoes: ["Narrativo", "Receita", "Lista", "Mapa"], resposta: 0 }, { pergunta: "Uma notícia tem como objetivo:", opcoes: ["Informar", "Inventar", "Brincar", "Pintar"], resposta: 0 }, { pergunta: "Textos em forma de instruções geralmente são:", opcoes: ["Títulos", "Receitas", "Poemas", "Crônicas"], resposta: 1 }, { pergunta: "Qual texto geralmente usa versos?", opcoes: ["Poema", "Texto científico", "Bula", "Lista"], resposta: 0 }, { pergunta: "Quem escreve uma história é:", opcoes: ["Leitor", "Autor", "Editor", "Professor"], resposta: 1 }] }
                ]
            },
            "Matemática": {
                emoji: "🔢",
                cor: "#8b5cf6",
                lições: [
                    { nome: "Lição 1: Operações básicas", perguntas: [{ pergunta: "Quanto é 25 + 37?", opcoes: ["52", "62", "72", "82"], resposta: 1 }, { pergunta: "Qual é o resultado de 15 × 4?", opcoes: ["50", "55", "60", "65"], resposta: 2 }, { pergunta: "120 ÷ 6 = ?", opcoes: ["15", "20", "25", "30"], resposta: 1 }, { pergunta: "Qual número é divisível por 3 e 5?", opcoes: ["20", "25", "30", "35"], resposta: 2 }, { pergunta: "Se tenho 100 reais e gasto 35, quanto sobra?", opcoes: ["55", "60", "65", "70"], resposta: 2 }] },
                    { nome: "Lição 2: Frações", perguntas: [{ pergunta: "Qual é 1/2 de 40?", opcoes: ["10", "20", "30", "40"], resposta: 1 }, { pergunta: "3/4 de 20 é:", opcoes: ["10", "12", "15", "18"], resposta: 2 }, { pergunta: "Qual fração representa 50%?", opcoes: ["1/2", "1/3", "1/4", "2/3"], resposta: 0 }, { pergunta: "Qual é maior: 1/3 ou 1/2?", opcoes: ["1/3", "1/2", "São iguais", "Não dá para saber"], resposta: 1 }, { pergunta: "Quanto é 2/5 de 10?", opcoes: ["2", "4", "5", "6"], resposta: 1 }] },
                    { nome: "Lição 3: Multiplicação e divisão", perguntas: [{ pergunta: "Qual é o dobro de 24?", opcoes: ["28", "38", "48", "52"], resposta: 2 }, { pergunta: "9 × 7 = ?", opcoes: ["54", "56", "63", "72"], resposta: 1 }, { pergunta: "40 ÷ 5 = ?", opcoes: ["5", "8", "10", "12"], resposta: 2 }, { pergunta: "Se 6 × 8 = 48, então 48 ÷ 6 = ?", opcoes: ["6", "7", "8", "9"], resposta: 2 }, { pergunta: "Qual número é primo?", opcoes: ["9", "11", "15", "21"], resposta: 1 }] },
                    { nome: "Lição 4: Medidas e dinheiro", perguntas: [{ pergunta: "Se uma barra mede 1 metro, quanto é 50 centímetros?", opcoes: ["0,5 m", "1,5 m", "5 m", "10 m"], resposta: 0 }, { pergunta: "R$ 20,00 + R$ 15,00 = ?", opcoes: ["R$ 25,00", "R$ 30,00", "R$ 35,00", "R$ 40,00"], resposta: 2 }, { pergunta: "Se um lanche custa R$ 12 e você paga com R$ 20, quanto recebe de troco?", opcoes: ["R$ 4", "R$ 6", "R$ 8", "R$ 10"], resposta: 1 }, { pergunta: "Qual valor é maior?", opcoes: ["R$ 14,00", "R$ 15,00", "R$ 12,00", "R$ 13,00"], resposta: 1 }, { pergunta: "1 kg equivale a:", opcoes: ["100 g", "500 g", "1000 g", "2000 g"], resposta: 2 }] },
                    { nome: "Lição 5: Raciocínio lógico", perguntas: [{ pergunta: "Qual número vem depois de 19?", opcoes: ["18", "20", "21", "22"], resposta: 1 }, { pergunta: "Qual é o próximo número da sequência: 2, 4, 6, 8, ___?", opcoes: ["9", "10", "11", "12"], resposta: 1 }, { pergunta: "Qual é o número ímpar?", opcoes: ["12", "18", "21", "24"], resposta: 2 }, { pergunta: "Se um aluno tem 5 livros e ganha 3, quantos terá?", opcoes: ["7", "8", "9", "10"], resposta: 1 }, { pergunta: "Qual número é múltiplo de 5?", opcoes: ["12", "14", "15", "17"], resposta: 2 }] }
                ]
            },
            "Ciências": {
                emoji: "🔬",
                cor: "#10b981",
                lições: [
                    { nome: "Lição 1: Corpo humano", perguntas: [{ pergunta: "Qual é a maior célula do corpo humano?", opcoes: ["Neurônio", "Hemácia", "Óvulo", "Espermatozoide"], resposta: 2 }, { pergunta: "Quantos ossos tem um adulto?", opcoes: ["186", "206", "226", "246"], resposta: 1 }, { pergunta: "Qual órgão bombeia o sangue?", opcoes: ["Pulmão", "Coração", "Fígado", "Cérebro"], resposta: 1 }, { pergunta: "Qual vitamina é produzida pela pele com luz solar?", opcoes: ["Vitamina A", "Vitamina B", "Vitamina C", "Vitamina D"], resposta: 3 }, { pergunta: "Qual sistema controla os movimentos do corpo?", opcoes: ["Digestivo", "Nervoso", "Circulatório", "Respiratório"], resposta: 1 }] },
                    { nome: "Lição 2: Vida e saúde", perguntas: [{ pergunta: "O que os pulmões fazem?", opcoes: ["Misturam sangue", "Absorvem alimento", "Trocam gases", "Produzem ossos"], resposta: 2 }, { pergunta: "Qual parte do corpo ajuda a pensar e lembrar?", opcoes: ["Cérebro", "Estômago", "Rim", "Pulmão"], resposta: 0 }, { pergunta: "Qual alimento ajuda a fortalecer os ossos?", opcoes: ["Leite", "Refrigerante", "Chocolate", "Pipoca"], resposta: 0 }, { pergunta: "Qual é o papel do coração?", opcoes: ["Bombear sangue", "Filtrar ar", "Processar comida", "Controlar a respiração"], resposta: 0 }, { pergunta: "Qual é um hábito saudável?", opcoes: ["Dormir pouco", "Beber água", "Fumar", "Pular refeições"], resposta: 1 }] },
                    { nome: "Lição 3: Solo e natureza", perguntas: [{ pergunta: "O que é solo?", opcoes: ["Camada superficial da Terra", "Uma rocha líquida", "Um planeta", "Uma montanha"], resposta: 0 }, { pergunta: "Qual é um ser vivo do solo?", opcoes: ["Bactéria", "Sol", "Ferro", "Pedra"], resposta: 0 }, { pergunta: "Qual parte da planta fixa o solo?", opcoes: ["Folha", "Raiz", "Flor", "Fruto"], resposta: 1 }, { pergunta: "Qual é o papel das plantas na natureza?", opcoes: ["Produzem alimento", "Fazem o vento", "Criam rochas", "Apagam a Terra"], resposta: 0 }, { pergunta: "O que promove a vida no solo?", opcoes: ["Matéria orgânica", "Lâmpada", "Metal", "Vidro"], resposta: 0 }] },
                    { nome: "Lição 4: Energia e movimento", perguntas: [{ pergunta: "A energia do Sol é chamada de:", opcoes: ["Solar", "Mecânica", "Química", "Nuclear"], resposta: 0 }, { pergunta: "Qual é um exemplo de energia elétrica?", opcoes: ["Luz da lanterna", "Pão", "Gelo", "Garrafa"], resposta: 0 }, { pergunta: "Como as plantas produzem alimento?", opcoes: ["Fotossíntese", "Respiração", "Digestão", "Fermentação"], resposta: 0 }, { pergunta: "Qual tipo de energia é usada para mover um carrinho?", opcoes: ["Térmica", "Mecânica", "Luminosa", "Sonora"], resposta: 1 }, { pergunta: "O que é energia?", opcoes: ["Qualquer força que realiza trabalho", "Só calor", "Só vento", "Só água"], resposta: 0 }] },
                    { nome: "Lição 5: Ecossistemas", perguntas: [{ pergunta: "O que é um ecossistema?", opcoes: ["Um conjunto de seres vivos e ambiente", "Um objeto feito de metal", "Uma estrela", "Um rio seco"], resposta: 0 }, { pergunta: "Qual é um fator abiótico?", opcoes: ["Água", "Coelho", "Pássaro", "Árvore"], resposta: 0 }, { pergunta: "Quem produz o alimento na cadeia alimentar?", opcoes: ["Produtores", "Consumidores", "Decompositores", "Sol"], resposta: 0 }, { pergunta: "Qual ambiente é úmido e com muita vegetação?", opcoes: ["Floresta", "Deserto", "Gelo", "Montanha"], resposta: 0 }, { pergunta: "O que os decompositores fazem?", opcoes: ["Decompõem matéria", "Produzem energia", "Respiram ar", "Fazem música"], resposta: 0 }] }
                ]
            },
            "Geografia": {
                emoji: "🌍",
                cor: "#f59e0b",
                lições: [
                    { nome: "Lição 1: Brasil e mapas", perguntas: [{ pergunta: "Qual é a capital do Brasil?", opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], resposta: 2 }, { pergunta: "Qual mapa representa países e fronteiras?", opcoes: ["Mapa político", "Mapa do corpo", "Mapa de receitas", "Mapa de música"], resposta: 0 }, { pergunta: "Qual é o maior estado do Brasil em área?", opcoes: ["São Paulo", "Mato Grosso", "Amazonas", "Bahia"], resposta: 1 }, { pergunta: "Qual rio é mais longo do Brasil?", opcoes: ["Amazonas", "São Francisco", "Paraná", "Tocantins"], resposta: 0 }, { pergunta: "Qual região do Brasil tem mais florestas?", opcoes: ["Norte", "Centro-Oeste", "Sudeste", "Sul"], resposta: 0 }] },
                    { nome: "Lição 2: Climas e biomas", perguntas: [{ pergunta: "Qual bioma é muito seco e quente?", opcoes: ["Caatinga", "Amazônia", "Pantanal", "Mata Atlântica"], resposta: 0 }, { pergunta: "Qual clima é mais quente e úmido?", opcoes: ["Tropical", "Polar", "Subtropical", "Frio"], resposta: 0 }, { pergunta: "Qual região brasileira é famosa pela floresta Amazônica?", opcoes: ["Norte", "Sudeste", "Sul", "Nordeste"], resposta: 0 }, { pergunta: "Qual bioma é encontrado em áreas alagadas?", opcoes: ["Pantanal", "Deserto", "Tundra", "Campos"], resposta: 0 }, { pergunta: "O que define o clima de um lugar?", opcoes: ["Temperatura e chuvas", "Número de pessoas", "Tipo de pedra", "Cor do céu"], resposta: 0 }] },
                    { nome: "Lição 3: Regiões do Brasil", perguntas: [{ pergunta: "Qual região tem a maior extensão territorial?", opcoes: ["Norte", "Nordeste", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "Qual região é conhecida pela produção de café?", opcoes: ["Sudeste", "Norte", "Sul", "Nordeste"], resposta: 0 }, { pergunta: "Qual região concentra o maior número de praias?", opcoes: ["Nordeste", "Centro-Oeste", "Norte", "Sul"], resposta: 0 }, { pergunta: "Qual região é conhecida por grandes planícies?", opcoes: ["Sul", "Norte", "Nordeste", "Sudeste"], resposta: 0 }, { pergunta: "Qual região brasileira tem o clima mais frio?", opcoes: ["Sul", "Norte", "Nordeste", "Centro-Oeste"], resposta: 0 }] },
                    { nome: "Lição 4: Universo e mapas", perguntas: [{ pergunta: "O que são coordenadas geográficas?", opcoes: ["Linhas imaginárias para localização", "Números de telefone", "Cores dos mapas", "Tipos de cidades"], resposta: 0 }, { pergunta: "Qual hemisfério está acima da Linha do Equador?", opcoes: ["Hemisfério Norte", "Hemisfério Sul", "Hemisfério Leste", "Hemisfério Oeste"], resposta: 0 }, { pergunta: "Qual é a latitude?", opcoes: ["Distância em relação ao Equador", "Distância ao mar", "Altura do morro", "Nome da rua"], resposta: 0 }, { pergunta: "O que indica a escala do mapa?", opcoes: ["Proporção entre o mapa e o real", "Nome da cidade", "Cor da papelada", "Número de pessoas"], resposta: 0 }, { pergunta: "O que é um continente?", opcoes: ["Grande extensão de terra", "Tipo de rio", "Bairro da cidade", "Uma montanha"], resposta: 0 }] },
                    { nome: "Lição 5: Relevo e paisagens", perguntas: [{ pergunta: "O que é relevo?", opcoes: ["A forma do terreno", "Uma árvore da floresta", "Um tipo de rio", "Uma cidade"], resposta: 0 }, { pergunta: "Qual é um tipo de relevo?", opcoes: ["Montanha", "Papel", "Carro", "Livro"], resposta: 0 }, { pergunta: "As planícies são:", opcoes: ["Terras baixas e planas", "Terras muito altas", "Rios secos", "Lagos artificiais"], resposta: 0 }, { pergunta: "O que é uma montanha?", opcoes: ["Elevação do terreno", "Tipo de planeta", "Ponto de ônibus", "Rua da cidade"], resposta: 0 }, { pergunta: "Qual paisagem é mais plana?", opcoes: ["Planície", "Montanha", "Vale", "Escarpa"], resposta: 0 }] }
                ]
            },
            "História": {
                emoji: "📚",
                cor: "#ef4444",
                lições: [
                    { nome: "Lição 1: Descobrimento e colonização", perguntas: [{ pergunta: "Em que ano o Brasil foi descoberto por Portugal?", opcoes: ["1492", "1500", "1530", "1550"], resposta: 1 }, { pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Pedro Álvares Cabral", "Cristóvão Colombo", "Dom João VI", "Tiradentes"], resposta: 0 }, { pergunta: "O que foi o período colonial?", opcoes: ["Tempo em que o Brasil foi colônia de Portugal", "Tempo da República", "Tempo da Idade Média", "Tempo da Guerra"], resposta: 0 }, { pergunta: "Qual produto foi muito importante na colônia?", opcoes: ["Café", "Pão", "Carro", "Televisão"], resposta: 0 }, { pergunta: "Qual foi a primeira capital do Brasil?", opcoes: ["Salvador", "Rio de Janeiro", "São Paulo", "Brasília"], resposta: 0 }] },
                    { nome: "Lição 2: Independência", perguntas: [{ pergunta: "Em que ano o Brasil proclamou a independência?", opcoes: ["1800", "1820", "1822", "1850"], resposta: 2 }, { pergunta: "Quem foi o primeiro imperador do Brasil?", opcoes: ["D. Pedro I", "D. Pedro II", "Tiradentes", "Deodoro"], resposta: 0 }, { pergunta: "Qual foi o nome do movimento que levou à independência?", opcoes: ["Proclamação da República", "Independência do Brasil", "Guerra dos Farrapos", "Revolução Industrial"], resposta: 1 }, { pergunta: "Qual foi o local da independência do Brasil?", opcoes: ["Rio de Janeiro", "Salvador", "Ipiranga", "São Paulo"], resposta: 2 }, { pergunta: "Por que a independência foi importante?", opcoes: ["Mudou o país para ser independente", "Criou os carros", "Aumentou as escolas", "Mudou o clima"], resposta: 0 }] },
                    { nome: "Lição 3: Império e política", perguntas: [{ pergunta: "Quem foi o segundo imperador do Brasil?", opcoes: ["D. Pedro I", "D. Pedro II", "Getúlio Vargas", "Deodoro"], resposta: 1 }, { pergunta: "Qual foi o nome do governo imperial?", opcoes: ["Império do Brasil", "Brasil Republicano", "Estado Novo", "Monarquia Europeia"], resposta: 0 }, { pergunta: "O que aconteceu com a escravidão no Brasil em 1888?", opcoes: ["Foi abolida", "Foi aumentada", "Foi criada", "Foi escondida"], resposta: 0 }, { pergunta: "Qual lei aboliu a escravidão?", opcoes: ["Lei Áurea", "Lei de Diretas Já", "Constituição", "Código de Ética"], resposta: 0 }, { pergunta: "Qual foi o papel de Tiradentes?", opcoes: ["Liderar a Inconfidência Mineira", "Descobrir o Brasil", "Escrever a Constituição", "Liderar a revolução"], resposta: 0 }] },
                    { nome: "Lição 4: República e cidadania", perguntas: [{ pergunta: "Qual evento marcou a Proclamação da República?", opcoes: ["Golpe de 1889", "Independência de 1822", "Descobrimento de 1500", "Guerra do Paraguai"], resposta: 0 }, { pergunta: "Quem foi o primeiro presidente da República?", opcoes: ["Deodoro da Fonseca", "D. Pedro I", "Getúlio Vargas", "Tiradentes"], resposta: 0 }, { pergunta: "O que é cidadania?", opcoes: ["Ter direitos e deveres no país", "Só estudar", "Só trabalhar", "Só votar"], resposta: 0 }, { pergunta: "Qual é um direito do cidadão?", opcoes: ["Educação", "Ter carro", "Não obedecer leis", "Comprar tudo"], resposta: 0 }, { pergunta: "Qual é um dever do cidadão?", opcoes: ["Respeitar as leis", "Ignorar a escola", "Falar alto", "Não pagar impostos"], resposta: 0 }] },
                    { nome: "Lição 5: Brasil moderno", perguntas: [{ pergunta: "O que é a Constituição?", opcoes: ["Lei máxima do país", "Livro de receitas", "Mapa do Brasil", "Lista de esportes"], resposta: 0 }, { pergunta: "Qual foi a década de grandes mudanças sociais e políticas no Brasil?", opcoes: ["1980", "1990", "2000", "1970"], resposta: 0 }, { pergunta: "Quem participa da vida política?", opcoes: ["Cidadãos e autoridades", "Somente crianças", "Somente animais", "Somente professores"], resposta: 0 }, { pergunta: "Qual é a importância da história para a sociedade?", opcoes: ["Ensina erros e conquistas", "Troca de língua", "Aumenta o calor", "Cria montanhas"], resposta: 0 }, { pergunta: "O que é democracia?", opcoes: ["Governar pelo povo", "Governar por um rei", "Governar sem eleições", "Governar por máquinas"], resposta: 0 }] }
                ]
            }
        }
    },
    "7º ano": {
        emoji: "📗",
        cor: "#0ea5e9",
        materias: {
            "Português": { emoji: "📖", cor: "#3b82f6", lições: [{ nome: "Lição 1: Leitura e revisão", perguntas: [{ pergunta: "O que é a ideia principal de um texto?", opcoes: ["O tema central", "O tipo de letra", "A página final", "O autor"], resposta: 0 }, { pergunta: "Qual termo substitui 'feliz'?", opcoes: ["Contente", "Triste", "Lento", "Frio"], resposta: 0 }, { pergunta: "Em uma notícia, o foco principal é:", opcoes: ["Informar", "Inventar", "Dormir", "Cantar"], resposta: 0 }, { pergunta: "A leitura crítica ajuda a:", opcoes: ["Entender melhor o texto", "Apagar palavras", "Mudando a página", "Escrever menos"], resposta: 0 }, { pergunta: "Qual palavra é sinônimo de 'rápido'?", opcoes: ["Veloz", "Lento", "Doce", "Frio"], resposta: 0 }] }, { nome: "Lição 2: Classe de palavras", perguntas: [{ pergunta: "Qual palavra é um verbo?", opcoes: ["Casa", "Correr", "Bonito", "Rápido"], resposta: 1 }, { pergunta: "Qual palavra é um substantivo?", opcoes: ["Sapato", "Correr", "Lindo", "Amarelo"], resposta: 0 }, { pergunta: "Qual palavra é um adjetivo?", opcoes: ["Caderno", "Bonito", "Andar", "Mãe"], resposta: 1 }, { pergunta: "Em 'A menina lê', quem é o sujeito?", opcoes: ["A menina", "Lê", "A", "Menina lê"], resposta: 0 }, { pergunta: "Qual palavra mostra ação?", opcoes: ["Correr", "Amarelo", "Casa", "Grande"], resposta: 0 }] }, { nome: "Lição 3: Ortografia", perguntas: [{ pergunta: "Qual palavra está escrita corretamente?", opcoes: ["Casa", "Caza", "Casaa", "Casá"], resposta: 0 }, { pergunta: "Qual é o plural de 'livro'?", opcoes: ["Livros", "Livroes", "Livrões", "Livrros"], resposta: 0 }, { pergunta: "Qual palavra está acentuada corretamente?", opcoes: ["Palacio", "Palácio", "Palacioa", "Palassio"], resposta: 1 }, { pergunta: "Qual palavra está sem erro?", opcoes: ["Médico", "Medico", "Médicoo", "Mediço"], resposta: 0 }, { pergunta: "Qual palavra é grafada corretamente?", opcoes: ["Exercício", "Exercisio", "Exercícioo", "Exerçício"], resposta: 0 }] }, { nome: "Lição 4: Interpretação", perguntas: [{ pergunta: "Uma inferência é:", opcoes: ["Uma conclusão a partir do texto", "Um título", "Uma frase isolada", "Uma lista"], resposta: 0 }, { pergunta: "Qual trecho expressa opinião?", opcoes: ["A aula começou às 7h.", "A aula foi excelente!", "O professor entrou.", "A sala tem 20 cadeiras."], resposta: 1 }, { pergunta: "Em um texto, o objetivo principal é:", opcoes: ["Comunicar uma ideia", "Pintar a página", "Esconder informação", "Sair do assunto"], resposta: 0 }, { pergunta: "O que uma conclusão faz?", opcoes: ["Fecha a ideia do texto", "Troca o nome do autor", "Apaga o começo", "Coloca apenas números"], resposta: 0 }, { pergunta: "Uma frase em contexto é melhor entendida quando:", opcoes: ["Lemos o texto inteiro", "Olhamos só o início", "Não lemos nada", "Pulamos as palavras"], resposta: 0 }] }, { nome: "Lição 5: Produção de texto", perguntas: [{ pergunta: "Qual é uma parte essencial de um texto?", opcoes: ["Introdução", "Sem título", "Só uma palavra", "Sem parágrafo"], resposta: 0 }, { pergunta: "O que é a conclusão?", opcoes: ["Última parte do texto", "Primeira frase", "Lista de nomes", "Desenho"], resposta: 0 }, { pergunta: "Um texto bem organizado deve ter:", opcoes: ["Clareza e sequência", "Só números", "Só gráficos", "Nenhuma ideia"], resposta: 0 }, { pergunta: "Qual palavra pode introduzir uma ideia de contraste?", opcoes: ["Mas", "E", "Logo", "Então"], resposta: 0 }, { pergunta: "O tema de um texto é:", opcoes: ["A ideia principal", "O número de páginas", "A cor da capa", "O nome do editor"], resposta: 0 }] }],
            },
            "Matemática": { emoji: "🔢", cor: "#8b5cf6", lições: [{ nome: "Lição 1: Frações e porcentagem", perguntas: [{ pergunta: "Qual é 1/2 de 40?", opcoes: ["10", "20", "30", "40"], resposta: 1 }, { pergunta: "25% de 80 é:", opcoes: ["10", "20", "25", "30"], resposta: 1 }, { pergunta: "Qual fração representa 50%?", opcoes: ["1/2", "1/3", "1/4", "2/3"], resposta: 0 }, { pergunta: "3/4 de 20 é:", opcoes: ["10", "12", "15", "18"], resposta: 2 }, { pergunta: "Qual número é equivalente a 75%?", opcoes: ["0,25", "0,5", "0,75", "1,5"], resposta: 2 }] }, { nome: "Lição 2: Equações simples", perguntas: [{ pergunta: "Se x + 8 = 15, qual o valor de x?", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Qual é a solução de 3x = 21?", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Se 2x - 4 = 10, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Qual valor satisfaz x/3 = 9?", opcoes: ["18", "21", "24", "27"], resposta: 3 }, { pergunta: "Qual é a raiz da equação x + 5 = 12?", opcoes: ["5", "6", "7", "8"], resposta: 2 }] }, { nome: "Lição 3: Geometria", perguntas: [{ pergunta: "Qual figura tem 3 lados?", opcoes: ["Triângulo", "Quadrado", "Círculo", "Retângulo"], resposta: 0 }, { pergunta: "Quantos lados tem um quadrado?", opcoes: ["3", "4", "5", "6"], resposta: 1 }, { pergunta: "Qual é a área de um retângulo 4 × 3?", opcoes: ["7", "10", "12", "16"], resposta: 2 }, { pergunta: "Qual figura tem todos os lados iguais?", opcoes: ["Círculo", "Quadrado", "Triângulo", "Pentágono"], resposta: 1 }, { pergunta: "Qual é o perímetro de um quadrado de lado 5?", opcoes: ["10", "15", "20", "25"], resposta: 2 }] }, { nome: "Lição 4: Estatística", perguntas: [{ pergunta: "Qual é a média de 6, 8 e 10?", opcoes: ["7", "8", "9", "10"], resposta: 1 }, { pergunta: "Em uma lista, a moda é:", opcoes: ["O valor mais frequente", "O maior valor", "O menor valor", "A soma"], resposta: 0 }, { pergunta: "Qual é a mediana de 2, 4, 6?", opcoes: ["2", "4", "6", "12"], resposta: 1 }, { pergunta: "Se a média de 2 e 8 é 5, isso significa:", opcoes: ["Respresenta o centro", "É o número maior", "É o menor", "É a soma"], resposta: 0 }, { pergunta: "Qual informação pode ser representada em gráfico?", opcoes: ["Dados estatísticos", "Só letras", "Só música", "Só cores"], resposta: 0 }] }, { nome: "Lição 5: Problemas reais", perguntas: [{ pergunta: "Uma camiseta custa R$ 80 e tem 10% de desconto. Quanto custa?", opcoes: ["R$ 70", "R$ 72", "R$ 75", "R$ 80"], resposta: 1 }, { pergunta: "Se um ônibus leva 40 minutos e sai às 7h15, chega às:", opcoes: ["7h45", "7h55", "8h00", "8h15"], resposta: 1 }, { pergunta: "Uma caixa com 15 maçãs perdeu 5. Quantas sobraram?", opcoes: ["5", "10", "15", "20"], resposta: 1 }, { pergunta: "Se um livro custa R$ 30 e você tem R$ 20, quanto falta?", opcoes: ["R$ 5", "R$ 10", "R$ 15", "R$ 20"], resposta: 2 }, { pergunta: "Se 4x = 32, x vale:", opcoes: ["6", "7", "8", "9"], resposta: 2 }] }],
            },
            "Ciências": { emoji: "🔬", cor: "#10b981", lições: [{ nome: "Lição 1: Matéria e energia", perguntas: [{ pergunta: "O que é matéria?", opcoes: ["Tudo que ocupa espaço", "Só água", "Só sol", "Só plástico"], resposta: 0 }, { pergunta: "Qual é uma forma de energia?", opcoes: ["Solar", "Salgado", "Denso", "Liso"], resposta: 0 }, { pergunta: "O que a fotossíntese faz?", opcoes: ["Produz alimento nas plantas", "Move carros", "Cria fogo", "Esfria o ar"], resposta: 0 }, { pergunta: "Qual substância é essencial à respiração?", opcoes: ["Oxigênio", "Álcool", "Sal", "Papel"], resposta: 0 }, { pergunta: "Qual parte da planta faz fotossíntese?", opcoes: ["Folha", "Raiz", "Flor", "Fruto"], resposta: 0 }] }, { nome: "Lição 2: Sistema digestório", perguntas: [{ pergunta: "Qual órgão quebra os alimentos?", opcoes: ["Estômago", "Coração", "Rim", "Cérebro"], resposta: 0 }, { pergunta: "Qual órgão absorve nutrientes?", opcoes: ["Intestino", "Pulmão", "Olho", "Pé"], resposta: 0 }, { pergunta: "O que o sistema digestório faz?", opcoes: ["Transforma alimentos em energia", "Bombeia sangue", "Controla movimentos", "Filtra ar"], resposta: 0 }, { pergunta: "Qual parte do corpo ajuda na mastigação?", opcoes: ["Dentes", "Cérebro", "Pulmão", "Pâncreas"], resposta: 0 }, { pergunta: "O que é mastigação?", opcoes: ["Quebrar o alimento", "Respirar", "Andar", "Pensar"], resposta: 0 }] }, { nome: "Lição 3: Sistema circulatório", perguntas: [{ pergunta: "Qual órgão bombeia o sangue?", opcoes: ["Coração", "Pulmão", "Fígado", "Estômago"], resposta: 0 }, { pergunta: "Qual é a função do sangue?", opcoes: ["Transportar nutrientes e oxigênio", "Produzir luz", "Guardar água", "Criar árvores"], resposta: 0 }, { pergunta: "Qual parte do sangue transporta oxigênio?", opcoes: ["Hemácias", "Plasma", "Plaquetas", "Óleo"], resposta: 0 }, { pergunta: "O que são veias?", opcoes: ["Vasos que levam o sangue ao coração", "Folhas das plantas", "Tipos de ossos", "Parte do cérebro"], resposta: 0 }, { pergunta: "Qual é a função das artérias?", opcoes: ["Levar sangue do coração para o corpo", "Respirar", "Pensar", "Caminhar"], resposta: 0 }] }, { nome: "Lição 4: Energia e movimento", perguntas: [{ pergunta: "Qual energia vem do Sol?", opcoes: ["Solar", "Química", "Sonora", "Térmica"], resposta: 0 }, { pergunta: "O que é um circuito elétrico?", opcoes: ["Percurso de energia", "Linha de texto", "Papel de desenho", "Barco"], resposta: 0 }, { pergunta: "Qual fenômeno é causado pelo vento?", opcoes: ["Movimento do ar", "Fusão do gelo", "Pressão do sangue", "Formação do solo"], resposta: 0 }, { pergunta: "O que é calor?", opcoes: ["Energia térmica", "Sombra", "Papel", "Ferro"], resposta: 0 }, { pergunta: "Qual é uma fonte de energia renovável?", opcoes: ["Solar", "Carvão", "Petróleo", "Gás natural"], resposta: 0 }] }, { nome: "Lição 5: Ecossistemas", perguntas: [{ pergunta: "O que é um ecossistema?", opcoes: ["Ambiente e seres vivos", "Só plantas", "Só animais", "Só rochas"], resposta: 0 }, { pergunta: "Qual é um fator abiótico?", opcoes: ["Água", "Coelho", "Pássaro", "Árvore"], resposta: 0 }, { pergunta: "Quem é produtor em uma cadeia alimentar?", opcoes: ["Planta", "Leão", "Cobra", "Humano"], resposta: 0 }, { pergunta: "O que os decompositores fazem?", opcoes: ["Decompõem matéria orgânica", "Fazem fotos", "Dão luz", "Roubam energia"], resposta: 0 }, { pergunta: "Qual ambiente é úmido e rico em biodiversidade?", opcoes: ["Floresta", "Deserto", "Pico de montanha", "Rua"], resposta: 0 }] }],
            },
            "Geografia": { emoji: "🌍", cor: "#f59e0b", lições: [{ nome: "Lição 1: Brasil e mapas", perguntas: [{ pergunta: "Qual é a capital do Brasil?", opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], resposta: 2 }, { pergunta: "Qual é o maior rio do Brasil?", opcoes: ["Amazonas", "São Francisco", "Paraná", "Tocantins"], resposta: 0 }, { pergunta: "O que um mapa mostra?", opcoes: ["Localizações e paisagens", "Só nomes", "Só números", "Só desenhos"], resposta: 0 }, { pergunta: "Qual região brasileira é mais conhecida pela floresta Amazônica?", opcoes: ["Norte", "Nordeste", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "Qual estado é mais populoso do Brasil?", opcoes: ["São Paulo", "Pará", "Bahia", "Minas Gerais"], resposta: 0 }] }, { nome: "Lição 2: Clima e vegetação", perguntas: [{ pergunta: "Qual clima é quente e úmido?", opcoes: ["Tropical", "Polar", "Subtropical", "Frio"], resposta: 0 }, { pergunta: "Qual bioma é seco e quente?", opcoes: ["Caatinga", "Amazônia", "Pantanal", "Mata Atlântica"], resposta: 0 }, { pergunta: "Qual clima é mais comum no Sul do Brasil?", opcoes: ["Subtropical", "Desértico", "Polar", "Equatorial"], resposta: 0 }, { pergunta: "O que é vegetação?", opcoes: ["Conjunto de plantas", "Conjunto de pessoas", "Conjunto de cidades", "Conjunto de carros"], resposta: 0 }, { pergunta: "A mata atlântica é uma:", opcoes: ["Floresta brasileira", "Cidade", "Rio", "Montanha"], resposta: 0 }] }, { nome: "Lição 3: Regiões e população", perguntas: [{ pergunta: "Qual região brasileira é mais industrializada?", opcoes: ["Sudeste", "Norte", "Nordeste", "Sul"], resposta: 0 }, { pergunta: "Qual região tem grandes áreas rurais?", opcoes: ["Centro-Oeste", "Sul", "Sudeste", "Norte"], resposta: 0 }, { pergunta: "Qual região enfrenta mais secas?", opcoes: ["Nordeste", "Norte", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "O que é população?", opcoes: ["Conjunto de pessoas de um lugar", "Tipo de árvore", "Nome do rio", "Cor do mapa"], resposta: 0 }, { pergunta: "Qual região é conhecida pela cultura do café?", opcoes: ["Sudeste", "Norte", "Nordeste", "Sul"], resposta: 0 }] }, { nome: "Lição 4: Relevo e mapas", perguntas: [{ pergunta: "O que é relevo?", opcoes: ["Forma da superfície do terreno", "Tipo de texto", "Nome da lua", "Cor do céu"], resposta: 0 }, { pergunta: "Qual é um tipo de relevo?", opcoes: ["Montanha", "Livro", "Mesa", "Lousa"], resposta: 0 }, { pergunta: "O que indica a escala de um mapa?", opcoes: ["A proporção entre o desenho e a realidade", "O nome da cidade", "A cor do papel", "A quantidade de pessoas"], resposta: 0 }, { pergunta: "A latitude mede:", opcoes: ["Distância em relação ao Equador", "Altura da montanha", "Largura da rua", "Número de habitantes"], resposta: 0 }, { pergunta: "O que é um continente?", opcoes: ["Grande extensão de terra", "Rio seco", "Cidade grande", "Montanha alta"], resposta: 0 }] }, { nome: "Lição 5: Paisagens e recursos", perguntas: [{ pergunta: "Qual paisagem tem montanhas e vales?", opcoes: ["Montanhosa", "Planície", "Urbana", "Fluvial"], resposta: 0 }, { pergunta: "O que são recursos naturais?", opcoes: ["Elementos da natureza úteis ao ser humano", "Objetos de metal", "Letras do alfabeto", "Cadeiras da escola"], resposta: 0 }, { pergunta: "Qual recurso natural é muito importante para a vida?", opcoes: ["Água", "Papel", "Borracha", "Lápis"], resposta: 0 }, { pergunta: "Qual ambiente é rico em biodiversidade?", opcoes: ["Floresta", "Deserto", "Ponto de ônibus", "Cidade"], resposta: 0 }, { pergunta: "O que faz a paisagem mudar?", opcoes: ["Clima, relevo e ação humana", "Somente a cor do céu", "Somente os carros", "Somente o vento"], resposta: 0 }] }],
            },
            "História": { emoji: "📚", cor: "#ef4444", lições: [{ nome: "Lição 1: Brasil colônia", perguntas: [{ pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Pedro Álvares Cabral", "Cristóvão Colombo", "D. João VI", "Tiradentes"], resposta: 0 }, { pergunta: "O que foi a colonização?", opcoes: ["Domínio do Brasil por Portugal", "Cruzeiro do Sul", "Invasão de outros países", "Abertura da escola"], resposta: 0 }, { pergunta: "Qual foi um produto muito importante para a colônia?", opcoes: ["Café", "Carro", "Geladeira", "Celular"], resposta: 0 }, { pergunta: "Qual foi o nome do período em que o Brasil foi colônia?", opcoes: ["Período colonial", "Período republicano", "Era industrial", "Era digital"], resposta: 0 }, { pergunta: "Qual cidade foi a primeira capital do Brasil?", opcoes: ["Salvador", "Rio de Janeiro", "São Paulo", "Brasília"], resposta: 0 }] }, { nome: "Lição 2: Independência", perguntas: [{ pergunta: "Em que ano o Brasil se tornou independente?", opcoes: ["1800", "1820", "1822", "1850"], resposta: 2 }, { pergunta: "Quem foi o primeiro imperador do Brasil?", opcoes: ["D. Pedro I", "D. Pedro II", "Getúlio Vargas", "Deodoro"], resposta: 0 }, { pergunta: "O que significou a independência?", opcoes: ["O Brasil deixou de ser colônia", "O Brasil ficou sem governo", "O Brasil acomodou o povo", "O Brasil perdeu a língua"], resposta: 0 }, { pergunta: "Onde ocorreu a declaração de independência?", opcoes: ["Ipiranga", "Praia de Copacabana", "Escola", "Morro do Castelo"], resposta: 0 }, { pergunta: "Por que a independência foi importante?", opcoes: ["Porque o Brasil ficou livre de Portugal", "Porque o Brasil virou um continente", "Porque o Brasil ficou sem território", "Porque o povo deixou de existir"], resposta: 0 }] }, { nome: "Lição 3: Império e escravidão", perguntas: [{ pergunta: "Qual lei aboliu a escravidão?", opcoes: ["Lei Áurea", "Lei das Escolas", "Constituição", "Lei de trânsito"], resposta: 0 }, { pergunta: "Quem foi o segundo imperador do Brasil?", opcoes: ["D. Pedro II", "D. Pedro I", "Pedro Álvares Cabral", "Tiradentes"], resposta: 0 }, { pergunta: "O que é escravidão?", opcoes: ["Sistema em que pessoas eram tratadas como propriedade", "Sistema de esportes", "Sistema de estudo", "Sistema de trabalho voluntário"], resposta: 0 }, { pergunta: "Qual evento marcou a luta pela liberdade dos escravizados?", opcoes: ["Lei Áurea", "Descobrimento", "Revolução Industrial", "Inconfidência Mineira"], resposta: 0 }, { pergunta: "Quem foi Tiradentes?", opcoes: ["Líder da Inconfidência Mineira", "Imperador do Brasil", "Descobridor do Brasil", "Escravo"], resposta: 0 }] }, { nome: "Lição 4: República", perguntas: [{ pergunta: "O que marcou a Proclamação da República?", opcoes: ["Fim do império", "Descobrimento do Brasil", "Criação da escola", "Mudança do clima"], resposta: 0 }, { pergunta: "Quem foi o primeiro presidente da República?", opcoes: ["Deodoro da Fonseca", "D. Pedro I", "Getúlio Vargas", "Tiradentes"], resposta: 0 }, { pergunta: "O que é cidadania?", opcoes: ["Direitos e deveres dos cidadãos", "Nome de um carro", "Uma cidade", "Uma lei de trânsito"], resposta: 0 }, { pergunta: "Qual direito é importante para a vida em sociedade?", opcoes: ["Educação", "Nunca trabalhar", "Não respeitar regras", "Não ter responsabilidades"], resposta: 0 }, { pergunta: "Qual é um dever do cidadão?", opcoes: ["Respeitar as leis", "Ignorar a escola", "Quebrar regras", "Ligar o rádio alto sem parar"], resposta: 0 }] }, { nome: "Lição 5: História e democracia", perguntas: [{ pergunta: "O que é democracia?", opcoes: ["Governar pelo povo", "Governar por um rei", "Governar sem eleitores", "Governar por máquinas"], resposta: 0 }, { pergunta: "Qual é o papel da Constituição?", opcoes: ["Garantir leis e direitos", "Inventar países", "Criar montanhas", "Aumentar o calor"], resposta: 0 }, { pergunta: "Qual documento organiza o Estado brasileiro?", opcoes: ["Constituição Federal", "Mapa do Brasil", "Livro de receitas", "Manual de esportes"], resposta: 0 }, { pergunta: "Por que aprender história é importante?", opcoes: ["Para entender o passado e evitar erros", "Para perder tempo", "Para esconder conhecimentos", "Para não ler mais"], resposta: 0 }, { pergunta: "Quem participa da política?", opcoes: ["Cidadãos e autoridades", "Apenas crianças", "Somente animais", "Somente máquinas"], resposta: 0 }] }],
            }
        }
    },
    "8º ano": {
        emoji: "📙",
        cor: "#22c55e",
        materias: {
            "Português": { emoji: "📖", cor: "#10b981", lições: [{ nome: "Lição 1: Leitura crítica", perguntas: [{ pergunta: "O que é inferência?", opcoes: ["Deduzir informações", "Copiar o texto", "Mudar de assunto", "Escrever sem sentido"], resposta: 0 }, { pergunta: "Qual trecho mostra opinião?", opcoes: ["A aula foi excelente!", "A aula começa às 8h.", "A escola fica na rua A.", "O aluno escreveu uma redação."], resposta: 0 }, { pergunta: "A ideia principal de um texto é:", opcoes: ["O assunto central", "A última frase", "A capa do livro", "O autor"], resposta: 0 }, { pergunta: "Qual palavra é antônimo de 'feliz'?", opcoes: ["Triste", "Contente", "Rápido", "Calmo"], resposta: 0 }, { pergunta: "O propósito de uma notícia é:", opcoes: ["Informar", "Inventar", "Dançar", "Dormir"], resposta: 0 }] }, { nome: "Lição 2: Classes de palavras", perguntas: [{ pergunta: "Qual palavra é verbo?", opcoes: ["Correr", "Mesa", "Bonito", "Casa"], resposta: 0 }, { pergunta: "Qual palavra é substantivo?", opcoes: ["Livro", "Cantar", "Rápido", "Alegre"], resposta: 0 }, { pergunta: "Qual palavra é advérbio?", opcoes: ["Rapidamente", "Casa", "Caderno", "Lindo"], resposta: 0 }, { pergunta: "Em 'O menino correu', o sujeito é:", opcoes: ["O menino", "Correu", "O", "Menino correu"], resposta: 0 }, { pergunta: "Qual palavra indica ação?", opcoes: ["Correr", "Grande", "Feio", "Livro"], resposta: 0 }] }, { nome: "Lição 3: Fonética e ortografia", perguntas: [{ pergunta: "Qual palavra está corretamente escrita?", opcoes: ["Exercício", "Exercisio", "Exercicios", "Execicio"], resposta: 0 }, { pergunta: "Qual palavra tem acento correto?", opcoes: ["Palácio", "Palacio", "Palassiou", "Palaciou"], resposta: 0 }, { pergunta: "Qual palavra está no plural?", opcoes: ["Livros", "Livro", "Livrro", "Livrros"], resposta: 0 }, { pergunta: "Qual palavra contém ditongo?", opcoes: ["Mãe", "Fogo", "Casa", "Leão"], resposta: 0 }, { pergunta: "Qual palavra tem hiato?", opcoes: ["Caos", "Pau", "Coração", "Açougue"], resposta: 0 }] }, { nome: "Lição 4: Produção de texto", perguntas: [{ pergunta: "Qual parte introduz o tema do texto?", opcoes: ["Introdução", "Conclusão", "Parágrafo final", "Número"], resposta: 0 }, { pergunta: "O que faz a conclusão?", opcoes: ["Fecha a ideia principal", "Troca as letras", "Esconde o texto", "Apaga o começo"], resposta: 0 }, { pergunta: "Um texto bem organizado precisa ter:", opcoes: ["Clareza e sequência", "Só desenhos", "Só números", "Sem começo"], resposta: 0 }, { pergunta: "Qual palavra pode ligar duas ideias?", opcoes: ["Mas", "Casa", "Caderno", "Lápis"], resposta: 0 }, { pergunta: "Tema de um texto é:", opcoes: ["A ideia principal", "A data do texto", "A capa", "O tamanho da fonte"], resposta: 0 }] }, { nome: "Lição 5: Revisão final", perguntas: [{ pergunta: "Qual termo é sinônimo de 'rápido'?", opcoes: ["Veloz", "Lento", "Caro", "Claro"], resposta: 0 }, { pergunta: "Qual é o objetivo da pontuação?", opcoes: ["Organizar a leitura", "Aumentar linhas", "Esconder ideias", "Mudar o tema"], resposta: 0 }, { pergunta: "Qual palavra é um verbo no passado?", opcoes: ["Correu", "Casa", "Bonito", "Livro"], resposta: 0 }, { pergunta: "Qual frase está correta?", opcoes: ["Vamos estudar hoje!", "Vamos estudar, hoje!", "Vamos estudar hoy!", "Vamosestudar hoje"], resposta: 0 }, { pergunta: "O que é um texto narrativo?", opcoes: ["Texto que conta uma história", "Lista de compras", "Receita", "Mapa"], resposta: 0 }] }],
            },
            "Matemática": { emoji: "🔢", cor: "#8b5cf6", lições: [{ nome: "Lição 1: Equações", perguntas: [{ pergunta: "Se x + 8 = 15, qual o valor de x?", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Qual é a solução de 3x = 21?", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Se 2x - 4 = 10, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Qual valor satisfaz x/3 = 9?", opcoes: ["18", "21", "24", "27"], resposta: 3 }, { pergunta: "Qual é a raiz da equação x + 5 = 12?", opcoes: ["5", "6", "7", "8"], resposta: 2 }] }, { nome: "Lição 2: Porcentagem", perguntas: [{ pergunta: "25% de 80 é:", opcoes: ["10", "20", "25", "30"], resposta: 1 }, { pergunta: "Qual fração representa 50%?", opcoes: ["1/2", "1/3", "1/4", "2/3"], resposta: 0 }, { pergunta: "3/4 de 20 é:", opcoes: ["10", "12", "15", "18"], resposta: 2 }, { pergunta: "Qual número equivale a 75%?", opcoes: ["0,25", "0,5", "0,75", "1,5"], resposta: 2 }, { pergunta: "Se um preço de R$ 100 recebe 10% de desconto, fica:", opcoes: ["R$ 90", "R$ 95", "R$ 85", "R$ 80"], resposta: 0 }] }, { nome: "Lição 3: Geometria", perguntas: [{ pergunta: "Qual figura tem 3 lados?", opcoes: ["Triângulo", "Quadrado", "Círculo", "Retângulo"], resposta: 0 }, { pergunta: "Quantos lados tem um quadrado?", opcoes: ["3", "4", "5", "6"], resposta: 1 }, { pergunta: "Qual é a área de um retângulo 4 × 3?", opcoes: ["7", "10", "12", "16"], resposta: 2 }, { pergunta: "Qual figura tem todos os lados iguais?", opcoes: ["Círculo", "Quadrado", "Triângulo", "Pentágono"], resposta: 1 }, { pergunta: "Qual é o perímetro de um quadrado de lado 5?", opcoes: ["10", "15", "20", "25"], resposta: 2 }] }, { nome: "Lição 4: Estatística", perguntas: [{ pergunta: "Qual é a média de 6, 8 e 10?", opcoes: ["7", "8", "9", "10"], resposta: 1 }, { pergunta: "Em uma lista, a moda é:", opcoes: ["O valor mais frequente", "O maior valor", "O menor valor", "A soma"], resposta: 0 }, { pergunta: "Qual é a mediana de 2, 4, 6?", opcoes: ["2", "4", "6", "12"], resposta: 1 }, { pergunta: "Se a média de 2 e 8 é 5, isso significa:", opcoes: ["Representa o centro", "É o número maior", "É o menor", "É a soma"], resposta: 0 }, { pergunta: "Qual informação pode ser representada em gráfico?", opcoes: ["Dados estatísticos", "Só letras", "Só música", "Só cores"], resposta: 0 }] }, { nome: "Lição 5: Problemas reais", perguntas: [{ pergunta: "Se uma camiseta custa R$ 80 e tem 10% de desconto, quanto custa?", opcoes: ["R$ 70", "R$ 72", "R$ 75", "R$ 80"], resposta: 1 }, { pergunta: "Se um ônibus leva 40 minutos e sai às 7h15, chega às:", opcoes: ["7h45", "7h55", "8h00", "8h15"], resposta: 1 }, { pergunta: "Uma caixa com 15 maçãs perdeu 5. Quantas sobraram?", opcoes: ["5", "10", "15", "20"], resposta: 1 }, { pergunta: "Se um livro custa R$ 30 e você tem R$ 20, quanto falta?", opcoes: ["R$ 5", "R$ 10", "R$ 15", "R$ 20"], resposta: 2 }, { pergunta: "Se 4x = 32, x vale:", opcoes: ["6", "7", "8", "9"], resposta: 2 }] }],
            },
            "Ciências": { emoji: "🔬", cor: "#10b981", lições: [{ nome: "Lição 1: Ecossistemas", perguntas: [{ pergunta: "O que é um ecossistema?", opcoes: ["Ambiente e seres vivos", "Só plantas", "Só animais", "Só rochas"], resposta: 0 }, { pergunta: "Qual é um fator abiótico?", opcoes: ["Água", "Coelho", "Pássaro", "Árvore"], resposta: 0 }, { pergunta: "Quem produz o alimento na cadeia alimentar?", opcoes: ["Produtores", "Consumidores", "Decompositores", "Sol"], resposta: 0 }, { pergunta: "O que os decompositores fazem?", opcoes: ["Decompõem matéria orgânica", "Fazem fotos", "Dão luz", "Roubam energia"], resposta: 0 }, { pergunta: "Qual ambiente é úmido e rico em biodiversidade?", opcoes: ["Floresta", "Deserto", "Ponto de ônibus", "Cidade"], resposta: 0 }] }, { nome: "Lição 2: Sistema digestório", perguntas: [{ pergunta: "Qual órgão quebra os alimentos?", opcoes: ["Estômago", "Coração", "Rim", "Cérebro"], resposta: 0 }, { pergunta: "Qual órgão absorve nutrientes?", opcoes: ["Intestino", "Pulmão", "Olho", "Pé"], resposta: 0 }, { pergunta: "O que o sistema digestório faz?", opcoes: ["Transforma alimentos em energia", "Bombeia sangue", "Controla movimentos", "Filtra ar"], resposta: 0 }, { pergunta: "Qual parte do corpo ajuda na mastigação?", opcoes: ["Dentes", "Cérebro", "Pulmão", "Pâncreas"], resposta: 0 }, { pergunta: "O que é mastigação?", opcoes: ["Quebrar o alimento", "Respirar", "Andar", "Pensar"], resposta: 0 }] }, { nome: "Lição 3: Sistema circulatório", perguntas: [{ pergunta: "Qual órgão bombeia o sangue?", opcoes: ["Coração", "Pulmão", "Fígado", "Estômago"], resposta: 0 }, { pergunta: "Qual é a função do sangue?", opcoes: ["Transportar nutrientes e oxigênio", "Produzir luz", "Guardar água", "Criar árvores"], resposta: 0 }, { pergunta: "Qual parte do sangue transporta oxigênio?", opcoes: ["Hemácias", "Plasma", "Plaquetas", "Óleo"], resposta: 0 }, { pergunta: "O que são veias?", opcoes: ["Vasos que levam o sangue ao coração", "Folhas das plantas", "Tipos de ossos", "Parte do cérebro"], resposta: 0 }, { pergunta: "Qual é a função das artérias?", opcoes: ["Levar sangue do coração para o corpo", "Respirar", "Pensar", "Caminhar"], resposta: 0 }] }, { nome: "Lição 4: Energia", perguntas: [{ pergunta: "Qual energia vem do Sol?", opcoes: ["Solar", "Química", "Sonora", "Térmica"], resposta: 0 }, { pergunta: "O que é um circuito elétrico?", opcoes: ["Percurso de energia", "Linha de texto", "Papel de desenho", "Barco"], resposta: 0 }, { pergunta: "Qual fenômeno é causado pelo vento?", opcoes: ["Movimento do ar", "Fusão do gelo", "Pressão do sangue", "Formação do solo"], resposta: 0 }, { pergunta: "O que é calor?", opcoes: ["Energia térmica", "Sombra", "Papel", "Ferro"], resposta: 0 }, { pergunta: "Qual é uma fonte de energia renovável?", opcoes: ["Solar", "Carvão", "Petróleo", "Gás natural"], resposta: 0 }] }, { nome: "Lição 5: Células e vida", perguntas: [{ pergunta: "O que é célula?", opcoes: ["Unidade básica da vida", "Tipo de rio", "Parte do ar", "Cor da roupa"], resposta: 0 }, { pergunta: "Todas as células têm:", opcoes: ["Membrana", "Penas", "Rosto", "Pé"], resposta: 0 }, { pergunta: "Qual estrutura controla a célula?", opcoes: ["Núcleo", "Folha", "Pelo", "Pata"], resposta: 0 }, { pergunta: "Para que serve o DNA?", opcoes: ["Guardar informações genéticas", "Armazenar água", "Transportar sangue", "Fazer energia"], resposta: 0 }, { pergunta: "Qual organismo é unicelular?", opcoes: ["Bactéria", "Elefante", "Árvore", "Pássaro"], resposta: 0 }] }],
            },
            "Geografia": { emoji: "🌍", cor: "#f59e0b", lições: [{ nome: "Lição 1: Brasil e mapas", perguntas: [{ pergunta: "Qual é a capital do Brasil?", opcoes: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], resposta: 2 }, { pergunta: "Qual é o maior rio do Brasil?", opcoes: ["Amazonas", "São Francisco", "Paraná", "Tocantins"], resposta: 0 }, { pergunta: "O que um mapa mostra?", opcoes: ["Localizações e paisagens", "Só nomes", "Só números", "Só desenhos"], resposta: 0 }, { pergunta: "Qual região brasileira é mais conhecida pela floresta Amazônica?", opcoes: ["Norte", "Nordeste", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "Qual estado é mais populoso do Brasil?", opcoes: ["São Paulo", "Pará", "Bahia", "Minas Gerais"], resposta: 0 }] }, { nome: "Lição 2: Clima e vegetação", perguntas: [{ pergunta: "Qual clima é quente e úmido?", opcoes: ["Tropical", "Polar", "Subtropical", "Frio"], resposta: 0 }, { pergunta: "Qual bioma é seco e quente?", opcoes: ["Caatinga", "Amazônia", "Pantanal", "Mata Atlântica"], resposta: 0 }, { pergunta: "Qual clima é mais comum no Sul do Brasil?", opcoes: ["Subtropical", "Desértico", "Polar", "Equatorial"], resposta: 0 }, { pergunta: "O que é vegetação?", opcoes: ["Conjunto de plantas", "Conjunto de pessoas", "Conjunto de cidades", "Conjunto de carros"], resposta: 0 }, { pergunta: "A mata atlântica é uma:", opcoes: ["Floresta brasileira", "Cidade", "Rio", "Montanha"], resposta: 0 }] }, { nome: "Lição 3: Regiões e população", perguntas: [{ pergunta: "Qual região brasileira é mais industrializada?", opcoes: ["Sudeste", "Norte", "Nordeste", "Sul"], resposta: 0 }, { pergunta: "Qual região tem grandes áreas rurais?", opcoes: ["Centro-Oeste", "Sul", "Sudeste", "Norte"], resposta: 0 }, { pergunta: "Qual região enfrenta mais secas?", opcoes: ["Nordeste", "Norte", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "O que é população?", opcoes: ["Conjunto de pessoas de um lugar", "Tipo de árvore", "Nome do rio", "Cor do mapa"], resposta: 0 }, { pergunta: "Qual região é conhecida pela cultura do café?", opcoes: ["Sudeste", "Norte", "Nordeste", "Sul"], resposta: 0 }] }, { nome: "Lição 4: Relevo e mapas", perguntas: [{ pergunta: "O que é relevo?", opcoes: ["Forma da superfície do terreno", "Tipo de texto", "Nome da lua", "Cor do céu"], resposta: 0 }, { pergunta: "Qual é um tipo de relevo?", opcoes: ["Montanha", "Livro", "Mesa", "Lousa"], resposta: 0 }, { pergunta: "O que indica a escala de um mapa?", opcoes: ["A proporção entre o desenho e a realidade", "O nome da cidade", "A cor do papel", "A quantidade de pessoas"], resposta: 0 }, { pergunta: "A latitude mede:", opcoes: ["Distância em relação ao Equador", "Altura da montanha", "Largura da rua", "Número de habitantes"], resposta: 0 }, { pergunta: "O que é um continente?", opcoes: ["Grande extensão de terra", "Rio seco", "Cidade grande", "Montanha alta"], resposta: 0 }] }, { nome: "Lição 5: Paisagens e recursos", perguntas: [{ pergunta: "Qual paisagem tem montanhas e vales?", opcoes: ["Montanhosa", "Planície", "Urbana", "Fluvial"], resposta: 0 }, { pergunta: "O que são recursos naturais?", opcoes: ["Elementos da natureza úteis ao ser humano", "Objetos de metal", "Letras do alfabeto", "Cadeiras da escola"], resposta: 0 }, { pergunta: "Qual recurso natural é muito importante para a vida?", opcoes: ["Água", "Papel", "Borracha", "Lápis"], resposta: 0 }, { pergunta: "Qual ambiente é rico em biodiversidade?", opcoes: ["Floresta", "Deserto", "Ponto de ônibus", "Cidade"], resposta: 0 }, { pergunta: "O que faz a paisagem mudar?", opcoes: ["Clima, relevo e ação humana", "Somente a cor do céu", "Somente os carros", "Somente o vento"], resposta: 0 }] }],
            },
            "História": { emoji: "📚", cor: "#ef4444", lições: [{ nome: "Lição 1: Brasil colônia", perguntas: [{ pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Pedro Álvares Cabral", "Cristóvão Colombo", "D. João VI", "Tiradentes"], resposta: 0 }, { pergunta: "O que foi a colonização?", opcoes: ["Domínio do Brasil por Portugal", "Cruzeiro do Sul", "Invasão de outros países", "Abertura da escola"], resposta: 0 }, { pergunta: "Qual foi um produto muito importante para a colônia?", opcoes: ["Café", "Carro", "Geladeira", "Celular"], resposta: 0 }, { pergunta: "Qual foi o nome do período em que o Brasil foi colônia?", opcoes: ["Período colonial", "Período republicano", "Era industrial", "Era digital"], resposta: 0 }, { pergunta: "Qual cidade foi a primeira capital do Brasil?", opcoes: ["Salvador", "Rio de Janeiro", "São Paulo", "Brasília"], resposta: 0 }] }, { nome: "Lição 2: Independência", perguntas: [{ pergunta: "Em que ano o Brasil se tornou independente?", opcoes: ["1800", "1820", "1822", "1850"], resposta: 2 }, { pergunta: "Quem foi o primeiro imperador do Brasil?", opcoes: ["D. Pedro I", "D. Pedro II", "Getúlio Vargas", "Deodoro"], resposta: 0 }, { pergunta: "O que significou a independência?", opcoes: ["O Brasil deixou de ser colônia", "O Brasil ficou sem governo", "O Brasil acomodou o povo", "O Brasil perdeu a língua"], resposta: 0 }, { pergunta: "Onde ocorreu a declaração de independência?", opcoes: ["Ipiranga", "Praia de Copacabana", "Escola", "Morro do Castelo"], resposta: 0 }, { pergunta: "Por que a independência foi importante?", opcoes: ["Porque o Brasil ficou livre de Portugal", "Porque o Brasil virou um continente", "Porque o Brasil ficou sem território", "Porque o povo deixou de existir"], resposta: 0 }] }, { nome: "Lição 3: Império e escravidão", perguntas: [{ pergunta: "Qual lei aboliu a escravidão?", opcoes: ["Lei Áurea", "Lei das Escolas", "Constituição", "Lei de trânsito"], resposta: 0 }, { pergunta: "Quem foi o segundo imperador do Brasil?", opcoes: ["D. Pedro II", "D. Pedro I", "Pedro Álvares Cabral", "Tiradentes"], resposta: 0 }, { pergunta: "O que é escravidão?", opcoes: ["Sistema em que pessoas eram tratadas como propriedade", "Sistema de esportes", "Sistema de estudo", "Sistema de trabalho voluntário"], resposta: 0 }, { pergunta: "Qual evento marcou a luta pela liberdade dos escravizados?", opcoes: ["Lei Áurea", "Descobrimento", "Revolução Industrial", "Inconfidência Mineira"], resposta: 0 }, { pergunta: "Quem foi Tiradentes?", opcoes: ["Líder da Inconfidência Mineira", "Imperador do Brasil", "Descobridor do Brasil", "Escravo"], resposta: 0 }] }, { nome: "Lição 4: República", perguntas: [{ pergunta: "O que marcou a Proclamação da República?", opcoes: ["Fim do império", "Descobrimento do Brasil", "Criação da escola", "Mudança do clima"], resposta: 0 }, { pergunta: "Quem foi o primeiro presidente da República?", opcoes: ["Deodoro da Fonseca", "D. Pedro I", "Getúlio Vargas", "Tiradentes"], resposta: 0 }, { pergunta: "O que é cidadania?", opcoes: ["Direitos e deveres dos cidadãos", "Nome de um carro", "Uma cidade", "Uma lei de trânsito"], resposta: 0 }, { pergunta: "Qual direito é importante para a vida em sociedade?", opcoes: ["Educação", "Nunca trabalhar", "Não respeitar regras", "Não ter responsabilidades"], resposta: 0 }, { pergunta: "Qual é um dever do cidadão?", opcoes: ["Respeitar as leis", "Ignorar a escola", "Quebrar regras", "Ligar o rádio alto sem parar"], resposta: 0 }] }, { nome: "Lição 5: História e democracia", perguntas: [{ pergunta: "O que é democracia?", opcoes: ["Governar pelo povo", "Governar por um rei", "Governar sem eleitores", "Governar por máquinas"], resposta: 0 }, { pergunta: "Qual é o papel da Constituição?", opcoes: ["Garantir leis e direitos", "Inventar países", "Criar montanhas", "Aumentar o calor"], resposta: 0 }, { pergunta: "Qual documento organiza o Estado brasileiro?", opcoes: ["Constituição Federal", "Mapa do Brasil", "Livro de receitas", "Manual de esportes"], resposta: 0 }, { pergunta: "Por que aprender história é importante?", opcoes: ["Para entender o passado e evitar erros", "Para perder tempo", "Para esconder conhecimentos", "Para não ler mais"], resposta: 0 }, { pergunta: "Quem participa da política?", opcoes: ["Cidadãos e autoridades", "Apenas crianças", "Somente animais", "Somente máquinas"], resposta: 0 }] }],
            }
        }
    },
    "9º ano": {
        emoji: "📕",
        cor: "#f59e0b",
        materias: {
            "Português": { emoji: "📖", cor: "#f97316", lições: [{ nome: "Lição 1: Análise de textos", perguntas: [{ pergunta: "Qual é a ideia principal de um texto?", opcoes: ["Tema central", "Fonte da página", "Número de linhas", "Nome do autor"], resposta: 0 }, { pergunta: "O que é um argumento?", opcoes: ["Razão usada para defender uma ideia", "Uma palavra sem sentido", "Uma imagem", "Um título"], resposta: 0 }, { pergunta: "Quando lemos criticamente, buscamos:", opcoes: ["Entender melhor o texto", "Copiar frases", "Pular páginas", "Fechar o livro"], resposta: 0 }, { pergunta: "Qual palavra expressa opinião?", opcoes: ["Incrível", "Casa", "Lápis", "Mesa"], resposta: 0 }, { pergunta: "Qual palavra é antônimo de 'triste'?", opcoes: ["Feliz", "Calmo", "Lento", "Escuro"], resposta: 0 }] }, { nome: "Lição 2: Gramática avançada", perguntas: [{ pergunta: "Qual palavra é um verbo?", opcoes: ["Correr", "Casa", "Bonito", "Livro"], resposta: 0 }, { pergunta: "Qual palavra é adjetivo?", opcoes: ["Lindo", "Correr", "Mesa", "Papel"], resposta: 0 }, { pergunta: "Qual palavra é pronome pessoal?", opcoes: ["Eu", "Casa", "Bonito", "Lápis"], resposta: 0 }, { pergunta: "Em 'As crianças brincaram', o sujeito é:", opcoes: ["As crianças", "Brincaram", "As", "Crianças brincaram"], resposta: 0 }, { pergunta: "Qual palavra indica ação no passado?", opcoes: ["Correu", "Correr", "Corredor", "Corra"], resposta: 0 }] }, { nome: "Lição 3: Coesão e coerência", perguntas: [{ pergunta: "O que é coesão?", opcoes: ["Ligação entre ideias e frases", "A cor do texto", "O tamanho da página", "A ordem dos desenhos"], resposta: 0 }, { pergunta: "Qual palavra une ideias contrárias?", opcoes: ["Mas", "Logo", "Porque", "Portanto"], resposta: 0 }, { pergunta: "O que é coerência?", opcoes: ["Sentido lógico do texto", "Noção de imagem", "Leitura em voz alta", "Escrever sem parar"], resposta: 0 }, { pergunta: "Um texto coerente deve:", opcoes: ["Ter sentido", "Ter frases curtas só", "Ser sem tema", "Não ter introdução"], resposta: 0 }, { pergunta: "Qual conectivo indica consequência?", opcoes: ["Portanto", "Lápis", "Casa", "Impossível"], resposta: 0 }] }, { nome: "Lição 4: Redação", perguntas: [{ pergunta: "Qual é a função da introdução?", opcoes: ["Apresentar o tema", "Esconder o texto", "Escrever o título", "Parar a leitura"], resposta: 0 }, { pergunta: "O que é a conclusão?", opcoes: ["Encerramento do texto", "Página inicial", "Lista de palavras", "Nome do autor"], resposta: 0 }, { pergunta: "Um bom texto deve ter:", opcoes: ["Estrutura, clareza, objetivo", "Só frases curtas", "Sem tema", "Nem parágrafo"], resposta: 0 }, { pergunta: "Qual palavra introduz afirmação?", opcoes: ["Porque", "Mas", "Portanto", "Logo"], resposta: 0 }, { pergunta: "Em redação, o tema é:", opcoes: ["A ideia principal", "A cor da página", "O nome do professor", "A data"], resposta: 0 }] }, { nome: "Lição 5: Revisão final", perguntas: [{ pergunta: "Qual palavra está escrita corretamente?", opcoes: ["Exercício", "Exercisio", "Execicio", "Execiisio"], resposta: 0 }, { pergunta: "Qual frase tem pontuação correta?", opcoes: ["Vamos estudar hoje!", "Vamos estudar, hoje!", "Vamos estudar hoy!", "Vamosestudar hoje"], resposta: 0 }, { pergunta: "Qual palavra é sinônimo de 'rápido'?", opcoes: ["Veloz", "Lento", "Triste", "Claro"], resposta: 0 }, { pergunta: "Qual palavra é antônimo de 'alto'?", opcoes: ["Baixo", "Grande", "Rápido", "Forte"], resposta: 0 }, { pergunta: "Qual texto narra fatos e personagens?", opcoes: ["Narrativo", "Receita", "Lista", "Mapa"], resposta: 0 }] }],
            },
            "Matemática": { emoji: "🔢", cor: "#8b5cf6", lições: [{ nome: "Lição 1: Potenciação e radiciação", perguntas: [{ pergunta: "2³ vale:", opcoes: ["6", "8", "10", "12"], resposta: 1 }, { pergunta: "√81 = ?", opcoes: ["7", "8", "9", "10"], resposta: 2 }, { pergunta: "5² = ?", opcoes: ["10", "20", "25", "30"], resposta: 2 }, { pergunta: "Qual é o valor de 10⁰?", opcoes: ["0", "1", "10", "100"], resposta: 1 }, { pergunta: "3² + 4² = ?", opcoes: ["12", "20", "25", "30"], resposta: 2 }] }, { nome: "Lição 2: Porcentagem", perguntas: [{ pergunta: "Se uma camiseta custa R$ 80 e tem 10% de desconto, quanto custa?", opcoes: ["R$ 70", "R$ 72", "R$ 75", "R$ 80"], resposta: 1 }, { pergunta: "Qual é 30% de 200?", opcoes: ["30", "50", "60", "80"], resposta: 2 }, { pergunta: "Qual é a média de 6, 8 e 10?", opcoes: ["7", "8", "9", "10"], resposta: 1 }, { pergunta: "Se 4x = 32, x vale:", opcoes: ["6", "7", "8", "9"], resposta: 2 }, { pergunta: "Qual é a razão de 4 para 8?", opcoes: ["1/2", "1/3", "2/3", "3/2"], resposta: 0 }] }, { nome: "Lição 3: Álgebra", perguntas: [{ pergunta: "Se x + 5 = 12, x vale:", opcoes: ["5", "6", "7", "8"], resposta: 2 }, { pergunta: "Qual é o valor de 3x se x = 4?", opcoes: ["7", "10", "12", "15"], resposta: 2 }, { pergunta: "Se 2x = 18, x vale:", opcoes: ["7", "8", "9", "10"], resposta: 2 }, { pergunta: "Qual expressão representa 'o dobro de x'?", opcoes: ["x + 2", "2x", "x²", "x/2"], resposta: 1 }, { pergunta: "Qual é a solução de x - 3 = 5?", opcoes: ["6", "7", "8", "9"], resposta: 2 }] }, { nome: "Lição 4: Geometria", perguntas: [{ pergunta: "Quantos lados tem um hexágono?", opcoes: ["5", "6", "7", "8"], resposta: 1 }, { pergunta: "Qual figura tem 3 lados?", opcoes: ["Triângulo", "Quadrado", "Círculo", "Retângulo"], resposta: 0 }, { pergunta: "Qual é a área de um retângulo 5 × 4?", opcoes: ["9", "18", "20", "25"], resposta: 2 }, { pergunta: "Qual é o perímetro de um quadrado de lado 4?", opcoes: ["8", "12", "16", "20"], resposta: 2 }, { pergunta: "Qual figura tem todos os lados iguais?", opcoes: ["Quadrado", "Círculo", "Triângulo", "Trapézio"], resposta: 0 }] }, { nome: "Lição 5: Problemas e contexto", perguntas: [{ pergunta: "Qual é a média de 5, 7 e 9?", opcoes: ["6", "7", "8", "9"], resposta: 1 }, { pergunta: "Se um carro percorre 120 km em 2 horas, a velocidade média é:", opcoes: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"], resposta: 2 }, { pergunta: "Qual é 20% de 50?", opcoes: ["5", "10", "15", "20"], resposta: 1 }, { pergunta: "O que é razão?", opcoes: ["Comparação entre duas grandezas", "Uma linha sem sentido", "Um número sem valor", "Uma forma de ler"], resposta: 0 }, { pergunta: "Uma camiseta custa R$ 100 e recebe 25% de desconto. Quanto fica?", opcoes: ["R$ 75", "R$ 80", "R$ 85", "R$ 90"], resposta: 0 }] }],
            },
            "Ciências": { emoji: "🔬", cor: "#10b981", lições: [{ nome: "Lição 1: Sistemas do corpo", perguntas: [{ pergunta: "Qual sistema controla o movimento do corpo?", opcoes: ["Nervoso", "Digestivo", "Respiratório", "Cardiovascular"], resposta: 0 }, { pergunta: "O coração faz parte do sistema:", opcoes: ["Cardiovascular", "Digestivo", "Respiratório", "Nervoso"], resposta: 0 }, { pergunta: "Qual órgão realiza a respiração?", opcoes: ["Pulmão", "Fígado", "Rim", "Cérebro"], resposta: 0 }, { pergunta: "Qual sistema transforma alimentos em energia?", opcoes: ["Digestivo", "Nervoso", "Muscular", "Skeletal"], resposta: 0 }, { pergunta: "O que o cérebro faz?", opcoes: ["Controla funções do corpo", "Bombeia sangue", "Expande o pulmão", "Filtra água"], resposta: 0 }] }, { nome: "Lição 2: Ecologia", perguntas: [{ pergunta: "O que é ecologia?", opcoes: ["Estudo das relações entre seres vivos e ambiente", "Estudo do espaço", "Estudo de mapas", "Estudo de aparelhos"], resposta: 0 }, { pergunta: "Quem é produtor em um ecossistema?", opcoes: ["Planta", "Leão", "Homem", "Peixe"], resposta: 0 }, { pergunta: "O que são decompositores?", opcoes: ["Seres que decompõem matéria orgânica", "Seres que viajam", "Seres que cantam", "Seres que produzem calor"], resposta: 0 }, { pergunta: "Qual é um fator abiótico?", opcoes: ["Água", "Coelho", "Pássaro", "Árvore"], resposta: 0 }, { pergunta: "Qual cadeia é correta?", opcoes: ["Planta → coelho → leão", "Leão → planta → coelho", "Coelho → leão → planta", "Planta → leão → coelho"], resposta: 0 }] }, { nome: "Lição 3: Energia e movimentos", perguntas: [{ pergunta: "Qual energia vem do Sol?", opcoes: ["Solar", "Nuclear", "Sonora", "Luminosa"], resposta: 0 }, { pergunta: "O que é fotossíntese?", opcoes: ["Processo pelo qual as plantas produzem alimento", "Natação de peixes", "Respiração humana", "Transporte de sangue"], resposta: 0 }, { pergunta: "Qual é uma fonte de energia renovável?", opcoes: ["Solar", "Carvão", "Petróleo", "Gás"], resposta: 0 }, { pergunta: "O que faz um motor funcionar?", opcoes: ["Energia", "Somente água", "Só ferro", "Só lua"], resposta: 0 }, { pergunta: "Qual tipo de energia é produzida pelo vento?", opcoes: ["Eólica", "Térmica", "Química", "Luminosa"], resposta: 0 }] }, { nome: "Lição 4: Terra e Universo", perguntas: [{ pergunta: "Qual planeta é conhecido como vermelho?", opcoes: ["Marte", "Mercúrio", "Vênus", "Júpiter"], resposta: 0 }, { pergunta: "Quem ilumina a Terra durante o dia?", opcoes: ["Sol", "Lua", "Marte", "Vênus"], resposta: 0 }, { pergunta: "O que causa as marés?", opcoes: ["Gravidade da Lua", "Vento", "Chuva", "Luz do Sol"], resposta: 0 }, { pergunta: "Qual é o planeta mais grande do Sistema Solar?", opcoes: ["Júpiter", "Terra", "Saturno", "Netuno"], resposta: 0 }, { pergunta: "Qual fenômeno acontece quando a Lua entra na sombra da Terra?", opcoes: ["Eclipse lunar", "Choque elétrico", "Terremoto", "Chuva"], resposta: 0 }] }, { nome: "Lição 5: Revisão final", perguntas: [{ pergunta: "O que é célula?", opcoes: ["Unidade básica da vida", "Parte do ar", "Nuvem de gases", "Pé de uma árvore"], resposta: 0 }, { pergunta: "Qual órgão bombeia o sangue?", opcoes: ["Coração", "Pulmão", "Fígado", "Rim"], resposta: 0 }, { pergunta: "Qual é a função do sistema respiratório?", opcoes: ["Trocar gases", "Transformar comida", "Pensar", "Produzir sangue"], resposta: 0 }, { pergunta: "O que é ecossistema?", opcoes: ["Ambiente e seres vivos", "Lugar vazio", "Só plantas", "Só pedras"], resposta: 0 }, { pergunta: "Qual é um fator biótico?", opcoes: ["Animal", "Água", "Rocha", "Ar"], resposta: 0 }] }],
            },
            "Geografia": { emoji: "🌍", cor: "#f59e0b", lições: [{ nome: "Lição 1: Globalização e mapas", perguntas: [{ pergunta: "O que são coordenadas geográficas?", opcoes: ["Linhas imaginárias para localizar lugares", "Numeros de telefone", "Nomes de estados", "Mapas antigos"], resposta: 0 }, { pergunta: "A latitude mede:", opcoes: ["Distância em relação ao Equador", "Distância em relação ao mar", "Número de pessoas", "Largura do mapa"], resposta: 0 }, { pergunta: "Qual hemisfério fica acima da Linha do Equador?", opcoes: ["Hemisfério Norte", "Hemisfério Sul", "Hemisfério Leste", "Hemisfério Oeste"], resposta: 0 }, { pergunta: "Uma escala de mapa indica:", opcoes: ["A proporção entre o mapa e a realidade", "A cor do mapa", "O nome da cidade", "A idade do mapa"], resposta: 0 }, { pergunta: "Qual é um continente?", opcoes: ["Grande extensão de terra", "Rio", "Cidade", "Montanha"], resposta: 0 }] }, { nome: "Lição 2: Relevo e clima", perguntas: [{ pergunta: "O que é relevo?", opcoes: ["Formas do terreno", "Tipo de mapa", "Nome de cidade", "Cor do papel"], resposta: 0 }, { pergunta: "Qual é um tipo de relevo?", opcoes: ["Montanha", "Lápis", "Mesa", "Lua"], resposta: 0 }, { pergunta: "Qual clima é mais seco?", opcoes: ["Desértico", "Tropical", "Úmido", "Frio"], resposta: 0 }, { pergunta: "Qual é a característica da planície?", opcoes: ["Terreno plano", "Terreno íngreme", "Terreno de gelo", "Terreno de montanha"], resposta: 0 }, { pergunta: "A paisagem é formada por:", opcoes: ["Elementos naturais e humanos", "Somente pedras", "Somente flores", "Somente carros"], resposta: 0 }] }, { nome: "Lição 3: Recursos naturais", perguntas: [{ pergunta: "O que são recursos naturais?", opcoes: ["Elementos da natureza úteis ao ser humano", "Objetos fabricados", "Desenhos do mapa", "Números do texto"], resposta: 0 }, { pergunta: "Qual recurso é essencial para a vida?", opcoes: ["Água", "Lápis", "Celular", "Carro"], resposta: 0 }, { pergunta: "Qual recurso é renovável?", opcoes: ["Energia solar", "Petróleo", "Carvão", "Gás natural"], resposta: 0 }, { pergunta: "O que provoca desgaste ambiental?", opcoes: ["Ação humana irresponsável", "A chuva", "Os pássaros", "As árvores"], resposta: 0 }, { pergunta: "O que é biodiversidade?", opcoes: ["Variedade de seres vivos", "Tipos de mapa", "Luz do Sol", "Cor da terra"], resposta: 0 }] }, { nome: "Lição 4: Regionalização", perguntas: [{ pergunta: "O que é regionalização?", opcoes: ["Divisão de áreas por características", "Um tipo de mapa", "Uma cidade", "Uma estrada"], resposta: 0 }, { pergunta: "Qual região é conhecida pela floresta Amazônica?", opcoes: ["Norte", "Nordeste", "Sul", "Sudeste"], resposta: 0 }, { pergunta: "Qual região é mais industrializada no Brasil?", opcoes: ["Sudeste", "Norte", "Nordeste", "Sul"], resposta: 0 }, { pergunta: "Qual região tem clima mais úmido?", opcoes: ["Norte", "Sul", "Sudeste", "Centro-Oeste"], resposta: 0 }, { pergunta: "Qual é um critério para regionalizar um país?", opcoes: ["Clima, relevo, economia", "Número de casas", "Nome das ruas", "Largura do mapa"], resposta: 0 }] }, { nome: "Lição 5: Geopolítica", perguntas: [{ pergunta: "O que é geopolítica?", opcoes: ["Estudo das relações entre território e poder", "Tipo de mapa", "Linguagem de computador", "Historia das cidades"], resposta: 0 }, { pergunta: "O que é fronteira?", opcoes: ["Limite entre territórios", "Ponto no mapa", "Tipo de carro", "Nome de estado"], resposta: 0 }, { pergunta: "Qual é um elemento do poder de um país?", opcoes: ["Território", "Tempo", "Nuvem", "Papel"], resposta: 0 }, { pergunta: "O papel do Estado é:", opcoes: ["Organizar a sociedade", "Dar nome às plantas", "Esconder o mapa", "Vender fotos"], resposta: 0 }, { pergunta: "Por que estudar geografia é importante?", opcoes: ["Para compreender o espaço em que vivemos", "Para escrever poemas", "Para criar carros", "Para pular aulas"], resposta: 0 }] }],
            },
            "História": { emoji: "📚", cor: "#ef4444", lições: [{ nome: "Lição 1: Brasil e sociedade", perguntas: [{ pergunta: "O que foi a Colônia?", opcoes: ["Período em que o Brasil foi dominado por Portugal", "Período da Internet", "Período da industrialização", "Período dos mapas"], resposta: 0 }, { pergunta: "Quem chegou ao Brasil em 1500?", opcoes: ["Pedro Álvares Cabral", "Cristóvão Colombo", "D. Pedro I", "Tiradentes"], resposta: 0 }, { pergunta: "Qual produto foi decisivo na colônia?", opcoes: ["Café", "Papel", "Cimento", "Moto"], resposta: 0 }, { pergunta: "O que foi a escravidão?", opcoes: ["Sistema em que pessoas eram exploradas", "Sistema esportivo", "Sistema escolar", "Sistema de leitura"], resposta: 0 }, { pergunta: "Qual era a capital do Brasil colônia?", opcoes: ["Salvador", "Brasília", "Rio de Janeiro", "São Paulo"], resposta: 0 }] }, { nome: "Lição 2: Independência e Império", perguntas: [{ pergunta: "Em que ano a independência do Brasil foi proclamada?", opcoes: ["1822", "1800", "1850", "1888"], resposta: 0 }, { pergunta: "Quem foi o primeiro imperador do Brasil?", opcoes: ["D. Pedro I", "D. Pedro II", "Deodoro da Fonseca", "Tiradentes"], resposta: 0 }, { pergunta: "Qual foi a principal consequência da independência?", opcoes: ["Brasil deixou de ser colônia", "Brasil virou um continente", "Brasil perdeu o território", "Brasil deixou de existir"], resposta: 0 }, { pergunta: "O que foi a Lei Áurea?", opcoes: ["Lei que aboliu a escravidão", "Lei da educação", "Lei da moeda", "Lei de trânsito"], resposta: 0 }, { pergunta: "Quem foi Tiradentes?", opcoes: ["Líder da Inconfidência Mineira", "Primeiro presidente", "Descobridor do Brasil", "Imperador"], resposta: 0 }] }, { nome: "Lição 3: República e cidadania", perguntas: [{ pergunta: "O que foi a Proclamação da República?", opcoes: ["Fim do Império no Brasil", "Descoberta do Brasil", "Criação de um mapa", "Nova moeda"], resposta: 0 }, { pergunta: "Quem foi o primeiro presidente da República?", opcoes: ["Deodoro da Fonseca", "D. Pedro I", "Getúlio Vargas", "Tiradentes"], resposta: 0 }, { pergunta: "O que é cidadania?", opcoes: ["Direitos e deveres do indivíduo", "Tipo de veículo", "Nome de rua", "Livro escolar"], resposta: 0 }, { pergunta: "Qual é um direito do cidadão?", opcoes: ["Educação", "Comprar tudo sem pagar", "Não obedecer leis", "Ignorar responsabilidade"], resposta: 0 }, { pergunta: "Qual é um dever do cidadão?", opcoes: ["Respeitar as leis", "Pular aula", "Fumar em qualquer lugar", "Quebrar regras"], resposta: 0 }] }, { nome: "Lição 4: Brasil moderno", perguntas: [{ pergunta: "Qual é a Constituição?", opcoes: ["Lei máxima do país", "Mapa do Brasil", "Lista de rios", "Livro de receitas"], resposta: 0 }, { pergunta: "O que é democracia?", opcoes: ["Governar pelo povo", "Governar por um rei", "Governar sem povo", "Governar sem leis"], resposta: 0 }, { pergunta: "Quais pessoas podem participar da política?", opcoes: ["Cidadãos e autoridades", "Somente crianças", "Somente animais", "Somente carros"], resposta: 0 }, { pergunta: "Por que estudar história?", opcoes: ["Para entender o passado e agir melhor no presente", "Para não aprender", "Para repetir erros", "Para esconder ideias"], resposta: 0 }, { pergunta: "A cidadania ativa envolve:", opcoes: ["Participar da sociedade e exercer direitos", "Ficar em casa sem pensar", "Recusar a escola", "Não obedecer normas"], resposta: 0 }] }, { nome: "Lição 5: Revisão final", perguntas: [{ pergunta: "O que foi a Lei Áurea?", opcoes: ["Aboliu a escravidão", "Criou a República", "Mudou a moeda", "Inventou o mapa"], resposta: 0 }, { pergunta: "Quando a independência foi proclamada?", opcoes: ["1822", "1500", "1888", "1900"], resposta: 0 }, { pergunta: "Quem foiDeodoro da Fonseca?", opcoes: ["Primeiro presidente da República", "Imperador", "Descobridor do Brasil", "Professor"], resposta: 0 }, { pergunta: "O que é cidadania ativa?", opcoes: ["Participar e agir para melhorar a sociedade", "Ficar parado", "Não votar", "Ignorar regras"], resposta: 0 }, { pergunta: "Qual documento organiza a vida do país?", opcoes: ["Constituição", "Mapa", "Receita", "Relógio"], resposta: 0 }] }],
            }
        }
    }
};

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

    pergunta.opcoes.forEach((opcao, index) => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn-game";
        btn.innerHTML = opcao;
        btn.onclick = () => verificarGameResposta(index, btn);
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
            salvarUsuarioLocal(usuarios);
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
    tarefasCompletas = tarefasCompletas + 1;
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const chaveSemana = formatarDataLocal(inicioSemana);
    tarefasSemana = {
        inicio: chaveSemana,
        total: tarefasSemana.inicio === chaveSemana ? Number(tarefasSemana.total || 0) + 1 : 1
    };
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
    if (tarefasCompletas >= 10) desbloquearBadge("dez_tarefas");
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
    let tokenSalvo = localStorage.getItem("tokenSessao");

    if (usuarioLogado && tokenSalvo) {
        usuarioAtual = usuarioLogado;
        tokenSessao = tokenSalvo;
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