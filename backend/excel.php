<?php
date_default_timezone_set('America/Mexico_City');

include_once("cors.php");
include_once("db_connect.php");

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="Reporte_Mensual_' . date('m_Y') . '.csv"');

$salida = fopen('php://output', 'w');

fputs($salida, "\xEF\xBB\xBF");

fputcsv($salida, [ 'Municipio', 'Departamento', 'Descripción', 'Tipo de Soporte']);

try {
    $query = "
        SELECT 
            departamento, 
            municipio,
            descripcion, 
            soporte_tipo
        FROM tickets
        WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
          AND YEAR(fecha) = YEAR(CURRENT_DATE())
        ORDER BY fecha DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute();

    while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($salida, [
            $fila['municipio'],
            $fila['departamento'],
            $fila['descripcion'],
            $fila['soporte_tipo'] ? $fila['soporte_tipo'] : 'N/A',
            $fila['fecha']
        ]);
    }

} catch (PDOException $e) {
    fputcsv($salida, ['Error al exportar los datos']);
}

fclose($salida);
$conn = null;
?>