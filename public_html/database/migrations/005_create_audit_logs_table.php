<?php
return [
    'up' => "
        CREATE TABLE IF NOT EXISTS `audit_logs` (
            `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT(11) UNSIGNED DEFAULT NULL,
            `action` VARCHAR(100) NOT NULL,
            `entity` VARCHAR(100) DEFAULT NULL,
            `entity_id` INT(11) DEFAULT NULL,
            `old_value` TEXT DEFAULT NULL,
            `new_value` TEXT DEFAULT NULL,
            `ip_address` VARCHAR(45) DEFAULT NULL,
            `user_agent` TEXT DEFAULT NULL,
            `created_at` DATETIME NOT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_audit_user_id` (`user_id`),
            KEY `idx_audit_action` (`action`),
            KEY `idx_audit_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'down' => "DROP TABLE IF EXISTS `audit_logs`"
];