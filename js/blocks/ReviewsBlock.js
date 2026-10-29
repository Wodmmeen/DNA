// blocks/ReviewsBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ReviewsBlock extends BaseBlock {
    render() {
        const items = this.content.items || [
            { name: 'Анна Иванова', rating: 5, text: 'Отличный сервис! Очень довольна результатом.' },
            { name: 'Михаил Петров', rating: 4, text: 'Хорошо, но есть куда расти.' }
        ];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent'
        });

        const itemsHtml = items.map(item =>
            `<div style="padding:16px;background:#1a1a2e;border-radius:12px;margin-bottom:12px;border:1px solid #2a2a3e;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <strong>${this.escapeHtml(item.name)}</strong>
                    <span style="color:#fbbf24;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span>
                </div>
                <p style="color:#94a3b8;margin:0;">${this.escapeHtml(item.text)}</p>
            </div>`
        ).join('');

        return `<div class="ve-block ve-block-reviews" data-id="${this.id}" data-type="reviews" style="${styleStr}">
            <div class="ve-reviews-container">
                ${itemsHtml}
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'items', label: 'Отзывы (Имя|Рейтинг|Текст, каждый с новой строки)', type: 'textarea', default: 'Анна Иванова|5|Отличный сервис! Очень довольна результатом.\nМихаил Петров|4|Хорошо, но есть куда расти.' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        if (values.items) {
            this.content.items = values.items.split('\n').filter(s => s.trim()).map(line => {
                const parts = line.split('|');
                return {
                    name: parts[0]?.trim() || 'Аноним',
                    rating: parseInt(parts[1]) || 5,
                    text: parts[2]?.trim() || 'Отзыв'
                };
            });
        }
        this.styles.padding = values.padding || '20px';
    }
}