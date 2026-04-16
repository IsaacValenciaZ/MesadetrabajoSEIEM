<?php
require_once("cors.php");
include_once("db_connect.php");

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([]);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m') AS mes
        FROM tickets
        ORDER BY mes DESC
    ");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>