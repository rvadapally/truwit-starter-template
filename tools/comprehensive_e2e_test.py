#!/usr/bin/env python3
"""
Comprehensive E2E Test Suite for TruWit Badge System
Tests actual user flows and catches real issues that manual testing misses.
"""

import asyncio
import json
import os
import time
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Set, Tuple, Optional
from urllib.parse import urljoin, urlparse

from playwright.async_api import Browser, ConsoleMessage, Page, Playwright, async_playwright


@dataclass
class TestResult:
    test_name: str
    passed: bool
    error_message: str = ""
    details: Dict = field(default_factory=dict)
    duration_ms: int = 0

    def to_dict(self) -> Dict:
        return asdict(self)


class ComprehensiveE2ETester:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get("E2E_BASE_URL", "https://truwit.ai")
        self.api_url = os.environ.get("E2E_API_URL", "https://truwit-starter-template-production.up.railway.app")
        self.results: List[TestResult] = []
        
    async def run_all_tests(self) -> Dict:
        """Run comprehensive E2E test suite"""
        print(f"[TEST] Starting Comprehensive E2E Tests")
        print(f"   Frontend: {self.base_url}")
        print(f"   API: {self.api_url}")
        print("=" * 60)
        
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)  # Visible for debugging
            
            try:
                # Test 1: Frontend Routes and Basic Functionality
                await self.test_frontend_routes(browser)
                
                # Test 2: API Health and Endpoints
                await self.test_api_endpoints(browser)
                
                # Test 3: Badge System End-to-End
                await self.test_badge_system(browser)
                
                # Test 4: Verification Page Functionality
                await self.test_verification_pages(browser)
                
                # Test 5: Caching and Performance
                await self.test_caching_behavior(browser)
                
                # Test 6: Cross-Origin Requests
                await self.test_cors_functionality(browser)
                
            finally:
                await browser.close()
        
        return self.generate_report()
    
    async def test_frontend_routes(self, browser: Browser):
        """Test all frontend routes load correctly"""
        print("\n[TEST] Testing Frontend Routes...")
        
        routes_to_test = [
            "/",
            "/about", 
            "/contact",
            "/how-it-works",
            "/technology",
            "/pricing",
            "/investors",
            "/use-cases",
            "/verify",
            "/app",  # Angular app
            "/app/#/verify"  # Verification page
        ]
        
        for route in routes_to_test:
            start_time = time.time()
            test_name = f"Frontend Route: {route}"
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Track console errors
                console_errors = []
                def on_console(msg: ConsoleMessage):
                    if msg.type in ["error", "warning"]:
                        console_errors.append({"type": msg.type, "text": msg.text})
                
                page.on("console", on_console)
                
                # Navigate to route
                url = urljoin(self.base_url, route)
                response = await page.goto(url, wait_until="load", timeout=10000)
                
                # Wait for page to stabilize
                await page.wait_for_timeout(2000)
                
                # Check for loading spinners
                loading_elements = await page.evaluate("""
                    () => {
                        const spinners = document.querySelectorAll('.loading-spinner, .spinner, [class*="loading"]');
                        const loadingTexts = Array.from(document.querySelectorAll('.loading-text, [class*="loading"]')).map(el => el.textContent);
                        return {
                            spinnerCount: spinners.length,
                            loadingTexts: loadingTexts,
                            hasStuckLoading: loadingTexts.some(text => text && text.includes('Loading'))
                        };
                    }
                """)
                
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Determine if test passed
                passed = (
                    response and response.status == 200 and
                    not loading_elements.get('hasStuckLoading') and
                    len([e for e in console_errors if e['type'] == 'error']) == 0
                )
                
                error_msg = ""
                if not passed:
                    if not response or response.status != 200:
                        error_msg = f"HTTP {response.status if response else 'No response'}"
                    elif loading_elements.get('hasStuckLoading'):
                        error_msg = f"Stuck loading: {loading_elements.get('loadingTexts')}"
                    elif console_errors:
                        error_msg = f"Console errors: {[e['text'] for e in console_errors if e['type'] == 'error']}"
                
                self.results.append(TestResult(
                    test_name=test_name,
                    passed=passed,
                    error_message=error_msg,
                    details={
                        "url": url,
                        "status": response.status if response else None,
                        "console_errors": console_errors,
                        "loading_elements": loading_elements
                    },
                    duration_ms=duration_ms
                ))
                
                await context.close()
                
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                self.results.append(TestResult(
                    test_name=test_name,
                    passed=False,
                    error_message=str(e),
                    duration_ms=duration_ms
                ))
    
    async def test_api_endpoints(self, browser: Browser):
        """Test API endpoints are working"""
        print("\n[TEST] Testing API Endpoints...")
        
        api_tests = [
            ("Health Check", f"{self.api_url}/health"),
            ("Badge SVG", f"{self.api_url}/v1/badge/TW-E6F13C97.svg"),
            ("Proof Card", f"{self.api_url}/cards/proof/TW-E6F13C97-800.png"),
            ("Static Badge", f"{self.api_url}/assets/proof/TW-E6F13C97-800.png")
        ]
        
        for test_name, url in api_tests:
            start_time = time.time()
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Make request and check response
                response = await page.request.get(url)
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Check cache headers
                cache_control = response.headers.get('cache-control', '')
                has_no_cache = 'no-cache' in cache_control.lower()
                
                passed = (
                    response.status == 200 and
                    response.headers.get('content-type') and
                    has_no_cache  # Should have no-cache headers after our fix
                )
                
                error_msg = ""
                if not passed:
                    if response.status != 200:
                        error_msg = f"HTTP {response.status}"
                    elif not has_no_cache:
                        error_msg = f"Missing no-cache headers: {cache_control}"
                
                self.results.append(TestResult(
                    test_name=f"API: {test_name}",
                    passed=passed,
                    error_message=error_msg,
                    details={
                        "url": url,
                        "status": response.status,
                        "content_type": response.headers.get('content-type'),
                        "cache_control": cache_control,
                        "content_length": response.headers.get('content-length')
                    },
                    duration_ms=duration_ms
                ))
                
                await context.close()
                
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                self.results.append(TestResult(
                    test_name=f"API: {test_name}",
                    passed=False,
                    error_message=str(e),
                    duration_ms=duration_ms
                ))
    
    async def test_badge_system(self, browser: Browser):
        """Test the complete badge system end-to-end with consistency validation"""
        print("\n[TEST] Testing Badge System Consistency (CRUX of the app)...")
        
        start_time = time.time()
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Track badge loading and consistency
            badge_loading_logs = []
            badge_urls_found = set()
            console_errors = []
            
            def on_console(msg: ConsoleMessage):
                if "badge" in msg.text.lower() or "loading" in msg.text.lower() or "proof" in msg.text.lower():
                    badge_loading_logs.append({"type": msg.type, "text": msg.text})
                if msg.type == "error":
                    console_errors.append(msg.text)
            
            page.on("console", on_console)
            
            # Test 1: Navigate to verification page and check badge loading
            print("   Testing verification page badge loading...")
            verify_url = f"{self.base_url}/app/#/verify"
            await page.goto(verify_url, wait_until="load")
            await page.wait_for_timeout(3000)
            
            # Check for badge elements and consistency
            badge_analysis = await page.evaluate("""
                () => {
                    const badges = document.querySelectorAll('img[alt*="badge"], img[alt*="Badge"], img[alt*="Verified"], img[alt*="Truwit"], .badge-image, .circular-badge-image');
                    const loadingSpinners = document.querySelectorAll('.loading-spinner, .badge-loading, [class*="loading"]');
                    const loadingTexts = Array.from(document.querySelectorAll('.loading-text, [class*="loading"]')).map(el => el.textContent);
                    
                    const badgeData = Array.from(badges).map(img => ({
                        src: img.src,
                        alt: img.alt,
                        className: img.className,
                        width: img.width,
                        height: img.height,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight
                    }));
                    
                    return {
                        badgeCount: badges.length,
                        spinnerCount: loadingSpinners.length,
                        loadingTexts: loadingTexts,
                        hasStuckLoading: loadingTexts.some(text => text && text.includes('Loading badge')),
                        badgeData: badgeData,
                        isCircularBadge: badgeData.some(b => 
                            b.src.includes('circular') || 
                            b.src.includes('card') || 
                            b.className.includes('circular') ||
                            (b.naturalWidth > 0 && b.naturalHeight > 0 && Math.abs(b.naturalWidth - b.naturalHeight) < 50)
                        )
                    };
                }
            """)
            
            # Test 2: Test badge consistency across different routes
            print("   Testing badge consistency across routes...")
            routes_to_test = [
                ("Home", f"{self.base_url}/app/#/"),
                ("About", f"{self.base_url}/app/#/about"),
            ]
            
            route_consistency_scores = []
            
            for route_name, route_url in routes_to_test:
                await page.goto(route_url, wait_until="load")
                await page.wait_for_timeout(2000)
                
                route_badges = await page.evaluate("""
                    () => {
                        const badges = document.querySelectorAll('img[alt*="badge"], img[alt*="Badge"], img[alt*="Verified"], img[alt*="Truwit"]');
                        return Array.from(badges).map(img => ({
                            src: img.src,
                            alt: img.alt,
                            className: img.className
                        }));
                    }
                """)
                
                # Check consistency of badge sources
                route_score = 1.0
                for badge in route_badges:
                    badge_urls_found.add(badge['src'])
                    # Check if badge is using new proof card endpoint
                    if not ('cards/proof' in badge['src'] or 'circular' in badge['src'].lower()):
                        route_score -= 0.3
                
                route_consistency_scores.append(route_score)
            
            # Test 3: Test badge API endpoints directly
            print("   Testing badge API endpoints...")
            api_endpoints = [
                f"{self.api_url}/cards/proof/TW-TEST-800.png",
                f"{self.api_url}/v1/badge/TW-TEST.svg",
            ]
            
            api_success_count = 0
            for endpoint in api_endpoints:
                try:
                    response = await page.request.get(endpoint)
                    if response.status in [200, 404]:  # 404 is expected for test IDs
                        api_success_count += 1
                except:
                    pass
            
            api_consistency_score = api_success_count / len(api_endpoints) if api_endpoints else 0.0
            
            # Calculate overall consistency score
            overall_consistency = 0.0
            consistency_factors = []
            
            # Factor 1: Badge loading success
            if badge_analysis.get('badgeCount', 0) > 0 and not badge_analysis.get('hasStuckLoading'):
                consistency_factors.append(1.0)
            else:
                consistency_factors.append(0.0)
            
            # Factor 2: No loading spinners
            if badge_analysis.get('spinnerCount', 0) == 0:
                consistency_factors.append(1.0)
            else:
                consistency_factors.append(0.5)
            
            # Factor 3: Circular badge format
            if badge_analysis.get('isCircularBadge', False):
                consistency_factors.append(1.0)
            else:
                consistency_factors.append(0.3)
            
            # Factor 4: Route consistency
            if route_consistency_scores:
                consistency_factors.append(sum(route_consistency_scores) / len(route_consistency_scores))
            else:
                consistency_factors.append(1.0)
            
            # Factor 5: API consistency
            consistency_factors.append(api_consistency_score)
            
            # Factor 6: No console errors
            if len(console_errors) == 0:
                consistency_factors.append(1.0)
            else:
                consistency_factors.append(0.5)
            
            overall_consistency = sum(consistency_factors) / len(consistency_factors)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Determine if test passed (rock solid = 90%+ consistency)
            passed = overall_consistency >= 0.9
            
            error_msg = ""
            if not passed:
                if overall_consistency >= 0.7:
                    error_msg = f"Badge consistency needs improvement: {overall_consistency:.2f}"
                else:
                    error_msg = f"CRITICAL: Badge consistency issues detected: {overall_consistency:.2f}"
            
            self.results.append(TestResult(
                test_name="Badge System Consistency (CRUX)",
                passed=passed,
                error_message=error_msg,
                details={
                    "overall_consistency_score": overall_consistency,
                    "consistency_factors": {
                        "badge_loading": consistency_factors[0],
                        "no_spinners": consistency_factors[1],
                        "circular_format": consistency_factors[2],
                        "route_consistency": consistency_factors[3],
                        "api_consistency": consistency_factors[4],
                        "no_console_errors": consistency_factors[5]
                    },
                    "badge_analysis": badge_analysis,
                    "route_scores": dict(zip([r[0] for r in routes_to_test], route_consistency_scores)),
                    "unique_badge_urls": list(badge_urls_found),
                    "console_errors": console_errors,
                    "loading_logs": badge_loading_logs,
                    "verify_url": verify_url,
                    "badge_status": "ROCK SOLID" if overall_consistency >= 0.9 else "NEEDS IMPROVEMENT" if overall_consistency >= 0.7 else "CRITICAL ISSUES"
                },
                duration_ms=duration_ms
            ))
            
            await context.close()
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.results.append(TestResult(
                test_name="Badge System Consistency (CRUX)",
                passed=False,
                error_message=str(e),
                duration_ms=duration_ms
            ))
    
    async def test_verification_pages(self, browser: Browser):
        """Test verification pages with actual proof IDs"""
        print("\n[TEST] Testing Verification Pages...")
        
        # Test with known proof ID
        proof_id = "TW-E6F13C97"
        verify_url = f"{self.base_url}/app/t/{proof_id}"
        
        start_time = time.time()
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Track all console messages
            console_messages = []
            def on_console(msg: ConsoleMessage):
                console_messages.append({"type": msg.type, "text": msg.text})
            
            page.on("console", on_console)
            
            # Navigate to verification page
            await page.goto(verify_url, wait_until="load")
            await page.wait_for_timeout(3000)
            
            # Check page content
            page_content = await page.evaluate("""
                () => {
                    const proofIdElements = document.querySelectorAll('[class*="proof"], [class*="Proof"], code');
                    const proofIds = Array.from(proofIdElements).map(el => el.textContent).filter(text => text && text.includes('TW-'));
                    
                    const badgeImages = document.querySelectorAll('img[src*="badge"], img[src*="proof"], img[alt*="badge"]');
                    const badgeSources = Array.from(badgeImages).map(img => img.src);
                    
                    return {
                        proofIds: proofIds,
                        badgeCount: badgeImages.length,
                        badgeSources: badgeSources,
                        hasTWPrefix: proofIds.some(id => id.includes('TW-'))
                    };
                }
            """)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Check if TW- prefix is present and badges load
            passed = (
                page_content.get('hasTWPrefix', False) and
                page_content.get('badgeCount', 0) > 0 and
                len([msg for msg in console_messages if msg['type'] == 'error']) == 0
            )
            
            error_msg = ""
            if not passed:
                if not page_content.get('hasTWPrefix'):
                    error_msg = f"No TW- prefix found. Found: {page_content.get('proofIds')}"
                elif page_content.get('badgeCount', 0) == 0:
                    error_msg = "No badge images found"
                else:
                    error_msg = f"Console errors: {[msg['text'] for msg in console_messages if msg['type'] == 'error']}"
            
            self.results.append(TestResult(
                test_name=f"Verification Page: {proof_id}",
                passed=passed,
                error_message=error_msg,
                details={
                    "page_content": page_content,
                    "console_messages": console_messages,
                    "verify_url": verify_url
                },
                duration_ms=duration_ms
            ))
            
            await context.close()
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.results.append(TestResult(
                test_name=f"Verification Page: {proof_id}",
                passed=False,
                error_message=str(e),
                duration_ms=duration_ms
            ))
    
    async def test_caching_behavior(self, browser: Browser):
        """Test that caching is properly disabled"""
        print("\n[TEST] Testing Caching Behavior...")
        
        test_urls = [
            f"{self.api_url}/v1/badge/TW-E6F13C97.svg",
            f"{self.api_url}/cards/proof/TW-E6F13C97-800.png"
        ]
        
        for url in test_urls:
            start_time = time.time()
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Make two identical requests
                response1 = await page.request.get(url)
                await page.wait_for_timeout(100)
                response2 = await page.request.get(url)
                
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Check cache headers
                cache_control1 = response1.headers.get('cache-control', '')
                cache_control2 = response2.headers.get('cache-control', '')
                
                has_no_cache = 'no-cache' in cache_control1.lower() and 'no-cache' in cache_control2.lower()
                
                passed = (
                    response1.status == 200 and
                    response2.status == 200 and
                    has_no_cache
                )
                
                error_msg = ""
                if not passed:
                    if not has_no_cache:
                        error_msg = f"Missing no-cache headers. Got: {cache_control1}"
                    else:
                        error_msg = f"HTTP errors: {response1.status}, {response2.status}"
                
                self.results.append(TestResult(
                    test_name=f"Caching Test: {url.split('/')[-1]}",
                    passed=passed,
                    error_message=error_msg,
                    details={
                        "url": url,
                        "cache_control_1": cache_control1,
                        "cache_control_2": cache_control2,
                        "status_1": response1.status,
                        "status_2": response2.status
                    },
                    duration_ms=duration_ms
                ))
                
                await context.close()
                
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                self.results.append(TestResult(
                    test_name=f"Caching Test: {url.split('/')[-1]}",
                    passed=False,
                    error_message=str(e),
                    duration_ms=duration_ms
                ))
    
    async def test_cors_functionality(self, browser: Browser):
        """Test cross-origin requests work properly"""
        print("\n[TEST] Testing CORS Functionality...")
        
        start_time = time.time()
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Navigate to frontend
            await page.goto(f"{self.base_url}/app/#/verify", wait_until="load")
            
            # Make API request from frontend context
            cors_test = await page.evaluate(f"""
                async () => {{
                    try {{
                        const response = await fetch('{self.api_url}/v1/badge/TW-E6F13C97.svg');
                        return {{
                            success: response.ok,
                            status: response.status,
                            headers: Object.fromEntries(response.headers.entries())
                        }};
                    }} catch (error) {{
                        return {{
                            success: false,
                            error: error.message
                        }};
                    }}
                }}
            """)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            passed = cors_test.get('success', False)
            error_msg = cors_test.get('error', '') if not passed else ""
            
            self.results.append(TestResult(
                test_name="CORS Functionality",
                passed=passed,
                error_message=error_msg,
                details=cors_test,
                duration_ms=duration_ms
            ))
            
            await context.close()
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.results.append(TestResult(
                test_name="CORS Functionality",
                passed=False,
                error_message=str(e),
                duration_ms=duration_ms
            ))
    
    def generate_report(self) -> Dict:
        """Generate comprehensive test report"""
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r.passed])
        failed_tests = total_tests - passed_tests
        
        # Group results by category
        categories = {}
        for result in self.results:
            category = result.test_name.split(':')[0] if ':' in result.test_name else 'Other'
            if category not in categories:
                categories[category] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if result.passed:
                categories[category]['passed'] += 1
            else:
                categories[category]['failed'] += 1
            
            categories[category]['tests'].append(result.to_dict())
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "base_url": self.base_url,
                "api_url": self.api_url
            },
            "categories": categories,
            "all_results": [r.to_dict() for r in self.results]
        }
        
        return report


async def main():
    """Main entry point"""
    tester = ComprehensiveE2ETester()
    report = await tester.run_all_tests()
    
    # Print summary
    print("\n" + "=" * 60)
    print("[TEST] COMPREHENSIVE E2E TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed']}")
    print(f"Failed: {report['summary']['failed']}")
    print(f"Success Rate: {report['summary']['success_rate']}")
    
    # Print failed tests
    failed_tests = [r for r in report['all_results'] if not r['passed']]
    if failed_tests:
        print(f"\n[FAIL] FAILED TESTS ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  * {test['test_name']}: {test['error_message']}")
    
    # Save detailed report
    report_file = f"test-results/comprehensive-e2e-report-{int(time.time())}.json"
    os.makedirs("test-results", exist_ok=True)
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n[INFO] Detailed report saved to: {report_file}")
    
    # Exit with error code if any tests failed
    exit_code = 1 if failed_tests else 0
    print(f"\n[DONE] Test suite completed with exit code: {exit_code}")
    return exit_code


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
