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