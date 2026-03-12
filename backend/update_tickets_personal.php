<?php

include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

date_default_timezone_set('America/Mexico_City');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => false,
        "message" => "Método no permitido"
    ]);
    exit();
}

$json_input = file_get_contents("php://input");
$data = json_decode($json_input, true);

if (!$data) {
    $data = $_POST;
}

$id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
$estado = trim($data['estado'] ?? '');
$resolucion = trim($data['descripcion_resolucion'] ?? '');
$usuario_id = filter_var($data['usuario_id'] ?? null, FILTER_VALIDATE_INT);

$firma = (!empty($data['firma']) && str_starts_with($data['firma'], 'data:image'))
    ? $data['firma']
    : null;

$evidencia_base64 = $data['evidencia'] ?? null;

$estadosPermitidos = ["En espera", "Asignado", "Completo", "Completado"];

if (!$id || !in_array($estado, $estadosPermitidos)) {
    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);
    exit();
}

if (($estado === 'Completo' || $estado === 'Completado') && empty($resolucion)) {
    echo json_encode([
        "status" => false,
        "message" => "La resolución es obligatoria."
    ]);
    exit();
}

if ($evidencia_base64 && strlen($evidencia_base64) > 5000000) {
    echo json_encode([
        "status" => false,
        "message" => "La evidencia es demasiado grande"
    ]);
    exit();
}

try {
    $conn->beginTransaction();

    if ($estado === 'En espera' || $estado === 'Asignado') {
        $stmt = $conn->prepare("
            UPDATE tickets
            SET estado = :estado, fecha_fin = NULL
            WHERE id = :id
        ");

        $stmt->execute([
            ':estado' => $estado,
            ':id' => $id
        ]);

        $stmtEv = $conn->prepare("
            DELETE FROM evidencias_tickets
            WHERE ticket_id = :tid
        ");

        $stmtEv->execute([':tid' => $id]);

        $mensaje = "Ticket reabierto correctamente.";
    } else {
        $stmtEv = $conn->prepare("
            INSERT INTO evidencias_tickets
            (ticket_id, descripcion_resolucion, evidencia_archivo, firma_base64)
            VALUES (:tid, :res, :evidencia, :firma)
            ON DUPLICATE KEY UPDATE
                descripcion_resolucion = :res,
                evidencia_archivo = :evidencia,
                firma_base64 = :firma
        ");

        $stmtEv->execute([
            ':tid' => $id,
            ':res' => $resolucion,
            ':evidencia' => $evidencia_base64,
            ':firma' => $firma
        ]);

        $fecha_fin = date('Y-m-d H:i:s');

        $stmt = $conn->prepare("
            UPDATE tickets
            SET estado = :estado, fecha_fin = :fin
            WHERE id = :id
        ");

        $stmt->execute([
            ':estado' => $estado,
            ':fin' => $fecha_fin,
            ':id' => $id
        ]);

        if ($usuario_id) {
            $conn->prepare("
                UPDATE usuarios
                SET estado_disponibilidad = 'disponible'
                WHERE id = ?
            ")->execute([$usuario_id]);
        }

        $mensaje = "Ticket finalizado exitosamente.";
    }

    $conn->commit();

    echo json_encode([
        "status" => true,
        "message" => $mensaje
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}

$conn = null;
?>