# Google Minesweeper Bot

This bot solves the Google Minesweeper game!

## Usage

1. To get started, search "minesweeper" on Google and hit play.
2. Open Developer Tools (`F12` or `Ctrl + Shift + I`)
3. Click on the `Console` tab at the top of the Developer Tools panel.
4. Start the game by clicking anywhere on the board.
5. Paste the following code into the console:
```js
$('head').appendChild(document.createElement('script')).src='https://cdn.jsdelivr.net/gh/jwseph/google-minesweeper/script3.js'
```
6. If the bot gets stuck, it usually means you have to make a guess. The bot will resume after you guess.

## How it works

The bot reads the board using the RGB color data of certain pixels of each cell. Each of the numbers has a unique color.

The reason for the delays is the light-green particle effects (that appear when revealing cells), which interfere with color detection. I tried to make the delay as low as I could, so color detection may occasionally fail.

The solver itself relies on LogicJS, which provides logic programming support for JavaScript.
