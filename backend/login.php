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

$postdata = file_get_contents("php://input");

if (!$postdata) {

    echo json_encode([
        "status" => false,
        "message" => "No se recibieron datos"
    ]);

    exit();
}

$request = json_decode($postdata);

if (!isset($request->email) || !isset($request->password)) {

    echo json_encode([
        "status" => false,
        "message" => "Credenciales inválidas"
    ]);

    exit();
}

$email = filter_var(trim($request->email), FILTER_VALIDATE_EMAIL);
$password = trim($request->password);

if (!$email || empty($password)) {

    echo json_encode([
        "status" => false,
        "message" => "Credenciales inválidas"
    ]);

    exit();
}

try {

    $sql = "SELECT id, nombre, email, password, rol 
            FROM usuarios 
            WHERE email = :email 
            LIMIT 1";

    $stmt = $conn->prepare($sql);

    $stmt->bindParam(':email', $email, PDO::PARAM_STR);

    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row && password_verify($password, $row['password'])) {

        $user_data = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'email' => $row['email'],
            'rol' => $row['rol']
        ];

        echo json_encode([
            "status" => true,
            "data" => $user_data
        ]);

    } else {

        echo json_encode([
            "status" => false,
            "message" => "Credenciales inválidas"
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