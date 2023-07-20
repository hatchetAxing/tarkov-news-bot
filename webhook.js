const { EmbedBuilder, WebhookClient } = require('discord.js');
const { webhookId, webhookToken } = require('./config.json');
const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken }); //not used but eh
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');


let lastUpdate;

const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
];

const options = {
    args,
    headless: "new",
    ignoreHTTPSErrors: true,
};

async function init(){
    
    puppeteer.use(StealthPlugin());
    
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    await page.goto('https://www.escapefromtarkov.com/'); //insert url
    
    await page.waitForTimeout(5000);
    
    
    const getName = await page.evaluate(() => Array.from(document.querySelectorAll('.news_list'), (e) => ({
        name: e.querySelector('#news-list').children[0].querySelector('.info meta').getAttribute('content')
    }))); //insert element, also should add img, and more info
    //probably not the best way to do this with an array but i'm too lazy to change it

    lastUpdate = JSON.stringify(getName[0].name).replaceAll("\"", "")

    console.log(lastUpdate);

    browser.close();

    async function run(){

        let changed = false;
    
        puppeteer.use(StealthPlugin());
        
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        
        await page.goto('https://www.escapefromtarkov.com/'); //insert url
        
        await page.waitForTimeout(5000);
    
    
        const getInfo = await page.evaluate(() => Array.from(document.querySelectorAll('.news_list'), (e) => ({
            link: e.querySelector('#news-list').children[0].querySelector('.read.button a').getAttribute('href'), //check date updated
            name: e.querySelector('#news-list').children[0].querySelector('.info meta').getAttribute('content'),
            date: e.querySelector('#news-list').children[0].querySelector('.info meta').nextElementSibling.getAttribute('content'),
            description: e.querySelector('#news-list').children[0].querySelector('.description').innerHTML,
            img: document.querySelector('#news-list').children[0].querySelector('.image a img').getAttribute('src')
        }))); //insert element, also should add img, and more info
    
        console.log("while loop starting");
    
        while(!changed) {
            if(lastUpdate == JSON.stringify(getInfo[0].name).replaceAll("\"", "")){
                console.log("waiting");
                browser.close();
                await page.waitForTimeout(43200000); //timeout for 12 hours
                return run();
            } else {
                changed = true;
                lastUpdate = JSON.stringify(getInfo[0].name).replaceAll("\"", "");
                console.log("page was updated");
            }
        }
    
        console.log("next part");
    
    
    
        const embed = new EmbedBuilder()
            .setColor(0x361503)
            .setTitle(JSON.stringify(getInfo[0].name).replaceAll("\"", ""))
            .setURL('https://www.escapefromtarkov.com' + JSON.stringify(getInfo[0].link).replaceAll("\"", ""))
            .setAuthor({ name: 'Tarkov News', url: 'https://www.escapefromtarkov.com' + JSON.stringify(getInfo[0].link).replaceAll("\"", "") })
            .setDescription(JSON.stringify(getInfo[0].date).replaceAll("\"", ""))
            .setThumbnail('https://www.escapefromtarkov.com/uploads/content/banners/949fb1c4a6b9ec235ad36e747fbcf59a.png') 
            .addFields(
                { name: 'Description', value: JSON.stringify(getInfo[0].description).replaceAll("\"", "")}
            )
            .setImage(JSON.stringify(getInfo[0].img).replaceAll("\"", ""));
    
    
        console.log("embed created");
    
        if(changed == true) {
            webhookClient.send({
                username: 'TarkovNews',
                avatarURL: 'https://tarkovmerchstore.com/_nuxt/img/killa-set.d277bd6.jpg',
                embeds: [embed],
            });
            console.log("embed sent");
            return run();
    
        }
    
    };

    run();
    
}



init();