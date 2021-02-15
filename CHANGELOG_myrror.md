### 02-15-2020: weatherforecast and currentweather toggle fix

- both modules were calling this.show everytime
- new fix checks this.data.hidden value in config to decide whether to show the module or not
