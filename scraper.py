from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv


load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")


areas = ["Saket", "Punjabi Bagh", "Hauz Khas", "Rajouri Garden", "Tagore Garden", "Paschim Vihar"]

def scrape_mb():
    # Set up Selenium WebDriver with options
    options = webdriver.ChromeOptions()
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    results = []

    try:
        for area in areas:
            url = f"https://www.magicbricks.com/property-for-rent/residential-real-estate?bedroom=1&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Service-Apartment,Residential-House,Villa&Locality={area}&cityName=New-Delhi"
            driver.get(url)
            time.sleep(5)

            try:
                listings = wait.until(
                    EC.presence_of_all_elements_located(
                        (By.CLASS_NAME, "mb-srp__card__price--amount")
                    )
                )

                prices = []
                for listing in listings[:4]:
                    try:
                        price_text = listing.text
                        price = int(''.join(filter(str.isdigit, price_text)))
                        prices.append(price)
                    except Exception as e:
                        print(f"Error extracting individual price: {e}")
                        continue

                if prices:
                    mean_price = sum(prices) / len(prices)
                    median_price = sorted(prices)[len(prices) // 2]
                    price_range = {"low": min(prices), "high": max(prices)}
                    
                    results.append({
                        'area': area,
                        'rental_prices': prices,
                        'mean_price': mean_price,
                        'median_price': median_price,
                        'price_range': price_range
                    })
                    print(f"Successfully scraped {area}: {prices}")

            except Exception as e:
                print(f"Error processing area {area}: {e}")
                continue

    finally:
        driver.quit()

    return results

def store_data(results):
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        cur = conn.cursor()

        # Insert scraped data into the database
        for record in results:
            # Convert Python list to PostgreSQL array literal format
            rental_prices_array = '{' + ','.join(str(x) for x in record['rental_prices']) + '}'
            
            cur.execute(
                """
                INSERT INTO rentals (area, rental_prices, mean_price, median_price, price_range)
                VALUES (%s, %s::integer[], %s, %s, %s)
                """,
                (
                    record['area'],
                    rental_prices_array,  # PostgreSQL array format
                    record['mean_price'],
                    record['median_price'],
                    Json(record['price_range'])  # Keep this as JSON
                )
            )

        conn.commit()
        print("Data stored successfully!")
    except Exception as e:
        print(f"Error storing data: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    scraped_data = scrape_mb()
    if scraped_data:
        store_data(scraped_data)