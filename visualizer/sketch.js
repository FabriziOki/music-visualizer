let mood = null
let energy = null
let rotation = 0

function setMood(m)
{
    mood = m
}
function setEnergy(e)
{
    energy = e
}

function setup() 
{    
    createCanvas(windowWidth, windowHeight);
}

function drawBars(inner, barLength, rotation = 0)
{
    push()

    translate(windowWidth / 2, windowHeight / 2)
    rotate(rotation)
    analyser.getByteFrequencyData(freqData)

    for (let i = 0; i < 50; i++) 
    {   
        let barHeight = freqData[i] * (barLength / 255)
        let outer = inner + barHeight

        let angle = (i/50) * TWO_PI
        //start of bar
        let x1 = cos(angle) * inner
        let y1 = sin(angle) * inner
        // end of bar
        let x2 = cos(angle) * outer
        let y2 = sin(angle) * outer

        strokeWeight(6)
        line(x1, y1, x2, y2)
    }

    pop()
}

function draw() 
{
    switch(mood){
        case "euphoric":
            background('black')
            stroke(128, 0, 128)
            drawBars(100, 230)
            break;

        case "calm":
            background('black')
            stroke(46, 139, 87)
            drawBars(100,180)
            break;

        case "aggressive":
            background('black')
            stroke(220, 20, 60)
            drawBars(100, 300)
            break;

        case "melancholic":
            background('black')
            stroke(30, 144, 255)
            drawBars(100, 150)
            break;

        case "tense":
            background('black')
            stroke(244, 164, 96)
            drawBars(100, 260)
            break;

        default:
            background('black')
            stroke(255,255,255)
            rotation += 0.004
            drawBars(100,5, rotation)
    }
}

const audioEl = new Audio()
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 1024

const source = audioContext.createMediaElementSource(audioEl)
source.connect(analyser)
analyser.connect(audioContext.destination)

const freqData = new Uint8Array(analyser.frequencyBinCount)

document.querySelector('#play-btn').addEventListener('click', () => {
     if (audioEl.paused) {
        audioEl.play()
        document.querySelector('#play-btn').textContent = '⏸'
    } else {
        audioEl.pause()
        document.querySelector('#play-btn').textContent = '▶'
    }
})

document.querySelector('#volume').addEventListener('input', (e) => {
    audioEl.volume = e.target.value
})

audioEl.addEventListener('loadedmetadata', () => {
    document.querySelector('#duration').textContent = formatTime(audioEl.duration)
    document.querySelector('#progress').max = audioEl.duration
})

audioEl.addEventListener('timeupdate', () => {
    document.querySelector('#current-time').textContent = formatTime(audioEl.currentTime)
    document.querySelector('#progress').value = audioEl.currentTime
})

audioEl.addEventListener('ended', () => {
    audioEl.currentTime = 0
    document.querySelector('#progress'),value = '0:00'
    document.querySelector('#current-time').textContent = '0:00'
})

document.querySelector('#upload-btn').addEventListener('click', () => {
    document.querySelector('#audio-file').click()
})

document.querySelector('#progress').addEventListener('input', (e) => {
    audioEl.currentTime = e.target.value
})

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

document.querySelector('#audio-file').addEventListener('change', (e) => {
    const file = e.target.files[0]
    audioEl.src = URL.createObjectURL(file)

    const formData = new FormData()
    formData.append("file", file)

    fetch("http://localhost:8000/classify", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        setMood(data.mood)
        setEnergy(data.features.energy)
    })
})