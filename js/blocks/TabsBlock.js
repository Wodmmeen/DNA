// blocks/TabsBlock.js
import { BaseBlock } from './BaseBlock.js';

export class TabsBlock extends BaseBlock {
    render() {
        const tabs = this.content.tabs || [
            { title: 'Вкладка 1', content: 'Содержимое вкладки 1' },
            { title: 'Вкладка 2', content: 'Содержимое вкладки 2' }
        ];
        const styleStr = this.getFullStyles({
            padding: this.styles.padding || '20px',
            background: this.styles.bg_color || 'transparent'
        });

        const tabsHtml = tabs.map((tab, idx) =>
            `<button class="ve-tab ${idx === 0 ? 'active' : ''}" data-tab="${idx}" style="padding:10px 20px;background:${idx === 0 ? '#8b5cf6' : 'transparent'};border:${idx === 0 ? 'none' : '1px solid #2a2a3e'};border-radius:8px 8px 0 0;color:${idx === 0 ? 'white' : '#94a3b8'};cursor:pointer;transition:0.2s;">
                ${this.escapeHtml(tab.title)}
            </button>`
        ).join('');

        const contentHtml = tabs.map((tab, idx) =>
            `<div class="ve-tab-content" data-tab="${idx}" style="${idx === 0 ? 'display:block;' : 'display:none;'}padding:16px;background:#12121a;border-radius:0 8px 8px 8px;">
                ${this.escapeHtml(tab.content)}
            </div>`
        ).join('');

        const id = this.id;
        const script = `
            <script>
                (function() {
                    const container = document.querySelector('.ve-block-tabs[data-id="${id}"]');
                    if (!container || container.dataset.initialized) return;
                    container.dataset.initialized = true;
                    const tabs = container.querySelectorAll('.ve-tab');
                    const contents = container.querySelectorAll('.ve-tab-content');
                    tabs.forEach((tab, idx) => {
                        tab.onclick = function() {
                            tabs.forEach(t => {
                                t.classList.remove('active');
                                t.style.background = 'transparent';
                                t.style.color = '#94a3b8';
                                t.style.border = '1px solid #2a2a3e';
                            });
                            this.classList.add('active');
                            this.style.background = '#8b5cf6';
                            this.style.color = 'white';
                            this.style.border = 'none';
                            contents.forEach(c => c.style.display = 'none');
                            contents[idx].style.display = 'block';
                        };
                    });
                })();
            <\/script>
        `;

        return `<div class="ve-block ve-block-tabs" data-id="${this.id}" data-type="tabs" style="${styleStr}">
            <div class="ve-tabs-container">
                <div style="display:flex;gap:4px;flex-wrap:wrap;border-bottom:2px solid #2a2a3e;">
                    ${tabsHtml}
                </div>
                <div style="margin-top:-2px;">
                    ${contentHtml}
                </div>
            </div>
            ${script}
        </div>`;
    }

    getProperties() {
        return [
            { key: 'tabs', label: 'Вкладки (заголовок|содержание, каждый с новой строки)', type: 'textarea', default: 'Вкладка 1|Содержимое вкладки 1\nВкладка 2|Содержимое вкладки 2' },
            { key: 'padding', label: 'Отступ блока', type: 'text', default: '20px' }
        ];
    }

    applyProperties(values) {
        if (values.tabs) {
            this.content.tabs = values.tabs.split('\n').filter(s => s.trim()).map(line => {
                const parts = line.split('|');
                return { title: parts[0]?.trim() || 'Вкладка', content: parts[1]?.trim() || 'Содержимое' };
            });
        }
        this.styles.padding = values.padding || '20px';
    }
}