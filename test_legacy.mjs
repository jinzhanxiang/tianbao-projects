import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
const page = await ctx.newPage();

// 测试 v2 旧 URL → v3 重定向
const tests = [
  {name: 'v2 home', url: 'https://jinzhanxiang.github.io/tianbao-projects/?view=overview'},
  {name: 'v2 cat=deal', url: 'https://jinzhanxiang.github.io/tianbao-projects/?view=cat&cat=deal'},
  {name: 'v2 cat=np', url: 'https://jinzhanxiang.github.io/tianbao-projects/?view=cat&cat=np'},
  {name: 'v2 proj=xingheng', url: 'https://jinzhanxiang.github.io/tianbao-projects/?view=proj&code=xingheng'},
];
for (const t of tests) {
  console.log(`\n[${t.name}] → ${t.url}`);
  await page.goto(t.url, {waitUntil: 'load', timeout: 30000});
  await page.waitForTimeout(1000);
  const cur = page.url();
  const title = await page.title();
  console.log(`  ✓ 跳转后: ${cur}`);
  console.log(`  ✓ title: ${title}`);
}
await browser.close();
