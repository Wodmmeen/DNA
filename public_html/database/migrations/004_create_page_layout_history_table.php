<?php
return [
    'up' => "
        CREATE TABLE IF NOT EXISTS `page_layout_history` (
            `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `page_id` INT(11) UNSIGNED NOT NULL,
            `data` LONGTEXT NOT NULL,
            `user_id` INT(11) UNSIGNED DEFAULT NULL,
            `created_at` DATETIME NOT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_history_page_id` (`page_id`),
            CONSTRAINT `fk_history_page` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'down' => "DROP TABLE IF EXISTS `page_layout_history`"
];