<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
include_once 'db_connect.php';

if (isset($_GET['id'])) {
    $ticket_id = $_GET['id'];
    
    try {
        $query = "SELECT e.evidencia_archivo, e.firma_base64, t.descripcion_resolucion 
                  FROM evidencias_tickets e
                  INNER JOIN tickets t ON e.ticket_id = t.id
                  WHERE e.ticket_id = ?";
                  
        $stmt = $conn->prepare($query);
        $stmt->execute([$ticket_id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if($data) {
            echo json_encode($data);
        } else {
            echo json_encode([
                "evidencia_archivo" => null, 
                "firma_base64" => null, 
                "descripcion_resolucion" => "Sin descripción disponible."
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "ID no proporcionado"]);
}
?>