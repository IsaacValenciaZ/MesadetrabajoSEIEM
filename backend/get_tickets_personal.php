<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once 'db_connect.php'; 

if (isset($_GET['personal'])) {
    $nombre_personal = $_GET['personal'];
    
    $query = "SELECT t.*, 
                     e.descripcion_resolucion, 
                     IF(e.evidencia_archivo IS NOT NULL AND e.evidencia_archivo != '', true, false) as tiene_foto, 
                     IF(e.firma_base64 IS NOT NULL AND e.firma_base64 != '', true, false) as tiene_firma
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