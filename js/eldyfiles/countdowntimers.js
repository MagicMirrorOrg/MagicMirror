const COUNTDOWNLIST = [
	{
		name: "KSP2",
		date: "February 24 2023"
	},
	{
		name: "Maddie Bday",
		date: "May 28 2023"
	},
	{
		name: "Eldy Bday",
		date: "June 8 2023"
	}
];

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// TODO MAKE TIMER ACKNOWLEDGE THINGS THAT HAVE TAKEN PLACE ALREADY

const parseCountdownsAsDivList = () => {
	const timeUntils = COUNTDOWNLIST.map((item) => {
		const n = Date.now();
		const t = new Date(item.date)[Symbol.toPrimitive]("number");
		return {
			...item,
			millisecondsUntil: t - n
		};
	});

	return timeUntils
		.map(
			(item) => `
        <div>
            <span>${item.name} >>> </span>
            <span>${Math.floor(item.millisecondsUntil / MILLISECONDS_PER_DAY)} days</span>
        </div>
    `
		)
		.join("");
};

const countdownUpdate = () => {
	document.getElementById("countDownTimers").innerHTML = parseCountdownsAsDivList();
};

const countdownRunner = () => {
	countdownUpdate();
	setInterval(countdownUpdate, HOUR_MS);
};

countdownRunner();
