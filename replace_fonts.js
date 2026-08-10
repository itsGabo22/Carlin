const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  if (file.includes('Header.tsx') || file.includes('MobileNav.tsx')) return;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('font-pacifico')) {
    content = content.replace(/font-pacifico/g, 'font-display');
    changed = true;
  }
  
  if (content.includes('font-inter')) {
    content = content.replace(/font-inter/g, 'font-sans');
    changed = true;
  }

  if (content.includes('font-nunito')) {
    // Replace font-nunito with font-sans everywhere
    // BUT we will leave headings as font-serif by using a regex replacement safely
    content = content.replace(/(<h[1-6][^>]*?)font-nunito([^>]*?>)/g, '$1font-serif$2');
    content = content.replace(/font-nunito/g, 'font-sans');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
