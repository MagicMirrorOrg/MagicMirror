// Static design review only: no live departures, weather, calendar or automatic scheduling.
const board = document.querySelector(".board");
const buttons = document.querySelectorAll("button[data-mode]");
const eventsToggle = document.querySelector("#show-events");

function render(mode) {
  const goingHome = mode === "home";
  board.dataset.mode = mode;
  board.dataset.events = eventsToggle.checked ? "some" : "none";
  for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  document.querySelector("#clock").textContent = goingHome ? "16:10" : "09:36";
  document.querySelector("#hero-title").textContent = goingHome ? "God tur hjem" : "God morgen";
  document.querySelector("#weather-summary").innerHTML = goingHome ? "Opphold på vei hjem." : "Lettskyet nå.<br><strong>Opphold utover dagen.</strong>";
  document.querySelector("#events-panel").hidden = goingHome || !eventsToggle.checked;
  document.querySelector("#departures-panel").hidden = !goingHome;
}

for (const button of buttons) button.addEventListener("click", () => render(button.dataset.mode));
eventsToggle.addEventListener("change", () => render(board.dataset.mode));
render("workday");
