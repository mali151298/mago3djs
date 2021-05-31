'use strict';

/**
 * AnimationManager
 * @class AnimationManager
 */
var AnimationManager = function() 
{
	if (!(this instanceof AnimationManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.nodesMap;	
};

/**
 * put the node which will move
 * @param {Node} node
 */
AnimationManager.prototype.putNode = function(node) 
{
	if (this.nodesMap === undefined)
	{ this.nodesMap = {}; }
	
	var nodeId = node.data.nodeId;
	this.nodesMap[nodeId] = node;
};

/**
 * Check whether this node already moved or not
 * @param {MagoManager} magoManager
 */
AnimationManager.prototype.checkAnimation = function(magoManager) 
{
	if (this.nodesMap === undefined)
	{ return; }
	
	var node;
	for (var key in this.nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesMap, key))
		{
			node = this.nodesMap[key];
			if (node.finishedAnimation(magoManager))
			{
				delete this.nodesMap[key];
			}
		}
	}
};
