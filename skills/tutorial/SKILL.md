---
name: nexus-tutorial
description: Use when creating high-quality executable Jupyter Notebook tutorials, AI engineering tutorials, or copy-paste-ready technical learning content.
---

# Tutorial Generation Protocol

## Phase 1: Environment & Dependency Blueprint

Every notebook must begin with a **Reproducibility Block**.

- **Venv Setup:** Provide exact shell commands to create and activate a local virtual environment (`python -m venv .venv`).
- **Dependency Management:** Create a `pip install` cell containing all necessary libraries, for example `langchain`, `openai`, `python-dotenv`.
- **Kernel Check:** Instructions to ensure the user is using the correct Jupyter kernel.
- **MakeFile Setup:** So that anyone can use one command to start Jupyter Lab. Also maintain Python version management.

## Phase 2: Production-Ready Configuration

- Avoid "script-style" variables. Use the **Twelve-Factor** App methodology.
- Handle all the cases which may occur in production and clearly mention them.
- **Schema Validation:** Use **Pydantic** for Settings classes to validate environment variables on startup.
- **Secret Management:** Implement secure loading with fallbacks and explicit error messages for missing keys.

## Phase 3: Structural Outline

Organize the notebook using clear Markdown hierarchies (H1 to H3).

- **Objective:** A brief "What you will build" section.
- **Prerequisites:** List API keys or hardware requirements, for example "Requires NVIDIA GPU" or "OpenAI API Key".
- **Architecture Diagram:** Use a Mermaid diagram to explain the flow of the AI Agent or system being taught.
- **Tone:** Make sure all these tutorials are pedagogically sound, visually structured for GitHub rendering, and technically flawless.

## Phase 4: Code Implementation (The "No-Assumption" Rule)

- **Working Code:** Every code block must be self-contained or reference previously defined variables.
- **Type Hinting:** Mandatory Python type hints for all function signatures.
- **Comment Density:** Use professional, concise comments to explain *why* a specific logic is used, not just *what* it does.
- **Modular Design:** Break complex agent logic into small, testable functions or classes.
- **Environment Variables:** Always use `python-dotenv` for sensitive keys. Never hardcode credentials.

## Phase 5: Explanatory Narrative

- **Between Cells:** Provide "The Why." Explain the underlying AI concepts, for example "Why we use a ReAct loop here".
- **Expected Output:** Describe what the user should see when they run a cell, especially for long-running LLM calls.
- **Troubleshooting Tips:** Include a "Common Errors" section for API rate limits or version mismatches.

## Phase 6: GitHub Optimization & Cleanup

- **Clear Outputs:** Ensure the notebook is saved with clean, representative outputs.
- **Markdown Linting:** Use tables and bold text for key terms to ensure readability on GitHub's notebook viewer.
- **Cleanup:** Add a final cell to close connections, delete temp files, or spin down local model instances if applicable.

## Implementation Standards

- **Language:** Python 3.10+
- **Style:** PEP 8 compliant code within cells.
- **Formatting:** Use `f-strings` for logging and clear print statements to track agent "thought" processes.
- **Visuals:** Trigger image generation prompts for complex architectural concepts to aid learner mental models.

## Initial Action

When a topic is provided, for example "Creating AI Agents":

1. Search for the latest stable API versions of the tools involved.
2. Draft the setup steps and the architecture diagram first.
3. Validate logic before presenting the final notebook cells.
