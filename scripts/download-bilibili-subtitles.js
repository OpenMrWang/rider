import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从 B 站视频 URL 或 BV 号获取字幕 API 地址
 * @param {string} bvid - BV 号（如 BV1Q2tMzcEa4）
 * @param {number} cid - 视频分 P 的 cid（可选）
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrl(bvid, cid = null) {
  try {
    // 如果没有提供 cid，先获取视频信息
    if (!cid) {
      const videoInfoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const response = await fetch(videoInfoUrl);
      const data = await response.json();
      
      if (data.code !== 0 || !data.data || !data.data.pages || data.data.pages.length === 0) {
        console.error(`无法获取视频信息: ${bvid}`);
        return null;
      }
      
      // 使用第一个分 P 的 cid
      cid = data.data.pages[0].cid;
    }

    // 获取字幕列表
    const subtitleListUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    const subtitleResponse = await fetch(subtitleListUrl);
    const subtitleData = await subtitleResponse.json();
    
    if (subtitleData.code !== 0 || !subtitleData.data || !subtitleData.data.subtitle) {
      console.warn(`视频 ${bvid} 没有字幕`);
      return null;
    }

    const subtitles = subtitleData.data.subtitle.subtitles;
    if (!subtitles || subtitles.length === 0) {
      console.warn(`视频 ${bvid} 没有字幕`);
      return null;
    }

    // 优先选择中文字幕，如果没有则选择第一个
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
    console.error(`下载字幕失败 (${subtitleUrl}):`, error.message);
    return false;
  }
}

/**
 * 从 BV 号提取字幕
 * @param {string} bvid - BV 号
 * @param {string} outputDir - 输出目录
 * @param {string} filename - 输出文件名（可选）
 * @returns {Promise<boolean>} 是否成功
 */
async function downloadSubtitleByBvid(bvid, outputDir, filename = null) {
  console.log(`\n处理视频: ${bvid}`);
  
  const subtitleUrl = await getSubtitleUrl(bvid);
  if (!subtitleUrl) {
    return false;
  }

  const outputFilename = filename || `${bvid}.json`;
  const outputPath = path.join(outputDir, outputFilename);

  const success = await downloadSubtitle(subtitleUrl, outputPath);
  if (success) {
    console.log(`✓ 字幕已保存: ${outputPath}`);
  }
  
  return success;
}

/**
 * 从 JSON 数据文件批量下载字幕
 * @param {string} jsonPath - JSON 数据文件路径
 * @param {string} outputDir - 输出目录
 */
async function downloadSubtitlesFromJson(jsonPath, outputDir) {
  console.log(`读取数据文件: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`文件不存在: ${jsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const days = data.days || [];

  console.log(`找到 ${days.length} 天的记录`);

  let successCount = 0;
  let failCount = 0;

  for (const day of days) {
    if (day.vlog?.platform !== 'bilibili' || !day.vlog?.episode) {
      console.log(`跳过: ${day.day} - 不是 B 站视频或缺少 episode`);
      continue;
    }

    // 从 episode 或其他字段提取 BV 号
    // 这里需要根据实际情况调整，可能需要手动提供 BV 号映射
    const episode = day.vlog.episode;
    console.log(`\n处理第 ${day.day} 天: ${episode}`);
    
    // 如果 JSON 中有 BV 号字段，使用它；否则需要手动映射
    const bvid = day.vlog.bvid || day.vlog.bv || null;
    
    if (!bvid) {
      console.warn(`  ⚠ 缺少 BV 号，跳过`);
      failCount++;
      continue;
    }

    const filename = `day${day.day}_${episode}_${bvid}.json`;
    const success = await downloadSubtitleByBvid(bvid, outputDir, filename);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // 添加延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n完成! 成功: ${successCount}, 失败: ${failCount}`);
}

/**
 * 从 BV 号列表批量下载
 * @param {string[]} bvids - BV 号数组
 * @param {string} outputDir - 输出目录
 */
async function downloadSubtitlesFromList(bvids, outputDir) {
  console.log(`开始下载 ${bvids.length} 个字幕`);

  let successCount = 0;
  let failCount = 0;

  for (const bvid of bvids) {
    const success = await downloadSubtitleByBvid(bvid, outputDir);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // 添加延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n完成! 成功: ${successCount}, 失败: ${failCount}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
使用方法:
  1. 从 JSON 数据文件下载:
     node scripts/download-bilibili-subtitles.js --json <json文件路径> [输出目录]

  2. 从 BV 号列表下载:
     node scripts/download-bilibili-subtitles.js --list BV1xxx BV2xxx ... [输出目录]

  3. 下载单个视频:
     node scripts/download-bilibili-subtitles.js --single BV1xxx [输出目录]

示例:
  node scripts/download-bilibili-subtitles.js --json public/sample-data.json public/subtitles
  node scripts/download-bilibili-subtitles.js --list BV1Q2tMzcEa4 BV1xxx public/subtitles
  node scripts/download-bilibili-subtitles.js --single BV1Q2tMzcEa4 public/subtitles
    `);
    return;
  }

  const outputDir = args[args.length - 1] || path.join(__dirname, '../public/subtitles');
  
  if (args[0] === '--json') {
    const jsonPath = args[1];
    if (!jsonPath) {
      console.error('请提供 JSON 文件路径');
      return;
    }
    await downloadSubtitlesFromJson(jsonPath, outputDir);
  } else if (args[0] === '--list') {
    const bvids = args.slice(1, -1);
    if (bvids.length === 0) {
      console.error('请提供至少一个 BV 号');
      return;
    }
    await downloadSubtitlesFromList(bvids, outputDir);
  } else if (args[0] === '--single') {
    const bvid = args[1];
    if (!bvid) {
      console.error('请提供 BV 号');
      return;
    }
    await downloadSubtitleByBvid(bvid, outputDir);
  } else {
    console.error('未知参数，请使用 --json, --list 或 --single');
  }
}

main().catch(console.error);

