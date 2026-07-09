# Contribution Guide

Thank you for considering contributing to the Grading Management System! This guide will help you understand our workflow.

## Branching Strategy

We follow a feature-branch workflow:

- **`main`**: The stable production branch. Code here is always deployable.
- **`dev`**: The integration branch for new features.
- **Feature Branches**: Named as `feature/feature-name` or `bugfix/issue-description`.
    - Create these from `dev`.
    - Merge back into `dev` via Pull Request.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features.
- `fix:` for bug fixes.
- `docs:` for documentation changes.
- `style:` for formatting, missing semi colons, etc; no code change.
- `refactor:` for refactoring production code.
- `test:` for adding missing tests.
- `chore:` for updating build tasks, package manager configs, etc; no production code change.

Example: `feat(marks): add support for bulk assessment upload`

## Pull Request Process

1. **Self-Review**: Review your own code for obvious errors, formatting, and performance issues.
2. **Tests**: Ensure all tests pass (`run_tests.py`).
3. **Documentation**: Update relevant documentation if you change an API or introduce a new feature.
4. **Description**: Provide a clear description of the changes in the PR, including screenshots for UI changes.
5. **Approval**: At least one maintainer must approve the PR before it is merged into `dev`.

## Development Environment

We recommend using **VS Code** with the following extensions:
- Python (Microsoft)
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Kubernetes (Microsoft)

## Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected vs. Actual behavior.
- Screenshots if applicable.
- Environment details (OS, browser, etc.).
