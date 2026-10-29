// blocks/MapBlock.js
import { BaseBlock } from './BaseBlock.js';

export class MapBlock extends BaseBlock {
    render() {
        const { lat = '55.751244', lng = '37.618423', zoom = 12 } = this.content;
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center'
        });
        return `<div class="ve-block ve-block-map" data-id="${this.id}" data-type="map" style="${styleStr}">
            <iframe src="https://www.google.com/maps/embed/v1/view?key=AIzaSyBFj0YbrH6v2kGdD6y3sp9yw5UKyxUVH5I&center=${lat},${lng}&zoom=${zoom}" 
                    style="width:100%;height:300px;border:none;border-radius:12px;" allowfullscreen></iframe>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'lat', label: 'Широта', type: 'text', default: '55.751244' },
            { key: 'lng', label: 'Долгота', type: 'text', default: '37.618423' },
            { key: 'zoom', label: 'Приближение', type: 'number', default: 12 },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        this.content.lat = values.lat || '55.751244';
        this.content.lng = values.lng || '37.618423';
        this.content.zoom = parseInt(values.zoom) || 12;
        this.styles.padding = values.padding || '20px';
    }
}