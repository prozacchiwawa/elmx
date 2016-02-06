const parse = require('../dist/parser');

describe('parser', () => {
  const expectParsed = (s) => expect(parse(s));

  it('generates an Html.text for {=text}', () => {
    expectParsed(`main =
      let
        greeting = "Hi!"
      in
        <span>{=greeting}</span>`
    )
    .toEqual(`main =
      let
        greeting = "Hi!"
      in
        Html.span [] [Html.text greeting]`
    );
  });

  it('generates a quoted Html.text for text', () => {
    expectParsed(
      'main = <span>Hi!</span>'
    )
    .toEqual(
      'main = Html.span [] [Html.text "Hi!"]'
    );
  });

  it('understands list expressions as children', () => {
    expectParsed(`main =
      let
        children = [Html.text "Hi!"]
      in
        <span>{:children}</span>`
    )
    .toEqual(`main =
      let
        children = [Html.text "Hi!"]
      in
        Html.span [] children`
    );
  });

  it('understands singleton expressions as children', () => {
    expectParsed(`main =
      let
        child = Html.text "Hi!"
      in
        <span>{child}</span>`
    )
    .toEqual(`main =
      let
        child = Html.text "Hi!"
      in
        Html.span [] [child]`
    );
  });

  it('understands mixed expressions', () => {
    expectParsed(`main =
      let
        name = "John"
      in
        <span>Hi {=name}, <i>welcome!</i></span>`
    )
    .toEqual(`main =
      let
        name = "John"
      in
        Html.span [] [Html.text "Hi ", Html.text name, Html.text ", ", Html.i [] [Html.text "welcome!"]]`
    );
  });

  it('understands child node expressions', () => {
    expectParsed(
      `<span>, <i/></span>`
    )
    .toEqual(
      `Html.span [] [Html.text ", ", Html.i [] []]`
    );
  });


  it('understands prefix list expressions', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
        <span>{:name}, <i>welcome!</i></span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
        Html.span [] (name ++ [Html.text ", ", Html.i [] [Html.text "welcome!"]])`
    );
  });

  it('understands suffix list expressions', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
        <span>Welcome, {:name}</span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
        Html.span [] ([Html.text "Welcome, "] ++ name)`
    );
  });

  it('concats expressions to children', () => {
    expectParsed(`main =
      let
        name =
          [ Html.text "Smith"
          , Html.text ", "
          , Html.text "John"
          ]
      in
        <span>Hi {:name}, <i>welcome!</i></span>`
    )
    .toEqual(`main =
      let
        name =
          [ Html.text "Smith"
          , Html.text ", "
          , Html.text "John"
          ]
      in
        Html.span [] ([Html.text "Hi "] ++ name ++ [Html.text ", ", Html.i [] [Html.text "welcome!"]])`
    );
  });

  it('recognizes an attribute and uses it', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
        <span id="foo">Welcome, {:name}</span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
        Html.span [Html.Attributes.attribute "id" "foo"] ([Html.text "Welcome, "] ++ name)`
    );
  });

  it('uses an atribute list', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
        <span {:attributes}>Welcome, {:name}</span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
        Html.span attributes ([Html.text "Welcome, "] ++ name)`
    );
  });

  it('uses an attribute and an attribute list', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
        <span id="bar" {:attributes}>Welcome, {:name}</span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
        Html.span (List.concatMap identity [[Html.Attributes.attribute "id" "bar"], attributes]) ([Html.text "Welcome, "] ++ name)`
    );
  });

  it('uses attributes and attribute lists', () => {
    expectParsed(`main =
      let
        name = [ Html.text "Smith" ]
      in
	<span id="bar" class="foo" {:attributes1} {:attributes2}>Welcome, {:name}</span>`
    )
    .toEqual(`main =
      let
        name = [ Html.text "Smith" ]
      in
	Html.span (List.concatMap identity [[Html.Attributes.attribute "id" "bar", Html.Attributes.attribute "class" "foo"], attributes1, attributes2]) ([Html.text "Welcome, "] ++ name)`
    );
  });
});
