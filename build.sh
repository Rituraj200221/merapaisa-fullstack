#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Collect Static Files
python core_service/manage.py collectstatic --no-input

# 3. Migrate Database
python core_service/manage.py migrate