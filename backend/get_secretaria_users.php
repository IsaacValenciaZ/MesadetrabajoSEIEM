<?php
require_once("cors.php");
require_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.nombre,
            u.email,
            u.rol,
            u.estado_disponibilidad,
            COUNT(t.id) AS tickets_hoy,
            (
                SELECT CONCAT(t2.descripcion, ' — ', t2.departamento)
                FROM tickets t2
                WHERE t2.personal = u.nombre
                AND DATE(t2.fecha) = CURDATE()
                ORDER BY t2.fecha DESC
                LIMIT 1
            ) AS ultimo_ticket
        FROM usuarios u
        LEFT JOIN tickets t ON t.personal = u.nombre 
            AND DATE(t.fecha) = CURDATE()
        GROUP BY u.id, u.nombre, u.email, u.rol, u.estado_disponibilidad
    ");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>