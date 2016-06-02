# Module: Calendar2

**NOTE: This module is still actively being developed!**
**What to expect:** Things can suddenly break! 
**What not to expect:** Things not to break!
*If you are using this, it's likely because I told you to come try it. As such, if you
encounter a problem, please let me know personally as opposed to putting it up on the
forum, at least till it's officially released.*

The `calendar2` module is (currently) a simple month view calendar.

## Using the module
To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
			{
				module: 'calendar2',
				position: 'top_left',
				config: {
						// The config property is optional
						// Without a config, a default month view is shown
						// Please see the 'Configuration Options' section for more information
				}
			}
]
````

## Configuration options
The `calendar2` module has several optional properties that can be used to change its behaviour:

<table>
	<thead>
		<tr>
			<th>Option</th>
			<th>Description</th>
			<th>Default</th>
		</tr>
	</thead>
	<tfoot>
		<tr>
			<th>&nbsp;</th>
		</tr>
	</tfoot>
	<tbody>
		<tr>
			<td><code>showHeader</code></td>
			<td>This allows you to turn on or off the header on the calendar.
			    The header consists of the month and year.</td>
			<td><code>true</code></td>
		</tr>
		<tr>
			<td><code>cssStyle</code></td>
			<td>Calendar2 allows you to use a custom CSS to style your calendar, or
			    you can use one of the built-in ones. Please read the 'CSS Styling'
				section for more information.</td>
			<td><code>default</code> Other options are <code>block</code> and <code>custom</code>. Others
			    may be added in the future.</td>
		</tr>
	</tbody>
</table>

## Custom CSS Styling
The `calendar2` module creates a table that contains the various elements of the calendar. Most of
the relevant elements are tagges with either a <code>class</code> or <code>id</code> making it possible
for anyone to make changes to the default styling.

The full element tree is as follows:
````javascript
<table id="calendar-table">
  <thead>
    <tr>
	  <th id="calendar-th">
	    <span id="monthName">[month name]</span>
		<span id="yearDigits">[4 digit year]</span>
	  </th>
	</tr>
  </thead>
  
  <tfoot>
    <tr>
	  <td> </td>
	</tr>
  </tfoot>
  
  <tbody>
    <tr id="calendar-header">
	  <td class="calendar-header-day">[day name]</td>
	  /* Repeat above block 7 times for each day of the week, Sun/Mon/Tue/etc. */
	  /* ... */
	</tr>
	<tr>
	  <td class="calendar-day">
	    <div class="square-box">
		  <div class="square-content">
		    <div>
			  <span [class="... read Note #1 below ..."]>[date number]</span>
			</div>
		  </div>
		</div>
	  </td>
	  /* Repeat above block 7 days, once for each day */
	  /* ... */
	 </tr>
	 /* Repeat above block as many times as there are weeks in the month */
	 /* ... */
  </tbody>
</table>
````

Note #1:
If the date being displayed is:
- from a previous or next month, the *class* name will be <code>monthPrevNext</code>
- the current day, the *ID* name will be <code>today</code>
- any other day of the month, there will be no class nor id name assigned.

To create your own styling, navigate to the `modules/calendar2/` folder and open the file called
<code>styleCustom.css</code>. Take a look at the various elements already defined and start
playing with them.

**Hint:** It's useful to set your <code>cssStyle</code> to <code>custom</code> and see what that
looks like before you start making changes. This will serve as a reference when you're looking at
the CSS file.
