$(document).ready(function(){
  // side bar navigation
  $('.sidenav').sidenav();

  if ($('.parallax > img').length) {
    // Initialize parallax image.
    $('.parallax').parallax();
  }
});