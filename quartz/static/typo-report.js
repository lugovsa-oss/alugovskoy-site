(function () {
  const ENDPOINT = "/api/typo-report"

  function getSelectionText() {
    return window.getSelection().toString().trim()
  }

  async function sendTypoReport(selectedText) {
    const comment = window.prompt(
      "Found a typo or error? Add a short comment:",
      selectedText
    )

    if (comment === null) return

    const payload = {
      page_url: window.location.href,
      selected_text: selectedText,
      comment: comment,
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()

    if (!response.ok || !text.includes('"ok":true')) {
      alert("Sorry, the report was not sent.")
      console.error("Typo report failed:", text)
      return
    }

    alert("Thank you! The report was sent.")
  }

  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      const selectedText = getSelectionText()

      if (!selectedText) return

      event.preventDefault()
      sendTypoReport(selectedText)
    }
  })
})()
