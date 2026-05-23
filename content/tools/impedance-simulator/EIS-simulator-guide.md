---
title: Impedance Simulator — User Guide
---

(a manual to the [Impedance Simulator](https://alugovskoy.net/impedance-simulator/ "Impedance Simulator"))

## 1. Purpose

This simulator allows you to:

- build equivalent electrical circuits
- simulate impedance spectra
- visualize results as Nyquist and Bode plots

It is intended for learning and exploring electrochemical impedance spectroscopy (EIS).

---

## 2. Circuit syntax

Circuits are entered as a text expression.

### Basic rules

- – → series connection
- || → parallel connection
- parentheses () → grouping

Examples:

> R-(R||C)  
> R0-(R1||C1)-(R2||C2)  
> R-(Q||R)-W

##   
3. Elements

|Symbol|Meaning|
|---|---|
|R|Resistor|
|C|Capacitor|
|L|Inductor|
|Q|Constant Phase Element (CPE)|
|W|Warburg (diffusion)|
|G|Gerischer|

### Notes

- Elements can be indexed: R0, C1, Q2, etc.
- Each element gets its own parameters automatically.

## 4. Parameters

After entering a circuit:

- all parameters appear in the Parameters panel
- you can edit their values manually

### Important

Changes are applied when:

- you press Enter, or
- click Apply parameters

---

## 5. Presets

Use presets to explore typical cases:

- Two semicircles → two processes
- Depressed arc → distributed behavior
- Warburg tail → diffusion
- Capacitive limit → blocking electrode
- Inductive loop → inductive response

> Preset → Load preset

## 6. Plots

### Nyquist plot

- X-axis: real impedance Z′
- Y-axis: −Z″
- semicircles represent processes
- 45° line → diffusion

### Bode magnitude

- |Z| vs frequency (log scale)

### Bode phase

- shown as −Phase (deg)
- peaks point upward for capacitive behavior

---

## 7. Export

> Export PNG

This saves:

- all plots
- circuit
- parameter values

---

## 8. Tips

- To separate two processes → use very different time constants
- To merge them → make parameters similar
- If the graph looks strange → check parameter values
- Extremely large or small values may produce unrealistic results

---

## 9. Limitations

Current version:

- Warburg is infinite (no finite-length diffusion)
- No graphical circuit builder (text only)
- Parameters must be entered manually

---

## 10. Typical mistakes

- missing parentheses
- wrong use of ||
- invalid element names
- forgetting to apply parameters