import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = path.resolve("Classement WDT 2026.xlsx");
const outputDir = path.resolve(".tmp-wdt/renders");
await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,definedName,drawing",
  maxChars: 20000,
  tableMaxRows: 12,
  tableMaxCols: 16,
  tableMaxCellChars: 120,
});
console.log("WORKBOOK_SUMMARY");
console.log(summary.ndjson);

const sheets = workbook.worksheets.items;
for (let index = 0; index < sheets.length; index += 1) {
  const sheet = sheets[index];
  const used = sheet.getUsedRange();
  const usedAddress = used?.address ?? null;
  console.log(`SHEET ${index + 1}: ${sheet.name} USED ${usedAddress}`);

  if (usedAddress) {
    const region = await workbook.inspect({
      kind: "region",
      sheetId: sheet.name,
      range: usedAddress.includes("!") ? usedAddress.split("!").at(-1) : usedAddress,
      maxChars: 30000,
      tableMaxRows: 80,
      tableMaxCols: 30,
      tableMaxCellChars: 160,
    });
    console.log(region.ndjson);

    const formulas = await workbook.inspect({
      kind: "formula",
      sheetId: sheet.name,
      range: usedAddress.includes("!") ? usedAddress.split("!").at(-1) : usedAddress,
      maxChars: 30000,
      options: { maxResults: 1000 },
    });
    console.log(`FORMULAS ${sheet.name}`);
    console.log(formulas.ndjson);
  }

  const render = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const safeName = `${String(index + 1).padStart(2, "0")}-${sheet.name.replaceAll(/[^a-zA-Z0-9_-]+/g, "-")}.png`;
  await fs.writeFile(path.join(outputDir, safeName), new Uint8Array(await render.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
console.log("FORMULA_ERRORS");
console.log(errors.ndjson);
