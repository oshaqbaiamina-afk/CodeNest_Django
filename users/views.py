import os
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout

from django.conf import settings
import uuid
from django.core.exceptions import ValidationError


from .models import CustomUser, Role, Course, Lesson, StudentTeacherAssignment, Grade
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.db.models import Q
from django.core.files.storage import default_storage
from django.utils import timezone
from datetime import datetime
import json
import re



def auto_assign_student_to_teachers(student):
    """
    Автоматически привязывает нового ученика ко ВСЕМ учителям по их курсам
    """
    print(f"🔗 Автопривязка ученика {student.email} к учителям...")
    
    # Получаем ВСЕХ учителей, у которых есть курс
    teachers = CustomUser.objects.filter(
        role=Role.TEACHER, 
        teaching_course__isnull=False
    ).select_related('teaching_course')
    
    print(f"📋 Найдено учителей: {teachers.count()}")
    
    if teachers.count() == 0:
        print("⚠️ ВНИМАНИЕ: Не найдено ни одного учителя с назначенным курсом!")
        print("Создайте учителей через Django Admin:")
        print("1. Создайте пользователя с role=TEACHER")
        print("2. Назначьте ему teaching_course")
        return
    
    created_count = 0
    existing_count = 0
    
    for teacher in teachers:
        if not teacher.teaching_course:
            print(f"⚠️ У учителя {teacher.full_name} ({teacher.email}) нет назначенного курса!")
            continue
            
        # Создаем привязку ученика к учителю по курсу учителя
        assignment, created = StudentTeacherAssignment.objects.get_or_create(
            student=student,
            teacher=teacher,
            course=teacher.teaching_course,
            defaults={
                'student': student,
                'teacher': teacher,
                'course': teacher.teaching_course
            }
        )
        
        if created:
            print(f"  ✅ Привязан к {teacher.full_name} ({teacher.teaching_course.name})")
            created_count += 1
        else:
            print(f"  ℹ️ Уже привязан к {teacher.full_name} ({teacher.teaching_course.name})")
            existing_count += 1
    
    print(f"✅ Автопривязка завершена для {student.email}")
    print(f"   Создано новых привязок: {created_count}")
    print(f"   Существующих привязок: {existing_count}")
    print(f"   Всего привязок: {created_count + existing_count}")


# =========================================================
# НОВАЯ ФУНКЦИЯ: МАССОВАЯ ПРИВЯЗКА ВСЕХ СУЩЕСТВУЮЩИХ СТУДЕНТОВ
# =========================================================
def assign_all_existing_students_to_teachers():
    """
    Привязывает ВСЕХ существующих студентов ко всем учителям
    Используйте эту функцию один раз для миграции существующих данных
    """
    print("="*70)
    print("🔄 МАССОВАЯ ПРИВЯЗКА ВСЕХ СТУДЕНТОВ К УЧИТЕЛЯМ")
    print("="*70)
    
    # Получаем всех студентов
    students = CustomUser.objects.filter(role=Role.STUDENT)
    print(f"👥 Найдено студентов: {students.count()}")
    
    # Получаем всех учителей
    teachers = CustomUser.objects.filter(
        role=Role.TEACHER, 
        teaching_course__isnull=False
    ).select_related('teaching_course')
    print(f"👨‍🏫 Найдено учителей: {teachers.count()}")
    
    if teachers.count() == 0:
        print("❌ ОШИБКА: Нет учителей с назначенными курсами!")
        print("Сначала создайте учителей в Django Admin")
        return
    
    total_created = 0
    total_existing = 0
    
    for student in students:
        print(f"\n📚 Обработка студента: {student.full_name} ({student.email})")
        
        for teacher in teachers:
            if not teacher.teaching_course:
                continue
                
            assignment, created = StudentTeacherAssignment.objects.get_or_create(
                student=student,
                teacher=teacher,
                course=teacher.teaching_course
            )
            
            if created:
                print(f"  ✅ Привязан к {teacher.full_name} ({teacher.teaching_course.name})")
                total_created += 1
            else:
                print(f"  ℹ️ Уже привязан к {teacher.full_name} ({teacher.teaching_course.name})")
                total_existing += 1
    
    print("\n" + "="*70)
    print("✅ МАССОВАЯ ПРИВЯЗКА ЗАВЕРШЕНА")
    print(f"   Всего студентов обработано: {students.count()}")
    print(f"   Всего учителей: {teachers.count()}")
    print(f"   Создано новых привязок: {total_created}")
    print(f"   Существующих привязок: {total_existing}")
    print(f"   Всего привязок: {total_created + total_existing}")
    print("="*70)



# =========================================================
# ГЛАВНАЯ СТРАНИЦА
# =========================================================
def index(request):
    """Главная страница"""
    return render(request, 'main.html')


# =========================================================
# РЕГИСТРАЦИЯ
# =========================================================
@csrf_exempt 
def register_user(request):
    """Регистрация нового пользователя (всегда STUDENT)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False, 
                'message': 'Неверный формат данных (JSON)'
            }, status=400)
            
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        # Валидация
        if password != confirm_password:
            return JsonResponse({
                'success': False, 
                'message': 'Пароли не совпадают.'
            }, status=400)

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({
                'success': False, 
                'message': 'Неверный формат Email.'
            }, status=400)

        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False, 
                'message': 'Пользователь с таким Email уже существует.'
            }, status=409)

        try:
            # Все новые регистрации - это STUDENT
            user = CustomUser.objects.create_user(
                email=email,
                password=password,
                full_name=full_name,
                role=Role.STUDENT
            )
            
            # ✅ АВТОМАТИЧЕСКАЯ ПРИВЯЗКА К УЧИТЕЛЯМ
            auto_assign_student_to_teachers(user)
            
            print(f"✅ Новый пользователь создан: {user.email} (ID: {user.id}, Role: STUDENT)")
            
            return JsonResponse({
                'success': True, 
                'message': 'Аккаунт успешно создан! Вы можете войти.'
            }, status=201)
            
        except Exception as e:
            print(f"❌ Ошибка при создании пользователя: {e}")
            return JsonResponse({
                'success': False, 
                'message': f'Ошибка базы данных: {e}'
            }, status=500)
    
    return JsonResponse({
        'success': False, 
        'message': 'Неверный метод запроса.'
    }, status=405)


# =========================================================
# ВХОД В СИСТЕМУ
# =========================================================
@csrf_exempt
def login_user(request):
    """Вход пользователя в систему"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False, 
                'message': 'Неверный формат данных (JSON)'
            }, status=400)
        
        email = data.get('email')
        password = data.get('password')
        
        print("="*50)
        print(f"LOGIN ATTEMPT: {email}")
        
        # Выходим из старой сессии ПЕРЕД входом
        if request.user.is_authenticated:
            print(f"Logging out old user: {request.user.email}")
            logout(request)
        
        # Сначала проверяем, существует ли пользователь
        try:
            user_check = CustomUser.objects.get(email=email)
            
            # Проверяем, активен ли пользователь
            if not user_check.is_active:
                print(f"❌ User is inactive: {email}")
                print("="*50)
                return JsonResponse({
                    'success': False, 
                    'message': 'Ваш аккаунт деактивирован. Обратитесь к администратору.'
                }, status=403)
                
        except CustomUser.DoesNotExist:
            print(f"❌ User not found: {email}")
            print("="*50)
            return JsonResponse({
                'success': False, 
                'message': 'Неверный Email или пароль.'
            }, status=401)
        
        # Аутентификация
        user = authenticate(request, email=email, password=password)

        if user is not None:
            # Логиним нового пользователя
            login(request, user)
            
            print(f"✅ Login successful: {user.email} (ID: {user.id}, Role: {user.role})")
            print(f"Session key: {request.session.session_key}")
            print("="*50)
            
            # Определяем куда перенаправлять пользователя
            if user.role == Role.ADMIN:
                redirect_url = reverse('admin_dashboard')
                message = f'Добро пожаловать в админ-панель, {user.full_name}!'
            elif user.role == Role.TEACHER:
                redirect_url = reverse('teacher_dashboard')
                message = f'Добро пожаловать, {user.full_name}!'
            else:  # STUDENT
                redirect_url = reverse('courses')
                message = f'Добро пожаловать, {user.full_name}!'
            
            return JsonResponse({
                'success': True, 
                'message': message,
                'redirect_url': redirect_url,
                'user_id': user.id,
                'user_email': user.email,
                'user_role': user.role
            }, status=200)
        else:
            print(f"❌ Authentication failed for: {email} (wrong password)")
            print("="*50)
            return JsonResponse({
                'success': False, 
                'message': 'Неверный Email или пароль.'
            }, status=401)

    return JsonResponse({
        'success': False, 
        'message': 'Неверный метод запроса.'
    }, status=405)


# =========================================================
# ВЫХОД
# =========================================================
@login_required
def logout_user(request):
    """Выход пользователя из системы"""
    if request.method == 'POST':
        print(f"🚪 Logging out user: {request.user.email}")
        logout(request)
        return JsonResponse({
            'success': True, 
            'message': 'Вы вышли из системы'
        })
    
    logout(request)
    return redirect('index')


# =========================================================
# ПРОФИЛЬ УЧЕНИКА
# =========================================================
@login_required
def profile_view(request):
    """Представление для личного кабинета пользователя."""
    print("="*50)
    print("PROFILE VIEW CALLED")
    print(f"Current user: {request.user.email}")
    print(f"Role: {request.user.role}")
    print("="*50)
    
    # Перенаправление в зависимости от роли
    if request.user.role == Role.ADMIN:
        return redirect('admin_dashboard')
    elif request.user.role == Role.TEACHER:
        return redirect('teacher_dashboard')
    
    context = {
        'user': request.user,
    }
    return render(request, 'main3.html', context)


# =========================================================
# СТРАНИЦА КУРСОВ
# =========================================================
@login_required
def courses(request):
    """Страница курсов (доступна только авторизованным)"""
    if request.user.role == Role.ADMIN:
        return redirect('admin_dashboard')
    elif request.user.role == Role.TEACHER:
        return redirect('teacher_dashboard')
    
    print(f"📚 Courses page accessed by: {request.user.email}")
    return render(request, 'main2.html')


# =========================================================
# АДМИН-ПАНЕЛЬ
# =========================================================
@login_required
def admin_dashboard(request):
    """Админ-панель (только для ADMIN)"""
    if request.user.role != Role.ADMIN:
        return redirect('profile')
    
    print("="*50)
    print("✅ ADMIN DASHBOARD ACCESSED")
    print(f"Admin user: {request.user.email}")
    print("="*50)
    
    context = {
        'user': request.user,
    }
    return render(request, 'admin_main.html', context)


# =========================================================
# ПАНЕЛЬ УЧИТЕЛЯ
# =========================================================
@login_required
def teacher_dashboard(request):
    """Панель учителя (только для TEACHER)"""
    if request.user.role != Role.TEACHER:
        return redirect('profile')
    
    print("="*50)
    print("✅ TEACHER DASHBOARD ACCESSED")
    print(f"Teacher: {request.user.email}")
    print(f"Teaching course: {request.user.teaching_course}")
    print("="*50)
    
    # Получаем учеников учителя
    students = StudentTeacherAssignment.objects.filter(
        teacher=request.user
    ).select_related('student', 'course')
    
    # Получаем уроки учителя
    lessons = Lesson.objects.filter(
        teacher=request.user
    ).order_by('lesson_number')
    
    context = {
        'user': request.user,
        'students': students,
        'lessons': lessons,
    }
    return render(request, 'main_teacher.html', context)


# =========================================================
# API: СОЗДАНИЕ УРОКА
# =========================================================
@login_required
def create_lesson(request):
    """API endpoint для создания урока"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        lesson_number = data.get('lesson_number')
        title = data.get('title')
        description = data.get('description', '')
        materials = data.get('materials', '')
        
        # Создаем урок
        lesson = Lesson.objects.create(
            course=request.user.teaching_course,
            teacher=request.user,
            lesson_number=lesson_number,
            title=title,
            description=description,
            materials=materials
        )
        
        print(f"✅ Lesson created: {lesson.title} by {request.user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Урок успешно создан',
            'lesson': {
                'id': lesson.id,
                'lesson_number': lesson.lesson_number,
                'title': lesson.title,
                'published_date': lesson.published_date.strftime('%Y-%m-%d %H:%M')
            }
        })
        
    except Exception as e:
        print(f"❌ Error creating lesson: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: ПОЛУЧЕНИЕ УРОКОВ УЧИТЕЛЯ
# =========================================================
@login_required
def get_teacher_lessons(request):
    """API endpoint для получения уроков учителя"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    lessons = Lesson.objects.filter(teacher=request.user).order_by('lesson_number')
    
    lessons_data = []
    for lesson in lessons:
        lessons_data.append({
            'id': lesson.id,
            'lesson_number': lesson.lesson_number,
            'title': lesson.title,
            'description': lesson.description,
            'materials': lesson.materials,
            'published_date': lesson.published_date.strftime('%Y-%m-%d %H:%M'),
        })
    
    return JsonResponse({'lessons': lessons_data})


# =========================================================
# API: ПОЛУЧЕНИЕ УЧЕНИКОВ УЧИТЕЛЯ
# =========================================================
@login_required
def get_teacher_students(request):
    """API endpoint для получения учеников учителя"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    assignments = StudentTeacherAssignment.objects.filter(
        teacher=request.user
    ).select_related('student')
    
    students_data = []
    for assignment in assignments:
        student = assignment.student
        students_data.append({
            'id': student.id,
            'name': student.full_name,
            'email': student.email,
            'assigned_date': assignment.assigned_date.strftime('%Y-%m-%d'),
        })
    
    return JsonResponse({'students': students_data})


# =========================================================
# API: ВЫСТАВЛЕНИЕ ОЦЕНКИ
# =========================================================
@login_required
def set_grade(request):
    """API endpoint для выставления оценки"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        student_id = data.get('student_id')
        lesson_id = data.get('lesson_id')
        grade_value = data.get('grade')
        comment = data.get('comment', '')
        
        # Проверяем, что урок принадлежит этому учителю
        lesson = Lesson.objects.get(id=lesson_id, teacher=request.user)
        student = CustomUser.objects.get(id=student_id, role=Role.STUDENT)
        
        # Создаем или обновляем оценку
        grade, created = Grade.objects.update_or_create(
            student=student,
            lesson=lesson,
            defaults={
                'teacher': request.user,
                'grade': grade_value,
                'comment': comment
            }
        )
        
        action = 'выставлена' if created else 'обновлена'
        print(f"✅ Grade {action}: {student.full_name} - {lesson.title}: {grade_value}%")
        
        return JsonResponse({
            'success': True,
            'message': f'Оценка {action}'
        })
        
    except Lesson.DoesNotExist:
        return JsonResponse({'error': 'Lesson not found or access denied'}, status=404)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Student not found'}, status=404)
    except Exception as e:
        print(f"❌ Error setting grade: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# АДМИН API (из предыдущей версии)
# =========================================================
@login_required
def get_admin_stats(request):
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    total_students = CustomUser.objects.filter(role=Role.STUDENT).count()
    total_teachers = CustomUser.objects.filter(role=Role.TEACHER).count()
    
    stats = {
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_courses': Course.objects.count(),
        'avg_score': 87,
    }
    
    return JsonResponse(stats)


@login_required
def get_students_list(request):
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    students = CustomUser.objects.filter(role=Role.STUDENT).order_by('-date_joined')
    
    students_data = []
    for student in students:
        students_data.append({
            'id': student.id,
            'name': student.full_name,
            'email': student.email,
            'date_joined': student.date_joined.strftime('%Y-%m-%d'),
            'is_active': student.is_active,
        })
    
    return JsonResponse({'students': students_data})


@login_required
def update_student_status(request):
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        is_active = data.get('is_active')
        
        student = CustomUser.objects.get(id=student_id, role=Role.STUDENT)
        student.is_active = is_active
        student.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Статус студента обновлен'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def delete_student(request):
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        
        student = CustomUser.objects.get(id=student_id, role=Role.STUDENT)
        student.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Студент удален'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# ДЕТАЛИ КУРСА
# =========================================================
def course_detail(request, file_name):
    """Отображает HTML-файл курса."""
    lesson_name = request.GET.get('lesson', None)
    
    context = {
        'file_name': file_name,
        'lesson_name': lesson_name,
    }
    
    return render(request, file_name, context)


def search_view(request):
    """Представление для обработки поисковых запросов"""
    query = request.GET.get('q')
    context = {
        'query': query,
        'results': []
    }
    return render(request, 'main2.html', context)


# Добавьте эти функции в ваш views.py

# =========================================================
# API: ПОЛУЧЕНИЕ ОЦЕНОК УЧИТЕЛЯ
# =========================================================
@login_required
def get_teacher_grades(request):
    """API endpoint для получения всех оценок учителя"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    grades = Grade.objects.filter(teacher=request.user).select_related('student', 'lesson')
    
    grades_data = []
    for grade in grades:
        grades_data.append({
            'student_id': grade.student.id,
            'lesson_id': grade.lesson.id,
            'grade': grade.grade,
            'comment': grade.comment,
            'graded_date': grade.graded_date.strftime('%Y-%m-%d %H:%M'),
        })
    
    return JsonResponse({'grades': grades_data})


# =========================================================
# API: МАССОВОЕ СОХРАНЕНИЕ ОЦЕНОК
# =========================================================
@login_required
@csrf_exempt
def save_grades(request):
    """API endpoint для массового сохранения оценок"""
    if request.user.role != Role.TEACHER:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        grades = data.get('grades', [])
        
        saved_count = 0
        
        for grade_data in grades:
            student_id = grade_data.get('student_id')
            lesson_id = grade_data.get('lesson_id')
            grade_value = grade_data.get('grade')
            
            try:
                # Проверяем, что урок принадлежит этому учителю
                lesson = Lesson.objects.get(id=lesson_id, teacher=request.user)
                student = CustomUser.objects.get(id=student_id, role=Role.STUDENT)
                
                # Создаем или обновляем оценку
                grade_obj, created = Grade.objects.update_or_create(
                    student=student,
                    lesson=lesson,
                    defaults={
                        'teacher': request.user,
                        'grade': grade_value,
                        'comment': ''
                    }
                )
                
                saved_count += 1
                
            except (Lesson.DoesNotExist, CustomUser.DoesNotExist) as e:
                print(f"⚠️ Skipping grade: {e}")
                continue
        
        print(f"✅ Saved {saved_count} grades")
        
        return JsonResponse({
            'success': True,
            'message': f'Сохранено оценок: {saved_count}'
        })
        
    except Exception as e:
        print(f"❌ Error saving grades: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: ПОЛУЧЕНИЕ УРОКОВ ДЛЯ УЧЕНИКА
# =========================================================
@login_required
def get_student_lessons(request):
    """API endpoint для получения уроков ученика"""
    if request.user.role != Role.STUDENT:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Получаем все курсы, к которым привязан ученик через учителей
    assignments = StudentTeacherAssignment.objects.filter(
        student=request.user
    ).select_related('course', 'teacher')
    
    lessons_data = []
    
    for assignment in assignments:
        # Получаем уроки по курсу от учителя
        lessons = Lesson.objects.filter(
            course=assignment.course,
            teacher=assignment.teacher
        ).order_by('lesson_number')
        
        for lesson in lessons:
            # Проверяем, есть ли оценка за этот урок
            grade = Grade.objects.filter(
                student=request.user,
                lesson=lesson
            ).first()
            
            lessons_data.append({
                'id': lesson.id,
                'lesson_number': lesson.lesson_number,
                'title': lesson.title,
                'description': lesson.description,
                'materials': lesson.materials,
                'course_name': assignment.course.name,
                'teacher_name': assignment.teacher.full_name,
                'published_date': lesson.published_date.strftime('%Y-%m-%d'),
                'grade': grade.grade if grade else None,
                'has_grade': grade is not None
            })
    
    return JsonResponse({'lessons': lessons_data})


# =========================================================
# API: ПОЛУЧЕНИЕ СТАТИСТИКИ УЧЕНИКА
# =========================================================
@login_required
def get_student_stats(request):
    """API endpoint для получения статистики ученика"""
    if request.user.role != Role.STUDENT:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Получаем все оценки ученика
    grades = Grade.objects.filter(student=request.user)
    
    # Получаем курсы ученика
    assignments = StudentTeacherAssignment.objects.filter(student=request.user)
    
    # Считаем статистику
    total_grades = grades.count()
    avg_grade = 0
    
    if total_grades > 0:
        total_sum = sum([g.grade for g in grades])
        avg_grade = round(total_sum / total_grades)
    
    # Считаем завершенные курсы (те, где все уроки оценены)
    completed_courses = 0
    in_progress_courses = 0
    
    for assignment in assignments:
        course_lessons = Lesson.objects.filter(
            course=assignment.course,
            teacher=assignment.teacher
        ).count()
        
        graded_lessons = Grade.objects.filter(
            student=request.user,
            lesson__course=assignment.course,
            lesson__teacher=assignment.teacher
        ).count()
        
        if course_lessons > 0:
            if graded_lessons == course_lessons:
                completed_courses += 1
            elif graded_lessons > 0:
                in_progress_courses += 1
    
    # Считаем сертификаты (оценки 100%)
    certificates = grades.filter(grade=100).count()
    
    stats = {
        'completed_courses': completed_courses,
        'in_progress_courses': in_progress_courses,
        'average_grade': avg_grade,
        'certificates_count': certificates,
        'total_grades': total_grades,
    }
    
    return JsonResponse(stats)

# Добавьте эти функции в ваш views.py

# =========================================================
# API: ПОЛУЧЕНИЕ СПИСКА УЧИТЕЛЕЙ
# =========================================================
@login_required
def get_teachers_list(request):
    """API endpoint для получения списка учителей"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    teachers = CustomUser.objects.filter(role=Role.TEACHER).select_related('teaching_course')
    
    teachers_data = []
    for teacher in teachers:
        # Подсчитываем количество учеников
        students_count = StudentTeacherAssignment.objects.filter(teacher=teacher).count()
        
        # Подсчитываем количество уроков
        lessons_count = Lesson.objects.filter(teacher=teacher).count()
        
        teachers_data.append({
            'id': teacher.id,
            'name': teacher.full_name,
            'email': teacher.email,
            'course_name': teacher.teaching_course.name if teacher.teaching_course else None,
            'course_id': teacher.teaching_course.id if teacher.teaching_course else None,
            'students_count': students_count,
            'lessons_count': lessons_count,
            'is_active': teacher.is_active,
            'date_joined': teacher.date_joined.strftime('%Y-%m-%d'),
        })
    
    return JsonResponse({'teachers': teachers_data})


# =========================================================
# API: СОЗДАНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def create_teacher(request):
    """API endpoint для создания учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        course_id = data.get('course_id')
        
        # Проверяем, существует ли пользователь с таким email
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Пользователь с таким email уже существует'
            }, status=409)
        
        # Получаем курс
        course = None
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Курс не найден'
                }, status=404)
        
        # Создаем учителя
        teacher = CustomUser.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role=Role.TEACHER,
            teaching_course=course
        )
        
        print(f"✅ Новый учитель создан: {teacher.email} (Course: {course.name if course else 'None'})")
        
        return JsonResponse({
            'success': True,
            'message': 'Учитель успешно создан',
            'teacher': {
                'id': teacher.id,
                'name': teacher.full_name,
                'email': teacher.email,
                'course_name': course.name if course else None
            }
        }, status=201)
        
    except Exception as e:
        print(f"❌ Ошибка создания учителя: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Ошибка: {str(e)}'
        }, status=500)


# =========================================================
# API: ОБНОВЛЕНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def update_teacher(request):
    """API endpoint для обновления данных учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        teacher_id = data.get('teacher_id')
        full_name = data.get('full_name')
        course_id = data.get('course_id')
        
        teacher = CustomUser.objects.get(id=teacher_id, role=Role.TEACHER)
        
        if full_name:
            teacher.full_name = full_name
        
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
                teacher.teaching_course = course
            except Course.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Курс не найден'
                }, status=404)
        
        teacher.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Данные учителя обновлены'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: УДАЛЕНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def delete_teacher(request):
    """API endpoint для удаления учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        teacher_id = data.get('teacher_id')
        
        teacher = CustomUser.objects.get(id=teacher_id, role=Role.TEACHER)
        teacher.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Учитель удален'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: ПОЛУЧЕНИЕ СПИСКА КУРСОВ
# =========================================================
@login_required
def get_courses_list(request):
    """API endpoint для получения списка курсов"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    courses = Course.objects.all()
    
    courses_data = []
    for course in courses:
        # Подсчитываем статистику по курсу
        teachers_count = CustomUser.objects.filter(
            role=Role.TEACHER, 
            teaching_course=course
        ).count()
        
        lessons_count = Lesson.objects.filter(course=course).count()
        
        courses_data.append({
            'id': course.id,
            'name': course.name,
            'course_type': course.course_type,
            'description': course.description,
            'teachers_count': teachers_count,
            'lessons_count': lessons_count,
        })
    
    return JsonResponse({'courses': courses_data})


# =========================================================
# API: ЭКСПОРТ ДАННЫХ
# =========================================================
@login_required
def export_admin_data(request):
    """API endpoint для экспорта всех данных системы"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Собираем все данные
    students = CustomUser.objects.filter(role=Role.STUDENT)
    teachers = CustomUser.objects.filter(role=Role.TEACHER).select_related('teaching_course')
    courses = Course.objects.all()
    lessons = Lesson.objects.all().select_related('course', 'teacher')
    grades = Grade.objects.all().select_related('student', 'lesson', 'teacher')
    
    export_data = {
        'export_date': datetime.now().isoformat(),
        'students': [{
            'id': s.id,
            'name': s.full_name,
            'email': s.email,
            'date_joined': s.date_joined.strftime('%Y-%m-%d'),
            'is_active': s.is_active
        } for s in students],
        'teachers': [{
            'id': t.id,
            'name': t.full_name,
            'email': t.email,
            'course': t.teaching_course.name if t.teaching_course else None,
            'date_joined': t.date_joined.strftime('%Y-%m-%d'),
            'is_active': t.is_active
        } for t in teachers],
        'courses': [{
            'id': c.id,
            'name': c.name,
            'course_type': c.course_type,
            'description': c.description
        } for c in courses],
        'lessons': [{
            'id': l.id,
            'course': l.course.name,
            'teacher': l.teacher.full_name,
            'lesson_number': l.lesson_number,
            'title': l.title,
            'published_date': l.published_date.strftime('%Y-%m-%d')
        } for l in lessons],
        'grades': [{
            'student': g.student.full_name,
            'lesson': g.lesson.title,
            'teacher': g.teacher.full_name,
            'grade': g.grade,
            'graded_date': g.graded_date.strftime('%Y-%m-%d')
        } for g in grades],
        'statistics': {
            'total_students': students.count(),
            'total_teachers': teachers.count(),
            'total_courses': courses.count(),
            'total_lessons': lessons.count(),
            'total_grades': grades.count()
        }
    }
    
    return JsonResponse(export_data)


# Добавьте эти функции в ваш views.py

# =========================================================
# API: СОЗДАНИЕ СТУДЕНТА АДМИНОМ
# =========================================================
@login_required
@csrf_exempt
def create_student_admin(request):
    """API endpoint для создания студента администратором"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        
        # Валидация
        if not full_name or not email or not password:
            return JsonResponse({
                'success': False,
                'message': 'Заполните все обязательные поля'
            }, status=400)
        
        # Проверяем email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({
                'success': False,
                'message': 'Неверный формат Email'
            }, status=400)
        
        # Проверяем, существует ли пользователь
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Пользователь с таким email уже существует'
            }, status=409)
        
        # Создаем студента
        student = CustomUser.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role=Role.STUDENT
        )
        
        # Автоматическая привязка к учителям
        auto_assign_student_to_teachers(student)
        
        print(f"✅ Новый студент создан админом: {student.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Ученик успешно создан',
            'student': {
                'id': student.id,
                'name': student.full_name,
                'email': student.email
            }
        }, status=201)
        
    except Exception as e:
        print(f"❌ Ошибка создания студента: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Ошибка: {str(e)}'
        }, status=500)


# =========================================================
# API: ПОЛУЧЕНИЕ ВСЕХ ОЦЕНОК (ДЛЯ АДМИНА)
# =========================================================
@login_required
def get_all_grades(request):
    """API endpoint для получения всех оценок в системе"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    grades = Grade.objects.all().select_related(
        'student', 
        'lesson', 
        'lesson__course', 
        'teacher'
    ).order_by('-graded_date')
    
    grades_data = []
    for grade in grades:
        grades_data.append({
            'id': grade.id,
            'student_name': grade.student.full_name,
            'student_email': grade.student.email,
            'teacher_name': grade.teacher.full_name,
            'course_name': grade.lesson.course.name,
            'lesson_title': grade.lesson.title,
            'lesson_number': grade.lesson.lesson_number,
            'grade': grade.grade,
            'comment': grade.comment,
            'graded_date': grade.graded_date.strftime('%Y-%m-%d %H:%M'),
        })
    
    return JsonResponse({'grades': grades_data})


# =========================================================
# API: ПОЛУЧЕНИЕ СПИСКА УЧИТЕЛЕЙ
# =========================================================
@login_required
def get_teachers_list(request):
    """API endpoint для получения списка учителей"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    teachers = CustomUser.objects.filter(role=Role.TEACHER).select_related('teaching_course')
    
    teachers_data = []
    for teacher in teachers:
        # Подсчитываем количество учеников
        students_count = StudentTeacherAssignment.objects.filter(teacher=teacher).count()
        
        # Подсчитываем количество уроков
        lessons_count = Lesson.objects.filter(teacher=teacher).count()
        
        teachers_data.append({
            'id': teacher.id,
            'name': teacher.full_name,
            'email': teacher.email,
            'course_name': teacher.teaching_course.name if teacher.teaching_course else None,
            'course_id': teacher.teaching_course.id if teacher.teaching_course else None,
            'students_count': students_count,
            'lessons_count': lessons_count,
            'is_active': teacher.is_active,
            'date_joined': teacher.date_joined.strftime('%Y-%m-%d'),
        })
    
    return JsonResponse({'teachers': teachers_data})


# =========================================================
# API: СОЗДАНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def create_teacher(request):
    """API endpoint для создания учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        course_id = data.get('course_id')
        
        # Проверяем, существует ли пользователь с таким email
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Пользователь с таким email уже существует'
            }, status=409)
        
        # Получаем курс
        course = None
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Курс не найден'
                }, status=404)
        
        # Создаем учителя
        teacher = CustomUser.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role=Role.TEACHER,
            teaching_course=course
        )
        
        print(f"✅ Новый учитель создан: {teacher.email} (Course: {course.name if course else 'None'})")
        
        return JsonResponse({
            'success': True,
            'message': 'Учитель успешно создан',
            'teacher': {
                'id': teacher.id,
                'name': teacher.full_name,
                'email': teacher.email,
                'course_name': course.name if course else None
            }
        }, status=201)
        
    except Exception as e:
        print(f"❌ Ошибка создания учителя: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Ошибка: {str(e)}'
        }, status=500)


# =========================================================
# API: ОБНОВЛЕНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def update_teacher(request):
    """API endpoint для обновления данных учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        teacher_id = data.get('teacher_id')
        full_name = data.get('full_name')
        course_id = data.get('course_id')
        
        teacher = CustomUser.objects.get(id=teacher_id, role=Role.TEACHER)
        
        if full_name:
            teacher.full_name = full_name
        
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
                teacher.teaching_course = course
            except Course.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Курс не найден'
                }, status=404)
        
        teacher.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Данные учителя обновлены'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: УДАЛЕНИЕ УЧИТЕЛЯ
# =========================================================
@login_required
@csrf_exempt
def delete_teacher(request):
    """API endpoint для удаления учителя"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        teacher_id = data.get('teacher_id')
        
        teacher = CustomUser.objects.get(id=teacher_id, role=Role.TEACHER)
        teacher.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Учитель удален'
        })
        
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# API: ПОЛУЧЕНИЕ СПИСКА КУРСОВ
# =========================================================
@login_required
def get_courses_list(request):
    """API endpoint для получения списка курсов"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    courses = Course.objects.all()
    
    courses_data = []
    for course in courses:
        # Подсчитываем статистику по курсу
        teachers_count = CustomUser.objects.filter(
            role=Role.TEACHER, 
            teaching_course=course
        ).count()
        
        lessons_count = Lesson.objects.filter(course=course).count()
        
        courses_data.append({
            'id': course.id,
            'name': course.name,
            'course_type': course.course_type,
            'description': course.description,
            'teachers_count': teachers_count,
            'lessons_count': lessons_count,
        })
    
    return JsonResponse({'courses': courses_data})


# =========================================================
# API: ЭКСПОРТ ДАННЫХ
# =========================================================
@login_required
def export_admin_data(request):
    """API endpoint для экспорта всех данных системы"""
    if request.user.role != Role.ADMIN:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Собираем все данные
    students = CustomUser.objects.filter(role=Role.STUDENT)
    teachers = CustomUser.objects.filter(role=Role.TEACHER).select_related('teaching_course')
    courses = Course.objects.all()
    lessons = Lesson.objects.all().select_related('course', 'teacher')
    grades = Grade.objects.all().select_related('student', 'lesson', 'teacher')
    
    export_data = {
        'export_date': datetime.now().isoformat(),
        'students': [{
            'id': s.id,
            'name': s.full_name,
            'email': s.email,
            'date_joined': s.date_joined.strftime('%Y-%m-%d'),
            'is_active': s.is_active
        } for s in students],
        'teachers': [{
            'id': t.id,
            'name': t.full_name,
            'email': t.email,
            'course': t.teaching_course.name if t.teaching_course else None,
            'date_joined': t.date_joined.strftime('%Y-%m-%d'),
            'is_active': t.is_active
        } for t in teachers],
        'courses': [{
            'id': c.id,
            'name': c.name,
            'course_type': c.course_type,
            'description': c.description
        } for c in courses],
        'lessons': [{
            'id': l.id,
            'course': l.course.name,
            'teacher': l.teacher.full_name,
            'lesson_number': l.lesson_number,
            'title': l.title,
            'published_date': l.published_date.strftime('%Y-%m-%d')
        } for l in lessons],
        'grades': [{
            'student': g.student.full_name,
            'lesson': g.lesson.title,
            'teacher': g.teacher.full_name,
            'grade': g.grade,
            'graded_date': g.graded_date.strftime('%Y-%m-%d')
        } for g in grades],
        'statistics': {
            'total_students': students.count(),
            'total_teachers': teachers.count(),
            'total_courses': courses.count(),
            'total_lessons': lessons.count(),
            'total_grades': grades.count()
        }
    }
    
    return JsonResponse(export_data)



@login_required
def lesson_submission(request):
    """Страница выполнения урока учеником"""
    return render(request, 'lesson_submission.html')


@login_required
def check_submissions(request):
    """Страница проверки заданий учителем"""
    if request.user.role != Role.TEACHER:
        return redirect('courses')
    return render(request, 'check_submissions.html')


# =============================================================================
# API ДЛЯ ПОЛУЧЕНИЯ ИНФОРМАЦИИ ОБ УРОКЕ
# =============================================================================

@login_required
@require_http_methods(["GET"])
def get_lesson_detail(request, lesson_id):
    """Получить детальную информацию об уроке"""
    try:
        lesson = Lesson.objects.select_related('teacher', 'course').get(id=lesson_id)
        
        return JsonResponse({
            'id': lesson.id,
            'lesson_number': lesson.lesson_number,
            'title': lesson.title,
            'description': lesson.description,
            'materials': lesson.materials,
            'published_date': lesson.published_date.strftime('%d.%m.%Y'),
            'teacher_name': lesson.teacher.full_name,
            'course_name': lesson.course.name,
        })
        
    except Lesson.DoesNotExist:
        return JsonResponse({'error': 'Урок не найден'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =============================================================================
# МОДЕЛИ ДЛЯ ОТПРАВЛЕННЫХ ЗАДАНИЙ (добавьте в models.py если их нет)
# =============================================================================
"""
ВАЖНО: Добавьте эти модели в ваш models.py:

class Submission(models.Model):
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.STUDENT},
        related_name='submissions'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    submission_text = models.TextField(blank=True, null=True)
    submitted_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'lesson']
        ordering = ['-submitted_date']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.lesson.title}"


class SubmissionFile(models.Model):
    submission = models.ForeignKey(
        'Submission',
        on_delete=models.CASCADE,
        related_name='files'
    )
    file = models.FileField(upload_to='submissions/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.filename
"""


# =============================================================================
# API ДЛЯ ОТПРАВКИ ЗАДАНИЯ УЧЕНИКОМ
# =============================================================================

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def submit_assignment(request):
    """Тапсырма жіберу (файл валидациясымен)"""
    try:
        if request.user.role != Role.STUDENT:
            return JsonResponse({
                'success': False, 
                'message': 'Тек оқушылар тапсырма жібере алады'
            }, status=403)
        
        lesson_id = request.POST.get('lesson_id')
        submission_text = request.POST.get('submission_text', '')
        
        if not lesson_id:
            return JsonResponse({
                'success': False, 
                'message': 'Сабақ ID көрсетілмеген'
            }, status=400)
        
        # Файлдарды тексеру
        files = request.FILES.getlist('files')
        
        # ✅ ЖАҢА: Файлдар санын тексеру
        if len(files) > settings.MAX_FILES_PER_SUBMISSION:
            return JsonResponse({
                'success': False,
                'message': f'Тым көп файл! Максималды: {settings.MAX_FILES_PER_SUBMISSION}'
            }, status=400)
        
        # ✅ ЖАҢА: Әрбір файлды валидациялау
        for file in files:
            try:
                validate_uploaded_file(file)
            except ValidationError as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Файл қатесі "{file.name}": {str(e)}'
                }, status=400)
        
        # Сабақты тексеру
        lesson = get_object_or_404(Lesson, id=lesson_id)
        
        from .models import Submission, SubmissionFile
        
        # Ескі тапсырманы жою
        try:
            old_submission = Submission.objects.get(
                student=request.user, 
                lesson=lesson
            )
            
            # Ескі файлдарды жою
            for old_file in old_submission.files.all():
                if old_file.file:
                    file_path = os.path.join(
                        settings.MEDIA_ROOT, 
                        str(old_file.file)
                    )
                    if os.path.exists(file_path):
                        os.remove(file_path)
                old_file.delete()
            
            old_submission.delete()
            
        except Submission.DoesNotExist:
            pass
        
        # Жаңа тапсырма жасау
        submission = Submission.objects.create(
            student=request.user,
            lesson=lesson,
            submission_text=submission_text,
            submitted_date=timezone.now()
        )
        
        # Файлдарды сақтау
        file_urls = []
        
        for file in files:
            import uuid
            file_extension = file.name.split('.')[-1] if '.' in file.name else 'bin'
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            relative_path = f"submissions/{request.user.id}/{lesson_id}/"
            full_dir_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            os.makedirs(full_dir_path, exist_ok=True)
            
            relative_file_path = os.path.join(relative_path, unique_filename)
            full_file_path = os.path.join(settings.MEDIA_ROOT, relative_file_path)
            
            # Файлды сақтау
            with open(full_file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            # Дерекқорға жазу
            file_url = settings.MEDIA_URL + relative_file_path.replace('\\', '/')
            
            submission_file = SubmissionFile.objects.create(
                submission=submission,
                file=relative_file_path,
                filename=file.name
            )
            
            file_urls.append({
                'name': file.name,
                'url': file_url,
                'size': f'{file.size / 1024:.1f} KB'
            })
        
        return JsonResponse({
            'success': True,
            'message': 'Тапсырма сәтті жіберілді',
            'submission_id': submission.id,
            'files': file_urls
        })
        
    except ValidationError as ve:
        return JsonResponse({
            'success': False, 
            'message': str(ve)
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=500)

# =============================================================================
# API ДЛЯ ПОЛУЧЕНИЯ ЗАДАНИЙ УЧИТЕЛЕМ
# =============================================================================

@login_required
@require_http_methods(["GET"])
def get_teacher_submissions(request):
    """Получить все задания для проверки учителем"""
    try:
        if request.user.role != Role.TEACHER:
            return JsonResponse({'error': 'Доступ запрещён'}, status=403)
        
        from .models import Submission, SubmissionFile
        
        # Получаем все уроки данного учителя
        teacher_lessons = Lesson.objects.filter(teacher=request.user)
        
        # Получаем все отправленные задания по этим урокам
        submissions = Submission.objects.filter(
            lesson__in=teacher_lessons
        ).select_related('student', 'lesson').order_by('-submitted_date')
        
        submissions_data = []
        for submission in submissions:
            # Получаем файлы задания
            files = SubmissionFile.objects.filter(submission=submission)
            files_data = []
            
            for f in files:
                try:
                    # ✅ ИСПРАВЛЕНИЕ: Правильно формируем URL файла
                    file_url = settings.MEDIA_URL + str(f.file)
                    files_data.append({'name': f.filename, 'url': file_url})
                    print(f"📎 Файл: {f.filename} -> {file_url}")
                except Exception as e:
                    print(f"⚠️ Ошибка получения URL файла: {e}")
                    files_data.append({'name': f.filename, 'url': '#'})
            
            # Проверяем, есть ли оценка
            grade = Grade.objects.filter(
                student=submission.student,
                lesson=submission.lesson
            ).first()
            
            submissions_data.append({
                'id': submission.id,
                'student_id': submission.student.id,
                'student_name': submission.student.full_name,
                'lesson_id': submission.lesson.id,
                'lesson_number': submission.lesson.lesson_number,
                'lesson_title': submission.lesson.title,
                'submission_text': submission.submission_text,
                'submitted_date': submission.submitted_date.strftime('%d.%m.%Y %H:%M'),
                'files': files_data,
                'has_grade': grade is not None,
                'grade': grade.grade if grade else None,
                'feedback': grade.comment if grade else None
            })
        
        print(f"✅ Найдено заданий: {len(submissions_data)}")
        return JsonResponse({'submissions': submissions_data})
        
    except Exception as e:
        print(f"❌ Ошибка загрузки заданий: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)

# =============================================================================
# API ДЛЯ ВЫСТАВЛЕНИЯ ОЦЕНКИ УЧИТЕЛЕМ
# =============================================================================

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def submit_grade_for_submission(request):
    """Выставление оценки за задание"""
    try:
        if request.user.role != Role.TEACHER:
            return JsonResponse({
                'success': False, 
                'message': 'Доступ запрещен'
            }, status=403)
        
        data = json.loads(request.body)
        
        submission_id = data.get('submission_id')
        student_id = data.get('student_id')
        lesson_id = data.get('lesson_id')
        grade_value = data.get('grade')
        feedback = data.get('feedback', '')
        
        if not all([submission_id, student_id, lesson_id, grade_value is not None]):
            return JsonResponse({
                'success': False, 
                'message': 'Не все данные предоставлены'
            }, status=400)
        
        if not (0 <= grade_value <= 100):
            return JsonResponse({
                'success': False, 
                'message': 'Оценка должна быть от 0 до 100'
            }, status=400)
        
        # Проверяем, что урок принадлежит этому учителю
        lesson = get_object_or_404(Lesson, id=lesson_id, teacher=request.user)
        student = get_object_or_404(CustomUser, id=student_id, role=Role.STUDENT)
        
        # Создаем или обновляем оценку
        grade, created = Grade.objects.update_or_create(
            student=student,
            lesson=lesson,
            defaults={
                'teacher': request.user,
                'grade': grade_value,
                'comment': feedback,
                'graded_date': timezone.now()
            }
        )
        
        action = 'выставлена' if created else 'обновлена'
        print(f"✅ Оценка {action}: {student.full_name} - {lesson.title}: {grade_value}%")
        
        return JsonResponse({
            'success': True,
            'message': f'Оценка успешно {action}',
            'grade_id': grade.id
        })
        
    except Exception as e:
        print(f"❌ Ошибка выставления оценки: {e}")
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=500)


@login_required
@csrf_exempt
def save_course_progress(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body)
        course_name = data.get('course_name')  # 'webdep', 'python', etc.
        completed_lessons = data.get('completed_lessons', 0)
        is_completed = data.get('is_completed', False)
        
        # Сохранить в базу или в модель пользователя
        # ...
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def delete_lesson(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        lesson_id = data.get('lesson_id')
        
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            lesson.delete()
            
            return JsonResponse({'success': True, 'message': 'Урок удалён'})
        except Lesson.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Урок не найден'})
        


def validate_uploaded_file(uploaded_file):
    """Файлды тексеру"""
    
    # 1. Өлшемін тексеру
    max_size = settings.FILE_UPLOAD_MAX_MEMORY_SIZE
    if uploaded_file.size > max_size:
        raise ValidationError(
            f'Файл тым үлкен! Максималды: {max_size / (1024*1024):.1f} MB'
        )
    
    # 2. Форматын тексеру
    ext = uploaded_file.name.split('.')[-1].lower()
    if ext not in settings.ALLOWED_FILE_EXTENSIONS:
        raise ValidationError(
            f'Рұқсат етілмеген файл типі: .{ext}\n'
            f'Рұқсат етілгендер: {", ".join(settings.ALLOWED_FILE_EXTENSIONS)}'
        )
    
    # 3. Вирус тексеру (опционально - python-magic пакеті керек)
    # import magic
    # mime = magic.from_buffer(uploaded_file.read(1024), mime=True)
    # if mime not in ALLOWED_MIME_TYPES:
    #     raise ValidationError('Қауіпті файл анықталды!')
    
    return True
