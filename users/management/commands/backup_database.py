

from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.management import call_command
from datetime import datetime
import os
import shutil
import json

class Command(BaseCommand):
    help = 'Дерекқордың толық резервтік көшірмесін жасайды'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='json',
            help='Экспорт форматы: json немесе sql'
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            help='ZIP архивке сығу'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('='*70))
        self.stdout.write(self.style.WARNING('🔄 РЕЗЕРВТІК КӨШІРМЕ ЖАСАУ БАСТАЛДЫ'))
        self.stdout.write(self.style.WARNING('='*70))
        
        # Backup папкасын жасау
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        # Уникальді файл аты
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'backup_{timestamp}'
        
        format_type = options['format']
        
        if format_type == 'json':
            # JSON форматында экспорт
            backup_file = os.path.join(backup_dir, f'{backup_filename}.json')
            
            self.stdout.write('📦 Дерекқорды JSON-ға экспорттау...')
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                call_command('dumpdata', 
                           exclude=['contenttypes', 'auth.permission'],
                           indent=2,
                           stdout=f)
            
            self.stdout.write(self.style.SUCCESS(f'✅ JSON резервтік көшірме: {backup_file}'))
            
        elif format_type == 'sql':
            # SQL форматында (SQLite үшін)
            backup_file = os.path.join(backup_dir, f'{backup_filename}.sqlite3')
            
            self.stdout.write('📦 SQLite дерекқорын көшіру...')
            
            db_path = settings.DATABASES['default']['NAME']
            shutil.copy2(db_path, backup_file)
            
            self.stdout.write(self.style.SUCCESS(f'✅ SQL резервтік көшірме: {backup_file}'))
        
        # Сығу (опционально)
        if options['compress']:
            self.stdout.write('🗜️ ZIP архивке сығу...')
            
            import zipfile
            zip_file = f'{backup_file}.zip'
            
            with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(backup_file, os.path.basename(backup_file))
            
            # Түпнұсқаны жою
            os.remove(backup_file)
            
            self.stdout.write(self.style.SUCCESS(f'✅ Сығылған файл: {zip_file}'))
            backup_file = zip_file
        
        # Статистика
        file_size = os.path.getsize(backup_file) / (1024 * 1024)  # MB
        
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('✅ РЕЗЕРВТІК КӨШІРМЕ ДАЙЫН'))
        self.stdout.write(f'   Файл: {os.path.basename(backup_file)}')
        self.stdout.write(f'   Өлшемі: {file_size:.2f} MB')
        self.stdout.write(f'   Орналасқан жері: {backup_dir}')
        self.stdout.write('='*70)
        
        # Ескі backup-тарды тазалау (30 күннен ескі)
        self._cleanup_old_backups(backup_dir, days=30)

    def _cleanup_old_backups(self, backup_dir, days=30):
        """30 күннен ескі backup-тарды автоматты жою"""
        import time
        
        self.stdout.write('\n🧹 Ескі backup-тарды тексеру...')
        
        now = time.time()
        cutoff = now - (days * 86400)  # 30 күн секундпен
        
        deleted_count = 0
        
        for filename in os.listdir(backup_dir):
            file_path = os.path.join(backup_dir, filename)
            
            if os.path.isfile(file_path):
                file_time = os.path.getmtime(file_path)
                
                if file_time < cutoff:
                    os.remove(file_path)
                    self.stdout.write(f'   🗑️ Жойылды: {filename}')
                    deleted_count += 1
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ {deleted_count} ескі backup жойылды'))
        else:
            self.stdout.write('✅ Ескі backup-тар жоқ')