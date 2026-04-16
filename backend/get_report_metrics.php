<?php
include_once("cors.php");
include_once("db_connect.php");

$periodo = isset($_GET['periodo']) ? $_GET['periodo'] : '';

$reporte = [];

if ($periodo === 'semana') {
    $condicionFecha = "YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)";

    $lunes   = date('d', strtotime('monday this week'));
    $viernes = date('d', strtotime('friday this week'));
    $mes     = date('F', strtotime('monday this week'));
    $anio    = date('Y');

    $meses_es = [
        'January'=>'Enero','February'=>'Febrero','March'=>'Marzo',
        'April'=>'Abril','May'=>'Mayo','June'=>'Junio',
        'July'=>'Julio','August'=>'Agosto','September'=>'Septiembre',
        'October'=>'Octubre','November'=>'Noviembre','December'=>'Diciembre'
    ];
    $mes_es = $meses_es[$mes] ?? $mes;

    $reporte['semana_label'] = "$lunes - $viernes de $mes_es $anio";

} elseif (preg_match('/^(\d{4})-(\d{2})$/', $periodo, $m)) {
    $anio = (int)$m[1];
    $mes  = (int)$m[2];
    $condicionFecha = "YEAR(fecha) = $anio AND MONTH(fecha) = $mes";

} else {
    $condicionFecha = "MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
}

try {
    $stmt = $conn->query("
        SELECT DISTINCT 
            DATE_FORMAT(fecha, '%Y-%m') as value,
            DATE_FORMAT(fecha, '%M %Y') as label
        FROM tickets
        ORDER BY value DESC
    ");
    $reporte['meses_disponibles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

    $stmt = $conn->query("SELECT metodo_resolucion as nombre, COUNT(*) as cantidad FROM tickets WHERE $condicionFecha GROUP BY metodo_resolucion ORDER BY cantidad DESC");
    $reporte['metodos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reporte);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
}
?>