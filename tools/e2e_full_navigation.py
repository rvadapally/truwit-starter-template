import asyncio
import json
import os
from collections import deque
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Set, Tuple
from urllib.parse import urljoin, urlparse

from playwright.async_api import Browser, ConsoleMessage, Page, Playwright, async_playwright


BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:4321")
ROUTE_HINTS = [
    "/",
    "/verify",
    "/generate",
    "/how-it-works",
    "/use-cases",
    "/technology",
    "/pricing",
    "/investors",
    "/contact",
    "/about",
]

SPINNER_SELECTOR_CANDIDATES = [
    '[data-loading]:not([data-loading="false"]):not([data-loading="0"])',
    '[aria-busy="true"]',
    '[class*="spinner"]',
    '[class*="loader"]',
    '[class*="loading"]',
]


@dataclass
class PageVisit:
    url: str
    status: int
    console: List[Dict[str, str]] = field(default_factory=list)
    network_failures: List[Dict[str, str]] = field(default_factory=list)
    pending_ui_states: List[Dict[str, str]] = field(default_factory=list)
    links: Set[str] = field(default_factory=set)
    failed: bool = False

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)


def normalise_path(target_url: str, base: str) -> Tuple[str, str]:
    absolute = urljoin(base, target_url)
    parsed = urlparse(absolute)
    base_parsed = urlparse(base)
    if parsed.scheme not in {"http", "https"}:
        return "", absolute
    if parsed.netloc and parsed.netloc not in {base_parsed.netloc, "localhost:4321", "127.0.0.1:4321"}:
        return "", absolute
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    return path, absolute


async def collect_visible_pending_states(page: Page) -> List[Dict[str, str]]:
    return await page.evaluate(
        """
        (selectors) => {
            const isVisible = (el) => {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                if (!style || style.visibility === 'hidden' || style.display === 'none') {
                    return false;
                }
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            };
            const results = [];
            for (const selector of selectors) {
                const matches = Array.from(document.querySelectorAll(selector));
                for (const el of matches) {
                    if (!isVisible(el)) continue;
                    results.push({
                        selector,
                        text: (el.textContent || '').trim().slice(0, 120),
                        tagName: el.tagName,
                        className: el.className || '',
                    });
                }
            }
            return results;
        }
        """,
        SPINNER_SELECTOR_CANDIDATES,
    )


async def extract_internal_links(page: Page, base: str) -> Set[str]:
    hrefs: List[str] = await page.eval_on_selector_all(
        "a[href]",
        "els => els.map(el => el.getAttribute('href'))",
    )
    discovered: Set[str] = set()
    for href in hrefs:
        if not href:
            continue
        path, absolute = normalise_path(href, base)
        if not path:
            continue
        if path.startswith("mailto:") or path.startswith("tel:"):
            continue
        # Normalise trailing slash
        if len(path) > 1 and path.endswith("/"):
            path = path[:-1]
        discovered.add(path)
    return discovered


async def visit_route(playwright: Playwright, browser: Browser, path: str) -> PageVisit:
    base = BASE_URL.rstrip("/")
    url = base + path if path != "/" else base + "/"
    context = await browser.new_context()
    page = await context.new_page()

    console_messages: List[Dict[str, str]] = []
    network_failures: List[Dict[str, str]] = []
    failed = False

    def on_console(msg: ConsoleMessage) -> None:
        nonlocal failed
        console_messages.append({"type": msg.type, "text": msg.text})
        if msg.type == "error":
            failed = True

    page.on("console", on_console)

    def on_request_failed(request) -> None:
        nonlocal failed
        failure_reason = request.failure
        if isinstance(failure_reason, dict):
            failure_text = failure_reason.get("errorText") or str(failure_reason)
        else:
            failure_text = str(failure_reason) if failure_reason else "unknown"
        network_failures.append({
            "url": request.url,
            "method": request.method,
            "type": "requestfailed",
            "failure": failure_text,
        })
        failed = True

    page.on("requestfailed", on_request_failed)

    base_host = urlparse(base).netloc

    def on_response(response) -> None:
        nonlocal failed
        status = response.status
        if status >= 400:
            parsed = urlparse(response.url)
            if not parsed.netloc or parsed.netloc in {base_host, "localhost:4321", "127.0.0.1:4321"}:
                network_failures.append({
                    "url": response.url,
                    "status": str(status),
                    "type": "response",
                })
                failed = True

    page.on("response", on_response)

    main_response = await page.goto(url, wait_until="load")
    await page.wait_for_function("document.readyState === 'complete'")
    await page.wait_for_timeout(1000)

    status = main_response.status if main_response else 0
    pending_ui_states = await collect_visible_pending_states(page)
    if pending_ui_states:
        failed = True

    links = await extract_internal_links(page, url)

    await context.close()

    visit = PageVisit(
        url=url,
        status=status,
        console=console_messages,
        network_failures=network_failures,
        pending_ui_states=pending_ui_states,
        links=links,
        failed=failed,
    )
    return visit


async def run() -> int:
    base = BASE_URL.rstrip("/")
    initial_routes: Set[str] = set()
    for hint in ROUTE_HINTS:
        path, _ = normalise_path(hint, base)
        if path:
            if len(path) > 1 and path.endswith("/"):
                path = path[:-1]
            initial_routes.add(path)
    if "/" not in initial_routes:
        initial_routes.add("/")

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        queue: deque[str] = deque(sorted(initial_routes))
        visited: Set[str] = set()
        results: Dict[str, PageVisit] = {}
        failure_detected = False

        while queue:
            path = queue.popleft()
            if path in visited:
                continue
            visited.add(path)
            visit = await visit_route(playwright, browser, path)
            results[path] = visit
            if visit.failed:
                failure_detected = True
            for link in visit.links:
                if link not in visited and link not in queue:
                    queue.append(link)

        await browser.close()

    report = {
        "baseUrl": base,
        "visited": [
            {
                "path": path,
                "url": results[path].url,
                "status": results[path].status,
                "console": results[path].console,
                "networkFailures": results[path].network_failures,
                "pendingUIStates": results[path].pending_ui_states,
            }
            for path in sorted(results.keys())
        ],
        "failureDetected": failure_detected,
    }
    print(json.dumps(report, indent=2))
    return 1 if failure_detected else 0


if __name__ == "__main__":
    exit(asyncio.run(run()))
