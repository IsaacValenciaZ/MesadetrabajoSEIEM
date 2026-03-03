<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->token)) {
    echo json_encode(["status" => false, "message" => "Faltan datos (email o token)"]);
    exit;
}

$email = $data->email;
$token = $data->token;
$ahora = date("Y-m-d H:i:s");

try {
    $stmt = $conn->prepare("SELECT id FROM recuperar WHERE email = :email AND token = :token AND expiracion > :ahora");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':token', $token);
    $stmt->bindParam(':ahora', $ahora);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => true, "message" => "Código válido"]);
    } else {
        echo json_encode(["status" => false, "message" => "Código incorrecto o expirado"]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => false, "message" => "Error de base de datos: " . $e->getMessage()]);
}
?>