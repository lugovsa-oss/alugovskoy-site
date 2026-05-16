## Overview

This setup creates a workflow where:

text Obsidian Vault     ↓ Quartz     ↓ Local Static Website     ↓ (Optional) Public Website 

The main idea is:

- write notes in Obsidian
- keep them in Markdown
- use Quartz to render them as a static hypertext website
- preserve internal wiki-style links
- support formulas, images, bilingual content, and interconnected notes

This setup works especially well for:
- teaching materials
- technical notes
- glossaries
- interconnected concepts
- case studies
- scientific writing
- personal knowledge bases

---

# 1. Install Quartz on macOS

Official website:

https://quartz.jzhao.xyz/

---

## Step 1 — Install Homebrew

Check whether Homebrew already exists:

bash brew --version 

If not:

https://brew.sh/

---

## Step 2 — Install Node.js

Quartz requires Node.js.

bash brew install node 

Verify:

bash node -v npm -v 

---

## Step 3 — Create Quartz directory

Example:

bash mkdir ~/Quartz cd ~/Quartz 

---

## Step 4 — Clone Quartz

bash git clone https://github.com/jackyzha0/quartz.git cd quartz 

If Git/Xcode tools are missing:

bash xcode-select --install 

---

## Step 5 — Install dependencies

bash npm install 

---

## Step 6 — Run Quartz locally

bash npx quartz --build --serve 

Quartz usually starts at:

text http://localhost:8080 

---

# 2. Connect Quartz to Obsidian

## Recommended structure

Example vault layout:

text Obsidian/ ├── Publish/ ├── Templates/ ├── Private/ └── Research/ 

Quartz should only see the Publish/ directory.

---

## Create symbolic link

Stop Quartz first (Ctrl+C).

Go to Quartz:

bash cd ~/Quartz/quartz 

Remove default content directory:

bash rm -rf content 

Create Publish folder if needed:

bash mkdir -p ~/Documents/Obsidian/Publish 

Create symbolic link:

bash ln -s ~/Documents/Obsidian/Publish content 

Now:

text Quartz/content 

points to:

text ~/Documents/Obsidian/Publish 

---

## Verify symbolic link

bash ls -l content 

Expected result:

text content -> /Users/username/Documents/Obsidian/Publish 

---

# 3. Create First Page

Create:

text Publish/index.md 

Example:

markdown --- title: Home ---  # My Quartz Site  Hello from Obsidian. 

Restart Quartz:

bash npx quartz build --serve 

---

# 4. Internal Obsidian Links

Quartz supports wiki-style links.

Example:

markdown [[Structure of Matter]] 

Create:

text Publish/Structure of Matter.md 

Quartz automatically renders the connection.

---

# 5. Formulas

Quartz supports LaTeX formulas.

Inline:

markdown $\Delta G = \Delta H - T\Delta S$ 

Display:

markdown $$ \psi(x,t)=Ae^{i(kx-\omega t)} $$ 

Useful for:
- quantum mechanics
- thermodynamics
- spectroscopy
- crystallography
- electrochemistry

---

# 6. Images

Recommended structure:

text Publish/ 
├── images/ │
└── test.png 

Insert image using Obsidian syntax:

markdown ![[test.png]] 

Quartz renders this correctly.

---

# 7. Hebrew / RTL Support

Quartz handles UTF-8 correctly, but mixed RTL/LTR text may need CSS adjustments.

---

## Add custom CSS

Edit:

text ~/Quartz/quartz/quartz/styles/custom.scss 

Add:

scss .he {   direction: rtl;   text-align: right;   unicode-bidi: plaintext; }  .en {   direction: ltr;   text-align: left;   unicode-bidi: plaintext; }  .mixed {   unicode-bidi: plaintext; }  [dir="rtl"] {   direction: rtl;   text-align: right; }  [dir="ltr"] {   direction: ltr;   text-align: left; } 

Restart Quartz after editing.

---

## Hebrew block example

markdown <div class="he" dir="rtl">  # מבנה החומר  טקסט בעברית עם English terms ו־$\Delta G$ באמצע.  </div> 

---

## English block example

markdown <div class="en" dir="ltr">  # Structure of Matter  English text with Hebrew term: מבנה החומר.  </div> 

---

## Inline direction fixes

LTR inside Hebrew:

html <span dir="ltr">NaCl rock-salt structure</span> 

RTL inside English:

html <span dir="rtl">מבנה החומר</span> 

---

# 8. Obsidian Templates

Enable Templates plugin:

text Settings → Core Plugins → Templates 

---

## Templates directory

Example:

text Templates/ ├── he.md ├── en.md ├── ltr-span.md 

---

## Hebrew template

Templates/he.md

markdown <div class="he" dir="rtl">  $CURSOR$  </div> 

---

## English template

Templates/en.md

markdown <div class="en" dir="ltr">  $CURSOR$  </div> 

---

## Inline LTR template

Templates/ltr-span.md

html <span dir="ltr">$CURSOR$</span> 

---

## Insert template

In Obsidian:

text Cmd+P → Templates: Insert template 

---

# 9. Quartz Launch Variants

## Variant A — Manual terminal launch

Standard method:

bash npx quartz build --serve 

---

## Variant B — Shell alias

Edit:

bash nano ~/.zshrc 

Add:

bash alias quartz='cd ~/Quartz/quartz && npx quartz build --serve' 

Reload:

bash source ~/.zshrc 

Now launch using:

bash quartz 

---

## Variant C — Double-click launcher

Create:

text ~/Quartz/start-quartz.command 

Contents:

bash #!/bin/zsh cd ~/Quartz/quartz npx quartz build --serve 

Make executable:

bash chmod +x ~/Quartz/start-quartz.command 

Now Quartz can be started by double-clicking the file in Finder.

---

## Variant D — Background service

Possible but usually unnecessary:
- launchd
- pm2
- forever
- daemonized services

Not recommended initially.

---

# 10. Recommended Workflow

Typical daily workflow:

text 1. Launch Quartz 2. Open Obsidian 3. Edit notes 4. Quartz rebuilds automatically 5. Open localhost in browser 6. Stop Quartz at end of session 

Quartz automatically watches for changes while running.

---

# 11. Architectural Notes

Quartz is not:
- a CMS
- a traditional webserver
- a WYSIWYG editor

Quartz is:
- a static site generator
- a Markdown publishing pipeline
- a hypertext engine

This model works extremely well for:
- interconnected scientific concepts
- teaching materials
- bilingual knowledge bases
- research notes
- semantic note systems

---

# 12. Suggested Initial Structure

text Publish/ 
├── index.md 
├── Courses/
├── Concepts/
├── Case-Studies/ 
├── Glossary/
├── Images/
└── Drafts/ 

This structure scales well for:
- scientific teaching
- multilingual material
- interconnected notes
- future public deployment