const R = require('ramda');

function groupChildren(list) {
  const [before, [item, ...after]] = R.splitWhen(i => i.list, list);
  if (!item) return [before];
  if (!after) return [before, item];
  return [before, item].concat(groupChildren(after));
}

function parseChildrenList(list) {
  const items = groupChildren(list)
    .filter(group => group.length !== 0)
    .map(group => group.list || `[${group.join('')}]`);

  return items.length == 1
    ? items[0]
    : `(${items.join(' ++ ')})`;
}

function parseChildren(children) {
  let first = true;

  const ret = children.map(c => {
    const { expr } = c;
    if (expr) {
      if (expr.whitespace !== undefined) return expr.whitespace;
      if (expr.list) {
        first = true;
        return expr;
      }
    }
    let prefix = "";
    if (first) {
      first = false;
    } else {
      prefix = ", ";
    }
    return prefix + generate(c);
  });

  return (R.any(i => i.list, ret))
    ? parseChildrenList(ret)
    : `[${ret.join("")}]`;
}

function generateExpression(expr) {
  if (expr.code) return expr.code;
  if (expr.text) return `Html.text "${expr.text}"`;
  if (expr.textExpr) return `Html.text ${expr.textExpr}`;
  if (expr.whitespace !== undefined) return expr.whitespace;
  throw `Invalid expression: ${JSON.stringify(expr)}`
}

function generate(state) {
  const { expr } = state;
  if (expr) return generateExpression(expr);

  if (!state.parent) {
    return state.children.map(generate).join("");
  }

  const name = state.name;
  const compound_simple_attributes = R.partition(x => x.match(/^:.*/), state.attributes);
  const simple_attributes = compound_simple_attributes[1];
  const attributes = simple_attributes.join(", ");
  const compound_attributes = compound_simple_attributes[0];
  const children = parseChildren(state.children);
  if (compound_attributes.length == 0) {
      return `Html.${name} [${attributes}] ${children}`;
  } else if (compound_attributes.length == 1 && simple_attributes.length == 0) {
      return `Html.${name} ${compound_attributes[0].substr(1)} ${children}`;
  } else {
      const attributes_string = `[${attributes}]`;
      const compound_list = [attributes_string, compound_attributes.map(x => x.substr(1)).join(", ")];
      const all_attributes = compound_list.join(", ");
      const compound_attributes_str = `(List.concatMap identity [${all_attributes}])`;
      return `Html.${name} ${compound_attributes_str} ${children}`;
  }
}

generate.parseChildrenList = parseChildrenList;

module.exports = generate;
