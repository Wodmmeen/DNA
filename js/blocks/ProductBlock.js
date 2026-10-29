// blocks/ProductBlock.js
import { BaseBlock } from './BaseBlock.js';

export class ProductBlock extends BaseBlock {
    render() {
        const { image = 'https://picsum.photos/300/200?random=1', title = 'Название товара', price = '1000', buttonText = 'Купить' } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center'
        });
        return `<div class="ve-block ve-block-product" data-id="${this.id}" data-type="product" style="${styleStr}">
            <div style="max-width:320px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2a2a3e;">
                <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(title)}" style="width:100%;aspect-ratio:1;object-fit:cover;">
                <div style="padding:16px;">
                    <h3 style="margin:0 0 8px;font-size:16px;">${this.escapeHtml(title)}</h3>
                    <div style="font-size:24px;font-weight:700;color:#8b5cf6;margin-bottom:12px;">${this.escapeHtml(price)} ₽</div>
                    <button style="width:100%;padding:10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;border-radius:8px;color:white;cursor:pointer;font-weight:600;transition:0.2s;" 
                            onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        ${this.escapeHtml(buttonText)}
                    </button>
                </div>
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'image', label: 'URL изображения', type: 'text', default: 'https://picsum.photos/300/200?random=1' },
            { key: 'title', label: 'Название', type: 'text', default: 'Название товара' },
            { key: 'price', label: 'Цена', type: 'text', default: '1000' },
            { key: 'buttonText', label: 'Текст кнопки', type: 'text', default: 'Купить' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        this.content.image = values.image || 'https://picsum.photos/300/200?random=1';
        this.content.title = values.title || 'Название товара';
        this.content.price = values.price || '1000';
        this.content.buttonText = values.buttonText || 'Купить';
        this.styles.padding = values.padding || '20px';
    }
}