import { app, auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Elementos do formulário de tarefas
const formularioTarefas = document.getElementById("formularioTarefas");
const campoTarefa = document.getElementById("campoTarefa");
const listaTarefas = document.getElementById("listaTarefas");
const campoPrioridade = document.getElementById("campoPrioridade");
const campoPrazo = document.getElementById("campoPrazo");

const botaoSalvar = formularioTarefas.querySelector('button[type="submit"]');
const botaoCancelarEdicao = document.getElementById("botaoCancelarEdicao");
const mensagemBoasVindas = document.getElementById("mensagemBoasVindas");

// Elementos das telas
const telaLogin = document.getElementById("telaLogin");
const telaCadastro = document.getElementById("telaCadastro");
const telaPrincipal = document.getElementById("telaPrincipal");

// Variáveis de controle
let cancelarAtualizacaoTarefas = null;
let idTarefaEditando = null;

const hoje = new Date().toLocaleDateString("en-CA");
campoPrazo.min = hoje;


// Carrega e acompanha as tarefas do usuário autenticado
function carregarTarefas(usuario) {
    const referenciaTarefas = collection(
        db,
        "users",
        usuario.uid,
        "tasks"
    );

    cancelarAtualizacaoTarefas = onSnapshot(
        referenciaTarefas,
        (resultadoConsulta) => {
            listaTarefas.innerHTML = "";

            resultadoConsulta.forEach((documentoTarefa) => {
                const tarefa = documentoTarefa.data();

                const tarefaAtrasada =
                    tarefa.deadline &&
                    tarefa.deadline < hoje &&
                    !tarefa.completed;

                const item = document.createElement("li");

                // Prioridade
                const textoPrioridade = document.createElement("small");
                textoPrioridade.textContent = `Prioridade: ${tarefa.prioridadeTarefa}`;
                textoPrioridade.classList.add("prioridade");

                if (tarefa.prioridadeTarefa === "baixa") {
                    textoPrioridade.classList.add("baixa");
                } else if (tarefa.prioridadeTarefa === "media") {
                    textoPrioridade.classList.add("media");
                } else if (tarefa.prioridadeTarefa === "alta") {
                    textoPrioridade.classList.add("alta");
                }

                // Caixa para marcar a tarefa como concluída
                const caixaConclusao = document.createElement("input");
                caixaConclusao.type = "checkbox";
                caixaConclusao.checked = tarefa.completed;

                // Título da tarefa
                const textoTarefa = document.createElement("span");
                textoTarefa.textContent = tarefa.title;

                // Prazo
                const textoPrazo = document.createElement("small");

                if (tarefa.deadline) {
                    textoPrazo.textContent = `Prazo: ${tarefa.deadline}`;
                } else {
                    textoPrazo.textContent = "Sem prazo definido";
                }

                if (tarefaAtrasada) {
                    textoPrazo.textContent += " - ATRASADA";
                }

                item.appendChild(caixaConclusao);
                item.appendChild(textoTarefa);
                item.appendChild(textoPrioridade);
                item.appendChild(textoPrazo);

                // Botão de edição
                const botaoEditar = document.createElement("button");
                botaoEditar.type = "button";
                botaoEditar.textContent = "Editar";
                item.appendChild(botaoEditar);

                botaoEditar.addEventListener("click", () => {
                    idTarefaEditando = documentoTarefa.id;

                    campoTarefa.value = tarefa.title;
                    campoPrioridade.value = tarefa.prioridadeTarefa;
                    campoPrazo.value = tarefa.deadline || "";

                    botaoSalvar.textContent = "Salvar alterações";
                    botaoCancelarEdicao.hidden = false;
                });

                // Botão de exclusão
                const botaoExcluir = document.createElement("button");
                botaoExcluir.type = "button";
                botaoExcluir.textContent = "Excluir";
                item.appendChild(botaoExcluir);

                botaoExcluir.addEventListener("click", async () => {
                    try {
                        const referenciaTarefa = doc(
                            db,
                            "users",
                            usuario.uid,
                            "tasks",
                            documentoTarefa.id
                        );

                        await deleteDoc(referenciaTarefa);
                    } catch (erro) {
                        console.error("Erro ao excluir tarefa:", erro);
                    }
                });

                // Atualiza a situação da tarefa quando a caixa é marcada
                caixaConclusao.addEventListener("change", async () => {
                    try {
                        const referenciaTarefa = doc(
                            db,
                            "users",
                            usuario.uid,
                            "tasks",
                            documentoTarefa.id
                        );

                        await updateDoc(referenciaTarefa, {
                            completed: caixaConclusao.checked
                        });
                    } catch (erro) {
                        console.error("Erro ao atualizar tarefa:", erro);
                    }
                });

                listaTarefas.appendChild(item);
            });
        },
        (erro) => {
            console.error("Erro ao carregar tarefas:", erro);
        }
    );
}


// Navegação entre as telas
document.getElementById("botaoMostrarCadastro").addEventListener("click", () => {
    telaLogin.hidden = true;
    telaCadastro.hidden = false;
});

document.getElementById("botaoMostrarLogin").addEventListener("click", () => {
    telaCadastro.hidden = true;
    telaLogin.hidden = false;
});


// Cadastro de usuário
const formularioCadastro = document.getElementById("formularioCadastro");
const mensagemCadastro = document.getElementById("mensagemCadastro");

formularioCadastro.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById("campoNomeCadastro").value.trim();
    const email = document.getElementById("campoEmailCadastro").value.trim();
    const senha = document.getElementById("campoSenhaCadastro").value;

    try {
        mensagemCadastro.textContent = "Criando sua conta...";

        const resultado = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await updateProfile(resultado.user, {
            displayName: nome
        });

        mensagemCadastro.textContent = "Conta criada com sucesso!";
        mensagemBoasVindas.textContent = `Bem-vindo, ${nome}!`;

        formularioCadastro.reset();
    } catch (erro) {
        console.error(erro);

        if (erro.code === "auth/email-already-in-use") {
            mensagemCadastro.textContent = "Este e-mail já está cadastrado.";
        } else if (erro.code === "auth/weak-password") {
            mensagemCadastro.textContent = "A senha é muito fraca.";
        } else if (erro.code === "auth/invalid-email") {
            mensagemCadastro.textContent = "E-mail inválido.";
        } else {
            mensagemCadastro.textContent = "Erro ao criar conta.";
        }
    }
});


// Cancela a edição e limpa o formulário
botaoCancelarEdicao.addEventListener("click", () => {
    idTarefaEditando = null;
    formularioTarefas.reset();

    botaoSalvar.textContent = "Adicionar";
    botaoCancelarEdicao.hidden = true;
});


// Verifica se existe um usuário autenticado
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        telaLogin.hidden = true;
        telaCadastro.hidden = true;
        telaPrincipal.hidden = false;

        mensagemBoasVindas.textContent =
            `Bem-vindo, ${usuario.displayName || "usuário"}!`;

        // Encerra o acompanhamento anterior, se existir
        if (cancelarAtualizacaoTarefas) {
            cancelarAtualizacaoTarefas();
            cancelarAtualizacaoTarefas = null;
        }

        carregarTarefas(usuario);

        console.log("Usuário autenticado:", usuario.uid);
    } else {
        if (cancelarAtualizacaoTarefas) {
            cancelarAtualizacaoTarefas();
            cancelarAtualizacaoTarefas = null;
        }

        listaTarefas.innerHTML = "";
        mensagemBoasVindas.textContent = "";

        telaPrincipal.hidden = true;
        telaLogin.hidden = false;
        telaCadastro.hidden = true;
    }
});


// Logout
document.getElementById("botaoSair").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (erro) {
        console.error("Erro ao sair da conta:", erro);
    }
});


// Login
const formularioLogin = document.getElementById("formularioLogin");
const mensagemLogin = document.getElementById("mensagemLogin");

formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("campoEmailLogin").value.trim();
    const senha = document.getElementById("campoSenhaLogin").value;

    try {
        mensagemLogin.textContent = "Entrando...";

        await signInWithEmailAndPassword(auth, email, senha);

        mensagemLogin.textContent = "Login realizado!";
    } catch (erro) {
        console.error(erro);

        if (erro.code === "auth/invalid-credential") {
            mensagemLogin.textContent = "E-mail ou senha incorretos.";
        } else {
            mensagemLogin.textContent = "Erro ao realizar login.";
        }
    }
});


// Criação e edição de tarefas
formularioTarefas.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const tituloTarefa = campoTarefa.value.trim();
    const prioridadeSelecionada = campoPrioridade.value;
    const prazoTarefa = campoPrazo.value;

    if (!tituloTarefa) return;

    const usuario = auth.currentUser;
    if (!usuario) return;

    try {
        if (idTarefaEditando) {
            const referenciaTarefa = doc(
                db,
                "users",
                usuario.uid,
                "tasks",
                idTarefaEditando
            );

            await updateDoc(referenciaTarefa, {
                title: tituloTarefa,
                prioridadeTarefa: prioridadeSelecionada,
                deadline: prazoTarefa
            });

            idTarefaEditando = null;
        } else {
            await addDoc(
                collection(db, "users", usuario.uid, "tasks"),
                {
                    title: tituloTarefa,
                    completed: false,
                    prioridadeTarefa: prioridadeSelecionada,
                    deadline: prazoTarefa,
                    createdAt: serverTimestamp()
                }
            );
        }

        formularioTarefas.reset();
        botaoSalvar.textContent = "Adicionar";
        botaoCancelarEdicao.hidden = true;
    } catch (erro) {
        console.error("Erro ao salvar tarefa:", erro);
    }
});
