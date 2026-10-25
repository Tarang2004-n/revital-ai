# Contributing to RE:VITAL AI

Thank you for contributing to the RE:VITAL AI clinical decision-support ecosystem. We welcome pull requests spanning mathematical formulations, causal inference estimators, UI visualization, and performance optimizations.

---

## Codebase Architecture
```
revital-ai/
├── backend/
│   ├── schemas.py      # Consolidated Pydantic v2 data models & validation
│   ├── engine.py       # Continuous-Time GRU-D, Conformal Predictor, Causal Simulator
│   ├── main.py         # High-throughput FastAPI application
│   └── tests/          # Pytest suite with vectorized validation
├── frontend/
│   ├── src/
│   │   ├── app/        # Next.js 14 App Router (layout, page, styles)
│   │   ├── components/ # 3D Twin, Fork Explorer, Calibration Lab, Top Bar
│   │   └── lib/api.ts  # Typed API client with Next.js proxy integration
│   └── tailwind.config # Dark-mode clinical glassmorphism tokens
└── run.sh              # Single-command unified service orchestrator
```

---

## Development Workflow

### 1. Fork & Branch
```bash
git checkout -b feat/your-feature-name
```

### 2. Backend Setup & Testing
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt pytest
pytest tests/
```

### 3. Frontend Setup & Verification
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

---

## Coding Standards & Architectural Principles
1. **Mathematical Determinism**: Vectorized operations must use NumPy / SciPy / PyTorch tensor ops without unbounded training loops at runtime.
2. **Strict Typing**: All backend endpoints require Pydantic v2 schemas; all frontend components require strict TypeScript interfaces.
3. **No External Asset Bloat**: Procedural Three.js geometry is preferred over heavy static `.gltf` meshes to maintain instant zero-config rendering.
4. **Causal Validity**: Counterfactual simulations must always compute and report empirical positivity overlap scores $P(A=a \mid H_t)$.
