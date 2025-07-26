// Aguardar o carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerTab = document.querySelector('[data-tab="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const locationInput = document.getElementById('register-location');
    const getLocationBtn = document.getElementById('get-location-btn');

    // Verificar se o usuário já está logado
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '/app';
        return;
    }

    // Função para alternar entre abas
    function switchTab(activeTab, inactiveTab, activeForm, inactiveForm) {
        activeTab.classList.add('active');
        inactiveTab.classList.remove('active');
        activeForm.classList.add('active');
        inactiveForm.classList.remove('active');
    }

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
        getLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                getLocationBtn.textContent = 'Obtendo localização...';
                getLocationBtn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        // Converter coordenadas em nome de cidade usando API de geocodificação
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        // Usando a API de geocodificação do OpenStreetMap (Nominatim)
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`)
                            .then(response => response.json())
                            .then(data => {
                                const city = data.address.city || data.address.town || data.address.village || '';
                                const state = data.address.state || '';
                                locationInput.value = city + (state ? ', ' + state : '');
                                getLocationBtn.textContent = 'Localização obtida!';
                                setTimeout(() => {
                                    getLocationBtn.textContent = 'Obter localização';
                                    getLocationBtn.disabled = false;
                                }, 2000);
                            })
                            .catch(error => {
                                // Silenciar erro de API no console
                                locationInput.value = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
                                getLocationBtn.textContent = 'Obter localização';
                                getLocationBtn.disabled = false;
                            });
                    },
                    function(error) {
                        // Silenciar erro de geolocalização no console
                        alert('Não foi possível obter sua localização. Por favor, insira manualmente.');
                        getLocationBtn.textContent = 'Obter localização';
                        getLocationBtn.disabled = false;
                    }
                );
            } else {
                alert('Seu navegador não suporta geolocalização. Por favor, insira sua localização manualmente.');
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
                alert('Por favor, preencha todos os campos.');
                return;
            }

            // Mostrar loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Entrando...';
            submitBtn.disabled = true;

            try {
                const result = await window.fikahSupabase.loginUser(email, password);
                
                if (result.user) {
                    // Login bem-sucedido
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('userId', result.user.id);
                    localStorage.setItem('showTrialModal', 'true');
                    
                    if (result.user.user_metadata?.name) {
                        localStorage.setItem('userName', result.user.user_metadata.name);
                    }
                    
                    window.location.href = '/app';
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
                
                alert(errorMessage);
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
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            // Verificação de confirmação de idade
            if (!ageConfirmation) {
                alert('Você deve confirmar que é maior de 18 anos para se cadastrar.');
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
                alert('Você deve ter pelo menos 18 anos para se cadastrar.');
                return;
            }

            // Validação de senha
            if (password.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
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
                    birthdate,
                    genderPreferences,
                    relationshipTypes,
                    interests,
                    lookingFor,
                    ageConfirmed: true
                };

                const result = await window.fikahSupabase.registerUser(userData);
                
                if (result.user) {
                    // Cadastro bem-sucedido
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('userName', name);
                    localStorage.setItem('userId', result.user.id);
                    localStorage.setItem('showTrialModal', 'true');
                    
                    alert('Cadastro realizado com sucesso! Bem-vindo ao Fikah!');
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
                
                alert(errorMessage);
            } finally {
                // Restaurar botão
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});