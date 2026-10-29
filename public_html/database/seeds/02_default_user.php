<?php
return [
    'users' => [
        [
            'username' => 'admin',
            'email' => getenv('ADMIN_EMAIL'),
            'password' => password_hash(getenv('ADMIN_PASSWORD'), PASSWORD_DEFAULT),
            'role' => 'admin'
        ]
    ]
];