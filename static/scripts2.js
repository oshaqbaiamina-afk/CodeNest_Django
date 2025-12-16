(function forceUpdateUserEmail() {
    const metaUser = document.querySelector('meta[name="user-email"]');
    if (metaUser) {
        const emailFromMeta = metaUser.getAttribute('content');
        const emailFromSession = sessionStorage.getItem('currentUserEmail');
        
        if (emailFromMeta && emailFromMeta !== emailFromSession) {
            console.warn('⚠️ Email mismatch detected!');
            console.warn('Meta:', emailFromMeta);
            console.warn('Session:', emailFromSession);
            console.warn('🔄 Updating sessionStorage...');
            
            sessionStorage.setItem('currentUserEmail', emailFromMeta);
            sessionStorage.setItem('lastUser', emailFromMeta);
        }
    }
})();
    
const coursesToggle = document.getElementById('coursesToggle');
const coursesDropdown = document.getElementById('coursesDropdown');

coursesToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    coursesDropdown.classList.toggle('active');
    coursesToggle.classList.toggle('active');
});

document.addEventListener('click', function(e) {
    if (!coursesToggle.contains(e.target) && !coursesDropdown.contains(e.target)) {
        coursesDropdown.classList.remove('active');
        coursesToggle.classList.remove('active');
    }
});

const dropdownButtons = document.querySelectorAll('.dropdown-button');
    
dropdownButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
            
        const submenuId = 'submenu-' + this.getAttribute('data-submenu');
        const submenu = document.getElementById(submenuId);
            
        document.querySelectorAll('.dropdown-submenu').forEach(menu => {
            if (menu.id !== submenuId) {
                menu.classList.remove('active');
                menu.previousElementSibling.classList.remove('active');
            }
        });
            
        submenu.classList.toggle('active');
        this.classList.toggle('active');
    });
});

// =========================================================================
// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ getCourseUrl
// =========================================================================
function getCourseUrl(targetFile, targetLesson = null) {
    // ✅ Django маршрут: /course/<file_name>/
    let url = `/course/${targetFile}/`;
    
    if (targetLesson) {
        const lessonQuery = encodeURIComponent(targetLesson);
        url += `?lesson=${lessonQuery}`;
    }
    
    console.log('🔗 Generated URL:', url); // Для отладки
    return url; 
}

// 1. Обработка кликов по элементам подменю (.dropdown-subitem)
const dropdownSubitems = document.querySelectorAll('.dropdown-subitem');
        
dropdownSubitems.forEach(subitem => {
    subitem.addEventListener('click', function(e) {
        e.preventDefault(); 
        e.stopPropagation(); // ✅ ДОБАВЛЕНО
        
        const targetFile = this.getAttribute('data-target-file');
        const targetLesson = this.getAttribute('data-target-lesson');
        
        console.log('🎯 Subitem clicked:', targetFile, targetLesson); // Для отладки
        
        // Закрываем меню после выбора
        coursesDropdown.classList.remove('active');
        coursesToggle.classList.remove('active');

        if (targetFile) {
            const url = getCourseUrl(targetFile, targetLesson);
            console.log('🚀 Navigating to:', url); // Для отладки
            window.location.href = url;
        }
    });
});

// 2. Переход на страницу курса по кнопке "Начать курс" (.start-btn)
const startCourseButtons = document.querySelectorAll('.course-card .start-btn');

startCourseButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // ✅ ДОБАВЛЕНО
        
        const targetFile = this.getAttribute('data-target-file');
        
        console.log('🎯 Start button clicked:', targetFile); // Для отладки
        
        if (targetFile) {
            const url = getCourseUrl(targetFile);
            console.log('🚀 Navigating to:', url); // Для отладки
            window.location.href = url;
        }
    });
});

// =========================================================================
// ИСПРАВЛЕННАЯ ФУНКЦИЯ В scripts2.js
// =========================================================================
function highlightAndScrollToResult() {
    // 1. Получаем поисковый запрос
    const queryElement = document.getElementById('search-query');
    if (!queryElement) {
        return; 
    }
    const query = queryElement.value.trim().toLowerCase();
    
    if (query === '') {
        return;
    }

    // 2. Ищем элемент
    const allCourseItems = document.querySelectorAll('.dropdown-subitem');
    let foundItem = null;

    for (const item of allCourseItems) {
        if (item.textContent.toLowerCase().includes(query)) {
            foundItem = item;
            break;
        }
    }

    // 3. Если элемент найден, делаем его видимым и прокручиваем
    if (foundItem) {
        
        // ⭐ КРИТИЧЕСКОЕ ДОБАВЛЕНИЕ: Принудительное открытие меню
        
        // A. Активируем самое верхнее меню "Курсы"
        const coursesDropdown = document.getElementById('coursesDropdown');
        const coursesToggle = document.getElementById('coursesToggle');
        if (coursesDropdown && coursesToggle) {
            coursesDropdown.classList.add('active');
            coursesToggle.classList.add('active');
        }

        // B. Активируем родительское подменю (submenu-X)
        let parent = foundItem.closest('.dropdown-submenu');
        if (parent) {
            parent.classList.add('active');
            
            // Активируем кнопку, которая открывает это подменю
            let parentButton = parent.previousElementSibling;
            if (parentButton && parentButton.classList.contains('dropdown-button')) {
                parentButton.classList.add('active');
            }
        }
        
        // Прокручиваем страницу до найденного элемента
        foundItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Подсветка
        foundItem.classList.add('highlight');
        
        setTimeout(() => {
            foundItem.classList.remove('highlight');
        }, 5000); 
    } 
}

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

// 4. ФУНКЦИЯ ВЫХОДА (которая вызывается кнопкой)
async function logout(targetUrl) { 
    const csrftoken = getCSRFToken();

    if (!confirm('Сіз шыққыңыз келетініне сенімдісіз бе?')) {
        return;
    }

    try {
        // Отправка POST-запроса на /logout/ для завершения сеанса Django
        const response = await fetch('/logout/', { 
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) 
        });

        if (response.ok) {
            // ✅ КРИТИЧЕСКИ ВАЖНО: Очищаем sessionStorage ПЕРЕД редиректом
            console.log('🧹 SessionStorage тазалау...');
            sessionStorage.removeItem('currentUserEmail');
            sessionStorage.removeItem('lastUser');
            
            // ⭐ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Используем replace() для очистки истории/кэша
            console.log('🔄 Басты бетке қайта бағыттау...');
            window.location.replace(targetUrl); 
        } else {
            alert('Шығу қатесі. Қайталап көріңіз.');
        }
    } catch (error) {
        console.error('Logout request error:', error);
        alert('Шығу кезінде қате пайда болды. Байланысты тексеріңіз.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 📢 Вызов функции после загрузки DOM
    highlightAndScrollToResult();
});