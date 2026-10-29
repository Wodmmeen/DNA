// blocks/BaseBlock.js
export class BaseBlock {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.content = data.content || {};
        this.styles = data.styles || {};
        this.responsive = data.responsive || {};
        // Режим позиционирования прокидывается из renderer.js
        this.positionMode = (typeof window !== 'undefined' && window.state)
            ? window.state.positionMode
            : 'flow';
    }

    render() {
        return `<div class="ve-block ve-block-${this.type}" data-id="${this.id}" data-type="${this.type}" style="${this.getFullStyles()}">
            <div class="ve-block-content">Блок ${this.type}</div>
        </div>`;
    }

    /**
     * Формирует строку CSS-стилей с учётом режима позиционирования
     */
    getFullStyles(extraStyles = {}) {
        const s = { ...this.styles, ...extraStyles };
        const isFree = this.positionMode === 'free';
        const parts = [];

        // ===== ПОЗИЦИОНИРОВАНИЕ =====
        if (isFree) {
            parts.push('position: absolute');
            if (s.left !== undefined && s.left !== null) {
                parts.push(`left: ${typeof s.left === 'number' ? s.left + 'px' : s.left}`);
            }
            if (s.top !== undefined && s.top !== null) {
                parts.push(`top: ${typeof s.top === 'number' ? s.top + 'px' : s.top}`);
            }
            if (s.width !== undefined && s.width !== null) {
                parts.push(`width: ${typeof s.width === 'number' ? s.width + 'px' : s.width}`);
            }
            if (s.height !== undefined && s.height !== null) {
                parts.push(`height: ${typeof s.height === 'number' ? s.height + 'px' : s.height}`);
            }
        } else {
            // FLOW — блоки идут вертикально, ширина 100%
            parts.push('position: relative');
            parts.push('width: 100%');
            parts.push('left: auto');
            parts.push('top: auto');
            parts.push('height: auto');
        }

        if (s.rotate !== undefined && s.rotate !== null && s.rotate !== 0) {
            parts.push(`transform: rotate(${s.rotate}deg)`);
        }

        if (s.zIndex !== undefined && s.zIndex !== null) {
            parts.push(`z-index: ${s.zIndex}`);
        }
        if (s.opacity !== undefined && s.opacity !== null) {
            parts.push(`opacity: ${s.opacity}`);
        }

        // ===== ОСТАЛЬНЫЕ СТИЛИ =====
        const styleMap = {
            padding: 'padding',
            margin: 'margin',
            bg_color: 'background',
            background: 'background',
            color: 'color',
            text_color: 'color',
            font_size: (v) => `font-size: ${typeof v === 'number' ? v + 'px' : v}`,
            font_family: 'font-family',
            font_weight: 'font-weight',
            alignment: 'text-align',
            border: 'border',
            border_radius: (v) => `border-radius: ${typeof v === 'number' ? v + 'px' : v}`,
            box_shadow: 'box-shadow',
            gap: 'gap',
            min_height: (v) => `min-height: ${typeof v === 'number' ? v + 'px' : v}`,
            min_width: (v) => `min-width: ${typeof v === 'number' ? v + 'px' : v}`,
            overflow: 'overflow'
        };

        for (const [key, value] of Object.entries(s)) {
            // Пропускаем уже обработанные
            if (['position', 'left', 'top', 'width', 'height', 'rotate', 'zIndex', 'z_index', 'opacity'].includes(key)) continue;
            if (value === undefined || value === null || value === '') continue;

            const rule = styleMap[key];
            if (typeof rule === 'function') {
                parts.push(rule(value));
            } else if (typeof rule === 'string') {
                parts.push(`${rule}: ${value}`);
            }
        }

        return parts.join('; ');
    }

    getProperties() {
        return [];
    }

    applyProperties(values) {
        // Переопределяется в наследниках
    }

    exportHTML() {
        return this.render();
    }

    exportCSS() {
        return '';
    }

    exportJS() {
        return '';
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
    }

    stylesToString(styles) {
        return Object.entries(styles)
            .filter(([_, val]) => val !== undefined && val !== null && val !== '')
            .map(([key, val]) => `${key.replace(/_/g, '-')}: ${val};`)
            .join(' ');
    }
}