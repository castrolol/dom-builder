(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DomNode = require("./dom-node");
var elementHandler = require("./element-handler");
var DomNodePipeMixin = require("./dom-node-pipe-mixin"); 

function DomBuilder(){
	
	this.children = [];
	DomNodePipeMixin.apply(this, DomNode);
}

DomBuilder.prototype.setHandler = function(handler){
	this.elementHandler.setHandler(handler);
};

DomBuilder.prototype.resolve = function(){

	var documentFragment = elementHandler.createFragment();

	this.children.forEach(function(node){
		var buildedNode = node.buildOut();
		documentFragment.appendChild(buildedNode);
	});

	return documentFragment;

};

DomBuilder.prototype.attachOn = function(parent){

	var fragment = this.resolve();
	parent.appendChild(fragment);
	return fragment;

};


//exposing module

if(typeof define === "function"){
	//expose to AMD

	define(function(){
		return DomBuilder;
	});

} else if(typeof window == "object"){
	//else expose directly

	window.DomBuilder = DomBuilder;
}

//expose to browserify and node
module.exports = DomBuilder;
},{"./dom-node":3,"./dom-node-pipe-mixin":2,"./element-handler":6}],2:[function(require,module,exports){
//behaviour

function mixIn(constructor, DomNodeConstructor){
	return {
		behaviour: addBehaviour.bind(this, constructor, DomNodeConstructor)
	};
}

function addBehaviour(constructor, DomNodeConstructor, behaviourName){
	var behaviour = behaviours[behaviourName];
	constructor[behaviourName] = behaviour(DomNodeConstructor);
	return {
		behaviour: addBehaviour.bind(this, constructor, DomNodeConstructor)
	};
}

var behaviours = {
	begin: function(DomNode){
		return function(element){
			var childNode = new DomNode(element);
			childNode.parent = this;
			this.children.push(childNode);
			return childNode ;
		};
	},
	child: function(DomNode){
		return function(element, children, attrs){
			var childNode = new DomNode(element, children, attrs);
			childNode.parent = this;
			this.children.push(childNode);
			return this;
		};
	},
	text: function(DomNode){
		return  function(value){
			return this.child("#text", value);
		};
	},
	close:  function(DomNode){
		return function(){
			if(this.parent) return this.parent;
			return this;	
		};
	}
};
 
//mixin container
function DomNodePipeMixin(){

}

DomNodePipeMixin.prototype.apply = function(object, DomNodeConstructor){

		if( object.children instanceof Array === false){
			object.children = [];
		}

		mixIn(object, DomNodeConstructor)
			.behaviour("begin")
			.behaviour("close")
			.behaviour("child")
			.behaviour("text");	
};

module.exports = new DomNodePipeMixin();
},{}],3:[function(require,module,exports){
var elementHandler = require("./element-handler");
var DomNodePipeMixin = require("./dom-node-pipe-mixin");



function DomNode(element, children, attrs){

	if(typeof attrs === "undefined" ){
		if( (typeof children === "string" || children instanceof DomNode || children instanceof Array ) === false ){
			attrs = children;
		}
	}

	if(typeof children !== "undefined" && children instanceof Array === false){
		children = [children];
	}


	this.element = element;
	this.children = children || [];
	this.attrs = attrs || {}; 
	this.parent = null;
	this.normalizeChildren();
	DomNodePipeMixin.apply(this, DomNode);		

}

DomNode.prototype.normalizeChildren = function(){

	this.children = this.children.map(function(child){
		if(typeof child == "string" && this.element != "#text"){
			return new DomNode("#text", child);
		}
		return child;
	}.bind(this));	
};

DomNode.prototype.attr = function (attrs) {
	for(var attr in attrs){
		this.attrs[attr] = attrs[attr];
	}
	return this;
};
   
DomNode.prototype.buildOut = function() {

	if("ref" in this && this.ref !== null){
		return this.ref;
	}

	var buildedChildren = [];

	this.children.forEach(function(child){
		if(child && typeof child != "string"){
			child = child.buildOut();
		}
		buildedChildren.push(child);
	});

	var buildedNode = elementHandler.createElement(this.element, buildedChildren);

	if("setAttribute" in buildedNode){
		for(var attributeName in this.attrs){
			var attributeValue = this.attrs[attributeName];
			buildedNode.setAttribute(attributeName, attributeValue);
		}
	}
	
	this.ref = buildedNode;

	return buildedNode;
};

DomNode.prototype.update = function(){
 	var ref = this.ref;
 	this.ref = null;
	elementHandler
		.replace(ref)
		.by(this.buildOut()); 
};


module.exports = DomNode;
},{"./dom-node-pipe-mixin":2,"./element-handler":6}],4:[function(require,module,exports){
function BrowserElementHandler(){

}

BrowserElementHandler.canUseIt = function(){

	try{
		if(typeof window === "undefined"){
			return false;
		}

		if(typeof document === "undefined"){
			return false;
		}

		if(typeof document.createElement !== "function"){
			return false;
		}

		if(typeof document.createTextNode !== "function"){
			return false;
		}

		if(typeof document.createDocumentFragment !== "function"){
			return false;
		}

	}catch(e){
		return false;
	}

	return true;
};

BrowserElementHandler.prototype.createText = function(value){
	return document.createTextNode(value);
};

BrowserElementHandler.prototype.createNode = function(tag, children){
	var element = document.createElement(tag);
	children.forEach(function(child){
		element.appendChild(child);
	});
	return element;
};

BrowserElementHandler.prototype.createElement = function(tag, value){
	if(tag === "#text"){
		return this.createText(value);
	}else{
		return this.createNode(tag, value);
	}
};

BrowserElementHandler.prototype.createFragment = function(){
	return document.createDocumentFragment();
};

BrowserElementHandler.prototype.replace = function(element){
	var children = element.childNodes;
	
	for(var i; i < children.length; i++){
		var child = children[i];
		element.removeChild(child);
	}

	var parent = element.parentElement;

	return {
		by: function(newElement){
			parent.replaceChild(newElement, element);
		}
	};
};

module.exports = BrowserElementHandler;
},{}],5:[function(require,module,exports){
var handlers = {
	BrowserElementHandler: require("./browser-element-handler")
};

function ElementHandlerFactory(){

	this.current = null;

}

ElementHandlerFactory.prototype.create = function(){
	if(this.current) return this.current;

	for(var type in handlers){
		var handler = handlers[type];
		if(handler.canUseIt())
		{
			this.current = new handler();
			return this.current;
		}
	}


};


module.exports = new ElementHandlerFactory();
},{"./browser-element-handler":4}],6:[function(require,module,exports){
var ElementHandlerFactory = require("./element-handler-factory");

function ElementHandler(){
	this.handler = ElementHandlerFactory.create();
}

ElementHandler.prototype.setHandler = function(handler){
	this.handler = handler || ElementHandlerFactory.create();
};

ElementHandler.prototype.createElement = function(tag, value){
	return this.handler.createElement(tag, value);
};

ElementHandler.prototype.createFragment = function(){
	return this.handler.createFragment();
};

ElementHandler.prototype.replace = function(element){
	return this.handler.replace(element);
};

module.exports = new ElementHandler();
},{"./element-handler-factory":5}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZG9tLWJ1aWxkZXIuanMiLCJzcmMvZG9tLW5vZGUtcGlwZS1taXhpbi5qcyIsInNyYy9kb20tbm9kZS5qcyIsInNyYy9lbGVtZW50LWhhbmRsZXIvYnJvd3Nlci1lbGVtZW50LWhhbmRsZXIuanMiLCJzcmMvZWxlbWVudC1oYW5kbGVyL2VsZW1lbnQtaGFuZGxlci1mYWN0b3J5LmpzIiwic3JjL2VsZW1lbnQtaGFuZGxlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIERvbU5vZGUgPSByZXF1aXJlKFwiLi9kb20tbm9kZVwiKTtcclxudmFyIGVsZW1lbnRIYW5kbGVyID0gcmVxdWlyZShcIi4vZWxlbWVudC1oYW5kbGVyXCIpO1xyXG52YXIgRG9tTm9kZVBpcGVNaXhpbiA9IHJlcXVpcmUoXCIuL2RvbS1ub2RlLXBpcGUtbWl4aW5cIik7IFxyXG5cclxuZnVuY3Rpb24gRG9tQnVpbGRlcigpe1xyXG5cdFxyXG5cdHRoaXMuY2hpbGRyZW4gPSBbXTtcclxuXHREb21Ob2RlUGlwZU1peGluLmFwcGx5KHRoaXMsIERvbU5vZGUpO1xyXG59XHJcblxyXG5Eb21CdWlsZGVyLnByb3RvdHlwZS5zZXRIYW5kbGVyID0gZnVuY3Rpb24oaGFuZGxlcil7XHJcblx0dGhpcy5lbGVtZW50SGFuZGxlci5zZXRIYW5kbGVyKGhhbmRsZXIpO1xyXG59O1xyXG5cclxuRG9tQnVpbGRlci5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBkb2N1bWVudEZyYWdtZW50ID0gZWxlbWVudEhhbmRsZXIuY3JlYXRlRnJhZ21lbnQoKTtcclxuXHJcblx0dGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0dmFyIGJ1aWxkZWROb2RlID0gbm9kZS5idWlsZE91dCgpO1xyXG5cdFx0ZG9jdW1lbnRGcmFnbWVudC5hcHBlbmRDaGlsZChidWlsZGVkTm9kZSk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBkb2N1bWVudEZyYWdtZW50O1xyXG5cclxufTtcclxuXHJcbkRvbUJ1aWxkZXIucHJvdG90eXBlLmF0dGFjaE9uID0gZnVuY3Rpb24ocGFyZW50KXtcclxuXHJcblx0dmFyIGZyYWdtZW50ID0gdGhpcy5yZXNvbHZlKCk7XHJcblx0cGFyZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcclxuXHRyZXR1cm4gZnJhZ21lbnQ7XHJcblxyXG59O1xyXG5cclxuXHJcbi8vZXhwb3NpbmcgbW9kdWxlXHJcblxyXG5pZih0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpe1xyXG5cdC8vZXhwb3NlIHRvIEFNRFxyXG5cclxuXHRkZWZpbmUoZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBEb21CdWlsZGVyO1xyXG5cdH0pO1xyXG5cclxufSBlbHNlIGlmKHR5cGVvZiB3aW5kb3cgPT0gXCJvYmplY3RcIil7XHJcblx0Ly9lbHNlIGV4cG9zZSBkaXJlY3RseVxyXG5cclxuXHR3aW5kb3cuRG9tQnVpbGRlciA9IERvbUJ1aWxkZXI7XHJcbn1cclxuXHJcbi8vZXhwb3NlIHRvIGJyb3dzZXJpZnkgYW5kIG5vZGVcclxubW9kdWxlLmV4cG9ydHMgPSBEb21CdWlsZGVyOyIsIi8vYmVoYXZpb3VyXHJcblxyXG5mdW5jdGlvbiBtaXhJbihjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yKXtcclxuXHRyZXR1cm4ge1xyXG5cdFx0YmVoYXZpb3VyOiBhZGRCZWhhdmlvdXIuYmluZCh0aGlzLCBjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yKVxyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEJlaGF2aW91cihjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yLCBiZWhhdmlvdXJOYW1lKXtcclxuXHR2YXIgYmVoYXZpb3VyID0gYmVoYXZpb3Vyc1tiZWhhdmlvdXJOYW1lXTtcclxuXHRjb25zdHJ1Y3RvcltiZWhhdmlvdXJOYW1lXSA9IGJlaGF2aW91cihEb21Ob2RlQ29uc3RydWN0b3IpO1xyXG5cdHJldHVybiB7XHJcblx0XHRiZWhhdmlvdXI6IGFkZEJlaGF2aW91ci5iaW5kKHRoaXMsIGNvbnN0cnVjdG9yLCBEb21Ob2RlQ29uc3RydWN0b3IpXHJcblx0fTtcclxufVxyXG5cclxudmFyIGJlaGF2aW91cnMgPSB7XHJcblx0YmVnaW46IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG5cdFx0XHR2YXIgY2hpbGROb2RlID0gbmV3IERvbU5vZGUoZWxlbWVudCk7XHJcblx0XHRcdGNoaWxkTm9kZS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHR0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGROb2RlKTtcclxuXHRcdFx0cmV0dXJuIGNoaWxkTm9kZSA7XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0Y2hpbGQ6IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIGNoaWxkcmVuLCBhdHRycyl7XHJcblx0XHRcdHZhciBjaGlsZE5vZGUgPSBuZXcgRG9tTm9kZShlbGVtZW50LCBjaGlsZHJlbiwgYXR0cnMpO1xyXG5cdFx0XHRjaGlsZE5vZGUucGFyZW50ID0gdGhpcztcclxuXHRcdFx0dGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkTm9kZSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cdHRleHQ6IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuICBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNoaWxkKFwiI3RleHRcIiwgdmFsdWUpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cdGNsb3NlOiAgZnVuY3Rpb24oRG9tTm9kZSl7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYodGhpcy5wYXJlbnQpIHJldHVybiB0aGlzLnBhcmVudDtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHRcclxuXHRcdH07XHJcblx0fVxyXG59O1xyXG4gXHJcbi8vbWl4aW4gY29udGFpbmVyXHJcbmZ1bmN0aW9uIERvbU5vZGVQaXBlTWl4aW4oKXtcclxuXHJcbn1cclxuXHJcbkRvbU5vZGVQaXBlTWl4aW4ucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob2JqZWN0LCBEb21Ob2RlQ29uc3RydWN0b3Ipe1xyXG5cclxuXHRcdGlmKCBvYmplY3QuY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2Upe1xyXG5cdFx0XHRvYmplY3QuY2hpbGRyZW4gPSBbXTtcclxuXHRcdH1cclxuXHJcblx0XHRtaXhJbihvYmplY3QsIERvbU5vZGVDb25zdHJ1Y3RvcilcclxuXHRcdFx0LmJlaGF2aW91cihcImJlZ2luXCIpXHJcblx0XHRcdC5iZWhhdmlvdXIoXCJjbG9zZVwiKVxyXG5cdFx0XHQuYmVoYXZpb3VyKFwiY2hpbGRcIilcclxuXHRcdFx0LmJlaGF2aW91cihcInRleHRcIik7XHRcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IERvbU5vZGVQaXBlTWl4aW4oKTsiLCJ2YXIgZWxlbWVudEhhbmRsZXIgPSByZXF1aXJlKFwiLi9lbGVtZW50LWhhbmRsZXJcIik7XHJcbnZhciBEb21Ob2RlUGlwZU1peGluID0gcmVxdWlyZShcIi4vZG9tLW5vZGUtcGlwZS1taXhpblwiKTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gRG9tTm9kZShlbGVtZW50LCBjaGlsZHJlbiwgYXR0cnMpe1xyXG5cclxuXHRpZih0eXBlb2YgYXR0cnMgPT09IFwidW5kZWZpbmVkXCIgKXtcclxuXHRcdGlmKCAodHlwZW9mIGNoaWxkcmVuID09PSBcInN0cmluZ1wiIHx8IGNoaWxkcmVuIGluc3RhbmNlb2YgRG9tTm9kZSB8fCBjaGlsZHJlbiBpbnN0YW5jZW9mIEFycmF5ICkgPT09IGZhbHNlICl7XHJcblx0XHRcdGF0dHJzID0gY2hpbGRyZW47XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZih0eXBlb2YgY2hpbGRyZW4gIT09IFwidW5kZWZpbmVkXCIgJiYgY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2Upe1xyXG5cdFx0Y2hpbGRyZW4gPSBbY2hpbGRyZW5dO1xyXG5cdH1cclxuXHJcblxyXG5cdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0dGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuIHx8IFtdO1xyXG5cdHRoaXMuYXR0cnMgPSBhdHRycyB8fCB7fTsgXHJcblx0dGhpcy5wYXJlbnQgPSBudWxsO1xyXG5cdHRoaXMubm9ybWFsaXplQ2hpbGRyZW4oKTtcclxuXHREb21Ob2RlUGlwZU1peGluLmFwcGx5KHRoaXMsIERvbU5vZGUpO1x0XHRcclxuXHJcbn1cclxuXHJcbkRvbU5vZGUucHJvdG90eXBlLm5vcm1hbGl6ZUNoaWxkcmVuID0gZnVuY3Rpb24oKXtcclxuXHJcblx0dGhpcy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdGlmKHR5cGVvZiBjaGlsZCA9PSBcInN0cmluZ1wiICYmIHRoaXMuZWxlbWVudCAhPSBcIiN0ZXh0XCIpe1xyXG5cdFx0XHRyZXR1cm4gbmV3IERvbU5vZGUoXCIjdGV4dFwiLCBjaGlsZCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2hpbGQ7XHJcblx0fS5iaW5kKHRoaXMpKTtcdFxyXG59O1xyXG5cclxuRG9tTm9kZS5wcm90b3R5cGUuYXR0ciA9IGZ1bmN0aW9uIChhdHRycykge1xyXG5cdGZvcih2YXIgYXR0ciBpbiBhdHRycyl7XHJcblx0XHR0aGlzLmF0dHJzW2F0dHJdID0gYXR0cnNbYXR0cl07XHJcblx0fVxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4gICBcclxuRG9tTm9kZS5wcm90b3R5cGUuYnVpbGRPdXQgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0aWYoXCJyZWZcIiBpbiB0aGlzICYmIHRoaXMucmVmICE9PSBudWxsKXtcclxuXHRcdHJldHVybiB0aGlzLnJlZjtcclxuXHR9XHJcblxyXG5cdHZhciBidWlsZGVkQ2hpbGRyZW4gPSBbXTtcclxuXHJcblx0dGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdGlmKGNoaWxkICYmIHR5cGVvZiBjaGlsZCAhPSBcInN0cmluZ1wiKXtcclxuXHRcdFx0Y2hpbGQgPSBjaGlsZC5idWlsZE91dCgpO1xyXG5cdFx0fVxyXG5cdFx0YnVpbGRlZENoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgYnVpbGRlZE5vZGUgPSBlbGVtZW50SGFuZGxlci5jcmVhdGVFbGVtZW50KHRoaXMuZWxlbWVudCwgYnVpbGRlZENoaWxkcmVuKTtcclxuXHJcblx0aWYoXCJzZXRBdHRyaWJ1dGVcIiBpbiBidWlsZGVkTm9kZSl7XHJcblx0XHRmb3IodmFyIGF0dHJpYnV0ZU5hbWUgaW4gdGhpcy5hdHRycyl7XHJcblx0XHRcdHZhciBhdHRyaWJ1dGVWYWx1ZSA9IHRoaXMuYXR0cnNbYXR0cmlidXRlTmFtZV07XHJcblx0XHRcdGJ1aWxkZWROb2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMucmVmID0gYnVpbGRlZE5vZGU7XHJcblxyXG5cdHJldHVybiBidWlsZGVkTm9kZTtcclxufTtcclxuXHJcbkRvbU5vZGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XHJcbiBcdHZhciByZWYgPSB0aGlzLnJlZjtcclxuIFx0dGhpcy5yZWYgPSBudWxsO1xyXG5cdGVsZW1lbnRIYW5kbGVyXHJcblx0XHQucmVwbGFjZShyZWYpXHJcblx0XHQuYnkodGhpcy5idWlsZE91dCgpKTsgXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEb21Ob2RlOyIsImZ1bmN0aW9uIEJyb3dzZXJFbGVtZW50SGFuZGxlcigpe1xyXG5cclxufVxyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLmNhblVzZUl0ID0gZnVuY3Rpb24oKXtcclxuXHJcblx0dHJ5e1xyXG5cdFx0aWYodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIil7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZih0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgIT09IFwiZnVuY3Rpb25cIil7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZih0eXBlb2YgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUgIT09IFwiZnVuY3Rpb25cIil7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZih0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCAhPT0gXCJmdW5jdGlvblwiKXtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHR9Y2F0Y2goZSl7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5wcm90b3R5cGUuY3JlYXRlVGV4dCA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xyXG59O1xyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24odGFnLCBjaGlsZHJlbil7XHJcblx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XHJcblx0Y2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRlbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcclxuXHR9KTtcclxuXHRyZXR1cm4gZWxlbWVudDtcclxufTtcclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5wcm90b3R5cGUuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZywgdmFsdWUpe1xyXG5cdGlmKHRhZyA9PT0gXCIjdGV4dFwiKXtcclxuXHRcdHJldHVybiB0aGlzLmNyZWF0ZVRleHQodmFsdWUpO1xyXG5cdH1lbHNle1xyXG5cdFx0cmV0dXJuIHRoaXMuY3JlYXRlTm9kZSh0YWcsIHZhbHVlKTtcclxuXHR9XHJcbn07XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZUZyYWdtZW50ID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG59O1xyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24oZWxlbWVudCl7XHJcblx0dmFyIGNoaWxkcmVuID0gZWxlbWVudC5jaGlsZE5vZGVzO1xyXG5cdFxyXG5cdGZvcih2YXIgaTsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKXtcclxuXHRcdHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xyXG5cdFx0ZWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcblx0fVxyXG5cclxuXHR2YXIgcGFyZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0Ynk6IGZ1bmN0aW9uKG5ld0VsZW1lbnQpe1xyXG5cdFx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKG5ld0VsZW1lbnQsIGVsZW1lbnQpO1xyXG5cdFx0fVxyXG5cdH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJFbGVtZW50SGFuZGxlcjsiLCJ2YXIgaGFuZGxlcnMgPSB7XHJcblx0QnJvd3NlckVsZW1lbnRIYW5kbGVyOiByZXF1aXJlKFwiLi9icm93c2VyLWVsZW1lbnQtaGFuZGxlclwiKVxyXG59O1xyXG5cclxuZnVuY3Rpb24gRWxlbWVudEhhbmRsZXJGYWN0b3J5KCl7XHJcblxyXG5cdHRoaXMuY3VycmVudCA9IG51bGw7XHJcblxyXG59XHJcblxyXG5FbGVtZW50SGFuZGxlckZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCl7XHJcblx0aWYodGhpcy5jdXJyZW50KSByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG5cclxuXHRmb3IodmFyIHR5cGUgaW4gaGFuZGxlcnMpe1xyXG5cdFx0dmFyIGhhbmRsZXIgPSBoYW5kbGVyc1t0eXBlXTtcclxuXHRcdGlmKGhhbmRsZXIuY2FuVXNlSXQoKSlcclxuXHRcdHtcclxuXHRcdFx0dGhpcy5jdXJyZW50ID0gbmV3IGhhbmRsZXIoKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY3VycmVudDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBFbGVtZW50SGFuZGxlckZhY3RvcnkoKTsiLCJ2YXIgRWxlbWVudEhhbmRsZXJGYWN0b3J5ID0gcmVxdWlyZShcIi4vZWxlbWVudC1oYW5kbGVyLWZhY3RvcnlcIik7XHJcblxyXG5mdW5jdGlvbiBFbGVtZW50SGFuZGxlcigpe1xyXG5cdHRoaXMuaGFuZGxlciA9IEVsZW1lbnRIYW5kbGVyRmFjdG9yeS5jcmVhdGUoKTtcclxufVxyXG5cclxuRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLnNldEhhbmRsZXIgPSBmdW5jdGlvbihoYW5kbGVyKXtcclxuXHR0aGlzLmhhbmRsZXIgPSBoYW5kbGVyIHx8IEVsZW1lbnRIYW5kbGVyRmFjdG9yeS5jcmVhdGUoKTtcclxufTtcclxuXHJcbkVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24odGFnLCB2YWx1ZSl7XHJcblx0cmV0dXJuIHRoaXMuaGFuZGxlci5jcmVhdGVFbGVtZW50KHRhZywgdmFsdWUpO1xyXG59O1xyXG5cclxuRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZUZyYWdtZW50ID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5oYW5kbGVyLmNyZWF0ZUZyYWdtZW50KCk7XHJcbn07XHJcblxyXG5FbGVtZW50SGFuZGxlci5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG5cdHJldHVybiB0aGlzLmhhbmRsZXIucmVwbGFjZShlbGVtZW50KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IEVsZW1lbnRIYW5kbGVyKCk7Il19
