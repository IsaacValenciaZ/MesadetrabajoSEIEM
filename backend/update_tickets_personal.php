<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('America/Mexico_City'); 
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- MAGIA PARA CAPTURAR DATOS ---
// 1. Intentamos leer como JSON
$json_input = file_get_contents("php://input");
$data = json_decode($json_input, true);

// 2. Si el JSON falló, intentamos leer de $_POST (por si acaso)
if (!$data) {
    $data = $_POST;
}

// 3. EXTRAER VARIABLES (Usando el array unificado $data)
$id = isset($data['id']) ? $data['id'] : null;
$estado = isset($data['estado']) ? $data['estado'] : null;
$resolucion = isset($data['descripcion_resolucion']) ? trim($data['descripcion_resolucion']) : '';
$usuario_id = isset($data['usuario_id']) ? $data['usuario_id'] : null; 
$firma = isset($data['firma']) ? $data['firma'] : null;
$evidencia_base64 = isset($data['evidencia']) ? $data['evidencia'] : null;

// --- VALIDACION CRITICA ---
if (!$id || !$estado) {
    echo json_encode([
        "status" => false, 
        "message" => "Faltan datos básicos (ID: " . ($id ?? 'VACIO') . " o Estado: " . ($estado ?? 'VACIO') . ").",
        "debug_received" => $data // Esto te dirá en consola qué llegó realmente
    ]);
    exit();
}

if ($estado === 'Completo' || $estado === 'Completado') {
    if (empty($resolucion)) {
        echo json_encode(["status" => false, "message" => "La resolución es obligatoria."]);
        exit();
    }
    if (!$firma) {
        echo json_encode(["status" => false, "message" => "La firma es obligatoria."]);
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

        $mensaje = "Ticket finalizado correctamente.";
    }

    $conn->commit();
    echo json_encode(["status" => true, "message" => $mensaje]);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => false, "message" => "Error DB: " . $e->getMessage()]);
}

$conn = null;
?>