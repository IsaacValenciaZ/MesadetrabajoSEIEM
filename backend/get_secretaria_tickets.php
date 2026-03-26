<?php
require_once("cors.php");
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

    $mes = isset($_GET['mes']) ? trim($_GET['mes']) : date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $mes)) {
        $mes = date('Y-m');
    }

    $stmt = $conn->prepare("
        SELECT
            t.id,
            t.nombre_usuario,
            t.departamento,
            t.municipio,
            t.descripcion,
            t.prioridad,
            t.personal,
            t.extension_tel,
            t.estado,
            t.fecha,
            t.fecha_limite,
            t.fecha_fin,
            t.notas,
            t.cantidad_dicta,
            t.correo_tipo,
            t.soporte_tipo,
            u.nombre AS nombre_creador
        FROM tickets t
        LEFT JOIN usuarios u ON t.secretaria_id = u.id
        WHERE t.fecha LIKE :mes
        ORDER BY t.fecha DESC
        LIMIT 500
    ");
    $stmt->execute([':mes' => $mes . '%']);

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>