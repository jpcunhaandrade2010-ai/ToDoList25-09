const tasks = [];

const USERNAME = "admin";
const PASSWORD = "1234";

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const loginMessage = document.getElementById("loginMessage");
const app = document.getElementById("app");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === USERNAME && password === PASSWORD) {
        loginScreen.hidden = true;
        app.hidden = false;
    } else {
        loginMessage.textContent = "Usuário ou senha incorretos!";
    }
});

document.getElementById("logoutButton").addEventListener("click", function() {
    app.hidden = true;
    loginScreen.hidden = false;
    loginForm.reset();
    loginMessage.textContent = "";
});

document.getElementById("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();
    addTask();
});

function addTask() {
    const input = document.getElementById("taskInput");
    const task = input.value.trim();

    if (task === "") {
        alert("Digite uma tarefa antes de adicionar.");
        return;
    }

    tasks.push(task);
    input.value = "";

    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach((tarefa, index) => {
        const li = document.createElement("li");

        const texto = document.createElement("span");
        texto.textContent = tarefa;

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.classList.add("edit-button");

        botaoEditar.addEventListener("click", function() {
            editarTarefa(index);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.classList.add("delete-button");

        botaoExcluir.addEventListener("click", function() {
            removerTarefa(index);
        });

        li.appendChild(texto);
        li.appendChild(botaoEditar);
        li.appendChild(botaoExcluir);

        list.appendChild(li);
    });
}

function editarTarefa(index) {
    const tarefaEditada = prompt("Edite a tarefa:", tasks[index]);

    if (tarefaEditada === null) {
        return;
    }

    const novaTarefa = tarefaEditada.trim();

    if (novaTarefa === "") {
        alert("A tarefa não pode ficar vazia.");
        return;
    }

    tasks[index] = novaTarefa;
    renderTasks();

    alert("Tarefa editada com sucesso!");
}

function removerTarefa(index) {
    const confirmar = confirm(
        "Tem certeza de que deseja excluir esta tarefa?"
    );

    if (confirmar) {
        tasks.splice(index, 1);
        renderTasks();

        alert("Tarefa removida com sucesso!");
    }
}

renderTasks();
