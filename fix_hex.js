const fs = require('fs');

let cat = fs.readFileSync('src/components/marketing/CategoryBar.tsx', 'utf8');
cat = cat.replace(/#FFBDE1/g, 'var(--color-brand-pink-light)');
cat = cat.replace(/#FB9CD0/g, 'var(--color-brand-pink)');
cat = cat.replace(/#DB2777/g, 'var(--color-brand-pink-dark)');
cat = cat.replace(/#FFF0F7/g, 'var(--color-brand-cream)');
cat = cat.replace(/#E879F9/g, 'var(--color-brand-distributor)');
cat = cat.replace(/#FBCFE8/g, 'var(--color-brand-pink-light)');
cat = cat.replace(/#FCE7F3/g, 'var(--color-brand-cream)');
fs.writeFileSync('src/components/marketing/CategoryBar.tsx', cat, 'utf8');

let hero = fs.readFileSync('src/components/marketing/HeroSection.tsx', 'utf8');
// 'linear-gradient(135deg, #FFC8E3 0%, #FB9CD0 40%, #E05FA0 75%, #B5179E 100%)'
// 'radial-gradient(circle, #FFBDE1 0%, transparent 70%)'
hero = hero.replace(/#FFC8E3/g, '#FDECF5'); // Light pink/cream
hero = hero.replace(/#FB9CD0/g, '#F0A0C6'); // Primary pink
hero = hero.replace(/#E05FA0/g, '#E58EC7'); // Dark pink
hero = hero.replace(/#B5179E/g, '#9081DC'); // Distributor dark / purple
hero = hero.replace(/#FFBDE1/g, '#FFBBEC'); // Pink light
fs.writeFileSync('src/components/marketing/HeroSection.tsx', hero, 'utf8');
