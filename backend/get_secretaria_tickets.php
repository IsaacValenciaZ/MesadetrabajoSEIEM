<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once 'db_connect.php'; 

if (isset($_GET['id'])) {
    
    $secretaria_id = $_GET['id']; 

    try {
        $query = "SELECT t.*, u.nombre as nombre_creador 
                  FROM tickets t
                  LEFT JOIN usuarios u ON t.secretaria_id = u.id
                  ORDER BY t.fecha DESC"; 
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($tickets);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error SQL: " . $e->getMessage()]);
    }

} else {
    echo json_encode([]);
}
?>