/**
 * This function sends the table state to the HUD content.js script every second
 */

setInterval(function() {
  document.dispatchEvent(new CustomEvent('RW759_connectExtension', {
    detail: {
      table: window.table,
      you: window.you
    }
  }));
}, 1000);
