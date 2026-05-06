const fs = require('fs');
let content = fs.readFileSync('src/utils/exportExcel.js', 'utf8');

// Replace column width definitions
content = content.replace("sheet.getColumn(15).width = 3 // O\n    sheet.getColumn(16).width = 13 // P", "sheet.getColumn(15).width = 13 // O");

// Replace mergeCells
content = content.replace("`A${rowNum}:P${rowNum}`", "`A${rowNum}:O${rowNum}`");

// Replace column 16 accesses to 15, except where it's for font size
content = content.replace(/sheet\.getCell\(rowNum, 16\)/g, "sheet.getCell(rowNum, 15)");

// Replace i <= 16 to i <= 15
content = content.replace(/i <= 16/g, "i <= 15");

// Replace P string formulas to O
content = content.replace(/`SUM\(P/g, "`SUM(O");
content = content.replace(/:P\$\{/g, ":O${");
content = content.replace(/=> \`P\$\{r\}\`/g, "=> `O${r}`");
content = content.replace(/\`P\$\{incomeTotalRowIndex\}-P\$\{totExpRowIndex\}\`/g, "`O${incomeTotalRowIndex}-O${totExpRowIndex}`");

// Replace conditional formatting ref
content = content.replace(/:P\$\{rowNum\}/g, ":O${rowNum}");

// Replace cell variable names for consistency (optional but good)
content = content.replace(/cellP/g, "cellO");
content = content.replace(/incTotalP/g, "incTotalO");
content = content.replace(/catTotalP/g, "catTotalO");
content = content.replace(/totExpP/g, "totExpO");
content = content.replace(/cashP/g, "cashO");

// Also replace i === 15 continue in loops
content = content.replace(/i === 2 \|\| i === 15/g, "i === 2");

fs.writeFileSync('src/utils/exportExcel.js', content);
