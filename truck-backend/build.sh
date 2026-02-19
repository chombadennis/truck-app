#!/usr/bin/env bash
set -o errexit

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
python manage.py migrate --no-input

# Load initial fixture (your test driver)
python manage.py loaddata fixtures/initial_data.json

# Collect static files
python manage.py collectstatic --no-input
