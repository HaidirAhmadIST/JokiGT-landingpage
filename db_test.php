<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=data_pak", "root", "");
    echo "Successfully connected to 127.0.0.1\n";
} catch (PDOException $e) {
    echo "Failed to connect to 127.0.0.1: " . $e->getMessage() . "\n";
}

try {
    $pdo = new PDO("mysql:host=localhost;port=3307;dbname=data_pak", "root", "");
    echo "Successfully connected to localhost\n";
} catch (PDOException $e) {
    echo "Failed to connect to localhost: " . $e->getMessage() . "\n";
}
