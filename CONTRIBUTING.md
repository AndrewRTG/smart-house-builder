# Cum contribuim la Smart House Builder 🏠

Vă explic cum funcționează repo-ul nostru ca să nu avem bătăi de cap la predare.

## 📁 STRUCTURA BRANCH-URILOR

* 🔴 **main** — Codul care MERGE LA PRODUCȚIE. Doar cod testat ajunge aici. NIMENI nu pune cod direct aici.
* 🟡 **development** — Codul gata de testare. Când termini un feature, îl trimiți aici printr-un Pull Request.
* 🟢 **feature/nume-feature** — Aici lucrați voi. Ex: `feature/wizard-ui`, `feature/amazon-api`, `feature/compatibility-logic`.

## ✅ CE AVEȚI VOIE SĂ FACEȚI

* ✔️ Creați branch-uri noi exclusiv din `development`.
* ✔️ Push oricât vreți pe branch-ul vostru de feature.
* ✔️ Deschideți Pull Request din `feature/...` către `development` când ați terminat.

## ❌ CE NU AVEȚI VOIE SĂ FACEȚI

* ✖️ Push direct pe `main` sau `development`.
* ✖️ Să dați voi "Merge" la propriile Pull Request-uri.

## 👑 ROLUL SCRUM MASTER / PO

Doar Scrum Master-ul:
* Review-uiește și aprobă Pull Request-urile în `development`.
* Face release-urile (merge din `development` în `main`).
