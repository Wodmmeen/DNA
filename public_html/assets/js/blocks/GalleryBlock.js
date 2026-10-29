// blocks/GalleryBlock.js
import { BaseBlock } from './BaseBlock.js';

export class GalleryBlock extends BaseBlock {
    render() {
        const images = this.content.images || [
            'https://picsum.photos/200/150?random=1',
            'https://picsum.photos/200/150?random=2',
            'https://picsum.photos/200/150?random=3',
            'https://picsum.photos/200/150?random=4'
        ];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent'
        });
        const cols = this.styles.columns || 4;
        const gridHtml = images.map(img =>
            `<div class="ve-gallery-item" style="overflow:hidden;border-radius:8px;aspect-ratio:1;">
                <img src="${this.escapeHtml(img)}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;" 
                     onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            </div>`
        ).join('');

        return `<div class="ve-block ve-block-gallery" data-id="${this.id}" data-type="gallery" style="${styleStr}">
            <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;">
                ${gridHtml}
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'images', label: 'URL изображений (каждый с новой строки)', type: 'textarea', default: 'https://picsum.photos/200/150?random=1\nhttps://picsum.photos/200/150?random=2\nhttps://picsum.photos/200/150?random=3\nhttps://picsum.photos/200/150?random=4' },
            { key: 'columns', label: 'Количество колонок', type: 'select', options: ['2', '3', '4', '5'], default: '4' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        this.content.images = values.images ? values.images.split('\n').filter(s => s.trim()) : [];
        this.styles.columns = parseInt(values.columns) || 4;
        this.styles.padding = values.padding || '20px';
    }
}