# babel-plugin-transform-jsx-wxml

Turn [JSX](http://facebook.github.io/jsx/) to [WXML（WeiXin Markup Language）](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/)

## Requirement

This plugin requires a minimum of Node v6.9 and Babel v7.x.

## Usage

### Babel Configuration

```json
{
  "plugins": ["babel-plugin-transform-jsx-wxml"]
}
```

### Node API

```js
const babel = require('@babel/core');
const plugin = require('babel-plugin-transform-jsx-wxml');

const source = `
const array = ['1', '2', '3'];
<View>
  {state.flag && <MyButton>Click Me</MyButton>}
  
  {['a', 'b', 'c', 1, 2].map((it, idx) => (<Body1>{it}</Body1>))}
  
  {array.map((it, idx) => <Image lazyLoad>{it}</Image>)}      
</View>
`;
const options = {};
const { code } = babel.transform(source, {
  plugins: [[plugin, options]],
});
console.log(code);
```

### Options

| option             |  type  | required |                  default | description                                          |
| :----------------- | :----: | :------: | -----------------------: | :--------------------------------------------------- |
| namespace          | string |    N     |                     `wx` | directive prefix                                     |
| tagNameLetterCase  | string |    N     |                  `kebab` | tern `<MyButton/>` to `<my-button/>`                 |
| attrNameLetterCase | string |    N     |                  `kebab` | tern `<Image lazyLoad/>` to `<image lazy-load/>`     |
| delimiterStart     | string |    N     |                     `{{` | beginning delimiter for escaped locals or expression |
| delimiterEnd       | string |    N     |                     `}}` | ending delimiter for escaped locals or expression    |
| directiveIf        | string |    N     |        `${namespace}:if` | conditional directive                                |
| directiveFor       | string |    N     |       `${namespace}:for` | loop directive                                       |
| directiveForIndex  | string |    N     | `${namespace}:for-index` | loop directive                                       |
| directiveForItem   | string |    N     |  `${namespace}:for-item` | loop directive                                       |

### Example

JSX source code:

```jsx
const array = ['1', '2', '3'];
<View>
  {state.flag && <MyButton>Click Me</MyButton>}

  {['a', 'b', 'c', 1, 2].map((it, idx) => <Body1>{it}</Body1>)}

  {array.map((it, idx) => <Image lazyLoad>{it}</Image>)}
</View>;
```

Result snapshot :

```text
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`should tern jsx to wxml 1`] = `
"const array = ['1', '2', '3'];
<view>
  <my-button wx:if=\\"{{state.flag}}\\">Click Me</my-button>

  <body1 wx:for=\\"{{['a','b','c',1,2]}}\\" wx:for-item=\\"{{it}}\\" wx:for-index=\\"{{idx}}\\">{{it}}</body1>

  <image lazy-load wx:for=\\"{{array}}\\" wx:for-item=\\"{{it}}\\" wx:for-index=\\"{{idx}}\\">{{it}}</image>
</view>;"
`;
```
