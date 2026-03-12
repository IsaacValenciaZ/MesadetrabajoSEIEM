<?php
$env = parse_ini_file(__DIR__ . '/.env');

if (!file_exists($envPath)) {
    die("Error de configuración del servidor.");
}

$env = parse_ini_file($envPath);

define('MAIL_HOST', $env['MAIL_HOST']);      
define('MAIL_USER', $env['MAIL_USER']); 
define('MAIL_PASS', $env['MAIL_PASS']); 
define('MAIL_PORT', $env['MAIL_PORT']);
?>