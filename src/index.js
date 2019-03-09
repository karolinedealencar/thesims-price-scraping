require('dotenv').config();
const puppeteer = require('puppeteer');
const fileSystem = require('fs');
const nodemailer = require('nodemailer');

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
    await emailSend(result);
    return result;
}

const emailSend = async (products) => {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: password 
        }
    });

    const mailOptions = {
        from: email, 
        to: email, 
        subject: 'The Sims 4 Prices', 
        html: `
            <h1>The Sims 4 Prices</h1> 
            <ul>
                ${products.map(product => 
                    `<li>
                        <h2>${product.title}</h2>
                        <ul>
                            ${
                                product.price.original 
                                ? 
                                `<li>
                                    <p>
                                        <b>Original:</b> ${product.price.original}
                                    </p>
                                </li>`
                                : ''
                            }           
                            ${
                                product.price.discount 
                                ? 
                                `<li>
                                    <p>
                                        <b>Discount:</b> ${product.price.discount}%
                                    </p>
                                </li>`
                                : ''
                            } 
                            ${
                                product.price.final 
                                ? 
                                `<li>
                                    <p>
                                        <b>Final:</b> ${product.price.final}
                                    </p>
                                </li>`
                                : ''
                            } 
                        </ul>
                    </li>`
                ).join('')}
            </ul>
        `
    };
    
   await transporter.sendMail(mailOptions, function (error, info) {
        if(error) console.log(error)
        else console.log(info);
   });

}

scrape()
.then((value) => {
    fileSystem.writeFile('./products.json', JSON.stringify(value), (error) => {
        if (error) console.log(error);
    })
})
.catch((error) => console.log(error));