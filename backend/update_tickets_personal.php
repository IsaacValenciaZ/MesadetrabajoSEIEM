<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: *");

date_default_timezone_set('America/Mexico_City'); 
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id = isset($_POST['id']) ? $_POST['id'] : (isset($data['id']) ? $data['id'] : null);
$estado = isset($_POST['estado']) ? $_POST['estado'] : (isset($data['estado']) ? $data['estado'] : null);
$resolucion = isset($_POST['descripcion_resolucion']) ? $_POST['descripcion_resolucion'] : '';
$usuario_id = isset($_POST['usuario_id']) ? $_POST['usuario_id'] : (isset($data['usuario_id']) ? $data['usuario_id'] : null); 
$firma = isset($_POST['firma']) ? $_POST['firma'] : null;
$evidencia_base64 = null;

if ($id && $estado) {
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
        if (isset($_FILES['evidencia']) && $_FILES['evidencia']['error'] === UPLOAD_ERR_OK) {
                        $tipo_archivo = $_FILES['evidencia']['type'];
                        $contenido_archivo = file_get_contents($_FILES['evidencia']['tmp_name']);
                        $evidencia_base64 = 'data:' . $tipo_archivo . ';base64,' . base64_encode($contenido_archivo);
                    }

                    $sqlEv = "INSERT INTO evidencias_tickets (ticket_id, descripcion_resolucion, evidencia_archivo, firma_base64) 
                            VALUES (:tid, :res, :evidencia, :firma)
                            ON DUPLICATE KEY UPDATE 
                                descripcion_resolucion = :res, 
                                evidencia_archivo = IF(:evidencia IS NOT NULL, :evidencia, evidencia_archivo),
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

            if ($usuario_id && ($estado === 'Completo' || $estado === 'Completado')) {
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
} else {
    echo json_encode(["status" => false, "message" => "Faltan datos (ID o Estado)."]);
}
$conn = null;
?>