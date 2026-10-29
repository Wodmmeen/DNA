<?php
namespace App\Core;

use App\Models\Database;

class Seeder
{
    private $db;
    private $seedPath;

    public function __construct($container)
    {
        $this->db = $container['db'];
        $this->seedPath = __DIR__ . '/../../database/seeds/';
    }

    public function run()
    {
        $files = glob($this->seedPath . "*.php");
        $count = 0;
        foreach ($files as $file) {
            $data = require $file;
            foreach ($data as $table => $rows) {
                foreach ($rows as $row) {
                    $existing = $this->db->fetch("SELECT 1 FROM $table WHERE email = ? OR username = ?", 
                        [$row['email'] ?? '', $row['username'] ?? '']);
                    if (!$existing) {
                        $this->db->insert($table, $row);
                        $count++;
                    }
                }
            }
        }
        echo "Seeded $count records\n";
    }
}