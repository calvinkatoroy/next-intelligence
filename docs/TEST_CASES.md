# Test Cases Document
## Project NEXT Intelligence - OSINT Credential Discovery System

**Document Version:** 1.0  
**Date:** November 17, 2025  
**Test Plan Reference:** SOFTWARE_TEST_PLAN.md v1.0

---

## Table of Contents

1. [Backend API Test Cases](#1-backend-api-test-cases)
2. [Discovery Engine Test Cases](#2-discovery-engine-test-cases)
3. [Scraper Test Cases](#3-scraper-test-cases)
4. [Frontend Test Cases](#4-frontend-test-cases)
5. [Integration Test Cases](#5-integration-test-cases)
6. [Security Test Cases](#6-security-test-cases)
7. [Performance Test Cases](#7-performance-test-cases)
8. [End-to-End Test Cases](#8-end-to-end-test-cases)

---

## 1. Backend API Test Cases

### TC-BE-001: POST /api/scan - Valid Scan Request
**Priority:** Critical  
**Test Type:** Functional  
**Prerequisites:** Backend service running

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST to `/api/scan` with valid payload | HTTP 200 OK |
| 2 | Verify response contains `scan_id` | scan_id is UUID format |
| 3 | Verify response contains `status` | status = "queued" |
| 4 | Check scan added to in-memory storage | Scan exists in storage |

**Test Data:**
```json
{
  "url": "https://example.com",
  "search_depth": 2,
  "target_domain": "example.com",
  "enable_tor": false
}
```

**Expected Response:**
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "created_at": "2025-11-17T10:30:00Z"
}
```

---

### TC-BE-002: POST /api/scan - Invalid URL
**Priority:** High  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST with invalid URL | HTTP 422 Unprocessable Entity |
| 2 | Verify error message | "Invalid URL format" |

**Test Data:**
```json
{
  "url": "not-a-valid-url",
  "search_depth": 2
}
```

---

### TC-BE-003: POST /api/scan - Missing Required Fields
**Priority:** High  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST without `url` field | HTTP 422 Unprocessable Entity |
| 2 | Verify validation error details | Field "url" is required |

**Test Data:**
```json
{
  "search_depth": 2
}
```

---

### TC-BE-004: GET /api/scans - Retrieve All Scans
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create 3 test scans | 3 scans created |
| 2 | Send GET to `/api/scans` | HTTP 200 OK |
| 3 | Verify response is array | Array with 3 items |
| 4 | Verify scan structure | Each scan has required fields |

**Expected Response Structure:**
```json
[
  {
    "scan_id": "uuid",
    "url": "string",
    "status": "string",
    "created_at": "datetime"
  }
]
```

---

### TC-BE-005: GET /api/scans - Empty List
**Priority:** Medium  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear all scans from storage | Storage empty |
| 2 | Send GET to `/api/scans` | HTTP 200 OK |
| 3 | Verify response is empty array | [] |

---

### TC-BE-006: GET /api/results - Valid Scan ID
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create scan and wait for completion | Scan status = "completed" |
| 2 | Send GET to `/api/results?scan_id={id}` | HTTP 200 OK |
| 3 | Verify results structure | Valid results object |
| 4 | Verify relevance scores present | Scores are 0-100 |

**Expected Response:**
```json
{
  "scan_id": "uuid",
  "results": [
    {
      "url": "string",
      "title": "string",
      "relevance_score": 85,
      "extracted_data": {}
    }
  ],
  "total_results": 5
}
```

---

### TC-BE-007: GET /api/results - Invalid Scan ID
**Priority:** Medium  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send GET with non-existent scan_id | HTTP 404 Not Found |
| 2 | Verify error message | "Scan not found" |

---

### TC-BE-008: WebSocket Connection Establishment
**Priority:** Critical  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Connect to `ws://localhost:8000/ws` | Connection established |
| 2 | Verify connection status | Status = "connected" |
| 3 | Send ping message | Receive pong response |
| 4 | Wait for timeout | Connection stays open |

---

### TC-BE-009: WebSocket Real-time Updates
**Priority:** Critical  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Establish WebSocket connection | Connected |
| 2 | Create new scan via POST /api/scan | Scan created |
| 3 | Listen for WebSocket messages | Receive status updates |
| 4 | Verify message format | Valid JSON with scan data |

**Expected Message:**
```json
{
  "type": "scan_update",
  "scan_id": "uuid",
  "status": "processing",
  "progress": 50
}
```

---

### TC-BE-010: CORS Headers Validation
**Priority:** High  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send OPTIONS request to `/api/scan` | HTTP 200 OK |
| 2 | Verify CORS headers present | Access-Control-Allow-Origin present |
| 3 | Check allowed methods | POST, GET, OPTIONS |
| 4 | Verify credentials allowed | Access-Control-Allow-Credentials: true |

---

## 2. Discovery Engine Test Cases

### TC-DE-001: Relevance Score Calculation - High Score
**Priority:** Critical  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Prepare paste with target domain | Domain mentioned 5 times |
| 2 | Add target emails | 3 emails present |
| 3 | Add leak keywords | "password", "credentials" present |
| 4 | Run relevance calculation | Score ≥ 80 |

**Test Data:**
```text
Paste content:
Found leaked data from example.com
Emails: admin@example.com, user@example.com
Contains passwords and credentials
```

**Expected Score Breakdown:**
- Domain mentions (40%): 40 points
- Email matches (30%): 30 points
- Keyword matches (30%): 30 points
- **Total: 100 points**

---

### TC-DE-002: Relevance Score - Medium Score
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Prepare paste with domain only | Domain mentioned 2 times |
| 2 | No emails present | 0 email matches |
| 3 | One leak keyword | "leak" present |
| 4 | Run relevance calculation | Score 40-60 |

---

### TC-DE-003: Relevance Score - Low Score
**Priority:** Medium  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Prepare paste without domain | No domain mentions |
| 2 | No target emails | 0 email matches |
| 3 | No leak keywords | 0 keyword matches |
| 4 | Run relevance calculation | Score < 20 |

---

### TC-DE-004: Email Extraction
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Input text with valid emails | Text prepared |
| 2 | Run email extraction | Extract all emails |
| 3 | Verify email format validation | Invalid emails filtered |
| 4 | Check domain filtering | Only target domain emails |

**Test Data:**
```text
Contact: admin@example.com
Support: support@example.com
Invalid: notanemail
External: user@different.com
```

**Expected Output:**
```python
["admin@example.com", "support@example.com"]
```

---

### TC-DE-005: Domain Mention Detection
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Prepare text with domain variations | Multiple formats |
| 2 | Run domain detection | Find all mentions |
| 3 | Count occurrences | Accurate count |
| 4 | Verify case-insensitive matching | All cases found |

**Test Data:**
```text
Visit example.com
See EXAMPLE.COM
Check www.example.com
```

**Expected Count:** 3

---

### TC-DE-006: Keyword Matching
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Define keyword list | ["password", "leak", "breach"] |
| 2 | Prepare text with keywords | Keywords present |
| 3 | Run keyword matching | Find all keywords |
| 4 | Verify case-insensitive matching | All variations found |

---

### TC-DE-007: Author Crawling - Multiple Pastes
**Priority:** Medium  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find paste with author link | Author identified |
| 2 | Crawl author's paste list | Retrieve all pastes |
| 3 | Analyze each paste | Relevance scores calculated |
| 4 | Verify deduplication | No duplicate URLs |

---

### TC-DE-008: Full Discovery Run
**Priority:** Critical  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start full discovery for target | Process initiated |
| 2 | Search paste sites | All sites queried |
| 3 | Analyze results | Relevance scores assigned |
| 4 | Crawl authors | Additional pastes found |
| 5 | Verify final results | Sorted by relevance |

---

## 3. Scraper Test Cases

### TC-SC-001: Tor Connection Test
**Priority:** Critical  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check Tor service running | Docker container up |
| 2 | Test connection to check.torproject.org | Connection successful |
| 3 | Verify IP is Tor exit node | IP differs from actual |
| 4 | Check response contains "Congratulations" | Tor confirmed |

---

### TC-SC-002: Tor Connection Failure Handling
**Priority:** High  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stop Tor service | Container stopped |
| 2 | Attempt Tor scraping | Connection fails |
| 3 | Verify error handling | Graceful error message |
| 4 | Check fallback behavior | Uses regular connection |

---

### TC-SC-003: Selenium Scraping - Dynamic Content
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to page with JavaScript | Page loaded |
| 2 | Wait for dynamic content | Content rendered |
| 3 | Extract data | Data captured |
| 4 | Close browser | Resources cleaned |

---

### TC-SC-004: Selenium Error Handling - Timeout
**Priority:** Medium  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set short timeout (2 seconds) | Timeout configured |
| 2 | Navigate to slow page | Page loading |
| 3 | Verify timeout exception | TimeoutException raised |
| 4 | Check error logged | Error in logs |

---

### TC-SC-005: BeautifulSoup Parsing
**Priority:** High  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Provide HTML with specific structure | HTML prepared |
| 2 | Parse with BeautifulSoup | Parsing successful |
| 3 | Extract target elements | Elements found |
| 4 | Verify extracted data | Data matches expected |

**Test Data:**
```html
<div class="paste-content">
  <h1>Paste Title</h1>
  <p>Content with password123</p>
</div>
```

---

### TC-SC-006: Request Rate Limiting
**Priority:** Medium  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Configure rate limit (1 req/sec) | Limit set |
| 2 | Send 10 requests rapidly | Requests queued |
| 3 | Measure time taken | ≥10 seconds |
| 4 | Verify all requests processed | All successful |

---

## 4. Frontend Test Cases

### TC-FE-001: Dashboard Initial Load
**Priority:** Critical  
**Test Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads |
| 2 | Verify dashboard components visible | All cards present |
| 3 | Check statistics display | Active/Completed scans shown |
| 4 | Verify WebSocket connection indicator | Status: Connected |

---

### TC-FE-002: Scan Form Submission - Valid Data
**Priority:** Critical  
**Test Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill URL field with valid URL | Input accepted |
| 2 | Set search depth to 2 | Slider updated |
| 3 | Enter target domain | Input accepted |
| 4 | Click "Start Scan" button | Form submitted |
| 5 | Verify success message | "Scan started" displayed |
| 6 | Check scan appears in list | New scan visible |

---

### TC-FE-003: Scan Form Validation - Invalid URL
**Priority:** High  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid URL (e.g., "not-url") | Input entered |
| 2 | Click "Start Scan" button | Validation triggered |
| 3 | Verify error message displayed | "Invalid URL format" shown |
| 4 | Check form not submitted | No API call made |

---

### TC-FE-004: Scan Form Validation - Empty Required Fields
**Priority:** High  
**Test Type:** Negative Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave URL field empty | Field empty |
| 2 | Click "Start Scan" button | Validation triggered |
| 3 | Verify error message | "URL is required" shown |
| 4 | Check submit button disabled | Button disabled state |

---

### TC-FE-005: Results List Display
**Priority:** High  
**Test Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create scan with results | Results available |
| 2 | Navigate to results view | Results list loads |
| 3 | Verify table columns | URL, Score, Status shown |
| 4 | Check sorting functionality | Can sort by columns |
| 5 | Verify pagination | Multiple pages available |

---

### TC-FE-006: Results Detail Expansion
**Priority:** Medium  
**Test Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on result row | Row expands |
| 2 | Verify detailed view | Full data displayed |
| 3 | Check extracted emails | Emails shown |
| 4 | Verify keywords highlighted | Keywords visible |
| 5 | Click again to collapse | Row collapses |

---

### TC-FE-007: Real-time Update via WebSocket
**Priority:** Critical  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open dashboard | WebSocket connected |
| 2 | Start scan via API (external) | Scan created |
| 3 | Observe dashboard | New scan appears |
| 4 | Wait for status changes | Updates in real-time |
| 5 | Verify no page refresh needed | Live updates |

---

### TC-FE-008: WebSocket Reconnection
**Priority:** High  
**Test Type:** Reliability

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Establish WebSocket connection | Connected |
| 2 | Stop backend service | Connection dropped |
| 3 | Verify reconnection attempts | Retry messages shown |
| 4 | Restart backend service | Service up |
| 5 | Verify auto-reconnection | Connected automatically |

---

### TC-FE-009: Responsive Design - Mobile View
**Priority:** Medium  
**Test Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Resize browser to 375px width | Mobile view |
| 2 | Verify layout adapts | Responsive layout |
| 3 | Check navigation menu | Hamburger menu shown |
| 4 | Test form usability | All controls accessible |
| 5 | Verify tables scroll | Horizontal scroll works |

---

### TC-FE-010: Dark Mode Toggle
**Priority:** Low  
**Test Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click theme toggle button | Theme switches |
| 2 | Verify dark mode applied | Dark colors |
| 3 | Check all components | Consistent theming |
| 4 | Toggle back to light mode | Light colors |
| 5 | Verify persistence | Theme saved |

---

## 5. Integration Test Cases

### TC-INT-001: Frontend to Backend Communication
**Priority:** Critical  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit scan from frontend | Request sent |
| 2 | Verify backend receives request | Logged in backend |
| 3 | Check response returned | 200 OK received |
| 4 | Verify frontend updates | UI reflects new scan |

---

### TC-INT-002: Backend to Discovery Engine
**Priority:** Critical  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger scan via API | Scan queued |
| 2 | Verify discovery engine called | Process started |
| 3 | Monitor discovery execution | All steps execute |
| 4 | Check results stored | Data in storage |

---

### TC-INT-003: Discovery Engine to Scrapers
**Priority:** High  
**Test Type:** Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Discovery engine requests scraping | Scraper called |
| 2 | Tor scraper processes request | Data fetched |
| 3 | Selenium scraper processes request | JS content loaded |
| 4 | Results returned to engine | Data received |

---

### TC-INT-004: Complete Scan Workflow
**Priority:** Critical  
**Test Type:** End-to-End Integration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User submits scan in UI | Form submitted |
| 2 | Backend creates scan record | Scan ID generated |
| 3 | Discovery engine processes | Sites crawled |
| 4 | Scrapers fetch data | Content retrieved |
| 5 | Results analyzed and scored | Scores calculated |
| 6 | WebSocket sends updates | Frontend updated |
| 7 | User views final results | Complete data shown |

---

### TC-INT-005: Docker Service Communication
**Priority:** High  
**Test Type:** Infrastructure

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start all Docker services | All containers up |
| 2 | Check network connectivity | Services ping each other |
| 3 | Verify Tor service accessible | Backend connects to Tor |
| 4 | Check frontend to backend | API calls successful |

---

## 6. Security Test Cases

### TC-SEC-001: SQL Injection Prevention
**Priority:** Critical  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send malicious SQL in URL field | Input sanitized |
| 2 | Try `'; DROP TABLE scans; --` | No SQL execution |
| 3 | Verify error handling | Safe error message |
| 4 | Check database integrity | No data lost |

**Test Data:**
```json
{
  "url": "https://example.com'; DROP TABLE scans; --"
}
```

---

### TC-SEC-002: XSS Prevention
**Priority:** Critical  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit scan with XSS payload | Payload sent |
| 2 | View results in frontend | No script execution |
| 3 | Check HTML encoding | Payload escaped |
| 4 | Verify alert not triggered | No XSS |

**Test Data:**
```json
{
  "url": "<script>alert('XSS')</script>"
}
```

---

### TC-SEC-003: CORS Security
**Priority:** High  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send request from unauthorized origin | Request blocked |
| 2 | Verify CORS headers | Only localhost allowed |
| 3 | Test with valid origin | Request allowed |

---

### TC-SEC-004: Rate Limiting
**Priority:** High  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send 100 requests in 1 second | Requests sent |
| 2 | Verify rate limiting triggered | Some blocked |
| 3 | Check response code | HTTP 429 Too Many Requests |
| 4 | Wait and retry | Successful after cooldown |

---

### TC-SEC-005: Authentication (Future)
**Priority:** Medium  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access API without token | HTTP 401 Unauthorized |
| 2 | Provide valid token | Access granted |
| 3 | Use expired token | HTTP 401 Unauthorized |
| 4 | Use invalid token | HTTP 401 Unauthorized |

---

### TC-SEC-006: Sensitive Data Exposure
**Priority:** Critical  
**Test Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check API responses | No passwords exposed |
| 2 | Verify error messages | No stack traces |
| 3 | Check logs | No sensitive data logged |
| 4 | Review network traffic | Data encrypted if needed |

---

## 7. Performance Test Cases

### TC-PERF-001: API Response Time - Single Request
**Priority:** High  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST /api/scan | Request sent |
| 2 | Measure response time | <500ms |
| 3 | Repeat 10 times | Average <500ms |
| 4 | Check 95th percentile | <800ms |

---

### TC-PERF-002: Concurrent Scan Processing
**Priority:** Critical  
**Test Type:** Load Testing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit 10 concurrent scans | All accepted |
| 2 | Monitor processing | All process |
| 3 | Verify completion times | Within acceptable range |
| 4 | Check system resources | CPU <80%, RAM <4GB |

---

### TC-PERF-003: WebSocket Message Latency
**Priority:** High  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Establish WebSocket connection | Connected |
| 2 | Trigger scan status update | Update sent |
| 3 | Measure time to receive | <100ms |
| 4 | Test with 50 connections | All <200ms |

---

### TC-PERF-004: Frontend Load Time
**Priority:** High  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear browser cache | Cache cleared |
| 2 | Navigate to homepage | Page loads |
| 3 | Measure First Contentful Paint | <1.5s |
| 4 | Measure Time to Interactive | <3s |
| 5 | Check Lighthouse score | >90 |

---

### TC-PERF-005: Discovery Engine - Large Result Set
**Priority:** Medium  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan with high search depth (5) | Scan started |
| 2 | Process 1000+ results | All processed |
| 3 | Measure total time | <5 minutes |
| 4 | Check memory usage | <2GB |

---

### TC-PERF-006: Database Query Performance
**Priority:** Medium  
**Test Type:** Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create 1000 scan records | Records created |
| 2 | Query all scans | Query executed |
| 3 | Measure query time | <100ms |
| 4 | Add filtering | Filtered query <150ms |

---

## 8. End-to-End Test Cases

### TC-E2E-001: Complete User Journey - First Time User
**Priority:** Critical  
**Test Type:** End-to-End

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open application | Homepage loads |
| 2 | View empty dashboard | "No scans yet" message |
| 3 | Click "New Scan" button | Form appears |
| 4 | Fill in scan details | All fields filled |
| 5 | Submit scan | Scan starts |
| 6 | Watch real-time updates | Status changes visible |
| 7 | Wait for completion | Scan completes |
| 8 | View results | Results displayed |
| 9 | Expand result details | Full data shown |
| 10 | Export results (if available) | File downloaded |

---

### TC-E2E-002: Multiple Concurrent Scans
**Priority:** High  
**Test Type:** End-to-End

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit 5 scans simultaneously | All queued |
| 2 | Monitor dashboard | All scans visible |
| 3 | Verify parallel processing | Multiple active |
| 4 | Wait for all completions | All complete |
| 5 | Compare results | All have data |

---

### TC-E2E-003: Scan with Tor Enabled
**Priority:** High  
**Test Type:** End-to-End

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable Tor option in form | Checkbox checked |
| 2 | Submit scan | Scan starts |
| 3 | Verify Tor used | Logs show Tor connection |
| 4 | Check for darknet results | Onion links processed |
| 5 | View final results | Darknet data included |

---

### TC-E2E-004: Session Persistence
**Priority:** Medium  
**Test Type:** End-to-End

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start scan | Scan running |
| 2 | Close browser tab | Tab closed |
| 3 | Reopen application | Dashboard loads |
| 4 | Check scan status | Still visible and updating |
| 5 | Verify WebSocket reconnects | Connection re-established |

---

### TC-E2E-005: Error Recovery
**Priority:** High  
**Test Type:** End-to-End

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start scan | Scan running |
| 2 | Stop backend service | Service down |
| 3 | Observe frontend behavior | Error message shown |
| 4 | Restart backend | Service up |
| 5 | Verify recovery | Connection restored |
| 6 | Check scan continues/restarts | Scan resumes |

---

## Test Execution Summary Template

| Test Case ID | Priority | Status | Execution Date | Tester | Notes | Defect ID |
|--------------|----------|--------|----------------|--------|-------|-----------|
| TC-BE-001 | Critical | | | | | |
| TC-BE-002 | High | | | | | |
| ... | | | | | | |

**Status Legend:**
- ✅ PASS: Test passed successfully
- ❌ FAIL: Test failed
- ⚠️ BLOCKED: Cannot execute due to dependency
- ⏸️ SKIP: Skipped this execution
- 🔄 RETEST: Needs retesting after fix

---

**Document End**
