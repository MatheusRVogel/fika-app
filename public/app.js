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
        this.premiumManager = new PremiumManager();
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Wait for Supabase to be ready
        await this.waitForSupabase();
        
        // Load current user
        await this.loadCurrentUser();
        
        // Initialize premium status
        await this.initializePremiumStatus();
        
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

    async waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.fikaSupabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.fikaSupabase) {
            throw new Error('Supabase não foi inicializado');
        }
    }

    async loadCurrentUser() {
        try {
            const userResponse = await window.fikaSupabase.getCurrentUser();
            
            if (!userResponse || !userResponse.user) {
                window.location.href = 'login.html';
                return;
            }
            
            // Extrair dados do usuário da estrutura correta
            this.currentUser = {
                email: userResponse.user.email,
                name: userResponse.user.user_metadata?.name || userResponse.user.email,
                id: userResponse.user.id
            };
            
            console.log('✅ Usuário carregado:', this.currentUser.email);
            
            // Atualizar interface com dados do usuário
            this.updateUserInterface();
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            window.location.href = 'login.html';
        }
    }

    async initializePremiumStatus() {
        try {
            if (this.currentUser) {
                // Verificar status premium via API
                const subscriptionStatus = await PaymentService.getSubscriptionStatus();
                const isPremium = subscriptionStatus?.isPremium || false;
                
                // Atualizar premium manager
                this.premiumManager.setPremiumStatus(isPremium);
                
                // Atualizar interface baseada no status premium
                this.updatePremiumInterface(isPremium);
                
                console.log('✅ Status premium inicializado:', isPremium ? 'Premium' : 'Gratuito');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar status premium:', error);
            // Em caso de erro, assumir usuário gratuito
            this.premiumManager.setPremiumStatus(false);
        }
    }

    updatePremiumInterface(isPremium) {
        // Atualizar botão premium
        const premiumBtn = document.getElementById('premium-btn');
        if (premiumBtn) {
            if (isPremium) {
                premiumBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>Premium ⭐</span>
                `;
                premiumBtn.classList.add('premium-active');
            } else {
                premiumBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>Premium</span>
                `;
                premiumBtn.classList.remove('premium-active');
            }
        }

        // Mostrar/ocultar funcionalidades premium
        const premiumFeatures = document.querySelectorAll('.premium-feature');
        premiumFeatures.forEach(feature => {
            if (isPremium) {
                feature.classList.remove('locked');
            } else {
                feature.classList.add('locked');
            }
        });

        // Sempre atualizar contadores de uso (mostra/oculta baseado no status premium)
        this.updateUsageCounters();
    }

    updateUsageCounters() {
        const stats = this.premiumManager.getUsageStats();
        const usageCounters = document.getElementById('usage-counters');
        
        if (!usageCounters) return;
        
        if (stats.isPremium) {
            // Ocultar contadores para usuários premium
            usageCounters.style.display = 'none';
            return;
        }
        
        // Mostrar contadores para usuários não premium
        usageCounters.style.display = 'block';
        
        // Atualizar contador de likes (agora ilimitado)
        const likesCounter = document.querySelector('.likes-counter');
        if (likesCounter) {
            likesCounter.innerHTML = '<span class="counter-label">Curtidas:</span> <span class="counter-value">Ilimitadas ✓</span>';
            likesCounter.className = 'usage-counter likes-counter success';
        }

        // Atualizar contador de super likes (agora ilimitado)
        const superLikesCounter = document.querySelector('.super-likes-counter');
        if (superLikesCounter) {
            superLikesCounter.innerHTML = '<span class="counter-label">Super Likes:</span> <span class="counter-value">Ilimitados ✓</span>';
            superLikesCounter.className = 'usage-counter super-likes-counter success';
        }
        
        // Atualizar contador de conversas (apenas responder)
        const conversationsCounter = document.querySelector('.conversations-counter');
        if (conversationsCounter) {
            conversationsCounter.innerHTML = '<span class="counter-label">Chats:</span> <span class="counter-value">Apenas responder</span>';
            conversationsCounter.className = 'usage-counter conversations-counter warning';
        }
    }

    updateUserInterface() {
        // Atualizar nome do usuário no perfil
        const profileName = document.querySelector('.profile-details h2');
        if (profileName && this.currentUser) {
            profileName.textContent = this.currentUser.name || this.currentUser.email;
        }
        
        // Atualizar outros elementos da interface conforme necessário
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(element => {
            element.textContent = this.currentUser.name || this.currentUser.email;
        });
        
        // Carregar e exibir preferências do usuário
        this.loadUserPreferences();
    }

    async loadUserPreferences() {
        if (!this.currentUser || !this.currentUser.id) return;
        
        try {
            const userProfile = await window.fikaSupabase.getUserProfile(this.currentUser.id);
            if (userProfile) {
                this.displayUserPreferences(userProfile);
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }

    displayUserPreferences(userProfile) {
        // Exibir preferências de gênero
        const genderPreferencesContainer = document.getElementById('gender-preferences');
        if (genderPreferencesContainer) {
            this.renderPreferenceTags(genderPreferencesContainer, userProfile.gender_preferences, 'Nenhuma preferência definida');
        }

        // Exibir tipos de relacionamento
        const relationshipTypesContainer = document.getElementById('relationship-types');
        if (relationshipTypesContainer) {
            this.renderPreferenceTags(relationshipTypesContainer, userProfile.relationship_types, 'Nenhum tipo definido');
        }

        // Exibir interesses
        const interestsContainer = document.getElementById('user-interests');
        if (interestsContainer) {
            this.renderPreferenceTags(interestsContainer, userProfile.interests, 'Nenhum interesse definido');
        }

        // Exibir o que busca hoje
        const lookingForContainer = document.getElementById('looking-for');
        if (lookingForContainer) {
            this.renderPreferenceTags(lookingForContainer, userProfile.looking_for, 'Nada definido');
        }
    }

    renderPreferenceTags(container, preferences, emptyMessage) {
        container.innerHTML = '';
        
        if (!preferences || preferences.length === 0) {
            const emptyTag = document.createElement('span');
            emptyTag.className = 'preference-tag empty';
            emptyTag.textContent = emptyMessage;
            container.appendChild(emptyTag);
        } else {
            preferences.forEach(preference => {
                const tag = document.createElement('span');
                tag.className = 'preference-tag';
                tag.textContent = preference;
                container.appendChild(tag);
            });
        }
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

        // Premium features
        document.getElementById('who-liked-btn')?.addEventListener('click', () => {
            this.showWhoLikedModal();
        });

        document.getElementById('profile-visitors-btn')?.addEventListener('click', () => {
            this.showProfileVisitorsModal();
        });

        // Premium modal
        document.getElementById('premium-cancel-btn')?.addEventListener('click', () => {
            this.hidePremiumModal();
        });

        document.getElementById('premium-upgrade-btn')?.addEventListener('click', () => {
            this.showPremiumModal();
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

        // Add story functionality
        const addStoryBtn = document.querySelector('.add-story');
        if (addStoryBtn) {
            addStoryBtn.addEventListener('click', () => {
                this.showCreateStoryModal();
            });
        }

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

        // No mock messages - empty chat
        const messages = [];

        messagesContainer.innerHTML = '';

        if (messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-chat-message';
            emptyMessage.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhuma mensagem ainda. Comece a conversar!</p>';
            messagesContainer.appendChild(emptyMessage);
        } else {
            messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
        }

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

        // Para usuários não premium, verificar limitações
        if (!this.premiumManager.isPremium) {
            const existingMessages = messagesContainer.querySelectorAll('.message');
            
            if (existingMessages.length === 0) {
                // Tentativa de iniciar nova conversa - bloqueada para usuários gratuitos
                this.premiumManager.showUpgradeModal(
                    'Recurso Premium',
                    'Usuários gratuitos não podem iniciar conversas. Você pode apenas responder mensagens recebidas.'
                );
                return;
            } else {
                // Verificar limite de mensagens diárias para respostas
                const canSend = this.premiumManager.canSendMessage();
                if (!canSend.allowed) {
                    this.premiumManager.showUpgradeModal(canSend.reason, canSend.message);
                    return;
                }
                
                // Registrar mensagem enviada
                this.premiumManager.recordMessage();
            }
        }

        const message = {
            id: Date.now(),
            text: text,
            sent: true,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        
        messageInput.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Simulate response after 1-2 seconds
        setTimeout(() => {
            const responses = [
                'Que legal! 😊',
                'Concordo totalmente!',
                'Haha, adorei!',
                'Interessante ponto de vista',
                'Vamos marcar algo em breve!',
                'Obrigada por compartilhar isso'
            ];
            
            const response = {
                id: Date.now() + 1,
                text: responses[Math.floor(Math.random() * responses.length)],
                sent: false,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            };
            
            const responseElement = this.createMessageElement(response);
            messagesContainer.appendChild(responseElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000 + Math.random() * 1000);
    }
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
                this.showSettingsModal();
            });
        }
    }

    async showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Configurações</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>Conta</h4>
                        <div class="setting-item">
                            <span>E-mail: ${this.currentUser?.email || 'Não informado'}</span>
                        </div>
                        <div class="setting-item">
                            <span>Nome: ${this.currentUser?.name || 'Não informado'}</span>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>Privacidade</h4>
                        <div class="setting-item">
                            <span>Perfil público</span>
                            <label class="theme-switch">
                                <input type="checkbox" checked>
                                <span class="theme-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <span>Mostrar localização</span>
                            <label class="theme-switch">
                                <input type="checkbox" checked>
                                <span class="theme-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>Notificações</h4>
                        <div class="setting-item">
                            <span>Novos matches</span>
                            <label class="theme-switch">
                                <input type="checkbox" checked>
                                <span class="theme-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <span>Mensagens</span>
                            <label class="theme-switch">
                                <input type="checkbox" checked>
                                <span class="theme-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn-danger" id="logout-btn">
                        Sair da Conta
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adicionar event listener para logout
        const logoutBtn = modal.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.handleLogout();
            });
        }
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async handleLogout() {
        try {
            this.showNotification('Fazendo logout...', 'info');
            
            // Fazer logout no Supabase
            if (window.fikaSupabase) {
                await window.fikaSupabase.logoutUser();
            }
            
            // Limpar dados locais
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            
            this.showNotification('Logout realizado com sucesso!', 'success');
            
            // Redirecionar para login após um breve delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            this.showNotification('Erro ao fazer logout. Tente novamente.', 'error');
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
                <div class="explore-card-actions">
                    <button class="btn-like ${user.liked ? 'liked' : ''}" data-user-id="${user.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        Like
                    </button>
                    <button class="btn-super-like" data-user-id="${user.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                        Super Like
                    </button>
                    <button class="btn-message" data-user-id="${user.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Mensagem
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions
        const likeBtn = userDiv.querySelector('.btn-like');
        const superLikeBtn = userDiv.querySelector('.btn-super-like');
        const messageBtn = userDiv.querySelector('.btn-message');

        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleUserLike(user.id, likeBtn);
        });

        superLikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleUserSuperLike(user.id, superLikeBtn);
        });

        messageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleUserMessage(user.id);
        });

        // Click on card to view profile
        userDiv.addEventListener('click', () => {
            this.showUserProfile(user);
        });

        return userDiv;
    }

    handleUserLike(userId, button) {
        const user = this.exploreUsers.find(u => u.id === userId);
        if (!user) return;

        user.liked = !user.liked;
        
        if (user.liked) {
            button.classList.add('liked');
            button.style.color = 'var(--primary-color)';
            this.showNotification(`Você curtiu ${user.name}!`, 'success');
        } else {
            button.classList.remove('liked');
            button.style.color = '';
            this.showNotification(`Você descurtiu ${user.name}`, 'info');
        }
    }

    handleUserSuperLike(userId, button) {
        const user = this.exploreUsers.find(u => u.id === userId);
        if (!user) return;

        // Efeito visual do super like
        button.style.color = '#FFD700';
        button.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);

        this.showNotification(`Super Like enviado para ${user.name}! ⭐`, 'success');
    }

    handleUserMessage(userId) {
        // Verificar se pode iniciar conversa
        const canStartConversation = this.premiumManager.canStartConversation();
        if (!canStartConversation.allowed) {
            this.premiumManager.showUpgradeModal(canStartConversation.reason, canStartConversation.message);
            return;
        }

        const user = this.exploreUsers.find(u => u.id === userId);
        if (!user) return;

        // Registrar nova conversa
        this.premiumManager.recordNewConversation();

        // Simular criação de nova conversa
        const newChat = {
            id: Date.now(),
            name: user.name,
            avatar: user.image,
            lastMessage: 'Nova conversa iniciada',
            time: 'agora',
            unread: 0,
            online: Math.random() > 0.5
        };

        this.chats.unshift(newChat);
        this.renderChats();
        
        this.showNotification(`Conversa iniciada com ${user.name}!`, 'success');
        this.navigateToScreen('messages');
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
        // Verificar se usuário gratuito pode criar post
        if (!this.premiumManager.isPremium) {
            const canCreate = this.premiumManager.canCreatePost();
            if (!canCreate.allowed) {
                this.premiumManager.showUpgradeModal(canCreate.reason, canCreate.message);
                return;
            }
        }

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
        // Registrar criação de post para usuários gratuitos
        if (!this.premiumManager.isPremium) {
            this.premiumManager.recordPost();
        }

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

    showCreateStoryModal() {
        // Verificar se usuário gratuito pode criar story
        if (!this.premiumManager.isPremium) {
            const canCreate = this.premiumManager.canCreateStory();
            if (!canCreate.allowed) {
                this.premiumManager.showUpgradeModal(canCreate.reason, canCreate.message);
                return;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content create-story-modal">
                <div class="modal-header">
                    <h2>Criar Story</h2>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <div class="story-preview">
                        <div class="story-preview-container">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop&crop=face" alt="Preview" class="story-preview-image">
                            <div class="story-text-overlay">
                                <textarea placeholder="Adicione um texto ao seu story..." class="story-textarea" maxlength="100"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="story-options">
                        <button class="option-btn">📷 Trocar Foto</button>
                        <button class="option-btn">🎨 Filtros</button>
                        <button class="option-btn">😊 Stickers</button>
                    </div>
                    <div class="char-count">
                        <span class="current">0</span>/<span class="max">100</span>
                    </div>
                    <button class="publish-btn" disabled>Publicar Story</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const textarea = modal.querySelector('.story-textarea');
        const charCount = modal.querySelector('.current');
        const publishBtn = modal.querySelector('.publish-btn');
        
        textarea.addEventListener('input', (e) => {
            const length = e.target.value.length;
            charCount.textContent = length;
            publishBtn.disabled = false; // Story pode ser publicado sem texto
        });
        
        // Habilitar botão de publicar imediatamente (story pode ser só imagem)
        publishBtn.disabled = false;
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        publishBtn.addEventListener('click', () => {
            const content = textarea.value.trim();
            this.createStory(content);
            this.showNotification('Story publicado com sucesso!', 'success');
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createStory(content) {
        // Registrar criação de story para usuários gratuitos
        if (!this.premiumManager.isPremium) {
            this.premiumManager.recordStory();
        }

        const newStory = {
            id: Date.now().toString(),
            name: 'Você',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop&crop=face',
            text: content,
            time: Date.now()
        };
        
        this.stories.unshift(newStory);
        this.renderStories();
    }

    renderStories() {
        // Esta função pode ser implementada para atualizar a visualização dos stories
        // Por enquanto, apenas mostramos uma notificação
        console.log('Stories atualizados:', this.stories);
    }

    showWhoLikedModal() {
        // Verificar se usuário pode ver quem curtiu
        const canSee = this.premiumManager.canSeeWhoLiked();
        if (!canSee.allowed) {
            this.showPremiumFeatureModal(
                'Ver quem curtiu você',
                canSee.message,
                'crown'
            );
            return;
        }

        // Se for premium, mostrar lista de quem curtiu
        this.showNotification('Funcionalidade disponível para usuários premium', 'info');
    }

    showProfileVisitorsModal() {
        // Verificar se usuário pode ver visitantes do perfil
        const canSee = this.premiumManager.canSeeProfileVisitors();
        if (!canSee.allowed) {
            this.showPremiumFeatureModal(
                'Ver visitantes do perfil',
                canSee.message,
                'eye'
            );
            return;
        }

        // Se for premium, mostrar lista de visitantes
        this.showNotification('Funcionalidade disponível para usuários premium', 'info');
    }

    showPremiumFeatureModal(title, message, iconType = 'crown') {
        const modal = document.getElementById('premium-modal');
        const titleElement = document.getElementById('premium-modal-title');
        const messageElement = document.getElementById('premium-modal-message');
        const iconElement = modal.querySelector('.premium-modal-icon svg');

        // Atualizar conteúdo do modal
        titleElement.textContent = title;
        messageElement.textContent = message;

        // Atualizar ícone baseado no tipo
        const icons = {
            crown: '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>',
            eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
            heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>'
        };

        iconElement.innerHTML = icons[iconType] || icons.crown;

        // Mostrar modal
        modal.classList.add('active');
    }

    hidePremiumModal() {
        const modal = document.getElementById('premium-modal');
        modal.classList.remove('active');
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
        return [];
    }

    generateMockStories() {
        return [];
    }

    generateMockChats() {
        return [];
    }

    generateMockExploreUsers() {
        return [];
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