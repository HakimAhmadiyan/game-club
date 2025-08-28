import re
from playwright.sync_api import sync_playwright, Page, expect
import os

def run_test(page: Page):
    # Get the absolute path to the HTML file
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app_root = os.path.dirname(os.path.dirname(base_dir))
    index_path = os.path.join(app_root, 'index.html')

    # 1. Go to the app's local file and prepare for a clean run
    page.goto(f"file://{index_path}")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_timeout(500)

    # 2. Create a station
    page.get_by_role("button", name="افزودن سیستم").click()
    add_modal = page.locator("#add-station-modal")
    add_modal.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("Test Edit")
    add_modal.get_by_role("button", name="تایید").click()

    # 3. Edit the station's elapsed time
    station_card = page.locator(".station-card", has_text="Test Edit")
    station_card.get_by_title("ویرایش").click()

    edit_view = page.locator(".station-edit-view")
    expect(edit_view).to_be_visible()

    # Change only the elapsed time
    edit_view.locator(".edit-station-elapsed-time").fill("01:23:45")
    edit_view.get_by_title("ذخیره").click()

    # 4. Assert the edit view is gone
    expect(edit_view).not_to_be_visible()

    # 5. Verify the time was saved correctly
    saved_card = page.locator(".station-card", has_text="Test Edit")
    expect(saved_card.locator(".time-display")).to_have_text("01:23:45")

    # 6. Take a screenshot
    page.screenshot(path="jules-scratch/verification/final_app_state.png")

    print("Minimal edit test completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()

if __name__ == "__main__":
    main()
