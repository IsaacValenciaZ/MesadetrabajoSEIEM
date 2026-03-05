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
    $mail->Body    =
                "
                <div style='background-color: #f4f4f4; padding: 20px; font-family: sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                        
                        <div style='background-color: #56212f; padding: 30px; text-align: center;'>
                            <h1 style='color: #ffffff; margin: 0; font-size: 24px;'>Recuperación de Contraseña</h1>
                        </div>
                        
                        <div style='padding: 30px; color: #333333; line-height: 1.6;'>
                            <p style='font-size: 18px;'>Hola, <strong>{$user['nombre']}</strong>,</p>
                            <p>Hemos recibido una solicitud para recuperar el acceso a tu cuenta en el Sistema SEIEM. Utiliza el siguiente código de seguridad para continuar con el proceso:</p>
                            
                            <div style='background-color: #fdfdfd; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;'>
                                <p style='margin: 0; color: #777777; font-size: 12px; text-transform: uppercase; font-weight: bold;'>Tu código de verificación es:</p>
                                <p style='margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #ba9156; letter-spacing: 8px;'>{$token}</p>
                            </div>
                            
                            <p style='color: #666666; font-size: 14px;'>Regresa a la pantalla de inicio de sesión e ingresa este código.</p>
                            
                        </div>
                        
                        <div style='background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 11px; border-top: 1px solid #eeeeee;'>
                            <p style='margin: 0;'>Este correo es generado automáticamente por el sistema, favor de no responder.</p>
                            <p style='margin: 5px 0 0 0;'>&copy; " . date('Y') . " SEIEM - Mesa de Trabajo</p>
                        </div>
                        
                    </div>
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