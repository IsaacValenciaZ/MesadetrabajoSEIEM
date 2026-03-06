<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
include_once("db_connect.php");

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->estado)) {
    try {
        $sql = "UPDATE usuarios SET estado_disponibilidad = :estado WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':estado' => $data->estado, ':id' => $data->id]);
        
        echo json_encode(["status" => true, "message" => "Estado actualizado correctamente"]);
    } catch(PDOException $e) {
        echo json_encode(["status" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => false, "message" => "Datos incompletos"]);
}
?>