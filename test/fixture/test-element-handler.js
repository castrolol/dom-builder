function TestElementHandler(){
	
}


TestElementHandler.prototype.createElement = function(tag, value){
	return "a fake element";
};

TestElementHandler.prototype.createFragment = function(){
	return "a fake fragment";
};

TestElementHandler.prototype.replace = function(element){
	return {
		by: function(){
			return "a fake by";
		}
	};
};

module.exports = TestElementHandler;