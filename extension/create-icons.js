const fs = require('fs');
const path = require('path');

// Base64 encoded PNG icons (pink/magenta colored squares)
// These are valid PNG files that will work as extension icons

// 16x16 pink icon
const icon16 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVQ4T2P8z8Dwn4EKgHHUAIbRMGBgGDAXDA4fDGkXDJhXBgdwGGgvDLQXBtocM9AOGbAwoCYAAF1FCwF/CvmYAAAAAElFTkSuQmCC';

// 32x32 pink icon  
const icon32 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVRYR+3WsQ0AIAwDwez/aJgAiYZQULj6yif5bNt2W57H4/nTAIABAgQIECBAgAABAgQIECBAgMD/Ay7wFQEBzY6gYwAAAABJRU5ErkJggg==';

// 48x48 pink icon
const icon48 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAARklEQVRoQ+3WoQ0AIBDAwPb/pzOBCcEgCurmUvHJZdu2yz4f9+M/CgggQIAAAQIECBAgQIAAAQIECBAgQIDA/wMukAIBhAV0MDHQEQAAAABJRU5ErkJggg==';

// 128x128 pink icon
const icon128 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAU0lEQVR42u3BMQEAAADCoPVP7W0HoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeA0+eAABcrJ+qQAAAABJRU5ErkJggg==';

const assetsDir = path.join(__dirname, 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'icon16.png'), Buffer.from(icon16, 'base64'));
fs.writeFileSync(path.join(assetsDir, 'icon32.png'), Buffer.from(icon32, 'base64'));
fs.writeFileSync(path.join(assetsDir, 'icon48.png'), Buffer.from(icon48, 'base64'));
fs.writeFileSync(path.join(assetsDir, 'icon128.png'), Buffer.from(icon128, 'base64'));

console.log('Icons created successfully!');
