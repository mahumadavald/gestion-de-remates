<?php
/**
 * gr-api.php  —  API de sincronización GR Auction Software ↔ Remates Ahumada
 *
 * INSTRUCCIONES PARA EL INFORMÁTICO:
 * 1. Subir este archivo a la raíz pública de www.rematesahumada.cl
 *    (mismo nivel que index.php, o en una carpeta /api/)
 * 2. Verificar que la URL quede accesible: https://www.rematesahumada.cl/gr-api.php
 * 3. No compartir este archivo públicamente — el token lo protege
 *
 * ACCIONES DISPONIBLES:
 *   GET  ?action=lookup_rut&rut=...   → busca cliente por RUT
 *   POST ?action=sync   + body JSON   → upsert cliente + insert participante
 */

// ── Seguridad ────────────────────────────────────────────────────
define('API_TOKEN', 'gr_ahmd_2026_s3cr3t_K9pQ7mX2');

// Cabeceras
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://gestionderemates.cl');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Verificar token
$authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
if (trim($authHeader) !== 'Bearer ' . API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── Conexiones MySQL ─────────────────────────────────────────────
// NOTA: En el servidor de Ahumada el host es "localhost", no el dominio externo

function getClientDB() {
    // DB de clientes (lookup y upsert de datos del postor)
    $pdo = new PDO(
        'mysql:host=localhost;dbname=rematesa_remate;charset=latin1',
        'rematesa_nicolas',
        'Panquehue7$',
        [
            PDO::ATTR_ERRMODE        => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    return $pdo;
}

function getParticipantDB() {
    // DB de participantes (insert al inscribirse)
    $pdo = new PDO(
        'mysql:host=localhost;dbname=rematesa_participar;charset=latin1',
        'rematesa_rem',
        'Panquehue7$',
        [
            PDO::ATTR_ERRMODE        => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    return $pdo;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ── ACTION: lookup_rut ───────────────────────────────────────────
// GET ?action=lookup_rut&rut=12345678-9
// Retorna: { found: true, data: { nombre, email, telefono, giro, direccion, comuna } }
//       ó: { found: false }
if ($action === 'lookup_rut') {
    $rut = isset($_GET['rut']) ? trim($_GET['rut']) : '';
    if (!$rut) { echo json_encode(['found' => false]); exit; }

    try {
        $db   = getClientDB();
        $stmt = $db->prepare('SELECT * FROM cliente WHERE rut = ? LIMIT 1');
        $stmt->execute([$rut]);
        $row  = $stmt->fetch();

        if ($row) {
            echo json_encode([
                'found' => true,
                'data'  => [
                    'nombre'    => $row['nombres']   ?? '',
                    'email'     => $row['mail']       ?? '',
                    'telefono'  => $row['telefono']   ?? '',
                    'giro'      => $row['giro']        ?? '',
                    'direccion' => $row['direccion']  ?? '',
                    'comuna'    => $row['comuna']     ?? '',
                ],
            ]);
        } else {
            echo json_encode(['found' => false]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ── ACTION: sync ─────────────────────────────────────────────────
// POST ?action=sync
// Body JSON: { nombre, rut, email, telefono, giro, direccion, comuna,
//              banco, tipo_cuenta, numero_cuenta, modalidad, suscribir, comprobante_url }
// Hace: 1) Upsert en rematesa_remate.cliente
//        2) Insert en rematesa_participar.Participantes
if ($action === 'sync') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true);
    if (!$body || !isset($body['rut'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing body']);
        exit;
    }

    // Normalizar
    $rut          = trim($body['rut']          ?? '');
    $nombre       = trim($body['nombre']       ?? '');
    $email        = trim($body['email']        ?? '');
    $telefono     = trim($body['telefono']     ?? '');
    $giro         = trim($body['giro']         ?? '');
    $direccion    = trim($body['direccion']    ?? '');
    $comuna       = trim($body['comuna']       ?? '');
    $banco        = trim($body['banco']        ?? '');
    $tipoCta      = trim($body['tipo_cuenta']  ?? '');
    $numCta       = trim($body['numero_cuenta']?? '');
    $modalidad    = trim($body['modalidad']    ?? 'PRESENCIAL');
    $suscribir    = !empty($body['suscribir']) ? 'si' : 'no';
    $comprobanteUrl = trim($body['comprobante_url'] ?? '');

    try {
        // ── 1. Upsert en rematesa_remate.cliente ─────────────────
        $clientDB = getClientDB();
        $existing = $clientDB->prepare('SELECT rut FROM cliente WHERE rut = ?');
        $existing->execute([$rut]);

        if ($existing->fetch()) {
            // Actualizar cliente existente
            $clientDB->prepare(
                'UPDATE cliente SET nombres=?, mail=?, telefono=?, giro=?, direccion=?, comuna=? WHERE rut=?'
            )->execute([$nombre, $email, $telefono, $giro, $direccion, $comuna, $rut]);
        } else {
            // Crear nuevo cliente
            $clientDB->prepare(
                'INSERT INTO cliente (rut, nombres, contacto, mail, telefono, giro, direccion, comuna) VALUES (?,?,?,?,?,?,?,?)'
            )->execute([$rut, $nombre, $nombre, $email, $telefono, $giro, $direccion, $comuna]);
        }

        // ── 2. Insert en rematesa_participar.Participantes ───────
        $partDB = getParticipantDB();
        $partDB->prepare(
            'INSERT INTO Participantes
             (nombre_razon_social, rut, correo, telefono, giro, direccion, comuna,
              cuenta_bancaria, tipo_cuenta, banco, monto_garantia,
              forma_participacion, estado, suscribir)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $nombre,
            $rut,
            $email,
            $telefono,
            $giro,
            $direccion,
            $comuna,
            $numCta,
            $tipoCta,
            $banco,
            '300000',        // monto garantía fijo por ahora
            $modalidad,
            'pendiente',
            $suscribir,
        ]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Acción desconocida
http_response_code(400);
echo json_encode(['error' => 'Unknown action. Use: lookup_rut, sync']);
