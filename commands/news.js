const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');


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

function randNum() {
    return Math.random() + Math.random(3) + 1.5;
};


module.exports = {
	data: new SlashCommandBuilder()
		.setName('tarkov-updates')
		.setDescription('Updates about Tarkov.'),
	async execute(interaction) {
            await interaction.deferReply();

            puppeteer.use(StealthPlugin());
            const browser = await puppeteer.launch(options);
            const context = await browser.createIncognitoBrowserContext();
            const page = await context.newPage();


            await page.goto('https://www.escapefromtarkov.com/');

            await page.waitForTimeout(randNum() * 1000);


            const x = await page.evaluate(() => Array.from(document.querySelectorAll('.news_list'), (e) => ({
                updates: e.querySelector('#news-list').children, //technically not needed, but maybe could use for displaying multiple updates? not just one
                link: e.querySelector('#news-list').children[0].querySelector('.read.button a').getAttribute('href'), //check date updated
                name: e.querySelector('#news-list').children[0].querySelector('.info meta').getAttribute('content'),
                date: e.querySelector('#news-list').children[0].querySelector('.info meta').nextElementSibling.getAttribute('content'),
                description: e.querySelector('#news-list').children[0].querySelector('.description').innerHTML,
                img: document.querySelector('#news-list').children[0].querySelector('.image a img').getAttribute('src')
            }))); //insert element, also should add img, and more info


            //put all info into an embed and send it
            const embed = new EmbedBuilder()
                .setColor(0x455C4D)
                .setTitle(JSON.stringify(x[0].name).replaceAll("\"", ""))
                .setURL('https://www.escapefromtarkov.com' + JSON.stringify(x[0].link).replaceAll("\"", ""))
                .setAuthor({ name: 'Tarkov News', url: 'https://www.escapefromtarkov.com' + JSON.stringify(x[0].link).replaceAll("\"", "") })
                .setDescription(JSON.stringify(x[0].date).replaceAll("\"", ""))
                .setThumbnail('https://www.escapefromtarkov.com/uploads/content/banners/949fb1c4a6b9ec235ad36e747fbcf59a.png') 
                .addFields(
                    { name: 'Description', value: JSON.stringify(x[0].description).replaceAll("\"", "")}
                )
                .setImage(JSON.stringify(x[0].img).replaceAll("\"", ""));

            await browser.close();

            await interaction.editReply({ embeds: [embed] }); //then include an embed or something
	},
};