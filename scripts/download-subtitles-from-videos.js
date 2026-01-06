import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从标题中提取天数
 * @param {string} title - 视频标题
 * @returns {number|null} 天数或 null
 */
function extractDayFromTitle(title) {
  // 匹配 "第X天" 或 "第XX天" 等格式
  const match = title.match(/第([一二三四五六七八九十百千万]+)天/);
  if (!match) {
    return null;
  }

  const chineseNumber = match[1];
  const numberMap = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
    '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
    '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35,
    '三十六': 36, '三十七': 37, '三十八': 38, '三十九': 39, '四十': 40,
    '四十一': 41, '四十二': 42, '四十三': 43, '四十四': 44, '四十五': 45,
    '四十六': 46, '四十七': 47, '四十八': 48, '四十九': 49, '五十': 50,
    '五十一': 51, '五十二': 52, '五十三': 53, '五十四': 54, '五十五': 55,
    '五十六': 56, '五十七': 57, '五十八': 58, '五十九': 59, '六十': 60,
    '六十一': 61, '六十二': 62, '六十三': 63, '六十四': 64, '六十五': 65,
    '六十六': 66, '六十七': 67, '六十八': 68, '六十九': 69, '七十': 70,
    '七十一': 71, '七十二': 72, '七十三': 73, '七十四': 74, '七十五': 75,
    '七十六': 76, '七十七': 77, '七十八': 78, '七十九': 79, '八十': 80,
    '八十一': 81, '八十二': 82, '八十三': 83, '八十四': 84, '八十五': 85,
    '八十六': 86, '八十七': 87, '八十八': 88, '八十九': 89, '九十': 90,
    '九十一': 91, '九十二': 92, '九十三': 93, '九十四': 94, '九十五': 95,
    '九十六': 96, '九十七': 97, '九十八': 98, '九十九': 99, '一百': 100,
  };

  return numberMap[chineseNumber] || null;
}

/**
 * 从 B 站视频获取发布日期
 * @param {string} bvid - BV 号
 * @param {number} cid - cid
 * @returns {Promise<string|null>} 日期字符串 (YYYY-MM-DD) 或 null
 */
async function getVideoDate(bvid, cid) {
  try {
    const videoInfoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const response = await fetch(videoInfoUrl);
    const data = await response.json();
    
    if (data.code === 0 && data.data && data.data.pubdate) {
      // pubdate 是时间戳（秒）
      const date = new Date(data.data.pubdate * 1000);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    return null;
  } catch (error) {
    console.warn(`获取视频日期失败 (${bvid}):`, error.message);
    return null;
  }
}

/**
 * 获取字幕 URL
 * @param {string} bvid - BV 号
 * @param {number} cid - cid
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrl(bvid, cid) {
  try {
    // 获取字幕列表
    const subtitleListUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    const subtitleResponse = await fetch(subtitleListUrl);
    const subtitleData = await subtitleResponse.json();
    
    if (subtitleData.code !== 0 || !subtitleData.data || !subtitleData.data.subtitle) {
      return null;
    }

    const subtitles = subtitleData.data.subtitle.subtitles;
    if (!subtitles || subtitles.length === 0) {
      return null;
    }

    // 优先选择中文字幕
    let subtitle = subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'zh-Hans');
    if (!subtitle) {
      subtitle = subtitles.find(s => s.lan === 'zh' || s.lan === 'zh-Hant');
    }
    if (!subtitle) {
      subtitle = subtitles[0];
    }

    // 构建字幕 URL
    const subtitleUrl = subtitle.subtitle_url;
    if (subtitleUrl.startsWith('http')) {
      return subtitleUrl;
    } else {
      return `https:${subtitleUrl}`;
    }
  } catch (error) {
    console.error(`获取字幕 URL 失败 (${bvid}):`, error.message);
    return null;
  }
}

/**
 * 下载字幕
 * @param {string} subtitleUrl - 字幕 API URL
 * @param {string} outputPath - 输出文件路径
 * @returns {Promise<boolean>} 是否成功
 */
async function downloadSubtitle(subtitleUrl, outputPath) {
  try {
    const response = await fetch(subtitleUrl, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "referer": "https://www.bilibili.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 确保输出目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 保存字幕数据
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`下载字幕失败:`, error.message);
    return false;
  }
}

/**
 * 主函数：从 videos.json 批量下载字幕
 */
async function main() {
  const videosJsonPath = path.join(__dirname, '../public/videos.json');
  const outputDir = path.join(__dirname, '../public/subtitles');

  console.log(`读取视频列表: ${videosJsonPath}`);
  
  if (!fs.existsSync(videosJsonPath)) {
    console.error(`文件不存在: ${videosJsonPath}`);
    return;
  }

  const videosData = JSON.parse(fs.readFileSync(videosJsonPath, 'utf-8'));
  const sections = videosData.sections || [];

  console.log(`找到 ${sections.length} 个 section`);

  let totalEpisodes = 0;
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  // 遍历所有 sections
  for (const section of sections) {
    const episodes = section.episodes || [];
    console.log(`\n处理 section: ${section.title} (${episodes.length} 个视频)`);

    // 遍历每个 episode
    for (const episode of episodes) {
      totalEpisodes++;
      const { bvid, cid, title } = episode;

      if (!bvid || !cid) {
        console.warn(`  ⚠ 跳过: ${title} - 缺少 bvid 或 cid`);
        skipCount++;
        continue;
      }

      // 提取天数
      const day = extractDayFromTitle(title);
      
      // 获取视频日期
      console.log(`  [${totalEpisodes}] 处理: ${title}`);
      const date = await getVideoDate(bvid, cid);
      
      // 构建文件名
      let filename;
      if (day !== null) {
        filename = `day${String(day).padStart(3, '0')}_${date || 'unknown'}.json`;
      } else {
        // 番外篇或其他，使用标题的一部分
        const safeTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 30);
        filename = `extra_${date || 'unknown'}_${safeTitle}.json`;
      }

      const outputPath = path.join(outputDir, filename);

      // 检查文件是否已存在
      if (fs.existsSync(outputPath)) {
        console.log(`    ⏭  文件已存在，跳过: ${filename}`);
        skipCount++;
        continue;
      }

      // 获取字幕 URL
      const subtitleUrl = await getSubtitleUrl(bvid, cid);
      if (!subtitleUrl) {
        console.warn(`    ⚠  无字幕: ${bvid}`);
        failCount++;
        continue;
      }

      // 下载字幕
      const success = await downloadSubtitle(subtitleUrl, outputPath);
      if (success) {
        console.log(`    ✓  已保存: ${filename}`);
        successCount++;
      } else {
        failCount++;
      }

      // 添加延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`完成统计:`);
  console.log(`  总计: ${totalEpisodes}`);
  console.log(`  成功: ${successCount}`);
  console.log(`  失败: ${failCount}`);
  console.log(`  跳过: ${skipCount} (已存在或无字幕)`);
  console.log(`输出目录: ${outputDir}`);
}

main().catch(console.error);

