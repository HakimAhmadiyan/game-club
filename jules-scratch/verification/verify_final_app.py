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

        # --- 1. Test Multi-Product Selection & Search ---
        await page.locator("#product-name-input").fill("نوشابه")
        await page.locator("#product-price-input").fill("15000")
        await page.locator("#add-product-btn").click()
        await page.locator("#product-name-input").fill("چیپس")
        await page.locator("#product-price-input").fill("20000")
        await page.locator("#add-product-btn").click()

        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Multi-Product Test")
        await page.locator("#confirm-add-station-btn").click()
        station_card = page.locator(".station-card", has_text="Multi-Product Test")

        await station_card.locator(".add-product-to-station-btn").click()
        products_modal = page.locator("#add-products-modal")
        await page.wait_for_timeout(100) # Add delay
        await expect(products_modal).to_be_visible()

        # Test search in modal
        await products_modal.locator("#product-search-input").fill("نوشابه")
        await expect(products_modal.locator(".product-selection-item", has_text="چیپس")).not_to_be_visible()
        await expect(products_modal.locator(".product-selection-item", has_text="نوشابه")).to_be_visible()
        await products_modal.locator("#product-search-input").fill("") # Clear search

        # Select products
        await products_modal.locator(".product-selection-item", has_text="نوشابه").locator('input[type="checkbox"]').check()
        await products_modal.locator(".product-selection-item", has_text="چیپس").locator('input[type="checkbox"]').check()
        await products_modal.locator(".product-selection-item", has_text="چیپس").locator('input[type="number"]').fill("3")

        await products_modal.locator("#confirm-add-products-btn").click()
        await expect(products_modal).not_to_be_visible()

        # Verify products were added (1 soda + 3 chips = 4 items)
        await expect(station_card.locator(".purchased-products-list li")).to_have_count(4)

        # --- 2. Test Advanced Time Edit ---
        await page.locator("#add-station-btn").click()
        await page.locator("#station-name-input").fill("Time Edit Test")
        await page.locator("#station-duration-input").fill("10") # 10 minutes
        await page.locator("#confirm-add-station-btn").click()

        time_edit_card = page.locator(".station-card", has_text="Time Edit Test")
        await time_edit_card.locator(".start-btn").click()
        await page.wait_for_timeout(2000) # Let it run for 2 seconds

        await time_edit_card.locator(".edit-station-btn").click()
        await time_edit_card.locator(".edit-station-duration").fill("5") # Change total duration to 5 mins
        await time_edit_card.locator(".save-station-btn").click()

        # After ~2s, remaining time should be just under 5 mins, not a fresh 5 mins
        await expect(time_edit_card.locator(".time-display")).to_have_text("00:04:58")

        # --- 3. Test New Payment Method & UI ---
        await time_edit_card.locator(".invoice-btn").click()
        await expect(page.locator("#invoice-modal")).to_be_visible()
        await page.locator("#pay-transfer-btn").click() # Use new payment method

        # Check report
        await page.locator("#report-btn").click()
        await expect(page.locator("#report-modal")).to_be_visible()
        await expect(page.locator("#history-table-body tr").first).to_contain_text("کارت به کارت")

        # Check delete icon in sidebar
        await expect(page.locator(".sidebar .delete-product-btn i")).to_have_class("fas fa-trash-alt")

        # --- 4. Final Screenshot ---
        screenshot_path = "jules-scratch/verification/final_app_v4.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
