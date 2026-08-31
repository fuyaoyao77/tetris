/**
 * 俄罗斯方块（Tetris）核心逻辑模块
 * 与 DOM 无关，可在浏览器（window.Tetris）与 Node（require）中运行
 * 格式：UMD
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Tetris = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /** 游戏板尺寸 */
  const COLS = 10;
  const ROWS = 20;

  /** 7 种标准方块：每种含多个旋转状态（矩阵），0 为空 1 为实心 */
  const SHAPES = {
    I: [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
      [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
    ],
    O: [
      [[1, 1], [1, 1]]
    ],
    T: [
      [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ],
    S: [
      [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
      [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
      [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
    ],
    Z: [
      [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
      [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
    ],
    J: [
      [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
      [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
    ],
    L: [
      [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
      [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
      [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
    ]
  };

  /** 方块颜色映射 */
  const COLORS = {
    I: '#00bcd4', O: '#ffeb3b', T: '#9c27b0',
    S: '#4caf50', Z: '#f44336', J: '#2196f3', L: '#ff9800'
  };

  /**
   * 创建一个空游戏板
   * @returns {Array<Array<string|null>>} COLS x ROWS，存方块类型或 null
   */
  function createBoard() {
    const board = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(null);
      board.push(row);
    }
    return board;
  }

  /** 获取指定方块类型的旋转矩阵列表 */
  function getRotations(type) {
    return SHAPES[type];
  }

  /**
   * 生成一个新方块（位于顶部中央）
   * @param {string} type 方块类型
   * @returns {Object} { type, rotation, row, col }
   */
  function spawnPiece(type) {
    const matrix = SHAPES[type][0];
    const col = Math.floor((COLS - matrix[0].length) / 2);
    return { type: type, rotation: 0, row: 0, col: col };
  }

  /** 获取方块当前旋转矩阵 */
  function getMatrix(piece) {
    return SHAPES[piece.type][piece.rotation];
  }

  /**
   * 判断方块在给定位置是否与边界/已落方块冲突
   * @param {Array} board 游戏板
   * @param {Object} piece 方块
   * @param {number} [row] 可选覆盖行
   * @param {number} [col] 可选覆盖列
   * @returns {boolean} 冲突为 true
   */
  function collides(board, piece, row, col) {
    const r = (row === undefined) ? piece.row : row;
    const c = (col === undefined) ? piece.col : col;
    const matrix = getMatrix(piece);
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (!matrix[i][j]) continue;
        const br = r + i;
        const bc = c + j;
        if (bc < 0 || bc >= COLS || br >= ROWS) return true;
        if (br >= 0 && board[br][bc]) return true;
      }
    }
    return false;
  }

  /**
   * 尝试移动方块
   * @returns {Object|null} 移动后的新方块对象（或 null 若不能移动）
   */
  function move(board, piece, dr, dc) {
    const next = { type: piece.type, rotation: piece.rotation, row: piece.row + dr, col: piece.col + dc };
    if (collides(board, next)) return null;
    return next;
  }

  /**
   * 尝试旋转方块（带简单踢墙：向左或向右微移一次）
   * @param {number} dir 1 顺时针 -1 逆时针
   * @returns {Object|null} 旋转后的新方块对象（或 null 若不能旋转）
   */
  function rotate(board, piece, dir) {
    const rotations = SHAPES[piece.type];
    const nextRot = (piece.rotation + dir + rotations.length) % rotations.length;
    const base = { type: piece.type, rotation: nextRot, row: piece.row, col: piece.col };
    // 尝试偏移 [0, -1, 1, -2, 2] 踢墙
    const kicks = [0, -1, 1, -2, 2];
    for (let k = 0; k < kicks.length; k++) {
      const candidate = { type: base.type, rotation: base.rotation, row: base.row, col: base.col + kicks[k] };
      if (!collides(board, candidate)) return candidate;
    }
    return null;
  }

  /**
   * 判断方块能否继续下落（用于自动下落判定）
   */
  function canDrop(board, piece) {
    return move(board, piece, 1, 0) !== null;
  }

  /**
   * 将方块固定到游戏板，返回消行数量
   * @returns {number} 消掉的行数（0-4）
   */
  function lockPiece(board, piece) {
    const matrix = getMatrix(piece);
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (!matrix[i][j]) continue;
        const br = piece.row + i;
        const bc = piece.col + j;
        if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS) {
          board[br][bc] = piece.type;
        }
      }
    }
    return clearRows(board);
  }

  /**
   * 清除已满行，返回清除行数
   * @returns {number}
   */
  function clearRows(board) {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(function (cell) { return cell !== null; })) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++; // 重查当前索引（因为 splice 后行上移）
      }
    }
    return cleared;
  }

  /**
   * 计分规则：按一次消除行数计分，并乘以等级
   * @param {number} lines 一次消除行数
   * @param {number} level 当前等级
   * @returns {number} 获得分数
   */
  function scoreFor(lines, level) {
    const base = [0, 100, 300, 500, 800];
    return base[lines] * level;
  }

  /**
   * 判断是否游戏结束：新方块出生点即冲突
   */
  function isGameOver(board, piece) {
    return collides(board, piece);
  }

  /**
   * 7-bag 随机：返回下一个方块的类型（洗牌后的顺序）
   * @param {Array} bag 当前待发方块池（可传空数组以重新洗牌）
   * @returns {Object} { type, bag }
   */
  function nextFromBag(bag, rng) {
    const random = rng || Math.random;
    const current = bag.slice();
    if (current.length === 0) {
      const keys = Object.keys(SHAPES);
      for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = keys[i];
        keys[i] = keys[j];
        keys[j] = tmp;
      }
      current.push.apply(current, keys);
    }
    return { type: current.shift(), bag: current };
  }

  return {
    COLS: COLS,
    ROWS: ROWS,
    SHAPES: SHAPES,
    COLORS: COLORS,
    createBoard: createBoard,
    getRotations: getRotations,
    spawnPiece: spawnPiece,
    getMatrix: getMatrix,
    collides: collides,
    move: move,
    rotate: rotate,
    canDrop: canDrop,
    lockPiece: lockPiece,
    clearRows: clearRows,
    scoreFor: scoreFor,
    isGameOver: isGameOver,
    nextFromBag: nextFromBag
  };
});
