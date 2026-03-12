<?php
include_once("db_connect.php");

$env = parse_ini_file(__DIR__ . '/.env');

$base_url = rtrim($env['FRONTEND_URL'], '/'); 
$url_destino = $base_url . "/#/personal/mis-reportes";

$ticket_id = filter_input(INPUT_GET, 'ticket_id', FILTER_VALIDATE_INT);
$tech_id = filter_input(INPUT_GET, 'tech_id', FILTER_VALIDATE_INT);

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

                $stmtTicket = $conn->prepare("UPDATE tickets SET estado = 'Asignado' WHERE id = :ticket_id");
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

        header("Location: " . $url_destino . "?error=server");
        exit();
    }
} else {
    header("Location: " . $url_destino . "?error=data");
    exit();
}
?>