<?php

include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "ID no proporcionado"
    ]);
    exit();
}

$id = filter_var($data->id, FILTER_VALIDATE_INT);

if ($id === false) {

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);
    exit();
}

try {

    $query = "DELETE FROM usuarios WHERE id = :id";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Usuario eliminado correctamente"
        ]);

    } else {

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No se pudo eliminar el usuario"
        ]);
    }

} catch (PDOException $e) {

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor"
    ]);
}
?>