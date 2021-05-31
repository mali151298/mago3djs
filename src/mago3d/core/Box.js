'use strict';

/**
 * This class is needed to be implemented more, but it will be used at the future.
 * @class Box
 */
var Box = function(width, length, height) 
{
	if (!(this instanceof Box)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.mesh;
	this.vbo_vicks_container;
	this.vbo_vicks_containerEdges;
	this.centerPoint;
	this.width;
	this.length;
	this.height;
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

};

/**
 * Get the VBO key container
 */
Box.prototype.getVboKeysContainer = function()
{
	return this.vbo_vicks_container;
};

/**
 * Render this box feature
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 */
Box.prototype.render = function(magoManager, shader, renderType)
{
	if (this.mesh === undefined)
	{
		this.mesh = this.makeMesh(this.width, this.length, this.height);
		return;
	}

	this.mesh.render(magoManager, shader, renderType);
};

/**
 * Set the width,length, height of this feature
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
Box.prototype.makeMesh = function(width, length, height)
{
	// check dimensions of the box.
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }
	
	if (this.width === undefined)
	{ this.width = 1; }
	
	if (this.length === undefined)
	{ this.length = 1; }
	
	if (this.height === undefined)
	{ this.height = 1; }
	
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point3D(0, 0, 0); }
	
	if (this.vbo_vicks_container === undefined)
	{ this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); }
	
	if (this.vbo_vicks_containerEdges === undefined)
	{ this.vbo_vicks_containerEdges = new VBOVertexIdxCacheKeysContainer(); }
	
	// Create a parametric mesh.
	var pMesh = new ParametricMesh();
		
	// Create a Profile2d.
	pMesh.profile = new Profile2D(); 
	var profileAux = pMesh.profile; 
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	var rect = outerRing.newElement("RECTANGLE");
	rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	pMesh.extrude(profileAux, this.height, extrudeSegmentsCount, extrusionVector);
	
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	var mesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	
	// translate the box bcos center the origen to the center of the box.
	mesh.translate(0, 0, -this.height/2);

	return mesh;
};




































