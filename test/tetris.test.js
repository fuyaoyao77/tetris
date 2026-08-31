'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const Tetris = require('../src/tetris.js');

test('createBoard 生成 20x10 空板', function () {
  const board = Tetris.createBoard();
  assert.strictEqual(board.length, 20);
  assert.strictEqual(board[0].length, 10);
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 10; c++) {
      assert.strictEqual(board[r][c], null);
    }
  }
});

test('spawnPiece 将方块放在顶部中央', function () {
  const piece = Tetris.spawnPiece('T');
  assert.strictEqual(piece.type, 'T');
  assert.strictEqual(piece.row, 0);
  // T 3x3，10 列 => (10-3)/2=3.5 => floor=3
  assert.strictEqual(piece.col, 3);
  assert.strictEqual(piece.rotation, 0);
});

test('getRotations 提供 O 方块单一旋转', function () {
  assert.strictEqual(Tetris.getRotations('O').length, 1);
  assert.strictEqual(Tetris.getRotations('T').length, 4);
});

test('空板无冲突', function () {
  const board = Tetris.createBoard();
  const piece = Tetris.spawnPiece('I');
  assert.strictEqual(Tetris.collides(board, piece), false);
});

test('超出左右边界算冲突', function () {
  const board = Tetris.createBoard();
  const piece = Tetris.spawnPiece('T');
  assert.strictEqual(Tetris.collides(board, piece, 0, -1), true);
  assert.strictEqual(Tetris.collides(board, piece, 0, 9), true);
});

test('move 向下移动成功，越界返回 null', function () {
  const board = Tetris.createBoard();
  const piece = Tetris.spawnPiece('T');
  const down = Tetris.move(board, piece, 1, 0);
  assert.ok(down);
  assert.strictEqual(down.row, 1);
  // 推到板底（19 行处）后无法再下移
  let p = piece;
  while (p) p = Tetris.move(board, p, 1, 0);
  assert.strictEqual(Tetris.move(board, { type: 'T', rotation: 0, row: 19, col: 3 }, 1, 0), null);
});

test('move 撞到已落方块返回 null', function () {
  const board = Tetris.createBoard();
  board[19][4] = 'O'; // 固定一个方块
  const piece = { type: 'T', rotation: 0, row: 17, col: 3 };
  const res = Tetris.move(board, piece, 2, 0);
  assert.strictEqual(res, null);
});

test('rotate 在空板可旋转，越界时踢墙', function () {
  const board = Tetris.createBoard();
  const piece = { type: 'T', rotation: 0, row: 5, col: 4 };
  const rotated = Tetris.rotate(board, piece, 1);
  assert.ok(rotated);
  assert.strictEqual(rotated.rotation, 1);
  // 靠近左墙的 I 方块旋转：col=0 处竖直后单列宽不越界，0 号候选合法即可
  const wallPiece = { type: 'I', rotation: 0, row: 5, col: 0 };
  const kicked = Tetris.rotate(board, wallPiece, 1);
  assert.ok(kicked);
  assert.strictEqual(Tetris.collides(board, kicked), false);
});

test('lockPiece 固定方块并消行', function () {
  const board = Tetris.createBoard();
  // 填充底部一行除第 4~7 列外的所有格子
  for (let c = 0; c < 10; c++) {
    if (c < 4 || c > 7) board[19][c] = 'O';
  }
  // I 方块实心行位于矩阵 index 1，放在 row=18 使实心格落在第 19 行
  const piece = { type: 'I', rotation: 0, row: 18, col: 4 }; // I 占 4,5,6,7
  const cleared = Tetris.lockPiece(board, piece);
  assert.strictEqual(cleared, 1);
  // 消行后所有行都被清空
  for (let c = 0; c < 10; c++) {
    assert.strictEqual(board[19][c], null);
  }
});

test('clearRows 清除满行并保持板尺寸', function () {
  const board = Tetris.createBoard();
  for (let c = 0; c < 10; c++) board[19][c] = 'O';
  board[18][0] = 'O'; // 18 行不满
  const cleared = Tetris.clearRows(board);
  assert.strictEqual(cleared, 1);
  assert.strictEqual(board.length, 20);
  assert.strictEqual(board[18][0], null);
});

test('scoreFor 计分正确', function () {
  assert.strictEqual(Tetris.scoreFor(0, 1), 0);
  assert.strictEqual(Tetris.scoreFor(1, 1), 100);
  assert.strictEqual(Tetris.scoreFor(2, 2), 600);
  assert.strictEqual(Tetris.scoreFor(4, 5), 4000);
});

test('isGameOver 出生点被占即结束', function () {
  const board = Tetris.createBoard();
  const piece = Tetris.spawnPiece('T');
  assert.strictEqual(Tetris.isGameOver(board, piece), false);
  // 顶部落满
  for (let c = 0; c < 10; c++) board[0][c] = 'O';
  assert.strictEqual(Tetris.isGameOver(board, piece), true);
});

test('nextFromBag 使用 7-bag 洗牌并耗尽后重新洗牌', function () {
  const bag = [];
  const first = Tetris.nextFromBag(bag, function () { return 0.5; });
  assert.strictEqual(first.bag.length, 6);
  assert.ok(first.type);
  const all = [first.type];
  let b = first.bag;
  for (let i = 0; i < 6; i++) {
    const next = Tetris.nextFromBag(b, function () { return 0.5; });
    all.push(next.type);
    b = next.bag;
  }
  // 一次 7-bag 内 7 种不重复
  assert.strictEqual(new Set(all).size, 7);
});
