// blocks/CounterBlock.js
import { BaseBlock } from './BaseBlock.js';

export class CounterBlock extends BaseBlock {
    render() {
        const { start = 0, end = 100, speed = 2, prefix = '', suffix = '%', color = '#8b5cf6' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center',
            fontSize: this.styles.font_size || '32px',
            fontWeight: '700',
            color: color
        });
        return `<div class="ve-block ve-block-counter" data-id="${this.id}" data-type="counter" style="${styleStr}">
            <div class="ve-counter" data-start="${start}" data-end="${end}" data-speed="${speed}" 
                 style="font-size:${this.styles.font_size || '32px'};font-weight:700;color:${color};">
                ${prefix}<span class="counter-number">${start}</span>${suffix}
            </div>
            <script>
                (function() {
                    const el = document.querySelector('.ve-block-counter[data-id="${this.id}"] .ve-counter');
                    if (!el || el.dataset.animated === 'true') return;
                    el.dataset.animated = 'true';
                    const start = parseInt(el.dataset.start) || 0;
                    const end = parseInt(el.dataset.end) || 100;
                    const speed = parseFloat(el.dataset.speed) || 2;
                    const numberSpan = el.querySelector('.counter-number');
                    let current = start;
                    const step = Math.ceil((end - start) / (30 / speed));
                    const interval = setInterval(() => {
                        current += step;
                        if (current >= end) { current = end; clearInterval(interval); }
                        numberSpan.textContent = current;
                    }, 1000 / speed);
                })();
            </script>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'start', label: 'Начальное значение', type: 'number', default: 0 },
            { key: 'end', label: 'Конечное значение', type: 'number', default: 100 },
            { key: 'speed', label: 'Скорость', type: 'number', default: 2 },
            { key: 'prefix', label: 'Префикс', type: 'text', default: '' },
            { key: 'suffix', label: 'Суффикс', type: 'text', default: '%' },
            { key: 'color', label: 'Цвет', type: 'color', default: '#8b5cf6' },
            { key: 'font_size', label: 'Размер шрифта', type: 'text', default: '32px' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        this.content.start = parseInt(values.start) || 0;
        this.content.end = parseInt(values.end) || 100;
        this.content.speed = parseFloat(values.speed) || 2;
        this.content.prefix = values.prefix || '';
        this.content.suffix = values.suffix || '%';
        this.content.color = values.color || '#8b5cf6';
        this.styles.font_size = values.font_size || '32px';
        this.styles.padding = values.padding || '20px';
    }
}