import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const links = opts?.links ?? {}

    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>© Alex Lugovskoy</p>

        <p>
          Materials may be used for non-commercial educational purposes with
          attribution and a link to the source.
        </p>

        <p>Commercial use and AI/dataset use require permission.</p>

        <p>
  <a href="/license/">License</a> ·{" "}
  <a href="/contact/">Contact</a>
  <p style={{
  fontSize: "0.8rem",
  opacity: 0.65,
  marginTop: "1rem"
}}>
  Found a typo? Select text and press Ctrl/Cmd+Enter
  <br />
  מצאתם שגיאה? סמנו טקסט ולחצו Ctrl/Cmd+Enter
</p>
</p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor