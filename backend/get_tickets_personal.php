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

if (!isset($_GET['personal'])) {
    echo json_encode([]);
    exit();
}

$nombre_personal = htmlspecialchars(trim($_GET['personal']));

try {
    $checkUpdate = $conn->query("
        SELECT valor FROM config_sistema 
        WHERE clave = 'ultima_actualizacion_vencidos_diario'
    ")->fetch(PDO::FETCH_ASSOC);

    $ultimaVez = $checkUpdate ? strtotime($checkUpdate['valor']) : 0;

    if ((time() - $ultimaVez) > 86400) {
        $conn->exec("
            UPDATE tickets 
            SET estado = 'Incompleto' 
            WHERE estado NOT IN ('Completo', 'Completado', 'Incompleto')
            AND fecha_limite < NOW()
            AND fecha_limite >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        ");
        $conn->exec("
            INSERT INTO config_sistema (clave, valor) 
            VALUES ('ultima_actualizacion_vencidos_diario', NOW())
            ON DUPLICATE KEY UPDATE valor = NOW()
        ");
    }

    $stmt = $conn->prepare("
        SELECT 
            t.id,
            t.nombre_usuario,
            t.departamento,
            t.descripcion,
            t.prioridad,
            t.estado,
            t.fecha,
            t.extension_tel,
            t.fecha_limite,
            t.fecha_fin,
            t.notas,
            t.cantidad_dicta,
            t.correo_tipo,
            t.soporte_tipo,
            e.descripcion_resolucion,
            IF(e.evidencia_archivo IS NOT NULL AND e.evidencia_archivo != '', true, false) AS tiene_foto,
            IF(e.firma_base64 IS NOT NULL AND e.firma_base64 != '', true, false) AS tiene_firma
        FROM tickets t
        LEFT JOIN evidencias_tickets e ON t.id = e.ticket_id
        WHERE t.personal = :personal
        ORDER BY t.fecha DESC
        LIMIT 500
    ");
    $stmt->execute([':personal' => $nombre_personal]);

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}

$conn = null;
?>