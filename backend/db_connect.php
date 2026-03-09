<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "endpoint de la base de datos  db-lab-01.cluster-cthpdfxrdfan.us-east-1.rds.amazonaws.com";//endpoint de la base de datos  db-lab-01.cluster-cthpdfxrdfan.us-east-1.rds.amazonaws.com
$user = "usutec1"; // usutec1
$pass = "T3c410&%"; //T3c410&%
$db   = "tec1mesa"; //tec1mesa

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db, $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo "Error de conexión: " . $exception->getMessage();
}
?>