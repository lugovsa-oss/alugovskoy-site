import { QuartzComponentConstructor } from "./types"

export default (() => {
  function CustomHeader() {
    return (
      <header class="al-site-header">
        <div class="al-logo-wrap">
          <a href="/" class="al-logo" aria-label="al-chemist.info home">
            <img src="/static/alchemist-logo.png" alt="al-chemist.info" />
          </a>
          <div class="al-tagline">Thoughts about the work and in its vicinity</div>
        </div>

        <nav class="al-main-nav" aria-label="Main navigation">
          <a href="/research/">Research</a>
          <a href="/publications/">Publications</a>
          <a href="/teaching/">Teaching</a>
          <a href="/courses/">Courses</a>
          <a href="/notes/">Garden</a>
          <a href="/tools/">Tools</a>
          <a href="/about/">About</a>
          <span class="al-lang"><a href="/">EN</a> / <a href="/he/">עברית</a></span>
        </nav>
      </header>
    )
  }

  return CustomHeader
}) satisfies QuartzComponentConstructor
