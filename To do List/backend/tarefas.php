<?php

$tarefas = [];

function criarTarefas(&$tarefas, $titulo, $descricao) {
    $novaTarefa = [
        "id" => count($tarefas) + 1,
        "titulo" => $titulo,
        "descricao" => $descricao,
        "concluida" => false
    ];

    $tarefas[] = $novaTarefa;

    return "Tarefa criada com sucesso!";
}

function visualizarTarefas($tarefas) {
    foreach ($tarefas as $tarefa) {
        echo "ID: " . $tarefa["id"] . "<br>";
        echo "Título: " . $tarefa["titulo"] . "<br>";
        echo "Descrição: " . $tarefa["descricao"] . "<br>";
        echo "Status: " . ($tarefa["concluida"] ? "Concluída" : "Pendente") . "<br>";
        echo "----------------------<br>";
    }
}

function atualizarTarefas(&$tarefas, $id, $novoTitulo, $novaDescricao) {
    foreach ($tarefas as &$tarefa) {
        if ($tarefa["id"] == $id) {
            $tarefa["titulo"] = $novoTitulo;
            $tarefa["descricao"] = $novaDescricao;

            return "Tarefa atualizada com sucesso!";
        }
    }

    return "Tarefa não encontrada!";
}

function excluirTarefas(&$tarefas, $id) {
    foreach ($tarefas as $indice => $tarefa) {
        if ($tarefa["id"] == $id) {
            unset($tarefas[$indice]);
            $tarefas = array_values($tarefas);

            return "Tarefa excluída com sucesso!";
        }
    }

    return "Tarefa não encontrada!";
}

echo criarTarefas($tarefas, "Estudar PHP", "Aprender funções e arrays");
echo "<br>";

echo criarTarefas($tarefas, "Fazer exercícios", "Praticar programação");
echo "<br><br>";

visualizarTarefas($tarefas);

echo "<br>";

echo atualizarTarefas($tarefas, 1, "Estudar PHP avançado", "Praticar CRUD em PHP");
echo "<br><br>";

visualizarTarefas($tarefas);

echo excluirTarefas($tarefas, 2);
echo "<br><br>";

visualizarTarefas($tarefas);

?>
