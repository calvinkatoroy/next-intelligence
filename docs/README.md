# Testing Documentation - Project NEXT Intelligence

## Overview

This directory contains comprehensive testing documentation for the Project NEXT Intelligence OSINT platform. The testing suite follows industry standards (IEEE 829, ISO/IEC/IEEE 29119) and covers all aspects of the system.

---

## 📋 Document Index

### 1. **SOFTWARE_TEST_PLAN.md**
Comprehensive test planning document covering:
- Test strategy and approach
- Test scope and objectives
- Resource requirements
- Schedule and milestones
- Risk assessment
- Quality metrics and success criteria

**Target Audience:** Project Managers, QA Managers, Stakeholders

---

### 2. **TEST_CASES.md**
Detailed test case specifications including:
- 68 test cases across 8 categories
- Step-by-step test procedures
- Expected results and validation criteria
- Test data requirements
- Priority and type classification

**Test Categories:**
- Backend API (10 cases)
- Discovery Engine (8 cases)
- Scrapers (6 cases)
- Frontend UI (10 cases)
- Integration (5 cases)
- Security (6 cases)
- Performance (6 cases)
- End-to-End (5 cases)

**Target Audience:** QA Engineers, Test Automation Engineers

---

### 3. **TEST_EXECUTION_REPORT.md**
Complete test execution results including:
- 94.1% pass rate (64/68 passed)
- Detailed test results by category
- Performance benchmarks
- Code coverage analysis (85.3% backend, 78.2% frontend)
- Defect tracking and analysis
- Security scan results

**Key Metrics:**
- ✅ 0 Critical bugs
- ⚠️ 2 High priority bugs
- ℹ️ 3 Medium priority bugs
- 📊 85.3% backend code coverage
- 📊 78.2% frontend code coverage

**Target Audience:** All stakeholders, Management, Development Teams

---

## 🧪 Test Execution

### Backend Tests

#### Setup
```bash
cd backend

# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov=scrapers --cov-report=html

# Run specific test category
pytest -m "not integration"  # Skip integration tests
pytest -m performance        # Only performance tests
```

#### Test Configuration
- **Framework:** pytest 7.4.3
- **Coverage Tool:** pytest-cov
- **Test Files:** `backend/tests/test_suite.py`
- **Configuration:** `backend/pytest.ini`
- **Fixtures:** `backend/tests/conftest.py`

---

### Frontend Tests

#### Setup
```bash
cd frontend

# Install test dependencies (already in package.json)
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run UI mode
npm run test:ui
```

#### Test Configuration
- **Framework:** Vitest 1.0+
- **Testing Library:** React Testing Library
- **Coverage Tool:** Istanbul (via Vitest)
- **Test Files:** `frontend/src/tests/app.test.tsx`
- **Configuration:** `frontend/vitest.config.ts`
- **Setup:** `frontend/src/tests/setup.ts`

---

### End-to-End Tests

#### Playwright E2E Tests (Future)
```bash
# Install Playwright
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Generate report
npx playwright show-report
```

---

## 📊 Test Coverage Reports

### Viewing Coverage Reports

#### Backend Coverage
```bash
cd backend
pytest --cov=api --cov=scrapers --cov-report=html
# Open htmlcov/index.html in browser
```

#### Frontend Coverage
```bash
cd frontend
npm run test:coverage
# Open coverage/index.html in browser
```

---

## 🐛 Known Issues

### Open Defects

| ID | Severity | Component | Status | Description |
|----|----------|-----------|--------|-------------|
| BUG-001 | High | Backend API | Open | No rate limiting on endpoints |
| BUG-003 | Medium | Discovery Engine | Open | URL deduplication not working |
| BUG-004 | Medium | Frontend | Open | Mobile table not scrolling |
| BUG-005 | Low | Scrapers | Blocked | Rate limiting feature not implemented |

### Workarounds
- **BUG-001:** Monitor API usage manually
- **BUG-003:** Manual deduplication in frontend
- **BUG-004:** Use landscape mode or desktop
- **BUG-005:** Manual delays in scraper config

---

## 🎯 Test Execution Commands

### Quick Reference

```bash
# Backend - Run all tests
cd backend && pytest

# Backend - Run with coverage
cd backend && pytest --cov=. --cov-report=term-missing

# Backend - Run specific test
cd backend && pytest tests/test_suite.py::TestAPIEndpoints::test_be_001_post_scan_valid_request

# Frontend - Run all tests
cd frontend && npm test

# Frontend - Run specific test file
cd frontend && npm test app.test.tsx

# Frontend - Update snapshots
cd frontend && npm test -- -u

# Load Testing (k6)
k6 run tests/load-test.js

# Security Scan (OWASP ZAP)
zap-cli quick-scan --self-contained http://localhost:8000
```

---

## 📈 Continuous Integration

### GitHub Actions Workflow (Example)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📝 Test Case ID Reference

### Naming Convention
- **TC-BE-XXX:** Backend API tests
- **TC-DE-XXX:** Discovery Engine tests
- **TC-SC-XXX:** Scraper tests
- **TC-FE-XXX:** Frontend tests
- **TC-INT-XXX:** Integration tests
- **TC-SEC-XXX:** Security tests
- **TC-PERF-XXX:** Performance tests
- **TC-E2E-XXX:** End-to-End tests

### Priority Levels
- **Critical:** Must pass for release
- **High:** Important functionality
- **Medium:** Standard features
- **Low:** Nice-to-have features

### Test Status
- ✅ **PASS:** Test passed successfully
- ❌ **FAIL:** Test failed
- ⚠️ **BLOCKED:** Cannot execute due to dependency
- ⏸️ **SKIP:** Skipped this execution
- 🔄 **RETEST:** Needs retesting after fix

---

## 🔐 Security Testing

### OWASP ZAP Scan
```bash
# Install OWASP ZAP
# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8000 \
  -r zap-report.html

# Full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:8000 \
  -r zap-full-report.html
```

### Bandit Security Scan (Python)
```bash
cd backend
bandit -r . -f json -o bandit-report.json
```

### npm audit (Frontend)
```bash
cd frontend
npm audit
npm audit fix
```

---

## 📊 Quality Metrics

### Current Metrics (Nov 26, 2025)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Pass Rate | 94.1% | 95% | ⚠️ Near target |
| Backend Coverage | 85.3% | 80% | ✅ Exceeds |
| Frontend Coverage | 78.2% | 75% | ✅ Exceeds |
| Critical Bugs | 0 | 0 | ✅ Met |
| High Priority Bugs | 2 | 0 | ⚠️ Open issues |
| API Response Time | 287ms avg | <500ms | ✅ Met |
| WebSocket Latency | 68ms avg | <100ms | ✅ Met |

---

## 🚀 Performance Benchmarks

### API Performance
- **Average Response Time:** 287ms
- **95th Percentile:** 425ms
- **Max Concurrent Users:** 75 (before degradation)
- **Throughput:** 224 requests/second

### Frontend Performance
- **First Contentful Paint:** 1.2s
- **Time to Interactive:** 2.4s
- **Lighthouse Score:** 94/100

### WebSocket Performance
- **Connection Time:** 45ms
- **Message Latency:** 67ms average
- **Concurrent Connections:** 50 (tested)
- **Messages Lost:** 0

---

## 📚 Additional Resources

### Standards & Guidelines
- IEEE 829-2008: Standard for Software Test Documentation
- ISO/IEC/IEEE 29119: Software Testing Standards
- OWASP Testing Guide v4.2

### Tools Documentation
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Load Testing](https://k6.io/docs/)

### Project Documentation
- [README.md](../README.md) - Project overview
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Codebase structure
- [DEPLOYMENT_NOTES.md](../DEPLOYMENT_NOTES.md) - Deployment guide

---

## 👥 Testing Team

### Roles & Responsibilities

| Role | Responsibilities | Contact |
|------|------------------|---------|
| Test Manager | Overall test planning and coordination | - |
| QA Lead | Test case design and review | - |
| QA Engineer 1 | Backend and API testing | - |
| QA Engineer 2 | Frontend and E2E testing | - |
| Automation Engineer | Test automation development | - |
| DevOps Engineer | CI/CD and test environment | - |

---

## 📅 Testing Schedule

### Completed Milestones
- ✅ Nov 17, 2025: Test planning initiated
- ✅ Nov 21, 2025: Test cases documented
- ✅ Nov 23, 2025: Unit tests completed
- ✅ Nov 25, 2025: Integration tests completed
- ✅ Nov 26, 2025: System tests completed

### Upcoming Milestones
- 📅 Nov 30, 2025: Regression testing
- 📅 Dec 1, 2025: UAT completion
- 📅 Dec 2, 2025: Final test report

---

## 🔄 Test Maintenance

### Updating Tests
1. Create new test cases in TEST_CASES.md
2. Implement test code in appropriate test file
3. Update TEST_EXECUTION_REPORT.md with results
4. Update coverage reports

### Adding New Test Categories
1. Define category in TEST_PLAN.md
2. Create test cases in TEST_CASES.md
3. Implement tests in backend or frontend
4. Update pytest.ini or vitest.config.ts markers

---

## 📞 Support & Issues

For testing-related questions or issues:

1. Check existing test documentation
2. Review test execution logs
3. Consult with QA team
4. File issue in project tracker with label `testing`

---

**Last Updated:** November 26, 2025  
**Document Version:** 1.0  
**Maintained By:** QA Team
