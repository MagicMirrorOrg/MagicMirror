jQuery.fn.updateWithText = function(text, speed)
{
	var dummy = $('<div/>').html(text);

	if ($(this).html() != dummy.html())
	{
		$(this).fadeOut(speed/2, function() {
			$(this).html(text);
			$(this).fadeIn(speed/2, function() {
				//done
			});
		});
	}
}

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function roundVal(temp)
{
	return Math.round(temp * 10) / 10;
}

jQuery(document).ready(function($) {

	var eventList = [];

	var lastCompliment;
	var compliment;

    moment.locale(config.lang);

	version.init();

	time.init();
	
	calendar.init();

	compliments.init();

	traffic.init();	
	
	weather.init();

	news.init();
	
});
