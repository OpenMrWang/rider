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
 * @param {string} cookie - Cookie 字符串（可选）
 * @returns {Promise<string|null>} 日期字符串 (YYYY-MM-DD) 或 null
 */
async function getVideoDate(bvid, cid, cookie = null) {
  try {
    const videoInfoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const headers = {
      "accept": "application/json",
      "referer": "https://www.bilibili.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
    if (cookie) {
      headers["cookie"] = cookie;
    }
    const response = await fetch(videoInfoUrl, { headers });
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
 * 获取字幕 URL（支持多种方式）
 * @param {string} bvid - BV 号
 * @param {number} cid - cid
 * @param {number} aid - AID（可选）
 * @param {string} authKey - 手动提供的 auth_key（可选）
 * @param {string} cookie - Cookie 字符串（可选）
 * @param {boolean} debug - 是否启用调试模式
 * @returns {Promise<string|null>} 字幕 API URL 或 null
 */
async function getSubtitleUrl(bvid, cid, aid = null, authKey = null, cookie = null, debug = false) {
  try {
    // 构建通用请求头
    const getHeaders = () => {
      const headers = {
        "accept": "application/json",
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      };
      if (cookie) {
        headers["cookie"] = cookie;
      }
      return headers;
    };

    // 如果没有提供 aid，先获取
    if (!aid) {
      const videoInfoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const videoResponse = await fetch(videoInfoUrl, { headers: getHeaders() });
      const videoData = await videoResponse.json();
      if (videoData.code === 0 && videoData.data) {
        aid = videoData.data.aid;
      }
    }

    // 优先使用 player/wbi/v2 API（包含 AI 字幕）
    if (aid) {
      const wbiUrl = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}&aid=${aid}&cid=${cid}`;
      if (debug) {
        console.log(`    [调试] 请求 player/wbi/v2 API: ${wbiUrl}`);
        if (cookie) {
          console.log(`    [调试] 使用 Cookie: ${cookie.substring(0, 50)}...`);
        }
      }
      
      const wbiResponse = await fetch(wbiUrl, {
        headers: getHeaders(),
      });
      
      const wbiData = await wbiResponse.json();
      
      if (debug) {
        console.log(`    [调试] player/wbi/v2 API 响应状态: ${wbiResponse.status}`);
        console.log( wbiData.data?.subtitle);
        if (wbiData.data?.subtitle) {
          console.log(`    [调试] subtitle 字段存在，subtitles 数量: ${wbiData.data.subtitle.subtitles?.length || 0}`);
        } else {
          console.log(`    [调试] 响应数据:`, JSON.stringify(wbiData, null, 2).substring(0, 800));
        }
      }
      
      if (wbiData.code === 0 && wbiData.data?.subtitle?.subtitles?.length > 0) {
        const subtitles = wbiData.data.subtitle.subtitles;
        
        if (debug) {
          console.log(`    [调试] 找到 ${subtitles.length} 个字幕选项:`, subtitles.map(s => `${s.lan} (${s.lan_doc || ''})`).join(', '));
        }
        
        // 优先选择中文字幕（AI 字幕优先）
        // 优先级：ai-zh > zh-CN > zh-Hans > zh > zh-Hant > 其他中文
        let subtitle = subtitles.find(s => s.lan === 'ai-zh');
        if (!subtitle) {
          subtitle = subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'zh-Hans');
        }
        if (!subtitle) {
          subtitle = subtitles.find(s => s.lan === 'zh' || s.lan === 'zh-Hant');
        }
        if (!subtitle) {
          // 如果没有找到中文，选择第一个
          subtitle = subtitles[0];
        }

        if (debug) {
          console.log(`    [调试] 选择字幕: ${subtitle.lan} (${subtitle.lan_doc || ''})`);
        }

        const subtitleUrl = subtitle.subtitle_url;
        if (subtitleUrl) {
          // URL 可能是相对路径（以 // 开头），需要添加 https:
          let finalUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
          
          // 注意：API 返回的 URL 通常已经包含 auth_key，不需要手动添加
          // 但如果提供了 auth_key 且 URL 中没有，尝试添加（作为备用）
          if (authKey && !finalUrl.includes('auth_key=')) {
            if (finalUrl.includes('aisubtitle.hdslb.com')) {
              const separator = finalUrl.includes('?') ? '&' : '?';
              finalUrl = `${finalUrl}${separator}auth_key=${authKey}`;
            }
          }
          
          if (debug) {
            console.log(`    [调试] 最终字幕 URL: ${finalUrl.substring(0, 120)}...`);
          }
          
          return finalUrl;
        }
      } else if (wbiData.code === 0 && wbiData.data?.subtitle) {
        // 有 subtitle 字段但 subtitles 为空
        if (debug) {
          console.log(`    [调试] subtitle 字段存在但 subtitles 为空`);
        }
      }
    }

    // 备用方法：尝试通过 player/v2 API 获取字幕列表
    const subtitleListUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    if (debug) {
      console.log(`    [调试] 尝试备用方法 player/v2 API: ${subtitleListUrl}`);
    }
    
    const subtitleResponse = await fetch(subtitleListUrl, {
      headers: getHeaders(),
    });
    
    const subtitleData = await subtitleResponse.json();
    
    if (debug) {
      console.log(`    [调试] player/v2 API 响应:`, JSON.stringify(subtitleData, null, 2).substring(0, 500));
    }
    
    if (subtitleData.code === 0 && subtitleData.data?.subtitle?.subtitles?.length > 0) {
      const subtitles = subtitleData.data.subtitle.subtitles;
      
      if (debug) {
        console.log(`    [调试] 找到 ${subtitles.length} 个字幕选项:`, subtitles.map(s => `${s.lan} (${s.lan_doc || ''})`).join(', '));
      }
      
      // 优先选择中文字幕
      let subtitle = subtitles.find(s => s.lan === 'ai-zh');
      if (!subtitle) {
        subtitle = subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'zh-Hans');
      }
      if (!subtitle) {
        subtitle = subtitles.find(s => s.lan === 'zh' || s.lan === 'zh-Hant');
      }
      if (!subtitle) {
        subtitle = subtitles[0];
      }

      if (debug) {
        console.log(`    [调试] 选择字幕: ${subtitle.lan} (${subtitle.lan_doc || ''})`);
      }

      const subtitleUrl = subtitle.subtitle_url;
      if (subtitleUrl) {
        let finalUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
        
        if (authKey && !finalUrl.includes('auth_key=')) {
          if (finalUrl.includes('aisubtitle.hdslb.com')) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${separator}auth_key=${authKey}`;
          }
        }
        
        if (debug) {
          console.log(`    [调试] 最终字幕 URL: ${finalUrl.substring(0, 100)}...`);
        }
        
        return finalUrl;
      }
    }

    // 方法3: 如果提供了 auth_key，尝试直接构建 AI 字幕 URL（实验性）
    // 根据观察，AI 字幕 URL 格式可能是：
    // https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/{aid}{cid}{hash}?auth_key={auth_key}
    // 但 hash 部分无法直接获取，需要从 API 响应中获取
    // 这里我们尝试从其他 API 获取完整的字幕信息
    
    // 实际上，如果前两个方法都失败了，说明可能需要：
    // 1. 登录才能获取字幕
    // 2. 使用不同的 API 端点
    // 3. 或者这些视频确实没有字幕
    
    return null;
  } catch (error) {
    console.error(`获取字幕 URL 失败 (${bvid}):`, error.message);
    return null;
  }
}

/**
 * 下载字幕
 * @param {string} subtitleUrl - 字幕 API URL
 * @param {string} outputPath - 输出文件路径
 * @param {string} cookie - Cookie 字符串（可选）
 * @returns {Promise<boolean>} 是否成功
 */
async function downloadSubtitle(subtitleUrl, outputPath, cookie = null) {
  try {
    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "referer": "https://www.bilibili.com/",
    };
    if (cookie) {
      headers["cookie"] = cookie;
    }
    const response = await fetch(subtitleUrl, { headers });

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
  const args = process.argv.slice(2);
  
  // 检查是否有 --auth-key 参数
  let authKey = null;
  let debugMode = false;
  let subtitleMapFile = null;
  let cookie = null;
  
  const authKeyIndex = args.indexOf('--auth-key');
  if (authKeyIndex !== -1 && args[authKeyIndex + 1]) {
    authKey = args[authKeyIndex + 1];
    console.log(`使用手动提供的 auth_key: ${authKey.substring(0, 20)}...`);
  } else {
    // 尝试从环境变量获取
    authKey = process.env.BILIBILI_AUTH_KEY || null;
    if (authKey) {
      console.log(`从环境变量获取 auth_key: ${authKey.substring(0, 20)}...`);
    }
  }
  
  // 检查是否有 --cookie 参数
  const cookieIndex = args.indexOf('--cookie');
  if (cookieIndex !== -1 && args[cookieIndex + 1]) {
    cookie = args[cookieIndex + 1];
    console.log(`使用手动提供的 Cookie: ${cookie.substring(0, 50)}...`);
  } else {
    // 尝试从环境变量获取
    cookie = process.env.BILIBILI_COOKIE || null;
    if (cookie) {
      console.log(`从环境变量获取 Cookie: ${cookie.substring(0, 50)}...`);
    }
  }
  
  // 检查是否有 --debug 参数
  if (args.includes('--debug')) {
    debugMode = true;
    console.log(`调试模式已启用`);
  }
  
  // 检查是否有 --subtitle-map 参数（字幕 URL 映射文件）
  const mapIndex = args.indexOf('--subtitle-map');
  if (mapIndex !== -1 && args[mapIndex + 1]) {
    subtitleMapFile = args[mapIndex + 1];
    console.log(`使用字幕映射文件: ${subtitleMapFile}`);
  }
  
  // 加载字幕映射（如果提供）
  let subtitleMap = {};
  if (subtitleMapFile && fs.existsSync(subtitleMapFile)) {
    try {
      subtitleMap = JSON.parse(fs.readFileSync(subtitleMapFile, 'utf-8'));
      console.log(`已加载 ${Object.keys(subtitleMap).length} 个字幕 URL 映射`);
    } catch (error) {
      console.error(`加载字幕映射文件失败:`, error.message);
    }
  }
  
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
      const date = await getVideoDate(bvid, cid, cookie);
      
      // 清理标题，使其适合作为文件名的一部分
      // 移除或替换不适合文件名的字符，保留中文、英文、数字
      const safeTitle = title
        .replace(/[<>:"/\\|?*]/g, '_')  // 替换 Windows 不允许的字符
        .replace(/\s+/g, '_')            // 空格替换为下划线
        .replace(/_{2,}/g, '_')          // 多个连续下划线合并为一个
        .replace(/^_+|_+$/g, '')         // 移除首尾下划线
        .substring(0, 50);               // 限制长度
      
      // 构建文件名
      let filename;
      if (day !== null) {
        filename = `day${String(day).padStart(3, '0')}_${date || 'unknown'}_${safeTitle}.json`;
      } else {
        // 番外篇或其他
        filename = `extra_${date || 'unknown'}_${safeTitle}.json`;
      }

      const outputPath = path.join(outputDir, filename);

      // 检查文件是否已存在
      if (fs.existsSync(outputPath)) {
        console.log(`    ⏭  文件已存在，跳过: ${filename}`);
        skipCount++;
        continue;
      }

      // 优先检查字幕映射文件
      let subtitleUrl = subtitleMap[bvid] || subtitleMap[episode.id] || null;
      
      if (!subtitleUrl) {
        // 尝试通过 API 获取字幕 URL
        subtitleUrl = await getSubtitleUrl(bvid, cid, episode.aid, authKey, cookie, debugMode);
      } else {
        console.log(`    ✓  从映射文件获取字幕 URL`);
        // 如果映射的 URL 中没有 auth_key，尝试添加
        if (authKey && !subtitleUrl.includes('auth_key=')) {
          if (subtitleUrl.includes('aisubtitle.hdslb.com')) {
            const separator = subtitleUrl.includes('?') ? '&' : '?';
            subtitleUrl = `${subtitleUrl}${separator}auth_key=${authKey}`;
          }
        }
      }
      
      if (!subtitleUrl) {
        console.warn(`    ⚠  无字幕: ${bvid}`);
        if (debugMode) {
          console.warn(`    [调试] cid: ${cid}, aid: ${episode.aid}`);
          console.warn(`    [调试] 提示: 可以创建字幕映射文件，格式: {"BV号": "完整字幕URL"}`);
        }
        failCount++;
        continue;
      }
      
      if (debugMode) {
        console.log(`    [调试] 字幕 URL: ${subtitleUrl.substring(0, 100)}...`);
      }

      // 下载字幕
      const success = await downloadSubtitle(subtitleUrl, outputPath, cookie);
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
  
  if (failCount > 0 && !authKey) {
    console.log(`\n提示: 如果某些视频下载失败，可以尝试使用 --auth-key 参数:`);
    console.log(`  node scripts/download-subtitles-from-videos.js --auth-key "你的auth_key"`);
    console.log(`或者设置环境变量:`);
    console.log(`  $env:BILIBILI_AUTH_KEY="你的auth_key"  # PowerShell`);
    console.log(`  export BILIBILI_AUTH_KEY="你的auth_key"  # Bash`);
  }
}

main().catch(console.error);

