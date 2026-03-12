<?php
include_once("db_connect.php");

$env = parse_ini_file(__DIR__ . '/.env');

$ticket_id = filter_input(INPUT_GET, 'ticket_id', FILTER_VALIDATE_INT);
$tech_id = filter_input(INPUT_GET, 'tech_id', FILTER_VALIDATE_INT);

$url_destino = $env['FRONTEND_URL'] . "/personal/mis-reportes";

if ($ticket_id && $tech_id) {
    try {
        $stmtCheck = $conn->prepare("SELECT estado FROM tickets WHERE id = :ticket_id");
        $stmtCheck->execute([':ticket_id' => $ticket_id]);
        $ticketInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($ticketInfo) {
            $estadoActual = $ticketInfo['estado'];

            if ($estadoActual === 'En espera' || empty($estadoActual)) {
                $conn->beginTransaction();

                $stmtTech = $conn->prepare("UPDATE usuarios SET estado_disponibilidad = 'ocupado' WHERE id = :tech_id");
                $stmtTech->execute([':tech_id' => $tech_id]);

                $stmtTicket = $conn->prepare("UPDATE tickets SET estado = 'En espera' WHERE id = :ticket_id");
                $stmtTicket->execute([':ticket_id' => $ticket_id]);

                $conn->commit();
            }
        }

        header("Location: " . $url_destino);
        exit();

    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        http_response_code(500);
        echo "Error interno del servidor.";
    }
} else {
    http_response_code(400);
    echo "Datos inválidos.";
}
?>