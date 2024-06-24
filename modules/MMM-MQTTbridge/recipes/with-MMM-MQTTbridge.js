/* eslint-disable indent */
/**  MMM-MQTTbridge commands addon       **/
/**  modify pattern to your language  **/
/**  for MMM-MQTTbridge **/
/**  sergge1  **/

var recipe = {
    transcriptionHooks: {
        "LED_TURN_ON": {
            pattern: "включить подсветку",
            command: "LED_TURN_ON"
        },
        "LED_TURN_OFF": {
            pattern: "выключить подсветку",
            command: "LED_TURN_OFF"
        },
        "LED_COLOR_RED": {
            pattern: "красная подсветка",
            command: "LED_COLOR_RED"
        },
        "LED_COLOR_BLUE": {
            pattern: "голубая подсветка",
            command: "LED_COLOR_BLUE"
        },
        "LED_COLOR_YELLOW": {
            pattern: "желтая подсветка",
            command: "LED_COLOR_YELLOW"
        },
        "LED_COLOR_NEON": {
            pattern: "неоновая подсветка",
            command: "LED_COLOR_NEON"
        },
        "LED_COLOR_CYAN": {
            pattern: "синяя подсветка",
            command: "LED_COLOR_CYAN"
        },
        "LED_COLOR_GREEN": {
            pattern: "зелёная подсветка",
            command: "LED_COLOR_GREEN"
        }
    },
    commands: {
        "LED_TURN_ON": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_turn_on"
            },
        },
        "LED_TURN_OFF": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_turn_off"
            },
        },
        "LED_COLOR_RED": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_red"
            }
        },
        "LED_COLOR_BLUE": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_blue"
            }
        },
        "LED_COLOR_YELLOW": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_yellow"
            }
        },
        "LED_COLOR_NEON": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_neon"
            }
        },
        "LED_COLOR_CYAN": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_cyan"
            }
        },
        "LED_COLOR_GREEN": {
            notificationExec: {
                notification: "NOTI_TO_MQTT",
                payload: "led_color_green"
            }
        }
    }
}

exports.recipe = recipe // Don't remove this line.