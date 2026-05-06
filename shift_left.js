const fs = require('fs');
let content = fs.readFileSync('src/utils/exportExcel.js', 'utf8');

// 1. Column widths
content = content.replace("sheet.getColumn(2).width = 4  // B\n    for (let i = 3; i <= 14; i++) sheet.getColumn(i).width = 10 // C-N\n    sheet.getColumn(15).width = 13 // O", "for (let i = 2; i <= 13; i++) sheet.getColumn(i).width = 10 // B-M\n    sheet.getColumn(14).width = 13 // N");

// 2. xSplit
content = content.replace("xSplit: 2", "xSplit: 1");
content = content.replace("Freeze A:B", "Freeze A");

// 3. i + 3 to i + 2
content = content.replace(/i \+ 3/g, "i + 2");

// 4. fromCharCode(67 + i) to fromCharCode(66 + i)  (C to B)
content = content.replace(/67 \+ i/g, "66 + i");

// 5. C:N to B:M in formulas
content = content.replace(/C\$\{rowNum\}:N\$\{rowNum\}/g, "B${rowNum}:M${rowNum}");

// 6. O to N for the total column
content = content.replace(/sheet\.getCell\(rowNum, 15\)/g, "sheet.getCell(rowNum, 14)");
content = content.replace(/i <= 15/g, "i <= 14");
content = content.replace(/`SUM\(O/g, "`SUM(N");
content = content.replace(/:O\$\{/g, ":N${");
content = content.replace(/=> \`O\$\{r\}\`/g, "=> `N${r}`");
content = content.replace(/\`O\$\{incomeTotalRowIndex\}-O\$\{totExpRowIndex\}\`/g, "`N${incomeTotalRowIndex}-N${totExpRowIndex}`");
content = content.replace(/A\$\{rowNum\}:O\$\{rowNum\}/g, "A${rowNum}:N${rowNum}");
content = content.replace(/C\$\{rowNum\}:O\$\{rowNum\}/g, "B${rowNum}:N${rowNum}");

// Variable renames (optional but good)
content = content.replace(/cellO/g, "cellN");
content = content.replace(/incTotalO/g, "incTotalN");
content = content.replace(/catTotalO/g, "catTotalN");
content = content.replace(/totExpO/g, "totExpN");
content = content.replace(/cashO/g, "cashN");

// Remove the REVENUE label in row 4 since it's just clutter anyway
content = content.replace(/\/\/ Row 4: REVENUE label\n    const revCell = sheet\.getCell\(`B\$\{rowNum\}`\)\n    revCell\.value = 'REVENUE'\n    applyFont\(revCell, COLORS\.TEXT_DARK, 10, true\)\n    rowNum\+\+/g, "// Row 4: empty\n    rowNum++");

fs.writeFileSync('src/utils/exportExcel.js', content);
