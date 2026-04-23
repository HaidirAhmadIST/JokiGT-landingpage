<?php
$host = '127.0.0.1';
$port = '3307';
$db   = 'data_pak';
$user = 'root';
$pass = '';

echo "Testing connection to $host:$port...\n";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 5, // 5 seconds timeout
    ];
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connection successful!\n";
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM pekerja');
    $row = $stmt->fetch();
    echo "Total Pekerja records: " . $row['count'] . "\n";

} catch (\PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
