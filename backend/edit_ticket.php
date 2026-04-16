<?php
require_once 'cors.php';
include_once 'db_connect.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['status' => false, 'message' => 'Método no permitido']);
    exit();
}

$datos = json_decode(file_get_contents('php://input'), true);

$ticketId     = isset($datos['id'])            ? (int)$datos['id']            : 0;
$secretariaId = isset($datos['secretaria_id']) ? (int)$datos['secretaria_id'] : 0;

$nuevoMuni    = isset($datos['municipio'])     ? trim($datos['municipio'])    : '';
$nuevaDesc    = isset($datos['notas'])   ? trim($datos['notas'])  : '';

if (!$ticketId || !$secretariaId) {
    http_response_code(400);
    echo json_encode(['status' => false, 'message' => 'Faltan credenciales o ID del ticket']);
    exit();
}

if ($nuevoMuni === '' && $nuevaDesc === '') {
    http_response_code(400);
    echo json_encode(['status' => false, 'message' => 'No hay datos para actualizar']);
    exit();
}

try {
    $check = $conn->prepare("SELECT id FROM tickets WHERE id = :id AND secretaria_id = :sid");
    $check->execute([':id' => $ticketId, ':sid' => $secretariaId]);

    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => false, 'message' => 'No tienes permiso para editar este ticket']);
        exit();
    }

    $camposUpdate = [];
    $parametros = [':id' => $ticketId];

    if ($nuevoMuni !== '') {
        $camposUpdate[] = "municipio = :municipio";
        $parametros[':municipio'] = $nuevoMuni;
    }

    if ($nuevaDesc !== '') {
        $camposUpdate[] = "notas = :notas";
        $parametros[':notas'] = $nuevaDesc;
    }

    $sql = "UPDATE tickets SET " . implode(", ", $camposUpdate) . " WHERE id = :id";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($parametros);

    echo json_encode(['status' => true, 'message' => 'Ticket actualizado correctamente']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => false, 'message' => 'Error de base de datos']);
}
?>