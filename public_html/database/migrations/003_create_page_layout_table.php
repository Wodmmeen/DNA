<?php
return [
    'up' => "
        CREATE TABLE IF NOT EXISTS `page_layout` (
            `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `page_id` INT(11) UNSIGNED NOT NULL,
            `data` LONGTEXT NOT NULL,
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_page_layout_page_id` (`page_id`),
            CONSTRAINT `fk_page_layout_page` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'down' => "DROP TABLE IF EXISTS `page_layout`"
];