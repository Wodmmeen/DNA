// core/eventBus.js

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Подписаться на событие
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} функция отписки
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    /**
     * Подписаться на событие один раз
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} функция отписки
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Отписаться от события
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * Эмитить событие
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        const callbacks = [...this.listeners.get(event)];
        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (e) {
                console.error(`❌ Ошибка в обработчике события "${event}":`, e);
            }
        }
    }

    /**
     * Очистить все обработчики (или для конкретного события)
     * @param {string} [event]
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Получить список активных событий (для отладки)
     */
    getListeners() {
        const result = {};
        for (const [event, callbacks] of this.listeners) {
            result[event] = callbacks.length;
        }
        return result;
    }
}

export const eventBus = new EventBus();
export default eventBus;