// ui/modals.js
import { showToast } from './toolbar.js';

export function initModals() {
    const confirmModal = document.getElementById('confirmModal');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeModal = confirmModal?.querySelector('.close-modal');

    let confirmCallback = null;

    window.showConfirm = function(message, callback) {
        if (!confirmModal) return;
        document.getElementById('confirmMessage').textContent = message || 'Вы уверены?';
        confirmModal.classList.add('active');
        confirmCallback = callback;
    };

    const closeConfirm = () => {
        confirmModal?.classList.remove('active');
        confirmCallback = null;
    };

    confirmOk?.addEventListener('click', () => {
        if (confirmCallback) confirmCallback(true);
        closeConfirm();
    });

    confirmCancel?.addEventListener('click', closeConfirm);
    closeModal?.addEventListener('click', closeConfirm);

    const compositeModal = document.getElementById('compositeModal');
    document.getElementById('createCompositeBtn')?.addEventListener('click', () => {
        if (typeof window.CompositeBuilder?.open === 'function') {
            window.CompositeBuilder.open();
        } else {
            showToast('Composite Builder загружается...', 'info');
        }
    });

    document.querySelectorAll('.ve-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.ve-modal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.ve-modal');
            if (modal) modal.classList.remove('active');
        });
    });
}