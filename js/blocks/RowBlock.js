// blocks/RowBlock.js
import { BaseBlock } from './BaseBlock.js';
import { blockRegistry } from './index.js';

export class RowBlock extends BaseBlock {
    render() {
        const columns = this.content.columns || [[], []];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            gap: this.styles.gap || '20px'
        });
        const colsHtml = columns.map(col => {
            const childrenHtml = col.map(child => {
                const BlockClass = blockRegistry[child.type];
                if (BlockClass) {
                    const instance = new BlockClass(child);
                    return instance.render();
                }
                return '';
            }).join('');
            return `<div class="ve-row-col" style="flex:1;min-width:200px;">
                ${childrenHtml || '<div style="padding:20px;color:#64748b;text-align:center;background:rgba(139,92,246,0.05);border-radius:8px;">Колонка пуста</div>'}
            </div>`;
        }).join('');

        return `<div class="ve-block ve-block-row" data-id="${this.id}" data-type="row" style="${styleStr}">
            <div style="display:flex;flex-wrap:wrap;margin:0 -10px;">
                ${colsHtml}
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'columnsCount', label: 'Количество колонок', type: 'select', options: ['2', '3', '4'], default: '2' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' },
            { key: 'gap', label: 'Отступ между колонками', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        const cols = parseInt(values.columnsCount) || 2;
        if (this.content.columns.length !== cols) {
            const newColumns = [];
            for (let i = 0; i < cols; i++) {
                newColumns.push(this.content.columns[i] || []);
            }
            this.content.columns = newColumns;
        }
        this.styles.padding = values.padding || '20px';
        this.styles.gap = values.gap || '20px';
    }
}