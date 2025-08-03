/*  Multiselect   */


$(function() {
    "use strict";

    if ($('#my-select, #pre-selected-options').length) {
        $('#my-select, #pre-selected-options').multiSelect();
    }
    if ($('#callbacks').length) {
        // callbacks
        $('#callbacks').multiSelect({
            afterSelect: function(values) {
                alert("Select value: " + values);
            },
            afterDeselect: function(values) {
                alert("Deselect value: " + values);
            }
        });
    }
    if ($('#keep-order').length) {
        // keep order
        $('#keep-order').multiSelect({ keepOrder: true });
    }
    if ($('#optgroup').length) {
        //optgroup
        $('#optgroup').multiSelect({ selectableOptgroup: true });
    }
    if ($('#disabled-attribute').length) {
        //disabled attribute
        $('#disabled-attribute').multiSelect();
    }
    if ($('#custom-headers').length) {
        // custom headers
        $('#custom-headers').multiSelect({
            selectableHeader: "<div class='custom-header'>Selectable items</div>",
            selectionHeader: "<div class='custom-header'>Selection items</div>",
            selectableFooter: "<div class='custom-header'>Selectable footer</div>",
            selectionFooter: "<div class='custom-header'>Selection footer</div>"
        });
    }
});