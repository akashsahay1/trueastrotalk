/* Sortable and Nestable */

(function(window, document, $, undefined) {
    "use strict";


    if ($('#sortitem1, #sortitem2').length) {
        "use strict";
        // sortable
        var el = document.getElementById('sortitem1');
        var pl = document.getElementById('sortitem2');
        var sortable = Sortable.create(el);
        var sortable = Sortable.create(pl);
    }

    if ($('.dd').length) { // nestable

        $('.dd').nestable('serialize');
    }

})(window, document, window.jQuery);