import re
from playwright.sync_api import sync_playwright, Page, expect
import os

def run_test(page: Page):
    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app_root = os.path.dirname(os.path.dirname(base_dir))
    index_path = os.path.join(app_root, 'index.html')

    # 1. Go to the app's local file
    page.goto(f"file://{index_path}")

    # ** CRITICAL STEP: Clear localStorage to ensure a clean test run **
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_timeout(500)

    # 2. Add a station to see the styled modal
    page.get_by_role("button", name="افزودن سیستم").click()
    add_modal = page.locator("#add-station-modal")
    expect(add_modal).to_be_visible()

    # Check that the new form styles are applied (at least that it's visible)
    add_modal.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("PC-01")
    add_modal.get_by_placeholder("نرخ هر ساعت (تومان)").fill("30000")

    # Take a screenshot of the styled modal
    page.screenshot(path="jules-scratch/verification/final_styled_modal.png")

    add_modal.get_by_role("button", name="تایید").click()

    # 3. Verify station was added
    station_card = page.locator(".station-card", has_text="PC-01")
    expect(station_card).to_be_visible()

    # 4. Start the timer
    start_button = station_card.get_by_title("شروع")
    start_button.click()
    expect(start_button).not_to_be_visible()

    stop_button = station_card.get_by_title("توقف")
    expect(stop_button).to_be_visible()

    # 5. Take a final screenshot of the main page
    page.screenshot(path="jules-scratch/verification/final_app_state.png")

    print("Simplified verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()

if __name__ == "__main__":
    main()
