# TikZ 描画サンプル

本プラグインでは、`tikz` コードブロックを用いて TikZ によるダイアグラムやグラフをベクター画像(SVG)として PDF に埋め込むことができます。ローカル TeX 環境または [tex-tikz-server](https://github.com/MI-1222/tex-tikz-server) によるリモートレンダリングに対応しています。

## 1. 2D 幾何図形

```tikz
\begin{tikzpicture}
  \draw[thick, fill=blue!20] (0,0) circle (1.5cm);
  \draw[thick, fill=red!20] (2,0) rectangle (4,2);
  \draw[thick, fill=green!20] (1, -1) -- (2, 1) -- (3, -1) -- cycle;
  \node at (0, 0) {円};
  \node at (3, 1) {四角形};
  \node at (2, -0.5) {三角形};
\end{tikzpicture}
```

## 2. 関数グラフ (pgfplots)

```tikz
\begin{tikzpicture}
  \begin{axis}[
    xlabel={$x$},
    ylabel={$y = \sin(x)$},
    grid=both,
    domain=-3.14:3.14,
    samples=100,
    width=10cm,
    height=6cm
  ]
    \addplot[blue, thick] {sin(deg(x))};
  \end{axis}
\end{tikzpicture}
```

## 3. フロー図・ノードグラフ

```tikz
\begin{tikzpicture}[node distance=2cm, auto, >=stealth]
  \node[circle, draw=blue!70, fill=blue!10, thick] (start) {開始};
  \node[rectangle, draw=green!70, fill=green!10, thick, right of=start, xshift=1cm] (proc) {処理実行};
  \node[circle, draw=red!70, fill=red!10, thick, right of=proc, xshift=1cm] (end) {終了};

  \draw[->, thick] (start) -- node {入力} (proc);
  \draw[->, thick] (proc) -- node {完了} (end);
\end{tikzpicture}
```
