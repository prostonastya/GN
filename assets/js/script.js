'use strict';

window.onload = function () {
  const map = document.getElementById('world-map');
  const output = document.getElementById('output');
  const locHighlight = document.getElementById('loc-highlight');
  let locCords = {};

  map.addEventListener('click', function (event) {
    const coordX = event.clientX;
    const coordY = event.clientY;
    const mapCords = this.getBoundingClientRect();
    const mapWidth = this.offsetWidth;
    const mapHeight = this.offsetHeight;
    const relX = recalcLong(coordX - mapCords.left, mapWidth);
    const relY = recalcLat(coordY - mapCords.top, mapHeight);

    locCords = getLocationCords(relX, relY);

    locHighlight.style.display = 'block';
    highlightLocation(locCords);
    output.innerText = `Cursor: ${relX} ${relY};
                        Location: ${locCords.locX} ${locCords.locY};`;
  });

  function recalcLong(coord, size) {
    return Math.round((coord / size) * 360) - 180;
  }
  function recalcLat(coord, size) {
    return Math.round((coord / size) * -180) + 90;
  }

  function getLocationCords(relX, relY) {
    const relWidth = 36;
    const relHeight = 18;

    let locX = (relX % relWidth) > (relWidth / 2) ?
      (Math.ceil(relX / relWidth) - 0.5) * relWidth :
      (Math.floor(relX / relWidth) + 0.5) * relWidth;
    let locY = (relY % relHeight) > (relHeight / 2) ?
      (Math.ceil(relY / relHeight) - 0.5) * relHeight :
      (Math.floor(relY / relHeight) + 0.5) * relHeight;

    if (locX > 180) {
      locX -= relWidth;
    }

    if (locY > 90) {
      locY -= relHeight;
    }

    return {
      locX,
      locY,
    };
  }

  function highlightLocation() {
    const highlightCords = getHighlightCords(locCords);

    locHighlight.style.top = `${highlightCords.top}%`;
    locHighlight.style.left = `${highlightCords.left}%`;
  }

  function getHighlightCords() {
    const top = Math.floor(((locCords.locY - 81) / -180) * 100);
    const left = Math.floor(((locCords.locX + 162) / 360) * 100);

    return {
      top,
      left,
    };
  }
};
