
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


function getCurrentTeacherEmail() {
    const metaUser = document.querySelector('meta[name="user-email"]');
    if (metaUser) {
        return metaUser.getAttribute('content');
    }
    return null;
}


async function logout(targetUrl) { 

    if (!confirm('Сіз шыққыңыз келетініне сенімдісіз бе?')) {
        return;
    }

    console.log('🚪 Жүйеден шығу...');
    
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
            console.log('✅ Шығу сәтті');
            console.log('🧹 sessionStorage тазалау...');
            sessionStorage.removeItem('currentUserEmail');
            sessionStorage.removeItem('lastUser');
            console.log('🔄 Басты бетке қайта бағыттау...');
            window.location.replace(targetUrl || '/'); 
        } else {
            console.error('❌ Шығу сәтсіз');
            alert('Жүйеден шығу қатесі. Қайталап көріңіз.');
        }
    } catch (error) {
        console.error('❌ Шығу қатесі:', error);
        alert('Шығу әрекеті кезінде қате пайда болды. Қосылымды тексеріңіз.');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Мұғалім панелін инициализациялау...');
    
    loadJournal();
    loadTeacherLessons();
    
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const sectionId = this.getAttribute('data-section');
            switchSection(sectionId);
            
            if (sectionId === 'journal') {
                loadJournal();
            } else if (sectionId === 'lessons') {
                loadTeacherLessons();
            }
        });
    });
});

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}


async function loadJournal() {
    console.log('📊 Журналды жүктеу...');
    
    try {
        const studentsResponse = await fetch('/api/teacher/students/');
        const studentsData = await studentsResponse.json();
        
        const lessonsResponse = await fetch('/api/teacher/lessons/');
        const lessonsData = await lessonsResponse.json();
        
        const gradesResponse = await fetch('/api/teacher/grades/');
        const gradesData = await gradesResponse.json();
        
        console.log('Оқушылар:', studentsData);
        console.log('Сабақтар:', lessonsData);
        console.log('Бағалар:', gradesData);
        
        renderJournal(studentsData.students, lessonsData.lessons, gradesData.grades);
        
    } catch (error) {
        console.error('❌ Журналды жүктеу қатесі:', error);
    }
}

function renderJournal(students, lessons, grades) {
    const table = document.getElementById('journalTable');
    const tbody = document.getElementById('journalBody');
    
    if (!table || !tbody) {
        console.error('❌ Кесте элементтері табылмады');
        return;
    }
    
    const thead = table.querySelector('thead tr');
    thead.innerHTML = `
        <th>ID</th>
        <th>Аты</th>
        <th>Email</th>
        ${lessons.map(lesson => `
            <th class="lesson-id-header" data-lesson="${lesson.id}">
                Сабақ #${lesson.lesson_number}
            </th>
        `).join('')}
    `;
    
    tbody.innerHTML = students.map(student => {
        return `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                ${lessons.map(lesson => {
                    const grade = grades.find(g => 
                        g.student_id === student.id && g.lesson_id === lesson.id
                    );
                    const gradeValue = grade ? grade.grade : '';
                    
                    return `
                        <td>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value="${gradeValue}"
                                data-student="${student.id}" 
                                data-lesson="${lesson.id}"
                                class="grade-input"
                                disabled
                            >
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
    
    console.log('✅ Журнал рендерленді');
}


function enableEdit() {
    const inputs = document.querySelectorAll('.grade-input');
    inputs.forEach(input => {
        input.disabled = false;
        input.style.background = '#fff';
        input.style.border = '2px solid #667eea';
    });
    
    console.log('📝 Өңдеу режимі белсендірілді');
    alert('📝 Өңдеу режимі белсендірілді!\nБағаларды өзгертіп, "Сақтау" батырмасын басыңыз.');
}

async function saveGrades() {
    console.log('💾 Бағаларды сақтау...');
    
    const inputs = document.querySelectorAll('.grade-input');
    const grades = [];
    
    inputs.forEach(input => {
        const studentId = input.getAttribute('data-student');
        const lessonId = input.getAttribute('data-lesson');
        const gradeValue = input.value;
        
        if (gradeValue !== '') {
            grades.push({
                student_id: parseInt(studentId),
                lesson_id: parseInt(lessonId),
                grade: parseInt(gradeValue)
            });
        }
    });
    
    console.log('Сақтауға арналған бағалар:', grades);
    
    try {
        const response = await fetch('/api/teacher/grades/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ grades })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Бағалар сәтті сақталды!');
            
            inputs.forEach(input => {
                input.disabled = true;
                input.style.background = '#f5f5f5';
                input.style.border = '2px solid #e0e0e0';
            });
            
            loadJournal();
        } else {
            alert('❌ Сақтау қатесі: ' + data.message);
        }
        
    } catch (error) {
        console.error('❌ Бағаларды сақтау қатесі:', error);
        alert('❌ Бағаларды сақтау қатесі');
    }
}


let lessonCounter = 1;

async function loadTeacherLessons() {
    try {
        const response = await fetch('/api/teacher/lessons/');
        const data = await response.json();
        
        if (data.lessons && data.lessons.length > 0) {
            lessonCounter = Math.max(...data.lessons.map(l => l.lesson_number)) + 1;
        }
        
        renderAssignedLessons(data.lessons);
        
    } catch (error) {
        console.error('❌ Сабақтарды жүктеу қатесі:', error);
    }
}

function renderAssignedLessons(lessons) {
    const container = document.getElementById('assignedLessons');
    
    if (!container) return;
    
    if (lessons.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: white; font-size: 1.2rem;">
                📚 Әзірге жасалған сабақтарыңыз жоқ
            </div>
        `;
        return;
    }
    
    container.innerHTML = lessons.map(lesson => `
        <div class="list-item" data-lesson-id="${lesson.id}" style="position: relative;">
            <div>
                <div class="list-item-label">Сабақ нөмірі</div>
                <div class="list-item-field">#${lesson.lesson_number}</div>
            </div>
            <div>
                <div class="list-item-label">Атауы</div>
                <div class="list-item-field">${lesson.title}</div>
            </div>
            <div>
                <div class="list-item-label">Сипаттама</div>
                <div class="list-item-field">${lesson.description || 'Сипаттама жоқ'}</div>
            </div>
            <div>
                <div class="list-item-label">Жариялау күні</div>
                <div class="list-item-field">${lesson.published_date}</div>
            </div>
            <button class="btn btn-danger btn-sm delete-lesson-btn" 
                    onclick="deleteLesson(${lesson.id}, '${lesson.title}')"
                    style="position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);">
                🗑️ Жою
            </button>
        </div>
    `).join('');
    
    const checkButton = document.createElement('button');
    checkButton.className = 'btn btn-add';
    checkButton.style.marginTop = '2rem';
    checkButton.textContent = '✅ Оқушылардың тапсырмаларын тексеру';
    checkButton.onclick = goToCheckSubmissions;
    
    container.appendChild(checkButton);
}

function goToCheckSubmissions() {
    console.log('📝 Тапсырмаларды тексеру бетіне өту');
    window.location.href = '/teacher/check/';
}

async function submitLesson(button) {
    const form = button.closest('.lesson-form');
    const lessonNumber = form.querySelector('input[readonly]').value;
    const lessonName = form.querySelectorAll('.form-input')[1].value;
    const materials = form.querySelectorAll('.form-input')[2].value;
    const description = form.querySelectorAll('.form-input')[3]?.value || '';
    
    if (lessonName.trim() === '') {
        alert('⚠️ Сабақтың атауын толтырыңыз!');
        return;
    }
    
    console.log('📤 Сабақты жіберу:', {
        lesson_number: lessonNumber,
        title: lessonName,
        description: description,
        materials: materials
    });
    
    try {
        const response = await fetch('/api/teacher/lessons/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                lesson_number: parseInt(lessonNumber),
                title: lessonName,
                description: description,
                materials: materials
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Сабақ #${lessonNumber} "${lessonName}" сәтті қосылды!`);
            
            form.querySelectorAll('.form-input').forEach((input, index) => {
                if (index > 0) input.value = '';
            });
            
            loadTeacherLessons();
            loadJournal();
        } else {
            alert('❌ Қате: ' + data.message);
        }
        
    } catch (error) {
        console.error('❌ Сабақ жасау қатесі:', error);
        alert('❌ Сабақ жасау қатесі');
    }
}

function addNewLessonForm() {
    const container = document.getElementById('lessonFormsContainer');
    const newForm = document.createElement('div');
    newForm.className = 'form-container lesson-form';
    newForm.innerHTML = `
        <div class="form-group">
            <label class="form-label">Сабақ нөмірі</label>
            <input type="text" class="form-input" value="${lessonCounter}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Сабақтың атауы</label>
            <input type="text" class="form-input" placeholder="Сабақтың атауын енгізіңіз...">
        </div>
        <div class="form-group">
            <label class="form-label">Қосымша материалдар</label>
            <textarea class="form-input" placeholder="Материалдарға, бейнелерге, құжаттарға сілтемелер..."></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Сабақтың сипаттамасы</label>
            <textarea class="form-input" placeholder="Сабақтың қысқаша сипаттамасы..."></textarea>
        </div>
        <div style="display: flex; gap: 1rem;">
            <button class="btn btn-save" onclick="submitLesson(this)">Жіберу</button>
        </div>
    `;
    container.appendChild(newForm);
    lessonCounter++;
    
    console.log('➕ Жаңа сабақ формасы қосылды #' + (lessonCounter - 1));
}


async function deleteLesson(lessonId, lessonTitle) {
    if (!confirm(`⚠️ "${lessonTitle}" сабағын жоюға сенімдісіз бе?\n\nБұл сабақ бойынша барлық бағалар да жойылады!`)) {
        return;
    }
    
    console.log('🗑️ Сабақты жою:', lessonId);
    
    try {
        const response = await fetch('/api/teacher/lessons/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                lesson_id: lessonId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ "${lessonTitle}" сабағы сәтті жойылды!`);
            loadTeacherLessons();
            loadJournal();
        } else {
            alert('❌ Жою қатесі: ' + data.message);
        }
        
    } catch (error) {
        console.error('❌ Сабақты жою қатесі:', error);
        alert('❌ Сабақты жою қатесі');
    }
}