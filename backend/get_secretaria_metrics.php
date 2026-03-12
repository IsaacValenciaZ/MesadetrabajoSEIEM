<?php
include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([]);
    exit();
}

$secretaria_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$secretaria_id) {
    echo json_encode([]);
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
            t.notas,
            u.nombre AS nombre_creador
        FROM tickets t
        LEFT JOIN usuarios u
            ON t.secretaria_id = u.id
        WHERE t.secretaria_id = :id
        ORDER BY t.fecha DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $secretaria_id, PDO::PARAM_INT);
    $stmt->execute();

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tickets ? $tickets : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}

$conn = null;
?>