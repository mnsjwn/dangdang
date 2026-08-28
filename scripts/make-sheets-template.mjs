// 당당 - Google Sheets용 엑셀 템플릿 생성기
//
//   node scripts/make-sheets-template.mjs
//
// backend/당당_시트템플릿.xlsx 를 만든다. 구글 드라이브에 업로드해서
// "연결 앱 > Google Spreadsheet"로 열면 Users/Stamps 시트가 그대로 만들어진다.
//
// 외부 라이브러리 없이 xlsx(=zip + xml)를 직접 쓴다. 압축은 하지 않고
// stored 방식으로만 넣기 때문에 zlib 없이도 유효한 파일이 나온다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SHEETS = [
  {
    name: "Users",
    rows: [
      ["nickname", "passwordHash", "weight", "height", "age", "joinedAt"],
    ],
  },
  {
    name: "Stamps",
    rows: [
      ["nickname", "date", "activityType", "minutes", "kcal", "totalGL", "dropPercent"],
    ],
  },
];

// ── xlsx XML ────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const colName = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; ) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

function sheetXml(rows) {
  const body = rows
    .map((cells, r) => {
      const cs = cells
        .map(
          (v, c) =>
            `<c r="${colName(c)}${r + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`
        )
        .join("");
      return `<row r="${r + 1}">${cs}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${SHEETS.map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("")}</Types>`,

  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,

  "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${SHEETS.map(
    (s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
  ).join("")}</sheets></workbook>`,

  "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${SHEETS.map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join("")}</Relationships>`,
};
SHEETS.forEach((s, i) => {
  files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s.rows);
});

// ── 최소 ZIP writer (stored, 무압축) ─────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, "utf8");
    const data = Buffer.from(content, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // 로컬 헤더 시그니처
    local.writeUInt16LE(20, 4); // 필요 버전
    local.writeUInt16LE(0x0800, 6); // UTF-8 파일명 플래그
    local.writeUInt16LE(0, 8); // 압축 방식: stored
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // 중앙 디렉터리 시그니처
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // EOCD 시그니처
  end.writeUInt16LE(centrals.length, 8);
  end.writeUInt16LE(centrals.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuf, end]);
}

const out = path.join(ROOT, "backend/당당_시트템플릿.xlsx");
fs.writeFileSync(out, zip(files));
console.log("생성:", path.relative(ROOT, out));
SHEETS.forEach((s) => console.log(`  [${s.name}] ${s.rows[0].join(", ")}`));
