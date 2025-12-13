#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Collect Static Files
python core_service/manage.py collectstatic --no-input

# 3. Migrate Database
python core_service/manage.py migrate

# 4. Create Superuser 
echo "from django.contrib.auth.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'pass123')" | python core_service/manage.py shell