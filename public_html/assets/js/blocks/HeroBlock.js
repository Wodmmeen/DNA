// blocks/HeroBlock.js
import { BaseBlock } from './BaseBlock.js';

export class HeroBlock extends BaseBlock {
    render() {
        const { title = 'Заголовок', subtitle = 'Подзаголовок', button_text = 'Кнопка', button_link = '#', image = '' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '60px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center',
            color: this.styles.text_color || 'inherit'
        });
        const imageHtml = image ? `<div class="ve-hero-image"><img src="${this.escapeHtml(image)}" alt="Hero"></div>` : '';
        return `<div class="ve-block ve-block-hero" data-id="${this.id}" data-type="hero" style="${styleStr}">
            <div class="ve-hero-inner">
                ${imageHtml}
                <h1 class="ve-hero-title">${this.escapeHtml(title)}</h1>
                <p class="ve-hero-subtitle">${this.escapeHtml(subtitle)}</p>
                <a href="${this.escapeHtml(button_link)}" class="ve-hero-button">${this.escapeHtml(button_text)}</a>
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'title', label: 'Заголовок', type: 'text', default: 'Заголовок' },
            { key: 'subtitle', label: 'Подзаголовок', type: 'text', default: 'Подзаголовок' },
            { key: 'button_text', label: 'Текст кнопки', type: 'text', default: 'Кнопка' },
            { key: 'button_link', label: 'Ссылка', type: 'text', default: '#' },
            { key: 'image', label: 'URL изображения', type: 'text', default: '' },
            { key: 'padding', label: 'Отступ', type: 'text', default: '60px' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: 'transparent' },
            { key: 'text_color', label: 'Цвет текста', type: 'color', default: '#ffffff' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right'], default: 'center' }
        ];
    }

    applyProperties(values) {
        this.content.title = values.title || 'Заголовок';
        this.content.subtitle = values.subtitle || 'Подзаголовок';
        this.content.button_text = values.button_text || 'Кнопка';
        this.content.button_link = values.button_link || '#';
        this.content.image = values.image || '';
        this.styles.padding = values.padding || '60px';
        this.styles.bg_color = values.bg_color || 'transparent';
        this.styles.text_color = values.text_color || '#ffffff';
        this.styles.alignment = values.alignment || 'center';
    }
}