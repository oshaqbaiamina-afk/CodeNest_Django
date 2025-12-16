from django.urls import path
from . import views

urlpatterns = [
    # Главная страница
    path('', views.index, name='index'),
    
    # Аутентификация
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    
    # Страницы пользователей
    path('courses/', views.courses, name='courses'),
    path('profile/', views.profile_view, name='profile'),
    
    # Админ-панель
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    
    # Панель учителя
    path('teacher/', views.teacher_dashboard, name='teacher_dashboard'),
    
    # API endpoints для админ-панели
    path('api/admin/stats/', views.get_admin_stats, name='get_admin_stats'),
    path('api/admin/students/', views.get_students_list, name='get_students_list'),
    path('api/admin/students/status/', views.update_student_status, name='update_student_status'),
    path('api/admin/students/delete/', views.delete_student, name='delete_student'),
    
    # API endpoints для учителей
    path('api/teacher/lessons/', views.get_teacher_lessons, name='get_teacher_lessons'),
    path('api/teacher/lessons/create/', views.create_lesson, name='create_lesson'),
    path('api/teacher/students/', views.get_teacher_students, name='get_teacher_students'),
    path('api/teacher/grades/', views.get_teacher_grades, name='get_teacher_grades'),
    path('api/teacher/grades/save/', views.save_grades, name='save_grades'),
    path('api/teacher/grades/set/', views.set_grade, name='set_grade'),
    
    # API endpoints для учеников
    path('api/student/lessons/', views.get_student_lessons, name='get_student_lessons'),
    path('api/student/stats/', views.get_student_stats, name='get_student_stats'),
    
    # Курсы (HTML файлы)
    path('course/<str:file_name>/', views.course_detail, name='course_detail'),
    
    # Поиск
    path('search/', views.search_view, name='search'),

    path('api/teacher/lessons/delete/', views.delete_lesson, name='delete_lesson'),

   # Добавьте эти URL в ваш urls.py в раздел API endpoints для админ-панели

    # API endpoints для управления студентами
    path('api/admin/students/create/', views.create_student_admin, name='create_student_admin'),

    # API endpoints для управления учителями
    path('api/admin/teachers/', views.get_teachers_list, name='get_teachers_list'),
    path('api/admin/teachers/create/', views.create_teacher, name='create_teacher'),
    path('api/admin/teachers/update/', views.update_teacher, name='update_teacher'),
    path('api/admin/teachers/delete/', views.delete_teacher, name='delete_teacher'),

    # API endpoints для оценок
    path('api/admin/grades/', views.get_all_grades, name='get_all_grades'),

    # API endpoints для курсов
    path('api/admin/courses/', views.get_courses_list, name='get_courses_list'),

    # API endpoint для экспорта данных
    path('api/admin/export/', views.export_admin_data, name='export_admin_data'),

    path('lesson/submit/', views.lesson_submission, name='lesson_submission'),
    path('teacher/check/', views.check_submissions, name='check_submissions'),
    path('api/student/lesson/<int:lesson_id>/', views.get_lesson_detail),
    path('api/student/submit-assignment/', views.submit_assignment),
    path('api/teacher/submissions/', views.get_teacher_submissions),
    path('api/teacher/submit-grade/', views.submit_grade_for_submission),
]