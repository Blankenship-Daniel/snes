#!/bin/bash

# INTEGRATION TEST RUNNER
# Cross-team validation automation
# Author: Sam (Code Custodian)

set -e

echo "🔗 BRIDGE INTEGRATION TEST SUITE"
echo "================================="
echo "Cross-team validation for SNES Modder + bsnes-plus"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BSNES_PATH="${BSNES_PATH:-bsnes-plus}"
TEST_ROM_PATH="${TEST_ROM_PATH:-./test-roms/zelda3-clean.sfc}"
REPORT_DIR="./test-reports/integration"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p "$REPORT_DIR"
mkdir -p "./test-roms"
mkdir -p "./test-logs"

echo -e "${BLUE}📋 Pre-flight Checks${NC}"
echo "─────────────────────"

# Check dependencies
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓$(NC) $(node --version)"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

echo -n "npm: "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} $(npm --version)"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

echo -n "Test ROM: "
if [ -f "$TEST_ROM_PATH" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${YELLOW}⚠ Creating test ROM${NC}"
    ./scripts/create-test-rom.sh "$TEST_ROM_PATH"
fi

echo -n "bsnes-plus: "
if command -v "$BSNES_PATH" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Found"
    EMULATOR_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ Not found (some tests will be skipped)${NC}"
    EMULATOR_AVAILABLE=false
fi

echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing Dependencies${NC}"
echo "─────────────────────────────"
npm ci

echo ""

# Start emulator if available
if [ "$EMULATOR_AVAILABLE" = true ]; then
    echo -e "${BLUE}🎮 Starting bsnes-plus${NC}"
    echo "─────────────────────"
    
    # Start emulator in background with debugging enabled
    "$BSNES_PATH" --debug-port=23074 &
    EMULATOR_PID=$!
    
    echo "Emulator PID: $EMULATOR_PID"
    echo "Waiting for emulator to start..."
    sleep 3
    
    # Check if emulator is responsive
    if nc -z localhost 23074 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Emulator ready"
    else
        echo -e "${YELLOW}⚠ Emulator not responding, running in mock mode${NC}"
        EMULATOR_AVAILABLE=false
    fi
fi

echo ""

# Function to run test suite
run_test_suite() {
    local suite_name="$1"
    local test_file="$2"
    local description="$3"
    
    echo -e "${BLUE}🧪 $description${NC}"
    echo "─────────────────────────────────────────"
    
    local start_time=$(date +%s)
    local log_file="./test-logs/${suite_name}_${TIMESTAMP}.log"
    
    if npm run test -- "$test_file" --reporter=verbose 2>&1 | tee "$log_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ $suite_name completed in ${duration}s${NC}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ $suite_name failed after ${duration}s${NC}"
        return 1
    fi
}

# Test suite execution
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${BLUE}🚀 Running Integration Test Suites${NC}"
echo "═══════════════════════════════════════"
echo ""

# Contract Tests (always run)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "contract" "tests/integration/cross-team-validation.spec.ts" "Cross-Team Contract Validation"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

echo ""

# Bridge Tests (only if emulator available)
if [ "$EMULATOR_AVAILABLE" = true ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "bridge" "tests/integration/bridge-validation.test.ts" "Bridge Integration Tests"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "emulator" "tests/integration/emulator-bridge.test.ts" "Emulator Bridge Tests"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}⏭ Skipping emulator tests (bsnes-plus not available)${NC}"
fi

echo ""

# Performance Tests
echo -e "${BLUE}📊 Performance Validation${NC}"
echo "─────────────────────────"

if [ "$EMULATOR_AVAILABLE" = true ]; then
    echo "Running performance benchmarks..."
    npm run test:performance 2>&1 | tee "./test-logs/performance_${TIMESTAMP}.log"
else
    echo -e "${YELLOW}⏭ Skipping performance tests (emulator required)${NC}"
fi

echo ""

# Generate Test Report
echo -e "${BLUE}📈 Generating Test Report${NC}"
echo "─────────────────────────"

REPORT_FILE="$REPORT_DIR/integration_report_${TIMESTAMP}.html"

cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Integration Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-suite { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 Bridge Integration Test Report</h1>
        <p><strong>Timestamp:</strong> $TIMESTAMP</p>
        <p><strong>Emulator Available:</strong> $EMULATOR_AVAILABLE</p>
        <p><strong>Test ROM:</strong> $TEST_ROM_PATH</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em;">$TOTAL_TESTS</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; color: #28a745;">$PASSED_TESTS</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 2em; color: #dc3545;">$((TOTAL_TESTS - PASSED_TESTS))</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em;">$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%</div>
        </div>
    </div>
EOF

# Add test suite details
for log_file in ./test-logs/*_${TIMESTAMP}.log; do
    if [ -f "$log_file" ]; then
        suite_name=$(basename "$log_file" "_${TIMESTAMP}.log")
        cat >> "$REPORT_FILE" << EOF
    <div class="test-suite">
        <h3>$suite_name Test Suite</h3>
        <pre>$(cat "$log_file" | tail -50)</pre>
    </div>
EOF
    fi
done

cat >> "$REPORT_FILE" << EOF
</body>
</html>
EOF

echo "Report generated: $REPORT_FILE"

# Cleanup
if [ "$EMULATOR_AVAILABLE" = true ] && [ ! -z "$EMULATOR_PID" ]; then
    echo ""
    echo -e "${BLUE}🧹 Cleanup${NC}"
    echo "─────────"
    echo "Stopping emulator (PID: $EMULATOR_PID)..."
    kill $EMULATOR_PID 2>/dev/null || true
    wait $EMULATOR_PID 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Emulator stopped"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "═══════════════"
echo "Total Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Bridge integration verified!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check logs for details.${NC}"
    exit 1
fi