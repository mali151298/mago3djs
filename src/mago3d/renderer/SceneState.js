'use strict';

/**
 * This class contains the camera transformation matrices and other parameters that affects the scene.
 * @class SceneState
 */
var SceneState = function() 
{
	if (!(this instanceof SceneState)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.gl;

	// this contains the model matrices and camera position.
	this.modelViewProjRelToEyeMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewRelToEyeMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewRelToEyeMatrixInv = new Matrix4(); // created as identity matrix.
	this.modelViewMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewMatrixInv = new Matrix4(); // created as identity matrix.
	this.projectionMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewProjMatrix = new Matrix4(); // created as identity matrix.
	this.normalMatrix4 = new Matrix4(); // created as identity matrix.
	this.identityMatrix4 = new Matrix4(); // created as identity matrix.

	this.encodedCamPosHigh = new Float32Array([0.0, 0.0, 0.0]);
	this.encodedCamPosLow = new Float32Array([0.0, 0.0, 0.0]);
	
	this.camera = new Camera();
	this.drawingBufferWidth = new Int32Array([1000]);
	this.drawingBufferHeight = new Int32Array([1000]);
	this.mouseAction = new MouseAction();
	
	// lighting & ssao.
	this.ambientReflectionCoef = new Float32Array([0.45]); // 0.2.
	this.diffuseReflectionCoef = new Float32Array([0.75]); // 1.0
	this.specularReflectionCoef = new Float32Array([0.6]); // 0.7
	this.specularColor = new Float32Array([0.7, 0.7, 0.7]);
	this.ssaoRadius = new Float32Array([0.15]);
	this.shininessValue = new Float32Array([40.0]);
	this.ssaoNoiseScale2 = new Float32Array([1.0, 1.0]); // [this.depthFboNeo.width[0]/this.noiseTexture.width, this.depthFboNeo.height[0]/this.noiseTexture.height]
	this.ssaoKernel16 = new Float32Array([ 0.33, 0.0, 0.85,
		0.25, 0.3, 0.5,
		0.1, 0.3, 0.85,
		-0.15, 0.2, 0.85,
		-0.33, 0.05, 0.6,
		-0.1, -0.15, 0.85,
		-0.05, -0.32, 0.25,
		0.2, -0.15, 0.85,
		0.6, 0.0, 0.55,
		0.5, 0.6, 0.45,
		-0.01, 0.7, 0.35,
		-0.33, 0.5, 0.45,
		-0.45, 0.0, 0.55,
		-0.65, -0.5, 0.7,
		0.0, -0.5, 0.55,
		0.33, 0.3, 0.35]);
		
	this.ssaoSphereKernel32 = new Float32Array([ 0.33, 0.0, 0.85,
		0.25, 0.3, 0.5,
		0.1, 0.3, 0.85,
		-0.15, 0.2, 0.85,
		-0.33, 0.05, 0.6,
		-0.1, -0.15, 0.85,
		-0.05, -0.32, 0.25,
		0.2, -0.15, 0.85,
		0.6, 0.0, 0.55,
		0.5, 0.6, 0.45,
		-0.01, 0.7, 0.35,
		-0.33, 0.5, 0.45,
		-0.45, 0.0, 0.55,
		-0.65, -0.5, 0.7,
		0.0, -0.5, 0.55,
		0.33, 0.3, 0.35,
		
		 0.33, 0.0, -0.85,
		0.25, 0.3, -0.5,
		0.1, 0.3, -0.85,
		-0.15, 0.2, -0.85,
		-0.33, 0.05, -0.6,
		-0.1, -0.15, -0.85,
		-0.05, -0.32, -0.25,
		0.2, -0.15, -0.85,
		0.6, 0.0, -0.55,
		0.5, 0.6, -0.45,
		-0.01, 0.7, -0.35,
		-0.33, 0.5, -0.45,
		-0.45, 0.0, -0.55,
		-0.65, -0.5, -0.7,
		0.0, -0.5, -0.55,
		0.33, 0.3, -0.35]);
		
	this.bMust = false;
	
	// webWorldWind vars.
	this.dc;
	
	// insertIssue states.
	this.insertIssueState = 0; // 0 = no started. 1 = started.
	
	// provisionally.
	this.textureFlipYAxis = false;
	
	// mouse.
	this.mouseButton = -1;
	
};

/**
 * Returns the modelViewMatrixInverse.
 * @returns {Matrix4} modelViewMatrixInv.
 */
SceneState.prototype.getModelViewMatrixInv = function() 
{
	return this.modelViewMatrixInv;
};
































