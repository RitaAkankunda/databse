#!/usr/bin/env python
import os
import sys

# If using PyMySQL (pure-Python), make it act like MySQLdb
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except Exception:
    pass

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django") from exc
    execute_from_command_line(sys.argv)
