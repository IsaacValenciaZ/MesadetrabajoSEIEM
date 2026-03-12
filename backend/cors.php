<?php

$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    http_response_code(500);
    exit("Configuración inválida.");
}

$env = parse_ini_file($envPath);

$frontend_url = $env['FRONTEND_URL'] ?? 'http://localhost';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin === $frontend_url) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Content-Type: application/json");
    http_response_code(200);
    exit();
}

?>