import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import * as t from '@babel/types';

function kebabCase(input) {
  return input
    .replace(input.charAt(0), input.charAt(0).toLowerCase())
    .replace(/[A-Z]/g, $1 => $1.replace($1, `-${$1.toLowerCase()}`));
}

export default declare(
  (
    api,
    {
      namespace = 'wx',
      tagNameLetterCase = 'kebab',
      attrNameLetterCase = 'kebab',
      delimiterStart = '{{',
      delimiterEnd = '}}',
      directiveIf = `${namespace}:if`,
      directiveElseIf = `${namespace}:elif`,
      directiveElse = `${namespace}:else`,
      directiveFor = `${namespace}:for`,
      directiveForIndex = `${namespace}:for-index`,
      directiveForItem = `${namespace}:for-item`,
    },
  ) => {
    api.assertVersion(7);
    return {
      inherits: jsx,
      visitor: {
        JSXIdentifier(path) {
          path.node.name = kebabCase(path.node.name);
        },
        JSXExpressionContainer(path) {
          const expression = path.get('expression');
          if (
            expression.isLogicalExpression() &&
            expression.node.operator === '&&'
          ) {
            /**
             * {flag && <view></view>}
             * to
             * <view wx:if={flag}></view>
             */
            const jsx = expression.get('right');
            const opening = jsx.get('openingElement');
            const condition = expression.get('left');
            let value;
            if (condition.isIdentifier()) {
              value = condition.node.name;
            } else if (condition.isMemberExpression()) {
              const object = condition.get('object');
              const property = condition.get('property');
              if (object.isIdentifier() && property.isIdentifier()) {
                value = `${object.node.name}.${property.node.name}`;
              }
            }
            if (value) {
              opening.node.attributes = [
                ...opening.node.attributes,
                t.jSXAttribute(
                  t.jSXIdentifier(directiveIf),
                  t.stringLiteral(`${delimiterStart}${value}${delimiterEnd}`),
                ),
              ];
            }
            path.replaceWith(jsx);
          } else if (expression.isCallExpression()) {
            /**
             * {['a', 'b', 1, 2].map((it, idx) => <view>{idx}.{it}</view>)}
             * to
             * <view wx:for="{{['a', 'b', 1, 2]}}" wx:for-index="idx" wx:for-item="it">
             *   {idx}.{it}
             * </view>
             *
             * {array.map((it, idx) => <view>{idx}.{it}</view>)}
             * to
             * <view wx:for="{{array}}" wx:for-index="idx" wx:for-item="it">
             *   {idx}.{it}
             * </view>
             */
            const callee = expression.get('callee');
            if (callee.isMemberExpression()) {
              const property = callee.get('property');
              if (property.isIdentifier() && property.node.name === 'map') {
                const arg = expression.get('arguments.0');
                if (arg && arg.isArrowFunctionExpression()) {
                  const body = arg.get('body');
                  if (body.isJSXElement()) {
                    const opening = body.get('openingElement');
                    const item = arg.get('params.0');
                    const index = arg.get('params.1');
                    const object = callee.get('object');
                    let array;
                    if (object.isIdentifier()) {
                      array = object.node.name;
                    } else if (object.isArrayExpression()) {
                      array = `[${object.node.elements
                        .map(it => {
                          switch (it.type) {
                            case 'StringLiteral':
                              return `'${it.value}'`;
                            case 'NumericLiteral':
                              return `${it.value}`;
                            default:
                              throw object.buildCodeFrameError(
                                `Array's elements in View Expression should be one of these primitive types: String, Number, Boolean`,
                              );
                          }
                        })
                        .filter(it => it !== '')}]`;
                    } else {
                      throw object.buildCodeFrameError(
                        'Untreatable expression: syntax not allowed here',
                      );
                    }
                    if (array) {
                      opening.node.attributes = [
                        ...opening.node.attributes,
                        t.jSXAttribute(
                          t.jSXIdentifier(directiveFor),
                          t.stringLiteral(
                            `${delimiterStart}${array}${delimiterEnd}`,
                          ),
                        ),
                      ];

                      if (item.isIdentifier()) {
                        opening.node.attributes.push(
                          t.jSXAttribute(
                            t.jSXIdentifier(directiveForItem),
                            t.stringLiteral(
                              `${delimiterStart}${
                                item.node.name
                              }${delimiterEnd}`,
                            ),
                          ),
                        );
                      }

                      if (index && index.isIdentifier()) {
                        opening.node.attributes.push(
                          t.jSXAttribute(
                            t.jSXIdentifier(directiveForIndex),
                            t.stringLiteral(
                              `${delimiterStart}${
                                index.node.name
                              }${delimiterEnd}`,
                            ),
                          ),
                        );
                      }
                    }
                    path.replaceWith(body);
                  }
                }
              }
            }
          } else if (expression.isIdentifier()) {
            path.replaceWith(
              t.jSXText(
                `${delimiterStart}${expression.node.name}${delimiterEnd}`,
              ),
            );
          } else if (
            expression.isStringLiteral() ||
            expression.isBooleanLiteral() ||
            expression.isNumericLiteral()
          ) {
            path.replaceWith(t.jSXText(expression.node.value.toString()));
          } else {
          }
        },
      },
    };
  },
);
