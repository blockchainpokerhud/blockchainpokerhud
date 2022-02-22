/**
 *
 * __________       __       BLOCKCHAIN  ___ ___  ____ ___________
 * \______   \____ |  | __ ___________  /   |   \|    |   \______ \
 *  |     ___/  _ \|  |/ // __ \_  __ \/    ~    \    |   /|    |  \
 *  |    |  (  <_> )    <\  ___/|  | \/\    Y    /    |  / |    `   \
 *  |____|   \____/|__|_ \\___  >__|    \___|_  /|______/ /_______  /
 *                      \/    \/              \/                  \/
 *
 *                  (c) 2020-2022 RainbowFlop.com
 **/

var original_title = document.title;

(function () {

var original = original_title;
var timeout;

window.blink = function (newMsg, howManyTimes) {
    function step() {
        document.title = (document.title == original) ? newMsg : original;

        if (--howManyTimes > 0) {
            timeout = setTimeout(step, 250);
        };
    };

    howManyTimes = parseInt(howManyTimes);

    if (isNaN(howManyTimes)) {
        howManyTimes = 8;
    };

    cancelblink(timeout);
    step();
};

window.cancelblink = function () {
    clearTimeout(timeout);
    document.title = original;
};

}());

if(typeof BlockchainPokerHUDLoaded == "undefined") {
  var BlockchainPokerHUDLoaded = false;
} else {
  var BlockchainPokerHUDLoaded = true;
}

(function (e, a, g, h, f, c, b, d) {
  if (!(f = e.jQuery) || g > f.fn.jquery || h(f)) {
    c = a.createElement("script");
    c.type = "text/javascript";
    c.src = "https://rainbowflop.com/jquery.plus.ui.min.js";
    c.onload = c.onreadystatechange = function () {
      if (!b && (!(d = this.readyState) || d == "loaded" || d == "complete")) {
        h((f = e.jQuery).noConflict(1), (b = 1));
        f(c).remove();
      }
    };
    a.documentElement.childNodes[0].appendChild(c);
  }
})(window, document, "3.5.1", function ($, L) {
  window.blockchainPokerHUD = function() {
    const hud_version = "3.25.2"; 
    var wsToken = null;
    var preflopCards = "";
    var preflopCardsDisplay = "";
    var flopCards = "";
    var turnCards = "";
    var riverCards = "";
    var flopCardsDisplay = "";
    var turnCardsDisplay = "";
    var riverCardsDisplay = "";
    var open_tables = [];
    var handStrength = "";
    var pongTime = Math.floor(Date.now() / 1000) + 60;
    var hand_history_db_initialized = false;
    var pongTime2 = Math.floor(Date.now() / 1000) + 180;
    var statMap = {};
    var gameTick = 0;
    var apiKey = localStorage.getItem('apiKey');
    var evmapLoaded = false;
    var hhmap = {};
    //var sendMessageQueue = [];
    var entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    if(!apiKey || apiKey == "Paid") {
      apiKey = "unset";
      localStorage.setItem('apiKey', "unset");
    }

    /**
     * Websocket connection
     **/

    /**
     * Function: isWebsocketConnected()
     * Returns true if we are connected to the backend
     * Returns false if we are not
     **/
    function isWebsocketConnected() {
      return !!(window.ws && window.ws.readyState === WebSocket.OPEN);
    }

    /**
     * Function: connectWebsocket()
     * Connects to the backend and sets the handlers for messages.
     **/
    async function connectWebsocket(handshake = false) {
      window.ws = new WebSocket("wss://ws.blockchainpokerhud.com");
      window.ws.onmessage = function (event) {
        msgtypes = Object.keys(JSON.parse(event.data));
        for(msgtype of msgtypes) {
          switch(msgtype) {
            case '44':
              try {
                let chatEvent = JSON.parse(decipherString(JSON.parse(event["data"])["44"], wsToken));
                // If message is from self then don't display it again. Don't show when hudchat is turned off.
                // But do show the message when there is a message from the HUD author.
                if(chatEvent[0].from != escapeHTML(window.you.name) && (hudchat == "true" || chatEvent[0].from == "Superuser")) {
                  addToChat(chatEvent[0].from, chatEvent[0].message);
                }
              } catch(e) {
                // Do nothing on failed messages
              }
              break;
            case '150':
              handStrength = JSON.parse(event.data)["150"];
              if(typeof handStrength == "undefined") {
                handStrength = "Waiting";
              }
              break;
            case '499':
              // Received keepalive 'pong' message
              pongTime = Math.floor(Date.now() / 1000) + 60;
              pongTime2 = Math.floor(Date.now() / 1000) + 120;
              $(".seat").draggable();
              break;
            case '701':
              try {
                tableStats = JSON.parse(decipherString(JSON.parse(event["data"])["701"], wsToken));
                let tmpStatMap = {}
                for(stat of tableStats) {
                  if(typeof tmpStatMap[stat.id] == "undefined") {
                    tmpStatMap[stat.id] = [];
                  }
                  tmpStatMap[stat.id].push([stat.v, stat.i, stat.stats]);
                }
                statMap = tmpStatMap;
              } catch(e) {
                // Response was malformed
              }
              break;

            case '776':
              // Handshake error, close socket
              window.ws.close();
              wsToken = "";
              break;
            case '777':
              let token = JSON.parse(event.data)["777"];
              wsToken = token;
              $(".seat").draggable();
            default:
              break;
          }
        }
      }
      window.ws.onopen = function(event) {
        if(handshake == true) {
          sendHandshake();
        }
      }
      window.ws.onclose = function(){
        // Reconnect to the backend if we get disconnected
        setTimeout(function(){ connectWebsocket(true) }, 1000);
      };
    }

    /**
     * Function: sendPing()
     * Sends a 'ping' message to the backend.
     * The backend will respond with 'pong'.
     * This mechanism keeps the websocket alive.
     **/
    function sendPing() {
      if (isWebsocketConnected() == true) {
        command = {
          "action": "ping"
        };
        window.ws.send(JSON.stringify(command));
      }
    }

    function sendMessage(prefix, command) {
      cipher = cipherString(JSON.stringify(command), wsToken);
      command = {
        "action": "query",
        "query": cipherString(JSON.stringify(command), wsToken) 
      }
      if(window.ws.readyState == 1 && cipher) {
        window.ws.send(JSON.stringify(command));
      } else {
        if(cipher) {
          setTimeout(function() {
            sendMessage(prefix, command);
          }, 3000);
        }
      }
    }

    function escapeHTML (string) {
      return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
      });
    }

    /**
     * Function: sendHandshake()
     * Connect to the backend, send over the player ID and an MD5 hash of the deposit address
     * In theory this hash never changes. We will use this to prevent namefaking
     * by simulating websocket API calls. The backend will store the information
     * for the given ID and reject websocket communication if the hash differs
     * at a future point of time. Backend will return a token.
     **/
    function sendHandshake() {
      if (isWebsocketConnected() == true && window.you && window.you.id && window.you.affiliateKey && window.table.id && Number(window.you.id) > 0) {
        command = {
          "action": "handshake",
          "id": window.you.id,
          "name": window.you.name,
          "tid": window.table.id,
          "api_key": apiKey,
          "fingerprint": md5(window.you.id),
          "version": hud_version
        };
        try {
          window.ws.send(JSON.stringify(command));
        } catch(e) {
          setTimeout(function() {
            sendHandshake();
          }, 5000);
        }
      } else {
        setTimeout(function() {
          sendHandshake();
        }, 1000);
      }
    }

    // Send ping every 30 seconds
    setInterval(function(){
      sendPing();
    }, 30000)

    window.ws = false;
    connectWebsocket(true);

    /**
     * HUD Chat message sending
     **/
    (function() {
      var emit = socket.emit;
      socket.emit = function() {
        if(arguments[0] && arguments[0] == "sendChat") {
          message = arguments[1].message;
          let regex = /^\/\/\ (.*)/g;
          let regex2 = /^\/\/\/\ (.*)/g;
          let matches = Array.from(message.matchAll(regex));
          let matches2 = Array.from(message.matchAll(regex2));
          if(matches.length > 0) {
            let hud_msg = matches[0][1];
            command = {
              "action": "sendChat",
              "message": hud_msg
            }
            if(hudchat == "true") {
              sendMessage("42", command);
            } else {
              hud_msg = "HUD chat is turned off. You can turn it on in settings on your right."
            }
            let has_content = $(".log-contents").find(".md-dense").find(".log-item").last().html();
            if(typeof has_content !== "undefined") {
              addToChat(escapeHTML(window.you.name), escapeHTML(hud_msg));
            }
            else {
              $(".waithtml").fadeIn().delay(2000).fadeOut();
            }
            return;
          } else if(matches2.length > 0) {
            let hud_msg = matches2[0][1];
            command = {
              "action": "sendChat",
              "message": hud_msg,
              "tid": window.table.id.toString()
            }
            if(hudchat == "true") {
              sendMessage("42", command);
            } else {
              hud_msg = "HUD chat is turned off. You can turn it on in settings on your right."
            }
            let has_content = $(".log-contents").find(".md-dense").find(".log-item").last().html();
            if(typeof has_content !== "undefined") {
              addToChat(escapeHTML(window.you.name), escapeHTML(hud_msg) + " [Table only]");
            }
            else {
              $(".waithtml").fadeIn().delay(2000).fadeOut();
            }
            return;
          }
        }
        emit.apply(socket, arguments);
      };
      var $emit = socket.$emit;
      socket.$emit = function() {
        $emit.apply(socket, arguments);
      };
    })();

    /**
     * Pure javascript MD5 implementation
     * Taken from https://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript
     **/
    function md5(inputString) {
        var hc="0123456789abcdef";
        function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
        function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
        function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
        function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
        function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
        function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
        function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
        function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
        function sb(x) {
            var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
            for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
            blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
        }
        var i,x=sb(inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
        for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
            a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
            b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
            c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
            d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
            a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
            b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
            c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
            d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
            a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
            b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
            c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
            d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
            a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
            b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
            c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
            d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
            a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
            b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
            c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
            d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
            a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
            b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
        }
        return rh(a)+rh(b)+rh(c)+rh(d);
    }

    function ubtoa(str) {
      return btoa(unescape(encodeURIComponent(str)).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
      }))
    }

    function uatob(str) {
      return decodeURIComponent(Array.prototype.map.call(decodeURIComponent(escape(atob(str))), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
    }

    function cipherString(text, salt) {
      if(text && salt) {
        text = ubtoa(text);
        if(text) {
          const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
          const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
          const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

          return text.split("").map(textToChars).map(applySaltToChar).map(byteHex).join("");
        }
      }
    }

    function decipherString(encoded, salt) {
      const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
      const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
      return uatob(encoded.match(/.{1,2}/g).map((hex) => parseInt(hex, 16)).map(applySaltToChar).map((charCode) => String.fromCharCode(charCode)).join("").toString("utf8"));
    }

    /**
     * Hand history database
     **/

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    var hand_history_db = "";
    var jszip_initialized = false;
    var downloading_hh = false;

    var DBOpenRequest = indexedDB.open("handhistorydb", 4);

    DBOpenRequest.onsuccess = function() {
      hand_history_db_initialized = true;
      hand_history_db = DBOpenRequest.result;
    };

    DBOpenRequest.onerror = function(e) {
      console.log("Error: " + e);
    };

    DBOpenRequest.onupgradeneeded = function(event) {
      let db = event.target.result;
      db.onerror = function(event) {
        console.log("Error opening the hand history database");
      };
      let objectStore = db.createObjectStore("handhistorydb", { keyPath: "id" });
      objectStore.createIndex("hand", "hand", { unique: false });
      console.log("Created hand history schema");
    }

    /**
     * Game state scraper
     **/
    var elmMap = {}
    var tableStats = {}
    var chat_players = [];
    var checked_profile = {};
    var namefakers = [];
    var newbie_threshold = (86400*7);
    var namefaker_chars = [
      "\u2060",
      "\u2061",
      "\u2062",
      "\u2063",
      "\u2064",
      "\u2066",
      "\u2067",
      "\u2068",
      "\u2069",
      "\u206A",
      "\u206B",
      "\u206C",
      "\u206D",
      "\u206E",
      "\u206F",
      "\u200B",
      "\u200C",
      "\u200D",
      "\u200E",
      "\u200F",
      "\u061C",
      "\uFEFF"
    ]

    var hand_state = {
      currentBet: 0,
      dealer: 0,
      handId: 0,
      minBet: 0,
      seats: [],
      table: 0
    };

    function processHandStartEvent(e) {
      hand_state = e;
    }

    function suitToLetter(suit) {
      switch(suit) {
        case "DIAMONDS":
          return("d");
          break;
        case "HEARTS":
          return("h");
          break;
        case "CLUBS":
          return("c");
          break;
        case "SPADES":
          return("s");
          break;
      }
    }

    function cardsToSymbols(cards) {
      let holecards = cards.match(/.{1,2}/g);
      let display = [];
      for(holecard of holecards) {
        let rank = holecard[0];
        let suit = holecard[1];
        switch(suit) {
          case "h":
            suit = "<font color='#FF756D'>♥</font>";
            break;
          case "d":
            suit = "<font color='#6891C3'>♦</font>";
            break;
          case "c":
            suit = "<font color='#85DE77'>♣</font>";
            break;
          case "s":
            suit = "<font color='#606060'>♠</font>";
            break;
        }
        display.push(rank + suit);
      }
      return(display.join(""));
    }

    function eventCardsToHand(e) {
      let cards = [];
      for(card of e.cards) {
        let rank = card.rank;
        let suit = suitToLetter(card.suit);
        cards.push(rank + suit);
      }
      return(cards.join(""));
    }

    function processRiverEvent(e) {
      riverCards = eventCardsToHand(e);
      riverCardsDisplay = cardsToSymbols(riverCards);
      getStreetHandStrength();
    }

    function processTurnEvent(e) {
      turnCards = eventCardsToHand(e);
      turnCardsDisplay = cardsToSymbols(turnCards);
      getStreetHandStrength();
    }

    function processFlopEvent(e) {
      let cards = [];
      flopCards = eventCardsToHand(e);
      flopCardsDisplay = cardsToSymbols(flopCards);
      getStreetHandStrength();
    }

    function processPreflopEvent(e) {
      preflopCards = eventCardsToHand(e);
      preflopCardsDisplay = cardsToSymbols(preflopCards);
      getStreetHandStrength();
    }

    function processHandEndEvent(e) {
      // On hand end reset our variables
      preflopCards = "";
      preflopCardsDisplay = "";
      flopCards = "";
      flopCardsDisplay = "";
      turnCards = "";
      turnCardsDisplay = "";
      riverCards = "";
      riverCardsDisplay = "";
      handStrength = "";

      // Store hand history
      /*
      let command = {
        "action": "submitHandHistory",
        "handhistory": JSON.stringify(e)
      }
      sendMessage("555", command);
      */
    }

    function getStreetHandStrength() {
      if(preflopCards) {
        command = {
          "action": "getHandStrength",
          "evaluate": [preflopCards, flopCards, turnCards, riverCards].filter(function(x) { return x != ""}).join("")
        };
        sendMessage("200", command);
      }
    }

    function keepAlive() {
      command = {
        "action": "keepAlive"
      };
      sendMessage("201", command);
    }

    function getUpdate() {
      let alen = apiKey.length;
      if(alen >= 10) {
        command = {
          "action": "getUpdate"
        }
        sendMessage("255", command);
      }
    }

    function processTopChipEarners(e) {
      //console.log(e);
    }

    function processPlayerProfileEvent(e) {
      //console.log(e);
      /*
        {
          "id": 12345,
          "name": "someName940",
          "level": 13,
          "xp": 24977,
          "createdAt": "2021-07-14T17:38:30.898Z",
          "preferredCurrency": "BCH",
          "handsPlayed": 8257,
          "theme": "felt",
          "tournamentsHosted": 0
        }
      */
    }

    function addToChat(from, message, skip_prefix = false) {
      let has_content = $(".log-contents").find(".md-dense").find(".log-item").last().html();
      let prefix = "[<font color=\"red\"><b>HUD</b></font>] ";
      if(skip_prefix == true) {
        prefix = "";
      }
      if(typeof has_content !== "undefined") {
        $(".log-contents").find(".md-dense").find(".log-item").last().append('<md-list-item class="log-item chat layout-column" ng-repeat="log in logs" layout="column" role="listitem" style=""><div ng-if="::log.type === \'chat\'" layout="column" layout-align="start start" class="ng-scope layout-align-start-start layout-column"><!-- ngIf: ::log.player --><button class="logged-player md-button ng-scope md-dance-theme md-ink-ripple" type="button" ng-transclude="" ng-if="::log.player">' + prefix + from + '</button><!-- end ngIf: ::log.player --><div class="md-body-2 ng-binding">' + message + '</div></div><div class="md-secondary-container"></div></md-list-item>' + "\n" + '<!-- end ngRepeat: log in logs -->');
      }
    }

    function processChatEvent(e) {
      if(typeof e.player !== "undefined") {
        let check_name = e.player.split("");
        for(uc of namefaker_chars) {
          if(check_name.includes(uc)) {
            if(!namefakers.includes(e.player)) {
              namefakers.push(e.player);
            }
            $("button:contains('" + e.player + "')").each(function() {
              if ($(this).hasClass('logged-player')) {
                let checked_name = $(this).html();
                if(checked_name == e.player) {
                  $(this).html(e.player + " <font color='orange'><b>&#9888;</b></font> (NAMEFAKER)");
                }
              }
            });
          }
        }
        let msg = e.message;
        $("button:contains('" + e.player + "')").each(function() {
          if(!chat_players.includes(e.player)) {
            chat_players.push(e.player);
          } else {
            if(typeof checked_profile[e.player] !== "undefined") {
              let creation_ts = checked_profile[e.player];
              let now_time = Math.floor(Date.now() / 1000);
              if(now_time - creation_ts < newbie_threshold) {
                $("button:contains('" + e.player + "')").each(function() {
                  if ($(this).hasClass('logged-player')) {
                    let checked_name = $(this).html();
                    if(checked_name == e.player) {
                      $(this).html(e.player + " <font color='yellow'><b>&#9888;</b></font> (NEWBIE)");
                    }
                  }
                });
              }
            }
          }
        });

        let regex = /https\:\/\/blockchain\.poker\/\#\/\?table=(.*)/g;
        let matches = Array.from(msg.matchAll(regex));
        if(matches.length > 0) {
          let table_id = matches[0][1];
          $("span:contains('Join Table')").each(function() { join_button = $(this).parent(); $(join_button).replaceWith("<span class='tabtable' id='" + table_id + "' style='cursor: pointer; color: #fff;'>JOIN TABLE</span>") });
        }
      }
    }

    /**
     * Socket listeners to receive and process game state notifications
     **/
    socket.addListener("chat", processChatEvent);
    socket.addListener("handStart", processHandStartEvent);
    socket.addListener("holeCards", processPreflopEvent);
    socket.addListener("handEnd", processHandEndEvent);
    socket.addListener("flop", processFlopEvent);
    socket.addListener("turn", processTurnEvent);
    socket.addListener("river", processRiverEvent);
    //socket.addListener("topChipEarners", processTopChipEarners());
    //socket.addListener("id", processPlayerProfileEvent());

    /**
     * If the HUD is already loaded, do not load it a second time
     **/
    if(BlockchainPokerHUDLoaded == true) {
      console.log("* HUD is already loaded.");
      return false;
    }

    /**
     * I forgot why I wrote the below. Not sure if it even does anything.
     **/
    if(document.location.href.indexOf('blockchain.poker') == -1) {
      $.ajax("https://blockchain.poker/", {
        success: function(response) {
          $("html").html(response);
        }
      });
    }

    var isMobile = window.matchMedia("only screen and (max-width: 812px)").matches;
    var showsettings = false;

    // This array holds a list of userIds that requested access to beta features
    // that aren't stable yet.
    var beta_users = [
      852661,
      734148,
      586481
    ];

    /**
     * This array is reserved for clients that are misbehaving and spamming the API.
     * If you're in this list, contact me to analyse the problem.
     */
    var banned_users = [
    ];

    var prev_tid = "";

    let hud_css = `
      <style>
        .tooltip {
          position: relative;
          display: inline-block;
          z-index: 1000;
          border-bottom: 1px dotted black;
        }

        .tooltip .tooltiptext {
          visibility: hidden;
          width: 120px;
          background-color: 
        fff;
          color: 
        000;
          text-align: center;
          border-radius: 6px;
          padding: 5px 0;
          position: absolute;
          z-index: 1000;
          bottom: 125%;
          left: 50%;
          margin-left: -60px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .tooltip .tooltiptext::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: 
        555 transparent transparent transparent;
        }

        .tooltip:hover .tooltiptext {
          visibility: visible;
          background: #fff;
          color: #000;
          opacity: 1;
        }
        .badgehud {
          position: absolute;
          width: 3em;
          min-width: 3em;
          height: 2.0em;
          min-height: 2.0em;
          padding: 0;
          border-radius: 5px;
          bottom: -2.2em;
          right: 11.5em;
          font-size: 0.6em;
        }
        .licenseline {
          display: none;
        }
        @keyframes opacity {
          0% {
            opacity: 1;
          }

          50% {
            opacity: 0.5;
          }

          100% {
            opacity: 0;
          }
        }
        #Notifications {
          position: fixed;
          right: 0;
          top: 0;
        } div.Notification {
          display: table;
          min-width: 250px;
          box-shadow: 0 0 3px black;
        } div.Notification div.Content {
          padding: 3px;
          margin-left: 70px;
          margin-right: 10px;
        } div.Notification h1 {
          padding: 0;
          margin: 0;
        } div.Notification.good {
          background-color: #abffcd;
        } div.Notification.warning {
          background-color: #ffc693;
        } div.Notification.error {
          background-color: #ff9593;
        } div.Notification div.ProgressDiv {

        } div.Notification div.Image {
          width: 60px;
          height: 60px;
          float: left;
          background-size: cover;
        } div.Notification div.ProgressDiv div {
          height: 3px;
          width: 0%;
          box-shadow: 0 0 1px black;
        } div.Notification.good div.Content {
          color: #009e0a;
        } div.Notification.warning div.Content {
          color: #c55c00;
        } div.Notification.error div.Content {
          color: #b30300;
        } div.Notification.good div.ProgressDiv div {
          background-color: #009e0a;
        } div.Notification.warning div.ProgressDiv div {
          background-color: #c55c00;
        } div.Notification.error div.ProgressDiv div {
          background-color: #b30300;
        }
      </style>
    `;
    $("head").append(hud_css);
    let css_desktop = `
      <link rel="stylesheet" type="text/css" href="https://rainbowflop.com/jquery-ui.css" media=”screen” />
    `;

    if(!isMobile) {
      $("head").append(css_desktop);
      //$(".table-container").draggable();
      let scale = 1.0;
      /*
      $('.table-container').css({
        '-webkit-transform' : 'scale(' + scale + ')',
        '-moz-transform' : 'scale(' + scale + ')',
        '-ms-transform' : 'scale(' + scale + ')',
        '-o-transform' : 'scale(' + scale + ')',
        'transform' : 'scale(' + scale + ')'
      });
      */
    }

    let wait_html = [
      "<div class='waithtml' style='display:none; opacity: 0.8; background: #000; width: 25%; height: 25%; z-index: 1000; top: 25%; left: 25%; position: fixed; border: 1px solid #fff; padding: 5px;'>",
      "<p>Please wait until there is at least one message in chat.</p>",
      "</div>"
    ].join("\n");

    let license_html = [
      "<div class='licensekeydialogue' style='display:none; opacity: 0.8; background: #000; width: 50%; height: 50%; z-index: 1000; top: 25%; left: 25%; position: fixed; border: 1px solid #fff; padding: 5px;'>",
      "<p>Enter your license key and press save. If you don't have a license key press Cancel.</p>",
      "<input type='password' name='licensekey' id='licensekey' value='" + apiKey + "'>",
      "<button class='licensesave'>Save</button>",
      "<button class='licensecancel'>Cancel</button>",
      "</div>",
    ].join("\n");
    $("body").append(license_html);
    $("body").append(wait_html);

    $(".licensecancel").on('click', function() {
      $(".licensekeydialogue").toggle();
    });

    $(".licensesave").on('click', function() {
      licensekey = $("#licensekey").val();
      localStorage.setItem('apiKey', licensekey);
      apiKey = licensekey;
      $(".licensekeydialogue").fadeOut();
    });

    var i_am_seated = false;
    var someone_else_is_seated = false;
    var seaters = 0;
    var rewards_balance = 0;
    var minutetick = 0;
    var topEarners = [];
    var player_notes = {};
    var tournament_tables;
    var transaction_history;
    var seatsniper = false;
    var showcashgames;
    var showtournaments;
    var showlosers;
    var showwinners;
    var showtoggles;
    var lastIdle = 0;
    var totalIdle = Math.floor(Date.now() / 1000);

    function loadDependency(script) {
      (function() {
        function callback() {
          // console.log("Loading dependencies")
        }
        var s=document.createElement("script");
        s.src="https://rainbowflop.com/" + script;
        if(s.addEventListener) {
          s.addEventListener("load",callback,false)
        } else if(s.readyState) {
          s.onreadystatechange=callback
        }
        document.body.appendChild(s);
      })();
    }

    function loadSentry() {
      (function() {
        function callback() {
        }
        var s=document.createElement("script");
        s.src="https://js.sentry-cdn.com/ceccd630b8ba40cabfe64ac1b30b3bbb.min.js";
        s.crossorigin="anonymous";
        if(s.addEventListener) {
          s.addEventListener("load",callback,false)
        } else if(s.readyState) {
          s.onreadystatechange=callback
        }
        document.body.appendChild(s);
      })();
    }

    function loadJSZip() {
      (function() {
        function callback() {
        }
        var s=document.createElement("script");
        s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js";
        if(s.addEventListener) {
          s.addEventListener("load",callback,false)
        } else if(s.readyState) {
          s.onreadystatechange=callback
        }
        document.body.appendChild(s);
      })();
    }

    function loadDependencies() {
      for(script of [
        "icons.js",
        "handhistory.js",
        "evmap.js"
      ]) {
        loadSentry();
        loadDependency(script);
        loadJSZip();
      }
    }

    function setWithExpiry(key, value, ttl) {
      const now = new Date()
      let epoch = Math.floor(Date.now() / 1000);

      const item = {
        value: value,
        expiry: epoch + ttl,
      }
      elmMap[key] = JSON.stringify(item);
    }

    function getWithExpiry(key) {
      const itemStr = elmMap[key]
      let epoch = Math.floor(Date.now() / 1000);
      if (!itemStr) {
        return null
      }
      const item = JSON.parse(itemStr)
      const now = new Date()
      if (epoch > item.expiry) {
        delete elmMap[key];
        return null
      }
      return item.value
    }

    function loadHUD() {
      (function(){function callback(){console.log("Loading Blockchain Poker HUD")}var s=document.createElement("script");s.src="https://rainbowflop.com/hud.js";if(s.addEventListener){s.addEventListener("load",callback,false)}else if(s.readyState){s.onreadystatechange=callback}document.body.appendChild(s);})();
    }

    function popOut(table_id) {
      let myExternalWindow = window.open("https://blockchain.poker/#/?table=" + table_id, "pokerhud_table_" + table_id, "resizable");
      myExternalWindow.resizeTo(800,600);
      let theDoc = myExternalWindow.document;
      let theScript = myExternalWindow.document.createElement('script');
      theScript.innerHTML = 'window.onload = ' + loadHUD.toString() + ';';
      theDoc.body.appendChild(theScript);
    }

    function newTab(table_id) {
      let myTabWindow = window.open("https://blockchain.poker/#/?table=" + table_id, "pokerhud_table_" + table_id);
      let theDoc = myTabWindow.document;
      let theScript = myTabWindow.document.createElement('script');
      theScript.innerHTML = 'window.onload = ' + loadHUD.toString() + ';';
      theDoc.body.appendChild(theScript);
    }

    function getCallAmount() {
      var call_button = $("button[aria-label='Call']");
      var call2_button = $("button[aria-label='Call Current Bet']");
      if($(call_button).is(":visible") || $(call2_button).is(":visible")) {
        call_amount = -1;
        if($(call_button).is(":visible")) {
          call_amount = contentToNumber($(call_button).find(".ng-binding").html());
        } else if ($(call2_button).is(":visible")) {
          call_amount = contentToNumber($(call_button).find(".ng-binding").html());
        }
        return call_amount;
      }
    }
    
    function grabSeat(table_id) {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      $(seats).each(function(index) {
        villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
        if(typeof villain_name == "undefined" && seatsniper == true) {
          seatsniper = false;
          socket.emit("sit", { table: table_id, index: index }, function(y) {
            seatsniper = false;
          });
        }
      });
    }

    /**
     * Handle return messages
     **/
    // TODO: find out (console.log) which cases are being used still
    // Replace with events
    window.addEventListener('message', function(event) {
      if(event.origin !== 'https://blockchain.poker') return;
      let response = event.data;
      if(typeof response["type"] !== "undefined") {
        switch(response["type"]) {
          case "getHistoryResponse":
            hand_history = response["payload"];
            hand_id = response["hand_id"];
            hc = response["hc"];
            result = JSON.stringify(parseHistory(hand_history, hand_id, hc));
            addToHistory(result, hand_id);
            break;
          case "getTableStateResponse":
            table_state = response["payload"];
            break;
          case "getYouStateResponse":
            you_state = response["payload"];
            break;
        }
      }
      return;
    }, false);

    /**
     * EventListener for requesting and processing results
     */
    // TODO: find out (console.log) which cases are being used still
    // Replace with events
    window.addEventListener('message', function(event) {
      data = event.data;
      if(event.origin !== 'https://blockchain.poker') return;
      switch(data.type) {
        case "getTableStateResponse":
          table_state = data["payload"];
          break;
        case "getHistoryResponse":
          // Redundant
          // hand_history = data["payload"];
          // hand_id = data["hand_id"];
          // result = JSON.stringify(parseHistory(hand_history));
          // addToHistory(result, hand_id);
          break;
        case "getYouStateResponse":
          you_state = data["payload"];
          break;
        case "history_id":
          hand_id = data.text;
          socket.emit("getHistory", { hand: hand_id }, function(x) {
            hc = getHoleCards();
            event.source.postMessage({
              "type": "getHistoryResponse",
              "payload": x,
              "hand_id": hand_id,
              "hc": hc
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
          let current_ts = Math.floor(Date.now() / 1000);
          if(current_ts - totalIdle < 2700) {
            if(current_ts - lastIdle > 200) {
              socket.emit("sitIn", { table: table_id }, function(x) {
                socket.emit("sitOut", { table: table_id }, function(y) {
                  lastIdle = Math.floor(Date.now() / 1000);
                });
              });
            }
          }
          break;
      }
    });

    /**
     * Icons we use to categorize player styles based on their stats
     **/
    var clown_icon = '&#129313;';
    var fish_icon = '&#128031;';
    var king_icon = '&#9812;';
    var maniac_icon = '&#128544;';
    var newbie_icon = '&#128118;';
    var shark_icon = '&#129416;';
    var rainbow_icon = '&#127752;';
    var robot_icon = '&#129302;';
    var turtle_icon = '&#128034;';
    var earner_icon = '&#127942;';

    // Note icon to show when we have a note on a player
    var note_icon = '&#128206;';

    loadDependencies();

    var autotopup = localStorage.getItem('autotopup');
    if(autotopup == null) {
      autotopup = "false";
    }

    var showcashgames = localStorage.getItem('showcashgames');
    if(showcashgames == null) {
      showcashgames = "true";
    }

    var showlosers = localStorage.getItem('showlosers');
    if(showlosers == null) {
      showlosers = "false";
    }

    var showwinners = localStorage.getItem('showwinners');
    if(showwinners == null) {
      showwinners = "false";
    }

    var showtournaments = localStorage.getItem('showtournaments');
    if(showtournaments == null) {
      showtournaments = "false";
    }

    var showtoggles = localStorage.getItem('showtoggles');
    if(showtoggles == null) {
      showtoggles = "true";
    }

    var mini_stats = localStorage.getItem("ministats");
    if(mini_stats == null) {
      mini_stats = "false"
    }

    /**
     * Play an alarm when a player sits at your heads up table
     * Disabled by default.
     **/
    var hualarm = localStorage.getItem('hualarm');
    if(hualarm == null) {
      hualarm = "false";
    }
    
    var hudchat = localStorage.getItem("hudchat");
    if(hudchat == null) {
      hudchat = "true";
      localStorage.setItem("hudchat", "true");
    }

    // Some people don't like to know they're terrible.
    // Make showing your own icon optional
    var showtruth = localStorage.getItem('showtruth');
    if(showtruth == null) {
      showtruth = "true";
    }

    var autotopupstr;
    var hualarmstr;
    var showtruthstr;
    var snipestr;
    var hudchatstr;
    var showcashgamesstr;
    var showtournamentsstr;
    var showloserstr;
    var showwinnerstr;
    var showtogglesstr;
    var showcashgamesstyle;
    var showtournamentsstyle;
    var showtogglesstyle;

    var betting_action = [];
    var hand_history = [];
    var hand_history_map = {};
    var hand_rank = [];
    var hand_strength = "undefined";
    var high_bet = 0;
    var last_round = "";
    open_tables = [];
    var played_hand = [];
    var player_notes = {};
    var processed_hand = [];
    var table_state = {};
    var rewards_balance = 0;
    var top_earners = [];
    var tournament_tables = [];
    var transaction_history = [];
    var villain_alias_map = [];
    var villain_bbd_hp_map = [];
    var villain_bbd_map = [];
    var villain_cb_hp_map = [];
    var villain_cb_map = [];
    var villain_ev_map = [];
    var villain_aev_map = [];
    var villain_bb100_map = [];
    var villain_street_map = [];
    var villain_is_weekly_map = [];
    var villain_hp_map = [];
    var villain_pfr_map = [];
    var villain_vpip_map = [];
    var villain_tsd_map = [];
    var villain_bet3_map = [];
    var villain_wwsf_map = [];
    var villain_wsd_map = [];
    var villain_wsd_map = [];
    var villain_af_map = [];
    var villain_ftcb_map = [];
    var villain_profit_map = {};
    var villain_profit = {};
    var highscores = {};
    var you_state = {};
    var last_hand_id = 0;

    function getRandomNumber(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function aevToRange(ev) {
      let range = [];
      for(thand in ev_map) {
        if(ev_map[thand] >= ev) {
          range.push(thand);
        }
      }
      return(range.join(", "));
    }

    // Taken from https://gist.github.com/soyuka/6183947
    function HTMLToBBCode(html) {
      html = html.replace(/<pre(.*?)>(.*?)<\/pre>/gmi, "[code]$2[/code]");
      html = html.replace(/<h[1-7](.*?)>(.*?)<\/h[1-7]>/, "\n[h]$2[/h]\n");
      html = html.replace(/<br(.*?)>/gi, "\r\n");
      html = html.replace(/<textarea(.*?)>(.*?)<\/textarea>/gmi, "\[code]$2\[\/code]");
      html = html.replace(/<b>/gi, "[b]");
      html = html.replace(/<i>/gi, "[i]");
      html = html.replace(/<u>/gi, "[u]");
      html = html.replace(/<\/b>/gi, "[/b]");
      html = html.replace(/<\/i>/gi, "[/i]");
      html = html.replace(/<\/u>/gi, "[/u]");
      html = html.replace(/<em>/gi, "[b]");
      html = html.replace(/<\/em>/gi, "[/b]");
      html = html.replace(/<strong>/gi, "[b]");
      html = html.replace(/<\/strong>/gi, "[/b]");
      html = html.replace(/<cite>/gi, "[i]");
      html = html.replace(/<\/cite>/gi, "[/i]");
      html = html.replace(/<font color="(.*?)">(.*?)<\/font>/gmi, "[color=$1]$2[/color]");
      html = html.replace(/<font color='(.*?)'>(.*?)<\/font>/gmi, "[color=$1]$2[/color]");
      html = html.replace(/<font color=(.*?)>(.*?)<\/font>/gmi, "[color=$1]$2[/color]");
      html = html.replace(/<link(.*?)>/gi, "");
      html = html.replace(/<li(.*?)>(.*?)<\/li>/gi, "[*]$2");
      html = html.replace(/<ul(.*?)>/gi, "[list]");
      html = html.replace(/<\/ul>/gi, "[/list]");
      html = html.replace(/<div>/gi, "\n");
      html = html.replace(/<\/div>/gi, "\n");
      html = html.replace(/<td(.*?)>/gi, " ");
      html = html.replace(/<tr(.*?)>/gi, "\n");
      html = html.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, "[img]$2[/img]");
      html = html.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, "[url=$2]$4[/url]");
      html = html.replace(/<head>(.*?)<\/head>/gmi, "");
      html = html.replace(/<object>(.*?)<\/object>/gmi, "");
      html = html.replace(/<script(.*?)>(.*?)<\/script>/gmi, "");
      html = html.replace(/<style(.*?)>(.*?)<\/style>/gmi, "");
      html = html.replace(/<title>(.*?)<\/title>/gmi, "");
      html = html.replace(/<!--(.*?)-->/gmi, "\n");
      html = html.replace(/\/\//gi, "/");
      html = html.replace(/http:\//gi, "http://");
      html = html.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gmi, "");
      html = html.replace(/\r\r/gi, ""); 
      html = html.replace(/\[img]\//gi, "[img]");
      html = html.replace(/\[url=\//gi, "[url=");
      html = html.replace(/(\S)\n/gi, "$1 ");
      return html;
    }

    function colorizeHandHistoryCards(cards) {
      let received = cards.split("[");
      let all_cards = [];
      for(cardStr of received) {
        if(!cardStr) {
          continue;
        }
        cardStr = cardStr.replace("]", "");
        let this_cards = [];
        for(card of cardStr.split(" ")) {
          if(!card) {
            continue;
          }
          let tmp = card.split("");
          let rank = tmp[0];
          let suit = tmp[1];
          switch(suit) {
            case "h":
              suit = "<font color='#FF756D'>♥</font>";
              break;
            case "d":
              suit = "<font color='#FF756D'>♦</font>";
              break;
            case "c":
              suit = "<font color='#606060'>♣</font>";
              break;
            case "s":
              suit = "<font color='#606060'>♠</font>";
              break;
          }
          this_cards.push(suit.replace(">", ">" + rank));
        }
        all_cards.push("[<b>" + this_cards.join(" ") + "</b>]");
      }
      return(all_cards.join(" "));
    }

    function colorizeHandHistory(input) {
      let lines = [];
      for(line of input.split("\n")) {
        line = line.replace(/(Blockchain\ Poker\ Hand\ )([^\:]*)\:(.*)/, '$1<b>$2</b>$3');
        line = line.replace(/^(Table\ \')([^\']*)([^\:]*)(\')(.*)/, '$1<b>$2</b>$3$4$5');
          line = line.replace(/^(Review the hand online at:\ )(.*)/, '$1<a href="$2" target="_new">$2</a>');
          line = line.replace(/^(Generated with\ )(Blockchain Poker HUD)(\ )(.*)/, '$1<b>$2</b>$3<a href="$4" target="_blank">$4</a>');
          line = line.replace(/^(FLOP:|TURN:|RIVER:)$/, '<b>$1</b>');
          line = line.replace(/\[([^]*)\]/g, (match, $1) => {
            return(colorizeHandHistoryCards(match));
          });
        lines.push(line);
      }
      return(lines.join("<br />"));
    }

    $(document).on('click', '.viewhandhistory', function (e) {
      let handId = $(this).data("handid");
      let tab = window.open('about:blank', '_hand' + handId);
      let htmlCode = "<pre>" + colorizeHandHistory(hhmap[handId]) + "</pre>";
      let bbCode = HTMLToBBCode(colorizeHandHistory(hhmap[handId]));
      let html = '<html><head><title>Blockchain Poker Hand number ' + handId + '</title></head><body>' + htmlCode + '<hr /><b><u>BBCode:</u></b><br /><textarea style="width: 100%; height: 100%;">' + bbCode + ' </textarea></body>';
      tab.document.write(html);
      tab.document.close(); // to finish loading the page
    });

    /**
     * Parse the returned Hand History
     **/
    function parseHistory(history, handId, hc) {
      if(typeof convertHand !== "undefined" && window.you.isSeated == true && hc[3]) {
        if(hand_history_db_initialized == true) {
          let transaction = hand_history_db.transaction(["handhistorydb"], "readwrite");
          transaction.onerror = function() {
            console.log("Could not commit hand history to IndexedDB");
          };
          let objectStore = transaction.objectStore("handhistorydb");
          let res = convertHand(history, handId, hc);
          hhmap[handId] = res;
          addToChat("", "<center><div ng-if=\"::log.link &amp;&amp; log.type !== 'user-link'\" layout=\"row\" layout-align=\"center center\" class=\"viewhandhistory ng-scope layout-align-center-center layout-row\" data-handId='" + handId + "'><span class=\"log-button md-button md-dance-theme md-ink-ripple\" ng-transclude=\"\" data-handId='" + handId + "'>Plain Text Hand History<div class=\"md-ripple-container\" style=\"\"></div></a></div></center>", true);
          let objectStoreRequest = objectStore.add({id: handId, hand: res});
          objectStoreRequest.onsuccess = function(event) {
            // success! console.log("Commited hand.");
          };
        }
      } else {
        if(typeof convertHand !== "undefined") {
          let res = convertHand(history, handId, hc);
          hhmap[handId] = res;
          addToChat("", "<center><div ng-if=\"::log.link &amp;&amp; log.type !== 'user-link'\" layout=\"row\" layout-align=\"center center\" class=\"viewhandhistory ng-scope layout-align-center-center layout-row\" data-handId='" + handId + "'><span class=\"log-button md-button md-dance-theme md-ink-ripple\" ng-transclude=\"\" data-handId='" + handId + "'>Plain Text Hand History<div class=\"md-ripple-container\" style=\"\"></div></a></div></center>", true);
        }
      }
      // Determine until which street this hand was played
      let last_round = 0;
      let round_map = {}
      for(const[i, round] of history["rounds"].entries()) {
        last_round = i;
        round_map[i] = Date.parse(round.time);
      }

      let pfr_players = [];
      let raise_highscore = 0;
      let num_raises = 0;
      let aggressor_player = "";
      let action_map = {};
      let vpip = [];
      let in_hand = [];
      let bb_player = "";
      let sb_player = "";
      let btn_player = "";
      let bb_def = false;
      let showdowns = [];
      let cbet_player = "";
      let prev_bet_in = false;
      let id_list = {};
      let sd_players = [];
      let river_players = [];
      let f_river_players = [];
      let bet3_players = [];
      let handnumber = history["key"];

      for (action of history["seats"]) {
        let seat = action.index;
        let name = action.name;
        let amount = action.amount;
        let account = action.account;
        let rounds = action.rounds;

        let money_won = action.winnings - action.potContributions - action.rakeTaken;
        if(money_won != 0) {
          let big_blind_amount = history["blinds"].big;
          let blinds_won = (money_won / big_blind_amount).toFixed(2);
          villain_profit[action.account] = blinds_won;
        }

        id_list[name] = account.toString();
        for(seat_action of action["actions"]) {
          action_map[Date.parse(seat_action.time)] = {
            type: seat_action.type,
            name: action.name,
            winnings: action.winnings,
            cards: action.cards,
            amount: seat_action.amount,
            isBigBlind: action.isBigBlind,
            isSmallBlind: action.isSmallBlind,
            isDealer: action.isDealer
          }
        }
      }

      var action_keys = [];
      for(k in action_map) {
        action_keys.push(k);
      }

      action_keys = action_keys.sort();

      action_keys.forEach(function(k) {
        let actions = action_map[k];
        let ts = k;
        let preflop = round_map[0];
        let flop = round_map[1];
        let turn = round_map[2];
        let river = round_map[3];
        let street = "";
        if(typeof river !== "undefined" && ts > river) {
          street = "river";
          if(!river_players.includes(actions.name)) {
            river_players.push(actions.name);
          }
          if(actions.type == "FOLD") {
            f_river_players.push(actions.name);
          }
        } else if(typeof turn !== "undefined" && ts > turn) {
          street = "turn";
        } else if(typeof flop !== "undefined" && ts > flop) {
          street = "flop";
          if(actions.type == "RAISE") {
            if(actions.name !== aggressor_player) {
              prev_bet_in = true;
            }
            if(prev_bet_in == false && actions.name == aggressor_player) {
              cbet_player = actions.name;
            }
          }
        } else if(typeof preflop !== "undefined" && ts > preflop) {
          street = "preflop";
          /**
           * Determine vpip players
           **/

          if(actions.type == "CALL" || actions.type == "RAISE" || actions.type == "BET") {
            if(!vpip.includes(actions.name)) {
              vpip.push(actions.name);
            }
            if(actions.type == "CALL" && actions.isBigBlind == true) {
              bb_def == true;
            }
          }
          if(actions.type == "RAISE") {
            /**
             * Determine preflop raisers
             **/

            num_raises += 1;

            // Detect 3-bet (reraise after initial raise), exclude shoves
            if(num_raises == 2 && raise_highscore > 0 && actions.amount >= (raise_highscore * 2) && actions.amount <= (raise_highscore * 10)) {
              bet3_players.push(actions.name);
            }
            if(actions.amount > raise_highscore) {
              raise_highscore = actions.amount;
            }
            if(!pfr_players.includes(actions.name)) {
              pfr_players.push(actions.name);
            }
            // Determine preflop aggressor. This is always the last raiser
            aggressor_player = actions.name
          }
          // Add all players to in_hand
          if(["FOLD", "CALL", "CHECK", "RAISE", "POST_BLIND"].includes(actions.type)) {
            if(!in_hand.includes(actions.name)) {
              in_hand.push(actions.name);
            }
          }

          // Determine positions
          if(actions.isBigBlind == true) {
            bb_player = actions.name;
          }
          if(actions.isSmallBlind == true) {
            sb_player = actions.name;
          }
          if(actions.isDealer == true) {
            btn_player = actions.name;
          }

        } else if(typeof preflop !== "undefined" && ts <= preflop) {
          street = "blindpost";
        }

        let end_street = 0;
        switch(street) {
          case "preflop":
            end_street = 0;
            break;
          case "flop":
            end_street = 1;
            break;
          case "turn":
            end_street = 2;
            break;
          case "river":
            end_street = 3;
            break;
        }
        if(end_street == last_round) {
          let villain_name = actions.name;
          let villain_pos = "unknown";
          if(actions.isBigBlind == true) {
            villain_pos = "bb";
          } else if(actions.isSmallBlind == true) {
            villain_pos = "sb";
          } else if(actions.isDealer == true) {
            villain_pos = "btn";
          }
          let villain_rank = [];
          let villain_suit = [];

          for(c of actions.cards) {
            if(c.isRevealed !== true) {
              continue;
            }
            if (c.holeCard == true) {
              villain_rank.push(c.rank);
              villain_suit.push(c.suit);
            }
          }
          if(villain_rank.length > 0) {
            let starting_hand = getSortedStartingHand(villain_rank, villain_suit);
            let showdown_str = actions.name + "###" + villain_pos + "###" + starting_hand;
            if(!showdowns.includes(showdown_str)) {
              showdowns.push(showdown_str);
            }
          }
        }
      });

      for(x of river_players) {
        if(!f_river_players.includes(x)) {
          sd_players.push(x);
        }
      }
      return {
        pfr_players: pfr_players,
        aggressor_player: aggressor_player,
        cbet_player: cbet_player,
        showdowns: showdowns,
        vpip: vpip.join(","),
        in_hand: in_hand,
        bb: bb_player,
        bb_def: bb_def,
        showdown_players: sd_players.join(","),
        bet3_players: bet3_players.join(","),
        id_list: id_list,
        raw_history: history
      }
    }

    function loadRankingMap() {
      hand_rank["2"] = 1;
      hand_rank["3"] = 2;
      hand_rank["4"] = 3;
      hand_rank["5"] = 4;
      hand_rank["6"] = 5;
      hand_rank["7"] = 6;
      hand_rank["8"] = 7;
      hand_rank["9"] = 8;
      hand_rank["T"] = 9;
      hand_rank["J"] = 10;
      hand_rank["Q"] = 11;
      hand_rank["K"] = 12;
      hand_rank["A"] = 13;
    }
    // Format hole cards in 4-colour deck to display in the top HUD bar
    function getHoleCards() {
      var hole = [];
      var simple_hole = [];
      var simple_suits = [];
      var minhc = [];
      var full_rank = [];
      var mini_hole = [];
      if(typeof you_state.hand !== "undefined") {
        let cards = you_state.hand;
        for(card of cards) {
          suit = card.suit;
          rank = card.rank;
          suit_sym = "";
          mini_sym = "";
          switch(suit) {
            case "HEARTS":
              suit_sym = "<font color='#FF756D'>♥</font>";
              mini_sym = "♥";
              break;
            case "DIAMONDS":
              suit_sym = "<font color='#6891C3'>♦</font>";
              mini_sym = "♦";
              break;
            case "CLUBS":
              suit_sym = "<font color='#85DE77'>♣</font>";
              mini_sym = "♣";
              break;
            case "SPADES":
              suit_sym = "<font color='#606060'>♠</font>";
              mini_sym = "♠";
              break;
          }
          hole.push(rank + suit_sym);
          mini_hole.push(rank + mini_sym);
          simple_hole.push(rank);
          simple_suits.push(suit_sym);
        }
      }
      return([hole, simple_hole, simple_suits, mini_hole.join("")]);
    }

    // What is early position, middle position or late position
    // depends on how many villains we are facing. We define these
    // terms in this function.
    function definePositions() {
      let positions = [];
      let this_dealer = 0;
      if(typeof table_state !== "undefined") {
        for(seat in table_state.seats) {
          this_seat = table_state.seats[seat];
          if(typeof this_seat.id !== "undefined") {
            positions.push(this_seat.id);
          }
          if(typeof this_seat.isDealer !== "undefined" && this_seat.isDealer == true) {
            this_dealer = this_seat.id;
          }
        }
      }

      sorted_positions = [];

      dealer_found = false;
      var i = 0;
      for(position of positions) {
        if(dealer_found == true) {
          sorted_positions.push(position);
        }
        if(position == this_dealer) {
          dealer_found = true;
        }
        i++;
      }
      dealer_found = false;
      for(position of positions) {
        if(dealer_found == false) {
          sorted_positions.push(position);
        }
        if(position == this_dealer) {
          dealer_found = true;
        }
        i++;
      }

      blind_1 = sorted_positions.shift();
      blind_2 = sorted_positions.shift();

      var ep = mp = lp = bl = [];

      switch(positions.length) {
        case 9:
          ep = [
            sorted_positions[0],
            sorted_positions[1],
            sorted_positions[2]
          ];

          mp = [
            sorted_positions[3],
            sorted_positions[4],
          ]

          lp = [
            sorted_positions[5],
            sorted_positions[6]
          ]

          bl = [
            blind_1,
            blind_2
          ]
          break;
        case 8:
          ep = [
            sorted_positions[0],
            sorted_positions[1]
          ];

          mp = [
            sorted_positions[2],
            sorted_positions[3]
          ]

          lp = [
            sorted_positions[4],
            sorted_positions[5]
          ]

          bl = [
            blind_1,
            blind_2
          ]
          break;
        case 7:
          ep = [
            sorted_positions[0],
            sorted_positions[1],
          ];

          mp = [
            sorted_positions[2],
          ]

          lp = [
            sorted_positions[3],
            sorted_positions[4]
          ]

          bl = [
            blind_1,
            blind_2
          ]
          break;
        case 6:
          ep = [
            sorted_positions[0]
          ];

          mp = [
            sorted_positions[1],
          ]

          lp = [
            sorted_positions[2],
            sorted_positions[3]
          ]

          bl = [
            blind_1,
            blind_2
          ]
          break;
        case 5:
          ep = [
            sorted_positions[0]
          ];

          mp = [
            sorted_positions[1],
          ]

          lp = [
            sorted_positions[2]
          ]

          bl = [
            blind_1,
            blind_2
          ]
          break;
        case 4:
          ep = [sorted_positions[0]];
          mp = []
          lp = [sorted_positions[1]];
          bl = [blind_1, blind_2];
          break;
        case 3:
          ep = [];
          mp = [];
          lp = [sorted_positions[0]];
          bl = [blind_1, blind_2];
          break;
        default:
          ep = [];
          mp = [];
          lp = [];
          bl = [];
          break;
      }

      return({
        ep: ep,
        mp: mp,
        lp: lp,
        bl: bl
      })
    }

    // Sorts a hand in order of rank
    function getSortedStartingHand(simple_hole, simple_suits) {
      if (hand_rank[simple_hole[0]] < hand_rank[simple_hole[1]]) {
        hole_1 = simple_hole[0];
        hole_2 = simple_hole[1];
        suit_1 = simple_suits[0];
        suit_2 = simple_suits[1];
        simple_hole[0] = hole_2;
        simple_hole[1] = hole_1;
        simple_suits[0] = suit_2;
        simple_suits[1] = suit_1;
      }
      starting_hand = simple_hole[0] + simple_hole[1];
      if (simple_suits[0] == simple_suits[1]) {
        starting_hand = starting_hand + "s";
      }
      return starting_hand;
    }

    // Extract hand history when hand concludes
    function checkEndOfHandAndProcess() {
      var review_button = $(".log-button[target='history']:not([processed])");
      if ($(review_button).length) {
        var unique_code = $(review_button).attr("ng-href");
        if(typeof unique_code !== "undefined") {
          var tmp_code = unique_code.split("=")[1];
          window.postMessage({ type: 'history_id', text: tmp_code});
        }
        $(review_button).attr("processed", "true");
      }
    }

    function addToHistory(history, unique_code) {
      var is_observer = true;
      if(typeof you_state !== "undefined") {
        if(you_state.isSeated == true || apiKey.length > 10) {
          is_observer = false;
        }
      }
      if(!isMobile) {
        window.blink("New hand starts");
      }
      hand_code = unique_code;
      var this_format = getMaxSeats();

      // Override table format if max-9 has insufficient players
      if(this_format == 9 && getNumberOfSeatedPlayers() < 7) {
        this_format = 6;
      }

      // Threshold 4 players for 6-max, 6 players for 9-max
      if(this_format == 6) {
        isShortHanded = getNumberOfSeatedPlayers() < 4 ? "1" : "0";
      } else {
        isShortHanded = getNumberOfSeatedPlayers() < 6 ? "1" : "0";
      }

      if(getNumberOfSeatedPlayers() == 2) {
        this_format = 2;
      } else if(getNumberOfSeatedPlayers() < 7) {
        this_format = 6;
      } else if(getNumberOfSeatedPlayers() < 10) {
        this_format = 9;
      }
      let observer_name = "observer"
      if(is_observer == false) {
        observer_name = you_state.name;
      }
      $.ajax({
        url: 'https://api.blockchainpokerhud.com/',
        type: 'POST',
        contentType: 'application/json',
        cache: false,
        timeout: 20000,
        data: JSON.stringify(
          {
            data: JSON.parse(history),
            unique_code: hand_code,
            api_key: apiKey,
            short_handed: isShortHanded,
            isObserver: is_observer,
            observerName: observer_name,
            table_format: this_format
          }
        ),
        dataType: 'json',
        success: function(msg, status, jqXHR) {
          Object.keys(msg).forEach(function(player) {
            if(player == "latest_version") {
              latestversion = msg[player];
            }
            else {
              villain_ev_map[player] = msg[player].ev;
              villain_aev_map[player] = msg[player].aev;
              villain_bb100_map[player] = msg[player].bb_100;
              villain_street_map[player] = msg[player].street;
              villain_vpip_map[player] = msg[player].vpip;
              villain_pfr_map[player] = msg[player].pfr;
              villain_bbd_map[player] = msg[player].bbd;
              villain_cb_map[player] = msg[player].cb_p;
              villain_hp_map[player] = msg[player].hp;
              villain_cb_hp_map[player] = msg[player].cb_hp;
              villain_bbd_hp_map[player] = msg[player].bbd_hp;
              villain_tsd_map[player] = msg[player].tsd_p;
              villain_bet3_map[player] = msg[player].bet3_p;
              villain_wwsf_map[player] = msg[player].wwsf;
              villain_wsd_map[player] = msg[player].wsd;
              villain_af_map[player] = msg[player].af;
              villain_ftcb_map[player] = msg[player].ftcb_p;
              villain_alias_map[player] = msg[player].aliases;
              highscores = msg[player].highscores;
              villain_is_weekly_map[player] = msg[player].is_weekly;
            }
          });
        }
      });
    }

    var stringToId = function (string) {
      function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
      }

      function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
          return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
          if (lResult & 0x40000000) {
            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
          } else {
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
          }
        } else {
          return (lResult ^ lX8 ^ lY8);
        }
      }

      function F(x,y,z) { return (x & y) | ((~x) & z); }
      function G(x,y,z) { return (x & z) | (y & (~z)); }
      function H(x,y,z) { return (x ^ y ^ z); }
      function I(x,y,z) { return (y ^ (x | (~z))); }

      function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
          lWordCount = (lByteCount-(lByteCount % 4))/4;
          lBytePosition = (lByteCount % 4)*8;
          lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
          lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
      };

      function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
          lByte = (lValue>>>(lCount*8)) & 255;
          WordToHexValue_temp = "0" + lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
      };

      function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

          var c = string.charCodeAt(n);

          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }

        }

        return utftext;
      };

      var x=Array();
      var k,AA,BB,CC,DD,a,b,c,d;
      var S11=7, S12=12, S13=17, S14=22;
      var S21=5, S22=9 , S23=14, S24=20;
      var S31=4, S32=11, S33=16, S34=23;
      var S41=6, S42=10, S43=15, S44=21;

      string = Utf8Encode(string);

      x = ConvertToWordArray(string);

      a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

      for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
      }
      var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
      return temp.toLowerCase();
    }
    var stringToId = function (string) {
      function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
      }

      function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
          return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
          if (lResult & 0x40000000) {
            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
          } else {
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
          }
        } else {
          return (lResult ^ lX8 ^ lY8);
        }
      }

      function F(x,y,z) { return (x & y) | ((~x) & z); }
      function G(x,y,z) { return (x & z) | (y & (~z)); }
      function H(x,y,z) { return (x ^ y ^ z); }
      function I(x,y,z) { return (y ^ (x | (~z))); }

      function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      };

      function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
          lWordCount = (lByteCount-(lByteCount % 4))/4;
          lBytePosition = (lByteCount % 4)*8;
          lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
          lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
      };

      function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
          lByte = (lValue>>>(lCount*8)) & 255;
          WordToHexValue_temp = "0" + lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
      };

      function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

          var c = string.charCodeAt(n);

          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }

        }

        return utftext;
      };

      var x=Array();
      var k,AA,BB,CC,DD,a,b,c,d;
      var S11=7, S12=12, S13=17, S14=22;
      var S21=5, S22=9 , S23=14, S24=20;
      var S31=4, S32=11, S33=16, S34=23;
      var S41=6, S42=10, S43=15, S44=21;

      string = Utf8Encode(string);

      x = ConvertToWordArray(string);

      a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

      for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
      }
      var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
      return temp.toLowerCase();
    }

    // Update betting_action array
    function updateBettingAction() {
      if(typeof table_state !== "undefined") {
        let round = table_state.round;
        if(round !== "SHOWDOWN") {
          if(typeof table_state.blinds !== "undefined") {
            let bigblind = table_state.bigBlindAmount;
            for(seat of table_state.seats) {
              let bet_size = seat.bet;
              let name = seat.name;
              if(bet_size > bigblind) {
                if(typeof betting_action[round] === "undefined") {
                  betting_action[round] = "";
                }
                if(round === "PREFLOP") {
                  if(bet_size > high_bet) {
                    // If there is a re-raise preflop, re-set betting action
                    // for this round as we have a new aggressor and want to
                    // know if this particular villain c-bets
                    high_bet = bet_size;
                    betting_action[round] = "";
                  }
                }
                if(betting_action[round].length == 0) {
                  betting_action[round] = name;
                }
              }
            }
          }
        }
      }
    }

    function getTableName() {
      if(typeof table_state === "undefined" || typeof table_state.name === "undefined") {
        return "no_table";
      } else {
        return(table_state.name);
      }
    }

    function getNumberOfSeatedPlayers() {
      var seated = 0;
      if(typeof hand_state != "undefined") {
        let in_this_hand = hand_state["seats"];
        for(i in in_this_hand) {
          let is_waiting_for_blind = in_this_hand[i]["waitingForBlind"];
          if(is_waiting_for_blind == false) {
            seated++;
          }
        }
      }
      if(seated > 0) {
        return(seated);
      }

      // Fallback for when we don't have seated players returned by BCP
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      var seated = 0;
      $(seats).each(function(index) {
        villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
        if(typeof villain_name !== "undefined") {
          seated++;
        }
      });
      return seated;
    }

    function soundAlarmIfHeadsUpPlayerSits() {
      if(getMaxSeats() != 2) {
        return;
      }

      var numseats = 0;
      i_am_seated = false;
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      $(seats).each(function(index) {
        villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
        if(typeof villain_name !== "undefined") {
          numseats++;
          if(villain_name == you_state.name) {
            i_am_seated = true;
          }
        }
      });

      if(numseats == 2 && i_am_seated == true) {
        if(someone_else_is_seated == false) {
          someone_else_is_seated = true;
          var audio = new Audio('https://rainbowflop.com/alarm.mp3');
          audio.play();
          if(!isMobile) {
            window.blink("Heads up started", 32);
          }
        }
      } else {
        someone_else_is_seated = false;
      }
    }

    function addTableDiv() {
      info_box = $(".table-info").find(".infobox");
      if (!$(info_box).is(":visible")) {
        if(!isMobile) {
          $(".table-info").append("<div class='infobox' style='font-size: 12px; background: #000; padding: 2px 5px 2px;'></div>");
        } else {
          $(".table-info").append("<div class='infobox' style='font-size: 12px; background: #000; padding: 2px 5px 2px; z-index: 9999;'></div>");
        }
      }
    }
    delete window.__SENTRY__;
    function atTable() {
      if(getTableName() === "no_table") {
        processed_hand = []; // Reset session array
        played_hand = [];    // Reset session array
        return false;
      } else {
        return true;
      }
    }
    function getPlayerIdFromName(name) {
      if(table_state != null && typeof table_state.seats !== "undefined") {
        for (var i in table_state.seats) {
          player_id = table_state.seats[i].id;
          player_name = table_state.seats[i].name;
          if(typeof player_name !== "undefined") {
            if(player_name === name) {
              return player_id.toString();
            }
          }
        }
      }
      return("0")
    }

    function contentToNumber(raw) {
      if(typeof raw == "undefined") {
        return 0;
      }
      const regex = /<!--(.*?)-->/gm;
      raw = raw.replace(regex, "");
      const contentArr = raw.split("");

      // If the number ends in 'k', replace with three zeroes
      if (contentArr[contentArr.length - 1] === 'k') {
        contentArr[contentArr.length - 1] = "0";
        contentArr.push("0");
        contentArr.push("0");
      }
      const num = Number(contentArr.filter(c => c.trim() && !isNaN(c)).join(""));
      return num || 0;
    }

    // Parse chipcount numbers
    function getNumberContent(el) {
      // Strip HTML comments from element
      var raw = el.innerHTML;
      const regex = /<!--(.*?)-->/gm;
      raw = raw.replace(regex, "");
      const contentArr = raw.split("");

      // If the number ends in 'k', replace with three zeroes
      if (contentArr[contentArr.length - 1] === 'k') {
        contentArr[contentArr.length - 1] = "0";
        contentArr.push("0");
        contentArr.push("0");
      }
      const num = Number(contentArr.filter(c => c.trim() && !isNaN(c)).join(""));
      return num || 0;
    }

    // Get total from pot
    function getPot() {
      return Array.from(document.getElementsByClassName("pot")).reduce(
        (total, e) => {
          const el = Array.from(e.getElementsByClassName("ng-binding ng-scope"));
          const s = el.reduce((a, el) => a + getNumberContent(el), 0);
          return total + s;
        },
        0
      );
    }

    // Get total from each person's bet
    function getActiveBets() {
      return Array.from(document.getElementsByClassName("bet")).reduce(
        (total, e) => {
          const el = Array.from(e.getElementsByClassName("ng-binding ng-scope"));
          const s = el.reduce((a, el) => a + getNumberContent(el), 0);
          return total + s;
        },
        0
      );
    }

    // Get total from each person's stack
    function getActiveStacks() {
      return Array.from(document.getElementsByClassName("stack")).reduce(
        (total, el) => total + getNumberContent(el),
        0
      );
    }

    // Get total chips in play
    function getGrandTotalChipsInPlay() {
      const funcs = [getActiveBets, getActiveStacks, getPot];
      return funcs.reduce((s, f) => s + f(), 0);
    }

    // Returns all player names and stack sizes
    function getPlayerNamesAndBalances() {
      return Array.from(document.getElementsByClassName("player")).map(el => {
        const name = el.getElementsByClassName("name")[0].innerHTML;
        const stack = el.getElementsByClassName("stack")[0];
        const value = getNumberContent(stack);
        return { name, value };
      });
    }

    // Get community cards from table state and render them
    function getCommunityCards() {
      var board = [];
      var mini_board = [];
      try {
        if(typeof table_state !== "undefined" && typeof table_state.cards !== "undefined") {
          let cards = table_state.cards;
          for(card of cards) {
            if(typeof card.suit == "undefined") {
              continue;
            }
            var suit = card.suit;
            var rank = card.rank;
            var index = card.index;
            var suit_sym = "";
            var mini_sym = "";
            switch(suit) {
              case "HEARTS":
                suit_sym = "<font color='#FF756D'>♥</font>";
                mini_sym = "♥";
                break;
              case "DIAMONDS":
                suit_sym = "<font color='#6891C3'>♦</font>";
                mini_sym = "♦";
                break;
              case "CLUBS":
                suit_sym = "<font color='#85DE77'>♣</font>";
                mini_sym = "♣";
                break;
              case "SPADES":
                suit_sym = "<font color='#808080'>♠</font>";
                mini_sym = "♠";
                break;
            }
            board.push(rank + suit_sym);
            mini_board.push(rank + mini_sym);
          }
        }
      } catch(e) {
      }
      return([board, mini_board]);
    }

    // Create HUD stats boxes
    function createStatsBoxes() {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      $(seats).each(function(index) {
        stats_box = $(this).find(".stats");
        if (!$(stats_box).is(":visible")) {
          $(this).append("<div class='stats' style='border-radius: 5px; font-size: 11px; background: #000; left:8px; z-index:99999; position: relative; padding: 2px 5px 2px; text-align: center;'></div>");
        }
      });
    }

    // Returns an array of players at the table
    function getPlayerList() {
      let players = [];
      if(table_state.seats !== "undefined") {
        let seats = table_state.seats;
        for(seat of seats) {
          let index = seat.index;
          let name = seat.name;
          let sitting_out = seat.sittingOut;
          let waiting = seat.waitingForBlind;
          if(!sitting_out && !waiting && typeof name !== "undefined" && name != null) {
            players[index] = name;
          }
        }
      }
      return(players);
    }

    // Gets and updates the our_name variable
    function getId() {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      $(seats).each(function(index) {
        villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
        you_button = $(this).find("button[aria-label='This is You']");
        if ($(you_button).is(":visible")) {
          our_name = villain_name;
          our_seat = index;
        }
      });
      return(our_name);
    }
    function displayNumber(x) {
      if(typeof x == "undefined") {
        return;
      }
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function getPosition(my_pos, dealer_pos, seats) {
      var positions = table_state.positions;
      if(typeof positions !== "undefined") {
        var real_bb_pos = positions.bigBlind;
        var real_sb_pos = positions.smallBlind;
        var real_btn_pos = positions.dealer;

        if(real_btn_pos == my_pos) {
          return "btn";
        }
        if(real_sb_pos == my_pos) {
          return "sb";
        }
        if(real_bb_pos == my_pos) {
          return "bb";
        }
      }

      var my_pos_str = "unknown";
      if(seats.length >= 3) {
        var arr_dealer_pos = -1;
        for (var i = 0; i < seats.length; i++) {
          if(seats[i] == dealer_pos) {
            arr_dealer_pos = i;
            break;
          }
        }

        var tmp_seats = seats.concat(seats);

        var arr_my_pos = -1;
        for (var i = 0; i < seats.length; i++) {
          if(seats[i] == my_pos) {
            arr_my_pos = i;
            break;
          }
        }

        var sb_pos = tmp_seats[arr_dealer_pos + 1]
        var bb_pos = tmp_seats[arr_dealer_pos + 2]
        var utg_pos = tmp_seats[arr_dealer_pos + 3]

        var steps_to_button = -1;
        var steps = 0;

        for (var i = arr_my_pos; i < tmp_seats.length; i++) {
          if(tmp_seats[i] == dealer_pos) {
            if(steps == 0) {
              my_pos_str = "btn";
            }
            if(steps == 1) {
              my_pos_str = "co";
            }
            steps_to_button = steps;
            break;
          }
          steps++;
        }

        if(my_pos == sb_pos) {
          my_pos_str = "sb";
        }
        if(my_pos == bb_pos) {
          my_pos_str = "bb";
        }
        if(my_pos == utg_pos) {
          my_pos_str = "utg";
        }
      }
      return(my_pos_str);
    }

    // Get the seat number of the dealer button
    function getDealerPosition() {
      var position = -1;
      if(table_state.positions !== "undefined") {
        let positions = table_state.positions;
        position = positions.dealer;
      }
      return(position);
    }

    // Returns position string for specified seat
    // Might be able to infer this from table_state
    function getSeatPosition(seat) {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      var dealer_pos = -1;
      var seated_array = [];

      // First determine which seats are occupied
      $(seats).each(function(index) {
        villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
        sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
        if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
          seated_array.push(index);
        }
      });

      dealer_pos = getDealerPosition();
      return getPosition(seat, dealer_pos, seated_array);
    }

    function getMaxSeats() {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      if(typeof seats !== "undefined") {
        return(seats.length);
      } else {
        return(0);
      }
    }

    function getGameState() {
      var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
      var state = [];
      var player_list = getPlayerList();
      var our_name = getId();

      var player_active = false;
      var in_pot = false;
      var raw_board = getCommunityCards();
      var board = raw_board[0];

      $(seats).each(function(index) {
        player_active = false;
        in_pot = false;
        var villain_name = player_list[index];
        if(typeof villain_name !== 'undefined') {
          villain_position = getSeatPosition(index);
          state[villain_name] = {};

          // Store villain ev in easy to use variable for convenience
          historical_ev = villain_ev_map[villain_name];
          historical_aev = villain_aev_map[villain_name];
          historical_bb100 = villain_bb100_map[villain_name];
          historical_street = villain_street_map[villain_name];
          historical_vpip = villain_vpip_map[villain_name];
          historical_pfr = villain_pfr_map[villain_name];
          historical_bbd = villain_bbd_map[villain_name];
          historical_cb = villain_cb_map[villain_name];
          historical_bet3 = villain_bet3_map[villain_name];
          historical_wwsf = villain_wwsf_map[villain_name];
          historical_wsd = villain_wsd_map[villain_name];
          historical_af = villain_af_map[villain_name];
          historical_ftcb = villain_ftcb_map[villain_name];
          historical_tsd = villain_tsd_map[villain_name];
          historical_aliases = villain_alias_map[villain_name];
          historical_is_weekly = villain_is_weekly_map[villain_name];

          // Store sample sizes
          historical_hp = villain_hp_map[villain_name];
          historical_cb_hp = villain_cb_hp_map[villain_name];
          historical_bbd_hp = villain_bbd_hp_map[villain_name];

          // Find out if villain is in the pot
          is_in_pot = $(this).find("md-card[ng-class=':: {back: back, full: full}']");
          // Is villain showing cards?
          if ($(is_in_pot).is(":visible")) {
            // Are we past pre-flop and is villain not us ?
            if((typeof board !== "undefined") && board.length > 0 && villain_name != our_name) {
              in_pot = true;
            }
          }

          // Is the player active at the table?
          sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
          if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
            player_active = true;
          }

          state[villain_name] = {
            in_pot: in_pot,
            active: player_active,
            position: villain_position,
            ev: historical_ev,
            aev: historical_aev,
            cb: historical_cb,
            vpip: historical_vpip,
            pfr: historical_pfr,
            bbd: historical_bbd,
            hp: historical_hp,
            cb_hp: historical_cb_hp,
            bbd_hp: historical_bbd_hp,
            tsd_p: historical_tsd,
            bet3_p: historical_bet3,
            bb100: historical_bb100,
            street: historical_street,
            wwsf: historical_wwsf,
            wsd: historical_wsd,
            af: historical_af,
            ftcb: historical_ftcb,
            aliases: historical_aliases,
            is_weekly: historical_is_weekly
          };
        }
      });
      return(state);
    }

    var villain_ev = [];
    var ur_seat = 1;
    var our_name = "Bender";
    var dealer_pos = 0;
    var players_seated = 0;
    var max_seats = 0;

    loadRankingMap();

    function convertIdToEmoji(id) {
      return(id % 255);
    }

    function updateGame() {
      //queuedMessage = sendMessageQueue.shift();
      //if(queuedMessage) {
      //  sendMessage(queuedMessage.prefix, queuedMessage.command);
      //}
      // Fix stale connections
      let currentTimestamp = Math.floor(Date.now() / 1000);
      if(pongTime == currentTimestamp) {
        pongTime = Math.floor(Date.now() / 1000) + 60;
        window.ws.close();
        wsToken = "";
        connectWebsocket(true);
      } else if (pongTime2 == currentTimestamp) {
        /*
        try {
          window.ws.close();
        } catch(e) {
          // Do nothing
        }
        wsToken = "";
        location.reload();
        */
      }

      if(gameTick > 100) {
        gameTick = 0;
      }
      if(typeof loadEVMap !== "undefined" && evmapLoaded == false) {
        evmapLoaded = true;
        loadEVMap();
      }
      if(typeof JSZip == "function" && jszip_initialized != true) {
        jszip_initialized = true;
      }
      for(p of chat_players) {
        if(namefakers.includes(p)) {
          $("button:contains('" + p + "')").each(function() {
            if ($(this).hasClass('logged-player')) {
              let checked_name = $(this).html();
              if(checked_name == p) {
                $(this).html(p + " <font color='orange'><b>&#9888;</b></font> (NAMEFAKER)");
              }
            }
          });
        } else {
          if(typeof checked_profile[p] == "undefined") {
            socket.emit("getProfile", { name: p }, function(x, player = p) {
              let creation_ts = Math.floor(new Date(x.createdAt).getTime() / 1000);
              let now_time = Math.floor(Date.now() / 1000);
              checked_profile[x.name] = creation_ts;
              if(now_time - creation_ts < newbie_threshold) {
                $("button:contains('" + x.name + "')").each(function() {
                  if ($(this).hasClass('logged-player')) {
                    let checked_name = $(this).html();
                    if(checked_name == p) {
                      $(this).html(x.name + " <font color='yellow'><b>&#9888;</b></font> (NEWBIE)");
                    }
                  }
                });
              }
            });
          }
        }
      }
      window.postMessage({ type: 'table_state' });
      window.postMessage({ type: 'you_state' });

      let this_currency = "BCH";
      if(typeof window.table !== "undefined") {
        this_currency = window.table.currency;
      }

      if(typeof this_currency !== "undefined") {
        if(gameTick % 2 == 0) {
          // Get players at the table and get their profile if we didn't get it yet
          if(typeof window.table !== "undefined") {
            players_at_table = window.table.seats.map(p => p.name);
            for(p of players_at_table) {
              if(p && typeof p != "undefined" && typeof player_notes[p] == "undefined") {
                socket.emit("getProfile", { name: p }, function(x, player = p) {
                  note = x.notes;
                  if(typeof x.notes !== "undefined") {
                    player_notes[x.name] = note
                  }
                });
              }
            }
          }
        }

        // Update every 5 seconds
        if(gameTick % 5 == 0) {
          socket.emit("gettables", { pageSize: 1000, currency: this_currency }, function(x) { open_tables = x });
        }

        // Update every minute
        if(gameTick % 60 == 0) {
          socket.emit("getRewardsBalance", {}, function(x) { rewards_balance = x["balance"]; minutetick = (Math.round((new Date()).getTime() / 1000) + 60 ) });
          if(typeof window.table !== "undefined") {
            socket.emit("gettournaments", { pageSize: 1000, currency: window.table.currency }, function(x) { tournament_tables = x });
            socket.emit("getTransactions", { }, function(x) { transaction_history = x });
            socket.emit("getTopChipEarners", { currency: window.table.currency }, function(x) { var myTopEarners = []; for(obj of x["topChipEarners"]) { myTopEarners.push(obj.AccountId) }; topEarners = myTopEarners; } );
          }
        }
      }

      if((preflopCards == "" || gameTick % 10 == 0) && typeof(window.you) !== "undefined" && you.isSeated == true && you.hand.length > 0) {
        preflopCards = you.hand[0].rank + suitToLetter(you.hand[0].suit) + you.hand[1].rank + suitToLetter(you.hand[1].suit);
        preflopCardsDisplay = cardsToSymbols(preflopCards); 
        getStreetHandStrength();
      } else if(gameTick % 10 == 0 && typeof(window.you) !== "undefined" && you.isSeated == true && you.hand.length == 0) {
        keepAlive(true);
      }
      var table_name = getTableName();
      if (atTable()) {
        // Reset variables
        players_seated = 0;
        max_seats = 0;

        var seated_array = [];
        var hole = [];
        var board = [];
        var simple_hole = [];
        var simple_suits = [];
        var hud_display = [];
        var ev = -100;

        // Various element objects
        var search_button = $("button[aria-label='Play at higher stakes tables']");
        var messages = $("div[ng-if='::log.message']");
        var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
        var fold_button = $("button[aria-label='Fold']");
        var check_button = $("button[aria-label='Check']");
        var call_button = $("button[aria-label='Call']");
        var call2_button = $("button[aria-label='Call Current Bet']");
        var villain_cards = $("card[ng-repeat='card in player.cards track by $index']");
        var players = $("md-card[ng-if='player.name']");

        if(hualarm == "true") {
          soundAlarmIfHeadsUpPlayerSits();
        }

        // Badge placeholder
        var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
        $(seats).each(function(index) {
          badgehud = $(this).find(".badgehud");
          if(!$(badgehud).is(":visible")) {
            stackelm = $(this).find(".stack");
            $(stackelm).after("<button class='badgehud md-mini ng-scope md-dance-theme md-ink-ripple' type='button' ng-transclude='' style='background: #000;'></div></button>");
          }
        });

        // Inject our HUD if it's not already there
        hud = $(".benderhud");
        if (!$(hud).is(":visible")) {
          if(isMobile) {
            $(search_button).after("<div class='benderhud ng-binding ng-scope log-item' style='font-size: 8px; background: #000; padding: 1px; position:fixed; left:0%; bottom: -8px; transform: translate(1%, -50%); margin: 0 auto;'></div>");
          } else {
            $(search_button).after("<div class='benderhud ng-binding ng-scope log-item' style='font-family: Lato; font-weight: 300; -webkit-font-smoothing: antialiased; background: #000; padding: 5px;'></div>");
          }
        }

        if(table_state.handId !== last_hand_id) {
          last_hand_id = table_state.handId;
          if(you_state.sittingOut == true) {
            window.postMessage({ type: 'anti_idle', text: table_state.id});
          }
          if(typeof villain_profit !== "undefined") {
            for(v in villain_profit) {
              let bb_balance = villain_profit[v];
              if(typeof villain_profit_map[v] == "undefined") {
                villain_profit_map[v] = 0.00;
              }
              villain_profit_map[v] = (parseFloat(villain_profit_map[v]) + parseFloat(bb_balance));
            }
          }
          villain_profit = {}
        }

        updateBettingAction();
        checkEndOfHandAndProcess();
        var our_cards = getHoleCards();

        hole = our_cards[0];
        simple_hole = our_cards[1];
        simple_suits = our_cards[2];
        minhc = our_cards[3];

        // When we have two hole cards, sort them high to low.
        // Then obtain EV for that hand and suggest position
        if (simple_suits.length == 2) {
          starting_hand = getSortedStartingHand(simple_hole, simple_suits);
          if(evmapLoaded == true) {
            ev = ev_map[starting_hand];
          }
        }
        // Get the community cards to display in HUD
        raw_board = getCommunityCards();
        board = raw_board[0];

        // Add HUD stats boxes to all seats
        createStatsBoxes();

        game_state = getGameState();

        var id = stringToId(getId());
        var tid = stringToId(table_name);
        if(prev_tid != tid) {
          prev_tid = tid;
          villain_profit_map = {}
          villain_profit = {}
          sendHandshake();
        }

        if(typeof tid !== "undefined") {
          share_button = $(".share-button");
          if ($(share_button).is(":visible")) {
            $(".share-button").replaceWith("<div class='popouttable' align='right' style='position: fixed; bottom: 1em; right:1em; cursor: pointer; width: 5em;'>pop out &#8599;</div>");
          } 
        }

        $(".handhistory").on('click', function() {
          if(downloading_hh == false) {
          downloading_hh = true;
            let transaction = hand_history_db.transaction(["handhistorydb"], "readwrite");
            let objectStore = transaction.objectStore("handhistorydb");
            let objectStoreHands = objectStore.getAll();
            objectStoreHands.onsuccess = function() {
              let transaction2 = hand_history_db.transaction(["handhistorydb"], "readwrite");
              let objectStore2 = transaction.objectStore("handhistorydb");
              var zip = new JSZip();
              for(hh of objectStoreHands.result) {
                let id = hh.id;
                objectStore2.delete(id);
                let hh_text = hh.hand;
                let ISO_8601 = /(\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?))/g;
                let matches = hh_text.matchAll(ISO_8601);
                let captured_date = Math.floor(Date.now() / 1000);
                for (const match of matches) {
                  captured_date = match[0];
                  break;
                }
                zip.file(captured_date + "-" + id + ".txt", hh_text, { date: new Date( captured_date )});
              }
              zip.generateAsync({type:"blob"})
                .then(function(content) {
                saveAs(content, "handhistory-" + Math.floor(Date.now() / 1000) + "-" + window.you.name + ".zip");
                downloading_hh = false;
              });
            };
          }
        });
        $(".popouttable").on('click', function() {
          popOut(table_state.id);
        });

        // Render villain stats
        $(seats).each(function(index) {
          let villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
          if(typeof villain_alias_map[villain_name] !== "undefined") {
            $(this).attr("title", "aliases: " + villain_alias_map[villain_name]);
          }

          var user_id = getPlayerIdFromName(villain_name);

          // Get state of villain
          var villain_state = game_state[villain_name]

          // Assign data to villain to display in HUD
          if(typeof villain_state !== "undefined") {
            var historical_ev = villain_state.ev;         // average expected value hand
            var historical_aev = villain_state.aev;       // average expected value hand when aggressor
            var historical_vpip = villain_state.vpip;     // volunarily put in pot %
            var historical_pfr = villain_state.pfr;       // pre-flop raise %
            var historical_cb = villain_state.cb;         // c-bet %
            var historical_bbd = villain_state.bbd;       // big blind def
            var historical_hp = villain_state.hp;         // hands played
            var historical_cb_hp = villain_state.cb_hp;   // c-bet potential hands sample size
            var historical_bbd_hp = villain_state.bbd_hp; // bbdef potential hands sample size
            var historical_bet3_p = villain_state.bet3_p; // Bet3 percentage
            var historical_tsd_p = villain_state.tsd_p;   // To Showdown percentage
            var historical_bb100 = villain_state.bb100;   // BB/100
            var historical_wwsf = villain_state.wwsf;     // Won When Saw Flop
            var historical_wsd = villain_state.wsd;       // % Won when went to showdown
            var historical_af = villain_state.af;         // Calculated aggression factor
            var historical_ftcb = villain_state.ftcb;     // Fold to cbet %
            var historical_street = villain_state.street; // Avg street
            var aliases = villain_state.aliases;          // previous handles
            var is_in_pot = villain_state.in_pot;
            var position = villain_state.position;
            var active = villain_state.active;
            var is_weekly = villain_state.is_weekly;
          }
          if(typeof villain_name !== "undefined") {
            villain_id = stringToId(villain_name);
          } else {
            villain_id = "unknown";
          }

          max_seats++;
          sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
          if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
            seated_array.push(index);
            players_seated++;
          }

          dealer_button = $(this).find("button[aria-label='This is the Dealer']");
          if ($(dealer_button).is(":visible")) {
            dealer_pos = index;
          }

          you_button = $(this).find("button[aria-label='This is You']");
          if ($(you_button).is(":visible")) {
            our_name = villain_name;
            our_seat = index;
          }

          let villain_hud = [];
          let villain_hud_mini = [];
          let ev_color = (historical_ev < 0) ? "#FF756D" : "#85DE77";
          let aev_color = (historical_ev < 0.2) ? "#FF756D" : "#85DE77";
          let bb100_color = (historical_bb100 < 0) ? "#FF756D" : "#85DE77";

          var vpip_threshold = 25;
          if(getMaxSeats() == 6) {
            vpip_threshold = 35
          }
          let vpip_color = (historical_vpip >= vpip_threshold) ? "#FF756D" : "#85DE77";
          let pfr_color = (historical_pfr >= 21) ? "#FF756D" : "#85DE77";

          var is_fish = false;
          var is_calling_station = false
          var is_maniac = false;
          var is_clown = false;
          var is_top_earner = false;
          var has_note = false;

          if(typeof player_notes[villain_name] !== "undefined") {
            has_note = true;
          }

          if(top_earners.includes(parseInt(user_id))) {
            is_top_earner = true;
          }

          let last_showdown_string = "";
          if(typeof hand_history_map[user_id.toString()] !== "undefined") {
            last_showdown_string = "<br /><hr />Previous strength: " + hand_history_map[user_id.toString()];
          }

          if(typeof historical_vpip !== "undefined") {
            if(historical_vpip >= (vpip_threshold+10)) {
              is_fish = true;
            }
            if(historical_vpip >= 50) {
              if(typeof historical_pfr !== "undefined") {
                // If villain has high PFR and a high vpip then he's LAG or clown
                if(historical_pfr >= 20) {
                  if(typeof historical_ev !== "undefined") {
                    if(historical_ev < 0) {
                      is_clown = true; // Showdown bad hands
                    } else {
                      is_maniac = true; // Showdown good hands
                    }
                  }
                } else {
                  if(typeof historical_ev !== "undefined") {
                    if(historical_ev < 0) {
                      is_clown = true; // Showdown bad hands
                    }
                  }
                }
              }
              is_calling_station = true;
            }
            villain_hud.push("<div class='tooltip'>vp<span class='tooltiptext'>Voluntarily Put in Pot %</span></div>: <font color='" + vpip_color + "'>" + Number(historical_vpip).toFixed(1) + "</font>");
            villain_hud_mini.push("<div class='tooltip'><font color='" + vpip_color + "'>" + Number(historical_vpip).toFixed(1) + "</font><span class='tooltiptext'>Voluntarily Put in Pot %</span></div>");
          }

          if(typeof historical_pfr !== "undefined") {
            if(historical_pfr >= 30) {
              is_fish = true;
            }
            villain_hud.push("<div class='tooltip'>pfr<span class='tooltiptext'>Preflop Raise %</span></div>: <font color='" + pfr_color + "'>" + Number(historical_pfr).toFixed(1) + "</font>");
            villain_hud_mini.push("<div class='tooltip'><font color='" + pfr_color + "'>" + Number(historical_pfr).toFixed(1) + "</font><span class='tooltiptext'>Preflop Raise %</span></div>");
          }
          if(typeof historical_bet3_p !== "undefined") {
            villain_hud.push("<br /><div class='tooltip'>3b<span class='tooltiptext'>3-Bet %</span></div>: " + Number(historical_bet3_p).toFixed(1));
            villain_hud_mini.push("<div class='tooltip'>" + Number(historical_bet3_p).toFixed(1) + "<span class='tooltiptext'>3-Bet %</span></div>");
          }
          if(typeof historical_tsd_p !== "undefined") {
            var tsd_postfix = "";
            if(typeof historical_ev !== "undefined" && evmapLoaded == true) {
              let ev_range = aevToRange(Number(historical_ev).toFixed(2));
              tsd_postfix = ". Villain has an average EV of " + Number(historical_ev).toFixed(2) + " at showdown. Typical range: " + ev_range;
            }
            villain_hud.push("<div class='tooltip'>sd%<span class='tooltiptext'>% went to showdown after seeing flop" + tsd_postfix + " </span></div> " + Number(historical_tsd_p).toFixed(1));
          }

          if(typeof historical_af !== "undefined") {
            let af_color = (historical_af > 5) ? "#FF756D" : "#85DE77";
            if(historical_af < 1) {
              af_color = "#fff";
            }
            villain_hud.push("<div class='tooltip'>af: <span class='tooltiptext'>Aggression Factor (aim for 3)</span></div><font color='" + af_color + "'>" + Number(historical_af).toFixed(1) + "</font>");
            villain_hud_mini.push("<div class='tooltip'><font color='" + af_color + "'>" + Number(historical_af).toFixed(1) + "</font><span class='tooltiptext'>Aggression Factor (aim for 3)</span></div>");
          }

          if(typeof historical_wwsf !== "undefined") {
            villain_hud.push("<div class='tooltip'>wsf: <span class='tooltiptext'>Won when saw flop %</span></div>" + Number(historical_wwsf).toFixed(1));
          }

          if(typeof historical_wsd !== "undefined") {
            villain_hud.push("<div class='tooltip'>wsd: <span class='tooltiptext'>Won when showed down %</span></div>" + Number(historical_wsd).toFixed(1));
          }

          if(typeof historical_ftcb !== "undefined" && historical_ftcb > 0) {
            villain_hud.push("<div class='tooltip'>fc<span class='tooltiptext'>Fold to Cbet %</div>: " + Number(historical_ftcb).toFixed(1));
          }

          if(typeof historical_cb !== "undefined") {
            villain_hud.push("<div class='tooltip'>cb<span class='tooltiptext'>Continuation Bet %. A good value is around 70%, and significantly lower for high stake games.</span></div>: " + Number(historical_cb).toFixed(1));
          }

          // Only show bb defence stats when relevant
          if(position == "bb") {
            if(typeof historical_bbd !== "undefined") {
              villain_hud.push("<div class='tooltip'>bd<span class='tooltiptext'>Big Blind Defended %</span></div>: " + Number(historical_bbd).toFixed(1) + "");
            }
          }
          if(typeof historical_ev !== "undefined") {
            let ev_range = aevToRange(Number(historical_ev).toFixed(2));
            villain_hud.push("<div class='tooltip'>ev<span class='tooltiptext'>Average Showdown EV (overall). Average range of villain is: " + ev_range + "</span></div>: " + Number(historical_ev).toFixed(2) + "");
          }
          if(typeof historical_aev !== "undefined") {
            let aev_range = aevToRange(Number(historical_aev).toFixed(2));
            villain_hud.push("<div class='tooltip'>aev<span class='tooltiptext'>Average Showdown EV when Pre-flop Aggressor. Range of villain is: " + aev_range + "</span></div>: " + Number(historical_aev).toFixed(2) + "");
          }
          var is_newbie = true;
          if(typeof historical_hp !== "undefined") {
            if(Number(historical_hp) >= 100) {
              is_newbie = false;
            }
          }

          var is_shark = false;
          var is_turtle = false;
          if(typeof historical_vpip !== "undefined" && typeof historical_pfr !== "undefined" && typeof historical_ev !== "undefined") {
            if(vpip_color == "#85DE77" && pfr_color == "#85DE77" && Number(historical_pfr) >= 10) {
              is_shark = true;
            } else if (vpip_color == "#85DE77" && pfr_color == "#85DE77" && Number(historical_pfr) < 8) {
              is_turtle = true;
            }
          }

          var won_addition = "";
          if(typeof villain_profit_map[user_id] !== "undefined") {
            let won_color = "#FFF";
            let won_sign = "+";
            if(villain_profit_map[user_id] < 0) {
              won_color = "#FF756D";
              won_sign = "";
            } else {
              won_color = "#85DE77";
            }
            villain_hud.push("<div class='tooltip'><font color='" + won_color + "'>" + won_sign + "</font><span class='tooltiptext'>Big Blinds won or lost this session</span><font color='" + won_color + "'>" + villain_profit_map[user_id].toFixed(0) + "bb</font></div>");
          }

          tableStats = {}
          for(stat of Object.keys(statMap)) {
            let stats = statMap[stat];
            for(item of stats) {
              let v = item[0];
              let i = item[1];
              let x = item[2];
              if(stat == window.table.id && i == user_id) {
                villain_hud.push("<div style='position: absolute; width: 4em; min-width: 3em; height: 2.0em; min-height: 2.0em; padding: 2px; border-radius: 5px; top: -3em; left: -4.5em; background: #000;'>" + x + '</div>');
                villain_hud_mini.push("<div style='position: absolute; width: 4em; min-width: 3em; height: 2.0em; min-height: 2.0em; padding: 2px; border-radius: 5px; top: -3em; left: -4.5em; background: #000;'>" + x + '</div>');
              }
              if(typeof tableStats[stat] == "undefined" ) {
                tableStats[stat] = [];
              }
              if(!tableStats[stat].includes(v)) {
                tableStats[stat].push(v);
              }
            }
          }
          if(villain_hud.length == 0) {
            if(typeof villain_name !== "undefined") {
              $(this).find(".stats").html("Waiting for data");
              if(isMobile) {
                fontsize = "7px";
              } else {
                fontsize = "11px";
              }
              $(this).find(".stats").attr("style","border-radius: 5px; font-size: " + fontsize + "; background: #000; left:8px; z-index: 99999; position: relative; padding: 2px 5px 2px; text-align: center");
            } else {
              $(this).find(".stats").attr("style","");
              $(this).find(".stats").html("");
            }
          } else {
            let postpend = "";
            let sample_sizes = "";
            if(typeof historical_cb_hp !== "undefined" && typeof historical_bbd_hp !== "undefined" && typeof historical_hp !== "undefined") {
              // Little info box with sample sizes for the hover text
              if(is_weekly == true) {
                weekly_str = " during the last 9 days.";
              } else {
                weekly_str = " since the beginning of time.";
              }
              sample_sizes = "<hr>Stats are based on " + historical_hp + " hands played" + weekly_str;
            }

            let badge = "";
            let badge_txt = "";

            if(is_top_earner) {
              badge = earner_icon;
              badge_txt = "<hr>This player is in the top 100 earners this week!";
            }

            let note = "";
            let note_txt = "";
            if(has_note) {
              note = note_icon;
              note_txt = "<br /><hr><b>Notes</b>: " + escapeHTML(player_notes[villain_name]);
              note_txt = note_txt.replace(/(?:\r\n|\r|\n)/g, '<br>');

            }

            let favstreet_str = "";
            let fav_street = "";
            if(typeof historical_street !== "undefined" && historical_street > 0) {
              if(historical_street < 1.5) {
                 fav_street = "folds preflop";
              } else if(historical_street <= 2.5) {
                 fav_street = "checks out the flop";
              } else if(historical_street <= 3.5) {
                 fav_street = "sticks to the turn";
              } else if(historical_street >= 3.5) {
                 fav_street = "reaches the river";
              }
              favstreet_str = "<hr>This villain typically " + fav_street;
            }

            let bbh_str = "";
            let win_str = "";
            let win_amount = "0.0";
            if(typeof historical_bb100 !== "undefined") {
              if(Number(historical_bb100).toFixed(1) < 0) {
                win_str = "loses";
                win_amount = Math.abs(Number(historical_bb100).toFixed(1));
              } else {
                win_str = "makes";
                win_amount = Number(historical_bb100).toFixed(1);
              }
              bbh_str = "<hr />Villain " + win_str + " roughly " + win_amount + " big blinds per 100 hands.";
            }

            let famous_str = "";
            let famous_icon = "";

            if(typeof special_icons !== "undefined") {
              famous = special_icons[user_id.toString()];
              if(typeof famous !== "undefined") {
                famous_str = "<hr />" + famous[0];
                famous_icon = famous[1];
              }
            }
            if(typeof all_icons !== "undefined" && typeof special_icons !== "undefined" && famous_icon == "") {
              famous = all_icons[user_id.toString()];
              if(typeof famous == "undefined") {
                 famous_icon = all_icons[convertIdToEmoji(user_id)];
              }
            }

            let extra_info = sample_sizes + badge_txt + note_txt + last_showdown_string + favstreet_str + bbh_str + famous_str;
            let icon_box = "";
            let just_icon = "";
            if(villain_name == our_name && showtruth == "false") {
              just_icon = king_icon;
              icon_box = " <div class='tooltip'>" + king_icon + "<span class='tooltiptext'>" + villain_name + " is a king! Hello, your grace." + extra_info + " </span></div>";
            } else if(is_newbie === true) {
              just_icon = newbie_icon;
              icon_box = " <div class='tooltip'>" + newbie_icon + "<span class='tooltiptext'>" + villain_name + " does not have a significant hand history! Take these stats with a grain of salt. These stats are based on the following number of hands per category: " + extra_info + "</span></div>";
            } else if(is_clown === true) {
              just_icon = clown_icon;
              icon_box = " <div class='tooltip'>" + clown_icon + "<span class='tooltiptext'>" + villain_name + " is a clown! Prepare to be donked." + extra_info + " </span></div>";
            } else if(is_maniac === true) {
              just_icon = maniac_icon;
              icon_box = " <div class='tooltip'>" + maniac_icon + "<span class='tooltiptext'>" + villain_name + " is very aggressive. Trap this maniac." + extra_info + "</span></div>";
            } else if(is_calling_station === true) {
              just_icon = robot_icon;
              icon_box = " <div class='tooltip'>" + robot_icon + "<span class='tooltiptext'>" + villain_name + " is a calling station! Value bet all the way." + extra_info +"</span></div>";
            } else if(is_fish === true) {
              just_icon = fish_icon;
              icon_box = " <div class='tooltip'>" + fish_icon + "<span class='tooltiptext'>" + villain_name + " is a fish! Happy fishing." + extra_info + "</span></div>";
            } else if (is_shark === true) {
              just_icon = shark_icon;
              icon_box = " <div class='tooltip'>" + shark_icon + "<span class='tooltiptext'>" + villain_name + " is a shark! Be careful." + extra_info + "</span></div>";
            } else if (is_turtle === true) {
              just_icon = turtle_icon;
              icon_box = " <div class='tooltip'>" + turtle_icon + "<span class='tooltiptext'>" + villain_name + " is a turtle! They don't raise often." + extra_info + "</span></div>";
            } else {
              just_icon = rainbow_icon;
              icon_box = " <div class='tooltip'>" + rainbow_icon + "<span class='tooltiptext'>" + villain_name + " is diverse! It is hard to pin this player down." + extra_info + "</span></div>";
            }

            if(you_state.isSeated == false && apiKey.length < 10) {
              icon_box = just_icon;
            }

            postpend = "&nbsp;" + famous_icon + note;

            if(mini_stats == "true") {
              var infoSummaryHash = icon_box + villain_hud_mini.join("/") + postpend;
            } else {
              var infoSummaryHash = icon_box + villain_hud.join(", ") + postpend;
            }
            // Check whether the information is still the same as before. If so don't update the stats
            var infoIsExpired = false;
            if(!getWithExpiry("statsbox_" + user_id)) {
              setWithExpiry("statsbox_" + user_id, stringToId(infoSummaryHash), 60);
              infoIsExpired = true;
            } else {
              let previousHash = getWithExpiry("statsbox_" + user_id);
              if(previousHash != stringToId(infoSummaryHash)) {
                setWithExpiry("statsbox_" + user_id, stringToId(infoSummaryHash), 60);
                infoIsExpired = true;
              }
            }

            if(infoIsExpired == true) {
              $(this).find(".badgehud").html(icon_box)
              if(mini_stats == "true") {
                $(this).find(".stats").html(villain_hud_mini.join("/") + postpend);
              } else {
                $(this).find(".stats").html(villain_hud.join(", ") + postpend);
              }
              if(isMobile) {
                fontsize = "7px";
              } else {
                fontsize = "11px";
              }
              $(this).find(".stats").attr("style","border-radius: 5px; font-size: " + fontsize + "; background: #000; left:8px; z-index: 99999; position: relative; padding: 2px 5px 2px; text-align: center");
            }
          }
        });
        //if(!isMobile) {
        addTableDiv();
        //}

        var chips_in_play = getGrandTotalChipsInPlay();

        var profit_loss = 0;
        var profit_loss_string = "Winnings";
        var profit_loss_colour = "#85DE77";
        var quantity = "";
        if(typeof transaction_history !== "undefined") {
          if(typeof you_state !== "undefined") {
            profit_loss += you_state.balance;
            if(typeof you_state.inPlay !== "undefined") {
              profit_loss += you_state.inPlay[table_state.currency];
            }
            if(typeof transaction_history["transactions"] !== "undefined") {
              for (t of transaction_history["transactions"]) {
                if(t.type == "DEPOSIT") {
                  profit_loss -= t.amount;
                }
                if(t.type == "WITHDRAWAL") {
                  profit_loss += t.amount;
                }
              }
            }
          }
          if(profit_loss >= 1000000 || profit_loss <= -1000000) {
            var q = 1000000;
            quantity = "M";
          } else if(profit_loss >= 1000 || profit_loss <= -1000) {
            var q = 1000;
            quantity = "K";
          } else {
            var q = 1;
          }
          if(profit_loss < 0) {
            profit_loss_string = "Losses";
            profit_loss_colour = "#FF756D";
            profit_loss = Math.abs((profit_loss / q).toFixed(2));
          } else {
            profit_loss = (profit_loss / q).toFixed(2);
          }
        }
        var open_tables_summary = [];

        if (typeof open_tables !== "undefined" && open_tables) {
          try {
            for (t of open_tables) {
              var has_stats = false;
              if(typeof tableStats[t.id] != "undefined") {
                has_stats = true;
              }
              let filter_threshold = 500;
              if(t.currency == "BTC") {
                filter_threshold = 50;
              }
              // Limit to >= 1K BB, public tables, 6-max or higher with at least 2 active players
              if(t.seatsTaken < 2 || t.numSeats < 6 || t.currency != window.table.currency || t.smallBlindAmount < filter_threshold || t.isPrivate == true) {
                if(has_stats == false) {
                  continue;
                }
              }

              if(table_state.name != t.name)
              {
                if(has_stats == false) {
                  open_tables_summary.push("<span class='tabtable' id='" + t.id + "' style='cursor: pointer; color: #fff;'>" + t.name.substring(0, 15) + "</span> " + (displayNumber((t.smallBlindAmount*2)/1000)) + "k [" + t.seatsTaken + "/" + t.numSeats + "] <span class='tabtable' id='"+ t.id + "' style='cursor: pointer; color: #fff;'>&#128279;</span>");
                } else {
                  open_tables_summary.push("<span class='tabtable' id='" + t.id + "' style='cursor: pointer; color: #fff;'>" + t.name.substring(0, 15) + "</span> " + (displayNumber((t.smallBlindAmount*2)/1000)) + "k [" + t.seatsTaken + "/" + t.numSeats + "/<font color='green'><div class='tooltip'><b>" + tableStats[t.id].length + "</b><span class='tooltiptext'>" + tableStats[t.id].sort().join(", ") + "</span></div></font>] <span class='tabtable' id='"+ t.id + "' style='cursor: pointer; color: #fff;'>&#128279;</span>");
                }
              }
            }
          } catch(e) {
          }
        }

        var tournament_tables_summary = [];
        if(typeof tournament_tables !== "undefined") {
          for (t of tournament_tables) {
            var startTime = Date.parse(t.startTime) / 1000;
            var myts = Math.round((new Date()).getTime() / 1000);

            if(t.isPrivate == true || t.buyInCost == 0 || t.isRegistrationOpen == false) {
              continue;
            }

            if (startTime <= myts) {
              var inMinutes = "LATEREG";
            } else {
              var startTimeSeconds = startTime - myts;
              var inMinutes = Math.floor(startTimeSeconds / 60);
            }

            tournament_tables_summary.push("<a href='https://blockchain.poker/?tournament=" + t.id + "&affiliate=d4dff027c362ce10bba1669a592896a6" + "' target='_new' style='color: #fff; text-decoration: none;'>" + t.currency + "</a> " + (displayNumber((t.buyInCost)/1000)) + "/" + (displayNumber((t.prizePool)/1000)) + "k <a href='https://blockchain.poker/?tournament=" + t.id + "&affiliate=d4dff027c362ce10bba1669a592896a6" + t.id + "' target='_new' style='color: #fff; text-decoration: none;'>[" + inMinutes + "min] &#128279;</a>");
          }
        }

        if(autotopup == "false") {
          autotopupstr = "<div class='tooltip autotopup'>OFF &#127770;<span class='tooltiptext'>Click to turn ON</span></div>";
        } else {
          autotopupstr = "<div class='tooltip autotopup'>ON &#127773;<span class='tooltiptext'>Click to turn OFF</span></div>";
        }
        if(showcashgames == "false") {
          showcashgamesstr = "SHOW";
          showcashgamesstyle = "none";
        } else {
          showcashgamesstr = "HIDE";
          showcashgamesstyle = "inline";
        }
        if(showlosers == "false") {
          showloserstr = "SHOW";
          showloserstyle = "none";
        } else {
          showloserstr = "HIDE";
          showloserstyle = "inline";
        }
        if(showwinners == "false") {
          showwinnerstr = "SHOW";
          showwinnerstyle = "none";
        } else {
          showwinnerstr = "HIDE";
          showwinnerstyle = "inline";
        }

        if(showtournaments == "false") {
          showtournamentsstr = "SHOW";
          showtournamentsstyle = "none";
        } else {
          showtournamentsstr = "HIDE";
          showtournamentsstyle = "inline";
        }
        if(showtoggles == "false") {
          showtogglesstr = "SHOW";
          showtogglesstyle = "none";
        } else {
          showtogglesstr = "HIDE";
          showtogglesstyle = "inline";
        }
        if(hualarm == "false") {
          hualarmstr = "<div class='tooltip hualarm'>OFF &#127770;<span class='tooltiptext'>Click to turn ON</span></div>";
        } else {
          hualarmstr = "<div class='tooltip hualarm'>ON &#127773;<span class='tooltiptext'>Click to turn OFF</span></div>";
        }
        if(hudchat == "false") {
          hudchatstr = "<div class='tooltip hudchat'>OFF &#127770;<span class='tooltiptext'>Click to turn on HUD chat</span></div>";
        } else {
          hudchatstr = "<div class='tooltip hudchat'>ON &#127773;<span class='tooltiptext'>Click to turn off HUD chat</span></div>";
        }
        if(seatsniper == false) {
          snipestr = "<div class='tooltip snipeseat'>OFF &#127770;<span class='tooltiptext'>Click to snipe</span></div>";
        } else {
          snipestr = "<div class='tooltip snipeseat'>ON &#127773;<span class='tooltiptext'>Click to unsnipe</span></div>";
        }
        if(showtruth == "false") {
          showtruthstr = "<div class='tooltip showtruth'>OFF &#127770;<span class='tooltiptext'>Click to turn ON</span></div>";
        } else {
          showtruthstr = "<div class='tooltip showtruth'>ON &#127773;<span class='tooltiptext'>Click to turn OFF</span></div>";
        }

        if(banned_users.includes(you_state.id)) {
          location.reload();
        }

        if(!isMobile || showsettings == true) {
          // &#128065;

          let tableinfo_arr = [
            "<table width=100%>",
            "<tr><td style=''><b>Cash games</b></td><td align='right'><div class='togglecash'>" + showcashgamesstr + "</div></td></tr>",
            "</table>",
            "<table width=100% style='display: " + showcashgamesstyle + ";'>",
            "<tr><td colspan=2 style='border-top: 1px solid #fff; border-bottom: 1px solid #fff;'>" + open_tables_summary.join("<br />") + "</td></tr>",
            "</table>",
          ].join("");

          let toggles_arr = [
            "<table width=100%>",
            "<tr><td><b>Settings</b></td><td align='right'><div class='toggletoggles'>" + showtogglesstr + "</div></td></tr>",
            "</table>",
            "<table width=100% style='display: " + showtogglesstyle + ";'>",
            "<tr><td style='border-top: 1px solid #fff;'>AutoTopUp</td><td style='border-top: 1px solid #fff;'>" + autotopupstr + "</td></tr>",
            "<tr><td>HeadsUpAlarm</td><td>" + hualarmstr + "</td></tr>",
            "<tr><td>Show own icon</td><td>" + showtruthstr + "</td></tr>",
            "<tr><td>Snipe seat</td><td>" + snipestr + "</td></tr>",
            "<tr><td>HUD Chat</td><td>" + hudchatstr + "</td></tr>",
            "</table>"
          ];
          if(isMobile) {
            toggles_arr.unshift("<td>&nbsp;</td><td><div class='settings'>&#9881;</div></td></tr>");
          }
          toggles = toggles_arr.join("");

          var loserboard = [];
          var winnerboard = [];
          var rendered_loserboard = "";
          var rendered_winnerboard = "";

          // Running cold list
          if(typeof highscores["losers"] !== "undefined") {
            let losers = highscores["losers"];
            var i = 0;
            for(loser in losers) {
              if(typeof you_state !== "undefined" && typeof you_state.id !== "undefined") {
                if(you_state.name == loser) {
                  continue;
                }
              }
              i++;
              if(i > 5) {
                continue;
              }

              if(!beta_users.includes(you_state.id)) {
                loserboard.push("<tr><td colspan=2>" + loser + "</td></tr>");
              } else {
                loserboard.push("<tr><td>" + i + ". " + loser + "</td><td>" + Math.ceil(((Math.abs(losers[loser]) / 100000000).toFixed(2)*100)) + "M" + "</td></tr>");
              }
            }
          }
          rendered_loserboard = "<hr /><table width=100%><tr><td><b>Running cold</b></td><td align='right'><div class='toggleloser'>" + showloserstr + "</div></td></tr></table><table width=100% style='display: " + showloserstyle + ";'>" + loserboard.join("") + "</table><hr>";

          // Running hot list
          if(typeof highscores["winners"] !== "undefined") {
            let winners = highscores["winners"];
            var i = 0;
            for(winner in winners) {
              i++;
              if(i > 5) {
                continue;
              }
              if(!beta_users.includes(you_state.id)) {
                winnerboard.push("<tr><td colspan=2>" + winner + "</td></tr>");
              } else {
                winnerboard.push("<tr><td>" + i + ". " + winner + "</td><td>" + Math.ceil(((Math.abs(winners[winner]) / 100000000).toFixed(2)*100)) + "M" + "</td></tr>");
              }
            }
          }
          rendered_winnerboard = "<table width=100%><tr><td><b>Running hot</b></td><td align='right'><div class='togglewinner'>" + showwinnerstr + "</div></td></tr></table><table width=100% style='display: " + showwinnerstyle + ";'>" + winnerboard.join("") + "</table><hr>";

          // Check whether the infobox needs to be refreshed
          let hh_button = "";
          if(jszip_initialized == true) {
              hh_button = "<table width=100%><tr><td class='handhistory' style='cursor:pointer;'>Download Hands</td><td align='right' class='handhistory' style='cursor:pointer;'>&#128588;</td></tr></table>";
          }
          
          if(mini_stats != "true") {
            ministats_button = "<table width=100%><tr><td class='ministats_min' style='cursor:pointer;'>Mini stats</td><td align='right' class='ministats_min' style='cursor:pointer;'>&#8600;&#65039;</td></tr></table>";
          } else {
            ministats_button = "<table width=100%><tr><td class='ministats_max' style='cursor:pointer;'>Maxi stats</td><td align='right' class='ministats_max' style='cursor:pointer;'>&#8599;&#65039;</td></tr></table>";
          }

          $(".ministats_min").on('click', function() {
            mini_stats = "true";
            localStorage.setItem('ministats', "true");
          });
          $(".ministats_max").on('click', function() {
            mini_stats = "false";
            localStorage.setItem('ministats', "false");
          });

          let infoboxHtml = "In play: " + displayNumber(chips_in_play.toFixed(2)) + "<br />Rewards: " + displayNumber(rewards_balance) + "<br />" + profit_loss_string + ": <font color='" + profit_loss_colour + "'>" + profit_loss + quantity + "</font><br /><table width=100%>" + tableinfo_arr + toggles + rendered_loserboard + rendered_winnerboard + hh_button + ministats_button + "<table width=100% class='licenseline'><tr><td>License</td><td align='right'><div class='license'><font color='#85DE77'><div class='licensekey'>Free</div></font></span></td></tr></table>";

          var infoboxIsExpired = false;
          if(!getWithExpiry("infobox")) {
            setWithExpiry("infobox", stringToId(infoboxHtml + window.table.id), 60);
            infoboxIsExpired = true;
          } else {
            let previousHash = getWithExpiry("infobox");
            if(previousHash != stringToId(infoboxHtml + window.table.id)) {
              setWithExpiry("infobox", stringToId(infoboxHtml + window.table.id), 60);
              infoboxIsExpired = true;
            }
          }
          if(infoboxIsExpired == true) {
            $(".infobox").html(infoboxHtml);
          }

          $(".tabtable").on('click', function() {
            newTab($(this).attr("id"));
          });


          $('.autotopup').on('click', function() {
            if(autotopup == "false") {
              localStorage.setItem('autotopup', "true");
              autotopup = "true";
            } else {
              localStorage.setItem('autotopup', "false");
              autotopup = "false";
            }
          });
          $('.togglecash').on('click', function() {
            if(showcashgames == "false") {
              localStorage.setItem('showcashgames', "true");
              showcashgames = "true";
            } else {
              localStorage.setItem('showcashgames', "false");
              showcashgames = "false";
            }
          });

          $('.toggleloser').on('click', function() {
            if(showlosers == "false") {
              localStorage.setItem('showlosers', "true");
              showlosers = "true";
            } else {
              localStorage.setItem('showlosers', "false");
              showlosers = "false";
            }
          });
          $('.togglewinner').on('click', function() {
            if(showwinners == "false") {
              localStorage.setItem('showwinners', "true");
              showwinners = "true";
            } else {
              localStorage.setItem('showwinners', "false");
              showwinners = "false";
            }
          });

          $('.toggletourn').on('click', function() {
            if(showtournaments == "false") {
              localStorage.setItem('showtournaments', "true");
              showtournaments = "true";
            } else {
              localStorage.setItem('showtournaments', "false");
              showtournaments = "false";
            }
          });
          $('.toggletoggles').on('click', function() {
            if(showtoggles == "false") {
              localStorage.setItem('showtoggles', "true");
              showtoggles = "true";
            } else {
              localStorage.setItem('showtoggles', "false");
              showtoggles = "false";
            }
          });
          $(".hudchat").on('click', function() {
            if(hudchat == "false") {
              localStorage.setItem('hudchat', "true");
              hudchat = "true";
            } else {
              localStorage.setItem('hudchat', "false");
              hudchat = "false";
            }
          });
          $('.hualarm').on('click', function() {
            if(hualarm == "false") {
              localStorage.setItem('hualarm', "true");
              hualarm = "true";
            } else {
              localStorage.setItem('hualarm', "false");
              hualarm = "false";
            }
          });
          if(typeof you_state !== "undefined" && you_state.isSeated == true) {
            seatsniper = false;
          }
          $(".snipeseat").on('click', function() {
            if(seatsniper == false) {
              seatsniper = true;
            } else {
              seatsniper = false;
            }
          });

          if(seatsniper == true) {
            grabSeat(table_state.id);
          }

          $('.showtruth').on('click', function() {
            if(showtruth == "false") {
              localStorage.setItem('showtruth', "true");
              showtruth = "true";
            } else {
              localStorage.setItem('showtruth', "false");
              showtruth = "false";
            }
          });


          $(".licensekey").on('click', function() {
            $(".licensekeydialogue").toggle();
          });
        } else {
            $(".infobox").html("<tr><td>&nbsp;</td><td><div class='settings'>&#9881;</div></td></tr>");
          $(".dealer-indication").on('click', function() {
            $(".licensekeydialogue").toggle();
          });
        }

        $(".settings").on('click', function() {
          if(showsettings == false) {
            showsettings = true;
          } else {
            showsettings = false;
          }
        });

        var hud_prefix = "";

        // Extract last hand value from hand history
        if(typeof hand_history.seats !== "undefined") {
          for(x of hand_history.seats) {
            hand_history_map[x.account.toString()] = x.handRank;
          }
        }

        if(autotopup == "true") {
          if(typeof table_state !== "undefined" && typeof you_state !== "undefined") {
            topup_btn = $("button[ng-disabled='pendingOptions.topUp']");
            if($(topup_btn).is(":visible")) {
              let max_buyin = table_state.maxBuyIn;
              let blind_size = table_state.bigBlindAmount;
              let my_stack = you_state.stack;
              // Only top up when at least 2 big blinds below max
              if(my_stack < (max_buyin - blind_size)) {
                topup_btn.click();
              }
            }
          }
        }

        // Display villain hole cards
        if(preflopCardsDisplay) {
          hud_display.push("<font color='white'>hero</font>: " + preflopCardsDisplay);
        }

        // Add EV of our starting hand. Only add for valid hands (> - 100)
        if (ev > -100) {
          if(ev < 0) {
            hud_display.push("<font color='#FF756D'>EV: " + ev + "</font>");
          } else {
            hud_display.push("<font color='#85DE77'>EV: " + ev + "</font>");
          }
        }

        // Work in progress
        var potodds = 0;
        /*
        var call_amount = getCallAmount();
        if(typeof call_amount !== "undefined" && call_amount > 0) {
          potodds = ((getPot() + getActiveBets() + call_amount) / call_amount).toFixed(2);
        }
        */

        // Add community cards
        let poker_board = [flopCardsDisplay, turnCardsDisplay, riverCardsDisplay].filter(function(x) { return x != ""})
        if(poker_board.length > 0) {
          hud_display.push("<font color='white'>board</font>: " + poker_board.join(" "));
        }

        // Display the current pot size (including current bets made)
        if(potodds > 0) {
          hud_display.push("<font color='white'>pot</font>: " + displayNumber((getPot() + getActiveBets())) + " (odds: " + potodds + "%)");
        } else {
          hud_display.push("<font color='white'>pot</font>: " + displayNumber((getPot() + getActiveBets())));
        }

        if(handStrength != "undefined" && handStrength != "") {
          hud_display.push('(<font color="#FFF49C">' + handStrength + '</font>)');
        }

        // Check whether the top hud display needs to be refreshed
        let benderboxHtml = hud_display.join(", ");
        var benderboxIsExpired = false;
        if(!getWithExpiry("benderbox")) {
          setWithExpiry("benderbox", stringToId(benderboxHtml), 60);
          benderboxIsExpired = true;
        } else {
          let previousHash = getWithExpiry("benderbox");
          if(previousHash != stringToId(benderboxHtml)) {
            setWithExpiry("benderbox", stringToId(benderboxHtml), 60);
            benderboxIsExpired = true;
          }
        }
        if(benderboxIsExpired == true) {
          $(".benderhud").html(benderboxHtml);
        }
      }
      gameTick++;
    }
    window.setInterval(function(){
      getUpdate();
    }, 2000);
    window.setInterval(function(){
      updateGame();
    }, 1000);
  }

  blockchainPokerHUD();
});

