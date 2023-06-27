const chrome = require('selenium-webdriver/chrome')
const {Builder, By, until, Key} = require('selenium-webdriver')
const fs = require("fs")
const XLSX = require('./readXLSX')
require('dotenv').config()

const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD
const URL = 'https://rozetka.com.ua/ua/'

async function getFromRozetka() {
    try {
        console.log("Процесс начат")
        const data = await WebScrapingLocalTest()
        console.log("Процесс завершён")
        return data
    } catch (error) {
        console.log(error)
    }
}

async function WebScrapingLocalTest() {
    let driver
    try {
        const options = new chrome.Options()
        options.addArguments('headless')
        options.excludeSwitches(['enable-logging'])
        driver = await new Builder()
            .forBrowser('chrome')
            //.setChromeOptions(options)
            .build()

        await driver.get(URL)

        await login(driver)

        const data = await XLSX('dataset.xlsx')

        for (let product of data) {
            const search = await FindElementSafe(driver, By.css('[name="search"]'), 5000)
            await search.sendKeys(product.name)
            await search.sendKeys(Key.ENTER)

            const buy = await FindElementSafe(driver, By.css('button.buy-button'), 5000)
            await buy.click()

            if(product.quantity > 1) {
                const quantity = await FindElementSafe(driver, By.css('[formcontrolname="quantity"]'), 5000)
                await quantity.clear()
                await quantity.sendKeys(product.quantity)
            }
        }
        await driver.sleep(500)
    } catch (error) {
        throw new Error(error)
    } finally {
        await driver.quit()
    }
}

async function login(driver) {
    const cookiesExist = fs.existsSync('cookies.json')
    let cookiesValid = false

    if (cookiesExist) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'))
        for (const cookie of cookies) {
            await driver.manage().addCookie(cookie)
        }

        await driver.get(URL)
        cookiesValid = await checkCookiesValidity(driver)
    }

    if(!cookiesExist || !cookiesValid) {
        console.log("Куки отсутсвуют или не в порядке, пытаюсь сам войти в аккаунт")

        const profile = await driver.findElement(By.css('[href="#icon-user-simple"]'))

        await profile.click()

        const email = await FindElementSafe(driver, By.id("auth_email"), 10000)
        await email.sendKeys(EMAIL)

        const password = await FindElementSafe(driver, By.id("auth_pass"))
        await password.sendKeys(PASSWORD)

        const submit = await FindElementSafe(driver, By.css(".auth-modal__submit"))
        await submit.click()

        if (fs.existsSync('cookies.json'))
            fs.unlinkSync('cookies.json')

        const currentCookies = await driver.manage().getCookies()
        fs.writeFileSync('cookies.json', JSON.stringify(currentCookies))
        console.log("Обновил куки")
    } else {
        console.log("Куки в порядке")
    }
    console.log("Зашёл в аккаунт")
}

async function FindElementSafe(driver, locator, time = 0) {
    try {
        if(time) {
            await driver.wait(until.elementLocated(locator), time)
            return await driver.wait(until.elementIsEnabled(await driver.findElement(locator)), time)
        }
        else
            return await driver.findElement(locator)
    } catch (error) {
        return null
    }
}

async function checkCookiesValidity(driver) {
    try {
        const profileLink = await FindElementSafe(driver, By.css('[href="#icon-orders"]'), 5000)
        return profileLink !== null
    } catch (error) {
        return false
    }
}

getFromRozetka()