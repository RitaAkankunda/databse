# MySQL Database Setup Guide

## For New Team Members

### 1. Install MySQL Server
- **Windows**: Download MySQL Installer from https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql` or download from MySQL website
- **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian)

### 2. Start MySQL Service
- **Windows**: MySQL should start automatically after installation
- **macOS**: `brew services start mysql`
- **Linux**: `sudo systemctl start mysql`

### 3. Create Database and User
Connect to MySQL and run these commands:
```sql
-- Create the database
CREATE DATABASE mydjangodb;

-- Create a user (replace 'your_username' and 'your_password' with your choice)
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON mydjangodb.* TO 'your_username'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
```

### 4. Environment Configuration
Create a `.env` file in the `backend/django_backend/` directory with the following content:

```env
# Django Configuration
DJANGO_SECRET=your-secret-key-here
DJANGO_DEBUG=1

# MySQL Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=mydjangodb
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

### 5. Generate Django Secret Key
Run this command to generate a new secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 6. Install Dependencies
```bash
pip install -r requirements.txt
```

### 7. Run Migrations
```bash
python manage.py migrate
```

### 8. Run the Application
```bash
python manage.py runserver
```


## Troubleshooting

### MySQL Connection Issues
- Ensure MySQL service is running
- Check that the port (3306) is not blocked
- Verify username and password are correct
- Make sure the database `mydjangodb` exists

### Python MySQL Driver Issues
If you get MySQL connection errors, try:
```bash
pip uninstall mysql-connector-python
pip install mysql-connector-python
```

## Notes
- The `.env` file is gitignored for security
- Create your own `.env` file with your MySQL credentials
- Use the same database name (`mydjangodb`) for consistency
- Keep your MySQL credentials secure and don't share them in code

### Important: sqlite removed
- This project no longer supports the sqlite fallback. If you previously used `db.sqlite3` in development
	it will no longer be used. You can safely remove the file from the project root after you've migrated data to
	MySQL or if you no longer need it:

```powershell
del .\db.sqlite3
```

Be sure to back up the file first if you need to preserve any data.
