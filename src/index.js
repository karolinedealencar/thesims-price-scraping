require('dotenv').config();
const puppeteer = require('puppeteer');


const scrape = async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.ea.com/games/the-sims/the-sims-4/pc/store');
    await page.waitFor(1000);

    const result = await page.evaluate(() => {
        const products = Array.from(document.querySelectorAll('.product__group__pack'));

        const productsInfo = products.map(product => {    
            const original = product.querySelector('.pack--hover__price--original');
            const discount = product.querySelector('.pack--hover__price--discount span');
            const final = product.querySelector('.pack--hover__price--final span');

            return {
                title: product.querySelector('h2').innerText,
                price: {
                    original: original ? original.innerText : null,
                    discount: discount ? discount.innerText : null, 
                    final: final ? final.innerText : null,
                }
            }
        });

        return productsInfo;
    });

    browser.close();
    return result;
}

scrape()
.then((value) => console.log(value))
.catch((error) => console.log(error));