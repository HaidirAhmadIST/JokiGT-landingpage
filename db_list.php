<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;", "root", "");
    $stmt = $pdo->query("SHOW DATABASES");
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Databases found: " . implode(", ", $dbs) . "\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
