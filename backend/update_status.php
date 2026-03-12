<?php

include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        "status" => false,
        "message" => "Método no permitido"
    ]);

    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->estado)) {

    echo json_encode([
        "status" => false,
        "message" => "Datos incompletos"
    ]);

    exit();
}

$id = filter_var($data->id, FILTER_VALIDATE_INT);
$estado = trim($data->estado);

$estadosPermitidos = ["disponible", "ocupado"];

if (!$id || !in_array($estado, $estadosPermitidos)) {

    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);

    exit();
}

try {

    $sql = "
        UPDATE usuarios
        SET estado_disponibilidad = :estado
        WHERE id = :id
    ";

    $stmt = $conn->prepare($sql);

    $stmt->execute([
        ':estado' => $estado,
        ':id' => $id
    ]);

    echo json_encode([
        "status" => true,
        "message" => "Estado actualizado correctamente"
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}

?>