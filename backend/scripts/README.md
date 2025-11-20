# Backend Scripts

This directory contains utility scripts for database management and development.

---

## 📁 Directory Contents

```
scripts/
├── seed.py              # Database seeding script
├── sample_data/         # Sample CSV files for testing
│   ├── products.csv     # E-commerce product catalog (30 products)
│   ├── sales_q4.csv     # Q4 sales data (67 transactions)
│   └── employees.csv    # HR employee data (50 employees)
└── README.md            # This file
```

---

## 🌱 Database Seeding

The `seed.py` script populates your development database with sample data including users, projects, files, and dashboards.

### Quick Start

```bash
# From the backend directory
cd backend

# Basic seeding (adds data to existing database)
poetry run python scripts/seed.py

# Clear existing data and reseed
poetry run python scripts/seed.py --clear
```

### What Gets Seeded

#### 1. Sample Users (4 users)

| Username | Email | Password | Role | Description |
|----------|-------|----------|------|-------------|
| `admin` | admin@example.com | `admin123` | Admin | Superuser with full access |
| `demo` | demo@example.com | `demo123` | User | Demo user with sample projects |
| `alice` | alice@example.com | `alice123` | User | Regular user with projects |
| `bob` | bob@example.com | `bob123` | User | Regular user with projects |

#### 2. Sample Projects (5 projects)

| Project Name | Owner | Description |
|--------------|-------|-------------|
| Sales Analysis 2024 | demo | Quarterly sales performance analysis |
| E-commerce Product Catalog | demo | Product inventory tracking |
| HR Employee Data | alice | Employee demographics and salary analysis |
| Financial Metrics Dashboard | alice | Monthly revenue and expense tracking |
| Marketing Campaign Performance | bob | Campaign ROI analysis |

#### 3. Sample Files (3 files)

| Filename | Project | Rows | Columns |
|----------|---------|------|---------|
| products.csv | E-commerce Product Catalog | 10 | 6 |
| sales_q4.csv | Sales Analysis 2024 | 100 | 8 |
| employees.csv | HR Employee Data | 50 | 7 |

**Note**: Only file metadata is seeded. To upload actual CSV files, use the sample data in `scripts/sample_data/` and upload them through the API or UI.

#### 4. Sample Dashboards (3 dashboards)

- **Q4 Sales Overview** - Executive summary (linked to Sales Analysis 2024)
- **Product Performance** - Top performing products (linked to E-commerce Product Catalog)
- **Employee Demographics** - Department distribution (linked to HR Employee Data)

---

## 📊 Sample CSV Files

The `sample_data/` directory contains ready-to-use CSV files for testing and development.

### products.csv (30 rows)

E-commerce product catalog with pricing and inventory data.

**Columns**:
- `id` (numeric) - Product ID
- `name` (categorical) - Product name
- `category` (categorical) - Electronics, Furniture, Accessories
- `price` (numeric) - Product price
- `stock_quantity` (numeric) - Available inventory
- `supplier` (categorical) - Supplier name
- `last_restocked` (datetime) - Last restock date

**Use cases**:
- Bar chart: Category vs Total Revenue
- Pie chart: Stock distribution by category
- Line chart: Restocking timeline
- Scatter plot: Price vs Stock Quantity

### sales_q4.csv (67 rows)

Q4 2024 sales transactions across regions and products.

**Columns**:
- `date` (datetime) - Transaction date (Oct-Dec 2024)
- `region` (categorical) - North, South, East, West
- `product` (categorical) - Product sold
- `revenue` (numeric) - Transaction revenue
- `units_sold` (numeric) - Quantity sold
- `customer_id` (categorical) - Customer identifier
- `sales_rep` (categorical) - Sales representative name

**Use cases**:
- Line chart: Revenue over time
- Bar chart: Revenue by region
- Pie chart: Product sales distribution
- Scatter plot: Revenue vs Units Sold

### employees.csv (50 rows)

HR employee data with demographics and compensation.

**Columns**:
- `employee_id` (categorical) - Employee ID (E001-E050)
- `first_name` (categorical) - First name
- `last_name` (categorical) - Last name
- `department` (categorical) - Engineering, Marketing, Sales, Finance, HR
- `position` (categorical) - Job title
- `salary` (numeric) - Annual salary ($50K-$135K)
- `hire_date` (datetime) - Date of hire

**Use cases**:
- Bar chart: Average salary by department
- Pie chart: Employee distribution by department
- Line chart: Hiring trends over time
- Scatter plot: Salary vs Tenure

---

## 🔧 Usage Examples

### Basic Development Workflow

```bash
# 1. Clear and seed the database
poetry run python scripts/seed.py --clear

# 2. Start the backend server
poetry run uvicorn app.main:app --reload --port 8000

# 3. Login with demo credentials
#    Username: demo
#    Password: demo123

# 4. Upload sample CSV files to projects via the UI or API
```

### Testing Authentication

```bash
# Seed creates 4 users with known passwords
poetry run python scripts/seed.py --clear

# Test login with curl
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'
```

### Uploading Sample Files via API

```bash
# Login first to get token
TOKEN=$(curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}' | jq -r '.access_token')

# Get project ID
PROJECT_ID=1  # or get from /api/projects

# Upload sample file
curl -X POST "http://localhost:8000/api/projects/${PROJECT_ID}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@scripts/sample_data/products.csv"
```

---

## 🗑️ Clearing the Database

The `--clear` flag removes all existing data before seeding:

```bash
poetry run python scripts/seed.py --clear
```

**What gets deleted** (in order):
1. Sessions
2. Dashboards
3. Files
4. Projects
5. Users

**Warning**: This is destructive and cannot be undone. Only use in development.

---

## 🧪 Testing with Seed Data

### Unit Tests

Seed data is NOT used by unit tests. Tests use factories from `tests/fixtures/factories.py` to create isolated test data.

### Manual Testing

Use seed data for manual testing and UI development:

```bash
# 1. Seed the database
poetry run python scripts/seed.py --clear

# 2. Start backend
poetry run uvicorn app.main:app --reload

# 3. Start frontend (in another terminal)
cd ../frontend
npm run dev

# 4. Login and explore
#    - Navigate to http://localhost:5173
#    - Login as demo/demo123
#    - Upload sample CSV files
#    - Generate charts and insights
```

---

## 📝 Customizing Seed Data

### Adding New Users

Edit `SAMPLE_USERS` in `seed.py`:

```python
SAMPLE_USERS = [
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "is_superuser": False,
    },
    # ... existing users
]
```

### Adding New Projects

Edit `SAMPLE_PROJECTS` in `seed.py`:

```python
SAMPLE_PROJECTS = [
    {
        "name": "My New Project",
        "description": "Description here",
        "owner": "demo",  # Must match a username in SAMPLE_USERS
    },
    # ... existing projects
]
```

### Adding New CSV Files

1. Create the CSV file in `scripts/sample_data/`
2. Add file metadata in the `seed_files()` function

```python
file_record = File(
    filename="my_data.csv",
    file_path=f"storage/{project.id}/my_data.csv",
    file_size=1024,
    row_count=100,
    column_count=5,
    project_id=project.id,
    uploaded_at=datetime.utcnow(),
)
session.add(file_record)
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'app'"

**Solution**: Run the script from the `backend` directory:

```bash
cd backend
poetry run python scripts/seed.py
```

### "Could not connect to database"

**Solution**: Ensure `.env` file exists with `DATABASE_URL`:

```bash
# backend/.env
DATABASE_URL=sqlite:///./hikaru.db
```

### "IntegrityError: UNIQUE constraint failed"

**Solution**: Use `--clear` flag to remove existing data:

```bash
poetry run python scripts/seed.py --clear
```

### Sample files not appearing in UI

**Cause**: Seeding only creates file **metadata**, not actual files.

**Solution**: Upload the CSV files manually via the UI or API after seeding.

---

## 📚 Additional Resources

- **Project Documentation**: See `/CLAUDE.md` for full project guide
- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Database Models**: `app/models/database.py`
- **Test Fixtures**: `tests/fixtures/factories.py`

---

**Last Updated**: November 19, 2025
