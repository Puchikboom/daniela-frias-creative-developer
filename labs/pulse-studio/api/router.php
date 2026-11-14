<?php
declare(strict_types=1);
/**
 * Pulse Studio — local engineering lab API. Synthetic projects only.
 * SQLite + prepared SQL statements. Not approved for public writable hosting:
 * no authenticated identity, authorization, CSRF protection, or abuse controls.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function validateProject(array $value): array {
    foreach (['name','client','category','status','budget','progress','due'] as $key) {
        if (!array_key_exists($key, $value)) respond(422, ['error' => "Missing field: $key"]);
    }
    foreach (['name','client','category'] as $key) {
        if (!is_string($value[$key]) || strlen(trim($value[$key])) < 2 || strlen($value[$key]) > 100) {
            respond(422, ['error' => "Invalid $key"]);
        }
    }
    if (!is_string($value['status']) || !in_array($value['status'], ['In progress','In review','Completed'], true)) {
        respond(422, ['error' => 'Invalid status']);
    }
    foreach (['budget','progress'] as $key) {
        if (!is_int($value[$key]) && !is_float($value[$key])) respond(422, ['error' => "Invalid $key"]);
    }
    if ($value['budget'] < 0 || $value['budget'] > 10000000) respond(422, ['error' => 'Invalid budget']);
    if ($value['progress'] < 0 || $value['progress'] > 100 || floor((float)$value['progress']) !== (float)$value['progress']) {
        respond(422, ['error' => 'Invalid progress']);
    }
    if (!is_string($value['due']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value['due']) ||
        !checkdate((int)substr($value['due'],5,2),(int)substr($value['due'],8,2),(int)substr($value['due'],0,4))) {
        respond(422, ['error'=>'Invalid due date']);
    }
    return [
        'name'=>trim($value['name']), 'client'=>trim($value['client']),
        'category'=>trim($value['category']), 'status'=>$value['status'],
        'budget'=>(float)$value['budget'], 'progress'=>(int)$value['progress'],
        'due'=>$value['due']
    ];
}
function inputBody(): array {
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw)>16384) respond(413, ['error'=>'Payload too large']);
    $data = json_decode($raw, true);
    if (!is_array($data) || array_is_list($data)) respond(400, ['error'=>'Invalid JSON object']);
    return $data;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/api/health') respond(200, ['ok'=>true,'service'=>'pulse-studio','storage'=>'sqlite']);
if ($path !== '/api/projects') respond(404, ['error'=>'Not found']);
if (!in_array($method,['GET','POST','PUT','DELETE'],true)) respond(405,['error'=>'Method not allowed']);

if (!extension_loaded('pdo_sqlite')) respond(503,['error'=>'PDO SQLite extension unavailable']);
$dbPath = getenv('PULSE_DB_PATH') ?: (__DIR__.'/pulse.sqlite');
try {
    $pdo = new PDO('sqlite:'.$dbPath, null, null, [
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT=>5
    ]);
    $pdo->exec('PRAGMA busy_timeout=5000');
    $pdo->exec('CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL, client TEXT NOT NULL,
        category TEXT NOT NULL, status TEXT NOT NULL,
        budget REAL NOT NULL CHECK (budget >= 0),
        progress INTEGER NOT NULL CHECK (progress BETWEEN 0 AND 100),
        due TEXT NOT NULL, created_at TEXT NOT NULL
    )');
    if ((int)$pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn() === 0) {
        // Seed once only. A real, fully emptied database must not spontaneously reseed.
        $hasSeed = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'")->fetchColumn();
        if (!$hasSeed) {
            $pdo->exec('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
            $pdo->beginTransaction();
            $insert = $pdo->prepare('INSERT INTO projects (id,name,client,category,status,budget,progress,due,created_at)
                VALUES (:id,:name,:client,:category,:status,:budget,:progress,:due,:createdAt)');
            foreach (require __DIR__.'/seed.php' as $record) $insert->execute($record);
            $pdo->prepare("INSERT INTO metadata (key,value) VALUES ('seeded','yes')")->execute();
            $pdo->commit();
        }
    }
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT id,name,client,category,status,budget,progress,due,created_at AS createdAt FROM projects ORDER BY created_at DESC, id')->fetchAll();
        respond(200, ['data'=>$rows]);
    }
    $body = inputBody();
    if ($method === 'POST') {
        $row = validateProject($body);
        $row['id'] = 'p'.bin2hex(random_bytes(8));
        $row['createdAt'] = gmdate('Y-m-d');
        $stmt=$pdo->prepare('INSERT INTO projects (id,name,client,category,status,budget,progress,due,created_at)
            VALUES (:id,:name,:client,:category,:status,:budget,:progress,:due,:createdAt)');
        $stmt->execute($row);
        respond(201,['data'=>$row]);
    }
    $id=$body['id'] ?? null;
    if (!is_string($id) || strlen($id)>64) respond(400,['error'=>'Invalid id']);
    $stmt=$pdo->prepare('SELECT id,name,client,category,status,budget,progress,due,created_at AS createdAt FROM projects WHERE id=:id');
    $stmt->execute(['id'=>$id]);
    $existing=$stmt->fetch();
    if (!$existing) respond(404,['error'=>'Project not found']);
    if ($method === 'DELETE') {
        $pdo->prepare('DELETE FROM projects WHERE id=:id')->execute(['id'=>$id]);
        respond(200,['data'=>$existing]);
    }
    $values=validateProject($body);
    $values['id']=$id;
    $pdo->prepare('UPDATE projects SET name=:name,client=:client,category=:category,status=:status,
        budget=:budget,progress=:progress,due=:due WHERE id=:id')->execute($values);
    respond(200,['data'=>array_merge($existing,$values)]);
} catch (PDOException $e) {
    error_log('Pulse Studio SQL error: '.$e->getMessage());
    respond(500, ['error'=>'Storage operation failed']);
}
