<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('America/Mexico_City'); 
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$id = isset($_POST['id']) ? $_POST['id'] : null;
$estado = isset($_POST['estado']) ? $_POST['estado'] : null;
$resolucion = isset($_POST['descripcion_resolucion']) ? trim($_POST['descripcion_resolucion']) : '';
$usuario_id = isset($_POST['usuario_id']) ? $_POST['usuario_id'] : null; 
$firma = isset($_POST['firma']) ? $_POST['firma'] : null;

if (!$id || !$estado) {
    echo json_encode(["status" => false, "message" => "Faltan datos básicos (ID o Estado)."]);
    exit();
}
if ($estado === 'Completo' || $estado === 'Completado') {
    if (empty($resolucion) || empty($firma)) {
        echo json_encode(["status" => false, "message" => "La resolución y firma son obligatorias."]);
        exit();
    }
}

$ruta_evidencia = null; 

if (isset($_FILES['evidencia']) && $_FILES['evidencia']['error'] === UPLOAD_ERR_OK) {
    
    $directorio_subida = 'evidencias/';
    
    if (!is_dir($directorio_subida)) {
        mkdir($directorio_subida, 0777, true);
    }

    $extension = pathinfo($_FILES['evidencia']['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $nombre_archivo = 'ticket_' . $id . '_' . time() . '.' . $extension;
    $ruta_destino = $directorio_subida . $nombre_archivo;

    if (move_uploaded_file($_FILES['evidencia']['tmp_name'], $ruta_destino)) {
        $ruta_evidencia = $ruta_destino; 
    } else {
        echo json_encode(["status" => false, "message" => "Error de permisos. El servidor no pudo guardar la foto en la carpeta."]);
        exit();
    }
} elseif (isset($_FILES['evidencia']) && $_FILES['evidencia']['error'] !== UPLOAD_ERR_NO_FILE) {
    echo json_encode(["status" => false, "message" => "El servidor AWS bloqueó la imagen por su tamaño."]);
    exit();
}

try {
    $conn->beginTransaction();

    if ($estado === 'En espera' || $estado === 'Asignado') {
        $query = "UPDATE tickets SET estado = :estado, fecha_fin = NULL WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':estado' => $estado, ':id' => $id]);

        $stmtEv = $conn->prepare("DELETE FROM evidencias_tickets WHERE ticket_id = :tid");
        $stmtEv->execute([':tid' => $id]);

        $mensaje = "Ticket reabierto correctamente.";
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
            ':evidencia' => $ruta_evidencia,
            ':firma' => $firma
        ]);

        $fecha_fin = date('Y-m-d H:i:s');
        $query = "UPDATE tickets SET estado = :estado, fecha_fin = :fin WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':estado' => $estado, ':fin' => $fecha_fin, ':id' => $id]);

        if ($usuario_id) {
            $conn->prepare("UPDATE usuarios SET estado_disponibilidad = 'disponible' WHERE id = ?")
                 ->execute([$usuario_id]);
        }

        $mensaje = "Ticket finalizado exitosamente.";
    }

    $conn->commit();
    echo json_encode(["status" => true, "message" => $mensaje]);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => false, "message" => "Error al guardar en la base de datos: " . $e->getMessage()]);
}

$conn = null;
?>