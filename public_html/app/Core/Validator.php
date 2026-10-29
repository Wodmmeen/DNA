<?php
namespace App\Core;

class Validator
{
    private $errors = [];

    public function validate($data, $rules)
    {
        $this->errors = [];
        foreach ($rules as $field => $ruleSet) {
            $rulesList = explode('|', $ruleSet);
            foreach ($rulesList as $rule) {
                $this->applyRule($field, $data[$field] ?? null, $rule);
            }
        }
        return empty($this->errors);
    }

    private function applyRule($field, $value, $rule)
    {
        if ($rule === 'required') {
            if (empty($value) && $value !== '0') {
                $this->addError($field, 'Поле обязательно');
            }
        } elseif ($rule === 'email') {
            if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $this->addError($field, 'Неверный формат email');
            }
        } elseif (strpos($rule, 'min:') === 0) {
            $min = (int)substr($rule, 4);
            if (strlen($value) < $min) {
                $this->addError($field, "Минимальная длина $min символов");
            }
        } elseif ($rule === 'csrf') {
            $tokenName = getenv('CSRF_TOKEN_NAME');
            if (!isset($_POST[$tokenName]) || $_POST[$tokenName] !== ($_SESSION[$tokenName] ?? '')) {
                $this->addError($field, 'CSRF токен неверен');
            }
        }
    }

    private function addError($field, $message)
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    public function errors()
    {
        return $this->errors;
    }

    public function firstError($field)
    {
        return isset($this->errors[$field][0]) ? $this->errors[$field][0] : null;
    }
}