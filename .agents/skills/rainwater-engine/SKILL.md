---
name: rainwater-engine
description: "Procedures and equations for calculating urban rainwater harvestable potential, storage sizing, non-potable demand allocation, and recharge suitability."
---

# Rainwater Engine Skill

## 1. Core Harvestable Volume Equation
For any catchment area (rooftop, paved plaza, or public open space):
$$\text{Harvestable Volume (Litres)} = \text{Rainfall (mm)} \times \text{Catchment Area } (\text{m}^2) \times C_{\text{runoff}} \times \eta_{\text{collection}}$$

Where:
- $1\text{ mm}$ of rain over $1\text{ m}^2 = 1\text{ Litre}$ ($0.001\text{ m}^3$).
- $C_{\text{runoff}}$ (Runoff Coefficient):
  - Concrete/RCC Rooftop: $0.85 - 0.90$
  - Metal / Sloped Sheet: $0.90 - 0.95$
  - Permeable Pavers: $0.30 - 0.45$
  - Urban Soil / Green Space: $0.15 - 0.25$
- $\eta_{\text{collection}}$ (First-Flush & Filter Efficiency):
  - Standard mesh/gravel filter: $0.80 - 0.85$ (discards initial dirty 1-2 mm).

## 2. Dynamic Tank Storage Balance
$$\text{Storage}_{t+1} = \min\left(C_{\text{tank}}, \max\left(0, \text{Storage}_t + Q_{\text{in}} - Q_{\text{reuse}} - Q_{\text{recharge}} - L_{\text{losses}}\right)\right)$$

$$\text{Overflow} = \max\left(0, \text{Storage}_t + Q_{\text{in}} - Q_{\text{reuse}} - Q_{\text{recharge}} - L_{\text{losses}} - C_{\text{tank}}\right)$$

## 3. Water Circularity Composite Score
$$\text{Circularity Score} = 0.30 \times S_{\text{capture}} + 0.25 \times S_{\text{reuse}} + 0.20 \times S_{\text{recharge}} + 0.25 \times S_{\text{relief}}$$
All sub-scores are normalized between $0$ and $100$.
