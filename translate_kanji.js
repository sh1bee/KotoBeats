const fs = require('fs');
const translate = require('google-translate-api-x');

const INPUT_FILE = 'assets/dictionary/kanji_jlpt_only.json';
const OUTPUT_FILE = 'assets/dictionary/kanji_vi.json';

const raw = fs.readFileSync(INPUT_FILE, 'utf8');
const kanjiData = JSON.parse(raw);
const kanjiList = Object.entries(kanjiData);
const total = kanjiList.length;
let processed = 0;

async function main() {
  const result = {};

  for (let i = 0; i < kanjiList.length; i++) {
    const [kanji, entry] = kanjiList[i];
    try {
      const textToTranslate = entry.meanings.join(', ');
      const res = await translate(textToTranslate, { from: 'en', to: 'vi' });
      const viText = res.text;
      const viMeanings = viText.split(',').map(s => s.trim());

      result[kanji] = {
        ...entry,
        meanings_vi: viMeanings.length === entry.meanings.length ? viMeanings : [viText],
      };
      processed++;
      console.log(`[${processed}/${total}] ${kanji} ✅`);
    } catch (err) {
      console.error(`[${i + 1}/${total}] ${kanji} ❌ ${err.message}`);
      result[kanji] = {
        ...entry,
        meanings_vi: entry.meanings,
      };
    }

    if (processed % 100 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
      console.log(`💾 Đã lưu tạm sau ${processed} từ.`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
  console.log(`🎉 Hoàn thành! Đã xử lý ${processed}/${total} Kanji.`);
}

main().catch(console.error);