#!/usr/bin/env python3
"""
Setup script for Civic Zone Connect Django Backend
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"Error: {e.stderr}")
        return False


def create_env_file():
    """Create .env file from template"""
    env_example = Path("env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("✓ .env file already exists")
        return True
    
    if env_example.exists():
        shutil.copy(env_example, env_file)
        print("✓ Created .env file from template")
        print("⚠️  Please edit .env file with your configuration")
        return True
    else:
        print("✗ env.example file not found")
        return False


def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("✗ Python 3.8+ is required")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True


def check_postgresql():
    """Check if PostgreSQL is available"""
    try:
        result = subprocess.run(["psql", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ PostgreSQL is available")
            return True
    except FileNotFoundError:
        pass
    
    print("⚠️  PostgreSQL not found in PATH")
    print("   Please ensure PostgreSQL is installed and accessible")
    return False


def main():
    """Main setup function"""
    print("🚀 Setting up Civic Zone Connect Django Backend")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check PostgreSQL
    check_postgresql()
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        sys.exit(1)
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    if not run_command(f"{activate_cmd} && {pip_cmd} install -r requirements.txt", "Installing dependencies"):
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        sys.exit(1)
    
    # Run Django setup commands
    django_commands = [
        ("python manage.py makemigrations", "Creating database migrations"),
        ("python manage.py migrate", "Running database migrations"),
        ("python manage.py load_initial_data", "Loading initial data"),
        ("python manage.py load_notification_templates", "Loading notification templates"),
    ]
    
    for command, description in django_commands:
        if not run_command(command, description):
            print(f"⚠️  {description} failed, but setup can continue")
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit .env file with your database and other settings")
    print("2. Create a superuser: python manage.py createsuperuser")
    print("3. Run the development server: python manage.py runserver")
    print("4. Access the admin interface at: http://localhost:8000/admin/")
    print("5. Access the API at: http://localhost:8000/api/")
    print("\nFor more information, see README.md")


if __name__ == "__main__":
    main() 