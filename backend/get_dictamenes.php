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
                id, 
                nombre_usuario, 
                apellido_usuario, 
                escuela, 
                cantidad_equipos, 
                extension, 
                tecnico_asignado, 
                fecha_programada, 
                notas 
            FROM dictamenes 
            ORDER BY fecha_programada DESC"; 

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($resultado ? $resultado : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>