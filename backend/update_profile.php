<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");
require_once "db_connect.php"; 

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id) || !isset($data->nombre) || !isset($data->email)) {
    echo json_encode(["status" => false, "message" => "Faltan datos"]);
    exit;
}

$id = (int)$data->id;
$nuevoNombre = trim($data->nombre);
$email = trim($data->email);
$pass = isset($data->password) ? trim($data->password) : "";

$stmtOld = $conn->prepare("SELECT nombre FROM usuarios WHERE id = :id");
$stmtOld->bindParam(':id', $id);
$stmtOld->execute();
$row = $stmtOld->fetch(PDO::FETCH_ASSOC);
$nombreViejo = $row['nombre'];

$check = $conn->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id");
$check->bindParam(':email', $email);
$check->bindParam(':id', $id);
$check->execute();

if($check->rowCount() > 0) {
    echo json_encode(["status" => false, "message" => "Ese correo ya está en uso"]);
    exit;
}

if (!empty($pass)) {
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $sql = "UPDATE usuarios SET nombre = :n, email = :e, password = :p WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':p', $hash);
} else {
    $sql = "UPDATE usuarios SET nombre = :n, email = :e WHERE id = :id";
    $stmt = $conn->prepare($sql);
}

$stmt->bindParam(':n', $nuevoNombre);
$stmt->bindParam(':e', $email);
$stmt->bindParam(':id', $id);

if($stmt->execute()) {

    if ($nombreViejo !== $nuevoNombre) {
        $sqlTickets = "UPDATE tickets SET personal = :nuevoNombre WHERE personal = :nombreViejo";
        $stmtTickets = $conn->prepare($sqlTickets);
        $stmtTickets->bindParam(':nuevoNombre', $nuevoNombre);
        $stmtTickets->bindParam(':nombreViejo', $nombreViejo);
        $stmtTickets->execute();
    }

    echo json_encode(["status" => true, "message" => "Perfil y tickets actualizados"]);
} else {
    echo json_encode(["status" => false, "message" => "Error al guardar en BD"]);
}
?>