<?php
include_once("db_connect.php");

$ticket_id = isset($_GET['ticket_id']) ? $_GET['ticket_id'] : null;
$tech_id = isset($_GET['tech_id']) ? $_GET['tech_id'] : null;

$url_destino = "http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/mesatrabajo/personal/mis-reportes";


if ($ticket_id && $tech_id) {
    try {
        $stmtCheck = $conn->prepare("SELECT estado FROM tickets WHERE id = :ticket_id");
        $stmtCheck->execute([':ticket_id' => $ticket_id]);
        $ticketInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($ticketInfo) {
            $estadoActual = $ticketInfo['estado'];

            if ($estadoActual === 'En espera' || empty($estadoActual)) {
                
                $stmtTech = $conn->prepare("UPDATE usuarios SET estado_disponibilidad = 'ocupado' WHERE id = :tech_id");
                $stmtTech->execute([':tech_id' => $tech_id]);

                $stmtTicket = $conn->prepare("UPDATE tickets SET estado = 'Asignado' WHERE id = :ticket_id");
                $stmtTicket->execute([':ticket_id' => $ticket_id]);
            }
        }

        header("Location: " . $url_destino);
        exit();

    } catch (PDOException $e) {
        echo "<h2 style='color: red; text-align: center; font-family: sans-serif; margin-top: 50px;'>Error al procesar la solicitud en la base de datos.</h2>";
    }
} else {
    echo "<h2 style='color: red; text-align: center; font-family: sans-serif; margin-top: 50px;'>Datos inválidos o el enlace ha caducado.</h2>";
}
?>