// blocks/ImageBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ImageBlock extends BaseBlock {
    render() {
        const { image_url = '/uploads/placeholder.jpg', alt = '' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center'
        });
        return `<div class="ve-block ve-block-image" data-id="${this.id}" data-type="image" style="${styleStr}">
            <img src="${this.escapeHtml(image_url)}" alt="${this.escapeHtml(alt)}" class="ve-image-content" style="max-width:100%;border-radius:${this.styles.border_radius || '8px'};">
        </div>`;
    }

    getProperties() {
        return [
            { key: 'image_url', label: 'URL изображения', type: 'text', default: '/uploads/placeholder.jpg' },
            { key: 'alt', label: 'Alt текст', type: 'text', default: '' },
            { key: 'padding', label: 'Отступ', type: 'text', default: '20px' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: 'transparent' },
            { key: 'border_radius', label: 'Скругление', type: 'text', default: '8px' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right'], default: 'center' }
        ];
    }

    applyProperties(values) {
        this.content.image_url = values.image_url || '/uploads/placeholder.jpg';
        this.content.alt = values.alt || '';
        this.styles.padding = values.padding || '20px';
        this.styles.bg_color = values.bg_color || 'transparent';
        this.styles.border_radius = values.border_radius || '8px';
        this.styles.alignment = values.alignment || 'center';
    }
}