/* global Module */

/* Magic Mirror
 * Module: MMM-Traffic
 *
 * By Sam Lewis https://github.com/SamLewis0602
 * MIT Licensed.
 */

Module.register('MMM-Traffic', {

    defaults: {
        api_key: '',
        mode: 'driving',
        interval: 300000, //all modules use milliseconds
        origin: '',
        destination: '',
        traffic_model: 'best_guess',
        departure_time: 'now',
        loadingText: 'Loading commute...',
        prependText: 'Current commute is',
        changeColor: false,
        limitYellow: 10,
        limitRed: 30,
        showGreen: true,
        language: config.language,
        show_summary: true
    },

    start: function() {
        Log.info('Starting module: ' + this.name);
        if (this.data.classes === 'MMM-Traffic') {
          this.data.classes = 'bright medium';
        }
        this.loaded = false;
        this.url = 'https://maps.googleapis.com/maps/api/directions/json' + this.getParams();
        this.symbols = {
            'driving': 'fa fa-car',
            'walking': 'fa fa-odnoklassniki',
            'bicycling': 'fa fa-bicycle',
            'transit': 'fa fa-train'
        };
        this.commute = '';
        this.summary = '';
        this.updateCommute(this);
    },

    updateCommute: function(self) {
        self.sendSocketNotification('TRAFFIC_URL', self.url);
        setTimeout(self.updateCommute, self.config.interval, self);
    },

    getStyles: function() {
        return ['traffic.css', 'font-awesome.css'];
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        var commuteInfo = document.createElement('div'); //support for config.changeColor

        if (!this.loaded) {
            wrapper.innerHTML = this.config.loadingText;
            return wrapper;
        }

        //symbol
        var symbol = document.createElement('span');
        symbol.className = this.symbols[this.config.mode] + ' symbol';
        commuteInfo.appendChild(symbol);

        //commute time
        var trafficInfo = document.createElement('span');
        trafficInfo.innerHTML = this.config.prependText + ' ' + this.commute;
        commuteInfo.appendChild(trafficInfo);

        //change color if desired and append
        if (this.config.changeColor) {
          if (this.trafficComparison >= 1 + (this.config.limitRed / 100)) {
            commuteInfo.className += ' red';
          } else if (this.trafficComparison >= 1 + (this.config.limitYellow / 100)) {
            commuteInfo.className += ' yellow';
          } else if (this.config.showGreen) {
            commuteInfo.className += ' green';
          }
        }
        wrapper.appendChild(commuteInfo);

        //routeName
        if (this.config.route_name) {
          var routeName = document.createElement('div');
          routeName.className = 'dimmed small';
          if (this.summary.length > 0 && this.config.show_summary){
            routeName.innerHTML = this.config.route_name + ' via ' + this.summary; //todo translatable?
          } else {
            routeName.innerHTML = this.config.route_name;
          }
          wrapper.appendChild(routeName);
        }

        return wrapper;
    },

    getParams: function() {
        var params = '?';
        params += 'mode=' + this.config.mode;
        params += '&origin=' + this.config.origin;
        params += '&destination=' + this.config.destination;
        params += '&key=' + this.config.api_key;
        params += '&traffic_model=' + this.config.traffic_model;
        params += '&departure_time=now';
        params += '&language=' + this.config.language;
        return params;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'TRAFFIC_COMMUTE' && payload.url === this.url) {
            Log.info('received TRAFFIC_COMMUTE');
            this.commute = payload.commute;
            this.summary = payload.summary;
            this.trafficComparison = payload.trafficComparison;
            this.loaded = true;
            this.updateDom(1000);
        }
    }

});
