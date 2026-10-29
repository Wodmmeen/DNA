// blocks/SliderBlock.js
import { BaseBlock } from './BaseBlock.js';

export class SliderBlock extends BaseBlock {
    render() {
        const slides = this.content.slides || [
            { image: 'https://picsum.photos/800/400?random=1', title: 'Слайд 1', text: 'Описание слайда 1' },
            { image: 'https://picsum.photos/800/400?random=2', title: 'Слайд 2', text: 'Описание слайда 2' }
        ];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent'
        });

        const slidesHtml = slides.map((slide, idx) =>
            `<div class="ve-slide" data-index="${idx}" style="${idx === 0 ? 'display:block;' : 'display:none;'}">
                <img src="${this.escapeHtml(slide.image)}" alt="${this.escapeHtml(slide.title)}" style="width:100%;border-radius:12px;">
                <div class="ve-slide-content" style="padding:16px;background:rgba(0,0,0,0.5);color:white;margin-top:-60px;position:relative;z-index:1;border-radius:0 0 12px 12px;">
                    <h3>${this.escapeHtml(slide.title)}</h3>
                    <p>${this.escapeHtml(slide.text)}</p>
                </div>
            </div>`
        ).join('');

        return `<div class="ve-block ve-block-slider" data-id="${this.id}" data-type="slider" style="${styleStr}">
            <div class="ve-slider-container" style="position:relative;overflow:hidden;border-radius:12px;">
                ${slidesHtml}
                <button class="ve-slider-arrow prev" onclick="window.slidePrev('${this.id}')" style="position:absolute;top:50%;left:10px;transform:translateY(-50%);background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;z-index:10;">‹</button>
                <button class="ve-slider-arrow next" onclick="window.slideNext('${this.id}')" style="position:absolute;top:50%;right:10px;transform:translateY(-50%);background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;z-index:10;">›</button>
                <div class="ve-slider-dots" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;">
                    ${slides.map((_, idx) => `<span class="ve-slider-dot${idx === 0 ? ' active' : ''}" data-index="${idx}" style="width:10px;height:10px;border-radius:50%;background:${idx === 0 ? '#8b5cf6' : 'rgba(255,255,255,0.5)'};cursor:pointer;"></span>`).join('')}
                </div>
            </div>
            <script>
                window.slidePrev = function(id) {
                    const container = document.querySelector(\`.ve-block-slider[data-id="\${id}"] .ve-slider-container\`);
                    if (!container) return;
                    const slides = container.querySelectorAll('.ve-slide');
                    const dots = container.querySelectorAll('.ve-slider-dot');
                    let current = 0;
                    slides.forEach((s, i) => { if (s.style.display !== 'none') current = i; });
                    slides.forEach(s => s.style.display = 'none');
                    dots.forEach(d => d.style.background = 'rgba(255,255,255,0.5)');
                    const next = (current - 1 + slides.length) % slides.length;
                    slides[next].style.display = 'block';
                    dots[next].style.background = '#8b5cf6';
                };
                window.slideNext = function(id) {
                    const container = document.querySelector(\`.ve-block-slider[data-id="\${id}"] .ve-slider-container\`);
                    if (!container) return;
                    const slides = container.querySelectorAll('.ve-slide');
                    const dots = container.querySelectorAll('.ve-slider-dot');
                    let current = 0;
                    slides.forEach((s, i) => { if (s.style.display !== 'none') current = i; });
                    slides.forEach(s => s.style.display = 'none');
                    dots.forEach(d => d.style.background = 'rgba(255,255,255,0.5)');
                    const next = (current + 1) % slides.length;
                    slides[next].style.display = 'block';
                    dots[next].style.background = '#8b5cf6';
                };
            </script>
        </div>`;
    }

    getProperties() {
        return [
            { key: 'slides', label: 'Слайды (JSON)', type: 'textarea', default: JSON.stringify([
                { image: 'https://picsum.photos/800/400?random=1', title: 'Слайд 1', text: 'Описание слайда 1' },
                { image: 'https://picsum.photos/800/400?random=2', title: 'Слайд 2', text: 'Описание слайда 2' }
            ], null, 2) },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        try {
            this.content.slides = JSON.parse(values.slides);
        } catch (e) {
            this.content.slides = [{ image: 'https://picsum.photos/800/400', title: 'Слайд', text: 'Описание' }];
        }
        this.styles.padding = values.padding || '20px';
    }
}