"""
Seed script for populating the database with sample data for development.

Usage:
    poetry run python scripts/seed.py [--clear]

Options:
    --clear    Clear all existing data before seeding
"""
import argparse
import sys
import uuid
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base
from app.models.database import User, Project, File, Dashboard, Session as SessionModel, utc_now
from app.services.auth_service import hash_password

# Sample data configuration
SAMPLE_USERS = [
    {
        "username": "admin",
        "email": "admin@example.com",
        "password": "admin123",
        "is_superuser": True,
    },
    {
        "username": "demo",
        "email": "demo@example.com",
        "password": "demo123",
        "is_superuser": False,
    },
    {
        "username": "alice",
        "email": "alice@example.com",
        "password": "alice123",
        "is_superuser": False,
    },
    {
        "username": "bob",
        "email": "bob@example.com",
        "password": "bob123",
        "is_superuser": False,
    },
]

SAMPLE_PROJECTS = [
    {
        "name": "Sales Analysis 2024",
        "description": "Quarterly sales performance analysis with customer segmentation and revenue trends.",
        "owner": "demo",
    },
    {
        "name": "E-commerce Product Catalog",
        "description": "Product inventory tracking with categories, pricing, and stock levels.",
        "owner": "demo",
    },
    {
        "name": "HR Employee Data",
        "description": "Employee demographics, salary analysis, and department distribution.",
        "owner": "alice",
    },
    {
        "name": "Financial Metrics Dashboard",
        "description": "Monthly revenue, expenses, and profit analysis for the fiscal year.",
        "owner": "alice",
    },
    {
        "name": "Marketing Campaign Performance",
        "description": "Campaign ROI analysis with conversion rates and customer acquisition costs.",
        "owner": "bob",
    },
]

SAMPLE_DASHBOARDS = [
    {
        "name": "Q4 Sales Overview",
        "project": "Sales Analysis 2024",
        "dashboard_type": "single_file",
    },
    {
        "name": "Product Performance",
        "project": "E-commerce Product Catalog",
        "dashboard_type": "single_file",
    },
    {
        "name": "Employee Demographics",
        "project": "HR Employee Data",
        "dashboard_type": "single_file",
    },
]


def clear_database(session):
    """Clear all data from the database."""
    print("🗑️  Clearing existing data...")

    # Delete in reverse order of foreign key dependencies
    session.query(SessionModel).delete()
    session.query(Dashboard).delete()
    session.query(File).delete()
    session.query(Project).delete()
    session.query(User).delete()

    session.commit()
    print("✅ Database cleared")


def seed_users(session):
    """Create sample users."""
    print("\n👤 Seeding users...")
    users = {}

    for user_data in SAMPLE_USERS:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
            is_active=True,
            is_superuser=user_data["is_superuser"],
            created_at=utc_now(),
        )
        session.add(user)
        users[user_data["username"]] = user
        role = "Admin" if user_data["is_superuser"] else "User"
        print(f"  ✓ Created {role}: {user_data['username']} ({user_data['email']})")

    session.commit()

    # Refresh to get IDs
    for user in users.values():
        session.refresh(user)

    return users


def seed_projects(session, users):
    """Create sample projects."""
    print("\n📁 Seeding projects...")
    projects = {}

    for project_data in SAMPLE_PROJECTS:
        owner = users[project_data["owner"]]
        project = Project(
            name=project_data["name"],
            description=project_data["description"],
            user_id=owner.id,
            is_archived=False,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        session.add(project)
        projects[project_data["name"]] = project
        print(f"  ✓ Created project: {project_data['name']} (owner: {project_data['owner']})")

    session.commit()

    # Refresh to get IDs
    for project in projects.values():
        session.refresh(project)

    # Create project directories: uploads/{user_id}/{project_id}/
    for project_name, project in projects.items():
        project_dir = Path("uploads") / str(project.user_id) / str(project.id)
        project_dir.mkdir(parents=True, exist_ok=True)

    return projects


def seed_files(session, projects):
    """Create sample file records and copy actual CSV files."""
    print("\n📄 Seeding files...")
    import shutil
    import os

    files = []
    script_dir = Path(__file__).parent
    sample_data_dir = script_dir / "sample_data"

    # Files for "E-commerce Product Catalog"
    if "E-commerce Product Catalog" in projects:
        project = projects["E-commerce Product Catalog"]
        source_file = sample_data_dir / "products.csv"
        dest_dir = Path(f"uploads/{project.user_id}/{project.id}")
        dest_file = dest_dir / "products.csv"

        # Copy actual file
        if source_file.exists():
            shutil.copy2(source_file, dest_file)
            file_size = os.path.getsize(dest_file)
        else:
            print(f"  ⚠️  Warning: {source_file} not found, skipping file copy")
            file_size = 1024

        file_record = File(
            filename="products.csv",
            upload_id=str(uuid.uuid4()),
            file_path=str(dest_file),
            file_size=file_size,
            row_count=30,
            project_id=project.id,
            uploaded_at=utc_now(),
        )
        session.add(file_record)
        files.append(file_record)
        print(f"  ✓ Added file: products.csv to {project.name}")

    # Files for "Sales Analysis 2024"
    if "Sales Analysis 2024" in projects:
        project = projects["Sales Analysis 2024"]
        source_file = sample_data_dir / "sales_q4.csv"
        dest_dir = Path(f"uploads/{project.user_id}/{project.id}")
        dest_file = dest_dir / "sales_q4.csv"

        # Copy actual file
        if source_file.exists():
            shutil.copy2(source_file, dest_file)
            file_size = os.path.getsize(dest_file)
        else:
            print(f"  ⚠️  Warning: {source_file} not found, skipping file copy")
            file_size = 2048

        now = utc_now()
        file_record = File(
            filename="sales_q4.csv",
            upload_id=str(uuid.uuid4()),
            file_path=str(dest_file),
            file_size=file_size,
            row_count=67,
            project_id=project.id,
            uploaded_at=now - timedelta(days=5),
        )
        session.add(file_record)
        files.append(file_record)
        print(f"  ✓ Added file: sales_q4.csv to {project.name}")

    # Files for "HR Employee Data"
    if "HR Employee Data" in projects:
        project = projects["HR Employee Data"]
        source_file = sample_data_dir / "employees.csv"
        dest_dir = Path(f"uploads/{project.user_id}/{project.id}")
        dest_file = dest_dir / "employees.csv"

        # Copy actual file
        if source_file.exists():
            shutil.copy2(source_file, dest_file)
            file_size = os.path.getsize(dest_file)
        else:
            print(f"  ⚠️  Warning: {source_file} not found, skipping file copy")
            file_size = 3072

        now = utc_now()
        file_record = File(
            filename="employees.csv",
            upload_id=str(uuid.uuid4()),
            file_path=str(dest_file),
            file_size=file_size,
            row_count=50,
            project_id=project.id,
            uploaded_at=now - timedelta(days=10),
        )
        session.add(file_record)
        files.append(file_record)
        print(f"  ✓ Added file: employees.csv to {project.name}")

    session.commit()

    # Refresh to get IDs
    for file in files:
        session.refresh(file)

    return files


def seed_dashboards(session, projects):
    """Create sample dashboards."""
    print("\n📊 Seeding dashboards...")
    import json

    for dashboard_data in SAMPLE_DASHBOARDS:
        if dashboard_data["project"] in projects:
            project = projects[dashboard_data["project"]]
            dashboard = Dashboard(
                name=dashboard_data["name"],
                dashboard_type=dashboard_data["dashboard_type"],
                project_id=project.id,
                config_json=json.dumps({
                    "charts": [],
                    "layout": "grid",
                    "theme": "light",
                }),
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            session.add(dashboard)
            print(f"  ✓ Created dashboard: {dashboard_data['name']}")

    session.commit()


def main():
    """Main seed function."""
    parser = argparse.ArgumentParser(description="Seed the database with sample data")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing data before seeding",
    )
    args = parser.parse_args()

    print("🌱 Starting database seeding...\n")

    # Create database engine and session
    engine = create_engine(str(settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)

        # Clear existing data if requested
        if args.clear:
            clear_database(session)

        # Ensure upload directory exists
        Path("uploads").mkdir(exist_ok=True)

        # Seed data
        users = seed_users(session)
        projects = seed_projects(session, users)
        files = seed_files(session, projects)
        seed_dashboards(session, projects)

        print("\n" + "="*60)
        print("✨ Database seeding completed successfully!")
        print("="*60)
        print("\n📝 Sample User Credentials:")
        print("-" * 60)
        for user_data in SAMPLE_USERS:
            role = "Admin" if user_data["is_superuser"] else "User"
            print(f"  {role:10} | Username: {user_data['username']:10} | Password: {user_data['password']}")
        print("-" * 60)

        print("\n📊 Summary:")
        print(f"  • Users created: {len(SAMPLE_USERS)}")
        print(f"  • Projects created: {len(SAMPLE_PROJECTS)}")
        print(f"  • Files created: {len(files)}")
        print(f"  • Dashboards created: {len(SAMPLE_DASHBOARDS)}")

        print("\n💡 Next steps:")
        print("  1. Start the backend: poetry run uvicorn app.main:app --reload")
        print("  2. Login with any of the credentials above")
        print("  3. Navigate to Projects and analyze the seeded files")
        print("  4. Sample files are ready for analysis with charts and AI insights!")
        print()

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
