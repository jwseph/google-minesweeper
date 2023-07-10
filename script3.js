(function () {

const select = _ => document.querySelector(_);

class FakeMouseEvent extends MouseEvent {
  constructor(type, values) {
    const { offsetX, offsetY, ...mouseValues } = values;
    super(type, (mouseValues));
    this._offsetX = offsetX;
    this._offsetY = offsetY;
  }
  get offsetX() { return this._offsetX ?? super.offsetX; }
  get offsetY() { return this._offsetY ?? super.offsetY; }
}

function choose(n, k) {
  const res = [];
  for (let state = 0; state < (1<<n); state++) {
    const arr = [];
    let c = 0;
    for (let i = 0; i < n && c <= k; i++) {
      let x = state>>i&1;
      arr.push(x);
      c += x;
    }
    if (c != k) continue;
    res.push(arr);
  }
  return res;
}

const UNKNOWN = -2, FLAG = -1;

class Game {
  static COLOR_MAP = {
    '#aad751': UNKNOWN,
    '#a2d149': UNKNOWN,
    '#f23607': FLAG,
    '#e63307': FLAG,
    '#e5c29f': 0,
    '#d7b899': 0,
    '#1976d2': 1,
    '#388e3c': 2,
    '#d32f2f': 3,
    '#7b1fa2': 4,
    '#ff8f00': 5,
  }
  constructor() {
    this.canvas = select('#rso > div:first-child > div > block-component > div > div.dG2XIf.Wnoohf.OJXvsb > div > div > div > div.ifM9O > div > div > div > div > div:nth-child(2) > g-lightbox > div > div.ynlwjd.VDgVie.qzMpzb.u98ib > div.AU64fe.zsYMMe.TUOsUe > span > div > canvas');
    this.context = this.canvas.getContext('2d', {willReadFrequently: true});
    this.difficulty = select('#ow36 > :first-child').textContent;
    let gameData = {
      Easy: [10, 8, 10],
      Medium: [18, 14, 40],
      Hard: [24, 20, 99],
    };
    [this.X, this.Y, this.mines] = gameData[this.difficulty];
    this.size = this.canvas.width / this.X;
    this.board = [];
    for (let x = 0; x < this.X; x++) {
      this.board[x] = [];
      for (let y = 0; y < this.Y; y++) this.board[x][y] = UNKNOWN;
    }
    this.unsolved = this.X*this.Y;
  }
  getTile(x, y) {
    if (this.board[x][y] == FLAG || this.board[x][y] > 0) return this.board[x][y];
    // if (this.board[x][y] >= 0 || this.board[x][y] == FLAG) return this.board[x][y];
    let relativePositions = [[.6, .4], [.5, .5], [.6, .6], [.5, .58], [.5, .3]];
    let pixelData = [];
    for (const [dx, dy] of relativePositions) {
      pixelData.push(this.context.getImageData((x+dx)*this.size, (y+dy)*this.size, 1, 1).data);
    }
    let hexColors = [];
    for (let i = 0; i < pixelData.length; i++) {
      let [r, g, b] = pixelData[i];
      hexColors[i] = '#'+((r<<16)+(g<<8)+b).toString(16).padStart(6, '0');
    }
    for (const hexColor of hexColors) {
      if (!(hexColor in Game.COLOR_MAP)) continue;
      this.board[x][y] = Math.max(this.board[x][y], Game.COLOR_MAP[hexColor]);
    }
    return this.board[x][y];
  }
  clickTile(x, y, flag) {
    let values = {
      offsetX: (x+.5)*this.size,
      offsetY: (y+.5)*this.size,
      bubbles: true,
    };
    if (flag) {
      values = {...values, button: 2, which: 3};
    }
    this.canvas.dispatchEvent(new FakeMouseEvent('mousedown', values));
    this.canvas.dispatchEvent(new FakeMouseEvent('mouseup', values));
  }
  print() {
    for (let y = 0; y < this.Y; y++) {
      let row = [];
      for (let x = 0; x < this.X; x++) {
        let cur = this.getTile(x, y)+'';
        // if (cur == '-2') cur = '. ';
        // if (cur == '-1') cur = 'F ';
        if (cur.length < 2) cur = ' '+cur;
        if (cur.length > 2) cur = '??';
        row.push(cur);
      }
      console.log(row.join('  '));
    }
  }
  hasTile(x, y) {
    return 0 <= x && x < this.X && 0 <= y && y < this.Y;
  }
  for4(x, y, fn) {
    for (let [i, j] of [[x-1, y], [x+1, y], [x, y-1], [x, y+1]]) {
      if (!this.hasTile(i, j)) continue;
      fn(i, j);
    }
  }
  for8(x, y, fn) {
    for (let i = x-1; i <= x+1; i++) {
      for (let j = y-1; j <= y+1; j++) {
        if (!this.hasTile(i, j) || i == x && j == y) continue;
        fn(i, j);
      }
    }
  }
  forAll(fn) {
    for (let y = 0; y < this.Y; y++) {
      for (let x = 0; x < this.X; x++) {
        fn(x, y);
      }
    }
  }
  solve() {
    // Source: https://dev.to/krlove/creating-advanced-minesweeper-solver-using-logic-programming-2ppd
    console.log('[Minesweeper] Solving...')
    const unknownMap = new Map();
    const ruleArgs = [];
    this.forAll((x, y) => {
      let tile = this.getTile(x, y);
      if (tile < 0) return;
      const unknownNeighbors = [];
      let adjFlags = 0;
      this.for8(x, y, (i, j) => {
        let adjTile = this.getTile(i, j);
        adjFlags += adjTile == FLAG;
        if (adjTile == FLAG || adjTile >= 0) return;
        let key = i+','+j;
        if (!unknownMap.has(key)) {
          unknownMap.set(key, logic.lvar([i, j]));
        }
        unknownNeighbors.push(unknownMap.get(key));
      })
      if (!unknownNeighbors.length) return;
      const orArgs = [];
      for (const comb of choose(unknownNeighbors.length, tile-adjFlags)) {
        const andArgs = [];
        for (const [i, isMine] of comb.entries()) {
          andArgs.push(logic.eq(unknownNeighbors[i], isMine));
        }
        orArgs.push(logic.and(...andArgs));
      }
      ruleArgs.push(logic.or(...orArgs));
    })
    const rule = logic.and(...ruleArgs);
    const unknown = Array.from(unknownMap.values());
    
    const probabilities = logic.run(rule, unknown);
    for (let i = 0; i < unknown.length; i++) {
      let [x, y] = unknown[i].name;
      let mine = 0, total = 0;
      for (let j = 0; j < probabilities.length; j++) {
        mine += probabilities[j][i];
        total++;
      }
      if (mine == 0) {
        this.clickTile(x, y, 0)
        this.unsolved -= 1;
      }
      if (mine == total) {
        this.board[x][y] = FLAG;
        this.unsolved -= 1;
        this.bombs -= 1;
        this.clickTile(x, y, 1)
      }
    }
  }
  updateTiles() {
    this.forAll((x, y) => this.getTile(x, y))
  }
  solveUntilDone() {
    if (this.bombs == 0) {
      this.forAll((x, y) => {
        if (this.getTile(x, y) != UNKNOWN) return;
        this.clickTile(x, y, 0);
        this.unsolved -= 1;
      })
    }
    if (this.unsolved == 0) return;
    if (select('#Qwh28e').style.visibility != 'hidden') return;
    this.solve();
    setTimeout(() => this.solveUntilDone(), 800);
    for (let t = 400; t < 1000; t += 50) {
      setTimeout(() => this.updateTiles(), t);
    }
  }
}

// LogicJS
let script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/mcsoto/LogicJS/logic.js';
select('head').appendChild(script);
script.addEventListener('load', () => {
  new Game().solveUntilDone();
})

})();