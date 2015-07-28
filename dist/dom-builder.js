(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DomNode = require("./dom-node");
var elementHandler = require("./element-handler");
var DomNodePipeMixin = require("./dom-node-pipe-mixin"); 

function DomBuilder(){
	
	this.children = [];
	DomNodePipeMixin.apply(this, DomNode);
	this.elementHandler = elementHandler;
}

DomBuilder.prototype.setHandler = function(handler){
	this.elementHandler.setHandler(handler);
};

DomBuilder.setHandler = function(handler){
	elementHandler.setHandler(handler);
};

DomBuilder.prototype.resolve = function(){

	var documentFragment = this.elementHandler.createFragment();

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

function observeProperty(parent, name){
	var value = parent[name];
	delete parent[name];
	Object.defineProperty(parent, name, {
		get: function(){
			return value;
		},
		set: function(v){
			value = v;
			this._updateNeeded = true;
		}
	});
}

function DomNode(element, children, attrs){

	if(typeof attrs === "undefined" ){
		if( (typeof children === "string" || children instanceof DomNode || children instanceof Array ) === false ){
			attrs = children;
			children = [];
		}
	}

	if(typeof children !== "undefined" && children instanceof Array === false){
		children = [children];
	}


	this.element = element;
	this.children = children || [];
	this.attrs = attrs || {}; 
	this.parent = null;
	this._updateNeeded = true;
	this.normalizeChildren();	
	DomNodePipeMixin.apply(this, DomNode);	

	observeProperty(this, "element");
	observeProperty(this, "parent");
	observeProperty(this, "attrs");
	observeProperty(this, "children");
}

DomNode.prototype.normalizeChildren = function(){

	this.children = this.children.map(function(child){
		if(typeof child == "string" && this.element != "#text"){
			return new DomNode("#text", child);
		}
		return child;
	}.bind(this));	
	this._updateNeeded = true;
};

DomNode.prototype.attr = function (attrs) {
	for(var attr in attrs){
		this.attrs[attr] = attrs[attr];
	}
	this._updateNeeded = true;
	return this;
};
   
DomNode.prototype.buildOut = function() {

	if("ref" in this && this.ref !== null && !this._updateNeeded){
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
	this._updateNeeded = false;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZG9tLWJ1aWxkZXIuanMiLCJzcmMvZG9tLW5vZGUtcGlwZS1taXhpbi5qcyIsInNyYy9kb20tbm9kZS5qcyIsInNyYy9lbGVtZW50LWhhbmRsZXIvYnJvd3Nlci1lbGVtZW50LWhhbmRsZXIuanMiLCJzcmMvZWxlbWVudC1oYW5kbGVyL2VsZW1lbnQtaGFuZGxlci1mYWN0b3J5LmpzIiwic3JjL2VsZW1lbnQtaGFuZGxlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgRG9tTm9kZSA9IHJlcXVpcmUoXCIuL2RvbS1ub2RlXCIpO1xyXG52YXIgZWxlbWVudEhhbmRsZXIgPSByZXF1aXJlKFwiLi9lbGVtZW50LWhhbmRsZXJcIik7XHJcbnZhciBEb21Ob2RlUGlwZU1peGluID0gcmVxdWlyZShcIi4vZG9tLW5vZGUtcGlwZS1taXhpblwiKTsgXHJcblxyXG5mdW5jdGlvbiBEb21CdWlsZGVyKCl7XHJcblx0XHJcblx0dGhpcy5jaGlsZHJlbiA9IFtdO1xyXG5cdERvbU5vZGVQaXBlTWl4aW4uYXBwbHkodGhpcywgRG9tTm9kZSk7XHJcblx0dGhpcy5lbGVtZW50SGFuZGxlciA9IGVsZW1lbnRIYW5kbGVyO1xyXG59XHJcblxyXG5Eb21CdWlsZGVyLnByb3RvdHlwZS5zZXRIYW5kbGVyID0gZnVuY3Rpb24oaGFuZGxlcil7XHJcblx0dGhpcy5lbGVtZW50SGFuZGxlci5zZXRIYW5kbGVyKGhhbmRsZXIpO1xyXG59O1xyXG5cclxuRG9tQnVpbGRlci5zZXRIYW5kbGVyID0gZnVuY3Rpb24oaGFuZGxlcil7XHJcblx0ZWxlbWVudEhhbmRsZXIuc2V0SGFuZGxlcihoYW5kbGVyKTtcclxufTtcclxuXHJcbkRvbUJ1aWxkZXIucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgZG9jdW1lbnRGcmFnbWVudCA9IHRoaXMuZWxlbWVudEhhbmRsZXIuY3JlYXRlRnJhZ21lbnQoKTtcclxuXHJcblx0dGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0dmFyIGJ1aWxkZWROb2RlID0gbm9kZS5idWlsZE91dCgpO1xyXG5cdFx0ZG9jdW1lbnRGcmFnbWVudC5hcHBlbmRDaGlsZChidWlsZGVkTm9kZSk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBkb2N1bWVudEZyYWdtZW50O1xyXG5cclxufTtcclxuXHJcbkRvbUJ1aWxkZXIucHJvdG90eXBlLmF0dGFjaE9uID0gZnVuY3Rpb24ocGFyZW50KXtcclxuXHJcblx0dmFyIGZyYWdtZW50ID0gdGhpcy5yZXNvbHZlKCk7XHJcblx0cGFyZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcclxuXHRyZXR1cm4gZnJhZ21lbnQ7XHJcblxyXG59O1xyXG5cclxuXHJcbi8vZXhwb3NpbmcgbW9kdWxlXHJcblxyXG5pZih0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpe1xyXG5cdC8vZXhwb3NlIHRvIEFNRFxyXG5cclxuXHRkZWZpbmUoZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBEb21CdWlsZGVyO1xyXG5cdH0pO1xyXG5cclxufSBlbHNlIGlmKHR5cGVvZiB3aW5kb3cgPT0gXCJvYmplY3RcIil7XHJcblx0Ly9lbHNlIGV4cG9zZSBkaXJlY3RseVxyXG5cclxuXHR3aW5kb3cuRG9tQnVpbGRlciA9IERvbUJ1aWxkZXI7XHJcbn1cclxuXHJcbi8vZXhwb3NlIHRvIGJyb3dzZXJpZnkgYW5kIG5vZGVcclxubW9kdWxlLmV4cG9ydHMgPSBEb21CdWlsZGVyOyIsIi8vYmVoYXZpb3VyXHJcblxyXG5mdW5jdGlvbiBtaXhJbihjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yKXtcclxuXHRyZXR1cm4ge1xyXG5cdFx0YmVoYXZpb3VyOiBhZGRCZWhhdmlvdXIuYmluZCh0aGlzLCBjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yKVxyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEJlaGF2aW91cihjb25zdHJ1Y3RvciwgRG9tTm9kZUNvbnN0cnVjdG9yLCBiZWhhdmlvdXJOYW1lKXtcclxuXHR2YXIgYmVoYXZpb3VyID0gYmVoYXZpb3Vyc1tiZWhhdmlvdXJOYW1lXTtcclxuXHRjb25zdHJ1Y3RvcltiZWhhdmlvdXJOYW1lXSA9IGJlaGF2aW91cihEb21Ob2RlQ29uc3RydWN0b3IpO1xyXG5cdHJldHVybiB7XHJcblx0XHRiZWhhdmlvdXI6IGFkZEJlaGF2aW91ci5iaW5kKHRoaXMsIGNvbnN0cnVjdG9yLCBEb21Ob2RlQ29uc3RydWN0b3IpXHJcblx0fTtcclxufVxyXG5cclxudmFyIGJlaGF2aW91cnMgPSB7XHJcblx0YmVnaW46IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG5cdFx0XHR2YXIgY2hpbGROb2RlID0gbmV3IERvbU5vZGUoZWxlbWVudCk7XHJcblx0XHRcdGNoaWxkTm9kZS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHR0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGROb2RlKTtcclxuXHRcdFx0cmV0dXJuIGNoaWxkTm9kZSA7XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0Y2hpbGQ6IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIGNoaWxkcmVuLCBhdHRycyl7XHJcblx0XHRcdHZhciBjaGlsZE5vZGUgPSBuZXcgRG9tTm9kZShlbGVtZW50LCBjaGlsZHJlbiwgYXR0cnMpO1xyXG5cdFx0XHRjaGlsZE5vZGUucGFyZW50ID0gdGhpcztcclxuXHRcdFx0dGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkTm9kZSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cdHRleHQ6IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuICBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNoaWxkKFwiI3RleHRcIiwgdmFsdWUpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cdGNsb3NlOiAgZnVuY3Rpb24oRG9tTm9kZSl7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYodGhpcy5wYXJlbnQpIHJldHVybiB0aGlzLnBhcmVudDtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHRcclxuXHRcdH07XHJcblx0fVxyXG59O1xyXG4gXHJcbi8vbWl4aW4gY29udGFpbmVyXHJcbmZ1bmN0aW9uIERvbU5vZGVQaXBlTWl4aW4oKXtcclxuXHJcbn1cclxuXHJcbkRvbU5vZGVQaXBlTWl4aW4ucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob2JqZWN0LCBEb21Ob2RlQ29uc3RydWN0b3Ipe1xyXG5cclxuXHRcdGlmKCBvYmplY3QuY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2Upe1xyXG5cdFx0XHRvYmplY3QuY2hpbGRyZW4gPSBbXTtcclxuXHRcdH1cclxuXHJcblx0XHRtaXhJbihvYmplY3QsIERvbU5vZGVDb25zdHJ1Y3RvcilcclxuXHRcdFx0LmJlaGF2aW91cihcImJlZ2luXCIpXHJcblx0XHRcdC5iZWhhdmlvdXIoXCJjbG9zZVwiKVxyXG5cdFx0XHQuYmVoYXZpb3VyKFwiY2hpbGRcIilcclxuXHRcdFx0LmJlaGF2aW91cihcInRleHRcIik7XHRcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IERvbU5vZGVQaXBlTWl4aW4oKTsiLCJ2YXIgZWxlbWVudEhhbmRsZXIgPSByZXF1aXJlKFwiLi9lbGVtZW50LWhhbmRsZXJcIik7XHJcbnZhciBEb21Ob2RlUGlwZU1peGluID0gcmVxdWlyZShcIi4vZG9tLW5vZGUtcGlwZS1taXhpblwiKTtcclxuXHJcbmZ1bmN0aW9uIG9ic2VydmVQcm9wZXJ0eShwYXJlbnQsIG5hbWUpe1xyXG5cdHZhciB2YWx1ZSA9IHBhcmVudFtuYW1lXTtcclxuXHRkZWxldGUgcGFyZW50W25hbWVdO1xyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwYXJlbnQsIG5hbWUsIHtcclxuXHRcdGdldDogZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIHZhbHVlO1xyXG5cdFx0fSxcclxuXHRcdHNldDogZnVuY3Rpb24odil7XHJcblx0XHRcdHZhbHVlID0gdjtcclxuXHRcdFx0dGhpcy5fdXBkYXRlTmVlZGVkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gRG9tTm9kZShlbGVtZW50LCBjaGlsZHJlbiwgYXR0cnMpe1xyXG5cclxuXHRpZih0eXBlb2YgYXR0cnMgPT09IFwidW5kZWZpbmVkXCIgKXtcclxuXHRcdGlmKCAodHlwZW9mIGNoaWxkcmVuID09PSBcInN0cmluZ1wiIHx8IGNoaWxkcmVuIGluc3RhbmNlb2YgRG9tTm9kZSB8fCBjaGlsZHJlbiBpbnN0YW5jZW9mIEFycmF5ICkgPT09IGZhbHNlICl7XHJcblx0XHRcdGF0dHJzID0gY2hpbGRyZW47XHJcblx0XHRcdGNoaWxkcmVuID0gW107XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZih0eXBlb2YgY2hpbGRyZW4gIT09IFwidW5kZWZpbmVkXCIgJiYgY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2Upe1xyXG5cdFx0Y2hpbGRyZW4gPSBbY2hpbGRyZW5dO1xyXG5cdH1cclxuXHJcblxyXG5cdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0dGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuIHx8IFtdO1xyXG5cdHRoaXMuYXR0cnMgPSBhdHRycyB8fCB7fTsgXHJcblx0dGhpcy5wYXJlbnQgPSBudWxsO1xyXG5cdHRoaXMuX3VwZGF0ZU5lZWRlZCA9IHRydWU7XHJcblx0dGhpcy5ub3JtYWxpemVDaGlsZHJlbigpO1x0XHJcblx0RG9tTm9kZVBpcGVNaXhpbi5hcHBseSh0aGlzLCBEb21Ob2RlKTtcdFxyXG5cclxuXHRvYnNlcnZlUHJvcGVydHkodGhpcywgXCJlbGVtZW50XCIpO1xyXG5cdG9ic2VydmVQcm9wZXJ0eSh0aGlzLCBcInBhcmVudFwiKTtcclxuXHRvYnNlcnZlUHJvcGVydHkodGhpcywgXCJhdHRyc1wiKTtcclxuXHRvYnNlcnZlUHJvcGVydHkodGhpcywgXCJjaGlsZHJlblwiKTtcclxufVxyXG5cclxuRG9tTm9kZS5wcm90b3R5cGUubm9ybWFsaXplQ2hpbGRyZW4gPSBmdW5jdGlvbigpe1xyXG5cclxuXHR0aGlzLmNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0aWYodHlwZW9mIGNoaWxkID09IFwic3RyaW5nXCIgJiYgdGhpcy5lbGVtZW50ICE9IFwiI3RleHRcIil7XHJcblx0XHRcdHJldHVybiBuZXcgRG9tTm9kZShcIiN0ZXh0XCIsIGNoaWxkKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjaGlsZDtcclxuXHR9LmJpbmQodGhpcykpO1x0XHJcblx0dGhpcy5fdXBkYXRlTmVlZGVkID0gdHJ1ZTtcclxufTtcclxuXHJcbkRvbU5vZGUucHJvdG90eXBlLmF0dHIgPSBmdW5jdGlvbiAoYXR0cnMpIHtcclxuXHRmb3IodmFyIGF0dHIgaW4gYXR0cnMpe1xyXG5cdFx0dGhpcy5hdHRyc1thdHRyXSA9IGF0dHJzW2F0dHJdO1xyXG5cdH1cclxuXHR0aGlzLl91cGRhdGVOZWVkZWQgPSB0cnVlO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4gICBcclxuRG9tTm9kZS5wcm90b3R5cGUuYnVpbGRPdXQgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0aWYoXCJyZWZcIiBpbiB0aGlzICYmIHRoaXMucmVmICE9PSBudWxsICYmICF0aGlzLl91cGRhdGVOZWVkZWQpe1xyXG5cdFx0cmV0dXJuIHRoaXMucmVmO1xyXG5cdH1cclxuXHJcblx0dmFyIGJ1aWxkZWRDaGlsZHJlbiA9IFtdO1xyXG5cclxuXHR0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0aWYoY2hpbGQgJiYgdHlwZW9mIGNoaWxkICE9IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRjaGlsZCA9IGNoaWxkLmJ1aWxkT3V0KCk7XHJcblx0XHR9XHJcblx0XHRidWlsZGVkQ2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcblx0fSk7XHJcblxyXG5cdHZhciBidWlsZGVkTm9kZSA9IGVsZW1lbnRIYW5kbGVyLmNyZWF0ZUVsZW1lbnQodGhpcy5lbGVtZW50LCBidWlsZGVkQ2hpbGRyZW4pO1xyXG5cclxuXHRpZihcInNldEF0dHJpYnV0ZVwiIGluIGJ1aWxkZWROb2RlKXtcclxuXHRcdGZvcih2YXIgYXR0cmlidXRlTmFtZSBpbiB0aGlzLmF0dHJzKXtcclxuXHRcdFx0dmFyIGF0dHJpYnV0ZVZhbHVlID0gdGhpcy5hdHRyc1thdHRyaWJ1dGVOYW1lXTtcclxuXHRcdFx0YnVpbGRlZE5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0dGhpcy5yZWYgPSBidWlsZGVkTm9kZTtcclxuXHR0aGlzLl91cGRhdGVOZWVkZWQgPSBmYWxzZTtcclxuXHRyZXR1cm4gYnVpbGRlZE5vZGU7XHJcbn07XHJcblxyXG5Eb21Ob2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xyXG4gXHR2YXIgcmVmID0gdGhpcy5yZWY7XHJcbiBcdHRoaXMucmVmID0gbnVsbDtcclxuXHRlbGVtZW50SGFuZGxlclxyXG5cdFx0LnJlcGxhY2UocmVmKVxyXG5cdFx0LmJ5KHRoaXMuYnVpbGRPdXQoKSk7IFxyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRG9tTm9kZTsiLCJmdW5jdGlvbiBCcm93c2VyRWxlbWVudEhhbmRsZXIoKXtcclxuXHJcbn1cclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5jYW5Vc2VJdCA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdHRyeXtcclxuXHRcdGlmKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYodHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKXtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICE9PSBcImZ1bmN0aW9uXCIpe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYodHlwZW9mIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlICE9PSBcImZ1bmN0aW9uXCIpe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYodHlwZW9mIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQgIT09IFwiZnVuY3Rpb25cIil7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0fWNhdGNoKGUpe1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZVRleHQgPSBmdW5jdGlvbih2YWx1ZSl7XHJcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcclxufTtcclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5wcm90b3R5cGUuY3JlYXRlTm9kZSA9IGZ1bmN0aW9uKHRhZywgY2hpbGRyZW4pe1xyXG5cdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xyXG5cdGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0ZWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcblx0fSk7XHJcblx0cmV0dXJuIGVsZW1lbnQ7XHJcbn07XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbih0YWcsIHZhbHVlKXtcclxuXHRpZih0YWcgPT09IFwiI3RleHRcIil7XHJcblx0XHRyZXR1cm4gdGhpcy5jcmVhdGVUZXh0KHZhbHVlKTtcclxuXHR9ZWxzZXtcclxuXHRcdHJldHVybiB0aGlzLmNyZWF0ZU5vZGUodGFnLCB2YWx1ZSk7XHJcblx0fVxyXG59O1xyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVGcmFnbWVudCA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxufTtcclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG5cdHZhciBjaGlsZHJlbiA9IGVsZW1lbnQuY2hpbGROb2RlcztcclxuXHRcclxuXHRmb3IodmFyIGk7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKyl7XHJcblx0XHR2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcclxuXHRcdGVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG5cdH1cclxuXHJcblx0dmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGJ5OiBmdW5jdGlvbihuZXdFbGVtZW50KXtcclxuXHRcdFx0cGFyZW50LnJlcGxhY2VDaGlsZChuZXdFbGVtZW50LCBlbGVtZW50KTtcclxuXHRcdH1cclxuXHR9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyRWxlbWVudEhhbmRsZXI7IiwidmFyIGhhbmRsZXJzID0ge1xyXG5cdEJyb3dzZXJFbGVtZW50SGFuZGxlcjogcmVxdWlyZShcIi4vYnJvd3Nlci1lbGVtZW50LWhhbmRsZXJcIilcclxufTtcclxuXHJcbmZ1bmN0aW9uIEVsZW1lbnRIYW5kbGVyRmFjdG9yeSgpe1xyXG5cclxuXHR0aGlzLmN1cnJlbnQgPSBudWxsO1xyXG5cclxufVxyXG5cclxuRWxlbWVudEhhbmRsZXJGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpe1xyXG5cdGlmKHRoaXMuY3VycmVudCkgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuXHJcblx0Zm9yKHZhciB0eXBlIGluIGhhbmRsZXJzKXtcclxuXHRcdHZhciBoYW5kbGVyID0gaGFuZGxlcnNbdHlwZV07XHJcblx0XHRpZihoYW5kbGVyLmNhblVzZUl0KCkpXHJcblx0XHR7XHJcblx0XHRcdHRoaXMuY3VycmVudCA9IG5ldyBoYW5kbGVyKCk7XHJcblx0XHRcdHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRWxlbWVudEhhbmRsZXJGYWN0b3J5KCk7IiwidmFyIEVsZW1lbnRIYW5kbGVyRmFjdG9yeSA9IHJlcXVpcmUoXCIuL2VsZW1lbnQtaGFuZGxlci1mYWN0b3J5XCIpO1xyXG5cclxuZnVuY3Rpb24gRWxlbWVudEhhbmRsZXIoKXtcclxuXHR0aGlzLmhhbmRsZXIgPSBFbGVtZW50SGFuZGxlckZhY3RvcnkuY3JlYXRlKCk7XHJcbn1cclxuXHJcbkVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5zZXRIYW5kbGVyID0gZnVuY3Rpb24oaGFuZGxlcil7XHJcblx0dGhpcy5oYW5kbGVyID0gaGFuZGxlciB8fCBFbGVtZW50SGFuZGxlckZhY3RvcnkuY3JlYXRlKCk7XHJcbn07XHJcblxyXG5FbGVtZW50SGFuZGxlci5wcm90b3R5cGUuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZywgdmFsdWUpe1xyXG5cdHJldHVybiB0aGlzLmhhbmRsZXIuY3JlYXRlRWxlbWVudCh0YWcsIHZhbHVlKTtcclxufTtcclxuXHJcbkVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVGcmFnbWVudCA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHRoaXMuaGFuZGxlci5jcmVhdGVGcmFnbWVudCgpO1xyXG59O1xyXG5cclxuRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbihlbGVtZW50KXtcclxuXHRyZXR1cm4gdGhpcy5oYW5kbGVyLnJlcGxhY2UoZWxlbWVudCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBFbGVtZW50SGFuZGxlcigpOyJdfQ==
