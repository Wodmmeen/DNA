// blocks/ContainerBlock.js
import { BaseBlock } from './BaseBlock.js';
import { blockRegistry } from './index.js';

export class ContainerBlock extends BaseBlock {
    render() {
        const children = this.content.blocks || [];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            border: this.styles.border || '1px dashed #2a2a3e',
            borderRadius: this.styles.border_radius || '12px',
            minHeight: this.styles.min_height || '100px'
        });
        const childrenHtml = children.map(child => {
            const BlockClass = blockRegistry[child.type];
            if (BlockClass) {
                const instance = new BlockClass(child);
                return instance.render();
            }
            return '';
        }).join('');

        return `<div class="ve-block ve-block-container" data-id="${this.id}" data-type="container" style="${styleStr}">
            <div class="ve-container-children" style="display:flex;flex-wrap:wrap;gap:16px;">
                ${childrenHtml || '<div style="padding:20px;color:#64748b;text-align:center;">Контейнер пуст</div>'}
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'padding', label: 'Отступ', type: 'text', default: '20px' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: 'transparent' },
            { key: 'border', label: 'Граница', type: 'text', default: '1px dashed #2a2a3e' },
            { key: 'border_radius', label: 'Скругление', type: 'text', default: '12px' },
            { key: 'min_height', label: 'Минимальная высота', type: 'text', default: '100px' }
        ];
    }

    applyProperties(values) {
        this.styles.padding = values.padding || '20px';
        this.styles.bg_color = values.bg_color || 'transparent';
        this.styles.border = values.border || '1px dashed #2a2a3e';
        this.styles.border_radius = values.border_radius || '12px';
        this.styles.min_height = values.min_height || '100px';
    }
}