// Aguardar o carregamento do DOM
// Função para obter localização do usuário
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalização não é suportada pelo seu navegador'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // 15 segundos
            maximumAge: 300000 // 5 minutos
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Tentar diferentes níveis de zoom para máxima precisão
                    const zoomLevels = [18, 16, 14, 12, 10];
                    let bestLocation = null;
                    
                    for (const zoom of zoomLevels) {
                        try {
                            // Usar parâmetros adicionais para melhor precisão
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=${zoom}&addressdetails=1&extratags=1&namedetails=1&accept-language=pt-BR,pt,en&countrycodes=br`,
                                {
                                    headers: {
                                        'User-Agent': 'Fikah-App/1.0',
                                        'Accept': 'application/json'
                                    }
                                }
                            );

                            if (!response.ok) continue;

                            const data = await response.json();
                            const address = data.address || {};
                            
                            // Tentar diferentes campos para cidade com prioridade específica
                            const city = address.city || 
                                        address.town || 
                                        address.municipality || 
                                        address.village || 
                                        address.suburb ||
                                        address.neighbourhood ||
                                        address.hamlet ||
                                        address.county ||
                                        address.state_district;
                            
                            const state = address.state || 
                                         address.region || 
                                         address['ISO3166-2-lvl4'];
                            
                            // Log para debug
                            console.log(`Zoom ${zoom} - Dados recebidos:`, {
                                city: city,
                                state: state,
                                address: address,
                                display_name: data.display_name
                            });
                            
                            if (city && city !== 'Cidade não encontrada' && city.length > 2) {
                                bestLocation = {
                                    city: city,
                                    state: state || 'Estado não encontrado',
                                    country: address.country || 'Brasil',
                                    latitude,
                                    longitude,
                                    fullAddress: data.display_name || `${city}, ${state}`,
                                    zoom: zoom // Para debug
                                };
                                console.log(`Localização encontrada no zoom ${zoom}:`, bestLocation);
                                break; // Encontrou uma boa localização, sair do loop
                            }
                        } catch (error) {
                            console.warn(`Erro no zoom ${zoom}:`, error);
                            continue;
                        }
                    }
                    
                    // Se não encontrou cidade específica, usar informações gerais
                    if (!bestLocation) {
                        // Fazer uma última tentativa com uma API alternativa ou usar coordenadas
                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=pt-BR,pt,en`,
                                {
                                    headers: {
                                        'User-Agent': 'Fikah-App/1.0'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                const data = await response.json();
                                const address = data.address || {};
                                
                                bestLocation = {
                                    city: address.state || address.region || 'Localização atual',
                                    state: address.country || 'Brasil',
                                    country: 'Brasil',
                                    latitude,
                                    longitude,
                                    fullAddress: data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
                                };
                            }
                        } catch (error) {
                            console.warn('Erro na última tentativa:', error);
                        }
                    }
                    
                    // Se ainda não encontrou nada, usar coordenadas
                    if (!bestLocation) {
                        bestLocation = {
                            city: `Lat: ${latitude.toFixed(4)}`,
                            state: `Lon: ${longitude.toFixed(4)}`,
                            country: 'Brasil',
                            latitude,
                            longitude,
                            fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        };
                    }

                    // Atualizar localização no Supabase se o usuário estiver logado
                    if (window.fikahSupabase && window.fikahSupabase.updateUserLocation) {
                        try {
                            await window.fikahSupabase.updateUserLocation(latitude, longitude);
                        } catch (error) {
                            console.warn('Erro ao atualizar localização no Supabase:', error);
                        }
                    }

                    resolve(bestLocation);
                } catch (error) {
                    console.error('Erro ao processar localização:', error);
                    reject(new Error('Erro ao obter informações de localização'));
                }
            },
            (error) => {
                let errorMessage = 'Erro desconhecido ao obter localização';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Localização não disponível. Verifique se o GPS está ativado.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tempo limite para obter localização. Tente novamente.';
                        break;
                }
                
                reject(new Error(errorMessage));
            },
            options
        );
    });
}

// Verificar se o usuário está retornando da confirmação de email
function checkEmailConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
        if (window.notifications) {
            window.notifications.success('Email confirmado com sucesso! Agora você pode fazer login.');
        } else {
            alert('Email confirmado com sucesso! Agora você pode fazer login.');
        }
        
        // Limpar a URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Função para alternar entre abas
function switchTab(activeTab, inactiveTab, activeForm, inactiveForm) {
    // Remover classe ativa da aba inativa
    inactiveTab.classList.remove('active');
    inactiveForm.classList.remove('active');
    
    // Adicionar classe ativa na aba ativa
    activeTab.classList.add('active');
    activeForm.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerTab = document.querySelector('[data-tab="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const locationInput = document.getElementById('register-location');
    const getLocationBtn = document.getElementById('get-location-btn');

    // Verificar confirmação de email ao carregar a página
    checkEmailConfirmation();

    // Event listeners para as abas
    if (loginTab && registerTab && loginForm && registerForm) {
        loginTab.addEventListener('click', () => {
            switchTab(loginTab, registerTab, loginForm, registerForm);
        });

        registerTab.addEventListener('click', () => {
            switchTab(registerTab, loginTab, registerForm, loginForm);
        });
    }
    
    // Função para obter localização automática
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async function() {
            getLocationBtn.textContent = 'Obtendo localização...';
            getLocationBtn.disabled = true;
            
            try {
                const location = await getUserLocation();
                
                locationInput.value = `${location.city}, ${location.state}`;
                
                if (window.notifications) {
                    window.notifications.success('Localização obtida com sucesso!');
                } else {
                    getLocationBtn.textContent = 'Localização obtida!';
                    setTimeout(() => {
                        getLocationBtn.textContent = 'Obter localização';
                    }, 2000);
                }
            } catch (error) {
                console.error('Erro ao obter localização:', error);
                
                if (window.notifications) {
                    window.notifications.error(error.message);
                } else {
                    alert(error.message);
                }
            } finally {
                getLocationBtn.textContent = 'Obter localização';
                getLocationBtn.disabled = false;
            }
        });
    }
    
    // Submissão de formulários
    if (loginForm) {
        loginForm.querySelector('form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            if (!email || !password) {
                if (window.notifications) {
                    window.notifications.error('Por favor, preencha todos os campos.');
                } else {
                    alert('Por favor, preencha todos os campos.');
                }
                return;
            }

            // Mostrar loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Entrando...';
            submitBtn.disabled = true;

            try {
                // Aguardar o Supabase estar pronto
                console.log('⏳ Aguardando Supabase estar pronto...');
                
                // Aguarda a função waitForSupabaseReady estar disponível
                let attempts = 0;
                const maxAttempts = 50; // 5 segundos
                while (!window.waitForSupabaseReady && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.waitForSupabaseReady) {
                    throw new Error('Função waitForSupabaseReady não está disponível');
                }
                
                const supabaseClient = await window.waitForSupabaseReady();
                console.log('✅ Supabase pronto, fazendo login...');
                
                const result = await supabaseClient.loginUser(email, password);
                
                if (result.user) {
                    console.log('✅ Login realizado com sucesso:', result.user.email);
                    
                    if (window.notifications) {
                        window.notifications.success('Login realizado com sucesso!');
                    }
                    
                    // Aguardar um pouco para garantir que a sessão seja estabelecida
                    console.log('⏳ Aguardando sessão ser estabelecida...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Verificar se a sessão foi estabelecida
                    const session = await supabaseClient.waitForSession(5);
                    if (session) {
                        console.log('✅ Sessão confirmada, redirecionando para o app');
                        // Redirecionar para o app
                        window.location.href = '/app';
                    } else {
                        console.warn('⚠️ Sessão não estabelecida, mas prosseguindo com redirecionamento');
                        window.location.href = '/app';
                    }
                }
            } catch (error) {
                console.error('Erro no login:', error);
                let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
                
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email ou senha incorretos.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Por favor, confirme seu email antes de fazer login.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
                }
                
                if (window.notifications) {
                    window.notifications.error(errorMessage);
                } else {
                    alert(errorMessage);
                }
            } finally {
                // Restaurar botão
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    if (registerForm) {
        registerForm.querySelector('form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const birthdate = document.getElementById('register-birthdate').value;
            const location = document.getElementById('register-location').value;
            const ageConfirmation = document.getElementById('age-confirmation').checked;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Verificação de campos obrigatórios
            if (!name || !email || !password || !birthdate || !location) {
                if (window.notifications) {
                    window.notifications.error('Por favor, preencha todos os campos obrigatórios.');
                } else {
                    alert('Por favor, preencha todos os campos obrigatórios.');
                }
                return;
            }

            // Verificação de confirmação de idade
            if (!ageConfirmation) {
                if (window.notifications) {
                    window.notifications.error('Você deve confirmar que é maior de 18 anos para se cadastrar.');
                } else {
                    alert('Você deve confirmar que é maior de 18 anos para se cadastrar.');
                }
                return;
            }

            // Coletar preferências de gênero
            const genderPreferences = [];
            const genderCheckboxes = document.querySelectorAll('input[name="gender-preferences"]:checked');
            genderCheckboxes.forEach(checkbox => {
                genderPreferences.push(checkbox.value);
            });

            // Coletar tipo de relação buscada
            const relationshipTypes = [];
            const relationshipCheckboxes = document.querySelectorAll('input[name="relation-type"]:checked');
            relationshipCheckboxes.forEach(checkbox => {
                relationshipTypes.push(checkbox.value);
            });

            // Coletar interesses
            const interests = [];
            const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
            interestCheckboxes.forEach(checkbox => {
                interests.push(checkbox.value);
            });

            // Coletar o que busca hoje
            const lookingFor = [];
            const lookingForCheckboxes = document.querySelectorAll('input[name="looking-for"]:checked');
            lookingForCheckboxes.forEach(checkbox => {
                lookingFor.push(checkbox.value);
            });

            // Verificação de idade (18+)
            const today = new Date();
            const birthdateDate = new Date(birthdate);
            let age = today.getFullYear() - birthdateDate.getFullYear();
            const monthDiff = today.getMonth() - birthdateDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                if (window.notifications) {
                    window.notifications.error('Você deve ter pelo menos 18 anos para se cadastrar.');
                } else {
                    alert('Você deve ter pelo menos 18 anos para se cadastrar.');
                }
                return;
            }

            // Validação de senha
            if (password.length < 6) {
                if (window.notifications) {
                    window.notifications.error('A senha deve ter pelo menos 6 caracteres.');
                } else {
                    alert('A senha deve ter pelo menos 6 caracteres.');
                }
                return;
            }

            // Mostrar loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Cadastrando...';
            submitBtn.disabled = true;

            try {
                const userData = {
                    name,
                    email,
                    password,
                    age,
                    location,
                    latitude: null,
                    longitude: null,
                    birthdate,
                    genderPreferences,
                    relationshipTypes,
                    interests,
                    lookingFor,
                    ageConfirmed: true
                };

                const result = await window.fikahSupabase.registerUser(userData);
                
                console.log('Resultado do registro:', result);

                // Se precisa confirmar email
                if (result.needsEmailConfirmation) {
                    // Mostrar mensagem de sucesso
                    if (window.notifications) {
                        window.notifications.success(result.message || 'Cadastro realizado! Verifique seu email para confirmar a conta.');
                    } else {
                        alert(result.message || 'Cadastro realizado! Verifique seu email para confirmar a conta.');
                    }
                    
                    // Aguardar um pouco para o usuário ler a mensagem
                    setTimeout(() => {
                        // Alternar para a aba de login
                        if (loginTab && registerTab && loginForm && registerForm) {
                            switchTab(loginTab, registerTab, loginForm, registerForm);
                        }
                        
                        // Mostrar mensagem na tela de login
                        setTimeout(() => {
                            if (window.notifications) {
                                window.notifications.info('Verifique seu email e clique no link de confirmação para ativar sua conta.');
                            }
                        }, 500);
                    }, 2000);
                    
                    return;
                }

                // Se não precisa confirmar email, fazer login automático
                if (result.user) {
                    // Cadastro bem-sucedido
                    if (window.notifications) {
                        window.notifications.success('Cadastro realizado com sucesso! Bem-vindo ao Fikah!');
                    } else {
                        alert('Cadastro realizado com sucesso! Bem-vindo ao Fikah!');
                    }
                    
                    window.location.href = '/app';
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                let errorMessage = 'Erro ao criar conta. Tente novamente.';
                
                if (error.message.includes('User already registered')) {
                    errorMessage = 'Este email já está cadastrado. Tente fazer login.';
                } else if (error.message.includes('Password should be at least 6 characters')) {
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = 'Por favor, insira um email válido.';
                } else if (error.message.includes('Email já cadastrado')) {
                    errorMessage = 'Este email já está cadastrado. Tente fazer login.';
                }
                
                if (window.notifications) {
                    window.notifications.error(errorMessage);
                } else {
                    alert(errorMessage);
                }
            } finally {
                // Restaurar botão
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Verificar se deve abrir a aba de registro baseado no hash da URL
    if (window.location.hash === '#register') {
        const loginTab = document.querySelector('[data-tab="login"]');
        const registerTab = document.querySelector('[data-tab="register"]');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginTab && registerTab && loginForm && registerForm) {
            switchTab(registerTab, loginTab, registerForm, loginForm);
        }
    }
});