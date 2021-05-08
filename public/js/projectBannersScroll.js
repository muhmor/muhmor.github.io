
const moveBannerAmount = 25;
const changeDisDivider = 4;
const yOffsetDivider = 6;
const xOffsetDivider = 5;
const projectBanners = document.getElementsByClassName("projectbox");

function HandleProjectBannersOpacity(scrollPos) {
  const changeDis = window.innerHeight/changeDisDivider;
  const yOffset = window.innerHeight/yOffsetDivider;
  const firstXPos =  GetElementPosition(projectBanners[0]).x;
  for(var i = 0; i < projectBanners.length; i++)
  {
    var dis = GetElementPosition(projectBanners[i]);
    var opacity = dis.y - window.innerHeight;
    var xOffset = (dis.x - firstXPos) / xOffsetDivider;
    opacity = -Math.min(opacity + yOffset + xOffset, 0);
    opacity = opacity /changeDis;
    opacity = Math.min(opacity, 1);
    projectBanners[i].style.opacity = opacity;
    projectBanners[i].style.transform = "translate(0,"+ (moveBannerAmount - moveBannerAmount * opacity)+"px)";
  }
}

let lastKnownScrollPosition = 0;
let ticking = false;

document.addEventListener('scroll', function(e) {
  lastKnownScrollPosition = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function() {
      HandleProjectBannersOpacity(lastKnownScrollPosition);
      ticking = false;
    });

    ticking = true;
  }
});

function GetElementPosition(el) {
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
