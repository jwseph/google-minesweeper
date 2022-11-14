/*
// jQuery
let jqScript = document.createElement('script');
jqScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild(jqScript);
*/

let canvas = $('#rso > div:nth-child(1) > div > block-component > div > div.dG2XIf.Wnoohf.OJXvsb > div > div > div > div.ifM9O > div > div > div > div > div:nth-child(2) > g-lightbox > div > div.ynlwjd.VDgVie.qzMpzb.u98ib > div.AU64fe.zsYMMe.TUOsUe > span > div > canvas');
let context = canvas.getContext('2d');
let difficulty = $('#ow36 > div.rIbAWc').textContent;
let width, height;
switch (difficulty) {
  case "Easy": width = 9, height = 8; break;
  case "Medium": width = 18, height = 14; break;
  case "Hard": width = 24, height = 20; break;
}
let size = canvas.width / width;


let COLOR_MAP = {
  '#aad751': -1,
  '#a2d149': -1,
  '#e5c29f': 0,
  '#d7b899': 0,
  '#1976d2': 1,
  '#398e3d': 2,
  '#d33030': 3,
  '#7b1fa2': 4,
}
function getTile(x, y) {
  let pixelData = [];
  pixelData[0] = context.getImageData((x+0.6)*size, (y+0.4)*size, 1, 1).data;
  pixelData[1] = context.getImageData((x+0.5)*size, (y+0.5)*size, 1, 1).data;
  for (const pixel of pixelData) {
    let hexColor = '#'+((pixel[0]<<16)+(pixel[1]<<8)+pixel[2]).toString(16).padStart(6, '0');
    if (hexColor in COLOR_MAP) return COLOR_MAP[hexColor];
  }
  console.error("ERROR GETTING TILE NUMBER");
  console.error(pixelData);
}

// unfinished
