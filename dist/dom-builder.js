(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DomNode = require("./dom-node");
var elementHandler = require("./element-handler");
var DomNodePipeMixin = require("./dom-node-pipe-mixin"); 

function DomBuilder(){
	
	this.children = [];
	DomNodePipeMixin.apply(this, DomNode);
}


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
	constructor.prototype[behaviourName] = behaviour(DomNodeConstructor);
	return {
		behaviour: addBehaviour.bind(this, constructor, DomNodeConstructor)
	};
}

var behaviours = {
	begin: function(DomNode){
		return function(element){
			var childNode = new DomNode(element);
			childNode .parent = this;
			this.nodes.push(childNode);
			return childNode ;
		};
	},
	child: function(DomNode){
		return function(element, children, attrs){
			var childNode = new DomNode(element, children, attrs);
			childNode .parent = this;
			this.nodes.push(childNode);
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

DomNodePipeMixin.apply = function(object, DomNodeConstructor){

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

	if(typeof children !== "undefined" && children instanceof Array === false){
		children = [children];
	}

	this.element = element;
	this.children = children || [];
	this.attrs = attrs; 
	this.parent = null;
	this.normalizeChildren();
	DomNodePipeMixin.apply(this, DomNode);		

}

DomNode.prototype.normalizeChildren = function(){

	this.children = this.children.map(function(child){
		if(typeof child == "string" && element != "#text"){
			return new DomNode("#text", child);
		}
		return child;
	});	
};

DomNode.prototype.attr = function (attrs) {
	this.attrs = attrs;
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
 
	elementHandler
		.replace(this.ref)
		.by(this.buildOut()); 
};
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

BrowserElementHandler.prototype.createNode = function(tag, chil){
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
	
	children.forEach(function(child){
		element.removeChild(child);
	});

	var parent = element.parentElement;

	return {
		by: function(newElement){
			parent.replaceChild(element, newElement);
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
			this.current = handler;
			return handler;
		}
	}


};


module.exports = new ElementHandlerFactory();
},{"./browser-element-handler":4}],6:[function(require,module,exports){
var ElementHandlerFactory = require("./element-handler-factory");

function ElementHandler(){
	this.handler = ElementHandlerFactory.create();
}

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZG9tLWJ1aWxkZXIuanMiLCJzcmMvZG9tLW5vZGUtcGlwZS1taXhpbi5qcyIsInNyYy9kb20tbm9kZS5qcyIsInNyYy9lbGVtZW50LWhhbmRsZXIvYnJvd3Nlci1lbGVtZW50LWhhbmRsZXIuanMiLCJzcmMvZWxlbWVudC1oYW5kbGVyL2VsZW1lbnQtaGFuZGxlci1mYWN0b3J5LmpzIiwic3JjL2VsZW1lbnQtaGFuZGxlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBEb21Ob2RlID0gcmVxdWlyZShcIi4vZG9tLW5vZGVcIik7XHJcbnZhciBlbGVtZW50SGFuZGxlciA9IHJlcXVpcmUoXCIuL2VsZW1lbnQtaGFuZGxlclwiKTtcclxudmFyIERvbU5vZGVQaXBlTWl4aW4gPSByZXF1aXJlKFwiLi9kb20tbm9kZS1waXBlLW1peGluXCIpOyBcclxuXHJcbmZ1bmN0aW9uIERvbUJ1aWxkZXIoKXtcclxuXHRcclxuXHR0aGlzLmNoaWxkcmVuID0gW107XHJcblx0RG9tTm9kZVBpcGVNaXhpbi5hcHBseSh0aGlzLCBEb21Ob2RlKTtcclxufVxyXG5cclxuXHJcbkRvbUJ1aWxkZXIucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgZG9jdW1lbnRGcmFnbWVudCA9IGVsZW1lbnRIYW5kbGVyLmNyZWF0ZUZyYWdtZW50KCk7XHJcblxyXG5cdHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihub2RlKXtcclxuXHRcdHZhciBidWlsZGVkTm9kZSA9IG5vZGUuYnVpbGRPdXQoKTtcclxuXHRcdGRvY3VtZW50RnJhZ21lbnQuYXBwZW5kQ2hpbGQoYnVpbGRlZE5vZGUpO1xyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gZG9jdW1lbnRGcmFnbWVudDtcclxuXHJcbn07XHJcblxyXG5Eb21CdWlsZGVyLnByb3RvdHlwZS5hdHRhY2hPbiA9IGZ1bmN0aW9uKHBhcmVudCl7XHJcblxyXG5cdHZhciBmcmFnbWVudCA9IHRoaXMucmVzb2x2ZSgpO1xyXG5cdHBhcmVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XHJcblx0cmV0dXJuIGZyYWdtZW50O1xyXG5cclxufTtcclxuXHJcblxyXG4vL2V4cG9zaW5nIG1vZHVsZVxyXG5cclxuaWYodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiKXtcclxuXHQvL2V4cG9zZSB0byBBTURcclxuXHJcblx0ZGVmaW5lKGZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gRG9tQnVpbGRlcjtcclxuXHR9KTtcclxuXHJcbn0gZWxzZSBpZih0eXBlb2Ygd2luZG93ID09IFwib2JqZWN0XCIpe1xyXG5cdC8vZWxzZSBleHBvc2UgZGlyZWN0bHlcclxuXHJcblx0d2luZG93LkRvbUJ1aWxkZXIgPSBEb21CdWlsZGVyO1xyXG59XHJcblxyXG4vL2V4cG9zZSB0byBicm93c2VyaWZ5IGFuZCBub2RlXHJcbm1vZHVsZS5leHBvcnRzID0gRG9tQnVpbGRlcjsiLCIvL2JlaGF2aW91clxyXG5cclxuZnVuY3Rpb24gbWl4SW4oY29uc3RydWN0b3IsIERvbU5vZGVDb25zdHJ1Y3Rvcil7XHJcblx0cmV0dXJuIHtcclxuXHRcdGJlaGF2aW91cjogYWRkQmVoYXZpb3VyLmJpbmQodGhpcywgY29uc3RydWN0b3IsIERvbU5vZGVDb25zdHJ1Y3RvcilcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRCZWhhdmlvdXIoY29uc3RydWN0b3IsIERvbU5vZGVDb25zdHJ1Y3RvciwgYmVoYXZpb3VyTmFtZSl7XHJcblx0dmFyIGJlaGF2aW91ciA9IGJlaGF2aW91cnNbYmVoYXZpb3VyTmFtZV07XHJcblx0Y29uc3RydWN0b3IucHJvdG90eXBlW2JlaGF2aW91ck5hbWVdID0gYmVoYXZpb3VyKERvbU5vZGVDb25zdHJ1Y3Rvcik7XHJcblx0cmV0dXJuIHtcclxuXHRcdGJlaGF2aW91cjogYWRkQmVoYXZpb3VyLmJpbmQodGhpcywgY29uc3RydWN0b3IsIERvbU5vZGVDb25zdHJ1Y3RvcilcclxuXHR9O1xyXG59XHJcblxyXG52YXIgYmVoYXZpb3VycyA9IHtcclxuXHRiZWdpbjogZnVuY3Rpb24oRG9tTm9kZSl7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZWxlbWVudCl7XHJcblx0XHRcdHZhciBjaGlsZE5vZGUgPSBuZXcgRG9tTm9kZShlbGVtZW50KTtcclxuXHRcdFx0Y2hpbGROb2RlIC5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHR0aGlzLm5vZGVzLnB1c2goY2hpbGROb2RlKTtcclxuXHRcdFx0cmV0dXJuIGNoaWxkTm9kZSA7XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0Y2hpbGQ6IGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIGNoaWxkcmVuLCBhdHRycyl7XHJcblx0XHRcdHZhciBjaGlsZE5vZGUgPSBuZXcgRG9tTm9kZShlbGVtZW50LCBjaGlsZHJlbiwgYXR0cnMpO1xyXG5cdFx0XHRjaGlsZE5vZGUgLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdHRoaXMubm9kZXMucHVzaChjaGlsZE5vZGUpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH07XHJcblx0fSxcclxuXHR0ZXh0OiBmdW5jdGlvbihEb21Ob2RlKXtcclxuXHRcdHJldHVybiAgZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jaGlsZChcIiN0ZXh0XCIsIHZhbHVlKTtcclxuXHRcdH07XHJcblx0fSxcclxuXHRjbG9zZTogIGZ1bmN0aW9uKERvbU5vZGUpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKHRoaXMucGFyZW50KSByZXR1cm4gdGhpcy5wYXJlbnQ7XHJcblx0XHRcdHJldHVybiB0aGlzO1x0XHJcblx0XHR9O1xyXG5cdH1cclxufTtcclxuIFxyXG4vL21peGluIGNvbnRhaW5lclxyXG5mdW5jdGlvbiBEb21Ob2RlUGlwZU1peGluKCl7XHJcblxyXG59XHJcblxyXG5Eb21Ob2RlUGlwZU1peGluLmFwcGx5ID0gZnVuY3Rpb24ob2JqZWN0LCBEb21Ob2RlQ29uc3RydWN0b3Ipe1xyXG5cclxuXHRcdGlmKCBvYmplY3QuY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2Upe1xyXG5cdFx0XHRvYmplY3QuY2hpbGRyZW4gPSBbXTtcclxuXHRcdH1cclxuXHJcblx0XHRtaXhJbihvYmplY3QsIERvbU5vZGVDb25zdHJ1Y3RvcilcclxuXHRcdFx0LmJlaGF2aW91cihcImJlZ2luXCIpXHJcblx0XHRcdC5iZWhhdmlvdXIoXCJjbG9zZVwiKVxyXG5cdFx0XHQuYmVoYXZpb3VyKFwiY2hpbGRcIilcclxuXHRcdFx0LmJlaGF2aW91cihcInRleHRcIik7XHRcclxufTtcclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRG9tTm9kZVBpcGVNaXhpbigpOyIsInZhciBlbGVtZW50SGFuZGxlciA9IHJlcXVpcmUoXCIuL2VsZW1lbnQtaGFuZGxlclwiKTtcclxudmFyIERvbU5vZGVQaXBlTWl4aW4gPSByZXF1aXJlKFwiLi9kb20tbm9kZS1waXBlLW1peGluXCIpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIERvbU5vZGUoZWxlbWVudCwgY2hpbGRyZW4sIGF0dHJzKXtcclxuXHJcblx0aWYodHlwZW9mIGNoaWxkcmVuICE9PSBcInVuZGVmaW5lZFwiICYmIGNoaWxkcmVuIGluc3RhbmNlb2YgQXJyYXkgPT09IGZhbHNlKXtcclxuXHRcdGNoaWxkcmVuID0gW2NoaWxkcmVuXTtcclxuXHR9XHJcblxyXG5cdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0dGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuIHx8IFtdO1xyXG5cdHRoaXMuYXR0cnMgPSBhdHRyczsgXHJcblx0dGhpcy5wYXJlbnQgPSBudWxsO1xyXG5cdHRoaXMubm9ybWFsaXplQ2hpbGRyZW4oKTtcclxuXHREb21Ob2RlUGlwZU1peGluLmFwcGx5KHRoaXMsIERvbU5vZGUpO1x0XHRcclxuXHJcbn1cclxuXHJcbkRvbU5vZGUucHJvdG90eXBlLm5vcm1hbGl6ZUNoaWxkcmVuID0gZnVuY3Rpb24oKXtcclxuXHJcblx0dGhpcy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdGlmKHR5cGVvZiBjaGlsZCA9PSBcInN0cmluZ1wiICYmIGVsZW1lbnQgIT0gXCIjdGV4dFwiKXtcclxuXHRcdFx0cmV0dXJuIG5ldyBEb21Ob2RlKFwiI3RleHRcIiwgY2hpbGQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNoaWxkO1xyXG5cdH0pO1x0XHJcbn07XHJcblxyXG5Eb21Ob2RlLnByb3RvdHlwZS5hdHRyID0gZnVuY3Rpb24gKGF0dHJzKSB7XHJcblx0dGhpcy5hdHRycyA9IGF0dHJzO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4gICBcclxuRG9tTm9kZS5wcm90b3R5cGUuYnVpbGRPdXQgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0aWYoXCJyZWZcIiBpbiB0aGlzICYmIHRoaXMucmVmICE9PSBudWxsKXtcclxuXHRcdHJldHVybiB0aGlzLnJlZjtcclxuXHR9XHJcblxyXG5cdHZhciBidWlsZGVkQ2hpbGRyZW4gPSBbXTtcclxuXHJcblx0dGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdGlmKGNoaWxkICYmIHR5cGVvZiBjaGlsZCAhPSBcInN0cmluZ1wiKXtcclxuXHRcdFx0Y2hpbGQgPSBjaGlsZC5idWlsZE91dCgpO1xyXG5cdFx0fVxyXG5cdFx0YnVpbGRlZENoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgYnVpbGRlZE5vZGUgPSBlbGVtZW50SGFuZGxlci5jcmVhdGVFbGVtZW50KHRoaXMuZWxlbWVudCwgYnVpbGRlZENoaWxkcmVuKTtcclxuXHJcblx0aWYoXCJzZXRBdHRyaWJ1dGVcIiBpbiBidWlsZGVkTm9kZSl7XHJcblx0XHRmb3IodmFyIGF0dHJpYnV0ZU5hbWUgaW4gdGhpcy5hdHRycyl7XHJcblx0XHRcdHZhciBhdHRyaWJ1dGVWYWx1ZSA9IHRoaXMuYXR0cnNbYXR0cmlidXRlTmFtZV07XHJcblx0XHRcdGJ1aWxkZWROb2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMucmVmID0gYnVpbGRlZE5vZGU7XHJcblxyXG5cdHJldHVybiBidWlsZGVkTm9kZTtcclxufTtcclxuXHJcbkRvbU5vZGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XHJcbiBcclxuXHRlbGVtZW50SGFuZGxlclxyXG5cdFx0LnJlcGxhY2UodGhpcy5yZWYpXHJcblx0XHQuYnkodGhpcy5idWlsZE91dCgpKTsgXHJcbn07IiwiZnVuY3Rpb24gQnJvd3NlckVsZW1lbnRIYW5kbGVyKCl7XHJcblxyXG59XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIuY2FuVXNlSXQgPSBmdW5jdGlvbigpe1xyXG5cclxuXHR0cnl7XHJcblx0XHRpZih0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiKXtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKHR5cGVvZiBkb2N1bWVudCA9PT0gXCJ1bmRlZmluZWRcIil7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZih0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAhPT0gXCJmdW5jdGlvblwiKXtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSAhPT0gXCJmdW5jdGlvblwiKXtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50ICE9PSBcImZ1bmN0aW9uXCIpe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdH1jYXRjaChlKXtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVUZXh0ID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XHJcbn07XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbih0YWcsIGNoaWwpe1xyXG5cdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xyXG5cdGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0ZWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcblx0fSk7XHJcblx0cmV0dXJuIGVsZW1lbnQ7XHJcbn07XHJcblxyXG5Ccm93c2VyRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbih0YWcsIHZhbHVlKXtcclxuXHRpZih0YWcgPT09IFwiI3RleHRcIil7XHJcblx0XHRyZXR1cm4gdGhpcy5jcmVhdGVUZXh0KHZhbHVlKTtcclxuXHR9ZWxzZXtcclxuXHRcdHJldHVybiB0aGlzLmNyZWF0ZU5vZGUodGFnLCB2YWx1ZSk7XHJcblx0fVxyXG59O1xyXG5cclxuQnJvd3NlckVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVGcmFnbWVudCA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxufTtcclxuXHJcbkJyb3dzZXJFbGVtZW50SGFuZGxlci5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG5cdHZhciBjaGlsZHJlbiA9IGVsZW1lbnQuY2hpbGROb2RlcztcclxuXHRcclxuXHRjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdGVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgcGFyZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0Ynk6IGZ1bmN0aW9uKG5ld0VsZW1lbnQpe1xyXG5cdFx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKGVsZW1lbnQsIG5ld0VsZW1lbnQpO1xyXG5cdFx0fVxyXG5cdH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJFbGVtZW50SGFuZGxlcjsiLCJ2YXIgaGFuZGxlcnMgPSB7XHJcblx0QnJvd3NlckVsZW1lbnRIYW5kbGVyOiByZXF1aXJlKFwiLi9icm93c2VyLWVsZW1lbnQtaGFuZGxlclwiKVxyXG59O1xyXG5cclxuZnVuY3Rpb24gRWxlbWVudEhhbmRsZXJGYWN0b3J5KCl7XHJcblxyXG5cdHRoaXMuY3VycmVudCA9IG51bGw7XHJcblxyXG59XHJcblxyXG5cclxuRWxlbWVudEhhbmRsZXJGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpe1xyXG5cdGlmKHRoaXMuY3VycmVudCkgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuXHJcblx0Zm9yKHZhciB0eXBlIGluIGhhbmRsZXJzKXtcclxuXHRcdHZhciBoYW5kbGVyID0gaGFuZGxlcnNbdHlwZV07XHJcblx0XHRpZihoYW5kbGVyLmNhblVzZUl0KCkpXHJcblx0XHR7XHJcblx0XHRcdHRoaXMuY3VycmVudCA9IGhhbmRsZXI7XHJcblx0XHRcdHJldHVybiBoYW5kbGVyO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IEVsZW1lbnRIYW5kbGVyRmFjdG9yeSgpOyIsInZhciBFbGVtZW50SGFuZGxlckZhY3RvcnkgPSByZXF1aXJlKFwiLi9lbGVtZW50LWhhbmRsZXItZmFjdG9yeVwiKTtcclxuXHJcbmZ1bmN0aW9uIEVsZW1lbnRIYW5kbGVyKCl7XHJcblx0dGhpcy5oYW5kbGVyID0gRWxlbWVudEhhbmRsZXJGYWN0b3J5LmNyZWF0ZSgpO1xyXG59XHJcblxyXG5FbGVtZW50SGFuZGxlci5wcm90b3R5cGUuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZywgdmFsdWUpe1xyXG5cdHJldHVybiB0aGlzLmhhbmRsZXIuY3JlYXRlRWxlbWVudCh0YWcsIHZhbHVlKTtcclxufTtcclxuXHJcbkVsZW1lbnRIYW5kbGVyLnByb3RvdHlwZS5jcmVhdGVGcmFnbWVudCA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHRoaXMuaGFuZGxlci5jcmVhdGVGcmFnbWVudCgpO1xyXG59O1xyXG5cclxuRWxlbWVudEhhbmRsZXIucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbihlbGVtZW50KXtcclxuXHRyZXR1cm4gdGhpcy5oYW5kbGVyLnJlcGxhY2UoZWxlbWVudCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBFbGVtZW50SGFuZGxlcigpOyJdfQ==
