# hyperscorebox
<a href="https://scrapbox.io/product">Scrapbox</a>上で自在に楽譜を書けるChrome拡張

<a href="https://chrome.google.com/webstore/detail/hyperscorebox/cjlhoobllhkpjjomlijlfdblgifcdmoh">インストール</a>

<a href="https://scrapbox.io/satakebox/hyperscorebox">つかいかた</a>

<img src="https://i.gyazo.com/2b81c8ae28acab054b68d8146c2fecef.gif">

### build
```
$ git clone git@github.com:stkay/hyperscorebox.git
$ cd hyperscorebox
$ npm i
$ npm run build
```

### install
1. 上記のビルド作業を行う
2. GoogleChromeで `chrome://extensions` を開く
3. 画面右上の `デベロッパーモード` と書かれたトグルスイッチをONにする
4. `パッケージ化されていない拡張機能を読み込む` をクリック
5. `hyperscorebox/dist` を選択

以後は更新ボタンを押すだけで拡張機能のリロードが可能になる。

参考
- <a href="https://scrapbox.io/satakebox/開発中のChromeExtensionを読み込む">開発中のChromeExtensionを読み込む</a>
