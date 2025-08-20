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

        # --- 1. Test Bug Fix ---
        page.on("dialog", lambda dialog: dialog.accept()) # Accept all confirms
        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Bug Test")
        await page.locator("#confirm-add-station-btn").click()
        station_card = page.locator(".station-card", has_text="Bug Test")
        await station_card.locator(".invoice-btn").click()
        await page.wait_for_timeout(100) # Small delay to ensure modal is rendered
        await expect(page.locator("#invoice-modal")).to_be_visible()
        await page.locator("#pay-cash-btn").click()
        await page.locator("#report-btn").click()
        report_modal = page.locator("#report-modal")
        await expect(report_modal.locator("#stats-total-transactions")).to_have_text("۱")
        await report_modal.locator(".close-btn").click()

        # --- 2. Test UI & Features ---
        # Test single play/pause button
        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Toggle Test")
        await page.locator("#confirm-add-station-btn").click()
        toggle_card = page.locator(".station-card", has_text="Toggle Test")
        await expect(toggle_card.locator(".start-btn")).to_be_visible()
        await toggle_card.locator(".start-btn").click()
        await expect(toggle_card.locator(".stop-btn")).to_be_visible()
        await toggle_card.locator(".stop-btn").click()
        await expect(toggle_card.locator(".start-btn")).to_be_visible()

        # Test Manual Entry Modal opens
        await page.locator("#manual-entry-btn").click()
        await expect(page.locator("#manual-entry-modal")).to_be_visible()
        await page.locator("#manual-entry-modal .close-btn").click()

        # Test Settings and new Theme
        await page.locator("#settings-btn").click()
        settings_modal = page.locator("#settings-modal")
        await expect(settings_modal).to_be_visible()
        await settings_modal.locator("#theme-select").select_option("ultra-dark")
        await settings_modal.locator(".color-swatch[data-color='purple']").click()
        await settings_modal.locator("#save-settings-btn").click()

        await expect(page.locator("body")).to_have_attribute("data-theme", "ultra-dark")
        await expect(page.locator("body")).to_have_attribute("data-accent", "purple")

        # --- 3. Take Final Screenshot ---
        # Add one more station for a good screenshot
        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Final Station")
        await page.locator("#confirm-add-station-btn").click()

        screenshot_path = "jules-scratch/verification/final_app_v3.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
