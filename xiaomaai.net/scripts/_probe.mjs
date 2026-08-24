import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'zh-CN,zh;q=0.9' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

async function probeTopic(url) {
  console.log(`\n=== Topic: ${url} ===`)
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)
  const links = []
  $('a[href]').each((i, el) => {
    const h = $(el).attr('href') || ''
    const t = $(el).text().trim().slice(0, 80)
    if (!h) return
    // 文章详情页通常是 /news/xxx/数字.html 或类似
    if (h.match(/\/news\/[^/]+\/\d+\.html$/) || h.match(/\/news\/\d+\.html$/)) {
      links.push({ href: h, text: t })
    }
  })
  console.log('Article links found:', links.length)
  console.log(JSON.stringify(links.slice(0, 20), null, 2))
}

async function probeArticle(url) {
  console.log(`\n=== Article: ${url} ===`)
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)
  const title = $('h1').first().text().trim()
  console.log('Title:', title)
  const ogImage = $('meta[property="og:image"]').attr('content')
  console.log('og:image:', ogImage)
  const desc = $('meta[name="description"]').attr('content')
  console.log('description:', desc?.slice(0, 100))
  // 找正文容器
  const article = $('article').first()
  const container = article.length ? article : $('.article-content, .content, .post-content, .entry-content').first()
  console.log('Container found:', container.length ? 'yes' : 'no')
  if (container.length) {
    const text = container.text().replace(/\s+/g, ' ').trim()
    console.log('Body text length:', text.length)
    console.log('First 300 chars:', text.slice(0, 300))
  }
  // 找标签
  const tags = []
  $('a[href*="/news/topic/"]').each((i, el) => {
    const t = $(el).text().trim()
    if (t && t.length < 20) tags.push(t)
  })
  console.log('Tags:', [...new Set(tags)].slice(0, 10))
  // 找发布时间
  const timeText = $('time, .time, .date, .publish-time, .post-time').first().text().trim()
  console.log('Time element:', timeText)
}

async function main() {
  // 先看一个教程类 topic
  await probeTopic('https://www.faxianai.com/news/topic/tutop10')
  await probeTopic('https://www.faxianai.com/news/datas/shouce')

  // 找一篇文章详情
  const html = await fetchHtml('https://www.faxianai.com/news/topic/tutop10')
  const $ = cheerio.load(html)
  let firstArticle = ''
  $('a[href]').each((i, el) => {
    const h = $(el).attr('href') || ''
    if (!firstArticle && h.match(/\/news\/[^/]+\/\d+\.html$/)) {
      firstArticle = h
    }
  })
  if (firstArticle) {
    await probeArticle(firstArticle)
  }
}

main().catch(e => console.error(e))
