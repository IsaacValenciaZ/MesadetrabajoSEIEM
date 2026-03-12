<?php
include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "evidencia_archivo" => null,
        "firma_base64" => null,
        "descripcion_resolucion" => null
    ]);
    exit();
}

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode([
        "evidencia_archivo" => null,
        "firma_base64" => null,
        "descripcion_resolucion" => null
    ]);
    exit();
}

$ticket_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if ($ticket_id === false) {
    http_response_code(400);
    echo json_encode([
        "evidencia_archivo" => null,
        "firma_base64" => null,
        "descripcion_resolucion" => null
    ]);
    exit();
}

try {
    $query = "SELECT evidencia_archivo, firma_base64, descripcion_resolucion 
              FROM evidencias_tickets 
              WHERE ticket_id = :ticket_id";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':ticket_id', $ticket_id, PDO::PARAM_INT);
    $stmt->execute();

    $evidencia = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($evidencia) {
        echo json_encode($evidencia);
    } else {
        echo json_encode([
            "evidencia_archivo" => null,
            "firma_base64" => null,
            "descripcion_resolucion" => null
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "evidencia_archivo" => null,
        "firma_base64" => null,
        "descripcion_resolucion" => null
    ]);
}
?>