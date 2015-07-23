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