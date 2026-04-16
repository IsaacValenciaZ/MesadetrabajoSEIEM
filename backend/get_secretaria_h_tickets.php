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
    $sql = "
        SELECT 
            t.id,
            t.secretaria_id, 
            t.nombre_usuario,
            t.apellido_usuario,
            t.departamento,
            t.municipio,
            t.descripcion,
            t.prioridad,
            t.personal,
            t.extension_tel,
            t.estado,
            t.fecha,
            t.notas,
            t.cantidad_dicta,
            t.correo_tipo,
            t.soporte_tipo,
            u.nombre AS nombre_creador
        FROM tickets t
        LEFT JOIN usuarios u ON t.secretaria_id = u.id
        WHERE DATE(t.fecha) = CURDATE()

        UNION ALL

        
        SELECT 
            d.id,
            NULL AS secretaria_id,
            d.nombre_usuario,
            d.apellido_usuario,
            d.escuela AS departamento,          
            '-' AS municipio,                   
            d.descripcion,                     
            'Alta' AS prioridad,                
            d.tecnico_asignado AS personal,     
            d.extension AS extension_tel,
            'Pendiente' AS estado,
            d.fecha_programada AS fecha,       
            d.notas,
            d.cantidad_equipos AS cantidad_dicta,
            NULL AS correo_tipo,
            NULL AS soporte_tipo,
            'Programado (Dictamen)' AS nombre_creador
        FROM dictamenes d
        WHERE DATE(d.fecha_programada) = CURDATE() -- O si prefieres filtrar por hoy
        
        ORDER BY fecha DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($resultado ? $resultado : []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
