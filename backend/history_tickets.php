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
    $sql = "
        SELECT
            id,
            nombre_usuario,
            departamento,
            descripcion,
            prioridad,
            personal,
            estado,
            fecha,
            fecha_limite,
            fecha_fin
        FROM tickets
        ORDER BY fecha DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tickets ? $tickets : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>