// blocks/ShapeBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ShapeBlock extends BaseBlock {
    render() {
        const { shape = 'square', size = 120, bg_color = '#8b5cf6', border_radius = '12px' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center'
        });

        let shapeCss = '';
        switch (shape) {
            case 'circle':
                shapeCss = 'border-radius:50%;';
                break;
            case 'triangle':
                shapeCss = 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
                break;
            case 'diamond':
                shapeCss = 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);';
                break;
            case 'star':
                shapeCss = 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);';
                break;
            default:
                shapeCss = `border-radius:${border_radius};`;
        }

        return `<div class="ve-block ve-block-shape" data-id="${this.id}" data-type="shape" style="${styleStr}">
            <div class="ve-shape" style="width:${size}px;height:${size}px;background:${bg_color};${shapeCss}margin:0 auto;"></div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'shape', label: 'Форма', type: 'select', options: ['square', 'circle', 'triangle', 'diamond', 'star'], default: 'square' },
            { key: 'size', label: 'Размер', type: 'number', default: 120 },
            { key: 'bg_color', label: 'Цвет', type: 'color', default: '#8b5cf6' },
            { key: 'border_radius', label: 'Скругление (для квадрата)', type: 'text', default: '12px' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right'], default: 'center' }
        ];
    }

    applyProperties(values) {
        this.content.shape = values.shape || 'square';
        this.content.size = parseInt(values.size) || 120;
        this.content.bg_color = values.bg_color || '#8b5cf6';
        this.content.border_radius = values.border_radius || '12px';
        this.styles.padding = values.padding || '20px';
        this.styles.alignment = values.alignment || 'center';
    }
}