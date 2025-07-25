// FIKAH App - Modern JavaScript Implementation
class FikahApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentUser = null;
        this.posts = [];
        this.stories = [];
        this.chats = [];
        this.notifications = [];
        this.exploreUsers = [];
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize data
        await this.loadInitialData();
        
        // Initialize dark mode
        this.initializeDarkMode();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide loading screen and show app
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showApp();
        }, 2000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
    }

    showApp() {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.opacity = '1';
        }
    }

    async loadInitialData() {
        // Load mock data
        this.posts = this.generateMockPosts();
        this.stories = this.generateMockStories();
        this.chats = this.generateMockChats();
        this.exploreUsers = this.generateMockExploreUsers();
        
        // Render initial content
        this.renderPosts();
        this.renderChats();
        this.renderExploreUsers();
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Proximity filter
        document.querySelectorAll('.filter-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-toggle').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterByProximity(e.currentTarget.dataset.filter);
            });
        });

        // Proximity dropdown for mobile
        const proximityDropdown = document.getElementById('proximity-dropdown');
        const proximityDropdownBtn = document.getElementById('proximity-dropdown-btn');
        const proximityDropdownMenu = document.getElementById('proximity-dropdown-menu');
        
        if (proximityDropdownBtn && proximityDropdownMenu) {
            proximityDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                proximityDropdown.classList.toggle('open');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!proximityDropdown.contains(e.target)) {
                    proximityDropdown.classList.remove('open');
                }
            });

            // Handle dropdown item clicks
            document.querySelectorAll('.proximity-dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Update active state
                    document.querySelectorAll('.proximity-dropdown-item').forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    // Update button text and icon
                    const selectedFilter = e.currentTarget.dataset.filter;
                    const selectedText = e.currentTarget.querySelector('span').textContent;
                    const selectedIcon = e.currentTarget.querySelector('svg').cloneNode(true);
                    
                    const btnSpan = proximityDropdownBtn.querySelector('span');
                    const btnIcon = proximityDropdownBtn.querySelector('svg');
                    
                    if (btnSpan && btnIcon) {
                        btnSpan.textContent = selectedText;
                        btnIcon.replaceWith(selectedIcon);
                        
                        // Re-add the dropdown arrow
                        const dropdownArrow = document.createElement('svg');
                        dropdownArrow.setAttribute('width', '12');
                        dropdownArrow.setAttribute('height', '12');
                        dropdownArrow.setAttribute('viewBox', '0 0 24 24');
                        dropdownArrow.setAttribute('fill', 'none');
                        dropdownArrow.setAttribute('stroke', 'currentColor');
                        dropdownArrow.setAttribute('stroke-width', '2');
                        dropdownArrow.innerHTML = '<polyline points="6,9 12,15 18,9"></polyline>';
                        proximityDropdownBtn.appendChild(dropdownArrow);
                    }
                    
                    // Close dropdown
                    proximityDropdown.classList.remove('open');
                    
                    // Apply filter
                    this.filterByProximity(selectedFilter);
                });
            });
        }

        // Premium button
        document.getElementById('premium-btn')?.addEventListener('click', () => {
            this.showPremiumModal();
        });

        // Create post button
        document.getElementById('create-post-btn')?.addEventListener('click', () => {
            this.showCreatePostModal();
        });

        // Filter menu toggle
        const filterMenuBtn = document.getElementById('filter-menu-btn');
        const exploreFilters = document.getElementById('explore-filters');
        
        if (filterMenuBtn && exploreFilters) {
            filterMenuBtn.addEventListener('click', () => {
                const isVisible = exploreFilters.classList.contains('show');
                if (isVisible) {
                    exploreFilters.classList.remove('show');
                    filterMenuBtn.classList.remove('active');
                } else {
                    exploreFilters.classList.add('show');
                    filterMenuBtn.classList.add('active');
                }
            });
        }

        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                const section = e.target.closest('.filter-section');
                if (section) {
                    // Remove active from other buttons in the same section
                    section.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Add active to clicked button
                    e.target.classList.add('active');
                }
            }
        });

        // Clear filters
        const clearFiltersBtn = document.querySelector('.clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Set default active states
                document.querySelector('[data-filter="all"]')?.classList.add('active');
                this.showNotification('Filtros limpos', 'success');
            });
        }

        // Apply filters
        const applyFiltersBtn = document.querySelector('.apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyExploreFilters();
                exploreFilters.classList.remove('show');
                filterMenuBtn.classList.remove('active');
                this.showNotification('Filtros aplicados', 'success');
            });
        }

        // Dark mode toggle
        document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });
        
        // Stories
        this.setupStories();
        
        // Posts
        this.setupPosts();
        
        // Messages
        this.setupMessages();
        
        // Profile
        this.setupProfile();
        
        // Search
        this.setupSearch();
        
        // Notifications
        this.setupNotifications();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn[data-screen]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.navigateToScreen(screen);
            });
        });

        // Profile avatar click
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            profileAvatar.addEventListener('click', () => {
                this.navigateToScreen('profile');
            });
        }
    }

    navigateToScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Update navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const activeNavBtn = document.querySelector(`.nav-btn[data-screen="${screenName}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }

        // Show/hide proximity filter based on screen
        const headerCenter = document.querySelector('.header-center');
        const createPostBtn = document.querySelector('.create-post-btn');
        
        if (headerCenter) {
            if (screenName === 'home') {
                headerCenter.style.display = 'flex';
                // Make button circular on home screen
                if (createPostBtn) {
                    createPostBtn.style.borderRadius = '50%';
                    createPostBtn.style.width = '48px';
                    createPostBtn.style.height = '48px';
                }
            } else {
                headerCenter.style.display = 'none';
                // Make button rounded on other screens
                if (createPostBtn) {
                    createPostBtn.style.borderRadius = '16px';
                    createPostBtn.style.width = '56px';
                    createPostBtn.style.height = '56px';
                }
            }
        }

        this.currentScreen = screenName;
    }

    setupStories() {
        const storyItems = document.querySelectorAll('.story-item[data-story-id]');
        storyItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const storyId = e.currentTarget.dataset.storyId;
                this.openStory(storyId);
            });
        });

        // Story viewer close
        const closeStoryBtn = document.getElementById('close-story');
        if (closeStoryBtn) {
            closeStoryBtn.addEventListener('click', () => {
                this.closeStory();
            });
        }
    }

    openStory(storyId) {
        const story = this.stories.find(s => s.id == storyId);
        if (!story) return;

        const storyViewer = document.getElementById('story-viewer');
        const storyUserAvatar = document.getElementById('story-user-avatar');
        const storyUserName = document.getElementById('story-user-name');
        const storyImage = document.getElementById('story-image');

        if (storyViewer && storyUserAvatar && storyUserName && storyImage) {
            storyUserAvatar.src = story.avatar;
            storyUserName.textContent = story.name;
            storyImage.src = story.image;
            
            storyViewer.classList.remove('hidden');
            
            // Animate progress bar
            this.animateStoryProgress();
        }
    }

    closeStory() {
        const storyViewer = document.getElementById('story-viewer');
        if (storyViewer) {
            storyViewer.classList.add('hidden');
        }
    }

    animateStoryProgress() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 100);
            
            // Auto close after 5 seconds
            setTimeout(() => {
                this.closeStory();
            }, 5000);
        }
    }

    setupPosts() {
        // Like buttons will be added dynamically when posts are rendered
    }

    renderPosts() {
        const postsContainer = document.getElementById('posts-container');
        if (!postsContainer) return;

        postsContainer.innerHTML = '';

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <img src="${post.avatar}" alt="${post.name}" class="post-avatar">
                    <div class="post-user-details">
                        <h4>${post.name}</h4>
                        <div class="post-location">${post.location}</div>
                        <div class="post-time">${post.time}</div>
                    </div>
                </div>
                <button class="post-options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                </button>
            </div>
            <img src="${post.image}" alt="Post" class="post-image">
            <div class="post-content">
                <div class="post-text">${post.text}</div>
                <div class="post-actions">
                    <button class="action-btn like-btn" data-post-id="${post.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${post.likes}</span>
                    </button>
                    <button class="action-btn comment-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${post.comments}</span>
                    </button>
                </div>
                <div class="post-stats">
                    ${post.likes} curtidas • ${post.comments} comentários
                </div>
            </div>
        `;

        // Add like functionality
        const likeBtn = postDiv.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            this.toggleLike(post.id, e.currentTarget);
        });

        return postDiv;
    }

    toggleLike(postId, button) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        post.liked = !post.liked;
        
        if (post.liked) {
            post.likes++;
            button.classList.add('liked');
            button.style.color = 'var(--primary-color)';
        } else {
            post.likes--;
            button.classList.remove('liked');
            button.style.color = '';
        }

        const likeCount = button.querySelector('span');
        if (likeCount) {
            likeCount.textContent = post.likes;
        }

        // Update stats
        const postElement = button.closest('.post');
        const statsElement = postElement.querySelector('.post-stats');
        if (statsElement) {
            statsElement.textContent = `${post.likes} curtidas • ${post.comments} comentários`;
        }
    }

    setupMessages() {
        // Back to messages button
        const backBtn = document.getElementById('back-to-messages');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.navigateToScreen('messages');
            });
        }

        // Send message
        const sendBtn = document.getElementById('send-message');
        const messageInput = document.getElementById('message-input');
        
        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    renderChats() {
        const chatsContainer = document.getElementById('chats-container');
        if (!chatsContainer) return;

        chatsContainer.innerHTML = '';

        this.chats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            chatsContainer.appendChild(chatElement);
        });
    }

    createChatElement(chat) {
        const chatDiv = document.createElement('div');
        chatDiv.className = 'chat-item';
        chatDiv.innerHTML = `
            <div class="chat-avatar">
                <img src="${chat.avatar}" alt="${chat.name}">
                ${chat.online ? '<div class="online-indicator"></div>' : ''}
            </div>
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-last-message">${chat.lastMessage}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${chat.time}</div>
                ${chat.unread > 0 ? `<div class="message-badge">${chat.unread}</div>` : ''}
            </div>
        `;

        chatDiv.addEventListener('click', () => {
            this.openChat(chat);
        });

        return chatDiv;
    }

    openChat(chat) {
        // Update chat header
        const chatUserAvatar = document.getElementById('chat-user-avatar');
        const chatUserName = document.getElementById('chat-user-name');
        
        if (chatUserAvatar && chatUserName) {
            chatUserAvatar.src = chat.avatar;
            chatUserName.textContent = chat.name;
        }

        // Load messages
        this.loadChatMessages(chat.id);
        
        // Navigate to chat screen
        this.navigateToScreen('chat');
    }

    loadChatMessages(chatId) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        // Mock messages
        const messages = [
            { id: 1, text: 'Oi! Como você está?', sent: false, time: '14:30', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
            { id: 2, text: 'Oi! Estou bem, obrigado! E você?', sent: true, time: '14:32' },
            { id: 3, text: 'Também estou bem! Que bom te ver por aqui 😊', sent: false, time: '14:33', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
            { id: 4, text: 'Que tal nos encontrarmos para um café?', sent: true, time: '14:35' },
            { id: 5, text: 'Adoraria! Quando você está livre?', sent: false, time: '14:36', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' }
        ];

        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sent ? 'sent' : 'received'}`;
        
        messageDiv.innerHTML = `
            ${!message.sent ? `<img src="${message.avatar}" alt="Avatar" class="message-avatar">` : ''}
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${message.time}</div>
            </div>
        `;

        return messageDiv;
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const messagesContainer = document.getElementById('messages-container');
        
        if (!messageInput || !messagesContainer) return;
        
        const text = messageInput.value.trim();
        if (!text) return;

        const message = {
            id: Date.now(),
            text: text,
            sent: true,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);

        // Clear input
        messageInput.value = '';

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Show notification
        this.showNotification('Mensagem enviada!', 'success');
    }

    setupProfile() {
        // Profile buttons
        const editProfileBtn = document.querySelector('.profile-btn.primary');
        const settingsBtn = document.querySelector('.profile-btn.secondary');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showNotification('Funcionalidade em desenvolvimento', 'info');
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showNotification('Configurações em desenvolvimento', 'info');
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('explore-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchUsers(e.target.value);
            });
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                e.currentTarget.classList.add('active');
                
                this.filterExploreUsers(e.currentTarget.textContent);
            });
        });
    }

    searchUsers(query) {
        const filteredUsers = this.exploreUsers.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.location.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderExploreUsers(filteredUsers);
    }

    filterExploreUsers(filter) {
        let filteredUsers = [...this.exploreUsers];
        
        switch(filter) {
            case 'Online':
                filteredUsers = filteredUsers.filter(user => user.online);
                break;
            case 'Próximos':
                filteredUsers = filteredUsers.filter(user => user.distance < 5);
                break;
            default:
                // Show all
                break;
        }
        
        this.renderExploreUsers(filteredUsers);
    }

    renderExploreUsers(users = this.exploreUsers) {
        const exploreGrid = document.getElementById('explore-grid');
        if (!exploreGrid) return;

        exploreGrid.innerHTML = '';

        users.forEach(user => {
            const userElement = this.createExploreUserElement(user);
            exploreGrid.appendChild(userElement);
        });
    }

    createExploreUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'explore-card';
        userDiv.innerHTML = `
            <img src="${user.image}" alt="${user.name}" class="explore-card-image">
            <div class="explore-card-content">
                <div class="explore-card-name">${user.name}</div>
                <div class="explore-card-info">${user.age} anos • ${user.location}</div>
                <div class="explore-card-tags">
                    ${user.interests.map(interest => `<span class="tag">${interest}</span>`).join('')}
                </div>
            </div>
        `;

        userDiv.addEventListener('click', () => {
            this.showUserProfile(user);
        });

        return userDiv;
    }

    showUserProfile(user) {
        this.showNotification(`Visualizando perfil de ${user.name}`, 'info');
    }

    setupNotifications() {
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    showNotifications() {
        this.showNotification('3 novas curtidas no seu perfil!', 'info');
        this.showNotification('Ana Silva visualizou seu story', 'info');
        this.showNotification('Você tem um novo match!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.querySelector('.notifications-container') || 
                         this.createNotificationContainer();
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    }

    // New methods for added features
    filterByProximity(filter) {
        console.log(`Filtering posts by: ${filter}`);
        this.showNotification(`Mostrando posts: ${filter === 'all' ? 'Todos' : 'Próximos'}`, 'info');
        
        // Here you would implement the actual filtering logic
        // For now, we'll just show a notification
        if (filter === 'nearby') {
            // Filter posts by proximity
            this.renderPosts(this.posts.filter(post => post.distance && post.distance < 5));
        } else {
            // Show all posts
            this.renderPosts(this.posts);
        }
    }

    async showPremiumModal() {
        // Verificar status atual da assinatura
        let subscriptionStatus = null;
        try {
            subscriptionStatus = await PaymentService.getSubscriptionStatus();
        } catch (error) {
            console.error('Erro ao verificar assinatura:', error);
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        if (subscriptionStatus && subscriptionStatus.isPremium) {
            // Usuário já é premium - mostrar gerenciamento de assinatura
            modal.innerHTML = `
                <div class="modal-content premium-modal">
                    <div class="modal-header">
                        <h2>FIKAH Premium ⭐</h2>
                        <button class="close-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="premium-status">
                            <div class="status-badge active">
                                <span class="status-icon">✅</span>
                                <span>Assinatura Ativa</span>
                            </div>
                            ${subscriptionStatus.subscription ? `
                                <div class="subscription-details">
                                    <p><strong>Status:</strong> ${subscriptionStatus.subscription.status}</p>
                                    <p><strong>Próxima cobrança:</strong> ${new Date(subscriptionStatus.subscription.current_period_end * 1000).toLocaleDateString('pt-BR')}</p>
                                    ${subscriptionStatus.subscription.cancel_at_period_end ? 
                                        '<p class="cancel-notice">⚠️ Sua assinatura será cancelada no final do período atual</p>' : 
                                        ''
                                    }
                                </div>
                            ` : ''}
                        </div>
                        <div class="premium-features">
                            <div class="feature-item active">
                                <span class="feature-icon">⭐</span>
                                <span>Curtidas ilimitadas</span>
                            </div>
                            <div class="feature-item active">
                                <span class="feature-icon">🔥</span>
                                <span>Super Likes diários</span>
                            </div>
                            <div class="feature-item active">
                                <span class="feature-icon">👑</span>
                                <span>Perfil em destaque</span>
                            </div>
                            <div class="feature-item active">
                                <span class="feature-icon">📍</span>
                                <span>Localização global</span>
                            </div>
                        </div>
                        ${!subscriptionStatus.subscription?.cancel_at_period_end ? `
                            <button class="cancel-subscription-btn">Cancelar Assinatura</button>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // Usuário não é premium - mostrar opções de assinatura
            modal.innerHTML = `
                <div class="modal-content premium-modal">
                    <div class="modal-header">
                        <h2>FIKAH Premium</h2>
                        <button class="close-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="premium-features">
                            <div class="feature-item">
                                <span class="feature-icon">⭐</span>
                                <span>Curtidas ilimitadas</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🔥</span>
                                <span>Super Likes diários</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">👑</span>
                                <span>Perfil em destaque</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">📍</span>
                                <span>Localização global</span>
                            </div>
                        </div>
                        
                        <div class="premium-plans">
                            <div class="plan-option" data-plan="monthly">
                                <div class="plan-header">
                                    <h3>Mensal</h3>
                                    <div class="plan-price">
                                        <span class="price">R$ 19,99</span>
                                        <span class="period">/mês</span>
                                    </div>
                                </div>
                                <p class="plan-desc">Cancele quando quiser</p>
                                <button class="premium-btn-subscribe" data-plan="monthly">
                                    Assinar Mensal
                                </button>
                            </div>
                            
                            <div class="plan-option recommended" data-plan="yearly">
                                <div class="plan-badge">Mais Popular</div>
                                <div class="plan-header">
                                    <h3>Anual</h3>
                                    <div class="plan-price">
                                        <span class="price">R$ 199,99</span>
                                        <span class="period">/ano</span>
                                    </div>
                                </div>
                                <p class="plan-desc">Economize ~17% • R$ 16,66/mês</p>
                                <button class="premium-btn-subscribe primary" data-plan="yearly">
                                    Assinar Anual
                                </button>
                            </div>
                        </div>
                        
                        <div class="premium-footer">
                            <p class="terms">Ao assinar, você concorda com nossos <a href="#" target="_blank">Termos de Uso</a></p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Botões de assinatura
        modal.querySelectorAll('.premium-btn-subscribe').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const planType = e.target.dataset.plan;
                btn.disabled = true;
                btn.textContent = 'Processando...';
                
                try {
                    await PaymentService.redirectToCheckout(planType);
                } catch (error) {
                    console.error('Erro no checkout:', error);
                    btn.disabled = false;
                    btn.textContent = planType === 'monthly' ? 'Assinar Mensal' : 'Assinar Anual';
                    PaymentService.showPaymentError('Erro ao processar pagamento. Tente novamente.');
                }
            });
        });
        
        // Botão de cancelar assinatura
        const cancelBtn = modal.querySelector('.cancel-subscription-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja cancelar sua assinatura? Você manterá o acesso até o final do período atual.')) {
                    cancelBtn.disabled = true;
                    cancelBtn.textContent = 'Cancelando...';
                    
                    try {
                        await PaymentService.cancelSubscription();
                        PaymentService.showPaymentSuccess('Assinatura cancelada com sucesso');
                        modal.remove();
                    } catch (error) {
                        console.error('Erro ao cancelar:', error);
                        cancelBtn.disabled = false;
                        cancelBtn.textContent = 'Cancelar Assinatura';
                        PaymentService.showPaymentError('Erro ao cancelar assinatura. Tente novamente.');
                    }
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showCreatePostModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content create-post-modal">
                <div class="modal-header">
                    <h2>Criar Post</h2>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <textarea placeholder="O que você está pensando?" class="post-textarea" maxlength="280"></textarea>
                    <div class="post-options">
                        <button class="option-btn">📷 Foto</button>
                        <button class="option-btn">📍 Localização</button>
                        <button class="option-btn">😊 Emoji</button>
                    </div>
                    <div class="char-count">
                        <span class="current">0</span>/<span class="max">280</span>
                    </div>
                    <button class="publish-btn" disabled>Publicar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const textarea = modal.querySelector('.post-textarea');
        const charCount = modal.querySelector('.current');
        const publishBtn = modal.querySelector('.publish-btn');
        
        textarea.addEventListener('input', (e) => {
            const length = e.target.value.length;
            charCount.textContent = length;
            publishBtn.disabled = length === 0;
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        publishBtn.addEventListener('click', () => {
            const content = textarea.value.trim();
            if (content) {
                this.createPost(content);
                this.showNotification('Post publicado com sucesso!', 'success');
                modal.remove();
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createPost(content) {
        const newPost = {
            id: Date.now().toString(),
            user: {
                name: 'Você',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            },
            content: content,
            image: null,
            likes: 0,
            liked: false,
            time: 'agora',
            distance: Math.floor(Math.random() * 10) + 1
        };
        
        this.posts.unshift(newPost);
        this.renderPosts(this.posts);
    }

    toggleDarkMode(enabled) {
        if (enabled) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
        
        this.showNotification(`Modo ${enabled ? 'escuro' : 'claro'} ativado`, 'info');
    }

    applyExploreFilters() {
        const activeFilters = {};
        
        // Get active filters from each section
        document.querySelectorAll('.filter-section').forEach(section => {
            const sectionTitle = section.querySelector('h4').textContent.toLowerCase();
            const activeBtn = section.querySelector('.filter-btn.active');
            if (activeBtn) {
                activeFilters[sectionTitle] = activeBtn.dataset.filter;
            }
        });
        
        console.log('Filtros aplicados:', activeFilters);
        
        // Here you would typically filter the explore grid based on the selected filters
        // For now, we'll just re-render the grid
        this.renderExploreGrid();
    }

    initializeDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const toggle = document.getElementById('dark-mode-toggle');
        
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (toggle) toggle.checked = true;
        }
    }

    // Mock Data Generators
    generateMockPosts() {
        return [
            {
                id: 1,
                name: 'Mariana Costa',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                location: 'Copacabana, Rio de Janeiro',
                time: '2h',
                image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
                text: 'Aproveitando o fim de semana na praia! ☀️🌊 Quem mais ama esses momentos de paz?',
                likes: 127,
                comments: 15,
                liked: false
            },
            {
                id: 2,
                name: 'Rafael Santos',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                location: 'Vila Madalena, São Paulo',
                time: '4h',
                image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
                text: 'Noite incrível com os amigos! 🎉 Vida noturna de SP é sempre surpreendente.',
                likes: 89,
                comments: 8,
                liked: false
            },
            {
                id: 3,
                name: 'Ana Silva',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                location: 'Ipanema, Rio de Janeiro',
                time: '6h',
                image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop',
                text: 'Café da manhã perfeito para começar o dia! ☕️✨ Quem mais é viciado em café?',
                likes: 203,
                comments: 24,
                liked: false
            }
        ];
    }

    generateMockStories() {
        return [
            {
                id: 1,
                name: 'Ana',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop'
            },
            {
                id: 2,
                name: 'Carlos',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop'
            },
            {
                id: 3,
                name: 'Maria',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop'
            }
        ];
    }

    generateMockChats() {
        return [
            {
                id: 1,
                name: 'Ana Silva',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                lastMessage: 'Oi! Como você está?',
                time: '14:30',
                unread: 2,
                online: true
            },
            {
                id: 2,
                name: 'Carlos Mendes',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                lastMessage: 'Vamos nos encontrar hoje?',
                time: '12:15',
                unread: 0,
                online: false
            },
            {
                id: 3,
                name: 'Beatriz Santos',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                lastMessage: 'Adorei nosso encontro! 😊',
                time: 'Ontem',
                unread: 0,
                online: true
            },
            {
                id: 4,
                name: 'João Pedro',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                lastMessage: 'Que tal um café amanhã?',
                time: 'Ontem',
                unread: 1,
                online: false
            }
        ];
    }

    generateMockExploreUsers() {
        return [
            {
                id: 1,
                name: 'Isabella Rodriguez',
                age: 24,
                location: 'Leblon, RJ',
                distance: 2.5,
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&crop=face',
                interests: ['Música', 'Viagens', 'Yoga'],
                online: true
            },
            {
                id: 2,
                name: 'Gabriel Costa',
                age: 28,
                location: 'Pinheiros, SP',
                distance: 1.2,
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&crop=face',
                interests: ['Fotografia', 'Culinária', 'Esportes'],
                online: false
            },
            {
                id: 3,
                name: 'Camila Oliveira',
                age: 26,
                location: 'Botafogo, RJ',
                distance: 3.8,
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face',
                interests: ['Arte', 'Literatura', 'Cinema'],
                online: true
            },
            {
                id: 4,
                name: 'Lucas Ferreira',
                age: 30,
                location: 'Vila Olímpia, SP',
                distance: 4.5,
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face',
                interests: ['Tecnologia', 'Games', 'Música'],
                online: false
            },
            {
                id: 5,
                name: 'Sophia Lima',
                age: 23,
                location: 'Ipanema, RJ',
                distance: 1.8,
                image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face',
                interests: ['Dança', 'Moda', 'Fitness'],
                online: true
            },
            {
                id: 6,
                name: 'Pedro Almeida',
                age: 27,
                location: 'Moema, SP',
                distance: 6.2,
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&crop=face',
                interests: ['Aventura', 'Natureza', 'Escalada'],
                online: false
            }
        ];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fikahApp = new FikahApp();
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}