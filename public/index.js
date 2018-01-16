$(function() {

    // poor man's html template for a response table row
    function row(response, phone, time, duration) {
        var tpl = '<tbody><tr>';
        console.log("R IS ", response)
        
        // tpl += response.answer || 'pending...' + '</td>';
        tpl += `<td>${duration}s</td>`
        tpl += `<td>${time}</td>`
        tpl += `<td>${phone}</td>`
        if (response.recordingUrl) {
            tpl += '<td><a target="_blank" href="'
                + response.recordingUrl
                + '"><i class="fa fa-play"></i></a></td>';
        } else {
            tpl += '<td>N/A</td>';
        }
        tpl += '</tr></tbody>';
        return tpl;
    }

    // add text responses to a table
    function freeText(results) {
        console.log("RESULTS ARE ", results)
        
        var $responses = $('#turtleResponses');
        var content = '';
        for (var i = 0, l = results.length; i<l; i++) {
            var turtleResponse = results[i].responses[0];
            var phone = results[i].phone
            var time = results[i].responses[0].time
            var duration = results[i].responses[0].duration
            content += row(turtleResponse, phone, time, duration);
        }
        $responses.append(content);
    }

    function questionTitle(results) {
        var $q1 = $('#q1')
        var question = results[0].responses[0].currentQuestion
        console.log($q1)
        $q1.append(` - ${question}`)
    }

    // function durationSorter(a, b) {
    //     console.log("A IS ", A, "B IS ", B)
    //     if (a.month < b.month) return -1;
    //     if (a.month > b.month) return 1;
    //     return 0;
    // }

    // Load current results from server
    $.ajax({
        url: '/results',
        method: 'GET'
    }).done(function(data) {
        // Update charts and tables
        $('#total').html(data.results.length);
        // $('#turtleResponses').DataTable( {
        //     "paging":   false,
        //     "searching": false
        // } );
        freeText(data.results);
        questionTitle(data.results)
    }).fail(function(err) {
        console.log(err);
        alert('failed to load results data :(');
    });
});