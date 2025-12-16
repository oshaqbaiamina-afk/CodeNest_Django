// =============================================================================
// ⚡ ӨТЕ МАҢЫЗДЫ: ПАЙДАЛАНУШЫНЫ МӘЖБҮРЛІ СИНХРОНДАУ
// =============================================================================
(function forceSyncUser() {
    console.log('🔄 Пайдаланушыны мәжбүрлеп синхрондау...');
    
    const metaUser = document.querySelector('meta[name="user-email"]');
    if (!metaUser) {
        console.error('❌ Маңызды қате: user-email Мета тегі табылмады!');
        return;
    }
    
    const emailFromMeta = metaUser.getAttribute('content');
    if (!emailFromMeta || emailFromMeta.trim() === '') {
        console.error('❌ Пайдаланушының электрондық поштасы бос!');
        return;
    }
    
    const emailFromSession = sessionStorage.getItem('currentUserEmail');
    
    console.log('📧 Мета тегтен Email (Django):', emailFromMeta);
    console.log('📧 Электрондық пошта sessionStorage:', emailFromSession);
    
    sessionStorage.setItem('currentUserEmail', emailFromMeta);
    sessionStorage.setItem('lastUser', emailFromMeta);
    
    if (emailFromMeta !== emailFromSession) {
        console.warn('⚠️ СӘЙКЕССІЗДІК АНЫҚТАЛДЫ! Жаңарту...');
        console.log('✅ sessionStorage жаңартылды:', emailFromMeta);
    } else {
        console.log('✅ Email сәйкес келеді:', emailFromMeta);
    }
})();

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
        console.log('✅ Email sessionStorage-тан:', savedEmail);
        return savedEmail;
    }
    
    console.error('❌ Пайдаланушының электрондық поштасын алу мүмкін болмады!');
    return null;
}

function getUserStorageKey(baseKey) {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
        console.error('❌ Пайдаланушы рұқсат етілмеген');
        return null;
    }
    return `${baseKey}_${userEmail}`;
}

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

// 🔥🔥🔥 ЖАҢА НҰСҚА: localStorage-тан аяқталған курстарды есептеу
function getCompletedCoursesFromLocalStorage() {
    const baseCourseKeys = ['course_webdep', 'course_python', 'course_js', 'course_sql'];
    let completedCount = 0;
    
    console.log('\n🔍 ==========================================');
    console.log('🔍 localStorage-тан аяқталған курстарды тексеру');
    console.log('🔍 ==========================================');
    
    baseCourseKeys.forEach(key => {
        const userKey = getUserStorageKey(key);
        if (!userKey) {
            console.log(`❌ ${key}: userKey жасалмады`);
            return;
        }
        
        const data = localStorage.getItem(userKey);
        console.log(`\n📦 Курс: ${key}`);
        console.log(`   Кілт: ${userKey}`);
        
        if (!data) {
            console.log(`   ⚠️ localStorage-та деректер жоқ`);
            return;
        }
        
        try {
            const courseData = JSON.parse(data);
            
            console.log(`   📊 Деректер:`);
            console.log(`      total_lessons: ${courseData.total_lessons}`);
            console.log(`      completed_lessons: ${courseData.completed_lessons}`);
            console.log(`      is_completed: ${courseData.is_completed}`);
            
            // 🔥 ЖАҢА ЛОГИКА: 3 жағдайды тексереміз
            let isCompleted = false;
            let reason = '';
            
            // Жағдай 1: is_completed флагы бар
            if (courseData.is_completed === true) {
                isCompleted = true;
                reason = 'is_completed === true';
            }
            
            // Жағдай 2: Барлық сабақтар аяқталған
            if (!isCompleted && courseData.total_lessons > 0) {
                if (courseData.completed_lessons >= courseData.total_lessons) {
                    isCompleted = true;
                    reason = `completed_lessons (${courseData.completed_lessons}) >= total_lessons (${courseData.total_lessons})`;
                    
                    // Автоматты флаг қою
                    console.log(`   🔧 Автоматты түрде is_completed = true қойылды`);
                    courseData.is_completed = true;
                    localStorage.setItem(userKey, JSON.stringify(courseData));
                }
            }
            
            // Жағдай 3: 100% тест бар
            if (!isCompleted && courseData.test_scores && courseData.test_scores.length > 0) {
                const perfectTest = courseData.test_scores.find(test => test.percentage === 100);
                if (perfectTest) {
                    isCompleted = true;
                    reason = '100% тест табылды';
                    
                    // Автоматты флаг қою
                    console.log(`   🔧 Автоматты түрде is_completed = true қойылды (тест)`);
                    courseData.is_completed = true;
                    localStorage.setItem(userKey, JSON.stringify(courseData));
                }
            }
            
            if (isCompleted) {
                completedCount++;
                console.log(`   ✅ КУРС АЯҚТАЛДЫ! Себебі: ${reason}`);
            } else {
                console.log(`   ⏳ Курс әлі аяқталмаған`);
            }
            
        } catch (e) {
            console.error(`❌ Талдау қатесі ${userKey}:`, e);
        }
    });
    
    console.log('\n📊 ==========================================');
    console.log(`📊 БАРЛЫҒЫ АЯҚТАЛҒАН КУРСТАР: ${completedCount}`);
    console.log('📊 ==========================================\n');
    
    return completedCount;
}

async function updateProfileStats() {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
        console.error('❌ Пайдаланушы рұқсат етілмеген');
        return;
    }

    try {
        console.log('📊 Статистиканы жүктеу:', userEmail);
        
        // 🔥 БІРІНШІ: localStorage-тан есептейміз
        const completedFromLocalStorage = getCompletedCoursesFromLocalStorage();
        
        // API-дан статистика алу
        let finalCompletedCount = completedFromLocalStorage;
        
        try {
            const response = await fetch(`/api/student/stats/?email=${encodeURIComponent(userEmail)}`);
            if (response.ok) {
                const stats = await response.json();
                console.log('📈 API-дан алынған статистика:', stats);
                
                // Максималды мәнді қолданамыз
                if (stats.completed_courses > completedFromLocalStorage) {
                    console.log(`⚠️ API-да көп: ${stats.completed_courses}, localStorage: ${completedFromLocalStorage}`);
                    finalCompletedCount = stats.completed_courses;
                }
            }
        } catch (apiError) {
            console.warn('⚠️ API қатесі, localStorage пайдаланамыз:', apiError);
        }

        const TOTAL_AVAILABLE_COURSES = 4;
        const overallCoursePercentage = Math.min(100, Math.round((finalCompletedCount / TOTAL_AVAILABLE_COURSES) * 100));

        console.log(`\n🎯 СОҢҒЫ НӘТИЖЕ:`);
        console.log(`   Аяқталған курстар: ${finalCompletedCount}`);
        console.log(`   Жалпы прогресс: ${overallCoursePercentage}%\n`);

        // UI жаңарту
        const overallProgressEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
        if (overallProgressEl) {
            overallProgressEl.textContent = `${overallCoursePercentage}%`;
        }

        const completedCoursesEl = document.getElementById('coursesCompletedCount');
        if (completedCoursesEl) {
            completedCoursesEl.textContent = finalCompletedCount;
        }

        // Белсенді курстарды есептеу
        let activeCourses = 0;
        const baseCourseKeys = ['course_webdep', 'course_python', 'course_js', 'course_sql'];
        
        baseCourseKeys.forEach(key => {
            const userKey = getUserStorageKey(key);
            if (!userKey) return;
            
            const data = localStorage.getItem(userKey);
            if (data) {
                try {
                    const courseData = JSON.parse(data);
                    
                    const hasStarted = courseData.completed_lessons > 0;
                    const isCompleted = courseData.is_completed === true || 
                                      (courseData.total_lessons > 0 && courseData.completed_lessons >= courseData.total_lessons);
                    
                    if (hasStarted && !isCompleted) {
                        activeCourses++;
                    }
                } catch (e) {
                    console.error(`Талдау қатесі ${userKey}:`, e);
                }
            }
        });
        
        const inProgressEl = document.getElementById('coursesInProgressCount');
        if (inProgressEl) {
            inProgressEl.textContent = activeCourses;
            console.log(`🔄 Белсенді курстар: ${activeCourses}`);
        }
        
        // Оқу уақыты
        const totalTimeEl = document.getElementById('totalTimeHours');
        if (totalTimeEl) {
            let totalSeconds = 0;
            
            baseCourseKeys.forEach(key => {
                const userKey = getUserStorageKey(key);
                if (userKey) {
                    const data = localStorage.getItem(userKey);
                    if (data) {
                        try {
                            const courseData = JSON.parse(data);
                            totalSeconds += (courseData.time_seconds || 0);
                        } catch (e) {
                            console.error(`Талдау қатесі ${userKey}:`, e);
                        }
                    }
                }
            });
            
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            totalTimeEl.textContent = `${hours}ч ${minutes}м`;
            console.log(`⏱️ Оқу уақыты: ${hours}ч ${minutes}м`);
        }

        // Сабақтар үшін орташа балл
        try {
            const lessonsResponse = await fetch('/api/student/lessons/', {
                headers: { 'X-CSRFToken': getCSRFToken() }
            });
            
            let avgLessonGrade = 0;
            
            if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                
                if (lessonsData.lessons && lessonsData.lessons.length > 0) {
                    let totalLessonGrade = 0;
                    let lessonCount = 0;
                    
                    lessonsData.lessons.forEach(lesson => {
                        if (lesson.has_grade) {
                            totalLessonGrade += lesson.grade;
                            lessonCount++;
                        }
                    });
                    
                    avgLessonGrade = lessonCount > 0 ? Math.round(totalLessonGrade / lessonCount) : 0;
                }
            }
            
            const avgLessonEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
            if (avgLessonEl) {
                avgLessonEl.textContent = `${avgLessonGrade}%`;
            }
        } catch (error) {
            console.error('❌ Сабақ бағаларын жүктеу қатесі:', error);
        }

        // Тесттер үшін орташа балл
        let totalTestScore = 0;
        let testCount = 0;
        
        baseCourseKeys.forEach(key => {
            const userKey = getUserStorageKey(key);
            if (userKey) {
                const data = localStorage.getItem(userKey);
                if (data) {
                    try {
                        const courseData = JSON.parse(data);
                        if (courseData.test_scores && courseData.test_scores.length > 0) {
                            const lastTest = courseData.test_scores[courseData.test_scores.length - 1];
                            totalTestScore += lastTest.percentage;
                            testCount++;
                        }
                    } catch (e) {
                        console.error(`Талдау қатесі ${userKey}:`, e);
                    }
                }
            }
        });
        
        const avgTestGrade = testCount > 0 ? Math.round(totalTestScore / testCount) : 0;
        
        const avgTestEl = document.getElementById('averageGradePct');
        if (avgTestEl) {
            avgTestEl.textContent = `${avgTestGrade}%`;
        }

        // Сертификаттар саны
        const certificatesCountEl = document.getElementById('certificatesCount');
        if (certificatesCountEl) {
            let certCount = 0;
            baseCourseKeys.forEach(key => {
                const userKey = getUserStorageKey(key);
                if (userKey) {
                    const data = localStorage.getItem(userKey);
                    if (data) {
                        try {
                            const courseData = JSON.parse(data);
                            if (courseData.test_scores && courseData.test_scores.length > 0) {
                                const perfectTest = courseData.test_scores.find(test => test.percentage === 100);
                                if (perfectTest) certCount++;
                            }
                        } catch (e) {
                            console.error(`Талдау қатесі ${userKey}:`, e);
                        }
                    }
                }
            });
            certificatesCountEl.textContent = certCount;
        }

        console.log('✅ Профиль статистикасы толығымен жаңартылды');
        
    } catch (error) {
        console.error('❌ Статистиканы жүктеу қатесі:', error);
    }
}

async function displayCertificates() {
    const currentUser = getCurrentUserEmail();
    if (!currentUser) return;
    
    const certificatesGrid = document.getElementById('certificatesGrid');
    if (!certificatesGrid) return;

    certificatesGrid.innerHTML = '';
    let certificateCount = 0;
    
    const courseInfos = [
        { key: 'course_js', name: 'JavaScript', icon: '⚡', fileName: 'JavaScriptCertificate.png' },
        { key: 'course_python', name: 'Python бағдарламалау', icon: '🐍', fileName: 'PythonCertificate.png' },
        { key: 'course_webdep', name: 'Веб әзірлеу', icon: '🌐', fileName: 'WebDevCertificate.png' },
        { key: 'course_sql', name: 'SQL дерекқоры', icon: '🗄️', fileName: 'SQLCertificate.png' }
    ];
    
    courseInfos.forEach(courseInfo => {
        const userKey = getUserStorageKey(courseInfo.key);
        if (!userKey) return;
        
        const data = localStorage.getItem(userKey);
        if (!data) return;
        
        try {
            const courseData = JSON.parse(data);
            
            if (courseData.test_scores && courseData.test_scores.length > 0) {
                const perfectTest = courseData.test_scores.find(test => test.percentage === 100);
                
                if (perfectTest) {
                    certificateCount++;
                    
                    const certCard = document.createElement('div');
                    certCard.className = 'certificate-card';
                    
                    const date = perfectTest.date 
                        ? new Date(perfectTest.date).toLocaleDateString('kk-KZ') 
                        : 'Жақында';
                    
                    certCard.innerHTML = `
                        <div class="certificate-icon">${courseInfo.icon}</div>
                        <div class="certificate-title">${courseInfo.name}</div>
                        <div class="certificate-date">Алынды: ${date}</div>
                        <div class="certificate-date">Нәтиже: ${perfectTest.score}/${perfectTest.total} (100%)</div>
                        <button class="download-btn" onclick="downloadCertificate('${courseInfo.fileName}', '${courseInfo.name}')">
                            📥 Сертификатты жүктеп алу
                        </button>
                    `;
                    
                    certificatesGrid.appendChild(certCard);
                }
            }
        } catch (e) {
            console.error(`Сертификатты өңдеу қатесі ${courseInfo.name}:`, e);
        }
    });
    
    const certificatesCountEl = document.getElementById('certificatesCount');
    if (certificatesCountEl) {
        certificatesCountEl.textContent = certificateCount;
    }
    
    if (certificateCount === 0) {
        certificatesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white; font-size: 1.2rem;">
                📜 Сізде әлі сертификаттар жоқ. Сертификат алу үшін курстарды 100% аяқтаңыз!
            </div>
        `;
    }
}

function downloadCertificate(fileName, courseName) {
    const certificatePath = `/static/certificate/${fileName}`;
    const link = document.createElement('a');
    link.href = certificatePath;
    link.download = `Сертификат_${courseName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function displayLessons() {
    const currentUser = getCurrentUserEmail();
    if (!currentUser) return;
    
    const lessonsGrid = document.querySelector('#lessons .lessons-grid');
    if (!lessonsGrid) return;

    lessonsGrid.innerHTML = '<div style="text-align: center; padding: 3rem; color: white;">⏳ Сабақтар жүктелуде...</div>';

    try {
        const response = await fetch('/api/student/lessons/', {
            headers: { 'X-CSRFToken': getCSRFToken() }
        });
        
        if (!response.ok) throw new Error(`HTTP қатесі! статус: ${response.status}`);
        
        const data = await response.json();
        
        if (data.lessons.length === 0) {
            lessonsGrid.innerHTML = '<div style="text-align: center; padding: 3rem; color: white;">📚 Сізде әлі тағайындалған сабақтар жоқ</div>';
            return;
        }
        
        lessonsGrid.innerHTML = data.lessons.map(lesson => `
            <div class="lesson-card">
                <div class="lesson-info">
                    <h3>${lesson.course_name}: ${lesson.title}</h3>
                    <p>Оқытушы: ${lesson.teacher_name} • Сабақ #${lesson.lesson_number} • ${lesson.published_date}</p>
                    ${lesson.description ? `<p style="margin-top: 0.5rem; color: rgba(255,255,255,0.8);">${lesson.description}</p>` : ''}
                    ${lesson.materials ? `<p style="margin-top: 0.5rem; color: rgba(255,255,255,0.9); font-size: 0.9rem;">📎 Материалдар: ${lesson.materials}</p>` : ''}
                    ${lesson.has_grade ? `<p style="margin-top: 0.8rem; font-weight: 700; color: #38ef7d; font-size: 1.1rem;">✅ Бағалау: ${lesson.grade}%</p>` : '<p style="margin-top: 0.8rem; color: rgba(255,255,255,0.7);">⏳ Орындауды күтуде</p>'}
                </div>
                <button class="start-lesson-btn" onclick="goToLessonSubmission(${lesson.id}, '${encodeURIComponent(lesson.title)}', ${lesson.has_grade})">
                    ${lesson.has_grade ? '📝 Жұмысты қарау' : '📤 Тапсырманы жіберу'}
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Сабақты жүктеу қатесі:', error);
        lessonsGrid.innerHTML = '<div style="text-align: center; padding: 3rem; color: white;">❌ Сабақты жүктеу қатесі</div>';
    }
}

function goToLessonSubmission(lessonId, lessonTitle, hasGrade) {
    window.location.href = `/lesson/submit/?lesson_id=${lessonId}&title=${lessonTitle}&has_grade=${hasGrade}`;
}

async function displayGrades() {
    const currentUser = getCurrentUserEmail();
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/student/lessons/', {
            headers: { 'X-CSRFToken': getCSRFToken() }
        });
        
        if (!response.ok) throw new Error(`HTTP қатесі! статус: ${response.status}`);
        
        const data = await response.json();
        
        const gradesTableBody = document.querySelector('#grades tbody');
        if (gradesTableBody && data.lessons.length > 0) {
            const lessonsWithGrades = data.lessons.filter(l => l.has_grade);
            
            if (lessonsWithGrades.length > 0) {
                gradesTableBody.innerHTML = lessonsWithGrades.map(lesson => `
                    <tr>
                        <td>${lesson.course_name}: ${lesson.title}</td>
                        <td>${lesson.teacher_name}</td>
                        <td>${lesson.published_date}</td>
                        <td><span class="grade-badge ${getGradeClass(lesson.grade)}">${lesson.grade}%</span></td>
                    </tr>
                `).join('');
            } else {
                gradesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">📝 Сізде әлі сабақ бағалары жоқ</td></tr>';
            }
        }
    } catch (error) {
        console.error('❌ Бағаларды жүктеу қатесі:', error);
    }
}

function getGradeClass(grade) {
    if (grade >= 90) return 'grade-excellent';
    if (grade >= 75) return 'grade-good';
    return 'grade-average';
}

// 🔧 Диагностика функциясы
window.debugCourses = function() {
    console.log('🔍 === ТОЛЫҚ ДИАГНОСТИКА ===');
    const baseCourseKeys = ['course_webdep', 'course_python', 'course_js', 'course_sql'];
    
    baseCourseKeys.forEach(key => {
        const userKey = getUserStorageKey(key);
        console.log(`\n📦 ${key}:`);
        console.log(`   Кілт: ${userKey}`);
        
        const data = localStorage.getItem(userKey);
        if (data) {
            try {
                const courseData = JSON.parse(data);
                console.log('   Деректер:', courseData);
            } catch (e) {
                console.error('   Қате:', e);
            }
        } else {
            console.log('   Деректер жоқ');
        }
    });
    
    console.log('\n📊 Аяқталған курстар:', getCompletedCoursesFromLocalStorage());
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Профиль бетін инициализациялау...');
    
    updateProfileStats();
    displayCertificates();
    displayLessons();
    displayGrades();
    
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(sectionId).classList.add('active');
            
            if (sectionId === 'performance') updateProfileStats();
            if (sectionId === 'certificates') displayCertificates();
            if (sectionId === 'lessons') displayLessons();
            if (sectionId === 'grades') displayGrades();
        });
    });
    
    console.log('💡 Консольда жазыңыз: debugCourses()');
});