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

if(isset($data->id) && isset($data->nombre) && isset($data->email) && isset($data->rol)) {
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
            
            $queryOld = "SELECT nombre FROM usuarios WHERE id = :id";
            $stmtOld = $conn->prepare($queryOld);
            $stmtOld->bindParam(':id', $data->id);
            $stmtOld->execute();
            $usuarioViejo = $stmtOld->fetch(PDO::FETCH_ASSOC);
            
            $nombreViejo = $usuarioViejo['nombre'];
            $nombreNuevo = trim($data->nombre);

            $query = "UPDATE usuarios SET nombre = :nombre, email = :email, rol = :rol WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':nombre', $nombreNuevo);
            $stmt->bindParam(':email', trim($data->email));
            $stmt->bindParam(':rol', $data->rol);
            $stmt->bindParam(':id', $data->id);
            
            if($stmt->execute()) {
                
                if ($nombreViejo !== $nombreNuevo) {
                    $queryTickets = "UPDATE tickets SET personal = :nuevoNombre WHERE personal = :viejoNombre";
                    $stmtTickets = $conn->prepare($queryTickets);
                    $stmtTickets->bindParam(':nuevoNombre', $nombreNuevo);
                    $stmtTickets->bindParam(':viejoNombre', $nombreViejo);
                    $stmtTickets->execute();
                }

                echo json_encode([
                    "status" => true, 
                    "message" => "Usuario y registros actualizados con éxito."
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
        "message" => "Faltan datos requeridos para la actualización."
    ]);
}
?>