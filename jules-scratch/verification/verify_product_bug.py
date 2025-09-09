import re
from playwright.sync_api import sync_playwright, Page, expect
import os
import json

def run_test(page: Page):
    # Listen for any console messages and print them
    def handle_console(msg):
        print(f"BROWSER LOG: {msg.text}")
    page.on("console", handle_console)

    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app_root = os.path.dirname(os.path.dirname(base_dir))
    index_path = os.path.join(app_root, 'index.html')

    # 1. Go to the app's local file and prepare for a clean run
    page.goto(f"file://{index_path}")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_timeout(1000) # Wait for DB init

    # 2. Add a product
    page.get_by_placeholder("نام محصول").fill("نوشابه")
    page.get_by_placeholder("قیمت فروش (تومان)").fill("5000")
    page.get_by_role("button", name="افزودن محصول").click()

    # 3. Add a station
    page.get_by_role("button", name="افزودن سیستم").click()
    add_modal = page.locator("#add-station-modal")
    add_modal.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("PC-01")
    add_modal.get_by_role("button", name="تایید").click()

    # 4. Add the product to the station
    station_card = page.locator(".station-card", has_text="PC-01")
    station_card.get_by_title("افزودن محصول").click()

    add_product_modal = page.locator("#add-products-modal")
    add_product_modal.get_by_label("نوشابه - ۵٬۰۰۰ تومان").check()
    add_product_modal.get_by_role("button", name="تایید و افزودن").click()

    # 5. Wait and check the state
    page.wait_for_timeout(500)
    station_state = page.evaluate("() => window.stations[0]")
    print("--- FINAL STATION STATE ---")
    print(json.dumps(station_state, indent=2, ensure_ascii=False))


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()

if __name__ == "__main__":
    main()
