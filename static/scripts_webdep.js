
const COURSE_CONFIG = {
    courseKey: 'course_webdep',
    courseName: 'Web Development',
    correctAnswers: ['1', '0', '3', '2', '1', '0', '3', '2', '1', '0', '3', '2', '1', '0', '3', '2', '1', '0', '3', '0']
};


const MAX_SCORE = COURSE_CONFIG.correctAnswers.length;


const lessons = [
    {
        title: "HTML негіздері және құрылымы",
        description: "Бұл сабақта сіз HTML тілінің қалай жұмыс істейтінін, веб-беттің құрылымы мен негізгі тегтерді үйренесіз. Бұл — веб-әзірлеудің алғашқы қадамы.",
        theory: `
            <div class="theory-block">
                <h2>📘 HTML негіздері</h2>
                <p>HTML (HyperText Markup Language) — веб-беттердің қаңқасын жасайтын негізгі тіл. Веб-беттегі әр элемент белгілі бір тег арқылы құрылады.</p>
                <h3>🔹 HTML құжатының құрылымы</h3>
                <pre><code>&lt;html&gt;
    &lt;head&gt;
        &lt;title&gt;Веб бет&lt;/title&gt;
    &lt;/head&gt;
    &lt;body&gt;
        Контент осында
    &lt;/body&gt;
&lt;/html&gt;</code></pre>
                <h3>🔹 Негізгі тегтер</h3>
                <ul>
                    <li><code>&lt;h1&gt;-&lt;h6&gt;</code> — тақырыптар</li>
                    <li><code>&lt;p&gt;</code> — абзац</li>
                    <li><code>&lt;a href=""&gt;</code> — сілтеме</li>
                    <li><code>&lt;img src="" alt=""&gt;</code> — сурет</li>
                    <li><code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code>, <code>&lt;li&gt;</code> — тізімдер</li>
                </ul>
                <h3>🔹 Атрибуттар</h3>
                <p>HTML тегтеріне қосымша ақпарат береді.</p>
                <pre><code>&lt;a href="https://example.com" target="_blank"&gt;Сілтеме&lt;/a&gt;</code></pre>
            </div>
        `,
        videoId: "4V9R6VLVw2s"
    },
    {
        title: "HTML кеңейтілген элементтері",
        description: "Бұл бөлім кестелер, формалар, мультимедиа және HTML5 семантикалық тегтері туралы түсінік береді.",
        theory: `
            <div class="theory-block">
                <h2>📗 HTML кеңейтілген элементтері</h2>
                <p>HTML тек мәтін мен суреттерді ғана емес, формалар, кестелер және мультимедиа элементтерін де қолдайды.</p>
                <h3>🔹 Формалар</h3>
                <pre><code>&lt;form&gt;
    &lt;input type="text" placeholder="Аты"&gt;
    &lt;button&gt;Жіберу&lt;/button&gt;
&lt;/form&gt;</code></pre>
                <h3>🔹 Кестелер</h3>
                <pre><code>&lt;table&gt;
    &lt;tr&gt;
        &lt;th&gt;Аты&lt;/th&gt;
        &lt;th&gt;Жасы&lt;/th&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
        &lt;td&gt;Айжан&lt;/td&gt;
        &lt;td&gt;17&lt;/td&gt;
    &lt;/tr&gt;
&lt;/table&gt;</code></pre>
                <h3>🔹 HTML5 семантикалық тегтері</h3>
                <ul>
                    <li><code>&lt;header&gt;</code></li>
                    <li><code>&lt;footer&gt;</code></li>
                    <li><code>&lt;section&gt;</code></li>
                    <li><code>&lt;article&gt;</code></li>
                </ul>
                <p>Бұл тегтер құрылымды анық әрі мағыналы етеді.</p>
            </div>
        `,
        videoId: "bDn6py0O1A0"
    },
    {
        title: "CSS негіздері және стильдеу",
        description: "Бұл сабақ CSS тілінің негізгі синтаксисін, селекторларын және Box Model жұмысын толық қамтиды.",
        theory: `
            <div class="theory-block">
                <h2>📙 CSS негіздері</h2>
                <p>CSS (Cascading Style Sheets) — HTML элементтерін стильдеу тілі. Ол түстерді, қаріптерді, өлшемдерді және орналасуды басқарады.</p>
                <h3>🔹 CSS жазу тәсілдері</h3>
                <ul>
                    <li>🔸 Inline: <code>&lt;p style="color:red"&gt;</code></li>
                    <li>🔸 Internal: <code>&lt;style&gt;</code> ішінде</li>
                    <li>🔸 External: бөлек CSS файлда</li>
                </ul>
                <h3>🔹 Селекторлар</h3>
                <ul>
                    <li><code>p</code> — тег селекторы</li>
                    <li><code>.class</code> — класс</li>
                    <li><code>#id</code> — идентификатор</li>
                </ul>
                <h3>🔹 Box Model</h3>
                <p>Әр элемент 4 қабаттан тұрады:</p>
                <ul>
                    <li>content</li>
                    <li>padding</li>
                    <li>border</li>
                    <li>margin</li>
                </ul>
                <pre><code>.box {
    margin: 20px;
    padding: 10px;
    border: 2px solid black;
}</code></pre>
            </div>
        `,
        videoId: "ef59EyocSzw"
    },
    {
        title: "CSS кеңейтілген стильдеу және орналасу",
        description: "Flexbox, Grid, анимациялар және адаптивті дизайн — қазіргі заманғы веб-дизайнның негізі.",
        theory: `
            <div class="theory-block">
                <h2>📕 Кеңейтілген CSS</h2>
                <h3>🔹 Flexbox</h3>
                <pre><code>.container {
    display: flex;
    justify-content: center;
    align-items: center;
}</code></pre>
                <h3>🔹 Grid Layout</h3>
                <pre><code>.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}</code></pre>
                <h3>🔹 Responsive дизайн</h3>
                <pre><code>@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}</code></pre>
                <h3>🔹 Анимациялар</h3>
                <pre><code>@keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

.box {
    animation: fade 1s ease;
}</code></pre>
            </div>
        `,
        videoId: "8NyX_Yop2N0"
    }
];


function getCurrentUserEmail() {
    const metaUser = document.querySelector('meta[name="user-email"]');
    if (metaUser) {
        const email = metaUser.getAttribute('content');
        if (email && email.trim() !== '') {
            sessionStorage.setItem('currentUserEmail', email);
            return email;
        }
    }
    
    const savedEmail = sessionStorage.getItem('currentUserEmail');
    if (savedEmail && savedEmail.trim() !== '') {
        return savedEmail;
    }
    
    console.error('❌ Не удалось получить email пользователя!');
    return null;
}

function getUserStorageKey(baseKey) {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
        console.error('❌ Пользователь не авторизован - данные не будут сохранены');
        return null;
    }
    const key = `${baseKey}_${userEmail}`;
    console.log(`🔑 Используется ключ: ${key}`);
    return key;
}


let sessionStartTime = Date.now();
let totalTimeSpent = 0;

function loadTimeTracking() {
    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (!storageKey) return;
    
    const courseData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    totalTimeSpent = courseData.time_seconds || 0;
    console.log(`⏱️ Загружено время: ${totalTimeSpent}с`);
}


setInterval(() => {
    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (!storageKey) return;
    
    const currentSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const newTotalTime = totalTimeSpent + currentSessionTime;
    
    let courseData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    courseData.time_seconds = newTotalTime;
    localStorage.setItem(storageKey, JSON.stringify(courseData));
    
    console.log(`⏱️ Время автосохранено: ${newTotalTime}с`);
}, 30000);


window.addEventListener('beforeunload', () => {
    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (!storageKey) return;
    
    const currentSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const newTotalTime = totalTimeSpent + currentSessionTime;
    
    let courseData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    courseData.time_seconds = newTotalTime;
    localStorage.setItem(storageKey, JSON.stringify(courseData));
    
    console.log(`⏱️ Время сохранено при выходе: ${newTotalTime}с`);
});


let currentLesson = 0;
let completedLessons = new Set();
let testAnswers = {};
let currentLessonIndex = getLessonIndexFromUrl();

const lessonItems = document.querySelectorAll('.lesson-item');
const videoContainer = document.getElementById('videoContainer');
const lessonContent = document.getElementById('lessonContent');
const testContainer = document.getElementById('testContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

function updateLesson(index) {
    currentLessonIndex = index;
    currentLesson = index;
    
    lessonItems.forEach((item, i) => {
        item.classList.remove('active');
        if (i === index) item.classList.add('active');
    });

    if (index === lessons.length) {
        document.getElementById('videoHeader').style.display = 'none';
        videoContainer.style.display = 'none';
        lessonContent.style.display = 'none';
        testContainer.classList.add('active');
    } else {
        document.getElementById('videoHeader').style.display = 'block';
        videoContainer.style.display = 'flex';
        lessonContent.style.display = 'block';
        testContainer.classList.remove('active');

        const lesson = lessons[index];
        document.getElementById('videoHeaderTitle').textContent = lesson.title;
        
        
        const lessonTitleEl = document.getElementById('lessonTitle') || 
                             document.getElementById('lessonTitle1');
        const lessonDescEl = document.getElementById('lessonDescription') || 
                            document.getElementById('lessonDescription1');
        
        if (lessonTitleEl) lessonTitleEl.textContent = lesson.title;
        if (lessonDescEl) lessonDescEl.textContent = lesson.description;
        
        document.getElementById('theoryText').innerHTML = lesson.theory;
        
        const videoWrapper = videoContainer.querySelector('.video-wrapper');
        if (lesson.videoId) {
            videoWrapper.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${lesson.videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border-radius: 10px;">
                </iframe>
            `;
        } else {
            videoWrapper.innerHTML = `
                <div class="video-placeholder">
                    🔹 Видео не найдено
                </div>
            `;
        }
    }

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === lessons.length;
    updateProgress();
}

function markLessonCompleted(index) {
    if (index < lessons.length) {
        completedLessons.add(index);
        lessonItems[index].classList.add('completed');
        updateProgress();
        console.log(`✅ Урок ${index + 1} отмечен как завершенный`);
    }
}

function updateProgress() {
    const progress = (completedLessons.size / lessons.length) * 100;
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '% ақталған';
    saveCourseProgress();
}

prevBtn.addEventListener('click', () => {
    if (currentLessonIndex > 0) {
        currentLessonIndex--;
        updateLesson(currentLessonIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

nextBtn.addEventListener('click', () => {
    markLessonCompleted(currentLessonIndex);
    if (currentLessonIndex < lessons.length) {
        currentLessonIndex++;
        updateLesson(currentLessonIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

lessonItems.forEach((item, index) => {
    item.addEventListener('click', () => updateLesson(index));
});

document.getElementById('theoryToggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('theoryContent').classList.toggle('active');
});

document.querySelectorAll('.answer-option').forEach(option => {
    option.addEventListener('click', function() {
        const question = this.getAttribute('data-question');
        document.querySelectorAll(`[data-question="${question}"]`).forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        testAnswers[question] = this.getAttribute('data-answer');
    });
});

document.getElementById('submitTest').addEventListener('click', () => {
    const resultsEl = document.getElementById('testResults');

    if (Object.keys(testAnswers).length === MAX_SCORE) {
        let score = 0;
        for (let i = 0; i < MAX_SCORE; i++) {
            if (testAnswers[i] === COURSE_CONFIG.correctAnswers[i]) {
                score++;
            }
        }
        
        const percentage = Math.round((score / MAX_SCORE) * 100);
        
        
        saveCourseProgress(score, MAX_SCORE);
        updateProgress();

        resultsEl.innerHTML = `
            <div style="padding: 15px; border-radius: 6px; background-color: rgba(79, 172, 254, 0.1); border: 1px solid #4facfe;">
                <h3>✅ Тест тапсырылды!</h3>
                <p>Сіздің нәтижеңіз: <span style="font-weight: bold; font-size: 1.2em;">${score} / ${MAX_SCORE} (${percentage}%)</span></p>
                <p>Балл сақталды. ${percentage === 100 ? '🎉 Сертификат <span style="font-weight: bold;">Жеке кабинет</span> бөлімінде қолжетімді болады.' : 'Курс завершен!'}</p>
            </div>
        `;
        
        document.getElementById('submitTest').textContent = "Нәтижені қайта сақтау";
        
        console.log(`✅ Тест завершен: ${score}/${MAX_SCORE} (${percentage}%)`);
    } else {
        alert(`⚠️ Барлық ${MAX_SCORE} сұраққа жауап беріңіз.`);
    }
});

document.getElementById('resetCourse').addEventListener('click', () => {
    document.getElementById('resetModal').classList.add('active');
});

document.getElementById('confirmReset').addEventListener('click', () => {
    completedLessons.clear();
    testAnswers = {};
    lessonItems.forEach(item => item.classList.remove('completed'));
    document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));

    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (storageKey) {
        localStorage.removeItem(storageKey);
        console.log('🗑️ Прогресс курса удален');
    }

    const resultsEl = document.getElementById('testResults');
    if (resultsEl) resultsEl.innerHTML = '';
    document.getElementById('submitTest').textContent = "Курсты аҚтау";

    updateLesson(0);
    document.getElementById('resetModal').classList.remove('active');
});

document.getElementById('cancelReset').addEventListener('click', () => {
    document.getElementById('resetModal').classList.remove('active');
});


function saveCourseProgress(newScore = null, maxScore = null) {
    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (!storageKey) {
        console.error('❌ Не удалось получить ключ хранилища - прогресс НЕ сохранен');
        return;
    }

    let courseData = JSON.parse(localStorage.getItem(storageKey) || '{}');

    if (!courseData.test_scores) {
        courseData.test_scores = [];
    }
    
   
    if (newScore !== null && maxScore !== null) {
        const percentage = Math.round((newScore / maxScore) * 100);
        courseData.test_scores.push({
            score: newScore,
            total: maxScore,
            percentage: percentage,
            date: new Date().toISOString()
        });
        console.log(`📊 Результат теста сохранен: ${percentage}%`);
    }

    courseData.total_lessons = lessons.length;
    courseData.completed_lessons = completedLessons.size;
    
    
    const allLessonsCompleted = completedLessons.size === lessons.length;
    const hasTestResult = courseData.test_scores.length > 0;
    
    courseData.is_completed = allLessonsCompleted || hasTestResult;
    
    const currentSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    courseData.time_seconds = totalTimeSpent + currentSessionTime;
    
    localStorage.setItem(storageKey, JSON.stringify(courseData));
    console.log(`💾 Прогресс сохранён для: ${getCurrentUserEmail()}`);
    console.log(`📈 Завершено уроков: ${courseData.completed_lessons}/${courseData.total_lessons}`);
    console.log(`📊 Результаты тестов: ${courseData.test_scores.length}`);
    console.log(`✅ Курс завершен: ${courseData.is_completed ? 'Да' : 'Нет'}`);
}

function loadCourseProgress() {
    const storageKey = getUserStorageKey(COURSE_CONFIG.courseKey);
    if (!storageKey) {
        console.error('❌ Не удалось получить ключ хранилища - прогресс НЕ загружен');
        return;
    }

    const courseData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    console.log('📂 Загрузка прогресса для:', getCurrentUserEmail());
    console.log('📊 Данные курса:', courseData);
    
    if (courseData.completed_lessons && courseData.completed_lessons > 0) {
        for (let i = 0; i < courseData.completed_lessons; i++) {
            completedLessons.add(i);
            if (lessonItems[i]) {
                lessonItems[i].classList.add('completed');
            }
        }
        console.log(`✅ Восстановлено ${courseData.completed_lessons} уроков`);
    }
    
    if (courseData.test_scores && courseData.test_scores.length > 0) {
        const lastTest = courseData.test_scores[courseData.test_scores.length - 1];
        console.log(`📊 Последний результат теста: ${lastTest.percentage}%`);
        
        const resultsEl = document.getElementById('testResults');
        if (resultsEl) {
            resultsEl.innerHTML = `
                <div style="padding: 15px; border-radius: 6px; background-color: rgba(79, 172, 254, 0.1); border: 1px solid #4facfe;">
                    <h3>✅ Тест был пройден ранее</h3>
                    <p>Ваш результат: <span style="font-weight: bold; font-size: 1.2em;">${lastTest.score} / ${lastTest.total} (${lastTest.percentage}%)</span></p>
                    <p>Дата: ${new Date(lastTest.date).toLocaleDateString('ru-RU')}</p>
                </div>
            `;
            document.getElementById('submitTest').textContent = "Пройти тест заново";
        }
    }
    
    updateProgress();
    console.log('✅ Загрузка прогресса завершена');
}

function getLessonIndexFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const lessonName = urlParams.get('lesson');

    if (lessonName) {
        const index = lessons.findIndex(lesson => lesson.title === decodeURIComponent(lessonName));
        if (index !== -1) {
            return index;
        }
    }
    return 0;
}


console.log(`🚀 Инициализация курса: ${COURSE_CONFIG.courseName}`);
console.log(`📧 Пользователь: ${getCurrentUserEmail()}`);
console.log(`📝 Количество вопросов в тесте: ${MAX_SCORE}`);
console.log(`📚 Количество уроков: ${lessons.length}`);

loadTimeTracking();
loadCourseProgress();
updateLesson(getLessonIndexFromUrl());