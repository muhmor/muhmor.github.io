const projectBanners = document.getElementsByClassName("projectbox");
const opacityChandeDis = window.innerHeight/4;
const opacityOffset = window.innerHeight/6;

let lastKnownScrollPosition = 0;
let ticking = false;

function HandleProjectBanners(scrollPos) {
  for(var i = 0; i < projectBanners.length; i++)
  {
    var opacity = GetPosition(projectBanners[i]).y - window.innerHeight;
    opacity = -Math.min(opacity + opacityOffset, 0);
    opacity = opacity /opacityChandeDis;
    opacity = Math.min(opacity, 1);
    projectBanners[i].style.opacity = opacity;
  }
}

document.addEventListener('scroll', function(e) {
  lastKnownScrollPosition = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function() {
      HandleProjectBanners(lastKnownScrollPosition);
      ticking = false;
    });

    ticking = true;
  }
});

function GetPosition(el) {
  var xPos = 0;
  var yPos = 0;

  while (el) {
    if (el.tagName == "BODY") {
      // deal with browser quirks with body/window/document and page scroll
      var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
      var yScroll = el.scrollTop || document.documentElement.scrollTop;

      xPos += (el.offsetLeft - xScroll + el.clientLeft);
      yPos += (el.offsetTop - yScroll + el.clientTop);
    } else {
      // for all other non-BODY elements
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    }

    el = el.offsetParent;
  }
  return {
    x: xPos,
    y: yPos
  };
}
