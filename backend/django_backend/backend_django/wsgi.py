import os
# Use PyMySQL as a drop-in replacement for MySQLdb when mysqlclient is not installed
try:
	import pymysql
	pymysql.install_as_MySQLdb()
except Exception:
	# If PyMySQL isn't installed, Django will later raise a clear error
	pass

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')

application = get_wsgi_application()
