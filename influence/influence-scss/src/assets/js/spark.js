/*  Spark js */

$("#sparkline1").sparkline([5, 6, 7, 8, 9, 6, 8, 10], {
    type: 'bar',
    height: '50',
    barWidth: 10,
    barSpacing: 4,
    barColor: '#5969ff'


});

$("#sparkline2").sparkline([5, 6, 7, 9, 8, 5, 3, 2, 2, 4, 6, 5, 5, 6, 3, 4, 9, 5, 2, 3], {
    type: 'line',
    width: '60%',
    height: '50',
    spotColor: '#ff407b',
    minSpotColor: '#ff407b',
    maxSpotColor: '#ff407b',
    lineColor: '#5969ff',
    lineWidth: '2'
});

$("#sparkline3").sparkline([1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
    {
        type: 'discrete',
        width: '120',
        height: '50',
        lineColor: '#25d5f2'

    });


$("#sparkline4").sparkline([5, 6, 7, 9, 9, 5, 3, 2, 2, 4, 6, 7], {
    type: 'line',
    lineColor: '#7040fa',
    fillColor: null,
    width: '60%',
    height: '50',
    spotColor: '#ff407b',
    minSpotColor: '#ff407b',
    maxSpotColor: '#ff407b',
    lineWidth: '2'
});

$('#compositebar')
    .sparkline([4, 1, 5, 7, 9, 9, 8, 7, 6, 6, 4, 7, 8, 4, 3, 2, 2, 5, 6, 7], {
        type: 'bar',
        height: '50',
        barWidth: '4',
        resize: true,
        barSpacing: '7',
        barColor: '#25d5f2',

    });
$('#compositebar').sparkline([4, 1, 5, 7, 9, 9, 8, 7, 6, 6, 4, 7, 8, 4, 3, 2, 2, 5, 6, 7], {
    composite: true,
    fillColor: false,
    lineColor: '#25d5f2',
    spotColor: '#ff407b',
    minSpotColor: '#ff407b',
    maxSpotColor: '#ff407b',
    lineWidth: '2'

});

$("#sparkline5").sparkline([10, 12, 12, 9, 7], {
    type: 'bullet',
    targetColor: '#5969ff',
    performanceColor: '#ff407b',
    height: '50',
    width: '180',
    resize: true

});

$("#sparkline6").sparkline([1, 1, 2], {

    sliceColors: ['#ff407b', '#5969ff #5969ff', '#5969ff', '#ff407b', '#ff407b'],
    type: 'pie',
    height: '50',
    resize: true

});

$("#sparkline7").sparkline([4, 27, 34, 52, 54, 59, 61, 68, 78, 82, 85, 87, 91, 93, 100], {
    type: 'box',
    boxFillColor: '#5969ff',
    medianColor: '#ff407b',
    targetColor: '#ff407b',
    height: '50',
    width: '200',
    resize: true,

});

$("#sparkline-1").sparkline([5, 5, 7, 7, 9, 5, 3, 5, 2, 4, 6, 7], {
    type: 'line',
    width: '99.5%',
    height: '100',
    lineColor: '#5969ff',
    fillColor: '#d4d8ff',
    lineWidth: 2,
    spotColor: undefined,
    minSpotColor: undefined,
    maxSpotColor: undefined,
    highlightSpotColor: undefined,
    highlightLineColor: undefined,
    resize: true
});

$("#sparkline-2").sparkline([3, 7, 6, 4, 5, 4, 3, 5, 5, 2, 3, 1], {
    type: 'line',
    width: '99.5%',
    height: '100',
    lineColor: '#ff407b',
    fillColor: '#ffc9da',
    lineWidth: 2,
    spotColor: undefined,
    minSpotColor: undefined,
    maxSpotColor: undefined,
    highlightSpotColor: undefined,
    highlightLineColor: undefined,
    resize: true
});

$("#sparkline-3").sparkline([5, 3, 4, 6, 5, 7, 9, 4, 3, 5, 6, 1], {
    type: 'line',
    width: '99.5%',
    height: '100',
    lineColor: '#25d5f2',
    fillColor: '#b6f5ff',
    lineWidth: 2,
    spotColor: undefined,
    minSpotColor: undefined,
    maxSpotColor: undefined,
    highlightSpotColor: undefined,
    highlightLineColor: undefined,
    resize: true
});

$("#sparkline-4").sparkline([6, 5, 3, 4, 2, 5, 3, 8, 6, 4, 5, 1], {
    type: 'line',
    width: '99.5%',
    height: '100',
    lineColor: '#ffc750',
    fillColor: '#ffe3a6',
    lineWidth: 2,
    spotColor: undefined,
    minSpotColor: undefined,
    maxSpotColor: undefined,
    highlightSpotColor: undefined,
    highlightLineColor: undefined,
    resize: true,
});