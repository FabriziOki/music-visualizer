let mood = null
let energy = null
let rotation     = 0     // idle-state spin
let loadRotation = 0     // loading-state spin (separate so idle doesn't jump after load)
let loading  = false
let loadAlpha = 0        // 0 = invisible, 1 = fully visible — drives fade in/out

// Maps API mood string → HTML element ID
const MOOD_MAP = { aggressive: 'a', melancholic: 'm', tense: 't', calm: 'c', euphoric: 'e' }

// Subtle tint applied to the playback bar when a mood is detected.
// Keeps the glassmorphism feel while hinting at the mood's colour.
const MOOD_TINTS = {
    aggressive: 'rgba(220,  30,  60, 0.28)',
    melancholic:'rgba( 30, 144, 255, 0.28)',
    tense:      'rgba(244, 164,  96, 0.28)',
    calm:       'rgba( 46, 139,  87, 0.28)',
    euphoric:   'rgba(128,   0, 128, 0.28)',
}

// Toggle the play/pause icon without touching textContent.
function setPlayIcon(playing) {
    const ic = document.getElementById('play-icon')
    ic.classList.toggle('fa-play',  !playing)
    ic.classList.toggle('fa-pause',  playing)
}
// ITEM_STEP = item height (54px) + gap (6px) — must stay in sync with CSS
const ITEM_STEP = 60
let reelSetup = false

// Scroll the reel so `activeEl` sits in the viewport centre,
// then distribute active/adjacent classes based on distance.
function scrollReel(activeEl) {
    const items = [...document.querySelectorAll('.mood-item')]
    const activeIndex = items.indexOf(activeEl)

    // viewport centre = 90px; item centre at index i = i*60 + 27
    // translateY = 90 - (i*60 + 27) = 63 - i*60
    const translateY = 63 - activeIndex * ITEM_STEP
    document.querySelector('.mood-reel').style.transform = `translateY(${translateY}px)`

    items.forEach((el, i) => {
        el.classList.remove('active', 'adjacent')
        const dist = Math.abs(i - activeIndex)
        if (dist === 0) el.classList.add('active')
        else if (dist === 1) el.classList.add('adjacent')
    })
}

// Called once on first upload: removes the placeholder and adds
// wrap-around ghost items so the reel feels infinite.
function setupMoodReel() {
    if (reelSetup) return
    reelSetup = true

    document.getElementById('none')?.remove()

    const reel = document.querySelector('.mood-reel')

    // Ghost at top  = last mood  (wraps below Euphoric → Aggressive loop)
    const topGhost = document.createElement('div')
    topGhost.className = 'mood-item'
    topGhost.textContent = 'Euphoric'
    reel.insertBefore(topGhost, reel.firstChild)

    // Ghost at bottom = first mood (wraps above Aggressive → Euphoric loop)
    const botGhost = document.createElement('div')
    botGhost.className = 'mood-item'
    botGhost.textContent = 'Aggressive'
    reel.appendChild(botGhost)
}

function setMood(m)
{
    mood = m
    scrollReel(document.getElementById(MOOD_MAP[m]))
    setBackgroundMood(m)
    document.querySelector('.playback').style.background = MOOD_TINTS[m] ?? 'rgba(236,230,230,0.18)'
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

// Loading animation — alphaScale (0..1) drives the global fade in/out.
//   • Dots stay dots throughout (point(), not line()).
//   • Ring contracts inward spinning faster, then bounces back out.
//   • Ghost rings lag in rotation AND radius → spiral dot-trail.
//   • Tail only materialises while contracted (RADIUS_LAG * bounce → 0 when extended).
function drawLoadingAnimation(alphaScale) {
    push()
    translate(windowWidth / 2, windowHeight / 2)
    translate(0, -50)

    const t = frameCount * 0.038

    // Smooth contraction: raw cosine → smoothstep so contraction is snappier
    const raw    = 0.5 - 0.5 * cos(t * 1.7)
    const bounce = raw * raw * (3.0 - 2.0 * raw)   // smoothstep, 0 (extended) → 1 (contracted)
    const innerR = 100 - bounce * 70               // 100 → 30

    // Figure-skater spin: faster when tight
    loadRotation += 0.010 + bounce * 0.080

    const STEPS      = 8      // ghost rings for the trail
    const ANGLE_LAG  = 0.26   // rotational lag per ghost step  (radians)
    const RADIUS_LAG = 22     // radial lag per ghost step (px) — only visible when contracted

    for (let s = STEPS; s >= 0; s--) {
        const frac = s / STEPS                           // 0 = current, 1 = oldest

        const rot  = loadRotation - frac * ANGLE_LAG
        const r    = innerR + frac * RADIUS_LAG * bounce // ghosts are radially outside current ring

        const alpha   = (s === 0 ? 240 : (1.0 - frac) * 155) * alphaScale
        const dotSize = s === 0 ? 6 : 2 + (1.0 - frac) * 2.5

        push()
        rotate(rot)
        strokeWeight(dotSize)
        stroke(215, 220, 255, alpha)
        noFill()
        for (let i = 0; i < 50; i++) {
            const a = (i / 50) * TWO_PI
            point(cos(a) * r, sin(a) * r)
        }
        pop()
    }

    pop()
}

function draw()
{
    clear()   // transparent each frame so the bg canvas shows through

    // Smoothly fade the loading animation in when loading starts,
    // and fade it back out once the API responds — then hand off to bars.
    if (loading)       loadAlpha = min(1.0, loadAlpha + 0.035)
    else if (loadAlpha > 0) loadAlpha = max(0.0, loadAlpha - 0.035)

    if (loadAlpha > 0) {
        drawLoadingAnimation(loadAlpha)
        return
    }

    // Bar colours are light tints of each mood's own palette —
    // they blend harmoniously with the background while staying
    // bright enough to be visible against the darker midtones.
    switch(mood){
        case "aggressive":
            stroke(255, 220, 140)     // warm amber-cream  (light fire)
            drawBars(100, 220)
            break;

        case "melancholic":
            stroke(175, 210, 255)     // pale sky blue      (light on dark rain)
            drawBars(100, 220)
            break;

        case "tense":
            stroke(255, 245, 160)     // pale gold          (bright amber glow)
            drawBars(100, 220)
            break;

        case "calm":
            stroke(165, 255, 210)     // soft mint          (light seafoam)
            drawBars(100, 220)
            break;

        case "euphoric":
            stroke(235, 185, 255)     // pale lavender      (light on purple)
            drawBars(100, 220)
            break;

        default:
            stroke(215, 220, 255, 180) // cool blue-white   (idle nebula)
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
        setPlayIcon(true)
    } else {
        audioEl.pause()
        setPlayIcon(false)
    }
})

document.querySelector('#volume').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value)
    audioEl.volume = vol
    // Update percentage label
    document.getElementById('volume-pct').textContent = Math.round(vol * 100) + '%'
    // Swap icon based on level
    const ic = document.getElementById('volume-icon')
    ic.className = 'fa-solid ' + (vol === 0 ? 'fa-volume-xmark' : vol < 0.5 ? 'fa-volume-low' : 'fa-volume-high')
})

audioEl.addEventListener('loadedmetadata', () => {
    document.querySelector('#duration').textContent = formatTime(audioEl.duration)
    document.querySelector('#progress').max = audioEl.duration
    setPlayIcon(false)
})

audioEl.addEventListener('timeupdate', () => {
    document.querySelector('#current-time').textContent = formatTime(audioEl.currentTime)
    document.querySelector('#progress').value = audioEl.currentTime
})

audioEl.addEventListener('ended', () => {
    audioEl.currentTime = 0
    document.querySelector('#progress').value = 0
    document.querySelector('#current-time').textContent = '0:00'
    setPlayIcon(false)
})

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        document.querySelector('#play-btn').click()
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
        e.preventDefault()
        document.querySelector('#audio-file').click()
    }
})

document.querySelector('#upload-btn').addEventListener('click', () => {
    document.querySelector('#audio-file').click()
    setPlayIcon(false)
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

    // Show filename (strip extension) as track title
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    document.getElementById('track-title').textContent = nameWithoutExt

    // First upload: swap placeholder for the infinite mood reel
    setupMoodReel()

    // Reset to default background while the new song is being classified
    mood = null
    setBackgroundMood('default')
    document.querySelector('.playback').style.background = 'rgba(236,230,230,0.18)'

    loading = true

    const formData = new FormData()
    formData.append("file", file)

    fetch("http://localhost:8000/classify", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        loading = false
        setMood(data.mood)
        setEnergy(data.features.energy)
    })
    .catch(() => {
        loading = false
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
