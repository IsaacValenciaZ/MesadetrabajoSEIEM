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

if (!isset($data->id) || !isset($data->nombre) || !isset($data->email)) {
    echo json_encode([
        "status" => false,
        "message" => "Faltan datos"
    ]);
    exit();
}

$id = filter_var($data->id, FILTER_VALIDATE_INT);
$nombre = htmlspecialchars(trim($data->nombre));
$email = filter_var(trim($data->email), FILTER_VALIDATE_EMAIL);
$password = isset($data->password) ? trim($data->password) : "";

if (!$id || !$email) {
    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);
    exit();
}

if (!empty($password) && strlen($password) < 6) {
    echo json_encode([
        "status" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ]);
    exit();
}

try {
    $stmtOld = $conn->prepare("
        SELECT nombre 
        FROM usuarios 
        WHERE id = :id
        LIMIT 1
    ");

    $stmtOld->bindParam(':id', $id, PDO::PARAM_INT);
    $stmtOld->execute();

    $row = $stmtOld->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            "status" => false,
            "message" => "Usuario no encontrado"
        ]);
        exit();
    }

    $nombreViejo = $row['nombre'];

    $check = $conn->prepare("
        SELECT id 
        FROM usuarios 
        WHERE email = :email AND id != :id
    ");

    $check->execute([
        ':email' => $email,
        ':id' => $id
    ]);

    if ($check->rowCount() > 0) {
        echo json_encode([
            "status" => false,
            "message" => "Ese correo ya está en uso"
        ]);
        exit();
    }

    $conn->beginTransaction();

    if (!empty($password)) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "
            UPDATE usuarios
            SET nombre = :nombre,
                email = :email,
                password = :pass
            WHERE id = :id
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':pass', $hash);
    } else {
        $sql = "
            UPDATE usuarios
            SET nombre = :nombre,
                email = :email
            WHERE id = :id
        ";
        $stmt = $conn->prepare($sql);
    }

    $stmt->bindParam(':nombre', $nombre);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    if ($nombreViejo !== $nombre) {
        $sqlTickets = "
            UPDATE tickets
            SET personal = :nuevoNombre
            WHERE personal = :nombreViejo
        ";
        $stmtTickets = $conn->prepare($sqlTickets);
        $stmtTickets->execute([
            ':nuevoNombre' => $nombre,
            ':nombreViejo' => $nombreViejo
        ]);
    }

    $conn->commit();

    echo json_encode([
        "status" => true,
        "message" => "Perfil y tickets actualizados"
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