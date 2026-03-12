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

if (!isset($data->email) || !isset($data->token)) {
    echo json_encode([
        "status" => false,
        "message" => "Faltan datos"
    ]);
    exit();
}

$email = filter_var(trim($data->email), FILTER_VALIDATE_EMAIL);
$token = trim($data->token);

if (!$email || strlen($token) < 4 || strlen($token) > 100) {
    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT id
        FROM recuperar
        WHERE email = :email
        AND token = :token
        AND expiracion > NOW()
        LIMIT 1
    ");

    $stmt->execute([
        ':email' => $email,
        ':token' => $token
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => true,
            "message" => "Código válido"
        ]);
    } else {
        echo json_encode([
            "status" => false,
            "message" => "Código incorrecto o expirado"
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Error interno del servidor"
    ]);
}
?>