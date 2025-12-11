#!/usr/bin/env python3
"""
Week 4 Backend Endpoint Verification Script
Tests all 6 new endpoints to verify they match frontend expectations
"""

import requests
import json
import sys
from pathlib import Path

API_BASE = "http://localhost:8000"

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60 + "\n")

def print_test(test_num, description):
    print(f"\n{'─' * 60}")
    print(f"TEST {test_num}: {description}")
    print('─' * 60)

def print_response(response, show_full=False):
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        if show_full:
            print(json.dumps(data, indent=2))
        else:
            # Show structure without full data
            if isinstance(data, dict):
                print("Response keys:", list(data.keys()))
                for key, value in data.items():
                    if isinstance(value, list):
                        print(f"  {key}: [{len(value)} items]")
                        if len(value) > 0:
                            print(f"    First item keys: {list(value[0].keys()) if isinstance(value[0], dict) else type(value[0]).__name__}")
                    elif isinstance(value, dict):
                        print(f"  {key}: {{{', '.join(list(value.keys())[:5])}{', ...' if len(value) > 5 else ''}}}")
                    else:
                        print(f"  {key}: {type(value).__name__} = {str(value)[:50]}")
            else:
                print(json.dumps(data, indent=2))
    except:
        print("Response:", response.text[:200])

def main():
    print_section("Week 4 Backend Endpoint Verification")

    # Step 1: Register/Login
    print("Step 1: Authenticating...")

    # Try to register
    register_data = {
        "email": "week4verify@example.com",
        "username": "week4verify",
        "password": "TestPass123!",
        "full_name": "Week 4 Verifier"
    }

    register_response = requests.post(f"{API_BASE}/api/auth/register", json=register_data)

    if register_response.status_code == 201:
        print("✅ New user registered")
        token = register_response.json()["access_token"]
    elif register_response.status_code == 400:
        # User exists, try login
        print("ℹ️  User exists, logging in...")
        login_data = {"username": "week4verify@example.com", "password": "TestPass123!"}
        login_response = requests.post(f"{API_BASE}/api/auth/login", json=login_data)
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print("✅ Logged in successfully")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            sys.exit(1)
    else:
        print(f"❌ Registration failed: {register_response.status_code}")
        print(register_response.text)
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Create project
    print("\nStep 2: Creating test project...")
    project_data = {"name": "Week 4 Verification Project", "description": "Testing new endpoints"}
    project_response = requests.post(f"{API_BASE}/api/projects", json=project_data, headers=headers)

    if project_response.status_code != 201:
        print(f"❌ Project creation failed: {project_response.status_code}")
        print(project_response.text)
        sys.exit(1)

    project_id = project_response.json()["id"]
    print(f"✅ Project created (ID: {project_id})")

    # Step 3: Upload CSV file
    print("\nStep 3: Uploading CSV file...")

    # Create test CSV
    csv_content = """date,product,quantity,revenue,region
2024-01-01,Widget A,10,100.50,North
2024-01-02,Widget B,15,225.75,South
2024-01-03,Widget A,8,80.40,East
2024-01-04,Widget C,20,400.00,West
2024-01-05,Widget B,12,180.60,North
2024-01-06,Widget A,15,150.75,South
2024-01-07,Widget C,25,500.00,East
2024-01-08,Widget B,10,150.50,West"""

    csv_path = Path("/tmp/test_week4.csv")
    csv_path.write_text(csv_content)

    with open(csv_path, 'rb') as f:
        files = {'file': ('test_sales.csv', f, 'text/csv')}
        upload_response = requests.post(f"{API_BASE}/api/projects/{project_id}/files",
                                       files=files, headers=headers)

    if upload_response.status_code != 201:
        print(f"❌ File upload failed: {upload_response.status_code}")
        print(upload_response.text)
        sys.exit(1)

    upload_data = upload_response.json()
    print("Upload response keys:", list(upload_data.keys()))

    # Actual backend returns 'file_id' at root level
    if "file_id" in upload_data:
        file_id = upload_data["file_id"]
    elif "file" in upload_data:
        file_id = upload_data["file"]["id"]
    elif "id" in upload_data:
        file_id = upload_data["id"]
    else:
        print("❌ Unexpected upload response structure")
        print("Full upload response:", json.dumps(upload_data, indent=2))
        sys.exit(1)

    print(f"✅ File uploaded (ID: {file_id})")

    # Start endpoint tests
    print_section("ENDPOINT VERIFICATION TESTS")

    # TEST 1: File Sheets (will return 404 for CSV, that's expected)
    print_test(1, f"GET /api/projects/{project_id}/files/{file_id}/sheets")
    print("Expected: 404 (CSV files don't have sheets) OR sheet list for Excel")

    sheets_response = requests.get(
        f"{API_BASE}/api/projects/{project_id}/files/{file_id}/sheets?preview=true",
        headers=headers
    )
    print_response(sheets_response)

    # TEST 2: Analyze File
    print_test(2, f"POST /api/projects/{project_id}/files/{file_id}/analyze")
    print("Expected: FileAnalysisResponse with charts[], global_summary, analysis_id")

    analyze_request = {"user_intent": "Analyze sales trends and patterns"}
    analyze_response = requests.post(
        f"{API_BASE}/api/projects/{project_id}/files/{file_id}/analyze",
        json=analyze_request,
        headers=headers
    )
    print_response(analyze_response, show_full=False)

    if analyze_response.status_code == 200:
        analysis_data = analyze_response.json()
        print("\n✅ VERIFICATION:")
        print(f"  - Has 'charts' array: {'charts' in analysis_data}")
        print(f"  - Has 'global_summary': {'global_summary' in analysis_data}")
        print(f"  - Has 'analysis_id': {'analysis_id' in analysis_data}")
        print(f"  - Has 'file_id': {'file_id' in analysis_data}")
        print(f"  - Number of charts: {len(analysis_data.get('charts', []))}")

    # TEST 3: Get Saved Analysis
    print_test(3, f"GET /api/projects/{project_id}/files/{file_id}/analysis")
    print("Expected: Same as TEST 2 (saved analysis)")

    analysis_get_response = requests.get(
        f"{API_BASE}/api/projects/{project_id}/files/{file_id}/analysis",
        headers=headers
    )
    print_response(analysis_get_response)

    # Upload second file for comparison/merge
    print("\n" + "─" * 60)
    print("Uploading second file for comparison tests...")
    print("─" * 60)

    csv2_content = """date,product,quantity,revenue,region
2024-02-01,Widget A,12,120.00,North
2024-02-02,Widget B,18,270.00,South
2024-02-03,Widget A,9,90.00,East
2024-02-04,Widget C,22,440.00,West"""

    csv2_path = Path("/tmp/test_week4_2.csv")
    csv2_path.write_text(csv2_content)

    with open(csv2_path, 'rb') as f:
        files = {'file': ('test_sales2.csv', f, 'text/csv')}
        upload2_response = requests.post(f"{API_BASE}/api/projects/{project_id}/files",
                                        files=files, headers=headers)

    if upload2_response.status_code != 201:
        print(f"⚠️  Second file upload failed: {upload2_response.status_code}")
        file2_id = None
    else:
        upload2_data = upload2_response.json()
        if "file_id" in upload2_data:
            file2_id = upload2_data["file_id"]
        elif "file" in upload2_data:
            file2_id = upload2_data["file"]["id"]
        elif "id" in upload2_data:
            file2_id = upload2_data["id"]
        else:
            file2_id = None
        print(f"✅ Second file uploaded (ID: {file2_id})")

    if file2_id:
        # TEST 4: Compare Files
        print_test(4, f"POST /api/projects/{project_id}/compare")
        print("Expected: ComparisonResponse with overlay_charts[], summary_insight")

        compare_request = {
            "file_a_id": file_id,
            "file_b_id": file2_id,
            "comparison_type": "trend"
        }
        compare_response = requests.post(
            f"{API_BASE}/api/projects/{project_id}/compare",
            json=compare_request,
            headers=headers
        )
        print_response(compare_response, show_full=False)

        if compare_response.status_code == 200:
            comparison_data = compare_response.json()
            print("\n✅ VERIFICATION:")
            print(f"  - Has 'overlay_charts': {'overlay_charts' in comparison_data}")
            print(f"  - Has 'summary_insight': {'summary_insight' in comparison_data}")
            print(f"  - Has 'comparison_id': {'comparison_id' in comparison_data}")
            if 'overlay_charts' in comparison_data and len(comparison_data['overlay_charts']) > 0:
                first_chart = comparison_data['overlay_charts'][0]
                print(f"  - First chart has 'series_a': {'series_a' in first_chart}")
                print(f"  - First chart has 'series_b': {'series_b' in first_chart}")
                print(f"  - First chart has 'file_a_label': {'file_a_label' in first_chart}")

        # TEST 5: Create Relationship
        print_test(5, f"POST /api/projects/{project_id}/relationships")
        print("Expected: RelationshipResponse with id, config")

        relationship_request = {
            "file_a_id": file_id,
            "file_b_id": file2_id,
            "relationship_type": "merge",
            "join_type": "inner",
            "config": {
                "left_key": "date",
                "right_key": "date",
                "left_suffix": "_a",
                "right_suffix": "_b"
            }
        }
        relationship_response = requests.post(
            f"{API_BASE}/api/projects/{project_id}/relationships",
            json=relationship_request,
            headers=headers
        )
        print_response(relationship_response)

        if relationship_response.status_code in [200, 201]:
            relationship_data = relationship_response.json()
            relationship_id = relationship_data.get("id")
            print("\n✅ VERIFICATION:")
            print(f"  - Has 'id': {'id' in relationship_data}")
            print(f"  - Has 'config': {'config' in relationship_data}")
            print(f"  - Has 'relationship_type': {'relationship_type' in relationship_data}")

            if relationship_id:
                # TEST 6: Merge Analyze
                print_test(6, f"POST /api/projects/{project_id}/merge-analyze")
                print("Expected: MergeAnalyzeResponse with merged_schema, charts, row counts")

                merge_request = {"relationship_id": relationship_id}
                merge_response = requests.post(
                    f"{API_BASE}/api/projects/{project_id}/merge-analyze",
                    json=merge_request,
                    headers=headers
                )
                print_response(merge_response, show_full=False)

                if merge_response.status_code == 200:
                    merge_data = merge_response.json()
                    print("\n✅ VERIFICATION:")
                    print(f"  - Has 'merged_schema': {'merged_schema' in merge_data}")
                    print(f"  - Has 'charts': {'charts' in merge_data}")
                    print(f"  - Has 'global_summary': {'global_summary' in merge_data}")
                    print(f"  - Has 'row_count_before_a': {'row_count_before_a' in merge_data}")
                    print(f"  - Has 'row_count_before_b': {'row_count_before_b' in merge_data}")
                    print(f"  - Has 'row_count_after': {'row_count_after' in merge_data}")

    print_section("VERIFICATION SUMMARY")
    print("✅ All endpoint tests completed!")
    print("\nNext steps:")
    print("1. Review response structures above")
    print("2. Verify TypeScript types match actual responses")
    print("3. Update frontend types if needed")
    print("4. Continue with ComparisonChartCard implementation")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
