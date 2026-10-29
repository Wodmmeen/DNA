<?php
namespace App\Core;

use App\Models\Database;

class Migration
{
    private $db;
    private $migrationPath;

    public function __construct($container)
    {
        $this->db = $container['db'];
        $this->migrationPath = __DIR__ . '/../../database/migrations/';
        $this->ensureMigrationsTable();
    }

    private function ensureMigrationsTable()
    {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS `migrations` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `migration` VARCHAR(255) NOT NULL,
                `batch` INT NOT NULL,
                `executed_at` DATETIME NOT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function getExecutedMigrations()
    {
        $rows = $this->db->fetchAll("SELECT migration FROM migrations");
        return array_column($rows, 'migration');
    }

    public function run()
    {
        $executed = $this->getExecutedMigrations();
        $files = glob($this->migrationPath . "*.php");
        $batch = time();
        $count = 0;

        foreach ($files as $file) {
            $migrationName = basename($file, '.php');
            if (!in_array($migrationName, $executed)) {
                $migration = require $file;
                if (isset($migration['up'])) {
                    $this->db->query($migration['up']);
                    $this->db->insert('migrations', [
                        'migration' => $migrationName,
                        'batch' => $batch,
                        'executed_at' => date('Y-m-d H:i:s')
                    ]);
                    echo "Migrated: $migrationName\n";
                    $count++;
                }
            }
        }
        echo $count ? "Migration completed ($count migrations)\n" : "Nothing to migrate\n";
    }

    public function rollback($steps = 1)
    {
        $batches = $this->db->fetchAll("SELECT DISTINCT batch FROM migrations ORDER BY batch DESC LIMIT ?", [$steps]);
        $count = 0;
        foreach ($batches as $batch) {
            $migrations = $this->db->fetchAll("SELECT migration FROM migrations WHERE batch = ?", [$batch['batch']]);
            foreach ($migrations as $migration) {
                $file = $this->migrationPath . $migration['migration'] . '.php';
                if (file_exists($file)) {
                    $migrationData = require $file;
                    if (isset($migrationData['down'])) {
                        $this->db->query($migrationData['down']);
                        $this->db->delete('migrations', 'migration = ?', [$migration['migration']]);
                        echo "Rolled back: {$migration['migration']}\n";
                        $count++;
                    }
                }
            }
        }
        echo $count ? "Rollback completed ($count migrations)\n" : "Nothing to rollback\n";
    }
}