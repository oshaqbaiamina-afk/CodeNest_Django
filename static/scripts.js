// Функция для получения CSRF-токена из cookie
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}

function toggleContrast() {
    const body = document.body;
    if (body.classList.contains('normal')) {
        body.classList.remove('normal');
        body.classList.add('high-contrast');
    } else {
        body.classList.remove('high-contrast');
        body.classList.add('normal');
    }
}

function scrollToInfo() {
    document.getElementById('info').scrollIntoView({ behavior: 'smooth' });
}

function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAuthModal();
    }
});

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// ✅ ИСПРАВЛЕНО: Функция для очистки данных ТОЛЬКО текущего пользователя
function clearCurrentUserData(oldUserEmail) {
    if (!oldUserEmail) return;
    
    console.log(`🗑️ Clearing data for user: ${oldUserEmail}`);
    
    const baseCourseKeys = ['course_webdep', 'course_python', 'course_js', 'course_sql'];
    baseCourseKeys.forEach(baseKey => {
        const userKey = `${baseKey}_${oldUserEmail}`;
        localStorage.removeItem(userKey);
    });
}

// Функция входа
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value; 
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Электрондық пошта мен құпия сөзді енгізіңіз.');
        return;
    }
    
    const csrftoken = getCSRFToken();
    console.log('CSRF Token:', csrftoken);

    try {
        const response = await fetch('/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            closeAuthModal();
            
            // ✅ ИСПРАВЛЕНО: Сохраняем email нового пользователя ПЕРЕД переходом
            sessionStorage.setItem('currentUserEmail', email);
            sessionStorage.setItem('lastUser', email);
            
            // ✅ НЕ ОЧИЩАЕМ localStorage - данные других пользователей должны сохраниться
            
            if (result.redirect_url) {
                window.location.href = result.redirect_url; 
            } else {
                window.location.reload(); 
            }
        } else {
            alert(result.message || 'Қате email немесе құпия сөз.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Кіру кезінде қате пайда болды. Қайталап көріңіз.');
    }
}

// ✅ ИСПРАВЛЕННАЯ функция регистрации
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('Құпия сөздер бірдей емес!');
        return;
    }

    if (password.length < 6) {
        alert('Құпия сөзде кемінде 6 таңба болуы керек.');
        return;
    }

    const csrftoken = getCSRFToken();

    try {
        // ШАГ 1: Снача выходим из текущей сессии (если есть)
        await fetch('/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        // ✅ ИСПРАВЛЕНО: НЕ очищаем весь localStorage
        // Старые данные других пользователей должны сохраниться

        // ШАГ 2: Регистрируем нового пользователя
        const response = await fetch('/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                full_name: name,
                email: email,
                password: password,
                confirm_password: confirmPassword 
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            
            // ШАГ 3: Автоматически логиним нового пользователя
            const loginResponse = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            const loginResult = await loginResponse.json();

            if (loginResponse.ok && loginResult.success) {
                closeAuthModal();
                
                // ✅ ИСПРАВЛЕНО: Сохраняем email нового пользователя
                sessionStorage.setItem('currentUserEmail', email);
                sessionStorage.setItem('lastUser', email);
                
                // ШАГ 4: Переход на профиль НОВОГО пользователя
                if (loginResult.redirect_url) {
                    window.location.href = loginResult.redirect_url;
                } else {
                    window.location.reload();
                }
            } else {
                alert('Тіркеу сәтті! Енді жүйеге кіріңіз.');
                switchTab('login');
                e.target.reset();
            }
        } else {
            alert(result.message || 'Тіркеу кезінде қате.');
        }

    } catch (error) {
        console.error('Registration error:', error);
        alert('Тіркеу кезінде қате пайда болды. Байланысты тексеріңіз.');
    }
}

// Функция выхода
async function logout() {
    const csrftoken = getCSRFToken();

    try {
        const response = await fetch('/logout/', { 
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) 
        });

        if (response.ok) {
            // ✅ ИСПРАВЛЕНО: НЕ очищаем localStorage при выходе
            // Данные пользователя должны сохраниться для следующего входа
            
            // Очищаем только sessionStorage
            sessionStorage.removeItem('currentUserEmail');
            sessionStorage.removeItem('lastUser');
            
            window.location.reload(); 
        } else {
            alert('Шығу қатесі. Қайталап көріңіз.');
        }
    } catch (error) {
        console.error('Logout request error:', error);
    }
}