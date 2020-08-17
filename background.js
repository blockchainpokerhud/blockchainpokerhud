/**
 * Blockchain Poker HUD Background Script
 **/

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch(request["type"]) {
    case "getUpdate":
      apiKey = request["apiKey"];
      id = request["id"];
      tid = request["tid"];
      $.ajax({
        url: 'https://api.blockchainpokerhud.com/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(
          {
            getupdate: "true",
            api_key: apiKey + '_' + id + '_' + tid,
          }
        ),
        dataType: 'json',
        success: function(msg, status, jqXHR) {
          sendResponse(msg)
        }
      });
      break;
    case "getHandStrength":
      apiKey = request["apiKey"];
      id = request["id"];
      tid = request["tid"];
      evaluate_a = request["evaluate_a"];
      evaluate_b = request["evaluate_b"];
      $.ajax({
        url: 'https://api.blockchainpokerhud.com/gethandstrength/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(
          {
            evaluate: [evaluate_a, evaluate_b],
            api_key: apiKey + '_' + id + '_' + tid,
          }
        ),
        dataType: 'json',
        success: function(msg, status, jqXHR) {
          sendResponse(msg);
        }
      });
      break;
  }
  return true;
})
