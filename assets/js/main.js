document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.side-nav');
  var instances = M.Sidenav.init(elems, options);
});

// Or with jQuery

$(document).ready(function(){
  $('.side-nav').sidenav();
});