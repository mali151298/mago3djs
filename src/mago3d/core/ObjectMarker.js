'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarker
 *
 */
var ObjectMarker = function() 
{
	if (!(this instanceof ObjectMarker)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.geoLocationData = new GeoLocationData();
	this.issue_id = null;
	this.issue_type = null;
	//this.latitude = 0;
	//this.longitude = 0;
	//this.height = 0;
};

ObjectMarker.prototype.copyFrom = function(objMarker) 
{
	if (objMarker === undefined) { return; }
		
	if (objMarker.geoLocationData) 
	{
		this.geoLocationData.copyFrom(objMarker.geoLocationData);
	}
	
	this.issue_id = objMarker.issue_id;
	this.issue_type = objMarker.issue_type;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
var ObjectMarkerManager = function() 
{
	if (!(this instanceof ObjectMarkerManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.objectMarkerArray = [];

};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarker = function()
{
	var objMarker = new ObjectMarker();
	this.objectMarkerArray.push(objMarker);
	return objMarker;
};