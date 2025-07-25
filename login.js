document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const locationInput = document.getElementById('register-location');
    const getLocationBtn = document.getElementById('get-location-btn');
    
    // Verificar se já está logado
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = '/app';
        return;
    }
    
    // Alternar entre formulários de login e cadastro
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.dataset.tab;
            if (tabId === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        });
    });
    
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
        loginForm.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (email && password) {
                // Simulação de login bem-sucedido
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('showTrialModal', 'true');
                window.location.href = '/app';
            } else {
                alert('Por favor, preencha todos os campos.');
            }
        });
    }
    
    if (registerForm) {
        registerForm.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const birthdate = document.getElementById('register-birthdate').value;
            const location = document.getElementById('register-location').value;
            
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
            
            if (name && email && password && birthdate && location) {
                // Simulação de cadastro bem-sucedido
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', name);
                localStorage.setItem('showTrialModal', 'true');
                window.location.href = '/app';
            } else {
                alert('Por favor, preencha todos os campos obrigatórios.');
            }
        });
    }
});