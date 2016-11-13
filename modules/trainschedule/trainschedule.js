/* global Module */

/* Magic Mirror
 * Module: trainschedule
 *
 * By Tyvonne
 */

Module.register("trainschedule", {

    // Default module config.
    defaults: {
        text: "Hello World!",
        train1: "05/11/2016 00:22",
        minutesRemainDelay: 20000,
        alarmRemainDelay: 3000,

        displaySymbol: true,
        defaultSymbol: "train"
    },

    // Define required css.
    getStyles: function () {
        return ["trainschedule.css"];
    },


    // Define start sequence.
    start: function () {

        // Schedule update interval.
        var self = this;
        setInterval(function () {
            self.updateDom();
        }, 1000);

    },

    // Override dom generator.
    getDom: function () {
        var wrapper = document.createElement("div");

        var now = new Date();
        for (var ti = 0; ti < this.config.trains.length; ti++) {

            var trainDate = this.config.trains[ti];
            var child = null;

            //Manage empty and loading data
            if (trainDate === "") {
                child = this.manageEmptyData();
            }
                //Target date for current train
            else if (ti == 0) {
                child = this.getTrainDate(now, trainDate, this.config.nextTrainText, this.config.nextDateText);
            } else {
                child = this.getTrainDate(now, trainDate, this.config.afterTrainText, this.config.afterDateText);
            }
            if (child) {
                child.style.opacity = 1 - ti * 0.8 / (this.config.trains.length - 1);
                wrapper.appendChild(child);
            }
        }
        return wrapper;
    },

    getTrainDate: function (now, targetDate, delayText, dateText) {

        //NOW
        //	    var year = now.getFullYear();
        //	    var month = now.getMonth();
        //	    var day = now.getDay();
        var hours = now.getHours();
        var minutes = now.getMinutes();

        //	    var targetDay = targetDate.substring(2, 0);
        //	    var targetMonth = targetDate.substring(3, 5);
        //	    var targetYear = targetDate.substring(6, 10);
        var targetHour = targetDate.substring(11, 13);
        targetHour = parseInt(targetHour);
        var targetMinute = targetDate.substring(14, 16);
        targetMinute = parseInt(targetMinute)
        var text = "";
        var textWrapper = document.createElement("p");
        textWrapper.className = "small";

        targetMinute = targetMinute + (targetHour * 60);
        minutes = minutes + (hours * 60);

        var remainTime = targetMinute - minutes;
        if (remainTime < 0) {
            remainTime = (1440 - minutes) + targetMinute;
        }
        
        var alarmRemainDelay = this.config.alarmRemainDelay;
        alarmRemainDelay = alarmRemainDelay / 1000;
        var minutesRemainDelay = this.config.minutesRemainDelay;
        minutesRemainDelay = minutesRemainDelay / 1000;

        if (alarmRemainDelay >= remainTime) {
            text = delayText.replace("%delay%", remainTime);
            textWrapper.style.color = "#FF0000";
        }else if (minutesRemainDelay >= remainTime) {
            text = delayText.replace("%delay%", remainTime);
        } else {
            var nextDate = targetDate.substring(11, 16);
            text = dateText.replace("%delay%", nextDate);
        }

        textWrapper.innerHTML = text;
        return textWrapper;

    },
    manageEmptyData: function () {
        var secondWrapper = document.createElement("p");
        secondWrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
        secondWrapper.className = "small dimmed";
        return secondWrapper;
    }
});