<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once 'db_connect.php'; 

if (isset($_GET['personal'])) {
    $nombre_personal = $_GET['personal'];
    
    $query = "SELECT t.*, e.descripcion_resolucion, e.evidencia_archivo, e.firma_base64 
              FROM tickets t 
              LEFT JOIN evidencias_tickets e ON t.id = e.ticket_id 
              WHERE t.personal = ? 
              ORDER BY t.fecha DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$nombre_personal]);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($tickets);
} else {
    echo json_encode([]);
}
$conn = null;
?>