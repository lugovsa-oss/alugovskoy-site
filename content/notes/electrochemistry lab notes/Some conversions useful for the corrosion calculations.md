When calculating corrosion rates of Mg alloys, we often need to perform a set of standard unit conversions. The final formulas appear in virtually every paper in the field, but the derivations are rarely shown. I find it useful to present them explicitly.

## 1. Conversion of corrosion current to corrosion rate
Starting from Faraday’s law:
m = (M / nF) · i · t
Since m = ρV and V = h · A (assuming uniform planar corrosion), the penetration depth is h = m / (ρA), and therefore:
h / t = M / (nF · A · ρ) · i
Substituting M = 24 g/mol, n = 2, ρ = 1.74 g/cm³, A = 1.0 cm², F = 96500 C/mol, and converting seconds to years and centimeters to millimeters:
Rate (mm/y) = 2.08 × 10⁴ · i (A)
The formula is specific to these parameters and should be recalculated if the specimen area, alloy density, or valence differ.

## 2. Corrosion rate from mass loss (P_w)
$P_w$ (mm/y) = Δm (g) / (ρ · A (cm²) · t (days)) · 365 · 10
With ρ = 1.74 g/cm³:
$P_w$ (mm/y) = 2.10 × 10³ · Δm (g) / (A (cm²) · t (days))**
This is a pure unit conversion (days → years, cm → mm). The density should be adjusted for the specific alloy composition.

## 3. Corrosion rate from gas evolution (P_H)
The corrosion reaction is assumed to follow:
Mg + H₂O → Mg(OH)₂ + H₂
The key assumption is the 1:1 molar ratio Mg : H₂; the exact stoichiometry of the other products is not critical. The alloy components other than Mg are assumed inert (or their contribution to gas evolution negligible). The gas is treated as ideal at SATP conditions (T = 298 K, p = 1 atm = 1.013 × 10⁵ Pa).
The number of moles of H₂ collected:
n(H₂) = pV / RT = (1.013 × 10⁵ Pa · V × 10⁻⁶ m³) / (8.314 J/mol·K · 298 K) = 4.09 × 10⁻⁵ · V (mL)
Mass of dissolved Mg:
m(Mg) = n(H₂) · 24 g/mol = 9.82 × 10⁻⁴ · V(H₂) (mL)
Substituting into the mass-loss formula:
$P_H$ (mm/y) = 2.06 · V(H₂) (mL) / (A (cm²) · t (days))