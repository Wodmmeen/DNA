// blocks/TextBlock.js
import { BaseBlock } from './BaseBlock.js';

export class TextBlock extends BaseBlock {
    render() {
        const { text = 'Введите ваш текст здесь...' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'left',
            color: this.styles.color || '#ffffff',
            fontSize: this.styles.font_size || '16px',
            fontFamily: this.styles.font_family || 'inherit'
        });
        return `<div class="ve-block ve-block-text" data-id="${this.id}" data-type="text" style="${styleStr}">
            <div class="ve-text-editable" contenteditable="true">${this.escapeHtml(text)}</div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'text', label: 'Текст', type: 'textarea', default: 'Введите ваш текст здесь...' },
            { key: 'padding', label: 'Отступ', type: 'text', default: '20px' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: 'transparent' },
            { key: 'color', label: 'Цвет текста', type: 'color', default: '#ffffff' },
            { key: 'font_size', label: 'Размер шрифта', type: 'text', default: '16px' },
            { key: 'font_family', label: 'Шрифт', type: 'text', default: '' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right', 'justify'], default: 'left' }
        ];
    }

    applyProperties(values) {
        this.content.text = values.text || 'Введите ваш текст здесь...';
        this.styles.padding = values.padding || '20px';
        this.styles.bg_color = values.bg_color || 'transparent';
        this.styles.color = values.color || '#ffffff';
        this.styles.font_size = values.font_size || '16px';
        this.styles.font_family = values.font_family || '';
        this.styles.alignment = values.alignment || 'left';
    }
}