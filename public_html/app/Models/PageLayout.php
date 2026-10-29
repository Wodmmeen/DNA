<?php
namespace App\Models;

class PageLayout
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function findByPageId($pageId)
    {
        $sql = "SELECT data FROM page_layout WHERE page_id = :page_id";
        $result = $this->db->fetch($sql, ['page_id' => $pageId]);
        return $result ? json_decode($result['data'], true) : null;
    }

    public function save($pageId, $data)
    {
        $dataJson = json_encode($data);
        $existing = $this->findByPageId($pageId);
        if ($existing) {
            $sql = "UPDATE page_layout SET data = :data, updated_at = NOW() WHERE page_id = :page_id";
            $this->db->query($sql, ['data' => $dataJson, 'page_id' => $pageId]);
        } else {
            $sql = "INSERT INTO page_layout (page_id, data, created_at, updated_at) VALUES (:page_id, :data, NOW(), NOW())";
            $this->db->query($sql, ['page_id' => $pageId, 'data' => $dataJson]);
        }
    }

    public function getAllPages()
    {
        $sql = "SELECT id, title, slug, is_active FROM pages ORDER BY id";
        return $this->db->fetchAll($sql);
    }

    public function getPageById($pageId)
    {
        $sql = "SELECT id, title, slug FROM pages WHERE id = :id";
        return $this->db->fetch($sql, ['id' => $pageId]);
    }
}