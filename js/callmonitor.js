//connect do Call monitor
var socket = io.connect('http://localhost:1234');
socket.on('calling', function (data){
    if (data != 'clear'){
        if (data=="door"){
            $('#door').fadeIn(700);
            $('.lower-third').fadeOut(700);
        }
        else {
            $('#call').fadeIn(700);
            $('.lower-third').fadeOut(700);
            $('#caller').text(data);
        }
    }
    if (data == 'clear'){
    $('#call').fadeOut(700);
    $('#door').fadeOut(700);
    $('.lower-third').fadeIn(700);
    }
});