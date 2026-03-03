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

$id = isset($_POST['id']) ? $_POST['id'] : null;
$estado = isset($_POST['estado']) ? $_POST['estado'] : null;
$resolucion = isset($_POST['descripcion_resolucion']) ? $_POST['descripcion_resolucion'] : '';
$evidencia_base64 = null;

if ($id && $estado) {
    try {
        $conn->beginTransaction();

        if (isset($_FILES['evidencia']) && $_FILES['evidencia']['error'] === UPLOAD_ERR_OK) {
            $tipo_archivo = $_FILES['evidencia']['type'];
            $contenido_archivo = file_get_contents($_FILES['evidencia']['tmp_name']);
            $evidencia_base64 = 'data:' . $tipo_archivo . ';base64,' . base64_encode($contenido_archivo);
        }

        $sqlEv = "INSERT INTO evidencias_tickets (ticket_id, descripcion_resolucion, evidencia_archivo) 
                  VALUES (:tid, :res, :evidencia)
                  ON DUPLICATE KEY UPDATE descripcion_resolucion = :res, evidencia_archivo = IF(:evidencia IS NOT NULL, :evidencia, evidencia_archivo)";
        
        $stmtEv = $conn->prepare($sqlEv);
        $stmtEv->execute([
            ':tid' => $id, 
            ':res' => $resolucion, 
            ':evidencia' => $evidencia_base64
        ]);

        $fecha_fin = date('Y-m-d H:i:s');
        $query = "UPDATE tickets SET estado = :estado, fecha_fin = :fin WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':estado' => $estado, 
            ':fin' => $fecha_fin, 
            ':id' => $id
        ]);

        $conn->commit();
        echo json_encode(["status" => true, "message" => "Ticket finalizado correctamente. Imagen guardada en BD."]);

    } catch (Exception $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        echo json_encode(["status" => false, "message" => "Error del servidor: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => false, "message" => "Faltan datos (ID o Estado)."]);
}
$conn = null;
?>