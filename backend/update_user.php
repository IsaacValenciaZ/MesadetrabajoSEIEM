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

if (!isset($data->id) || !isset($data->nombre) || !isset($data->email) || !isset($data->rol)) {
    echo json_encode([
        "status" => false,
        "message" => "Faltan datos requeridos"
    ]);
    exit();
}

$id = filter_var($data->id, FILTER_VALIDATE_INT);
$nombre = htmlspecialchars(trim($data->nombre));

$email = trim($data->email);
$email = strtolower($email);
$email = filter_var($email, FILTER_VALIDATE_EMAIL);

$rol = strtolower(trim($data->rol));

$rolesPermitidos = ["personal", "secretaria", "supervisor"];

if (!$id || !$email || !in_array($rol, $rolesPermitidos)) {
    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);
    exit();
}

try {

    $check = $conn->prepare("
        SELECT id 
        FROM usuarios 
        WHERE LOWER(email) = LOWER(:email) AND id != :id
        LIMIT 1
    ");

    $check->execute([
        ':email' => $email,
        ':id' => $id
    ]);

    if ($check->fetch()) {
        echo json_encode([
            "status" => false,
            "message" => "Este correo ya está registrado por otro usuario"
        ]);
        exit();
    }

    $stmtOld = $conn->prepare("
        SELECT nombre
        FROM usuarios
        WHERE id = :id
        LIMIT 1
    ");

    $stmtOld->execute([':id' => $id]);

    $usuarioViejo = $stmtOld->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioViejo) {
        echo json_encode([
            "status" => false,
            "message" => "Usuario no encontrado"
        ]);
        exit();
    }

    $nombreViejo = $usuarioViejo['nombre'];

    $conn->beginTransaction();

    $stmt = $conn->prepare("
        UPDATE usuarios
        SET nombre = :nombre,
            email = :email,
            rol = :rol
        WHERE id = :id
    ");

    $stmt->execute([
        ':nombre' => $nombre,
        ':email' => $email,
        ':rol' => $rol,
        ':id' => $id
    ]);

    if ($nombreViejo !== $nombre) {

        $stmtTickets = $conn->prepare("
            UPDATE tickets
            SET personal = :nuevoNombre
            WHERE personal = :viejoNombre
        ");

        $stmtTickets->execute([
            ':nuevoNombre' => $nombre,
            ':viejoNombre' => $nombreViejo
        ]);
    }

    $conn->commit();

    echo json_encode([
        "status" => true,
        "message" => "Usuario actualizado correctamente"
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