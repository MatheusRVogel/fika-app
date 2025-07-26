// Sistema de Notificações Bonitas
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        // Criar container se não existir
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            persistent = false,
            id = null
        } = options;

        // Gerar ID único se não fornecido
        const notificationId = id || 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Remover notificação existente com mesmo ID
        if (this.notifications.has(notificationId)) {
            this.hide(notificationId);
        }

        // Criar elemento da notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('data-id', notificationId);

        // Ícones para cada tipo
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" type="button">&times;</button>
            ${!persistent ? '<div class="notification-progress"></div>' : ''}
        `;

        // Adicionar event listener para fechar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notificationId);
        });

        // Adicionar ao container
        this.container.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Configurar auto-hide se não for persistente
        let timeoutId = null;
        if (!persistent && duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transitionDuration = duration + 'ms';
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 10);
            }

            timeoutId = setTimeout(() => {
                this.hide(notificationId);
            }, duration);
        }

        // Armazenar referência
        this.notifications.set(notificationId, {
            element: notification,
            timeoutId: timeoutId
        });

        return notificationId;
    }

    hide(notificationId) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        const { element, timeoutId } = notificationData;

        // Cancelar timeout se existir
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Animar saída
        element.classList.add('hide');

        // Remover do DOM após animação
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(notificationId);
        }, 300);
    }

    hideAll() {
        this.notifications.forEach((_, id) => {
            this.hide(id);
        });
    }

    // Métodos de conveniência
    success(message, title = 'Sucesso', options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    error(message, title = 'Erro', options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 7000, // Erros ficam mais tempo
            ...options
        });
    }

    warning(message, title = 'Atenção', options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 6000,
            ...options
        });
    }

    info(message, title = 'Informação', options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }
}

// Criar instância global
window.notifications = new NotificationSystem();

// Substituir alert, confirm e console.error para usar o sistema de notificações
const originalAlert = window.alert;
const originalConsoleError = console.error;

window.alert = function(message) {
    if (window.notifications) {
        window.notifications.info(message, 'Aviso');
    } else {
        originalAlert(message);
    }
};

// Interceptar erros não tratados
window.addEventListener('error', function(event) {
    if (window.notifications) {
        window.notifications.error(
            'Ocorreu um erro inesperado. Tente novamente.',
            'Erro do Sistema',
            { persistent: false, duration: 8000 }
        );
    }
});

// Interceptar promessas rejeitadas
window.addEventListener('unhandledrejection', function(event) {
    if (window.notifications) {
        window.notifications.error(
            'Ocorreu um erro de conexão. Verifique sua internet.',
            'Erro de Conexão',
            { persistent: false, duration: 8000 }
        );
    }
});

// Exportar para uso global
window.showNotification = window.notifications.show.bind(window.notifications);
window.hideNotification = window.notifications.hide.bind(window.notifications);