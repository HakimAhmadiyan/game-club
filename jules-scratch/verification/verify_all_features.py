import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        await page.evaluate('localStorage.clear()')
        await page.reload()

        # --- Test Settings ---
        await page.locator("#settings-btn").click()
        settings_modal = page.locator("#settings-modal")
        await expect(settings_modal).to_be_visible()
        await settings_modal.locator("#default-rate-input").fill("55555")
        await settings_modal.locator("#save-settings-btn").click()
        await expect(settings_modal).not_to_be_visible()

        await page.locator("#add-station-btn").click()
        await expect(page.locator("#station-rate-input")).to_have_value("55555")
        await page.locator("#add-station-modal .close-btn").click()

        # --- Test Bug Fix & History Deletion ---
        page.on("dialog", lambda dialog: dialog.accept()) # Accept all confirm dialogs

        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Bug Test Station")
        await page.locator("#confirm-add-station-btn").click()

        station_card = page.locator(".station-card", has_text="Bug Test Station")
        await station_card.locator(".invoice-btn").click()
        await expect(page.locator("#invoice-modal")).to_be_visible()
        await page.locator("#pay-cash-btn").click()

        await page.locator("#report-btn").click()
        report_modal = page.locator("#report-modal")
        await expect(report_modal.locator("#stats-total-transactions")).to_have_text("۱")

        await report_modal.locator(".close-btn").click()
        await page.locator("#settings-btn").click()
        await settings_modal.locator("#delete-all-history-btn").click()
        await expect(settings_modal).not_to_be_visible() # Deleting history closes settings

        await page.locator("#report-btn").click()
        await expect(report_modal.locator("#stats-total-transactions")).to_have_text("۰")
        await report_modal.locator(".close-btn").click()

        # --- Test Reset Button ---
        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Reset Test Station")
        await page.locator("#confirm-add-station-btn").click()
        reset_card = page.locator(".station-card", has_text="Reset Test Station")
        await reset_card.locator(".start-btn").click()
        await page.wait_for_timeout(1000)
        await reset_card.locator(".reset-btn").click()
        await expect(reset_card.locator(".time-display")).to_have_text("00:00:00")

        # --- Final Screenshot ---
        screenshot_path = "jules-scratch/verification/final_app.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
