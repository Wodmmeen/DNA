// core/api.js
import { state, markSaved, markUnsaved } from './state.js';
import { showToast } from '../ui/toolbar.js';
import { renderCanvas } from './renderer.js';

export async function apiRequest(action, data = {}) {
    const formData = new URLSearchParams();
    formData.append('action', action);
    for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
    }

    try {
        const response = await fetch('/admin/editor-api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Ошибка соединения с сервером', 'error');
        return { success: false, error: 'Network error' };
    }
}

export async function saveLayout(publish = false) {
    if (state.isSaving) {
        showToast('Уже сохраняется...', 'info');
        return;
    }
    state.isSaving = true;
    
    const action = publish ? 'publish_page' : 'save_layout';
    const data = {
        page_id: state.pageId,
        data: JSON.stringify({
            blocks: state.blocks,
            global: state.global,
            templates: state.templates
        })
    };
    
    const result = await apiRequest(action, data);
    state.isSaving = false;
    
    if (result.success) {
        markSaved();
        showToast(publish ? '✅ Страница опубликована!' : '✅ Сохранено!', 'success');
        if (typeof updateAutoSaveIndicator === 'function') {
            updateAutoSaveIndicator('saved');
        }
        try {
            localStorage.setItem('ve_last_saved_' + state.pageId, JSON.stringify({
                blocks: state.blocks,
                global: state.global,
                templates: state.templates,
                saved_at: new Date().toISOString()
            }));
        } catch (e) {}
    } else {
        showToast('Ошибка сохранения: ' + (result.error || 'неизвестная'), 'error');
        if (typeof updateAutoSaveIndicator === 'function') {
            updateAutoSaveIndicator('changed');
        }
    }
    return result;
}

export async function loadPage(pageId) {
    const result = await apiRequest('load_page', { page_id: pageId });
    if (result.success && result.data) {
        try {
            const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
            state.blocks = data.blocks || [];
            state.global = data.global || {};
            state.templates = data.templates || [];
            state.pageId = pageId;
            markSaved();
            if (typeof renderCanvas === 'function') {
                renderCanvas();
            }
            showToast('📄 Страница загружена', 'success');
            return result;
        } catch (e) {
            console.error('❌ Ошибка парсинга данных:', e);
            showToast('Ошибка загрузки данных', 'error');
            return { success: false, error: 'Parse error' };
        }
    }
    return result;
}

export async function exportPage() {
    try {
        showToast('📦 Генерация экспорта...', 'info');
        const response = await fetch(`/api/export?page_id=${state.pageId}`, {
            method: 'GET'
        });
        if (!response.ok) throw new Error('Export failed: ' + response.status);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page_${state.pageId}_export.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📦 Архив скачан', 'success');
    } catch (error) {
        console.error('❌ Export error:', error);
        showToast('Ошибка экспорта: ' + error.message, 'error');
    }
}