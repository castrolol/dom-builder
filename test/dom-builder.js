var DomNode = require("../src/dom-node");
var DomBuilder = require("../src/dom-builder");
var elementHandler = require("../src/element-handler");
var BrowserElementHandler = require("../src/element-handler/browser-element-handler");
var jsdom = require('mocha-jsdom');

describe('Dom Builder', function(){

	describe("#constructor", function(){

		it("should be constructed", function(){

			var domBuilder = new DomBuilder();

			expect(domBuilder).to.be.instanceof(DomBuilder);
			expect(domBuilder.children).to.be.instanceof(Array);
			expect(domBuilder.children).to.be.empty;

		});
	});


	describe("#setHandler", function(){

		var TestElementHandler = require("./fixture/test-element-handler");
	
		it("should change the element handler", function(){

			var domBuilder = new DomBuilder();
			var oldElementHandler = domBuilder.elementHandler.handler;
			var newElementHandler = new TestElementHandler()
			domBuilder.setHandler(newElementHandler);

			expect(domBuilder.elementHandler.handler).not.to.equal(oldElementHandler);
			expect(domBuilder.elementHandler.handler).to.equal(newElementHandler);

			domBuilder.setHandler(new BrowserElementHandler());
		});

	});

	describe("#resolve", function(){
		
		jsdom();
		

		it("should return a empty document fragment when not has children ", function(){

			var builder = new DomBuilder();
			 
			var fragment = builder.resolve();			

			expect(fragment).to.be.instanceof(DocumentFragment);			
			expect(fragment.children).to.length(0);

		});

		it("should return a one item document fragment when has one child ", function(){

			var builder = new DomBuilder();
			
			builder.children = [new DomNode("span")];

			var fragment = builder.resolve();			


			expect(fragment).to.be.instanceof(DocumentFragment);			
			expect(fragment.children).to.length(1);
			expect(fragment.children[0].outerHTML).to.equal("<span></span>");			

		});


		it("should return a one item document fragment when has one child recursively", function(){

			var builder = new DomBuilder();
			
			builder.children = [new DomNode("span", new DomNode("i", "get out my way!"))];

			var fragment = builder.resolve();			


			expect(fragment).to.be.instanceof(DocumentFragment);			
			expect(fragment.children).to.length(1);
			expect(fragment.children[0].outerHTML).to.equal("<span><i>get out my way!</i></span>");			

		});


	});

});