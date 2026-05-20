let mood = null

function setMood(m){
    mood = m
}

function setup() 
{    
    createCanvas(400, 400);
}

function draw() 
{
    switch(mood){
        case "euphoric":
            background('purple');
            break;

        case "calm":
            background('green');
            break;

        case "aggressive":
            background('red');
            break;

        case "melancholic":
            background('blue');
            break;

        case "tense":
            background('orange')
            break;

        default:
            background('black')
    }
}

const input = document.querySelector('#audio-file')
input.addEventListener('change', (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("audio", file)

    //fetch
    fetch("http://localhost:8000/MULTIMEDIA_FINAL_PROJECT",{
        method: "POST",
        body: formData
    })

    .then(res => res.json())
    .then(data => {
        console.log(data.mood)
        setMood(data.mood)
    })
})