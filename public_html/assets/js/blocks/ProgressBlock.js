// blocks/ProgressBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ProgressBlock extends BaseBlock {
    render() {
        const { value = 50, max = 100, color = '#8b5cf6', label = 'Прогресс' } = this.content;
        const percent = Math.min(100, (value / max) * 100);
        const s = this.styles;
        const styleStr = this.stylesToString({
            padding: s.padding || '20px',
            background: s.bg_color || 'transparent'
        });
        return `<div class="ve-block ve-block-progress" data-id="${this.id}" data-type="progress" style="${styleStr}">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span>${this.escapeHtml(label)}</span>
                <span>${Math.round(percent)}%</span>
            </div>
            <div style="background:#2a2a3e;border-radius:20px;height:24px;overflow:hidden;">
                <div style="width:${percent}%;background:${color};height:100%;border-radius:20px;transition:width 0.3s ease;"></div>
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'label', label: 'Подпись', type: 'text', default: 'Прогресс' },
            { key: 'value', label: 'Значение', type: 'number', default: 50 },
            { key: 'max', label: 'Максимум', type: 'number', default: 100 },
            { key: 'color', label: 'Цвет', type: 'color', default: '#8b5cf6' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        this.content.label = values.label || 'Прогресс';
        this.content.value = parseInt(values.value) || 50;
        this.content.max = parseInt(values.max) || 100;
        this.content.color = values.color || '#8b5cf6';
        this.styles.padding = values.padding || '20px';
    }
}