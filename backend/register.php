<?php
include_once("cors.php");
include_once("db_connect.php");
require_once "config_mail.php";

$envPath = __DIR__ . '/.env';
$env = file_exists($envPath) ? parse_ini_file($envPath) : [];
$frontend_url = isset($env['FRONTEND_URL']) ? $env['FRONTEND_URL'] : 'http://localhost';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => false,
        "message" => "Método no permitido"
    ]);
    exit();
}

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

if (!isset($request->nombre) || !isset($request->email) || !isset($request->rol)) {
    echo json_encode([
        "status" => false,
        "message" => "Faltan datos"
    ]);
    exit();
}

$nombre = htmlspecialchars(trim($request->nombre));

$email = trim($request->email);
$email = strtolower($email);
$email = preg_replace('/\s+/', '', $email);
$email = filter_var($email, FILTER_VALIDATE_EMAIL);

$rol = trim($request->rol);

$rolesPermitidos = ["personal", "supervisor", "secretaria"];

if (!$email || !in_array($rol, $rolesPermitidos)) {
    echo json_encode([
        "status" => false,
        "message" => "Datos inválidos"
    ]);
    exit();
}

$passwordTemp = "123456";
$passwordHash = password_hash($passwordTemp, PASSWORD_DEFAULT);

try {

    $stmt_check = $conn->prepare("
        SELECT 1 FROM usuarios 
        WHERE LOWER(email) = LOWER(:email) 
        LIMIT 1
    ");

    $stmt_check->execute([
        ':email' => $email
    ]);

    if ($stmt_check->fetch()) {
        echo json_encode([
            "status" => false,
            "message" => "El correo ya está registrado"
        ]);
        exit();
    }

    $sql = "
        INSERT INTO usuarios (nombre, email, password, rol)
        VALUES (:nombre, :email, :password, :rol)
    ";

    $stmt = $conn->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':email' => $email,
        ':password' => $passwordHash,
        ':rol' => $rol
    ]);

    $login_url = rtrim($frontend_url, '/') . '/mesatrabajo/login';

    $mail = new PHPMailer(true);

    try {

        $mail->isSMTP();
        $mail->Host = MAIL_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = MAIL_USER;
        $mail->Password = MAIL_PASS;
        $mail->Port = MAIL_PORT;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

        $mail->setFrom(MAIL_USER, 'SEIEM Mesa de Trabajo');
        $mail->addAddress($email, $nombre);

        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = 'Credenciales de Acceso';

        $mail->Body = "
10/03/2026
prioridad Alta mandar correo al supervisor

no cerrar ticket con foto 


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
                            <p style='margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #56212f; letter-spacing: 2px;'>{$passwordTemp}</p>
                        </div>
                        <p style='color: #977e5b; font-size: 13px; font-style: italic;'>* Deberás cambiar esta contraseña en el apartado ¿Olvidaste tu Contraseña? en el Login.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='{$login_url}' style='background-color: #56212f; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Acceder al Login</a>
                        </div>
                    </div>
                    <div style='background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 11px; border-top: 1px solid #eeeeee;'>
                        <p style='margin: 0;'>Este correo es informativo, favor de no responder.</p>
                        <p style='margin: 5px 0 0 0;'>&copy; " . date('Y') . " SEIEM - Panel de Administración</p>
                    </div>
                </div>
            </div>";

        $mail->send();

        echo json_encode([
            "status" => true,
            "message" => "Usuario creado y correo enviado"
        ]);

    } catch (Exception $e) {

        echo json_encode([
            "status" => true,
            "message" => "Usuario creado (correo no enviado)"
        ]);
    }

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => $e->getMessage()
    ]);
}
?>