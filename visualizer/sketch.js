let mood = null
let energy = null
let rotation = 0

function setMood(m)
{
    mood = m

    // remove active from all
    document.querySelectorAll('.moods p').forEach(el => el.classList.remove('active'))

    // add active to the matching one
    const map = {
        aggressive: '#a',
        melancholic: '#m',
        tense: '#t',
        calm: '#c',
        euphoric: '#e'
    }
    document.querySelector(map[m]).classList.add('active')
    setBackgroundMood(m)
}

function setEnergy(e)
{
    energy = e
}

function setup()
{
    createCanvas(windowWidth, windowHeight);
    initBackground();
}

function drawBars(inner, barLength, rotation = 0)
{
    push()

    translate((windowWidth / 2), (windowHeight / 2))
    translate(0, -50)
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
    clear()   // transparent each frame so the bg canvas shows through

    switch(mood){
        case "euphoric":
            stroke(128, 0, 128)
            drawBars(100, 230)
            break;

        case "calm":
            stroke(46, 139, 87)
            drawBars(100, 180)
            break;

        case "aggressive":
            stroke(220, 20, 60)
            drawBars(100, 300)
            break;

        case "melancholic":
            stroke(30, 144, 255)
            drawBars(100, 150)
            break;

        case "tense":
            stroke(244, 164, 96)
            drawBars(100, 260)
            break;

        default:
            stroke(255, 255, 255)
            rotation += 0.004
            drawBars(100, 5, rotation)
    }
}

const audioEl = new Audio()
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 2048

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
    document.querySelector('#play-btn').textContent = '▶'
})

audioEl.addEventListener('timeupdate', () => {
    document.querySelector('#current-time').textContent = formatTime(audioEl.currentTime)
    document.querySelector('#progress').value = audioEl.currentTime
})

audioEl.addEventListener('ended', () => {
    audioEl.currentTime = 0
    document.querySelector('#progress').value = 0
    document.querySelector('#current-time').textContent = '0:00'
    document.querySelector('#play-btn').textContent = '▶'
})

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        document.querySelector('#play-btn').click()
    }
})

document.querySelector('#upload-btn').addEventListener('click', () => {
    document.querySelector('#audio-file').click()
    document.querySelector('#play-btn').textContent = '▶'
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

document.querySelector('#info-btn').addEventListener('click', () => {
    document.querySelector('.overlay').style.display = 'block'
})

document.querySelector('.overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.style.display = 'none';
    }
})
