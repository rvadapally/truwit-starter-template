#!/usr/bin/env python3
"""
Badge Consistency E2E Test Suite for TruWit
Comprehensive testing of the unified circular badge system across all routes and components.
This is the CRUX of the app - badge consistency must be rock solid.
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
class BadgeTestResult:
    test_name: str
    passed: bool
    error_message: str = ""
    badge_urls_found: List[str] = field(default_factory=list)
    badge_consistency_score: float = 0.0
    details: Dict = field(default_factory=dict)
    duration_ms: int = 0

    def to_dict(self) -> Dict:
        return asdict(self)


class BadgeConsistencyTester:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get("E2E_BASE_URL", "https://truwit.ai")
        self.api_url = os.environ.get("E2E_API_URL", "https://truwit-starter-template-production.up.railway.app")
        self.results: List[BadgeTestResult] = []
        self.console_errors: List[str] = []
        self.badge_urls_seen: Set[str] = set()
        
    async def run_badge_consistency_tests(self) -> Dict:
        """Run comprehensive badge consistency tests"""
        print(f"[BADGE TEST] Starting Badge Consistency E2E Tests")
        print(f"   Frontend: {self.base_url}")
        print(f"   API: {self.api_url}")
        print("=" * 80)
        
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)  # Visible for debugging
            
            try:
                # Test 1: Create a new proof and track badge consistency
                await self.test_badge_creation_and_consistency(browser)
                
                # Test 2: Test all verification routes for badge consistency
                await self.test_verification_routes_badge_consistency(browser)
                
                # Test 3: Test badge loading states and error handling
                await self.test_badge_loading_states(browser)
                
                # Test 4: Test badge API endpoints directly
                await self.test_badge_api_endpoints(browser)
                
                # Test 5: Test badge fallback mechanisms
                await self.test_badge_fallback_mechanisms(browser)
                
                # Test 6: Test badge sharing and embed functionality
                await self.test_badge_sharing_consistency(browser)
                
                # Test 7: Cross-browser badge consistency
                await self.test_cross_browser_badge_consistency(playwright)
                
            finally:
                await browser.close()
        
        return self.generate_badge_report()
    
    async def test_badge_creation_and_consistency(self, browser: Browser):
        """Test badge consistency from creation through all display points"""
        print("\n[BADGE TEST] Testing Badge Creation and Consistency...")
        start_time = time.time()
        
        page = await browser.new_page()
        console_messages = []
        
        def on_console(msg: ConsoleMessage):
            console_messages.append({"type": msg.type, "text": msg.text})
            if msg.type == "error":
                self.console_errors.append(msg.text)
        
        page.on("console", on_console)
        
        try:
            # Navigate to verification page
            await page.goto(f"{self.base_url}/app/#/verify")
            await page.wait_for_load_state("networkidle")
            
            # Fill out verification form
            await page.fill('input[placeholder*="URL"]', "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            await page.click('button[type="submit"]')
            
            # Wait for verification to complete
            await page.wait_for_selector('.verification-result', timeout=30000)
            
            # Extract proof ID from the page
            proof_id_element = await page.query_selector('.proof-id, [class*="proof-id"], [class*="trustmark"]')
            proof_id = None
            if proof_id_element:
                proof_id = await proof_id_element.text_content()
                proof_id = proof_id.strip() if proof_id else None
            
            if not proof_id:
                # Try to extract from URL or other elements
                current_url = page.url
                if '/t/' in current_url:
                    proof_id = current_url.split('/t/')[-1].split('#')[0]
            
            if not proof_id:
                self.results.append(BadgeTestResult(
                    test_name="Badge Creation - Proof ID Extraction",
                    passed=False,
                    error_message="Could not extract proof ID from verification result",
                    duration_ms=int((time.time() - start_time) * 1000)
                ))
                return
            
            print(f"   Found Proof ID: {proof_id}")
            
            # Test badge consistency across different routes
            badge_consistency_tests = [
                ("Verification Result Page", f"{self.base_url}/app/#/verify"),
                ("Direct Verification Link", f"{self.base_url}/app/#/t/{proof_id}"),
                ("Public Verification Page", f"{self.base_url}/app/#/t/{proof_id}")
            ]
            
            badge_urls_found = []
            consistency_score = 0.0
            
            for test_name, test_url in badge_consistency_tests:
                print(f"   Testing: {test_name}")
                
                # Navigate to test URL
                await page.goto(test_url)
                await page.wait_for_load_state("networkidle")
                
                # Wait for badges to load
                await page.wait_for_timeout(2000)
                
                # Find all badge images
                badge_images = await page.query_selector_all('img[src*="badge"], img[src*="proof"], img[src*="card"], img[alt*="Verified"], img[alt*="Truwit"]')
                
                for img in badge_images:
                    src = await img.get_attribute('src')
                    alt = await img.get_attribute('alt')
                    if src and ('badge' in src.lower() or 'proof' in src.lower() or 'card' in src.lower()):
                        badge_urls_found.append(src)
                        self.badge_urls_seen.add(src)
                        
                        # Check if badge is circular/square format
                        is_circular = await self.check_badge_format(page, img)
                        if is_circular:
                            consistency_score += 1.0
                        else:
                            print(f"   WARNING: Non-circular badge found: {src}")
                
                # Check for loading spinners that shouldn't be there
                loading_spinners = await page.query_selector_all('.loading-spinner, .badge-loading, [class*="loading"]')
                if loading_spinners:
                    print(f"   WARNING: Loading spinners found on {test_name}")
                    consistency_score -= 0.5
            
            # Calculate final consistency score
            total_badges = len(badge_urls_found)
            if total_badges > 0:
                consistency_score = consistency_score / total_badges
            else:
                consistency_score = 0.0
            
            self.results.append(BadgeTestResult(
                test_name="Badge Creation and Consistency",
                passed=consistency_score >= 0.8 and len(self.console_errors) == 0,
                error_message=f"Consistency score: {consistency_score:.2f}, Console errors: {len(self.console_errors)}",
                badge_urls_found=badge_urls_found,
                badge_consistency_score=consistency_score,
                details={
                    "proof_id": proof_id,
                    "total_badges_found": total_badges,
                    "console_errors": self.console_errors,
                    "console_messages": console_messages
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Badge Creation and Consistency",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_verification_routes_badge_consistency(self, browser: Browser):
        """Test badge consistency across all verification routes"""
        print("\n[BADGE TEST] Testing Verification Routes Badge Consistency...")
        start_time = time.time()
        
        page = await browser.new_page()
        
        try:
            # Test different verification routes
            routes_to_test = [
                ("Home Page", f"{self.base_url}/app/#/"),
                ("Verify Page", f"{self.base_url}/app/#/verify"),
                ("About Page", f"{self.base_url}/app/#/about"),
            ]
            
            badge_urls_found = []
            route_consistency_scores = []
            
            for route_name, route_url in routes_to_test:
                print(f"   Testing route: {route_name}")
                
                await page.goto(route_url)
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(1000)
                
                # Find all badge images
                badge_images = await page.query_selector_all('img[src*="badge"], img[src*="proof"], img[src*="card"], img[alt*="Verified"], img[alt*="Truwit"]')
                
                route_badges = []
                route_score = 0.0
                
                for img in badge_images:
                    src = await img.get_attribute('src')
                    if src and ('badge' in src.lower() or 'proof' in src.lower() or 'card' in src.lower()):
                        route_badges.append(src)
                        badge_urls_found.append(src)
                        
                        # Check badge format consistency
                        is_circular = await self.check_badge_format(page, img)
                        if is_circular:
                            route_score += 1.0
                
                if route_badges:
                    route_score = route_score / len(route_badges)
                else:
                    route_score = 1.0  # No badges is also consistent
                
                route_consistency_scores.append(route_score)
                print(f"   Route {route_name} consistency: {route_score:.2f}")
            
            overall_consistency = sum(route_consistency_scores) / len(route_consistency_scores) if route_consistency_scores else 0.0
            
            self.results.append(BadgeTestResult(
                test_name="Verification Routes Badge Consistency",
                passed=overall_consistency >= 0.8,
                error_message=f"Overall route consistency: {overall_consistency:.2f}",
                badge_urls_found=badge_urls_found,
                badge_consistency_score=overall_consistency,
                details={
                    "route_scores": dict(zip([r[0] for r in routes_to_test], route_consistency_scores)),
                    "total_routes_tested": len(routes_to_test)
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Verification Routes Badge Consistency",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_badge_loading_states(self, browser: Browser):
        """Test badge loading states and error handling"""
        print("\n[BADGE TEST] Testing Badge Loading States...")
        start_time = time.time()
        
        page = await browser.new_page()
        console_messages = []
        
        def on_console(msg: ConsoleMessage):
            console_messages.append({"type": msg.type, "text": msg.text})
            if msg.type == "error":
                self.console_errors.append(msg.text)
        
        page.on("console", on_console)
        
        try:
            # Navigate to verification page
            await page.goto(f"{self.base_url}/app/#/verify")
            await page.wait_for_load_state("networkidle")
            
            # Check for loading states
            loading_elements = await page.query_selector_all('.loading-spinner, .badge-loading, [class*="loading"]')
            
            # Check for error states
            error_elements = await page.query_selector_all('.error, .badge-error, [class*="error"]')
            
            # Check console for badge-related errors
            badge_errors = [msg for msg in console_messages if 'badge' in msg['text'].lower() or 'proof' in msg['text'].lower()]
            
            loading_state_score = 1.0
            if loading_elements:
                loading_state_score -= 0.3
            if error_elements:
                loading_state_score -= 0.3
            if badge_errors:
                loading_state_score -= 0.4
            
            self.results.append(BadgeTestResult(
                test_name="Badge Loading States",
                passed=loading_state_score >= 0.7,
                error_message=f"Loading state score: {loading_state_score:.2f}",
                badge_consistency_score=loading_state_score,
                details={
                    "loading_elements_found": len(loading_elements),
                    "error_elements_found": len(error_elements),
                    "badge_console_errors": len(badge_errors),
                    "console_messages": console_messages
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Badge Loading States",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_badge_api_endpoints(self, browser: Browser):
        """Test badge API endpoints directly"""
        print("\n[BADGE TEST] Testing Badge API Endpoints...")
        start_time = time.time()
        
        page = await browser.new_page()
        
        try:
            # Test different badge API endpoints
            endpoints_to_test = [
                f"{self.api_url}/cards/proof/TW-TEST-800.png",
                f"{self.api_url}/v1/badge/TW-TEST.svg",
                f"{self.api_url}/assets/proof/TW-TEST-800.png",
            ]
            
            endpoint_results = []
            
            for endpoint in endpoints_to_test:
                print(f"   Testing endpoint: {endpoint}")
                
                try:
                    response = await page.request.get(endpoint)
                    status = response.status
                    
                    if status == 200:
                        endpoint_results.append({"endpoint": endpoint, "status": status, "success": True})
                    elif status == 404:
                        endpoint_results.append({"endpoint": endpoint, "status": status, "success": False, "reason": "Not found"})
                    else:
                        endpoint_results.append({"endpoint": endpoint, "status": status, "success": False, "reason": f"Unexpected status"})
                        
                except Exception as e:
                    endpoint_results.append({"endpoint": endpoint, "status": "error", "success": False, "reason": str(e)})
            
            # Calculate API consistency score
            successful_endpoints = sum(1 for result in endpoint_results if result["success"])
            api_consistency_score = successful_endpoints / len(endpoint_results) if endpoint_results else 0.0
            
            self.results.append(BadgeTestResult(
                test_name="Badge API Endpoints",
                passed=api_consistency_score >= 0.5,  # At least half should work
                error_message=f"API consistency score: {api_consistency_score:.2f}",
                badge_consistency_score=api_consistency_score,
                details={
                    "endpoint_results": endpoint_results,
                    "successful_endpoints": successful_endpoints,
                    "total_endpoints": len(endpoint_results)
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Badge API Endpoints",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_badge_fallback_mechanisms(self, browser: Browser):
        """Test badge fallback mechanisms"""
        print("\n[BADGE TEST] Testing Badge Fallback Mechanisms...")
        start_time = time.time()
        
        page = await browser.new_page()
        
        try:
            # Navigate to a page with badges
            await page.goto(f"{self.base_url}/app/#/verify")
            await page.wait_for_load_state("networkidle")
            
            # Simulate network failure for badge images
            await page.route("**/*badge*", lambda route: route.abort())
            await page.route("**/*proof*", lambda route: route.abort())
            await page.route("**/*card*", lambda route: route.abort())
            
            # Reload page to trigger fallbacks
            await page.reload()
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(2000)
            
            # Check for fallback badges
            fallback_images = await page.query_selector_all('img[src*="signed_badge"], img[src*="verified-circular-badge"]')
            
            fallback_score = 1.0 if fallback_images else 0.0
            
            self.results.append(BadgeTestResult(
                test_name="Badge Fallback Mechanisms",
                passed=fallback_score >= 0.5,
                error_message=f"Fallback score: {fallback_score:.2f}",
                badge_consistency_score=fallback_score,
                details={
                    "fallback_images_found": len(fallback_images),
                    "fallback_srcs": [await img.get_attribute('src') for img in fallback_images]
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Badge Fallback Mechanisms",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_badge_sharing_consistency(self, browser: Browser):
        """Test badge sharing and embed functionality"""
        print("\n[BADGE TEST] Testing Badge Sharing Consistency...")
        start_time = time.time()
        
        page = await browser.new_page()
        
        try:
            # Navigate to verification page
            await page.goto(f"{self.base_url}/app/#/verify")
            await page.wait_for_load_state("networkidle")
            
            # Look for sharing buttons
            share_buttons = await page.query_selector_all('button[class*="share"], button[class*="embed"], button[class*="copy"]')
            
            sharing_score = 0.0
            sharing_details = []
            
            for button in share_buttons:
                button_text = await button.text_content()
                if button_text and ('share' in button_text.lower() or 'embed' in button_text.lower() or 'copy' in button_text.lower()):
                    sharing_score += 0.5
                    sharing_details.append(button_text.strip())
            
            # Check for embed code generation
            embed_code_elements = await page.query_selector_all('code, pre, textarea')
            embed_score = 0.0
            
            for element in embed_code_elements:
                content = await element.text_content()
                if content and ('<img' in content and 'badge' in content.lower()):
                    embed_score += 1.0
                    break
            
            overall_sharing_score = (sharing_score + embed_score) / 2.0
            
            self.results.append(BadgeTestResult(
                test_name="Badge Sharing Consistency",
                passed=overall_sharing_score >= 0.5,
                error_message=f"Sharing score: {overall_sharing_score:.2f}",
                badge_consistency_score=overall_sharing_score,
                details={
                    "share_buttons_found": len(share_buttons),
                    "sharing_details": sharing_details,
                    "embed_code_found": embed_score > 0
                },
                duration_ms=int((time.time() - start_time) * 1000)
            ))
            
        except Exception as e:
            self.results.append(BadgeTestResult(
                test_name="Badge Sharing Consistency",
                passed=False,
                error_message=str(e),
                duration_ms=int((time.time() - start_time) * 1000)
            ))
        finally:
            await page.close()
    
    async def test_cross_browser_badge_consistency(self, playwright: Playwright):
        """Test badge consistency across different browsers"""
        print("\n[BADGE TEST] Testing Cross-Browser Badge Consistency...")
        start_time = time.time()
        
        browsers_to_test = [
            ("Chromium", playwright.chromium),
            ("Firefox", playwright.firefox),
            ("WebKit", playwright.webkit)
        ]
        
        browser_results = []
        
        for browser_name, browser_type in browsers_to_test:
            print(f"   Testing {browser_name}...")
            
            try:
                browser = await browser_type.launch(headless=True)
                page = await browser.new_page()
                
                await page.goto(f"{self.base_url}/app/#/verify")
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(2000)
                
                # Find badge images
                badge_images = await page.query_selector_all('img[src*="badge"], img[src*="proof"], img[src*="card"]')
                
                browser_badges = []
                for img in badge_images:
                    src = await img.get_attribute('src')
                    if src:
                        browser_badges.append(src)
                
                browser_results.append({
                    "browser": browser_name,
                    "badges_found": len(browser_badges),
                    "badge_urls": browser_badges
                })
                
                await browser.close()
                
            except Exception as e:
                browser_results.append({
                    "browser": browser_name,
                    "error": str(e)
                })
        
        # Calculate cross-browser consistency
        if len(browser_results) > 1:
            badge_counts = [r.get("badges_found", 0) for r in browser_results if "badges_found" in r]
            if badge_counts:
                consistency_variance = max(badge_counts) - min(badge_counts)
                cross_browser_score = 1.0 - (consistency_variance / max(badge_counts)) if max(badge_counts) > 0 else 0.0
            else:
                cross_browser_score = 0.0
        else:
            cross_browser_score = 1.0
        
        self.results.append(BadgeTestResult(
            test_name="Cross-Browser Badge Consistency",
            passed=cross_browser_score >= 0.8,
            error_message=f"Cross-browser consistency score: {cross_browser_score:.2f}",
            badge_consistency_score=cross_browser_score,
            details={
                "browser_results": browser_results,
                "total_browsers_tested": len(browsers_to_test)
            },
            duration_ms=int((time.time() - start_time) * 1000)
        ))
    
    async def check_badge_format(self, page: Page, img_element) -> bool:
        """Check if badge image is in circular/square format"""
        try:
            # Get image dimensions
            bounding_box = await img_element.bounding_box()
            if bounding_box:
                width = bounding_box['width']
                height = bounding_box['height']
                
                # Check if image is roughly square (circular badges are typically square)
                aspect_ratio = width / height if height > 0 else 1.0
                is_square = 0.8 <= aspect_ratio <= 1.2
                
                # Check CSS classes for circular indicators
                class_name = await img_element.get_attribute('class') or ''
                has_circular_class = 'circular' in class_name.lower() or 'round' in class_name.lower()
                
                # Check src URL for circular indicators
                src = await img_element.get_attribute('src') or ''
                has_circular_url = 'circular' in src.lower() or 'card' in src.lower()
                
                return is_square or has_circular_class or has_circular_url
                
        except Exception:
            pass
        
        return False
    
    def generate_badge_report(self) -> Dict:
        """Generate comprehensive badge consistency report"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.passed)
        overall_consistency = sum(r.badge_consistency_score for r in self.results) / total_tests if total_tests > 0 else 0.0
        
        # Collect all unique badge URLs
        all_badge_urls = set()
        for result in self.results:
            all_badge_urls.update(result.badge_urls_found)
        
        report = {
            "test_summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "overall_consistency_score": overall_consistency,
                "badge_consistency_status": "ROCK SOLID" if overall_consistency >= 0.9 else "NEEDS IMPROVEMENT" if overall_consistency >= 0.7 else "CRITICAL ISSUES"
            },
            "badge_analysis": {
                "unique_badge_urls_found": len(all_badge_urls),
                "badge_urls": list(all_badge_urls),
                "console_errors": self.console_errors
            },
            "test_results": [result.to_dict() for result in self.results],
            "recommendations": self.generate_recommendations()
        }
        
        return report
    
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        overall_consistency = sum(r.badge_consistency_score for r in self.results) / len(self.results) if self.results else 0.0
        
        if overall_consistency < 0.9:
            recommendations.append("CRITICAL: Badge consistency below 90% - implement unified badge service")
        
        if self.console_errors:
            recommendations.append(f"Fix {len(self.console_errors)} console errors related to badge loading")
        
        failed_tests = [r for r in self.results if not r.passed]
        if failed_tests:
            recommendations.append(f"Address {len(failed_tests)} failed badge consistency tests")
        
        # Check for specific issues
        for result in self.results:
            if result.badge_consistency_score < 0.8:
                recommendations.append(f"Improve {result.test_name} - current score: {result.badge_consistency_score:.2f}")
        
        if not recommendations:
            recommendations.append("EXCELLENT: Badge consistency is rock solid!")
        
        return recommendations


async def main():
    """Main function to run badge consistency tests"""
    tester = BadgeConsistencyTester()
    report = await tester.run_badge_consistency_tests()
    
    # Print summary
    print("\n" + "=" * 80)
    print("BADGE CONSISTENCY TEST SUMMARY")
    print("=" * 80)
    
    summary = report["test_summary"]
    print(f"Total Tests: {summary['total_tests']}")
    print(f"Passed: {summary['passed_tests']}")
    print(f"Failed: {summary['failed_tests']}")
    print(f"Overall Consistency Score: {summary['overall_consistency_score']:.2f}")
    print(f"Status: {summary['badge_consistency_status']}")
    
    print(f"\nUnique Badge URLs Found: {report['badge_analysis']['unique_badge_urls_found']}")
    
    if report['badge_analysis']['console_errors']:
        print(f"\nConsole Errors: {len(report['badge_analysis']['console_errors'])}")
        for error in report['badge_analysis']['console_errors'][:5]:  # Show first 5
            print(f"  - {error}")
    
    print("\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  - {rec}")
    
    # Save detailed report
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    report_file = f"test-results/badge-consistency-report-{timestamp}.json"
    os.makedirs("test-results", exist_ok=True)
    
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: {report_file}")
    
    # Return exit code based on results
    if summary['overall_consistency_score'] >= 0.9:
        print("\n[SUCCESS] BADGE CONSISTENCY IS ROCK SOLID!")
        return 0
    elif summary['overall_consistency_score'] >= 0.7:
        print("\n[WARNING] Badge consistency needs improvement")
        return 1
    else:
        print("\n[CRITICAL] Badge consistency issues detected")
        return 2


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
