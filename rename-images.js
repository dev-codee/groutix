
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const imageExtensions = ['.jpeg', '.jpg', '.png', '.avif'];

// List all files in public dir
const files = fs.readdirSync(publicDir).filter((file) => {
  const ext = path.extname(file).toLowerCase();
  return imageExtensions.includes(ext);
});

// Sort files to have a consistent order
files.sort();

console.log('Renaming files:');
const renameMap = [];

let index = 1;
for (const file of files) {
  const ext = path.extname(file);
  const newName = `img${index}${ext}`;
  const oldPath = path.join(publicDir, file);
  const newPath = path.join(publicDir, newName);
  
  // Check if new name already exists
  if (fs.existsSync(newPath)) {
    console.log(`Skipping ${file} - ${newName} already exists`);
  } else {
    fs.renameSync(oldPath, newPath);
    console.log(`${file} → ${newName}`);
    renameMap.push({ old: `/${file}`, new: `/${newName}` });
  }
  
  index++;
}

console.log('\nRename map:');
console.log(renameMap);
