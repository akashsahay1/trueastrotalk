/*  Morris js  */
$(function() {
    "use strict";
    if ($('#morris_area').length) {
        Morris.Area({
            element: 'morris_area',
            behaveLikeLine: true,
            data: [
                { x: '2011 Q1', y: 4, z: 3 },
                { x: '2011 Q2', y: 2, z: 1 },
                { x: '2011 Q3', y: 2, z: 3 },
                { x: '2011 Q4', y: 4, z: 1 }
            ],
            xkey: 'x',
            ykeys: ['y', 'z'],
            labels: ['Y', 'Z'],
            lineColors: ['#5969ff', '#ff407b'],
            resize: true,
            gridTextSize: '14px'


        });
    }

    if ($('#morris_line').length) {

        Morris.Line({
            element: 'morris_line',
            behaveLikeLine: true,
            data: [
                { y: '2006', a: 10, b: 20 },
                { y: '2007', a: 65, b: 45 },
                { y: '2008', a: 50, b: 40 },
                { y: '2009', a: 75, b: 65 },
                { y: '2010', a: 50, b: 40 },
                { y: '2011', a: 75, b: 65 },
                { y: '2012', a: 100, b: 90 }
            ],

            xkey: 'y',
            ykeys: ['a', 'b'],
            labels: ['Series A', 'Series B'],
            lineColors: ['#5969ff', '#ff407b'],
            resize: true,
            gridTextSize: '14px'
        });
    }


    if ($('#morris_stacked').length) {
        Morris.Bar({
            element: 'morris_stacked',
            data: [
                { x: '2011 Q1', y: 3, z: 2, a: 3 },
                { x: '2011 Q2', y: 2, z: null, a: 1 },
                { x: '2011 Q3', y: 0, z: 2, a: 4 },
                { x: '2011 Q4', y: 2, z: 4, a: 3 }
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            stacked: true,
            barColors: ['#5969ff', '#ff407b', '#25d5f2'],
            resize: true,
            gridTextSize: '14px'
        });
    }



    if ($('#morris_donut').length) {
        Morris.Donut({
            element: 'morris_donut',
            data: [
                { value: 70, label: 'foo' },
                { value: 15, label: 'bar' },
                { value: 10, label: 'baz' },
                { value: 5, label: 'A really really long label' }
            ],

            labelColor: '#2e2f39',
            gridTextSize: '14px',
            colors: [
                "#5969ff",
                "#ff407b",
                "#25d5f2",
                "#ffc750"

            ],
            formatter: function(x) { return x + "%" },
            resize: true
        });
    }
});