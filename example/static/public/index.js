const countContainer = document.getElementById("count");
const plusBtn = document.getElementById("plusBtn");
let count = 0;
plusBtn.addEventListener("click", () => {
  count++;
  countContainer.textContent = count.toString();
});
