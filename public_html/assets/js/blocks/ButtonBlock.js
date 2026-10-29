// blocks/ButtonBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ButtonBlock extends BaseBlock {
    render() {
        const { text = 'Кнопка', link = '#', bg_color = '#8b5cf6', hover_color = '#7c3aed', border_radius = '12px' } = this.content;
        const s = this.styles;
        const styleStr = this.stylesToString({
            padding: s.padding || '20px',
            background: s.bg_color || 'transparent',
            textAlign: s.alignment || 'center'
        });
        return `<div class="ve-block ve-block-button" data-id="${this.id}" data-type="button" style="${styleStr}">
            <a href="${this.escapeHtml(link)}" class="ve-button" 
               style="background:${bg_color};color:${s.color || '#ffffff'};border-radius:${border_radius};padding:12px 24px;text-decoration:none;display:inline-block;font-size:${s.font_size || '14px'};font-weight:500;transition:background 0.2s;"
               onmouseover="this.style.background='${hover_color}'" onmouseout="this.style.background='${bg_color}'">
                ${this.escapeHtml(text)}
            </a>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'text', label: 'Текст кнопки', type: 'text', default: 'Кнопка' },
            { key: 'link', label: 'Ссылка', type: 'text', default: '#' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: '#8b5cf6' },
            { key: 'hover_color', label: 'Цвет при наведении', type: 'color', default: '#7c3aed' },
            { key: 'border_radius', label: 'Скругление', type: 'text', default: '12px' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' },
            { key: 'color', label: 'Цвет текста', type: 'color', default: '#ffffff' },
            { key: 'font_size', label: 'Размер шрифта', type: 'text', default: '14px' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right'], default: 'center' }
        ];
    }

    applyProperties(values) {
        this.content.text = values.text || 'Кнопка';
        this.content.link = values.link || '#';
        this.content.bg_color = values.bg_color || '#8b5cf6';
        this.content.hover_color = values.hover_color || '#7c3aed';
        this.content.border_radius = values.border_radius || '12px';
        this.styles.padding = values.padding || '20px';
        this.styles.color = values.color || '#ffffff';
        this.styles.font_size = values.font_size || '14px';
        this.styles.alignment = values.alignment || 'center';
    }
}