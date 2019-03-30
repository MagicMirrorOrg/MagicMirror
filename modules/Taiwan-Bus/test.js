// moment = require("moment")
// time = "2019-03-30T12:54:20+08:00"
// console.log(moment().format("LLLL"))
// console.log(moment().add(500,'seconds').format("LLLL"))

// a = moment()
// b= moment().add(500,'seconds')
// var duration =b.diff(a)
// //var duration = moment.duration(b.diff(a));

// console.log(moment.utc(duration).format("mm:ss"))
// console.log(typeof duration,duration)
const https = require("https");

request = require("request")
var url = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?%24select=StopName%2CRouteName%2CEstimateTime&%24filter=RouteName%2FZh_tw%20eq%20%27669%27&%24format=JSON&fbclid=IwAR3XpbneEyKq5RHiUpJGBDMaHIM9z4OQcqTZqqYfNSqs2tGJq9HT5oG0Jro"
request.get({
	url: url,
	headers: {

		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
		"Content-Type": "application/x-www-form-urlencoded",
		"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		"X-Compress": "null",
	}
}, (err, res, body) => {
	console.log(body)

})
// https.get(url, (resp) => {
//     let data = '';

//   // A chunk of data has been recieved.
//     resp.on('data', (chunk) => {
//         data += chunk;});
//   // The whole response has been received. Print out the result.
//   resp.on('end', () => {
//       console.log(data)
//     console.log(JSON.parse(data).explanation);
//   });

// }).on("error", (err) => {
//   console.log("Error: " + err.message);
// });