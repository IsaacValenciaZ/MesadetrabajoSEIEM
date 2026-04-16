<?php
date_default_timezone_set('America/Mexico_City');

include_once("cors.php");
include_once("db_connect.php");

$mes = isset($_GET['mes']) ? trim($_GET['mes']) : date('Y-m');
if (!preg_match('/^\d{4}-\d{2}$/', $mes)) {
    $mes = date('Y-m');
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="Reporte_Mensual_' . $mes . '.csv"');
header('Pragma: no-cache');
header('Expires: 0');

$salida = fopen('php://output', 'w');

fputs($salida, "\xEF\xBB\xBF");

fputcsv($salida, ['Municipio', 'Departamento', 'Descripción', 'Tipo de Soporte']);

try {
    $query = "
        SELECT 
            id,
            fecha,
            departamento, 
            municipio,
            descripcion, 
            soporte_tipo,
            estado
        FROM tickets
        WHERE fecha LIKE :mes
        ORDER BY fecha DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute([':mes' => $mes . '%']);

    // 4. Llenar el Excel con los datos
    while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($salida, [
            $fila['id'],
            $fila['fecha'],
            $fila['municipio'] ? $fila['municipio'] : 'N/A',
            $fila['departamento'],
            $fila['descripcion'],
            $fila['soporte_tipo'] ? $fila['soporte_tipo'] : 'N/A',
            $fila['estado'] ? $fila['estado'] : 'Pendiente'
        ]);
    }

} catch (PDOException $e) {
    fputcsv($salida, ['Error al exportar los datos']);
}

fclose($salida);
$conn = null;
?>