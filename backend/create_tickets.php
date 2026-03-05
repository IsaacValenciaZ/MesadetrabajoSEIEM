<?php
date_default_timezone_set('America/Mexico_City'); 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include_once("db_connect.php");
include_once("config_mail.php"); 

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->nombre_usuario) && isset($data->personal) && isset($data->descripcion)) {
    try {
        $fecha_limite = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $secretariaId = isset($data->secretaria_id) ? $data->secretaria_id : null;
        $cantidad = ($data->descripcion === 'Dictaminar' && isset($data->cantidad)) ? $data->cantidad : null;
        $correo_tipo = ($data->descripcion === 'Correo' && isset($data->correo_tipo)) ? $data->correo_tipo : null;
        $soporte_tipo = ($data->descripcion === 'Tecnico' && isset($data->soporte_tipo)) ? $data->soporte_tipo : null;
        $extension_tel = isset($data->extension_tel) ? $data->extension_tel : null;

        $sql = "INSERT INTO tickets (nombre_usuario, departamento, descripcion, prioridad, personal, notas, fecha_limite, fecha_fin, secretaria_id, cantidad_dicta, extension_tel, correo_tipo, soporte_tipo, estado) 
                VALUES (:user, :depto, :desc, :prio, :pers, :notas, :limite, NULL, :secretariaId, :cant, :ext_tel, :correo_tipo, :soporte_tipo, :estado)";
        
        $stmt = $conn->prepare($sql);
        
        $stmt->execute([
            ':user'         => $data->nombre_usuario,
            ':depto'        => $data->departamento,
            ':desc'         => $data->descripcion,     
            ':prio'         => $data->prioridad,
            ':pers'         => $data->personal,
            ':notas'        => $data->notas,
            ':limite'       => $fecha_limite,
            ':secretariaId' => $secretariaId,
            ':cant'         => $cantidad,
            ':ext_tel'      => $extension_tel,
            ':correo_tipo'  => $correo_tipo,
            ':soporte_tipo' => $soporte_tipo,
            ':estado'       => 'En espera' 
        ]);

        $ticket_id = $conn->lastInsertId(); 

        if(isset($data->personal_email) && isset($data->personal_id)) {
            $enlace_aceptar = "http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/backend/accept_ticket.php?ticket_id={$ticket_id}&tech_id={$data->personal_id}";
                                            //http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/
                                            
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->SMTPAuth   = true;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Host       = MAIL_HOST; 
                $mail->Username   = MAIL_USER; 
                $mail->Password   = MAIL_PASS; 
                $mail->Port       = MAIL_PORT;

                $mail->setFrom(MAIL_USER, 'Mesa de Trabajo SEIEM'); 

                $mail->addAddress($data->personal_email, $data->personal);

                $mail->isHTML(true);
                $mail->Subject = "Nuevo Ticket Asignado: #" . $ticket_id;
                $mail->Body    = 
                            "
                            <div style='background-color: #f4f4f4; padding: 20px; font-family: sans-serif;'>
                                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                                    
                                    <div style='background-color: #56212f; padding: 30px; text-align: center;'>
                                        <h1 style='color: #ffffff; margin: 0; font-size: 24px;'>Nuevo Reporte Asignado</h1>
                                    </div>
                                    
                                    <div style='padding: 30px; color: #333333; line-height: 1.6;'>
                                        <p style='font-size: 18px;'>Hola, <strong>{$data->personal}</strong>,</p>
                                        <p>Se te ha asignado un nuevo ticket en la Mesa de Trabajo. Por favor, revisa los detalles de la solicitud a continuación:</p>
                                        
                                        <div style='background-color: #fdfdfd; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 25px 0;'>
                                            <table style='width: 100%; border-collapse: collapse; font-size: 15px;'>
                                                <tr>
                                                    <td style='padding: 10px 0; color: #777777; width: 35%; border-bottom: 1px solid #eeeeee;'><strong>Prioridad:</strong></td>
                                                    <td style='padding: 10px 0; color: #56212f; font-weight: bold; border-bottom: 1px solid #eeeeee;'>{$data->prioridad}</td>
                                                </tr>
                                                <tr>
                                                    <td style='padding: 10px 0; color: #777777; border-bottom: 1px solid #eeeeee;'><strong>Solicitante:</strong></td>
                                                    <td style='padding: 10px 0; color: #333333; font-weight: 600; border-bottom: 1px solid #eeeeee;'>{$data->nombre_usuario}</td>
                                                </tr>
                                                <tr>
                                                    <td style='padding: 10px 0; color: #777777; border-bottom: 1px solid #eeeeee;'><strong>Departamento:</strong></td>
                                                    <td style='padding: 10px 0; color: #333333; border-bottom: 1px solid #eeeeee;'>{$data->departamento}</td>
                                                </tr>
                                                <tr>
                                                    <td style='padding: 10px 0; color: #777777;'><strong>Problema:</strong></td>
                                                    <td style='padding: 10px 0; color: #333333;'>{$data->descripcion}</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <p style='color: #666666; font-size: 15px; text-align: center; margin-bottom: 25px;'>Para aceptar este ticket y cambiar tu estado a <strong style='color: #ba9156;'>Ocupado</strong>, haz clic en el siguiente botón:</p>
                                        
                                        <div style='text-align: center;'>
                                            <a href='{$enlace_aceptar}' style='background-color: #56212f; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.15);'>Aceptar e ir a la Mesa de Trabajo</a>
                                        </div>
                                    </div>
                                    
                                    <div style='background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 11px; border-top: 1px solid #eeeeee;'>
                                        <p style='margin: 0;'>Este correo es generado automáticamente por el sistema, favor de no responder.</p>
                                        <p style='margin: 5px 0 0 0;'>&copy; " . date('Y') . " SEIEM - Mesa de Trabajo</p>
                                    </div>
                                    
                                </div>
                            </div>
                            ";

                $mail->send();
            } catch (Exception $e) {
            }
        }
    
        echo json_encode(["status" => true, "message" => "Ticket creado correctamente"]);
    } catch (PDOException $e) {
        echo json_encode([
            "status" => false, 
            "error" => "Error SQL Crudo: " . $e->getMessage(),
            "detalles_estado" => "Intenté insertar 'En espera'"
        ]);
    }
} else {
    echo json_encode(["status" => false, "message" => "Faltan datos obligatorios"]);
}
?>