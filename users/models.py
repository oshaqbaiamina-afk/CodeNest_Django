from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


# =========================================================
# 1. ОПРЕДЕЛЕНИЕ РОЛЕЙ (ТРИ РОЛИ)
# =========================================================
class Role(models.TextChoices):
    ADMIN = 'ADMIN', _('Администратор')
    TEACHER = 'TEACHER', _('Учитель')
    STUDENT = 'STUDENT', _('Ученик')


# =========================================================
# 2. МОДЕЛЬ КУРСА
# =========================================================
class Course(models.Model):
    COURSE_TYPES = [
        ('webdep', 'Web Development'),
        ('python', 'Python Programming'),
        ('js', 'JavaScript'),
        ('sql', 'SQL Database'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name=_('Название курса'))
    course_type = models.CharField(max_length=20, choices=COURSE_TYPES, unique=True, verbose_name=_('Тип курса'))
    description = models.TextField(blank=True, verbose_name=_('Описание'))
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('Курс')
        verbose_name_plural = _('Курсы')


# =========================================================
# 3. МЕНЕДЖЕР ПОЛЬЗОВАТЕЛЕЙ
# =========================================================
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        
        email = self.normalize_email(email)
        extra_fields.setdefault('role', Role.STUDENT) 
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', Role.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


# =========================================================
# 4. МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ
# =========================================================
class CustomUser(AbstractUser):
    username = None

    full_name = models.CharField(max_length=100, blank=False, default='')
    email = models.EmailField(unique=True)
    
    # Поле Роли (ADMIN, TEACHER или STUDENT)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT, 
        verbose_name=_('Роль')
    )
    
    # Для учителя - курс, который он ведет
    teaching_course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teachers',
        verbose_name=_('Преподаваемый курс')
    )
    
    # Настройки для входа по Email
    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = ['full_name', 'role']
    
    objects = CustomUserManager()

    # Переопределенные поля для избежания конфликтов имен
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')


# =========================================================
# 5. МОДЕЛЬ УРОКА
# =========================================================
class Lesson(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name=_('Курс')
    )
    teacher = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.TEACHER},
        related_name='created_lessons',
        verbose_name=_('Учитель')
    )
    
    lesson_number = models.PositiveIntegerField(verbose_name=_('Номер урока'))
    title = models.CharField(max_length=200, verbose_name=_('Название урока'))
    description = models.TextField(blank=True, verbose_name=_('Описание'))
    materials = models.TextField(blank=True, verbose_name=_('Дополнительные материалы'))
    
    published_date = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата публикации'))
    
    class Meta:
        verbose_name = _('Урок')
        verbose_name_plural = _('Уроки')
        ordering = ['course', 'lesson_number']
        unique_together = ['course', 'lesson_number']
    
    def __str__(self):
        return f"{self.course.name} - Урок {self.lesson_number}: {self.title}"


# =========================================================
# 6. МОДЕЛЬ ПРИВЯЗКИ УЧЕНИКА К УЧИТЕЛЮ
# =========================================================
class StudentTeacherAssignment(models.Model):
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.STUDENT},
        related_name='teacher_assignments',
        verbose_name=_('Ученик')
    )
    teacher = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.TEACHER},
        related_name='student_assignments',
        verbose_name=_('Учитель')
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name=_('Курс')
    )
    assigned_date = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата назначения'))
    
    class Meta:
        verbose_name = _('Привязка ученика к учителю')
        verbose_name_plural = _('Привязки учеников к учителям')
        unique_together = [['student', 'teacher', 'course']]  # Один ученик - один учитель на курс
    
    def __str__(self):
        return f"{self.student.full_name} -> {self.teacher.full_name} ({self.course.name})"


# =========================================================
# 7. МОДЕЛЬ ОЦЕНКИ
# =========================================================
class Grade(models.Model):
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.STUDENT},
        related_name='grades',
        verbose_name=_('Ученик')
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='grades',
        verbose_name=_('Урок')
    )
    teacher = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.TEACHER},
        related_name='given_grades',
        verbose_name=_('Учитель')
    )
    
    grade = models.IntegerField(verbose_name=_('Оценка (0-100)'))
    comment = models.TextField(blank=True, verbose_name=_('Комментарий'))
    graded_date = models.DateTimeField(auto_now=True, verbose_name=_('Дата выставления'))
    
    class Meta:
        verbose_name = _('Оценка')
        verbose_name_plural = _('Оценки')
        unique_together = ['student', 'lesson']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.lesson.title}: {self.grade}%"
    


# =============================================================================
# 8. МОДЕЛЬ ОТПРАВЛЕННОГО ЗАДАНИЯ
# =============================================================================
class Submission(models.Model):
    """Отправленное задание ученика"""
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': Role.STUDENT},
        related_name='submissions',
        verbose_name=_('Ученик')
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name=_('Урок')
    )
    submission_text = models.TextField(
        blank=True, 
        null=True,
        verbose_name=_('Текст задания')
    )
    submitted_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата отправки')
    )
    
    class Meta:
        verbose_name = _('Отправленное задание')
        verbose_name_plural = _('Отправленные задания')
        unique_together = ['student', 'lesson']
        ordering = ['-submitted_date']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.lesson.title}"


# =============================================================================
# 9. МОДЕЛЬ ФАЙЛА ЗАДАНИЯ
# =============================================================================
class SubmissionFile(models.Model):
    """Файл, прикрепленный к заданию"""
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name=_('Задание')
    )
    file = models.FileField(
        upload_to='submissions/',
        verbose_name=_('Файл')
    )
    filename = models.CharField(
        max_length=255,
        verbose_name=_('Имя файла')
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата загрузки')
    )
    
    class Meta:
        verbose_name = _('Файл задания')
        verbose_name_plural = _('Файлы заданий')
        ordering = ['uploaded_at']
    
    def __str__(self):
        return self.filename

