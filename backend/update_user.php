<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
include 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    try {
      
        $check = $conn->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id");
        $check->bindParam(':email', $data->email);
        $check->bindParam(':id', $data->id);
        $check->execute();

        if($check->rowCount() > 0) {
         
            echo json_encode([
                "status" => false, 
                "message" => "Este correo electrónico ya está registrado por otro usuario."
            ]);
        } else {
            
            $query = "UPDATE usuarios SET nombre = :nombre, email = :email WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':nombre', $data->nombre);
            $stmt->bindParam(':email', $data->email);
            $stmt->bindParam(':id', $data->id);
            
            if($stmt->execute()) {
                echo json_encode([
                    "status" => true, 
                    "message" => "Actualizado con éxito"
                ]);
            } else {
                echo json_encode([
                    "status" => false, 
                    "message" => "No se realizaron cambios en la base de datos."
                ]);
            }
        }
    } catch(PDOException $e) {
        echo json_encode([
            "status" => false, 
            "message" => "Error de BD: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => false, 
        "message" => "ID de usuario no proporcionado."
    ]);
}
?>