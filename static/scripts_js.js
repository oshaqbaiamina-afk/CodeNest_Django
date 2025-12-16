
const COURSE_CONFIG = {
    courseKey: 'course_js',
    courseName: 'JavaScript',
    correctAnswers: ['2', '3', '2', '0', '1', '3', '2', '0', '1', '2', '0', '3', '2', '3', '1', '1', '1', '1', '0', '0']
};


const MAX_SCORE = COURSE_CONFIG.correctAnswers.length;


const lessons = [
    {
        title: "JavaScript негіздері",
        description: "Бұл бөлімде сіз JavaScript тілінің ең алғашқы фундаменталды ұғымдарын меңгересіз. Айнымалылар, деректер типтері, операторлар және функциялар — алдағы барлық тақырыптардың негізі.",
        theory: `
            <div class="theory-block">
                <h2>📘 JavaScript негіздері</h2>
                <p>JavaScript — веб-беттерді интерактивті ететін ең танымал бағдарламалау тілі. Ол HTML және CSS-пен бірге браузерде жұмыс істейді.</p>
                <h3>🔹 Айнымалылар (Variables)</h3>
                <p>Айнымалылар мәндерді сақтау үшін қолданылады. JavaScript-та үш тәсіл бар:</p>
                <ul>
                    <li><code>let</code> — мәні өзгеретін айнымалы</li>
                    <li><code>const</code> — өзгермейтін тұрақты мән</li>
                    <li><code>var</code> — ескі стандарт, қазір ұсынылмайды</li>
                </ul>
                <pre><code>let x = 5;
const name = "JavaScript";</code></pre>
                <h3>🔹 Деректер типтері</h3>
                <p>Негізгі типтер:</p>
                <ul>
                    <li>Number</li>
                    <li>String</li>
                    <li>Boolean</li>
                    <li>null</li>
                    <li>undefined</li>
                    <li>Object</li>
                </ul>
            </div>
        `,
        videoId: "MYR4NRzx8Zg"
    },
    {
        title: "Басқару конструкциялары және функциялар",
        description: "Бұл сабақта сіз веб-бет құрылымын JavaScript арқылы басқаруды үйренесіз: элементтерді табу, өзгерту, оқиға қосу.",
        theory: `
            <div class="theory-block">
                <h2>📗 DOM деген не?</h2>
                <p><b>DOM (Document Object Model)</b> — HTML құжаттың JavaScript арқылы басқарылатын моделі. Әр HTML элемент — объект болып саналады.</p>
                <h3>🔹 Элементтерді алу</h3>
                <p>Элементтерді табуға арналған негізгі әдістер:</p>
                <pre><code>document.getElementById("id");
document.querySelector(".class");
document.querySelectorAll("tag");</code></pre>
                <h3>🔹 DOM арқылы өзгерістер енгізу</h3>
                <p>Мәтін немесе стиль өзгерту:</p>
                <pre><code>element.textContent = "Жаңа мәтін";
element.style.color = "blue";</code></pre>
                <h3>🔹 Оқиғалар (Events)</h3>
                <pre><code>button.addEventListener("click", () => {
    console.log("Батырма басылды!");
});</code></pre>
            </div>
        `,
        videoId: "mMSNxhs_Rxw"
    },
    {
        title: "DOM және оқиғалар (Events)",
        description: "Бұл бөлімде JavaScript-тің заманауи мүмкіндіктерін зерттейсіз: стрелкалық функциялар, деструктуризация, spread операторы және тағы басқа.",
        theory: `
            <div class="theory-block">
                <h2>📙 ES6+ жаңа мүмкіндіктері</h2>
                <p>ES6 JavaScript тіліне көптеген ыңғайлы синтаксистік жаңалықтар енгізді.</p>
                <h3>🔹 Стрелкалық функциялар</h3>
                <pre><code>const func = (x) => x * 2;</code></pre>
                <h3>🔹 Деструктуризация</h3>
                <pre><code>const [a, b] = [1, 2];
const {name, age} = person;</code></pre>
                <h3>🔹 Spread операторы</h3>
                <pre><code>const arr2 = [...arr1, 10, 20];</code></pre>
                <p>Бұл мүмкіндіктер кодты қысқа, түсінікті және тиімді етеді.</p>
            </div>
        `,
        videoId: "T52hTwjkK40"
    },
    {
        title: "Асинхронды JavaScript, Promises, fetch және сақтау",
        description: "Асинхронды JavaScript: Promise, async/await, fetch API — сервермен жұмыс істеудің негіздері.",
        theory: `
            <div class="theory-block">
                <h2>📕 Асинхронды JavaScript</h2>
                <p>JavaScript бір ағынды болғанымен, асинхронды механизмдер арқылы интернеттен деректерді күтіп тұрған кезде интерфейсті тоқтатпайды.</p>
                <h3>🔹 Promise</h3>
                <pre><code>fetch(url)
    .then(response => response.json())
    .then(data => console.log(data));</code></pre>
                <h3>🔹 Async/Await</h3>
                <pre><code>async function loadData() {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
}</code></pre>
                <p>Async/await — асинхронды кодты синхронды код секілді оқуға мүмкіндік береді.</p>
            </div>
        `,
        videoId: "3GAtu1BsHoY"
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