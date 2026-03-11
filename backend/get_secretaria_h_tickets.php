<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
include_once("db_connect.php");

date_default_timezone_set('America/Mexico_City'); 

try {
    $sql = "SELECT t.*, u.nombre as nombre_creador 
            FROM tickets t
            LEFT JOIN usuarios u ON t.secretaria_id = u.id
            WHERE DATE(t.fecha) = CURDATE() 
            ORDER BY t.id DESC"; 
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($resultado ? $resultado : []);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error SQL: " . $e->getMessage()]);
}
?>