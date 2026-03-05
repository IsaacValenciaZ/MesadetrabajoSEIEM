<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

include_once("db_connect.php");
require_once 'config_mail.php'; 
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$postdata = file_get_contents("php://input");

if(isset($postdata) && !empty($postdata)) {
    $request = json_decode($postdata);

    if(!isset($request->nombre) || !isset($request->email)) {
         echo json_encode(['status' => false, 'message' => 'Faltan datos']);
         exit;
    }

    $nombre = trim($request->nombre);
    $email = trim($request->email);
    $password = trim($request->password);
    $rol = trim($request->rol);

    $sql_check = "SELECT email FROM usuarios WHERE email = :email";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bindParam(':email', $email);
    $stmt_check->execute();

    if ($stmt_check->rowCount() > 0) {
        echo json_encode(['status' => false, 'message' => 'El correo ya está registrado']);
    } else {
        $password_hashed = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (:nombre, :email, :password, :rol)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password_hashed); 
        $stmt->bindParam(':rol', $rol);

        if ($stmt->execute()) {
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host       = MAIL_HOST;
                $mail->SMTPAuth   = true;
                $mail->Username   = MAIL_USER;
                $mail->Password   = MAIL_PASS;
                $mail->Port       = MAIL_PORT;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

                $mail->setFrom(MAIL_USER, 'Servicios Educativos Integrados al Estado de México (Departamento Técnico)');
                $mail->addAddress($email, $nombre); 

                $mail->isHTML(true);
                $mail->CharSet = 'UTF-8';
                $mail->Subject = 'Bienvenido a SEIEM - Credenciales de Acceso';

                $mail->Body    = 
                        "
                        <div style='background-color: #f4f4f4; padding: 20px; font-family: sans-serif;'>
                            <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                                <div style='background-color: #56212f; padding: 30px; text-align: center;'>
                                    <h1 style='color: #ffffff; margin: 0; font-size: 24px;'>Bienvenido al Sistema de (SEIEM)</h1>
                                </div>
                                <div style='padding: 30px; color: #333333; line-height: 1.6;'>
                                    <p style='font-size: 18px;'>Hola, <strong>{$nombre}</strong>,</p>
                                    <p>Tu cuenta ha sido creada exitosamente. A continuación, tus credenciales de acceso:</p>
                                    <div style='background-color: #fdfdfd; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                                        <p style='margin: 0; color: #777777; font-size: 12px; text-transform: uppercase;'>Usuario</p>
                                        <p style='margin: 5px 0 15px 0; font-size: 16px; font-weight: bold; color: #56212f;'>{$email}</p>
                                        <p style='margin: 0; color: #777777; font-size: 12px; text-transform: uppercase;'>Contraseña Temporal</p>
                                        <p style='margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #56212f; letter-spacing: 2px;'>123456</p>
                                    </div>
                                    <p style='color: #977e5b; font-size: 13px; font-style: italic;'>* Deberás cambiar esta contraseña en el apartado ¿Olvidaste tu Contraseña? en el Login.</p>
                                    <div style='text-align: center; margin-top: 30px;'>
                                        <a href='http://localhost:4200/login' style='background-color: #56212f; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Acceder al Login</a>
                                        </div>
                                </div>
                                <div style='background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 11px; border-top: 1px solid #eeeeee;'>
                                    <p style='margin: 0;'>Este correo es informativo, favor de no responder.</p>
                                    <p style='margin: 5px 0 0 0;'>&copy; " . date('Y') . " SEIEM - Panel de Administración</p>
                                </div>
                            </div>
                        </div>
                        ";

                $mail->send();
                echo json_encode(['status' => true, 'message' => 'Usuario creado y correo enviado']);
            } catch (Exception $e) {
                echo json_encode(['status' => true, 'message' => 'Usuario creado, pero error en envío: ' . $mail->ErrorInfo]);
            }
        } else {
            echo json_encode(['status' => false, 'message' => 'Error al guardar en la base de datos']);
        }
    }
}
?>