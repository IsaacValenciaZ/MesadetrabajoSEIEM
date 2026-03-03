<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->newPass)) {
    echo json_encode(["status" => false, "message" => "Datos incompletos"]);
    exit;
}

$email = $data->email;

$newPass = password_hash($data->newPass, PASSWORD_DEFAULT); 

try {
   
    $stmt = $conn->prepare("UPDATE usuarios SET password = :pass WHERE email = :email");
    $stmt->bindParam(':pass', $newPass);
    $stmt->bindParam(':email', $email);

    if ($stmt->execute()) {
        $del = $conn->prepare("DELETE FROM recuperar WHERE email = :email");
        $del->execute([':email' => $email]);
        
        echo json_encode(["status" => true, "message" => "Contraseña actualizada correctamente"]);
    } else {
        echo json_encode(["status" => false, "message" => "No se pudo actualizar la contraseña"]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => false, "message" => "Error BD: " . $e->getMessage()]);
}
?>