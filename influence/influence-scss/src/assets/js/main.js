/* Main js  */
$(document).ready(function() {
    "user strict";
    // Menu List
    if ($(".notification-list").length) {
        // list     

        $('.notification-list').slimScroll({
            height: '250px'
        });
    }

    // Menu List   
    if ($(".menu-list").length) {
        $('.menu-list').slimScroll({
            height: '100%'

        });

    }
    // search   
    if ($("#custom-search").length) {
        $("#custom-search").click(function() {
            $(".search-query").focus();
        });
    }
    // sidenav    
    if ($(".sidebar-nav-fixed a").length) {
        $('.sidebar-nav-fixed a')
            // Remove links that don't actually link to anything

        .click(function(event) {
            // On-page links
            if (
                location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
                location.hostname == this.hostname
            ) {
                // Figure out element to scroll to
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                // Does a scroll target exist?
                if (target.length) {
                    // Only prevent default if animation is actually gonna happen
                    event.preventDefault();
                    $('html, body').animate({
                        scrollTop: target.offset().top - 90
                    }, 1000, function() {
                        // Callback after animation
                        // Must change focus!
                        var $target = $(target);
                        $target.focus();
                        if ($target.is(":focus")) { // Checking if the target was focused
                            return false;
                        } else {
                            $target.attr('tabindex', '-1'); // Adding tabindex for elements not focusable
                            $target.focus(); // Set focus again
                        };
                    });
                }
            };
            $('.sidebar-nav-fixed a').each(function() {
                $(this).removeClass('active');
            })
            $(this).addClass('active');



        });

    }
    // tooltip     
    if ($('[data-toggle="tooltip"]').length) {
        $('[data-toggle="tooltip"]').tooltip()
    }
    // popover     
    if ($('[data-toggle="popover"]').length) {
        $('[data-toggle="popover"]').popover()
    }
    // chat list    

    if ($('.chat-list').length) {
        $('.chat-list').slimScroll({
            color: 'false',
            width: '100%',
            height: '100%'


        });

    }

    // test list    

    // var monkeyList = new List('test-list', {
    //     valueNames: ['name']

    // });
    // var monkeyList = new List('test-list-2', {
    //     valueNames: ['name']

    // });





    // Parsley

    if ($('#form').length) {
        $('#form').parsley();
    }

    if ($('.needs-validation').length) {

        (function() {
            'use strict';
            window.addEventListener('load', function() {
                // Fetch all the forms we want to apply custom Bootstrap validation styles to
                var forms = document.getElementsByClassName('needs-validation');
                // Loop over them and prevent submission
                var validation = Array.prototype.filter.call(forms, function(form) {
                    form.addEventListener('submit', function(event) {
                        if (form.checkValidity() === false) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        form.classList.add('was-validated');
                    }, false);
                });
            }, false);
        })();

    }

    /* slidepanel  */
    if ($('#slide-panel').length) {
        $('#slide-panel').slideReveal({
            trigger: $("#trigger"),
            position: "right",
            push: false,
            overlay: true,
            width: 350,
            speed: 450
        });
    }

    /* Daterange js */

    if ($('input[name="daterange"]').length) {
        $('input[name="daterange"]').daterangepicker({
            opens: 'left'
        }, function(start, end, label) {
            console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
        });
    }

    /*  collapse  */
    if ($('card-header button').length) {
        $('.collapse').on('shown.bs.collapse', function() {
            $(this).parent().find(".fa-angle-down").removeClass("fa-angle-down").addClass("fa-angle-up");
        }).on('hidden.bs.collapse', function() {
            $(this).parent().find(".fa-angle-up").removeClass("fa-angle-up").addClass("fa-angle-down");
        });

        $('.card-header button').click(function() {
            $('.card-header').removeClass('active');

            //If the panel was open and would be closed by this click, do not active it
            if (!$(this).closest('.card').find('.collapse').hasClass('in'))
                $(this).parents('.card-header').addClass('active');
        });
    }

      // menu js 
      if ($(".dropdown-menu a.dropdown-toggle").length) {
        $(".dropdown-menu a.dropdown-toggle").on("click", function(e) {
            if (!$(this)
                .next()
                .hasClass("show")
            ) {
                $(this)
                    .parents(".dropdown-menu")
                    .first()
                    .find(".show")
                    .removeClass("show");
            }
            var $subMenu = $(this).next(".dropdown-menu");
            $subMenu.toggleClass("show");

            $(this)
                .parents("li.nav-item.dropdown.show")
                .on("hidden.bs.dropdown", function(e) {
                    $(".dropdown-submenu .show").removeClass("show");
                });

            return false;
        });
    }

        //   Stopevent
  if ($(".stopevent").length) {
    $(document).on("click.bs.dropdown.data-api", ".stopevent", function (e) {
      e.stopPropagation();
    });
  }



});