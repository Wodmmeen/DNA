<?php
return [
    'up' => "
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `username` VARCHAR(100) NOT NULL,
            `email` VARCHAR(255) NOT NULL,
            `password` VARCHAR(255) NOT NULL,
            `role` ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `idx_users_username` (`username`),
            UNIQUE KEY `idx_users_email` (`email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'down' => "DROP TABLE IF EXISTS `users`"
];