import asyncio
import re
import csv
import random
import sys
from urllib.parse import urljoin
from playwright.async_api import async_playwright
import pandas as pd

# Reconfigure standard output to support UTF-8 on Windows terminals
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def clean_text(text):
    if not text:
        return "N/A"
    # Strip Private Use Area unicode characters (Maps icon glyphs)
    cleaned = re.sub(r'[\ue000-\uf8ff]', '', text)
    # Strip common symbol glyphs copied from Maps layout
    cleaned = re.sub(r'[\uE000-\uF8FF\u200b\u200e\u200f]', '', cleaned)
    # Collapse extra whitespace/newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned if cleaned else "N/A"
# List of common User-Agents to prevent anti-bot blocks
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

async def extract_email_from_website(page, website_url):
    """
    Attempts to visit the business's linked website homepage to find contact emails.
    """
    if not website_url or website_url.lower() in ["n/a", "none", ""]:
        return "N/A"
    
    # Clean website URL
    if not website_url.lower().startswith('http'):
        website_url = f"https://{website_url}"
        
    try:
        print(f"   [Enriching] Visiting website: {website_url}")
        await page.goto(website_url, timeout=12000, wait_until="domcontentloaded")
        
        html_content = await page.content()
        emails = EMAIL_REGEX.findall(html_content)
        
        # Filter out common media file extensions
        valid_emails = [
            e for e in set(emails) 
            if not any(e.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])
        ]
        
        if valid_emails:
            return valid_emails[0]
            
        # Try checking common contact paths
        for path in ["contact", "about", "contact-us", "about-us"]:
            try:
                contact_url = urljoin(website_url, path)
                await page.goto(contact_url, timeout=8000, wait_until="domcontentloaded")
                html_content = await page.content()
                emails = EMAIL_REGEX.findall(html_content)
                valid_emails = [
                    e for e in set(emails) 
                    if not any(e.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])
                ]
                if valid_emails:
                    return valid_emails[0]
            except Exception:
                continue
                
        return "N/A"
    except Exception:
        return "N/A"

async def scrape_google_maps(search_query, location_query, max_results=20):
    full_query = f"{search_query} in {location_query}"
    # Direct search URL bypasses typing & search buttons
    search_url = f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}+in+{location_query.replace(' ', '+')}"
    
    print(f"\n==================================================")
    print(f"Starting Maps Extraction: '{full_query}'")
    print(f"Target URL: {search_url}")
    print(f"Target Results Count: {max_results}")
    print(f"==================================================\n")
    
    async with async_playwright() as p:
        # Launch Chromium (run headful so Google Maps doesn't trigger captcha as easily)
        print("[1/5] Launching browser engine...")
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={'width': 1280, 'height': 900}
        )
        
        page = await context.new_page()
        
        # Navigate directly to the Maps search page
        print("[2/5] Connecting to Google Maps search URL...")
        try:
            await page.goto(search_url, wait_until="commit", timeout=40000)
            print("  -> Waiting for listings sidebar to load...")
            await page.wait_for_selector('a[href*="/maps/place/"]', timeout=30000)
        except Exception as e:
            print(f"  -> Navigation notice: {e}")

        # Auto-bypass Cookie Consent screens if present
        print("Checking for Google Consent screen...")
        consent_buttons = [
            "button:has-text('Accept all')", 
            "button:has-text('I agree')", 
            "button:has-text('Agree')",
            "form[action*='consent'] button",
            "#introAgreeButton"
        ]
        for btn_sel in consent_buttons:
            try:
                btn = await page.query_selector(btn_sel)
                if btn and await btn.is_visible():
                    print(f"  -> Consent screen detected. Clicking bypass button: {btn_sel}")
                    await btn.click()
                    await page.wait_for_timeout(4000)
                    break
            except Exception:
                continue

        print("[3/5] Waiting for maps results sidebar to settle...")
        await page.wait_for_timeout(5000)
        
        # Scroll results sidebar
        print("[4/5] Scrolling sidebar to load places list...")
        
        scroll_attempts = 15
        for s in range(scroll_attempts):
            # Fetch current card links
            cards = await page.query_selector_all('a[href*="/maps/place/"]')
            print(f"  -> Scroll pass {s+1}/{scroll_attempts}: Loaded {len(cards)} listings...")
            if len(cards) >= max_results:
                break
            
            if cards:
                try:
                    # Scroll the last found card into view to trigger lazy loading
                    await cards[-1].scroll_into_view_if_needed()
                except Exception as scroll_err:
                    pass
            else:
                # Fallback: Scroll the body if no cards are loaded yet
                try:
                    await page.mouse.wheel(0, 2000)
                except Exception:
                    pass
            await page.wait_for_timeout(2500)
            
        # Query place card links
        cards = await page.query_selector_all('a[href*="/maps/place/"]')
        
        # Filter cards that have a valid business name in aria-label
        valid_listing_names = []
        for card in cards:
            aria_label = await card.get_attribute('aria-label')
            if aria_label and aria_label.strip():
                name_strip = aria_label.strip()
                # Exclude maps headers or results labels
                if "results for" in name_strip.lower() or name_strip.lower() == "results":
                    continue
                valid_listing_names.append(name_strip)
                
        # Limit to target results count
        valid_listing_names = valid_listing_names[:max_results]
        
        if not valid_listing_names:
            print("[Warning] No business listings found in the sidebar. Google might have blocked this session.")
            await browser.close()
            return
            
        print(f"\n[5/5] Extracting contact details from {len(valid_listing_names)} business listings...")
        print("  -> Waiting 6 seconds for event listeners to bind...")
        await page.wait_for_timeout(6000)
        
        scraped_leads = []
        seen_names = set()
        website_page = await context.new_page()
        
        for idx, target_name in enumerate(valid_listing_names):
            try:
                # Re-query cards to prevent element detachment (stale reference)
                current_cards = await page.query_selector_all('a[href*="/maps/place/"]')
                target_card = None
                for card in current_cards:
                    lbl = await card.get_attribute('aria-label')
                    if lbl and lbl.strip() == target_name:
                        target_card = card
                        break
                
                if not target_card:
                    print(f"  [-] Listing not found in DOM: '{target_name}'")
                    continue
                    
                # Hover and click to expand place panel details
                await target_card.scroll_into_view_if_needed()
                await target_card.click()
                
                # Wait for the detail panel contents to be fetched and rendered
                try:
                    await page.wait_for_selector('[data-item-id*="address"]', timeout=8000)
                except Exception:
                    pass
                await page.wait_for_timeout(1500)
                
                # Use target name directly to bypass h1 header tag collisions with the sidebar header
                name = target_name
                seen_names.add(name)

                # Extract details based on stable data-item-id attributes
                address = "N/A"
                phone = "N/A"
                website = "N/A"
                
                detail_elements = await page.query_selector_all('[data-item-id]')
                for el in detail_elements:
                    item_id = await el.get_attribute('data-item-id')
                    if item_id:
                        if item_id.startswith('address'):
                            address = await el.inner_text()
                        elif item_id.startswith('phone:tel:'):
                            phone = await el.inner_text()
                        elif item_id.startswith('authority'):
                            website = await el.inner_text()
                
                # Strip and clean details using clean_text helper
                name = clean_text(name)
                address = clean_text(address)
                phone = clean_text(phone).replace('Phone: ', '').strip()
                website = clean_text(website)
                
                # Scrape website homepage for email
                email = "N/A"
                if website != "N/A" and "." in website:
                    email = await extract_email_from_website(website_page, website)
                    
                lead_data = {
                    "Business Name": name,
                    "Phone": phone,
                    "Address": address,
                    "Website": website,
                    "Email": email
                }
                scraped_leads.append(lead_data)
                print(f"  [+] Scraped [{idx+1}/{len(valid_listing_names)}]: {name} | Phone: {phone} | Email: {email}")
                
            except Exception as ex:
                print(f"  [-] Error extracting listing '{target_name}': {ex}")
                continue
                
        # Export using Pandas
        if scraped_leads:
            df = pd.DataFrame(scraped_leads)
            df.to_csv("scraped_leads.csv", index=False, encoding="utf-8")
            print(f"\n==================================================")
            # Duplicate output into the active local CRM leads.csv for integration
            df.to_csv("leads.csv", index=False, encoding="utf-8")
            print(f"[SUCCESS] {len(scraped_leads)} actual leads saved to 'leads.csv'")
            print(f"==================================================\n")
        else:
            print("\n[Extraction Failed] No business data could be extracted.\n")
            
        await browser.close()

if __name__ == "__main__":
    query_arg = sys.argv[1] if len(sys.argv) > 1 else "construction"
    loc_arg = sys.argv[2] if len(sys.argv) > 2 else "chennai"
    limit_arg = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    
    asyncio.run(scrape_google_maps(query_arg, loc_arg, limit_arg))
