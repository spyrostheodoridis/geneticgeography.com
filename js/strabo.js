
function baseMap ( {container, extentBounds, projection, rotate, clAngle,
					parallel = null, frame = true, frameFill = 0.9, translateScaleX = 2, translateScaleY = 2 } = {} ) {

	const mainPlot = d3.select('#' + container);

	//create frame
	mainPlot.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('x', 0).attr('y', 0)
			.style('fill','none')
			.style('stroke', (frame === true) ? 'black': 'none');


	const width = mainPlot.node().getBBox().width;
	const height = mainPlot.node().getBBox().height;

	//define projection and outline
	const proj = eval('d3.geo' + projection + '()');
	proj.scale(1).translate([0,0]).precision(0.1)
		.rotate([rotate[0], rotate[1], rotate[2]]).clipAngle(clAngle);

	if (parallel) {proj.parallel(parallel)};

	const path = d3.geoPath().projection(proj);

	const graticule = d3.geoGraticule();
	graticule.extent([extentBounds[0], extentBounds[1]]);
	
	// initial bounding box of the defined extent for the defined projection
	const clPath0 = mainPlot.append('clipPath')
			.append('path')
			.attr('id', 'clPath0' + container)
			.datum(graticule.outline)
			.attr('d', path);
	const initBox = clPath0.node().getBBox();

	d3.select('#clPath0' + container).node().parentNode.remove() // clear clipPath
	// redefine scale and translate
	const s = frameFill / Math.max( initBox.width / width, initBox.height / height);
	const t = [ (width - s*(2*initBox.x + initBox.width )) / translateScaleX, (height - s*(2*initBox.y + initBox.height )) / translateScaleY];
	proj.scale(s).translate(t);
	
	obj = {
		'projection': proj,
		'projectionName': projection,
		'graticule': graticule,
		'name': 'baseMap' + container
	};

	return obj;
}


function plotGraticule( {base, plotGratLines = false, containerLines = '', stepLines = [], cssLines = '', 
							plotOutline = false, containerOut = '', sphereR = 0, cssOut = '',
							plotGratText = false, containerTxt = '', stepTxtLon = [], stepTxtLat = [], cssTxt = '', lonTxtPos = null, latTxtPos = null,  lonOffset = 0, latOffset = 0 } = {}) {

	let path = d3.geoPath().projection(base.projection);

	if (plotGratLines === true) {

		base.graticule.step(stepLines);

		d3.select('#' + containerLines).append('path').datum(base.graticule).attr('class', cssLines).attr('d', path);
	}

	if (plotOutline === true && !sphereR) {

		d3.select('#' + containerOut).append('path')
			.datum(base.graticule.outline)
			.attr('class', cssOut)
			.attr('d', path);
	};

    if (plotOutline === true && sphereR){
        const pc = [base.projection.center()[0] - base.projection.rotate()[0], base.projection.center()[1] - base.projection.rotate()[1]]
        d3.select('#' + containerOut).append('path')
        .attr('d', path(d3.geoCircle().center(pc).radius(sphereR).precision(0.5)()))
            .attr('class', cssOut);
    };

	if (plotGratText === true) {

		var gratTxt = base.graticule;

		gratTxt.step([stepTxtLon[0], stepTxtLat[0]])

		d3.select('#' + containerTxt).selectAll('text')
			.data(gratTxt.lines())
  		  .enter().append('text')
			.each(function(d){
				const lon = (d.coordinates[0][0] === d.coordinates[1][0]) ? true : false
				const lineX = d.coordinates[0][0];
				const lineY = d.coordinates[0][1];

				if (lon === true && !Array.isArray(stepTxtLon[0])){
					d3.select(this)
						.attr('x', base.projection([lineX, lonTxtPos])[0] )
						.attr('y', base.projection([lineX, lonTxtPos])[1] + lonOffset )
						.text(d.coordinates[0][0] )
						.attr('class', cssTxt)
				}

				if (lon === false && !Array.isArray(stepTxtLat[0])){
					d3.select(this)
						.attr('x', base.projection([latTxtPos, lineY])[0] + latOffset )
						.attr('y', base.projection([latTxtPos, lineY])[1] )
						.text(d.coordinates[0][1] )
						.attr('class', cssTxt)
				}
			});


		if (Array.isArray(stepTxtLon[0])) {
			d3.select('#' + containerTxt).selectAll('.LonText')
				.data(stepTxtLon[0])
			.enter().append('text')
				.attr('x', d => base.projection([d, lonTxtPos])[0] )
				.attr('y', d => base.projection([d, lonTxtPos])[1] + lonOffset)
				.text(d => d)
				.attr('class', cssTxt)
		};

		if (Array.isArray(stepTxtLat[0])) {
			d3.select('#' + containerTxt).selectAll('.LatText')
				.data(stepTxtLat[0])
			.enter().append('text')
				.attr('x', d => base.projection([latTxtPos, d])[0] + latOffset)
				.attr('y', d => base.projection([latTxtPos, d])[1] )
				.text(d => d)
				.attr('class', cssTxt)
		};

		
	};
}


function plotScale( {container, base, x0, y0, dx, unit = 'km', increment = 0.0001, precDiff = 0, greatCircle = false, cssBar, cssTxt} = {} ) {

	let cont = d3.select('#' + container);

	const R = (unit === 'km') ? 6371 : 6371e3 //earth radius

	p1 = [x0, y0];
	p1Pix = baseProj.projection(p1)
	// harvesine formula ==> solve for dλ, along the same lat to start as close as possible to the desired end point
	const NewLon = p1[0] + (dx / R) * (180 / Math.PI) / Math.cos(p1[1] * Math.PI / 180 );
	//initial end point in pixels
	const p2Pix = baseProj.projection([NewLon, p1[1]]);
	//replace y pixels
	p2Pix[1] = p1Pix[1];
	const p2 = baseProj.projection.invert(p2Pix);
	//get current distance
	const Dx = getDistance(p1, p2, unit);
	//start iterations to get the desired distance
	let i = 0;
	//object to store distances
	distObj = {}
	while (i < increment*100) {
		if (Dx < dx){
			var p3 = baseProj.projection.invert([p2Pix[0] + i,  p2Pix[1]]);
			var DxTmp = Math.round(getDistance(p1, p3, unit));
			if (DxTmp === dx) {
				break
			}else {
				distDiff = Math.abs(dx - DxTmp);
				if (distDiff < precDiff) {
					break
				} else{
					distObj[distDiff] = p3;
				}
			}

		}else if (Dx > dx){
			var p3 = baseProj.projection.invert([p2Pix[0] - i,  p2Pix[1]]);
			var DxTmp = Math.round(getDistance(p1, p3, unit));
			if (DxTmp === dx) {
				break
			}else {
				distDiff = Math.abs(dx - DxTmp);
				if (distDiff < precDiff) {
					break
				} else{
					distObj[distDiff] = p3;
				}
			}
		}

		i += increment
	
	}
	//if the desired point has been found
	if (Object.keys(distObj).length < 100) {
		var endPoint = p3;
		var barWidth = Math.hypot(baseProj.projection(endPoint)[0] - p1Pix[0], baseProj.projection(endPoint)[1]-p1Pix[1]);
		var dist = dx;
	}else {// if the desired points has not been found then print the minimum distance found
		var endPoint = distObj[d3.min(Object.keys(distObj))];
		var barWidth = Math.hypot(baseProj.projection(endPoint)[0] - p1Pix[0], baseProj.projection(endPoint)[1]-p1Pix[1]);
		var dist = getDistance(p1, endPoint, unit);
	};

	if (greatCircle === true){

		let path = d3.geoPath()
    		.projection(base.projection);

		arcs = {type: 'LineString', coordinates: [ p1, endPoint]};

		cont.append('path')
			.attr('class', cssBar)
    		.attr('d', path(arcs));  // great arc's path

    	const scaleText = cont.append('text')
			.text(dist + 'm')
			.attr('y', p1Pix[1])
			.attr('dy', '1.2em')
			.attr('class', cssTxt);

		const bboxScaleT = scaleText.node().getBBox();
		scaleText.attr('x', p1Pix[0] + (baseProj.projection(endPoint)[0] - p1Pix[0])/2 - bboxScaleT.width/2);


	}else {

		cont.append('rect')
			.attr('x', p1Pix[0])
			.attr('y', p1Pix[1])
			.attr('width', barWidth)
			.attr('height', 1)
			.attr('class', cssBar);

		const scaleText = cont.append('text')
			.text((unit === 'km') ? dist + 'km' : dist + 'm')
			.attr('y', p1Pix[1])
			.attr('dy', '1.2em')
			.attr('class', cssTxt);

		const bboxScaleT = scaleText.node().getBBox();
		scaleText.attr('x', p1Pix[0] + (baseProj.projection(endPoint)[0] - p1Pix[0])/2 - bboxScaleT.width/2);

	}
	
}

function plotBase( {base, topoFile, geomName,
				plotCoast, containerCoast, cssCoast,
				plotLand, containerLand, cssLand,
				plotCountries, containerCountries, cssCountries} = {plotCoast: false, plotLand: false, plotCountries: false} ) {

	let path = d3.geoPath().projection(base.projection);

	const clipID = 'baseClip' + base.name;

	let clipCont = containerCoast || containerLand || containerCountries;

	// make new clip path from graticule.outline 
	const clPath = d3.select('#' + clipCont).append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	d3.json(topoFile).then(function (topology) {

		const topoData = topojson.feature(topology, topology.objects[geomName]);

		if (plotCountries === true){ 
			d3.select('#' + containerCountries).append('path')
				.datum(topojson.mesh(topology, topology.objects[geomName], function (a,b) {return a !== b; }))
				.attr('d', path)
				.attr('clip-path', 'url(#' + clipID + ')')
				.attr('class', cssCountries);
		}

		if (plotCoast === true){
			d3.select('#' + containerCoast).append('path')
				.datum(topojson.mesh(topology, topology.objects[geomName], function (a,b) {return a === b; }))
				.attr('d', path)
				.attr('clip-path', 'url(#' + clipID + ')')
				.attr('class', cssCoast);
		}

		if (plotLand === true){
			d3.select('#' + containerLand).append('path')
				.datum(topoData)
				.attr('d', path)
				.attr('clip-path', 'url(#' + clipID + ')')
				.attr('class', cssLand);
		}
	});
}


function plotImage({container, base, imageFile, imgBounds, imgCenter, sphere = false}) {

	const clipID = container + 'Clip'
	const path = d3.geoPath().projection(base.projection);
	var cont = d3.select('#' + container);

	// make new clip path from graticule.outline 
	const clPath = cont.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	// if image is the globe
	if (sphere == true) {

		const mapCenter = base.projection.rotate().map(d=>-d);
		//get the dimensions (pixel width,height) of the sphere
		const rasterDims = getGlobeDims(mapCenter, base)
		const projCenter = base.projection(mapCenter)

		cont.append('svg:image')
			.attr('x', projCenter[0] - rasterDims[0]/2)
			.attr('y', projCenter[1] - rasterDims[1]/2)
			.attr('xlink:href', imageFile)
			.attr('width', rasterDims[0])
			.attr('height', rasterDims[1]) 
			.attr('clip-path', 'url(#' + clipID + ')');

	} else {

		const projCenter = base.projection(imgCenter);

		//imgBounds can have any number of points in it, one is enough for the calculations
		var projRasterWidth = Math.abs(2*d3.min(imgBounds.map(d=>projCenter[0] - base.projection(d)[0])));

		if (projRasterWidth < 1){
			var projRasterWidth = Math.abs(2*d3.max(imgBounds.map(d=>projCenter[0] - base.projection(d)[0])));
		};

		var projRasterHeight = Math.abs(2*d3.min(imgBounds.map(d=>projCenter[1] - base.projection(d)[1])));
		if (projRasterHeight < 1){
			var projRasterHeight = Math.abs(2*d3.max(imgBounds.map(d=>projCenter[1] - base.projection(d)[1])));
		};
		
		var projRasterX = projCenter[0] - projRasterWidth/2; 
		var projRasterY = projCenter[1] - projRasterHeight/2;

		//readjust width, height
		//var dx = d3.max(imgBounds.map(d=>base.projection(d)[0] - (projRasterX + projRasterWidth)));
		//var dy = d3.max(imgBounds.map(d=>base.projection(d)[1] - (projRasterY + projRasterHeight)));
		var dx = 0;
		var dy = 0;

		cont.append('svg:image')
			.attr('x', projRasterX)
			.attr('y', projRasterY)
			.attr('xlink:href', imageFile)
			.attr('width', projRasterWidth + dx)
			.attr('height', projRasterHeight + dy)
			.attr('clip-path', 'url(#' + clipID + ')')
			.attr('preserveAspectRatio', 'none');
	};
}


function plotPoints( {container, base, pointFile, pointR, colorVar, colorScale, colorDomain = [],
					colorRange, colorInterpolate = 'Hsl', cssStyle, includeVars = [] }){

	return new Promise((resolve, reject) => {

		const clipID = container + 'Clip'
		var cont = d3.select('#' + container);

		const path = d3.geoPath().projection(base.projection);

		// make new clip path from graticule.outline 
		const clPath = cont.append('clipPath')
			.attr('id', clipID)
			.append('path')
			.attr('id', clipID + 'Path')
			.datum(base.graticule.outline)
			.attr('d', path);

		//define path for points
		path.pointRadius(pointR)

		const dataValues = [];
		const colScl = eval('d3.scale' + colorScale + '()');

		// get vertices of clip path and use them to exclude points that fall outside of path
		const clipP = d3.select('#' + clipID + 'Path').node().getAttribute('d')
	    const ppList = clipP.replace('M', '').replace('Z', '').split('L')
	    ppList.forEach(function(d, i){
	        ppList[i] = d.split(',').map(v=>+v)
	    })

		d3.csv(pointFile).then(function (data) {

			// create geojson for points to be used as path
			geoFeat = {}
			geoFeat.type = 'FeatureCollection'
			geoFeat.crs = { 'type': 'name', 'properties': { 'name': 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
			geoFeat.features = []

			data.forEach(function(d){
				const colD = (isNaN(d[colorVar]) == true) ? d[colorVar] : +d[colorVar];
				var props = {[colorVar]: +d[colorVar]};
				includeVars.forEach(function(v){
					props[v] = d[v];
				});

				geoFeat.features.push({ 'type': 'Feature', 'properties': props, 'geometry': { 'type': 'Point', 'coordinates': [ +d.x, +d.y ] } })
			})

			//add features to DOM, keep them invisible
			//only features rendered with geopath will have a 'd' attribute
			var ptDataSet = new Set();
			const dataPts = cont.selectAll('.geoP')
		  		.data(geoFeat.features)
	          .enter().append('path')
		  		.attr('d', path)
		  		.each(function(d,i){
		  			var el = d3.select(this)
		  			const pointCoord = base.projection(d.geometry.coordinates);
		  			//now select only the desired points (those in the path)
		  			if (el._groups[0][0].hasAttribute('d') && inside(pointCoord, ppList)){
		  				ptDataSet.add((d.properties[colorVar]))
		  				el.attr('class', 'selectedPoint')//append the class to the selected features
		  			}	
		  		})
		  		.style('display', 'none')


		  	// set to array
			const ptData = [];
			ptDataSet.forEach(v => ptData.push(v));
			ptDataSet = null;
			
			//define color scale
			if (colorScale === 'Linear'){
				if (colorDomain.length != 0){
					var cDomain = colorDomain;
					cDomain.unshift(d3.extent(ptData)[0]);
					cDomain.push(d3.extent(ptData)[1]);
				}else{
					var cDomain =  d3.extent(ptData);
				};
				colScl.interpolate(eval('d3.interpolate' + colorInterpolate))
					.domain(cDomain).range(colorRange)
			}
			else if (colorScale === 'Ordinal'){
				colScl.domain(ptData.sort(d3.ascending)).range(colorRange)
			};


			//render points
			d3.selectAll('.selectedPoint').each(function(d, i){
				d3.select(this)
			  		.attr('clip-path', 'url(#' + clipID + ')')
			  		.style('display', null)
			  		.attr('class', cssStyle)
			  		.style('fill', d=>colScl(d.properties[colorVar]))
			  		.style('stroke', d=>colScl(d.properties[colorVar]))
			});

		    colScl.type = colorScale; //add type of scale

			resolve(colScl);

		});
		
	})
}


function plotVector( {container, base, vectorFile, vctFormat, geomName, vctProperty, excludeValues = [],
					vctDataScale = 1, colorScale, colorDomain = [], colorRange, colorInterpolate = 'Hsl',
					cssStyle, renderCanvas = false, canvasWidth, canvasHeight, cnvRes} ) {

	return new Promise((resolve, reject) => {

		const clipID = container + 'Clip'

		var cont = d3.select('#' + container);

		var path = d3.geoPath().projection(base.projection);

		// make new clip path from graticule.outline 
		const clPath = cont.append('clipPath')
			.attr('id', clipID)
			.append('path')
			.attr('id', clipID + 'Path')
			.datum(base.graticule.outline)
			.attr('d', path);

		if (renderCanvas === true){

			var ratio = window.devicePixelRatio || 1;

			var fo = cont.append('foreignObject')
	    		.attr("x", 0)
	    		.attr("y", 0)
	    		.attr("width", canvasWidth)
	    		.attr("height", canvasWidth)

			 contx = fo.append('xhtml:canvas')
				.attr('width', ratio*canvasWidth*cnvRes)
				.attr('height', ratio*canvasHeight*cnvRes)
				.style('width', canvasWidth + 'px')
				.style('height', canvasHeight + 'px')
				.attr('id', 'vCanvas').node().getContext('2d');

			contx.scale(ratio*cnvRes, ratio*cnvRes)
		}


		const colScl = eval('d3.scale' + colorScale + '()');

		d3.json(vectorFile).then(function(vData) {

			if (vctFormat === 'topoJson') {
				var topoData = topojson.feature(vData, vData.objects[geomName]).features;

			} else if (vctFormat === 'geoJson') {
				var topoData = vData.features;
				topoData.every( function(d) { // instead of forEach in order to break the loop
					//correct last point of polygons if necessary
					// polygon
					if (d.geometry.type == 'Polygon'){
						if (d.geometry.coordinates[0][0][0] !== d.geometry.coordinates[0][d.geometry.coordinates[0].length - 1][0]
							&& d.geometry.coordinates[0][0][1] !== d.geometry.coordinates[0][d.geometry.coordinates[0].length - 1][1]){

							d.geometry.coordinates[0].push(d.geometry.coordinates[0][0])
						};
					} else{
						alert('features are not simple polygons! please provide a simplified vector file');
						return false
					}
				})
			}

			//add features to DOM, keep them invisible
			//only features rendered with geopath will have a 'd' attribute
			var vctDataSet = new Set();
			const dataVectors = cont.selectAll('.geoPaths')
		  		.data(topoData)
			  .enter().append('path')
		  		.attr('d', path)
		  		.each(function(d,i){
		  			const el = d3.select(this)
		
		  			if (d.geometry.type == 'Polygon'){
			  			//now select only the desired features (those in the path and with the included values)
			  			if (el._groups[0][0].hasAttribute('d') && turf.intersect(d, base.graticule.outline()) && excludeValues.indexOf(d['properties'][vctProperty]) === -1 && d['properties'][vctProperty]){
			  				vctDataSet.add((d['properties'][vctProperty] / vctDataScale) || d['properties'][vctProperty] )
			  				el.attr('class', 'selectedFeat')//append the class to the selected features
			  			}
		  			}
		  		})
		  		.style('display', 'none')

			// set to array
			const vctData = [];
			vctDataSet.forEach(v => vctData.push(v));
			vctDataSet = null;

			//define color scale
			if (colorScale === 'Linear'){
				if (colorDomain.length != 0){
					var cDomain = colorDomain;
					cDomain.unshift(d3.extent(vctData)[0]);
					cDomain.push(d3.extent(vctData)[1]);
				}else{
					var cDomain =  d3.extent(vctData);
				};
				colScl.interpolate(eval('d3.interpolate' + colorInterpolate))
					.domain(cDomain).range(colorRange)
			}
			else if (colorScale === 'Ordinal'){
				colScl.domain(vctData.sort(d3.ascending)).range(colorRange)
			};

			// define clip path for canvas
			if (renderCanvas === true) {
				path.context(contx);
				contx.beginPath();
				path(base.graticule.outline());
				contx.clip();
				//get style
				cont.append('rect').attr('class', cssStyle); //pseudo element to assign the css style 
				var fillOpac = d3.select('.'+cssStyle).style('fill-opacity')
				var strokeWidth = d3.select('.'+cssStyle).style('stroke-width').split("px")[0]
				var strokeOpac = d3.select('.'+cssStyle).style('stroke-opacity')
			};

			// render features
			d3.selectAll('.selectedFeat').each(function(d, i){
					
				if (renderCanvas === true) {
					fillCol = d3.rgb(colScl(d['properties'][vctProperty] / vctDataScale || d['properties'][vctProperty]));
					fillCol.opacity = +fillOpac;
					strokeCol = d3.rgb(colScl(d['properties'][vctProperty] / vctDataScale || d['properties'][vctProperty]));
					strokeCol.opacity = +strokeOpac;
					contx.fillStyle = fillCol.toString();
					contx.lineWidth = +strokeWidth;
					contx.strokeStyle = strokeCol.toString();
					
					contx.beginPath();
					path(d);
	    			contx.fill();
	    			contx.stroke();

				}else {
					d3.select(this)
				  		.attr('clip-path', 'url(#' + clipID + ')')
				  		.style('display', null)
				  		.attr('class', cssStyle)
				  		.style('fill', function(d) {
				  			if (excludeValues.indexOf(d['properties'][vctProperty]) === -1) {
				  				return colScl(d['properties'][vctProperty] / vctDataScale || d['properties'][vctProperty])
				  			} else {return 'none'}
				  		})
				  		.style('stroke', function(d) {
				  			if (excludeValues.indexOf(d['properties'][vctProperty]) === -1) {
				  				return colScl(d['properties'][vctProperty] / vctDataScale || d['properties'][vctProperty])
				  			} else {return 'none'}
				  		});
				}
		  	});

		  	colScl.type = colorScale; //add type of scale

			resolve(colScl);

		});
	})
}


function plotRaster({container, base, rasterFile, dataScale, excludeValues = [],
					colorScale, colorDomain = [], colorRange, colorInterpolate = 'Hsl', rScale = 150, sphere = false} ){

	return new Promise((resolve, reject) => {

		const clipID = container + 'Clip'

		var cont = d3.select('#' + container);

		const path = d3.geoPath().projection(base.projection);

		// make new clip path from graticule.outline 
		const clPath = cont.append('clipPath')
			.attr('id', clipID)
			.append('path')
			.attr('id', clipID + 'Path')
			.datum(base.graticule.outline)
			.attr('d', path);

		// get vertices of clip path and use them to exclude points that fall outside of path
		const clipP = d3.select('#' + clipID + 'Path').node().getAttribute('d')
	    const ppList = clipP.replace('M', '').replace('Z', '').split('L')
	    ppList.forEach(function(d, i){
	        ppList[i] = d.split(',').map(v=>+v)
	    });

		const colScl = eval('d3.scale' + colorScale + '()'); // outside of data function for export

		d3.json(rasterFile).then(function(data) {

			const rasW = data.width; //raster resolution stored in the json file
			const rasH = data.height; //raster resolution stored in the json file

			//get width and height of layer in projected pixels
			if (sphere === true){

				const mapCenter = base.projection.rotate().map(d=>-d);

				const rasterDims = getGlobeDims(mapCenter, base);
				var projRasterWidth = rasterDims[0];
				var projRasterHeight = rasterDims[1];

				var projCenter = base.projection(mapCenter);

			} else{

				//define the attributes of the layer
				var projCenter = base.projection(data.center);
				const projUlBound = base.projection(data.upLeft);
				const projUrBound = base.projection(data.upRight);
				const projLlBound = base.projection(data.loLeft);
				const projLrBound = base.projection(data.loRight);

				//use the center and get maximum value to account for ill-defined corners
				var projRasterWidth = Math.abs(2*d3.min([projCenter[0] - projUlBound[0],
												projCenter[0] - projLlBound[0],
												projLrBound[0] - projCenter[0],
												projUrBound[0] - projCenter[0]]));

				var projRasterHeight = Math.abs(2*d3.min([projCenter[1] - projUlBound[1],
												projCenter[1] - projLlBound[1],
												projLrBound[1] - projCenter[1],
												projUrBound[1] - projCenter[1]]));
			};

			const cellWidth = projRasterWidth / rasW; // number of screen pixels each raster cell is
			const cellHeight = projRasterHeight / rasH;

			const x0 = projCenter[0] - projRasterWidth/2; //raster projected origin x
			const y0 = projCenter[1] - projRasterHeight/2;; //raster projected origin y

			// get only pixel values inside clip path
			var imgDataSet = new Set();
			data.data.forEach(function(d, i){ 
				for (let c = 0; c < d.length; ++c) {
					if(d[c]!==-9999 && excludeValues.indexOf(d[c]) === -1) {
						const cellRow = i;
						const cellCol = c;
						const cellX = x0 + cellCol * cellWidth;
						const cellY = y0 + cellRow * cellHeight;
						if (inside( [cellX, cellY], ppList)) {
							imgDataSet.add(d[c] / dataScale)
						}
					}
				}
			});

			// set to array
			var imgData = [];
			imgDataSet.forEach(v => imgData.push(v));

			//define color scale
			if (colorScale === 'Linear'){
				if (colorDomain.length != 0){
					var cDomain = colorDomain;
					cDomain.unshift(d3.extent(imgData)[0]);
					cDomain.push(d3.extent(imgData)[1]);
				}else{
					var cDomain =  d3.extent(imgData);
				};
				colScl.interpolate(eval('d3.interpolate' + colorInterpolate))
					.domain(cDomain).range(colorRange)
			}
			else if (colorScale === 'Ordinal'){
				colScl.domain(ptData.sort(d3.ascending)).range(colorRange)
			};

			imgDataSet = null;
			imgData = null;

			// create the invisible source canvas
			const canvas = d3.select('body').append('canvas')
				.attr('id', 'tmpCanvas').style('display', 'none');
			const ctx = canvas.node().getContext('2d');

			// the following part takes care of the blurriness in retina displays
			const ratio = window.devicePixelRatio || 1;
		    canvas.attr('width', rasW * ratio * rScale) // the physical pixels of the canvas / rendering pixels
		    	.attr('height', rasH * ratio * rScale) 
		    	.style('width', rasW * rScale + 'px') // "visible" pixels
		    	.style('height', rasH * rScale + 'px');

			//define the image
			imageData = ctx.createImageData(rasW, rasH);
			//populate the image (pixels)
			for (let r = 0, l = 0; r < data.data.length; r++){
				for (let c = 0; c < data.data[r].length; c++, l += 4){
					const pc = d3.rgb(colScl(data.data[r][c] / dataScale)); // pixel color

					imageData.data[l + 0] = pc.r;
					imageData.data[l + 1] = pc.g;
					imageData.data[l + 2] = pc.b;
					imageData.data[l + 3] = (data.data[r][c] !== -9999 && excludeValues.indexOf(data.data[r][c]) === -1) ? 255 : 0; //opacity
				}
			};

			const offCtx = canvas.node().cloneNode().getContext('2d'); // create an off screen canvas
			offCtx.putImageData(imageData, 0,0);
			ctx.scale(ratio * rScale, ratio * rScale); // rescale the target context
			ctx.mozImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(offCtx.canvas, 0,0);

			//export image
			const ImageD = canvas.node().toDataURL('img/png');
			d3.select('#tmpCanvas').remove() // remove invisible canvas
			//load image
			cont.attr('clip-path', 'url(#' + clipID + ')'); //clip parent g element (otherwise transformation will influence the clip path)
			const canvIm = cont.append('svg:image')
					.datum(ImageD)
					.attr('xlink:href', function(d) {return d})
					.attr('height', projRasterHeight)
					.attr('width', projRasterWidth)
					.attr('transform', 'translate(' + x0 + ',' + y0 +')')
					.attr('preserveAspectRatio', 'none');

		
		colScl.type = colorScale; //add type of scale

		resolve(colScl);

		});
	});
}



////////////////////////////////////////////////////////////////
//function to get the four points of the globe
function getGlobeDims(projC, inProj){

	const cX = projC[0]
	const cY = projC[1]

	if (cX < 90 && cX > -90) {
		var leftPointLon = cX - 90;
		var rightPointLon = cX + 90;
	} else if (cX <= -90){
		var leftPointLon = 180 + (cX + 90);
		var rightPointLon = cX + 90;
	} else if (cX >= 90){
		var leftPointLon = cX - 90;
		var rightPointLon = (cX - 90) - 180;
	}

	var topPointLat = 90 - Math.abs(cY);
	var bottomPointLat = Math.abs(cY) - 90;
	if (cY < 0 && cY >= -90) {
		var topPointLon = cX
		var bottomPointLon = (Math.sign(cX) === -1) ? 180 + cX: cX - 180
	} else if (cY > 0 && cY <= 90) {
		var topPointLon = (Math.sign(cX) === -1) ? 180 + cX: cX - 180
		var bottomPointLon = cX
	}

	const bP = inProj.projection([bottomPointLon, bottomPointLat]);
	const tP = inProj.projection([topPointLon, topPointLat]);
	const lP = inProj.projection([leftPointLon, 0]);
	const rP = inProj.projection([rightPointLon, 0]);

	const projRasterWidth = rP[0] - lP[0];
	const projRasterHeight = bP[1] - tP[1];

	return [projRasterWidth, projRasterHeight]
}

// function to check if point falls within list of points (path)
function inside(point, vs) {
    const x = point[0], y = point[1];

    var inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
        	inside = !inside;
        }
    }
    return inside;
};

// function to plot color bar
function plotColBar({container, x, y, width, height, colScale, nOfSections, text = true, barTextDigits, barTitle, horizontal, cssTxt} = {}) {
	
	var cont = d3.select('#' + container);
	const leg = cont.append('g').attr('id', 'bar');

	// the bar is initially constructed horizontally then rotated
	const nWidth = (horizontal) ? width : height;
	const nHeight = (horizontal) ? height : width;

	// get data extent
	const dataExt = d3.extent(colScale.domain());

	//bar outline 
	leg.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', nWidth)
		.attr('height', nHeight)
		.style('fill', 'none')
		.style('stroke', 'black')
		.style('stroke-width', 1);

	if (colScale.type === 'Linear') {

		// set number of sections according to arguments
		nOfSections = (nOfSections > nWidth) ? nWidth : nOfSections;
		
		// width of each section
		const sectionSize = nWidth / nOfSections;

		// create list of consecutive numbers
		const values = [];
		for (let i=0; i<nOfSections; ++i) {
			values.push(i)
		};

		leg.selectAll('.colRect')
			.data(values)
		  .enter().append('rect')
		    .attr('x', function (d) {return d*sectionSize; })
		    .attr('y', 0)
			.attr('width', sectionSize)
			.attr('height', nHeight)
			.style('fill', function (d) { return colScale(dataExt[0] + ((dataExt[1] - dataExt[0])/(nOfSections-1))*d) }) // -1 is used for the section to correspond to the last color
			.style('stroke', 'none')
			.style('shape-rendering', 'crispEdges');

		//transform color bar using (real projective space) transformation matrix 
		const matrix = (!horizontal) ? [Math.cos(-90*Math.PI/180), Math.sin(-90*Math.PI/180), -Math.sin(-90*Math.PI/180),  Math.cos(-90*Math.PI/180), x, y  + nWidth] : 0;
		(horizontal) ? leg .attr('transform', 'translate(' + x +',' + y +')') : leg.attr('transform','matrix(' + matrix + ')'); 

		if (text === true) {
			var barText = cont.append('g')
			barText.selectAll('.colText')
				.data(dataExt)
			  .enter().append('text')
			  	.attr('class', cssTxt)
			    .text(function (d) {return d.toFixed(barTextDigits) } )
			    .each(function(d,i) {
			    	d3.select(this)
			    		.attr('x', (horizontal) ? x + i*nWidth : x + nHeight + 5 )
			    		.attr('y', (horizontal) ? y + nHeight + 5: y + nWidth - i*nWidth )
			    		.attr('text-anchor', (horizontal) ? 'middle' : 'start')
						.attr('alignment-baseline', (horizontal) ?  'hanging' : 'mathematical');
			    });
		}
	};

	if (colScale.type === 'Ordinal') {
		// set number of sections 
		nOfSections = colScale.domain().length;

		// width of each section
		const sectionSize = nWidth / nOfSections;

		leg.selectAll('.colRect')
			.data(colScale.domain())
		  .enter().append('rect')
		    .attr('x', function (d, i) {return i*sectionSize; })
		    .attr('y', 0)
			.attr('width', sectionSize)
			.attr('height', nHeight)
			.style('fill', function (d) { return colScale(d) })
			.style('stroke', 'none')
			.style('shape-rendering', 'crispEdges');

		//transform color bar using (real projective space) transformation matrix 
		const matrix = (!horizontal) ? [Math.cos(-90*Math.PI/180), Math.sin(-90*Math.PI/180), -Math.sin(-90*Math.PI/180),  Math.cos(-90*Math.PI/180), x, y  + nWidth] : 0;
		(horizontal) ? leg .attr('transform', 'translate(' + x +',' + y +')') : leg.attr('transform','matrix(' + matrix + ')'); 

		if (text === true) {
			var barText = cont.append('g')
			barText.selectAll('.colText')
				.data(colScale.domain())
			  .enter().append('text')
			    .attr('class', cssTxt)
			    .text(function (d) {return (typeof d === 'string') ? d: d.toFixed(barTextDigits) } )
			    .each(function(d,i) {
			    	d3.select(this)
			    		.attr('x', (horizontal) ? x + i*sectionSize + sectionSize/2 : x + nHeight + 5 )
			    		.attr('y', (horizontal) ? y + nHeight + 5: y + nWidth -  i*sectionSize - sectionSize/2)
			    		.attr('text-anchor', (horizontal) ? 'middle' : 'start')
						.attr('alignment-baseline', (horizontal) ?  'hanging' : 'central');
			    });
		}
	}
	
	// bar title
	barText.append('text')
		.text(barTitle)
		.attr('class', cssTxt)
		.attr('x', (horizontal) ? x + (nWidth+3)/2 : x + (nHeight+3)/2 )
		.attr('y', y - 10)
		.attr('text-anchor', 'middle');

};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Latitude/longitude spherical geodesy tools                         (c) Chris Veness 2002-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong.html                                                    */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-latlon-spherical.html                       */
function getDistance(p1,p2, unit) { 
		    
	var lat1 = p1[1];
	var lat2 = p2[1];
	var lon1 = p1[0];
	var lon2 = p2[0];
			
	var R = (unit === 'km') ? 6371 : 6371e3; 
	var φ1 = lat1* Math.PI / 180;
	var φ2 = lat2* Math.PI / 180;
	var Δφ = (lat2-lat1)* Math.PI / 180;
	var Δλ = (lon2-lon1)* Math.PI / 180;

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var distance = R * c;
		
return distance;
	
}












