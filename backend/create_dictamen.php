<?php
include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");

$json_input = file_get_contents("php://input");
$data = json_decode($json_input, true);

if (!$data) {
    $data = $_POST;
}

$nombre_usuario   = trim($data['nombre_usuario'] ?? '');
$apellido_usuario = trim($data['apellido_usuario'] ?? '');
$descripcion      = trim($data['descripcion'] ?? 'Dictaminar'); 
$escuela          = trim($data['escuela'] ?? '');
$cantidad_equipos = isset($data['cantidad_equipos']) ? (int)$data['cantidad_equipos'] : 0;
$extension        = trim($data['extension'] ?? '');
$tecnico_asignado = trim($data['tecnico_asignado'] ?? '');
$fecha_programada = trim($data['fecha_programada'] ?? '');
$notas            = trim($data['notas'] ?? '');

if (empty($nombre_usuario) || empty($apellido_usuario) || empty($escuela) || empty($tecnico_asignado) || empty($fecha_programada)) {
    echo json_encode(["status" => false, "message" => "Faltan datos obligatorios"]);
    exit();
}

try {
    $stmt = $conn->prepare("
        INSERT INTO dictamenes 
        (nombre_usuario, apellido_usuario, descripcion, escuela, cantidad_equipos, extension, tecnico_asignado, fecha_programada, notas) 
        VALUES 
        (:nombre, :apellido, :desc, :escuela, :cant, :ext, :tecnico, :fecha, :notas)
    ");
    
    $stmt->execute([
        ':nombre'   => $nombre_usuario,
        ':apellido' => $apellido_usuario,
        ':desc'     => $descripcion,
        ':escuela'  => $escuela,
        ':cant'     => $cantidad_equipos,
        ':ext'      => $extension,
        ':tecnico'  => $tecnico_asignado,
        ':fecha'    => $fecha_programada,
        ':notas'    => $notas
    ]);

    echo json_encode(["status" => true, "message" => "Dictamen programado exitosamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Error en BD: " . $e->getMessage()]);
}
?>