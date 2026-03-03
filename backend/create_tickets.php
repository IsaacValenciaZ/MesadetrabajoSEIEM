<?php
date_default_timezone_set('America/Mexico_City'); 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
include_once("db_connect.php");

$data = json_decode(file_get_contents("php://input"));

if(isset($data->nombre_usuario) && isset($data->personal) && isset($data->descripcion)) {
    try {
        $fecha_limite = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $secretariaId = isset($data->secretaria_id) ? $data->secretaria_id : null;
        
        $cantidad = ($data->descripcion === 'Dictaminar' && isset($data->cantidad)) ? $data->cantidad : null;
        $correo_tipo = ($data->descripcion === 'Correo' && isset($data->correo_tipo)) ? $data->correo_tipo : null;
        $soporte_tipo = ($data->descripcion === 'Tecnico' && isset($data->soporte_tipo)) ? $data->soporte_tipo : null;

        $extension_tel = isset($data->extension_tel) ? $data->extension_tel : null;

        $sql = "INSERT INTO tickets (nombre_usuario, departamento, descripcion, prioridad, personal, notas, fecha_limite, fecha_fin, secretaria_id, cantidad_dicta, extension_tel, correo_tipo, soporte_tipo) 
                VALUES (:user, :depto, :desc, :prio, :pers, :notas, :limite, NULL, :secretariaId, :cant, :ext_tel, :correo_tipo, :soporte_tipo)";
        
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
            ':soporte_tipo' => $soporte_tipo
        ]);

        echo json_encode(["status" => true, "message" => "Ticket creado correctamente"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => false, "message" => "Faltan datos obligatorios"]);
}
?>