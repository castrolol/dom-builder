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