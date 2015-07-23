var DomNode = require("../src/dom-node");
var elementHandler = require("../src/element-handler");
var jsdom = require('mocha-jsdom');

describe('Dom Node', function(){

	describe("constructor", function(){

		it('need to be constructed with a element type', function(){

			var domNode = new DomNode("div");

			expect(domNode.element).to.equal("div");

		});

		it('... with a element type and a child', function(){
			
			var domChild = new DomNode("span");
			var domNode = new DomNode("div", domChild);

			expect(domNode.element).to.equal("div");
			expect(domChild.element).to.equal("span");
			expect(domNode.children).to.be.instanceof(Array);
			expect(domNode.children).to.have.length(1);
			expect(domNode.children).to.include.members([domChild]);

		});

		it('... with a element type and attributes', function(){
			
			
			var attrs = {
				"class": "parent-div",
				"data-text": "my cat plays keyboard"
			};

			var domNode = new DomNode("div", attrs);


			expect(domNode).to.be.instanceof(DomNode);
			expect(domNode.element).to.equal("div");			
			
			expect(domNode.attrs).to.be.an("object");

			expect(domNode.attrs).to.have.all.keys("class", "data-text");
			expect(domNode.attrs).to.equal(attrs);
		});

		it('... with a element type and multiples children', function(){
			
			var domChildSpan = new DomNode("span");
			var domChildButton = new DomNode("button");
			var domChildImg = new DomNode("img");
			
			var children = [domChildSpan, domChildButton, domChildImg];

			var domNode = new DomNode("div", children);

			expect(domNode).to.be.instanceof(DomNode);
			expect(domNode.element).to.equal("div");
			expect(domNode.children).to.be.instanceof(Array);
			expect(domNode.children).to.have.length(3);
			expect(domNode.children).to.include.members(children);

		});

		it("... with element type, children and attributes", function(){

			var attrs = {
				"class": "parent-div",
				"data-text": "my cat plays keyboard"
			};

			var domChild = new DomNode("span");
			var domNode = new DomNode("div", domChild, attrs);

			expect(domNode).to.be.instanceof(DomNode);
			expect(domNode.element).to.equal("div");
			expect(domChild.element).to.equal("span");

			expect(domNode.children).to.be.instanceof(Array);
			expect(domNode.attrs).to.be.an("object");

			expect(domNode.attrs).to.have.all.keys("class", "data-text");
			expect(domNode.attrs).to.equal(attrs);

			expect(domNode.children).to.have.length(1);
			expect(domNode.children).to.include.members([domChild]);


		});

		it("... with a text child", function(){

			var domNode = new DomNode("span", "my cat is a rock-star, baby!");

			expect(domNode).to.be.instanceof(DomNode);			
			expect(domNode.element).to.equal("span");
			expect(domNode.children).to.have.length(1);
			expect(domNode.children[0]).to.be.instanceof(DomNode);
			expect(domNode.children[0].element).to.equal("#text");
			expect(domNode.children[0].children).to.eql(["my cat is a rock-star, baby!"]);

		});

		it("... with '#text' type", function(){

			var domNode = new DomNode("#text", "my cat is a rock-star, baby!");

			expect(domNode).to.be.instanceof(DomNode);			
			expect(domNode.element).to.equal("#text");
			expect(domNode.children).to.eql(["my cat is a rock-star, baby!"]);

		});


	});

	describe("#attr", function(){

		it("setted attrs without attrs passed in constructor", function(){

			var domNode = new DomNode("span");

			expect(domNode.attrs).to.be.an("object");
			expect(domNode.attrs).to.be.empty;

			domNode.attr({ 'data-text': 'my cat code in malbouge' });

			expect(domNode.attrs).to.have.property("data-text", 'my cat code in malbouge');

		});

		it("setted attrs with attrs passed in constructor", function(){

			var domNode = new DomNode("span", { 'date-title' : 'a some title' });

			expect(domNode.attrs).to.be.an("object");
			expect(domNode.attrs).to.have.property('date-title', 'a some title');

			domNode.attr({ 'data-text': 'my cat code in malbouge' });

			expect(domNode.attrs).to.have.property("data-text", 'my cat code in malbouge');
			expect(domNode.attrs).to.have.property('date-title', 'a some title');


		});


		it("the last attrs must override of same key", function(){

			var domNode = new DomNode("span", { 'data-title' : 'a some title' });

			expect(domNode.attrs).to.be.an("object");
			expect(domNode.attrs).to.have.property('data-title', 'a some title');

			domNode.attr({ 'data-text': 'my cat code in malbouge' });
			domNode.attr({ 'data-title': 'spider-cat, spider-cat!' });

			expect(domNode.attrs).to.have.property("data-text", 'my cat code in malbouge');
			expect(domNode.attrs).to.have.property('data-title', 'spider-cat, spider-cat!');


		});

	});

	describe("#normalizeChildren", function(){

	
		it("need to normalize strings to #text elements", function(){

			var domNode = new DomNode("span");

			domNode.children.push("A lot of trees haunted");

			expect(domNode.children[0]).to.be.eql('A lot of trees haunted');

			domNode.normalizeChildren();

			expect(domNode.children[0]).to.be.instanceof(DomNode);
			expect(domNode.children[0].children).to.eql(['A lot of trees haunted']);

		});
	});

	describe("#buildOut", function(){
	
		jsdom();
		var TestElementHandler = require("./fixture/test-element-handler");
	

		it("need to invoke elementHandler#createElement when build out, to child first and after to parent", function(){
			var testElementHandler =  new TestElementHandler();

			var resultExpected = {};
			var childExpected = {};

			function secondTest(element, value){
				expect(element).to.equal("div");
				expect(value).to.be.instanceof(Array);
				expect(value[0]).to.equal(childExpected);
				return resultExpected;

			};

			function firstTest(element, value){
				expect(element).to.equal("#text");
				expect(value).to.be.instanceof(Array);
				expect(value[0]).to.be.an("string");
				testElementHandler.createElement = secondTest;				
				return childExpected;
			}


			testElementHandler.createElement = firstTest;


			elementHandler.setHandler(testElementHandler);

			var domNode = new DomNode("div", "hello, i'm in a div!");

			var result = domNode.buildOut();
			expect(result).to.equal(resultExpected);
		});

		it("need to create a HTMLElement div for DomNode with element 'div' ", function(){

			elementHandler.setHandler(); //reseting

			var domNode = new DomNode("div", "hello, i'm in a div!");

			var result = domNode.buildOut();

			expect(result.nodeName).eql('DIV');
			expect(result.childNodes).to.have.length(1);
			expect(result.childNodes[0].nodeName).eql('#text');
			expect(result.childNodes[0].textContent).eql("hello, i'm in a div!");
			expect(result.outerHTML).eql("<div>hello, i'm in a div!</div>");			

		});
	});

});