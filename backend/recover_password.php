<?php

include 'db_connect.php';

include 'config_mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email)) {
    echo json_encode(["status" => false, "message" => "Falta el correo"]);
    exit;
}

$email = $data->email;

try {
    $stmt = $conn->prepare("SELECT id, nombre FROM usuarios WHERE email = :email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => false, "message" => "Este correo no está registrado"]);
        exit;
    }

    try {
        $token = random_int(100000, 999999); 
    } catch (Exception $e) {
        $token = rand(100000, 999999);
    }

    $expiracion = date("Y-m-d H:i:s", strtotime("+15 minutes"));

    $del = $conn->prepare("DELETE FROM recuperar WHERE email = :email");
    $del->execute([':email' => $email]);

    $insert = $conn->prepare("INSERT INTO recuperar (email, token, expiracion) VALUES (:email, :token, :expiracion)");
    $insert->execute([':email' => $email, ':token' => $token, ':expiracion' => $expiracion]);

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = MAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USER;
    $mail->Password   = MAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = MAIL_PORT;

    $mail->setFrom(MAIL_USER, 'Soporte Mesa de Trabajo');
    $mail->addAddress($email, $user['nombre']);

    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = 'Recuperar Contraseña - Mesa de Trabajo';
    $mail->Body    = "
        <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;'>
            <h2 style='color: #2c3e50;'>Hola, {$user['nombre']}</h2>
            <p>Hemos recibido una solicitud para recuperar tu contraseña.</p>
            <p>Usa el siguiente código para continuar:</p>
            <div style='background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #8b2136; letter-spacing: 5px; margin: 20px 0;'>
                $token
            </div>
            <p style='font-size: 12px; color: #777;'>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
    ";

    $mail->send();
    echo json_encode(["status" => true, "message" => "Correo enviado correctamente. Revisa tu bandeja."]);

} catch (Exception $e) {
    echo json_encode(["status" => false, "message" => "Error al enviar correo: " . $mail->ErrorInfo]);
} catch (PDOException $e) {
    echo json_encode(["status" => false, "message" => "Error de base de datos: " . $e->getMessage()]);
}
?>