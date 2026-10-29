<?php
namespace App\Services;

class Logger
{
    private $logDir;
    private $enabled;

    public function __construct()
    {
        $this->logDir = __DIR__ . '/../../storage/logs/';
        $this->enabled = true;
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }

    private function write($level, $message, $context = [])
    {
        if (!$this->enabled) return;
        $date = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? json_encode($context) : '';
        $log = "[$date] [$level] $message $contextStr" . PHP_EOL;
        $filename = $this->logDir . 'app-' . date('Y-m-d') . '.log';
        file_put_contents($filename, $log, FILE_APPEND | LOCK_EX);
    }

    public function info($message, $context = [])
    {
        $this->write('INFO', $message, $context);
    }

    public function error($message, $context = [])
    {
        $this->write('ERROR', $message, $context);
    }

    public function warning($message, $context = [])
    {
        $this->write('WARNING', $message, $context);
    }

    public function debug($message, $context = [])
    {
        if (getenv('APP_DEBUG') === 'true') {
            $this->write('DEBUG', $message, $context);
        }
    }
}