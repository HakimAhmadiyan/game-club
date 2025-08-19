import asyncio
from playwright.async_api import async_playwright, expect
import os
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        await page.evaluate('localStorage.clear()')
        await page.reload()

        # --- 1. Test Bug Fix and Reporting ---
        await page.get_by_role("button", name="افزودن سیستم جدید").click()
        await page.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("Test Station 1")
        await page.get_by_placeholder("نرخ هر ساعت (تومان)").fill("10000")
        await page.get_by_role("button", name="تایید").click()

        station1_card = page.locator(".station-card", has_text="Test Station 1")
        await station1_card.locator(".start-btn").click()
        await page.wait_for_timeout(1000)

        await station1_card.locator(".invoice-btn").click()
        await expect(page.locator("#invoice-modal")).to_be_visible()
        await page.locator("#pay-cash-btn").click()

        # Open report and verify transaction count is 1
        await page.get_by_role("button", name="گزارشات").click()
        await expect(page.locator("#stats-total-transactions")).to_have_text("۱")

        # --- 2. Test UI Changes (Toggle Button and Progress Bar) ---
        # Add a regular station and start it
        await page.get_by_role("button", name="افزودن سیستم جدید").click()
        await page.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("Test Station 2")
        await page.get_by_placeholder("نرخ هر ساعت (تومان)").fill("20000")
        await page.get_by_role("button", name="تایید").click()
        station2_card = page.locator(".station-card", has_text="Test Station 2")
        await station2_card.locator(".start-btn").click() # Should now be a stop button
        await expect(station2_card.locator(".stop-btn")).to_be_visible()

        # Add a countdown station
        await page.get_by_role("button", name="افزودن سیستم جدید").click()
        await page.get_by_placeholder("نام سیستم (مثلا: PC 1)").fill("Countdown Station")
        await page.get_by_placeholder("نرخ هر ساعت (تومان)").fill("30000")
        await page.get_by_placeholder("مدت زمان (دقیقه) - اختیاری").fill("2")
        await page.get_by_role("button", name="تایید").click()
        countdown_card = page.locator(".station-card", has_text="Countdown Station")

        # Verify progress bar exists
        await expect(countdown_card.locator(".progress-bar-container")).to_be_visible()
        await countdown_card.locator(".start-btn").click()
        await page.wait_for_timeout(1000)

        # --- 3. Screenshot ---
        # Close the report modal to see everything
        await page.locator("#report-modal .close-btn").click()
        screenshot_path = "jules-scratch/verification/final_ui_state.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
