<?php
include_once("cors.php");
include_once("db_connect.php");

$periodo = isset($_GET['periodo']) ? $_GET['periodo'] : 'mes';

if ($periodo === 'semana') {
    $condicionFecha = "YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)";
} else {
    $condicionFecha = "MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
}

$reporte = [];

try {
    $stmt = $conn->query("SELECT COUNT(*) as total FROM tickets WHERE $condicionFecha");
    $reporte['total_creados'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(*) as total FROM tickets WHERE estado IN ('Completo', 'Completado') AND $condicionFecha");
    $reporte['total_completados'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT descripcion as nombre, COUNT(*) as cantidad FROM tickets WHERE $condicionFecha GROUP BY descripcion");
    $reporte['categorias'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT personal as nombre, COUNT(*) as cantidad FROM tickets WHERE personal IS NOT NULL AND personal != '' AND $condicionFecha GROUP BY personal ORDER BY cantidad DESC");
    $reporte['rendimiento_personal'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT prioridad as nombre, COUNT(*) as cantidad FROM tickets WHERE $condicionFecha GROUP BY prioridad");
    $reporte['prioridades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT departamento as nombre, COUNT(*) as cantidad FROM tickets WHERE $condicionFecha GROUP BY departamento ORDER BY cantidad DESC LIMIT 5");
    $reporte['departamentos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reporte);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
}
?>