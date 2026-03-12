<?php

include_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => false,
        "message" => "Método no permitido"
    ]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->newPass) || !isset($data->token)) {
    echo json_encode([
        "status" => false,
        "message" => "Datos incompletos"
    ]);
    exit();
}

$email = filter_var(trim($data->email), FILTER_VALIDATE_EMAIL);
$newPass = trim($data->newPass);
$token = trim($data->token);

if (!$email) {
    echo json_encode([
        "status" => false,
        "message" => "Email inválido"
    ]);
    exit();
}

if (strlen($newPass) < 6) {
    echo json_encode([
        "status" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT token 
        FROM recuperar 
        WHERE email = :email AND token = :token AND expiracion > NOW()
        LIMIT 1
    ");

    $stmt->execute([
        ':email' => $email,
        ':token' => $token
    ]);

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "status" => false,
            "message" => "Token inválido o expirado"
        ]);
        exit();
    }

    $newPassHash = password_hash($newPass, PASSWORD_DEFAULT);

    $conn->beginTransaction();

    $update = $conn->prepare("
        UPDATE usuarios 
        SET password = :pass 
        WHERE email = :email
    ");

    $update->execute([
        ':pass' => $newPassHash,
        ':email' => $email
    ]);

    $delete = $conn->prepare("
        DELETE FROM recuperar 
        WHERE email = :email
    ");

    $delete->execute([
        ':email' => $email
    ]);

    $conn->commit();

    echo json_encode([
        "status" => true,
        "message" => "Contraseña actualizada correctamente"
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}

?>