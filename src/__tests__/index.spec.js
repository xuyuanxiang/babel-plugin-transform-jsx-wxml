const babel = require('@babel/core');
const plugin = require('../');

const source = `
const array = ['1', '2', '3'];
<View>
  {state.flag && <MyButton>Click Me</MyButton>}
  
  {['a', 'b', 'c', 1, 2].map((it, idx) => (<Body1>{it}</Body1>))}
  
  {array.map((it, idx) => <Image lazyLoad>{it}</Image>)}      
</View>
`;

it('should tern jsx to wxml', () => {
  const { code } = babel.transform(source, {
    plugins: [plugin],
  });
  expect(code).toMatchSnapshot();
});
