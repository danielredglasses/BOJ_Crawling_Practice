const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv').config();

const app = express();
const PORT = 5005;

app.use(express.json());
app.use(cors());

app.get('/login', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.acmicpc.net/login');

    const boj_id = process.env.BOJ_ID;
    const boj_pw = process.env.BOJ_PW;

    await page.type('input[name="login_user_id"]', boj_id);
    await page.type('input[name="login_password"]', boj_pw);
    await page.click('#submit_button');

    await page.waitForNavigation();

    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

    await browser.close();
    res.send('Logged in and cookies saved.');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Login failed.');
  }
});

app.get('/data', async (req, res) => {
  try {
    const cookies = JSON.parse(fs.readFileSync('cookies.json'));

    const group_id = process.env.GROUP_ID;
    const practice_id = process.env.PRACTICE_ID;

    const response = await axios.get(`https://www.acmicpc.net/group/practice/view/${group_id}/${practice_id}`, {
      headers: {
        'Cookie': cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
        'Accept': "application/json",
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Referer': 'https://www.acmicpc.net/login',
        'Connection': 'keep-alive'
      }
    });

    console.log("Success Crawling!");

    res.json(response.data);
  } catch (error) {
    console.error('Data fetching error:', error);
    res.status(500).send('Data fetching failed.');
  }
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});