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

if (!isset($_GET['personal'])) {
    echo json_encode([]);
    exit();
}

$nombre_personal = htmlspecialchars(trim($_GET['personal']));

try {
    $query = "
        SELECT 
            t.id,
            t.nombre_usuario,
            t.departamento,
            t.descripcion,
            t.prioridad,
            t.estado,
            t.fecha,
            t.fecha_limite,
            t.fecha_fin,
            e.descripcion_resolucion,
            IF(e.evidencia_archivo IS NOT NULL AND e.evidencia_archivo != '', true, false) AS tiene_foto,
            IF(e.firma_base64 IS NOT NULL AND e.firma_base64 != '', true, false) AS tiene_firma
        FROM tickets t
        LEFT JOIN evidencias_tickets e
            ON t.id = e.ticket_id
        WHERE t.personal = :personal
        ORDER BY t.fecha DESC
    ";

    $stmt = $conn->prepare($query);

    $stmt->execute([
        ':personal' => $nombre_personal
    ]);

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tickets ? $tickets : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}

$conn = null;
?>