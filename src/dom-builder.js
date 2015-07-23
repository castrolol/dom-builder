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