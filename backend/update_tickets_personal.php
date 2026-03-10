<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization"); 
header("Content-Type: application/json");

date_default_timezone_set('America/Mexico_City'); 
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

$id = isset($data['id']) ? $data['id'] : null;
$estado = isset($data['estado']) ? $data['estado'] : null;
$resolucion = isset($data['descripcion_resolucion']) ? trim($data['descripcion_resolucion']) : '';
$usuario_id = isset($data['usuario_id']) ? $data['usuario_id'] : null; 
$firma = isset($data['firma']) ? $data['firma'] : null;
$evidencia_base64 = isset($data['evidencia']) ? $data['evidencia'] : null;

if (!$id || !$estado) {
    echo json_encode(["status" => false, "message" => "Faltan datos (ID o Estado)."]);
    exit();
}

if ($estado === 'Completo' || $estado === 'Completado') {
    if ($resolucion === '') {
        echo json_encode(["status" => false, "message" => "La resolución es obligatoria."]);
        exit();
    }
    if (!$firma) {
        echo json_encode(["status" => false, "message" => "La firma es obligatoria."]);
        exit();
    }
    if (!$evidencia_base64) {
        echo json_encode(["status" => false, "message" => "La imagen de evidencia es obligatoria. El archivo es muy pesado o no se leyó bien."]);
        exit();
    }
}

try {
    $conn->beginTransaction();

    if ($estado === 'En espera' || $estado === 'Asignado') {
        $query = "UPDATE tickets SET estado = :estado, fecha_fin = NULL WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':estado' => $estado, ':id' => $id]);

        $stmtEv = $conn->prepare("DELETE FROM evidencias_tickets WHERE ticket_id = :tid");
        $stmtEv->execute([':tid' => $id]);

        $mensaje = "Ticket reabierto correctamente. Evidencias borradas.";
    } 
    else {
        $sqlEv = "INSERT INTO evidencias_tickets (ticket_id, descripcion_resolucion, evidencia_archivo, firma_base64) 
                  VALUES (:tid, :res, :evidencia, :firma)
                  ON DUPLICATE KEY UPDATE 
                      descripcion_resolucion = :res, 
                      evidencia_archivo = :evidencia,
                      firma_base64 = :firma";
        
        $stmtEv = $conn->prepare($sqlEv);
        $stmtEv->execute([
            ':tid' => $id, 
            ':res' => $resolucion, 
            ':evidencia' => $evidencia_base64,
            ':firma' => $firma
        ]);

        $fecha_fin = date('Y-m-d H:i:s');
        $query = "UPDATE tickets SET estado = :estado, fecha_fin = :fin WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':estado' => $estado, 
            ':fin' => $fecha_fin, 
            ':id' => $id
        ]);

        if ($usuario_id) {
            $queryUser = "UPDATE usuarios SET estado_disponibilidad = 'disponible' WHERE id = :uid";
            $stmtUser = $conn->prepare($queryUser);
            $stmtUser->execute([':uid' => $usuario_id]);
        }

        $mensaje = "Ticket finalizado correctamente. Estado actualizado a disponible.";
    }

    $conn->commit();
    echo json_encode(["status" => true, "message" => $mensaje]);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => false, "message" => "Error del servidor: " . $e->getMessage()]);
}

$conn = null;
?>