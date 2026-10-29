// blocks/VideoBlock.js
import { BaseBlock } from './BaseBlock.js';

export class VideoBlock extends BaseBlock {
    render() {
        let url = this.content.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
        }
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent',
            textAlign: this.styles.alignment || 'center'
        });
        return `<div class="ve-block ve-block-video" data-id="${this.id}" data-type="video" style="${styleStr}">
            <div style="position:relative;padding-bottom:56.25%;height:0;max-width:100%;">
                <iframe src="${this.escapeHtml(url)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;" allowfullscreen></iframe>
            </div>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'url', label: 'URL видео (YouTube)', type: 'text', default: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' },
            { key: 'bg_color', label: 'Цвет фона', type: 'color', default: 'transparent' },
            { key: 'alignment', label: 'Выравнивание', type: 'select', options: ['left', 'center', 'right'], default: 'center' }
        ];
    }

    applyProperties(values) {
        this.content.url = values.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        this.styles.padding = values.padding || '20px';
        this.styles.bg_color = values.bg_color || 'transparent';
        this.styles.alignment = values.alignment || 'center';
    }
}