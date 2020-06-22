function save_options() {
  var apikey = document.getElementById('apikey').value;
  var autotopup = document.getElementById('autotopup').checked;
  chrome.storage.sync.set({
    apiKey: apikey,
    autotopup: autotopup
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    apiKey: 'unset',
    autotopup: false
  }, function(items) {
    document.getElementById('apikey').value = items.apiKey;
    document.getElementById('autotopup').checked = items.autotopup;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
