<?php
include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

$default_response = [
    "evidencia_archivo" => null,
    "firma_base64" => null,
    "descripcion_resolucion" => null
];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode($default_response);
    exit();
}

$ticket_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$ticket_id) {
    echo json_encode($default_response);
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
    $stmt->execute([':id' => $ticket_id]);

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        echo json_encode($data);
    } else {
        echo json_encode($default_response);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode($default_response);
}
?>