import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 提取字幕文本内容
 * @param {string} jsonFilePath - JSON 文件路径
 * @returns {Promise<string|null>} 提取的文本内容或 null
 */
async function extractSubtitleText(jsonFilePath) {
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(content);
    
    // 检查是否有 body 数组
    if (!data.body || !Array.isArray(data.body)) {
      console.warn(`  ⚠  文件缺少 body 数组: ${path.basename(jsonFilePath)}`);
      return null;
    }
    
    // 提取所有 content 字段
    const texts = data.body
      .map(item => item.content)
      .filter(content => content && typeof content === 'string')
      .map(content => content.trim())
      .filter(content => content.length > 0);
    
    if (texts.length === 0) {
      console.warn(`  ⚠  未找到有效文本内容: ${path.basename(jsonFilePath)}`);
      return null;
    }
    
    // 将文本用换行符连接（每句话一行）
    return texts.join('\n');
  } catch (error) {
    console.error(`  ❌ 处理文件失败 (${path.basename(jsonFilePath)}):`, error.message);
    return null;
  }
}

/**
 * 主函数：批量提取字幕文本
 */
async function main() {
  const subtitlesDir = path.join(__dirname, '../public/subtitles');
  const outputDir = path.join(__dirname, '../public/subtitles-pure');
  
  // 检查输入目录是否存在
  if (!fs.existsSync(subtitlesDir)) {
    console.error(`错误: 目录不存在: ${subtitlesDir}`);
    return;
  }
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`创建输出目录: ${outputDir}`);
  }
  
  // 读取所有文件
  const files = fs.readdirSync(subtitlesDir);
  
  // 筛选出以 day 开头的 JSON 文件
  const dayFiles = files.filter(file => 
    file.startsWith('day') && file.endsWith('.json')
  );
  
  console.log(`找到 ${dayFiles.length} 个以 day 开头的字幕文件`);
  console.log(`输出目录: ${outputDir}\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  // 处理每个文件
  for (const file of dayFiles) {
    const inputPath = path.join(subtitlesDir, file);
    const outputFileName = file.replace(/\.json$/, '.txt');
    const outputPath = path.join(outputDir, outputFileName);
    
    // 检查输出文件是否已存在
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭  已存在，跳过: ${outputFileName}`);
      skipCount++;
      continue;
    }
    
    console.log(`  [${successCount + failCount + skipCount + 1}/${dayFiles.length}] 处理: ${file}`);
    
    // 提取文本
    const text = await extractSubtitleText(inputPath);
    
    if (text) {
      // 保存为文本文件
      try {
        fs.writeFileSync(outputPath, text, 'utf-8');
        console.log(`    ✓  已保存: ${outputFileName}`);
        successCount++;
      } catch (error) {
        console.error(`    ❌ 保存失败: ${error.message}`);
        failCount++;
      }
    } else {
      failCount++;
    }
  }
  
  // 输出统计信息
  console.log(`\n处理完成！`);
  console.log(`  成功: ${successCount}`);
  console.log(`  失败: ${failCount}`);
  console.log(`  跳过: ${skipCount}`);
  console.log(`  总计: ${dayFiles.length}`);
}

// 运行主函数
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});

