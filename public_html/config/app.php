<?php
return [
    'name' => getenv('APP_NAME'),
    'env' => getenv('APP_ENV'),
    'debug' => filter_var(getenv('APP_DEBUG'), FILTER_VALIDATE_BOOLEAN),
    'url' => getenv('APP_URL'),
    'secret_key' => getenv('SECRET_KEY'),
    'csrf_token_name' => getenv('CSRF_TOKEN_NAME'),
    'session_lifetime' => (int)getenv('SESSION_LIFETIME'),
    'login_max_attempts' => (int)getenv('LOGIN_MAX_ATTEMPTS'),
    'login_decay_minutes' => (int)getenv('LOGIN_DECAY_MINUTES'),
];