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
    $conn->exec("
        UPDATE tickets 
        SET estado = 'Incompleto' 
        WHERE estado NOT IN ('Completo', 'Completado', 'Incompleto')
        AND fecha_limite < NOW()
    ");

    $mes = isset($_GET['mes']) ? trim($_GET['mes']) : null;

    if ($mes && !preg_match('/^\d{4}-\d{2}$/', $mes)) {
        $mes = null;
    }

    if ($mes) {
        $stmt = $conn->prepare("
            SELECT t.id, t.nombre_usuario, t.apellido_usuario, t.departamento, t.municipio,
                t.descripcion, t.prioridad, t.personal, t.metodo_resolucion,
                t.extension_tel, t.estado, t.fecha, t.fecha_limite,
                t.fecha_fin, t.notas, t.cantidad_dicta, t.correo_tipo,
                t.soporte_tipo, u.nombre AS nombre_creador
            FROM tickets t
            LEFT JOIN usuarios u ON t.secretaria_id = u.id
            WHERE t.fecha LIKE :mes
            ORDER BY t.fecha DESC
            LIMIT 500
        ");
        $stmt->execute([':mes' => $mes . '%']);
    } else {
        $stmt = $conn->prepare("
            SELECT t.id, t.nombre_usuario, t.apellido_usuario, t.departamento, t.municipio,
                t.descripcion, t.prioridad, t.personal, t.metodo_resolucion,
                t.extension_tel, t.estado, t.fecha, t.fecha_limite,
                t.fecha_fin, t.notas, t.cantidad_dicta, t.fecha_programada, t.correo_tipo,
                t.soporte_tipo, u.nombre AS nombre_creador
            FROM tickets t
            LEFT JOIN usuarios u ON t.secretaria_id = u.id
            ORDER BY t.fecha DESC
            LIMIT 2000
        ");
        $stmt->execute();
    }

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>