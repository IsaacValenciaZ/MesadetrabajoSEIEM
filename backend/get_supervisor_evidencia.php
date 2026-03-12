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

$ticket_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$ticket_id) {

    echo json_encode([
        "status" => false,
        "message" => "ID inválido o no proporcionado"
    ]);

    exit();
}

try {

    $query = "
        SELECT 
            evidencia_archivo,
            firma_base64,
            descripcion_resolucion
        FROM evidencias_tickets
        WHERE ticket_id = :id
        LIMIT 1
    ";

    $stmt = $conn->prepare($query);

    $stmt->execute([
        ':id' => $ticket_id
    ]);

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {

        echo json_encode([
            "status" => true,
            "data" => $data
        ]);

    } else {

        echo json_encode([
            "status" => true,
            "data" => [
                "evidencia_archivo" => null,
                "firma_base64" => null,
                "descripcion_resolucion" => "Sin descripción disponible"
            ]
        ]);
    }

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}

?>