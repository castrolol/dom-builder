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