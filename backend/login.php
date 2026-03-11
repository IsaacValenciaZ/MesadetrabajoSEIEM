<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once("db_connect.php");

$postdata = file_get_contents("php://input");

if(isset($postdata) && !empty($postdata)) {
    
    $request = json_decode($postdata);
    
    $email = trim($request->email);
    $password = trim($request->password); 

    $sql = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(password_verify($password, $row['password'])) {
            
            $user_data = array(
                'id' => $row['id'],
                'nombre' => $row['nombre'],
                'email' => $row['email'],
                'rol' => $row['rol'] 
            );

            echo json_encode(['status' => true, 'data' => $user_data]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        echo json_encode(['status' => false, 'message' => 'Usuario no encontrado']);
    }
} else {
    echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
}
?>