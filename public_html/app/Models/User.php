<?php
namespace App\Models;

class User
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function findByUsernameOrEmail($usernameOrEmail)
    {
        $sql = "SELECT * FROM users WHERE username = :cred OR email = :cred LIMIT 1";
        return $this->db->fetch($sql, ['cred' => $usernameOrEmail]);
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM users WHERE id = :id";
        return $this->db->fetch($sql, ['id' => $id]);
    }

    public function create($data)
    {
        return $this->db->insert('users', $data);
    }

    public function updateLastLogin($userId)
    {
        $sql = "UPDATE users SET last_login_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['id' => $userId]);
    }

    public function updateLoginAttempts($userId, $attempts, $lockTime = null)
    {
        $sql = "UPDATE users SET login_attempts = :attempts, locked_until = :locked WHERE id = :id";
        $this->db->query($sql, ['attempts' => $attempts, 'locked' => $lockTime, 'id' => $userId]);
    }

    public function resetLoginAttempts($userId)
    {
        $sql = "UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = :id";
        $this->db->query($sql, ['id' => $userId]);
    }
}