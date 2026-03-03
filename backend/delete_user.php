<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    try {
        $query = "DELETE FROM usuarios WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        
        if($stmt->execute()) {
          
            echo json_encode([
                "success" => true, 
                "status" => true, 
                "message" => "Usuario eliminado correctamente"
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                "success" => false, 
                "message" => "Error interno al ejecutar la eliminación"
            ]);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false, 
            "message" => "Error de base de datos: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
}
?>