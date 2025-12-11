#!/bin/bash

# Week 4 Backend Endpoint Verification Script
# Tests all 6 new endpoints to verify they match frontend expectations

API_BASE="http://localhost:8000"
CONTENT_TYPE="Content-Type: application/json"

echo "========================================="
echo "Week 4 Backend Endpoint Verification"
echo "========================================="
echo ""

# First, we need to login to get a token
echo "Step 1: Login to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{"username":"test@example.com","password":"testpass123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Creating test user..."
  REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "$CONTENT_TYPE" \
    -d '{"email":"test@example.com","username":"testuser","password":"testpass123"}')
  TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ CRITICAL: Cannot get auth token. Exiting."
  exit 1
fi

echo "✅ Auth token obtained"
AUTH_HEADER="Authorization: Bearer $TOKEN"
echo ""

# Step 2: Create a test project
echo "Step 2: Creating test project..."
PROJECT_RESPONSE=$(curl -s -X POST "$API_BASE/api/projects" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{"name":"Week 4 Test Project","description":"Testing new endpoints"}')

PROJECT_ID=$(echo $PROJECT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Failed to create project"
  echo "Response: $PROJECT_RESPONSE"
  exit 1
fi

echo "✅ Project created (ID: $PROJECT_ID)"
echo ""

# Step 3: Upload CSV file to project
echo "Step 3: Uploading CSV file to project..."
CSV_FILE="/Users/sovanaryththorng/sanzoku_labs/hikaru/backend/sample_data.csv"

if [ ! -f "$CSV_FILE" ]; then
  echo "⚠️  Sample CSV not found, creating one..."
  cat > /tmp/test_sales.csv << 'CSVEOF'
date,product,quantity,revenue,region
2024-01-01,Widget A,10,100.50,North
2024-01-02,Widget B,15,225.75,South
2024-01-03,Widget A,8,80.40,East
2024-01-04,Widget C,20,400.00,West
2024-01-05,Widget B,12,180.60,North
CSVEOF
  CSV_FILE="/tmp/test_sales.csv"
fi

FILE_UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/api/projects/$PROJECT_ID/files" \
  -H "$AUTH_HEADER" \
  -F "file=@$CSV_FILE")

FILE_ID=$(echo $FILE_UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['file']['id'])" 2>/dev/null)

if [ -z "$FILE_ID" ]; then
  echo "❌ Failed to upload file"
  echo "Response: $FILE_UPLOAD_RESPONSE"
  exit 1
fi

echo "✅ File uploaded (ID: $FILE_ID)"
echo ""

# Now start testing the 6 new endpoints

echo "========================================="
echo "ENDPOINT TESTS"
echo "========================================="
echo ""

# TEST 1: GET /api/projects/{id}/files/{file_id}/sheets
echo "TEST 1: GET /api/projects/$PROJECT_ID/files/$FILE_ID/sheets"
echo "Expected: List of sheets (for Excel) or 404/empty for CSV"
SHEETS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
  "$API_BASE/api/projects/$PROJECT_ID/files/$FILE_ID/sheets?preview=true" \
  -H "$AUTH_HEADER")

echo "$SHEETS_RESPONSE"
echo ""
echo "---"
echo ""

# TEST 2: POST /api/projects/{id}/files/{file_id}/analyze
echo "TEST 2: POST /api/projects/$PROJECT_ID/files/$FILE_ID/analyze"
echo "Expected: FileAnalysisResponse with charts array, global_summary"
ANALYZE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "$API_BASE/api/projects/$PROJECT_ID/files/$FILE_ID/analyze" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{"user_intent":"Analyze sales trends"}')

echo "$ANALYZE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYZE_RESPONSE"
echo ""
echo "---"
echo ""

# TEST 3: GET /api/projects/{id}/files/{file_id}/analysis
echo "TEST 3: GET /api/projects/$PROJECT_ID/files/$FILE_ID/analysis"
echo "Expected: Saved FileAnalysisResponse from previous analyze"
ANALYSIS_GET_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
  "$API_BASE/api/projects/$PROJECT_ID/files/$FILE_ID/analysis" \
  -H "$AUTH_HEADER")

echo "$ANALYSIS_GET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYSIS_GET_RESPONSE"
echo ""
echo "---"
echo ""

# Upload a second file for comparison/merge tests
echo "Uploading second file for comparison tests..."
cat > /tmp/test_sales2.csv << 'CSVEOF'
date,product,quantity,revenue,region
2024-02-01,Widget A,12,120.00,North
2024-02-02,Widget B,18,270.00,South
2024-02-03,Widget A,9,90.00,East
CSVEOF

FILE2_UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/api/projects/$PROJECT_ID/files" \
  -H "$AUTH_HEADER" \
  -F "file=@/tmp/test_sales2.csv")

FILE2_ID=$(echo $FILE2_UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['file']['id'])" 2>/dev/null)

if [ -z "$FILE2_ID" ]; then
  echo "⚠️  Second file upload failed, skipping comparison tests"
else
  echo "✅ Second file uploaded (ID: $FILE2_ID)"
  echo ""

  # TEST 4: POST /api/projects/{id}/compare
  echo "TEST 4: POST /api/projects/$PROJECT_ID/compare"
  echo "Expected: ComparisonResponse with overlay_charts array"
  COMPARE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_BASE/api/projects/$PROJECT_ID/compare" \
    -H "$CONTENT_TYPE" \
    -H "$AUTH_HEADER" \
    -d "{\"file_a_id\":$FILE_ID,\"file_b_id\":$FILE2_ID,\"comparison_type\":\"trend\"}")

  echo "$COMPARE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$COMPARE_RESPONSE"
  echo ""
  echo "---"
  echo ""

  # TEST 5: POST /api/projects/{id}/relationships
  echo "TEST 5: POST /api/projects/$PROJECT_ID/relationships"
  echo "Expected: RelationshipResponse with id, config"
  RELATIONSHIP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_BASE/api/projects/$PROJECT_ID/relationships" \
    -H "$CONTENT_TYPE" \
    -H "$AUTH_HEADER" \
    -d "{\"file_a_id\":$FILE_ID,\"file_b_id\":$FILE2_ID,\"relationship_type\":\"merge\",\"join_type\":\"inner\",\"config\":{\"left_key\":\"date\",\"right_key\":\"date\",\"left_suffix\":\"_a\",\"right_suffix\":\"_b\"}}")

  echo "$RELATIONSHIP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RELATIONSHIP_RESPONSE"
  
  RELATIONSHIP_ID=$(echo $RELATIONSHIP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  echo ""
  echo "---"
  echo ""

  # TEST 6: POST /api/projects/{id}/merge-analyze
  if [ -n "$RELATIONSHIP_ID" ]; then
    echo "TEST 6: POST /api/projects/$PROJECT_ID/merge-analyze"
    echo "Expected: MergeAnalyzeResponse with merged_schema, charts"
    MERGE_ANALYZE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
      "$API_BASE/api/projects/$PROJECT_ID/merge-analyze" \
      -H "$CONTENT_TYPE" \
      -H "$AUTH_HEADER" \
      -d "{\"relationship_id\":$RELATIONSHIP_ID}")

    echo "$MERGE_ANALYZE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MERGE_ANALYZE_RESPONSE"
  else
    echo "⚠️  Skipping TEST 6 (relationship creation failed)"
  fi
fi

echo ""
echo "========================================="
echo "VERIFICATION COMPLETE"
echo "========================================="
echo ""
echo "Review the responses above to verify:"
echo "1. Response structures match TypeScript types"
echo "2. All required fields are present"
echo "3. Data types are correct (arrays, objects, strings, numbers)"
echo "4. HTTP status codes are 200/201"
echo ""
