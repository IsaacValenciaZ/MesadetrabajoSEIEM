<?php
require_once 'cors.php';
include_once 'db_connect.php';

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

date_default_timezone_set('America/Mexico_City');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([]);
    exit();
}

try {
    $sql = "SELECT 
                t.id,
                t.nombre_usuario,
                t.departamento,
                t.descripcion,
                t.prioridad,
                t.personal,
                t.estado,
                t.fecha,
                t.fecha_fin,
                t.fecha_limite,
                t.notas,
                u.nombre AS nombre_creador
            FROM tickets t
            LEFT JOIN usuarios u 
                ON t.secretaria_id = u.id
            ORDER BY t.id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($resultado ? $resultado : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>