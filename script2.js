/*
 *
 * Kinda janky
 * I'm going to switch to LogicJS
 *
 */

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

function removeDuplicates(arr) {
  return arr.filter((u, i) => i === arr.findIndex(v => ''+u === ''+v));
}

const UNKNOWN = -2;
const FLAG = -1;

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
    this.canvas = $('#rso > div:first-child > div > block-component > div > div.dG2XIf.Wnoohf.OJXvsb > div > div > div > div.ifM9O > div > div > div > div > div:nth-child(2) > g-lightbox > div > div.ynlwjd.VDgVie.qzMpzb.u98ib > div.AU64fe.zsYMMe.TUOsUe > span > div > canvas');
    this.context = this.canvas.getContext('2d', {willReadFrequently: true});
    this.difficulty = $('#ow36 > :first-child').textContent;
    let gameData = {
      Easy: [9, 8, 10],
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
  }
  getTile(x, y) {
    if (this.board[x][y] >= FLAG) return this.board[x][y];
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
  async autoMove() {
    let arr = [1, this.X, this.Y, this.mines, 1, 0, 0, 0];
    this.forAll((x, y) => {
      let tile = this.getTile(x, y);
      if (tile == UNKNOWN) arr.push(0, 0, 0);
      else if (tile == FLAG) arr.push(0, 0, 2);
      else if (tile >= 0) arr.push(tile, 0, 1);
      else console.error('Error identifying tile');
    })
    let url = 'https://cors-anywhere.azm.workers.dev/'
      +encodeURIComponent('https://www.logigames.com/minesweeper/requesthelp');
    let r = await fetch(url, {method: 'POST', body: JSON.stringify(arr)});
    let res = await r.json();
    for (let i = 0; i < res.length; i += 2) {
      let y = res[i]/this.X|0, x = res[i]%this.X;
      if (res[i+1] == 1) {
        board[x][y] = FLAG;
        continue;
      }
      clickTile(x, y, res[i+1]%2);
    }
  }
  async autoMoveRepeat(n) {
    if (n == 0) return;
    setTimeout(() => autoMoveRepeat(n-1), 50);
    await autoMove();
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
  getKnownNeighbors(x, y) {
    if (!this.hasTile(x, y) || this.getTile(x, y) != UNKNOWN) return [];
    const neighbors = [];
    this.for8(x, y, (i, j) => {
      if (this.getTile(i, j) >= 0) neighbors.push([i, j]);
    })
    return neighbors;
  }
  getGroups() {
    const vst = [];
    for (let x = 0; x < this.X; x++) {
      vst[x] = [];
    }
    const groups = [];
    this.forAll((x, y) => {
      const group = [];
      this.dfsGroup(x, y, group, vst);
      if (group.length) {
        groups.push(group);
      }
    })
    return groups;
  }
  dfsGroup(x, y, group, vst) {
    if (!this.getKnownNeighbors(x, y).length || vst[x][y]) return;
    vst[x][y] = 1;
    group.push([x, y]);
    this.for4(x, y, (i, j) => {
      this.dfsGroup(i, j, group, vst);
    });
  }
  clearTile(x, y) {
    let tile = this.getTile(x, y);
    let adjFlags = 0, adjUnknowns = 0;
    this.for8(x, y, (i, j) => {
      let adjTile = this.getTile(i, j);
      // console.log(`Clearing (${i}, ${j}) = ${adjTile}`);
      adjFlags += adjTile == FLAG;
      adjUnknowns += adjTile == UNKNOWN;
    })
    console.log('adjFlags', adjFlags);
    console.log('adjUnknowns', adjUnknowns);
    let res = false;
    if (adjFlags == tile) {
      // Clear tile
      this.for8(x, y, (i, j) => {
        if (this.getTile(i, j) != UNKNOWN) return;
        this.clickTile(i, j, 0);
        res = true;
      })
      return res;
    }
    if (adjFlags+adjUnknowns == tile) {
      console.log('Flagging...');
      // set adjUnknowns to flags
      this.for8(x, y, (i, j) => {
        if (this.getTile(i, j) != UNKNOWN) return;
        console.log(`Flagging (${i}, ${j})`);
        // this.clickTile(i, j, 1);
        this.board[i][j] = FLAG;
        res = true;
      })
    }
    return res;
  }
  solveRepeat(n) {
    if (n <= 0) return;
    this.solve();
    let flags = 0;
    this.forAll((x, y) => {
      flags += this.getTile(x, y) == FLAG;
    })
    if (flags == this.mines) return;
    setTimeout(() => this.solveRepeat(n-1), 500);
  }
  solve() {
    let flags = 0, unknowns = 0;
    let cleared = 0;
    this.forAll((x, y) => {
      let tile = this.getTile(x, y);
      flags += tile == FLAG;
      unknowns += tile == UNKNOWN;
      if (tile >= 0) cleared += this.clearTile(x, y);
    })
    if (cleared) return;
    
    console.log('flags=', flags);
    console.log('unknowns=', unknowns);
    console.log('SOLVING...')
    const mineBoard = [];
    this.forAll((x, y) => {
      if (y == 0) mineBoard[x] = [];
      mineBoard[x][y] = this.getTile(x, y) == FLAG ? 1 : 0;
    })
    console.log('Groups', this.getGroups())
    for (const group of this.getGroups()) {
      let knownNeighbors = [];
      for (const [x, y] of group) {
        knownNeighbors.push(...this.getKnownNeighbors(x, y));
      }
      knownNeighbors = removeDuplicates(knownNeighbors);
      let n = group.length;
      if (n > 15) continue;
      if (n == 2) console.log('knownNeighbors=', knownNeighbors);
      let possible = [[], []];
      for (let state = 0; state < (1<<n); state++) {
        if (!this.check(group, state, flags, unknowns, knownNeighbors, mineBoard)) {
          if (n == 2) console.log('Impossible:', state.toString(2))
          continue;
        }
        if (n == 2) console.log('Possible:', state.toString(2))
        for (let i = 0; state>>i; i++) {
          possible[(state>>i)&1][i] = 1;
        }
      }
      for (let i = 0; i < n; i++) {
        let empty = possible[0][i], mine = possible[1][i];
        if (empty+mine == 0) console.log('No possibilities');
        if (empty+mine > 1) continue;
        let [x, y] = group[i];
        if (empty) this.clickTile(x, y, 0);
        if (mine) this.board[x][y] = FLAG;
        // this.clickTile(x, y, 1-empty);
      }
    }
  }
  check(group, state, flags, unknowns, knownNeighbors, mineBoard) {
    let n = group.length;
    // let mines = 0;
    // for (let i = 0; state>>i; i++) {
    //   mines += (state>>i)&1;
    // }
    // let remainingMines = this.mines-flags;
    // if (mines > remainingMines) return false;
    // if (remainingMines-mines > unknowns-n) return false;
    
    for (let i = 0; state>>i; i++) {
      let [x, y] = group[i];
      if (mineBoard[x][y]) console.error('ERROR');
      mineBoard[x][y] = (state>>i)&1;
    }
    if (n == 2) console.log(mineBoard);
    let res = true;
    for (const [x, y] of knownNeighbors) {
      let rem = this.getTile(x, y);
      if (n == 2) console.log(`(${x}, ${y}) needs ${rem} mines`)
      this.for8(x, y, (i, j) => {
        if (mineBoard[i][j]&&n==2) console.log(`mine at (${i}, ${j})`);
        rem -= mineBoard[i][j];
      })
      if (n == 2) console.log(`(${x}, ${y}) has ${rem} mines after removing`)
      if (rem != 0) {
        res = false;
        break;
      }
    }
    for (const [x, y] of group) mineBoard[x][y] = 0;
    return res;
  }
}
(new Game()).solveRepeat(100)