#!/usr/bin/env python3
"""
One-time Screenshot Job for TruWit Application
Captures screenshots of all main pages for documentation/verification purposes
"""

import asyncio
import os
import time
from datetime import datetime
from playwright.async_api import async_playwright

class ScreenshotCapture:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get("E2E_BASE_URL", "https://truwit.ai")
        self.screenshots_dir = f"screenshots-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
    async def capture_all_pages(self):
        """Capture screenshots of all main pages"""
        print(f"[SCREENSHOT] Starting screenshot capture of all pages")
        print(f"   Base URL: {self.base_url}")
        print(f"   Screenshots will be saved to: {self.screenshots_dir}")
        print("=" * 80)
        
        # Create screenshots directory
        os.makedirs(self.screenshots_dir, exist_ok=True)
        
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)  # Visible for better screenshots
            page = await browser.new_page()
            
            # Set viewport for consistent screenshots
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            try:
                # List of pages to capture
                pages_to_capture = [
                    {
                        "name": "home",
                        "url": f"{self.base_url}/",
                        "description": "Home Page"
                    },
                    {
                        "name": "about", 
                        "url": f"{self.base_url}/about",
                        "description": "About Page"
                    },
                    {
                        "name": "verify",
                        "url": f"{self.base_url}/app/#/verify",
                        "description": "Verification Form Page"
                    },
                    {
                        "name": "verify-direct",
                        "url": f"{self.base_url}/app/#/t/TW-E6F13C97",
                        "description": "Direct Verification Page (TW-E6F13C97)"
                    },
                    {
                        "name": "verify-direct-alt",
                        "url": f"{self.base_url}/app/#/t/TW-967F2CA5", 
                        "description": "Direct Verification Page (TW-967F2CA5)"
                    }
                ]
                
                for page_info in pages_to_capture:
                    await self.capture_page_screenshot(page, page_info)
                
                print(f"\n[SCREENSHOT] SUCCESS All screenshots captured successfully!")
                print(f"   Screenshots saved to: {self.screenshots_dir}/")
                
            finally:
                await browser.close()
    
    async def capture_page_screenshot(self, page, page_info):
        """Capture screenshot of a single page"""
        print(f"\n[SCREENSHOT] Capturing: {page_info['description']}")
        print(f"   URL: {page_info['url']}")
        
        try:
            # Navigate to page
            await page.goto(page_info['url'], wait_until="networkidle", timeout=30000)
            
            # Wait a bit for any dynamic content to load
            await page.wait_for_timeout(2000)
            
            # Take full page screenshot
            screenshot_path = f"{self.screenshots_dir}/{page_info['name']}-full.png"
            await page.screenshot(
                path=screenshot_path,
                full_page=True,
                type='png'
            )
            
            # Take viewport screenshot (what's visible on screen)
            viewport_path = f"{self.screenshots_dir}/{page_info['name']}-viewport.png"
            await page.screenshot(
                path=viewport_path,
                full_page=False,
                type='png'
            )
            
            print(f"   SUCCESS Screenshots saved:")
            print(f"      - {screenshot_path}")
            print(f"      - {viewport_path}")
            
        except Exception as e:
            print(f"   FAILED to capture {page_info['description']}: {str(e)}")
    
    async def capture_badge_details(self, page):
        """Capture detailed screenshots of badge elements"""
        print(f"\n[SCREENSHOT] Capturing badge details...")
        
        try:
            # Navigate to verification page
            await page.goto(f"{self.base_url}/app/#/t/TW-E6F13C97", wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # Capture badge preview section
            badge_preview = page.locator('.badge-preview')
            if await badge_preview.count() > 0:
                await badge_preview.screenshot(path=f"{self.screenshots_dir}/badge-preview.png")
                print(f"   SUCCESS Badge preview captured")
            
            # Capture embed code section
            embed_section = page.locator('.embed-snippet')
            if await embed_section.count() > 0:
                await embed_section.screenshot(path=f"{self.screenshots_dir}/embed-code-section.png")
                print(f"   SUCCESS Embed code section captured")
            
            # Capture verification details
            verification_details = page.locator('.detail-card')
            if await verification_details.count() > 0:
                await verification_details.screenshot(path=f"{self.screenshots_dir}/verification-details.png")
                print(f"   SUCCESS Verification details captured")
                
        except Exception as e:
            print(f"   FAILED to capture badge details: {str(e)}")

async def main():
    """Main function to run screenshot capture"""
    capturer = ScreenshotCapture()
    await capturer.capture_all_pages()
    
    # Also capture detailed badge elements
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        try:
            await capturer.capture_badge_details(page)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
