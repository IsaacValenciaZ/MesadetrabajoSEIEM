<?php

include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {

    http_response_code(405);

    echo json_encode([
        "status" => false,
        "message" => "Método no permitido"
    ]);

    exit();
}

$secretaria_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$secretaria_id) {

    echo json_encode([
        "status" => false,
        "message" => "ID inválido o no proporcionado"
    ]);

    exit();
}

try {

    $query = "
        SELECT
            t.id,
            t.nombre_usuario,
            t.departamento,
            t.descripcion,
            t.prioridad,
            t.personal,
            t.estado,
            t.fecha,
            t.fecha_limite,
            t.fecha_fin,
            u.nombre AS nombre_creador
        FROM tickets t
        LEFT JOIN usuarios u
            ON t.secretaria_id = u.id
        WHERE t.secretaria_id = :secretaria
        ORDER BY t.fecha DESC
    ";

    $stmt = $conn->prepare($query);

    $stmt->execute([
        ':secretaria' => $secretaria_id
    ]);

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => true,
        "data" => $tickets
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}

?>