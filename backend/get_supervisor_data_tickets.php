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

try {
    $query = "
        SELECT
            t.id,
            t.nombre_usuario,
            t.departamento,
            t.descripcion,
            t.prioridad,
            t.personal,
            t.extension_tel,
            t.estado,
            t.fecha,
            t.fecha_limite,
            t.fecha_fin,
            t.notas,
            t.cantidad_dicta,
            t.correo_tipo,
            t.soporte_tipo,
            u.nombre AS nombre_creador
        FROM tickets t
        LEFT JOIN usuarios u
            ON t.secretaria_id = u.id
        ORDER BY t.fecha DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute();

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tickets ? $tickets : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>