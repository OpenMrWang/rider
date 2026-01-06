import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将 public/everyday 下的每日 JSON 合并为一个类似 sample-data.json 的结构
 * - 保留原始 JSON 中的所有字段（多余信息不会丢失）
 * - 输出结构：{ meta, days: [...] }
 */
async function main() {
  const everydayDir = path.join(__dirname, '../public/everyday');
  const clueDir = path.join(__dirname, '../public/everyday-clue');
  const outputPath = path.join(__dirname, '../public/everyday-merged.json');

  if (!fs.existsSync(everydayDir)) {
    console.error(`目录不存在: ${everydayDir}`);
    process.exit(1);
  }

  const hasClueDir = fs.existsSync(clueDir);
  if (!hasClueDir) {
    console.warn(`提示: 未找到对应线索目录: ${clueDir}，将仅合并每日 JSON 而不附加 clue。`);
  }

  const files = fs.readdirSync(everydayDir)
    .filter(f => f.endsWith('.json'))
    .sort(); // 使用文件名排序，dayXXX_ 前缀会让顺序基本正确

  console.log(`找到 ${files.length} 个每日 JSON 文件，将合并为一个文件: ${outputPath}`);

  const days = [];

  /**
   * 读取对应的 clue 文本，并去掉开头的“旅行骑行线索提取”和紧随其后的空行
   * @param {string} baseName - 如 day050_2025-10-02_第五十天：爬黄山看日出！.json 的文件名
   */
  function getClueForDay(baseName) {
    if (!hasClueDir) return null;

    const txtName = baseName.replace(/\.json$/i, '.txt');
    const cluePath = path.join(clueDir, txtName);

    if (!fs.existsSync(cluePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(cluePath, 'utf-8');
      const lines = raw.split(/\r?\n/);

      let startIndex = 0;
      if (lines[0] && lines[0].trim() === '旅行骑行线索提取') {
        startIndex = 1;
        if (lines[1] !== undefined && lines[1].trim() === '') {
          startIndex = 2;
        }
      }

      const cleaned = lines.slice(startIndex).join('\n').trim();
      return cleaned || null;
    } catch (err) {
      console.warn(`  ⚠  读取 clue 失败 (${txtName}): ${err.message}`);
      return null;
    }
  }

  for (const file of files) {
    const fullPath = path.join(everydayDir, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const json = JSON.parse(raw);

      // 如果存在对应的 clue 文本，挂到 json.clue 字段上
      const clueText = getClueForDay(file);
      if (clueText) {
        json.clue = clueText;
      }

      // 直接把整个对象 push 到 days 中，保留所有字段
      days.push(json);
      console.log(`  ✓ 已合并: ${file}`);
    } catch (err) {
      console.error(`  ❌ 解析失败: ${file} - ${err.message}`);
    }
  }

  // 顶层 meta：简单给一个通用描述，也可以之后手动编辑
  const merged = {
    meta: {
      title: '王师傅骑行 · 每日记录合并',
      author: '王师傅',
      description: '从 public/everyday 下的每日 JSON 自动合并生成的数据文件，可直接用于应用或继续编辑',
    },
    days,
  };

  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`\n已生成合并文件: ${outputPath}`);
}

main().catch((err) => {
  console.error('脚本执行出错:', err);
  process.exit(1);
});


