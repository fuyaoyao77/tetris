# 俄罗斯方块（Tetris）

经典俄罗斯方块，纯 JavaScript + Canvas 实现，零依赖。包含单元测试与 GitHub Actions CI。

特性：7-bag 随机出块、简单踢墙旋转、影子硬降预览、下一块预览、等级加速、计分/消行统计、暂停/重开。

## 运行

直接用浏览器打开 `index.html` 即可，无需构建。

## 操作

| 按键 | 功能 |
|------|------|
| `←` / `→` | 左右移动 |
| `↑` | 旋转 |
| `↓` | 加速下落 |
| `空格` | 硬降 |
| `P` | 暂停 |
| `Enter` / `空格`（结束页） | 开始 / 再来一局 |

## 开发

```bash
npm ci          # 安装开发依赖
npm run check   # 语法检查 + ESLint + 单元测试
```

- 核心逻辑：[src/tetris.js](src/tetris.js)（UMD，浏览器/Node 双端）
- 单元测试：[test/tetris.test.js](test/tetris.test.js)
- 界面：[index.html](index.html)
