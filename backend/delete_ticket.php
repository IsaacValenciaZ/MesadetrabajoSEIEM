<?php
require_once 'cors.php';
include_once 'db_connect.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['status' => false, 'message' => 'Método no permitido']);
    exit();
}

$datos = json_decode(file_get_contents('php://input'), true);
$id = isset($datos['id']) ? (int)$datos['id'] : 0;
$secretaria_id_request = isset($datos['secretaria_id']) ? (int)$datos['secretaria_id'] : 0; 

if (!$id || !$secretaria_id_request) {
    http_response_code(400);
    echo json_encode(['status' => false, 'message' => 'Faltan datos (ID del ticket o de usuario)']);
    exit();
}

try {
    $check = $conn->prepare("SELECT estado, secretaria_id FROM tickets WHERE id = ?");
    $check->execute([$id]);
    $ticket = $check->fetch(PDO::FETCH_ASSOC);

    if (!$ticket) {
        http_response_code(404);
        echo json_encode(['status' => false, 'message' => 'Ticket no encontrado']);
        exit();
    }

    if ($ticket['secretaria_id'] != $secretaria_id_request) {
        http_response_code(403);
        echo json_encode([
            'status' => false, 
            'message' => 'No tienes permiso para eliminar este ticket. Solo quien lo creó puede hacerlo.'
        ]);
        exit();
    }

    $estadosPermitidos = ['En espera'];
    if (!in_array($ticket['estado'], $estadosPermitidos)) {
        http_response_code(403);
        echo json_encode([
            'status' => false, 
            'message' => 'No se puede eliminar un ticket que ya fue completado o marcado como incompleto.'
        ]);
        exit();
    }

    $conn->prepare("DELETE FROM evidencias_tickets WHERE ticket_id = ?")->execute([$id]);
    $conn->prepare("DELETE FROM tickets WHERE id = ?")->execute([$id]);

    echo json_encode(['status' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => false, 'message' => 'Error en el servidor']);
}
?>