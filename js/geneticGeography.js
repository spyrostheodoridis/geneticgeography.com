
//do not resize in mobile devices
if (/Mobi|Android/i.test(navigator.userAgent) == false) {
    window.onresize = function(){ location.reload(); }
}

const BaseMapResol = 110 //50

var globalVariables = {
    marker: 'cytb',
    spatialScale: 'grid',
    minTaxCover: 0,
    minSeqNumber: 2,
    booleanSelect: 'or',
    response: 'GD',
    predictor: 'PD'
}

/////////// Main map //////////////////////////////

var mainMap = d3.select('.mainMap').append('svg').attr('width', '100%').attr('height', '100%')
                .append('g').attr('id', 'mainMap')
                .call(d3.drag().on('start', started))

mainMap.append('g').attr('id', 'grat')
mainMap.append('g').attr('id', 'gratTxt')
mainMap.append('g').attr('id', 'land')
mainMap.append('g').attr('id', 'spatioUnits')
mainMap.append('g').attr('id', 'coast')
mainMap.append('g').attr('id', 'colBar')
    
const baseProj = baseMap({container: 'mainMap',
                    extentBounds: [[-180, -90], [180, 90]],
                    projection: 'CylindricalEqualArea',
                    rotate: [0, 0, 0],
                    parallel: 30,
                    frame: false,
                    frameFill: 0.91,
                    //translateScaleY: 1.8
                    });

plotGraticule({base: baseProj,
                plotGratLines: true, containerLines: 'grat', stepLines: [20, 20], cssLines : 'graticuleLines',
                plotOutline: true, containerOut: 'grat', sphereR: 0, cssOut: 'graticuleLines',
                plotGratText: true, containerTxt: 'gratTxt', stepTxtLon: [], stepTxtLat: [[-40, 0, 40]], cssTxt: 'lonLatLabels', latTxtPos: 180, lonTxtPos: -90, lonOffset: 0, latOffset: 3
                });

plotBase({base: baseProj, topoFile: 'world_'+BaseMapResol+'m.topojson', geomName: 'world_'+BaseMapResol+'m',
      plotLand: true, containerLand: 'land', cssLand: 'land',
      plotCoast: true, containerCoast: 'coast', cssCoast: 'coast'
    });

/////////// secondary map //////////////////////////////
var secMap = d3.select('.secMap').append('svg').attr('width', '100%').attr('height', '100%')
                .append('g').attr('id', 'secMap')
                .call(d3.drag().on('start', started))

secMap.append('g').attr('id', 'gratP')
secMap.append('g').attr('id', 'gratTxtP')
secMap.append('g').attr('id', 'landP')
secMap.append('g').attr('id', 'spatioUnitsP')
secMap.append('g').attr('id', 'coastP')
secMap.append('g').attr('id', 'colBarP')

const baseProjP = baseMap({container: 'secMap',
                    extentBounds: [[-180, -90], [180, 90]],
                    projection: 'CylindricalEqualArea',
                    rotate: [0, 0, 0],
                    parallel: 30,
                    frame: false,
                    frameFill: 0.91,
                    //translateScaleY: 1.8
                    });

plotGraticule({base: baseProjP,
                plotGratLines: true, containerLines: 'gratP', stepLines: [20, 20], cssLines : 'graticuleLines',
                plotOutline: true, containerOut: 'gratP', sphereR: 0, cssOut: 'graticuleLines'
                });

plotBase({base: baseProjP, topoFile: 'world_'+BaseMapResol+'m.topojson', geomName: 'world_'+BaseMapResol+'m',
      plotLand: true, containerLand: 'landP', cssLand: 'land',
      plotCoast: true, containerCoast: 'coastP', cssCoast: 'coast'
    });

/////////////////// add initial transform values of maps as datum/////////////
['mainMap', 'secMap'].forEach(function(d){
    d3.select('#' + d).datum(function(){
        var bbox = d3.select(this).node().getBoundingClientRect()
        return {'x': bbox.x, 'y': bbox.y, 'scale': 1,
                'tX': 0, 'tY': 0,
                'width': bbox.width, 'height': bbox.height}
    })
})

//plot initial data set
loadData(globalVariables.marker, globalVariables.spatialScale)
        .then(function(data){return getSubset(data, globalVariables.minTaxCover, globalVariables.minSeqNumber, globalVariables.booleanSelect)})
        .then(function(data){
            plotVar('#spatioUnits', baseProj, data, globalVariables.response, '.responseSelect')
            plotVar('#spatioUnitsP', baseProjP, data, globalVariables.predictor, '.predictSelect')
            plotXY('.xy', data, globalVariables.predictor, globalVariables.response)
            //Sliders
            rangeSlider('.sliderTaxonCoverCont', data, 'minTaxCover')
            rangeSlider('.sliderSeqNumberCont', data, 'minSeqNumber')

            //make data set downloadable
            d3.select('#downButtonCSV').attr('href', 'data/' + globalVariables.marker + '_' + globalVariables.spatialScale + '.csv')
            d3.select('#downButtonJSON').attr('href', 'data/' + globalVariables.marker + '_' + globalVariables.spatialScale + '.json')
            d3.select('#downButtonSeqs').attr('href', 'data/' + globalVariables.marker + '_coordinates.csv')
        })

var currMarker = globalVariables.marker;
var currScale = globalVariables.spatialScale;

//////////////////////////// controls /////////////////////////////////////////
const updateColor = 'rgba(255, 0, 0, 0.5)'
//zoom buttons
for (let bt of ['.zoomInMain', '.zoomOutMain', '.zoomInSec', '.zoomOutSec']){
    d3.select(bt).on('click', zoomClick)
}
//select
d3.select('.locusSelect').on('change', function(){
    d3.select('.updateBut').style('background-color', updateColor)
    globalVariables.marker = this.value;
})
d3.select('.scaleSelect').on('change', function(){
    d3.select('.updateBut').style('background-color', updateColor)
    globalVariables.spatialScale = this.value;
globalVariables.minTaxCover = 0;
    globalVariables.minSeqNumber = 2;
})
//boolean selector button
d3.selectAll('.booleanButton').on('change', function(d){
    d3.select('.updateBut').style('background-color', updateColor)
    globalVariables.booleanSelect = this.value})
//variables
d3.select('.responseSelect').on('change', function(){
    d3.select('.updateBut').style('background-color', updateColor)
    globalVariables.response = this.value})
d3.select('.predictSelect').on('change', function(){
    d3.select('.updateBut').style('background-color', updateColor)
    globalVariables.predictor = this.value})
//update button
d3.select('.updateBut').on('click', function(){
    d3.select(this).style('background-color', 'rgba(0, 0, 0, 0.1)')
    //load data (promise function)
    loadData(globalVariables.marker, globalVariables.spatialScale)
        .then(function(data){
            if (globalVariables.marker !== currMarker || globalVariables.spatialScale !== currScale){
                globalVariables.minSeqNumber = 2;
                globalVariables.minTaxCover = 0;
            }
            currMarker = globalVariables.marker;
            currScale = globalVariables.spatialScale;

            return getSubset(data, globalVariables.minTaxCover, globalVariables.minSeqNumber, globalVariables.booleanSelect)})
                    
        .then(function(data){

            plotVar('#spatioUnits', baseProj, data, globalVariables.response, '.responseSelect')

            plotVar('#spatioUnitsP', baseProjP, data, globalVariables.predictor, '.predictSelect')

            plotXY('.xy', data, globalVariables.predictor, globalVariables.response)

            //Sliders
            rangeSlider('.sliderTaxonCoverCont', data, 'minTaxCover')
            rangeSlider('.sliderSeqNumberCont', data, 'minSeqNumber')

            //make data set downloadable
            d3.select('#downButtonCSV').attr('href', 'data/' + globalVariables.marker + '_' + globalVariables.spatialScale + '.csv')
            d3.select('#downButtonJSON').attr('href', 'data/' + globalVariables.marker + '_' + globalVariables.spatialScale + '.json')
            d3.select('#downButtonSeqs').attr('href', 'data/' + globalVariables.marker + '_coordinates.csv')

    })
})
    

//////////////////////////////////////////////////////////////////////////////////////
/////////// functions ////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

function plotVar(container, projectionUnit, data, variable, classSelect){
    //data[0] is the full data set, data[1] is the subset indexes
    
    d3.select(container).selectAll("*").remove() //remove all previous elements
    
    let path = d3.geoPath().projection(projectionUnit.projection);

    //clip path for lat bands
    /*if (globalVariables.spatialScale == 'latBand'){
        d3.json('world_'+BaseMapResol+'m.topojson').then(function (topology) {
            
            const clPath = d3.select(container).select(function() { return this.parentNode; })
                .append('clipPath')
                .attr('id', container + 'maskLand')
                .append('path')
                .attr('id', container + 'maskLandPath')
                .datum(topojson.mesh(topology, topology.objects['world_'+BaseMapResol+'m'], function (a,b) {return a === b; }))
                .attr('d', path);
        });
    }*/

    var plotVar = data[0].filter(function(d){return data[1].includes(d.properties.ID)}).map(d=>d.properties[variable])
    //color scale
    if (variable == 'gdTaxa'){
        var colScl = d3.scaleThreshold().range(['#004B73', '#0084AA', '#89C866', '#D0E16F', '#F8F178', '#FCAA1C', '#F25622', '#A71D21']);

        (data[0].length > 40) ? colScl.domain([2, 3, 4, 5, 10, 15, 20]) : colScl.domain([10, 20, 30, 50, 70, 80, 100]);
                
    } else {
        var colScl0 = d3.scaleQuantile()
                .domain(plotVar)
                .range([1, 2, 3, 4, 5, 6, 7, 8]);
                
        var newThres = colScl0.quantiles();

        newThres[0] = (newThres[0] == 0) ? newThres[1]/2 : newThres[0]
        var colScl = d3.scaleThreshold()
            .domain(newThres)
            .range(['#004B73', '#0084AA', '#89C866', '#D0E16F', '#F8F178', '#FCAA1C', '#F25622', '#A71D21']);
    }
    

    d3.select(container).selectAll('geoPaths')
            .data(data[0])
          .enter().append('path')
            .attr('d', path)
            .attr('class', 'spatialUnits')
            .style('fill', d=>(data[1].includes(d.properties['ID'])) ? colScl(+d.properties[variable]) : '#c5c5c5' )
            .attr('clip-path', function(){
                return (globalVariables.spatialScale == 'latBand') ? 'url(#' + container + 'maskLand)' : 'none'
            })
            .on('click', handleMouseOver)
            //.on('mouseout', handleMouseOut);

    colorScale(container, colScl, classSelect)
}

function colorScale(container, colScl, classSelect){
        
    var cont = d3.select(container).select(function() { return this.parentNode; })
                        .select(function() { return this.parentNode; })

    cont.select('.colorLeg').remove()//remove previous

    var colLeg = cont.append('g')
                    .attr('class', 'colorLeg');
    
    const legW = cont.node().getBoundingClientRect().width*0.02;
    const legH = legW;

    colLeg.selectAll('.rect')
        .data(colScl.range())
      .enter().append('rect')
        .each(function(d, i){
            d3.select(this)
                .attr('fill', d)
                .attr('x',  0)
                .attr('y',  -(i*legH*1.1) )
                .attr('width', legW )
                .attr('height', legH )
        });

    var colDat = ( colScl.hasOwnProperty('quantiles') ) ? colScl.quantiles() : colScl.domain()

    const selectedOption = d3.select(classSelect).node().options[d3.select(classSelect).node().selectedIndex]
    
    colLeg.selectAll('.txt')
        .data(colDat)
      .enter().append('text')
        .attr('class', 'txtLabel')
        .style('font-size', legW*0.8)
        .each(function(d, i){
            d3.select(this)
                .attr('transform', function(d){
                    //calculate x, y positions in pixels from percentage given above
                    tx = legW + legW/5
                    ty = -(i-0.2)*legH*1.1
                    //apply first rotation to each and then translation
                    return 'translate(' + tx + ',' + ty + ')' + 'rotate(0)'
                })
                .text(d=>(precision(d) < 4) ? parseInt(d) : d.toFixed(4))
        });

    //legend title
    colLeg.append('text')
        //get selected variable
        .text(selectedOption.text)
        .attr('x', 0)
        .attr('dx', '-4%')
        .attr('y', -colLeg.node().getBBox().height - 3)
        .style('font-size', legW*1.2)
        .style('alignment-baseline', 'hanging')

    //background
    var rect = colLeg.node().getBBox()
    colLeg.insert('rect', ':first-child')
        .attr('x', rect.x - 2)
        .attr('y', rect.y - 2)
        .attr('width', rect.width + 4)
        .attr('height', rect.height + 4)
        .attr('rx', '5')
        .attr('ry', '5')
        .style('fill', 'white')
        .style('fill-opacity', 0.35)
}

/////////// xy plot //////////////////////////////
function plotXY (container, data, predictor, response){

    d3.select(container).selectAll("*").remove() //remove all previous elements

    //get rendered dimensions of container
    contW = d3.select(container).node().getBoundingClientRect().width
    contH = d3.select(container).node().getBoundingClientRect().height

    const margin = {'top': 0.2*contH, 'left':  0.3*contW};
    const width = 0.5*contW;
    const height = 0.65*contH;

    var mSVG = d3.select(container).append('svg').attr('width', '100%').attr('height', '100%').attr('id', 'xyPlot')
    const responseVar = data[0].filter(function(d){return data[1].includes(d.properties.ID)}).map(d=>d.properties[response])
    const predictorVar = data[0].filter(function(d){return data[1].includes(d.properties.ID)}).map(d=>d.properties[predictor])
    
    const xScale = d3.scaleLinear().range([margin.left, width+margin.left])
                    .domain( [d3.min(predictorVar) - d3.deviation(predictorVar)/5, d3.max(predictorVar) + d3.deviation(predictorVar)/5]);
    const yScale = d3.scaleLinear().range([height + margin.top, margin.top])
                    .domain( [d3.min(responseVar) - d3.deviation(responseVar)/5, d3.max(responseVar) + d3.deviation(responseVar)/5] );

    // Add the x-axis.
    mSVG.append("g")
        .attr('transform', 'translate(0, ' + (height + margin.top) + ')')
        .attr('class', 'xAxis')
      .call(d3.axisBottom(xScale)
        .ticks(4)
        .tickSize(8)
        .tickSizeOuter([4/2])
        );

    //add x axis title
    const predSelect = d3.select('.predictSelect').node().options[d3.select('.predictSelect').node().selectedIndex]
    const axXH = d3.select('.xAxis').node().getBBox().height
    mSVG.append('text')
        .attr("transform", 'translate(' + (xScale.range()[0] + (xScale.range()[1] - xScale.range()[0])/2 ) + ',' + (yScale.range()[0]) + ')')
       .attr('alignment-baseline', 'hanging')
       .attr('dy', axXH*1.4)
       .style("text-anchor", "middle")
       .style('font-size', '1.2vw')
       .text(predSelect.text);

    // Add the Y-axis.
    mSVG.append("g")
        .attr('transform', 'translate(' + margin.left + ',0)')
        .attr('class', 'yAxis')
      .call(d3.axisLeft(yScale)
        .ticks(4)
        .tickSize(8)
        .tickSizeOuter([4/2])
        );

    //add y axis title
    const responseSelect = d3.select('.responseSelect').node().options[d3.select('.responseSelect').node().selectedIndex]
    const axYW = d3.select('.yAxis').node().getBBox().width
    mSVG.append('text')
       .attr("transform", 'translate(' + xScale.range()[0] + ',' + (yScale.range()[1] + (yScale.range()[0] - yScale.range()[1])/2 ) + ')rotate(-90)')
       .attr('dy', -axYW*1.4)
       .style("text-anchor", "middle")
       .style('font-size', '1.2vw')
       .text(responseSelect.text);

    var backPoints = mSVG.append('g')
    var frontPoints = mSVG.append('g')

    data[0].forEach(function(d){
        if (data[1].includes(d.properties['ID'])){
            frontPoints.append('circle')
                .datum(d)
                .attr('cx', d=>xScale(d.properties[predictor]))
                .attr('cy', d=>yScale(d.properties[response]))
                .attr('r', '1%')
                .attr('class', 'xyPoints')
                .on('click', handleMouseOver)
                //.on('mouseout', handleMouseOut)
        } else {
            backPoints.append('circle')
                .datum(d)
                .attr('cx', d=>xScale(d.properties[predictor]))
                .attr('cy', d=>yScale(d.properties[response]))
                .attr('r', '1%')
                .attr('class', 'xyPointsBack')
                //.on('mouseover', handleMouseOver)
                //.on('mouseout', handleMouseOut)
        }

    })

    //sort elements according to filter
    //mSVG.selectAll('circle').sort(function(a, b){ return d3.ascending(+a['properties']['taxCover'], +b['properties']['taxCover']); }).order();

    const regrParam = makeRegression(predictorVar, responseVar)

    mSVG.append('line')
        .attr('x1', xScale.range()[0])
        .attr('x2', xScale.range()[1])
        .attr('y1', yScale(regrParam[0] + regrParam[1]*xScale.domain()[0]))
        .attr('y2', yScale(regrParam[0] + regrParam[1]*xScale.domain()[1]))
        .style('stroke', 'red')
        .style('stroke-width', 3)
    
    //info box
    var infBox = mSVG.append('g').attr('class', 'xyInfo')

    const regrInfo = {'Sample size: ': responseVar.length,
                    'Sequences: ': d3.sum(data[0], d=> (data[1].includes(d.properties.ID)) ? d.properties['gdSeqs'] : 0),
                    'r-squared: ': regrParam[4].toFixed(2), //'P value: ': regrParam[3].toFixed(3)
                    }
    data[0].filter(function(d){return data[1].includes(d.properties.ID)}).map(d=>d.properties[response])
        infBox.selectAll('txtInf')
          .data(Object.keys(regrInfo))
            .enter().append('text')
            .style('font-size', '1vw')
            .attr('x', 0)
            .each(function(d,i){
                d3.select(this).attr('y', i*22)
                  .text(d + regrInfo[d])
            })

    //info background
    var rect = infBox.node().getBBox()
    infBox.insert('rect', ':first-child')
        .attr('x', rect.x - 2)
        .attr('y', rect.y - 2)
        .attr('width', rect.width + 4)
        .attr('height', rect.height + 4)
        .attr('rx', '5')
        .attr('ry', '5')
        .style('fill', 'white')
        .style('fill-opacity', 0.35)

    //////////// plot histogram ///////////////////////
    const nBins = 10
    const totSampl = responseVar.length
    //x predictor histogram
    const diX = (xScale.domain()[1] - xScale.domain()[0])/nBins
    var thrsX = []
    for (let i=0; i<nBins; ++i){thrsX.push(xScale.domain()[0] + i*diX)}
    thrsX.shift()

    const binsX = d3.histogram()
        .domain(xScale.domain())
        .thresholds(thrsX)
        (predictorVar);

    const yScaleHistX = d3.scaleLinear()
             .domain([0, d3.max(binsX.map(function (bin) { return bin.length/totSampl }))])
             .range([yScale.range()[1] - 10, yScale.range()[1] - margin.top*0.8]);

    var barX = mSVG.selectAll(".bar")
            .data(binsX)
            .enter().append("g")
            .attr("transform", function(d) { return "translate("+ (xScale(d.x0)) + "," + yScaleHistX(d.length/totSampl) + ")"; });
   
    //a rect is appended in each element (.bar) of the bar selection
    barX.append("rect")
        .attr("width", d=>xScale(d.x1) - xScale(d.x0))
        .attr("height", function(d) { return yScaleHistX(0) - yScaleHistX(d.length/totSampl); })
        .attr('class', 'histo');



    //y predictor histogram
    const diY = (yScale.domain()[1] - yScale.domain()[0])/nBins
    var thrsY = []
    for (let i=0; i<nBins; ++i){thrsY.push(yScale.domain()[0] + i*diY)}
    thrsY.shift()

    const binsY = d3.histogram()
        .domain(yScale.domain())
        .thresholds(thrsY)
        (responseVar);

    const cWidth = mSVG.node().getBBox().width
    const yScaleHistY = d3.scaleLinear()
             .domain([0, d3.max(binsY.map(function (bin) { return bin.length/totSampl }))])
             .range([xScale.range()[1] + 10, xScale.range()[1] + margin.left*0.55]);

    const barWidth = yScale(binsY[0].x0) - yScale(binsY[0].x1)

    var barY = mSVG.selectAll(".bar")
            .data(binsY)
            .enter().append("g")
            .attr("transform", function(d) { return "translate("+ yScaleHistY(0) + "," + (yScale(d.x0) - barWidth) + ")"; });
   
   //a rect is appended in each element (.bar) of the bar selection
   barY.append("rect")
     .attr("width", d=>yScaleHistY(d.length/totSampl) - yScaleHistY(0))
     .attr("height", yScale(binsY[0].x0) - yScale(binsY[0].x1))
     .attr('class', 'histo');
}

//load data
function loadData(marker, scale, format='topojson') {
    
    if (format == 'geojson'){
        var dat = d3.json('data/' + marker + '_' + scale + '.json').then(function(topoData){
            return topoData['features']
        })
    }
    else if (format == 'topojson'){
        var dat = d3.json('data/' + marker + '_' + scale + '.topojson').then(function(topoData){
            return topojson.feature(topoData, topoData.objects[marker + '_' + scale]).features
        })
    }
    return dat
}

function getSubset(data, taxonCover, nSeqs, boolSelect){
    var subset = [] //according to filters
    data.forEach(function(d){
        //field.push(d['properties'][variable])
        if (boolSelect == 'or'){
            if (d['properties']['taxCover']>= taxonCover/100 || d['properties']['gdSeqs']>= nSeqs){
                subset.push(d['properties']['ID'])
            }
        }else if (boolSelect == 'and'){
            if (d['properties']['taxCover']>= taxonCover/100 && d['properties']['gdSeqs']>= nSeqs){
                subset.push(d['properties']['ID'])
            }
        }
    })
    return [data, subset]
}


////////////////EVENT FUNCTIONS///////////////////////////////

function started(d) {//data are stored in the element already
    const deltaX = d3.event.x; //where the mouse is
    const deltaY = d3.event.y;
    //calculate current position relative to original
    const nX = d3.select(this).node().getBoundingClientRect().x - d.x 
    const nY = d3.select(this).node().getBoundingClientRect().y - d.y
    //define sequence of events
    d3.event.on('drag', dragged).on('end', ended);
    //closures
    function dragged(d) {
        d3.select(this).attr('transform', 'translate(' + (d3.event.x - deltaX + (+nX)) + ','+ (d3.event.y-deltaY+(+nY)) + ')scale(' + d.scale + ')');
    }
    function ended(d) {
        d.tX = d3.select(this).node().getBoundingClientRect().x - d.x
        d.tY = d3.select(this).node().getBoundingClientRect().y - d.y
        //to do
        //if map outside of visible boundaries bring back in
    }
}

function zoomClick() {
    //zoom attributes
    const factor = 0.2;
    const extent = [1,6];
    //select container
    var containeR = d3.select(this).select(function() { return this.parentNode; })
    //define center of container
    const center = [ containeR.node().getBoundingClientRect().width/2,
                   containeR.node().getBoundingClientRect().height/2];

    d3.event.preventDefault();
    //zoom in or zoom out
    const direction = (d3.select(this).attr('class').includes('zoomIn')) ? 1 : -1;
    //select map element
    const whichMap = containeR.attr('class')
    const thisMap = d3.select('#' + whichMap.replace('cont ', ''))
    //get current zoom
    const zoomScale = thisMap.datum().scale
    //define target zoom
    const targetZoom = (zoomScale * (1 + factor * direction) > extent[0]) ? zoomScale * (1 + factor * direction) : 1; 
    if (targetZoom < extent[0] || targetZoom > extent[1]) { return false; }
    
    //http://bl.ocks.org/linssen/7352810
    //compute previous translate
    translate0 = [(center[0] - thisMap.datum().tX) / zoomScale, 
                  (center[1] - thisMap.datum().tY) / zoomScale];

    const l = [translate0[0] * targetZoom + thisMap.datum().tX ,
         translate0[1] * targetZoom + thisMap.datum().tY];

    const newTranslate = [(thisMap.datum().tX ) + center[0] - l[0],
                        (thisMap.datum().tY ) + center[1] - l[1] ] 

    thisMap.attr('transform', 'translate('+ newTranslate[0] +','+ newTranslate[1] +')scale(' + targetZoom + ')')
    //update position datum of map
    thisMap.datum().tX = newTranslate[0]
    thisMap.datum().tY = newTranslate[1]
    thisMap.datum().scale = targetZoom
}

//create sliders and add events
function rangeSlider(container, data, varString){
    
    d3.select(container).selectAll("*").remove()

    const globalVar = globalVariables[varString] //get global variable

    const cont = d3.select(container).append('svg').attr('width', '100%').attr('height', '100%');

    // slider bar
    const sliderLine = cont.append('line')
            .attr('x1', '5%')
            .attr('x2', '80%')
            .attr('y1', '50%')
            .attr('y2', '50%')
            .attr('class', 'sliderLine')

    const slideX = sliderLine.node().getBBox().x;
    const slideY = sliderLine.node().getBBox().y;
    const slideWidth = sliderLine.node().getBBox().width;

    //get range of the corresponding filtering variable
    if (varString == 'minSeqNumber'){
        var seqStd = d3.deviation(data[0].map(d=>d.properties['gdSeqs']))
        var range = [2, 1.4*seqStd]
    } else if (varString == 'minTaxCover'){
        var range = [0, Math.ceil(100*d3.max(data[0].map(d=>d.properties['taxCover'])))]
    }

    const slideScale = d3.scaleLinear()
            .domain(range)
            .range([slideX, slideY + slideWidth])
            .clamp(true);

    
    //draw a line for the min tax coverage
    if (varString == 'minTaxCover' && globalVariables.spatialScale == 'grid'){
        cont.append('line')
            .attr('x1', slideScale(7))
            .attr('x2', slideScale(7))
            .attr('y1', slideY - 8)
            .attr('y2', slideY + 8)
            .attr('stroke', 'red')
            .attr('stroke-width', 3)
            .attr('stroke-linecap', 'round');
    }


    //draw a line for the standard deviation
    if (varString == 'minSeqNumber' && globalVariables.spatialScale == 'grid'){
        cont.append('line')
            .attr('x1', slideScale(parseInt(seqStd)))
            .attr('x2', slideScale(parseInt(seqStd)))
            .attr('y1', slideY - 8)
            .attr('y2', slideY + 8)
            .attr('stroke', 'red')
            .attr('stroke-width', 3)
            .attr('stroke-linecap', 'round');
    }

    //insert the event surface on top of the slider
    sliderLine.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr('x1', '0%') //start the interaction a bit before the line starts (i.e. start of the handle)
        .attr('x2', '85%') //ditto
        .attr('class', 'track-overlay')
        .call(d3.drag().on('drag', function(){
            draggedSlide(slideScale.invert(d3.event.x))// invert is the trick to restrict the drag within the slider only
        }))
        .on('click', function(){
            clickedSlide(slideScale.invert(d3.mouse(this)[0]))// invert is the trick to restrict the drag within the slider only
        })

    const handle = cont.selectAll('handles')
            .data([1, 5.5]).enter()
          .insert('circle', '.track-overlay') //insert puts elements below the selected
            .attr('cx', slideScale(Math.round(globalVariables[varString])))
            .attr('cy', slideY)
            .attr('class', 'handle')
            .attr('r', d=>d+'%');

    const slideText = cont.append('text')
                .attr('x', '86.5%')
                .attr('y', slideY)
                .style('alignment-baseline', 'central')
                .text(globalVar)

    function draggedSlide(pos) {
        d3.select('.updateBut').style('background-color', updateColor)
        var pos = Math.round(pos)
        handle.attr('cx', slideScale(pos)); // part of the invert trick above
        globalVariables[varString] = pos; //change global variable
        slideText.text(pos)
    }

    function clickedSlide(pos) {
        d3.select('.updateBut').style('background-color', updateColor)
        var pos = Math.round(pos)
        handle.attr('cx', slideScale(pos));
        globalVariables[varString] = pos;
        slideText.text(pos) 
    }
}


// Create Event Handlers for mouse
function handleMouseOver(c, i) {  // Add interactivity
    handleMouseOut()
    //first get the container
    //const currentCont = d3.select(this).select(function() { return this.parentNode; }).attr('id')

    d3.selectAll('#spatioUnits path')
            .filter(function(d) {return d.properties.ID === c.properties.ID})
            .raise()
            .classed('selectedCells',true)

    d3.selectAll('#spatioUnitsP path')
        .filter(function(d) {return d.properties.ID === c.properties.ID})
        .raise()
        .classed('selectedCells',true)

    d3.selectAll('#xyPlot circle')
            .filter(function(d) {return d.properties.ID === c.properties.ID})
            .raise()
            .classed('selectedPoints',true)

    var infoLabel = d3.select('.spatialUnitB');

    var dataInfo = {ID: 'ID', GD: 'Genetic diversity', gdSeqs: 'Number of sequences', gdTaxa: 'Number of species', taxCover: 'Taxonomic coverage'}

    infoLabel.selectAll('span')
        .data(Object.keys(dataInfo))
        .enter().append('span')
        .text(function(d){
            const value = (precision(c.properties[d]) < 4) ?  c.properties[d] : c.properties[d].toFixed(4)
            if (d == 'taxCover'){
                return dataInfo[d] + ': ' + (value*100).toFixed(2) + '%'
            }else {
                return dataInfo[d] + ': ' + value
            }
            
        })
        .append('br')
        

    const ordD = c.properties.orders
    const ordGD = c.properties.ordersGD

    d3.selectAll('.order').data(Object.keys(ordD))
            .each(function(d){

                d3.select(this)
                    .append('img')
                    .attr('src', d=>'img/' + d + '.png')
                    .attr('alt', d=>d)
                    .on('load', function() {
                        const imgW = d3.select(this).node().naturalWidth;
                        const imgH = d3.select(this).node().naturalHeight;

                        if (imgW > imgH){
                            d3.select(this).style('max-width', '60%')
                            d3.select(this).style('max-height', '80%')
                        } else {
                            d3.select(this).style('max-width', '70%')
                            d3.select(this).style('max-height', '80%')
                        }


                    });

                d3.select(this)
                    .append('span').attr('class', 'ordGD').text(ordGD[d].toFixed(3))

                d3.select(this)
                    .append('span').attr('class', 'ord').text(ordD[d])


            })
} 

function handleMouseOut(d, i) {
    d3.selectAll('#spatioUnits path').classed('selectedCells',false)
    d3.selectAll('#spatioUnitsP path').classed('selectedCells',false)
    d3.selectAll('#xyPlot circle').classed('selectedPoints',false).lower()

    d3.select('.spatialUnitB').selectAll('span').remove()
    d3.select('.taxaB').selectAll('span').remove()
    d3.select('.taxaB').selectAll('img').remove()
}


////////////////STATISTIC FUNCTIONS///////////////////////////////

// regression function
function makeRegression(xRegression, yRegression){

    ///////////////////// Simple regression ///////////////////////////////
    var datReg = [];
    xRegression.forEach(function(d,i){
        datReg.push([d, yRegression[i]])
    })

    const regrParams = ss.linearRegression(datReg)
    const lm = ss.linearRegressionLine(regrParams);
    const rSquared = ss.rSquared(datReg, lm);
    
    var predY = []; //predicted Y
    var sqrXreg = []; //to be used for the standard error of regression slope

    xRegression.forEach(function(d,i){
        predY.push(lm(d))
        sqrXreg.push((d-d3.mean(xRegression))*(d-d3.mean(xRegression)))
    });

    var sqrErrors = [] // squared regression errors
    predY.forEach(function(d,i){
        sqrErrors.push((yRegression[i]-d)*(yRegression[i]-d))
    })

    const SEE = Math.sqrt((d3.sum(sqrErrors)/(sqrErrors.length-2)))//standard error of estimate
    const SEregSlope = SEE / Math.sqrt(d3.sum(sqrXreg))//standard error of regression slope
    const tStatistic = regrParams.m / SEregSlope
    const pValue = computePvalue(Math.abs(tStatistic), yRegression.length-2) // probability of obtaining a higher value

    return [regrParams.b, regrParams.m, tStatistic, 2*pValue, rSquared]
}


// Student's t distribution functions for calculating P-value
//http://www.math.ucla.edu/~tom/distributions/tDist.html

function LogGamma(Z) {
    with (Math) {
        let S=1+76.18009173/Z-86.50532033/(Z+1)+24.01409822/(Z+2)-1.231739516/(Z+3)+.00120858003/(Z+4)-.00000536382/(Z+5);
        var LG= (Z-.5)*log(Z+4.5)-(Z+4.5)+log(S*2.50662827465);
    }
    return LG
}

function Betinc(X,A,B) {
    let A0=0;
    let B0=1;
    let A1=1;
    let B1=1;
    let M9=0;
    let A2=0;
    let C9;
    while (Math.abs((A1-A2)/A1)>.00001) {
        A2=A1;
        C9=-(A+M9)*(A+B+M9)*X/(A+2*M9)/(A+2*M9+1);
        A0=A1+C9*A0;
        B0=B1+C9*B0;
        M9=M9+1;
        C9=M9*(B-M9)*X/(A+2*M9-1)/(A+2*M9);
        A1=A0+C9*A1;
        B1=B0+C9*B1;
        A0=A0/B1;
        B0=B0/B1;
        A1=A1/B1;
        B1=1;
    }
    return A1/A
}

function computePvalue(tScore, df) {
    let X=eval(tScore)
    df=eval(df)
    with (Math) {
        let A=df/2;
        let S=A+.5;
        let Z=df/(df+X*X);
        let BT=exp(LogGamma(S)-LogGamma(.5)-LogGamma(A)+A*log(Z)+.5*log(1-Z));
        if (Z<(A+1)/(S+2)) {
            var betacdf=BT*Betinc(Z,A,.5)
        } else {
            var betacdf=1-BT*Betinc(1-Z,.5,A)
        }
        if (X<0) {
            var tcdf=betacdf/2
        } else {
            var tcdf=1-betacdf/2
        }

        tcdf=round(tcdf*100000)/100000;
    }
    return 1 - tcdf;
}


function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

