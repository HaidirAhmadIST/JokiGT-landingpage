<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use App\Models\User;

$u = User::where('email', 'haidirahmadist@gmail.com')->first();
if ($u) {
    $u->password = Illuminate\Support\Facades\Hash::make('admin123');
    $u->save();
    echo "SUCCESS: Password reset to admin123 for haidirahmadist@gmail.com\n";
} else {
    echo "ERROR: User haidirahmadist@gmail.com not found\n";
}
