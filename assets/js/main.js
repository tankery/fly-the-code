$(document).ready(function(){
  // side bar navigation
  $('.sidenav').sidenav();

  if ($('.parallax > img').length) {
    // Initialize parallax image.
    $('.parallax').parallax();
  }

  // Replace line break in pre > code to <br> tag, to fix issue of WeChat paste issue.
  $('.post-page .post-content pre > code').each(function(){
    var html = $(this).html();
    var replaced = html.replace(/<\/span>\n\S/g, function(s){
      return s.replace('\n', '<br>');
    })
    $(this).html(replaced);
  });
});