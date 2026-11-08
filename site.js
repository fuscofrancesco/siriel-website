// Siriel website behaviour. Plain script, no dependencies.
//
// The only network request is to GitHub's public API, to point the download
// buttons at the newest .dmg. If it fails, the buttons keep their fallback
// href: the latest-release page, which always has it.

const RELEASES = 'fuscofrancesco/siriel-releases'

document.documentElement.classList.add('js')

function setUpNav() {
  const nav = document.querySelector('.nav')
  if (!nav) return
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 8)
  update()
  window.addEventListener('scroll', update, { passive: true })
}

function setUpReveal() {
  const items = document.querySelectorAll('.reveal')
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'))
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('in')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  items.forEach((el) => observer.observe(el))
}

async function resolveDownload() {
  const buttons = document.querySelectorAll('[data-download]')
  const versions = document.querySelectorAll('[data-version]')
  if (!buttons.length && !versions.length) return
  try {
    const res = await fetch(`https://api.github.com/repos/${RELEASES}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return
    const release = await res.json()
    const dmg = (release.assets || []).find((a) => /\.dmg$/i.test(a.name))
    if (dmg) buttons.forEach((b) => (b.href = dmg.browser_download_url))
    const version = String(release.tag_name || '').replace(/^v/, '')
    if (version) versions.forEach((v) => (v.textContent = `Version ${version}`))
  } catch {
    // Offline or rate-limited: the fallback link still works.
  }
}

// The editor's-note demo mirrors the app: each changed run is a toggle, and
// Accept applies exactly what the card shows.
function setUpDiffDemo() {
  const demo = document.querySelector('[data-diff-demo]')
  if (!demo) return
  const body = demo.querySelector('.demo-body')
  const hunks = [...demo.querySelectorAll('.hunk')]
  const hint = demo.querySelector('.demo-hint')
  const accept = demo.querySelector('.demo-accept')
  const reject = demo.querySelector('.demo-reject')
  const initialHint = hint.textContent

  const reset = () => {
    body.classList.remove('applied')
    hunks.forEach((h) => {
      h.setAttribute('aria-pressed', 'true')
      h.disabled = false
    })
    hint.textContent = initialHint
    accept.textContent = 'Accept'
    reject.hidden = false
  }

  hunks.forEach((h) =>
    h.addEventListener('click', () => {
      if (body.classList.contains('applied')) return
      const on = h.getAttribute('aria-pressed') === 'true'
      h.setAttribute('aria-pressed', String(!on))
      const kept = hunks.filter((x) => x.getAttribute('aria-pressed') === 'true').length
      hint.textContent = `${kept} of ${hunks.length} changes on`
    }),
  )

  accept.addEventListener('click', () => {
    if (body.classList.contains('applied')) return reset()
    body.classList.add('applied')
    hunks.forEach((h) => (h.disabled = true))
    const kept = hunks.filter((x) => x.getAttribute('aria-pressed') === 'true').length
    hint.textContent = `Applied ${kept} of ${hunks.length}. Nothing else moved.`
    accept.textContent = 'Try again'
    reject.hidden = true
  })

  reject.addEventListener('click', () => {
    hunks.forEach((h) => h.setAttribute('aria-pressed', 'false'))
    body.classList.add('applied')
    hint.textContent = 'Rejected. Your sentence is untouched.'
    accept.textContent = 'Try again'
    reject.hidden = true
  })
}

function setYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear())
  })
}

setUpNav()
setUpReveal()
setUpDiffDemo()
setYear()
resolveDownload()
