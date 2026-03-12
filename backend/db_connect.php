<?php

$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    http_response_code(500);
    exit("Error de configuración del servidor.");
}

$env = parse_ini_file($envPath);

$host     = $env['DB_HOST'] ?? '';
$db_name  = $env['DB_NAME'] ?? '';
$username = $env['DB_USER'] ?? '';
$password = $env['DB_PASS'] ?? '';

if (!$host || !$db_name || !$username) {
    http_response_code(500);
    exit("Configuración de base de datos inválida.");
}

try {

    $conn = new PDO(
        "mysql:host={$host};dbname={$db_name};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

} catch (PDOException $exception) {

    http_response_code(500);
    exit("Error de conexión a la base de datos.");
}

?>