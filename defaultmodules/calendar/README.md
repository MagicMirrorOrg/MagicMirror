# Module: Calendar

The `calendar` module is one of the default modules of the MagicMirror².
This module displays events from a public .ical calendar. It can combine multiple calendars.

For configuration options, please check the [MagicMirror² documentation](https://docs.magicmirror.builders/modules/calendar.html).

## Date and time display

The date and time parts of an event can be shown independently. Both options default to `true`, which keeps the existing display:

| Option             | Type    | Default | Description                                                                                                                                                           |
| ------------------ | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `displayEventDate` | boolean | `true`  | Show the event date. With `timeFormat: "dateheaders"`, this controls the date headers and, when `showEnd` allows it, the end date shown for multi-day all-day events. |
| `displayEventTime` | boolean | `true`  | Show the start time for timed events. With `timeFormat: "dateheaders"`, this controls the time shown beside timed events.                                             |

For example, to show dates without event times:

```js
const config = {
  modules: [
    {
      module: "calendar",
      config: {
        displayEventDate: true,
        displayEventTime: false
      }
    }
  ]
};
```

`showEnd` and `showEndsOnlyWithDuration` continue to control whether event end information is shown. `showEnd` does not hide the event's start time.
