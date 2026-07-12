# ScholaSync - System Overview

ScholaSync is an intuitive, responsive, and data-driven School Class Management, Academics, Attendance, and Analytics Portal. It is engineered to bridge the gap between classroom operational activities (conducted by instructors) and administrative overview (conducted by school superintendents or principals).

The system addresses the critical educational need for accurate accountability, real-time sync, and robust data reporting by providing an interactive dual-role simulator. Within a single running instance, users can perform actions as a teacher marking attendance, and immediately witness the statistical ripple effects in the administrative dashboard.

---

## 1. Core Purpose

The primary mission of ScholaSync is to streamline student registration, class structures, daily roll-call registration, and historical analytics. It replaces error-prone paper registers and disconnected spreadsheets with a unified digital ecosystem.

ScholaSync serves two key user personas:
1. **Instructors (Teachers):** Who need a high-speed, touch-optimized mobile screen to mark daily attendance rosters.
2. **Administrators (Principals/Registrars):** Who require a dense desktop layout to manage student rosters, configure class parameters, audit attendance ledgers, and view visual analytics.

---

## 2. Key Objectives

- **Dual-Perspective Emulation:** Emulates a full mobile application workspace (on an iPad/tablet mockup) for teachers alongside a high-density desktop portal for admins.
- **Accurate Cohort Analytics:** Dynamically calculates school-wide capacities, teacher-to-student ratios, daily attendance rates, and gender distributions.
- **Immediate Sandbox Feedback:** Includes developer-focused quick controls to instantly toggle between user contexts, illustrating live system reactivity.
- **Strict Data Validation:** Enforces structural business rules (e.g., matching student assignments, unique roll IDs, room allocations, and submission uniqueness).

---

## 3. Technology Stack

ScholaSync is built as a highly structured, modern Single Page Application (SPA):

| Layer | Technology | Description |
|---|---|---|
| **Language** | **TypeScript (v5+)** | Type-safe development enforcing interfaces for `Student`, `Class`, `Teacher`, and `AttendanceRecord`. |
| **Framework** | **React (v18+)** | Functional component architecture with complex declarative states, custom hooks, and unified prop-drilling state management in `App.tsx`. |
| **Styling** | **Tailwind CSS** | Custom styling, fluid grid structures, card components, and uniform off-white slate-themed aesthetic layouts. |
| **Animations** | **Motion (motion/react)** | Staggered entrance transitions, layout sliding, modal popups, and smooth tab switching. |
| **Charts & Graphics** | **Recharts** | Interactive SVG-based charts (`LineChart`, `BarChart`, custom Progress gauges) providing responsive data rendering. |
| **Icons** | **Lucide React** | Consistent SVG stroke icons providing visual context to buttons, tabs, metrics, and sidebars. |
| **Build & Tooling** | **Vite** | Fast, HMR-supported bundler compiling down into static web-ready files. |

---

## 4. Current Deployment Details

- **Preview URL:** [https://ais-dev-npsp7d2gcyyz3ivb7s2tku-40831900900.asia-southeast1.run.app](https://ais-dev-npsp7d2gcyyz3ivb7s2tku-40831900900.asia-southeast1.run.app)
- **Local Port Configuration:** Runs on port `3000` via Vite and acts as a pure client-side application utilizing mock ledger states.
