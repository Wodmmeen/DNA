<?php
class Project {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getUserProjects($userId) {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getById($id, $userId) {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function create($userId, $name, $slug, $description = null) {
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, name, slug, description, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, $name, $slug, $description]);
        return $this->db->lastInsertId();
    }
    
    public function update($id, $userId, $name, $slug, $description = null) {
        $stmt = $this->db->prepare("UPDATE projects SET name = ?, slug = ?, description = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        return $stmt->execute([$name, $slug, $description, $id, $userId]);
    }
    
    public function delete($id, $userId) {
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
        return $stmt->execute([$id, $userId]);
    }
}