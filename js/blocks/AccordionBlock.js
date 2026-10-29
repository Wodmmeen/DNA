// blocks/AccordionBlock.js
import { BaseBlock } from './BaseBlock.js';

export class AccordionBlock extends BaseBlock {
    render() {
        const items = this.content.items || [
            { title: 'Вопрос 1', content: 'Ответ на вопрос 1' },
            { title: 'Вопрос 2', content: 'Ответ на вопрос 2' }
        ];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent'
        });

        const itemsHtml = items.map((item, idx) =>
            `<div class="ve-accordion-item" style="border:1px solid #2a2a3e;border-radius:8px;margin-bottom:8px;overflow:hidden;">
                <div class="ve-accordion-header" style="padding:12px 16px;background:#1a1a2e;cursor:pointer;display:flex;justify-content:space-between;user-select:none;"
                     onclick="this.closest('.ve-accordion-item').querySelector('.ve-accordion-content').style.display = 
                              this.closest('.ve-accordion-item').querySelector('.ve-accordion-content').style.display === 'block' ? 'none' : 'block';
                              this.querySelector('i').style.transform = this.closest('.ve-accordion-item').querySelector('.ve-accordion-content').style.display === 'block' ? 'rotate(180deg)' : 'rotate(0deg)';">
                    <span>${this.escapeHtml(item.title)}</span>
                    <i class="fas fa-chevron-down" style="transition:transform 0.2s;"></i>
                </div>
                <div class="ve-accordion-content" style="display:none;padding:16px;background:#12121a;">
                    ${this.escapeHtml(item.content)}
                </div>
            </div>`
        ).join('');

        return `<div class="ve-block ve-block-accordion" data-id="${this.id}" data-type="accordion" style="${styleStr}">
            <div class="ve-accordion-container">
                ${itemsHtml}
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'items', label: 'Элементы (заголовок|содержание, каждый с новой строки)', type: 'textarea', default: 'Вопрос 1|Ответ на вопрос 1\nВопрос 2|Ответ на вопрос 2' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        if (values.items) {
            this.content.items = values.items.split('\n').filter(s => s.trim()).map(line => {
                const parts = line.split('|');
                return { title: parts[0]?.trim() || 'Вопрос', content: parts[1]?.trim() || 'Ответ' };
            });
        }
        this.styles.padding = values.padding || '20px';
    }
}