<?php
//	$url = 'https://p01-calendarws.icloud.com/ca/subscribe/1/n6x7Farxpt7m9S8bHg1TGArSj7J6kanm_2KEoJPL5YIAk3y70FpRo4GyWwO-6QfHSY5mXtHcRGVxYZUf7U3HPDOTG5x0qYnno1Zr_VuKH2M';
	$url = 'https://www.google.com/calendar/ical/fe6uf7leq12i02lo3n9cvrdqa4%40group.calendar.google.com/private-0e7af4d1eadf1b09b4a3dc88be039a23/basic.ics';
	echo file_get_contents($url);
