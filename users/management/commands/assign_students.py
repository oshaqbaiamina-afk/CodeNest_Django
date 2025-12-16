

from django.core.management.base import BaseCommand
from users.models import CustomUser, Role, StudentTeacherAssignment

class Command(BaseCommand):
    help = 'Привязывает всех существующих студентов ко всем учителям'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('='*70))
        self.stdout.write(self.style.WARNING('🔄 МАССОВАЯ ПРИВЯЗКА ВСЕХ СТУДЕНТОВ К УЧИТЕЛЯМ'))
        self.stdout.write(self.style.WARNING('='*70))
        
        # Получаем всех студентов
        students = CustomUser.objects.filter(role=Role.STUDENT)
        self.stdout.write(f"👥 Найдено студентов: {students.count()}")
        
        # Получаем всех учителей
        teachers = CustomUser.objects.filter(
            role=Role.TEACHER, 
            teaching_course__isnull=False
        ).select_related('teaching_course')
        self.stdout.write(f"👨‍🏫 Найдено учителей: {teachers.count()}")
        
        if teachers.count() == 0:
            self.stdout.write(self.style.ERROR("❌ ОШИБКА: Нет учителей с назначенными курсами!"))
            self.stdout.write(self.style.ERROR("Сначала создайте учителей в Django Admin"))
            return
        
        # Показываем список учителей
        self.stdout.write(self.style.SUCCESS("\n📋 Список учителей:"))
        for teacher in teachers:
            self.stdout.write(f"  • {teacher.full_name} ({teacher.email}) - {teacher.teaching_course.name}")
        
        total_created = 0
        total_existing = 0
        
        for student in students:
            self.stdout.write(f"\n📚 Обработка: {student.full_name} ({student.email})")
            
            for teacher in teachers:
                if not teacher.teaching_course:
                    continue
                    
                assignment, created = StudentTeacherAssignment.objects.get_or_create(
                    student=student,
                    teacher=teacher,
                    course=teacher.teaching_course
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(
                        f"  ✅ Привязан к {teacher.full_name} ({teacher.teaching_course.name})"
                    ))
                    total_created += 1
                else:
                    self.stdout.write(
                        f"  ℹ️ Уже привязан к {teacher.full_name} ({teacher.teaching_course.name})"
                    )
                    total_existing += 1
        
        self.stdout.write(self.style.SUCCESS("\n" + "="*70))
        self.stdout.write(self.style.SUCCESS("✅ МАССОВАЯ ПРИВЯЗКА ЗАВЕРШЕНА"))
        self.stdout.write(f"   Всего студентов обработано: {students.count()}")
        self.stdout.write(f"   Всего учителей: {teachers.count()}")
        self.stdout.write(f"   Создано новых привязок: {total_created}")
        self.stdout.write(f"   Существующих привязок: {total_existing}")
        self.stdout.write(f"   Всего привязок: {total_created + total_existing}")
        self.stdout.write(self.style.SUCCESS("="*70))
        
        # Проверка результатов
        self.stdout.write(self.style.WARNING("\n🔍 ПРОВЕРКА РЕЗУЛЬТАТОВ:"))
        for student in students:
            count = StudentTeacherAssignment.objects.filter(student=student).count()
            if count == teachers.count():
                self.stdout.write(self.style.SUCCESS(
                    f"✅ {student.full_name}: {count} привязок (OK)"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"❌ {student.full_name}: {count} привязок (Ожидалось {teachers.count()})"
                ))