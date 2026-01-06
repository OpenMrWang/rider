import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取视频信息（包含 aid）
 * @param {string} bvid - BV 号
 * @returns {Promise<{aid: number, cid: number}|null>}
 */
async function getVideoInfo(bvid) {
  try {
    console.log(`\n[1] 获取视频信息...`);
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    console.log(`    URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const data = await response.json();
    
    if (data.code !== 0 || !data.data) {
      console.error(`    获取视频信息失败:`, data);
      return null;
    }
    
    const aid = data.data.aid;
    console.log(`    AID: ${aid}`);
    return { aid, cid: null };
  } catch (error) {
    console.error(`获取视频信息失败:`, error);
    return null;
  }
}

/**
 * 获取字幕 URL - 方法1: 通过 player/v2 API
 * @param {string} bvid - BV 号
 * @param {number} cid - cid
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrlMethod1(bvid, cid) {
  try {
    console.log(`\n[2a] 方法1: 通过 player/v2 API 获取字幕...`);
    const subtitleListUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    console.log(`    URL: ${subtitleListUrl}`);
    
    const subtitleResponse = await fetch(subtitleListUrl, {
      headers: {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const subtitleData = await subtitleResponse.json();
    
    if (subtitleData.code === 0 && subtitleData.data?.subtitle?.subtitles?.length > 0) {
      const subtitles = subtitleData.data.subtitle.subtitles;
      console.log(`    ✓ 找到 ${subtitles.length} 个字幕`);
      
      // 优先选择中文字幕
      let subtitle = subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'zh-Hans');
      if (!subtitle) {
        subtitle = subtitles.find(s => s.lan === 'zh' || s.lan === 'zh-Hant');
      }
      if (!subtitle) {
        subtitle = subtitles[0];
      }

      const subtitleUrl = subtitle.subtitle_url;
      const finalUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
      console.log(`    字幕 URL: ${finalUrl}`);
      return finalUrl;
    }
    
    console.log(`    ✗ 未找到字幕`);
    return null;
  } catch (error) {
    console.error(`方法1失败:`, error.message);
    return null;
  }
}

/**
 * 获取字幕 URL - 方法2: 通过 player/wbi API
 * @param {string} bvid - BV 号
 * @param {number} aid - AID
 * @param {number} cid - CID
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrlMethod2(bvid, aid, cid) {
  try {
    console.log(`\n[2b] 方法2: 尝试 player/wbi API...`);
    const wbiUrl = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}&aid=${aid}&cid=${cid}`;
    console.log(`    URL: ${wbiUrl}`);
    
    const response = await fetch(wbiUrl, {
      headers: {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const data = await response.json();
    console.log(`    响应:`, JSON.stringify(data, null, 2).substring(0, 800));
    
    if (data.code === 0 && data.data?.subtitle?.subtitles?.length > 0) {
      const subtitles = data.data.subtitle.subtitles;
      console.log(`    ✓ 找到 ${subtitles.length} 个字幕`);
      
      let subtitle = subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'zh-Hans');
      if (!subtitle) {
        subtitle = subtitles.find(s => s.lan === 'zh' || s.lan === 'zh-Hant');
      }
      if (!subtitle) {
        subtitle = subtitles[0];
      }

      const subtitleUrl = subtitle.subtitle_url;
      const finalUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
      console.log(`    字幕 URL: ${finalUrl}`);
      return finalUrl;
    }
    
    console.log(`    ✗ 未找到字幕`);
    return null;
  } catch (error) {
    console.error(`方法2失败:`, error.message);
    return null;
  }
}

/**
 * 获取字幕 URL - 方法4: 尝试通过 AI 字幕 API 获取（需要 aid 和 cid）
 * @param {number} aid - AID
 * @param {number} cid - CID
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrlMethod4(aid, cid) {
  try {
    console.log(`\n[2d] 方法4: 尝试 AI 字幕 API...`);
    // 尝试通过不同的 API 获取 AI 字幕
    // 注意：这个 API 可能需要特殊的认证或参数
    
    // 尝试构建可能的 URL 格式
    // URL 格式似乎是: https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/{aid}{cid}{hash}?auth_key={auth_key}
    // 但 hash 和 auth_key 需要从某个地方获取
    
    // 尝试通过字幕列表 API 获取
    const subtitleApiUrl = `https://api.bilibili.com/x/player/v2?bvid=&aid=${aid}&cid=${cid}`;
    console.log(`    尝试: ${subtitleApiUrl}`);
    
    const response = await fetch(subtitleApiUrl, {
      headers: {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const data = await response.json();
    console.log(`    响应:`, JSON.stringify(data, null, 2).substring(0, 1000));
    
    // 检查是否有 AI 字幕相关的信息
    if (data.code === 0 && data.data) {
      // 可能字幕信息在不同的字段中
      console.log(`    检查响应数据结构...`);
    }
    
    return null;
  } catch (error) {
    console.error(`方法4失败:`, error.message);
    return null;
  }
}

/**
 * 获取字幕 URL - 方法3: 尝试通过 view API 获取字幕信息
 * @param {string} bvid - BV 号
 * @param {number} aid - AID
 * @param {number} cid - CID
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrlMethod3(bvid, aid, cid) {
  try {
    console.log(`\n[2c] 方法3: 尝试通过 view API 获取字幕...`);
    const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    console.log(`    URL: ${viewUrl}`);
    
    const response = await fetch(viewUrl, {
      headers: {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const data = await response.json();
    
    // 检查 pages 中是否有字幕信息
    if (data.code === 0 && data.data?.pages) {
      const page = data.data.pages.find(p => p.cid === cid);
      if (page && page.subtitle) {
        console.log(`    ✓ 在页面信息中找到字幕`);
        const subtitleUrl = page.subtitle.subtitle_url;
        const finalUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
        console.log(`    字幕 URL: ${finalUrl}`);
        return finalUrl;
      }
    }
    
    console.log(`    ✗ 未找到字幕`);
    return null;
  } catch (error) {
    console.error(`方法3失败:`, error.message);
    return null;
  }
}

/**
 * 获取字幕 URL（主函数，尝试多种方法）
 * @param {string} bvid - BV 号
 * @param {number} cid - cid
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrl(bvid, cid) {
  // 先获取 aid
  const videoInfo = await getVideoInfo(bvid);
  if (!videoInfo) {
    return null;
  }
  const aid = videoInfo.aid;
  
  // 方法1: 标准 player/v2 API
  let url = await getSubtitleUrlMethod1(bvid, cid);
  if (url) return url;
  
  // 方法2: player/wbi API
  url = await getSubtitleUrlMethod2(bvid, aid, cid);
  if (url) return url;
  
  // 方法3: view API
  url = await getSubtitleUrlMethod3(bvid, aid, cid);
  if (url) return url;
  
  // 方法4: AI 字幕 API
  url = await getSubtitleUrlMethod4(aid, cid);
  if (url) return url;
  
  console.log(`\n所有方法都失败了。`);
  console.log(`提示:`);
  console.log(`  1. 字幕可能需要登录或使用不同的 API`);
  console.log(`  2. 某些视频可能使用 AI 字幕，需要特殊的 auth_key`);
  console.log(`  3. 你可以手动从浏览器开发者工具中复制完整的字幕 URL（包括 auth_key 参数）`);
  console.log(`\n如果你有完整的字幕 URL（包含 auth_key），可以直接使用:`);
  console.log(`  node scripts/test-single-subtitle.js --url "完整字幕URL" test.json`);
  console.log(`\n示例:`);
  console.log(`  node scripts/test-single-subtitle.js --url "https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/11579708303390735037578692f757cc6e503335ec5774d31b9a63c8c7?auth_key=1767676727-bc1dfc8d57aa494096ab3b7e563a586b-0-ea44bd704c808766149537408c3f8ba7" test.json`);
  
  return null;
}

/**
 * 下载字幕
 * @param {string} subtitleUrl - 字幕 API URL
 * @param {string} outputPath - 输出文件路径
 * @returns {Promise<boolean>} 是否成功
 */
async function downloadSubtitle(subtitleUrl, outputPath) {
  try {
    console.log(`\n[2] 下载字幕...`);
    console.log(`    URL: ${subtitleUrl}`);
    
    const response = await fetch(subtitleUrl, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log(`    状态码: ${response.status}`);

    if (!response.ok) {
      console.error(`    HTTP 错误: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`    响应内容: ${text.substring(0, 500)}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`    字幕数据预览:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    // 确保输出目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`    创建目录: ${dir}`);
    }

    // 保存字幕数据
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`    ✓ 已保存: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`下载字幕失败:`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
使用方法:
  方式1: 通过 BV 号和 CID 获取
    node scripts/test-single-subtitle.js <BV号> <cid> [输出文件名]

  方式2: 直接使用字幕 URL
    node scripts/test-single-subtitle.js --url "字幕URL" [输出文件名]

示例:
  node scripts/test-single-subtitle.js BV1rPvCBGESM 35037578692 test.json
  node scripts/test-single-subtitle.js --url "https://aisubtitle.hdslb.com/..." test.json
    `);
    return;
  }

  const outputDir = path.join(__dirname, '../public/subtitles');
  let subtitleUrl;
  let outputFilename;

  // 检查是否是直接提供 URL
  if (args[0] === '--url') {
    if (args.length < 2) {
      console.error('请提供字幕 URL');
      return;
    }
    subtitleUrl = args[1];
    
    // 验证 URL 格式
    if (!subtitleUrl.startsWith('http://') && !subtitleUrl.startsWith('https://')) {
      console.error('错误: 提供的 URL 格式不正确，必须以 http:// 或 https:// 开头');
      console.error(`你提供的是: ${subtitleUrl}`);
      return;
    }
    
    outputFilename = args[2] || 'test_from_url.json';
    console.log(`直接使用提供的字幕 URL`);
    console.log(`URL: ${subtitleUrl.substring(0, 100)}...`);
  } else {
    // 通过 BV 号和 CID 获取
    if (args.length < 2) {
      console.error('请提供 BV 号和 CID');
      return;
    }
    const bvid = args[0];
    const cid = parseInt(args[1]);
    outputFilename = args[2] || `test_${bvid}.json`;

    console.log(`测试字幕下载`);
    console.log(`BV号: ${bvid}`);
    console.log(`CID: ${cid}`);

    // 获取字幕 URL
    subtitleUrl = await getSubtitleUrl(bvid, cid);
    if (!subtitleUrl) {
      console.error(`\n❌ 无法获取字幕 URL`);
      return;
    }
  }

  const outputPath = path.join(outputDir, outputFilename);
  console.log(`输出: ${outputPath}`);

  // 下载字幕
  const success = await downloadSubtitle(subtitleUrl, outputPath);
  if (success) {
    console.log(`\n✅ 测试成功！`);
  } else {
    console.log(`\n❌ 测试失败！`);
  }
}

main().catch(console.error);


