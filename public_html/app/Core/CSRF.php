<?php
namespace App\Core;

class CSRF
{
    public static function generate()
    {
        if (empty($_SESSION[env('CSRF_TOKEN_NAME')])) {
            $_SESSION[env('CSRF_TOKEN_NAME')] = bin2hex(random_bytes(32));
        }
        return $_SESSION[env('CSRF_TOKEN_NAME')];
    }

    public static function verify($token)
    {
        if (!isset($_SESSION[env('CSRF_TOKEN_NAME')])) {
            return false;
        }
        return hash_equals($_SESSION[env('CSRF_TOKEN_NAME')], $token);
    }
}