<?php
declare(strict_types=1);
/**
 * Pulse Studio — local-only demo API. Synthetic data.
 * NOT production-ready: unauthenticated mutations, local JSON persistence.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
function reply(int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}
if ($path === '/api/health') reply(200, ['ok'=>true,'service'=>'pulse-studio']);
if ($path !== '/api/projects') reply(404, ['error'=>'Not found']);
$file = __DIR__ . '/projects.json';
$fp = fopen($file, 'c+');
if ($fp === false) reply(500, ['error'=>'Storage unavailable']);
if (!flock($fp, LOCK_EX)) reply(500, ['error'=>'Storage lock failed']);
rewind($fp);
$raw = stream_get_contents($fp);
$projects = $raw !== false && trim($raw) !== '' ? json_decode($raw, true) : require __DIR__ . '/seed.php';
if (!is_array($projects)) $projects = require __DIR__ . '/seed.php';
function done($fp, array $projects, int $status, array $payload, bool $save = false): never {
    if ($save) {
        rewind($fp);
        ftruncate($fp, 0);
        fwrite($fp, json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    reply($status, $payload);
}
function validated(array $body): array {
    foreach (['name','client','category','status','budget','progress','due'] as $key) {
        if (!array_key_exists($key, $body)) reply(422, ['error'=>"Missing field: $key"]);
    }
    foreach (['name','client','category'] as $key) {
        if (!is_string($body[$key]) || strlen(trim($body[$key])) < 2 || strlen($body[$key]) > 100) reply(422, ['error'=>"Invalid $key"]);
    }
    if (!in_array($body['status'], ['In progress', 'In review', 'Completed'], true)) reply(422, ['error'=>'Invalid status']);
    if (!is_numeric($body['budget']) || $body['budget'] < 0 || $body['budget'] > 10000000) reply(422, ['error'=>'Invalid budget']);
    if (!is_numeric($body['progress']) || $body['progress'] < 0 || $body['progress'] > 100) reply(422, ['error'=>'Invalid progress']);
    if (!is_string($body['due']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['due']) ||
        !checkdate((int) substr($body['due'],5,2), (int) substr($body['due'],8,2), (int) substr($body['due'],0,4))) reply(422, ['error'=>'Invalid due date']);
    return [
        'name'=>trim($body['name']), 'client'=>trim($body['client']), 'category'=>trim($body['category']),
        'status'=>$body['status'], 'budget'=>(float)$body['budget'], 'progress'=>(int)$body['progress'], 'due'=>$body['due']
    ];
}
if ($method === 'GET') done($fp, $projects, 200, ['data'=>$projects]);
if (!in_array($method, ['POST','PUT','DELETE'], true)) done($fp, $projects, 405, ['error'=>'Method not allowed']);
$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) done($fp, $projects, 400, ['error'=>'Invalid JSON']);
if ($method === 'POST') {
    $item = validated($body);
    $item['id'] = 'p' . bin2hex(random_bytes(8));
    $item['createdAt'] = gmdate('Y-m-d');
    $projects[] = $item;
    done($fp, $projects, 201, ['data'=>$item], true);
}
$id = $body['id'] ?? null;
$index = array_search($id, array_column($projects, 'id'), true);
if ($index === false) done($fp, $projects, 404, ['error'=>'Project not found']);
if ($method === 'DELETE') {
    $item = $projects[$index];
    array_splice($projects, $index, 1);
    done($fp, $projects, 200, ['data'=>$item], true);
}
$item = validated($body);
$projects[$index] = array_merge($projects[$index], $item);
done($fp, $projects, 200, ['data'=>$projects[$index]], true);
