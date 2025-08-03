/*  Normal Touchspin */
$(function() {
    "use strict";

    if ($('input[name="demo3"]').length) {
        $("input[name='demo3']").TouchSpin();
    }
    /* postfix Touchspin  */
    if ($('input[name="demo1"]').length) {
        $("input[name='demo1']").TouchSpin({
            min: 0,
            max: 100,
            step: 0.1,
            decimals: 2,
            boostat: 5,
            maxboostedstep: 10,
            postfix: '%'
        });
    }

    /* prefix Touchspin */
    if ($('input[name="demo2"]').length) {
        $("input[name='demo2']").TouchSpin({
            min: -1000000000,
            max: 1000000000,
            stepinterval: 50,
            maxboostedstep: 10000000,
            prefix: '$'
        });
    }

    /* Vertical button alignment */
    if ($('input[name="demo1_vertical"]').length) {
        $("input[name='demo_vertical']").TouchSpin({
            verticalbuttons: true
        });
    }
    /*  Vertical buttons with custom icons */
    if ($('input[name="demo1_vertical2"]').length) {
        $("input[name='demo_vertical2']").TouchSpin({
            verticalbuttons: true,
            verticalupclass: 'glyphicon glyphicon-plus',
            verticaldownclass: 'glyphicon glyphicon-minus'
        });
    }

    /*    touchspin with button(small) */
    if ($('input[name="demo4"]').length) {
        $("input[name='demo4']").TouchSpin({
            postfix: "a button",
        });
    }
    /*  touchspin with button(large) */
    if ($('input[name="demo_2"]').length) {
        $("input[name='demo4_2']").TouchSpin({
            postfix: "a button",
        });
    }

    /*  Button Group  */
    if ($('input[name="demo5"]').length) {
        $("input[name='demo5']").TouchSpin({
            prefix: "pre",
            postfix: "post"
        });
    }
    /* Button change class */
    if ($('input[name="demo6"]').length) {
        $("input[name='demo6']").TouchSpin({
            buttondown_class: "btn btn-link",
            buttonup_class: "btn btn-link"
        });
    }
});