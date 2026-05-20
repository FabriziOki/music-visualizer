let mood = null
let energy = null

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

function drawBars(inner, barLength)
{
    push()
    
    translate(windowWidth / 2, windowHeight / 2)
    let outer = inner + (energy * barLength)

    for (let i = 0; i < 50; i++) 
    {   
        let angle = (i/50) * TWO_PI
        //start of bar
        let x1 = cos(angle) * inner
        let y1 = sin(angle) * inner
        // end of bar
        let x2 = cos(angle) * outer
        let y2 = sin(angle) * outer

        line(x1, y1, x2, y2)
    }

    pop()
}

function draw() 
{
    switch(mood){
        case "euphoric":
            background('purple')
            drawBars(80, 230)
            break;

        case "calm":
            background('green')
            drawBars(80,180)
            break;

        case "aggressive":
            background('red')
            drawBars(80, 300)
            break;

        case "melancholic":
            background('blue')
            drawBars(80, 150)
            break;

        case "tense":
            background('orange')
            drawBars(80, 260)
            break;

        default:
            background('black')
    }
}

const audioEl = new Audio()

document.querySelector('#play-btn').addEventListener('click', () => {
    audioEl.paused ? audioEl.play() : audioEl.pause()
})

document.querySelector('#volume').addEventListener('input', (e) => {
    audioEl.volume = e.target.value
})

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