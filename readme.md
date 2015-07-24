# DOM Builder
### A VanillaJS DOM Handler 

DOM Builder is a DOM-building tool quickly and performance, without dependence.

Allow build DOM in a static one-way.

```js
    var fragment = new DomBuilder()
                        .begin("div")
                            .child("h1", "Hello World!")
                            .begin("ul", { 'data-role': 'container' })
                                .child('li', "Item 1", { 'data-item': '1' })
                                .child('li', "Item 2", { 'data-item': '2' })
                                .child('li', "Item 3", { 'data-item': '3' })
                                .child('li', "Item 4", { 'data-item': '4' })
                            .close()
                        .close()
                        .begin("div", { 'class': 'btn-area'})
                            .child("button", "cancel", { "class": "btn btn-danger" })
                            .child("button", "confirm", { "class": "bnt btn-primary" })
                        .close()
                        .resolve();
                        
    document.body.appendChild(framgent); 
```

this code will be generate a DOM-Tree like bellow

```html
    <div>
        <h1>Hello World!</h1>
        <ul data-role="container">
            <li data-item="1">Item 1</li>
            <li data-item="2">Item 2</li>
            <li data-item="3">Item 3</li>
            <li data-item="4">Item 4</li>
        </ul>
    </div>
    <div class="btn-area">
        <button class="btn btn-danger">cancel</button>
        <button class="bnt btn-primary">confirm</button>
    </div>
```

### Update Node

The nodes can be updated, if you change any proprety of a node call de ```update``` method

```js
    domNode.update(); //will update the node, whitout update the children
```
the code bellow change the color of ul every second
```js
    var colors = ["red", "blue", "black", "orange", "lime", "green", "pink"],
        nextColor = 0,
        builder = new DomBuider();

    var ul = builder.begin("ul");
    
    for(var i = 0; i < 10; i++){
        ul.child("li", "Item " + i, { "foo": "bar" + i });
    }
    
    ul.close();
    
    builder.attachOn(document.body); //append the DOM-Tree fragment in document.body
    setInterval(function(){
        var color = colors[nextColor];
        
        ul.attr({ "style": "background: " + color }); //change the background color
        ul.update(); //will change the property without touch on children
        
        nextColor = (nextColor + 1) % colors.length; //change to next color
    }, 1000);
    
```