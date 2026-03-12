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
    $sql = "
        SELECT 
            id,
            nombre,
            email,
            rol,
            estado_disponibilidad
        FROM usuarios
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($usuarios ? $usuarios : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>