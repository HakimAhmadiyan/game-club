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
        page.on("dialog", lambda dialog: dialog.accept())

        # --- 1. Test Group and Alarm Creation ---
        await page.locator("#add-station-btn").click()
        add_modal = page.locator("#add-station-modal")
        await expect(add_modal).to_have_css("display", "flex")

        await add_modal.locator("#new-group-name-input").fill("VIP")
        await add_modal.locator("#add-new-group-btn").click()
        await expect(add_modal.locator("#station-group-select")).to_have_value("VIP")

        await add_modal.locator("#station-name-input").fill("VIP Station 1")
        await add_modal.locator("#station-alarm-sound").select_option("bell")
        await add_modal.locator("#confirm-add-station-btn").click()

        await expect(page.locator(".station-group h2", has_text="VIP")).to_be_visible()
        vip_station_card = page.locator(".station-card", has_text="VIP Station 1")
        await expect(vip_station_card).to_be_visible()

        # --- 2. Test Fixed-Time Session ---
        await page.locator("#add-station-btn").click()
        await add_modal.locator("#station-name-input").fill("Fixed Time Test")
        await add_modal.locator("#station-end-time-input").fill("23:59")
        await add_modal.locator("#confirm-add-station-btn").click()

        fixed_time_card = page.locator(".station-card", has_text="Fixed Time Test")
        await fixed_time_card.locator(".start-btn").click()
        await expect(fixed_time_card.locator(".progress-bar-container")).to_be_visible()

        # --- 3. Test Multi-Product & UI ---
        await page.locator("#product-name-input").fill("قهوه")
        await page.locator("#product-price-input").fill("25000")
        await page.locator("#add-product-btn").click()

        await fixed_time_card.locator(".add-product-to-station-btn").click()
        products_modal = page.locator("#add-products-modal")
        await expect(products_modal).to_have_css("display", "flex")
        await products_modal.locator(".product-selection-item", has_text="قهوه").locator('input[type="checkbox"]').check()
        await products_modal.locator("#confirm-add-products-btn").click()
        await expect(fixed_time_card.locator(".purchased-products-list li")).to_have_count(1)

        # --- 4. Test CSV Export ---
        await fixed_time_card.locator(".invoice-btn").click()
        await expect(page.locator("#invoice-modal")).to_have_css("display", "flex")
        await page.locator("#pay-transfer-btn").click()

        await page.locator("#report-btn").click()
        await expect(page.locator("#report-modal")).to_have_css("display", "flex")
        await page.locator("#export-csv-btn").click() # Just ensure it doesn't crash

        # --- 5. Final Screenshot ---
        await page.locator("#report-modal .close-btn").click()
        screenshot_path = "jules-scratch/verification/final_app_v5.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
