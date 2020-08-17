/**
 * This function sends the table state to the HUD content.js script every second
 */

var rewards_balance = 0;
var minutetick = 0;
var topEarners = [];
var open_tables;
var player_notes = {};
var tournament_tables;
var transaction_history;

window.addEventListener('message', function(event) {
  data = event.data;
  if(event.origin !== 'https://blockchain.poker') return;
  switch(data.type) {
    case "history_id":
      hand_id = data.text;
      socket.emit("getHistory", { hand: hand_id }, function(x) { 
        event.source.postMessage({
          "type": "getHistoryResponse",
          "payload": x,
          "hand_id": hand_id
        }, event.origin)
      });
      break;
    case "table_state":
      event.source.postMessage({
        "type": "getTableStateResponse",
        "payload": window.table
      }, event.origin)
      break;
    case "you_state":
      event.source.postMessage({
        "type": "getYouStateResponse",
        "payload": window.you
      }, event.origin)
      break;
    case "anti_idle":
      table_id = data.text;
      socket.emit("sitIn", { table: table_id }, function(x) {
        socket.emit("sitOut", { table: table_id }, function(y) {
          // Anti idle
        });
      });
      break;
  }
});

setInterval(function() {
  var myts = Math.round((new Date()).getTime() / 1000);
  // Fire the events when we are logged in only
  if(typeof you !== "undefined" && you.key !== "") {
    if (parseInt(myts) > parseInt(minutetick)) {
      socket.emit("getRewardsBalance", {}, function(x) { rewards_balance = x["balance"]; minutetick = (Math.round((new Date()).getTime() / 1000) + 60 ) });
      var this_currency = table.currency;
      if(typeof this_currency !== "undefined") {
        socket.emit("getTopChipEarners", { currency: this_currency }, function(x) { var myTopEarners = []; for(obj of x["topChipEarners"]) { myTopEarners.push(obj.AccountId) }; topEarners = myTopEarners; } );
        socket.emit("gettables", { pageSize: 1000, currency: this_currency }, function(x) { open_tables = x });
        socket.emit("gettournaments", { pageSize: 1000, currency: this_currency }, function(x) { tournament_tables = x });
        socket.emit("getTransactions", { }, function(x) { transaction_history = x });
        players_at_table = window.table.seats.map(p => p.name);
        for(p of players_at_table) {
          if(typeof player_notes[p] == "undefined") {
            socket.emit("getProfile", { name: p }, function(x, player = p) { note = x.notes; if(typeof x.notes !== "undefined") { player_notes[x.name] = note } });
          }
        }
      }
    }
  } else {
    minutetick = (Math.round((new Date()).getTime() / 1000) + 2 );
  }
}, 1000)

setInterval(function() {
  document.dispatchEvent(new CustomEvent('RW759_connectExtension', {
    detail: {
      rewards_balance: rewards_balance,
      top_earners: topEarners,
      open_tables: open_tables,
      player_notes: player_notes,
      tournament_tables: tournament_tables,
      transaction_history: transaction_history
    }
  }));
}, 1000);
