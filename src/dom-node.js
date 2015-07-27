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