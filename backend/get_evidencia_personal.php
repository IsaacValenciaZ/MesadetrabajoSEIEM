<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once 'db_connect.php';

if (isset($_GET['id'])) {
    $ticket_id = $_GET['id'];
    
    $query = "SELECT evidencia_archivo, firma_base64, descripcion_resolucion FROM evidencias_tickets WHERE ticket_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute([$ticket_id]);
    $evidencia = $stmt->fetch(PDO::FETCH_ASSOC);

    if($evidencia) {
        echo json_encode($evidencia);
    } else {
        echo json_encode([
            "evidencia_archivo" => null, 
            "firma_base64" => null, 
            "descripcion_resolucion" => null
        ]);
    }
} else {
    echo json_encode(["error" => "ID no proporcionado"]);
}
?>