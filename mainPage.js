
//Play music
var audio = new Audio("sounds/Cloud Armada-TestSong.mp3");
audio.loop = true;
var counter = true;
var button = document.querySelector("#musicButton");
console.log(button);
function playMusic() {
    if (counter == true) {
        audio.play()
        button.innerHTML = "||"
        counter = false;
    } else {
        audio.pause()
        button.innerHTML = "▶"
        counter = true
    }
}