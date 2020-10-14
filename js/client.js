/*
 * Contains all custom javascript code to run the web client.
 * Incorporates websockets and AJAX
 */

 $(document).ready(function() {
    //Functions for form submission
    $("#submit-ondemand-form").on("submit", function() {
        console.log("submit-ondemand-form form submitted!");
        var btn = $("#ondemand-btn");
        call_rest($(this),btn);
        return false;
    });

    $("#ws-btn").on("click", function() {
        buttonpressed = $(this);
        btn_text = buttonpressed.text();
        client.sendSocketMessage("Process this test message");
    });

    //Function for hiding bootstrap alerts
    $(function(){
        $("[data-hide]").on("click", function(){
            $(this).closest("." + $(this).attr("data-hide")).hide();
        });
    });

    console.log("Document ready!");
 });


function call_rest(form, btn) {
    var message = form.form2Dict();
    var btn_text = btn.text();
    var btn_spinner_html = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" id="spinner"></span>' + btn_text;
    btn.html(btn_spinner_html);
    btn.attr("disabled","disabled");
    $("#updatefield").append("Sending URL to server to execute request...<br>");
    jQuery().postJSON("/ajax", message, function(response) {
        console.log("Inspecting response...");
        if (response.status == 'failed') {
            $('#failed').show();
        }
        else {
            $('#completed').show();
        }
        $("#updatefield").append("Server replied with status: " + response.status + "<br>");
        $("#updatefield").append("Response body: " + "<br>");
        $("#updatefield").append(response.body + "<br>");
        var textfield = document.getElementById('textfield');
        textfield.scrollTop = textfield.scrollHeight;
        console.log(response);
        btn.empty();
        btn.text(btn_text);
        btn.removeAttr("disabled");
    });
}

//jQuery extended (custom) functions defined...
jQuery.fn.extend({
    form2Dict: function() {
        var fields = this.serializeArray();
        var json = {};
        $.each(fields, function(i,v) {
            json[fields[i].name] = fields[i].value;
        });
        if (json.next) delete json.next;
        return json;
    },
    postJSON: function(url, args, callback) {
        var settings = {
          "url": url,
          "method": "POST",
          "timeout": 0,
          "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          "data":JSON.stringify(args),
        };
        $.ajax(settings).done(function (response) {
            console.log("Received response from AJAX call, executing callback...");
            if (callback) callback(JSON.parse(response));
        });
    },
    cleanJSON: function(the_json) {
        // preserve newlines, etc - use valid JSON
        var s = the_json.replace(/\\n/g, "\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
        // remove non-printable and other non-valid JSON chars
        s = s.replace(/[\u0000-\u0019]+/g,"");
        return s;
    },
});

// Web client javascript functions (including websocket client code)...
var client = {
    queue: {},

    // Connects to Python through the websocket
    connect: function (port) {
        var self = this;
        console.log("Opening websocket to ws://" + window.location.hostname + ":" + port + "/websocket");
        this.socket = new WebSocket("ws://" + window.location.hostname + ":" + port + "/websocket");

        this.socket.onopen = function () {
            console.log("Connected!");
        };

        this.socket.onmessage = function (messageEvent) {
//            var router, current, updated, jsonRpc;
            console.log("Got a message...");
            $("#updatefield").append(messageEvent.data + "<br>");
            var textfield = document.getElementById('textfield');
            textfield.scrollTop = textfield.scrollHeight;
            console.log(messageEvent.data);
        };
        return this.socket;
    },

    waitForSocketConnection: function(socket, callback) {
        setTimeout(function () {
            if (socket.readyState === 1) {
                console.log("Connection is made");
                if(callback != null){
                    callback();
                }
                return;

            } else {
                console.log("wait for connection...");
                waitForSocketConnection(callback);
            }
        }, 5); // wait 5 milisecond for the connection...
    },

    sendSocketMessage: function(message) {
         this.socket.send(JSON.stringify({method: "process_ws_message", params: {message: message}}));
    },

    buildResponseTable: function (results_data) {
        var results_data_json = JSON.parse($().cleanJSON(results_data));
        var table = $('#response_table'), row = null, data = null;
        var thead_html = '<thead><th style="text-align: center; vertical-align: middle;"><input type="checkbox" class="form-check-input" id="select-all"></th>';
        var first_item = results_data_json[0];
        var i = 1;
        $.each(first_item, function (k1, v1) {
            thead_html += '<th onclick="javascript:client.sortTable(' + i.toString() + ',\'response_table\')" style="cursor: pointer">' + k1 + '</th>';
            i += 1;
        });
        thead_html += '</thead>';
        var thead = $(thead_html);
        thead.appendTo(table);
        var tbody = $('<tbody></tbody>');
        tbody.appendTo(table);
        $.each(results_data_json, function(k1, v1) {
            var row = $('<tr id="'+v1['fdn']+'"></tr>');
            var checkbox_html = '<td style="text-align: center; vertical-align: middle;"><input type="checkbox" class="form-check-input" id="'+v1['fdn']+'"></td>';
            $(checkbox_html).appendTo(row);
            $.each(v1, function (k2, v2) {
                $('<td>'+v2+'</td>').appendTo(row);
            });
            row.appendTo(tbody);
        });
        $('#select-all').click(function (e) {
            $(this).closest('#response_table').find('td input:checkbox').prop('checked', this.checked);
        });
    },

    sortTable: function (n, table_id) {
        var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        table = document.getElementById(table_id);
        switching = true;
        // Set the sorting direction to ascending:
        dir = "asc";
        /* Make a loop that will continue until
        no switching has been done: */
        while (switching) {
            // Start by saying: no switching is done:
            switching = false;
            rows = table.rows;
            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
              // Start by saying there should be no switching:
              shouldSwitch = false;
              /* Get the two elements you want to compare,
              one from current row and one from the next: */
              x = rows[i].getElementsByTagName("TD")[n];
              y = rows[i + 1].getElementsByTagName("TD")[n];
              /* Check if the two rows should switch place,
              based on the direction, asc or desc: */
              if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                  // If so, mark as a switch and break the loop:
                  shouldSwitch = true;
                  break;
                }
              } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                  // If so, mark as a switch and break the loop:
                  shouldSwitch = true;
                  break;
                }
              }
            }
            if (shouldSwitch) {
              /* If a switch has been marked, make the switch
              and mark that a switch has been done: */
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              // Each time a switch is done, increase this count by 1:
              switchcount ++;
            } else {
              /* If no switching has been done AND the direction is "asc",
              set the direction to "desc" and run the while loop again. */
              if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
              }
            }
        }
    }
};

